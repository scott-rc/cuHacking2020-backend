import WebSocket, { Data } from "ws";
import { ValidationError } from "yup";
import logger from "../lib/logger";
import sessions from "../lib/sessions";
import { eventValidator } from "../lib/validation";

export const ping = (id: string, ws: WebSocket) => () => {
  logger.beginDebug("received ping: %s", id);

  logger.continueDebug("sending pong");
  ws.pong();
};

export const pong = (id: string) => () => {
  logger.beginDebug("received pong: %s", id);

  logger.continueDebug("looking for session...");
  const session = sessions.find(x => x.id === id);

  if (session) {
    logger.continueDebug("found session");

    logger.continueDebug("setting socket as alive");
    session.isAlive = true;
  }
};

export const message = (id: string, ws: WebSocket) => async (message: Data) => {
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
        const session = sessions.find(x => x.id === id);

        if (session) {
          logger.continueDebug("found session");

          logger.continueDebug(
            "checking if session with puck id already exists..."
          );
          const samePuckSession = sessions.find(
            x => x.puckId === event.data.id
          );

          if (samePuckSession) {
            logger.continueDebug(
              "session with puck id already exists: %s",
              samePuckSession.id
            );
            logger.continueDebug(
              "terminating old session: %s",
              samePuckSession.id
            );
            samePuckSession.ws.terminate();
          } else {
            logger.continueDebug("session with puck id does not exist");
          }

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
};

export const close = (id: string) => () => {
  logger.beginDebug("socket disconnected: %s", id);

  logger.continueDebug("looking for session...");
  const index = sessions.findIndex(x => x.id === id);

  if (index === -1) {
    logger.continueWarn("couldn't find session");
  } else {
    logger.continueDebug("found session");

    logger.continueDebug("removing session");
    sessions.splice(index, 1);
  }
};

export const error = (id: string, ws: WebSocket) => () => {
  logger.beginDebug("socket error: %s", id);

  logger.continueDebug("terminating socket");
  ws.terminate();
};
