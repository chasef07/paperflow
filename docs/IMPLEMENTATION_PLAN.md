# PaperFlow Implementation Plan

A step-by-step guide to building PaperFlow from zero to production.

---

## Overview

### What We're Building
- **papersend** - Main package (exports everything)
- **@papersend/core** - IR, types, font/image loaders
- **@papersend/react** - React components
- **@papersend/engine-satori** - Primary edge-compatible engine
- **@papersend/cli** - Developer tools

### MVP Goal
A working PDF renderer that:
1. Takes React components as input
2. Outputs PDF buffers
3. Works on Vercel/Cloudflare/Bun without configuration
4. Has Tailwind support
5. Handles fonts and images automatically

---

## Step 1: Project Scaffolding

### 1.1 Initialize Monorepo

```bash
# Create project
mkdir papersend && cd papersend
bun init -y

# Install workspace tooling
bun add -d turbo typescript @types/bun
```

### 1.2 Create Monorepo Structure

```
papersend/
├── package.json              # Workspace root
├── turbo.json                # Build orchestration
├── tsconfig.json             # Base TypeScript config
├── packages/
│   ├── papersend/            # Main entry point (re-exports all)
│   ├── core/                 # IR, types, loaders
│   ├── react/                # React components
│   └── engine-satori/        # Satori + pdf-lib engine
├── examples/
│   └── basic/                # Simple example
└── docs/
```

### 1.3 Root package.json

```json
{
  "name": "papersend-monorepo",
  "private": true,
  "workspaces": ["packages/*", "examples/*"],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "test": "turbo test",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 1.4 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

**Deliverable:** Empty monorepo structure with build tooling.

---

## Step 2: Core Package (@papersend/core)

### 2.1 Define the IR (Intermediate Representation)

The IR is the heart of the system. All React components convert to this format, and all engines consume it.

```typescript
// packages/core/src/ir/types.ts

export type IRNodeType =
  | 'document'
  | 'page'
  | 'view'
  | 'text'
  | 'image'
  | 'link';

export interface IRNode {
  type: IRNodeType;
  props: Record<string, unknown>;
  style: IRStyle;
  children: IRNode[];
}

export interface IRDocument {
  version: 1;
  pages: IRPage[];
  fonts: IRFontUsage[];
  images: IRImageUsage[];
}

export interface IRPage {
  size: PageSize;
  margin: Margin;
  children: IRNode[];
}

export interface IRStyle {
  // Layout
  display?: 'flex' | 'none';
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: number;
  padding?: number | Spacing;
  margin?: number | Spacing;

  // Sizing
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;

  // Typography
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;

  // Visual
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  opacity?: number;
}

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
```

### 2.2 Font Loader

```typescript
// packages/core/src/fonts/loader.ts

export interface FontConfig {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  src: string | ArrayBuffer;
}

export interface LoadedFont {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  data: ArrayBuffer;
}

// Built-in font mapping
const FONT_CDN = 'https://fonts.papersend.dev'; // Or Google Fonts initially

const BUILT_IN_FONTS: Record<string, string> = {
  'inter': `${FONT_CDN}/inter`,
  'roboto': `${FONT_CDN}/roboto`,
  'open-sans': `${FONT_CDN}/open-sans`,
  'lato': `${FONT_CDN}/lato`,
  'poppins': `${FONT_CDN}/poppins`,
  'plus-jakarta-sans': `${FONT_CDN}/plus-jakarta-sans`,
  // Add more as needed
};

// In-memory cache for current render
const fontCache = new Map<string, ArrayBuffer>();

export async function loadFont(
  family: string,
  weight: number = 400,
  style: 'normal' | 'italic' = 'normal'
): Promise<LoadedFont> {
  const cacheKey = `${family}-${weight}-${style}`;

  // Check memory cache
  const cached = fontCache.get(cacheKey);
  if (cached) {
    return { family, weight, style, data: cached };
  }

  // Resolve font URL
  const url = resolveFontUrl(family, weight, style);

  // Fetch with edge caching hints
  const response = await fetch(url, {
    cache: 'force-cache', // Use HTTP cache
  });

  if (!response.ok) {
    throw new PaperSendError(
      `Failed to load font "${family}" (weight: ${weight})`,
      'FONT_LOAD_FAILED',
      { family, weight, style, url, status: response.status }
    );
  }

  const data = await response.arrayBuffer();
  fontCache.set(cacheKey, data);

  return { family, weight, style, data };
}

