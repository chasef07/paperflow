/**
 * PaperFlow Image Loader
 *
 * Loads images from URLs with intelligent caching. No file system dependencies.
 * Supports URL, Buffer, Base64, and async functions as image sources.
 */

import { PaperFlowError } from '../errors.ts';
import type { ImageSource } from '../ir/types.ts';

// =============================================================================
// Types
// =============================================================================

export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'gif' | 'svg';

export interface LoadedImage {
  id: string;
  data: ArrayBuffer;
  format: ImageFormat;
  width?: number;
  height?: number;
}

export interface ImageLoadOptions {
  /**
   * Whether to optimize the image (compress, resize)
   * @default false
   */
  optimize?: boolean;

  /**
   * Maximum width for the image (only if optimize is true)
   */
  maxWidth?: number;

  /**
   * Maximum height for the image (only if optimize is true)
   */
  maxHeight?: number;

  /**
   * Image quality for lossy formats (0-100)
   * @default 80
   */
  quality?: number;
}

// =============================================================================
// Image Cache
// =============================================================================

/**
 * In-memory image cache (per-request in serverless)
 */
const imageCache = new Map<string, LoadedImage>();

/**
 * Clear the image cache (useful for testing)
 */
export function clearImageCache(): void {
  imageCache.clear();
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Load an image from various sources
 */
export async function loadImage(
  src: ImageSource,
  options: ImageLoadOptions = {}
): Promise<LoadedImage> {
  // Handle async function source
  if (typeof src === 'function') {
    const resolvedSrc = await src();
    return loadImage(resolvedSrc, options);
  }

  // Handle ArrayBuffer
  if (src instanceof ArrayBuffer) {
    return loadFromBuffer(src);
  }

  // Handle Uint8Array
  if (src instanceof Uint8Array) {
    // Create a new ArrayBuffer copy to avoid SharedArrayBuffer issues
    const buffer = new ArrayBuffer(src.byteLength);
    new Uint8Array(buffer).set(src);
    return loadFromBuffer(buffer);
  }

  // Handle string sources
  if (typeof src === 'string') {
    // Base64 data URI
    if (src.startsWith('data:')) {
      return loadFromDataUri(src);
    }

    // HTTP(S) URL
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return loadFromUrl(src, options);
    }

    // Local file path - not supported in serverless
    throw new PaperFlowError(
      `Local file paths are not supported. Use a URL instead.`,
      'LOCAL_FILE_NOT_SUPPORTED',
      {
        src,
        suggestion: 'Upload the image to a CDN (like Cloudinary, S3, or Vercel Blob) and use the URL.',
      }
    );
  }

  throw new PaperFlowError(
    `Invalid image source type: ${typeof src}`,
    'INVALID_IMAGE_SOURCE',
    { src: String(src).substring(0, 100) }
  );
}

/**
 * Load multiple images in parallel
 */
export async function loadImages(
  sources: ImageSource[],
  options: ImageLoadOptions = {}
): Promise<LoadedImage[]> {
  const results = await Promise.allSettled(
    sources.map((src) => loadImage(src, options))
  );

  const images: LoadedImage[] = [];
  const errors: Error[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      images.push(result.value);
    } else {
      errors.push(result.reason);
    }
  }

  // If all failed, throw the first error
  if (images.length === 0 && errors.length > 0) {
    throw errors[0];
  }

  return images;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Load image from a URL
 */
async function loadFromUrl(
  url: string,
  options: ImageLoadOptions
): Promise<LoadedImage> {
  // Check cache
  const cached = imageCache.get(url);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(url, {
      // Use HTTP cache
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new PaperFlowError(
        `Failed to load image from URL: ${response.status} ${response.statusText}`,
        'IMAGE_LOAD_FAILED',
        { url, status: response.status }
      );
    }

    const data = await response.arrayBuffer();
    const format = detectImageFormat(data);

    const image: LoadedImage = {
      id: generateImageId(url),
      data,
      format,
    };

    // Cache the result
    imageCache.set(url, image);

    return image;
  } catch (error) {
    if (error instanceof PaperFlowError) {
      throw error;
    }

    throw new PaperFlowError(
      `Failed to fetch image: ${error instanceof Error ? error.message : String(error)}`,
      'IMAGE_FETCH_ERROR',
      { url }
    );
  }
}

