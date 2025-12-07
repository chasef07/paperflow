/**
 * @paperflow/core
 *
 * Core types, IR, and loaders for PaperFlow.
 * This package provides the foundation that all other packages build upon.
 */

// =============================================================================
// IR (Intermediate Representation)
// =============================================================================

export {
  // Types
  type IRNodeType,
  type IRNode,
  type IRNodeProps,
  type IRDocument,
  type IRDocumentMetadata,
  type IRPage,
  type IRStyle,
  type PageSize,
  type Margin,
  type IRFontUsage,
  type IRImageUsage,
  type ImageSource,
  type PageSizeName,

  // Constants
  PageSizes,

  // Helpers
  normalizeMargin,
  resolvePageSize,
} from './ir/index.ts';

// =============================================================================
// Error System
// =============================================================================

export {
  PaperFlowError,
  isPaperFlowError,
  wrapError,
  type ErrorCode,
  type ErrorContext,
} from './errors.ts';

// =============================================================================
// Font System
// =============================================================================

export {
  loadFont,
  loadFontsForDocument,
  detectFontsFromIR,
  registerFont,
  clearFontCache,
  type FontConfig,
  type LoadedFont,
} from './fonts/index.ts';

// =============================================================================
// Image System
// =============================================================================

export {
  loadImage,
  loadImages,
  clearImageCache,
  toDataUri,
  type ImageFormat,
  type LoadedImage,
  type ImageLoadOptions,
} from './images/index.ts';

// =============================================================================
// Engine System
// =============================================================================

import type { IRDocument } from './ir/index.ts';
import type { LoadedFont } from './fonts/index.ts';
import type { LoadedImage } from './images/index.ts';

/**
 * Context passed to rendering engines
 */
export interface RenderContext {
  ir: IRDocument;
  fonts: LoadedFont[];
  images: Map<string, LoadedImage>;
}

/**
 * Interface that all rendering engines must implement
 */
export interface Engine {
  render(context: RenderContext): Promise<Buffer>;
}
