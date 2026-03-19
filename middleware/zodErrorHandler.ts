import { ZodError } from "zod";
import { Response } from "express";
import logger from "../utils/loggerUtils/logger";
import { parseMongoError } from "./errorParse";

export const handleZodError = (error: unknown, res: Response) => {
  const errorId = Math.random().toString(36).substring(2, 15);

  if (error instanceof ZodError) {
    const validationErrors = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    return res.status(400).json({
      error: "Validation error",
      errorId,
      details: validationErrors,
    });
  }

  if (error instanceof Error && (error as any).error && (error as any).errorId) {
    return res.status(400).json(error);
  }

  if (
    error instanceof Error &&
    (error.message.includes("E11000") || (error as any).code === 11000)
  ) {
    const parsedError = parseMongoError(error);
    return res.status(409).json({
      error: {
        message: parsedError.message,
        code: parsedError.code,
      },
      errorId,
    });
  }

  if (error instanceof Error) {
    const errorDetails = {
      errorId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };

    logger.error("Request error", errorDetails);
    return res.status(400).json({
      error: {
        message: error.message,
      },
      errorId,
    });
  }

  const unknownError = {
    errorId,
    error: error,
    timestamp: new Date().toISOString(),
  };

  logger.error("Unknown error occurred", unknownError);

  return res.status(500).json({
    error: "An unknown error occurred",
    errorId,
  });
};