/**
 * Load image from a base64 data URI
 */
function loadFromDataUri(dataUri: string): LoadedImage {
  const matches = dataUri.match(/^data:image\/(\w+);base64,(.+)$/);

  if (!matches) {
    throw new PaperFlowError(
      'Invalid base64 image data URI. Expected format: data:image/png;base64,<data>',
      'INVALID_BASE64_IMAGE',
      { dataUri: dataUri.substring(0, 50) + '...' }
    );
  }

  const [, formatStr, base64] = matches;
  const format = normalizeFormat(formatStr ?? 'png');

  // Decode base64 to ArrayBuffer
  const binaryString = atob(base64 ?? '');
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return {
    id: generateImageId(dataUri),
    data: bytes.buffer,
    format,
  };
}

/**
 * Load image from an ArrayBuffer
 */
function loadFromBuffer(buffer: ArrayBuffer): LoadedImage {
  const format = detectImageFormat(buffer);

  return {
    id: generateImageId(buffer),
    data: buffer,
    format,
  };
}

/**
 * Detect image format from magic bytes
 */
function detectImageFormat(data: ArrayBuffer): ImageFormat {
  const arr = new Uint8Array(data);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    arr[0] === 0x89 &&
    arr[1] === 0x50 &&
    arr[2] === 0x4e &&
    arr[3] === 0x47
  ) {
    return 'png';
  }

  // JPEG: FF D8 FF
  if (arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff) {
    return 'jpeg';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    arr[0] === 0x52 &&
    arr[1] === 0x49 &&
    arr[2] === 0x46 &&
    arr[3] === 0x46 &&
    arr[8] === 0x57 &&
    arr[9] === 0x45 &&
    arr[10] === 0x42 &&
    arr[11] === 0x50
  ) {
    return 'webp';
  }

  // GIF: 47 49 46 38
  if (
    arr[0] === 0x47 &&
    arr[1] === 0x49 &&
    arr[2] === 0x46 &&
    arr[3] === 0x38
  ) {
    return 'gif';
  }

  // SVG: Check for <?xml or <svg
  const text = new TextDecoder().decode(arr.slice(0, 100));
  if (text.includes('<?xml') || text.includes('<svg')) {
    return 'svg';
  }

  throw new PaperFlowError(
    'Unknown image format. Supported formats: PNG, JPEG, WebP, GIF, SVG',
    'UNKNOWN_IMAGE_FORMAT',
    {
      firstBytes: Array.from(arr.slice(0, 8))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' '),
    }
  );
}

/**
 * Normalize format string
 */
function normalizeFormat(format: string): ImageFormat {
  const normalized = format.toLowerCase();

  switch (normalized) {
    case 'png':
      return 'png';
    case 'jpg':
    case 'jpeg':
      return 'jpeg';
    case 'webp':
      return 'webp';
    case 'gif':
      return 'gif';
    case 'svg':
    case 'svg+xml':
      return 'svg';
    default:
      return 'png'; // Default to PNG
  }
}

/**
 * Generate a unique ID for an image
 */
function generateImageId(source: string | ArrayBuffer): string {
  if (typeof source === 'string') {
    // Simple hash of the string
    let hash = 0;
    for (let i = 0; i < Math.min(source.length, 1000); i++) {
      const char = source.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `img_${Math.abs(hash).toString(36)}`;
  }

  // Hash first bytes of ArrayBuffer
  const arr = new Uint8Array(source);
  let hash = 0;
  for (let i = 0; i < Math.min(arr.length, 100); i++) {
    hash = ((hash << 5) - hash) + (arr[i] ?? 0);
    hash = hash & hash;
  }
  return `img_${Math.abs(hash).toString(36)}_${arr.length}`;
}

/**
 * Convert ArrayBuffer to base64 data URI
 */
export function toDataUri(image: LoadedImage): string {
  const bytes = new Uint8Array(image.data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  const base64 = btoa(binary);
  const mimeType = getMimeType(image.format);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Get MIME type for image format
 */
function getMimeType(format: ImageFormat): string {
  switch (format) {
    case 'png':
      return 'image/png';
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/png';
  }
}
