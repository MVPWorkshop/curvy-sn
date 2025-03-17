import { Pool } from "pg";
import { ContractListener } from "../listener/contract-listener";
import { IndexerOptions, ListenerData } from "../types";
import { validateAndParseAddress, shortString } from "starknet";
import {
    isValidEphemeralPublicKey,
    isValidMetaAddress,
    isValidSECP256k1Point,
    isValidViewTag,
} from "../validation/curvy-utils";

export class Indexer {
    private pool: Pool;
    private announcerListener: ContractListener;
    private metaListener: ContractListener;
    private options: IndexerOptions;

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
        });

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
        const { raw, tx, decoded, tokenTransfers } = data;

        const ephemeralPublicKey = decoded[0];
        const viewTag = decoded[1];
        const stealthAccountPublicKey = decoded[2];
        const stealthAccountAddress = validateAndParseAddress(decoded[3]);

        // note: there can be multiple token transfer - TODO handle this in the future
        const amount =
            tokenTransfers.length != 0 ? tokenTransfers[0].textAmount : "0.0";
        const blockNumber = raw.block_number;
        const hash = raw.transaction_hash;
        const sender = validateAndParseAddress(tx.result.sender_address);

        let allDataIsValid =
            (await isValidEphemeralPublicKey(ephemeralPublicKey)) &&
            (await isValidViewTag(viewTag)) &&
            (await isValidSECP256k1Point(stealthAccountPublicKey));

        const query = `
          INSERT INTO announcements
              (sender, stealth_address, amount, ephemeral_public_key, view_tag, stealth_account_public_key, stealth_account_address, created_at, block_number, hash, all_data_is_valid)
          VALUES
              ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10)
          ON CONFLICT DO NOTHING;
        `;
        const values = [
            sender,
            stealthAccountAddress,
            amount,
            ephemeralPublicKey,
            viewTag,
            stealthAccountPublicKey,
            stealthAccountAddress,
            blockNumber,
            hash,
            allDataIsValid,
        ];

        console.log(`Inserting...`, { values });

        try {
            await this.pool.query(query, values);
            console.log(`Inserted announcement event ${hash}`);
        } catch (err) {
            console.error("Error inserting announcement event:", err);
        }
    }

    public async saveAnnouncementInfo(
        ephemeralPublicKey: string,
        viewTag: string,
        stealthAccountPublicKey: string,
        stealthAccountAddress: string
    ) {
        const query = `
          INSERT INTO announcements
              (sender, stealth_address, amount, ephemeral_public_key, view_tag, stealth_account_public_key, stealth_account_address, created_at, block_number, hash, all_data_is_valid)
          VALUES
              ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10)
          ON CONFLICT DO NOTHING;
        `;
        const values = [
            "no-sender-yet",
            stealthAccountAddress,
            "no-amount-yet",
            ephemeralPublicKey,
            viewTag,
            stealthAccountPublicKey,
            stealthAccountAddress,
            0,
            "no-hash-yet",
            true,
        ];

        console.log(`Inserting...`, { values });

        try {
            await this.pool.query(query, values);
            console.log(`Inserted announcement event`);
        } catch (err) {
            console.error("Error inserting announcement event:", err);
        }
    }

    private async handleMetaEvent(data: ListenerData) {
        const { raw, tx, decoded } = data;

        const metaId = shortString.decodeShortString(decoded[0].toString());
        const metaAddress = decoded[1];
        // note: can fail due to spam data
        const [spendingPublicKey, viewingPublicKey] = metaAddress.split(":::");
        if (spendingPublicKey === undefined || viewingPublicKey == undefined)
            return;
        const starknetAddress = validateAndParseAddress(
            tx.result.sender_address
        );
        const blockNumber = raw.block_number;
        const hash = raw.transaction_hash;

        const allDataIsValid = await isValidMetaAddress(metaAddress);

        const query = `
          INSERT INTO meta_addresses_registry
              (meta_id, starknet_address, spending_public_key, viewing_public_key, created_at, block_number, hash, all_data_is_valid)
          VALUES
              ($1, $2, $3, $4, NOW(), $5, $6, $7)
          ON CONFLICT DO NOTHING;
        `;
        const values = [
            metaId,
            starknetAddress,
            spendingPublicKey,
            viewingPublicKey,
            blockNumber,
            hash,
            allDataIsValid,
        ];

        console.log(`Inserting...`, { values });

        try {
            await this.pool.query(query, values);
            console.log(`Inserted meta event ${hash}`);
        } catch (err) {
            console.error("Error inserting meta event:", err);
        }
    }

    public async resolveMetaId(address: string) {
        const query = `
          SELECT meta_id 
          FROM meta_addresses_registry 
          WHERE starknet_address = $1 
          ORDER BY block_number DESC 
          LIMIT 1
        `;

        const result = await this.pool.query(query, [address]);
        return result.rows.length === 0 ? null : result.rows[0].meta_id;
    }

    public async checkMetaId(metaId: string) {
        const query = `
          SELECT spending_public_key, viewing_public_key
          FROM meta_addresses_registry
          WHERE meta_id = $1
          ORDER BY block_number DESC
          LIMIT 1
        `;

        const result = await this.pool.query(query, [metaId]);
        return result.rows.length === 0 ? null : result.rows[0];
    }

    public async getHistory(offset: number, size: number) {
        const query = `
          SELECT
              ephemeral_public_key AS "ephemeralKeys",
              view_tag AS "viewTag",
              stealth_address AS "stealthAddress"
          FROM announcements
          WHERE all_data_is_valid
          ORDER BY block_number DESC
          OFFSET $1 LIMIT $2
        `;

        const result = await this.pool.query(query, [offset, size]);
        return result.rows;
    }

    public async getHistoryCount() {
        const query = `SELECT COUNT(*) AS total FROM announcements`;

        const result = await this.pool.query(query);
        return parseInt(result.rows[0].total, 10);
    }

    public async getTransfers(addresses: string[]) {
        const query = `
            SELECT 
                sender AS address,
                hash AS "transactionHash",
                amount
            FROM announcements
            WHERE sender = ANY($1)
            ORDER BY block_number DESC
        `;

        const result = await this.pool.query(query, [addresses]);
        return result.rows;
    }
}
