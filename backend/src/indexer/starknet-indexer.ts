// import { Pool } from "pg";
import { ContractListener, ContractListenerOptions } from "../listener/contract-listener";

interface DBConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}

export interface IndexerOptions {
    rpcUrl: string;
    dbConfig: DBConfig;
    announcer: ContractListenerOptions;
    metaRegistry: ContractListenerOptions;
}

export class Indexer {
    // private pool: Pool;
    private announcerListener: ContractListener;
    private metaListener: ContractListener;
    // private options: IndexerOptions

    constructor(options: IndexerOptions) {
        // this.options = options;
        // this.pool = new Pool(this.options.dbConfig);

        this.announcerListener = new ContractListener({
            rpcUrl: options.rpcUrl,
            contractAddress: options.announcer.contractAddress,
            fromBlock: options.announcer.fromBlock,
            abi: options.announcer.abi,
            decodeParameters: options.announcer.decodeParameters,
            chunkSize: options.announcer.chunkSize,
        })

        this.metaListener = new ContractListener({
            rpcUrl: options.rpcUrl,
            contractAddress: options.metaRegistry.contractAddress,
            fromBlock: options.metaRegistry.fromBlock,
            abi: options.metaRegistry.abi,
            decodeParameters: options.metaRegistry.decodeParameters,
            chunkSize: options.metaRegistry.chunkSize,
        });
    }

    public start() {
        // Subscribe to announcer events.
        this.announcerListener.on("event", async (data) => {
            await this.handleAnnouncerEvent(data);
        });
        this.announcerListener.on("error", (err) => {
            console.error("Announcer Listener Error:", err);
        });
        this.announcerListener.start();

        // Subscribe to meta registry events.
        this.metaListener.on("event", async (data) => {
            await this.handleMetaEvent(data);
        });
        this.metaListener.on("error", (err) => {
            console.error("Meta Listener Error:", err);
        });
        this.metaListener.start();
    }

    private async handleAnnouncerEvent(data: any) {
        console.log("ANNOUNCER:",data)
    }

    private async handleMetaEvent(data: any) {
        console.log("META:", data)
    }
}