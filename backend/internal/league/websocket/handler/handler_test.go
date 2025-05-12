package handler

import (
	"encoding/json"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/account/events"
	"testing"

	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/handler/mocks"

	"github.com/hex-boost/hex-nexus-app/backend/internal/config"

	"github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestWalletEventWithValidData(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t) // Create mock App

	testLogger := logger.New("test", &config.Config{})
	// Pass mockApp to the constructor
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState)

	blueEssence := 1000
	currentAccount := &types.PartialSummonerRented{
		Currencies: &types.CurrenciesPointer{
			LolBlueEssence: new(int),
		},
	}
	*currentAccount.Currencies.LolBlueEssence = 500

	updatedAccount := &types.PartialSummonerRented{
		Currencies: &types.CurrenciesPointer{
			LolBlueEssence: &blueEssence,
		},
	}

	mockState.On("Get").Return(currentAccount)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.Currencies != nil && *s.Currencies.LolBlueEssence == blueEssence
	})).Return(updatedAccount, nil)

	savedResponse := &types.SummonerResponse{}
	mockAccountClient.On("Save", mock.Anything).Return(savedResponse, nil)

	// Fix: Use mock.AnythingOfType to match the actual argument type
	mockApp.On("EmitEvent", events.AccountStateChanged, mock.AnythingOfType("*types.SummonerResponse")).Return()

	wallet := types.Wallet{LolBlueEssence: blueEssence}
	walletData, _ := json.Marshal(wallet)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: walletData,
	}

	handler.Wallet(event)

	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t) // Verify mockApp calls
}
func TestWalletEventWithUnchangedBlueEssence(t *testing.T) {
	mockState := mocks.NewAccountState(t) // Changed from new(mocks.AccountState) to use constructor
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	// Pass mockApp to the constructor
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)
	// Original test initialized handler directly, now using New
	// handler := &Handler{
	// 	logger:       testLogger,
	// 	accountState: mockState,
	//  app: mockApp, // if initialized directly
	// }

	blueEssence := 1000
	currentAccount := &types.PartialSummonerRented{
		Currencies: &types.CurrenciesPointer{
			LolBlueEssence: &blueEssence,
		},
	}

	mockState.On("Get").Return(currentAccount)
	// Update and Save should not be called, so EmitEvent for AccountStateChanged should not be called.

	wallet := types.Wallet{LolBlueEssence: blueEssence}
	walletData, _ := json.Marshal(wallet)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: walletData,
	}

	handler.Wallet(event)

	mockState.AssertExpectations(t)
	mockAccountClient.AssertNotCalled(t, "Save", mock.Anything)
	mockApp.AssertNotCalled(t, "EmitEvent", events.AccountStateChanged, mock.Anything)
}

func TestWalletEventWithNilAccount(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

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

	savedResponse := &types.SummonerResponse{}
	mockAccountClient.On("Save", mock.Anything).Return(savedResponse, nil)
	mockApp.On("EmitEvent", events.AccountStateChanged, mock.AnythingOfType("*types.SummonerResponse")).Return()

	wallet := types.Wallet{LolBlueEssence: blueEssence}
	walletData, _ := json.Marshal(wallet)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: walletData,
	}

	handler.Wallet(event)

	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}

func TestWalletEventWithInvalidData(t *testing.T) {
	mockState := mocks.NewAccountState(t) // Changed from new(mocks.AccountState)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)
	// Original test initialized handler directly
	// handler := &Handler{
	// 	logger:       testLogger,
	// 	accountState: mockState,
	//  app: mockApp,
	// }

	invalidData := []byte(`{"invalid json`)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: invalidData,
	}

	handler.Wallet(event)

	mockState.AssertNotCalled(t, "Get") // As parsing fails early
	mockAccountClient.AssertNotCalled(t, "Save", mock.Anything)
	mockApp.AssertNotCalled(t, "EmitEvent", mock.Anything, mock.Anything)
}

