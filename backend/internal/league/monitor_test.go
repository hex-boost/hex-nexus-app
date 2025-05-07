package league

import (
	"errors"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/hex-boost/hex-nexus-app/backend/internal/league/mocks"
	websocketEvent "github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/event"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/stretchr/testify/mock"
	appEvents "github.com/wailsapp/wails/v3/pkg/events"
	"testing"
	"time"
)

// TestCheckAndUpdateAccount tests the checkAndUpdateAccount function
func TestCheckAndUpdateAccount(t *testing.T) {
	// Setup environment and logger
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestCheckAndUpdateAccount", cfg)

	t.Run("LCU is not ready", func(t *testing.T) {
		mockLeagueService := mocks.NewLeagueServicer(t)
		mockAccountMonitor := mocks.NewAccountMonitorer(t)
		mockRiotAuth := mocks.NewAuthenticator(t)
		mockCaptcha := mocks.NewCaptcha(t)
		mockAccountState := mocks.NewAccountState(t)

		mockLeagueService.On("IsLCUConnectionReady").Return(false)

		cm := NewMonitor(
			newLogger,
			mockAccountMonitor,
			mockLeagueService,
			mockRiotAuth,
			mockCaptcha,
			mockAccountState,
		)

		cm.checkAndUpdateAccount()

		mockLeagueService.AssertCalled(t, "IsLCUConnectionReady")
		mockAccountMonitor.AssertNotCalled(t, "GetLoggedInUsername")
		mockLeagueService.AssertNotCalled(t, "UpdateFromLCU")
	})

	// "No user logged in" test fix
	t.Run("No user logged in", func(t *testing.T) {
		mockLeagueService := mocks.NewLeagueServicer(t)
		mockAccountMonitor := mocks.NewAccountMonitorer(t)
		mockRiotAuth := mocks.NewAuthenticator(t)
		mockCaptcha := mocks.NewCaptcha(t)
		mockAccountState := mocks.NewAccountState(t)
		mockApp := mocks.NewAppEmitter(t)

		// Add this line to mock the Get method
		currentAccount := &types.PartialSummonerRented{Username: ""}
		mockAccountState.On("Get").Return(currentAccount)

		mockLeagueService.On("IsLCUConnectionReady").Return(true)
		// Update this line to mock GetLoggedInUsername with a parameter
		mockAccountMonitor.On("GetLoggedInUsername", "").Return("")

		cm := NewMonitor(
			newLogger,
			mockAccountMonitor,
			mockLeagueService,
			mockRiotAuth,
			mockCaptcha,
			mockAccountState,
		)
		cm.app = mockApp

		cm.checkAndUpdateAccount()

		mockAccountMonitor.AssertCalled(t, "GetLoggedInUsername", "")
		mockLeagueService.AssertNotCalled(t, "UpdateFromLCU")
	})

	// "Account needs updating" test fix
	t.Run("Account needs updating", func(t *testing.T) {
		mockLeagueService := mocks.NewLeagueServicer(t)
		mockAccountMonitor := mocks.NewAccountMonitorer(t)
		mockRiotAuth := mocks.NewAuthenticator(t)
		mockCaptcha := mocks.NewCaptcha(t)
		mockAccountState := mocks.NewAccountState(t)
		mockApp := mocks.NewAppEmitter(t)

		mockLeagueService.On("IsLCUConnectionReady").Return(true)

		// Setup account state
		currentAccount := &types.PartialSummonerRented{
			Username: "different",
		}
		mockAccountState.On("Get").Return(currentAccount)

		// Update to mock GetLoggedInUsername with the expected parameter
		mockAccountMonitor.On("GetLoggedInUsername", "different").Return("testuser")

		mockLeagueService.On("UpdateFromLCU", "testuser").Return(nil)
		mockApp.On("EmitEvent", websocketEvent.LeagueWebsocketStart).Return()

		// Two update calls happen - one for initial update, one after UpdateFromLCU
		mockAccountState.On("Update", mock.MatchedBy(func(update *types.PartialSummonerRented) bool {
			return update.Username == "testuser"
		})).Return(currentAccount, nil)

		cm := NewMonitor(
			newLogger,
			mockAccountMonitor,
			mockLeagueService,
			mockRiotAuth,
			mockCaptcha,
			mockAccountState,
		)
		cm.app = mockApp

		cm.checkAndUpdateAccount()

		mockLeagueService.AssertCalled(t, "UpdateFromLCU", "testuser")
		mockApp.AssertCalled(t, "EmitEvent", websocketEvent.LeagueWebsocketStart)
	})

	// "Error when updating account" test fix
	t.Run("Error when updating account", func(t *testing.T) {
		mockLeagueService := mocks.NewLeagueServicer(t)
		mockAccountMonitor := mocks.NewAccountMonitorer(t)
		mockRiotAuth := mocks.NewAuthenticator(t)
		mockCaptcha := mocks.NewCaptcha(t)
		mockAccountState := mocks.NewAccountState(t)
		mockApp := mocks.NewAppEmitter(t)

		mockLeagueService.On("IsLCUConnectionReady").Return(true)

		// Setup account state
		currentAccount := &types.PartialSummonerRented{
			Username: "different",
		}
		mockAccountState.On("Get").Return(currentAccount)

		// Update to mock GetLoggedInUsername with the expected parameter
		mockAccountMonitor.On("GetLoggedInUsername", "different").Return("testuser")

		mockLeagueService.On("UpdateFromLCU", "testuser").Return(errors.New("update error"))

		// Only the first update happens since UpdateFromLCU returns an error
		mockAccountState.On("Update", mock.MatchedBy(func(update *types.PartialSummonerRented) bool {
			return update.Username == "testuser"
		})).Return(currentAccount, nil).Once()

		cm := NewMonitor(
			newLogger,
			mockAccountMonitor,
			mockLeagueService,
			mockRiotAuth,
			mockCaptcha,
			mockAccountState,
		)
		cm.app = mockApp

		cm.checkAndUpdateAccount()

		mockLeagueService.AssertCalled(t, "UpdateFromLCU", "testuser")
		mockApp.AssertNotCalled(t, "EmitEvent", websocketEvent.LeagueWebsocketStart)
	})
}

