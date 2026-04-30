import { jsPDF } from 'jspdf';
import type { Highlight, DownloadHighlightedPdfOptions } from '../types';

/**
 * Parse a color string to an rgba() CSS string.
 * Supports: #rgb, #rrggbb, rgb(...), rgba(...), and named CSS colors.
 */
function colorToRgba(color: string, opacity: number): string {
    // Handle shorthand hex (#abc → #aabbcc)
    const shortHexMatch = color.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
    if (shortHexMatch) {
        const r = parseInt(shortHexMatch[1] + shortHexMatch[1], 16);
        const g = parseInt(shortHexMatch[2] + shortHexMatch[2], 16);
        const b = parseInt(shortHexMatch[3] + shortHexMatch[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Handle full hex (#rrggbb)
    const hexMatch = color.match(/^#([0-9a-fA-F]{6})$/);
    if (hexMatch) {
        const bigint = parseInt(hexMatch[1], 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Handle rgb/rgba passthrough — just inject our opacity
    const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity})`;
    }

    // Fallback: use a temporary element to parse named colors
    if (typeof document !== 'undefined') {
        const el = document.createElement('div');
        el.style.color = color;
        document.body.appendChild(el);
        const computed = getComputedStyle(el).color;
        document.body.removeChild(el);
        const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
        }
    }

    // Ultimate fallback: yellow
    return `rgba(255, 235, 59, ${opacity})`;
}

/**
 * Fetch PDF bytes from various source types
 */
async function getPdfBytes(file: string | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
    if (file instanceof Uint8Array) {
        return file;
    }
    if (file instanceof ArrayBuffer) {
        return new Uint8Array(file);
    }
    // It's a URL string — fetch it
    const response = await fetch(file);
    if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

/**
 * Represents a text item with its viewport-space bounding box
 */
interface ViewportTextItem {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Whitespace-flexible text matching.
 *
 * Strips all whitespace from both `text` and `query` to find the match position,
 * then maps the stripped indices back to the original `text` positions.
 * This handles cases where the PDF text items have different spacing than the
 * highlight content string (e.g., "at,neque" vs "at, neque").
 *
 * Returns { start, end } in the original `text` coordinate, or null if no match.
 */
function flexibleMatch(
    text: string,
    query: string,
    caseSensitive: boolean
): { start: number; end: number } | null {
    if (!query || !text) return null;

    const normalize = (s: string) => caseSensitive ? s : s.toLowerCase();
    const normalizedText = normalize(text);
    const normalizedQuery = normalize(query);

    // First try exact match — fast path
    const exactIdx = normalizedText.indexOf(normalizedQuery);
    if (exactIdx !== -1) {
        return { start: exactIdx, end: exactIdx + query.length };
    }

    // Fallback: whitespace-flexible match
    // Build mapping from stripped indices → original indices
    const strippedToOriginal: number[] = [];
    for (let i = 0; i < normalizedText.length; i++) {
        if (!/\s/.test(normalizedText[i])) {
            strippedToOriginal.push(i);
        }
    }

    const strippedText = normalizedText.replace(/\s+/g, '');
    const strippedQuery = normalizedQuery.replace(/\s+/g, '');

    if (!strippedQuery) return null;

    const strippedIdx = strippedText.indexOf(strippedQuery);
    if (strippedIdx === -1) return null;

    const start = strippedToOriginal[strippedIdx];
    const endStripped = strippedIdx + strippedQuery.length - 1;
    const end = strippedToOriginal[endStripped] + 1;

    return { start, end };
}

/**
 * Download a PDF with highlight annotations baked in.
 *
 * This uses a canvas-based approach:
 * 1. Renders each PDF page to an offscreen canvas using pdfjs-dist
 * 2. Extracts text positions and draws highlight rectangles on the same canvas
 * 3. Assembles the highlighted canvases into a new PDF using jsPDF
 *
 * Because pdfjs-dist handles both the page rendering AND the text position
 * extraction, the coordinates are guaranteed to match perfectly.
 *
 * @example
 * ```tsx
 * import { downloadHighlightedPdf } from 'react-pdf-highlight-viewer';
 *
 * await downloadHighlightedPdf({
 *   file: 'https://example.com/document.pdf',
 *   highlights: [
 *     { pageNumber: 1, content: 'important text', color: '#ffeb3b' }
 *   ],
 *   fileName: 'annotated-document.pdf'
 * });
 * ```
 */
export async function downloadHighlightedPdf(
    options: DownloadHighlightedPdfOptions
): Promise<void> {
    const {
        file,
        highlights,
        fileName = 'highlighted.pdf',
        defaultHighlightColor = '#ffeb3b',
        defaultCaseSensitive = true,
        highlightOpacity = 0.35,
        renderScale = 2,
    } = options;

    if (!highlights || highlights.length === 0) {
        throw new Error('No highlights provided');
    }

    // Validate highlights have required fields
    for (const h of highlights) {
        if (!h.pageNumber || h.pageNumber < 1) {
            throw new Error(`Invalid pageNumber: ${h.pageNumber}. Must be >= 1.`);
        }
        if (!h.content || typeof h.content !== 'string') {
            throw new Error('Each highlight must have a non-empty "content" string.');
        }
    }

    // Step 1: Fetch PDF bytes
    const pdfBytes = await getPdfBytes(file);

    // Step 2: Ensure pdfjs worker is configured
    // If the user passed their own pdfjs instance (from react-pdf), use it to guarantee version match!
    const pdfjsLib = options.pdfjs || await import('pdfjs-dist');
    
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        const version = pdfjsLib.version;
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    }

    // Step 3: Load PDF with pdfjs
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    // Group highlights by page for quick lookup
    const highlightsByPage = new Map<number, Highlight[]>();
    for (const h of highlights) {
        // Silently skip highlights for pages that don't exist
        if (h.pageNumber > numPages) continue;

        const existing = highlightsByPage.get(h.pageNumber) || [];
        existing.push(h);
        highlightsByPage.set(h.pageNumber, existing);
    }

    // Step 4: Render each page to canvas, draw highlights, collect images
    let pdf: jsPDF | null = null;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: renderScale });

        // Create an offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error(`Failed to create 2D canvas context for page ${pageNum}`);
        }

        // Render the PDF page to canvas
        await page.render({
            canvasContext: ctx,
            viewport: viewport,
            canvas: canvas,
        }).promise;

        // If this page has highlights, draw them
        const pageHighlights = highlightsByPage.get(pageNum);
        if (pageHighlights && pageHighlights.length > 0) {
            // Get text content for this page
            const textContent = await page.getTextContent();

            // Extract text items with viewport-transformed positions
            const textItems: ViewportTextItem[] = [];
            for (const item of textContent.items) {
                if ('type' in item) continue; // skip marked content

                const textItem = item as {
                    str: string;
                    transform: number[];
                    width: number;
                    height: number;
                };

                // Include empty strings — they might be spaces
                if (textItem.str === undefined || textItem.str === null) continue;

                // transform = [scaleX, shearX, shearY, scaleY, tx, ty]
                const tx = textItem.transform[4];
                const ty = textItem.transform[5];
                const fontSize = Math.abs(textItem.transform[3]);

                // Convert PDF coordinates to viewport (canvas) coordinates
                const [vx, vy] = viewport.convertToViewportPoint(tx, ty);

                // Width and height scaled by renderScale
                const scaledWidth = textItem.width * renderScale;
                const scaledHeight = (fontSize || textItem.height) * renderScale;

                // Guard against zero-width items (some PDFs have them for spacing)
                textItems.push({
                    str: textItem.str,
                    x: vx,
                    y: vy - scaledHeight, // vy is baseline, move up by height
                    width: scaledWidth,
                    height: scaledHeight > 0 ? scaledHeight : 12 * renderScale, // fallback height
                });
            }

            if (textItems.length === 0) continue;

            // Build the full text from text items, inserting synthetic spaces
            // where there's a visual gap between items on the same line.
            // This only needs to be done ONCE per page (not per highlight).
            const itemsWithSpaces: { str: string; itemIndex: number; isSpace: boolean }[] = [];

            for (let i = 0; i < textItems.length; i++) {
                const current = textItems[i];

                if (i > 0 && current.str.trim()) {
                    const prev = textItems[i - 1];

                    // Check if items are on the same line (similar y coordinate)
                    const sameLine = prev.height > 0 && Math.abs(prev.y - current.y) < prev.height * 0.5;

                    if (sameLine && prev.str.trim()) {
                        const prevEndX = prev.x + prev.width;
                        const gap = current.x - prevEndX;
                        // Insert space if gap exceeds threshold (proportional to font size)
                        if (gap > prev.height * 0.15) {
                            itemsWithSpaces.push({ str: ' ', itemIndex: -1, isSpace: true });
                        }
                    } else if (!sameLine) {
                        // Different line — insert space separator
                        itemsWithSpaces.push({ str: ' ', itemIndex: -1, isSpace: true });
                    }
                }

                itemsWithSpaces.push({ str: current.str, itemIndex: i, isSpace: false });
            }

            const fullText = itemsWithSpaces.map(entry => entry.str).join('');

            // For each highlight, find matching text and draw rectangles
            for (const highlight of pageHighlights) {
                const { content, caseSensitive, color } = highlight;
                if (!content) continue;

                const isCaseSensitive = caseSensitive !== undefined ? caseSensitive : defaultCaseSensitive;
                const highlightColor = color || defaultHighlightColor;

                // Use whitespace-flexible matching
                const match = flexibleMatch(fullText, content, isCaseSensitive);
                if (!match) continue;

                const { start: startIdx, end: endIdx } = match;

                // Map character indices to text items and draw highlight rects
                ctx.fillStyle = colorToRgba(highlightColor, highlightOpacity);
                let charPos = 0;

                for (const entry of itemsWithSpaces) {
                    const entryStart = charPos;
                    const entryEnd = charPos + entry.str.length;

                    const overlapStart = Math.max(startIdx, entryStart);
                    const overlapEnd = Math.min(endIdx, entryEnd);

                    if (overlapStart < overlapEnd && !entry.isSpace && entry.itemIndex >= 0) {
                        const item = textItems[entry.itemIndex];
                        const localStart = overlapStart - entryStart;
                        const localEnd = overlapEnd - entryStart;

                        // Calculate partial highlight rect
                        const charWidth = item.width / (item.str.length || 1);
                        const rectX = item.x + localStart * charWidth;
                        const rectW = (localEnd - localStart) * charWidth;

                        // Guard against negative or zero dimensions
                        if (rectW > 0 && item.height > 0) {
                            ctx.fillRect(rectX, item.y, rectW, item.height);
                        }
                    }

                    charPos += entry.str.length;
                }
            }
        }

        // Convert canvas to image and add to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Page dimensions in points — viewport is scaled by renderScale
        const pageWidthPt = viewport.width / renderScale;
        const pageHeightPt = viewport.height / renderScale;

        if (pageNum === 1) {
            pdf = new jsPDF({
                orientation: pageWidthPt > pageHeightPt ? 'landscape' : 'portrait',
                unit: 'pt',
                format: [pageWidthPt, pageHeightPt],
            });
        } else {
            pdf!.addPage([pageWidthPt, pageHeightPt], pageWidthPt > pageHeightPt ? 'landscape' : 'portrait');
        }

        pdf!.addImage(imgData, 'JPEG', 0, 0, pageWidthPt, pageHeightPt);

        // Release canvas memory
        canvas.width = 0;
        canvas.height = 0;
    }

    // Clean up pdfjs
    await pdfDoc.destroy();

    // Step 5: Save and download
    if (pdf) {
        pdf.save(fileName);
    }
}