func TestWalletEventWithNilCurrencies(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	mockLogger := logger.New("test", &config.Config{}) // Using consistent logger init
	// mockLogger := zaptest.NewLogger(t) // Original, ensure it implements logger.Loggerer

	handler := New(mockLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	blueEssence := 1000
	currentAccount := &types.PartialSummonerRented{
		Currencies: nil,
	}

	updatedAccount := &types.PartialSummonerRented{
		Currencies: &types.CurrenciesPointer{
			LolBlueEssence: &blueEssence,
		},
	}
	savedResponse := &types.SummonerResponse{}

	mockState.On("Get").Return(currentAccount)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.Currencies != nil && *s.Currencies.LolBlueEssence == blueEssence
	})).Return(updatedAccount, nil)
	mockAccountClient.On("Save", mock.Anything).Return(savedResponse, nil)
	mockApp.On("EmitEvent", events.AccountStateChanged, mock.AnythingOfType("*types.SummonerResponse")).Return()

	wallet := types.Wallet{LolBlueEssence: blueEssence}
	walletData, _ := json.Marshal(wallet)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-inventory_v1_wallet",
		Data: walletData,
	}

	handler.Wallet(event)

	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}

func TestNewHandlerCreation(t *testing.T) {
	testLogger := logger.New("test", &config.Config{})
	// If account.State is an interface, use mock. Otherwise, concrete is fine if not interacted with.
	var mockAccState AccountState = mocks.NewAccountState(t) // Using interface type
	// mockState := &account.State{} // Original, if account.State is a struct and not interface for the handler
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t) // Create mock App

	// Pass mockApp to constructor
	handler := New(testLogger, mockAccState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	assert.NotNil(t, handler)
	assert.Equal(t, testLogger, handler.logger)
	assert.Equal(t, mockAccState, handler.accountState)
	assert.Equal(t, mockApp, handler.app) // Assert that app is set
}

func TestProcessAccountUpdateSuccess(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	update := &types.PartialSummonerRented{Username: "testUser"}
	updatedAccount := &types.PartialSummonerRented{Username: "testUser"}
	thirty := 30
	updatedAccount.AccountLevel = &thirty
	savedResponse := &types.SummonerResponse{Username: "testUser"}

	mockState.On("Update", update).Return(updatedAccount, nil)
	mockAccountClient.On("Save", *updatedAccount).Return(savedResponse, nil)
	// Expect EmitEvent
	mockApp.On("EmitEvent", events.AccountStateChanged, mock.AnythingOfType("*types.SummonerResponse")).Return()

	err := handler.ProcessAccountUpdate(update)

	assert.NoError(t, err)
	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}

func TestProcessAccountUpdateFailedUpdate(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	update := &types.PartialSummonerRented{Username: "testUser"}

	mockState.On("Update", update).Return(nil, assert.AnError)
	// Save and EmitEvent should not be called

	err := handler.ProcessAccountUpdate(update)

	assert.Error(t, err)
	assert.Equal(t, assert.AnError, err)
	mockState.AssertExpectations(t)
	mockAccountClient.AssertNotCalled(t, "Save", mock.Anything)
	mockApp.AssertNotCalled(t, "EmitEvent", mock.Anything, mock.Anything)
}

func TestProcessAccountUpdateFailedSave(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	update := &types.PartialSummonerRented{Username: "testUser"}
	updatedAccount := &types.PartialSummonerRented{Username: "testUser"}
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
	mockApp.AssertNotCalled(t, "EmitEvent", mock.Anything, mock.Anything)
}

func TestChampionWithMoreChampions(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	currentChampions := []int{1, 2}
	currentAccount := &types.PartialSummonerRented{LCUchampions: &currentChampions}
	championsData := []types.LolInventoryItem{
		{InventoryType: "CHAMPION", ItemId: 1, Owned: true},
		{InventoryType: "CHAMPION", ItemId: 2, Owned: true},
		{InventoryType: "CHAMPION", ItemId: 3, Owned: true},
		{InventoryType: "SKIN", ItemId: 4, Owned: true},
	}
	expectedChampionIds := []int{1, 2, 3}
	updatedAccount := &types.PartialSummonerRented{LCUchampions: &expectedChampionIds}
	savedResponse := &types.SummonerResponse{}
	dataBytes, _ := json.Marshal(championsData)
	event := websocket.LCUWebSocketEvent{URI: "lol-champions", Data: dataBytes}

	mockState.On("Get").Return(currentAccount)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.LCUchampions != nil && len(*s.LCUchampions) == 3
	})).Return(updatedAccount, nil)
	mockAccountClient.On("Save", *updatedAccount).Return(savedResponse, nil)
	mockApp.On("EmitEvent", events.AccountStateChanged, mock.AnythingOfType("*types.SummonerResponse")).Return()

	handler.ChampionPurchase(event)

	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}
