import { Pool } from "pg";
import { ContractListener } from "../listener/contract-listener"
import { IndexerOptions, ListenerData } from "../types";


export class Indexer {
    private pool: Pool;
    private announcerListener: ContractListener;
    private metaListener: ContractListener;
    private options: IndexerOptions

    constructor(options: IndexerOptions) {
        this.options = options;
        this.pool = new Pool(this.options.dbConfig);

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
        this.announcerListener.on("event", async (data: ListenerData) => {
            await this.handleAnnouncerEvent(data);
        });
        this.announcerListener.on("error", (err) => {
            console.error("Announcer Listener Error:", err);
        });
        this.announcerListener.start();

        // Subscribe to meta registry events.
        this.metaListener.on("event", async (data: ListenerData) => {
            await this.handleMetaEvent(data);
        });
        this.metaListener.on("error", (err) => {
            console.error("Meta Listener Error:", err);
        });
        this.metaListener.start();
    }

    private async handleAnnouncerEvent(data: ListenerData) {
        console.log("ANNOUNCER:", data)
        const { raw, tx, decoded } = data;

       const ephemeralPublicKey = decoded[0];
       const viewTag = decoded[1];
       const stealthAccountAddress = decoded[3];

       const amount = 0;
       const blockNumber = raw.block_number;
       const hash = raw.transaction_hash;
       const sender = tx.result.sender_address;

        const query = `
      INSERT INTO announcements
        (sender, stealth_address, amount, ephemeral_public_key, view_tag, created_at, block_number, hash)
      VALUES
        ($1, $2, $3, $4, $5, NOW(), $6, $7)
    `;
        const values = [sender, stealthAccountAddress, amount, ephemeralPublicKey, viewTag, blockNumber, hash];

        try {
            await this.pool.query(query, values);
            console.log(`Inserted announcement event ${hash}`);
        } catch (err) {
            console.error("Error inserting announcement event:", err);
        }
    }

    private async handleMetaEvent(data: ListenerData) {
        console.log("META:", data)
    }
}