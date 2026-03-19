import { format, transports } from "winston";

interface BetterStackTransportOptions {
  sourceToken: string;
  endpoint: string;
}

const createBetterStackTransport = (options: BetterStackTransportOptions) => {
  const { sourceToken, endpoint } = options;

  return new transports.Http({
    host: new URL(endpoint).host,
    path: new URL(endpoint).pathname,
    ssl: true,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sourceToken}`,
    },
    format: format.combine(format.timestamp(), format.json()),
    log: async (info: any, callback: () => void) => {
      if (info.level !== "info" && info.level !== "error") {
        callback();
        return;
      }

      try {
        const timestamp = new Date().toISOString();
        const logData = {
          dt: timestamp,
          message: info.message,
          level: info.level,
          ...info,
        };

        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sourceToken}`,
          },
          body: JSON.stringify(logData),
        });
      } catch (error) {
        console.error("Error sending log to Better Stack:", error);
      }

      callback();
    },
  });
};

export default createBetterStackTransport;
