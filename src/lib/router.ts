import { Application } from "express";
import asyncHandler from "../lib/async-handler";
import * as taskService from "../services/task";
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
      res.status(200).json({ status: "healthy" });
    })
  );

  app.get(
    "/task",
    asyncHandler(async (_req, res) => {
      logger.continueDebug("loading all tasks...");
      const tasks = await db.select().from("task");

      res.status(200).json(tasks);
    })
  );

  app.post(
    "/task",
    asyncHandler(async (req, res) => {
      logger.continueDebug("validating body: %o", req.body);
      const newTask = await newTaskValidator.validate(req.body);

      logger.continueDebug("saving new task: %o", newTask);
      const createdTask = await taskService.create(newTask);

      logger.continueDebug("sending successful response");
      res.status(201).json({ status: "success", data: { task: createdTask } });
    })
  );

  app.delete(
    "/task",
    asyncHandler(async (req, res) => {
      logger.continueDebug("deleting all tasks");
      await db.table("task").delete();

      return res.status(200).json({ status: "success" });
    })
  );

  return app;
};
