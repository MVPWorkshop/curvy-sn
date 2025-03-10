use starknet::{ContractAddress, ClassHash, class_hash::{class_hash_const}};
use openzeppelin_account::interface::EthPublicKey;

#[starknet::contract(account)]
pub mod CurvyAnnouncerV0 {
    #[abi(embed_v0)]
    impl Core of super::ICurvyAnnouncerV0_Core<ContractState> {

        /// Announces a transfer to a stealth account (without deployment).
        fn announce_transfer_v0(
            ref self: ContractState,
            ephemeral_key: ByteArray,
            view_tag: ByteArray,
            spending_pub_key: ByteArray,
            stealth_account_address: ContractAddress,
        ) {
            self
                .emit(
                    AccountDeployed {
                        version: 0,
                        address: stealth_account_address,
                    },
                );
        }

        /// Deploys a new stealth account contract.
        fn announce_transfer_v1(
            ref self: ContractState, ephemeral_key: ByteArray, spending_pub_key: Span<felt252>,
        ) {
            let stealth_account_address = deploy_account(spending_pub_key);

            self
                .emit(
                    AccountDeployed {
                        version: 0,
                        address: stealth_account_address,
                    },
                );
        }

    }

    fn deploy_account(spending_pub_key: Span<felt252>) -> ContractAddress {
        let dispatcher = IUniversalDeployerDispatcher {
            contract_address: UDC_ADDRESS.try_into().unwrap(),
        };

        let class_hash = class_hash_const::<ACCOUNT_V0_CLASS_HASH>();

        // the UDC returns the deployed contract address
        dispatcher.deployContract(class_hash, 3327, true, spending_pub_key)
    }

    use super::{
        ContractAddress, ClassHash, IUniversalDeployer, IUniversalDeployerDispatcher, IUniversalDeployerDispatcherTrait,
        class_hash_const, EthPublicKey,
    };

    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    
    const UDC_ADDRESS: felt252 = 0x041a78e741e5af2fec34b695679bc6891742439f7afb8484ecd7766661ad02bf;
    const ACCOUNT_V0_CLASS_HASH: felt252 =
        0x3137c70385dbd5f78304b3926734368c7666a3ab731eb512ffeb867c1ef2b2b;

    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        AccountDeployed: AccountDeployed,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AccountDeployed {
        #[key]
        version: felt252,
        address: ContractAddress,
    }
}

#[starknet::interface]
trait ICurvyAnnouncerV0_Core<TContractState> {
    fn announce_transfer_v0(
        ref self: TContractState,
        ephemeral_key: ByteArray,
        view_tag: ByteArray,
        spending_pub_key: ByteArray,
        stealth_account_address: ContractAddress,
    );

    fn announce_transfer_v1(
        ref self: TContractState, ephemeral_key: ByteArray, spending_pub_key: Span<felt252>,
    );
}

#[starknet::interface]
trait IUniversalDeployer<TContractState> {
    fn deployContract(
        ref self: TContractState,
        class_hash: ClassHash,
        salt: felt252,
        unique: bool,
        calldata: Span<felt252>
    ) -> ContractAddress; 
}
