CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS meta_addresses_registry (
    meta_id VARCHAR(255) PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    pub_keys JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    chain VARCHAR(50) NOT NULL,
    stealth_address VARCHAR(255) NOT NULL,
    stealth_pub_key JSONB NOT NULL,
    ephemeral_public_key VARCHAR(255) NOT NULL,
    view_tag VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legacy table
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO currency_prices (id, name, symbol, price, updated_at)
VALUES 
  (1027, 'Ethereum', 'ETH', 2500, NOW()),
  (825, 'Tether USDt', 'USDT', 1.00, NOW()),
  (1839, 'Binance Coin', 'BNB', 300, NOW())
ON CONFLICT (id) DO NOTHING;