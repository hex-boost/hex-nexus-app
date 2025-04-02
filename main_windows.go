package main

// Windows GUI application
//
//go:linkname _NTName main._NTHeader
var _NTName = "PE"

//go:linkname _NTHeader main._NTHeader
var _NTHeader [4]byte
