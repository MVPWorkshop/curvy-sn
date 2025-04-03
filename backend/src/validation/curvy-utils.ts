import fs from "fs";
import "./wasm_exec.js";

const _globalThis = globalThis as any;
const go = new _globalThis.Go();
const wasmBuffer = fs.readFileSync("./src/validation/curvy-core.wasm");

export const isValidBN254Point = async (input: string): Promise<boolean> => {
  // Checks whether a BN254 Point is valid
  // Input:
  //  point: "X.Y" where X and Y are affine coordinates
  // Output:
  //  res: bool (is valid or not)
  const wasmModule = await WebAssembly.instantiate(wasmBuffer, go.importObject);
  go.run(wasmModule.instance);

  const res = await _globalThis.dbg_isValidBN254Point(input);

  return res;
};

export const isValidEphemeralPublicKey = async (
  input: string,
): Promise<boolean> => {
  const res = await isValidBN254Point(input);
  return res;
};

export const isValidSECP256k1Point = async (
  input: string,
): Promise<boolean> => {
  // Checks whether a SECP256k1 Point is valid
  // Input:
  //  point: "X.Y" where X and Y are affine coordinates
  // Output:
  //  res: bool (is valid or not)
  const wasmModule = await WebAssembly.instantiate(wasmBuffer, go.importObject);
  go.run(wasmModule.instance);

  const res = await _globalThis.dbg_isValidSECP256k1Point(input);

  return res;
};

export const isValidSpendingPublicKey = async (
  input: string,
): Promise<boolean> => {
  return await isValidSECP256k1Point(input);
};

export const isValidMetaAddress = async (input: string): Promise<boolean> => {
  // Checks whether a Meta Address is valid
  // Input:
  //  metaAddress: SECP256k1_X.SECP256k1_Y:::BN254_X.BN254_Y
  //      where _X and _Y are affine coordinates for those curves
  // Output:
  //  res: bool (is valid or not)
  try {
    const [spendingPublicKey, viewingPublicKey] = input.split(":::");

    return (
      (await isValidSECP256k1Point(spendingPublicKey)) &&
      (await isValidBN254Point(viewingPublicKey))
    );
  } catch (e) {
    console.log(`Meta Address: Validation error`, e);
    return false;
  }
};

export const isValidViewTag = async (input: string): Promise<boolean> => {
  // note: view tag should be 1 byte
  if (input == null || input.length != 2) return false;
  const parsed = parseInt(input, 16);
  return !isNaN(parsed);
};
