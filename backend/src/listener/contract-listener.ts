import { CallData } from "starknet";
import { EventEmitter } from "stream";
import { ContractEvent, ContractListenerOptions, StarknetTransaction } from "../types";

export class ContractListener extends EventEmitter {
    private options: ContractListenerOptions;
    private pollingInterval: number;
    private lastBlock: number;
    private timer?: NodeJS.Timeout;

    constructor(options: ContractListenerOptions, pollingInterval = 5000) {
        super();
        this.options = options;
        this.pollingInterval = pollingInterval;
        this.lastBlock = options.fromBlock;
    }

    private async pollEvents() {
        console.log(`Polling events for contract ${this.options.contractAddress}`);
        try {
            const events = await this.fetchEvents();
            if (!events.length) return;

            for (const event of events) {
                const result = await this.processEvent(event);
                if (result) {
                    this.emit("event", result);
                }
            }

            const latestEvent = events[events.length - 1];
            this.lastBlock = (latestEvent.block_number || this.lastBlock) + 1;
        } catch (e: any) {
            this.emit("error", e);
            console.error(e);
        }
    }

    private async fetchEvents(): Promise<ContractEvent[]> {
        const reqBody = {
            id: 1,
            jsonrpc: "2.0",
            method: "starknet_getEvents",
            params: [
                {
                    from_block: { block_number: this.lastBlock },
                    to_block: "latest",
                    address: this.options.contractAddress,
                    chunk_size: this.options.chunkSize || 10,
                },
            ],
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
        return (data.result?.events || []) as ContractEvent[];
    }

    private async processEvent(event: ContractEvent): Promise<{ raw: ContractEvent; tx: StarknetTransaction; decoded: any } | null> {
        try {
            const receipt = await this.fetchTransaction(event.transaction_hash);
            const callData = new CallData(this.options.abi);
            const decodedData = receipt.result.calldata.slice(4);

            if (decodedData.length < this.options.decodeParameters.length) {
                console.error(
                    `Insufficient calldata length for event ${event.transaction_hash}: expected at least ${this.options.decodeParameters.length}, got ${decodedData.length}`
                );
                return null;
            }

            const decoded = callData.decodeParameters(this.options.decodeParameters, decodedData);
            return { raw: event, tx: receipt, decoded };
        } catch (e: any) {
            console.log(e)
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
            headers: { "accept": "application/json", "content-type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const txRes = await res.json() as StarknetTransaction;

        return txRes;
    }

    public start() {
        this.pollEvents()
        this.timer = setInterval(() => this.pollEvents(), this.pollingInterval)
    }

    public stop() {
        if (this.timer) clearInterval(this.timer)
    }
}