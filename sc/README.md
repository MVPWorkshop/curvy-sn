starkli account fetch 0x00512f54444f45af3497bcb270f112c9044739b535c3e31fb46703e8d45d9c40 --output ./deployer.account.json

starkli declare target/dev/curvy_sn_prototype_MyEthAccount.contract_class.json --network=sepolia --account ./deployer.account.json --private-key $PRIVATE_KEY

sncast \
 account create \
 --name prototype_0 \
 --url https://free-rpc.nethermind.io/sepolia-juno/v0_7 \
 --class-hash 0x86aad74ef169e5e50d3ec64006ad2f11d4275859ccbea57e28a2b147021774

//build complete workspace
scarb build -w