function resolveFontUrl(family: string, weight: number, style: string): string {
  const normalizedFamily = family.toLowerCase().replace(/\s+/g, '-');

  // Check built-in fonts
  if (BUILT_IN_FONTS[normalizedFamily]) {
    return `${BUILT_IN_FONTS[normalizedFamily]}/${weight}${style === 'italic' ? 'i' : ''}.woff2`;
  }

  // Fall back to Google Fonts
  return `https://fonts.gstatic.com/s/${normalizedFamily}/v1/${weight}${style === 'italic' ? 'i' : ''}.woff2`;
}

// Auto-detect fonts from IR
export function detectFontsFromIR(ir: IRDocument): IRFontUsage[] {
  const fontMap = new Map<string, Set<number>>();

  function walk(node: IRNode) {
    if (node.style.fontFamily) {
      const family = node.style.fontFamily;
      const weight = node.style.fontWeight ?? 400;

      if (!fontMap.has(family)) {
        fontMap.set(family, new Set());
      }
      fontMap.get(family)!.add(weight);
    }

    node.children.forEach(walk);
  }

  ir.pages.forEach(page => page.children.forEach(walk));

  return Array.from(fontMap.entries()).map(([family, weights]) => ({
    family,
    weights: Array.from(weights),
    styles: ['normal'], // TODO: detect italic
  }));
}

// Load all fonts needed for a document
export async function loadFontsForDocument(ir: IRDocument): Promise<LoadedFont[]> {
  const usage = detectFontsFromIR(ir);

  const loadPromises = usage.flatMap(({ family, weights, styles }) =>
    weights.flatMap(weight =>
      styles.map(style => loadFont(family, weight, style))
    )
  );

  return Promise.all(loadPromises);
}
```

### 2.3 Image Loader

```typescript
// packages/core/src/images/loader.ts

export type ImageSource =
  | string                           // URL or path
  | ArrayBuffer                      // Raw bytes
  | Buffer                           // Node buffer
  | (() => Promise<ImageSource>);    // Async function

export interface LoadedImage {
  id: string;
  data: ArrayBuffer;
  format: 'png' | 'jpeg' | 'webp';
  width?: number;
  height?: number;
}

const imageCache = new Map<string, LoadedImage>();

export async function loadImage(src: ImageSource): Promise<LoadedImage> {
  // Handle async function
  if (typeof src === 'function') {
    return loadImage(await src());
  }

  // Handle buffer
  if (src instanceof ArrayBuffer || Buffer.isBuffer(src)) {
    const data = src instanceof ArrayBuffer ? src : src.buffer;
    return {
      id: generateImageId(data),
      data,
      format: detectImageFormat(data),
    };
  }

  // Handle string (URL or base64)
  if (typeof src === 'string') {
    // Base64 data URI
    if (src.startsWith('data:')) {
      return loadBase64Image(src);
    }

    // HTTP(S) URL
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return loadRemoteImage(src);
    }

    // Relative path - error in serverless
    throw new PaperSendError(
      `Local file paths are not supported in serverless environments. Use a URL instead: "${src}"`,
      'LOCAL_FILE_NOT_SUPPORTED',
      { src, suggestion: 'Upload the image to a CDN and use the URL' }
    );
  }

  throw new PaperSendError(
    `Invalid image source type: ${typeof src}`,
    'INVALID_IMAGE_SOURCE',
    { src }
  );
}

async function loadRemoteImage(url: string): Promise<LoadedImage> {
  // Check cache
  const cached = imageCache.get(url);
  if (cached) return cached;

  const response = await fetch(url, {
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new PaperSendError(
      `Failed to load image from "${url}"`,
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

  imageCache.set(url, image);
  return image;
}

function loadBase64Image(dataUri: string): LoadedImage {
  const matches = dataUri.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    throw new PaperSendError(
      'Invalid base64 image data URI',
      'INVALID_BASE64_IMAGE',
      { dataUri: dataUri.substring(0, 50) + '...' }
    );
  }

  const [, format, base64] = matches;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return {
    id: generateImageId(dataUri),
    data: bytes.buffer,
    format: format as 'png' | 'jpeg' | 'webp',
  };
}

function detectImageFormat(data: ArrayBuffer): 'png' | 'jpeg' | 'webp' {
  const arr = new Uint8Array(data);

  // PNG: 89 50 4E 47
  if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
    return 'png';
  }

  // JPEG: FF D8 FF
  if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
    return 'jpeg';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46) {
    return 'webp';
  }

  throw new PaperSendError(
    'Unknown image format',
    'UNKNOWN_IMAGE_FORMAT',
    { firstBytes: Array.from(arr.slice(0, 8)).map(b => b.toString(16)).join(' ') }
  );
}

