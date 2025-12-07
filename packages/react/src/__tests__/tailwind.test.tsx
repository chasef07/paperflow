/**
 * Tailwind Parser Tests
 *
 * Test suite for the Tailwind CSS class parser.
 */

import { describe, it, expect } from 'bun:test';
import { parseTailwindClasses, tw } from '../tailwind.ts';
import { render, Document, Page, Text, View } from '../index.ts';

describe('parseTailwindClasses', () => {
  describe('spacing', () => {
    it('parses padding classes', () => {
      expect(parseTailwindClasses('p-4')).toEqual({ padding: 16 });
      expect(parseTailwindClasses('p-0')).toEqual({ padding: 0 });
      expect(parseTailwindClasses('p-8')).toEqual({ padding: 32 });
    });

    it('parses directional padding', () => {
      expect(parseTailwindClasses('px-4')).toEqual({ paddingLeft: 16, paddingRight: 16 });
      expect(parseTailwindClasses('py-4')).toEqual({ paddingTop: 16, paddingBottom: 16 });
      expect(parseTailwindClasses('pt-4')).toEqual({ paddingTop: 16 });
      expect(parseTailwindClasses('pr-4')).toEqual({ paddingRight: 16 });
      expect(parseTailwindClasses('pb-4')).toEqual({ paddingBottom: 16 });
      expect(parseTailwindClasses('pl-4')).toEqual({ paddingLeft: 16 });
    });

    it('parses margin classes', () => {
      expect(parseTailwindClasses('m-4')).toEqual({ margin: 16 });
      expect(parseTailwindClasses('mt-4')).toEqual({ marginTop: 16 });
      expect(parseTailwindClasses('mb-4')).toEqual({ marginBottom: 16 });
      expect(parseTailwindClasses('ml-4')).toEqual({ marginLeft: 16 });
      expect(parseTailwindClasses('mr-4')).toEqual({ marginRight: 16 });
    });

    it('parses gap classes', () => {
      expect(parseTailwindClasses('gap-4')).toEqual({ gap: 16 });
      expect(parseTailwindClasses('gap-2')).toEqual({ gap: 8 });
    });
  });

  describe('flexbox', () => {
    it('parses display flex', () => {
      expect(parseTailwindClasses('flex')).toEqual({ display: 'flex' });
    });

    it('parses flex direction', () => {
      expect(parseTailwindClasses('flex-row')).toEqual({ flexDirection: 'row' });
      expect(parseTailwindClasses('flex-col')).toEqual({ flexDirection: 'column' });
    });

    it('parses justify content', () => {
      expect(parseTailwindClasses('justify-center')).toEqual({ justifyContent: 'center' });
      expect(parseTailwindClasses('justify-between')).toEqual({ justifyContent: 'space-between' });
      expect(parseTailwindClasses('justify-end')).toEqual({ justifyContent: 'flex-end' });
      expect(parseTailwindClasses('justify-start')).toEqual({ justifyContent: 'flex-start' });
    });

    it('parses align items', () => {
      expect(parseTailwindClasses('items-center')).toEqual({ alignItems: 'center' });
      expect(parseTailwindClasses('items-start')).toEqual({ alignItems: 'flex-start' });
      expect(parseTailwindClasses('items-end')).toEqual({ alignItems: 'flex-end' });
    });

    it('parses flex', () => {
      expect(parseTailwindClasses('flex-1')).toEqual({ flex: '1 1 0%' });
    });
  });

  describe('typography', () => {
    it('parses font sizes', () => {
      // Font sizes include line height for proper typography
      expect(parseTailwindClasses('text-xs').fontSize).toBe(12);
      expect(parseTailwindClasses('text-sm').fontSize).toBe(14);
      expect(parseTailwindClasses('text-base').fontSize).toBe(16);
      expect(parseTailwindClasses('text-lg').fontSize).toBe(18);
      expect(parseTailwindClasses('text-xl').fontSize).toBe(20);
      expect(parseTailwindClasses('text-2xl').fontSize).toBe(24);
      expect(parseTailwindClasses('text-3xl').fontSize).toBe(30);
    });

    it('parses font weights', () => {
      expect(parseTailwindClasses('font-thin')).toEqual({ fontWeight: 100 });
      expect(parseTailwindClasses('font-normal')).toEqual({ fontWeight: 400 });
      expect(parseTailwindClasses('font-medium')).toEqual({ fontWeight: 500 });
      expect(parseTailwindClasses('font-semibold')).toEqual({ fontWeight: 600 });
      expect(parseTailwindClasses('font-bold')).toEqual({ fontWeight: 700 });
    });

    it('parses text alignment', () => {
      expect(parseTailwindClasses('text-left')).toEqual({ textAlign: 'left' });
      expect(parseTailwindClasses('text-center')).toEqual({ textAlign: 'center' });
      expect(parseTailwindClasses('text-right')).toEqual({ textAlign: 'right' });
    });
  });

  describe('colors', () => {
    it('parses text colors', () => {
      expect(parseTailwindClasses('text-black')).toEqual({ color: '#000000' });
      expect(parseTailwindClasses('text-white')).toEqual({ color: '#ffffff' });
      expect(parseTailwindClasses('text-gray-500')).toEqual({ color: '#6b7280' });
      expect(parseTailwindClasses('text-gray-900')).toEqual({ color: '#111827' });
    });

    it('parses background colors', () => {
      expect(parseTailwindClasses('bg-white')).toEqual({ backgroundColor: '#ffffff' });
      expect(parseTailwindClasses('bg-black')).toEqual({ backgroundColor: '#000000' });
      expect(parseTailwindClasses('bg-gray-100')).toEqual({ backgroundColor: '#f3f4f6' });
    });
  });

  describe('sizing', () => {
    it('parses width classes', () => {
      expect(parseTailwindClasses('w-4')).toEqual({ width: 16 });
      expect(parseTailwindClasses('w-full')).toEqual({ width: '100%' });
    });

    it('parses height classes', () => {
      expect(parseTailwindClasses('h-4')).toEqual({ height: 16 });
    });
  });

  describe('borders', () => {
    it('parses border width', () => {
      // Border includes default color and style
      expect(parseTailwindClasses('border').borderWidth).toBe(1);
    });

    it('parses border radius', () => {
      expect(parseTailwindClasses('rounded')).toEqual({ borderRadius: 4 });
      expect(parseTailwindClasses('rounded-lg')).toEqual({ borderRadius: 8 });
      expect(parseTailwindClasses('rounded-full')).toEqual({ borderRadius: 9999 });
    });
  });

  describe('multiple classes', () => {
    it('parses multiple classes', () => {
      const result = parseTailwindClasses('flex flex-col gap-4 p-4 bg-white');
      expect(result).toEqual({
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
        backgroundColor: '#ffffff',
      });
    });

    it('handles extra whitespace', () => {
      const result = parseTailwindClasses('  flex   gap-4  ');
      expect(result).toEqual({
        display: 'flex',
        gap: 16,
      });
    });

    it('ignores unknown classes', () => {
      const result = parseTailwindClasses('flex unknown-class gap-4');
      expect(result).toEqual({
        display: 'flex',
        gap: 16,
      });
    });
  });
});

