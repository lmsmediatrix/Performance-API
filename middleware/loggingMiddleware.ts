import { Request, Response, NextFunction } from "express";
import logger from "../utils/loggerUtils/logger";

interface ExtendedRequest extends Request {
  requestId?: string;
  id?: string;
}

interface ResponseLogType {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: string;
  contentLength: string | number;
  timestamp: string;
  responseSummary?: any;
}

export const loggingMiddleware = (req: ExtendedRequest, res: Response, next: NextFunction) => {
  const requestId = req.requestId || req.id || Math.random().toString(36).substring(2, 15);
  req.requestId = requestId;

  const sanitizedBody = { ...req.body };
  if (sanitizedBody.password) sanitizedBody.password = "[REDACTED]";
  if (sanitizedBody.token) sanitizedBody.token = "[REDACTED]";

  logger.info("Incoming request", {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    body: sanitizedBody,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    timestamp: new Date().toISOString(),
  });

  const start = Date.now();

  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warn" : "info";

    let responseSummary;

    if (typeof body === "string") {
      try {
        responseSummary = JSON.parse(body);
        if (responseSummary.token) responseSummary.token = "[REDACTED]";
        if (responseSummary.password) responseSummary.password = "[REDACTED]";
      } catch (e) {
        responseSummary = { stringResponse: body.substring(0, 200) };
      }
    } else if (body && typeof body === "object") {
      try {
        responseSummary = JSON.parse(JSON.stringify(body));
        if (responseSummary.token) responseSummary.token = "[REDACTED]";
        if (responseSummary.password) responseSummary.password = "[REDACTED]";
      } catch (e) {
        responseSummary = { objectResponse: "Response object could not be serialized" };
      }
    } else {
      responseSummary = { response: body === undefined ? "undefined" : String(body) };
    }

    const responseLog: ResponseLogType = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("Content-Length") || "",
      timestamp: new Date().toISOString(),
      responseSummary: responseSummary,
    };

    logger[logLevel]("Outgoing response", responseLog);

    return originalSend.call(this, body);
  };

  next();
};
