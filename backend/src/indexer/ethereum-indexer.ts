// @ts-nocheck
import { Pool } from "pg";
import { Indexer } from "./manager";

export class EthereumIndexer implements Indexer {
    private pool: Pool;
    private options: IndexerOptions;

    constructor(options: IndexerOptions) {
        this.options = options;
        this.pool = new Pool(this.options.dbConfig);
    }

    start(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    resolveMetaId(address: string): Promise<string | null> {
        throw new Error("Method not implemented.");
    }
    checkMetaId(metaId: string): Promise<{ spending_public_key: string; viewing_public_key: string; } | null> {
        throw new Error("Method not implemented.");
    }
    saveAnnouncementInfo(ephemeralPublicKey: string, viewTag: string, stealthAccountPublicKey: string, stealthAccountAddress: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getInfo(offset: number, size: number): Promise<any[]> {
        throw new Error("Method not implemented.");
    }
    getInfoCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }
    getTransfers(addresses: string[]): Promise<any[]> {
        throw new Error("Method not implemented.");
    }
    getProgress(contractAddress: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
    saveProgress(contractAddress: string, latestBlock: number): Promise<any> {
        throw new Error("Method not implemented.");
    }

}