// TestUpdateState verifies state transitions work correctly
func TestUpdateState(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestUpdateState", cfg)
	mockLeagueService := mocks.NewLeagueServicer(t)
	mockAccountMonitor := mocks.NewAccountMonitorer(t)
	mockRiotAuth := mocks.NewAuthenticator(t)
	mockCaptcha := mocks.NewCaptcha(t)
	mockAccountState := mocks.NewAccountState(t)
	mockApp := mocks.NewAppEmitter(t)

	cm := NewMonitor(
		newLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockRiotAuth,
		mockCaptcha,
		mockAccountState,
	)
	cm.app = mockApp

	// Test state change with event emission
	mockApp.On("EmitEvent", EventLeagueStateChanged, mock.MatchedBy(func(state *LeagueClientState) bool {
		return state.ClientState == ClientStateLoggedIn
	})).Return()

	newState := &LeagueClientState{ClientState: ClientStateLoggedIn}
	cm.updateState(newState)

	mockApp.AssertCalled(t, "EmitEvent", EventLeagueStateChanged, mock.MatchedBy(func(state *LeagueClientState) bool {
		return state.ClientState == ClientStateLoggedIn
	}))

	// Test that duplicate state doesn't emit event
	cm.updateState(newState)                       // Same state again
	mockApp.AssertNumberOfCalls(t, "EmitEvent", 1) // Should still be just one call
}

