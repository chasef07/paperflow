# PaperFlow

The PDF API for developers. React components to PDF, built for the AI era.

[![npm version](https://img.shields.io/npm/v/paperflow.svg)](https://www.npmjs.com/package/paperflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```tsx
import { render, Document, Page, Text } from 'paperflow';

const pdf = await render(
  <Document>
    <Page>
      <Text style={{ fontSize: 24, fontWeight: 700 }}>Hello World</Text>
    </Page>
  </Document>
);

await pdf.toFile('output.pdf');
```

## Installation

```bash
npm install paperflow
# or
bun add paperflow
# or
yarn add paperflow
```

## Why PaperFlow?

| Feature | @react-pdf/renderer | PaperFlow |
|---------|---------------------|-----------|
| Fonts | Manual registration, file paths | Auto-loads from Google Fonts |
| Serverless | Broken on Vercel/Cloudflare | Works everywhere |
| Tailwind | Not supported | Built-in support |
| Images | Manual handling | URL, Buffer, Base64, async |
| Bundle | ~500KB | Optimized for edge |
| API Style | Complex setup | Simple, Resend-like |

### The Problem

```tsx
// @react-pdf/renderer - Breaks on Vercel/Cloudflare
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  src: './fonts/Inter.ttf', // File paths don't work in serverless!
});
```

### The Solution

```tsx
// PaperFlow - Just works everywhere
<Text style={{ fontFamily: 'Inter' }}>Hello</Text>

// Fonts automatically load from CDN
// Works on Vercel, Cloudflare Workers, Bun, Node.js
```

## Quick Start

### Basic Usage

```tsx
import { render, Document, Page, View, Text } from 'paperflow';

const MyDocument = () => (
  <Document title="My PDF" author="PaperFlow">
    <Page size="A4" margin={40}>
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 32, fontWeight: 700 }}>
          Hello, PaperFlow!
        </Text>
      </View>
      <Text style={{ fontSize: 16, color: '#666' }}>
        Generate PDFs with React components.
      </Text>
    </Page>
  </Document>
);

const result = await render(<MyDocument />);
await result.toFile('output.pdf');
```

### Invoice Example

```tsx
import { render, Document, Page, View, Text } from 'paperflow';

const Invoice = () => (
  <Document>
    <Page size="A4" margin={50}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 }}>
        <Text style={{ fontSize: 32, fontWeight: 700 }}>INVOICE</Text>
        <Text style={{ fontSize: 14, color: '#666' }}>#INV-001</Text>
      </View>

      {/* Company Info */}
      <View style={{ marginBottom: 40 }}>
        <Text style={{ fontSize: 16, fontWeight: 600 }}>Acme Corp</Text>
        <Text style={{ color: '#666' }}>123 Main St</Text>
        <Text style={{ color: '#666' }}>San Francisco, CA 94102</Text>
      </View>

      {/* Line Items */}
      <View style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
        <View style={{ flexDirection: 'row', fontWeight: 600 }}>
          <Text style={{ flex: 1 }}>Item</Text>
          <Text style={{ width: 80, textAlign: 'right' }}>Qty</Text>
          <Text style={{ width: 100, textAlign: 'right' }}>Price</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ flex: 1 }}>Widget Pro</Text>
        <Text style={{ width: 80, textAlign: 'right' }}>2</Text>
        <Text style={{ width: 100, textAlign: 'right' }}>$99.00</Text>
      </View>

      {/* Total */}
      <View style={{ marginTop: 20, alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 20, fontWeight: 700 }}>Total: $198.00</Text>
      </View>
    </Page>
  </Document>
);

const result = await render(<Invoice />);
await result.toFile('invoice.pdf');
```

### Resend-like API

```tsx
import { PaperFlow, Document, Page, Text } from 'paperflow';

const paperflow = new PaperFlow();

const { data, error } = await paperflow.pdfs.create(
  <Document>
    <Page>
      <Text>Hello World</Text>
    </Page>
  </Document>
);

if (error) {
  console.error('Failed:', error);
} else {
  await data.toFile('output.pdf');
}
```

## Components

### `<Document>`

Root container for PDF documents.

```tsx
<Document
  title="Invoice #123"
  author="Acme Corp"
  subject="Monthly Invoice"
>
  <Page>...</Page>
</Document>
```

### `<Page>`

Represents a single page in the PDF.

```tsx
<Page
  size="A4"                 // "A4" | "Letter" | "Legal" | { width, height }
  margin={40}               // number or { top, right, bottom, left }
  orientation="portrait"    // "portrait" | "landscape"
>
  ...
</Page>
```

**Page Sizes:**
- `A4` - 595 x 842 pts (default)
- `Letter` - 612 x 792 pts
- `Legal` - 612 x 1008 pts
- Custom: `{ width: 500, height: 700 }`

### `<View>`

Container component (like a `div`). Uses flexbox layout.

```tsx
<View style={{ flexDirection: 'row', gap: 16, padding: 20 }}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>
```

### `<Text>`

Text content component.

```tsx
<Text style={{
  fontSize: 24,
  fontWeight: 700,
  color: '#111827',
  fontFamily: 'Inter'
}}>
  Hello World