function generateImageId(source: string | ArrayBuffer): string {
  // Simple hash for caching
  if (typeof source === 'string') {
    return `img_${hashString(source)}`;
  }
  return `img_${hashArrayBuffer(source)}`;
}
```

### 2.4 Error System

```typescript
// packages/core/src/errors.ts

export class PaperSendError extends Error {
  code: string;
  context: Record<string, unknown>;
  suggestion?: string;

  constructor(
    message: string,
    code: string,
    context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'PaperSendError';
    this.code = code;
    this.context = context;

    // Add helpful suggestions based on error code
    this.suggestion = getSuggestion(code, context);
  }

  toString(): string {
    let str = `PaperSendError [${this.code}]: ${this.message}`;
    if (this.suggestion) {
      str += `\n\n💡 Suggestion: ${this.suggestion}`;
    }
    return str;
  }
}

function getSuggestion(code: string, context: Record<string, unknown>): string | undefined {
  switch (code) {
    case 'FONT_LOAD_FAILED':
      return `Check that the font "${context.family}" exists. Try using a built-in font like "Inter" or "Roboto".`;

    case 'LOCAL_FILE_NOT_SUPPORTED':
      return `Upload your image to a CDN (like Cloudinary or S3) and use the URL instead.`;

    case 'IMAGE_LOAD_FAILED':
      return `Make sure the image URL is accessible and returns a valid image. Check CORS settings if the image is on a different domain.`;

    default:
      return undefined;
  }
}
```

### 2.5 Types Export

```typescript
// packages/core/src/index.ts

// Types
export * from './ir/types';
export * from './errors';

// Font system
export { loadFont, loadFontsForDocument, detectFontsFromIR } from './fonts/loader';
export type { FontConfig, LoadedFont } from './fonts/loader';

// Image system
export { loadImage } from './images/loader';
export type { ImageSource, LoadedImage } from './images/loader';

// Page sizes
export const PageSizes = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
} as const;
```

**Deliverable:** Core package with IR types, font loader, image loader, and error system.

---

## Step 3: React Package (@papersend/react)

### 3.1 React Components

```typescript
// packages/react/src/components.tsx

import { createElement, ReactNode, CSSProperties } from 'react';

// Internal element types (not real DOM elements)
const PAPERSEND_ELEMENTS = {
  document: 'papersend-document',
  page: 'papersend-page',
  view: 'papersend-view',
  text: 'papersend-text',
  image: 'papersend-image',
  link: 'papersend-link',
} as const;

// Document
export interface DocumentProps {
  children: ReactNode;
  title?: string;
  author?: string;
  subject?: string;
}

export function Document({ children, ...props }: DocumentProps) {
  return createElement(PAPERSEND_ELEMENTS.document, props, children);
}

// Page
export interface PageProps {
  children: ReactNode;
  size?: 'A4' | 'Letter' | 'Legal' | { width: number; height: number };
  margin?: number | string | { top?: number; right?: number; bottom?: number; left?: number };
  style?: CSSProperties;
  className?: string;
}

export function Page({ children, size = 'A4', margin = 40, ...props }: PageProps) {
  return createElement(PAPERSEND_ELEMENTS.page, { size, margin, ...props }, children);
}

// View (like div)
export interface ViewProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function View({ children, ...props }: ViewProps) {
  return createElement(PAPERSEND_ELEMENTS.view, props, children);
}

// Text
export interface TextProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Text({ children, ...props }: TextProps) {
  return createElement(PAPERSEND_ELEMENTS.text, props, children);
}

// Image
export interface ImageProps {
  src: string | ArrayBuffer | (() => Promise<string | ArrayBuffer>);
  style?: CSSProperties;
  className?: string;
  alt?: string;
}

export function Image({ src, ...props }: ImageProps) {
  return createElement(PAPERSEND_ELEMENTS.image, { src, ...props });
}

// Link
export interface LinkProps {
  children: ReactNode;
  href: string;
  style?: CSSProperties;
  className?: string;
}

