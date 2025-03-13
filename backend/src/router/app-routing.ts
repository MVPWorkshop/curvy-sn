import { Router } from "express";
import { AppRoute } from "./app-route";
import { TestController } from "../controller/test-controller";
import { StarknetController } from "../controller/starknet-controller";
import announcerArtifact from "../artifacts/curvy_announcer_CurvyAnnouncerV0.contract_class.json";
import metaRegistryArtifact from "../artifacts/curvy_meta_registry_CurvyMetaRegistryV0.contract_class.json";

export class AppRouting {
    constructor(private route: Router) {
        this.route = route;
        this.configure();
    }

    public configure() {
        this.addRoute(new TestController());
        this.addRoute(
            new StarknetController({
                rpcUrl: process.env.RPC_URL!,
                announcer: {
                    rpcUrl: process.env.RPC_URL!,
                    contractAddress: process.env.ANNOUNCER_ADDRESS!,
                    fromBlock: 0,
                    chunkSize: 15,
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
                    fromBlock: 0,
                    chunkSize: 10,
                    abi: metaRegistryArtifact.abi,
                    decodeParameters: [
                        "core::felt252",
                        "core::byte_array::ByteArray",
                    ],
                },
                dbConfig: {
                    host: process.env.PGHOST!,
                    port: process.env.PGPORT
                        ? parseInt(process.env.PGPORT)
                        : 5432,
                    user: process.env.PGUSER!,
                    password: process.env.PGPASSWORD!,
                    database: process.env.PGDATABASE!,
                },
            })
        );
    }

    private addRoute(appRoute: AppRoute) {
        this.route.use(appRoute.route, appRoute.router);
    }
}