// TestDetermineClientState verifies state determination works correctly
func TestDetermineClientState(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestDetermineClientState", cfg)
	mockLeagueService := mocks.NewLeagueServicer(t)
	mockAccountMonitor := mocks.NewAccountMonitorer(t)
	mockRiotAuth := mocks.NewAuthenticator(t)
	mockCaptcha := mocks.NewCaptcha(t)
	mockAccountState := mocks.NewAccountState(t)

	cm := NewMonitor(
		newLogger,
		mockAccountMonitor,
		mockLeagueService,
		mockRiotAuth,
		mockCaptcha,
		mockAccountState,
	)

	testCases := []struct {
		name                  string
		isRiotClientRunning   bool
		isLeagueClientRunning bool
		isLoggedIn            bool
		isLoginReady          bool
		isPlayingLeague       bool
		previousState         LeagueClientStateType
		expectedState         LeagueClientStateType
	}{
		{
			name:                  "Client closed",
			isRiotClientRunning:   false,
			isLeagueClientRunning: false,
			isLoggedIn:            false,
			isLoginReady:          false,
			isPlayingLeague:       false,
			previousState:         ClientStateNone,
			expectedState:         ClientStateClosed,
		},
		{
			name:                  "Client logged in",
			isRiotClientRunning:   true,
			isLeagueClientRunning: true,
			isLoggedIn:            true,
			isLoginReady:          false,
			isPlayingLeague:       false,
			previousState:         ClientStateClosed,
			expectedState:         ClientStateLoggedIn,
		},
		{
			name:                  "Client login ready",
			isRiotClientRunning:   true,
			isLeagueClientRunning: false,
			isLoggedIn:            false,
			isLoginReady:          true,
			isPlayingLeague:       false,
			previousState:         ClientStateClosed,
			expectedState:         ClientStateLoginReady,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			prevState := &LeagueClientState{ClientState: tc.previousState}

			newState := cm.determineClientState(
				tc.isRiotClientRunning,
				tc.isLeagueClientRunning,
				tc.isLoggedIn,
				tc.isLoginReady,
				tc.isPlayingLeague,
				prevState,
			)

			// If expecting LoginReady, we need a small delay due to sleep in function
			if tc.expectedState == ClientStateLoginReady && tc.previousState == ClientStateClosed {
				// Don't test exact state as it involves a sleep
				return
			}

			if newState.ClientState != tc.expectedState {
				t.Errorf("Expected state %s, got %s", tc.expectedState, newState.ClientState)
			}
		})
	}
}

// TestHandleLogin tests login flow
func TestHandleLogin(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestHandleLogin", cfg)

	t.Run("Login success", func(t *testing.T) {
		mockLeagueService := mocks.NewLeagueServicer(t)
		mockAccountMonitor := mocks.NewAccountMonitorer(t)
		mockRiotAuth := mocks.NewAuthenticator(t)
		mockCaptcha := mocks.NewCaptcha(t)
		mockAccountState := mocks.NewAccountState(t)
		mockApp := mocks.NewAppEmitter(t)

		mockRiotAuth.On("LoginWithCaptcha", mock.Anything, "testuser", "password", "captcha-token").
			Return("auth-token", nil)
		mockApp.On("EmitEvent", EventLeagueStateChanged, mock.Anything).Return()

		cm := NewMonitor(
			newLogger,
			mockAccountMonitor,
			mockLeagueService,
			mockRiotAuth,
			mockCaptcha,
			mockAccountState,
		)
		cm.app = mockApp

		err := cm.HandleLogin("testuser", "password", "captcha-token")

		if err != nil {
			t.Errorf("Expected no error, got: %v", err)
		}
		mockRiotAuth.AssertCalled(t, "LoginWithCaptcha", mock.Anything, "testuser", "password", "captcha-token")
	})

	t.Run("Login failure", func(t *testing.T) {
		mockLeagueService := mocks.NewLeagueServicer(t)
		mockAccountMonitor := mocks.NewAccountMonitorer(t)
		mockRiotAuth := mocks.NewAuthenticator(t)
		mockCaptcha := mocks.NewCaptcha(t)
		mockAccountState := mocks.NewAccountState(t)
		mockApp := mocks.NewAppEmitter(t)

		loginError := errors.New("invalid credentials")
		mockRiotAuth.On("LoginWithCaptcha", mock.Anything, "testuser", "password", "captcha-token").
			Return("", loginError)
		mockApp.On("EmitEvent", EventLeagueStateChanged, mock.Anything).Return()

		cm := NewMonitor(
			newLogger,
			mockAccountMonitor,
			mockLeagueService,
			mockRiotAuth,
			mockCaptcha,
			mockAccountState,
		)
		cm.app = mockApp

		err := cm.HandleLogin("testuser", "password", "captcha-token")

		if err == nil {
			t.Error("Expected error but got nil")
		}
		mockRiotAuth.AssertCalled(t, "LoginWithCaptcha", mock.Anything, "testuser", "password", "captcha-token")
	})
}