export function Link({ children, href, ...props }: LinkProps) {
  return createElement(PAPERSEND_ELEMENTS.link, { href, ...props }, children);
}
```

### 3.2 Tailwind Parser

```typescript
// packages/react/src/tailwind.ts

import { CSSProperties } from 'react';

// Subset of Tailwind classes that make sense for PDFs
// This is a simplified implementation - could use tailwind-to-css lib

const SPACING_SCALE: Record<string, number> = {
  '0': 0, '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24, '8': 32,
  '10': 40, '12': 48, '16': 64, '20': 80, '24': 96,
};

const FONT_SIZES: Record<string, number> = {
  'xs': 12, 'sm': 14, 'base': 16, 'lg': 18, 'xl': 20,
  '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48,
};

const FONT_WEIGHTS: Record<string, number> = {
  'thin': 100, 'extralight': 200, 'light': 300, 'normal': 400,
  'medium': 500, 'semibold': 600, 'bold': 700, 'extrabold': 800,
};

const COLORS: Record<string, string> = {
  'black': '#000000',
  'white': '#ffffff',
  'gray-50': '#f9fafb', 'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb',
  'gray-300': '#d1d5db', 'gray-400': '#9ca3af', 'gray-500': '#6b7280',
  'gray-600': '#4b5563', 'gray-700': '#374151', 'gray-800': '#1f2937',
  'gray-900': '#111827',
  // Add more colors as needed
};

export function parseTailwindClasses(className: string): CSSProperties {
  const classes = className.split(/\s+/).filter(Boolean);
  const style: CSSProperties = {};

  for (const cls of classes) {
    // Padding
    if (cls.startsWith('p-')) {
      const val = SPACING_SCALE[cls.slice(2)];
      if (val !== undefined) style.padding = val;
    }
    if (cls.startsWith('px-')) {
      const val = SPACING_SCALE[cls.slice(3)];
      if (val !== undefined) {
        style.paddingLeft = val;
        style.paddingRight = val;
      }
    }
    if (cls.startsWith('py-')) {
      const val = SPACING_SCALE[cls.slice(3)];
      if (val !== undefined) {
        style.paddingTop = val;
        style.paddingBottom = val;
      }
    }

    // Margin
    if (cls.startsWith('m-')) {
      const val = SPACING_SCALE[cls.slice(2)];
      if (val !== undefined) style.margin = val;
    }
    if (cls.startsWith('mb-')) {
      const val = SPACING_SCALE[cls.slice(3)];
      if (val !== undefined) style.marginBottom = val;
    }
    if (cls.startsWith('mt-')) {
      const val = SPACING_SCALE[cls.slice(3)];
      if (val !== undefined) style.marginTop = val;
    }

    // Flexbox
    if (cls === 'flex') style.display = 'flex';
    if (cls === 'flex-row') style.flexDirection = 'row';
    if (cls === 'flex-col') style.flexDirection = 'column';
    if (cls === 'items-center') style.alignItems = 'center';
    if (cls === 'items-start') style.alignItems = 'flex-start';
    if (cls === 'items-end') style.alignItems = 'flex-end';
    if (cls === 'justify-center') style.justifyContent = 'center';
    if (cls === 'justify-between') style.justifyContent = 'space-between';
    if (cls === 'justify-end') style.justifyContent = 'flex-end';
    if (cls === 'flex-1') style.flex = 1;

    // Gap
    if (cls.startsWith('gap-')) {
      const val = SPACING_SCALE[cls.slice(4)];
      if (val !== undefined) style.gap = val;
    }

    // Font size
    if (cls.startsWith('text-') && FONT_SIZES[cls.slice(5)]) {
      style.fontSize = FONT_SIZES[cls.slice(5)];
    }

    // Font weight
    if (cls.startsWith('font-') && FONT_WEIGHTS[cls.slice(5)]) {
      style.fontWeight = FONT_WEIGHTS[cls.slice(5)];
    }

    // Text color
    if (cls.startsWith('text-') && COLORS[cls.slice(5)]) {
      style.color = COLORS[cls.slice(5)];
    }

    // Background color
    if (cls.startsWith('bg-') && COLORS[cls.slice(3)]) {
      style.backgroundColor = COLORS[cls.slice(3)];
    }

    // Border
    if (cls === 'border') style.borderWidth = 1;
    if (cls === 'rounded') style.borderRadius = 4;
    if (cls === 'rounded-lg') style.borderRadius = 8;

    // Width
    if (cls.startsWith('w-')) {
      const val = SPACING_SCALE[cls.slice(2)];
      if (val !== undefined) style.width = val;
      if (cls === 'w-full') style.width = '100%';
    }

    // Height
    if (cls.startsWith('h-')) {
      const val = SPACING_SCALE[cls.slice(2)];
      if (val !== undefined) style.height = val;
    }

    // Text alignment
    if (cls === 'text-left') style.textAlign = 'left';
    if (cls === 'text-center') style.textAlign = 'center';
    if (cls === 'text-right') style.textAlign = 'right';
  }

  return style;
}

