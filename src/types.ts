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

/**
 * Options for the downloadHighlightedPdf utility function
 */
export interface DownloadHighlightedPdfOptions {
    /**
     * Source of the PDF file
     * Can be a URL string, ArrayBuffer, or Uint8Array
     */
    file: string | ArrayBuffer | Uint8Array;

    /**
     * Array of text highlights to embed into the downloaded PDF
     */
    highlights: Highlight[];

    /**
     * Output filename for the downloaded PDF
     * @default 'highlighted.pdf'
     */
    fileName?: string;

    /**
     * Default highlight color (hex) for highlights without a specific color
     * @default '#ffeb3b'
     */
    defaultHighlightColor?: string;

    /**
     * Default case sensitivity for highlights without a specific caseSensitive value
     * @default true
     */
    defaultCaseSensitive?: boolean;

    /**
     * Opacity of highlight rectangles (0 to 1)
     * @default 0.35
     */
    highlightOpacity?: number;

    /**
     * Canvas render scale factor. Higher values produce sharper output but larger files.
     * @default 2
     */
    renderScale?: number;

    /**
     * Optional pdfjs instance from your main application (e.g., from 'react-pdf').
     * Pass this to guarantee 100% version matching in strict environments.
     */
    pdfjs?: any;
}
