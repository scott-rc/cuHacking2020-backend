import { Application, NextFunction, Request, Response } from "express";
import { ValidationError } from "yup";
import logger from "./logger";

export default (app: Application): Application => {
  // error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ValidationError) {
      logger.continueWarn("valdiation error: %s", err);
      res.status(422).json(err.message);
    } else {
      logger.continueError("unknown error: %s", err);
      res.status(500).json(err.toString());
    }
  });

  return app;
};
