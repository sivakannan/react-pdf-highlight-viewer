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
    onHighlightAdd,
    enableAreaSelection = false,
    // Destructure all other DocumentProps to pass through
    ...documentProps
}) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [selectionContext, setSelectionContext] = useState<{ 
        content: string; 
        pageNumber: number; 
        rect: DOMRect;
        boundingRect?: { left: number; top: number; width: number; height: number };
    } | null>(null);
    const [commentInput, setCommentInput] = useState('');

    const handleMouseUp = useCallback(() => {
        if (enableAreaSelection) return; // Handled by PageHighlighter
        
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const textContent = selection.toString().trim();
        if (!textContent) return;

        // Check if the selection is inside a text layer
        let node = selection.anchorNode;
        let isInsidePdf = false;
        let pageNumber = 1;

        while (node && node !== document.body) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.classList && el.classList.contains('react-pdf__Page')) {
                    isInsidePdf = true;
                    const pageAttr = el.getAttribute('data-page-number');
                    if (pageAttr) pageNumber = parseInt(pageAttr, 10);
                    break;
                }
            }
            if (node.parentNode) {
                node = node.parentNode;
            } else {
                break;
            }
        }

        if (isInsidePdf) {
            const rect = range.getBoundingClientRect();
            setSelectionContext({ content: textContent, pageNumber, rect });
            setCommentInput('');
        }
    }, []);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        // If clicking outside the popover, clear selection
        const popover = document.getElementById('pdf-highlight-popover');
        if (popover && popover.contains(e.target as Node)) {
            return; // Clicked inside popover
        }
        setSelectionContext(null);
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [handleMouseUp, handleMouseDown]);

    const handleSaveHighlight = () => {
        if (selectionContext && onHighlightAdd) {
            onHighlightAdd({
                content: selectionContext.content,
                pageNumber: selectionContext.pageNumber,
                comment: commentInput,
                color: defaultHighlightColor,
                boundingRect: selectionContext.boundingRect
            });
            setSelectionContext(null);
            window.getSelection()?.removeAllRanges();
        }
    };

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
                        enableAreaSelection={enableAreaSelection}
                        onAreaSelect={(rect, boundingRect) => {
                            setSelectionContext({
                                content: '', // Empty for area highlights
                                pageNumber,
                                rect,
                                boundingRect
                            });
                            setCommentInput('');
                        }}
                    />
                ))}
            </Document>

            {/* Annotation Popover */}
            {selectionContext && onHighlightAdd && (
                <div
                    id="pdf-highlight-popover"
                    style={{
                        position: 'fixed',
                        top: selectionContext.rect.top - 55,
                        left: selectionContext.rect.left + (selectionContext.rect.width / 2),
                        transform: 'translateX(-50%)',
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        padding: '8px',
                        zIndex: 10000,
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        border: '1px solid #ddd'
                    }}
                >
                    <input
                        autoFocus
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveHighlight();
                            if (e.key === 'Escape') setSelectionContext(null);
                        }}
                        style={{
                            padding: '6px 10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '13px',
                            width: '200px',
                            outline: 'none',
                            fontFamily: 'inherit'
                        }}
                    />
                    <button
                        onClick={handleSaveHighlight}
                        style={{
                            backgroundColor: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            fontFamily: 'inherit'
                        }}
                    >
                        Save
                    </button>
                    {/* Little triangle pointer below popover */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #fff',
                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
                    }} />
                </div>
            )}
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
    enableAreaSelection?: boolean;
    onAreaSelect?: (rect: DOMRect, boundingRect: { left: number; top: number; width: number; height: number }) => void;
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
    pageProps,
    enableAreaSelection,
    onAreaSelect
}) => {
    const pageRef = useRef<HTMLDivElement>(null);
    const [textLayerReady, setTextLayerReady] = useState(false);
    const originalTextsRef = useRef<Map<Element, string>>(new Map());

    // State for drawing an area highlight
    const [drawing, setDrawing] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!enableAreaSelection || !pageRef.current) return;
        e.preventDefault(); // Prevent text selection
        
        const rect = pageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setDrawing({ startX: x, startY: y, currentX: x, currentY: y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!enableAreaSelection || !drawing || !pageRef.current) return;
        
        const rect = pageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setDrawing(prev => prev ? { ...prev, currentX: Math.max(0, Math.min(x, rect.width)), currentY: Math.max(0, Math.min(y, rect.height)) } : null);
    };

    const handleMouseUp = () => {
        if (!enableAreaSelection || !drawing || !pageRef.current) return;
        
        const pageEl = pageRef.current;
        const width = Math.abs(drawing.currentX - drawing.startX);
        const height = Math.abs(drawing.currentY - drawing.startY);
        
        // Only trigger if the area is large enough
        if (width > 5 && height > 5 && onAreaSelect) {
            const left = Math.min(drawing.startX, drawing.currentX);
            const top = Math.min(drawing.startY, drawing.currentY);
            
            // Calculate percentages
            const percentLeft = (left / pageEl.clientWidth) * 100;
            const percentTop = (top / pageEl.clientHeight) * 100;
            const percentWidth = (width / pageEl.clientWidth) * 100;
            const percentHeight = (height / pageEl.clientHeight) * 100;

            // Get viewport coordinates for the popover
            const pageRect = pageEl.getBoundingClientRect();
            const domRect = new DOMRect(pageRect.left + left, pageRect.top + top, width, height);

            onAreaSelect(domRect, {
                left: percentLeft,
                top: percentTop,
                width: percentWidth,
                height: percentHeight
            });
        }
        
        setDrawing(null);
    };

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
            id?: string;
            start: number;
            end: number;
            color: string;
            comment?: string;
        }
        const allRanges: HighlightRange[] = [];

        for (const highlight of pageHighlights) {
            const { id, content, color, caseSensitive, comment } = highlight;
            if (!content) continue;

            const isCaseSensitive = caseSensitive !== undefined ? caseSensitive : defaultCaseSensitive;
            const highlightColor = color || defaultColor;

            // Escape special regex characters in the search content
            const escapeRegExp = (string: string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };

            // Replace any whitespace in the search string with \s* to handle PDF layout variations
            // (e.g. newlines from selection vs spaces in DOM)
            const regexStr = escapeRegExp(content).replace(/\s+/g, '\\s*');
            
            try {
                const regex = new RegExp(regexStr, isCaseSensitive ? '' : 'i');
                const match = regex.exec(fullText);

                if (!match) continue;

                allRanges.push({
                    id: id,
                    start: match.index,
                    end: match.index + match[0].length,
                    color: highlightColor,
                    comment: comment,
                });
            } catch (err) {
                console.warn("Failed to parse highlight text as regex:", err);
            }
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
                id?: string;
                localStart: number;
                localEnd: number;
                color: string;
                comment?: string;
                isFirstSegment: boolean;
            }
            const segments: SpanSegment[] = [];

            for (const range of allRanges) {
                const overlapStart = Math.max(range.start, spanStart);
                const overlapEnd = Math.min(range.end, spanEnd);

                if (overlapStart < overlapEnd) {
                    segments.push({
                        id: range.id,
                        localStart: overlapStart - spanStart,
                        localEnd: overlapEnd - spanStart,
                        color: range.color,
                        comment: range.comment,
                        isFirstSegment: overlapStart === range.start, // True if this is the very beginning of the highlight
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
                    
                    if (seg.id && seg.isFirstSegment) {
                        mark.id = seg.id;
                    }

                    if (seg.comment) {
                        mark.setAttribute('data-comment', seg.comment);
                        mark.className = 'has-comment';
                    }
                    
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

    // Separate highlights that are area-based (have boundingRect)
    const pageHighlights = highlights.filter(h => h.pageNumber === pageNumber);
    const areaHighlights = pageHighlights.filter(h => h.boundingRect);

    return (
        <div 
            ref={pageRef} 
            data-testid={`pdf-page-highlighter-${pageNumber}`}
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setDrawing(null)}
        >
            <Page
                pageNumber={pageNumber}
                width={width}
                onGetTextSuccess={handleTextLayerReady}
                {...pageProps}
            />

            {/* Render saved area highlights */}
            {areaHighlights.map((h, i) => {
                if (!h.boundingRect) return null;
                return (
                    <div
                        key={`area-${i}`}
                        id={h.id}
                        className={h.comment ? 'has-comment' : ''}
                        data-comment={h.comment}
                        style={{
                            position: 'absolute',
                            left: `${h.boundingRect.left}%`,
                            top: `${h.boundingRect.top}%`,
                            width: `${h.boundingRect.width}%`,
                            height: `${h.boundingRect.height}%`,
                            backgroundColor: h.color || defaultColor,
                            opacity: 0.4,
                            pointerEvents: 'auto',
                            cursor: h.comment ? 'help' : 'default',
                            zIndex: 2, // Above text layer
                        }}
                    />
                );
            })}

            {/* Render current drawing area */}
            {drawing && (
                <div
                    style={{
                        position: 'absolute',
                        left: Math.min(drawing.startX, drawing.currentX),
                        top: Math.min(drawing.startY, drawing.currentY),
                        width: Math.abs(drawing.currentX - drawing.startX),
                        height: Math.abs(drawing.currentY - drawing.startY),
                        backgroundColor: 'rgba(33, 150, 243, 0.3)',
                        border: '1px solid #2196f3',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                />
            )}
        </div>
    );
};
