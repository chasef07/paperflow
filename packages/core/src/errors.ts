/**
 * PaperFlow Error System
 *
 * Provides clear, actionable error messages with suggestions for fixing issues.
 * Designed to be AI-friendly - errors should be understandable and fixable.
 */

export type ErrorCode =
  // Font errors
  | 'FONT_LOAD_FAILED'
  | 'FONT_NOT_FOUND'
  | 'INVALID_FONT_FORMAT'
  | 'FONT_FETCH_ERROR'

  // Image errors
  | 'IMAGE_LOAD_FAILED'
  | 'IMAGE_NOT_FOUND'
  | 'INVALID_IMAGE_FORMAT'
  | 'IMAGE_FETCH_ERROR'
  | 'LOCAL_FILE_NOT_SUPPORTED'
  | 'INVALID_IMAGE_SOURCE'
  | 'UNKNOWN_IMAGE_FORMAT'
  | 'INVALID_BASE64_IMAGE'

  // Render errors
  | 'RENDER_FAILED'
  | 'INVALID_DOCUMENT'
  | 'NO_PAGES'
  | 'UNKNOWN_ENGINE'

  // General errors
  | 'UNKNOWN_ERROR';

export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Custom error class for PaperFlow errors.
 * Includes error code, context, and helpful suggestions.
 */
export class PaperFlowError extends Error {
  readonly code: ErrorCode;
  readonly context: ErrorContext;
  readonly suggestion?: string;

  constructor(
    message: string,
    code: ErrorCode,
    context: ErrorContext = {}
  ) {
    super(message);
    this.name = 'PaperFlowError';
    this.code = code;
    this.context = context;
    this.suggestion = getSuggestion(code, context);

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaperFlowError);
    }
  }

  /**
   * Returns a formatted string representation of the error
   */
  override toString(): string {
    let str = `PaperFlowError [${this.code}]: ${this.message}`;

    if (this.suggestion) {
      str += `\n\n💡 Suggestion: ${this.suggestion}`;
    }

    if (Object.keys(this.context).length > 0) {
      str += `\n\nContext: ${JSON.stringify(this.context, null, 2)}`;
    }

    return str;
  }

  /**
   * Returns a JSON representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      suggestion: this.suggestion,
      context: this.context,
    };
  }
}

/**
 * Get a helpful suggestion based on the error code and context
 */
function getSuggestion(code: ErrorCode, context: ErrorContext): string | undefined {
  switch (code) {
    // Font suggestions
    case 'FONT_LOAD_FAILED':
      return `Check that the font "${context.family}" exists. Try using a built-in font like "Inter", "Roboto", or "Open Sans".`;

    case 'FONT_NOT_FOUND':
      return `The font "${context.family}" was not found. Make sure you're using a supported font name. Popular options: Inter, Roboto, Open Sans, Lato, Poppins.`;

    case 'INVALID_FONT_FORMAT':
      return `The font file format is not supported. PaperFlow supports TTF, OTF, and WOFF2 formats.`;

    case 'FONT_FETCH_ERROR':
      return `Failed to fetch font from URL. Check that the URL is accessible and returns a valid font file. URL: ${context.url}`;

    // Image suggestions
    case 'IMAGE_LOAD_FAILED':
      return `Failed to load image from "${context.url}". Make sure the URL is accessible and returns a valid image (PNG, JPEG, or WebP).`;

    case 'IMAGE_NOT_FOUND':
      return `Image not found at "${context.src}". Check that the URL is correct and the image exists.`;

    case 'LOCAL_FILE_NOT_SUPPORTED':
      return `Local file paths are not supported in serverless environments. Upload your image to a CDN (like Cloudinary, S3, or Vercel Blob) and use the URL instead. Path: "${context.src}"`;

    case 'INVALID_IMAGE_SOURCE':
      return `Invalid image source type. Expected a URL string, ArrayBuffer, or async function. Got: ${typeof context.src}`;

    case 'UNKNOWN_IMAGE_FORMAT':
      return `Could not detect image format. Supported formats: PNG, JPEG, WebP. Make sure the image data is valid.`;

    case 'INVALID_BASE64_IMAGE':
      return `Invalid base64 image data URI. Format should be: data:image/png;base64,<data>`;

    // Render suggestions
    case 'RENDER_FAILED':
      return `PDF rendering failed. Check that your document structure is valid and all assets (fonts, images) are accessible.`;

    case 'INVALID_DOCUMENT':
      return `Invalid document structure. Make sure you're using <Document> as the root element with <Page> children.`;

    case 'NO_PAGES':
      return `Document has no pages. Add at least one <Page> element inside your <Document>.`;

    case 'UNKNOWN_ENGINE':
      return `Unknown render engine "${context.engine}". Available engines: satori, typst, browser.`;

    default:
      return undefined;
  }
}

/**
 * Type guard to check if an error is a PaperFlowError
 */
export function isPaperFlowError(error: unknown): error is PaperFlowError {
  return error instanceof PaperFlowError;
}

/**
 * Wrap an error with PaperFlow context
 */
export function wrapError(
  error: unknown,
  code: ErrorCode,
  context: ErrorContext = {}
): PaperFlowError {
  if (isPaperFlowError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new PaperFlowError(message, code, {
    ...context,
    originalError: error instanceof Error ? error.name : typeof error,
  });
}
