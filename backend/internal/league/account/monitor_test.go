package account

import (
	"errors"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/wailsapp/wails/v3/pkg/application"
	"sync"
	"testing"
	"time"
)

type MockRiotClient struct {
	mock.Mock
}
type MockLeagueService struct {
	mock.Mock
}

func (m *MockLeagueService) IsRunning() bool {
	args := m.Called()
	return args.Bool(0)
}

func (m *MockLeagueService) IsPlaying() bool {
	args := m.Called()
	return args.Bool(0)
}

// Fix MockLCUConnection to match LCUConnectionInterface
func (m *MockLCUConnection) Initialize() error {
	args := m.Called()
	return args.Error(0)
}

// Mock AccountService implementation
type MockAccountService struct {
	mock.Mock
}

func (m *MockRiotClient) IsRunning() bool {
	args := m.Called()
	return args.Bool(0)
}

func (m *MockRiotClient) IsClientInitialized() bool {
	args := m.Called()
	return args.Bool(0)
}

func (m *MockRiotClient) InitializeClient() error {
	args := m.Called()
	return args.Error(0)
}

func (m *MockRiotClient) GetAuthenticationState() (*types.RiotIdentityResponse, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*types.RiotIdentityResponse), args.Error(1)
}

func (m *MockRiotClient) GetUserinfo() (*types.UserInfo, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*types.UserInfo), args.Error(1)
}

type MockSummonerClient struct {
	mock.Mock
}

func (m *MockSummonerClient) GetLoginSession() (*types.LoginSession, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*types.LoginSession), args.Error(1)
}

type MockWatchdogUpdater struct {
	mock.Mock
}

func (m *MockWatchdogUpdater) Update(active bool) error {
	args := m.Called(active)
	return args.Error(0)
}

type MockLCUConnection struct {
	mock.Mock
}

func (m *MockLCUConnection) InitializeConnection() error {
	args := m.Called()
	return args.Error(0)
}

func (m *MockLCUConnection) IsClientInitialized() bool {
	args := m.Called()
	return args.Bool(0)
}

type MockAccountsRepository struct {
	mock.Mock
}

func (m *MockAccountsRepository) GetAllRented() ([]types.SummonerRented, error) {
	args := m.Called()
	return args.Get(0).([]types.SummonerRented), args.Error(1)
}

type MockWindow struct {
	mock.Mock
}

