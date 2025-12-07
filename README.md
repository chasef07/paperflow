# PaperSend

The PDF API for developers. React components to PDF, built for the AI era.

```tsx
import { render, Document, Page, Text } from 'papersend';

const pdf = await render(
  <Document>
    <Page>
      <Text className="text-2xl font-bold">Hello World</Text>
    </Page>
  </Document>
);

await pdf.toFile('output.pdf');
```

## Installation

```bash
bun add papersend
# or
npm install papersend
```

## Why PaperSend?

| Feature | @react-pdf/renderer | PaperSend |
|---------|---------------------|-----------|
| Fonts | Manual registration, file paths | Auto-detect from CDN |
| Serverless | Broken on Vercel/Cloudflare | Native support |
| Tailwind | Not supported | First-class support |
| Images | Manual handling | URL, Buffer, Base64 |
| API Style | Complex setup | Resend-like simplicity |

### The Problem with @react-pdf/renderer

```tsx
// Before (react-pdf) - Breaks on Vercel/Cloudflare
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  src: './fonts/Inter.ttf', // File path doesn't work in serverless
});
```

### The PaperSend Solution

```tsx
// After (PaperSend) - Just works everywhere
<Text style={{ fontFamily: 'Inter' }}>Hello</Text>

// Fonts are automatically loaded from CDN
// Works on Vercel, Cloudflare Workers, Bun, Node.js
```

## Quick Start

### Basic Usage

```tsx
import { render, Document, Page, View, Text } from 'papersend';

const MyDocument = () => (
  <Document title="My PDF" author="PaperSend">
    <Page size="A4" margin={40}>
      <Text style={{ fontSize: 24, fontWeight: 700 }}>
        Hello, PaperSend!
      </Text>
    </Page>
  </Document>
);

const result = await render(<MyDocument />);
await result.toFile('output.pdf');
```

### With Tailwind Classes

```tsx
import { render, Document, Page, View, Text } from 'papersend';

const Invoice = () => (
  <Document>
    <Page className="p-12">
      <View className="flex justify-between mb-8">
        <Text className="text-3xl font-bold">INVOICE</Text>
        <Text className="text-gray-500">#INV-001</Text>
      </View>

      <View className="flex flex-col gap-2 mb-8">
        <Text className="font-bold">Acme Corp</Text>
        <Text className="text-gray-600">123 Main St</Text>
        <Text className="text-gray-600">San Francisco, CA 94102</Text>
      </View>

      <View className="border rounded-lg p-4">
        <View className="flex bg-gray-100 p-2 font-bold">
          <Text className="flex-1">Item</Text>
          <Text className="w-20 text-right">Qty</Text>
          <Text className="w-24 text-right">Price</Text>
        </View>
        <View className="flex p-2 border-t">
          <Text className="flex-1">Widget Pro</Text>
          <Text className="w-20 text-right">2</Text>
          <Text className="w-24 text-right">$99.00</Text>
        </View>
      </View>

      <View className="mt-4 text-right">
        <Text className="text-xl font-bold">Total: $198.00</Text>
      </View>
    </Page>
  </Document>
);

const result = await render(<Invoice />);
await result.toFile('invoice.pdf');
```

### Resend-like API

```tsx
import { PaperSend, Document, Page, Text } from 'papersend';

const papersend = new PaperSend();

const { data, error } = await papersend.pdfs.create(
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
  title="Invoice #123"      // PDF metadata
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

### `<View>`

Container component, like a `div`. Uses flexbox by default.

```tsx
<View style={{ flexDirection: 'row', gap: 16 }}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>

// Or with Tailwind
<View className="flex flex-row gap-4">
  <Text>Left</Text>
  <Text>Right</Text>
</View>
```

### `<Text>`

Text content component.

```tsx
<Text style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>
  Hello World
</Text>

// Or with Tailwind
<Text className="text-2xl font-bold text-gray-900">
  Hello World
</Text>
```

### `<Image>`

Image component. Supports URLs, base64, and buffers.

```tsx
// From URL
<Image src="https://example.com/logo.png" style={{ width: 100, height: 100 }} />

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
  <Text className="text-blue-600 underline">Click here</Text>
