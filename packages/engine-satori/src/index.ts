/**
 * @paperflow/engine-satori
 *
 * Satori-based PDF rendering engine.
 * Converts IR to SVG using Satori, then to PDF using pdf-lib and resvg.
 */

import satori from 'satori';
import { PDFDocument } from 'pdf-lib';
import { Resvg } from '@resvg/resvg-js';
import type {
  IRDocument,
  IRPage,
  IRNode,
  IRStyle,
  LoadedFont,
  LoadedImage,
  RenderContext,
  Engine,
} from '@paperflow/core';

// =============================================================================
// Satori Engine
// =============================================================================

export class SatoriEngine implements Engine {
  /**
   * Render IR document to PDF buffer
   */
  async render(context: RenderContext): Promise<Buffer> {
    const { ir, fonts, images } = context;

    // Create PDF document
    const pdf = await PDFDocument.create();

    // Set metadata
    if (ir.metadata) {
      if (ir.metadata.title) pdf.setTitle(ir.metadata.title);
      if (ir.metadata.author) pdf.setAuthor(ir.metadata.author);
      if (ir.metadata.subject) pdf.setSubject(ir.metadata.subject);
      if (ir.metadata.creator) pdf.setCreator(ir.metadata.creator);
      pdf.setCreationDate(ir.metadata.creationDate ?? new Date());
    }

    // Convert fonts to Satori format
    const satoriFonts = fonts.map((font) => ({
      name: font.family,
      weight: font.weight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
      style: font.style as 'normal' | 'italic',
      data: font.data,
    }));

    // Render each page
    for (const page of ir.pages) {
      await this.renderPage(pdf, page, satoriFonts, images);
    }

    // Save and return
    const pdfBytes = await pdf.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Render a single page
   */
  private async renderPage(
    pdf: PDFDocument,
    page: IRPage,
    fonts: Array<{
      name: string;
      weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
      style: 'normal' | 'italic';
      data: ArrayBuffer;
    }>,
    images: Map<string, LoadedImage>
  ): Promise<void> {
    const { width, height } = page.size;

    // Convert IR to Satori-compatible React element
    const element = this.irToSatoriElement(page, images);

    // Render to SVG using Satori
    const svg = await satori(element, {
      width,
      height,
      fonts,
    });

    // Convert SVG to PNG using resvg (better quality than direct SVG)
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: width * 2, // 2x for better quality
      },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Embed PNG in PDF
    const pngImage = await pdf.embedPng(pngBuffer);
    const pdfPage = pdf.addPage([width, height]);

    // Draw the image to fill the page
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  /**
   * Convert IR page to Satori-compatible element
   */
  private irToSatoriElement(
    page: IRPage,
    images: Map<string, LoadedImage>
  ): React.ReactElement {
    const { width, height } = page.size;
    const { margin } = page;

    // Build the page container with margins
    const pageStyle: Record<string, unknown> = {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      paddingTop: margin.top,
      paddingRight: margin.right,
      paddingBottom: margin.bottom,
      paddingLeft: margin.left,
      backgroundColor: 'white',
      fontFamily: 'Inter, sans-serif',
      fontSize: 16,
      color: '#000000',
    };

    // Convert children
    const children = page.children.map((child, index) =>
      this.irNodeToSatoriElement(child, images, index)
    );

    return {
      type: 'div',
      props: {
        style: pageStyle,
        children,
      },
    } as unknown as React.ReactElement;
  }

  /**
   * Convert an IR node to a Satori element
   */
  private irNodeToSatoriElement(
    node: IRNode,
    images: Map<string, LoadedImage>,
    key: number
  ): React.ReactElement {
    const style = this.convertStyle(node.style);

    switch (node.type) {
      case 'text': {
        // Handle text content
        const content = node.props.content ?? '';
        const textChildren = node.children.length > 0
          ? node.children.map((child, i) => this.irNodeToSatoriElement(child, images, i))
          : content;

        return {
          type: 'span',
          key,
          props: {
            style: {
              display: 'flex',
              ...style,
            },
            children: textChildren,
          },
        } as unknown as React.ReactElement;
      }

      case 'image': {
        const src = node.props.src as string;
        // Try to get loaded image data
        const imageId = `img-${Array.from(images.keys()).indexOf(src)}`;
        const loadedImage = images.get(imageId);

        // Use data URI if we have loaded the image, otherwise use original src
        const imageSrc = loadedImage
          ? this.arrayBufferToDataUri(loadedImage.data, loadedImage.format)
          : src;

        return {
          type: 'img',
          key,
          props: {
            src: imageSrc,
            style: {
              ...style,
              objectFit: style.objectFit ?? 'contain',
            },
          },
        } as unknown as React.ReactElement;
      }

      case 'link': {
        // Links render as styled text in PDF (actual linking not supported in Satori)
        const linkChildren = node.children.map((child, i) =>
          this.irNodeToSatoriElement(child, images, i)
        );

        return {
          type: 'span',
          key,
          props: {
            style: {
              display: 'flex',
              color: '#2563eb',
              textDecoration: 'underline',
              ...style,
            },
            children: linkChildren,
          },
        } as unknown as React.ReactElement;
      }

      case 'view':
      default: {
        // Container element
        const viewChildren = node.children.map((child, i) =>
          this.irNodeToSatoriElement(child, images, i)
        );

        return {
          type: 'div',
          key,
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              ...style,
            },
            children: viewChildren,
          },
        } as unknown as React.ReactElement;
      }
    }
  }

  /**
   * Convert IR style to Satori-compatible style
   */
  private convertStyle(style: IRStyle): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // Copy all valid style properties
    for (const [key, value] of Object.entries(style)) {
      if (value !== undefined && value !== null) {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Convert ArrayBuffer to data URI
   */
  private arrayBufferToDataUri(buffer: ArrayBuffer, format: string): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    const base64 = btoa(binary);

    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
    };

    const mimeType = mimeTypes[format] ?? 'image/png';
    return `data:${mimeType};base64,${base64}`;
  }
}

// Re-export types from core
export type { RenderContext, Engine } from '@paperflow/core';
