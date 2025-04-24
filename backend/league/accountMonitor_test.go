package league

import (
	"errors"
	"github.com/hex-boost/hex-nexus-app/backend/config"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"sync"
	"testing"
	"time"
)

type MockRiotClient struct {
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

func (m *MockRiotClient) InitializeRestyClient() error {
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
	logger := utils.NewLogger("TestAccountMonitor", cfg)

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

		am := &AccountMonitor{
			watchdogState: mockWatchdog,
			riotClient:    mockRiot,
			leagueService: mockLeague,
			summoner:      mockSummoner,
			LCUConnection: mockLCU,
			accountRepo:   mockRepo,
			logger:        logger,
			window:        mockWindow,
			mutex:         sync.Mutex{},
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

		am := &AccountMonitor{
			watchdogState: mockWatchdog,
			riotClient:    mockRiot,
			leagueService: mockLeague,
			summoner:      mockSummoner,
			LCUConnection: mockLCU,
			accountRepo:   mockRepo,
			logger:        logger,
			window:        mockWindow,
			mutex:         sync.Mutex{},
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

		am := &AccountMonitor{
			riotClient:        mockRiot,
			leagueService:     mockLeague,
			summoner:          mockSummoner,
			LCUConnection:     mockLCU,
			accountRepo:       mockRepo,
			logger:            logger,
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

		am := &AccountMonitor{
			watchdogState:     mockWatchdog,
			riotClient:        mockRiot,
			leagueService:     mockLeague,
			summoner:          mockSummoner,
			LCUConnection:     mockLCU,
			accountRepo:       mockRepo,
			logger:            logger,
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

		am := &AccountMonitor{
			watchdogState:     mockWatchdog, // Use the local mock instance
			riotClient:        mockRiot,
			leagueService:     mockLeague,
			summoner:          mockSummoner,
			LCUConnection:     mockLCU,
			accountRepo:       mockRepo,
			logger:            logger,
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

		am := &AccountMonitor{
			watchdogState:     mockWatchdog,
			riotClient:        mockRiot,
			leagueService:     mockLeague,
			summoner:          mockSummoner,
			LCUConnection:     mockLCU,
			accountRepo:       mockRepo,
			logger:            logger,
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

	t.Run("Username from League client when League is running", func(t *testing.T) {
		mockRiot := new(MockRiotClient)
		mockLeague := new(MockLeagueService)
		mockSummoner := new(MockSummonerClient)
		mockLCU := new(MockLCUConnection)
		mockRepo := new(MockAccountsRepository)
		mockWindow := new(MockWindow)
		mockWatchdog := new(MockWatchdogUpdater) // Create a local mock for this test

		mockRiot.On("IsRunning").Return(false).Times(2)
		mockLeague.On("IsRunning").Return(true).Times(2)
		mockLeague.On("IsPlaying").Return(false).Maybe()
		mockLCU.On("InitializeConnection").Return(nil)
		mockLCU.On("IsClientInitialized").Return(true) // Add this missing expectation

		mockSummoner.On("GetLoginSession").Return(&types.LoginSession{Username: "leagueuser"}, nil)
		mockRepo.On("GetAllRented").Return([]types.SummonerRented{
			{Username: "leagueuser"}, // Match!
		}, nil)
		mockWindow.On("EmitEvent", "nexusAccount:state", true).Return()
		mockWatchdog.On("Update", true).Return(nil) // Add watchdog expectation

		am := &AccountMonitor{
			watchdogState:     mockWatchdog,
			riotClient:        mockRiot,
			leagueService:     mockLeague,
			summoner:          mockSummoner,
			LCUConnection:     mockLCU,
			accountRepo:       mockRepo,
			logger:            logger,
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
		mockLeague.AssertExpectations(t)
		mockSummoner.AssertExpectations(t)
		mockLCU.AssertExpectations(t)
		mockRepo.AssertExpectations(t)
		mockWatchdog.AssertExpectations(t) // Verify watchdog expectations too

		mockWindow.AssertExpectations(t)

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

		am := &AccountMonitor{
			riotClient:        mockRiot,
			leagueService:     mockLeague,
			summoner:          mockSummoner,
			LCUConnection:     mockLCU,
			accountRepo:       mockRepo,
			logger:            logger,
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
