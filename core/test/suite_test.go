package test

import (
	"curvy-core/recipient"
	"curvy-core/sender"
	"curvy-core/utils"
	"encoding/json"
	"fmt"
	"testing"
)

func TestSend(t *testing.T) {
    
	_, K := utils.SECP256k_Gen1G1KeyPair()
	_, V, _ := utils.BN254_GenG1KeyPair()

	output := sender.Send(`{"K":"` + utils.PackXY(K.X.String(), K.Y.String()) + `","V":"` + utils.PackXY(V.X.String(), V.Y.String())+ `"}`)

	t.Log(output)
}

func TestE2E(t *testing.T) {
    
	k, K := utils.SECP256k_Gen1G1KeyPair()
	v, V, _ := utils.BN254_GenG1KeyPair()

	var sendOutput sender.SenderOutputData
	sendJsonOutput := sender.Send(`{"K":"` + utils.PackXY(K.X.String(), K.Y.String()) + `","V":"` + utils.PackXY(V.X.String(), V.Y.String())+ `"}`)

	json.Unmarshal([]byte(sendJsonOutput), &sendOutput)

	fmt.Println("sendOutput", sendOutput)

	var recipientInputData recipient.RecipientInputData
	recipientInputData.PK_k = k.Text(16)
	recipientInputData.PK_v = v.Text(16)
	recipientInputData.Rs = []string{sendOutput.R}
	recipientInputData.ViewTags = []string{sendOutput.ViewTag}

	tmp, _ := json.Marshal(recipientInputData)
	receiveOutput := recipient.Scan(string(tmp))

	fmt.Println("receiveOutput", receiveOutput)	
}