CREATE TABLE IF NOT EXISTS meta_addresses_registry (
    meta_id TEXT PRIMARY KEY,
    starknet_address TEXT NOT NULL,
    spending_public_key TEXT NOT NULL,
    viewing_public_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    block_number BIGINT NOT NULL,
    hash TEXT NOT NULL,
    all_data_is_valid BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    sender TEXT NOT NULL,
    stealth_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    ephemeral_public_key TEXT NOT NULL,
    view_tag TEXT NOT NULL,
    stealth_account_public_key TEXT NOT NULL,
    stealth_account_address TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    block_number BIGINT NOT NULL,
    hash TEXT NOT NULL,
    all_data_is_valid BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS indexer_progress (
    contract_address TEXT NOT NULL,
    latest_block BIGINT NOT NULL
);