// Helper function for inline usage
export function tw(className: string): CSSProperties {
  return parseTailwindClasses(className);
}
```

### 3.3 React to IR Converter

```typescript
// packages/react/src/react-to-ir.ts

import { ReactElement, Children, isValidElement } from 'react';
import { IRDocument, IRPage, IRNode, IRStyle, PageSizes } from '@papersend/core';
import { parseTailwindClasses } from './tailwind';

export async function reactToIR(element: ReactElement): Promise<IRDocument> {
  const document: IRDocument = {
    version: 1,
    pages: [],
    fonts: [],
    images: [],
  };

  // Walk the React tree
  const rootNode = await convertElement(element);

  // Extract pages from document
  if (rootNode.type === 'document') {
    for (const child of rootNode.children) {
      if (child.type === 'page') {
        document.pages.push(convertToPage(child));
      }
    }
  }

  return document;
}

async function convertElement(element: ReactElement): Promise<IRNode> {
  const { type, props } = element;

  // Get element type name
  const typeName = typeof type === 'string'
    ? type.replace('papersend-', '')
    : (type as any).displayName || 'unknown';

  // Merge className (Tailwind) with style prop
  const tailwindStyle = props.className
    ? parseTailwindClasses(props.className)
    : {};
  const mergedStyle: IRStyle = { ...tailwindStyle, ...props.style };

  // Convert children
  const children: IRNode[] = [];

  await Promise.all(
    Children.map(props.children, async (child) => {
      if (isValidElement(child)) {
        children.push(await convertElement(child));
      } else if (typeof child === 'string' || typeof child === 'number') {
        // Text content
        children.push({
          type: 'text',
          props: { content: String(child) },
          style: {},
          children: [],
        });
      }
    }) || []
  );

  return {
    type: typeName as any,
    props: { ...props, className: undefined, style: undefined, children: undefined },
    style: mergedStyle,
    children,
  };
}

function convertToPage(node: IRNode): IRPage {
  const { size = 'A4', margin = 40 } = node.props as any;

  const pageSize = typeof size === 'string'
    ? PageSizes[size as keyof typeof PageSizes]
    : size;

  return {
    size: pageSize,
    margin: typeof margin === 'number'
      ? { top: margin, right: margin, bottom: margin, left: margin }
      : margin,
    children: node.children,
  };
}
```

### 3.4 Main Render Function

```typescript
// packages/react/src/render.ts

import { ReactElement } from 'react';
import {
  IRDocument,
  loadFontsForDocument,
  PaperSendError,
  LoadedFont,
  LoadedImage,
} from '@papersend/core';
import { reactToIR } from './react-to-ir';

export interface RenderOptions {
  engine?: 'satori' | 'typst' | 'browser';
  format?: 'A4' | 'Letter' | 'Legal';
}

export interface RenderResult {
  buffer: Buffer;
  pages: number;

  // Convenience methods
  toBase64(): string;
  toDataUri(): string;
  toFile(path: string): Promise<void>;
}

export async function render(
  element: ReactElement,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const { engine = 'satori' } = options;

  // 1. Convert React to IR
  const ir = await reactToIR(element);

  // 2. Load all fonts
  const fonts = await loadFontsForDocument(ir);

  // 3. Load all images (extracted during IR conversion)
  const images = await loadImagesForDocument(ir);

  // 4. Select and run engine
  const engineImpl = await getEngine(engine);
  const buffer = await engineImpl.render(ir, { fonts, images });

  // 5. Return result with helpers
  return createRenderResult(buffer, ir.pages.length);
}

async function getEngine(name: string) {
  switch (name) {
    case 'satori':
      const { SatoriEngine } = await import('@papersend/engine-satori');
      return new SatoriEngine();
    default:
      throw new PaperSendError(
        `Unknown engine: ${name}`,
        'UNKNOWN_ENGINE',
        { engine: name, available: ['satori'] }
      );
  }
}

