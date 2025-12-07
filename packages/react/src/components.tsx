/**
 * PaperFlow React Components
 *
 * These components are used to define PDF document structure.
 * They render to custom element types that are later converted to IR.
 */

import { createElement, type ReactNode, type CSSProperties } from 'react';
import type { PageSizeName, PageSize } from '@paperflow/core';

// =============================================================================
// Internal Element Types
// =============================================================================

/**
 * Custom element type names used internally.
 * These are not real DOM elements - they're markers for the IR converter.
 */
export const ELEMENT_TYPES = {
  DOCUMENT: 'paperflow-document',
  PAGE: 'paperflow-page',
  VIEW: 'paperflow-view',
  TEXT: 'paperflow-text',
  IMAGE: 'paperflow-image',
  LINK: 'paperflow-link',
} as const;

// =============================================================================
// Document Component
// =============================================================================

export interface DocumentProps {
  children?: ReactNode;
  /** PDF title metadata */
  title?: string;
  /** PDF author metadata */
  author?: string;
  /** PDF subject metadata */
  subject?: string;
  /** PDF creator metadata */
  creator?: string;
}

/**
 * Root component for a PDF document.
 * Must contain one or more <Page> components.
 *
 * @example
 * ```tsx
 * <Document title="Invoice #123">
 *   <Page>
 *     <Text>Hello World</Text>
 *   </Page>
 * </Document>
 * ```
 */
export function Document({ children, ...props }: DocumentProps) {
  return createElement(ELEMENT_TYPES.DOCUMENT, props, children);
}

// =============================================================================
// Page Component
// =============================================================================

export interface PageProps {
  children?: ReactNode;
  /** Page size - predefined name or custom dimensions */
  size?: PageSizeName | PageSize;
  /** Page margins in points or as object */
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  /** Custom styles for the page */
  style?: CSSProperties;
  /** Tailwind-style class names */
  className?: string;
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
}

/**
 * Represents a single page in the PDF document.
 *
 * @example
 * ```tsx
 * <Page size="A4" margin={40}>
 *   <Text>Page content</Text>
 * </Page>
 * ```
 */
export function Page({
  children,
  size = 'A4',
  margin = 40,
  orientation = 'portrait',
  ...props
}: PageProps) {
  return createElement(
    ELEMENT_TYPES.PAGE,
    { size, margin, orientation, ...props },
    children
  );
}

// =============================================================================
// View Component
// =============================================================================

export interface ViewProps {
  children?: ReactNode;
  /** Custom styles */
  style?: CSSProperties;
  /** Tailwind-style class names */
  className?: string;
  /** Whether this view should stay on one page (no page breaks inside) */
  wrap?: boolean;
  /** Fixed position across all pages */
  fixed?: boolean;
  /** Debug mode - shows bounding box */
  debug?: boolean;
}

/**
 * A container component, similar to a div.
 * Uses flexbox for layout by default.
 *
 * @example
 * ```tsx
 * <View className="flex flex-row gap-4">
 *   <Text>Left</Text>
 *   <Text>Right</Text>
 * </View>
 * ```
 */
export function View({ children, wrap = true, ...props }: ViewProps) {
  return createElement(ELEMENT_TYPES.VIEW, { wrap, ...props }, children);
}

// =============================================================================
// Text Component
// =============================================================================

export interface TextProps {
  children?: ReactNode;
  /** Custom styles */
  style?: CSSProperties;
  /** Tailwind-style class names */
  className?: string;
  /** Whether text can wrap to next page */
  wrap?: boolean;
  /** Fixed position across all pages */
  fixed?: boolean;
  /** Debug mode - shows bounding box */
  debug?: boolean;
  /** Hyphenation callback */
  hyphenationCallback?: (word: string) => string[];
}

/**
 * Text content component.
 *
 * @example
 * ```tsx
 * <Text className="text-2xl font-bold text-gray-900">
 *   Hello World
 * </Text>
 * ```
 */
export function Text({ children, wrap = true, ...props }: TextProps) {
  return createElement(ELEMENT_TYPES.TEXT, { wrap, ...props }, children);
}

// =============================================================================
// Image Component
// =============================================================================

export interface ImageProps {
  /** Image source - URL, base64 data URI, or async function */
  src: string | (() => Promise<string>);
  /** Custom styles */
  style?: CSSProperties;
  /** Tailwind-style class names */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Fixed position across all pages */
  fixed?: boolean;
  /** Debug mode - shows bounding box */
  debug?: boolean;
  /** Cache the image */
  cache?: boolean;
}

/**
 * Image component for embedding images in the PDF.
 * Supports URLs, base64 data URIs, and async functions.
 *
 * @example
 * ```tsx
 * <Image
 *   src="https://example.com/logo.png"
 *   className="w-32 h-32"
 * />
 * ```
 */
export function Image({ src, cache = true, ...props }: ImageProps) {
  return createElement(ELEMENT_TYPES.IMAGE, { src, cache, ...props });
}

// =============================================================================
// Link Component
// =============================================================================

export interface LinkProps {
  children: ReactNode;
  /** URL to link to */
  href: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Tailwind-style class names */
  className?: string;
  /** Debug mode - shows bounding box */
  debug?: boolean;
}

/**
 * Hyperlink component.
 *
 * @example
 * ```tsx
 * <Link href="https://example.com">
 *   Click here
 * </Link>
 * ```
 */
export function Link({ children, href, ...props }: LinkProps) {
  return createElement(ELEMENT_TYPES.LINK, { href, ...props }, children);
}
