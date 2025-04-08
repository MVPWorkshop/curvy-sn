import { Request, Response, Router } from "express";
import { AppRoute } from "../router/app-route";
import { DBConfig } from "../config";
import { ChainRepository } from "../repositories/chain-repository";
import cors from "cors";
// import { createAuthMiddleware } from "../middlewares/jwt-auth";

export class ChainController implements AppRoute {
    public route: string = "/";
    router: Router = Router();
    repository: ChainRepository;

    constructor(dbConfig: DBConfig, corsOrigin: string, _secret: string) {
        this.repository = new ChainRepository(dbConfig);

        this.router.use(cors({ origin: corsOrigin }));
        // this.router.use(createAuthMiddleware(secret));

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
         *             required:
         *               - metaId
         *               - address
         *               - pubKeys
         *             properties:
         *               metaId:
         *                 type: string
         *                 description: The Meta ID
         *               address:
         *                 type: string
         *                 description: The associated address
         *               pubKeys:
         *                 type: array
         *                 items:
         *                   type: object
         *                   properties:
         *                     curve:
         *                       type: string
         *                       enum: [SECP256k1, BabyJub, BN254]
         *                       description: The curve type
         *                     description:
         *                       type: string
         *                       enum: ["Spending Pub. Key", "Viewing Pub. Key"]
         *                       description: The key description
         *                     value:
         *                       type: string
         *                       description: The public key value
         *     responses:
         *       200:
         *         description: Successful registration
         *       400:
         *         description: Missing required fields
         *       500:
         *         description: Internal server error
         */
        this.router.post("/register", (req, res) => {
            this.registerMetaId(req, res);
        })
    }

    private async registerMetaId(req: Request, res: Response) {
        const { metaId, address, pubKeys } = req.body;

        if (!metaId || !address || !pubKeys) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            await this.repository.registerMetaId(metaId, address, pubKeys);

            return res.json({ message: "Successful registration" })
        } catch (e) {
            console.log("Error registering Meta ID:", e)
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}