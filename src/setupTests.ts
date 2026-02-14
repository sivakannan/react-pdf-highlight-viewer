import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock PDF.js worker
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs', () => ({}));

// Mock canvas for PDF rendering
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
})) as any;

// Suppress console warnings during tests
globalThis.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
} as any;
