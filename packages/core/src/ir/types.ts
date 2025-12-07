/**
 * PaperFlow Intermediate Representation (IR)
 *
 * The IR is the heart of PaperFlow. All React components convert to this format,
 * and all engines consume it. This decouples the component layer from rendering.
 */

// =============================================================================
// Node Types
// =============================================================================

export type IRNodeType =
  | 'document'
  | 'page'
  | 'view'
  | 'text'
  | 'image'
  | 'link';

export interface IRNode {
  type: IRNodeType;
  props: IRNodeProps;
  style: IRStyle;
  children: IRNode[];
}

export interface IRNodeProps {
  // Text content (for text nodes)
  content?: string;

  // Image source (for image nodes)
  src?: string;

  // Link href (for link nodes)
  href?: string;

  // Page-specific
  size?: PageSize;
  margin?: Margin;

  // Document metadata
  title?: string;
  author?: string;
  subject?: string;

  // Generic props passthrough
  [key: string]: unknown;
}

// =============================================================================
// Document Structure
// =============================================================================

export interface IRDocument {
  version: 1;
  pages: IRPage[];
  fonts: IRFontUsage[];
  images: IRImageUsage[];
  metadata?: IRDocumentMetadata;
}

export interface IRDocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  creationDate?: Date;
}

export interface IRPage {
  size: PageSize;
  margin: Margin;
  children: IRNode[];
}

// =============================================================================
// Styling
// =============================================================================

export interface IRStyle {
  // Layout - Flexbox
  display?: 'flex' | 'none';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  flex?: number | string;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  gap?: number;
  rowGap?: number;
  columnGap?: number;

  // Spacing
  padding?: number | string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  margin?: number | string;
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;

  // Sizing
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;

  // Position
  position?: 'relative' | 'absolute';
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
  zIndex?: number;

  // Typography
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: 'normal' | 'italic';
  lineHeight?: number | string;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  color?: string;

  // Visual
  backgroundColor?: string;
  backgroundImage?: string;
  opacity?: number;

  // Border
  borderWidth?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderColor?: string;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;

  // Overflow
  overflow?: 'visible' | 'hidden';

  // Object fit (for images)
  objectFit?: 'contain' | 'cover' | 'fill' | 'none';
  objectPosition?: string;
}

// =============================================================================
// Page Sizing
// =============================================================================

export interface PageSize {
  width: number;
  height: number;
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Standard page sizes in points (1 point = 1/72 inch)
 */
export const PageSizes = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  A5: { width: 419.53, height: 595.28 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
  Tabloid: { width: 792, height: 1224 },
} as const;

export type PageSizeName = keyof typeof PageSizes;

// =============================================================================
// Asset Usage Tracking
// =============================================================================

export interface IRFontUsage {
  family: string;
  weights: number[];
  styles: ('normal' | 'italic')[];
}

export interface IRImageUsage {
  id: string;
  src: string;
  originalSrc: ImageSource;
}

/**
 * Possible image source types
 */
export type ImageSource =
  | string // URL, path, or data URI
  | ArrayBuffer // Raw bytes
  | Uint8Array // Typed array
  | (() => Promise<string | ArrayBuffer | Uint8Array>); // Async function

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert a margin value to a Margin object
 */
export function normalizeMargin(
  margin: number | string | Partial<Margin> | undefined
): Margin {
  if (margin === undefined) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  if (typeof margin === 'number') {
    return { top: margin, right: margin, bottom: margin, left: margin };
  }

  if (typeof margin === 'string') {
    // Parse CSS-like margin string (e.g., "10 20" or "10 20 30 40")
    const parts = margin.split(/\s+/).map(parseFloat);
    if (parts.length === 1) {
      const val = parts[0] ?? 0;
      return { top: val, right: val, bottom: val, left: val };
    }
    if (parts.length === 2) {
      const [vertical, horizontal] = parts;
      return {
        top: vertical ?? 0,
        right: horizontal ?? 0,
        bottom: vertical ?? 0,
        left: horizontal ?? 0,
      };
    }
    if (parts.length === 4) {
      return {
        top: parts[0] ?? 0,
        right: parts[1] ?? 0,
        bottom: parts[2] ?? 0,
        left: parts[3] ?? 0,
      };
    }
  }

  // Partial Margin object
  return {
    top: (margin as Partial<Margin>).top ?? 0,
    right: (margin as Partial<Margin>).right ?? 0,
    bottom: (margin as Partial<Margin>).bottom ?? 0,
    left: (margin as Partial<Margin>).left ?? 0,
  };
}

/**
 * Resolve a page size from name or dimensions
 */
export function resolvePageSize(
  size: PageSizeName | PageSize | undefined
): PageSize {
  if (size === undefined) {
    return PageSizes.A4;
  }

  if (typeof size === 'string') {
    return PageSizes[size] ?? PageSizes.A4;
  }

  return size;
}
