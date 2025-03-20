import { initConfig } from "./config";
import { Server } from "./server";

let app: import("express").Express;

try {
  const config = initConfig();
  const server = new Server(config);
  server.run();
  app = server.app;
} catch (err) {
  console.error("Configuration error:", err);
  process.exit(1);
}

export { app };
