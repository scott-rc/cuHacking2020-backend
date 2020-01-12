require("dotenv").config();
import express from "express";
import http from "http";
import logger from "./lib/logger";
import * as middleware from "./lib/middleware";
import router from "./lib/router";
import state from "./lib/state";
import websocket from "./lib/websocket";

const app = middleware.afterRoutes(router(middleware.beforeRoutes(express())));
const server = websocket(http.createServer(app));

setInterval(() => {
  logger.beginDebug("checking if any sessions are invalid...");

  for (let i = 0; i < state.length; i++) {
    if (state[i].ws.OPEN === 3) {
      logger.continueDebug("deleting closed session: %s", state[i].id);
      delete state[i];
    }
  }

  logger.continueDebug("finished checking sessions");
}, 5000);

server.listen(process.env.PORT, () => {
  logger.info(`listenting on port ${process.env.PORT}`);
});
