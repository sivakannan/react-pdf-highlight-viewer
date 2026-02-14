# React PDF Highlighter

A lightweight, production-ready React library for rendering PDFs with text highlighting support. Built on top of `react-pdf` with a simple, intuitive API.

## Features

✨ **Simple API** - Just pass a PDF file and an array of highlights  
🎨 **Customizable Colors** - Set default or per-highlight colors  
🔤 **Case-Insensitive Matching** - Optional case-insensitive text matching  
📱 **Responsive** - Automatically adapts to container width  
⚡ **Performance Optimized** - Efficient DOM manipulation and memoization  
🔄 **Dynamic Updates** - Add/remove highlights on the fly  
📦 **Lightweight** - Minimal bundle size with peer dependencies  
🎯 **TypeScript Support** - Full type definitions included  

## Installation

```bash
npm install react-pdf-highlight-viewer react react-dom react-pdf
```

### Peer Dependencies

This library requires the following peer dependencies:

- `react` ^18.0.0 || ^19.0.0
- `react-dom` ^18.0.0 || ^19.0.0
- `react-pdf` ^10.3.0

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

// Set default case-insensitivity for all highlights
function GlobalCaseInsensitive() {
  return (
    <PdfHighlighter 
      file="/document.pdf"
      defaultCaseSensitive={false}  // All highlights are case-insensitive by default
      highlights={[
        { pageNumber: 1, content: "sample text" },  // Case-insensitive
        { pageNumber: 2, content: "another example" },  // Case-insensitive
        // Override to be case-sensitive for this one
        { pageNumber: 3, content: "ExactCase", caseSensitive: true }
      ]}
    />
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
      onSourceSuccess={() => console.log('Source loaded')}
      
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

### Responsive Width

```tsx
function ResponsiveExample() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* PDF will adapt to container width */}
      <PdfHighlighter 
        file="/document.pdf"
        highlights={[]}
      />
    </div>
  );
}
```

### Fixed Width

```tsx
function FixedWidthExample() {
  return (
    <PdfHighlighter 
      file="/document.pdf"
      width={600}  // Fixed 600px width
      highlights={[]}
    />
  );
}
```

## Important Notes

### Text Matching

By default, the `content` field must **exactly match** the PDF's internal text representation:

- ✅ Correct: `"Hello World"` (if PDF has this exact text)
- ✅ Also works: `"hello world"` with `caseSensitive: false`
- ❌ Wrong: `"Hello  World"` (extra space - whitespace must still match exactly)

**Tips**: 
- Use `caseSensitive: false` to ignore case differences
- Copy text directly from the PDF viewer to ensure exact matching
- Whitespace must always match exactly, even with case-insensitive mode

### Whitespace Issues

PDFs sometimes store text differently than it appears visually. If highlighting doesn't work:

1. Open browser DevTools
2. Inspect the PDF text layer
3. Copy the exact text from the DOM
4. Use that text in your `content` field

Example:
```tsx
// Visual text: "purus aliquam"
// PDF internal: "purusaliquam" (no space!)

// Use the internal representation:
{ pageNumber: 1, content: "purusaliquam" }
```

## Troubleshooting

### Highlights Not Appearing

1. **Check text matching**: Ensure `content` exactly matches PDF text
2. **Verify page number**: Page numbers are 1-indexed (first page = 1)
3. **Check console**: Look for errors or warnings
4. **Inspect DOM**: Verify text exists in `.react-pdf__Page__textContent`

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