func (m *MockWindow) EmitEvent(eventName string, data ...interface{}) {
	m.Called(eventName, data[0])
}
func TestAccountMonitor_CheckCurrentAccount(t *testing.T) {
	// Setup environment and logger
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestAccountMonitor", cfg)

	// Store original watchdog function to restore later
	mockWatchdog := new(MockWatchdogUpdater)

	t.Run("No clients running - should skip check", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)
		mockSummoner := new(MockSummonerClient)
		mockLCU := new(MockLCUConnection)
		mockRepo := new(MockAccountsRepository)
		mockWindow := new(MockWindow)

		// Setup expected behavior
		mockRiot.On("IsRunning").Return(false)
		mockLeague.On("IsRunning").Return(false)
		mockLeague.On("IsPlaying").Return(false)

		am := &Monitor{
			watchdogState:  mockWatchdog,
			riotAuth:       mockRiot,
			leagueService:  mockLeague,
			summonerClient: mockSummoner,
			LCUConnection:  mockLCU,
			accountClient:  mockRepo,
			logger:         newLogger,
			window:         mockWindow,
			mutex:          sync.Mutex{},
		}

		// Execute function under test
		am.checkCurrentAccount()

		// Verify expectations
		mockRiot.AssertExpectations(t)
		mockLeague.AssertExpectations(t)
		// These should not be called
		mockRepo.AssertNotCalled(t, "GetAllRented")
		mockWindow.AssertNotCalled(t, "EmitEvent")
	})

	t.Run("No username found - should skip check", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)
		mockSummoner := new(MockSummonerClient)
		mockLCU := new(MockLCUConnection)
		mockRepo := new(MockAccountsRepository)
		mockWindow := new(MockWindow)

		// Setup expected behavior
		mockRiot.On("IsRunning").Return(true)
		mockRiot.On("IsClientInitialized").Return(true)
		mockRiot.On("GetAuthenticationState").Return(&types.RiotIdentityResponse{Type: "error"}, nil)

		am := &Monitor{
			watchdogState:  mockWatchdog,
			riotAuth:       mockRiot,
			leagueService:  mockLeague,
			summonerClient: mockSummoner,
			LCUConnection:  mockLCU,
			accountClient:  mockRepo,
			logger:         newLogger,
			window:         mockWindow,
			mutex:          sync.Mutex{},
		}

		// Execute function under test
		am.checkCurrentAccount()

		// Verify expectations
		mockRiot.AssertExpectations(t)
		mockRepo.AssertNotCalled(t, "GetAllRented")
	})

	t.Run("Error getting accounts from repository", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)
		mockSummoner := new(MockSummonerClient)
		mockLCU := new(MockLCUConnection)
		mockRepo := new(MockAccountsRepository)
		mockWindow := new(MockWindow)

		// Setup expected behavior
		mockRiot.On("IsRunning").Return(true)
		mockRiot.On("IsClientInitialized").Return(true)
		mockRiot.On("GetAuthenticationState").Return(&types.RiotIdentityResponse{Type: "success"}, nil)
		mockRiot.On("GetUserinfo").Return(&types.UserInfo{Username: "testuser"}, nil)
		mockRepo.On("GetAllRented").Return([]types.SummonerRented{}, errors.New("database error"))

		am := &Monitor{
			riotAuth:          mockRiot,
			leagueService:     mockLeague,
			summonerClient:    mockSummoner,
			LCUConnection:     mockLCU,
			accountClient:     mockRepo,
			logger:            newLogger,
			window:            mockWindow,
			mutex:             sync.Mutex{},
			lastAccountsFetch: time.Time{}, // Empty time to force cache refresh
			accountCacheTTL:   5 * time.Minute,
		}

		// Execute function under test
		am.checkCurrentAccount()

		// Verify expectations
		mockRiot.AssertExpectations(t)
		mockRepo.AssertExpectations(t)
		assert.False(t, am.IsNexusAccount())
	})

	t.Run("Account is not a Nexus account", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)
		mockSummoner := new(MockSummonerClient)
		mockLCU := new(MockLCUConnection)
		mockRepo := new(MockAccountsRepository)
		mockWindow := new(MockWindow)

		// Setup expected behavior
		mockRiot.On("IsRunning").Return(true)
		mockRiot.On("IsClientInitialized").Return(true)
		mockRiot.On("GetAuthenticationState").Return(&types.RiotIdentityResponse{Type: "success"}, nil)
		mockRiot.On("GetUserinfo").Return(&types.UserInfo{Username: "testuser"}, nil)
		mockRepo.On("GetAllRented").Return([]types.SummonerRented{
			{Username: "otheruser"},
			{Username: "anotheruser"},
		}, nil)

		am := &Monitor{
			watchdogState:     mockWatchdog,
			riotAuth:          mockRiot,
			leagueService:     mockLeague,
			summonerClient:    mockSummoner,
			LCUConnection:     mockLCU,
			accountClient:     mockRepo,
			logger:            newLogger,
			window:            mockWindow,
			mutex:             sync.Mutex{},
			lastAccountsFetch: time.Time{}, // Empty time to force cache refresh
			accountCacheTTL:   5 * time.Minute,
		}

		// Execute function under test
		am.checkCurrentAccount()

		// Verify expectations
		mockRiot.AssertExpectations(t)
		mockRepo.AssertExpectations(t)
		assert.False(t, am.IsNexusAccount())
	})

	t.Run("Account is a Nexus account - state change triggers event", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)
		mockSummoner := new(MockSummonerClient)
		mockLCU := new(MockLCUConnection)
		mockRepo := new(MockAccountsRepository)
		mockWindow := new(MockWindow)
		mockWatchdog := new(MockWatchdogUpdater) // Create a new mock for this test case

		// Setup expected behavior
		mockRiot.On("IsRunning").Return(true)
		mockRiot.On("IsClientInitialized").Return(true)
		mockRiot.On("GetAuthenticationState").Return(&types.RiotIdentityResponse{Type: "success"}, nil)
		mockRiot.On("GetUserinfo").Return(&types.UserInfo{Username: "testuser"}, nil)
		mockRepo.On("GetAllRented").Return([]types.SummonerRented{
			{Username: "otheruser"},
			{Username: "testuser"}, // Match!
			{Username: "anotheruser"},
		}, nil)
		mockWindow.On("EmitEvent", "nexusAccount:state", true).Return()
		// Add the missing expectation:
		mockWatchdog.On("Update", true).Return(nil)

		am := &Monitor{
			watchdogState:     mockWatchdog, // Use the local mock instance
			riotAuth:          mockRiot,
			leagueService:     mockLeague,
			summonerClient:    mockSummoner,
			LCUConnection:     mockLCU,
			accountClient:     mockRepo,
			logger:            newLogger,
			window:            mockWindow,
			mutex:             sync.Mutex{},
			isNexusAccount:    false,       // Starting with false to trigger state change
			lastAccountsFetch: time.Time{}, // Empty time to force cache refresh
			accountCacheTTL:   5 * time.Minute,
		}

		// Execute function under test
		am.checkCurrentAccount()

		// Verify expectations
		mockRiot.AssertExpectations(t)
		mockRepo.AssertExpectations(t)
		mockWindow.AssertExpectations(t)
		mockWatchdog.AssertExpectations(t) // Verify watchdog expectations too
		assert.True(t, am.IsNexusAccount())
	})

	t.Run("Use cached accounts when cache is fresh", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)
		mockSummoner := new(MockSummonerClient)
		mockLCU := new(MockLCUConnection)
		mockRepo := new(MockAccountsRepository)
		mockWindow := new(MockWindow)

		// Setup expected behavior
		mockRiot.On("IsRunning").Return(true)
		mockRiot.On("IsClientInitialized").Return(true)
		mockRiot.On("GetAuthenticationState").Return(&types.RiotIdentityResponse{Type: "success"}, nil)
		mockRiot.On("GetUserinfo").Return(&types.UserInfo{Username: "testuser"}, nil)
		// Repository should NOT be called because we use cache

		cachedAccounts := []types.SummonerRented{
			{Username: "testuser"}, // Match in cache
		}

		am := &Monitor{
			watchdogState:     mockWatchdog,
			riotAuth:          mockRiot,
			leagueService:     mockLeague,
			summonerClient:    mockSummoner,
			LCUConnection:     mockLCU,
			accountClient:     mockRepo,
			logger:            newLogger,
			window:            mockWindow,
			mutex:             sync.Mutex{},
			isNexusAccount:    true, // Already true, no state change
			cachedAccounts:    cachedAccounts,
			lastAccountsFetch: time.Now(), // Fresh cache
			accountCacheTTL:   5 * time.Minute,
		}

		// Execute function under test
		am.checkCurrentAccount()

		// Verify expectations
		mockRiot.AssertExpectations(t)
		mockWatchdog.AssertExpectations(t)
		mockRepo.AssertNotCalled(t, "GetAllRented") // Should use cache
		assert.True(t, am.IsNexusAccount())
	})

	t.Run("Reset cache when user is disconnected", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)
		mockSummoner := new(MockSummonerClient)
		mockLCU := new(MockLCUConnection)
		mockRepo := new(MockAccountsRepository)
		mockWindow := new(MockWindow)

		// Setup expected behavior - all clients are not running
		mockRiot.On("IsRunning").Return(false)
		mockLeague.On("IsRunning").Return(false)
		mockLeague.On("IsPlaying").Return(false)

		// Create some initial cached accounts
		initialCache := []types.SummonerRented{
			{Username: "cacheduser1"},
			{Username: "cacheduser2"},
		}

		// Set a past time for lastAccountsFetch
		pastTime := time.Now().Add(-1 * time.Hour)

		am := &Monitor{
			riotAuth:          mockRiot,
			leagueService:     mockLeague,
			summonerClient:    mockSummoner,
			LCUConnection:     mockLCU,
			accountClient:     mockRepo,
			logger:            newLogger,
			window:            mockWindow,
			mutex:             sync.Mutex{},
			cachedAccounts:    initialCache, // Set initial cache
			lastAccountsFetch: pastTime,     // Set initial fetch time
			accountCacheTTL:   5 * time.Minute,
		}

		// Execute function under test
		am.checkCurrentAccount()

		// Verify expectations
		mockRiot.AssertExpectations(t)
		mockLeague.AssertExpectations(t)

		// Verify cache was reset
		assert.Empty(t, am.cachedAccounts, "Cache should be empty when user disconnects")
		assert.NotEqual(t, pastTime, am.lastAccountsFetch, "Last fetch time should be updated when user disconnects")
	})
}
func TestMonitor_GetAccountsWithCache(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestGetAccountsWithCache", cfg)

	t.Run("Empty cache should fetch from repository", func(t *testing.T) {
		// Setup
		mockRepo := new(MockAccountsRepository)
		mockRepo.On("GetAllRented").Return([]types.SummonerRented{{Username: "user1"}}, nil)

		am := &Monitor{
			accountClient:     mockRepo,
			logger:            newLogger,
			cachedAccounts:    []types.SummonerRented{}, // Empty cache
			lastAccountsFetch: time.Time{},              // Zero time
			accountCacheTTL:   5 * time.Minute,
			mutex:             sync.Mutex{},
		}

		// Execute
		accounts, err := am.getAccountsWithCache()

		// Verify
		assert.NoError(t, err)
		assert.Len(t, accounts, 1)
		assert.Equal(t, "user1", accounts[0].Username)
		mockRepo.AssertExpectations(t)
		assert.False(t, am.lastAccountsFetch.IsZero()) // Should be updated
	})

	t.Run("Expired cache should fetch from repository", func(t *testing.T) {
		// Setup
		mockRepo := new(MockAccountsRepository)
		mockRepo.On("GetAllRented").Return([]types.SummonerRented{{Username: "user2"}}, nil)

		am := &Monitor{
			accountClient:     mockRepo,
			logger:            newLogger,
			cachedAccounts:    []types.SummonerRented{{Username: "old-user"}},
			lastAccountsFetch: time.Now().Add(-10 * time.Minute), // Older than TTL
			accountCacheTTL:   5 * time.Minute,
			mutex:             sync.Mutex{},
		}

		// Execute
		accounts, err := am.getAccountsWithCache()

		// Verify
		assert.NoError(t, err)
		assert.Len(t, accounts, 1)
		assert.Equal(t, "user2", accounts[0].Username)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Valid cache should not fetch from repository", func(t *testing.T) {
		// Setup
		mockRepo := new(MockAccountsRepository)
		// Repository should NOT be called

		cachedData := []types.SummonerRented{{Username: "cached-user"}}
		am := &Monitor{
			accountClient:     mockRepo,
			logger:            newLogger,
			cachedAccounts:    cachedData,
			lastAccountsFetch: time.Now().Add(-1 * time.Minute), // Recent fetch
			accountCacheTTL:   5 * time.Minute,
			mutex:             sync.Mutex{},
		}

		// Execute
		accounts, err := am.getAccountsWithCache()

		// Verify
		assert.NoError(t, err)
		assert.Len(t, accounts, 1)
		assert.Equal(t, "cached-user", accounts[0].Username)
		assert.Same(t, &cachedData[0], &accounts[0]) // Verify same slice reference
		mockRepo.AssertNotCalled(t, "GetAllRented")
	})

	t.Run("Repository error should be propagated", func(t *testing.T) {
		// Setup
		mockRepo := new(MockAccountsRepository)
		mockRepo.On("GetAllRented").Return([]types.SummonerRented{}, errors.New("repo error"))

		am := &Monitor{
			accountClient:     mockRepo,
			logger:            newLogger,
			cachedAccounts:    []types.SummonerRented{}, // Empty cache
			lastAccountsFetch: time.Time{},              // Zero time
			accountCacheTTL:   5 * time.Minute,
			mutex:             sync.Mutex{},
		}

		// Execute
		accounts, err := am.getAccountsWithCache()

		// Verify
		assert.Error(t, err)
		assert.Equal(t, "repo error", err.Error())
		assert.Empty(t, accounts)
		mockRepo.AssertExpectations(t)
		assert.Empty(t, am.cachedAccounts) // Cache should remain empty
	})
}

