import { Pool } from "pg";
import { DBConfig } from "../config";

export type PublicKey = {
    curve: "SECP256k1" | "BabyJub" | "BN254";
    description: "Spending Pub. Key" | "Viewing Pub. Key";
    value: string;
};

export class ChainRepository {
    private pool: Pool;

    constructor(dbConfig: DBConfig) {
        this.pool = new Pool(dbConfig);
    }

    async registerMetaId(metaId: string, address: string, pubKeys: PublicKey[]): Promise<void> {
        const query = `
      INSERT INTO meta_addresses_registry (meta_id, address, pub_keys, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (meta_id) DO UPDATE SET 
        address = EXCLUDED.address,
        pub_keys = EXCLUDED.pub_keys,
        created_at = EXCLUDED.created_at
    `;
        await this.pool.query(query, [metaId, address, JSON.stringify(pubKeys)]);
    }

    async resolveMetaId(address: string): Promise<string | null> {
        const query = `
      SELECT meta_id FROM meta_addresses_registry 
      WHERE address = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
        const result = await this.pool.query(query, [address]);
        return result.rows.length ? result.rows[0].meta_id : null;
    }

    async getMetaById(metaId: string): Promise<PublicKey[] | null> {
        const query = `
      SELECT pub_keys FROM meta_addresses_registry 
      WHERE meta_id = $1
    `;
        const result = await this.pool.query(query, [metaId]);
        return result.rows.length ? result.rows[0].pub_keys : null;
    }

    async recordStealthInfo(
        chain: string,
        ephemeralPubKey: string,
        viewTag: string,
        stealthAccountPubKey: PublicKey,
        stealthAccountAddress: string
    ): Promise<void> {
        const query = `
      INSERT INTO announcements 
        (chain, stealth_address, stealth_pub_key, ephemeral_public_key, view_tag, created_at)
      VALUES 
        ($1, $2, $3, $4, $5, NOW())
    `;
        await this.pool.query(query, [
            chain,
            stealthAccountAddress,
            JSON.stringify(stealthAccountPubKey),
            ephemeralPubKey,
            viewTag,
        ]);
    }

    async getStealthInfo(offset: number, size: number): Promise<any[]> {
        const query = `
      SELECT 
        stealth_address AS "stealthAddress",
        stealth_pub_key AS "stealthAccountPubKey",
        ephemeral_public_key AS "ephemeralPubKey",
        view_tag AS "viewTag"
      FROM announcements
      ORDER BY created_at DESC
      OFFSET $1 LIMIT $2
    `;
        const result = await this.pool.query(query, [offset, size]);
        return result.rows;
    }
}
