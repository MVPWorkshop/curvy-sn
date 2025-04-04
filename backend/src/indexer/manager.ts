import { DBConfig } from "../config";
import { ChainEnum, IndexerOptions } from "../types";
import { EthereumIndexer } from "./ethereum-indexer";
import { StarknetIndexer } from "./starknet-indexer";

export interface Indexer {
    /**
     * Starts the indexer (initializes listeners and begins polling).
     */
    start(): Promise<void>;

    /**
     * Resolves a meta ID based on the given Starknet address.
     * @param address - A Starknet address as a string.
     * @returns A Promise that resolves to the meta ID or null if not found.
     */
    resolveMetaId(address: string): Promise<string | null>;

    /**
     * Checks if a meta ID exists and returns the associated spending and viewing public keys.
     * @param metaId - The meta ID to check.
     * @returns A Promise that resolves to an object containing spending and viewing public keys or null if not found.
     */
    checkMetaId(metaId: string): Promise<{ spending_public_key: string; viewing_public_key: string } | null>;

    /**
     * Saves announcement information for a given stealth account.
     * @param ephemeralPublicKey - The ephemeral public key.
     * @param viewTag - The view tag.
     * @param stealthAccountPublicKey - The stealth account's public key.
     * @param stealthAccountAddress - The stealth account's address.
     */
    saveAnnouncementInfo(
        ephemeralPublicKey: string,
        viewTag: string,
        stealthAccountPublicKey: string,
        stealthAccountAddress: string
    ): Promise<void>;

    /**
     * Retrieves announcement history (e.g., stealth info) with pagination.
     * @param offset - The starting offset.
     * @param size - The number of records to return.
     * @returns A Promise that resolves to an array of records.
     */
    getInfo(offset: number, size: number): Promise<any[]>;

    /**
     * Retrieves the total count of announcement history records.
     * @returns A Promise that resolves to the total number of records.
     */
    getInfoCount(): Promise<number>;

    /**
     * Retrieves transfers for a list of addresses.
     * @param addresses - An array of Starknet addresses.
     * @returns A Promise that resolves to an array of transfer records.
     */
    getTransfers(addresses: string[]): Promise<any[]>;

    /**
     * (Optional) Retrieves the progress for a given contract.
     * @param contractAddress - The contract address.
     * @returns A Promise resolving to progress details.
     */
    getProgress(contractAddress: string): Promise<any>;

    /**
     * (Optional) Saves the progress (latest block) for a given contract.
     * @param contractAddress - The contract address.
     * @param latestBlock - The latest block number.
     * @returns A Promise resolving when progress is saved.
     */
    saveProgress(contractAddress: string, latestBlock: number): Promise<any>;
}

export class IndexerManager {
    private options: { [chain: string]: IndexerOptions };
    private indexers: { [chain: string]: Indexer } = {};

    constructor(options: { [chain: string]: IndexerOptions }, dbConfig: DBConfig) {
        this.options = options;
        // Eagerly initialize all indexers
        for (const chain in options) {
            this.indexers[chain] = this.initializeIndexer(chain, dbConfig);
        }
    }

    private initializeIndexer(chain: string, dbConfig: DBConfig): Indexer {
        const opts = this.options[chain];
        if (!opts) {
            throw new Error(`No indexer options configured for chain: ${chain}`);
        }
        let indexer: Indexer;
        if (chain === ChainEnum.StarknetMainnet || chain === ChainEnum.StarknetTestnet) {
            indexer = new StarknetIndexer(opts, dbConfig, chain);
        } else if (chain === "ethereum") {
            indexer = new EthereumIndexer(opts);
        } else {
            throw new Error(`Unsupported chain: ${chain}`);
        }
        indexer.start();
        return indexer;
    }

    public getIndexer(chain: string): Indexer {
        const indexer = this.indexers[chain];
        if (!indexer) {
            throw new Error(`No indexer found for chain: ${chain}`);
        }
        return indexer;
    }
}