func TestMonitor_RefreshAccountCache(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestRefreshAccountCache", cfg)

	t.Run("Successful refresh", func(t *testing.T) {
		accounts := []types.SummonerRented{{Username: "fresh-user"}}
		mockRepo := new(MockAccountsRepository)
		mockRepo.On("GetAllRented").Return(accounts, nil)

		oldTime := time.Now().Add(-1 * time.Hour)
		am := &Monitor{
			accountClient:     mockRepo,
			logger:            newLogger,
			cachedAccounts:    []types.SummonerRented{{Username: "old-user"}},
			lastAccountsFetch: oldTime,
			mutex:             sync.Mutex{},
		}

		err := am.refreshAccountCache()

		assert.NoError(t, err)
		assert.Equal(t, accounts, am.cachedAccounts)
		assert.True(t, am.lastAccountsFetch.After(oldTime))
		mockRepo.AssertExpectations(t)
	})

	t.Run("Repository error", func(t *testing.T) {
		mockRepo := new(MockAccountsRepository)
		mockRepo.On("GetAllRented").Return([]types.SummonerRented{}, errors.New("repo error"))

		oldAccounts := []types.SummonerRented{{Username: "old-user"}}
		oldTime := time.Now().Add(-1 * time.Hour)

		am := &Monitor{
			accountClient:     mockRepo,
			logger:            newLogger,
			cachedAccounts:    oldAccounts,
			lastAccountsFetch: oldTime,
			mutex:             sync.Mutex{},
		}

		err := am.refreshAccountCache()

		assert.Error(t, err)
		assert.Equal(t, "repo error", err.Error())
		assert.Equal(t, oldAccounts, am.cachedAccounts) // Should not change on error
		assert.Equal(t, oldTime, am.lastAccountsFetch)  // Should not change on error
		mockRepo.AssertExpectations(t)
	})
}

