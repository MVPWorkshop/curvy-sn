import { CallData, hash, validateAndParseAddress } from "starknet";
import { EventEmitter } from "stream";
import { extractAllCalls, parseERC20Transfers } from "./parser";
import { ParsedCall, TokenTransfer } from "../types";

import {
    ContractEvent,
    ContractListenerOptions,
    StarknetTransaction,
} from "../types";

export class ContractListener extends EventEmitter {
    private options: ContractListenerOptions;
    private pollingInterval: number;
    private lastBlockScanned: number;
    private timer?: NodeJS.Timeout;
    private pollingMutexTaken: boolean;

    constructor(options: ContractListenerOptions, pollingInterval = 1000) {
        super();
        this.options = options;
        this.pollingInterval = pollingInterval;
        this.lastBlockScanned = options.fromBlock;
        this.pollingMutexTaken = false;
    }

    private async pollEvents() {
        if (this.pollingMutexTaken) return;
        this.pollingMutexTaken = true;

        console.log(
            `Polling events for contract ${this.options.contractAddress}, latest_block: ${this.lastBlockScanned}`
        );

        try {
            const { events, latestBlock } = await this.fetchEvents();
            if (latestBlock < this.lastBlockScanned) return;

            // Always update lastBlockScanned to the latest block fetched.
            this.lastBlockScanned = latestBlock;
            this.emit("latest_block", this.lastBlockScanned);

            // Process events if any are returned.
            if (events.length > 0) {
                console.log(`Processing ${events.length} events`);
                for (const event of events) {
                    const result = await this.processEvent(event);
                    if (result) {
                        this.emit("event", result);
                    }
                }
            }
        } catch (e: any) {
            this.emit("error", e);
            console.error(e);
        } finally {
            this.pollingMutexTaken = false;
        }
    }

    private async fetchEvents(): Promise<{ events: ContractEvent[]; latestBlock: number }> {
        const blockReqBody = {
            id: 1,
            jsonrpc: "2.0",
            method: "starknet_blockNumber",
        };

        const blockRes = await fetch(this.options.rpcUrl, {
            method: "POST",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
            },
            body: JSON.stringify(blockReqBody),
        });
        const blockData = await blockRes.json();
        const latestBlock = blockData.result;
        if (latestBlock <= this.lastBlockScanned) return { events: [], latestBlock };
        let params = [];

        if (this.options.eventName) {
            params = [
                {
                    from_block: { block_number: this.lastBlockScanned + 1 },
                    to_block: { block_number: latestBlock },
                    keys: [[hash.getSelectorFromName(this.options.eventName)]],
                    chunk_size: this.options.chunkSize,
                },
            ]
        } else {
            params = [
                {
                    from_block: { block_number: this.lastBlockScanned + 1 },
                    to_block: { block_number: latestBlock },
                    address: this.options.contractAddress,
                    chunk_size: this.options.chunkSize,
                },
            ]
        }

        const reqBody = {
            id: 1,
            jsonrpc: "2.0",
            method: "starknet_getEvents",
            params,
        };

        const res = await fetch(this.options.rpcUrl, {
            method: "POST",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
            },
            body: JSON.stringify(reqBody),
        });
        const data = await res.json();
        const events = (data.result?.events || []) as ContractEvent[];
        if (events.length > 0) {
            return { events, latestBlock: events[events.length - 1].block_number };
        }
        return { events, latestBlock };
    }

    private async processEvent(event: ContractEvent): Promise<{
        raw: ContractEvent;
        tx: StarknetTransaction;
        decoded: any;
        tokenTransfers: Array<TokenTransfer>;
    } | null> {
        try {
            const contractAddress = validateAndParseAddress(
                event.from_address
            );
            const validContractAddress = validateAndParseAddress(this.options.contractAddress);
            if (validContractAddress !== contractAddress) return null;

            const receipt = await this.fetchTransaction(event.transaction_hash);

            const calls = extractAllCalls(receipt.result.calldata);

            if (calls === null) return null;

            const myCalls = calls.filter(
                (c: ParsedCall) =>
                    validContractAddress == validateAndParseAddress(c.contractAddress) || 
                    validContractAddress == validateAndParseAddress(c.calldata[8] ?? "0x0")
            );

            // Process events for the contract that is attached
            if (myCalls.length == 0) return null;

            const callData = new CallData(this.options.abi);

            let rawData: string[] = [];
            if( validContractAddress == validateAndParseAddress(myCalls[0].contractAddress)) {
                rawData = myCalls[0].calldata;
            } else if ( validContractAddress == validateAndParseAddress(myCalls[0].calldata[8])) {
                rawData = myCalls[0].calldata.slice(11, 25);
            }

            const decoded = callData.decodeParameters(
                this.options.decodeParameters,
                rawData
            ) as Array<any>;

            // note: hot fix to handle the conversion of starknet address from felt252
            for (let i = 0; i < this.options.decodeParameters.length; ++i) {
                if (
                    this.options.decodeParameters[i] ===
                    "core::starknet::contract_address::ContractAddress"
                ) {
                    const felt252 = decoded[i] as BigInt;
                    decoded[i] = "0x" + felt252.toString(16).padStart(64, "0");
                }
            }

            // Process possible token transfers in this multicall transaction
            const tokenTransfers = parseERC20Transfers(calls);

            return { raw: event, tx: receipt, decoded, tokenTransfers };
        } catch (e: any) {
            console.log(`Decoding error @ ${this.options.contractAddress}`);
            console.log(`Transaction hash: ${event.transaction_hash}`);
            console.log(e);
            return null;
        }
    }

    private async fetchTransaction(hash: string): Promise<StarknetTransaction> {
        const requestBody = {
            id: 1,
            jsonrpc: "2.0",
            method: "starknet_getTransactionByHash",
            params: [hash],
        };

        const res = await fetch(this.options.rpcUrl, {
            method: "POST",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        const txRes = (await res.json()) as StarknetTransaction;

        return txRes;
    }

    public start() {
        this.pollEvents();
        this.timer = setInterval(() => this.pollEvents(), this.pollingInterval);
    }

    public stop() {
        if (this.timer) clearInterval(this.timer);
    }
}
