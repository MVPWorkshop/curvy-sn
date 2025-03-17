import { Router, Request, Response } from "express";
import { AppRoute } from "../router/app-route";
import cors from "cors";
import { Indexer } from "../indexer/starknet-indexer";
import { IndexerOptions } from "../types";

export class StarknetController implements AppRoute {
  public route: string = "/starknet";
  router: Router = Router();
  indexer: Indexer;

  constructor(options: IndexerOptions) {
    this.indexer = new Indexer(options);
    this.indexer.start();

    this.router.use(cors({ origin: "*" }));

    //endpoint
    this.router.get("/checkmeta/:metaId", cors(), (request, response) => {
      this.checkEndpoint(request, response);
    });

    this.router.get("/resolve/:address", cors(), (req, res) => {
      this.resolveMetaId(req, res);
    });

    this.router.get("/history", cors(), (req, res) => {
      this.getHistory(req, res);
    })

    this.router.post("/transfers", cors(), (req, res) => {
      this.getTransfers(req, res);
    })
  }

  public async resolveMetaId(req: Request, res: Response) {
    const { address } = req.params;
    //TODO: typecheck starknet address

    try {
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
      res.status(500).json({ data: null, error: "Internal server error" });
    }
  }

  public async checkEndpoint(req: Request, res: Response) {
    const { metaId } = req.params;

    if (!metaId) {
      return res.status(400).json({
        data: null,
        error: "Invalid Meta ID"
      });
    }

    try {
      const result = await this.indexer.checkMetaId(metaId);

      if (result === null) {
        return res.status(400).json({
          data: null,
          error: "Meta ID is not existant!",
        });
      }

      return res.status(200).json({
        data: {
          ...result
        },
        error: null
      })
    } catch (err: any) {
      console.error("Error checking meta ID:", err);
      res.status(500).json({ data: null, error: "Internal server error" });
    }

    return;
  }

  public async getHistory(req: Request, res: Response) {
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const size = parseInt(req.query.size as string, 10) || 10;

    try {
      const result = await this.indexer.getHistory(offset, size);

      res.status(200).json({ data: result, error: null });
    } catch (err: any) {
      console.error("Error fetching info:", err);
      res.status(500).json({ data: null, error: "Internal server error" });
    }
  }

  public async getTransfers(req: Request, res: Response) {
    const { addresses } = req.body;

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      res.status(400).json({ data: null, error: "A non-empty addresses array is required." });
      return;
    }

    try {
      const result = await this.indexer.getTransfers(addresses)
      res.status(200).json({ data: result, error: null });
    } catch (err: any) {
      console.error("Error fetching transfers:", err);
      res.status(500).json({ data: null, error: "Internal server error" });
    }
  }
}