func TestMonitor_GetSummonerNameByRiotClient(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestGetSummonerName", cfg)

	t.Run("Client not initialized - initialization fails", func(t *testing.T) {
		mockRiot := new(MockRiotClient)

		mockRiot.On("IsClientInitialized").Return(false)
		mockRiot.On("InitializeClient").Return(errors.New("initialization error"))

		am := &Monitor{
			riotAuth: mockRiot,
			logger:   newLogger,
		}

		username := am.getSummonerNameByRiotClient()
		assert.Equal(t, "", username)
		mockRiot.AssertExpectations(t)
	})

	t.Run("Client not initialized - initialization succeeds", func(t *testing.T) {
		mockRiot := new(MockRiotClient)

		mockRiot.On("IsClientInitialized").Return(false)
		mockRiot.On("InitializeClient").Return(nil)
		mockRiot.On("GetAuthenticationState").Return(&types.RiotIdentityResponse{Type: "success"}, nil)
		mockRiot.On("GetUserinfo").Return(&types.UserInfo{Username: "testuser"}, nil)

		am := &Monitor{
			riotAuth: mockRiot,
			logger:   newLogger,
		}

		username := am.getSummonerNameByRiotClient()
		assert.Equal(t, "testuser", username)
		mockRiot.AssertExpectations(t)
	})

	t.Run("GetAuthenticationState returns error", func(t *testing.T) {
		mockRiot := new(MockRiotClient)

		mockRiot.On("IsClientInitialized").Return(true)
		mockRiot.On("GetAuthenticationState").Return(nil, errors.New("auth error"))

		am := &Monitor{
			riotAuth: mockRiot,
			logger:   newLogger,
		}

		username := am.getSummonerNameByRiotClient()
		assert.Equal(t, "", username)
		mockRiot.AssertExpectations(t)
	})

	t.Run("Authentication not successful", func(t *testing.T) {
		mockRiot := new(MockRiotClient)

		mockRiot.On("IsClientInitialized").Return(true)
		mockRiot.On("GetAuthenticationState").Return(&types.RiotIdentityResponse{Type: "error"}, nil)

		am := &Monitor{
			riotAuth: mockRiot,
			logger:   newLogger,
		}

		username := am.getSummonerNameByRiotClient()
		assert.Equal(t, "", username)
		mockRiot.AssertExpectations(t)
	})

	t.Run("GetUserinfo returns error", func(t *testing.T) {
		mockRiot := new(MockRiotClient)

		mockRiot.On("IsClientInitialized").Return(true)
		mockRiot.On("GetAuthenticationState").Return(&types.RiotIdentityResponse{Type: "success"}, nil)
		mockRiot.On("GetUserinfo").Return(nil, errors.New("userinfo error"))

		am := &Monitor{
			riotAuth: mockRiot,
			logger:   newLogger,
		}

		username := am.getSummonerNameByRiotClient()
		assert.Equal(t, "", username)
		mockRiot.AssertExpectations(t)
	})

	t.Run("Success case", func(t *testing.T) {
		mockRiot := new(MockRiotClient)

		mockRiot.On("IsClientInitialized").Return(true)
		mockRiot.On("GetAuthenticationState").Return(&types.RiotIdentityResponse{Type: "success"}, nil)
		mockRiot.On("GetUserinfo").Return(&types.UserInfo{Username: "testuser"}, nil)

		am := &Monitor{
			riotAuth: mockRiot,
			logger:   newLogger,
		}

		username := am.getSummonerNameByRiotClient()
		assert.Equal(t, "testuser", username)
		mockRiot.AssertExpectations(t)
	})
}

