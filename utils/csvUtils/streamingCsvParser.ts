import { Readable, Transform } from "stream";
import { parse } from "csv-parse";
import { pipeline } from "stream/promises";

export interface StreamingCSVOptions {
  batchSize?: number;
  onBatch?: (batch: any[], batchIndex: number) => Promise<void>;
  onProgress?: (processed: number) => void;
  onError?: (error: Error, record?: any) => void;
}

export class StreamingCSVParser {
  private options: Required<StreamingCSVOptions>;

  constructor(options: StreamingCSVOptions = {}) {
    this.options = {
      batchSize: options.batchSize || 100,
      onBatch: options.onBatch || (async () => {}),
      onProgress: options.onProgress || (() => {}),
      onError: options.onError || (() => {}),
    };
  }

  async parseBufferInBatches(buffer: Buffer): Promise<{
    totalProcessed: number;
    batches: number;
    errors: any[];
  }> {
    let totalProcessed = 0;
    let batchIndex = 0;
    let currentBatch: any[] = [];
    const errors: any[] = [];

    const batchTransform = new Transform({
      objectMode: true,
      transform: async (record: any, _encoding, callback) => {
        try {
          currentBatch.push(record);
          totalProcessed++;

          if (currentBatch.length >= this.options.batchSize) {
            await this.options.onBatch([...currentBatch], batchIndex);
            currentBatch = [];
            batchIndex++;

            this.options.onProgress(totalProcessed);

            setImmediate(() => callback());
          } else {
            callback();
          }
        } catch (error) {
          this.options.onError(error as Error, record);
          errors.push({ error: (error as Error).message, record });
          callback();
        }
      },

      flush: async (callback) => {
        if (currentBatch.length > 0) {
          try {
            await this.options.onBatch([...currentBatch], batchIndex);
            batchIndex++;
          } catch (error) {
            this.options.onError(error as Error);
            errors.push({ error: (error as Error).message, batch: currentBatch });
          }
        }
        callback();
      },
    });

    const csvParser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      on_error: (error: Error) => {
        this.options.onError(error);
        errors.push({ error: error.message, type: "csv_parse" });
      },
    } as any);

    try {
      await pipeline(Readable.from(buffer.toString()), csvParser, batchTransform);
    } catch (error) {
      this.options.onError(error as Error);
      errors.push({ error: (error as Error).message, type: "pipeline" });
    }

    return {
      totalProcessed,
      batches: batchIndex,
      errors,
    };
  }
}

export async function parseCSVBufferOptimized(buffer: Buffer): Promise<any[]> {
  const data: any[] = [];

  if (buffer.length < 1024 * 1024) {
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

  const parser = new StreamingCSVParser({
    batchSize: 50,
    onBatch: async (batch) => {
      data.push(...batch);
    },
  });

  await parser.parseBufferInBatches(buffer);
  return data;
}
