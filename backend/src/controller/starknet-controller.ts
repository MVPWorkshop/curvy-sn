import { Router, Request, Response } from "express";
import { AppRoute } from "../router/app-route";
import cors from "cors";
import { Indexer, IndexerOptions } from "../indexer/starknet-indexer";

export class StarknetController implements AppRoute {
  public route: string = "/starknet";
  router: Router = Router();
  indexer: Indexer

  constructor(options: IndexerOptions) {
    this.indexer = new Indexer(options)
    this.indexer.start();

    this.router.use(cors({ origin: "*" }));
    
    //endpoint
    this.router.get('/check', cors(), (request, response) => {
        this.checkEndpoint(request, response);
    });
  }

  public async checkEndpoint(req: Request, res: Response) {
    res.status(200).json({msg: "Check"});
    console.log(req.body)
    return;
  }
}