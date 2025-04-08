import { Request, Response, Router } from "express";
import { AppRoute } from "../router/app-route";
import { DBConfig } from "../config";
import { ChainRepository } from "../repositories/chain-repository";
import cors from "cors";
import { createAuthMiddleware } from "../middlewares/jwt-auth";

export class ChainController implements AppRoute {
    public route: string = "/";
    router: Router = Router();
    repository: ChainRepository;

    constructor(dbConfig: DBConfig, corsOrigin: string, secret: string) {
        this.repository = new ChainRepository(dbConfig);

        this.router.use(cors({ origin: corsOrigin }));
        this.router.use(createAuthMiddleware(secret));

        this.router.post("/register", (req, res) => {
            this.registerMetaId(req, res)
        });
        this.router.get("/resolve/:address", (req, res) => {
            this.resolveMetaId(req, res)
        });
        this.router.get("/check/:metaId", (req, res) => {
            this.checkMetaId(req, res)
        });
        this.router.post("/:chain/announce", (req, res) => {
            this.recordStealthInfo(req, res)
        });
        this.router.get("/announcements", (req, res) => {
            this.getAnnouncements(req, res);
        });
    }

    /**
     * @swagger
     * /register:
     *   post:
     *     summary: Register a new Meta ID
     *     tags: [Meta ID]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [metaId, address, pubKeys]
     *             properties:
     *               metaId:
     *                 type: string
     *               address:
     *                 type: string
     *               pubKeys:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     curve:
     *                       type: string
     *                       enum: [SECP256k1, BabyJub, BN254]
     *                     description:
     *                       type: string
     *                       enum: ["Spending Pub. Key", "Viewing Pub. Key"]
     *                     value:
     *                       type: string
     *     responses:
     *       200:
     *         description: Successful registration
     */
    private async registerMetaId(req: Request, res: Response) {
        const { metaId, address, pubKeys } = req.body;

        if (!metaId || !address || !pubKeys) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        try {
            await this.repository.registerMetaId(metaId, address, pubKeys);
            return res.json({ message: "Successful registration" });
        } catch (e) {
            console.error("Register Meta ID Error:", e);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /resolve/{address}:
     *   get:
     *     summary: Resolve a Meta ID from wallet address
     *     tags: [Meta ID]
     *     parameters:
     *       - in: path
     *         name: address
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Meta ID resolved
     */
    private async resolveMetaId(req: Request, res: Response) {
        const { address } = req.params;

        try {
            const metaId = await this.repository.resolveMetaId(address);
            if (!metaId) return res.status(404).json({ error: "Not found" });

            return res.json({ data: { metaId }, error: null });
        } catch (err) {
            console.error("Resolve Meta ID Error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /check/{metaId}:
     *   get:
     *     summary: Check if a Meta ID exists and fetch public keys
     *     tags: [Meta ID]
     *     parameters:
     *       - in: path
     *         name: metaId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Meta keys found
     */
    private async checkMetaId(req: Request, res: Response) {
        const { metaId } = req.params;

        try {
            const pubKeys = await this.repository.getMetaById(metaId);
            if (!pubKeys) return res.status(404).json({ error: "Meta ID not found" });

            return res.json({ data: { pubKeys }, error: null });
        } catch (err) {
            console.error("Check Meta ID Error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /{chain}/announce:
     *   post:
     *     summary: Record stealth announcement for a chain
     *     tags: [Announcements]
     *     parameters:
     *       - in: path
     *         name: chain
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [ephemeralPubKey, viewTag, stealthAccountPubKey, stealthAccountAddress]
     *             properties:
     *               ephemeralPubKey:
     *                 type: string
     *               viewTag:
     *                 type: string
     *               stealthAccountPubKey:
     *                 type: object
     *                 properties:
     *                   curve:
     *                     type: string
     *                   description:
     *                     type: string
     *                   value:
     *                     type: string
     *               stealthAccountAddress:
     *                 type: string
     *     responses:
     *       200:
     *         description: Saved
     */
    private async recordStealthInfo(req: Request, res: Response) {
        const { chain } = req.params;
        const { ephemeralPubKey, viewTag, stealthAccountPubKey, stealthAccountAddress } = req.body;

        if (!ephemeralPubKey || !viewTag || !stealthAccountPubKey || !stealthAccountAddress) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        try {
            await this.repository.recordStealthInfo(chain,
                ephemeralPubKey,
                viewTag,
                stealthAccountPubKey,
                stealthAccountAddress,
            );

            return res.json({ data: { message: "Saved" }, error: null });
        } catch (e) {
            console.error("Record stealth info error:", e);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /announcements:
     *   get:
     *     summary: Get announcements (stealth addresses, pubkeys, viewtags)
     *     tags: [Announcements]
     *     parameters:
     *       - in: query
     *         name: offset
     *         schema:
     *           type: number
     *       - in: query
     *         name: size
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: List of announcements
     */
    private async getAnnouncements(req: Request, res: Response) {
        const offset = parseInt(req.query.offset as string) || 0;
        const size = parseInt(req.query.size as string) || 10;

        try {
            const data = await this.repository.getStealthInfo(offset, size);
            return res.json({ data, error: null });
        } catch (err) {
            console.error("Get Announcements Error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}
