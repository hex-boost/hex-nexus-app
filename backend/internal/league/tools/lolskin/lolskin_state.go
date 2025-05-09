package lolskin

import (
	"encoding/json"
	"os"
	"sync"
)

// ChampionSkin represents a skin selection for a champion
type ChampionSkin struct {
	ChampionID int32  `json:"championId"`
	SkinID     int32  `json:"skinId"`
	ChromaID   *int32 `json:"chromaId,omitempty"` // Optional chroma ID
}

// State stores the selected skins for champions
type State struct {
	selections map[int32]ChampionSkin // Map with champion ID as key
	mutex      sync.RWMutex           // For thread safety
}

// NewState creates a new State instance
func NewState() *State {
	return &State{
		selections: make(map[int32]ChampionSkin),
	}
}

// UpdateSelections updates multiple champion skin selections at once
func (s *State) UpdateSelections(selections []ChampionSkin) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	for _, selection := range selections {
		s.selections[selection.ChampionID] = selection
	}
}

// ReplaceAllSelections replaces all existing selections with the provided ones
func (s *State) ReplaceAllSelections(selections []ChampionSkin) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Clear existing selections
	s.selections = make(map[int32]ChampionSkin)

	// Add new selections
	for _, selection := range selections {
		s.selections[selection.ChampionID] = selection
	}
}

// GetChampionSkin returns the selected skin for a champion
func (s *State) GetChampionSkin(championID int32) (ChampionSkin, bool) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	selection, found := s.selections[championID]
	return selection, found
}

// GetAllSelections returns a copy of all champion skin selections
func (s *State) GetAllSelections() []ChampionSkin {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	selections := make([]ChampionSkin, 0, len(s.selections))
	for _, selection := range s.selections {
		selections = append(selections, selection)
	}
	return selections
}

// SetChampionSkin updates or adds a skin selection for a champion
func (s *State) SetChampionSkin(championID, skinID int32, chromaID *int32) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Store previous skin (if any)
	previousSkin, exists := s.selections[championID]

	// Update the selection
	s.selections[championID] = ChampionSkin{
		ChampionID: championID,
		SkinID:     skinID,
		ChromaID:   chromaID,
	}

	// Only emit event if this is a change
	if !exists || previousSkin.SkinID != skinID ||
		(previousSkin.ChromaID == nil && chromaID != nil) ||
		(previousSkin.ChromaID != nil && chromaID == nil) ||
		(previousSkin.ChromaID != nil && chromaID != nil && *previousSkin.ChromaID != *chromaID) {

	}
}

// RemoveChampionSkin removes a skin selection for a champion
func (s *State) RemoveChampionSkin(championID int32) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	delete(s.selections, championID)
}

// FindChampionsWithSkin returns champion IDs that have a specific skin selected
func (s *State) FindChampionsWithSkin(skinID int32) []int32 {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	var champions []int32
	for champID, selection := range s.selections {
		if selection.SkinID == skinID {
			champions = append(champions, champID)
		}
	}
	return champions
}

// SaveToFile persists the state to a file
func (s *State) SaveToFile(path string) error {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// Convert map to slice for consistent JSON output
	selections := make([]ChampionSkin, 0, len(s.selections))
	for _, selection := range s.selections {
		selections = append(selections, selection)
	}

	data, err := json.Marshal(selections)
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}

// LoadFromFile loads the state from a file
func (s *State) LoadFromFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var selections []ChampionSkin
	if err := json.Unmarshal(data, &selections); err != nil {
		return err
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.selections = make(map[int32]ChampionSkin)
	for _, selection := range selections {
		s.selections[selection.ChampionID] = selection
	}

	return nil
}
