import type { DocumentProps, PageProps } from 'react-pdf';

/**
 * Represents a text highlight in a PDF document
 */
export interface Highlight {
    /**
     * The page number where the highlight should appear (1-indexed)
     */
    pageNumber: number;

    /**
     * The exact text content to highlight
     * Note: Must match the PDF's internal text representation exactly (unless caseSensitive is false)
     */
    content: string;

    /**
     * Optional custom background color for this highlight
     * @default '#ffeb3b' (yellow)
     */
    color?: string;

    /**
     * Whether to match text case-sensitively
     * @default true
     */
    caseSensitive?: boolean;
}

/**
 * Props for the PdfHighlighter component
 * Extends react-pdf's DocumentProps to allow full customization
 */
export interface PdfHighlighterProps extends Omit<DocumentProps, 'children'> {
    /**
     * Source of the PDF file
     * Can be a URL string, base64 data URI, or File object
     * @example "https://example.com/document.pdf"
     * @example "data:application/pdf;base64,..."
     */
    file: string | File | null;

    /**
     * Array of text highlights to apply to the PDF
     * @default []
     */
    highlights?: Highlight[];

    /**
     * Width of the PDF pages in pixels
     * If not provided, pages will be responsive
     * @default undefined (responsive)
     */
    width?: number;

    /**
     * Custom loading component to display while PDF is loading
     * @default <div>Loading PDF...</div>
     */
    loading?: React.ReactNode;

    /**
     * Default highlight color for all highlights
     * Individual highlights can override this with their own color
     * @default '#ffeb3b' (yellow)
     */
    defaultHighlightColor?: string;

    /**
     * Default case sensitivity for all highlights
     * Individual highlights can override this with their own caseSensitive property
     * @default true
     */
    defaultCaseSensitive?: boolean;

    /**
     * Additional props to pass to each Page component
     * Allows customization of page rendering (scale, renderMode, etc.)
     */
    pageProps?: Omit<PageProps, 'pageNumber' | 'width' | 'onGetTextSuccess'>;
}