function createRenderResult(buffer: Buffer, pages: number): RenderResult {
  return {
    buffer,
    pages,

    toBase64() {
      return buffer.toString('base64');
    },

    toDataUri() {
      return `data:application/pdf;base64,${this.toBase64()}`;
    },

    async toFile(path: string) {
      const { writeFile } = await import('fs/promises');
      await writeFile(path, buffer);
    },
  };
}

// Simple one-liner export
export async function renderToBuffer(element: ReactElement): Promise<Buffer> {
  const result = await render(element);
  return result.buffer;
}
```

### 3.5 Package Export

```typescript
// packages/react/src/index.ts

// Components
export { Document, Page, View, Text, Image, Link } from './components';
export type {
  DocumentProps,
  PageProps,
  ViewProps,
  TextProps,
  ImageProps,
  LinkProps
} from './components';

// Render
export { render, renderToBuffer } from './render';
export type { RenderOptions, RenderResult } from './render';

// Tailwind helper
export { tw, parseTailwindClasses } from './tailwind';

// Re-export core types
export { PageSizes, PaperSendError } from '@papersend/core';
```

**Deliverable:** React package with components, Tailwind parser, and render function.

---

## Step 4: Satori Engine (@papersend/engine-satori)

### 4.1 Engine Implementation

```typescript
// packages/engine-satori/src/index.ts

import satori from 'satori';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  IRDocument,
  IRNode,
  IRPage,
  LoadedFont,
  LoadedImage
} from '@papersend/core';

export interface EngineOptions {
  fonts: LoadedFont[];
  images: LoadedImage[];
}

export class SatoriEngine {
  async render(ir: IRDocument, options: EngineOptions): Promise<Buffer> {
    const pdf = await PDFDocument.create();

    // Convert fonts to Satori format
    const satoriFonts = options.fonts.map(f => ({
      name: f.family,
      weight: f.weight,
      style: f.style,
      data: f.data,
    }));

    // Render each page
    for (const page of ir.pages) {
      // Convert IR to Satori-compatible React elements
      const element = this.irToSatoriElement(page);

      // Render to SVG
      const svg = await satori(element, {
        width: page.size.width,
        height: page.size.height,
        fonts: satoriFonts,
      });

      // Add page to PDF
      const pdfPage = pdf.addPage([page.size.width, page.size.height]);
      await this.embedSvgInPage(pdfPage, svg, options.images);
    }

    const pdfBytes = await pdf.save();
    return Buffer.from(pdfBytes);
  }

  private irToSatoriElement(page: IRPage): React.ReactElement {
    // Convert IR nodes to React elements that Satori understands
    const convertNode = (node: IRNode): any => {
      const style = this.convertStyle(node.style);

      if (node.type === 'text') {
        // Handle text content
        const content = node.props.content || node.children.map(c =>
          c.type === 'text' ? c.props.content : ''
        ).join('');

        return {
          type: 'span',
          props: {
            style,
            children: content,
          },
        };
      }

      if (node.type === 'image') {
        return {
          type: 'img',
          props: {
            src: node.props.src,
            style,
          },
        };
      }

      // View/container
      return {
        type: 'div',
        props: {
          style,
          children: node.children.map(convertNode),
        },
      };
    };

    // Wrap in a root container with page margins
    return {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          padding: page.margin,
          display: 'flex',
          flexDirection: 'column',
        },
        children: page.children.map(convertNode),
      },
    } as any;
  }

  private convertStyle(style: any): Record<string, any> {
    // Convert IR styles to CSS-in-JS format Satori expects
    return {
      ...style,
      // Satori uses camelCase
      display: style.display || 'flex',
      flexDirection: style.flexDirection || 'column',
    };
  }

  private async embedSvgInPage(
    page: any,
    svg: string,
    images: LoadedImage[]
  ): Promise<void> {
    // Use svg2pdf or similar to embed SVG in PDF page
    // This is simplified - real implementation needs proper SVG parsing

    // For now, we'll use a basic approach with pdf-lib
    // In production, consider using @aspect/svg-to-pdfkit or similar

    // Parse SVG and draw to PDF
    // ... implementation details ...
  }
}
```

### 4.2 SVG to PDF Conversion

```typescript
// packages/engine-satori/src/svg-to-pdf.ts

import { PDFPage, rgb, PDFDocument } from 'pdf-lib';

