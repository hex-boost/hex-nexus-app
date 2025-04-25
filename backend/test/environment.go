package test

import "os"

// WithEnvironment temporarily sets environment variables for testing
// and restores them after the test function completes
func WithEnvironment(vars map[string]string, testFunc func()) {
	originals := make(map[string]string)
	for k := range vars {
		val, exists := os.LookupEnv(k)
		if exists {
			originals[k] = val
		}
	}

	for k, v := range vars {
		os.Setenv(k, v)
	}

	defer func() {
		for k := range vars {
			if orig, ok := originals[k]; ok {
				os.Setenv(k, orig)
			} else {
				os.Unsetenv(k)
			}
		}
	}()

	testFunc()
}