func TestChampionWithFewerChampions(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	// Current account has 3 champions
	currentChampions := []int{1, 2, 3}
	currentAccount := &types.PartialSummonerRented{
		LCUchampions: &currentChampions,
	}

	// New data from LCU has only 2 champions
	championsData := []types.LolInventoryItem{
		{InventoryType: "CHAMPION", ItemId: 1, Owned: true},
		{InventoryType: "CHAMPION", ItemId: 2, Owned: true},
		// Champion with ItemId 3 is missing
	}
	dataBytes, _ := json.Marshal(championsData)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-champions", // Assuming this is the correct URI for champion updates
		Data: dataBytes,
	}

	// Mock Get to return the current account state
	mockState.On("Get").Return(currentAccount)
	// Update, Save, and EmitEvent for AccountStateChanged should NOT be called
	// because the number of owned champions has not increased.

	handler.ChampionPurchase(event)

	// Verify expectations
	mockState.AssertExpectations(t) // Ensures Get was called
	// Verify that Update, Save, and EmitEvent (for AccountStateChanged) were not called
	mockState.AssertNotCalled(t, "Update", mock.Anything)
	mockAccountClient.AssertNotCalled(t, "Save", mock.Anything)
	mockApp.AssertNotCalled(t, "EmitEvent", events.AccountStateChanged, mock.Anything)
}

func TestChampionWithNilCurrentAccount(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	championsData := []types.LolInventoryItem{
		{InventoryType: "CHAMPION", ItemId: 1, Owned: true},
		{InventoryType: "CHAMPION", ItemId: 2, Owned: true},
	}
	expectedChampionIds := []int{1, 2}
	updatedAccount := &types.PartialSummonerRented{LCUchampions: &expectedChampionIds}
	savedResponse := &types.SummonerResponse{}
	dataBytes, _ := json.Marshal(championsData)
	event := websocket.LCUWebSocketEvent{URI: "lol-champions", Data: dataBytes}

	mockState.On("Get").Return(nil)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.LCUchampions != nil && len(*s.LCUchampions) == 2
	})).Return(updatedAccount, nil)
	mockAccountClient.On("Save", *updatedAccount).Return(savedResponse, nil)
	mockApp.On("EmitEvent", events.AccountStateChanged, mock.AnythingOfType("*types.SummonerResponse")).Return()

	handler.ChampionPurchase(event)

	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}

func TestGameflowPhaseNonEndGamePhase(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	phaseString := "ChampSelect"
	// This is the actual data type expected by EmitEvent in GameflowPhase
	var gameflowPhaseData = types.LolChallengesGameflowPhase(phaseString)
	phaseDataBytes, _ := json.Marshal(phaseString) // LCU sends a JSON string

	event := websocket.LCUWebSocketEvent{
		URI:        "lol-gameflow-v1-gameflow-phase",
		Data:       phaseDataBytes,
		EventTopic: "OnJsonApiEvent_lol-gameflow_v1_gameflow-phase", // Example topic
	}

	// Expect EmitEvent for the gameflow phase itself
	mockApp.On("EmitEvent", event.EventTopic, gameflowPhaseData).Return()

	handler.GameflowPhase(event)

	mockSummonerClient.AssertNotCalled(t, "GetRanking")
	mockState.AssertNotCalled(t, "Update") // Update for ranking not called
	mockApp.AssertExpectations(t)          // Verifies the gameflow phase event
	// Ensure AccountStateChanged was not emitted
	// AssertNumberOfCalls can be more specific if other events might be emitted by mockApp in other contexts
	// For this test, we can check it wasn't called with AccountStateChanged
	// This is implicitly covered if AssertExpectations only has the one On("EmitEvent", event.EventTopic, ...)
}

func TestChampionWithInvalidData(t *testing.T) {
	mockState := mocks.NewAccountState(t)

	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	invalidData := []byte(`{"invalid json`)
	event := websocket.LCUWebSocketEvent{
		URI:  "lol-champions",
		Data: invalidData,
	}

	handler.ChampionPurchase(event)

	mockState.AssertNotCalled(t, "Get")
	mockState.AssertNotCalled(t, "Update")
	mockAccountClient.AssertNotCalled(t, "Save")
}

func TestChampionWithEmptyData(t *testing.T) {
	mockState := mocks.NewAccountState(t)

	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	emptyData := []types.LolInventoryItem{}
	dataBytes, _ := json.Marshal(emptyData)

	event := websocket.LCUWebSocketEvent{
		URI:  "lol-champions",
		Data: dataBytes,
	}

	handler.ChampionPurchase(event)

	mockState.AssertNotCalled(t, "Get")
	mockState.AssertNotCalled(t, "Update")
	mockAccountClient.AssertNotCalled(t, "Save")
}

