import { Server } from "http";
import uuid from "uuid";
import WebSocket from "ws";
import { ValidationError } from "yup";
import logger from "./logger";
import state from "./state";
import { eventValidator } from "./validation";

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

    ws.on("pong", () => {
      const session = state.find(x => x.id === id);

      if (session) {
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
      logger.debug("socket disconnected: %s", id);

      logger.debug("looking for session...");
      const index = state.findIndex(x => x.id === id);

      if (index === -1) {
        logger.warn("couldn't find session");
      } else {
        logger.debug("terminating session");
        state[index].ws.terminate();
        state.splice(index, 1);
      }
    });

    ws.on("error", () => {
      logger.debug("socket error: %s", id);

      logger.debug("looking for session...");
      const index = state.findIndex(x => x.id === id);

      if (index) {
        logger.debug("terminating session");
        state[index].ws.terminate();
        state.splice(index, 1);
      } else {
        logger.warn("couldn't find session");
      }
    });
  });

  return server;
};
