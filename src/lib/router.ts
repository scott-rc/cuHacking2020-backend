import { Application } from "express";
import asyncHandler from "../lib/async-handler";
import * as task from "../services/task";
import db from "./db";
import logger from "./logger";
import state from "./state";
import { newTaskValidator } from "./validation";

export default (app: Application): Application => {
  app.get(
    "/health",
    asyncHandler(async (_req, res) => {
      logger.continueDebug("checking database connection...");
      await db.raw("select 1");

      logger.continueDebug("database connection good!");
      res.json({ status: "healthy" });
    })
  );

  app.post(
    "/task",
    asyncHandler(async (req, res) => {
      logger.continueDebug("validating body: %o", req.body);
      const newTask = await newTaskValidator.validate(req.body);

      logger.continueDebug("saving new task: %o", newTask);
      const createdTask = await task.save(newTask);
      res.status(201).json({ status: "success", data: { task: createdTask } });

      logger.continueDebug("finding session without task...");
      const session = state.find(x => x.puckId !== -1 && x.taskId == null);

      if (!session) {
        logger.continueDebug("couldn't find a session without a task");
        return;
      }

      logger.continueDebug(
        "emitting UPDATE event to puck: %s (%s)",
        session.puckId,
        session.id
      );

      session.ws.send(
        JSON.stringify({
          event: {
            type: "UPDATE",
            data: {
              title: createdTask.title
            }
          }
        })
      );
    })
  );

  return app;
};
