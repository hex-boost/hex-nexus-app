package summoner

import (
	"context"
	"sync"

	"github.com/hex-boost/hex-nexus-app/backend/pkg/logger"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"golang.org/x/sync/errgroup"
)

type Service struct {
	client *Client

	logger *logger.Logger
}

func NewService(logger *logger.Logger, client *Client) *Service {
	return &Service{
		client: client,
		logger: logger,
	}
}

func (l *Service) UpdateFromLCU() (*types.PartialSummonerRented, error) {
	var (
		champions       []int
		skins           []int
		currencyMap     map[string]interface{}
		rankingMap      *types.RankedStatsRefresh
		userinfo        types.UserInfo
		mu              sync.Mutex
		currentSummoner types.CurrentSummoner
	)

	eg, _ := errgroup.WithContext(context.Background())
	eg.Go(func() error {
		userinfoResponse, err := l.client.GetUserInfo()
		if err != nil {
			l.logger.Error("Failed to get current summoner")
			return err
		}
		mu.Lock()
		userinfo = *userinfoResponse
		mu.Unlock()
		return nil
	})

	eg.Go(func() error {
		champs, err := l.client.GetChampions()
		if err != nil {
			l.logger.Error("Failed to get champions")
			return err
		}
		mu.Lock()
		champions = champs
		mu.Unlock()
		return nil
	})

	eg.Go(func() error {
		skinData, err := l.client.GetSkins()
		if err != nil {
			l.logger.Error("Failed to get skins")
			return err
		}
		mu.Lock()
		skins = skinData
		mu.Unlock()
		return nil
	})

	eg.Go(func() error {
		currency, err := l.client.GetCurrency()
		if err != nil {
			l.logger.Error("Failed to get currency")
			return err
		}
		mu.Lock()
		currencyMap = currency
		mu.Unlock()
		return nil
	})

	eg.Go(func() error {
		ranking, err := l.client.GetRanking()
		if err != nil {
			l.logger.Error("Failed to get ranking")
			return err
		}
		mu.Lock()
		rankingMap = ranking
		mu.Unlock()
		return nil
	})
	eg.Go(func() error {
		currentSummonerResult, err := l.client.GetCurrentSummoner()
		if err != nil {
			l.logger.Error("Failed to get ranking")
			return err
		}
		mu.Lock()
		currentSummoner = *currentSummonerResult
		mu.Unlock()
		return nil
	})

	if err := eg.Wait(); err != nil {
		return nil, err
	}

	currencies := types.CurrenciesPointer{}
	if rpVal, ok := currencyMap["RP"]; ok {
		if rpFloat, ok := rpVal.(float64); ok {
			rpInt := int(rpFloat)
			currencies.RP = &rpInt
		}
	}
	if beVal, ok := currencyMap["lol_blue_essence"]; ok {
		if beFloat, ok := beVal.(float64); ok {
			beInt := int(beFloat)
			currencies.LolBlueEssence = &beInt
		}
	}
	summoner := &types.PartialSummonerRented{
		Username:        userinfo.Username,
		GameName:        &userinfo.Acct.GameName,
		Tagline:         &userinfo.Acct.TagLine,
		LCUchampions:    &champions,
		PUUID:           &currentSummoner.Puuid,
		LCUskins:        &skins,
		IsEmailVerified: &userinfo.EmailVerified,

		Currencies: &currencies,
		Rankings:   rankingMap,
		Server:     &userinfo.LOL.CPID,
		Ban:        &userinfo.Ban,
	}

	return summoner, nil
}
