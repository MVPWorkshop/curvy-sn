CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS meta_addresses_registry (
    meta_id TEXT PRIMARY KEY,
    starknet_address CITEXT NOT NULL,
    spending_public_key CITEXT NOT NULL,
    viewing_public_key CITEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    block_number BIGINT NOT NULL,
    hash CITEXT NOT NULL,
    all_data_is_valid BOOLEAN NOT NULL,
    network CITEXT NOT NULL,
    chain CITEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    sender CITEXT NOT NULL,
    stealth_address CITEXT NOT NULL,
    amount TEXT NOT NULL,
    ephemeral_public_key CITEXT NOT NULL,
    view_tag CITEXT NOT NULL,
    stealth_account_public_key CITEXT NOT NULL,
    stealth_account_address CITEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    block_number BIGINT NOT NULL,
    hash CITEXT NOT NULL,
    all_data_is_valid BOOLEAN NOT NULL,
     network CITEXT NOT NULL,
    chain CITEXT NOT NULL,
    UNIQUE (stealth_account_address, ephemeral_public_key, stealth_account_public_key, view_tag)
);

CREATE TABLE IF NOT EXISTS indexer_progress (
    contract_address CITEXT NOT NULL,
    latest_block BIGINT NOT NULL,
    network CITEXT NOT NULL,
    chain CITEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS currency_prices (
    id INTEGER PRIMARY KEY,
    name CITEXT NOT NULL,
    symbol CITEXT NOT NULL,
    price NUMERIC NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    chain CITEXT NOT NULL
);