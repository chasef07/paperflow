/**
 * PaperFlow Tailwind Parser
 *
 * Converts Tailwind CSS classes to inline styles for PDF rendering.
 * This is a subset of Tailwind that makes sense for PDF documents.
 */

import type { CSSProperties } from 'react';

// =============================================================================
// Spacing Scale (matches Tailwind default)
// =============================================================================

const SPACING: Record<string, number> = {
  '0': 0,
  'px': 1,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '11': 44,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
  '28': 112,
  '32': 128,
  '36': 144,
  '40': 160,
  '44': 176,
  '48': 192,
  '52': 208,
  '56': 224,
  '60': 240,
  '64': 256,
  '72': 288,
  '80': 320,
  '96': 384,
};

// =============================================================================
// Font Sizes
// =============================================================================

const FONT_SIZES: Record<string, { fontSize: number; lineHeight: number }> = {
  'xs': { fontSize: 12, lineHeight: 16 },
  'sm': { fontSize: 14, lineHeight: 20 },
  'base': { fontSize: 16, lineHeight: 24 },
  'lg': { fontSize: 18, lineHeight: 28 },
  'xl': { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 30, lineHeight: 36 },
  '4xl': { fontSize: 36, lineHeight: 40 },
  '5xl': { fontSize: 48, lineHeight: 48 },
  '6xl': { fontSize: 60, lineHeight: 60 },
  '7xl': { fontSize: 72, lineHeight: 72 },
  '8xl': { fontSize: 96, lineHeight: 96 },
  '9xl': { fontSize: 128, lineHeight: 128 },
};

// =============================================================================
// Font Weights
// =============================================================================

const FONT_WEIGHTS: Record<string, number> = {
  'thin': 100,
  'extralight': 200,
  'light': 300,
  'normal': 400,
  'medium': 500,
  'semibold': 600,
  'bold': 700,
  'extrabold': 800,
  'black': 900,
};

// =============================================================================
// Colors (Tailwind default palette)
// =============================================================================

const COLORS: Record<string, string> = {
  // Transparent & Current
  'transparent': 'transparent',
  'current': 'currentColor',

  // Black & White
  'black': '#000000',
  'white': '#ffffff',

  // Gray
  'gray-50': '#f9fafb',
  'gray-100': '#f3f4f6',
  'gray-200': '#e5e7eb',
  'gray-300': '#d1d5db',
  'gray-400': '#9ca3af',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
  'gray-700': '#374151',
  'gray-800': '#1f2937',
  'gray-900': '#111827',
  'gray-950': '#030712',

  // Slate
  'slate-50': '#f8fafc',
  'slate-100': '#f1f5f9',
  'slate-200': '#e2e8f0',
  'slate-300': '#cbd5e1',
  'slate-400': '#94a3b8',
  'slate-500': '#64748b',
  'slate-600': '#475569',
  'slate-700': '#334155',
  'slate-800': '#1e293b',
  'slate-900': '#0f172a',
  'slate-950': '#020617',

  // Red
  'red-50': '#fef2f2',
  'red-100': '#fee2e2',
  'red-200': '#fecaca',
  'red-300': '#fca5a5',
  'red-400': '#f87171',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'red-700': '#b91c1c',
  'red-800': '#991b1b',
  'red-900': '#7f1d1d',
  'red-950': '#450a0a',

  // Orange
  'orange-50': '#fff7ed',
  'orange-100': '#ffedd5',
  'orange-200': '#fed7aa',
  'orange-300': '#fdba74',
  'orange-400': '#fb923c',
  'orange-500': '#f97316',
  'orange-600': '#ea580c',
  'orange-700': '#c2410c',
  'orange-800': '#9a3412',
  'orange-900': '#7c2d12',
  'orange-950': '#431407',

  // Yellow
  'yellow-50': '#fefce8',
  'yellow-100': '#fef9c3',
  'yellow-200': '#fef08a',
  'yellow-300': '#fde047',
  'yellow-400': '#facc15',
  'yellow-500': '#eab308',
  'yellow-600': '#ca8a04',
  'yellow-700': '#a16207',
  'yellow-800': '#854d0e',
  'yellow-900': '#713f12',
  'yellow-950': '#422006',

  // Green
  'green-50': '#f0fdf4',
  'green-100': '#dcfce7',
  'green-200': '#bbf7d0',
  'green-300': '#86efac',
  'green-400': '#4ade80',
  'green-500': '#22c55e',
  'green-600': '#16a34a',
  'green-700': '#15803d',
  'green-800': '#166534',
  'green-900': '#14532d',
  'green-950': '#052e16',

  // Blue
  'blue-50': '#eff6ff',
  'blue-100': '#dbeafe',
  'blue-200': '#bfdbfe',
  'blue-300': '#93c5fd',
  'blue-400': '#60a5fa',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'blue-700': '#1d4ed8',
  'blue-800': '#1e40af',
  'blue-900': '#1e3a8a',
  'blue-950': '#172554',

  // Indigo
  'indigo-50': '#eef2ff',
  'indigo-100': '#e0e7ff',
  'indigo-200': '#c7d2fe',
  'indigo-300': '#a5b4fc',
  'indigo-400': '#818cf8',
  'indigo-500': '#6366f1',
  'indigo-600': '#4f46e5',
  'indigo-700': '#4338ca',
  'indigo-800': '#3730a3',
  'indigo-900': '#312e81',
  'indigo-950': '#1e1b4b',

  // Purple
  'purple-50': '#faf5ff',
  'purple-100': '#f3e8ff',
  'purple-200': '#e9d5ff',
  'purple-300': '#d8b4fe',
  'purple-400': '#c084fc',
  'purple-500': '#a855f7',
  'purple-600': '#9333ea',
  'purple-700': '#7e22ce',
  'purple-800': '#6b21a8',
  'purple-900': '#581c87',
  'purple-950': '#3b0764',

  // Pink
  'pink-50': '#fdf2f8',
  'pink-100': '#fce7f3',
  'pink-200': '#fbcfe8',
  'pink-300': '#f9a8d4',
  'pink-400': '#f472b6',
  'pink-500': '#ec4899',
  'pink-600': '#db2777',
  'pink-700': '#be185d',
  'pink-800': '#9d174d',
  'pink-900': '#831843',
  'pink-950': '#500724',
};

