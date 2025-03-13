import { Pool } from "pg";
import { ContractListener } from "../listener/contract-listener";
import { IndexerOptions, ListenerData } from "../types";

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
    const values = [
      sender,
      stealthAccountAddress,
      amount,
      ephemeralPublicKey,
      viewTag,
      blockNumber,
      hash,
    ];

    try {
      await this.pool.query(query, values);
      console.log(`Inserted announcement event ${hash}`);
    } catch (err) {
      console.error("Error inserting announcement event:", err);
    }
  }

  private async handleMetaEvent(data: any) {
    const { raw, tx, decoded } = data;

    const metaId = decoded[0];
    const starknetAddress = decoded[1];
    const spendingPublicKey = tx.result.sender_address || null;
    const viewingPublicKey = tx.result.signature
      ? tx.result.signature.join(",")
      : null;
    const blockNumber = raw.block_number;
    const hash = raw.transaction_hash;

    const query = `
          INSERT INTO meta_addresses_registry
            (meta_id, starknet_address, spending_public_key, viewing_public_key, created_at, block_number, hash)
          VALUES
            ($1, $2, $3, $4, NOW(), $5, $6)
        `;
    const values = [
      metaId,
      starknetAddress,
      spendingPublicKey,
      viewingPublicKey,
      blockNumber,
      hash,
    ];

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
    return result.rows.length === 0 ? null : result.rows[0].meta_id
  }
}
