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
  logger.beginDebug("checking if any sessions are invalid");

  for (let i = 0; i < state.length; i++) {
    const session = state[i];

    if (session.isAlive === false) {
      logger.continueDebug("deleting invalid session: %s", session.id);
      session.ws.terminate();
      state.splice(i, 1);
      continue;
    }

    session.isAlive = false;
    session.ws.ping();
  }

  logger.continueDebug("finished checking sessions");
}, 30000);

server.listen(process.env.PORT, () => {
  logger.info(`listening on port ${process.env.PORT}`);
});
