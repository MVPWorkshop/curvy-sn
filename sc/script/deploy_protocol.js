import "dotenv/config";

import {
    initDeployerAccount,
    declareAllContracts,
    deployProtocol,
} from "./_utils.js";

const { account, provider } = initDeployerAccount();

const declaredContracts = await declareAllContracts(account);

console.log({ declaredContracts });

const deployed = await deployProtocol(account, declaredContracts);

console.log({ deployed });
