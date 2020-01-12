import WebSocket, { Data } from "ws";
import { ValidationError } from "yup";
import logger from "../lib/logger";
import { clientSessions, puckSessions } from "../lib/state";
import { eventValidator } from "../lib/validation";
import * as eventService from "../services/event";

export const ping = (id: string, ws: WebSocket) => () => {
  logger.beginDebug("received ping: %s", id);

  logger.continueDebug("sending pong");
  ws.pong();
};

export const pong = (id: string) => () => {
  logger.continueDebug("received pong: %s", id);

  logger.continueDebug(" - looking for session...");
  const session =
    puckSessions.find(x => x.id === id) ||
    clientSessions.find(x => x.id === id);

  if (session) {
    logger.continueDebug(" - found session");

    logger.continueDebug(" - setting socket as alive");
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
        eventService.puckConnect(id, ws, event as any);
        break;
      case "CLIENT_CONNECT":
        logger.continueDebug("received CLIENT_CONNECT");
        eventService.clientConnect(id, ws, event as any);
        break;
      case "POSITION_CHANGE":
        logger.continueDebug("received POSITION_CHANGE");
        eventService.puckPositionChange(id, ws, event as any);
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

  let isPuck = true;
  let index = puckSessions.findIndex(x => x.id === id);

  if (index === -1) {
    isPuck = false;
    index = clientSessions.findIndex(x => x.id === id);
  }

  if (index === -1) {
    logger.continueWarn("couldn't find session");
    return;
  }

  logger.continueDebug("found session");

  logger.continueDebug("removing session");
  if (isPuck) {
    puckSessions.splice(index, 1);
  } else {
    clientSessions.splice(index, 1);
  }
};

export const error = (id: string, ws: WebSocket) => () => {
  logger.beginDebug("socket error: %s", id);

  logger.continueDebug("terminating socket");
  ws.terminate();
};
