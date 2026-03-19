import { Response, NextFunction } from "express";
import { CustomRequest } from "../type/types";

export interface TimeoutOptions {
  timeout?: number;
  message?: string;
}

export function requestTimeout(options: TimeoutOptions = {}) {
  const timeout = options.timeout || 120000;
  const message = options.message || "Request timeout - operation took too long to complete";

  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (req.path.includes("/bulk/")) {
      req.setTimeout(timeout);
      res.setTimeout(timeout);
    }

    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: "REQUEST_TIMEOUT",
          message: message,
          timeout: `${timeout / 1000}s`,
          suggestion: "Try reducing batch size or splitting the operation into smaller chunks",
        });
      }
    }, timeout);

    res.on("finish", () => {
      clearTimeout(timeoutId);
    });

    res.on("close", () => {
      clearTimeout(timeoutId);
    });

    next();
  };
}

export function bulkOperationTimeout(req: CustomRequest, res: Response, next: NextFunction) {
  const timeout = 180000;

  req.setTimeout(timeout);
  res.setTimeout(timeout);
  res.setHeader("X-Operation-Type", "bulk");
  res.setHeader("X-Timeout", `${timeout / 1000}s`);

  next();
}

export default { requestTimeout, bulkOperationTimeout };
