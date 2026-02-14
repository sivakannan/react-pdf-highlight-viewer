import { describe, it, expect } from 'vitest';

describe('Highlighting Logic', () => {
    describe('Text Matching', () => {
        it('should match text case-sensitively', () => {
            const text = 'Sample PDF Document';
            const search = 'Sample PDF';

            expect(text.indexOf(search)).toBe(0);
        });

        it('should not match when case differs', () => {
            const text = 'Sample PDF Document';
            const search = 'sample pdf';

            expect(text.indexOf(search)).toBe(-1);
        });

        it('should match case-insensitively when converted', () => {
            const text = 'Sample PDF Document';
            const search = 'sample pdf';

            const lowerText = text.toLowerCase();
            const lowerSearch = search.toLowerCase();

            expect(lowerText.indexOf(lowerSearch)).toBe(0);
        });

        it('should find text in the middle of string', () => {
            const text = 'This is a Sample PDF Document';
            const search = 'Sample PDF';

            expect(text.indexOf(search)).toBe(10);
        });

        it('should handle multi-word searches', () => {
            const text = 'Lorem ipsum dolor sit amet consectetur';
            const search = 'dolor sit amet';

            expect(text.indexOf(search)).toBeGreaterThan(-1);
        });

        it('should return -1 for non-existent text', () => {
            const text = 'Sample PDF Document';
            const search = 'nonexistent';

            expect(text.indexOf(search)).toBe(-1);
        });
    });

    describe('Case Sensitivity Logic', () => {
        const testCaseSensitivity = (
            text: string,
            search: string,
            caseSensitive: boolean
        ): number => {
            if (caseSensitive) {
                return text.indexOf(search);
            } else {
                return text.toLowerCase().indexOf(search.toLowerCase());
            }
        };

        it('should respect case-sensitive flag when true', () => {
            const result = testCaseSensitivity('Sample PDF', 'sample pdf', true);
            expect(result).toBe(-1);
        });

        it('should ignore case when flag is false', () => {
            const result = testCaseSensitivity('Sample PDF', 'sample pdf', false);
            expect(result).toBe(0);
        });

        it('should work with mixed case', () => {
            const result = testCaseSensitivity('SaMpLe PdF', 'SAMPLE PDF', false);
            expect(result).toBe(0);
        });
    });

    describe('Highlight Color Application', () => {
        it('should use default color when not specified', () => {
            const defaultColor = '#ffeb3b';
            const highlightColor = undefined;

            const finalColor = highlightColor || defaultColor;

            expect(finalColor).toBe('#ffeb3b');
        });

        it('should use custom color when specified', () => {
            const defaultColor = '#ffeb3b';
            const highlightColor = '#ff0000';

            const finalColor = highlightColor || defaultColor;

            expect(finalColor).toBe('#ff0000');
        });

        it('should handle hex color codes', () => {
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffeb3b'];

            colors.forEach(color => {
                expect(color).toMatch(/^#[0-9a-f]{6}$/i);
            });
        });
    });

    describe('Multiple Highlights', () => {
        interface Highlight {
            pageNumber: number;
            content: string;
            color?: string;
            caseSensitive?: boolean;
        }

        it('should handle multiple highlights on same page', () => {
            const highlights: Highlight[] = [
                { pageNumber: 1, content: 'first' },
                { pageNumber: 1, content: 'second' },
                { pageNumber: 1, content: 'third' }
            ];

            const page1Highlights = highlights.filter(h => h.pageNumber === 1);

            expect(page1Highlights).toHaveLength(3);
        });

        it('should separate highlights by page', () => {
            const highlights: Highlight[] = [
                { pageNumber: 1, content: 'page1-text' },
                { pageNumber: 2, content: 'page2-text' },
                { pageNumber: 3, content: 'page3-text' }
            ];

            const page2Highlights = highlights.filter(h => h.pageNumber === 2);

            expect(page2Highlights).toHaveLength(1);
            expect(page2Highlights[0].content).toBe('page2-text');
        });

        it('should handle empty highlights array', () => {
            const highlights: Highlight[] = [];

            expect(highlights).toHaveLength(0);
        });

        it('should preserve highlight properties', () => {
            const highlight: Highlight = {
                pageNumber: 1,
                content: 'test',
                color: '#ff0000',
                caseSensitive: false
            };

            expect(highlight.pageNumber).toBe(1);
            expect(highlight.content).toBe('test');
            expect(highlight.color).toBe('#ff0000');
            expect(highlight.caseSensitive).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty search string', () => {
            const text = 'Sample PDF';
            const search = '';

            expect(text.indexOf(search)).toBe(0);
        });

        it('should handle empty text', () => {
            const text = '';
            const search = 'sample';

            expect(text.indexOf(search)).toBe(-1);
        });

        it('should handle special characters', () => {
            const text = 'Price: $99.99 (USD)';
            const search = '$99.99';

            expect(text.indexOf(search)).toBeGreaterThan(-1);
        });

        it('should handle unicode characters', () => {
            const text = 'Café résumé naïve';
            const search = 'résumé';

            expect(text.indexOf(search)).toBeGreaterThan(-1);
        });

        it('should handle very long strings', () => {
            const text = 'A'.repeat(10000) + 'TARGET' + 'B'.repeat(10000);
            const search = 'TARGET';

            expect(text.indexOf(search)).toBe(10000);
        });

        it('should handle newlines and whitespace', () => {
            const text = 'Line 1\nLine 2\tTabbed';
            const search = 'Line 2';

            expect(text.indexOf(search)).toBeGreaterThan(-1);
        });
    });
});
