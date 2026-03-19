import { Readable } from "stream";
import { parse } from "csv-parse";

interface BulkWriteError {
  errorMessage: string;
  errorCode: number;
  row?: number;
}

export function processBulkWriteErrors(error: any): BulkWriteError[] {
  const errorList: BulkWriteError[] = [];

  if (error.code === 11000 || error.name === "MongoBulkWriteError") {
    (error.writeErrors || []).forEach((writeError: any) => {
      const err = writeError.err || writeError;
      const isDup = err.code === 11000;
      const match =
        isDup && err.errmsg?.match(/index:\s+\w+_\d+\s+dup\s+key:\s+{\s*(\w+):\s*"([^"]+)"/);
      const field = match?.[1] || Object.keys(err.keyValue || {})[0] || "unknown";
      const value = match?.[2] || err.keyValue?.[field] || "unknown";

      errorList.push({
        errorMessage: isDup ? `Duplicate ${field}: "${value}"` : err.errmsg || "Bulk write error",
        errorCode: isDup ? 11000 : err.code || 500,
        row: writeError.index,
      });
    });
  } else {
    errorList.push({
      errorMessage: error.message || "Unknown error occurred",
      errorCode: error.code || 500,
    });
  }

  return errorList;
}

export async function parseCSVBuffer(buffer: Buffer): Promise<any[]> {
  const data: any[] = [];
  const stream = Readable.from(buffer.toString()).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const record of stream) {
    data.push(record);
  }

  return data;
}