func TestChampionWithNonChampionInventoryType(t *testing.T) {
	mockState := mocks.NewAccountState(t)

	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

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

	handler.ChampionPurchase(event)

	mockState.AssertNotCalled(t, "Get")
	mockState.AssertNotCalled(t, "Update")
	mockAccountClient.AssertNotCalled(t, "Save")
}

func TestGameflowPhaseEndGameWithChangedRanking(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	phaseString := "EndOfGame"
	var gameflowPhaseData = types.LolChallengesGameflowPhase(phaseString)
	phaseDataBytes, _ := json.Marshal(phaseString)
	eventTopic := "OnJsonApiEvent_lol-gameflow_v1_gameflow-phase"
	event := websocket.LCUWebSocketEvent{
		URI:        "lol-gameflow-v1-gameflow-phase",
		Data:       phaseDataBytes,
		EventTopic: eventTopic,
	}

	currentRanking := &types.RankedStatsRefresh{RankedSolo5x5: types.RankedDetails{Tier: "GOLD", Division: "II", LeaguePoints: 50}}
	currentAccount := &types.PartialSummonerRented{Rankings: currentRanking}
	newRanking := &types.RankedStatsRefresh{RankedSolo5x5: types.RankedDetails{Tier: "GOLD", Division: "I", LeaguePoints: 0}}
	updatedAccount := &types.PartialSummonerRented{Rankings: newRanking}
	savedResponse := &types.SummonerResponse{}

	// 1. EmitEvent for gameflow phase
	mockApp.On("EmitEvent", eventTopic, gameflowPhaseData).Return()
	// 2. EmitEvent for account state changed (due to ranking update)
	mockApp.On("EmitEvent", events.AccountStateChanged, savedResponse).Return()

	mockSummonerClient.On("GetRanking").Return(newRanking, nil)
	mockState.On("Get").Return(currentAccount)
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.Rankings == newRanking
	})).Return(updatedAccount, nil)
	mockAccountClient.On("Save", *updatedAccount).Return(savedResponse, nil)

	handler.GameflowPhase(event)

	mockSummonerClient.AssertExpectations(t)
	mockState.AssertExpectations(t)
	mockAccountClient.AssertExpectations(t)
	mockApp.AssertExpectations(t)
}
func TestGameflowPhaseEndGameWithUnchangedRanking(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	phaseString := "WaitingForStats"
	var gameflowPhaseData = types.LolChallengesGameflowPhase(phaseString)
	phaseDataBytes, _ := json.Marshal(phaseString)
	eventTopic := "OnJsonApiEvent_lol-gameflow_v1_gameflow-phase"
	event := websocket.LCUWebSocketEvent{
		URI:        "lol-gameflow-v1-gameflow-phase",
		Data:       phaseDataBytes,
		EventTopic: eventTopic,
	}

	sameRankingDetails := types.RankedDetails{Tier: "PLATINUM", Division: "IV", Rank: "IV", LeaguePoints: 25, Wins: 10, Losses: 5}
	currentRanking := &types.RankedStatsRefresh{RankedSolo5x5: sameRankingDetails, RankedFlexSR: sameRankingDetails}
	currentAccount := &types.PartialSummonerRented{Rankings: currentRanking}
	newRanking := &types.RankedStatsRefresh{RankedSolo5x5: sameRankingDetails, RankedFlexSR: sameRankingDetails} // Same values

	// Expect EmitEvent for the gameflow phase itself
	mockApp.On("EmitEvent", eventTopic, gameflowPhaseData).Return()
	// AccountStateChanged should NOT be emitted

	mockSummonerClient.On("GetRanking").Return(newRanking, nil)
	mockState.On("Get").Return(currentAccount)

	handler.GameflowPhase(event)

	mockSummonerClient.AssertExpectations(t)
	mockState.AssertExpectations(t) // Get is called
	mockAccountClient.AssertNotCalled(t, "Save", mock.Anything)
	mockApp.AssertExpectations(t) // Verifies the gameflow phase event
	// To be very sure AccountStateChanged was not called:
	mockApp.AssertCalled(t, "EmitEvent", eventTopic, gameflowPhaseData)
	mockApp.AssertNotCalled(t, "EmitEvent", events.AccountStateChanged, mock.Anything)
}

