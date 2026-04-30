# React PDF Highlighter

A lightweight, production-ready React library for rendering PDFs with text highlighting support and annotated PDF export. Built on top of `react-pdf` with a simple, intuitive API.

## Demo

![React PDF Highlighter Demo](demo.webp)

## Features

✨ **Simple API** - Just pass a PDF file and an array of highlights  
🎨 **Customizable Colors** - Set default or per-highlight colors  
🔤 **Case-Insensitive Matching** - Optional case-insensitive text matching  
📥 **Download with Highlights** - Export PDFs with highlights baked in using `downloadHighlightedPdf()`  
🔍 **Zoom Support** - Highlights persist across zoom level changes  
📱 **Responsive** - Automatically adapts to container width  
⚡ **Performance Optimized** - Efficient DOM manipulation and memoization  
🔄 **Dynamic Updates** - Add/remove highlights on the fly  
📦 **Lightweight** - Minimal bundle size with peer dependencies  
🎯 **TypeScript Support** - Full type definitions included  

## Installation

```bash
npm install react-pdf-highlight-viewer react react-dom react-pdf pdfjs-dist
```

### Peer Dependencies

This library requires the following peer dependencies:

- `react` ^18.0.0 || ^19.0.0
- `react-dom` ^18.0.0 || ^19.0.0
- `react-pdf` ^10.3.0
- `pdfjs-dist` ^4.0.0 || ^5.0.0

## Quick Start

```tsx
import { PdfHighlighter } from 'react-pdf-highlight-viewer';
import 'react-pdf-highlight-viewer/dist/react-pdf-highlight-viewer.css';

function App() {
  const highlights = [
    { pageNumber: 1, content: "important text" },
    { pageNumber: 2, content: "another highlight", color: "#ff0000" }
  ];

  return (
    <PdfHighlighter 
      file="https://example.com/document.pdf"
      highlights={highlights}
    />
  );
}
```

## API Reference

### `<PdfHighlighter />`

Main component for rendering PDFs with highlights.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `file` | `string \| File \| null` | **required** | PDF source (URL, data URI, or File object) |
| `highlights` | `Highlight[]` | `[]` | Array of text highlights to apply |
| `width` | `number` | `undefined` | Page width in pixels (responsive if not set) |
| `loading` | `React.ReactNode` | `<div>Loading PDF...</div>` | Custom loading component |
| `defaultHighlightColor` | `string` | `'#ffeb3b'` | Default highlight background color |
| `defaultCaseSensitive` | `boolean` | `true` | Default case sensitivity for all highlights |
| `pageProps` | `Omit<PageProps, ...>` | `undefined` | Additional props to pass to each Page component |
| `...documentProps` | `DocumentProps` | - | All other react-pdf Document props are supported |

### `Highlight` Interface

```typescript
interface Highlight {
  pageNumber: number;     // 1-indexed page number
  content: string;        // Exact text to highlight
  color?: string;         // Optional custom color (overrides default)
  caseSensitive?: boolean; // Whether to match case-sensitively (default: true)
}
```

### `downloadHighlightedPdf(options)`

Utility function to download a PDF with highlight annotations baked directly into the output file. Uses a canvas-based approach with jsPDF for precise coordinate alignment.

```typescript
import { downloadHighlightedPdf } from 'react-pdf-highlight-viewer';

await downloadHighlightedPdf({
  file: 'https://example.com/document.pdf',
  highlights: [
    { pageNumber: 1, content: 'important text', color: '#ffeb3b' }
  ],
  fileName: 'annotated-document.pdf'
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `file` | `string \| ArrayBuffer \| Uint8Array` | **required** | PDF source (URL, ArrayBuffer, or Uint8Array) |
| `highlights` | `Highlight[]` | **required** | Array of highlights to embed |
| `fileName` | `string` | `'highlighted.pdf'` | Output filename for the download |
| `defaultHighlightColor` | `string` | `'#ffeb3b'` | Default color for highlights without a color |
| `defaultCaseSensitive` | `boolean` | `true` | Default case sensitivity |
| `highlightOpacity` | `number` | `0.35` | Opacity of highlight rectangles (0 to 1) |
| `renderScale` | `number` | `2` | Canvas render scale. Higher = sharper but larger files |

## Usage Examples

### Basic Highlighting

```tsx
import { PdfHighlighter } from 'react-pdf-highlight-viewer';
import 'react-pdf-highlight-viewer/dist/react-pdf-highlight-viewer.css';

