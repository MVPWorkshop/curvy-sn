import { Pool } from "pg";
import { DBConfig } from "../config";

interface PublicKey {
    curve: 'SECP256k1' | 'BabyJub' | 'BN254';
    description: 'Spending Pub. Key' | 'Viewing Pub. Key';
    value: string;
}

interface StealthPublicKey {
    curve: 'SECP256k1' | 'BabyJub' | 'BN254';
    value: string;
}

export class ChainRepository {
    private pool: Pool;

    constructor(dbConfig: DBConfig) {
        this.pool = new Pool(dbConfig);
    }

    public async registerMetaId(metaId: string, address: string, pubKeys: PublicKey[]): Promise<void> {
        const query = `
            INSERT INTO meta_addresses_registry (meta_id, address, pub_keys)
            VALUES ($1, $2, $3)
            ON CONFLICT (meta_id) DO UPDATE
            SET address = EXCLUDED.address,
                pub_keys = EXCLUDED.pub_keys;
        `;

        await this.pool.query(query, [metaId, address, JSON.stringify(pubKeys)]);
    }

    async resolveMetaId(address: string): Promise<{ metaId: string } | null> {
        const query = `SELECT meta_id FROM meta_addresses_registry WHERE address = $1`;
        const result = await this.pool.query(query, [address]);
        return result.rows[0] || null;
    }

    async getMetaIdInfo(metaId: string): Promise<{ pubKeys: PublicKey[] } | null> {
        const query = `SELECT pub_keys FROM meta_addresses_registry WHERE meta_id = $1`;
        const result = await this.pool.query(query, [metaId]);
        return result.rows[0] ? { pubKeys: result.rows[0].pub_keys } : null;
    }

    async recordStealthAddress(
        chain: string,
        stealthAddress: string,
        stealthPubKey: StealthPublicKey,
        ephemeralPublicKey: string,
        viewTag: string
    ): Promise<void> {
        const query = `
            INSERT INTO announcements (chain, stealth_address, stealth_pub_key, ephemeral_public_key, view_tag)
            VALUES ($1, $2, $3, $4, $5);
        `;
        await this.pool.query(query, [chain, stealthAddress, JSON.stringify(stealthPubKey), ephemeralPublicKey, viewTag]);
    }

    async fetchAnnouncements(offset: number, size: number): Promise<any[]> {
        const query = `
            SELECT ephemeral_public_key, view_tag, stealth_pub_key, stealth_address
            FROM announcements
            ORDER BY created_at DESC
            OFFSET $1 LIMIT $2;
        `;
        const result = await this.pool.query(query, [offset, size]);
        return result.rows;
    }
}