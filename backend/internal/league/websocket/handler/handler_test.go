package handler

import (
	"encoding/json"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account/events"
	"testing"

	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/handler/mocks"

	"go.uber.org/zap/zaptest"

	"github.com/hex-boost/hex-nexus-app/backend/internal/config"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"

	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
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
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient)

	blueEssence := 1000
	currentAccount := &types.PartialSummonerRented{
		Currencies: &types.CurrenciesPointer{
			LolBlueEssence: new(int),
		},
	}
	*currentAccount.Currencies.LolBlueEssence = 500 // Different value to trigger update

	updatedAccount := &types.PartialSummonerRented{
		Currencies: &types.CurrenciesPointer{
			LolBlueEssence: &blueEssence,
		},
	}

	mockState.On("Get").Return(currentAccount)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.Currencies != nil && *s.Currencies.LolBlueEssence == blueEssence
	})).Return(updatedAccount, nil)

	// Mock the accountClient.Save call
	savedResponse := &types.SummonerResponse{}
	mockAccountClient.On("Save", mock.Anything).Return(savedResponse, nil)

	// Mock the app.EmitEvent call
	mockApp.On("EmitEvent", mock.Anything, mock.Anything).Return()

	// Create wallet data
	wallet := types.Wallet{LolBlueEssence: blueEssence}
	walletData, _ := json.Marshal(wallet)

	// Create event
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: walletData,
	}

	// Execute
	handler.Wallet(event)

	// Verify
	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}

func TestWalletEventWithUnchangedBlueEssence(t *testing.T) {
	mockState := new(mocks.AccountState)
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
	handler.Wallet(event)

	// Verify
	mockState.AssertExpectations(t)
}

func TestWalletEventWithNilAccount(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient)

	blueEssence := 1000
	updatedAccount := &types.PartialSummonerRented{
		Currencies: &types.CurrenciesPointer{
			LolBlueEssence: &blueEssence,
		},
	}

	mockState.On("Get").Return(nil)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.Currencies != nil && *s.Currencies.LolBlueEssence == blueEssence
	})).Return(updatedAccount, nil)

	// Mock the accountClient.Save call
	savedResponse := &types.SummonerResponse{}
	mockAccountClient.On("Save", mock.Anything).Return(savedResponse, nil)

	// Mock the app.EmitEvent call
	mockApp.On("EmitEvent", mock.Anything, mock.Anything).Return()

	// Create wallet data
	wallet := types.Wallet{LolBlueEssence: blueEssence}
	walletData, _ := json.Marshal(wallet)

	// Create event
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: walletData,
	}

	// Execute
	handler.Wallet(event)

	// Verify
	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}

func TestWalletEventWithInvalidData(t *testing.T) {
	mockState := new(mocks.AccountState)
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
	handler.Wallet(event)

	// No specific assertions needed as we're just checking it doesn't panic
}

func TestWalletEventWithNilCurrencies(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockLogger := zaptest.NewLogger(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	handler := New(mockLogger, mockApp, mockState, mockAccountClient)

	blueEssence := 1000
	currentAccount := &types.PartialSummonerRented{
		Currencies: nil, // No currencies
	}

	updatedAccount := &types.PartialSummonerRented{
		Currencies: &types.CurrenciesPointer{
			LolBlueEssence: &blueEssence,
		},
	}

	mockState.On("Get").Return(currentAccount)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.Currencies != nil && *s.Currencies.LolBlueEssence == blueEssence
	})).Return(updatedAccount, nil)

	// Mock the accountClient.Save call
	mockAccountClient.On("Save", mock.Anything).Return(&types.SummonerResponse{}, nil)

	// Mock the app.EmitEvent call
	mockApp.On("EmitEvent", mock.Anything, mock.Anything).Return()

	// Create wallet data
	wallet := types.Wallet{LolBlueEssence: blueEssence}
	walletData, _ := json.Marshal(wallet)

	// Create event
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: walletData,
	}

	// Execute
	handler.Wallet(event)

	// Verify
	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}

func TestNewHandlerCreation(t *testing.T) {
	testLogger := logger.New("test", &config.Config{})
	mockState := &account.State{}

	handler := New(testLogger, mocks.NewApp(t), mockState, mocks.NewAccountClient(t))

	assert.NotNil(t, handler)
	assert.Equal(t, testLogger, handler.logger)
	assert.Equal(t, mockState, handler.accountState)
}
func TestProcessAccountUpdateSuccess(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient)

	update := &types.PartialSummonerRented{
		Username: "testUser",
	}

	updatedAccount := &types.PartialSummonerRented{
		Username: "testUser",
	}
	thirty := 30
	updatedAccount.AccountLevel = &thirty

	savedResponse := &types.SummonerResponse{
		Username: "testUser",
	}

	mockState.On("Update", update).Return(updatedAccount, nil)
	mockAccountClient.On("Save", *updatedAccount).Return(savedResponse, nil)
	mockApp.On("EmitEvent", events.AccountStateChanged, savedResponse).Return()

	err := handler.ProcessAccountUpdate(update)

	assert.NoError(t, err)
	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}

func TestProcessAccountUpdateFailedUpdate(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient)

	update := &types.PartialSummonerRented{
		Username: "testUser",
	}

	mockState.On("Update", update).Return(nil, assert.AnError)
	// accountClient.Save should not be called

	err := handler.ProcessAccountUpdate(update)

	assert.Error(t, err)
	assert.Equal(t, assert.AnError, err)
	mockState.AssertExpectations(t)
	mockAccountClient.AssertNotCalled(t, "Save")
}

