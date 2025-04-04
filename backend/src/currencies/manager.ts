import { Pool } from "pg";
import { CurrencyConfig, DBConfig } from "../config";

export interface CurrencyPrice {
    id: number;
    name: string;
    symbol: string;
    price: number;
}

export class CurrencyManager {
    private apiUrl: string;
    private apiToken: string;
    private pool: Pool;
    private interval: number;
    private chain: string;
    private timer?: NodeJS.Timeout;

    constructor(currencyConfig: CurrencyConfig, dbConfig: DBConfig) {
        this.pool = new Pool(dbConfig);
        this.interval = currencyConfig.intervalMs;
        this.apiToken = currencyConfig.apiToken;
        this.apiUrl = currencyConfig.apiUrl;
        this.chain = currencyConfig.chain.toLowerCase();
    }

    /**
     * Fetch the top 100 token prices from CoinMarketCap, filtering by ecosystem.
     */
    public async fetchPrices(): Promise<CurrencyPrice[]> {
        const url = `${this.apiUrl}/cryptocurrency/listings/latest?start=1&limit=100&convert=USD`;
        const headers = {
            "Accept": "application/json",
            "X-CMC_PRO_API_KEY": this.apiToken,
        };

        const response = await fetch(url, { method: "GET", headers });
        if (!response.ok) {
            throw new Error(`Failed to fetch currency prices: ${response.statusText}`);
        }
        const data = await response.json();
        let tokens = data.data as any[];


        tokens = tokens.filter((token) => {
            // First try to match using the platform name
            if (token.platform && token.platform.name) {
              if (token.platform.name.toLowerCase() === this.chain) {
                return true;
              }
            }
            // If platform check fails, as a last resort try to match using token name
            return token.name && token.name.toLowerCase() === this.chain;
          })

        const prices: CurrencyPrice[] = tokens.map((item) => ({
            id: item.id,
            name: item.name,
            symbol: item.symbol,
            price: item.quote.USD.price,
        }));

        return prices;
    }

    /**
     * Update the database with the fetched token prices, inserting or updating the chain column.
     */
    public async updatePrices(): Promise<void> {
        try {
            const prices = await this.fetchPrices();
            for (const token of prices) {
                const query = `
              INSERT INTO currency_prices (id, name, symbol, price, updated_at, chain)
              VALUES ($1, $2, $3, $4, NOW(), $5)
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                symbol = EXCLUDED.symbol,
                price = EXCLUDED.price,
                updated_at = EXCLUDED.updated_at,
                chain = EXCLUDED.chain;
            `;
                const values = [token.id, token.name, token.symbol, token.price, this.chain];
                await this.pool.query(query, values);
            }
            console.log(`Updated ${prices.length} prices for chain: ${this.chain}`);
        } catch (error) {
            console.error("Error updating currency prices:", error);
        }
    }

    /**
     * Start the periodic refresh process.
     */
    public start(): void {
        // Immediately update once, then schedule periodic updates.
        this.updatePrices();
        this.timer = setInterval(() => this.updatePrices(), this.interval);
    }

    /**
     * Stop the periodic refresh process.
     */
    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }
}