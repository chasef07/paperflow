# Font Architecture: How PaperSend Solves Serverless PDF Rendering

## The Problem with @react-pdf/renderer

### How It Works

`@react-pdf/renderer` does NOT use system fonts or browser fonts. It generates PDFs at a binary level, which means it needs the actual font file bytes embedded into the PDF.

**Normal Web Page:**
```
Browser → "Use Inter font" → OS/Browser finds font → Renders
```

**@react-pdf/renderer:**
```
Server → "Use Inter font" → WHERE IS THE FILE?? → Need actual .ttf/.otf bytes → Embeds into PDF
```

### The Font Registration Requirement

```tsx
// src/lib/pdf/doctor-note-template.tsx
import { Font } from '@react-pdf/renderer';

// You MUST register fonts before rendering
Font.register({
  family: 'Plus Jakarta Sans',
  fonts: [
    { src: '/path/to/PlusJakartaSans-Regular.ttf', fontWeight: 400 },
    { src: '/path/to/PlusJakartaSans-Bold.ttf', fontWeight: 700 },
  ],
});
```

The font file has to be:
1. Physically accessible at runtime
2. Read into memory as bytes
3. Embedded into the PDF binary

### Why Vercel Breaks This

**Local Development:**
```
node_modules/@fontsource/plus-jakarta-sans/files/font.ttf
✅ File exists, can read it
```

**Vercel Serverless:**
- Functions are bundled/tree-shaken
- node_modules structure is different
- `process.cwd()` points somewhere unexpected
- `existsSync()` might return true but `readFileSync()` fails
- Cold starts = file system might not be ready

### The Code That Fails

```tsx
// What typical code does:
const fontPath = path.join(process.cwd(), 'node_modules/@fontsource/plus-jakarta-sans/files/...');

if (fs.existsSync(fontPath)) {
  // This might pass...
  const fontBuffer = fs.readFileSync(fontPath); // But THIS fails in Vercel
}
```

---

## Current Workarounds (Not Ideal)

### 1. Use a CDN URL
```tsx
Font.register({
  family: 'Plus Jakarta Sans',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA.ttf',
      fontWeight: 400
    },
  ],
});
```
- ✅ Always works
- ✅ No file system issues
- ❌ Network dependency at render time

### 2. Bundle Font as Base64
```tsx
// fonts/plus-jakarta-sans.ts
export const PLUS_JAKARTA_REGULAR = 'data:font/ttf;base64,AAEAAAATAQAABAAwR...(huge string)';

// doctor-note-template.tsx
import { PLUS_JAKARTA_REGULAR } from './fonts/plus-jakarta-sans';

Font.register({
  family: 'Plus Jakarta Sans',
  src: PLUS_JAKARTA_REGULAR,
});
```
- ✅ Always works (it's in the JS bundle)
- ✅ No network, no file system
- ❌ Increases bundle size (~200KB per font weight)

### 3. Put Font in public/ folder
```tsx
Font.register({
  family: 'Plus Jakarta Sans',
  src: `${process.env.NEXT_PUBLIC_SITE_URL}/fonts/PlusJakartaSans-Regular.ttf`,
});
```
- ✅ Works if your server can fetch from itself
- ❌ Still a network call
- ❌ Circular dependency issues possible

---

## How PaperSend Solves This

### The Core Problem Today

```
@react-pdf/renderer on Vercel:

Request → Cold Start → Load Font from File System → FAIL
                              ↓
                    node_modules not bundled correctly
                    process.cwd() wrong path
                    File system not available in edge
```

### PaperSend Architecture for Serverless

#### 1. No File System Dependencies

```tsx
// @react-pdf/renderer (broken)
Font.register({
  family: 'Inter',
  src: fs.readFileSync('./node_modules/...'), // ❌ File system
});

// PaperSend (works everywhere)
<Text className="font-inter">Hello</Text> // ✅ Just works
```

**How it works under the hood:**

```
┌─────────────────────────────────────────────────────────────┐
│                    PaperSend Runtime                        │
│                                                             │
│  1. Parse component tree                                    │
│  2. Detect font-family declarations                         │
│  3. Fetch fonts from CDN (parallel, cached)                 │
│  4. Render PDF with embedded fonts                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Fonts loaded via HTTP (works everywhere):
  https://fonts.papersend.dev/inter/400.woff2
  https://fonts.papersend.dev/inter/700.woff2
```

#### 2. Smart Font Loading Strategy

```tsx
// packages/core/src/fonts/loader.ts

interface FontLoader {
  // Priority order for loading fonts
  strategies: [
    'memory-cache',      // Already loaded this request
    'edge-cache',        // Cloudflare/Vercel edge cache
    'cdn',               // PaperSend font CDN
    'google-fonts',      // Fallback to Google Fonts API
  ];
}

async function loadFont(family: string, weight: number): Promise<ArrayBuffer> {
  // 1. Check memory cache (same request)
  const cached = fontCache.get(`${family}-${weight}`);
  if (cached) return cached;

  // 2. Fetch from CDN (HTTP - works in edge/serverless)
  const url = `https://fonts.papersend.dev/${family}/${weight}.woff2`;

  const response = await fetch(url, {
    cf: { cacheTtl: 86400 }, // Edge cache for 24h (Cloudflare)
    next: { revalidate: 86400 }, // Edge cache (Vercel)
  });

  const buffer = await response.arrayBuffer();
  fontCache.set(`${family}-${weight}`, buffer);

  return buffer;
}
```

#### 3. Zero Config Font System

```tsx
// User's code - no font registration needed
import { render, Document, Page, Text } from 'papersend';

