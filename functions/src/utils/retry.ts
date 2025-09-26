/**
 * Utility functions for retry logic and error handling
 */

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2
};

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain types of errors
      if (isNonRetryableError(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelay
      );

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Determine if an error should not be retried
 */
function isNonRetryableError(error: any): boolean {
  // Don't retry on auth errors
  if (error.code?.startsWith('auth/')) {
    return true;
  }

  // Don't retry on permission errors
  if (error.code === 'permission-denied') {
    return true;
  }

  // Don't retry on invalid argument errors
  if (error.code === 'invalid-argument') {
    return true;
  }

  // Don't retry on not found errors
  if (error.code === 'not-found') {
    return true;
  }

  // Don't retry on quota exceeded (usually temporary but needs manual intervention)
  if (error.code === 'resource-exhausted') {
    return true;
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrap errors with additional context
 */
export class ProcessingError extends Error {
  public readonly context: Record<string, any>;
  public readonly originalError?: Error;

  constructor(message: string, context: Record<string, any> = {}, originalError?: Error) {
    super(message);
    this.name = 'ProcessingError';
    this.context = context;
    this.originalError = originalError;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      originalError: this.originalError?.message,
      stack: this.stack
    };
  }
}

/**
 * Log structured error information
 */
export function logError(error: Error, context: Record<string, any> = {}) {
  const errorInfo = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };

  console.error('Processing error:', JSON.stringify(errorInfo, null, 2));
}
