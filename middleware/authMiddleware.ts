import { NextFunction, Response } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { config } from "../config/common";
import { CustomRequest } from "../type/types";

interface DecodedToken {
  user: {
    id: string;
    email: string;
    firstname?: string;
    lastname?: string;
    // direct org id (new tokens)
    organizationId?: string;
    // full org object (from LMS token)
    organization?: any;
    role?: string;
  };
  iat: number;
}

// Default organization id for Uzaro University (used when token carries full org object or no org id)
const DEFAULT_ORGANIZATION_ID = "69aa7492ac4fedd36fe18688";

const unifiedAuthMiddleware = asyncHandler(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    let token: string | null = null;

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (typeof authHeader === "string") {
      const tokenMatch = authHeader.match(/^Bearer\s+(.*)$/i);
      token = tokenMatch?.[1]?.trim() || authHeader.trim();
    }

    if (!token) {
      const xAccessToken = req.headers["x-access-token"];
      if (typeof xAccessToken === "string") {
        token = xAccessToken.trim();
      } else if (Array.isArray(xAccessToken) && xAccessToken.length > 0) {
        token = xAccessToken[0]?.trim() || null;
      }
    }

    if (!token) {
      token =
        req.cookies?.[config.JWTCONFIG.CLEAR_COOKIE] ||
        req.cookies?.accessToken ||
        req.cookies?.token ||
        null;
    }

    if (!token) {
      res.status(401).json({ message: config.ERROR.USER.NOT_AUTHORIZED });
      return;
    }

    try {
      const candidateSecrets = Array.from(
        new Set(
          [
            process.env.ACCESS_TOKEN_SECRET,
            process.env.LMS_ACCESS_TOKEN_SECRET,
            process.env.JWT_SECRET,
            config.JWTCONFIG.SECRET,
          ].filter((secret): secret is string => Boolean(secret && secret.trim()))
        )
      );

      let decoded: DecodedToken | null = null;
      for (const secret of candidateSecrets) {
        try {
          decoded = jwt.verify(token, secret) as DecodedToken;
          break;
        } catch (_error) {
          continue;
        }
      }

      if (!decoded) {
        res.clearCookie(config.JWTCONFIG.CLEAR_COOKIE);
        res.status(401).json({ message: config.ERROR.USER.NOT_AUTHORIZED });
        return;
      }

      if (!decoded.user || !decoded.user.id) {
        res.status(401).json({ message: config.ERROR.USER.NOT_AUTHORIZED });
        return;
      }

      let organizationIdFromToken: string =
        decoded.user.organizationId || decoded.user.organization?._id || "";

      // If the value is not a plain 24-char hex ObjectId string
      // (e.g., it's a full organization object serialized as string),
      // and this is the Uzaro University admin, fallback to known org id.
      const isValidObjectIdString =
        typeof organizationIdFromToken === "string" &&
        /^[0-9a-fA-F]{24}$/.test(organizationIdFromToken);

      if (!isValidObjectIdString && decoded.user.email === "uzaro-university@gmail.com") {
        organizationIdFromToken = DEFAULT_ORGANIZATION_ID;
      }

      req.user = {
        id: decoded.user.id,
        email: decoded.user.email,
        firstName: decoded.user.firstname || "",
        lastName: decoded.user.lastname || "",
        role: decoded.user.role || "",
        organizationId: organizationIdFromToken,
      };
      req.token = token;

      next();
    } catch (error) {
      res.clearCookie(config.JWTCONFIG.CLEAR_COOKIE);
      res.status(401).json({ message: config.ERROR.USER.NOT_AUTHORIZED });
    }
  }
);

export default unifiedAuthMiddleware;
