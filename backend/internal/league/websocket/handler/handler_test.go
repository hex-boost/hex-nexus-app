package handler

import (
	"encoding/json"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account/events"
	"testing"

	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/handler/mocks"

	"go.uber.org/zap/zaptest"

	"github.com/hex-boost/hex-nexus-app/backend/internal/config"

	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestWalletEventWithValidData(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)

	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
	mockSummonerClient := mocks.NewSummonerClient(t)
	handler := New(mockLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
	mockSummonerClient := mocks.NewSummonerClient(t)

	handler := New(testLogger, mocks.NewApp(t), mockState, mocks.NewAccountClient(t), mockSummonerClient)

	assert.NotNil(t, handler)
	assert.Equal(t, testLogger, handler.logger)
	assert.Equal(t, mockState, handler.accountState)
}
func TestProcessAccountUpdateSuccess(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

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
func TestGameflowPhaseNonEndGamePhase(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

	// Non-end game phase like "ChampSelect" or "InProgress"
	phase := "ChampSelect"
	phaseData, _ := json.Marshal(phase)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-gameflow-v1-gameflow-phase",
		Data: phaseData,
	}

	handler.GameflowPhase(event)

	// Since it's not an end game phase, summonerClient should not be called
	mockSummonerClient.AssertNotCalled(t, "GetRanking")
	mockState.AssertNotCalled(t, "Update")
}

func TestGameflowPhaseEndGameWithChangedRanking(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

	// End game phase
	phase := "EndOfGame"
	phaseData, _ := json.Marshal(phase)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-gameflow-v1-gameflow-phase",
		Data: phaseData,
	}

	// Current ranking in account state
	currentRanking := &types.RankedStatsRefresh{
		RankedSolo5x5: types.RankedDetails{
			Tier:         "GOLD",
			Division:     "II",
			LeaguePoints: 50,
		},
	}

	currentAccount := &types.PartialSummonerRented{
		Rankings: currentRanking,
	}

	// New ranking from API
	newRanking := &types.RankedStatsRefresh{
		RankedSolo5x5: types.RankedDetails{
			Tier:         "GOLD",
			Division:     "I", // Division changed
			LeaguePoints: 0,
		},
	}

	updatedAccount := &types.PartialSummonerRented{
		Rankings: newRanking,
	}

	savedResponse := &types.SummonerResponse{}

	mockSummonerClient.On("GetRanking").Return(newRanking, nil)
	mockState.On("Get").Return(currentAccount)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.Rankings == newRanking
	})).Return(updatedAccount, nil)
	mockAccountClient.On("Save", *updatedAccount).Return(savedResponse, nil)
	mockApp.On("EmitEvent", events.AccountStateChanged, savedResponse).Return()

	handler.GameflowPhase(event)

	mockSummonerClient.AssertExpectations(t)
	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}

func TestGameflowPhaseEndGameWithUnchangedRanking(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

	// End game phase - let's use another valid phase
	phase := "WaitingForStats"
	phaseData, _ := json.Marshal(phase)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-gameflow-v1-gameflow-phase",
		Data: phaseData,
	}

	// Ranking that will be the same in current account and in API response
	sameRanking := types.RankedDetails{
		Tier:                      "PLATINUM",
		Division:                  "IV",
		Rank:                      "IV",
		LeaguePoints:              25,
		Wins:                      10,
		Losses:                    5,
		IsProvisional:             false,
		ProvisionalGameThreshold:  0,
		ProvisionalGamesRemaining: 0,
	}

	currentRanking := &types.RankedStatsRefresh{
		RankedSolo5x5: sameRanking,
		RankedFlexSR:  sameRanking,
	}

	currentAccount := &types.PartialSummonerRented{
		Rankings: currentRanking,
	}

	// New ranking with same values
	newRanking := &types.RankedStatsRefresh{
		RankedSolo5x5: sameRanking,
		RankedFlexSR:  sameRanking,
	}

	mockSummonerClient.On("GetRanking").Return(newRanking, nil)
	mockState.On("Get").Return(currentAccount)
	// No update should be called since rankings are the same

	handler.GameflowPhase(event)

	mockSummonerClient.AssertExpectations(t)
	mockState.AssertExpectations(t)
	mockAccountClient.AssertNotCalled(t, "Save")
}

func TestGameflowPhaseWithInvalidData(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

	// Invalid JSON data
	invalidData := []byte(`{"invalid json`)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-gameflow-v1-gameflow-phase",
		Data: invalidData,
	}

	handler.GameflowPhase(event)

	mockSummonerClient.AssertNotCalled(t, "GetRanking")
	mockState.AssertNotCalled(t, "Get")
	mockState.AssertNotCalled(t, "Update")
}

func TestGameflowPhaseEndGameWithGetRankingError(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

	// End game phase
	phase := "PreEndOfGame"
	phaseData, _ := json.Marshal(phase)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-gameflow-v1-gameflow-phase",
		Data: phaseData,
	}

	mockSummonerClient.On("GetRanking").Return(nil, assert.AnError)
	// No further calls should happen

	handler.GameflowPhase(event)

	mockSummonerClient.AssertExpectations(t)
	mockState.AssertNotCalled(t, "Get")
	mockState.AssertNotCalled(t, "Update")
	mockAccountClient.AssertNotCalled(t, "Save")
}

