/**
 * PaperFlow Font Loader
 *
 * Loads fonts from CDN with intelligent caching. No file system dependencies.
 * Works in serverless, edge, and browser environments.
 */

import { PaperFlowError } from '../errors.ts';
import type { IRDocument, IRNode, IRFontUsage } from '../ir/types.ts';

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Font Registry
// =============================================================================

/**
 * Google Fonts CDN base URL
 * We use Google Fonts as the primary source for built-in fonts
 */
const GOOGLE_FONTS_CSS_URL = 'https://fonts.googleapis.com/css2';

/**
 * Built-in font mappings
 * Maps font family names to their Google Fonts identifiers
 */
const BUILT_IN_FONTS: Record<string, string> = {
  // Sans-serif
  'inter': 'Inter',
  'roboto': 'Roboto',
  'open-sans': 'Open+Sans',
  'opensans': 'Open+Sans',
  'lato': 'Lato',
  'poppins': 'Poppins',
  'montserrat': 'Montserrat',
  'nunito': 'Nunito',
  'raleway': 'Raleway',
  'ubuntu': 'Ubuntu',
  'plus-jakarta-sans': 'Plus+Jakarta+Sans',
  'plusjakartasans': 'Plus+Jakarta+Sans',
  'dm-sans': 'DM+Sans',
  'dmsans': 'DM+Sans',
  'source-sans-pro': 'Source+Sans+Pro',
  'work-sans': 'Work+Sans',
  'nunito-sans': 'Nunito+Sans',

  // Serif
  'merriweather': 'Merriweather',
  'playfair-display': 'Playfair+Display',
  'lora': 'Lora',
  'pt-serif': 'PT+Serif',
  'source-serif-pro': 'Source+Serif+Pro',
  'crimson-text': 'Crimson+Text',

  // Monospace
  'fira-code': 'Fira+Code',
  'jetbrains-mono': 'JetBrains+Mono',
  'source-code-pro': 'Source+Code+Pro',
  'roboto-mono': 'Roboto+Mono',
  'ibm-plex-mono': 'IBM+Plex+Mono',
};

/**
 * Default font to use if none specified
 */
const DEFAULT_FONT = 'Inter';

// =============================================================================
// Font Cache
// =============================================================================

/**
 * In-memory font cache (per-request in serverless)
 */
const fontCache = new Map<string, ArrayBuffer>();

/**
 * Custom fonts registered by the user
 */
const customFonts = new Map<string, FontConfig[]>();

/**
 * Clear the font cache (useful for testing)
 */
