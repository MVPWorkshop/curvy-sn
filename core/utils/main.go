package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"

	BN254 "github.com/consensys/gnark-crypto/ecc/bn254"
	BN254_fr "github.com/consensys/gnark-crypto/ecc/bn254/fr"
	SECP256K1 "github.com/consensys/gnark-crypto/ecc/secp256k1"
	SECP256K1_fr "github.com/consensys/gnark-crypto/ecc/secp256k1/fr"

	BN254_fp "github.com/consensys/gnark-crypto/ecc/bn254/fp"
	SECP256K1_fp "github.com/consensys/gnark-crypto/ecc/secp256k1/fp"
)

func SECP256k1_MulG1PointandElement(pt *SECP256K1.G1Affine, el *SECP256K1_fr.Element) (res SECP256K1.G1Affine) {

	var el_asBigInt big.Int
	el.BigInt(&el_asBigInt)

	return *res.ScalarMultiplication(pt, &el_asBigInt)
}

func SECP256k1_MulG1JacPointandElement(pt *SECP256K1.G1Jac, el *SECP256K1_fr.Element) (res SECP256K1.G1Jac) {

	var el_asBigInt big.Int
	el.BigInt(&el_asBigInt)

	return *res.ScalarMultiplication(pt, &el_asBigInt)
}

func SECP256k_Gen1G1KeyPair() (privKey SECP256K1_fr.Element, pubKey SECP256K1.G1Affine) {

	privKey.SetRandom()

	var privKey_asBigInt big.Int
	privKey.BigInt(&privKey_asBigInt)

	pubKey.ScalarMultiplicationBase(&privKey_asBigInt)

	return privKey, pubKey
}

func BN254_GenG1KeyPair() (privKey BN254_fr.Element, pubKey BN254.G1Affine, _err error) {

	_, err := privKey.SetRandom()
	if err != nil {
		return BN254_fr.Element{}, BN254.G1Affine{}, fmt.Errorf("error generating private key: %w", err)
	}

	pubKeyAff, _ := BN254_CalcG1PubKey(privKey)

	return privKey, pubKeyAff, nil
}

func BN254_CalcG1PubKey(privKey BN254_fr.Element) (pubKey BN254.G1Affine, _err error) {

	privKeyBigInt := new(big.Int)
	privKey.BigInt(privKeyBigInt)

	g1Gen, _, _, _ := BN254.Generators()

	var pubKeyJac BN254.G1Jac
	pubKeyJac.ScalarMultiplication(&g1Gen, privKeyBigInt)

	var pubKeyAff BN254.G1Affine
	pubKeyAff.FromJacobian(&pubKeyJac)

	return pubKeyAff, nil
}

func BN254_GenG2KeyPair() (privKey BN254_fr.Element, pubKey BN254.G2Affine, _err error) {

	_, err := privKey.SetRandom()
	if err != nil {
		return BN254_fr.Element{}, BN254.G2Affine{}, fmt.Errorf("error generating private key: %w", err)
	}

	pubKeyAff, _ := BN254_CalcG2PubKey(privKey)

	return privKey, pubKeyAff, nil
}

func BN254_CalcG2PubKey(privKey BN254_fr.Element) (pubKey BN254.G2Affine, _err error) {

	privKeyBigInt := new(big.Int)
	privKey.BigInt(privKeyBigInt)

	_, g2Gen, _, _ := BN254.Generators()

	var pubKeyJac BN254.G2Jac
	pubKeyJac.ScalarMultiplication(&g2Gen, privKeyBigInt)

	var pubKeyAff BN254.G2Affine
	pubKeyAff.FromJacobian(&pubKeyJac)

	return pubKeyAff, nil
}

func BN254_MulG1PointandElement(pt *BN254.G1Affine, el *BN254_fr.Element) (res BN254.G1Affine) {

	var el_asBigInt big.Int
	el.BigInt(&el_asBigInt)

	return *res.ScalarMultiplication(pt, &el_asBigInt)
}

func BN254_G1PointToViewTag(pt *BN254.G1Affine, len uint) (viewTag string) {
	return hex.EncodeToString(BN254_HashG1Point(pt))[:2*len]
}

func BN254_G1JacPointToViewTag(pt *BN254.G1Jac, len uint) (viewTag string) {
	return hex.EncodeToString(BN254_HashG1JacPoint(pt))[:2*len]
}

