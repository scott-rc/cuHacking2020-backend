import { Server } from "http";
import WebSocket from "ws";
import { ValidationError } from "yup";
import logger from "./logger";
import { eventValidator } from "./validation";

export default (server: Server): Server => {
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws, request) => {
    logger.debug("socket connected");

    ws.on("message", async message => {
      try {
        logger.beginDebug("received message %o", message);
        logger.beginDebug("parsing message...");
        const payload = JSON.parse(message.toString());

        logger.continueDebug("validating event: %o", payload.event);
        const event = await eventValidator.validate(payload.event);

        switch (event.type) {
          case "POSITION_CHANGE":
            logger.continueDebug("position changed!");
            break;
          case "AUTOCONNECT":
            logger.continueDebug("auto connect!");
            break;
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
