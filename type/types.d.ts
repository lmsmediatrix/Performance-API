import { Request } from "express";
import { IActivityLogging } from "../models/activityLoggingModel";
import { USER_ROLE, USER_ROLES} from "../config/common";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
}

export interface CustomRequest extends Request {
  user?: AuthUser;
  token?: string;
  io?: any; // Socket.IO instance for progress tracking
}

export interface TokenData {
  payload: {
    email: string;
    firstname: string;
    lastname: string;
    roles: string[];
    organization: {
      code: string;
      role: string;
    };
  };
  timestamp?: number;
}

export interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface Invitation {
  firstname: string;
  lastname: string;
  email: string;
  token: string;
  roles: string[];
  organization: {
    code: string;
    role: string;
  };
  invitationType: "JoinGroup";
  expiryDate: Date;
}