func BN254_G1PointXCoordToViewTag(pt *BN254.G1Affine, len uint) (viewTag string) {

	return pt.X.Text(16)[:2*len]
}

func BN254_G1JacPointXCoordToViewTag(pt *BN254.G1Jac, len uint) (viewTag string) {

	return pt.X.Text(16)[:2*len]
}

func BN254_HashG1Point(pt *BN254.G1Affine) []byte {
	hasher := sha256.New()
	tmp := pt.X.Bytes()
	hasher.Write(tmp[:])
	tmp = pt.Y.Bytes()
	hasher.Write(tmp[:])
	hash := hasher.Sum(nil) // Finalize the hash and return the result
	return hash
}

func BN254_HashG1JacPoint(pt *BN254.G1Jac) []byte {
	hasher := sha256.New()
	// tmp := pt.X.Bytes()
	// hasher.Write(tmp[:])
	// tmp = pt.Y.Bytes()
	// hasher.Write(tmp[:])
	// tmp = pt.Z.Bytes()
	// hasher.Write(tmp[:])

	var pt_asAffine BN254.G1Affine
	bytes := pt_asAffine.FromJacobian(pt).Bytes()
	hasher.Write(bytes[:])

	// hasher.Write(pt.X.Marshal())
	// hasher.Write(pt.Y.Marshal())
	// hasher.Write(pt.Z.Marshal())
	hash := hasher.Sum(nil) // Finalize the hash and return the result
	return hash
}

func ComputeViewTag(viewTagVersion string, pt *BN254.G1Affine) (viewTag string) {

	if viewTagVersion == "none" {
		viewTag = ""
	} else if viewTagVersion == "v0-1byte" {
		viewTag = BN254_G1PointToViewTag(pt, 1)

	} else if viewTagVersion == "v0-2bytes" {
		viewTag = BN254_G1PointToViewTag(pt, 2)

	} else if viewTagVersion == "v1-1byte" {
		viewTag = BN254_G1PointXCoordToViewTag(pt, 1)
	}

	return viewTag
}

func ComputeViewTagFromJac(viewTagVersion string, pt *BN254.G1Jac) (viewTag string) {

	var ptAff BN254.G1Affine
	ptAff.FromJacobian(pt)
	return ComputeViewTag(viewTagVersion, &ptAff)
}

func Hash(input []byte) []byte {
	hasher := sha256.New()
	hasher.Write(input)     // Hash the input
	hash := hasher.Sum(nil) // Finalize the hash and return the result
	return hash
}

func GenRandomRsAndViewTags(len int, viewTagVersion string) (Rs []string, VTags []string) {

	for i := 0; i < len; i++ {
		r, R, _ := BN254_GenG1KeyPair()

		tmp := BN254_MulG1PointandElement(&R, &r)
		vTag := ComputeViewTag(viewTagVersion, &tmp)

		Rs = append(Rs, R.X.String()+"."+R.Y.String())

		VTags = append(VTags, vTag)
	}

	return Rs, VTags
}

func UnpackXY(in string) (X string, Y string) {
	separatorIdx := strings.IndexByte(in, '.')
	if(separatorIdx == -1) { return "invalid", "invalid"};
	X = in[:separatorIdx]
	Y = in[separatorIdx+1:]

	return
}

func PackXY(X string, Y string) (out string) {
	return X + "." + Y
}

func IsValidBN254Point(point string) (bool) {
	Xstr, Ystr := UnpackXY(point)

	if !IsDigitsOnly(Xstr) { return false }
	if !IsDigitsOnly(Ystr) { return false }

	var X, Y BN254_fp.Element
	X.SetString(Xstr)
	Y.SetString(Ystr)

	var p BN254.G1Affine
	p.X = X
	p.Y = Y

	return p.IsOnCurve()
}

func IsValidSECP256k1Point(point string) (bool) {
	Xstr, Ystr := UnpackXY(point)

	if !IsDigitsOnly(Xstr) { return false }
	if !IsDigitsOnly(Ystr) { return false }

	var X, Y SECP256K1_fp.Element
	X.SetString(Xstr)
	Y.SetString(Ystr)

	var p SECP256K1.G1Affine
	p.X = X
	p.Y = Y

	return p.IsOnCurve()
}

func IsDigitsOnly(s string) bool {
    for _, c := range s {
        if c < '0' || c > '9' {
            return false
        }
    }
    return true
}