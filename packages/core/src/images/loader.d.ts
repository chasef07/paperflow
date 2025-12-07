/**
 * PaperSend Image Loader
 *
 * Loads images from URLs with intelligent caching. No file system dependencies.
 * Supports URL, Buffer, Base64, and async functions as image sources.
 */
import type { ImageSource } from '../ir/types.ts';
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
/**
 * Clear the image cache (useful for testing)
 */
export declare function clearImageCache(): void;
/**
 * Load an image from various sources
 */
export declare function loadImage(src: ImageSource, options?: ImageLoadOptions): Promise<LoadedImage>;
/**
 * Load multiple images in parallel
 */
export declare function loadImages(sources: ImageSource[], options?: ImageLoadOptions): Promise<LoadedImage[]>;
/**
 * Convert ArrayBuffer to base64 data URI
 */
export declare function toDataUri(image: LoadedImage): string;
//# sourceMappingURL=loader.d.ts.map