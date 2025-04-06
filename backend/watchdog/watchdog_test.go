package watchdog_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/hex-boost/hex-nexus-app/backend/watchdog"
	"github.com/stretchr/testify/assert"
)

func TestUpdateWatchdogAccountStatus(t *testing.T) {
	// Create a temporary directory for the test
	tempDir := t.TempDir()
	statePath := filepath.Join(tempDir, "nexus_watchdog_state.json")

	// Create initial state
	initialState := watchdog.WatchdogState{
		MainPID:       12345,
		NeedsCleanup:  true,
		AccountActive: false,
		LastUpdated:   time.Now().Unix(),
	}
	data, err := json.Marshal(initialState)
	assert.NoError(t, err)

	err = os.WriteFile(statePath, data, 0644)
	assert.NoError(t, err)

	// Update the account status
	err = watchdog.UpdateWatchdogAccountStatus(true)
	assert.NoError(t, err)

	// Read the updated state file
	updatedData, err := os.ReadFile(statePath)
	assert.NoError(t, err)

	var updatedState watchdog.WatchdogState
	err = json.Unmarshal(updatedData, &updatedState)
	assert.NoError(t, err)

	// Verify the updated state
	assert.Equal(t, true, updatedState.AccountActive)
	assert.Equal(t, initialState.MainPID, updatedState.MainPID)
	assert.Equal(t, initialState.NeedsCleanup, updatedState.NeedsCleanup)
	assert.NotEqual(t, initialState.LastUpdated, updatedState.LastUpdated)
}
