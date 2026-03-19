export interface BatchProcessorOptions {
  chunkSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (processed: number, total: number, errors: number) => void;
  onChunkComplete?: (results: any[], errors: any[], chunkIndex: number) => void;
}

export interface BatchResult<T> {
  success: T[];
  errors: Array<{
    data: any;
    error: string;
    index: number;
  }>;
  totalProcessed: number;
  totalErrors: number;
}

export class BatchProcessor {
  private options: Required<BatchProcessorOptions>;

  constructor(options: BatchProcessorOptions = {}) {
    this.options = {
      chunkSize: options.chunkSize || 50,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      onProgress: options.onProgress || (() => {}),
      onChunkComplete: options.onChunkComplete || (() => {}),
    };
  }

  /**
   * Process an array of items in batches
   */
  async process<T, R>(
    items: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    validator?: (item: T, index: number) => Promise<void>
  ): Promise<BatchResult<R>> {
    if (!items || items.length === 0) {
      return {
        success: [],
        errors: [],
        totalProcessed: 0,
        totalErrors: 0,
      };
    }

    const result: BatchResult<R> = {
      success: [],
      errors: [],
      totalProcessed: 0,
      totalErrors: 0,
    };

    // Validate items first if validator is provided
    if (validator) {
      for (let i = 0; i < items.length; i++) {
        try {
          await validator(items[i], i);
        } catch (error) {
          result.errors.push({
            data: items[i],
            error: error instanceof Error ? error.message : String(error),
            index: i,
          });
        }
      }
    }

    // Filter out items that failed validation
    const validItems = items.filter(
      (_, index) => !result.errors.some((error) => error.index === index)
    );

    const chunks = this.chunkArray(validItems, this.options.chunkSize);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      let retryCount = 0;
      let chunkSuccess = false;

      while (retryCount < this.options.maxRetries && !chunkSuccess) {
        try {
          const chunkResults = await processor(chunk);
          result.success.push(...chunkResults);

          this.options.onChunkComplete(chunkResults, [], chunkIndex);
          chunkSuccess = true;
        } catch (error: any) {
          retryCount++;

          if (retryCount >= this.options.maxRetries) {
            // If all retries failed, mark each item in the chunk as failed
            chunk.forEach((item, _itemIndex) => {
              const originalIndex = items.indexOf(item);
              result.errors.push({
                data: item,
                error: error.message || String(error),
                index: originalIndex,
              });
            });

            this.options.onChunkComplete([], result.errors.slice(-chunk.length), chunkIndex);
          } else {
            // Wait before retry
            await this.delay(this.options.retryDelay);
          }
        }
      }

      result.totalProcessed += chunk.length;
      result.totalErrors = result.errors.length;

      // Report progress
      this.options.onProgress(result.totalProcessed, items.length, result.totalErrors);
    }

