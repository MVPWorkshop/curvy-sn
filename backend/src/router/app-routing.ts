import { Router } from "express";
import { AppRoute } from "./app-route";
import { StarknetController } from "../controller/starknet-controller";
import announcerArtifact from "../artifacts/curvy_announcer_CurvyAnnouncerV0.contract_class.json";
import metaRegistryArtifact from "../artifacts/curvy_meta_registry_CurvyMetaRegistryV0.contract_class.json";
import { Config } from "../config";

export class AppRouting {
    constructor(private route: Router, private config: Config) {
        this.route = route;
        this.configure();
    }

    public configure() {
        this.addRoute(
            new StarknetController(
                {
                    rpcUrl: this.config.RpcUrl,
                    announcer: {
                        rpcUrl: process.env.RPC_URL!,
                        contractAddress: process.env.ANNOUNCER_ADDRESS!,
                        fromBlock: -1,
                        chunkSize: 1000,
                        abi: announcerArtifact.abi,
                        decodeParameters: [
                            "core::byte_array::ByteArray",
                            "core::byte_array::ByteArray",
                            "core::byte_array::ByteArray",
                            "core::starknet::contract_address::ContractAddress",
                        ],
                    },
                    metaRegistry: {
                        rpcUrl: process.env.RPC_URL!,
                        contractAddress: process.env.META_REGISTRY_ADDRESS!,
                        fromBlock: -1,
                        chunkSize: 1000,
                        abi: metaRegistryArtifact.abi,
                        eventName: "MetaAddressSet",
                        decodeParameters: [
                            "core::felt252",
                            "core::byte_array::ByteArray",
                        ],
                    },
                    dbConfig: this.config.Database,
                },
                this.config.StarknetCors
            )
        );
    }

    private addRoute(appRoute: AppRoute) {
        this.route.use(appRoute.route, appRoute.router);
    }
}