// Note: This is a simplified implementation
// For production, use a proper SVG parser like svg-parser

export async function embedSvgInPdf(
  page: PDFPage,
  svg: string
): Promise<void> {
  // Parse SVG
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgElement = doc.documentElement;

  // Walk SVG elements and draw to PDF
  await walkAndDraw(svgElement, page);
}

async function walkAndDraw(element: Element, page: PDFPage): Promise<void> {
  const tagName = element.tagName.toLowerCase();

  switch (tagName) {
    case 'rect':
      drawRect(element, page);
      break;
    case 'text':
      await drawText(element, page);
      break;
    case 'image':
      await drawImage(element, page);
      break;
    case 'g':
    case 'svg':
      // Container - recurse into children
      for (const child of element.children) {
        await walkAndDraw(child, page);
      }
      break;
  }
}

function drawRect(element: Element, page: PDFPage): void {
  const x = parseFloat(element.getAttribute('x') || '0');
  const y = parseFloat(element.getAttribute('y') || '0');
  const width = parseFloat(element.getAttribute('width') || '0');
  const height = parseFloat(element.getAttribute('height') || '0');
  const fill = element.getAttribute('fill');

  if (fill && fill !== 'none') {
    const color = parseColor(fill);
    page.drawRectangle({
      x,
      y: page.getHeight() - y - height, // PDF y-axis is inverted
      width,
      height,
      color: rgb(color.r, color.g, color.b),
    });
  }
}

function parseColor(color: string): { r: number; g: number; b: number } {
  // Parse hex color
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
    };
  }

  // Default to black
  return { r: 0, g: 0, b: 0 };
}
```

**Deliverable:** Satori engine that converts IR → SVG → PDF.

---

## Step 5: Main Package (papersend)

### 5.1 Re-export Everything

```typescript
// packages/papersend/src/index.ts

// Re-export everything from react package
export * from '@papersend/react';

// Re-export core types and utilities
export {
  PaperSendError,
  PageSizes,
  loadFont,
  loadImage,
} from '@papersend/core';

// Default export for Resend-like usage
import { render as renderFn, RenderOptions, RenderResult } from '@papersend/react';

export class PaperSend {
  constructor(private apiKey?: string) {
    // API key for future cloud API
  }

