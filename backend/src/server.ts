import express, { Router } from 'express';
import * as http from "http";
import { json, urlencoded } from "body-parser";
import { AppRouting } from './router/app-routing';
import { Pool } from 'pg';

const path = require("path");
require('dotenv').config();

export class Server {
    public app: express.Express;
    private router: Router;
    private pool: Pool | undefined; 

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
        // Initialize the PostgreSQL pool with environment variables
        this.pool = new Pool({
            host: process.env.PGHOST,
            port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGDATABASE
        });

        // Test the PostgreSQL connection
        this.pool.connect((err, client, release) => {
            if (err) {
                console.error('Error acquiring client', err.stack);
            } else {
                client?.query('SELECT NOW()', (err, result) => {
                    release();
                    if (err) {
                        console.error('Error executing query', err.stack);
                    } else {
                        console.log('Postgres connected:', result.rows[0]);
                    }
                });
            }
        });
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