func TestProcessAccountUpdateFailedSave(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient)

	update := &types.PartialSummonerRented{
		Username: "testUser",
	}

	updatedAccount := &types.PartialSummonerRented{
		Username: "testUser",
	}
	thirty := 30
	updatedAccount.AccountLevel = &thirty

	mockState.On("Update", update).Return(updatedAccount, nil)
	mockAccountClient.On("Save", *updatedAccount).Return(nil, assert.AnError)
	// EmitEvent should not be called

	err := handler.ProcessAccountUpdate(update)

	assert.Error(t, err)
	assert.Equal(t, assert.AnError, err)
	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertNotCalled(t, "EmitEvent")
}

func TestChampionWithMoreChampions(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient)

	// Current account has 2 champions
	currentChampions := []int{1, 2}
	currentAccount := &types.PartialSummonerRented{
		LCUchampions: &currentChampions,
	}

	// New data has 3 champions
	championsData := []types.LolInventoryItem{
		{InventoryType: "CHAMPION", ItemId: 1, Owned: true},
		{InventoryType: "CHAMPION", ItemId: 2, Owned: true},
		{InventoryType: "CHAMPION", ItemId: 3, Owned: true},
		{InventoryType: "SKIN", ItemId: 4, Owned: true},
	}

	expectedChampionIds := []int{1, 2, 3}

	updatedAccount := &types.PartialSummonerRented{
		LCUchampions: &expectedChampionIds,
	}

	savedResponse := &types.SummonerResponse{}

	dataBytes, _ := json.Marshal(championsData)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-champions",
		Data: dataBytes,
	}

	mockState.On("Get").Return(currentAccount)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.LCUchampions != nil && len(*s.LCUchampions) == 3
	})).Return(updatedAccount, nil)
	mockAccountClient.On("Save", *updatedAccount).Return(savedResponse, nil)
	mockApp.On("EmitEvent", events.AccountStateChanged, savedResponse).Return()

	handler.Champion(event)

	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}

func TestChampionWithFewerChampions(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient)

	// Current account has 3 champions
	currentChampions := []int{1, 2, 3}
	currentAccount := &types.PartialSummonerRented{
		LCUchampions: &currentChampions,
	}

	// New data has 2 champions
	championsData := []types.LolInventoryItem{
		{InventoryType: "CHAMPION", ItemId: 1, Owned: true},
		{InventoryType: "CHAMPION", ItemId: 2, Owned: true},
	}

	dataBytes, _ := json.Marshal(championsData)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-champions",
		Data: dataBytes,
	}

	mockState.On("Get").Return(currentAccount)
	// Update should not be called

	handler.Champion(event)

	mockState.AssertExpectations(t)
	mockAccountClient.AssertNotCalled(t, "Save")
}

func TestChampionWithInvalidData(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient)

	invalidData := []byte(`{"invalid json`)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-champions",
		Data: invalidData,
	}

	handler.Champion(event)

	mockState.AssertNotCalled(t, "Get")
	mockState.AssertNotCalled(t, "Update")
	mockAccountClient.AssertNotCalled(t, "Save")
}

func TestChampionWithEmptyData(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient)

	emptyData := []types.LolInventoryItem{}
	dataBytes, _ := json.Marshal(emptyData)

	event := websocket.LCUWebSocketEvent{
		URI:  "lol-champions",
		Data: dataBytes,
	}

	handler.Champion(event)

	mockState.AssertNotCalled(t, "Get")
	mockState.AssertNotCalled(t, "Update")
	mockAccountClient.AssertNotCalled(t, "Save")
}

func TestChampionWithNonChampionInventoryType(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient)

	// Data has only skins, no champions
	skinsData := []types.LolInventoryItem{
		{InventoryType: "SKIN", ItemId: 1, Owned: true},
		{InventoryType: "SKIN", ItemId: 2, Owned: true},
	}

	dataBytes, _ := json.Marshal(skinsData)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-champions",
		Data: dataBytes,
	}

	handler.Champion(event)

	mockState.AssertNotCalled(t, "Get")
	mockState.AssertNotCalled(t, "Update")
	mockAccountClient.AssertNotCalled(t, "Save")
}

func TestChampionWithNilCurrentAccount(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient)

	// New data has 2 champions
	championsData := []types.LolInventoryItem{
		{InventoryType: "CHAMPION", ItemId: 1, Owned: true},
		{InventoryType: "CHAMPION", ItemId: 2, Owned: true},
	}

	expectedChampionIds := []int{1, 2}

	updatedAccount := &types.PartialSummonerRented{
		LCUchampions: &expectedChampionIds,
	}

	savedResponse := &types.SummonerResponse{}

	dataBytes, _ := json.Marshal(championsData)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-champions",
		Data: dataBytes,
	}

	mockState.On("Get").Return(nil)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.LCUchampions != nil && len(*s.LCUchampions) == 2
	})).Return(updatedAccount, nil)
	mockAccountClient.On("Save", *updatedAccount).Return(savedResponse, nil)
	mockApp.On("EmitEvent", events.AccountStateChanged, savedResponse).Return()

	handler.Champion(event)

	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}