    return result;
  }

  /**
   * Process items with individual error handling (fallback for failed batch operations)
   */
  async processIndividually<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>
  ): Promise<BatchResult<R>> {
    const result: BatchResult<R> = {
      success: [],
      errors: [],
      totalProcessed: 0,
      totalErrors: 0,
    };

    for (let i = 0; i < items.length; i++) {
      try {
        const itemResult = await processor(items[i], i);
        result.success.push(itemResult);
      } catch (error) {
        result.errors.push({
          data: items[i],
          error: error instanceof Error ? error.message : String(error),
          index: i,
        });
        result.totalErrors++;
      }

      result.totalProcessed++;

      // Report progress every 10 items or at the end
      if (i % 10 === 0 || i === items.length - 1) {
        this.options.onProgress(result.totalProcessed, items.length, result.totalErrors);
      }
    }

    return result;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Utility function for processing MongoDB bulk write errors
 */
export function processBulkWriteError(error: any): {
  successful: any[];
  failed: Array<{ data: any; error: string; index: number }>;
} {
  const successful: any[] = [];
  const failed: Array<{ data: any; error: string; index: number }> = [];

  // Handle MongoDB bulk write errors
  if (error.name === "MongoBulkWriteError" || error.writeErrors) {
    // Add successful insertions
    if (error.insertedDocs) {
      successful.push(...error.insertedDocs);
    }

    // Process write errors
    if (error.writeErrors && Array.isArray(error.writeErrors)) {
      error.writeErrors.forEach((writeError: any, index: number) => {
        let errorMessage =
          writeError.errmsg || writeError.message || writeError.err?.errmsg || "Write error";

        // Handle duplicate key errors specifically
        if (
          writeError.code === 11000 ||
          errorMessage.includes("E11000") ||
          errorMessage.includes("duplicate key")
        ) {
          // Try multiple regex patterns to extract field and value from duplicate key error

          // Pattern 1: dup key: { fieldName: "value" }
          let dupKeyMatch = errorMessage.match(/dup key:\s*{\s*([^:]+):\s*"([^"]*)"?\s*}/i);

          // Pattern 2: index: fieldName_1 dup key: { fieldName: "value" }
          if (!dupKeyMatch) {
            dupKeyMatch = errorMessage.match(
              /index:\s*(\w+)_\d+\s+dup\s+key:\s*{\s*[^:]*:\s*"([^"]*)"/i
            );
          }

          // Pattern 3: Extract field from keyValue object if available
          if (!dupKeyMatch && writeError.keyValue) {
            const firstKey = Object.keys(writeError.keyValue)[0];
            const firstValue = writeError.keyValue[firstKey];
            if (firstKey && firstValue) {
              dupKeyMatch = [null, firstKey, firstValue];
            }
          }

          // Pattern 4: Extract from index name
          if (!dupKeyMatch) {
            const indexMatch = errorMessage.match(/index:\s*(\w+)_/i);
            if (indexMatch) {
              dupKeyMatch = [null, indexMatch[1], ""];
            }
          }

          if (dupKeyMatch) {
            const [, field, value] = dupKeyMatch;
            const cleanField = field?.trim() || "field";
            const cleanValue = value?.trim() || "";

            if (cleanValue) {
              errorMessage = `${cleanField.charAt(0).toUpperCase() + cleanField.slice(1)} '${cleanValue}' already exists`;
            } else {
              errorMessage = `${cleanField.charAt(0).toUpperCase() + cleanField.slice(1)} already exists`;
            }
          } else {
            errorMessage = "Duplicate entry - record already exists";
          }
        }

        failed.push({
          data: writeError.op || writeError.doc || writeError.getOperation?.() || {},
          error: errorMessage,
          index: writeError.index !== undefined ? writeError.index : index,
        });
      });
    }
  }
  // Handle regular MongoDB errors (like single insert duplicates)
  else if (
    error.code === 11000 ||
    error.message?.includes("E11000") ||
    error.message?.includes("duplicate key")
  ) {
    let errorMessage = error.message || error.errmsg || "Duplicate entry";

    // Parse duplicate key error for better message
    let dupKeyMatch = errorMessage.match(/dup key:\s*{\s*([^:]+):\s*"([^"]*)"?\s*}/i);

    if (!dupKeyMatch) {
      dupKeyMatch = errorMessage.match(/index:\s*(\w+)_\d+\s+dup\s+key:\s*{\s*[^:]*:\s*"([^"]*)"/i);
    }

    if (!dupKeyMatch && error.keyValue) {
      const firstKey = Object.keys(error.keyValue)[0];
      const firstValue = error.keyValue[firstKey];
      if (firstKey && firstValue) {
        dupKeyMatch = [null, firstKey, firstValue];
      }
    }

    if (!dupKeyMatch) {
      const indexMatch = errorMessage.match(/index:\s*(\w+)_/i);
      if (indexMatch) {
        dupKeyMatch = [null, indexMatch[1], ""];
      }
    }

    if (dupKeyMatch) {
      const [, field, value] = dupKeyMatch;
      const cleanField = field?.trim() || "field";
      const cleanValue = value?.trim() || "";

      if (cleanValue) {
        errorMessage = `${cleanField.charAt(0).toUpperCase() + cleanField.slice(1)} '${cleanValue}' already exists`;
      } else {
        errorMessage = `${cleanField.charAt(0).toUpperCase() + cleanField.slice(1)} already exists`;
      }
    }

    // For single errors, we don't know the exact failing record, so create a generic error
    failed.push({
      data: {},
      error: errorMessage,
      index: 0,
    });
  }
  // Handle validation errors
  else if (error.name === "ValidationError") {
    const validationErrors = error.errors || {};
    Object.keys(validationErrors).forEach((field, index) => {
      const fieldError = validationErrors[field];
      failed.push({
        data: {},
        error: `${field}: ${fieldError.message || "Validation failed"}`,
        index,
      });
    });
  }
  // Handle other MongoDB errors
  else if (error.name === "MongoError" || error.name === "MongoServerError") {
    failed.push({
      data: {},
      error: error.message || "Database error",
      index: 0,
    });
  }
  // Fallback for unknown errors
  else {
    failed.push({
      data: {},
      error: error.message || error.toString() || "An unexpected error occurred",
      index: 0,
    });
  }

  return { successful, failed };
}
