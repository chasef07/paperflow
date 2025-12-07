/**
 * Render Tests
 *
 * Test suite for the PaperFlow render function.
 */

import { describe, it, expect } from 'bun:test';
import { render, Document, Page, Text, View, Image, Link } from '../index.ts';

describe('render', () => {
  describe('basic rendering', () => {
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

    it('renders multiple pages', async () => {
      const result = await render(
        <Document>
          <Page>
            <Text>Page 1</Text>
          </Page>
          <Page>
            <Text>Page 2</Text>
          </Page>
        </Document>
      );

      expect(result.pages).toBe(2);
    });

    it('includes document metadata', async () => {
      const result = await render(
        <Document title="Test Document" author="Test Author">
          <Page>
            <Text>Content</Text>
          </Page>
        </Document>
      );

      expect(result.metadata.title).toBe('Test Document');
      expect(result.metadata.author).toBe('Test Author');
      expect(result.metadata.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('page sizes', () => {
    it('renders A4 pages', async () => {
      const result = await render(
        <Document>
          <Page size="A4">
            <Text>A4 Page</Text>
          </Page>
        </Document>
      );

      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('renders Letter pages', async () => {
      const result = await render(
        <Document>
          <Page size="Letter">
            <Text>Letter Page</Text>
          </Page>
        </Document>
      );

      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('renders landscape pages', async () => {
      const result = await render(
        <Document>
          <Page size="A4" orientation="landscape">
            <Text>Landscape Page</Text>
          </Page>
        </Document>
      );

      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('components', () => {
    it('renders View containers', async () => {
      const result = await render(
        <Document>
          <Page>
            <View>
              <Text>Inside View</Text>
            </View>
          </Page>
        </Document>
      );

      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('renders nested Views', async () => {
      const result = await render(
        <Document>
          <Page>
            <View>
              <View>
                <View>
                  <Text>Deeply Nested</Text>
                </View>
              </View>
            </View>
          </Page>
        </Document>
      );

      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('renders Link components', async () => {
      const result = await render(
        <Document>
          <Page>
            <Link href="https://example.com">
              <Text>Click me</Text>
            </Link>
          </Page>
        </Document>
      );

      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('styling', () => {
    it('applies inline styles', async () => {
      const result = await render(
        <Document>
          <Page>
            <Text style={{ fontSize: 24, fontWeight: 700, color: '#ff0000' }}>
              Styled Text
            </Text>
          </Page>
        </Document>
      );

      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('applies flexbox layout', async () => {
      const result = await render(
        <Document>
          <Page>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text>Left</Text>
              <Text>Right</Text>
            </View>
          </Page>
        </Document>
      );

      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('applies background colors', async () => {
      const result = await render(
        <Document>
          <Page>
            <View style={{ backgroundColor: '#f0f0f0', padding: 20 }}>
              <Text>With Background</Text>
            </View>
          </Page>
        </Document>
      );

      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('output methods', () => {
    it('converts to base64', async () => {
      const result = await render(
        <Document>
          <Page>
            <Text>Test</Text>
          </Page>
        </Document>
      );

      const base64 = result.toBase64();
      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);
      // Base64 should not contain data: prefix
      expect(base64.startsWith('data:')).toBe(false);
    });

    it('converts to data URI', async () => {
      const result = await render(
        <Document>
          <Page>
            <Text>Test</Text>
          </Page>
        </Document>
      );

      const dataUri = result.toDataUri();
      expect(dataUri.startsWith('data:application/pdf;base64,')).toBe(true);
    });

    it('converts to stream', async () => {
      const result = await render(
        <Document>
          <Page>
            <Text>Test</Text>
          </Page>
        </Document>
      );

      const stream = result.toStream();
      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('saves to file', async () => {
      const result = await render(
        <Document>
          <Page>
            <Text>Test</Text>
          </Page>
        </Document>
      );

      const testPath = '/tmp/paperflow-test-output.pdf';
      await result.toFile(testPath);

      // Verify file was created
      const file = Bun.file(testPath);
      expect(await file.exists()).toBe(true);
      expect(file.size).toBeGreaterThan(0);

      // Clean up
      await Bun.write(testPath, ''); // Clear file
    });
  });

  describe('error handling', () => {
    it('throws error for empty document', async () => {
      await expect(
        render(
          <Document>
            {/* No pages */}
          </Document>
        )
      ).rejects.toThrow();
    });
  });
});
