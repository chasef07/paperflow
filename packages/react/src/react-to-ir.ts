/**
 * React to IR Converter
 *
 * Converts a React element tree into the PaperFlow Intermediate Representation.
 * This is the bridge between React components and the rendering engines.
 */

import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import {
  type IRDocument,
  type IRPage,
  type IRNode,
  type IRNodeType,
  type IRStyle,
  type IRFontUsage,
  type IRImageUsage,
  type ImageSource,
  type PageSizeName,
  PageSizes,
  normalizeMargin,
  resolvePageSize,
} from '@paperflow/core';
import { ELEMENT_TYPES } from './components.tsx';
import { parseTailwindClasses } from './tailwind.ts';

// =============================================================================
// Types
// =============================================================================

interface ConversionContext {
  fonts: Map<string, Set<number>>;
  images: Map<string, IRImageUsage>;
}

// =============================================================================
// Main Conversion Function
// =============================================================================

/**
 * Convert a React element tree to IR document
 */
export async function reactToIR(element: ReactElement): Promise<IRDocument> {
  const context: ConversionContext = {
    fonts: new Map(),
    images: new Map(),
  };

  // Convert the root element
  const rootNode = convertElement(element, context);

  // Build the document
  const document: IRDocument = {
    version: 1,
    pages: [],
    fonts: [],
    images: [],
  };

  // Extract document metadata and pages
  if (rootNode.type === 'document') {
    // Extract metadata from document props
    if (rootNode.props.title || rootNode.props.author || rootNode.props.subject) {
      document.metadata = {
        title: rootNode.props.title as string | undefined,
        author: rootNode.props.author as string | undefined,
        subject: rootNode.props.subject as string | undefined,
        creator: 'PaperFlow',
        creationDate: new Date(),
      };
    }

    // Extract pages from children
    for (const child of rootNode.children) {
      if (child.type === 'page') {
        document.pages.push(convertToPage(child));
      }
    }
  } else if (rootNode.type === 'page') {
    // Single page without document wrapper
    document.pages.push(convertToPage(rootNode));
  } else {
    // Wrap content in a default page
    document.pages.push({
      size: PageSizes.A4,
      margin: normalizeMargin(40),
      children: [rootNode],
    });
  }

  // Convert fonts map to array
  document.fonts = Array.from(context.fonts.entries()).map(([family, weights]) => ({
    family,
    weights: Array.from(weights).sort((a, b) => a - b),
    styles: ['normal'] as ('normal' | 'italic')[],
  }));

  // Convert images map to array
  document.images = Array.from(context.images.values());

  // Add default font if none specified
  if (document.fonts.length === 0) {
    document.fonts.push({
      family: 'Inter',
      weights: [400],
      styles: ['normal'],
    });
  }

  return document;
}

// =============================================================================
// Element Conversion
// =============================================================================

/**
 * Check if an object is a React-like element (handles both regular and transitional elements)
 */
function isReactElement(obj: unknown): obj is ReactElement {
  if (obj === null || typeof obj !== 'object') return false;
  const el = obj as Record<string, unknown>;
  // Check for $$typeof symbol (works for both react.element and react.transitional.element)
  const typeofSymbol = el.$$typeof;
  if (typeof typeofSymbol === 'symbol') {
    const symbolStr = typeofSymbol.toString();
    return symbolStr.includes('react') && symbolStr.includes('element');
  }
  return false;
}

/**
 * Unwrap function components to get the underlying element
 */
function unwrapElement(element: ReactElement): ReactElement {
  let current = element;

  // Keep unwrapping while the type is a function (component)
  while (typeof current.type === 'function') {
    const fn = current.type as (props: unknown) => ReactElement;
    const result = fn(current.props);
    if (!isReactElement(result)) {
      break;
    }
    current = result;
  }

  return current;
}

/**
 * Convert a React element to an IR node
 */
function convertElement(element: ReactElement, context: ConversionContext): IRNode {
  // Unwrap function components first
  const unwrapped = unwrapElement(element);
  const { type, props: rawProps } = unwrapped;
  const props = rawProps as Record<string, unknown>;

  // Get the element type
  const elementType = getElementType(type);

  // Merge className (Tailwind) with style prop
  const tailwindStyle = props.className
    ? parseTailwindClasses(props.className as string)
    : {};
  const inlineStyle = (props.style ?? {}) as Record<string, unknown>;
  const mergedStyle = mergeStyles(tailwindStyle as Record<string, unknown>, inlineStyle);

  // Track fonts used in styles
  trackFonts(mergedStyle, context);

  // Handle image sources
  if (elementType === 'image' && props.src) {
    trackImage(props.src as ImageSource, context);
  }

  // Convert children
  const children = convertChildren(props.children as ReactNode, context);

  // Build the IR node
  const node: IRNode = {
    type: elementType,
    props: extractProps(props, elementType),
    style: convertStyle(mergedStyle),
    children,
  };

  return node;
}

/**
 * Get the IR node type from a React element type
 */
