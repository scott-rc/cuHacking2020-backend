import { Application } from "express";
import logger from "./logger";

export default (app: Application): Application => {
  app.get("/health", (_req, res) => {
    logger.continueDebug("received healthcheck");
    res.json({ status: "healthy" });
  });

  return app;
};