</Link>
```

## Tailwind Support

PaperSend includes built-in Tailwind CSS support. No configuration needed.

### Supported Classes

**Spacing**
- Padding: `p-{0-24}`, `px-{n}`, `py-{n}`, `pt-{n}`, `pr-{n}`, `pb-{n}`, `pl-{n}`
- Margin: `m-{0-24}`, `mx-{n}`, `my-{n}`, `mt-{n}`, `mr-{n}`, `mb-{n}`, `ml-{n}`
- Gap: `gap-{0-24}`

**Flexbox**
- `flex`, `flex-row`, `flex-col`
- `justify-start`, `justify-center`, `justify-end`, `justify-between`
- `items-start`, `items-center`, `items-end`
- `flex-1`, `flex-grow`, `flex-shrink`

**Typography**
- Size: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`
- Weight: `font-thin`, `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`, `font-extrabold`
- Align: `text-left`, `text-center`, `text-right`

**Colors**
- Text: `text-{color}-{shade}` (e.g., `text-gray-900`, `text-blue-500`)
- Background: `bg-{color}-{shade}`

**Borders**
- Width: `border`, `border-{n}`
- Radius: `rounded`, `rounded-lg`, `rounded-full`

**Sizing**
- Width: `w-{n}`, `w-full`
- Height: `h-{n}`, `h-full`

### Inline Styles Override Tailwind

```tsx
// Tailwind sets text-black, but inline style overrides with red
<Text className="text-black" style={{ color: '#ff0000' }}>
  This will be red
</Text>
```

## Render Result

The `render()` function returns a `RenderResult` object:

```tsx
const result = await render(<MyDocument />);

// Properties
result.buffer;         // Buffer - The PDF as bytes
result.pages;          // number - Page count
result.metadata;       // { title?, author?, createdAt }

// Methods
result.toBase64();     // string - Base64 encoded PDF
result.toDataUri();    // string - Data URI for embedding
result.toStream();     // ReadableStream - For streaming responses
await result.toFile('output.pdf');  // Save to file
```

## Edge Runtime / Serverless

PaperSend is designed for serverless environments:

```tsx
// Vercel Edge Function
export const runtime = 'edge';

export async function GET() {
  const result = await render(<Invoice />);

  return new Response(result.buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
    },
  });
}
```

```tsx
// Cloudflare Worker
export default {
  async fetch(request: Request): Promise<Response> {
    const result = await render(<Invoice />);

    return new Response(result.buffer, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
  },
};
```

## Error Handling

PaperSend provides helpful error messages:

```tsx
import { render, PaperSendError, isPaperSendError } from 'papersend';

try {
  const result = await render(<MyDocument />);
} catch (error) {
  if (isPaperSendError(error)) {
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Suggestion:', error.suggestion);
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `NO_PAGES` | Document has no pages |
| `FONT_LOAD_FAILED` | Failed to load font from CDN |
| `IMAGE_LOAD_FAILED` | Failed to load image |
| `LOCAL_FILE_NOT_SUPPORTED` | Local file paths don't work in serverless |
| `RENDER_FAILED` | General render error |

## Fonts

Fonts are automatically loaded from Google Fonts CDN. Just use the font family name:

```tsx
<Text style={{ fontFamily: 'Inter', fontWeight: 600 }}>
  Using Inter font
</Text>

<Text style={{ fontFamily: 'Roboto' }}>
  Using Roboto font
</Text>
```

### Supported Fonts

Any Google Font works automatically. Popular choices:
- Inter
- Roboto
- Open Sans
- Lato
- Poppins
- Plus Jakarta Sans
- Montserrat
- And thousands more...

### Custom Font Registration

```tsx
import { registerFont } from 'papersend';

// Register a custom font from URL
registerFont({
  family: 'MyCustomFont',
  src: 'https://example.com/fonts/MyFont.woff2',
  weight: 400,
});
```

## API Reference

### `render(element, options?)`

Renders a React element to PDF.

```tsx
const result = await render(element, {
  engine: 'satori',  // Rendering engine (default: 'satori')
});
```

### `renderToBuffer(element)`

Simple render that returns just the buffer.

```tsx
const buffer = await renderToBuffer(<MyDocument />);
```

### `PaperSend` class

Resend-like API for PDF generation.

```tsx
const papersend = new PaperSend({
  apiKey: 'ps_xxx',  // For future cloud API
  engine: 'satori',
});

const { data, error } = await papersend.pdfs.create(<MyDocument />);
```

## Examples

See the [examples](./examples) directory:
- [Basic Invoice](./examples/basic) - Simple invoice generation

## License

MIT
