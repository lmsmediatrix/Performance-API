import crypto from "crypto";
import { config } from "../config/common";
import { TokenData } from "../type/types";

const ENCRYPTION_KEY = Buffer.from(
  "4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
  "hex"
);

const INVITATION_EXPIRY_MILLISECONDS = config.EMAILCONFIG.INVITATION.EXPIRY_MILLISECONDS;

const IV_LENGTH = config.EMAILCONFIG.INVITATION.IV_LENGTH;

export const generateToken = (data: TokenData): string => {
  const timestamp = Date.now();
  const payload = JSON.stringify({
    ...data,
    timestamp,
  });

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(payload, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  const token = Buffer.concat([iv, Buffer.from(encrypted, "base64"), authTag])
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return token;
};

export const validateToken = (token: string): TokenData | null => {
  try {
    const tokenBuffer = Buffer.from(token.replace(/-/g, "+").replace(/_/g, "/"), "base64");

    const iv = tokenBuffer.subarray(0, IV_LENGTH);
    const authTag = tokenBuffer.subarray(-16);
    const encrypted = tokenBuffer.subarray(IV_LENGTH, -16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
      "utf8"
    );
    const tokenData: TokenData = JSON.parse(decrypted);

    const age = Date.now() - tokenData.timestamp!;
    if (age > INVITATION_EXPIRY_MILLISECONDS) {
      return null;
    }

    return tokenData;
  } catch {
    return null;
  }
};

export const getTokenRemainingTime = (token: string): number => {
  try {
    const tokenBuffer = Buffer.from(token.replace(/-/g, "+").replace(/_/g, "/"), "base64");

    const iv = tokenBuffer.subarray(0, IV_LENGTH);
    const authTag = tokenBuffer.subarray(-16);
    const encrypted = tokenBuffer.subarray(IV_LENGTH, -16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
      "utf8"
    );

    const tokenData: TokenData = JSON.parse(decrypted);
    const age = Date.now() - tokenData.timestamp!;

    return Math.max(0, Math.floor((INVITATION_EXPIRY_MILLISECONDS - age) / 1000));
  } catch {
    return 0;
  }
};
