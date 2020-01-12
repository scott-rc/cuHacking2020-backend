import WebSocket from "ws";
import logger from "../lib/logger";
import { clientSessions, puckSessions } from "../lib/state";
import {
  positionChangeEventValidator,
  updateTaskValidator
} from "../lib/validation";
import {
  ClientConnectEvent,
  PuckConnectEvent,
  PuckPositionChangeEvent
} from "../types";
import * as taskService from "./task";

export const clientConnect = (
  id: string,
  ws: WebSocket,
  maybeEvent: ClientConnectEvent
) => {
  logger.continueDebug("looking for session...");
  const session = clientSessions.find(x => x.id === id);

  if (session) {
    logger.continueDebug("found session");
  } else {
    logger.continueWarn("coudn't find session for socket: %s", id);
    ws.send(
      JSON.stringify({
        error: "internal error: couldn't find session"
      })
    );
  }
};

export const puckConnect = (
  id: string,
  ws: WebSocket,
  event: PuckConnectEvent
) => {
  logger.continueDebug("looking for session...");
  const session = puckSessions.find(x => x.id === id);

  if (session) {
    logger.continueDebug("found session");

    logger.continueDebug("checking if session with puck id already exists...");
    const samePuckSession = puckSessions.find(x => x.puckId === event.data.id);

    if (samePuckSession) {
      logger.continueDebug(
        "session with puck id already exists: %s",
        samePuckSession.id
      );
      logger.continueDebug("terminating old session: %s", samePuckSession.id);
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
};

export const puckPositionChange = async (
  id: string,
  ws: WebSocket,
  maybeEvent: PuckPositionChangeEvent
) => {
  logger.continueDebug("validating event: %o", maybeEvent);
  const event = await positionChangeEventValidator.validate(maybeEvent);

  logger.continueDebug("looking for session...");
  const session = puckSessions.find(x => x.id === id);

  if (!session) {
    logger.continueDebug("couldn't find session");
    return;
  }

  logger.continueDebug("creating update task...");
  const updateTask = await updateTaskValidator.validate({
    taskId: session.taskId,
    statusId: event.data.column
  });

  await taskService.update(updateTask as any);
};