func TestGameflowPhaseEndGameWithNilCurrentAccount(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockApp := mocks.NewApp(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockApp, mockState, mockAccountClient, mockSummonerClient)

	// End game phase
	phase := "EndOfGame"
	phaseData, _ := json.Marshal(phase)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-gameflow-v1-gameflow-phase",
		Data: phaseData,
	}

	// New ranking from API
	newRanking := &types.RankedStatsRefresh{
		RankedSolo5x5: types.RankedDetails{
			Tier:         "GOLD",
			Division:     "I",
			LeaguePoints: 0,
		},
	}

	updatedAccount := &types.PartialSummonerRented{
		Rankings: newRanking,
	}

	savedResponse := &types.SummonerResponse{}

	mockSummonerClient.On("GetRanking").Return(newRanking, nil)
	mockState.On("Get").Return(nil) // Return nil to simulate no current account
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.Rankings == newRanking
	})).Return(updatedAccount, nil)
	mockAccountClient.On("Save", *updatedAccount).Return(savedResponse, nil)
	mockApp.On("EmitEvent", events.AccountStateChanged, savedResponse).Return()

	handler.GameflowPhase(event)

	mockSummonerClient.AssertExpectations(t)
	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}
func TestIsRankingSame(t *testing.T) {
	// Base ranking for comparison
	baseRanking := types.RankedDetails{
		Tier:                      "GOLD",
		Division:                  "II",
		Rank:                      "II",
		LeaguePoints:              50,
		Wins:                      100,
		Losses:                    75,
		IsProvisional:             false,
		ProvisionalGameThreshold:  10,
		ProvisionalGamesRemaining: 0,
	}

	tests := []struct {
		name     string
		oldRank  types.RankedDetails
		newRank  types.RankedDetails
		expected bool
	}{
		{
			name:     "Same rankings",
			oldRank:  baseRanking,
			newRank:  baseRanking,
			expected: true,
		},
		{
			name:    "Different Tier",
			oldRank: baseRanking,
			newRank: types.RankedDetails{
				Tier:                      "PLATINUM", // Different
				Division:                  "II",
				Rank:                      "II",
				LeaguePoints:              50,
				Wins:                      100,
				Losses:                    75,
				IsProvisional:             false,
				ProvisionalGameThreshold:  10,
				ProvisionalGamesRemaining: 0,
			},
			expected: false,
		},
		{
			name:    "Different Division",
			oldRank: baseRanking,
			newRank: types.RankedDetails{
				Tier:                      "GOLD",
				Division:                  "I", // Different
				Rank:                      "II",
				LeaguePoints:              50,
				Wins:                      100,
				Losses:                    75,
				IsProvisional:             false,
				ProvisionalGameThreshold:  10,
				ProvisionalGamesRemaining: 0,
			},
			expected: false,
		},
		{
			name:    "Different Rank",
			oldRank: baseRanking,
			newRank: types.RankedDetails{
				Tier:                      "GOLD",
				Division:                  "II",
				Rank:                      "I", // Different
				LeaguePoints:              50,
				Wins:                      100,
				Losses:                    75,
				IsProvisional:             false,
				ProvisionalGameThreshold:  10,
				ProvisionalGamesRemaining: 0,
			},
			expected: false,
		},
		{
			name:    "Different LeaguePoints",
			oldRank: baseRanking,
			newRank: types.RankedDetails{
				Tier:                      "GOLD",
				Division:                  "II",
				Rank:                      "II",
				LeaguePoints:              75, // Different
				Wins:                      100,
				Losses:                    75,
				IsProvisional:             false,
				ProvisionalGameThreshold:  10,
				ProvisionalGamesRemaining: 0,
			},
			expected: false,
		},
		{
			name:    "Different Wins",
			oldRank: baseRanking,
			newRank: types.RankedDetails{
				Tier:                      "GOLD",
				Division:                  "II",
				Rank:                      "II",
				LeaguePoints:              50,
				Wins:                      110, // Different
				Losses:                    75,
				IsProvisional:             false,
				ProvisionalGameThreshold:  10,
				ProvisionalGamesRemaining: 0,
			},
			expected: false,
		},
		{
			name:    "Different Losses",
			oldRank: baseRanking,
			newRank: types.RankedDetails{
				Tier:                      "GOLD",
				Division:                  "II",
				Rank:                      "II",
				LeaguePoints:              50,
				Wins:                      100,
				Losses:                    80, // Different
				IsProvisional:             false,
				ProvisionalGameThreshold:  10,
				ProvisionalGamesRemaining: 0,
			},
			expected: false,
		},
		{
			name:    "Different IsProvisional",
			oldRank: baseRanking,
			newRank: types.RankedDetails{
				Tier:                      "GOLD",
				Division:                  "II",
				Rank:                      "II",
				LeaguePoints:              50,
				Wins:                      100,
				Losses:                    75,
				IsProvisional:             true, // Different
				ProvisionalGameThreshold:  10,
				ProvisionalGamesRemaining: 0,
			},
			expected: false,
		},
		{
			name:    "Different ProvisionalGameThreshold",
			oldRank: baseRanking,
			newRank: types.RankedDetails{
				Tier:                      "GOLD",
				Division:                  "II",
				Rank:                      "II",
				LeaguePoints:              50,
				Wins:                      100,
				Losses:                    75,
				IsProvisional:             false,
				ProvisionalGameThreshold:  5, // Different
				ProvisionalGamesRemaining: 0,
			},
			expected: false,
		},
		{
			name:    "Different ProvisionalGamesRemaining",
			oldRank: baseRanking,
			newRank: types.RankedDetails{
				Tier:                      "GOLD",
				Division:                  "II",
				Rank:                      "II",
				LeaguePoints:              50,
				Wins:                      100,
				Losses:                    75,
				IsProvisional:             false,
				ProvisionalGameThreshold:  10,
				ProvisionalGamesRemaining: 2, // Different
			},
			expected: false,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := IsRankingSame(test.oldRank, test.newRank)
			assert.Equal(t, test.expected, result)
		})
	}
}
