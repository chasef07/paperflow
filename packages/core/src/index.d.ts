/**
 * @papersend/core
 *
 * Core types, IR, and loaders for PaperSend.
 * This package provides the foundation that all other packages build upon.
 */
export { type IRNodeType, type IRNode, type IRNodeProps, type IRDocument, type IRDocumentMetadata, type IRPage, type IRStyle, type PageSize, type Margin, type IRFontUsage, type IRImageUsage, type ImageSource, type PageSizeName, PageSizes, normalizeMargin, resolvePageSize, } from './ir/index.ts';
export { PaperSendError, isPaperSendError, wrapError, type ErrorCode, type ErrorContext, } from './errors.ts';
export { loadFont, loadFontsForDocument, detectFontsFromIR, registerFont, clearFontCache, type FontConfig, type LoadedFont, } from './fonts/index.ts';
export { loadImage, loadImages, clearImageCache, toDataUri, type ImageFormat, type LoadedImage, type ImageLoadOptions, } from './images/index.ts';
//# sourceMappingURL=index.d.ts.map