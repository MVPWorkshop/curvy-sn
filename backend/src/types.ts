export interface ContractListenerOptions {
    rpcUrl: string;
    contractAddress: string;
    fromBlock: number;
    chunkSize?: number;
    abi: any;
    decodeParameters: string[];
}

export interface ContractEvent {
    block_hash: string;
    block_number: number;
    data: string[]
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
    result: StarknetResult
}

export interface IndexerOptions {
    rpcUrl: string;
    dbConfig: DBConfig;
    announcer: ContractListenerOptions;
    metaRegistry: ContractListenerOptions;
}

export interface ListenerData { 
    raw: ContractEvent; 
    tx: StarknetTransaction; 
    decoded: any 
}

export interface DBConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}