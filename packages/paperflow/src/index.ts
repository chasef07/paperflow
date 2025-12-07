/**
 * paperflow
 *
 * The PDF API for developers. React components to PDF, built for the AI era.
 */

import type { ReactElement } from 'react';

// =============================================================================
// Re-export everything from @paperflow/react
// =============================================================================

export {
  // Components
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  type DocumentProps,
  type PageProps,
  type ViewProps,
  type TextProps,
  type ImageProps,
  type LinkProps,

  // Render
  render,
  renderToBuffer,
  type RenderOptions,
  type RenderResult,

  // Tailwind
  tw,
  parseTailwindClasses,

  // Core re-exports
  PageSizes,
  PaperFlowError,
  isPaperFlowError,
  loadFont,
  loadImage,
  registerFont,
} from '@paperflow/react';

import {
  render as renderFn,
  type RenderOptions,
  type RenderResult,
  PaperFlowError,
} from '@paperflow/react';

// =============================================================================
// Version
// =============================================================================

export const VERSION = '0.1.0';

// =============================================================================
// PaperFlow Class (Resend-like API)
// =============================================================================

export interface PaperFlowConfig {
  /** API key for future cloud API */
  apiKey?: string;
  /** Default rendering engine */
  engine?: 'satori' | 'browser';
}

export interface RenderResponse {
  data: RenderResult | null;
  error: PaperFlowError | null;
}

/**
 * PaperFlow client class for Resend-like API.
 *
 * @example
 * ```tsx
 * const paperflow = new PaperFlow();
 *
 * const { data, error } = await paperflow.pdfs.create(
 *   <Document>
 *     <Page>
 *       <Text>Hello World</Text>
 *     </Page>
 *   </Document>
 * );
 *
 * if (error) {
 *   console.error('Failed:', error);
 * } else {
 *   await data.toFile('output.pdf');
 * }
 * ```
 */
export class PaperFlow {
  private config: PaperFlowConfig;

  /**
   * PDF generation methods
   */
  public pdfs: {
    create: (element: ReactElement, options?: RenderOptions) => Promise<RenderResponse>;
  };

  constructor(config: PaperFlowConfig = {}) {
    this.config = config;

    // Bind methods
    this.pdfs = {
      create: this.createPdf.bind(this),
    };
  }

  /**
   * Create a PDF from a React element
   */
  private async createPdf(
    element: ReactElement,
    options: RenderOptions = {}
  ): Promise<RenderResponse> {
    try {
      const mergedOptions: RenderOptions = {
        engine: this.config.engine,
        ...options,
      };

      const data = await renderFn(element, mergedOptions);
      return { data, error: null };
    } catch (err) {
      const error = err instanceof PaperFlowError
        ? err
        : new PaperFlowError(
            err instanceof Error ? err.message : String(err),
            'RENDER_FAILED',
            { originalError: err }
          );
      return { data: null, error };
    }
  }

  /**
   * Render a PDF directly (convenience method)
   */
  async render(element: ReactElement, options?: RenderOptions): Promise<RenderResult> {
    const { data, error } = await this.createPdf(element, options);
    if (error) throw error;
    return data!;
  }
}

// =============================================================================
// Default Instance
// =============================================================================

/**
 * Default PaperFlow instance for simple usage.
 *
 * @example
 * ```tsx
 * import { paperflow } from 'paperflow';
 *
 * const { data, error } = await paperflow.pdfs.create(<MyDocument />);
 * ```
 */
export const paperflow = new PaperFlow();