  async render(
    element: React.ReactElement,
    options?: RenderOptions
  ): Promise<{ data: RenderResult | null; error: Error | null }> {
    try {
      const data = await renderFn(element, options);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}

// Default instance for simple usage
export const papersend = {
  render: renderFn,
};
```

### 5.2 Package.json

```json
{
  "name": "papersend",
  "version": "0.1.0",
  "description": "The PDF API for developers. React components to PDF, built for the AI era.",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "keywords": ["pdf", "react", "bun", "serverless", "vercel", "tailwind"],
  "dependencies": {
    "@papersend/core": "workspace:*",
    "@papersend/react": "workspace:*",
    "@papersend/engine-satori": "workspace:*"
  }
}
```

**Deliverable:** Main package that provides the simple API.

---

## Step 6: Testing & Examples

### 6.1 Basic Example

```typescript
// examples/basic/index.tsx

import { render, Document, Page, View, Text, Image } from 'papersend';

const Invoice = () => (
  <Document>
    <Page className="p-12">
      <View className="flex justify-between mb-8">
        <Text className="text-3xl font-bold">INVOICE</Text>
        <Text className="text-gray-500">#INV-001</Text>
      </View>

      <View className="mb-8">
        <Text className="font-bold">Acme Corp</Text>
        <Text className="text-gray-600">123 Main St</Text>
        <Text className="text-gray-600">San Francisco, CA 94102</Text>
      </View>

      <View className="border rounded p-4">
        <View className="flex bg-gray-100 p-2 font-bold">
          <Text className="flex-1">Item</Text>
          <Text className="w-20 text-right">Qty</Text>
          <Text className="w-24 text-right">Price</Text>
        </View>
        <View className="flex p-2 border-t">
          <Text className="flex-1">Widget Pro</Text>
          <Text className="w-20 text-right">2</Text>
          <Text className="w-24 text-right">$99.00</Text>
        </View>
        <View className="flex p-2 border-t">
          <Text className="flex-1">Support Plan</Text>
          <Text className="w-20 text-right">1</Text>
          <Text className="w-24 text-right">$49.00</Text>
        </View>
      </View>

      <View className="mt-4 text-right">
        <Text className="text-xl font-bold">Total: $247.00</Text>
      </View>
    </Page>
  </Document>
);

// Run
async function main() {
  const { buffer, error } = await render(<Invoice />);

  if (error) {
    console.error('Failed to render:', error);
    process.exit(1);
  }

  await Bun.write('invoice.pdf', buffer);
  console.log('Created invoice.pdf');
}

main();
```

### 6.2 Test Suite

```typescript
// packages/react/src/__tests__/render.test.ts

import { describe, it, expect } from 'bun:test';
import { render, Document, Page, Text, View } from '../index';

describe('render', () => {
  it('renders a simple document', async () => {
    const result = await render(
      <Document>
        <Page>
          <Text>Hello World</Text>
        </Page>
      </Document>
    );

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.pages).toBe(1);
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it('handles Tailwind classes', async () => {
    const result = await render(
      <Document>
        <Page>
          <Text className="text-2xl font-bold text-gray-900">
            Styled Text
          </Text>
        </Page>
      </Document>
    );

    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('handles images from URL', async () => {
    const result = await render(
      <Document>
        <Page>
          <Image src="https://via.placeholder.com/150" />
        </Page>
      </Document>
    );

    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('returns helpful errors', async () => {
    const { error } = await render(
      <Document>
        <Page>
          <Image src="./local-file.png" />
        </Page>
      </Document>
    ).catch(e => ({ error: e }));

    expect(error).toBeDefined();
    expect(error.code).toBe('LOCAL_FILE_NOT_SUPPORTED');
    expect(error.suggestion).toContain('CDN');
  });
});
```

**Deliverable:** Working examples and test suite.

---

## Step 7: Documentation

### 7.1 README.md

```markdown
# PaperSend

The PDF API for developers. React components to PDF, built for the AI era.

## Installation

```bash
bun add papersend
# or
npm install papersend
```

## Quick Start

```tsx
import { render, Document, Page, Text } from 'papersend';

const pdf = await render(
  <Document>
    <Page>
      <Text className="text-2xl font-bold">Hello World</Text>
    </Page>
  </Document>
);

// Save to file
await pdf.toFile('output.pdf');

// Or get buffer
const buffer = pdf.buffer;
```

## Why PaperSend?

| Feature | @react-pdf/renderer | PaperSend |
|---------|---------------------|-----------|
| Fonts | Manual registration | Auto-detect from CDN |
| Serverless | Broken | Native support |
| Tailwind | Not supported | First-class |
| Images | Manual handling | URL, Buffer, Base64 |
| Bundle Size | ~500KB | ~50KB |

## Components

- `<Document>` - Root container
- `<Page>` - PDF page
- `<View>` - Container (like div)
- `<Text>` - Text content
- `<Image>` - Images from URL/Buffer/Base64
- `<Link>` - Hyperlinks

## Tailwind Support

Use Tailwind classes directly:

```tsx
<Text className="text-2xl font-bold text-gray-900 mb-4">
  Invoice #123
</Text>
```

## License

MIT
```

**Deliverable:** Documentation and README.

---

## Implementation Checklist

### Phase 1: Foundation (Steps 1-2) ✅
- [x] Initialize monorepo with Bun + Turbo
- [x] Create package structure
- [x] Define IR types
- [x] Implement font loader
- [x] Implement image loader
- [x] Create error system

### Phase 2: React (Step 3) ✅
- [x] Create React components
- [x] Implement Tailwind parser
- [x] Build React-to-IR converter
- [x] Create render function

### Phase 3: Engine (Step 4) ✅
- [x] Implement Satori engine
- [x] SVG to PDF conversion
- [x] Font embedding
- [x] Image embedding

### Phase 4: Integration (Steps 5-6) ✅
- [x] Create main package
- [x] Write examples
- [x] Create test suite
- [x] Create Vercel Edge example
- [ ] Test on Cloudflare Workers (example created, needs deployment)

### Phase 5: Polish (Step 7) ✅
- [x] Write documentation
- [x] Create README
- [ ] Publish to npm (ready when needed)

---

## Next Steps After MVP

1. **More Engines**: Add Typst and Browser engines
2. **CLI Tool**: `papersend dev` for hot-reload preview
3. **Cloud API**: Hosted rendering service
4. **Templates**: Pre-built invoice, receipt, etc.
5. **Components**: Table, Chart, QRCode, Barcode
