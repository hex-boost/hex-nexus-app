package league

import (
	"context"
	"github.com/hex-boost/hex-nexus-app/backend/repository"
	"github.com/hex-boost/hex-nexus-app/backend/types"
	"github.com/hex-boost/hex-nexus-app/backend/utils"
	"golang.org/x/sync/errgroup"
	"sync"
)

type SummonerService struct {
	summonerClient *SummonerClient
	repoClient     *repository.AccountsRepository

	logger *utils.Logger
}

func NewSummonerService(summonerClient *SummonerClient, repoClient *repository.AccountsRepository, logger *utils.Logger) *SummonerService {
	return &SummonerService{
		summonerClient: summonerClient,
		repoClient:     repoClient,
		logger:         logger,
	}
}

func (l *SummonerService) UpdateFromLCU(username string) (*types.PartialSummonerRented, error) {
	var (
		champions   []int
		skins       []int
		currencyMap map[string]interface{}
		rankingMap  *types.RankedStats
		userinfo    types.UserInfo
		mu          sync.Mutex
	)

	eg, _ := errgroup.WithContext(context.Background())
	eg.Go(func() error {

		userinfoResponse, err := l.summonerClient.GetUserInfo()
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
		Username:     username,
		Tagline:      &userinfo.Acct.TagLine,
		LCUchampions: &champions,

		LCUskins:   &skins,
		Currencies: &currencies,
		Rankings:   rankingMap,
		Server:     &userinfo.LOL.CPID,
		Ban:        &userinfo.Ban,
	}

	return summoner, nil
}
