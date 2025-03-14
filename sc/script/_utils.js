import {
    json,
    Contract,
    Account,
    RpcProvider,
    CallData,
    stark,
} from "starknet";
import fs from "fs";
import path from "path";
import "dotenv/config";

const provider = new RpcProvider({ nodeUrl: process.env.NODE_URL });

export const initDeployerAccount = () => {
    const privateKey = process.env.PRIVATE_KEY;
    const accountAddress = process.env.ACCOUNT_ADDRESS;
    const account = new Account(provider, accountAddress, privateKey);

    return { provider, account };
};

export const declareAllContracts = async (account) => {
    const directoryPath = "./target/dev";

    const allContracts = fs.readdirSync(directoryPath);

    const rawArtifacts = [];
    for (const file of allContracts) {
        if (file.endsWith("compiled_contract_class.json")) {
            const contract = json.parse(
                fs
                    .readFileSync(
                        path.join(directoryPath, file.replace("compiled_", ""))
                    )
                    .toString("ascii")
            );
            const casm = json.parse(
                fs
                    .readFileSync(path.join(directoryPath, file))
                    .toString("ascii")
            );

            const class_hash = await declareContract(account, contract, casm);
            rawArtifacts.push({
                class_hash,
                name: file.replace(".compiled_contract_class.json", ""),
                contract,
                casm,
            });
        }
    }

    const announcer = rawArtifacts.filter(
        (e) => e.name == "curvy_announcer_CurvyAnnouncerV0"
    )[0];
    const metaRegistry = rawArtifacts.filter(
        (e) => e.name == "curvy_meta_registry_CurvyMetaRegistryV0"
    )[0];
    const curvyAccount = rawArtifacts.filter(
        (e) => e.name == "curvy_account_CurvyAccountV0"
    )[0];

    return { announcer, metaRegistry, curvyAccount, rawArtifacts };
};

export const declareContract = async (account, contract, casm) => {
    let class_hash;
    try {
        const declareResponse = await account.declareIfNot({
            contract,
            casm,
        });

        class_hash = declareResponse.class_hash;
        // console.log("Declared contract", class_hash);
        // await provider.waitForTransaction(declareResponse.transaction_hash);
    } catch (e) {
        console.log("Error when declaring contract", e);
    }

    return class_hash;
};

export const deployProtocol = async (account, artifacts) => {
    const deployResponse = {
        announcer: await account.deployContract(
            {
                classHash: artifacts.announcer.class_hash,
            },
            {
                maxFee: stark.estimatedFeeToMaxFee(4434496044436, 100000),
            }
        ),
        metaRegistry: await account.deployContract(
            {
                classHash: artifacts.metaRegistry.class_hash,
            },
            {
                maxFee: stark.estimatedFeeToMaxFee(4434496044436, 100000),
            }
        ),
    };

    const contracts = {
        announcer: new Contract(
            artifacts.announcer.contract.abi,
            deployResponse.announcer.address,
            account
        ),
        metaRegistry: new Contract(
            artifacts.metaRegistry.contract.abi,
            deployResponse.metaRegistry.address,
            account
        ),
    };

    return { deployResponse, contracts };
};
