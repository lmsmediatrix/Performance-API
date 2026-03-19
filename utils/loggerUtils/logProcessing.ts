const TIMESTAMP_REGEXES = {
  standard: /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/,
  tsError: /\[96m([^[\]]+)\[0m:\[93m(\d+)\[0m:\[93m(\d+)\[0m/g,
  errorMessage: /error\s+TS\d+:\s+([^\r\n]+)/,
};

const IMPORTANT_FIELDS = ["pagination", "success", "data", "error", "message"];

function sanitizeLogContent(content: string): object[] {
  if (!content || content.trim() === "") {
    return [];
  }

  try {
    return content
      .split(/\r?\n/)
      .filter((line) => line.trim() !== "")
      .map((line) => processLogLine(line));
  } catch (error) {
    console.error("Error sanitizing log content:", error);
    return [{ error: "Failed to parse log content", raw: content }];
  }
}

function processLogLine(line: string): object {
  try {
    const logObject = JSON.parse(line);

    formatTimestamp(logObject);
    sanitizeErrorInfo(logObject);
    sanitizeResponseBody(logObject);

    return logObject;
  } catch (err) {
    return { rawLog: line };
  }
}

function formatTimestamp(logObject: any): void {
  if (!logObject.timestamp) return;

  const timestamp = logObject.timestamp;
  const date = new Date(timestamp);

  if (!isNaN(date.getTime())) {
    logObject.formattedTime = date.toLocaleString();
    return;
  }

  const match = TIMESTAMP_REGEXES.standard.exec(timestamp);
  if (match) {
    logObject.formattedTime = new Date(match[1]).toLocaleString();
  } else {
    logObject.formattedTime = "Format unknown";
  }
}

function sanitizeErrorInfo(logObject: any): void {
  if (!logObject.error || typeof logObject.error !== "string") return;

  logObject.rawError = logObject.error;

  if (logObject.error.includes("TSError")) {
    processTypeScriptError(logObject);
  } else {
    const errorLines = logObject.error.split("\n");
    logObject.errorSummary = errorLines[0];
    logObject.formattedError = errorLines[0];
    logObject.error = errorLines[0];
  }
}

function processTypeScriptError(logObject: any): void {
  logObject.errorType = "TypeScript Error";

  const errorMatch = logObject.error.match(TIMESTAMP_REGEXES.errorMessage);
  if (errorMatch && errorMatch[1]) {
    logObject.errorSummary = errorMatch[1].trim();
  }

  const fileLocations: Array<{ file: string; line: number; column: number }> = [];
  const fileMatches = logObject.error.matchAll(TIMESTAMP_REGEXES.tsError);

  for (const match of Array.from(fileMatches) as RegExpMatchArray[]) {
    fileLocations.push({
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
    });
  }

  if (fileLocations.length > 0) {
    logObject.errorLocation = fileLocations[0];

    if (fileLocations.length > 1) {
      logObject.additionalErrorLocations = fileLocations.slice(1);
    }
  }

  logObject.formattedError = `TypeScript Error: ${logObject.errorSummary || ""}`;

  logObject.error = logObject.formattedError;
}

function sanitizeResponseBody(logObject: any): void {
  if (!logObject.responseBody) return;

  if (typeof logObject.responseBody === "string") {
    try {
      const parsedBody = JSON.parse(logObject.responseBody);
      logObject.responseSummary = summarizeResponseBody(parsedBody);
    } catch (e) {
      logObject.responseSummary =
        logObject.responseBody.length > 100
          ? `${logObject.responseBody.substring(0, 100)}... (${logObject.responseBody.length} chars)`
          : logObject.responseBody;
    }
  } else {
    logObject.responseSummary = summarizeResponseBody(logObject.responseBody);
  }
}

function summarizeResponseBody(body: any): any {
  if (!body) return null;

  if (typeof body !== "object") return body;

  if (Array.isArray(body)) {
    return {
      type: "array",
      length: body.length,
      sample:
        body.length > 0
          ? body
              .slice(0, 3)
              .map((item) => (typeof item === "object" ? { type: typeof item } : item))
          : [],
    };
  }

  const summary: Record<string, any> = { type: "object" };

  for (const field of IMPORTANT_FIELDS) {
    if (field in body) {
      if (field === "data" && Array.isArray(body.data)) {
        summary.data = {
          type: "array",
          length: body.data.length,
          sample: body.data.length > 0 ? `${body.data.length} items` : "empty",
        };
      } else if (typeof body[field] === "object") {
        summary[field] = { type: typeof body[field] };
      } else {
        summary[field] = body[field];
      }
    }
  }

  const keys = Object.keys(body);
  summary.keys = keys.length;
  summary.keyNames = keys.slice(0, 5);

  return summary;
}

export default {
  sanitizeLogContent,
  processLogLine,
  formatTimestamp,
  sanitizeErrorInfo,
  sanitizeResponseBody,
  summarizeResponseBody,
};
