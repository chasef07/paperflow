/**
 * PaperFlow Render Function
 *
 * The main entry point for rendering React components to PDF.
 * Provides a simple, Resend-like API.
 */

import type { ReactElement } from 'react';
import {
  type IRDocument,
  type LoadedFont,
  type LoadedImage,
  type PageSizeName,
  type RenderContext,
  type Engine,
  loadFontsForDocument,
  loadImage,
  PaperFlowError,
} from '@paperflow/core';
import { reactToIR } from './react-to-ir.ts';

// =============================================================================
// Types
// =============================================================================

export type EngineName = 'satori' | 'browser';

export interface RenderOptions {
  /** Rendering engine to use */
  engine?: EngineName;
  /** Default page format for pages without explicit size */
  format?: PageSizeName;
  /** Additional fonts to load */
  fonts?: Array<{ family: string; weight?: number; src: string }>;
}

export interface RenderResult {
  /** PDF as a Buffer */
  buffer: Buffer;
  /** Number of pages in the PDF */
  pages: number;
  /** PDF metadata */
  metadata: {
    title?: string;
    author?: string;
    createdAt: Date;
  };

  /** Convert to base64 string */
  toBase64(): string;
  /** Convert to data URI */
  toDataUri(): string;
  /** Save to file (Node.js only) */
  toFile(path: string): Promise<void>;
  /** Convert to ReadableStream */
  toStream(): ReadableStream<Uint8Array>;
}

// Re-export from core
export type { RenderContext, Engine } from '@paperflow/core';

// =============================================================================
// Main Render Function
// =============================================================================

/**
 * Render a React element to PDF
 *
 * @example
 * ```tsx
 * const result = await render(
 *   <Document>
 *     <Page>
 *       <Text>Hello World</Text>
 *     </Page>
 *   </Document>
 * );
 *
 * await result.toFile('output.pdf');
 * ```
 */
export async function render(
  element: ReactElement,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const { engine: engineName = 'satori' } = options;

  try {
    // 1. Convert React to IR
    const ir = await reactToIR(element);

    // Validate document
    if (ir.pages.length === 0) {
      throw new PaperFlowError(
        'Document has no pages',
        'NO_PAGES',
        { suggestion: 'Add at least one <Page> element inside your <Document>' }
      );
    }

    // 2. Load fonts
    const fonts = await loadFontsForDocument(ir);

    // 3. Load images
    const images = new Map<string, LoadedImage>();
    for (const imageUsage of ir.images) {
      try {
        const loaded = await loadImage(imageUsage.originalSrc);
        images.set(imageUsage.id, loaded);
      } catch (error) {
        // Log warning but continue - image will be missing
        console.warn(`Failed to load image: ${imageUsage.src}`, error);
      }
    }

    // 4. Create render context
    const context: RenderContext = { ir, fonts, images };

    // 5. Get engine and render
    const engine = await getEngine(engineName);
    const buffer = await engine.render(context);

    // 6. Build result
    return createRenderResult(buffer, ir);
  } catch (error) {
    if (error instanceof PaperFlowError) {
      throw error;
    }
    throw new PaperFlowError(
      `Render failed: ${error instanceof Error ? error.message : String(error)}`,
      'RENDER_FAILED',
      { originalError: error instanceof Error ? error.name : typeof error }
    );
  }
}

/**
 * Simple render that returns just the buffer
 */
export async function renderToBuffer(element: ReactElement): Promise<Buffer> {
  const result = await render(element);
  return result.buffer;
}

// =============================================================================
// Engine Loading
// =============================================================================

/**
 * Get the rendering engine by name
 */
async function getEngine(name: EngineName): Promise<Engine> {
  switch (name) {
    case 'satori': {
      const { SatoriEngine } = await import('@paperflow/engine-satori');
      return new SatoriEngine();
    }
    case 'browser': {
      throw new PaperFlowError(
        'Browser engine is not yet implemented',
        'UNKNOWN_ENGINE',
        { engine: name, available: ['satori'] }
      );
    }
    default:
      throw new PaperFlowError(
        `Unknown engine: ${name}`,
        'UNKNOWN_ENGINE',
        { engine: name, available: ['satori', 'browser'] }
      );
  }
}

// =============================================================================
// Result Builder
// =============================================================================

/**
 * Create a render result with helper methods
 */
function createRenderResult(buffer: Buffer, ir: IRDocument): RenderResult {
  return {
    buffer,
    pages: ir.pages.length,
    metadata: {
      title: ir.metadata?.title,
      author: ir.metadata?.author,
      createdAt: ir.metadata?.creationDate ?? new Date(),
    },

    toBase64(): string {
      return buffer.toString('base64');
    },

    toDataUri(): string {
      return `data:application/pdf;base64,${this.toBase64()}`;
    },

    async toFile(path: string): Promise<void> {
      // Use Bun's file API if available, otherwise fall back to Node fs
      if (typeof Bun !== 'undefined') {
        await Bun.write(path, buffer);
      } else {
        const { writeFile } = await import('fs/promises');
        await writeFile(path, buffer);
      }
    },

    toStream(): ReadableStream<Uint8Array> {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(buffer));
          controller.close();
        },
      });
    },
  };
}
