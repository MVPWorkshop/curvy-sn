import express, { Router } from 'express';
import * as http from "http";
import { json, urlencoded } from "body-parser";
import { AppRouting } from './router/app-routing';

const path = require("path");
require('dotenv').config();

export class Server {
    public app: express.Express;
    private router: Router;

    constructor() {
        this.app = express();
        this.router = express.Router();
        this.configure();
    }

    private configure() {
        this.configureMiddleware();
        this.configureRoutes();
        this.configureDb();
    }

    private configureMiddleware() {
        this.app.use(json({ limit: "50mb" }));
        this.app.use(urlencoded({ limit: "50mb", extended: true }));
    }

    private configureRoutes() {
        const basePath = "/";
        this.app.use(basePath, this.router);
        if (process.env.NODE_ENV == "production") {
            this.app.use(express.static(path.join(__dirname, '/../client/build')));
        }
        
        new AppRouting(this.router);
    }

    private configureDb() {
        
    }

    public run() {
        const port = process.env.PORT || 4000;
        const server = http.createServer(this.app);


        //Docker sends SIGTERM signal when using docker stop
        //If this isn't present the container will take much longer to be terminated
        process.on("SIGTERM", function(code_signal_error){
            console.log(code_signal_error)
            process.exit(0) //or whatever you want
        })

        server.listen(port, () => {
            console.log(`Express server running on port ${port}.`);
        });
    }
}