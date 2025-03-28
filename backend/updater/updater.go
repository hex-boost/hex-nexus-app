package updater

import (
	"github.com/fynelabs/selfupdate"
	"io"
	"net/http"
)

// Version is set during build using ldflags
var Version = "development"

type Updater struct {
	CurrentVersion string
}

func NewUpdater() *Updater {
	return &Updater{
		CurrentVersion: Version,
	}
}

func (u *Updater) GetCurrentVersion() string {
	return u.CurrentVersion
}

func (u *Updater) Update(url string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			// Handle error
		}
	}(resp.Body)

	err = selfupdate.Apply(resp.Body, selfupdate.Options{})
	return err
}
