/// Curvy Protocol V0: Meta Registry Contract
use starknet::{ContractAddress};

#[starknet::contract]
pub mod CurvyMetaRegistryV0 {
    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl Core of super::ICurvyMetaRegistry_Core<ContractState> {
        /// Registers a new (available) Meta Id and ties it to the caller
        /// Dev: Reverts if the Meta Id already exists
        /// Params:
        ///     meta_id: Id to be registered
        ///     meta_address: Meta Address that contains both spending and viewing public key
        /// Returns:
        ///     None
        fn register(ref self: ContractState, meta_id: felt252, meta_address: ByteArray) {
            assert(self.get_meta_id_owner(meta_id).is_zero(), 'Meta ID exists!');

            let caller = get_caller_address();

            self.meta_id_owner.write(meta_id.into(), caller);

            self.emit(MetaAddressSet { meta_id, owner: caller });
        }

        /// Sets Meta Address to a new value for a passed down Meta Id
        /// Dev: Reverts if caller is not the owner of that id
        /// Params:
        ///     meta_id: Id to be registered
        ///     meta_address: Meta Address that contains both spending and viewing public key
        /// Returns:
        ///     None
        fn set_meta_address(ref self: ContractState, meta_id: felt252, meta_address: ByteArray) {
            let caller = get_caller_address();

            assert(self.get_meta_id_owner(meta_id) == caller, 'Not the owner!');

            self.emit(MetaAddressSet { meta_id, owner: caller });
        }

        /// Returns the owner of the passed down Meta Id
        /// Params:
        ///     meta_id: Id for which to return the owner
        /// Returns:
        ///     ContractAddress: Meta Id's owner address
        fn get_meta_id_owner(self: @ContractState, meta_id: felt252) -> ContractAddress {
            self.meta_id_owner.read(meta_id)
        }

        /// Transfer the ownership of the Meta Id to someone else
        /// Dev: Reverts if the caller is not the current owner
        /// Params:
        ///     meta_id: Id that will be transfered
        ///     new_owner: Address of the new owner
        /// Returns:
        ///     None
        fn transfer_meta_id(ref self: ContractState, meta_id: felt252, new_owner: ContractAddress) {
            let caller = get_caller_address();

            assert(self.get_meta_id_owner(meta_id) == caller, 'Not the owner!');

            self.meta_id_owner.write(meta_id.into(), new_owner);

            self.emit(MetaIdTransfered { meta_id, old_owner: caller, new_owner });
        }
    }

    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        /// Meta ID mapping to the owner
        pub meta_id_owner: Map<felt252, ContractAddress>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        MetaAddressSet: MetaAddressSet,
        MetaIdTransfered: MetaIdTransfered,
    }

    #[derive(Drop, starknet::Event)]
    pub struct MetaAddressSet {
        meta_id: felt252,
        owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct MetaIdTransfered {
        meta_id: felt252,
        old_owner: ContractAddress,
        new_owner: ContractAddress,
    }
}


#[starknet::interface]
pub trait ICurvyMetaRegistry_Core<TContractState> {
    fn register(ref self: TContractState, meta_id: felt252, meta_address: ByteArray);

    fn set_meta_address(ref self: TContractState, meta_id: felt252, meta_address: ByteArray);

    fn get_meta_id_owner(self: @TContractState, meta_id: felt252) -> ContractAddress;

    fn transfer_meta_id(ref self: TContractState, meta_id: felt252, new_owner: ContractAddress);
}
