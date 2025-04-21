package watchdog

type WatchdogUpdater interface {
	Update(active bool) error
}
