import cors from "cors";
import { Application, NextFunction, Request, Response } from "express";
import { ValidationError } from "yup";
import logger from "./logger";
import bodyParser = require("body-parser");

export const beforeRoutes = (app: Application): Application => {
  // add cors
  app.use(cors());

  // request logger
  app.use((req, _res, next) => {
    logger.beginDebug("received request to: %s", req.url);
    next();
  });

  // json body parser
  app.use(bodyParser.json());

  return app;
};

export const afterRoutes = (app: Application): Application => {
  // error handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ValidationError) {
      logger.continueWarn("valdiation error: %s", err);
      res.status(422).json({ error: err.message });
    } else {
      logger.continueError("unknown error: %s", err);
      res.status(500).json({ error: err.toString() });
    }

    next();
  });

  return app;
};
