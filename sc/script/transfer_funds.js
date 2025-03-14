import { stark, cairo, byteArray, CallData } from "starknet";
import { initDeployerAccount } from "./_utils.js";

const WETH_ADDRESS =
    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

const announcerAddress =
    "0x026e4084bcdd6db5bef15c228561d6767fcfd83b5ded33be95d183d911dc887d";

// Params:
const ephemeralPublicKey = "testX.testY";
const viewTag = "01";
const recipientsSpendingPublicKey = "SpendingPubKey";
const recipientsStealthAccountAddress = 123;
const amount = 1;

const { account, provider } = initDeployerAccount();

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

const receipt = await provider.waitForTransaction(
    announceV0Tx.transaction_hash
);

console.log({
    announceV0Tx,
    receipt,
});
