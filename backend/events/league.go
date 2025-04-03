package customEvents

type LeagueEventsI struct {
	ClientClosed     string
	ClientOpen       string
	ClientLoggedIn   string
	ClientLoginReady string
	RentedAccount    string
}

var LeagueEvents = LeagueEventsI{
	ClientClosed:     "league:client:closed",
	ClientOpen:       "league:client:open",
	ClientLoggedIn:   "league:client:loggedin",
	ClientLoginReady: "league:client:loginready",
	RentedAccount:    "league:account:rented",
}
