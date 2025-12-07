/**
 * @papersend/react
 *
 * React components and render function for PaperSend PDF generation.
 */
export { Document, Page, View, Text, Image, Link, ELEMENT_TYPES, type DocumentProps, type PageProps, type ViewProps, type TextProps, type ImageProps, type LinkProps, } from './components.tsx';
export { render, renderToBuffer, type RenderOptions, type RenderResult, type RenderContext, type Engine, type EngineName, } from './render.ts';
export { tw, parseTailwindClasses } from './tailwind.ts';
export { reactToIR } from './react-to-ir.ts';
export { PageSizes, PaperSendError, isPaperSendError, loadFont, loadImage, registerFont, } from '@papersend/core';
//# sourceMappingURL=index.d.ts.map