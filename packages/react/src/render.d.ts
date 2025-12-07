/**
 * PaperSend Render Function
 *
 * The main entry point for rendering React components to PDF.
 * Provides a simple, Resend-like API.
 */
import type { ReactElement } from 'react';
import { type IRDocument, type LoadedFont, type LoadedImage, type PageSizeName } from '@papersend/core';
export type EngineName = 'satori' | 'browser';
export interface RenderOptions {
    /** Rendering engine to use */
    engine?: EngineName;
    /** Default page format for pages without explicit size */
    format?: PageSizeName;
    /** Additional fonts to load */
    fonts?: Array<{
        family: string;
        weight?: number;
        src: string;
    }>;
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
export interface RenderContext {
    ir: IRDocument;
    fonts: LoadedFont[];
    images: Map<string, LoadedImage>;
}
export interface Engine {
    render(context: RenderContext): Promise<Buffer>;
}
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
export declare function render(element: ReactElement, options?: RenderOptions): Promise<RenderResult>;
/**
 * Simple render that returns just the buffer
 */
export declare function renderToBuffer(element: ReactElement): Promise<Buffer>;
//# sourceMappingURL=render.d.ts.map