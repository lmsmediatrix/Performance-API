export interface LogServiceParams {
  limit?: number;
  skip?: number;
}

export interface LogEntry {
  timestamp?: string;
  formattedTime?: string;
  rawLog?: string;
  [key: string]: any;
}

export const LOG_TYPES = ["combined", "error", "success", "security"];
