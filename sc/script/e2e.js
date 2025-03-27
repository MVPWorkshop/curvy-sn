import { stark, cairo, byteArray, CallData } from "starknet";
import { initDeployerAccount } from "./_utils.js";
import fs from "fs";
import "./wasm_exec.js";

const go = new globalThis.Go();
const wasmBuffer = fs.readFileSync("./script/curvy-core.wasm");

const WETH_ADDRESS =
    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

const announcerAddress =
    "0x026e4084bcdd6db5bef15c228561d6767fcfd83b5ded33be95d183d911dc887d";

const metaRegistryAddress =
    "0x06f120753ec4fec9c81ce364db6b64189123cbce8cd817f1a2b6f3d39166a176";

const { account, provider } = initDeployerAccount();

/// Registration part

const metaId = "m3.curvy";

const wasmModule = await WebAssembly.instantiate(wasmBuffer, go.importObject);
go.run(wasmModule.instance);

let recipientInfo = await globalThis.new_meta();
console.log(recipientInfo);

const { k, v, K, V } = JSON.parse(recipientInfo);

const metaAddress = `${K}:::${V}`;

const transaction = {
    contractAddress: metaRegistryAddress,
    entrypoint: "register",
    calldata: CallData.compile({
        meta_id: metaId,
        meta_address: byteArray.byteArrayFromString(metaAddress),
    }),
};

let receipt = await account.execute([transaction], {
    maxFee: stark.estimatedFeeToMaxFee(4434496044436, 100000),
});

receipt = await provider.waitForTransaction(receipt.transaction_hash);

console.log({ transaction, receipt });

/// Transfer step

const senderInfo = JSON.parse(await globalThis.send(JSON.stringify({ K, V })));
const { R, viewTag, spendingPubKey } = senderInfo;
console.log(senderInfo);

const ephemeralPublicKey = R;
const recipientsSpendingPublicKey = spendingPubKey;
const recipientsStealthAccountAddress = 123; // TODO calculate the real address
const amount = 1;

const tx0 = {
    contractAddress: announcerAddress,
    entrypoint: "announce_transfer_v0",
    calldata: CallData.compile({
        ephemeral_key: byteArray.byteArrayFromString(ephemeralPublicKey),
        view_tag: byteArray.byteArrayFromString(viewTag),
        spending_pub_key: byteArray.byteArrayFromString(
            recipientsSpendingPublicKey
        ),
        stealth_account_address: recipientsStealthAccountAddress,
    }),
};

const tx1 = {
    contractAddress: WETH_ADDRESS,
    entrypoint: "transfer",
    calldata: CallData.compile({
        to: recipientsStealthAccountAddress,
        amount: cairo.uint256(amount),
    }),
};

const announceV0Tx = await account.execute([tx0, tx1], {
    maxFee: stark.estimatedFeeToMaxFee(4434496044436, 100000),
});

receipt = await provider.waitForTransaction(announceV0Tx.transaction_hash);

console.log({
    announceV0Tx,
    receipt,
});
