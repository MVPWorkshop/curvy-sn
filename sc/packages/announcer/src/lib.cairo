/// Curvy Protocol V0: Announcer

use starknet::{ContractAddress, ClassHash, class_hash::{class_hash_const}};
use openzeppelin_account::interface::EthPublicKey;

#[starknet::contract(account)]
pub mod CurvyAnnouncerV0 {
    #[abi(embed_v0)]
    impl Core of super::ICurvyAnnouncerV0_Core<ContractState> {
        /// Announces a transfer to a stealth account (without deployment).
        /// Params:
        ///     ephemeral_key: Ephemeral public key used in the transfer
        ///     view_tag: View tag for the transfer
        ///     spending_pub_key: Recipient's spending public for the new stealth account
        ///     stealth_account_address: The address of the new stealth account
        /// Returns:
        ///     None
        fn announce_transfer_v0(
            ref self: ContractState,
            ephemeral_key: ByteArray,
            view_tag: ByteArray,
            spending_pub_key: ByteArray,
            stealth_account_address: ContractAddress,
        ) {
            self.emit(StealthTransfer { version: 0, address: stealth_account_address });
        }
    }

    use super::{ContractAddress};

    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        StealthTransfer: StealthTransfer,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StealthTransfer {
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
}