</Text>
```

### `<Image>`

Image component. Supports multiple source types.

```tsx
// From URL
<Image
  src="https://example.com/logo.png"
  style={{ width: 100, height: 100 }}
/>

// From base64
<Image src="data:image/png;base64,..." />

// Async loading
<Image src={async () => {
  const response = await fetch('https://example.com/logo.png');
  return response.arrayBuffer();
}} />
```

### `<Link>`

Hyperlink component.

```tsx
<Link href="https://example.com">
  <Text style={{ color: '#2563eb', textDecoration: 'underline' }}>
    Visit our website
  </Text>
</Link>
```

## Styling

### Inline Styles

```tsx
<View style={{
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 20,
  backgroundColor: '#f5f5f5',
  borderRadius: 8,
}}>
  <Text style={{ fontSize: 18, fontWeight: 600 }}>Title</Text>
  <Text style={{ color: '#666' }}>Subtitle</Text>
</View>
```

### Supported Style Properties

**Layout (Flexbox)**
- `display`, `flexDirection`, `flexWrap`
- `justifyContent`, `alignItems`, `alignSelf`
- `flex`, `flexGrow`, `flexShrink`, `flexBasis`
- `gap`, `rowGap`, `columnGap`

**Spacing**
- `padding`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`
- `margin`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`

**Sizing**
- `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`

**Typography**
- `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`
- `color`, `textAlign`, `textDecoration`, `lineHeight`, `letterSpacing`

**Visual**
- `backgroundColor`, `opacity`
- `borderWidth`, `borderColor`, `borderStyle`, `borderRadius`

**Position**
- `position` (`relative` | `absolute`)
- `top`, `right`, `bottom`, `left`, `zIndex`

## Fonts

Fonts are **automatically loaded** from Google Fonts. Just use the font family name:

```tsx
<Text style={{ fontFamily: 'Inter', fontWeight: 600 }}>
  Using Inter font
</Text>

<Text style={{ fontFamily: 'Roboto Mono' }}>
  Using Roboto Mono
</Text>
```

### Popular Fonts (all work automatically)

- Inter, Roboto, Open Sans, Lato, Poppins
- Montserrat, Nunito, Raleway, Ubuntu
- Plus Jakarta Sans, DM Sans, Work Sans
- Merriweather, Playfair Display, Lora (serif)
- Fira Code, JetBrains Mono, Source Code Pro (monospace)

### Custom Fonts

```tsx
import { registerFont } from 'paperflow';

registerFont({
  family: 'MyCustomFont',
  src: 'https://example.com/fonts/MyFont.woff2',
  weight: 400,
  style: 'normal',
});
```

## Render Result

```tsx
const result = await render(<MyDocument />);

// Properties
result.buffer         // Buffer - Raw PDF bytes
result.pages          // number - Page count
result.metadata       // { title?, author?, createdAt }

// Methods
result.toBase64()     // string - Base64 encoded
result.toDataUri()    // string - Data URI for embedding
result.toStream()     // ReadableStream
await result.toFile('output.pdf')  // Save to file
```

## Serverless / Edge Runtime

PaperFlow works great in serverless environments:

### Vercel Edge Function

```tsx
import { render, Document, Page, Text } from 'paperflow';

export const runtime = 'edge';

export async function GET() {
  const result = await render(
    <Document>
      <Page>
        <Text>Generated on the edge!</Text>
      </Page>
    </Document>
  );

  return new Response(result.buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="document.pdf"',
    },
  });
}
```

### Bun Server

```tsx
import { render, Document, Page, Text } from 'paperflow';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const result = await render(
      <Document>
        <Page>
          <Text>Hello from Bun!</Text>
        </Page>
      </Document>
    );

    return new Response(result.buffer, {
      headers: { 'Content-Type': 'application/pdf' },
    });
  },
});
```

## Error Handling

```tsx
import { render, PaperFlowError, isPaperFlowError } from 'paperflow';

try {
  const result = await render(<MyDocument />);
} catch (error) {
  if (isPaperFlowError(error)) {
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Suggestion:', error.suggestion);
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `NO_PAGES` | Document has no pages |
| `FONT_LOAD_FAILED` | Failed to load font from CDN |
| `IMAGE_LOAD_FAILED` | Failed to load image |
| `LOCAL_FILE_NOT_SUPPORTED` | Local file paths don't work in serverless |
| `RENDER_FAILED` | General render error |

## Examples

Check out the [examples](./examples) directory:

- **[Basic](./examples/basic)** - Simple invoice generation with Bun

## Packages

| Package | Description |
|---------|-------------|
| `paperflow` | Main package - install this one |
| `@paperflow/react` | React components |
| `@paperflow/core` | Core types and utilities |
| `@paperflow/engine-satori` | Satori rendering engine |

## Requirements

- Node.js 18+ or Bun
- React 18+

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a PR.

## Links

- [npm](https://www.npmjs.com/package/paperflow)
- [GitHub](https://github.com/chasef07/paperflow)
