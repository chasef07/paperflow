# Robust Build Outline: "PaperSend" (Bun-Native PDF Renderer)

## Vision Statement

**The Resend of PDFs:** A Bun-native, edge-compatible PDF renderer with React components and a dead-simple API. Built for the AI-coding era.

---

## Phase 1: Foundation (Weeks 1-4)

### 1.1 Technical Research & Validation

| Task                       | Purpose                             |
|----------------------------|-------------------------------------|
| Benchmark Satori + pdf-lib | Validate edge-compatible approach   |
| Test Typst WASM            | Evaluate as alternative engine      |
| Profile Bun FFI to Rust    | Check if native bindings are viable |
| Audit @react-pdf/renderer  | Understand what to improve          |

**Key Questions to Answer:**
- Can we hit <100ms render time for a 1-page PDF?
- What's the bundle size for edge deployment?
- How do we handle fonts without the pain?

### 1.2 Core Architecture Decision

**Recommended: Multi-Engine Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    PaperSend SDK                        │
│                                                         │
│  render(<Component />)  →  Normalize to IR (JSON AST)   │
│                                                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   Engine Layer                          │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  │
│  │  Satori │  │  Typst  │  │ Browser │  │  Cloud    │  │
│  │  (Fast) │  │  (WASM) │  │  (Full) │  │  (API)    │  │
│  └─────────┘  └─────────┘  └─────────┘  └───────────┘  │
│                                                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   PDF Output                            │
│         Buffer | File | Stream | URL                    │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Project Setup

```bash
# Initialize with Bun
bun init papersend
cd papersend
```

**Project Structure:**
```
papersend/
├── packages/
│   ├── core/              # IR, types, shared logic
│   ├── react/             # React component library
│   ├── engine-satori/     # Satori + pdf-lib engine
│   ├── engine-typst/      # Typst WASM engine
│   ├── engine-browser/    # Playwright engine
│   ├── cli/               # CLI tool
│   └── api/               # Cloud API (optional)
├── examples/
│   ├── next-app/
│   ├── bun-server/
│   └── cloudflare-worker/
├── docs/
└── tests/
```

---

## Phase 2: Core SDK (Weeks 5-8)

### 2.1 React Component Library

```tsx
// packages/react/src/components.tsx
export const Document: FC<DocumentProps> = ({ children, ...props }) => {
  return <papersend-document {...props}>{children}</papersend-document>;
};

export const Page: FC<PageProps> = ({ children, size = 'A4', margin = '1in' }) => {
  return <papersend-page size={size} margin={margin}>{children}</papersend-page>;
};

export const Text: FC<TextProps> = ({ children, style }) => {
  return <papersend-text style={style}>{children}</papersend-text>;
};

export const View: FC<ViewProps> = ({ children, style }) => {
  return <papersend-view style={style}>{children}</papersend-view>;
};

export const Image: FC<ImageProps> = ({ src, style }) => {
  return <papersend-image src={src} style={style} />;
};

// Tables, Lists, etc.
```

### 2.2 Tailwind Integration (Key Differentiator)

```tsx
// packages/react/src/tailwind.ts
import { createTailwindStyles } from './tailwind-parser';

// Support Tailwind classes directly
export const tw = (classes: string): CSSProperties => {
  return createTailwindStyles(classes);
};

// Usage
<Text style={tw('text-2xl font-bold text-gray-900')}>
  Invoice #123
</Text>

// Or with className prop (parsed at render time)
<Text className="text-2xl font-bold text-gray-900">
  Invoice #123
</Text>
```

### 2.3 Main API

```tsx
// packages/core/src/render.ts
import type { ReactElement } from 'react';

interface RenderOptions {
  engine?: 'satori' | 'typst' | 'browser' | 'cloud';
  format?: 'A4' | 'Letter' | 'Legal' | { width: number; height: number };
  fonts?: FontConfig[];
  tailwind?: TailwindConfig;
}

interface RenderResult {
  buffer: Buffer;
  pages: number;
  metadata: PDFMetadata;

  // Convenience methods
  toFile(path: string): Promise<void>;
  toBase64(): string;
  toDataUri(): string;
  toStream(): ReadableStream;
}

export async function render(
  element: ReactElement,
  options?: RenderOptions
): Promise<RenderResult> {
  // 1. Convert React tree to IR
  const ir = await reactToIR(element);

  // 2. Select engine
  const engine = selectEngine(options?.engine);

  // 3. Render to PDF
  const buffer = await engine.render(ir, options);

  // 4. Return result with helpers
  return createRenderResult(buffer);
}

// Simple one-liner for common cases
export async function renderToBuffer(element: ReactElement): Promise<Buffer> {
  const result = await render(element);
  return result.buffer;
}
```

