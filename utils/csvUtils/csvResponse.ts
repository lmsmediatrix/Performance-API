import { Response } from "express";

/**
 * Sends a CSV response with proper headers and content
 * @param res Express response object
 * @param csvContent The CSV content to send
 * @param filename The filename for the download (without .csv extension)
 */
export function sendCSVResponse(res: Response, csvContent: string, filename: string): void {
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const fullFilename = sanitizedFilename.endsWith(".csv")
    ? sanitizedFilename
    : `${sanitizedFilename}.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${fullFilename}"`);
  res.status(200).send(csvContent);
}

export function prettifyHeader(key: string) {
  return key
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function flattenObject(obj: any, prefix = "", res: any = {}) {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && typeof value.toHexString === "function") {
      res[newKey] = value.toHexString();
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenObject(value, newKey, res);
    } else {
      res[newKey] = value;
    }
  }
  return res;
}
