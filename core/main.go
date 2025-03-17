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

	js.Global().Set("new_meta", js.FuncOf(newMeta))
	js.Global().Set("get_meta", js.FuncOf(getMeta))
	js.Global().Set("send", js.FuncOf(send))
	js.Global().Set("scan", js.FuncOf(scan))
	// debugging options
	js.Global().Set("dbg_isValidBN254Point", js.FuncOf(isValidBN254Point))
	js.Global().Set("dbg_isValidSECP256k1Point", js.FuncOf(isValidSECP256k1Point))

	<-c
}

func newMeta(in js.Value, args []js.Value) interface{} {
	js.Global().Set("recipient_meta", recipient.NewMeta())
	return nil
}

func getMeta(in js.Value, args []js.Value) interface{} {
	tmp := js.Global().Get("get_meta_data").String()
	js.Global().Set("recipient_meta", recipient.GetMeta(tmp))
	return nil
}

func send(in js.Value, args []js.Value) interface{} {
	js.Global().Set("sender_meta", sender.Send(js.Global().Get("send_data").String()))
	return nil
}

func scan(in js.Value, args []js.Value) interface{} {
	js.Global().Set("scan_meta", recipient.Scan(js.Global().Get("scan_data").String()))
	return nil
}

func isValidBN254Point(in js.Value, args []js.Value) interface{} {
	js.Global().Set("dbg_isValidBN254Point_res", utils.IsValidBN254Point(js.Global().Get("dbg_isValidBN254Point_input").String()))
	return nil
}
func isValidSECP256k1Point(in js.Value, args []js.Value) interface{} {
	js.Global().Set("dbg_isValidSECP256k1Point_res", utils.IsValidSECP256k1Point(js.Global().Get("dbg_isValidSECP256k1Point_input").String()))
	return nil
}