import { CurrencyConsumer } from "./currencies/consumer";

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
  Database: DBConfig;
  AccountClassHash: string;
  AnnouncerAddress: string;
  MetaRegistryAddress: string;
  RpcUrl: string;
  JWTSecret: string;
  StarknetCors: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function initConfig(): Config {
  const dbConfig: DBConfig = {
    host: requireEnv("PGHOST"),
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
    user: requireEnv("PGUSER"),
    password: requireEnv("PGPASSWORD"),
    database: requireEnv("PGDATABASE"),
  };

  const config: Config = {
    Database: dbConfig,
    AccountClassHash: requireEnv("CURVY_ACCOUNT_CLASS_HASH"),
    AnnouncerAddress: requireEnv("ANNOUNCER_ADDRESS"),
    MetaRegistryAddress: requireEnv("META_REGISTRY_ADDRESS"),
    RpcUrl: requireEnv("RPC_URL"),
    JWTSecret: requireEnv("JWT_SECRET"),
    StarknetCors: requireEnv("STARKNET_CORS"),
  };

  const ethereumConsumer = new CurrencyConsumer({
    apiToken: "50166d1f-013b-425b-82c6-7a92a90e88f5",
    apiUrl: "https://pro-api.coinmarketcap.com/v1",
    chain: "Ethereum",
    intervalMs: 3000,
  }, dbConfig);

  ethereumConsumer.start();

  const starknetConsumer = new CurrencyConsumer({
    apiToken: "50166d1f-013b-425b-82c6-7a92a90e88f5",
    apiUrl: "https://pro-api.coinmarketcap.com/v1",
    chain: "Starknet",
    intervalMs: 3000,
  }, dbConfig);

  starknetConsumer.start();
  
  return config;
}
