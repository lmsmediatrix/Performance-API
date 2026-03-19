import { Request, Response, NextFunction } from "express";
import { config } from "../config/common";

interface ErrorPayload {
  title: string;
  message: string;
  stackTrace?: string;
}

const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  const statusCode: number = res.statusCode ? res.statusCode : config.STATUS.SERVER_ERROR.CODE;

  switch (statusCode) {
    case config.STATUS.VALIDATION_ERROR.CODE:
      const validationErrorPayload: ErrorPayload = {
        title: config.STATUS.VALIDATION_ERROR.TITLE,
        message: err.message,
        stackTrace: err.stack,
      };
      res.status(statusCode).json(validationErrorPayload);
      break;
    case config.STATUS.UNAUTHORIZED.CODE:
      const unauthorizedErrorPayload: ErrorPayload = {
        title: config.STATUS.UNAUTHORIZED.TITLE,
        message: err.message,
        stackTrace: err.stack,
      };
      res.status(statusCode).json(unauthorizedErrorPayload);
      break;
    case config.STATUS.FORBIDDEN.CODE:
      const forbiddenErrorPayload: ErrorPayload = {
        title: config.STATUS.FORBIDDEN.TITLE,
        message: err.message,
        stackTrace: err.stack,
      };
      res.status(statusCode).json(forbiddenErrorPayload);
      break;
    case config.STATUS.NOT_FOUND.CODE:
      const notFoundErrorPayload: ErrorPayload = {
        title: config.STATUS.NOT_FOUND.TITLE,
        message: err.message,
        stackTrace: err.stack,
      };
      res.status(statusCode).json(notFoundErrorPayload);
      break;
    case config.STATUS.SERVER_ERROR.CODE:
      const serverErrorPayload: ErrorPayload = {
        title: config.STATUS.SERVER_ERROR.TITLE,
        message: err.message,
        stackTrace: err.stack,
      };
      res.status(statusCode).json(serverErrorPayload);
      break;
    default:
      const defaultErrorPayload: ErrorPayload = {
        title: config.STATUS.DEFAULT_ERROR.TITLE,
        message: config.STATUS.DEFAULT_ERROR.UNEXPECTED,
        stackTrace: err.stack,
      };
      res.status(config.STATUS.DEFAULT_ERROR.CODE).json(defaultErrorPayload);
  }
};

export default errorHandler;
