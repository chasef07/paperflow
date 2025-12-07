/**
 * PaperSend Error System
 *
 * Provides clear, actionable error messages with suggestions for fixing issues.
 * Designed to be AI-friendly - errors should be understandable and fixable.
 */
export type ErrorCode = 'FONT_LOAD_FAILED' | 'FONT_NOT_FOUND' | 'INVALID_FONT_FORMAT' | 'FONT_FETCH_ERROR' | 'IMAGE_LOAD_FAILED' | 'IMAGE_NOT_FOUND' | 'INVALID_IMAGE_FORMAT' | 'IMAGE_FETCH_ERROR' | 'LOCAL_FILE_NOT_SUPPORTED' | 'INVALID_IMAGE_SOURCE' | 'UNKNOWN_IMAGE_FORMAT' | 'INVALID_BASE64_IMAGE' | 'RENDER_FAILED' | 'INVALID_DOCUMENT' | 'NO_PAGES' | 'UNKNOWN_ENGINE' | 'UNKNOWN_ERROR';
export interface ErrorContext {
    [key: string]: unknown;
}
/**
 * Custom error class for PaperSend errors.
 * Includes error code, context, and helpful suggestions.
 */
export declare class PaperSendError extends Error {
    readonly code: ErrorCode;
    readonly context: ErrorContext;
    readonly suggestion?: string;
    constructor(message: string, code: ErrorCode, context?: ErrorContext);
    /**
     * Returns a formatted string representation of the error
     */
    toString(): string;
    /**
     * Returns a JSON representation of the error
     */
    toJSON(): Record<string, unknown>;
}
/**
 * Type guard to check if an error is a PaperSendError
 */
export declare function isPaperSendError(error: unknown): error is PaperSendError;
/**
 * Wrap an error with PaperSend context
 */
export declare function wrapError(error: unknown, code: ErrorCode, context?: ErrorContext): PaperSendError;
//# sourceMappingURL=errors.d.ts.map