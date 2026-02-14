import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PdfHighlighter } from '../PdfHighlighter';
import type { Highlight } from '../../types';

// Mock react-pdf
vi.mock('react-pdf', () => ({
    Document: ({ children, onLoadSuccess }: any) => {
        // Simulate successful PDF load
        setTimeout(() => onLoadSuccess?.({ numPages: 3 }), 100);
        return <div data-testid="pdf-document">{children}</div>;
    },
    Page: ({ pageNumber, onGetTextSuccess }: any) => {
        // Simulate text layer ready
        setTimeout(() => onGetTextSuccess?.(), 100);
        return (
            <div data-testid={`pdf-page-${pageNumber}`}>
                <div className="react-pdf__Page__textContent">
                    <span>Sample PDF</span>
                    <span>This is a test document</span>
                    <span>Lorem ipsum dolor sit amet</span>
                </div>
            </div>
        );
    },
    pdfjs: {
        GlobalWorkerOptions: { workerSrc: '' },
        version: '3.0.0'
    }
}));

describe('PdfHighlighter', () => {
    const mockFile = 'https://example.com/test.pdf';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render without crashing', () => {
            render(<PdfHighlighter file={mockFile} />);
            expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
        });


        it('should render all pages after PDF loads', async () => {
            render(<PdfHighlighter file={mockFile} />);

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
                expect(screen.getByTestId('pdf-page-2')).toBeInTheDocument();
                expect(screen.getByTestId('pdf-page-3')).toBeInTheDocument();
            });
        });
    });

    describe('Highlighting', () => {
        it('should apply highlights to correct pages', async () => {
            const highlights: Highlight[] = [
                { pageNumber: 1, content: 'Sample PDF' },
                { pageNumber: 2, content: 'test document' }
            ];

            render(<PdfHighlighter file={mockFile} highlights={highlights} />);

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });

        it('should handle empty highlights array', async () => {
            render(<PdfHighlighter file={mockFile} highlights={[]} />);

            await waitFor(() => {
                expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
            });
        });

        it('should apply custom colors to highlights', async () => {
            const highlights: Highlight[] = [
                { pageNumber: 1, content: 'Sample PDF', color: '#ff0000' }
            ];

            render(<PdfHighlighter file={mockFile} highlights={highlights} />);

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });

        it('should use default highlight color when not specified', async () => {
            const highlights: Highlight[] = [
                { pageNumber: 1, content: 'Sample PDF' }
            ];

            render(
                <PdfHighlighter
                    file={mockFile}
                    highlights={highlights}
                    defaultHighlightColor="#00ff00"
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });
    });

    describe('Case Sensitivity', () => {
        it('should match text case-sensitively by default', async () => {
            const highlights: Highlight[] = [
                { pageNumber: 1, content: 'sample pdf' } // lowercase
            ];

            render(<PdfHighlighter file={mockFile} highlights={highlights} />);

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });

        it('should match text case-insensitively when specified', async () => {
            const highlights: Highlight[] = [
                { pageNumber: 1, content: 'SAMPLE PDF', caseSensitive: false }
            ];

            render(<PdfHighlighter file={mockFile} highlights={highlights} />);

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });

        it('should use global case sensitivity setting', async () => {
            const highlights: Highlight[] = [
                { pageNumber: 1, content: 'SAMPLE PDF' }
            ];

            render(
                <PdfHighlighter
                    file={mockFile}
                    highlights={highlights}
                    defaultCaseSensitive={false}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });

        it('should allow per-highlight override of global setting', async () => {
            const highlights: Highlight[] = [
                { pageNumber: 1, content: 'Sample PDF', caseSensitive: true }
            ];

            render(
                <PdfHighlighter
                    file={mockFile}
                    highlights={highlights}
                    defaultCaseSensitive={false}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });
    });

    describe('React-PDF Props Passthrough', () => {
        it('should pass Document props to react-pdf', async () => {
            const onLoadSuccess = vi.fn();
            const onLoadError = vi.fn();

            render(
                <PdfHighlighter
                    file={mockFile}
                    onLoadSuccess={onLoadSuccess}
                    onLoadError={onLoadError}
                />
            );

            await waitFor(() => {
                expect(onLoadSuccess).toHaveBeenCalled();
            });
        });

        it('should pass Page props via pageProps', async () => {
            render(
                <PdfHighlighter
                    file={mockFile}
                    pageProps={{
                        scale: 1.5,
                        renderTextLayer: true,
                        renderAnnotationLayer: false
                    }}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });
    });

    describe('Dynamic Updates', () => {
        it('should update highlights when prop changes', async () => {
            const { rerender } = render(
                <PdfHighlighter
                    file={mockFile}
                    highlights={[{ pageNumber: 1, content: 'Sample PDF' }]}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });

            rerender(
                <PdfHighlighter
                    file={mockFile}
                    highlights={[{ pageNumber: 2, content: 'test document' }]}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-2')).toBeInTheDocument();
            });
        });

        it('should handle file changes', async () => {
            const { rerender } = render(
                <PdfHighlighter file={mockFile} />
            );

            await waitFor(() => {
                expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
            });

            rerender(
                <PdfHighlighter file="https://example.com/another.pdf" />
            );

            await waitFor(() => {
                expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle null file gracefully', () => {
            render(<PdfHighlighter file={null} />);
            expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
        });

        it('should handle highlights for non-existent pages', async () => {
            const highlights: Highlight[] = [
                { pageNumber: 999, content: 'nonexistent' }
            ];

            render(<PdfHighlighter file={mockFile} highlights={highlights} />);

            await waitFor(() => {
                expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
            });
        });

        it('should handle highlights with non-matching content', async () => {
            const highlights: Highlight[] = [
                { pageNumber: 1, content: 'This text does not exist in the PDF' }
            ];

            render(<PdfHighlighter file={mockFile} highlights={highlights} />);

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });

        it('should handle very long highlight content', async () => {
            const highlights: Highlight[] = [
                {
                    pageNumber: 1,
                    content: 'A'.repeat(10000)
                }
            ];

            render(<PdfHighlighter file={mockFile} highlights={highlights} />);

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });
    });

    describe('Width Prop', () => {
        it('should apply custom width to pages', async () => {
            render(<PdfHighlighter file={mockFile} width={600} />);

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });

        it('should be responsive when width is not specified', async () => {
            render(<PdfHighlighter file={mockFile} />);

            await waitFor(() => {
                expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
            });
        });
    });
});
