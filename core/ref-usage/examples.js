import fs from "fs";
import "./wasm_exec.js";

const go = new globalThis.Go();
const wasmBuffer = fs.readFileSync("../curvy-core.wasm");

const wasmModule = await WebAssembly.instantiate(wasmBuffer, go.importObject);
go.run(wasmModule.instance);

// Generates new Meta Address information (with private keys)
// Input:
//  None
await globalThis.new_meta();
let recipientInfo = globalThis.recipient_meta;
console.log(recipientInfo);
// Output (json string):
// {
//   "k": "...", // Private spending key
//   "v": "...", // Private viewing key
//   "K": "X.Y", // Public spending key encoded as: "X.Y" where X and Y are affine coordinates
//   "V": "X.Y"  // Public viewing key encoded as: "X.Y" where X and Y are affine coordinates
// }

// Reconstruct public keys based on private keys
// Input (json string):
// {
//   "k": "...", // Private spending key
//   "v": "...", // Private viewing key
// }
const { k, v } = JSON.parse(recipientInfo);
globalThis.get_meta_data = JSON.stringify({ k, v });
await globalThis.get_meta();
let reconstructedRecipientInfo = JSON.parse(globalThis.recipient_meta);
console.log(reconstructedRecipientInfo);
// Output (json string):
// {
//   "k": "...", // Private spending key
//   "v": "...", // Private viewing key
//   "K": "X.Y", // Public spending key encoded as: "X.Y" where X and Y are affine coordinates
//   "V": "X.Y"  // Public viewing key encoded as: "X.Y" where X and Y are affine coordinates
// }

// Send to recipient
// Input (json string):
// {
//   "K": "X.Y", // Public spending key encoded as: "X.Y" where X and Y are affine coordinates
//   "V": "X.Y"  // Public viewing key encoded as: "X.Y" where X and Y are affine coordinates
// }
const { K, V } = reconstructedRecipientInfo;
globalThis.send_data = JSON.stringify({ K, V });
await globalThis.send();
const senderInfo = JSON.parse(globalThis.sender_meta);
console.log(senderInfo);
// Output (json string):
// {
//   "r": "...", // Private ephemeral key
//   "R": "X.Y", // Public ephemeral key encoded as: "X.Y" where X and Y are affine coordinates
//   "viewTag": "..", // Viewing tag
//   "spendingPubKey": "X.Y" // Public spending key for the new stealth account, encoded as: "X.Y" where X and Y are affine coordinates
// }

// Perform a scan of all ephemeral keys and view tags
// Input (json string):
// {
//   "k": "...", // Private spending key
//   "v": "...", // Private viewing key
//   "Rs": ["X.Y"] // List of ephemeral keys encoded as: "X.Y" where X and Y are affine coordinates
//   "viewTags": [""], // List of view tags
// }
const Rs = [senderInfo.R];
const viewTags = [senderInfo.viewTag];
globalThis.scan_data = JSON.stringify({ k, v, Rs, viewTags });
await globalThis.scan();
const scanResponse = JSON.parse(globalThis.scan_meta);
console.log(scanResponse);
// Output (json string):
// {
//   "spendingPubKeys": ["X.Y"] // List of spending public keys (for detected stealth accounts)
//                      encoded as: "X.Y" where X and Y are affine coordinates
//   "spendingPrivKeys": ["..."] // List of corresponding private keys for the detected stealth accounts
// }