// =============================================================================
// Border Radius
// =============================================================================

const BORDER_RADIUS: Record<string, number> = {
  'none': 0,
  'sm': 2,
  '': 4,  // default 'rounded'
  'md': 6,
  'lg': 8,
  'xl': 12,
  '2xl': 16,
  '3xl': 24,
  'full': 9999,
};

// =============================================================================
// Border Width
// =============================================================================

const BORDER_WIDTH: Record<string, number> = {
  '': 1,  // default 'border'
  '0': 0,
  '2': 2,
  '4': 4,
  '8': 8,
};

// =============================================================================
// Opacity
// =============================================================================

const OPACITY: Record<string, number> = {
  '0': 0,
  '5': 0.05,
  '10': 0.1,
  '20': 0.2,
  '25': 0.25,
  '30': 0.3,
  '40': 0.4,
  '50': 0.5,
  '60': 0.6,
  '70': 0.7,
  '75': 0.75,
  '80': 0.8,
  '90': 0.9,
  '95': 0.95,
  '100': 1,
};

// =============================================================================
// Main Parser
// =============================================================================

/**
 * Parse Tailwind classes into CSSProperties
 */
export function parseTailwindClasses(className: string): CSSProperties {
  if (!className) return {};

  const classes = className.split(/\s+/).filter(Boolean);
  const style: CSSProperties = {};

  for (const cls of classes) {
    parseClass(cls, style);
  }

  return style;
}

/**
 * Helper function for inline usage
 */
export function tw(className: string): CSSProperties {
  return parseTailwindClasses(className);
}

/**
 * Parse a single Tailwind class
 */
