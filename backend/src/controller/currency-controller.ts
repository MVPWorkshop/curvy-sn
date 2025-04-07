import { Request, Response, Router } from "express";
import { AppRoute } from "../router/app-route";
import { CurrencyManager } from "../currencies/manager";
import cors from "cors";
import { createAuthMiddleware } from "../middlewares/jwt-auth";

export class CurrencyController implements AppRoute {
    public route: string = "/currency";
    router: Router = Router();
    currencyManger: CurrencyManager;

    constructor(manager: CurrencyManager, corsOrigin: string, secret: string) {
        this.currencyManger = manager

        this.router.use(cors({ origin: corsOrigin }));
        this.router.use(createAuthMiddleware(secret));

        this.router.get("/latest", (req, res) => {
            this.getLatest(req, res);
        })
    }

    private async getLatest(_req: Request, res: Response) {
        try {
            const prices = await this.currencyManger.getLatestPrices();
            res.status(200).json({ data: prices, error: null });
        } catch (err: any) {
            console.error("Error fetching latest currency prices:", err);
            res.status(500).json({ data: null, error: "Internal server error" });
        }
    }
}