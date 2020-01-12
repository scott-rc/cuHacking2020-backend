require("dotenv").config();
import express from "express";
import http from "http";
import logger from "./lib/logger";
import * as middleware from "./lib/middleware";
import router from "./lib/router";
import websocket from "./lib/websocket";

const app = middleware.afterRoutes(router(middleware.beforeRoutes(express())));
const server = websocket(http.createServer(app));

server.listen(process.env.PORT, () => {
  logger.info(`listening on port ${process.env.PORT}`);
});
