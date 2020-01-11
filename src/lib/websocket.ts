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
    logger.beginDebug("socket connected: %s", id);
    state.push({ id, ws, puckId: -1 });

    ws.on("message", async message => {
      try {
        logger.beginDebug("received message %o", message);
        logger.beginDebug("parsing message...");
        const payload = JSON.parse(message.toString());

        logger.continueDebug("validating event: %o", payload.event);
        const event = await eventValidator.validate(payload.event);

        logger.continueDebug("figuring out event type...");
        switch (event.type) {
          case "CONNECT":
            logger.continueDebug("received connect");

            logger.continueDebug("looking for session with id %s", id);
            const session = state.find(x => x.id === id);

            if (session) {
              logger.continueDebug("found session");
              logger.continueDebug("setting puckId: %s", event.data.id);
              session.puckId = event.data.id;
            } else {
              logger.continueError("couldn't find session");
              ws.send({ error: "unknown puck id: " + event.data.id || "null" });
            }
            break;
          default:
            logger.continueError("unknown event: %s", event.type);
            ws.send({ error: "unknown event: " + event.type });
        }
      } catch (err) {
        if (err instanceof ValidationError) {
          logger.continueWarn("valdiation error: %s", err);
        } else {
          logger.continueError("unknown error: %s", err);
        }

        ws.send({ error: err.message || "unexpected error" });
      }
    });

    ws.on("close", () => {
      logger.debug("socket disconnected");
    });
  });

  return server;
};
