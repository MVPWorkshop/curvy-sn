import { Router } from "express";
import { AppRoute } from "./app-route";
import { TestController } from "../controller/test-controller";

export class AppRouting {
    constructor(private route:Router) {
        this.route = route;
        this.configure();
    }

    public configure() {
        this.addRoute(new TestController());
    }

    private addRoute(appRoute:AppRoute) {
        this.route.use(appRoute.route, appRoute.router);
    }
}