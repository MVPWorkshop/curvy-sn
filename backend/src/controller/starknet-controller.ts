import { Router, Request, Response } from "express";
import { AppRoute } from "../router/app-route";
import { validateAndParseAddress } from "starknet";
import cors from "cors";
import {
    isValidEphemeralPublicKey,
    isValidSECP256k1Point,
    isValidViewTag,
} from "../validation/curvy-utils";
import { authenticateToken } from "../middlewares/jwt-auth";
import { IndexerManager } from "../indexer/manager";

export class StarknetController implements AppRoute {
    public route: string = "/starknet";
    router: Router = Router();
    indexerManager: IndexerManager;

    constructor(manager: IndexerManager, corsOrigin: string) {
        this.indexerManager = manager;

        this.router.use(cors({ origin: corsOrigin }));
        this.router.use(authenticateToken);

        //endpoint
        this.router.get("/:network/checkmeta/:metaId", (request, response) => {
            this.checkEndpoint(request, response);
        });

        this.router.get("/:network/resolve/:address", (req, res) => {
            this.resolveMetaId(req, res);
        });

        this.router.post("/:network/recordstealthinfo", (req, res) => {
            this.recordStealthInfo(req, res);
        });

        this.router.get("/:network/info", (req, res) => {
            this.getInfo(req, res);
        });

        this.router.post("/:network/transfers", (req, res) => {
            this.getTransfers(req, res);
        })
    }

    public async resolveMetaId(req: Request, res: Response) {
        let { network, address } = req.params;

        try {
            // note: will throw exception if invalid
            address = validateAndParseAddress(address);
            const result = await this.indexerManager.getIndexer(network).resolveMetaId(address);

            if (result === null) {
                return res.status(400).json({
                    data: null,
                    error: "Couldn't resolve address",
                });
            }

            return res.status(200).json({
                data: {
                    metaId: result,
                },
                error: null,
            });
        } catch (err: any) {
            console.error("Error resolving meta ID:", err);
            res.status(500).json({
                data: null,
                error: "Internal server error",
            });
        }
    }

    public async checkEndpoint(req: Request, res: Response) {
        const { network, metaId } = req.params;

        if (!metaId) {
            return res.status(400).json({
                data: null,
                error: "Invalid Meta ID",
            });
        }

        try {
            const result = await this.indexerManager.getIndexer(network).checkMetaId(metaId);

            if (result === null) {
                return res.status(400).json({
                    data: null,
                    error: "Meta ID is not existent!",
                });
            }

            return res.status(200).json({
                data: {
                    ...result,
                },
                error: null,
            });
        } catch (err: any) {
            console.error("Error checking meta ID:", err);
            res.status(500).json({
                data: null,
                error: "Internal server error",
            });
        }

        return;
    }

    public async recordStealthInfo(req: Request, res: Response) {
        const { network } = req.params;
        let {
            ephemeralPublicKey,
            viewTag,
            stealthAccountPublicKey,
            stealthAccountAddress,
        } = req.body;

        try {
            if (!(await isValidEphemeralPublicKey(ephemeralPublicKey as string)))
                return res.status(400).json({
                    data: null,
                    error: "Bad ephemeral key!",
                });

            if (!(await isValidViewTag(viewTag as string)))
                return res.status(400).json({
                    data: null,
                    error: "Bad view tag!",
                });

            if (!(await isValidSECP256k1Point(stealthAccountPublicKey as string)))
                return res.status(400).json({
                    data: null,
                    error: "Bad spending public key!",
                });

            try {
                stealthAccountAddress = validateAndParseAddress(stealthAccountAddress);
            } catch (e) {
                return res.status(400).json({
                    data: null,
                    error: "Bad stealth address!",
                });
            }

            await this.indexerManager.getIndexer(network).saveAnnouncementInfo(
                ephemeralPublicKey,
                viewTag,
                stealthAccountPublicKey,
                stealthAccountAddress,
            );

            res.status(200).json({ data: { message: "saved" }, error: null });
        } catch (err: any) {
            console.error("Error saving info:", err);
            res.status(500).json({
                data: null,
                error: "Internal server error",
            });
        }
    }

    public async getInfo(req: Request, res: Response) {
        const { network } = req.params;
        const offset = parseInt(req.query.offset as string, 10) || 0;
        const size = parseInt(req.query.size as string, 10) || 10;

        try {
            const info = await this.indexerManager.getIndexer(network).getInfo(offset, size);
            const totalCount = await this.indexerManager.getIndexer(network).getInfoCount();

            res.status(200).json({
                data: {
                    info,
                    totalCount,
                },
                error: null,
            });
        } catch (err: any) {
            console.error("Error fetching info:", err);
            res.status(500).json({
                data: null,
                error: "Internal server error",
            });
        }
    }

    public async getTransfers(req: Request, res: Response) {
        const { network } = req.params;
        const { addresses } = req.body;

        if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
            res.status(400).json({
                data: null,
                error: "A non-empty addresses array is required.",
            });
            return;
        }

        for (const address of addresses) {
            try {
                validateAndParseAddress(address);
            } catch (e) {
                console.log(e);
                res.status(400).json({
                    data: null,
                    error: `Passed address: ${address} is not valid.`,
                });
                return;
            }
        }

        try {
            const result = await this.indexerManager.getIndexer(network).getTransfers(addresses);
            res.status(200).json({ data: result, error: null });
        } catch (err: any) {
            console.error("Error fetching transfers:", err);
            res.status(500).json({
                data: null,
                error: "Internal server error",
            });
        }
    }
}
