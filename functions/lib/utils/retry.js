"use strict";
/**
 * Utility functions for retry logic and error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.ProcessingError = exports.withRetry = void 0;
const DEFAULT_RETRY_OPTIONS = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2
};
/**
 * Execute a function with exponential backoff retry
 */
async function withRetry(fn, options = {}) {
    const opts = Object.assign(Object.assign({}, DEFAULT_RETRY_OPTIONS), options);
    let lastError = new Error('Unknown error');
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            // Don't retry on certain types of errors
            if (isNonRetryableError(error)) {
                throw error;
            }
            // Don't retry on the last attempt
            if (attempt === opts.maxRetries) {
                break;
            }
            // Calculate delay with exponential backoff
            const delay = Math.min(opts.baseDelay * Math.pow(opts.backoffFactor, attempt), opts.maxDelay);
            console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
            await sleep(delay);
        }
    }
    throw lastError;
}
exports.withRetry = withRetry;
/**
 * Determine if an error should not be retried
 */
function isNonRetryableError(error) {
    var _a;
    // Don't retry on auth errors
    if ((_a = error.code) === null || _a === void 0 ? void 0 : _a.startsWith('auth/')) {
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
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Wrap errors with additional context
 */
class ProcessingError extends Error {
    constructor(message, context = {}, originalError) {
        super(message);
        this.name = 'ProcessingError';
        this.context = context;
        this.originalError = originalError;
    }
    toJSON() {
        var _a;
        return {
            name: this.name,
            message: this.message,
            context: this.context,
            originalError: (_a = this.originalError) === null || _a === void 0 ? void 0 : _a.message,
            stack: this.stack
        };
    }
}
exports.ProcessingError = ProcessingError;
/**
 * Log structured error information
 */
function logError(error, context = {}) {
    const errorInfo = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    };
    console.error('Processing error:', JSON.stringify(errorInfo, null, 2));
}
exports.logError = logError;
//# sourceMappingURL=retry.js.map