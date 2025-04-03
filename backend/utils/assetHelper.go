package utils

import (
	"embed"
	"encoding/json"
	"io/fs"
	"os"
	"path/filepath"
)

type AssetHelper interface {
	
	GetFileBytes(filePaths ...string) (data []byte, err error)
	
	LoadJSON(v any, filePaths ...string) error
	
	Walk(callback func(path string, isDir bool, f fs.DirEntry) error, dirPaths ...string) error
	
	Extract(dst ...string) error
}

type EmbedFS struct {
	fs   embed.FS
	root string
}

func NewEmbedFS(fs embed.FS, dirRoot ...string) AssetHelper {
	root := filepath.Join(dirRoot...)
	root = filepath.ToSlash(root)
	return &EmbedFS{
		fs:   fs,
		root: root,
	}
}

func (ef *EmbedFS) GetFileBytes(filePaths ...string) (data []byte, err error) {
	name := filepath.Join(append([]string{ef.root}, filePaths...)...)
	name = filepath.ToSlash(name)
	data, err = ef.fs.ReadFile(name)
	return
}

func (ef *EmbedFS) LoadJSON(v any, filePaths ...string) error {
	data, err := ef.GetFileBytes(filePaths...)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}

func (ef *EmbedFS) Walk(callback func(path string, isDir bool, f fs.DirEntry) error, dirPaths ...string) error {
	
	cd := filepath.Join(dirPaths...)
	cd = filepath.ToSlash(cd)

	dir := filepath.Join(ef.root, cd)
	dir = filepath.ToSlash(dir)
	files, err := ef.fs.ReadDir(dir)
	if err != nil {
		return err
	}
	for _, f := range files {
		if err := callback(cd+"/"+f.Name(), f.IsDir(), f); err != nil {
			return err
		}
	}
	return nil
}

func (ef *EmbedFS) Extract(dst ...string) error {
	files, err := ef.fs.ReadDir(ef.root)
	if err != nil {
		return err
	}

	dir := filepath.Join(dst...)
	err = os.MkdirAll(dir, os.ModePerm)
	if err != nil {
		return err
	}

	return ef._extract(files, ef.root, dir)
}

func (ef *EmbedFS) _extract(files []fs.DirEntry, cd string, ecd string) error {
	for _, f := range files {
		
		_cd := cd + "/" + f.Name()
		
		_ecd := filepath.Join(ecd, f.Name())

		if f.IsDir() { 
			_files, err := ef.fs.ReadDir(_cd)
			if err != nil {
				return err
			}

			err = os.MkdirAll(_ecd, os.ModePerm)
			if err != nil {
				return err
			}

			err = ef._extract(_files, _cd, _ecd)
			if err != nil {
				return err
			}

		} else { 
			fileContent, err := ef.fs.ReadFile(_cd)
			if err != nil {
				return err
			}

			if err := os.WriteFile(_ecd, fileContent, 0666); err != nil {
				return err
			}
		}
	}
	return nil
}

type DirFS struct {
	fs fs.FS
}

func NewDirFS(dirRoot ...string) AssetHelper {
	root := filepath.Join(dirRoot...)
	root = filepath.ToSlash(root)
	return &DirFS{
		fs: os.DirFS(root),
	}
}

func (df *DirFS) GetFileBytes(filePaths ...string) (data []byte, err error) {
	name := filepath.Join(filePaths...)
	name = filepath.ToSlash(name)
	data, err = fs.ReadFile(df.fs, name)
	return
}

func (df *DirFS) LoadJSON(v any, filePaths ...string) error {
	data, err := df.GetFileBytes(filePaths...)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}

func (df *DirFS) Walk(callback func(path string, isDir bool, f fs.DirEntry) error, dirPaths ...string) error {
	
	cd := filepath.Join(dirPaths...)
	cd = filepath.ToSlash(cd)

	dir := filepath.Join(".", cd)
	dir = filepath.ToSlash(dir)
	files, err := fs.ReadDir(df.fs, dir)
	if err != nil {
		return err
	}
	for _, f := range files {
		if err := callback(dir+"/"+f.Name(), f.IsDir(), f); err != nil {
			return err
		}
	}
	return nil
}

func (df *DirFS) Extract(dst ...string) error {
	files, err := fs.ReadDir(df.fs, ".")
	if err != nil {
		return err
	}

	dir := filepath.Join(dst...)
	err = os.MkdirAll(dir, os.ModePerm)
	if err != nil {
		return err
	}

	return df._extract(files, ".", dir)
}

func (df *DirFS) _extract(files []fs.DirEntry, cd string, ecd string) error {
	for _, f := range files {
		
		_cd := cd + "/" + f.Name()
		
		_ecd := filepath.Join(ecd, f.Name())

		if f.IsDir() { 
			_files, err := fs.ReadDir(df.fs, _cd)
			if err != nil {
				return err
			}

			err = os.MkdirAll(_ecd, os.ModePerm)
			if err != nil {
				return err
			}

			err = df._extract(_files, _cd, _ecd)
			if err != nil {
				return err
			}

		} else { 
			fileContent, err := fs.ReadFile(df.fs, _cd)
			if err != nil {
				return err
			}

			if err := os.WriteFile(_ecd, fileContent, 0666); err != nil {
				return err
			}
		}
	}
	return nil
}