func TestMonitor_GetUsernameByLeagueClient(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestGetUsernameByLeagueClient", cfg)

	t.Run("Client not initialized - initialization fails", func(t *testing.T) {
		mockLCU := new(MockLCUConnection)
		mockLCU.On("IsClientInitialized").Return(false)
		mockLCU.On("Initialize").Return(errors.New("initialization error"))

		am := &Monitor{
			LCUConnection: mockLCU,
			logger:        newLogger,
		}

		username, err := am.getUsernameByLeagueClient()
		assert.Equal(t, "", username)
		assert.Error(t, err)
		mockLCU.AssertExpectations(t)
	})

	t.Run("Client not initialized - initialization succeeds", func(t *testing.T) {
		mockLCU := new(MockLCUConnection)
		mockSummoner := new(MockSummonerClient)

		// Use .Once() to specify that this expectation should only match once
		mockLCU.On("IsClientInitialized").Return(false).Once()
		mockLCU.On("Initialize").Return(nil)
		// Second call should return true
		mockLCU.On("IsClientInitialized").Return(true).Once()
		mockSummoner.On("GetLoginSession").Return(&types.LoginSession{Username: "testuser"}, nil)

		am := &Monitor{
			LCUConnection:  mockLCU,
			summonerClient: mockSummoner,
			logger:         newLogger,
		}

		username, err := am.getUsernameByLeagueClient()
		assert.Equal(t, "testuser", username)
		assert.NoError(t, err)
		mockLCU.AssertExpectations(t)
		mockSummoner.AssertExpectations(t)
	})
	t.Run("GetLoginSession returns error", func(t *testing.T) {
		mockLCU := new(MockLCUConnection)
		mockSummoner := new(MockSummonerClient)

		mockLCU.On("IsClientInitialized").Return(true)
		mockSummoner.On("GetLoginSession").Return(nil, errors.New("login error"))

		am := &Monitor{
			LCUConnection:  mockLCU,
			summonerClient: mockSummoner,
			logger:         newLogger,
		}

		username, err := am.getUsernameByLeagueClient()
		assert.Equal(t, "", username)
		assert.Error(t, err)
		mockLCU.AssertExpectations(t)
		mockSummoner.AssertExpectations(t)
	})
}

