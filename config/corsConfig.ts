import { config } from "./common";
import { CorsOptions, CorsOptionsDelegate } from "cors";
import cors from "cors";
import { Express } from "express";

// Description: This file contains the CORS configuration for the application. It specifies the allowed origins, methods, and whether credentials are allowed.
// This configuration helps prevent cross-origin resource sharing (CORS) issues by defining which origins are allowed to access the server and what methods are allowed to be used.

const createCorsOptions = (): CorsOptions => {
  const envAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const allowedOrigins: (
    | string
    | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void)
  )[] = [config.CORS.LOCAL, config.CORS.DEV_SITE, config.CORS.TEST_SITE, ...envAllowedOrigins];

  const corsOptionsDelegate: CorsOptionsDelegate = (req, callback) => {
    const origin = req.headers.origin;
    if (!origin) {
      callback(null, { origin: true });
      return;
    }

    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (typeof allowedOrigin === "function") {
        let result = false;
        allowedOrigin(origin, (error, allowed) => {
          result = allowed ?? false;
        });
        return result;
      }
      return origin === allowedOrigin;
    });

    if (isAllowed) {
      callback(null, { origin: true });
    } else {
      callback(new Error(config.ERROR.CORS));
    }
  };

  const customOrigin: CorsOptions["origin"] = (requestOrigin, callback) => {
    if (typeof requestOrigin === "string") {
      corsOptionsDelegate({ headers: { origin: requestOrigin } } as any, (error, options) => {
        callback(error, options?.origin === true);
      });
    } else {
      callback(null, false);
    }
  };

  return {
    origin: customOrigin,
    methods: [config.METHOD.GET, config.METHOD.POST, config.METHOD.PUT, config.METHOD.DELETE],
    credentials: true,
  };
};

export const corsOptions = createCorsOptions();
export const corsMiddleware = (app: Express): Express => app.use(cors(createCorsOptions()));
