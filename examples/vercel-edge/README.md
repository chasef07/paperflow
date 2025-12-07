# PaperSend - Vercel Edge Example

This example demonstrates PaperSend generating PDFs on Vercel's Edge Runtime.

## Setup

```bash
cd examples/vercel-edge
bun install
```

## Development

```bash
bun run dev
```

Then visit:
- http://localhost:3000 - Landing page
- http://localhost:3000/api/pdf - Generate invoice PDF
- http://localhost:3000/api/pdf?invoice=INV-2024-042 - Custom invoice number

## Deploy to Vercel

```bash
vercel
```

## How It Works

The `/api/pdf` route runs on Vercel's Edge Runtime:

```tsx
export const runtime = 'edge';

export async function GET(request: Request) {
  const result = await render(<Invoice />);

  return new Response(result.buffer, {
    headers: {
      'Content-Type': 'application/pdf',
    },
  });
}
```

PaperSend automatically:
- Loads fonts from Google Fonts CDN (no file system needed)
- Loads images from URLs
- Generates PDF using Satori + resvg + pdf-lib

All of this works in Edge environments where file system access is not available.