func TestMonitor_GetLoggedInUsername(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestGetLoggedInUsername", cfg)

	t.Run("Riot client is running", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)

		mockRiot.On("IsRunning").Return(true)
		mockRiot.On("IsClientInitialized").Return(true)
		mockRiot.On("GetAuthenticationState").Return(&types.RiotIdentityResponse{Type: "success"}, nil)
		mockRiot.On("GetUserinfo").Return(&types.UserInfo{Username: "RiotUser"}, nil)

		am := &Monitor{
			riotAuth:      mockRiot,
			leagueService: mockLeague,
			logger:        newLogger,
		}

		username := am.GetLoggedInUsername()
		assert.Equal(t, "riotuser", username) // Should be lowercase
		mockRiot.AssertExpectations(t)
	})

	t.Run("League client is running", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)
		mockLCU := new(MockLCUConnection)
		mockSummoner := new(MockSummonerClient)

		mockRiot.On("IsRunning").Return(false)
		mockLeague.On("IsRunning").Return(true)
		mockLCU.On("IsClientInitialized").Return(true)
		mockSummoner.On("GetLoginSession").Return(&types.LoginSession{Username: "LeagueUser"}, nil)

		am := &Monitor{
			riotAuth:       mockRiot,
			leagueService:  mockLeague,
			LCUConnection:  mockLCU,
			summonerClient: mockSummoner,
			logger:         newLogger,
		}

		username := am.GetLoggedInUsername()
		assert.Equal(t, "leagueuser", username) // Should be lowercase
		mockRiot.AssertExpectations(t)
		mockLeague.AssertExpectations(t)
	})

	t.Run("User is playing", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)

		mockRiot.On("IsRunning").Return(false)
		mockLeague.On("IsRunning").Return(false)
		mockLeague.On("IsPlaying").Return(true)

		am := &Monitor{
			riotAuth:            mockRiot,
			leagueService:       mockLeague,
			logger:              newLogger,
			lastCheckedUsername: "LastUser",
		}

		username := am.GetLoggedInUsername()
		assert.Equal(t, "lastuser", username) // Should be lowercase
		mockRiot.AssertExpectations(t)
		mockLeague.AssertExpectations(t)
	})

	t.Run("No client is running", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)

		mockRiot.On("IsRunning").Return(false)
		mockLeague.On("IsRunning").Return(false)
		mockLeague.On("IsPlaying").Return(false)

		am := &Monitor{
			riotAuth:      mockRiot,
			leagueService: mockLeague,
			logger:        newLogger,
		}

		username := am.GetLoggedInUsername()
		assert.Equal(t, "", username)
		mockRiot.AssertExpectations(t)
		mockLeague.AssertExpectations(t)
	})
}

