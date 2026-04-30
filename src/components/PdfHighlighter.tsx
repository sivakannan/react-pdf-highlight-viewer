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
     * Callback fired when react-pdf finishes rendering the text layer.
     * Toggles textLayerReady false→true to force effects to re-run,
     * even if the text layer was previously ready (e.g., after a zoom change
     * causes react-pdf to rebuild the DOM).
     */
    const handleTextLayerReady = useCallback(() => {
        setTextLayerReady(false);
        setTimeout(() => {
            setTextLayerReady(true);
        }, 100);
    }, []);

    /**
     * Store original text content when text layer becomes ready.
     * Detects stale span references (from a previous render) by checking
     * if the first stored span is still a child of the current text layer.
     * If not, clears the map and re-captures from the new spans.
     */
    useEffect(() => {
        if (!textLayerReady || !pageRef.current) return;

        const textLayer = pageRef.current.querySelector('.react-pdf__Page__textContent');
        if (!textLayer) return;

        const spans = Array.from(textLayer.querySelectorAll('span[role="presentation"]'));
        if (spans.length === 0) return;

        // Check if stored spans are stale (no longer in the DOM)
        if (originalTextsRef.current.size > 0) {
            const firstStoredSpan = originalTextsRef.current.keys().next().value;
            if (firstStoredSpan && !textLayer.contains(firstStoredSpan)) {
                originalTextsRef.current.clear();
            }
        }

        // Capture original text from current spans
        if (originalTextsRef.current.size === 0) {
            spans.forEach(span => {
                originalTextsRef.current.set(span, span.textContent || '');
            });
        }
    }, [textLayerReady]);

    /**
     * Apply or clear highlights when they change
     * First restores all text to original state, then applies new highlights
     * in a single pass per span to avoid later highlights overwriting earlier ones.
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

        // Concatenate all span text for searching (using original text)
        const spanTexts = spans.map(s => originalTextsRef.current.get(s) || s.textContent || '');
        const fullText = spanTexts.join('');

        // Step 1: Find ALL highlight ranges in the full text
        interface HighlightRange {
            start: number;
            end: number;
            color: string;
        }
        const allRanges: HighlightRange[] = [];

        for (const highlight of pageHighlights) {
            const { content, color, caseSensitive } = highlight;
            if (!content) continue;

            const isCaseSensitive = caseSensitive !== undefined ? caseSensitive : defaultCaseSensitive;
            const highlightColor = color || defaultColor;

            let startIndex: number;
            if (isCaseSensitive) {
                startIndex = fullText.indexOf(content);
            } else {
                startIndex = fullText.toLowerCase().indexOf(content.toLowerCase());
            }

            if (startIndex === -1) continue;

            allRanges.push({
                start: startIndex,
                end: startIndex + content.length,
                color: highlightColor,
            });
        }

        if (allRanges.length === 0) return;

        // Step 2: For each span, collect the highlight segments and rebuild once
        let currentIndex = 0;
        spans.forEach((span) => {
            const spanText = originalTextsRef.current.get(span) || span.textContent || '';
            const spanStart = currentIndex;
            const spanEnd = currentIndex + spanText.length;

            // Find all highlight ranges that overlap with this span
            interface SpanSegment {
                localStart: number;
                localEnd: number;
                color: string;
            }
            const segments: SpanSegment[] = [];

            for (const range of allRanges) {
                const overlapStart = Math.max(range.start, spanStart);
                const overlapEnd = Math.min(range.end, spanEnd);

                if (overlapStart < overlapEnd) {
                    segments.push({
                        localStart: overlapStart - spanStart,
                        localEnd: overlapEnd - spanStart,
                        color: range.color,
                    });
                }
            }

            if (segments.length > 0) {
                // Sort segments by start position
                segments.sort((a, b) => a.localStart - b.localStart);

                // Build the span content with all highlights applied at once
                span.innerHTML = '';
                let pos = 0;

                for (const seg of segments) {
                    // Add unhighlighted text before this segment
                    if (seg.localStart > pos) {
                        span.appendChild(document.createTextNode(spanText.slice(pos, seg.localStart)));
                    }

                    // Add highlighted text
                    const mark = document.createElement('mark');
                    mark.style.backgroundColor = seg.color;
                    mark.style.color = '#000';
                    mark.textContent = spanText.slice(seg.localStart, seg.localEnd);
                    span.appendChild(mark);

                    pos = seg.localEnd;
                }

                // Add any remaining text after the last segment
                if (pos < spanText.length) {
                    span.appendChild(document.createTextNode(spanText.slice(pos)));
                }
            }

            currentIndex += spanText.length;
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
