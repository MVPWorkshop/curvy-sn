import express, { Router } from "express";
import * as http from "http";
import { json, urlencoded } from "body-parser";
import { AppRouting } from "./router/app-routing";
import { Config } from "./config";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const path = require("path");
require("dotenv").config();

export class Server {
  public app: express.Express;
  private router: Router;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.app = express();
    this.router = express.Router();
    this.configure();
  }

  private configure() {
    this.configureMiddleware();
    this.configureRoutes();
    this.configureSwagger();
  }

  private configureSwagger() {
    const swaggerDefinition = {
      openapi: "3.0.0",
      info: {
        title: "Curvy API Documentation",
        version: "2.0.0",
        description: "API documentation",
      },
      servers: [
        {
          url: `http://localhost:${this.config.port}`,
          description: "Development server",
        },
      ],
    };

    const options = {
      swaggerDefinition,
      apis: [path.resolve(__dirname, "./controller/*.js")], // for dev
    };

    const swaggerSpec = swaggerJSDoc(options);

    this.app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  }

  private configureMiddleware() {
    this.app.use(json({ limit: "50mb" }));
    this.app.use(urlencoded({ limit: "50mb", extended: false }));
  }

  private configureRoutes() {
    const basePath = "/";
    this.app.use(basePath, this.router);
    if (process.env.NODE_ENV == "production") {
      this.app.use(express.static(path.join(__dirname, "/../client/build")));
    }

    new AppRouting(this.router, this.config);
  }

  public run() {
    const port = this.config.port;
    const server = http.createServer(this.app);

    //Docker sends SIGTERM signal when using docker stop
    //If this isn't present the container will take much longer to be terminated
    process.on("SIGTERM", function (code_signal_error) {
      console.log(code_signal_error);
      process.exit(0); //or whatever you want
    });

    server.listen(port, () => {
      console.log(`Express server running on port ${port}.`);
    });
  }
}
