import { Server } from "./server";
const server = new Server();

server.run();

const app = server.app;
export { app };