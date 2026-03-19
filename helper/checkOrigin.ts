import { CallbackFunction } from "../helper/types";

const wildCardOrigin = (
  origin: string | undefined,
  callback: CallbackFunction,
  ...startsWithUrls: string[]
): void => {
  if (!origin) {
    callback(null, true);
    return;
  }

  const isAllowed = startsWithUrls.some((url) => origin.startsWith(url));
  if (isAllowed) {
    callback(null, true);
  } else {
    callback(new Error("Not allowed by CORS"));
  }
};

export default wildCardOrigin;
