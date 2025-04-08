import { Router } from "express";
import { AppRoute } from "./app-route";
import { Config } from "../config";
import { CurrencyController } from "../controller/currency-controller";
import { CurrencyManager } from "../currencies/manager";
import { ChainController } from "../controller/chain-controller";

export class AppRouting {
  constructor(
    private route: Router,
    private config: Config,
  ) {
    this.route = route;
    this.configure();
  }

  public configure() {
    const currencyManager = new CurrencyManager(this.config.currencyManager, this.config.database);
    currencyManager.start();

    this.addRoute(
      new CurrencyController(
        currencyManager,
        this.config.cors,
        this.config.jwtSecret
      )
    );

    this.addRoute(
      new ChainController(
        this.config.database,
        this.config.cors,
        this.config.jwtSecret
      )
    );
  }

  private addRoute(appRoute: AppRoute) {
    this.route.use(appRoute.route, appRoute.router);
  }
}
