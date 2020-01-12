import cors from "cors";
import { Application, NextFunction, Request, Response } from "express";
import { ValidationError } from "yup";
import logger from "./logger";
import bodyParser = require("body-parser");

export const beforeRoutes = (app: Application): Application => {
  // request logger
  app.use((req, res, next) => {
    logger.beginDebug("received request to: %s", req.url);
    const start = Date.now();

    next();

    res.on("finish", () => {
      const end = Date.now();
      logger.continueDebug("request finished in %dms", end - start);
    });
  });

  // add cors
  app.use(cors());

  // json body parser
  app.use(bodyParser.json());

  return app;
};

export const afterRoutes = (app: Application): Application => {
  // error handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ValidationError) {
      logger.continueWarn("valdiation error: %s", err);
      res.status(400).json({ status: "error", error: err.message });
    } else {
      logger.continueError("unknown error: %s", err);
      res.status(500).json({ status: "error", error: err.toString() });
    }

    next();
  });

  return app;
};
