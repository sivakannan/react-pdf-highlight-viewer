# React PDF Highlighter - Example App

This is the official demonstration app for the `react-pdf-highlight-viewer` library. It provides a full, interactive UI for testing out the library's features, including text highlighting, area drawing, and native PDF export.

## Running the Example

Make sure you are in the `example` directory, then run:

```bash
npm install
npm run dev
```

This will start a Vite development server (typically at `http://localhost:5173`).

## Features Demonstrated

The `App.tsx` file provides a great reference implementation for how to integrate the library into a real-world application. It demonstrates:

1. **Worker Configuration**: How to correctly import and attach the local `pdfjs-dist` worker (bypassing CDN/proxy issues) to ensure fast, reliable rendering.
2. **State Management**: Using standard React `useState` to manage a collection of highlight objects.
3. **Interactive Highlighting**: Hooking into the `onHighlightAdd` callback to capture text selections and user comments via the native floating popover.
4. **Area Drawing**: Toggling the `enableAreaSelection` prop via a UI button to let users draw coordinate-based bounding boxes.
5. **PDF Export**: Wiring up a "Download" button to the `downloadHighlightedPdf` utility to export the annotated PDF natively.
6. **Zoom Controls**: Managing a `scale` state and passing it down to `pageProps` so highlights automatically resize when zooming in and out.

## Structure

- `src/App.tsx` - The main application code containing the sidebar and the PDF viewer component.
- `src/App.css` - Global resets and basic styling.

## Notes on PDF.js Worker

In this example, we configure the PDF.js worker to use the CDN version that exactly matches the `react-pdf` API version:
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```
This is the recommended approach as it completely eliminates "API vs Worker Version Mismatch" errors!