const Invoice = () => (
  <Document>
    <Page>
      {/* Just use font names - we handle the rest */}
      <Text style={{ fontFamily: 'Inter', fontWeight: 700 }}>
        Invoice #123
      </Text>

      {/* Or Tailwind classes */}
      <Text className="font-inter font-bold">
        Invoice #123
      </Text>
    </Page>
  </Document>
);

// Render - fonts auto-loaded
const pdf = await render(<Invoice />);
```

**What happens internally:**
1. `render(<Invoice />)` called
2. Tree walker finds: `fontFamily: 'Inter'`, `fontWeight: 700`
3. Font resolver:
   - "Inter" → maps to CDN URL
   - Parallel fetch all needed weights
   - Cache in memory for this request
4. Satori/Typst engine receives fonts as ArrayBuffers
5. PDF generated with embedded fonts
6. Return buffer

**Total time:** ~50-100ms (fonts cached at edge)

#### 4. Built-in Font Library

```tsx
// Popular fonts pre-configured
const FONT_MAP = {
  'inter': 'https://fonts.papersend.dev/inter',
  'roboto': 'https://fonts.papersend.dev/roboto',
  'plus-jakarta-sans': 'https://fonts.papersend.dev/plus-jakarta-sans',
  'open-sans': 'https://fonts.papersend.dev/open-sans',
  'lato': 'https://fonts.papersend.dev/lato',
  'poppins': 'https://fonts.papersend.dev/poppins',
  'montserrat': 'https://fonts.papersend.dev/montserrat',
  // ... 50+ popular fonts
};

// Auto-detect Google Fonts
if (!FONT_MAP[family]) {
  // Try Google Fonts API
  return `https://fonts.googleapis.com/css2?family=${family}`;
}
```

#### 5. Edge Runtime Compatible

```tsx
// Works in ALL these environments:

// Vercel Edge Functions
export const runtime = 'edge';

export async function GET() {
  const pdf = await render(<Invoice />); // ✅ Works
  return new Response(pdf.buffer);
}

// Vercel Serverless
export async function GET() {
  const pdf = await render(<Invoice />); // ✅ Works
  return new Response(pdf.buffer);
}

// Cloudflare Workers
export default {
  async fetch(request) {
    const pdf = await render(<Invoice />); // ✅ Works
    return new Response(pdf.buffer);
  }
};

// Bun
Bun.serve({
  fetch(req) {
    const pdf = await render(<Invoice />); // ✅ Works
    return new Response(pdf.buffer);
  }
});
```

#### 6. Font Caching Architecture

```
Request Flow:

User Request
     │
     ▼
┌─────────────────┐
│  Vercel Edge    │ ← Font cached here (24h TTL)
│    Network      │
└────────┬────────┘
         │ Cache MISS (first request)
         ▼
┌─────────────────┐
│  PaperSend CDN  │ ← Font files hosted here
│  (Cloudflare)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Your Function  │ ← Receives font as ArrayBuffer
│  (render PDF)   │
└─────────────────┘

Second request: Font served from Vercel edge cache (~5ms)
```

#### 7. Custom Font Support

```tsx
// Still support custom fonts, but via URL
import { render, registerFont } from 'papersend';

// Option 1: URL (recommended)
registerFont({
  family: 'My Custom Font',
  src: 'https://mycdn.com/fonts/custom.woff2',
  weight: 400,
});

// Option 2: Base64 (for truly private fonts)
registerFont({
  family: 'My Custom Font',
  src: 'data:font/woff2;base64,d09GMgABAAAAAD...',
  weight: 400,
});

// Option 3: Public folder (Vercel/Next.js)
registerFont({
  family: 'My Custom Font',
  src: `${process.env.NEXT_PUBLIC_URL}/fonts/custom.woff2`,
  weight: 400,
});
```

---

## Comparison Summary

### @react-pdf/renderer

| Issue               | Status |
|---------------------|--------|
| File system dependent | ❌ |
| node_modules path issues | ❌ |
| Manual font registration | ❌ |
| No edge runtime support | ❌ |
| Large bundles | ❌ |
| Complex error handling | ❌ |

### PaperSend

| Feature | Status |
|---------|--------|
| HTTP-only (fetch fonts from CDN) | ✅ |
| Zero file system access | ✅ |
| Auto font detection | ✅ |
| Edge runtime native | ✅ |
| Tiny bundles (~50KB) | ✅ |
| Fonts cached at edge | ✅ |
| Works on Vercel, Cloudflare, Bun, anywhere | ✅ |

---

## The Key Insight

> **Treat fonts as remote assets (like images), not local files.**

This single architectural decision eliminates the entire class of serverless font loading problems that plague `@react-pdf/renderer`.
