import { Application } from "express";
import asyncHandler from "../lib/async-handler";
import * as task from "../services/task";
import logger from "./logger";
import state from "./state";
import { newTaskValidator } from "./validation";

export default (app: Application): Application => {
  app.get("/health", (_req, res) => {
    res.json({ status: "healthy" });
  });

  app.post(
    "/task",
    asyncHandler(async (req, res) => {
      logger.continueDebug("validating body: %o", req.body);
      const newTask = await newTaskValidator.validate(req.body);

      logger.continueDebug("saving new task: %o", newTask);
      const createdTask = await task.save(newTask);
      res.status(201).json({ status: "success" });

      logger.continueDebug("finding puck without task...");
      const puck = state.find(x => x.taskId == null);

      if (!puck) {
        logger.continueDebug("couldn't find a puck without a task id");
        return;
      }

      logger.continueDebug("emitting UPDATE event to puck: %s", puck.puckId);
      puck.ws.send({
        event: {
          type: "UPDATE",
          data: {
            title: createdTask.title
          }
        }
      });
    })
  );

  return app;
};