function parseClass(cls: string, style: CSSProperties): void {
  // ==========================================================================
  // Display
  // ==========================================================================
  if (cls === 'flex') {
    style.display = 'flex';
    return;
  }
  if (cls === 'hidden') {
    style.display = 'none';
    return;
  }

  // ==========================================================================
  // Flex Direction
  // ==========================================================================
  if (cls === 'flex-row') {
    style.flexDirection = 'row';
    return;
  }
  if (cls === 'flex-row-reverse') {
    style.flexDirection = 'row-reverse';
    return;
  }
  if (cls === 'flex-col') {
    style.flexDirection = 'column';
    return;
  }
  if (cls === 'flex-col-reverse') {
    style.flexDirection = 'column-reverse';
    return;
  }

  // ==========================================================================
  // Flex Wrap
  // ==========================================================================
  if (cls === 'flex-wrap') {
    style.flexWrap = 'wrap';
    return;
  }
  if (cls === 'flex-wrap-reverse') {
    style.flexWrap = 'wrap-reverse';
    return;
  }
  if (cls === 'flex-nowrap') {
    style.flexWrap = 'nowrap';
    return;
  }

  // ==========================================================================
  // Flex Grow/Shrink
  // ==========================================================================
  if (cls === 'flex-1') {
    style.flex = '1 1 0%';
    return;
  }
  if (cls === 'flex-auto') {
    style.flex = '1 1 auto';
    return;
  }
  if (cls === 'flex-initial') {
    style.flex = '0 1 auto';
    return;
  }
  if (cls === 'flex-none') {
    style.flex = 'none';
    return;
  }
  if (cls === 'grow') {
    style.flexGrow = 1;
    return;
  }
  if (cls === 'grow-0') {
    style.flexGrow = 0;
    return;
  }
  if (cls === 'shrink') {
    style.flexShrink = 1;
    return;
  }
  if (cls === 'shrink-0') {
    style.flexShrink = 0;
    return;
  }

  // ==========================================================================
  // Justify Content
  // ==========================================================================
  if (cls === 'justify-start') {
    style.justifyContent = 'flex-start';
    return;
  }
  if (cls === 'justify-end') {
    style.justifyContent = 'flex-end';
    return;
  }
  if (cls === 'justify-center') {
    style.justifyContent = 'center';
    return;
  }
  if (cls === 'justify-between') {
    style.justifyContent = 'space-between';
    return;
  }
  if (cls === 'justify-around') {
    style.justifyContent = 'space-around';
    return;
  }
  if (cls === 'justify-evenly') {
    style.justifyContent = 'space-evenly';
    return;
  }

  // ==========================================================================
  // Align Items
  // ==========================================================================
  if (cls === 'items-start') {
    style.alignItems = 'flex-start';
    return;
  }
  if (cls === 'items-end') {
    style.alignItems = 'flex-end';
    return;
  }
  if (cls === 'items-center') {
    style.alignItems = 'center';
    return;
  }
  if (cls === 'items-baseline') {
    style.alignItems = 'baseline';
    return;
  }
  if (cls === 'items-stretch') {
    style.alignItems = 'stretch';
    return;
  }

  // ==========================================================================
  // Align Self
  // ==========================================================================
  if (cls === 'self-auto') {
    style.alignSelf = 'auto';
    return;
  }
  if (cls === 'self-start') {
    style.alignSelf = 'flex-start';
    return;
  }
  if (cls === 'self-end') {
    style.alignSelf = 'flex-end';
    return;
  }
  if (cls === 'self-center') {
    style.alignSelf = 'center';
    return;
  }
  if (cls === 'self-stretch') {
    style.alignSelf = 'stretch';
    return;
  }

  // ==========================================================================
  // Gap
  // ==========================================================================
  if (cls.startsWith('gap-')) {
    const value = cls.slice(4);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.gap = spacing;
    }
    return;
  }
  if (cls.startsWith('gap-x-')) {
    const value = cls.slice(6);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.columnGap = spacing;
    }
    return;
  }
  if (cls.startsWith('gap-y-')) {
    const value = cls.slice(6);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.rowGap = spacing;
    }
    return;
  }

  // ==========================================================================
  // Padding
  // ==========================================================================
  if (cls.startsWith('p-')) {
    const value = cls.slice(2);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.padding = spacing;
    }
    return;
  }
  if (cls.startsWith('px-')) {
    const value = cls.slice(3);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.paddingLeft = spacing;
      style.paddingRight = spacing;
    }
    return;
  }
  if (cls.startsWith('py-')) {
    const value = cls.slice(3);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.paddingTop = spacing;
      style.paddingBottom = spacing;
    }
    return;
  }
  if (cls.startsWith('pt-')) {
    const value = cls.slice(3);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.paddingTop = spacing;
    }
    return;
  }
  if (cls.startsWith('pr-')) {
    const value = cls.slice(3);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.paddingRight = spacing;
    }
    return;
  }
  if (cls.startsWith('pb-')) {
    const value = cls.slice(3);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.paddingBottom = spacing;
    }
    return;
  }
  if (cls.startsWith('pl-')) {
    const value = cls.slice(3);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.paddingLeft = spacing;
    }
    return;
  }

  // ==========================================================================
  // Margin
  // ==========================================================================
  if (cls.startsWith('m-')) {
    const value = cls.slice(2);
    if (value === 'auto') {
      style.margin = 'auto';
      return;
    }
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.margin = spacing;
    }
    return;
  }
  if (cls.startsWith('mx-')) {
    const value = cls.slice(3);
    if (value === 'auto') {
      style.marginLeft = 'auto';
      style.marginRight = 'auto';
      return;
    }
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.marginLeft = spacing;
      style.marginRight = spacing;
    }
    return;
  }
  if (cls.startsWith('my-')) {
    const value = cls.slice(3);
    if (value === 'auto') {
      style.marginTop = 'auto';
      style.marginBottom = 'auto';
      return;
    }
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.marginTop = spacing;
      style.marginBottom = spacing;
    }
    return;
  }
  if (cls.startsWith('mt-')) {
    const value = cls.slice(3);
    if (value === 'auto') {
      style.marginTop = 'auto';
      return;
    }
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.marginTop = spacing;
    }
    return;
  }
  if (cls.startsWith('mr-')) {
    const value = cls.slice(3);
    if (value === 'auto') {
      style.marginRight = 'auto';
      return;
    }
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.marginRight = spacing;
    }
    return;
  }
  if (cls.startsWith('mb-')) {
    const value = cls.slice(3);
    if (value === 'auto') {
      style.marginBottom = 'auto';
      return;
    }
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.marginBottom = spacing;
    }
    return;
  }
  if (cls.startsWith('ml-')) {
    const value = cls.slice(3);
    if (value === 'auto') {
      style.marginLeft = 'auto';
      return;
    }
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.marginLeft = spacing;
    }
    return;
  }

  // ==========================================================================
  // Width
  // ==========================================================================
  if (cls.startsWith('w-')) {
    const value = cls.slice(2);
    if (value === 'full') {
      style.width = '100%';
      return;
    }
    if (value === 'screen') {
      style.width = '100vw';
      return;
    }
    if (value === 'auto') {
      style.width = 'auto';
      return;
    }
    if (value.includes('/')) {
      // Fraction like w-1/2
      const [num, den] = value.split('/').map(Number);
      if (num && den) {
        style.width = `${(num / den) * 100}%`;
      }
      return;
    }
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.width = spacing;
    }
    return;
  }

  // ==========================================================================
  // Min/Max Width
  // ==========================================================================
  if (cls.startsWith('min-w-')) {
    const value = cls.slice(6);
    if (value === 'full') {
      style.minWidth = '100%';
      return;
    }
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.minWidth = spacing;
    }
    return;
  }
  if (cls.startsWith('max-w-')) {
    const value = cls.slice(6);
    if (value === 'full') {
      style.maxWidth = '100%';
      return;
    }
    if (value === 'none') {
      style.maxWidth = 'none';
      return;
    }
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.maxWidth = spacing;
    }
    return;
  }

  // ==========================================================================
  // Height
  // ==========================================================================
  if (cls.startsWith('h-')) {
    const value = cls.slice(2);
    if (value === 'full') {
      style.height = '100%';
      return;
    }
    if (value === 'screen') {
      style.height = '100vh';
      return;
    }
    if (value === 'auto') {
      style.height = 'auto';
      return;
    }
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.height = spacing;
    }
    return;
  }

  // ==========================================================================
  // Font Size
  // ==========================================================================
  if (cls.startsWith('text-') && FONT_SIZES[cls.slice(5)]) {
    const size = FONT_SIZES[cls.slice(5)];
    if (size) {
      style.fontSize = size.fontSize;
      style.lineHeight = size.lineHeight;
    }
    return;
  }

  // ==========================================================================
  // Font Weight
  // ==========================================================================
  if (cls.startsWith('font-') && FONT_WEIGHTS[cls.slice(5)] !== undefined) {
    style.fontWeight = FONT_WEIGHTS[cls.slice(5)];
    return;
  }

  // ==========================================================================
  // Font Style
  // ==========================================================================
  if (cls === 'italic') {
    style.fontStyle = 'italic';
    return;
  }
  if (cls === 'not-italic') {
    style.fontStyle = 'normal';
    return;
  }

  // ==========================================================================
  // Font Family
  // ==========================================================================
  if (cls === 'font-sans') {
    style.fontFamily = 'Inter, system-ui, sans-serif';
    return;
  }
  if (cls === 'font-serif') {
    style.fontFamily = 'Georgia, serif';
    return;
  }
  if (cls === 'font-mono') {
    style.fontFamily = 'JetBrains Mono, monospace';
    return;
  }
  // Custom font families like font-inter
  if (cls.startsWith('font-') && !FONT_WEIGHTS[cls.slice(5)]) {
    const fontName = cls.slice(5);
    if (!['sans', 'serif', 'mono'].includes(fontName)) {
      // Convert kebab-case to title case
      style.fontFamily = fontName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return;
  }

  // ==========================================================================
  // Text Color
  // ==========================================================================
  if (cls.startsWith('text-') && COLORS[cls.slice(5)]) {
    style.color = COLORS[cls.slice(5)];
    return;
  }

  // ==========================================================================
  // Text Alignment
  // ==========================================================================
  if (cls === 'text-left') {
    style.textAlign = 'left';
    return;
  }
  if (cls === 'text-center') {
    style.textAlign = 'center';
    return;
  }
  if (cls === 'text-right') {
    style.textAlign = 'right';
    return;
  }
  if (cls === 'text-justify') {
    style.textAlign = 'justify';
    return;
  }

  // ==========================================================================
  // Text Decoration
  // ==========================================================================
  if (cls === 'underline') {
    style.textDecoration = 'underline';
    return;
  }
  if (cls === 'line-through') {
    style.textDecoration = 'line-through';
    return;
  }
  if (cls === 'no-underline') {
    style.textDecoration = 'none';
    return;
  }

  // ==========================================================================
  // Text Transform
  // ==========================================================================
  if (cls === 'uppercase') {
    style.textTransform = 'uppercase';
    return;
  }
  if (cls === 'lowercase') {
    style.textTransform = 'lowercase';
    return;
  }
  if (cls === 'capitalize') {
    style.textTransform = 'capitalize';
    return;
  }
  if (cls === 'normal-case') {
    style.textTransform = 'none';
    return;
  }

  // ==========================================================================
  // Letter Spacing
  // ==========================================================================
  if (cls === 'tracking-tighter') {
    style.letterSpacing = -0.8;
    return;
  }
  if (cls === 'tracking-tight') {
    style.letterSpacing = -0.4;
    return;
  }
  if (cls === 'tracking-normal') {
    style.letterSpacing = 0;
    return;
  }
  if (cls === 'tracking-wide') {
    style.letterSpacing = 0.4;
    return;
  }
  if (cls === 'tracking-wider') {
    style.letterSpacing = 0.8;
    return;
  }
  if (cls === 'tracking-widest') {
    style.letterSpacing = 1.6;
    return;
  }

  // ==========================================================================
  // Line Height
  // ==========================================================================
  if (cls === 'leading-none') {
    style.lineHeight = 1;
    return;
  }
  if (cls === 'leading-tight') {
    style.lineHeight = 1.25;
    return;
  }
  if (cls === 'leading-snug') {
    style.lineHeight = 1.375;
    return;
  }
  if (cls === 'leading-normal') {
    style.lineHeight = 1.5;
    return;
  }
  if (cls === 'leading-relaxed') {
    style.lineHeight = 1.625;
    return;
  }
  if (cls === 'leading-loose') {
    style.lineHeight = 2;
    return;
  }

  // ==========================================================================
  // Background Color
  // ==========================================================================
  if (cls.startsWith('bg-') && COLORS[cls.slice(3)]) {
    style.backgroundColor = COLORS[cls.slice(3)];
    return;
  }

  // ==========================================================================
  // Border Radius
  // ==========================================================================
  if (cls === 'rounded') {
    style.borderRadius = BORDER_RADIUS[''];
    return;
  }
  if (cls.startsWith('rounded-')) {
    const value = cls.slice(8);
    const radius = BORDER_RADIUS[value];
    if (radius !== undefined) {
      style.borderRadius = radius;
    }
    return;
  }

  // ==========================================================================
  // Border Width
  // ==========================================================================
  if (cls === 'border') {
    style.borderWidth = BORDER_WIDTH[''];
    style.borderStyle = 'solid';
    style.borderColor = COLORS['gray-200'];
    return;
  }
  if (cls.startsWith('border-') && BORDER_WIDTH[cls.slice(7)] !== undefined) {
    style.borderWidth = BORDER_WIDTH[cls.slice(7)];
    style.borderStyle = 'solid';
    return;
  }
  if (cls === 'border-t') {
    style.borderTopWidth = 1;
    style.borderStyle = 'solid';
    return;
  }
  if (cls === 'border-r') {
    style.borderRightWidth = 1;
    style.borderStyle = 'solid';
    return;
  }
  if (cls === 'border-b') {
    style.borderBottomWidth = 1;
    style.borderStyle = 'solid';
    return;
  }
  if (cls === 'border-l') {
    style.borderLeftWidth = 1;
    style.borderStyle = 'solid';
    return;
  }

  // ==========================================================================
  // Border Color
  // ==========================================================================
  if (cls.startsWith('border-') && COLORS[cls.slice(7)]) {
    style.borderColor = COLORS[cls.slice(7)];
    return;
  }

  // ==========================================================================
  // Border Style
  // ==========================================================================
  if (cls === 'border-solid') {
    style.borderStyle = 'solid';
    return;
  }
  if (cls === 'border-dashed') {
    style.borderStyle = 'dashed';
    return;
  }
  if (cls === 'border-dotted') {
    style.borderStyle = 'dotted';
    return;
  }
  if (cls === 'border-none') {
    style.borderStyle = 'none';
    return;
  }

  // ==========================================================================
  // Opacity
  // ==========================================================================
  if (cls.startsWith('opacity-')) {
    const value = cls.slice(8);
    const opacity = OPACITY[value];
    if (opacity !== undefined) {
      style.opacity = opacity;
    }
    return;
  }

  // ==========================================================================
  // Overflow
  // ==========================================================================
  if (cls === 'overflow-hidden') {
    style.overflow = 'hidden';
    return;
  }
  if (cls === 'overflow-visible') {
    style.overflow = 'visible';
    return;
  }

  // ==========================================================================
  // Position
  // ==========================================================================
  if (cls === 'relative') {
    style.position = 'relative';
    return;
  }
  if (cls === 'absolute') {
    style.position = 'absolute';
    return;
  }

  // ==========================================================================
  // Position Values (top, right, bottom, left)
  // ==========================================================================
  if (cls.startsWith('top-')) {
    const value = cls.slice(4);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.top = spacing;
    }
    return;
  }
  if (cls.startsWith('right-')) {
    const value = cls.slice(6);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.right = spacing;
    }
    return;
  }
  if (cls.startsWith('bottom-')) {
    const value = cls.slice(7);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.bottom = spacing;
    }
    return;
  }
  if (cls.startsWith('left-')) {
    const value = cls.slice(5);
    const spacing = SPACING[value];
    if (spacing !== undefined) {
      style.left = spacing;
    }
    return;
  }

  // ==========================================================================
  // Z-Index
  // ==========================================================================
  if (cls.startsWith('z-')) {
    const value = parseInt(cls.slice(2), 10);
    if (!isNaN(value)) {
      style.zIndex = value;
    }
    return;
  }

  // ==========================================================================
  // Object Fit
  // ==========================================================================
  if (cls === 'object-contain') {
    style.objectFit = 'contain';
    return;
  }
  if (cls === 'object-cover') {
    style.objectFit = 'cover';
    return;
  }
  if (cls === 'object-fill') {
    style.objectFit = 'fill';
    return;
  }
  if (cls === 'object-none') {
    style.objectFit = 'none';
    return;
  }
}
