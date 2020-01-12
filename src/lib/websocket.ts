import { Server } from "http";
import uuid from "uuid";
import WebSocket from "ws";
import { clientSessions, puckSessions } from "../lib/state";
import * as websocketService from "../services/websocket";
import logger from "./logger";

setInterval(() => {
  logger.beginDebug("pinging sockets");

  for (let i = 0; i < puckSessions.length; i++) {
    const session = puckSessions[i];

    if (!session.isAlive) {
      logger.continueDebug("terminating dead socket: %s", session.id);
      session.ws.terminate();
      continue;
    }

    session.isAlive = false;
    session.ws.ping();
  }

  for (let i = 0; i < clientSessions.length; i++) {
    const session = clientSessions[i];

    if (!session.isAlive) {
      logger.continueDebug("terminating dead socket: %s", session.id);
      session.ws.terminate();
      continue;
    }

    session.isAlive = false;
    session.ws.ping();
  }

  logger.continueDebug("finished pinging sockets");
}, parseInt(process.env.SESSION_TIMEOUT as string));

export default (server: Server): Server => {
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws, req) => {
    const id = uuid.v4();
    logger.beginDebug("socket connected: %s", id);

    if (req.url === "/puck") {
      logger.continueDebug("creating puck session");
      puckSessions.push({ id, ws, isAlive: true, puckId: -1 });
    } else {
      logger.continueDebug("creating client session");
      clientSessions.push({ id, ws, isAlive: true });
    }

    logger.continueDebug("setting event handlers");
    ws.on("ping", websocketService.ping(id, ws));
    ws.on("pong", websocketService.pong(id));
    ws.on("message", websocketService.message(id, ws));
    ws.on("close", websocketService.close(id));
    ws.on("error", websocketService.error(id, ws));
  });

  return server;
};
