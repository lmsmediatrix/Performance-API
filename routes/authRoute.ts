import { Request, Response, Router } from "express";
import { API_ENDPOINTS } from "../config/endpointsConfig";
import { config } from "../config/common";

const router = Router();

const AUTH_COOKIE_KEYS = [
  config.JWTCONFIG.CLEAR_COOKIE,
  "accessToken",
  "token",
  "authToken",
] as const;

router.post(API_ENDPOINTS.USER.LOGOUT, (_req: Request, res: Response) => {
  AUTH_COOKIE_KEYS.forEach((cookieName) => {
    res.clearCookie(cookieName, { path: "/" });
    res.clearCookie(cookieName, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
  });

  res.status(200).json({
    message: config.SUCCESS.USER.LOGOUT,
  });
});

export default router;

