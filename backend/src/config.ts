import { IndexerOptions } from "./types";
import announcerArtifact from "./artifacts/curvy_announcer_CurvyAnnouncerV0.contract_class.json";
import metaRegistryArtifact from "./artifacts/curvy_meta_registry_CurvyMetaRegistryV0.contract_class.json";
export interface DBConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface Config {
  Database: DBConfig;
  JWTSecret: string;
  StarknetCors: string;
  StarknetOptions: {
    mainnet: IndexerOptions,
    testnet: IndexerOptions
  }
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


  const starknetTestnet = {
    rpcUrl: requireEnv("STARKNET_TEST_RPC_URL"),
    announcer: {
      rpcUrl: requireEnv("STARKNET_TEST_RPC_URL"),
      contractAddress: requireEnv("ANNOUNCER_ADDRESS_TEST"),
      fromBlock: -1,
      chunkSize: 1000,
      abi: announcerArtifact.abi,
      decodeParameters: [
        "core::byte_array::ByteArray",
        "core::byte_array::ByteArray",
        "core::byte_array::ByteArray",
        "core::starknet::contract_address::ContractAddress",
      ],
    },
    metaRegistry: {
      rpcUrl: requireEnv("STARKNET_TEST_RPC_URL"),
      contractAddress: requireEnv("META_REGISTRY_ADDRESS_TEST"),
      fromBlock: -1,
      chunkSize: 1000,
      abi: metaRegistryArtifact.abi,
      eventName: "MetaAddressSet",
      decodeParameters: [
        "core::felt252",
        "core::byte_array::ByteArray",
      ],
    },
    dbConfig,
  }

  const config: Config = {
    Database: dbConfig,
    JWTSecret: requireEnv("JWT_SECRET"),
    StarknetOptions: {
      mainnet: starknetTestnet,
      testnet: starknetTestnet,
    },
    StarknetCors: requireEnv("STARKNET_CORS")
  };

  return config;
}
