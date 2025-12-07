/**
 * PaperSend Font Loader
 *
 * Loads fonts from CDN with intelligent caching. No file system dependencies.
 * Works in serverless, edge, and browser environments.
 */
import type { IRDocument, IRFontUsage } from '../ir/types.ts';
export interface FontConfig {
    family: string;
    weight?: number;
    style?: 'normal' | 'italic';
    src: string | ArrayBuffer;
}
export interface LoadedFont {
    family: string;
    weight: number;
    style: 'normal' | 'italic';
    data: ArrayBuffer;
}
/**
 * Clear the font cache (useful for testing)
 */
export declare function clearFontCache(): void;
/**
 * Register a custom font for use in documents
 */
export declare function registerFont(config: FontConfig): void;
/**
 * Load a single font
 */
export declare function loadFont(family: string, weight?: number, style?: 'normal' | 'italic'): Promise<LoadedFont>;
/**
 * Detect all fonts used in an IR document
 */
export declare function detectFontsFromIR(ir: IRDocument): IRFontUsage[];
/**
 * Load all fonts needed for a document
 */
export declare function loadFontsForDocument(ir: IRDocument): Promise<LoadedFont[]>;
//# sourceMappingURL=loader.d.ts.map