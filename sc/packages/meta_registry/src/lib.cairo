#[starknet::contract]
mod CurvyMetaRegistryV0 {
    #[constructor]
    fn constructor(ref self: ContractState) {
        let name = "CurvyMetaRegistryV0";
        let symbol = "CMRV0";
        let base_uri = "https://cmr.0xcurvy.io/v0/";

        self.erc721.initializer(name, symbol, base_uri);
    }

    #[abi(embed_v0)]
    impl Core of super::ICurvyMetaRegistry_Core<ContractState> {
        fn register(ref self: ContractState, meta_id: felt252, meta_address: ByteArray) {
            // let owner_of_meta_id = self.erc721.owner_of(meta_id.into());

            // assert(owner_of_meta_id.is_zero(), 'Meta ID already registered');

            // let recipient = get_caller_address();

            self.meta_addresses.write(meta_id.into(), meta_address.clone());
            // self.erc721.mint(recipient, meta_id.into());

            self.emit(MetaIdRegistered{meta_id});
        }

        fn set_meta_address(ref self: ContractState, meta_id: felt252, meta_address: ByteArray) {
            // assert(
            //     self.erc721.owner_of(meta_id.into()) == get_caller_address(),
            //     'Not the owner of Meta ID',
            // );

            self.meta_addresses.write(meta_id.into(), meta_address.clone());
        }
    }

    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::{ContractAddress, get_caller_address};

    use core::num::traits::Zero;
    use core::poseidon::PoseidonTrait;
    use core::hash::{HashStateTrait, HashStateExTrait};

    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721 Mixin
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        /// Meta ID mapping to Meta Address
        pub meta_addresses: Map<u256, ByteArray>,

        pub meta_id_counter: felt252,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,

        MetaIdRegistered: MetaIdRegistered,
    }

    #[derive(Drop, starknet::Event)]
    pub struct MetaIdRegistered {
        meta_id: felt252,
    }
}


#[starknet::interface]
trait ICurvyMetaRegistry_Core<TContractState> {
    fn register(ref self: TContractState, meta_id: felt252, meta_address: ByteArray);

    fn set_meta_address(ref self: TContractState, meta_id: felt252, meta_address: ByteArray);
}
