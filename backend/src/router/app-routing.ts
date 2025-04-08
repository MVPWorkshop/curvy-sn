import { Router } from "express";
import { AppRoute } from "./app-route";
import { StarknetController } from "../controller/starknet-controller";
import { Config } from "../config";
import { IndexerManager } from "../indexer/manager";
import { IndexerOptions } from "../types";
import { CurrencyController } from "../controller/currency-controller";
import { CurrencyManager } from "../currencies/manager";

export class AppRouting {
  constructor(
    private route: Router,
    private config: Config,
  ) {
    this.route = route;
    this.configure();
  }

  public configure() {
    const options: { [key: string]: IndexerOptions } = {};
    this.config.indexers.forEach((opt) => {
      const key = `${opt.chain.toLowerCase()}-${opt.network.toLowerCase()}`;
      options[key] = opt;
    });

    const manager = new IndexerManager(options, this.config.database)

    const currencyManager = new CurrencyManager(this.config.currencyManager, this.config.database);
    currencyManager.start();

    this.addRoute(
      new StarknetController(
        manager,
        this.config.cors,
        this.config.jwtSecret
      )
    );

    this.addRoute(
      new CurrencyController(
        currencyManager,
        this.config.cors,
        this.config.jwtSecret
      )
    )

  }

  private addRoute(appRoute: AppRoute) {
    this.route.use(appRoute.route, appRoute.router);
  }
}