func TestMonitor_SetNexusAccount(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestSetNexusAccount", cfg)

	t.Run("State change from false to true", func(t *testing.T) {
		mockWindow := new(MockWindow)
		mockWatchdog := new(MockWatchdogUpdater)

		mockWindow.On("EmitEvent", "nexusAccount:state", true).Return()
		mockWatchdog.On("Update", true).Return(nil)

		am := &Monitor{
			window:        mockWindow,
			watchdogState: mockWatchdog,
			logger:        newLogger,
			mutex:         sync.Mutex{},
		}

		am.SetNexusAccount(true)

		assert.True(t, am.IsNexusAccount())
		mockWindow.AssertExpectations(t)
		mockWatchdog.AssertExpectations(t)
	})

	t.Run("No state change", func(t *testing.T) {
		mockWindow := new(MockWindow)
		mockWatchdog := new(MockWatchdogUpdater)

		am := &Monitor{
			window:         mockWindow,
			watchdogState:  mockWatchdog,
			logger:         newLogger,
			mutex:          sync.Mutex{},
			isNexusAccount: true,
		}

		am.SetNexusAccount(true)

		assert.True(t, am.IsNexusAccount())
		mockWindow.AssertNotCalled(t, "EmitEvent")
		mockWatchdog.AssertNotCalled(t, "Update")
	})

	t.Run("Watchdog update fails", func(t *testing.T) {
		mockWindow := new(MockWindow)
		mockWatchdog := new(MockWatchdogUpdater)

		mockWindow.On("EmitEvent", "nexusAccount:state", true).Return()
		mockWatchdog.On("Update", true).Return(errors.New("watchdog error"))

		am := &Monitor{
			window:        mockWindow,
			watchdogState: mockWatchdog,
			logger:        newLogger,
			mutex:         sync.Mutex{},
		}

		am.SetNexusAccount(true)

		assert.True(t, am.IsNexusAccount())
		mockWindow.AssertExpectations(t)
		mockWatchdog.AssertExpectations(t)
	})
}

