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
    private announcerListener: ContractListener | any;
    private metaListener: ContractListener | any;
    private options: IndexerOptions;

    constructor(options: IndexerOptions) {
        this.options = options;
        this.pool = new Pool(this.options.dbConfig);
    }
    public async start() {
        this.announcerListener = new ContractListener({
            rpcUrl: this.options.rpcUrl,
            contractAddress: this.options.announcer.contractAddress,
            fromBlock: await this.determineActualFromBlock(
                this.options.announcer.contractAddress
            ),
            abi: this.options.announcer.abi,
            decodeParameters: this.options.announcer.decodeParameters,
            chunkSize: this.options.announcer.chunkSize,
        });

        this.metaListener = new ContractListener({
            rpcUrl: this.options.rpcUrl,
            contractAddress: this.options.metaRegistry.contractAddress,
            fromBlock: await this.determineActualFromBlock(
                this.options.metaRegistry.contractAddress
            ),
            abi: this.options.metaRegistry.abi,
            decodeParameters: this.options.metaRegistry.decodeParameters,
            chunkSize: this.options.metaRegistry.chunkSize,
            eventName: this.options.metaRegistry.eventName,
        });

        // Subscribe to announcer events.
        this.announcerListener.on("event", async (data: ListenerData) => {
            await this.handleAnnouncerEvent(data);
        });
        this.announcerListener.on(
            "latest_block",
            async (latestBlock: number) => {
                await this.saveProgress(
                    this.options.announcer.contractAddress,
                    latestBlock
                );
            }
        );
        this.announcerListener.on("error", (err: Error) => {
            console.error("Announcer Listener Error:", err);
        });
        this.announcerListener.start();

        // Subscribe to meta registry events.
        this.metaListener.on("event", async (data: ListenerData) => {
            await this.handleMetaEvent(data);
        });
        this.metaListener.on("latest_block", async (latestBlock: number) => {
            await this.saveProgress(
                this.options.metaRegistry.contractAddress,
                latestBlock
            );
        });
        this.metaListener.on("error", (err: Error) => {
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

        try {
            await this.pool.query(query, values);
            // console.log(`Inserted announcement event ${hash}`);
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

        try {
            await this.pool.query(query, values);
            // console.log(`Inserted announcement event`);
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
          ON CONFLICT (meta_id) DO UPDATE SET
              starknet_address = EXCLUDED.starknet_address,
              spending_public_key = EXCLUDED.spending_public_key,
              viewing_public_key = EXCLUDED.viewing_public_key,
              created_at = EXCLUDED.created_at,
              block_number = EXCLUDED.block_number,
              hash = EXCLUDED.hash,
              all_data_is_valid = EXCLUDED.all_data_is_valid;
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

        try {
            await this.pool.query(query, values);
            // console.log(`Inserted meta event ${hash}`);
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

    public async getInfo(offset: number, size: number) {
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

    public async getInfoCount() {
        const query = `SELECT COUNT(*) AS total FROM announcements WHERE all_data_is_valid`;

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

    public async getProgress(contractAddress: string) {
        const query = `
            SELECT * FROM indexer_progress
            WHERE contract_address = TEXT($1)
        `;

        const result = await this.pool.query(query, [contractAddress]);
        return result;
    }

    private async determineActualFromBlock(
        contractAddress: string
    ): Promise<number> {
        const insertQuery = `
            INSERT INTO indexer_progress
                (contract_address, latest_block)
            VALUES
                ($1, $2)
            ON CONFLICT DO NOTHING;
        `;

        const res = await this.getProgress(contractAddress);
        if (res.rows.length === 0) {
            // Initial start - no record in the DB
            await this.pool.query(insertQuery, [contractAddress, 0]);
            return 0;
        }

        return res.rows[0].latest_block;
    }

    public async saveProgress(contractAddress: string, latestBlock: number) {
        const query = `
            UPDATE indexer_progress
                SET latest_block = ${latestBlock}
            WHERE contract_address = TEXT($1);
        `;

        const result = await this.pool.query(query, [contractAddress]);
        return result;
    }
}
