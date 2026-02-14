import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PageProps } from 'react-pdf';
import type { PdfHighlighterProps, Highlight } from '../types';

// Configure PDF.js worker - use CDN to avoid bundler path issues
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Import required CSS for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

/**
 * PdfHighlighter - A React component for rendering PDFs with text highlighting
 * 
 * @example
 * ```tsx
 * <PdfHighlighter 
 *   file="https://example.com/document.pdf"
 *   highlights={[
 *     { pageNumber: 1, content: "important text" }
 *   ]}
 * />
 * ```
 */
export const PdfHighlighter: React.FC<PdfHighlighterProps> = ({
    file,
    highlights = [],
    width,
    loading,
    defaultHighlightColor = '#ffeb3b',
    defaultCaseSensitive = true,
    pageProps,
    // Destructure all other DocumentProps to pass through
    ...documentProps
}) => {
    const [numPages, setNumPages] = useState<number>(0);

    const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    }, []);

    // Memoize page array to prevent unnecessary re-renders
    const pages = useMemo(
        () => Array.from({ length: numPages }, (_, index) => index + 1),
        [numPages]
    );

    return (
        <div className="pdf-highlighter-container" data-testid="pdf-highlighter-container">
            <Document
                file={file}
                onLoadSuccess={handleDocumentLoadSuccess}
                loading={loading || <div>Loading PDF...</div>}
                {...documentProps}
            >
                {pages.map((pageNumber) => (
                    <PageHighlighter
                        key={`page_${pageNumber}`}
                        pageNumber={pageNumber}
                        width={width}
                        highlights={highlights}
                        defaultColor={defaultHighlightColor}
                        defaultCaseSensitive={defaultCaseSensitive}
                        pageProps={pageProps}
                    />
                ))}
            </Document>
        </div>
    );
};

/**
 * Props for internal PageHighlighter component
 */
interface PageHighlighterProps {
    pageNumber: number;
    width?: number;
    highlights: Highlight[];
    defaultColor: string;
    defaultCaseSensitive: boolean;
    pageProps?: Omit<PageProps, 'pageNumber' | 'width' | 'onGetTextSuccess'>;
}

/**
 * PageHighlighter - Internal component that handles highlighting for a single PDF page
 * Manages text layer manipulation and highlight application
 */
const PageHighlighter: React.FC<PageHighlighterProps> = ({
    pageNumber,
    width,
    highlights,
    defaultColor,
    defaultCaseSensitive,
    pageProps
}) => {
    const pageRef = useRef<HTMLDivElement>(null);
    const [textLayerReady, setTextLayerReady] = useState(false);
    const originalTextsRef = useRef<Map<Element, string>>(new Map());

    /**
     * Callback fired when react-pdf finishes rendering the text layer
     * Uses setTimeout to ensure DOM is fully updated before proceeding
     */
    const handleTextLayerReady = useCallback(() => {
        setTimeout(() => {
            setTextLayerReady(true);
        }, 100);
    }, []);

    /**
     * Store original text content when text layer first becomes ready
     * This allows us to restore text when highlights are cleared
     */
    useEffect(() => {
        if (!textLayerReady || !pageRef.current) return;

        const textLayer = pageRef.current.querySelector('.react-pdf__Page__textContent');
        if (!textLayer) return;

        const spans = Array.from(textLayer.querySelectorAll('span[role="presentation"]'));

        // Store original text only once
        if (originalTextsRef.current.size === 0) {
            spans.forEach(span => {
                originalTextsRef.current.set(span, span.textContent || '');
            });
        }
    }, [textLayerReady]);

    /**
     * Apply or clear highlights when they change
     * First restores all text to original state, then applies new highlights
     */
    useEffect(() => {
        if (!textLayerReady || !pageRef.current) return;

        const textLayer = pageRef.current.querySelector('.react-pdf__Page__textContent');
        if (!textLayer) return;

        const spans = Array.from(textLayer.querySelectorAll('span[role="presentation"]'));
        if (spans.length === 0) return;

        // Restore all spans to original text (clears existing highlights)
        spans.forEach(span => {
            const originalText = originalTextsRef.current.get(span);
            if (originalText !== undefined) {
                span.innerHTML = '';
                span.appendChild(document.createTextNode(originalText));
            }
        });

        // If no highlights, we're done
        if (!highlights || highlights.length === 0) return;

        // Get highlights for this specific page
        const pageHighlights = highlights.filter(h => h.pageNumber === pageNumber);
        if (pageHighlights.length === 0) return;

        // Concatenate all span text for searching
        const spanTexts = spans.map(s => s.textContent || '');
        const fullText = spanTexts.join('');

        // Apply each highlight
        pageHighlights.forEach(highlight => {
            const { content, color, caseSensitive } = highlight;
            if (!content) return;

            const isCaseSensitive = caseSensitive !== undefined ? caseSensitive : defaultCaseSensitive;
            const highlightColor = color || defaultColor;

            // Find the text with appropriate case sensitivity
            let startIndex: number;
            if (isCaseSensitive) {
                startIndex = fullText.indexOf(content);
            } else {
                const lowerFullText = fullText.toLowerCase();
                const lowerContent = content.toLowerCase();
                startIndex = lowerFullText.indexOf(lowerContent);
            }

            if (startIndex === -1) return;

            const endIndex = startIndex + content.length;

            // Map global character indices back to individual spans
            let currentIndex = 0;
            spans.forEach((span) => {
                const spanText = span.textContent || '';
                const spanStart = currentIndex;
                const spanEnd = currentIndex + spanText.length;

                // Calculate overlap between highlight range and this span
                const overlapStart = Math.max(startIndex, spanStart);
                const overlapEnd = Math.min(endIndex, spanEnd);

                if (overlapStart < overlapEnd) {
                    // This span contains part of the highlight
                    const localStart = overlapStart - spanStart;
                    const localEnd = overlapEnd - spanStart;

                    // Split span text into: before | highlighted | after
                    const before = spanText.slice(0, localStart);
                    const highlighted = spanText.slice(localStart, localEnd);
                    const after = spanText.slice(localEnd);

                    // Rebuild span with <mark> element
                    span.innerHTML = '';
                    if (before) span.appendChild(document.createTextNode(before));

                    const mark = document.createElement('mark');
                    mark.style.backgroundColor = highlightColor;
                    mark.style.color = '#000';
                    mark.textContent = highlighted;
                    span.appendChild(mark);

                    if (after) span.appendChild(document.createTextNode(after));
                }

                currentIndex += spanText.length;
            });
        });
    }, [textLayerReady, highlights, pageNumber, defaultColor, defaultCaseSensitive]);

    return (
        <div ref={pageRef} data-testid={`pdf-page-highlighter-${pageNumber}`}>
            <Page
                pageNumber={pageNumber}
                width={width}
                onGetTextSuccess={handleTextLayerReady}
                {...pageProps}
            />
        </div>
    );
};
