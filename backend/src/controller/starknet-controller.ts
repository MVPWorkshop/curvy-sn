import { Router, Request, Response } from "express";
import { AppRoute } from "../router/app-route";
import { validateAndParseAddress } from "starknet";
import cors from "cors";
import { Indexer } from "../indexer/starknet-indexer";
import { IndexerOptions } from "../types";
import {
    isValidEphemeralPublicKey,
    isValidSECP256k1Point,
    isValidViewTag,
} from "../validation/curvy-utils";
import { authenticateToken } from "../middlewares/jwt-auth";

export class StarknetController implements AppRoute {
    public route: string = "/starknet";
    router: Router = Router();
    indexer: Indexer;

    constructor(options: IndexerOptions, corsOrigin: string) {
        this.indexer = new Indexer(options);
        this.indexer.start();

        this.router.use(cors({ origin: corsOrigin }));
        this.router.use(authenticateToken);

        //endpoint
        this.router.get("/checkmeta/:metaId", (request, response) => {
            this.checkEndpoint(request, response);
        });

        this.router.get("/resolve/:address", (req, res) => {
            this.resolveMetaId(req, res);
        });

        this.router.post("/recordstealthinfo", (req, res) => {
            this.recordStealthInfo(req, res);
        });

        this.router.get("/info", (req, res) => {
            this.getInfo(req, res);
        });

        this.router.post("/transfers", (req, res) => {
            this.getTransfers(req, res);
        });
    }

    public async resolveMetaId(req: Request, res: Response) {
        let { address } = req.params;

        try {
            // note: will throw exception if invalid
            address = validateAndParseAddress(address);
            const result = await this.indexer.resolveMetaId(address);

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
        const { metaId } = req.params;

        if (!metaId) {
            return res.status(400).json({
                data: null,
                error: "Invalid Meta ID",
            });
        }

        try {
            const result = await this.indexer.checkMetaId(metaId);

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
        const {
            ephemeralPublicKey,
            viewTag,
            stealthAccountPublicKey,
            stealthAccountAddress,
        } = req.body;

        try {
            if (
                !(await isValidEphemeralPublicKey(ephemeralPublicKey as string))
            )
                return res.status(400).json({
                    data: null,
                    error: "Bad ephemeral key!",
                });

            if (!(await isValidViewTag(viewTag as string)))
                return res.status(400).json({
                    data: null,
                    error: "Bad view tag!",
                });

            if (
                !(await isValidSECP256k1Point(
                    stealthAccountPublicKey as string
                ))
            )
                return res.status(400).json({
                    data: null,
                    error: "Bad spending public key!",
                });

            try {
                validateAndParseAddress(stealthAccountAddress);
            } catch (e) {
                return res.status(400).json({
                    data: null,
                    error: "Bad stealth address!",
                });
            }

            await this.indexer.saveAnnouncementInfo(
                ephemeralPublicKey,
                viewTag,
                stealthAccountPublicKey,
                stealthAccountAddress
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
        const offset = parseInt(req.query.offset as string, 10) || 0;
        const size = parseInt(req.query.size as string, 10) || 10;

        try {
            const info = await this.indexer.getInfo(offset, size);
            const totalCount = await this.indexer.getHistoryCount();

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
            const result = await this.indexer.getTransfers(addresses);
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
