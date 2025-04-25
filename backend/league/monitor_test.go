package league

import (
	"errors"
	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	websocketEvent "github.com/hex-boost/hex-nexus-app/backend/league/websocket/event"
	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"sync"
	"testing"
)

// Mocks para os testes
type MockLeagueService struct {
	mock.Mock
}

func (m *MockLeagueService) IsLCUConnectionReady() bool {
	args := m.Called()
	return args.Bool(0)
}

func (m *MockLeagueService) UpdateFromLCU(username string) error {
	args := m.Called(username)
	return args.Error(0)
}

func (m *MockLeagueService) IsRunning() bool {
	args := m.Called()
	return args.Bool(0)
}

func (m *MockLeagueService) IsPlaying() bool {
	args := m.Called()
	return args.Bool(0)
}

type MockAccountMonitor struct {
	mock.Mock
}

func (m *MockAccountMonitor) GetLoggedInUsername() string {
	args := m.Called()
	return args.String(0)
}

func (m *MockAccountMonitor) IsNexusAccount() bool {
	args := m.Called()
	return args.Bool(0)
}

type MockApp struct {
	mock.Mock
}

func (m *MockApp) EmitEvent(eventName string, data ...interface{}) {
	m.Called(eventName)
}

// TestCheckAndUpdateAccount testa a função checkAndUpdateAccount
func TestCheckAndUpdateAccount(t *testing.T) {
	// Setup do ambiente e logger
	cfg := &config.Config{LogLevel: "debug"}
	newLogger := logger.New("TestCheckAndUpdateAccount", cfg)

	t.Run("LCU não está pronto", func(t *testing.T) {
		mockLeagueService := new(MockLeagueService)
		mockAccountMonitor := new(MockAccountMonitor)
		mockApp := new(MockApp)

		mockLeagueService.On("IsLCUConnectionReady").Return(false)

		cm := &Monitor{
			leagueService:  mockLeagueService,
			accountMonitor: mockAccountMonitor,
			app:            mockApp,
			logger:         newLogger,
		}

		cm.checkAndUpdateAccount()

		mockLeagueService.AssertCalled(t, "IsLCUConnectionReady")
		mockAccountMonitor.AssertNotCalled(t, "IsNexusAccount")
		mockLeagueService.AssertNotCalled(t, "UpdateFromLCU")
	})

	t.Run("Não é conta Nexus", func(t *testing.T) {
		mockLeagueService := new(MockLeagueService)
		mockAccountMonitor := new(MockAccountMonitor)
		mockApp := new(MockApp)

		mockLeagueService.On("IsLCUConnectionReady").Return(true)
		mockAccountMonitor.On("IsNexusAccount").Return(false)

		cm := &Monitor{
			leagueService:  mockLeagueService,
			accountMonitor: mockAccountMonitor,
			app:            mockApp,
			logger:         newLogger,
		}

		cm.checkAndUpdateAccount()

		mockLeagueService.AssertCalled(t, "IsLCUConnectionReady")
		mockAccountMonitor.AssertCalled(t, "IsNexusAccount")
		mockAccountMonitor.AssertNotCalled(t, "GetLoggedInUsername")
	})

	t.Run("Sem usuário logado", func(t *testing.T) {
		mockLeagueService := new(MockLeagueService)
		mockAccountMonitor := new(MockAccountMonitor)
		mockApp := new(MockApp)

		mockLeagueService.On("IsLCUConnectionReady").Return(true)
		mockAccountMonitor.On("IsNexusAccount").Return(true)
		mockAccountMonitor.On("GetLoggedInUsername").Return("")

		cm := &Monitor{
			leagueService:  mockLeagueService,
			accountMonitor: mockAccountMonitor,
			app:            mockApp,
			logger:         newLogger,
		}

		cm.checkAndUpdateAccount()

		mockAccountMonitor.AssertCalled(t, "GetLoggedInUsername")
		mockLeagueService.AssertNotCalled(t, "UpdateFromLCU")
	})

	t.Run("Conta já atualizada", func(t *testing.T) {
		mockLeagueService := new(MockLeagueService)
		mockAccountMonitor := new(MockAccountMonitor)
		mockApp := new(MockApp)

		mockLeagueService.On("IsLCUConnectionReady").Return(true)
		mockAccountMonitor.On("IsNexusAccount").Return(true)
		mockAccountMonitor.On("GetLoggedInUsername").Return("testuser")

		cm := &Monitor{
			leagueService:  mockLeagueService,
			accountMonitor: mockAccountMonitor,
			app:            mockApp,
			logger:         newLogger,
			accountUpdateStatus: AccountUpdateStatus{
				Username:  "testuser",
				IsUpdated: true,
			},
		}

		cm.checkAndUpdateAccount()

		mockLeagueService.AssertNotCalled(t, "UpdateFromLCU")
	})

	t.Run("Conta Nexus precisa atualizar", func(t *testing.T) {
		mockLeagueService := new(MockLeagueService)
		mockAccountMonitor := new(MockAccountMonitor)
		mockApp := new(MockApp)

		mockLeagueService.On("IsLCUConnectionReady").Return(true)
		mockAccountMonitor.On("IsNexusAccount").Return(true)
		mockAccountMonitor.On("GetLoggedInUsername").Return("testuser")
		mockLeagueService.On("UpdateFromLCU", "testuser").Return(nil)
		mockApp.On("EmitEvent", websocketEvent.LeagueWebsocketStart).Return()

		cm := &Monitor{
			leagueService:  mockLeagueService,
			accountMonitor: mockAccountMonitor,
			app:            mockApp,
			logger:         newLogger,
			stateMutex:     sync.RWMutex{},
			accountUpdateStatus: AccountUpdateStatus{
				Username:  "diferente",
				IsUpdated: false,
			},
		}

		cm.checkAndUpdateAccount()

		mockLeagueService.AssertCalled(t, "UpdateFromLCU", "testuser")
		mockApp.AssertCalled(t, "EmitEvent", websocketEvent.LeagueWebsocketStart)

		assert.Equal(t, "testuser", cm.accountUpdateStatus.Username)
		assert.True(t, cm.accountUpdateStatus.IsUpdated)
	})

	t.Run("Erro ao atualizar conta", func(t *testing.T) {
		mockLeagueService := new(MockLeagueService)
		mockAccountMonitor := new(MockAccountMonitor)
		mockApp := new(MockApp)

		mockLeagueService.On("IsLCUConnectionReady").Return(true)
		mockAccountMonitor.On("IsNexusAccount").Return(true)
		mockAccountMonitor.On("GetLoggedInUsername").Return("testuser")
		mockLeagueService.On("UpdateFromLCU", "testuser").Return(errors.New("erro de atualização"))

		initialStatus := AccountUpdateStatus{
			Username:  "diferente",
			IsUpdated: false,
		}

		cm := &Monitor{
			leagueService:       mockLeagueService,
			accountMonitor:      mockAccountMonitor,
			app:                 mockApp,
			logger:              newLogger,
			stateMutex:          sync.RWMutex{},
			accountUpdateStatus: initialStatus,
		}

		cm.checkAndUpdateAccount()

		mockLeagueService.AssertCalled(t, "UpdateFromLCU", "testuser")
		mockApp.AssertNotCalled(t, "EmitEvent", websocketEvent.LeagueWebsocketStart)

		assert.Equal(t, initialStatus.Username, cm.accountUpdateStatus.Username)
		assert.Equal(t, initialStatus.IsUpdated, cm.accountUpdateStatus.IsUpdated)
	})
}
