package utils

import (
	"os"
	"path/filepath"
	"strings"
	"sync"
)

var _utils = &utils{}

type utils struct {
	once           sync.Once
	executableName string  // the file name (without extension) of application executable
	executableDir  string  // the folder that application executable located
	panicLogger    *Logger // handle app initializing panics
}

func Utils() *utils {
	_utils.once.Do(func() {
		// get executable directory
		exe, err := os.Executable()
		if err != nil {
			panic("failed to get executable path")
		}
		_utils.executableName = strings.SplitN(filepath.Base(exe), ".", 2)[0]
		_utils.executableDir = filepath.Dir(exe)

		// initialize panic logger
		panicLogPath := filepath.Join(_utils.executableDir, _utils.executableName+".panic")
		panicFile, err := os.OpenFile(
			panicLogPath,
			os.O_CREATE|os.O_WRONLY|os.O_APPEND,
			0666,
		)
		if err != nil {
			panic("failed to open panic log: " + panicLogPath)
		}
		_utils.panicLogger = NewFileLogger("", panicFile)
	})
	return _utils
}

func (u *utils) HasDir(elem ...string) bool {
	fi, _ := os.Stat(filepath.Join(elem...))
	return fi != nil && fi.IsDir()
}

func (u *utils) Panic(v ...any) {
	u.panicLogger.Panicln(v...)
}
