/**
 * @paperflow/react
 *
 * React components and render function for PaperFlow PDF generation.
 */

// =============================================================================
// Components
// =============================================================================

export {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  ELEMENT_TYPES,
  type DocumentProps,
  type PageProps,
  type ViewProps,
  type TextProps,
  type ImageProps,
  type LinkProps,
} from './components.tsx';

// =============================================================================
// Render
// =============================================================================

export {
  render,
  renderToBuffer,
  type RenderOptions,
  type RenderResult,
  type RenderContext,
  type Engine,
  type EngineName,
} from './render.ts';

// =============================================================================
// Tailwind
// =============================================================================

export { tw, parseTailwindClasses } from './tailwind.ts';

// =============================================================================
// IR Conversion
// =============================================================================

export { reactToIR } from './react-to-ir.ts';

// =============================================================================
// Re-exports from Core
// =============================================================================

export {
  PageSizes,
  PaperFlowError,
  isPaperFlowError,
  loadFont,
  loadImage,
  registerFont,
} from '@paperflow/core';