func TestNewMonitor(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestNewMonitor", cfg)

	mockLeague := new(MockLeagueService)
	mockRiot := new(MockRiotClient)
	mockSummoner := new(MockSummonerClient)
	mockLCU := new(MockLCUConnection)
	mockWatchdog := new(MockWatchdogUpdater)
	mockAccountService := new(MockAccountService)

	monitor := NewMonitor(
		newLogger,
		mockLeague,
		mockRiot,
		mockAccountService,
		mockSummoner,
		mockLCU,
		mockWatchdog,
	)

	assert.NotNil(t, monitor)
	assert.Equal(t, mockLeague, monitor.leagueService)
	assert.Equal(t, mockRiot, monitor.riotAuth)
	assert.Equal(t, mockSummoner, monitor.summonerClient)
	assert.Equal(t, mockLCU, monitor.LCUConnection)
	assert.Equal(t, mockWatchdog, monitor.watchdogState)
	assert.Equal(t, mockAccountService, monitor.accountService)
	assert.Equal(t, newLogger, monitor.logger)
	assert.Equal(t, 1*time.Second, monitor.checkInterval)
	assert.NotNil(t, monitor.stopChan)
	assert.False(t, monitor.isNexusAccount)
}

// Note: Testing monitorLoop and Start/Stop would require more complex test setup
// because they involve goroutines and channels. Here's a basic approach:

func TestMonitor_StartStop(t *testing.T) {
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestStartStop", cfg)

	t.Run("Start sets running state", func(t *testing.T) {
		mockWindow := &application.WebviewWindow{}

		am := &Monitor{
			logger:        newLogger,
			running:       false,
			mutex:         sync.Mutex{},
			checkInterval: 1 * time.Second,
		}

		am.Start(mockWindow)

		am.mutex.Lock()
		assert.True(t, am.running)
		assert.NotNil(t, am.stopChan)
		am.mutex.Unlock()

		// Cleanup
		am.Stop()
	})

	t.Run("Stop clears running state", func(t *testing.T) {
		mockWindow := &application.WebviewWindow{}

		am := &Monitor{
			logger: newLogger,
			mutex:  sync.Mutex{},
		}

		// Start first
		am.Start(mockWindow)

		// Then stop
		am.Stop()

		am.mutex.Lock()
		assert.False(t, am.running)
		am.mutex.Unlock()
	})
}
