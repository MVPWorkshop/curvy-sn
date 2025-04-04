import { IndexerOptions } from "./types";
import path from "path";
import { readFileSync } from "fs";
export interface DBConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface CurrencyConfig {
  apiUrl: string;
  apiToken: string;
  intervalMs: number;
  chain: string;
}

export interface Config {
  database: DBConfig;
  jwtSecret: string;
  starknetCors: string;
  indexers: IndexerOptions[];
}

export function initConfig(): Config {
  const configPath = path.join(__dirname, "config.json");
  const rawData = readFileSync(configPath, "utf8");
  const config: Config = JSON.parse(rawData);
  return config;
}