### 2.4 Font System (Solve the #1 Pain Point)

```tsx
// packages/core/src/fonts.ts

// Built-in fonts that just work
export const fonts = {
  inter: () => import('@papersend/font-inter'),
  roboto: () => import('@papersend/font-roboto'),
  openSans: () => import('@papersend/font-opensans'),
  plusJakarta: () => import('@papersend/font-plus-jakarta'),
  // ... more popular fonts
};

// Auto-register fonts
export async function registerFonts(config: FontConfig[]) {
  // Handles:
  // - Loading from URL
  // - Loading from npm package
  // - Loading from local file
  // - Caching
  // - Subsetting (only include used characters)
}

// Magic: Auto-detect fonts from CSS
export async function autoDetectFonts(ir: IR): Promise<FontConfig[]> {
  // Scan IR for font-family declarations
  // Auto-load Google Fonts
  // Cache aggressively
}
```

---

## Phase 3: Engines (Weeks 9-12)

### 3.1 Satori Engine (Primary - Edge Compatible)

```tsx
// packages/engine-satori/src/index.ts
import satori from 'satori';
import { PDFDocument } from 'pdf-lib';

export class SatoriEngine implements Engine {
  async render(ir: IR, options: RenderOptions): Promise<Buffer> {
    // 1. Convert IR to Satori-compatible React
    const element = irToReact(ir);

    // 2. Render to SVG
    const svg = await satori(element, {
      width: options.width,
      height: options.height,
      fonts: await this.loadFonts(options.fonts),
    });

    // 3. Convert SVG to PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([options.width, options.height]);
    await embedSvg(page, svg);

    return Buffer.from(await pdf.save());
  }
}
```

### 3.2 Typst Engine (High Quality - WASM)

```tsx
// packages/engine-typst/src/index.ts
import { Typst } from '@aspect/typst-wasm';

export class TypstEngine implements Engine {
  private typst: Typst;

  async init() {
    this.typst = await Typst.create();
  }

  async render(ir: IR, options: RenderOptions): Promise<Buffer> {
    // 1. Convert IR to Typst markup
    const typstSource = irToTypst(ir);

    // 2. Render with Typst
    const pdf = await this.typst.compile(typstSource, {
      fonts: options.fonts,
    });

    return pdf;
  }
}

// IR to Typst converter
function irToTypst(ir: IR): string {
  // Example output:
  // #set page(paper: "a4", margin: 1in)
  // #set text(font: "Inter", size: 12pt)
  //
  // = Invoice \#123
  //
  // #table(
  //   columns: (1fr, auto, auto),
  //   [Item], [Qty], [Price],
  //   [Widget], [2], [$10.00],
  // )
}
```

### 3.3 Browser Engine (Full Compatibility)

```tsx
// packages/engine-browser/src/index.ts
import { chromium } from 'playwright';

export class BrowserEngine implements Engine {
  async render(ir: IR, options: RenderOptions): Promise<Buffer> {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // 1. Convert IR to HTML
    const html = irToHtml(ir);

    // 2. Set content
    await page.setContent(html);

    // 3. Generate PDF
    const pdf = await page.pdf({
      format: options.format,
      printBackground: true,
    });

    await browser.close();
    return pdf;
  }
}
```

---

## Phase 4: Developer Experience (Weeks 13-16)

### 4.1 CLI Tool

```bash
# Install globally
bun add -g @papersend/cli

# Preview PDF in browser (hot reload)
papersend dev ./templates/invoice.tsx

# Generate PDF
papersend render ./templates/invoice.tsx -o invoice.pdf

# Generate from URL
papersend render https://myapp.com/invoice/123 -o invoice.pdf
```

### 4.2 Next.js Integration

