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
    private interval: number; // ms
    private timer?: NodeJS.Timeout;

    constructor(currencyConfig: CurrencyConfig, dbConfig: DBConfig) {
        this.pool = new Pool(dbConfig);
        this.interval = currencyConfig.intervalMs;
        this.apiToken = currencyConfig.apiToken;
        this.apiUrl = currencyConfig.apiUrl;
    }

    /**
     * Fetch all tokens from the database.
     */
    private async fetchCurrenciesFromDb(): Promise<{ symbol: string }[]> {
        const query = `SELECT symbol FROM currency_prices`;
        const result = await this.pool.query(query);
        return result.rows;
    }

    /**
     * Update the database with the fetched token prices using their symbols.
     */
    public async updatePrices(): Promise<void> {
        try {
            const currencies = await this.fetchCurrenciesFromDb();
            const symbols = currencies.map((c) => c.symbol).join(",");
            if (!symbols) {
                console.log("No currencies found in the database.");
                return;
            }

            const url = `${this.apiUrl}/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`;
            const headers = {
                "Accept": "application/json",
                "X-CMC_PRO_API_KEY": this.apiToken,
            };

            const response = await fetch(url, { method: "GET", headers });
            if (!response.ok) {
                throw new Error(`Failed to fetch currency prices: ${response.statusText}`);
            }
            const data = await response.json();
            // data.data is an object keyed by token symbol.
            const updatedPrices = data.data;

            for (const symbol in updatedPrices) {
                const tokenData = updatedPrices[symbol];
                const price = tokenData.quote.USD.price;
                const query = `
          UPDATE currency_prices
          SET price = $1, updated_at = NOW()
          WHERE symbol = $2;
        `;
                const values = [price, symbol];
                await this.pool.query(query, values);
            }
            console.log(`Updated prices for ${Object.keys(updatedPrices).length} tokens.`);
        } catch (error) {
            console.error("Error updating currency prices:", error);
        }
    }

    public async getLatestPrices(): Promise<CurrencyPrice[]> {
        const query = `SELECT * FROM currency_prices ORDER BY updated_at DESC LIMIT 100`;
        const result = await this.pool.query(query);
        return result.rows;
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
