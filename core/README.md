# Core of the protocol's off-chain part

The CLI tool is compiled to WASM and used on the client-side by the sender and the recipient.

## Build

```bash
GOOS=js GOARCH=wasm go build -o curvy-core.wasm
```

Note: Keep up to date the `wasm_exec.js` file.

```bash
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" <destination>
```

## Usage

For examples see: `./ref-usage/examples.js`

#### Generate new Meta Address information (with private keys)

```javascript
// Input:
//  None
let recipientInfo = await globalThis.new_meta();
console.log(recipientInfo);
// Output (json string):
// {
//   "k": "...", // Private spending key
//   "v": "...", // Private viewing key
//   "K": "X.Y", // Public spending key encoded as: "X.Y" where X and Y are affine coordinates
//   "V": "X.Y"  // Public viewing key encoded as: "X.Y" where X and Y are affine coordinates
// }
```

#### Reconstruct public keys based on private keys

```javascript
// Input (json string):
// {
//   "k": "...", // Private spending key
//   "v": "...", // Private viewing key
// }
const { k, v } = JSON.parse(recipientInfo);
let reconstructedRecipientInfo = await globalThis.get_meta(
    JSON.stringify({ k, v })
);
console.log(reconstructedRecipientInfo);
// Output (json string):
// {
//   "k": "...", // Private spending key
//   "v": "...", // Private viewing key
//   "K": "X.Y", // Public spending key encoded as: "X.Y" where X and Y are affine coordinates
//   "V": "X.Y"  // Public viewing key encoded as: "X.Y" where X and Y are affine coordinates
// }
```

#### Generate sender information for the transfer

```javascript
// Input (json string):
// {
//   "K": "X.Y", // Public spending key encoded as: "X.Y" where X and Y are affine coordinates
//   "V": "X.Y"  // Public viewing key encoded as: "X.Y" where X and Y are affine coordinates
// }
const { K, V } = JSON.parse(reconstructedRecipientInfo);
const senderInfo = JSON.parse(await globalThis.send(JSON.stringify({ K, V })));
console.log(senderInfo);
// Output (json string):
// {
//   "r": "...", // Private ephemeral key
//   "R": "X.Y", // Public ephemeral key encoded as: "X.Y" where X and Y are affine coordinates
//   "viewTag": "..", // Viewing tag
//   "spendingPubKey": "X.Y" // Public spending key for the new stealth account, encoded as: "X.Y" where X and Y are affine coordinates
// }
```

#### Perform a scan through passed ephemeral keys and view tags

```javascript
// Input (json string):
// {
//   "k": "...", // Private spending key
//   "v": "...", // Private viewing key
//   "Rs": ["X.Y"] // List of ephemeral keys encoded as: "X.Y" where X and Y are affine coordinates
//   "viewTags": [""], // List of view tags
// }
const Rs = [senderInfo.R];
const viewTags = [senderInfo.viewTag];
const scanResponseRaw = await globalThis.scan(
    JSON.stringify({ k, v, Rs, viewTags })
);
const scanResponse = JSON.parse(scanResponseRaw);
console.log(scanResponse);
// Output (json string):
// {
//   "spendingPubKeys": ["X.Y"] // List of spending public keys (for detected stealth accounts)
//                      encoded as: "X.Y" where X and Y are affine coordinates
//   "spendingPrivKeys": ["..."] // List of corresponding private keys for the detected stealth accounts
// }
```
