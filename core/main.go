//go:build js && wasm

package main

import (
	"curvy-core/recipient"
	"curvy-core/sender"
	"curvy-core/utils"
	"syscall/js"
)

func main() {
	c := make(chan struct{}, 0)

	curvyNamespace := js.Global().Get("Object").New()

	curvyNamespace.Set("new_meta", js.FuncOf(newMeta))
	curvyNamespace.Set("get_meta", js.FuncOf(getMeta))
	curvyNamespace.Set("send", js.FuncOf(send))
	curvyNamespace.Set("scan", js.FuncOf(scan))
	// debugging options
	curvyNamespace.Set("dbg_isValidBN254Point", js.FuncOf(isValidBN254Point))
	curvyNamespace.Set("dbg_isValidSECP256k1Point", js.FuncOf(isValidSECP256k1Point))

    js.Global().Set("curvy", curvyNamespace)

	<-c
}

func newMeta(in js.Value, args []js.Value) interface{} {
	return recipient.NewMeta()
}

func getMeta(in js.Value, args []js.Value) interface{} {
	return recipient.GetMeta(args[0].String())
}

func send(in js.Value, args []js.Value) interface{} {
	return sender.Send(args[0].String())
}

func scan(in js.Value, args []js.Value) interface{} {
	return recipient.Scan(args[0].String())
}

func isValidBN254Point(in js.Value, args []js.Value) interface{} {
	return utils.IsValidBN254Point(args[0].String())
}
func isValidSECP256k1Point(in js.Value, args []js.Value) interface{} {
	return utils.IsValidSECP256k1Point(args[0].String())
}