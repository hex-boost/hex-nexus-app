package league

import (
	"context"
	"encoding/json"
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"golang.org/x/sync/errgroup"
	"sync"
)

type SummonerService struct {
	summonerClient *SummonerClient
	repoClient     *repository.LeagueRepository

	logger *utils.Logger
}

func NewSummonerService(summonerClient *SummonerClient, repoClient *repository.LeagueRepository, logger *utils.Logger) *SummonerService {
	return &SummonerService{
		summonerClient: summonerClient,
		repoClient:     repoClient,
		logger:         logger,
	}
}

func (l *SummonerService) UpdateFromLCU(username string, password string) error {
	var (
		currentSummoner types.CurrentSummoner
		champions       []int
		skins           []int
		currencyMap     map[string]interface{}
		rankingMap      map[string]interface{}
		region          string
		mu              sync.Mutex
	)

	eg, _ := errgroup.WithContext(context.Background())

	// Fetch current summoner
	eg.Go(func() error {
		summoner, err := l.summonerClient.GetCurrentSummoner()
		if err != nil {
			l.logger.Error("Failed to get current summoner")
			return err
		}
		mu.Lock()
		currentSummoner = *summoner
		mu.Unlock()
		return nil
	})

	// Fetch champions
	eg.Go(func() error {
		champs, err := l.summonerClient.GetChampions()
		if err != nil {
			l.logger.Error("Failed to get champions")
			return err
		}
		mu.Lock()
		champions = champs
		mu.Unlock()
		return nil
	})

	// Fetch skins
	eg.Go(func() error {
		skinData, err := l.summonerClient.GetSkins()
		if err != nil {
			l.logger.Error("Failed to get skins")
			return err
		}
		mu.Lock()
		skins = skinData
		mu.Unlock()
		return nil
	})

	// Fetch currency
	eg.Go(func() error {
		currency, err := l.summonerClient.GetCurrency()
		if err != nil {
			l.logger.Error("Failed to get currency")
			return err
		}
		mu.Lock()
		currencyMap = currency
		mu.Unlock()
		return nil
	})

	// Fetch ranking
	eg.Go(func() error {
		ranking, err := l.summonerClient.GetRanking()
		if err != nil {
			l.logger.Error("Failed to get ranking")
			return err
		}
		mu.Lock()
		rankingMap = ranking
		mu.Unlock()
		return nil
	})

	// Fetch region
	eg.Go(func() error {
		reg, err := l.summonerClient.GetRegion()
		if err != nil {
			l.logger.Error("Failed to get region")
			return err
		}
		mu.Lock()
		region = reg
		mu.Unlock()
		return nil
	})

	// Wait for all goroutines to complete
	if err := eg.Wait(); err != nil {
		return err
	}

	currencies := types.Currencies{}
	if rpVal, ok := currencyMap["RP"]; ok {
		if rpFloat, ok := rpVal.(float64); ok {
			currencies.RP = int(rpFloat)
		}
	}
	if beVal, ok := currencyMap["lol_blue_essence"]; ok {
		if beFloat, ok := beVal.(float64); ok {
			currencies.LolBlueEssence = int(beFloat)
		}
	}

	// Extract ranking data safely
	rankedStats := types.RankedStats{
		RankedFlexSR:  make(map[string]interface{}),
		RankedSolo5x5: make(map[string]interface{}),
	}

	if flexVal, ok := rankingMap["RANKED_FLEX_SR"]; ok {
		if flexMap, ok := flexVal.(map[string]interface{}); ok {
			rankedStats.RankedFlexSR = flexMap
		}
	}

	if soloVal, ok := rankingMap["RANKED_SOLO_5x5"]; ok {
		if soloMap, ok := soloVal.(map[string]interface{}); ok {
			rankedStats.RankedSolo5x5 = soloMap
		}
	}

	// Create summoner object
	summoner := types.Summoner{
		Username:      username,
		Password:      password,
		Gamename:      currentSummoner.GameName,
		Tagline:       currentSummoner.TagLine,
		Champions:     champions, // Adjust type as needed
		ChampionSkins: skins,     // Adjust type as needed
		Currencies:    currencies,
		RankedStats:   rankedStats,
		Server:        region,
		AccountLevel:  currentSummoner.SummonerLevel,
	}
	summonerJSON, err := json.MarshalIndent(summoner, "", "  ")

	if err != nil {
		l.logger.Errorf("Failed to marshal summoner to JSON: %v", err)
	} else {
		l.logger.Debugf("Summoner object: %s", string(summonerJSON))
	}
	err = l.repoClient.SaveSummoner(summoner)
	if err != nil {
		l.logger.Error("Failed to save summoner")
		return err
	}

	l.logger.Info("Successfully updated summoner from LCU")
	return nil
}
