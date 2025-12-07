/**
 * PaperSend Intermediate Representation (IR)
 *
 * The IR is the heart of PaperSend. All React components convert to this format,
 * and all engines consume it. This decouples the component layer from rendering.
 */
export type IRNodeType = 'document' | 'page' | 'view' | 'text' | 'image' | 'link';
export interface IRNode {
    type: IRNodeType;
    props: IRNodeProps;
    style: IRStyle;
    children: IRNode[];
}
export interface IRNodeProps {
    content?: string;
    src?: string;
    href?: string;
    size?: PageSize;
    margin?: Margin;
    title?: string;
    author?: string;
    subject?: string;
    [key: string]: unknown;
}
export interface IRDocument {
    version: 1;
    pages: IRPage[];
    fonts: IRFontUsage[];
    images: IRImageUsage[];
    metadata?: IRDocumentMetadata;
}
export interface IRDocumentMetadata {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    creationDate?: Date;
}
export interface IRPage {
    size: PageSize;
    margin: Margin;
    children: IRNode[];
}
export interface IRStyle {
    display?: 'flex' | 'none';
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
    alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
    flex?: number | string;
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: number | string;
    gap?: number;
    rowGap?: number;
    columnGap?: number;
    padding?: number | string;
    paddingTop?: number | string;
    paddingRight?: number | string;
    paddingBottom?: number | string;
    paddingLeft?: number | string;
    margin?: number | string;
    marginTop?: number | string;
    marginRight?: number | string;
    marginBottom?: number | string;
    marginLeft?: number | string;
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    maxWidth?: number | string;
    minHeight?: number | string;
    maxHeight?: number | string;
    position?: 'relative' | 'absolute';
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
    zIndex?: number;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number | string;
    fontStyle?: 'normal' | 'italic';
    lineHeight?: number | string;
    letterSpacing?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    textDecoration?: 'none' | 'underline' | 'line-through';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    color?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    opacity?: number;
    borderWidth?: number;
    borderTopWidth?: number;
    borderRightWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
    borderColor?: string;
    borderTopColor?: string;
    borderRightColor?: string;
    borderBottomColor?: string;
    borderLeftColor?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    borderRadius?: number;
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    overflow?: 'visible' | 'hidden';
    objectFit?: 'contain' | 'cover' | 'fill' | 'none';
    objectPosition?: string;
}
export interface PageSize {
    width: number;
    height: number;
}
export interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
/**
 * Standard page sizes in points (1 point = 1/72 inch)
 */
export declare const PageSizes: {
    readonly A4: {
        readonly width: 595.28;
        readonly height: 841.89;
    };
    readonly A3: {
        readonly width: 841.89;
        readonly height: 1190.55;
    };
    readonly A5: {
        readonly width: 419.53;
        readonly height: 595.28;
    };
    readonly Letter: {
        readonly width: 612;
        readonly height: 792;
    };
    readonly Legal: {
        readonly width: 612;
        readonly height: 1008;
    };
    readonly Tabloid: {
        readonly width: 792;
        readonly height: 1224;
    };
};
export type PageSizeName = keyof typeof PageSizes;
export interface IRFontUsage {
    family: string;
    weights: number[];
    styles: ('normal' | 'italic')[];
}
export interface IRImageUsage {
    id: string;
    src: string;
    originalSrc: ImageSource;
}
/**
 * Possible image source types
 */
export type ImageSource = string | ArrayBuffer | Uint8Array | (() => Promise<string | ArrayBuffer | Uint8Array>);
/**
 * Convert a margin value to a Margin object
 */
export declare function normalizeMargin(margin: number | string | Partial<Margin> | undefined): Margin;
/**
 * Resolve a page size from name or dimensions
 */
export declare function resolvePageSize(size: PageSizeName | PageSize | undefined): PageSize;
//# sourceMappingURL=types.d.ts.map