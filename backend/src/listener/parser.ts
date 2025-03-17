import { validateAndParseAddress } from "starknet";
import { ParsedCall, TokenTransfer } from "../types";
import { TOKENS_OF_INTEREST } from "./constants";

export const extractAllCalls = (data: string[]): Array<ParsedCall> | null => {
    // Helper article:
    //  https://9oelm.github.io/2024-01-26-decoding-calldata-of-transactions-on-starknet/
    // New format:
    //  - number of calls
    //  - array of individual calls [] {
    //     - contract address for which the call was made
    //     - entrypoint of the called method
    //     - length of the calldata for this call
    //  }

    try {
        const nCalls = parseInt(data[0], 16);

        const calls: Array<ParsedCall> = [];

        let offset = 1;
        for (let i = 0; i < nCalls; ++i) {
            const contractAddress = validateAndParseAddress(data[offset]);
            const entrypoint = data[offset + 1];
            const calldataLength = parseInt(data[offset + 2], 16);
            const calldata = data.slice(
                offset + 3,
                offset + 2 + calldataLength + 1
            );
            calls.push({ contractAddress, entrypoint, calldata });
            offset = offset + 3 + calldataLength;
        }

        return calls;
    } catch (e) {
        console.log(e);
        return null;
    }
};

export const extractByteArray = (
    data: string[]
): { res: string; offset: number } => {
    // ByteArray is encoding ref:
    //  https://docs.starknet.io/architecture-and-concepts/smart-contracts/serialization-of-cairo-types/#serialization_of_byte_arrays
    // Data Structure:
    //  - number of full 31 byte words in the byte array
    //  - ...31 byte words...
    //  - pending word (remaining bytes that do not add up to 31 bytes in total)
    //  - length of the pending word in bytes

    let res: string = "";

    const countFull31ByteWords = parseInt(data[0], 16);
    let offset = 1;
    // note: implicit append of pending word also
    for (; offset < 2 + countFull31ByteWords; ++offset) {
        res += data[offset].replace("0x", "");
    }

    offset += 1; // note: skip over the length of the pending word field
    return { res, offset };
};

export const parseERC20Transfers = (
    calls: Array<ParsedCall>
): Array<TokenTransfer> => {
    const transfers: Array<TokenTransfer> = [];

    try {
        for (const call of calls) {
            const TOI = TOKENS_OF_INTEREST as any;
            const tokenAddress = validateAndParseAddress(call.contractAddress);
            const tokenInfo = TOI[tokenAddress];
            if (
                tokenInfo === undefined ||
                tokenInfo.transferMethodSignature !== call.entrypoint
            )
                continue;

            const recipient = validateAndParseAddress(call.calldata[0]);
            const amount = `${
                parseInt(call.calldata[1], 16) / 10 ** tokenInfo.decimals
            }`;
            transfers.push({
                recipient,
                amount,
                name: tokenInfo.name,
                decimals: tokenInfo.decimals,
                textAmount: `${amount} ${tokenInfo.name}`,
            });
        }
    } catch (e) {
        console.log(e);
    }
    return transfers;
};