func TestGameflowPhaseWithInvalidData(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	invalidData := []byte(`{"invalid json`)
	event := websocket.LCUWebSocketEvent{
		URI:        "lol-gameflow-v1-gameflow-phase",
		Data:       invalidData,
		EventTopic: "OnJsonApiEvent_lol-gameflow_v1_gameflow-phase",
	}

	handler.GameflowPhase(event) // Parsing fails early

	mockSummonerClient.AssertNotCalled(t, "GetRanking")
	mockState.AssertNotCalled(t, "Get")
	mockState.AssertNotCalled(t, "Update")
	mockApp.AssertNotCalled(t, "EmitEvent", mock.Anything, mock.Anything) // No event should be emitted
}
func TestGameflowPhaseEndGameWithGetRankingError(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	phaseString := "PreEndOfGame"
	var gameflowPhaseData = types.LolChallengesGameflowPhase(phaseString)
	phaseDataBytes, _ := json.Marshal(phaseString)
	eventTopic := "OnJsonApiEvent_lol-gameflow_v1_gameflow-phase"
	event := websocket.LCUWebSocketEvent{
		URI:        "lol-gameflow-v1-gameflow-phase",
		Data:       phaseDataBytes,
		EventTopic: eventTopic,
	}

	// The first EmitEvent for the phase itself WILL be called
	mockApp.On("EmitEvent", eventTopic, gameflowPhaseData).Return()
	mockSummonerClient.On("GetRanking").Return(nil, assert.AnError)

	handler.GameflowPhase(event)

	mockSummonerClient.AssertExpectations(t)
	mockState.AssertNotCalled(t, "Get")
	mockState.AssertNotCalled(t, "Update")
	mockAccountClient.AssertNotCalled(t, "Save")
	mockApp.AssertExpectations(t) // Verifies the gameflow phase event was called
	// And AccountStateChanged was not (as it's not in expectations)
}

func TestGameflowPhaseEndGameWithNilCurrentAccount(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)

	testLogger := logger.New("test", &config.Config{})
	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	phaseString := "EndOfGame"
	var gameflowPhaseData = types.LolChallengesGameflowPhase(phaseString)
	phaseDataBytes, _ := json.Marshal(phaseString)
	eventTopic := "OnJsonApiEvent_lol-gameflow_v1_gameflow-phase"
	event := websocket.LCUWebSocketEvent{
		URI:        "lol-gameflow-v1-gameflow-phase",
		Data:       phaseDataBytes,
		EventTopic: eventTopic,
	}

	newRanking := &types.RankedStatsRefresh{RankedSolo5x5: types.RankedDetails{Tier: "GOLD", Division: "I", LeaguePoints: 0}}
	updatedAccount := &types.PartialSummonerRented{Rankings: newRanking}
	savedResponse := &types.SummonerResponse{}

	// 1. EmitEvent for gameflow phase
	mockApp.On("EmitEvent", eventTopic, gameflowPhaseData).Return()
	// 2. EmitEvent for account state changed
	mockApp.On("EmitEvent", events.AccountStateChanged, savedResponse).Return()

	mockSummonerClient.On("GetRanking").Return(newRanking, nil)
	mockState.On("Get").Return(nil) // Current account is nil
	mockState.On("Update", mock.MatchedBy(func(s *types.PartialSummonerRented) bool {
		return s.Rankings == newRanking
	})).Return(updatedAccount, nil)
	mockAccountClient.On("Save", *updatedAccount).Return(savedResponse, nil)

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
func TestReemitEventCorrectly(t *testing.T) {
	mockState := mocks.NewAccountState(t)
	mockAccountClient := mocks.NewAccountClient(t)
	mockSummonerClient := mocks.NewSummonerClient(t)
	mockLolSkinState := mocks.NewLolSkinState(t)
	mockLolSkin := mocks.NewLolSkin(t)
	mockApp := mocks.NewApp(t)
	testLogger := logger.New("test", &config.Config{})

	handler := New(testLogger, mockState, mockAccountClient, mockSummonerClient, mockLolSkin, mockLolSkinState, mockApp)

	eventData := []byte(`{"key":"value"}`)
	event := websocket.LCUWebSocketEvent{
		URI:        "/some/uri",
		Data:       eventData,
		EventTopic: "CustomEventTopicForReemit",
	}

	// Expect EmitEvent to be called with the event's topic and data
	// Note: event.Data is []byte, so it's passed as []interface{}{[]byte{...}}
	mockApp.On("EmitEvent", event.EventTopic, event.Data).Return()

	handler.ReemitEvent(event)

	mockApp.AssertExpectations(t)
}