function BasicExample() {
  return (
    <PdfHighlighter 
      file="/path/to/document.pdf"
      highlights={[
        { pageNumber: 1, content: "Chapter 1" }
      ]}
    />
  );
}
```

### Custom Colors

```tsx
function ColorExample() {
  return (
    <PdfHighlighter 
      file="/document.pdf"
      defaultHighlightColor="#ffeb3b"  // Yellow default
      highlights={[
        { pageNumber: 1, content: "Important", color: "#ff0000" },  // Red
        { pageNumber: 1, content: "Note", color: "#00ff00" },       // Green
        { pageNumber: 2, content: "Warning" }                        // Uses default yellow
      ]}
    />
  );
}
```

### Case-Insensitive Matching

```tsx
function CaseInsensitiveExample() {
  return (
    <PdfHighlighter 
      file="/document.pdf"
      highlights={[
        // Will match "Hello World", "HELLO WORLD", "hello world", etc.
        { pageNumber: 1, content: "hello world", caseSensitive: false },
        
        // Case-sensitive (default behavior)
        { pageNumber: 1, content: "Exact Match" },
        
        // Override default with custom color
        { pageNumber: 2, content: "sample", caseSensitive: false, color: "#00ff00" }
      ]}
    />
  );
}
```

### Zoom with Highlights

Highlights automatically persist when zooming in or out. Pass `scale` via `pageProps`:

```tsx
function ZoomExample() {
  const [scale, setScale] = useState(1.0);

  return (
    <div>
      <button onClick={() => setScale(s => Math.min(s + 0.25, 3))}>Zoom In</button>
      <button onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}>Zoom Out</button>
      <span>{Math.round(scale * 100)}%</span>

      <PdfHighlighter 
        file="/document.pdf"
        highlights={[{ pageNumber: 1, content: "highlight me" }]}
        pageProps={{ scale }}
      />
    </div>
  );
}
```

### Download PDF with Highlights

```tsx
import { PdfHighlighter, downloadHighlightedPdf } from 'react-pdf-highlight-viewer';

