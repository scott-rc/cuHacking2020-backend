import { Application } from "express";
import asyncHandler from "../lib/async-handler";
import * as task from "../services/task";
import db from "./db";
import logger from "./logger";
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

      logger.continueDebug("sending successful response");
      res.status(201).json({ status: "success", data: { task: createdTask } });
    })
  );

  return app;
};
