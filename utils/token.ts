import * as jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { config } from "../config/common";

interface TokenUser {
  _id?: string | Types.ObjectId;
  id?: string;
  email: string;
  role?: string;
  type?: string;
  firstname?: string;
  lastname?: string;
  avatar?: string;
  isPasswordChanged?: boolean;
}

const generateRefreshToken = (user: TokenUser): string => {
  const userId = user._id instanceof Types.ObjectId ? user._id.toString() : user._id || user.id;

  return jwt.sign(
    {
      id: userId,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isPasswordChanged: user.isPasswordChanged,
    },
    process.env.ACCESS_TOKEN_SECRET || config.JWTCONFIG.SECRET,
    {
      expiresIn: user.type === "user" ? config.JWTCONFIG.EXPIRESIN : "1d",
    }
  );
};

const generateToken = (user: TokenUser): string => {
  const userId = user._id instanceof Types.ObjectId ? user._id.toString() : user._id || user.id;

  return jwt.sign(
    {
      user: {
        id: userId,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        avatar: user.avatar,
        isPasswordChanged: user.isPasswordChanged,
      },
    },
    process.env.ACCESS_TOKEN_SECRET || config.JWTCONFIG.SECRET
  );
};

const sendResponseCookie = (res: any, token: string): any => {
  return res.cookie(config.JWTCONFIG.CLEAR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === config.JWTCONFIG.NODE_ENV,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });
};

export { generateRefreshToken, generateToken, sendResponseCookie };