function getElementType(type: unknown): IRNodeType {
  if (typeof type === 'string') {
    switch (type) {
      case ELEMENT_TYPES.DOCUMENT:
        return 'document';
      case ELEMENT_TYPES.PAGE:
        return 'page';
      case ELEMENT_TYPES.VIEW:
        return 'view';
      case ELEMENT_TYPES.TEXT:
        return 'text';
      case ELEMENT_TYPES.IMAGE:
        return 'image';
      case ELEMENT_TYPES.LINK:
        return 'link';
      default:
        return 'view';
    }
  }

  // Function component or class component - treat as view
  return 'view';
}

/**
 * Convert React children to IR nodes
 */
function convertChildren(children: ReactNode, context: ConversionContext): IRNode[] {
  const result: IRNode[] = [];

  // Handle null/undefined/boolean
  if (children === null || children === undefined || typeof children === 'boolean') {
    return result;
  }

  // Handle arrays
  if (Array.isArray(children)) {
    for (const child of children) {
      result.push(...convertChildren(child, context));
    }
    return result;
  }

  // Handle React elements (both regular and transitional)
  if (isReactElement(children)) {
    result.push(convertElement(children as ReactElement, context));
    return result;
  }

  // Handle strings and numbers as text content
  if (typeof children === 'string' || typeof children === 'number') {
    result.push({
      type: 'text',
      props: { content: String(children) },
      style: {},
      children: [],
    });
    return result;
  }

  // Try to iterate using Children.forEach for any other iterables
  try {
    Children.forEach(children, (child) => {
      if (child === null || child === undefined || typeof child === 'boolean') {
        return;
      }

      if (isReactElement(child)) {
        result.push(convertElement(child as ReactElement, context));
      } else if (typeof child === 'string' || typeof child === 'number') {
        result.push({
          type: 'text',
          props: { content: String(child) },
          style: {},
          children: [],
        });
      }
    });
  } catch {
    // If Children.forEach fails, log and continue
    console.warn('Unexpected children type:', typeof children);
  }

  return result;
}

/**
 * Extract relevant props for an element type
 */
function extractProps(
  props: Record<string, unknown>,
  elementType: IRNodeType
): Record<string, unknown> {
  const extracted: Record<string, unknown> = {};

  // Don't include style, className, or children in props
  const excludeKeys = ['style', 'className', 'children'];

  for (const [key, value] of Object.entries(props)) {
    if (!excludeKeys.includes(key) && value !== undefined) {
      extracted[key] = value;
    }
  }

  return extracted;
}

// =============================================================================
// Page Conversion
// =============================================================================

/**
 * Convert an IR node to a page
 */
function convertToPage(node: IRNode): IRPage {
  const { size, margin, orientation } = node.props;

  // Resolve page size
  let pageSize = resolvePageSize(size as PageSizeName | undefined);

  // Handle orientation
  if (orientation === 'landscape') {
    pageSize = {
      width: pageSize.height,
      height: pageSize.width,
    };
  }

  return {
    size: pageSize,
    margin: normalizeMargin(margin as number | undefined),
    children: node.children,
  };
}

// =============================================================================
// Style Conversion
// =============================================================================

/**
 * Merge Tailwind styles with inline styles (inline takes precedence)
 */
function mergeStyles(
  tailwindStyle: Record<string, unknown>,
  inlineStyle: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...tailwindStyle,
    ...inlineStyle,
  };
}

/**
 * Convert CSS properties to IR style
 */
function convertStyle(style: Record<string, unknown>): IRStyle {
  const irStyle: IRStyle = {};

  for (const [key, value] of Object.entries(style)) {
    if (value !== undefined && value !== null) {
      // Convert camelCase to the IR style format
      (irStyle as Record<string, unknown>)[key] = value;
    }
  }

  return irStyle;
}

// =============================================================================
// Asset Tracking
// =============================================================================

/**
 * Track fonts used in styles
 */
function trackFonts(style: Record<string, unknown>, context: ConversionContext): void {
  const fontFamily = style.fontFamily as string | undefined;
  const fontWeight = (style.fontWeight as number | string | undefined) ?? 400;

  if (fontFamily) {
    // Parse font family (might be comma-separated)
    const families = fontFamily.split(',').map((f) => f.trim().replace(/["']/g, ''));
    const primaryFamily = families[0];

    if (primaryFamily) {
      if (!context.fonts.has(primaryFamily)) {
        context.fonts.set(primaryFamily, new Set());
      }

      const weights = context.fonts.get(primaryFamily)!;
      const weight = typeof fontWeight === 'number' ? fontWeight : parseWeight(fontWeight);
      weights.add(weight);
    }
  }
}

/**
 * Parse font weight string to number
 */
function parseWeight(weight: string): number {
  const weights: Record<string, number> = {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  };

  return weights[weight.toLowerCase()] ?? (parseInt(weight, 10) || 400);
}

/**
 * Track images used in the document
 */
function trackImage(src: ImageSource, context: ConversionContext): void {
  const srcString = typeof src === 'string' ? src : `async-${context.images.size}`;

  if (!context.images.has(srcString)) {
    context.images.set(srcString, {
      id: `img-${context.images.size}`,
      src: srcString,
      originalSrc: src,
    });
  }
}
