export interface ParsedCall {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export interface TokenTransfer {
  recipient: string;
  amount: string;
  name: string;
  decimals: number;
  textAmount: string;
}

export interface ContractListenerOptions {
  contractAddress: string;
  fromBlock: number;
  chunkSize?: number;
  abiPath: string;
  decodeParameters: string[];
  eventName?: string;
}

export interface ContractEvent {
  block_hash: string;
  block_number: number;
  data: string[];
  from_address: string;
  keys: string[];
  transaction_hash: string;
}

interface StarknetResult {
  calldata: string[];
  max_fee: string;
  nonce: string;
  sender_address: string;
  signature: string[];
  transaction_hash: string;
  type: string;
  version: string;
}

export interface StarknetTransaction {
  jsonrpc: string;
  id: number;
  method: string;
  result: StarknetResult;
}

export interface IndexerOptions {
  chain: string;
  network: string;
  rpcUrl: string;
  announcer: ContractListenerOptions;
  metaRegistry: ContractListenerOptions;
}

export interface ListenerData {
  raw: ContractEvent;
  tx: StarknetTransaction;
  decoded: any;
  tokenTransfers: Array<TokenTransfer>;
}

export enum ChainEnum {
  StarknetMainnet = "starknet-mainnet",
  StarknetTestnet = "starknet-testnet"
}