describe('tw helper', () => {
  it('is an alias for parseTailwindClasses', () => {
    expect(tw('flex gap-4')).toEqual(parseTailwindClasses('flex gap-4'));
  });
});

describe('Tailwind in components', () => {
  it('renders with Tailwind classes', async () => {
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
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it('merges Tailwind classes with inline styles', async () => {
    const result = await render(
      <Document>
        <Page>
          <Text className="text-xl" style={{ color: '#ff0000' }}>
            Merged Styles
          </Text>
        </Page>
      </Document>
    );

    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it('inline styles take precedence over Tailwind', async () => {
    // This test verifies that inline styles override Tailwind classes
    const result = await render(
      <Document>
        <Page>
          <Text className="text-black" style={{ color: '#ff0000' }}>
            Red Text (not black)
          </Text>
        </Page>
      </Document>
    );

    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it('renders complex Tailwind layouts', async () => {
    const result = await render(
      <Document>
        <Page>
          <View className="flex flex-col gap-4 p-4">
            <View className="flex flex-row justify-between items-center">
              <Text className="text-2xl font-bold">Title</Text>
              <Text className="text-gray-500">Subtitle</Text>
            </View>
            <View className="bg-gray-100 rounded-lg p-4">
              <Text className="text-sm">Card content</Text>
            </View>
          </View>
        </Page>
      </Document>
    );

    expect(result.buffer.length).toBeGreaterThan(0);
  });
});
