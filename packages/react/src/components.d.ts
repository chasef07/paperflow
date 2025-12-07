/**
 * PaperSend React Components
 *
 * These components are used to define PDF document structure.
 * They render to custom element types that are later converted to IR.
 */
import { type ReactNode, type CSSProperties } from 'react';
import type { PageSizeName, PageSize } from '@papersend/core';
/**
 * Custom element type names used internally.
 * These are not real DOM elements - they're markers for the IR converter.
 */
export declare const ELEMENT_TYPES: {
    readonly DOCUMENT: "papersend-document";
    readonly PAGE: "papersend-page";
    readonly VIEW: "papersend-view";
    readonly TEXT: "papersend-text";
    readonly IMAGE: "papersend-image";
    readonly LINK: "papersend-link";
};
export interface DocumentProps {
    children: ReactNode;
    /** PDF title metadata */
    title?: string;
    /** PDF author metadata */
    author?: string;
    /** PDF subject metadata */
    subject?: string;
    /** PDF creator metadata */
    creator?: string;
}
/**
 * Root component for a PDF document.
 * Must contain one or more <Page> components.
 *
 * @example
 * ```tsx
 * <Document title="Invoice #123">
 *   <Page>
 *     <Text>Hello World</Text>
 *   </Page>
 * </Document>
 * ```
 */
export declare function Document({ children, ...props }: DocumentProps): import("react").ReactElement<{
    /** PDF title metadata */
    title?: string;
    /** PDF author metadata */
    author?: string;
    /** PDF subject metadata */
    subject?: string;
    /** PDF creator metadata */
    creator?: string;
}, string | import("react").JSXElementConstructor<any>>;
export interface PageProps {
    children?: ReactNode;
    /** Page size - predefined name or custom dimensions */
    size?: PageSizeName | PageSize;
    /** Page margins in points or as object */
    margin?: number | {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    /** Custom styles for the page */
    style?: CSSProperties;
    /** Tailwind-style class names */
    className?: string;
    /** Page orientation */
    orientation?: 'portrait' | 'landscape';
}
/**
 * Represents a single page in the PDF document.
 *
 * @example
 * ```tsx
 * <Page size="A4" margin={40}>
 *   <Text>Page content</Text>
 * </Page>
 * ```
 */
export declare function Page({ children, size, margin, orientation, ...props }: PageProps): import("react").ReactElement<{
    /** Custom styles for the page */
    style?: CSSProperties;
    /** Tailwind-style class names */
    className?: string;
    size: PageSize | "A4" | "A3" | "A5" | "Letter" | "Legal" | "Tabloid";
    margin: number | {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    orientation: "portrait" | "landscape";
}, string | import("react").JSXElementConstructor<any>>;
export interface ViewProps {
    children?: ReactNode;
    /** Custom styles */
    style?: CSSProperties;
    /** Tailwind-style class names */
    className?: string;
    /** Whether this view should stay on one page (no page breaks inside) */
    wrap?: boolean;
    /** Fixed position across all pages */
    fixed?: boolean;
    /** Debug mode - shows bounding box */
    debug?: boolean;
}
/**
 * A container component, similar to a div.
 * Uses flexbox for layout by default.
 *
 * @example
 * ```tsx
 * <View className="flex flex-row gap-4">
 *   <Text>Left</Text>
 *   <Text>Right</Text>
 * </View>
 * ```
 */
export declare function View({ children, wrap, ...props }: ViewProps): import("react").ReactElement<{
    /** Custom styles */
    style?: CSSProperties;
    /** Tailwind-style class names */
    className?: string;
    /** Fixed position across all pages */
    fixed?: boolean;
    /** Debug mode - shows bounding box */
    debug?: boolean;
    wrap: boolean;
}, string | import("react").JSXElementConstructor<any>>;
export interface TextProps {
    children?: ReactNode;
    /** Custom styles */
    style?: CSSProperties;
    /** Tailwind-style class names */
    className?: string;
    /** Whether text can wrap to next page */
    wrap?: boolean;
    /** Fixed position across all pages */
    fixed?: boolean;
    /** Debug mode - shows bounding box */
    debug?: boolean;
    /** Hyphenation callback */
    hyphenationCallback?: (word: string) => string[];
}
/**
 * Text content component.
 *
 * @example
 * ```tsx
 * <Text className="text-2xl font-bold text-gray-900">
 *   Hello World
 * </Text>
 * ```
 */
export declare function Text({ children, wrap, ...props }: TextProps): import("react").ReactElement<{
    /** Custom styles */
    style?: CSSProperties;
    /** Tailwind-style class names */
    className?: string;
    /** Fixed position across all pages */
    fixed?: boolean;
    /** Debug mode - shows bounding box */
    debug?: boolean;
    /** Hyphenation callback */
    hyphenationCallback?: (word: string) => string[];
    wrap: boolean;
}, string | import("react").JSXElementConstructor<any>>;
export interface ImageProps {
    /** Image source - URL, base64 data URI, or async function */
    src: string | (() => Promise<string>);
    /** Custom styles */
    style?: CSSProperties;
    /** Tailwind-style class names */
    className?: string;
    /** Alt text for accessibility */
    alt?: string;
    /** Fixed position across all pages */
    fixed?: boolean;
    /** Debug mode - shows bounding box */
    debug?: boolean;
    /** Cache the image */
    cache?: boolean;
}
/**
 * Image component for embedding images in the PDF.
 * Supports URLs, base64 data URIs, and async functions.
 *
 * @example
 * ```tsx
 * <Image
 *   src="https://example.com/logo.png"
 *   className="w-32 h-32"
 * />
 * ```
 */
export declare function Image({ src, cache, ...props }: ImageProps): import("react").ReactElement<{
    /** Custom styles */
    style?: CSSProperties;
    /** Tailwind-style class names */
    className?: string;
    /** Alt text for accessibility */
    alt?: string;
    /** Fixed position across all pages */
    fixed?: boolean;
    /** Debug mode - shows bounding box */
    debug?: boolean;
    src: string | (() => Promise<string>);
    cache: boolean;
}, string | import("react").JSXElementConstructor<any>>;
export interface LinkProps {
    children: ReactNode;
    /** URL to link to */
    href: string;
    /** Custom styles */
    style?: CSSProperties;
    /** Tailwind-style class names */
    className?: string;
    /** Debug mode - shows bounding box */
    debug?: boolean;
}
/**
 * Hyperlink component.
 *
 * @example
 * ```tsx
 * <Link href="https://example.com">
 *   Click here
 * </Link>
 * ```
 */
export declare function Link({ children, href, ...props }: LinkProps): import("react").ReactElement<{
    /** Custom styles */
    style?: CSSProperties;
    /** Tailwind-style class names */
    className?: string;
    /** Debug mode - shows bounding box */
    debug?: boolean;
    href: string;
}, string | import("react").JSXElementConstructor<any>>;
//# sourceMappingURL=components.d.ts.map