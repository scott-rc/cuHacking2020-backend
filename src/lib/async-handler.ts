import { Handler, NextFunction, Request, Response } from "express";

export default (handler: Handler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
};
