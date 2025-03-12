import { EventEmitter } from "stream";

interface ContractListenerOptions {
    rpcUrl: string;
    contractAddress: string;
    fromBlock: number;
    chunkSize?: number;
    abi: any;
    decodeParameters: string[];
}

interface ContractEvent {
    block_hash: string;
    block_number: number;
    data: string[]
    from_address: string;
    keys: string[];
    transaction_hash: string;
}

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
        console.log(`polling for events of contract ${this.options.contractAddress}`)
        try {
            const reqBody = {
                id: 1,
                jsonrpc: "2.0",
                method: "starknet_getEvents",
                params: [
                    {
                        from_block: { block_number: this.lastBlock },
                        to_block: "latest",
                        address: this.options.contractAddress,
                        chunk_size: this.options.chunkSize || 10
                    }
                ]
            }

            const res = await fetch(this.options.rpcUrl, {
                method: "POST",
                headers: { "accept": "application/json", "content-type": "application/json" },
                body: JSON.stringify(reqBody),
            });

            const data = await res.json();
            const events = data.result?.events as ContractEvent[];

            if (events.length === 0) return;

            console.log(`found events for contract ${this.options.contractAddress}`)

            for (const event of events) {
                this.emit("event", { raw: event })
            }

            const latestEvent = events[events.length - 1];
            this.lastBlock = (latestEvent.block_number || this.lastBlock) + 1;
        } catch (e: any) {
            console.log(e);
        }
    }

    public start() {
        this.pollEvents()
        this.timer = setInterval(() => this.pollEvents(), this.pollingInterval)
    }

    public stop() {
        if (this.timer) clearInterval(this.timer)
    }
}