export function clearFontCache(): void {
  fontCache.clear();
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Register a custom font for use in documents
 */
export function registerFont(config: FontConfig): void {
  const family = normalizeFamily(config.family);
  const existing = customFonts.get(family) ?? [];
  existing.push(config);
  customFonts.set(family, existing);
}

/**
 * Load a single font
 */
export async function loadFont(
  family: string,
  weight: number = 400,
  style: 'normal' | 'italic' = 'normal'
): Promise<LoadedFont> {
  const normalizedFamily = normalizeFamily(family);
  const cacheKey = `${normalizedFamily}-${weight}-${style}`;

  // Check memory cache
  const cached = fontCache.get(cacheKey);
  if (cached) {
    return { family: normalizedFamily, weight, style, data: cached };
  }

  // Check custom fonts first
  const customFont = findCustomFont(normalizedFamily, weight, style);
  if (customFont) {
    const data = await resolveCustomFontData(customFont);
    fontCache.set(cacheKey, data);
    return { family: normalizedFamily, weight, style, data };
  }

  // Try to load from Google Fonts
  try {
    const data = await loadFromGoogleFonts(normalizedFamily, weight, style);
    fontCache.set(cacheKey, data);
    return { family: normalizedFamily, weight, style, data };
  } catch (error) {
    throw new PaperFlowError(
      `Failed to load font "${family}" (weight: ${weight}, style: ${style})`,
      'FONT_LOAD_FAILED',
      { family, weight, style, originalError: String(error) }
    );
  }
}

/**
 * Detect all fonts used in an IR document
 */
export function detectFontsFromIR(ir: IRDocument): IRFontUsage[] {
  const fontMap = new Map<string, { weights: Set<number>; styles: Set<'normal' | 'italic'> }>();

  function walk(node: IRNode): void {
    const family = node.style.fontFamily;
    if (family) {
      const normalizedFamily = normalizeFamily(family);
      const weight = normalizeWeight(node.style.fontWeight) ?? 400;
      const style = node.style.fontStyle ?? 'normal';

      if (!fontMap.has(normalizedFamily)) {
        fontMap.set(normalizedFamily, { weights: new Set(), styles: new Set() });
      }

      const entry = fontMap.get(normalizedFamily)!;
      entry.weights.add(weight);
      entry.styles.add(style);
    }

    // Recurse into children
    for (const child of node.children) {
      walk(child);
    }
  }

  // Walk all pages
  for (const page of ir.pages) {
    for (const child of page.children) {
      walk(child);
    }
  }

  // Add default font if no fonts detected
  if (fontMap.size === 0) {
    fontMap.set(normalizeFamily(DEFAULT_FONT), {
      weights: new Set([400]),
      styles: new Set(['normal']),
    });
  }

  // Convert to array
  return Array.from(fontMap.entries()).map(([family, { weights, styles }]) => ({
    family,
    weights: Array.from(weights).sort((a, b) => a - b),
    styles: Array.from(styles),
  }));
}

/**
 * Load all fonts needed for a document
 */
export async function loadFontsForDocument(ir: IRDocument): Promise<LoadedFont[]> {
  const usage = detectFontsFromIR(ir);

  const loadPromises: Promise<LoadedFont>[] = [];

  for (const { family, weights, styles } of usage) {
    for (const weight of weights) {
      for (const style of styles) {
        loadPromises.push(loadFont(family, weight, style));
      }
    }
  }

  // Load all fonts in parallel
  const results = await Promise.allSettled(loadPromises);

  const fonts: LoadedFont[] = [];
  const errors: Error[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      fonts.push(result.value);
    } else {
      errors.push(result.reason);
    }
  }

  // If some fonts failed but we have at least one, continue with what we have
  if (fonts.length === 0 && errors.length > 0) {
    throw errors[0];
  }

  return fonts;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Normalize font family name for consistent lookup
 */
function normalizeFamily(family: string): string {
  // Remove quotes and normalize case/spacing
  return family
    .replace(/["']/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Normalize font weight to a number
 */
function normalizeWeight(weight: string | number | undefined): number | undefined {
  if (weight === undefined) return undefined;
  if (typeof weight === 'number') return weight;

  const weightMap: Record<string, number> = {
    thin: 100,
    hairline: 100,
    extralight: 200,
    ultralight: 200,
    light: 300,
    normal: 400,
    regular: 400,
    medium: 500,
    semibold: 600,
    demibold: 600,
    bold: 700,
    extrabold: 800,
    ultrabold: 800,
    black: 900,
    heavy: 900,
  };

  return weightMap[weight.toLowerCase()] ?? (parseInt(weight, 10) || 400);
}

/**
 * Find a custom font matching the criteria
 */
function findCustomFont(
  family: string,
  weight: number,
  style: 'normal' | 'italic'
): FontConfig | undefined {
  const fonts = customFonts.get(family);
  if (!fonts) return undefined;

  // First try exact match
  const exact = fonts.find(
    (f) => (f.weight ?? 400) === weight && (f.style ?? 'normal') === style
  );
  if (exact) return exact;

  // Fall back to any font in the family
  return fonts[0];
}

/**
 * Resolve custom font data (handle string URLs vs ArrayBuffer)
 */
async function resolveCustomFontData(config: FontConfig): Promise<ArrayBuffer> {
  if (config.src instanceof ArrayBuffer) {
    return config.src;
  }

  // It's a URL string
  const response = await fetch(config.src);
  if (!response.ok) {
    throw new PaperFlowError(
      `Failed to fetch custom font from URL`,
      'FONT_FETCH_ERROR',
      { url: config.src, status: response.status }
    );
  }

  return response.arrayBuffer();
}

/**
 * Load font from Google Fonts
 */
async function loadFromGoogleFonts(
  family: string,
  weight: number,
  style: 'normal' | 'italic'
): Promise<ArrayBuffer> {
  // Get Google Fonts identifier
  const googleFontName = BUILT_IN_FONTS[family] ?? capitalizeWords(family.replace(/-/g, ' ')).replace(/ /g, '+');

  // Build the CSS URL
  const italic = style === 'italic' ? 'ital,' : '';
  const cssUrl = `${GOOGLE_FONTS_CSS_URL}?family=${googleFontName}:${italic}wght@${style === 'italic' ? '1,' : ''}${weight}&display=swap`;

  // Fetch CSS to get font URL
  const cssResponse = await fetch(cssUrl, {
    headers: {
      // Request woff2 format
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!cssResponse.ok) {
    throw new Error(`Google Fonts CSS request failed: ${cssResponse.status}`);
  }

  const css = await cssResponse.text();

  // Extract font URL from CSS (handles both woff2 and ttf formats)
  const urlMatch = css.match(/url\(([^)]+\.(woff2|ttf|otf)[^)]*)\)/);
  if (!urlMatch?.[1]) {
    throw new Error(`Could not find font URL in Google Fonts CSS. CSS content: ${css.substring(0, 200)}`);
  }

  const fontUrl = urlMatch[1].replace(/['"]/g, '');

  // Fetch the actual font file
  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) {
    throw new Error(`Font file request failed: ${fontResponse.status}`);
  }

  return fontResponse.arrayBuffer();
}

/**
 * Capitalize each word in a string
 */
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
