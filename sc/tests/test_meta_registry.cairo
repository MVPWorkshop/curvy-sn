use starknet::{ContractAddress, get_caller_address};

use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, cheat_caller_address, CheatSpan};
use curvy_meta_registry::{
    ICurvyMetaRegistry_CoreDispatcher, ICurvyMetaRegistry_CoreDispatcherTrait,
    ICurvyMetaRegistry_CoreSafeDispatcher, ICurvyMetaRegistry_CoreSafeDispatcherTrait,
};

/// Test the successful registration of a new Meta Id
#[test]
fn test_registration() {
    let (contract_address, dispatcher, safe_dispatcher, caller) = basic_test_setup();

    cheat_caller_address(contract_address, caller, CheatSpan::TargetCalls(2));

    let meta_id = 'test.curvy';
    let meta_address = "...spending public key...:::...viewing public key...";
    dispatcher.register(meta_id, meta_address);

    assert(dispatcher.get_meta_id_owner(meta_id) == caller, 'ERR: Caller not owner!');
}

/// Test failing re-registration attempts of an existing Meta Id
#[test]
#[feature("safe_dispatcher")]
fn test_fail_re_registration() {
    let (contract_address, dispatcher, safe_dispatcher, caller) = basic_test_setup();

    cheat_caller_address(contract_address, caller, CheatSpan::TargetCalls(2));

    let meta_id = 'test.curvy';
    let meta_address = "...spending public key...:::...viewing public key...";
    safe_dispatcher.register(meta_id.clone(), meta_address.clone());

    assert(dispatcher.get_meta_id_owner(meta_id) == caller, 'ERR: Caller not owner!');

    // Try re-registering the meta id from the owner address
    let second_registration_result = safe_dispatcher
        .register(meta_id.clone(), meta_address.clone());
    assert_eq!(second_registration_result, Result::Err(array!['Meta ID exists!']));

    // Also try registering an existing meta id from a non-owner address
    let random_caller: ContractAddress = 33.try_into().unwrap();
    cheat_caller_address(contract_address, random_caller, CheatSpan::TargetCalls(1));
    let third_registration_result = safe_dispatcher.register(meta_id.clone(), meta_address.clone());
    assert_eq!(third_registration_result, Result::Err(array!['Meta ID exists!']));
}

/// Test the successful setting of a new Meta Address for existing Meta Id
#[test]
fn test_setting_meta_address() {
    let (contract_address, dispatcher, safe_dispatcher, caller) = basic_test_setup();

    cheat_caller_address(contract_address, caller, CheatSpan::TargetCalls(3));

    let meta_id = 'test.curvy';
    let meta_address = "...spending public key...:::...viewing public key...";
    dispatcher.register(meta_id.clone(), meta_address.clone());

    assert(dispatcher.get_meta_id_owner(meta_id) == caller, 'ERR: Caller not owner!');

    let new_meta_address = "...second spending public key...:::...second viewing public key...";
    dispatcher.set_meta_address(meta_id.clone(), new_meta_address);

    assert(dispatcher.get_meta_id_owner(meta_id) == caller, 'ERR: Caller not owner!');
}

/// Test failing to set a new Meta Address from non-owner
#[test]
#[feature("safe_dispatcher")]
fn test_fail_setting_meta_address() {
    let (contract_address, dispatcher, safe_dispatcher, caller) = basic_test_setup();

    cheat_caller_address(contract_address, caller, CheatSpan::TargetCalls(2));

    let meta_id = 'test.curvy';
    let meta_address = "...spending public key...:::...viewing public key...";
    safe_dispatcher.register(meta_id.clone(), meta_address.clone());

    assert(dispatcher.get_meta_id_owner(meta_id) == caller, 'ERR: Caller not owner!');

    let new_meta_address = "...second spending public key...:::...second viewing public key...";
    let failed_attempt_result = safe_dispatcher.set_meta_address(meta_id.clone(), new_meta_address);
    assert_eq!(failed_attempt_result, Result::Err(array!['Not the owner!']));
}

/// Test the successful transfer of an existing Meta Id
#[test]
fn test_transfer() {
    let (contract_address, dispatcher, safe_dispatcher, caller) = basic_test_setup();

    cheat_caller_address(contract_address, caller, CheatSpan::TargetCalls(3));

    let meta_id = 'test.curvy';
    let meta_address = "...spending public key...:::...viewing public key...";
    dispatcher.register(meta_id.clone(), meta_address.clone());

    assert(dispatcher.get_meta_id_owner(meta_id) == caller, 'ERR: Caller not owner!');

    let new_owner: ContractAddress = 33.try_into().unwrap();
    dispatcher.transfer_meta_id(meta_id.clone(), new_owner.clone());

    assert(dispatcher.get_meta_id_owner(meta_id) == new_owner, 'ERR: Transfer fail!');
}

/// Test the unsuccessful transfer of an existing Meta Id from a non-owner
#[test]
#[feature("safe_dispatcher")]
fn test_fail_unauthorized_transfer() {
    let (contract_address, dispatcher, safe_dispatcher, caller) = basic_test_setup();

    cheat_caller_address(contract_address, caller, CheatSpan::TargetCalls(3));

    let meta_id = 'test.curvy';
    let meta_address = "...spending public key...:::...viewing public key...";
    dispatcher.register(meta_id.clone(), meta_address.clone());

    assert(dispatcher.get_meta_id_owner(meta_id) == caller, 'ERR: Caller not owner!');

    let non_owner: ContractAddress = 33011.try_into().unwrap();
    cheat_caller_address(contract_address, non_owner, CheatSpan::TargetCalls(3));

    let new_owner: ContractAddress = 33.try_into().unwrap();
    let fail_transfer_result = safe_dispatcher.transfer_meta_id(meta_id.clone(), new_owner.clone());
    assert_eq!(fail_transfer_result, Result::Err(array!['Not the owner!']));
}


fn basic_test_setup() -> (
    ContractAddress,
    ICurvyMetaRegistry_CoreDispatcher,
    ICurvyMetaRegistry_CoreSafeDispatcher,
    ContractAddress,
) {
    let contract_address = deploy_contract("CurvyMetaRegistryV0");

    let dispatcher = ICurvyMetaRegistry_CoreDispatcher { contract_address };
    let safe_dispatcher = ICurvyMetaRegistry_CoreSafeDispatcher { contract_address };

    let caller: ContractAddress = 1301.try_into().unwrap();

    (contract_address, dispatcher, safe_dispatcher, caller)
}

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    contract_address
}
