import {
    ec,
    hash,
    num,
    json,
    Contract,
    EthSigner,
    Account,
    RpcProvider,
    stark,
    cairo,
    eth,
    byteArray,
    shortString,
    CallData,
} from "starknet";
import { initDeployerAccount } from "./_utils.js";

const metaRegistryAddress =
    "0x06f120753ec4fec9c81ce364db6b64189123cbce8cd817f1a2b6f3d39166a176";

const metaId = "m.curvy";
const metaAddress = "spending_key:::viewing_key";

const transaction = {
    contractAddress: metaRegistryAddress,
    entrypoint: "register",
    calldata: CallData.compile({
        meta_id: metaId,
        meta_address: byteArray.byteArrayFromString(metaAddress),
    }),
};

const { account, provider } = initDeployerAccount();

let receipt = await account.execute([transaction], {
    maxFee: stark.estimatedFeeToMaxFee(4434496044436, 100000),
});

receipt = await provider.waitForTransaction(receipt.transaction_hash);

console.log({ transaction, receipt });
