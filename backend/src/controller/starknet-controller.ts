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
    this.router.get("/check", cors(), (request, response) => {
      this.checkEndpoint(request, response);
    });

    this.router.get("/resolve/:address", cors(), (req, res) => {
      this.resolveMetaId(req, res);
    });
  }

  public async resolveMetaId(req: Request, res: Response) {
    const address = req.params.address;

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
    res.status(200).json({ msg: "Check" });
    console.log(req.body);
    return;
  }
}