function DownloadExample() {
  const pdfUrl = '/document.pdf';
  const highlights = [
    { pageNumber: 1, content: "Important finding", color: "#4caf50" },
    { pageNumber: 2, content: "Key result", color: "#2196f3" }
  ];

  const handleDownload = async () => {
    await downloadHighlightedPdf({
      file: pdfUrl,
      highlights,
      fileName: 'annotated-document.pdf',
      highlightOpacity: 0.4
    });
  };

  return (
    <div>
      <button onClick={handleDownload}>Download Annotated PDF</button>
      <PdfHighlighter file={pdfUrl} highlights={highlights} />
    </div>
  );
}
```

### Dynamic Highlights

```tsx
function DynamicExample() {
  const [highlights, setHighlights] = useState([]);

  const addHighlight = (text) => {
    setHighlights(prev => [...prev, { 
      pageNumber: 1, 
      content: text 
    }]);
  };

  const clearHighlights = () => setHighlights([]);

  return (
    <div>
      <button onClick={() => addHighlight("search term")}>
        Add Highlight
      </button>
      <button onClick={clearHighlights}>
        Clear All
      </button>
      <PdfHighlighter 
        file="/document.pdf"
        highlights={highlights}
      />
    </div>
  );
}
```

### With File Upload

```tsx
function FileUploadExample() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      {file && (
        <PdfHighlighter 
          file={file}
          highlights={[{ pageNumber: 1, content: "example" }]}
        />
      )}
    </div>
  );
}
```

### Using React-PDF Props

The component extends `react-pdf`'s `DocumentProps`, so you can pass any Document or Page props:

```tsx
function AdvancedExample() {
  return (
    <PdfHighlighter 
      file="/document.pdf"
      highlights={[{ pageNumber: 1, content: "highlight me" }]}
      
      // Document props (from react-pdf)
      onLoadSuccess={(pdf) => console.log('Loaded', pdf.numPages, 'pages')}
      onLoadError={(error) => console.error('Load error:', error)}
      
      // Page props (applied to all pages)
      pageProps={{
        scale: 1.5,                    // Zoom level
        renderTextLayer: true,         // Enable text selection
        renderAnnotationLayer: false,  // Disable annotations
        renderMode: 'canvas'           // Render mode: 'canvas' | 'svg'
      }}
    />
  );
}
```

## Important Notes

### Text Matching

By default, the `content` field must **closely match** the PDF's internal text representation:

- ✅ Correct: `"Hello World"` (if PDF has this exact text)
- ✅ Also works: `"hello world"` with `caseSensitive: false`
- ✅ Whitespace-flexible: The library handles minor spacing differences between your text and the PDF's internal representation

**Tips**: 
- Use `caseSensitive: false` to ignore case differences
- Copy text directly from the PDF viewer to ensure accurate matching
- The library uses whitespace-flexible matching for `downloadHighlightedPdf()` — minor space differences are handled automatically

### Whitespace Issues

PDFs sometimes store text differently than it appears visually. If highlighting doesn't work:

1. Open browser DevTools
2. Inspect the PDF text layer
3. Copy the exact text from the DOM
4. Use that text in your `content` field

## Troubleshooting

### Highlights Not Appearing

1. **Check text matching**: Ensure `content` closely matches PDF text
2. **Verify page number**: Page numbers are 1-indexed (first page = 1)
3. **Check console**: Look for errors or warnings
4. **Inspect DOM**: Verify text exists in `.react-pdf__Page__textContent`

### Highlights Disappearing After Zoom

This was fixed in v1.2.0. The library now detects when the text layer is rebuilt (e.g., after a zoom change) and automatically re-applies highlights to the new DOM elements.

### PDF Not Loading

1. **CORS issues**: Ensure PDF URL allows cross-origin requests
2. **File path**: Verify the file path or URL is correct
3. **Worker error**: The library uses a CDN-hosted PDF.js worker by default

### Performance Issues

For large PDFs with many highlights:

1. Limit visible pages (implement pagination)
2. Debounce highlight updates
3. Use `React.memo` on parent components

## Changelog

### v1.2.0 (2026-04-30)

**Added:**
- ✅ `downloadHighlightedPdf()` utility — export PDFs with highlights baked in using jsPDF + canvas rendering
- ✅ Whitespace-flexible text matching in download utility — handles spacing differences between PDF text items and highlight strings
- ✅ Multiple simultaneous highlights — select and display multiple highlights at once without overwriting
- ✅ Zoom persistence — highlights survive scale changes via proper text layer lifecycle management
- ✅ Input validation and edge case hardening (color parsing, stale DOM detection, bounds checks)
- ✅ Demo recording included in package

**Fixed:**
- 🐛 Multi-highlight overwrite bug — highlights on shared spans no longer destroy each other (single-pass rebuild)
- 🐛 Zoom highlight loss — text layer re-render now correctly re-captures spans and re-applies marks
- 🐛 Long text passage matching — whitespace-flexible matching prevents false negatives from PDF spacing

**Dependencies:**
- Added `jspdf` as a runtime dependency for PDF export

### v1.1.4 (2026-02-14)

**Updated:**
- ✅ Documentation - Updated README with complete changelog

### v1.1.3 (2026-02-14)

**Fixed:**
- ✅ CSS export configuration - Removed `exports` field restriction to fix Vite import issues
- ✅ Package now works seamlessly with Vite and other bundlers

### v1.1.0 (2026-02-13)

**Added:**
- ✅ React 18 support - Package now supports both React 18.x and React 19.x
- ✅ Backward compatibility with React 18.0.0+

**Updated:**
- Peer dependencies now accept `react` ^18.0.0 || ^19.0.0
- Peer dependencies now accept `react-dom` ^18.0.0 || ^19.0.0

### v1.0.0 (2026-02-09)

**Initial Release:**
- ✅ PDF rendering with text highlighting
- ✅ Case-sensitive and case-insensitive matching
- ✅ Custom highlight colors
- ✅ React-PDF props passthrough
- ✅ TypeScript support
- ✅ Comprehensive test suite (42 tests)
- ✅ Production-ready with full documentation

## Browser Support

- Chrome/Edge: ✅ Latest 2 versions
- Firefox: ✅ Latest 2 versions  
- Safari: ✅ Latest 2 versions

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or PR on GitHub.

## Credits

Built with:
- [react-pdf](https://github.com/wojtekmaj/react-pdf) - PDF rendering
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF parsing (Mozilla)
- [jsPDF](https://github.com/parallax/jsPDF) - PDF generation for annotated download
