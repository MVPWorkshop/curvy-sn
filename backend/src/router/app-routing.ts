import { Router } from "express";
import { AppRoute } from "./app-route";
import { StarknetController } from "../controller/starknet-controller";
import { Config } from "../config";
import { IndexerManager } from "../indexer/manager";

export class AppRouting {
  constructor(
    private route: Router,
    private config: Config,
  ) {
    this.route = route;
    this.configure();
  }

  public configure() {
    const options = {
      "starknet-testnet": this.config.StarknetOptions.testnet,
    }

    const manager = new IndexerManager(options)

    this.addRoute(
      new StarknetController(
        manager,
        this.config.StarknetCors
      )
    );

  }

  private addRoute(appRoute: AppRoute) {
    this.route.use(appRoute.route, appRoute.router);
  }
}
