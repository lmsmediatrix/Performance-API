import { Response, NextFunction } from "express";
import { CustomRequest } from "../type/types";

export const adminAccessMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    const query =
      typeof req.query.query === "string"
        ? JSON.parse(req.query.query || "{}")
        : req.query.query || {};

    req.query.query = {
      ...query,
      "createdBy._id": req.user.id,
    };

    next();
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};