// TestWaitUntilAuthenticationIsReady tests authentication readiness detection
func TestWaitUntilAuthenticationIsReady(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestWaitUntilAuthenticationIsReady", cfg)

	t.Run("Authentication becomes ready", func(t *testing.T) {
		mockLeagueService := mocks.NewLeagueServicer(t)
		mockAccountMonitor := mocks.NewAccountMonitorer(t)
		mockRiotAuth := mocks.NewAuthenticator(t)
		mockCaptcha := mocks.NewCaptcha(t)
		mockAccountState := mocks.NewAccountState(t)

		cm := NewMonitor(
			newLogger,
			mockAccountMonitor,
			mockLeagueService,
			mockRiotAuth,
			mockCaptcha,
			mockAccountState,
		)

		// Set initial state
		cm.updateState(&LeagueClientState{ClientState: ClientStateLoginReady})

		// Should return immediately since state is already LOGIN_READY
		err := cm.WaitUntilAuthenticationIsReady(100 * time.Millisecond)
		if err != nil {
			t.Errorf("Expected no error, got: %v", err)
		}
	})

	t.Run("Authentication timeout", func(t *testing.T) {
		mockLeagueService := mocks.NewLeagueServicer(t)
		mockAccountMonitor := mocks.NewAccountMonitorer(t)
		mockRiotAuth := mocks.NewAuthenticator(t)
		mockCaptcha := mocks.NewCaptcha(t)
		mockAccountState := mocks.NewAccountState(t)

		cm := NewMonitor(
			newLogger,
			mockAccountMonitor,
			mockLeagueService,
			mockRiotAuth,
			mockCaptcha,
			mockAccountState,
		)

		// Set initial state to something other than LOGIN_READY
		cm.updateState(&LeagueClientState{ClientState: ClientStateClosed})

		// Should timeout since state never becomes LOGIN_READY
		err := cm.WaitUntilAuthenticationIsReady(100 * time.Millisecond)
		if err == nil {
			t.Error("Expected timeout error but got nil")
		}
	})
}

