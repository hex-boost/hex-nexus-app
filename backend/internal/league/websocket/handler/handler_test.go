package handler

import (
	"encoding/json"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"testing"

	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
)

// MockLogger is a mock implementation of the logger
type MockLogger struct {
	mock.Mock
}

func (m *MockLogger) Info(msg string, fields ...zap.Field) {
	m.Called(msg, fields)
}

func (m *MockLogger) Error(msg string, fields ...zap.Field) {
	m.Called(msg, fields)
}

func (m *MockLogger) Debug(msg string, fields ...zap.Field) {
	m.Called(msg, fields)
}

// MockState is a mock implementation of the account state
type MockState struct {
	mock.Mock
}

func (m *MockState) Get() *types.PartialSummonerRented {
	args := m.Called()
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(*types.PartialSummonerRented)
}

func (m *MockState) Update(summonerRented *types.PartialSummonerRented) (*types.PartialSummonerRented, error) {
	m.Called(summonerRented)
}

type MockAccountsRepository struct {
	mock.Mock
}

func (m *MockAccountsRepository) GetAllRented() ([]types.SummonerRented, error) {
	args := m.Called()
	return args.Get(0).([]types.SummonerRented), args.Error(1)
}

type MockApp struct {
	mock.Mock
}

func (m *MockApp) EmitEvent(eventName string, data ...interface{}) {
	m.Called(eventName)
}
func TestWalletEventWithValidData(t *testing.T) {
	mockState := new(MockState)
	mockApp := new(MockApp)
	mockAccountClient := new(account.MockClient)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, nil)

	blueEssence := 1000
	currentAccount := &types.PartialSummonerRented{
		Currencies: &types.CurrenciesPointer{
			LolBlueEssence: new(int),
		},
	}
	*currentAccount.Currencies.LolBlueEssence = 500 // Different value to trigger update

	mockState.On("Get").Return(currentAccount)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.Currencies != nil && *s.Currencies.LolBlueEssence == blueEssence
	})).Return()

	// Create wallet data
	wallet := types.Wallet{LolBlueEssence: blueEssence}
	walletData, _ := json.Marshal(wallet)

	// Create event
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: walletData,
	}

	// Execute
	handler.WalletEvent(event)

	// Verify
	mockState.AssertExpectations(t)
}

func TestWalletEventWithUnchangedBlueEssence(t *testing.T) {
	mockState := new(MockState)
	testLogger := logger.New("test", &config.Config{})

	handler := &Handler{
		logger:       testLogger,
		accountState: mockState,
	}

	blueEssence := 1000
	currentAccount := &types.PartialSummonerRented{
		Currencies: &types.CurrenciesPointer{
			LolBlueEssence: &blueEssence, // Same value, no update needed
		},
	}

	mockState.On("Get").Return(currentAccount)
	// Update should not be called

	// Create wallet data
	wallet := types.Wallet{LolBlueEssence: blueEssence}
	walletData, _ := json.Marshal(wallet)

	// Create event
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: walletData,
	}

	// Execute
	handler.WalletEvent(event)

	// Verify
	mockState.AssertExpectations(t)
}

func TestWalletEventWithNilAccount(t *testing.T) {
	mockState := new(MockState)
	testLogger := logger.New("test", &config.Config{})

	handler := &Handler{
		logger:       testLogger,
		accountState: mockState,
	}

	mockState.On("Get").Return(nil)

	// Create wallet data
	wallet := types.Wallet{LolBlueEssence: 1000}
	walletData, _ := json.Marshal(wallet)

	// Create event
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: walletData,
	}

	// Execute
	handler.WalletEvent(event)

	// Verify
	mockState.AssertExpectations(t)
}

func TestWalletEventWithInvalidData(t *testing.T) {
	mockState := new(MockState)
	testLogger := logger.New("test", &config.Config{})

	handler := &Handler{
		logger:       testLogger,
		accountState: mockState,
	}

	// Create invalid JSON data
	invalidData := []byte(`{"invalid json`)

	// Create event
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: invalidData,
	}

	// Execute
	handler.WalletEvent(event)

	// No specific assertions needed as we're just checking it doesn't panic
}

func TestWalletEventWithNilCurrencies(t *testing.T) {
	mockState := new(MockState)
	testLogger := logger.New("test", &config.Config{})

	handler := &Handler{
		logger:       testLogger,
		accountState: mockState,
	}

	blueEssence := 1000
	currentAccount := &types.PartialSummonerRented{
		Currencies: nil, // No currencies
	}

	mockState.On("Get").Return(currentAccount)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.Currencies != nil && *s.Currencies.LolBlueEssence == blueEssence
	})).Return()

	// Create wallet data
	wallet := types.Wallet{LolBlueEssence: blueEssence}
	walletData, _ := json.Marshal(wallet)

	// Create event
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: walletData,
	}

	// Execute
	handler.WalletEvent(event)

	// Verify
	mockState.AssertExpectations(t)
}

func TestNewHandlerCreation(t *testing.T) {
	testLogger := logger.New("test", &config.Config{})
	mockState := &account.State{}

	handler := New(testLogger, mockState)

	assert.NotNil(t, handler)
	assert.Equal(t, testLogger, handler.logger)
	assert.Equal(t, mockState, handler.accountState)
}
