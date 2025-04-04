/// Curvy Protocol V0: Account

#[starknet::contract(account)]
pub mod CurvyAccountV0 {
    /// Constructor
    /// Params:
    ///     public_key: Ethereum SECP256k1 public key
    #[constructor]
    fn constructor(ref self: ContractState, public_key: EthPublicKey) {
        self.eth_account.initializer(public_key);
    }

    use openzeppelin_account::EthAccountComponent;
    use openzeppelin_account::interface::EthPublicKey;
    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: EthAccountComponent, storage: eth_account, event: EthAccountEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // EthAccount Mixin
    #[abi(embed_v0)]
    impl EthAccountMixinImpl =
        EthAccountComponent::EthAccountMixinImpl<ContractState>;
    impl EthAccountInternalImpl = EthAccountComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        eth_account: EthAccountComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        EthAccountEvent: EthAccountComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }
}


pub mod CurvyAccountV0Types {
    pub use openzeppelin_account::interface::EthPublicKey;
}