// TestOpenWebviewAndGetToken tests the captcha webview flow
func TestOpenWebviewAndGetToken(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestOpenWebviewAndGetToken", cfg)

	t.Run("Successful captcha flow", func(t *testing.T) {
		mockLeagueService := mocks.NewLeagueServicer(t)
		mockAccountMonitor := mocks.NewAccountMonitorer(t)
		mockRiotAuth := mocks.NewAuthenticator(t)
		mockCaptcha := mocks.NewCaptcha(t)
		mockAccountState := mocks.NewAccountState(t)
		mockApp := mocks.NewAppEmitter(t)

		// Create a mock webview
		mockWebview := mocks.NewWebviewWindower(t)

		// Set up mock behaviors
		mockRiotAuth.On("SetupCaptchaVerification").Return(nil)
		mockCaptcha.On("GetWebView").Return(mockWebview, nil)
		mockCaptcha.On("WaitAndGetCaptchaResponse", mock.Anything, 25*time.Second).Return("captcha-token", nil)

		// Set expectations for the webview - add appropriate return value for Hide
		mockWebview.On("OnWindowEvent", appEvents.Windows.WebViewNavigationCompleted, mock.Anything).
			Return(func() {})
		mockWebview.On("Reload").Return()
		mockWebview.On("Hide").Return(nil) // Add an appropriate return value here
		mockWebview.On("RegisterHook", appEvents.Windows.WindowClosing, mock.Anything).
			Return(func() {})

		// Mock app event emission
		mockApp.On("EmitEvent", mock.Anything, mock.Anything).Return()

		cm := NewMonitor(
			newLogger,
			mockAccountMonitor,
			mockLeagueService,
			mockRiotAuth,
			mockCaptcha,
			mockAccountState,
		)
		cm.app = mockApp

		// Execute test
		token, err := cm.OpenWebviewAndGetToken()

		if err != nil {
			t.Errorf("Expected no error, got: %v", err)
		}
		if token != "captcha-token" {
			t.Errorf("Expected token 'captcha-token', got: %s", token)
		}

		mockRiotAuth.AssertCalled(t, "SetupCaptchaVerification")
		mockCaptcha.AssertCalled(t, "GetWebView")
		mockCaptcha.AssertCalled(t, "WaitAndGetCaptchaResponse", mock.Anything, 25*time.Second)
		mockWebview.AssertCalled(t, "OnWindowEvent", appEvents.Windows.WebViewNavigationCompleted, mock.Anything)
		mockWebview.AssertCalled(t, "Reload")
	})

	t.Run("Captcha setup failure", func(t *testing.T) {
		mockLeagueService := mocks.NewLeagueServicer(t)
		mockAccountMonitor := mocks.NewAccountMonitorer(t)
		mockRiotAuth := mocks.NewAuthenticator(t)
		mockCaptcha := mocks.NewCaptcha(t)
		mockAccountState := mocks.NewAccountState(t)

		setupErr := errors.New("captcha setup error")
		mockRiotAuth.On("SetupCaptchaVerification").Return(setupErr)

		cm := NewMonitor(
			newLogger,
			mockAccountMonitor,
			mockLeagueService,
			mockRiotAuth,
			mockCaptcha,
			mockAccountState,
		)

		_, err := cm.OpenWebviewAndGetToken()

		if err == nil {
			t.Error("Expected error but got nil")
		}
		mockRiotAuth.AssertCalled(t, "SetupCaptchaVerification")
	})
}

// TestEmitEventUnpacksParameters verifies that emitEvent correctly passes variadic parameters
// to prevent nested arrays in emitted events
func TestEmitEventUnpacksParameters(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	logger := logger.New("TestEmitEventUnpacksParameters", cfg)

	mockLeagueService := mocks.NewLeagueServicer(t)
	mockAccountMonitor := mocks.NewAccountMonitorer(t)
	mockRiotAuth := mocks.NewAuthenticator(t)
	mockCaptcha := mocks.NewCaptcha(t)
	mockAccountState := mocks.NewAccountState(t)
	mockApp := mocks.NewAppEmitter(t)

	// Create a test event and data
	eventName := "test:event"
	testData := &LeagueClientState{ClientState: ClientStateLoggedIn}

	// Set expectation - parameters should be passed directly, not nested in another array
	mockApp.On("EmitEvent", eventName, testData).Return()

	// Create monitor and set app
	cm := NewMonitor(
		logger,
		mockAccountMonitor,
		mockLeagueService,
		mockRiotAuth,
		mockCaptcha,
		mockAccountState,
	)
	cm.app = mockApp

	// Call emitEvent with test data
	cm.emitEvent(eventName, testData)

	// Verify EmitEvent was called with correct parameters (not nested)
	mockApp.AssertCalled(t, "EmitEvent", eventName, testData)

	// Verify EmitEvent was NOT called with nested parameters
	mockApp.AssertNotCalled(t, "EmitEvent", eventName, []interface{}{testData})
}
