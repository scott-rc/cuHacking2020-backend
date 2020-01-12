import { Server } from "http";
import uuid from "uuid";
import WebSocket from "ws";
import * as event from "../services/event";
import logger from "./logger";
import sessions from "./sessions";

setInterval(() => {
  logger.beginDebug("checking if any sockets are dead");

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];

    if (!session.isAlive) {
      logger.continueDebug("terminating socket: %s", session.id);
      session.ws.terminate();
      continue;
    }

    session.isAlive = false;
    session.ws.ping();
  }

  logger.continueDebug("finished checking sockets");
}, parseInt(process.env.SESSION_TIMEOUT as string));

export default (server: Server): Server => {
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", ws => {
    const id = uuid.v4();
    logger.beginDebug("socket connected: %s", id);

    logger.continueDebug("creating session");
    sessions.push({ id, ws, isAlive: true, puckId: -1 });

    logger.continueDebug("setting handlers");
    ws.on("ping", event.ping(id, ws));
    ws.on("pong", event.pong(id));
    ws.on("message", event.message(id, ws));
    ws.on("close", event.close(id));
    ws.on("error", event.error(id, ws));
  });

  return server;
};
