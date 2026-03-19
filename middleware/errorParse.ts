/**
 * Parse MongoDB error messages, particularly for duplicate key errors (E11000)
 * @param error - Any error object, potentially from MongoDB
 * @returns Formatted error object with extracted code and message
 */
export function parseMongoError(error: any): { message: string; code: string } {
  const parsedError = {
    message: error.message || "Unknown database error",
    code: String(error.code || "UNKNOWN"),
  };

  if (error.code === 11000 || error.message?.includes("E11000")) {
    const dupKeyMatch = error.message.match(
      /index:\s+\w+_\d+\s+dup\s+key:\s+{\s*(\w+):\s*"([^"]+)"/
    );

    if (dupKeyMatch && dupKeyMatch.length >= 3) {
      const field = dupKeyMatch[1];
      const value = dupKeyMatch[2];
      parsedError.message = `Duplicate value for ${field}: "${value}"`;
      parsedError.code = "E11000";
    } else {
      parsedError.message = "Duplicate detected";
      parsedError.code = "E11000";
    }
  }

  return parsedError;
}
