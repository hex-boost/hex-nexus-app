package updaterUtils

import (
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

type UpdaterUtils struct {
}

var ExecutableFn = func() (string, error) {
	return os.Executable()
}

func New() *UpdaterUtils {
	return &UpdaterUtils{}
}
func (u *UpdaterUtils) GetLatestAppDir() (string, error) {
	baseDir, err := ExecutableFn()
	if err != nil {
		return "", err
	}
	baseDir = filepath.Dir(baseDir)

	// Procura o diretório app-x.y.z mais recente
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return "", err
	}

	type Version struct {
		path                string
		major, minor, patch int
	}

	var versions []Version

	// Encontra todos os diretórios app-x.y.z e analisa suas versões
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		name := entry.Name()
		if !strings.HasPrefix(name, "app-") {
			continue
		}

		versionStr := strings.TrimPrefix(name, "app-")
		parts := strings.Split(versionStr, ".")

		if len(parts) != 3 {
			continue
		}

		major, err1 := strconv.Atoi(parts[0])
		minor, err2 := strconv.Atoi(parts[1])
		patch, err3 := strconv.Atoi(parts[2])

		if err1 != nil || err2 != nil || err3 != nil {
			continue
		}

		versions = append(versions, Version{
			path:  filepath.Join(baseDir, name),
			major: major,
			minor: minor,
			patch: patch,
		})
	}

	if len(versions) == 0 {
		// Fallback: se não encontrar diretórios versionados, retorna o diretório base
		return baseDir, nil
	}

	// Ordena as versões para encontrar a mais recente (maior número de versão)
	sort.Slice(versions, func(i, j int) bool {
		if versions[i].major != versions[j].major {
			return versions[i].major > versions[j].major
		}
		if versions[i].minor != versions[j].minor {
			return versions[i].minor > versions[j].minor
		}
		return versions[i].patch > versions[j].patch
	})

	// Retorna o caminho da versão mais alta
	return versions[0].path, nil
}
