import {
  ec,
  hash,
  num,
  json,
  Contract,
  EthSigner,
  CallData,
  Account,
  RpcProvider,
  stark,
  cairo,
  eth,
} from "starknet";

import "dotenv/config";

import {
  initDeployerAccount,
  declareAllContracts,
  deployProtocol,
} from "./_utils.js";

const { account, provider } = initDeployerAccount();

const declaredContracts = await declareAllContracts(account);

console.log({ declaredContracts });

await deployProtocol(account, declaredContracts);