```tsx
// app/api/invoice/[id]/route.ts
import { render } from '@papersend/react';
import { Invoice } from '@/templates/invoice';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const data = await getInvoiceData(params.id);

  const pdf = await render(<Invoice data={data} />);

  return new Response(pdf.buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${params.id}.pdf"`,
    },
  });
}
```

### 4.3 Bun-Native Server

```tsx
// server.ts
import { render } from '@papersend/react';
import { Invoice } from './templates/invoice';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname.startsWith('/pdf/')) {
      const id = url.pathname.split('/')[2];
      const data = await getInvoiceData(id);

      const pdf = await render(<Invoice data={data} />);

      return new Response(pdf.buffer, {
        headers: { 'Content-Type': 'application/pdf' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
});
```

---

## Phase 5: Cloud API (Optional - Weeks 17-20)

### 5.1 API Design

```tsx
// Cloud API for users who want managed rendering

// SDK usage
import { PaperSend } from '@papersend/api';

const papersend = new PaperSend({ apiKey: 'ps_...' });

// Option 1: Send React component (serialized)
const pdf = await papersend.render(<Invoice data={data} />);

// Option 2: Send HTML
const pdf = await papersend.render({
  html: '<div>...</div>',
  css: '...',
});

// Option 3: Send URL (screenshot)
const pdf = await papersend.render({
  url: 'https://myapp.com/invoice/123',
  waitFor: '#loaded',
});

// Returns
{
  url: 'https://cdn.papersend.dev/abc123.pdf', // Temporary URL
  buffer: Buffer,
  pages: 1,
}
```

### 5.2 Infrastructure (Bun-Native)

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare                           │
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │
│  │   Workers   │ →  │    Queue    │ →  │  Browser   │  │
│  │   (API)     │    │  (Render)   │    │  Rendering │  │
│  └─────────────┘    └─────────────┘    └────────────┘  │
│         │                                     │         │
│         ▼                                     ▼         │
│  ┌─────────────┐                      ┌────────────┐   │
│  │     R2      │ ←──────────────────  │   Result   │   │
│  │  (Storage)  │                      │            │   │
│  └─────────────┘                      └────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 6: Templates & Ecosystem (Ongoing)

### 6.1 Template Gallery

```bash
# Install a template
bun add @papersend/template-invoice
```

```tsx
# Use it
import { Invoice } from '@papersend/template-invoice';

const pdf = await render(
  <Invoice
    company={myCompany}
    customer={customer}
    items={lineItems}
  />
);
```

**Starter Templates:**
- Invoice
- Receipt
- Contract
- Certificate
- Report
- Resume
- Letter

### 6.2 Community Components

```tsx
// @papersend/components
import {
  Table,
  Chart,        // Built-in chart support
  Barcode,
  QRCode,
  Signature,
  Watermark,
  PageNumber,
  TableOfContents,
} from '@papersend/components';
```

---

## Business Model

### Open Source Core
- Full rendering engine: MIT licensed
- React components: MIT licensed
- CLI: MIT licensed
- Bun-native, edge-compatible

### Paid Cloud API

| Tier       | Price  | PDFs/month | Features            |
|------------|--------|------------|---------------------|
| Free       | $0     | 100        | Basic rendering     |
| Pro        | $29    | 10,000     | Priority, fonts CDN |
| Team       | $99    | 50,000     | Analytics, webhooks |
| Enterprise | Custom | Unlimited  | SLA, dedicated      |

### Additional Revenue
- Premium templates: $19-49 each
- Font bundles: $9/month
- Priority support: $199/month

---

## Competitive Positioning

```
                    High Quality
                         │
                         │
    @react-pdf ─────────┼──────────── PaperSend Cloud
                         │                    ▲
                         │                    │
    Simple ──────────────┼────────────────────┼─── Complex
                         │                    │
                         │                    │
    Puppeteer ──────────┼──────────── PaperSend Local
                         │
                         │
                    Low Quality
```

**Key Differentiators:**
1. **Bun-native:** First PDF library built for Bun
2. **Tailwind support:** Use your existing styles
3. **Fonts that work:** No configuration needed
4. **Edge-compatible:** Deploy anywhere
5. **AI-friendly:** Simple API for AI-generated PDFs

---

## Timeline Summary

| Phase         | Duration    | Deliverable                           |
|---------------|-------------|---------------------------------------|
| 1. Foundation | Weeks 1-4   | Architecture, research, project setup |
| 2. Core SDK   | Weeks 5-8   | React components, API, font system    |
| 3. Engines    | Weeks 9-12  | Satori, Typst, Browser engines        |
| 4. DX         | Weeks 13-16 | CLI, Next.js integration, docs        |
| 5. Cloud      | Weeks 17-20 | API service, infrastructure           |
| 6. Ecosystem  | Ongoing     | Templates, components, community      |

**MVP (8 weeks):** Local rendering with Satori engine, React components, Tailwind support, Bun-native.
