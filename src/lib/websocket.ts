import { Server } from "http";
import uuid from "uuid";
import WebSocket from "ws";
import { ValidationError } from "yup";
import logger from "./logger";
import state from "./state";
import { eventValidator } from "./validation";

setInterval(() => {
  logger.beginDebug("checking if any sockets are dead");

  for (let i = 0; i < state.length; i++) {
    const session = state[i];

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

  wss.on("connection", (ws, request) => {
    const id = uuid.v4();
    logger.debug("socket connected: %s", id);
    state.push({ id, ws, isAlive: true, puckId: -1 });

    ws.on("ping", () => {
      logger.beginDebug("received ping: %s", id);

      logger.continueDebug("sending pong");
      ws.pong();
    });

    ws.on("pong", () => {
      logger.beginDebug("received pong: %s", id);

      logger.continueDebug("looking for session...");
      const session = state.find(x => x.id === id);

      if (session) {
        logger.continueDebug("setting socket as alive");
        session.isAlive = true;
      }
    });

    ws.on("message", async message => {
      try {
        logger.beginDebug("received message %o", message);
        logger.continueDebug("parsing message...");
        const payload = JSON.parse(message.toString());

        logger.continueDebug("validating event: %o", payload.event);
        const event = await eventValidator.validate(payload.event);

        logger.continueDebug("figuring out event type...");
        switch (event.type) {
          case "CONNECT":
            logger.continueDebug("received CONNECT");

            logger.continueDebug("looking for session...");
            const session = state.find(x => x.id === id);

            if (session) {
              logger.continueDebug("setting puckId: %s", event.data.id);
              session.puckId = event.data.id;
            } else {
              logger.continueWarn("coudn't find session for socket: %s", id);
              ws.send(
                JSON.stringify({
                  error: "internal error: couldn't find session"
                })
              );
            }
            break;
          default:
            logger.continueError("unknown event: %s", event.type);
            ws.send(JSON.stringify({ error: "unknown event: " + event.type }));
        }
      } catch (err) {
        if (err instanceof ValidationError) {
          logger.continueWarn("valdiation error: %s", err);
        } else {
          logger.continueError("unknown error: %s", err);
        }

        ws.send(JSON.stringify({ error: err.message || "unexpected error" }));
      }
    });

    ws.on("close", () => {
      logger.beginDebug("socket disconnected: %s", id);

      logger.continueDebug("looking for session...");
      const index = state.findIndex(x => x.id === id);

      if (index === -1) {
        logger.continueWarn("couldn't find session");
      } else {
        logger.continueDebug("removing session");
        state.splice(index, 1);
      }
    });

    ws.on("error", () => {
      logger.beginDebug("socket error: %s", id);

      logger.continueDebug("terminating socket");
      ws.terminate();
    });
  });

  return server;
};
