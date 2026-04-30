import { useState } from 'react';
import { pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PdfHighlighter, downloadHighlightedPdf } from 'react-pdf-highlight-viewer';
import type { Highlight } from 'react-pdf-highlight-viewer';
import 'react-pdf-highlight-viewer/dist/react-pdf-highlight-viewer.css';
import './App.css';

// Configure the local worker to avoid corporate proxy/unpkg issues!
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
const PDF_URL = 'https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf';

const snippetLabels = [
  'Opening text',
  'Latin paragraph 1',
  'Latin paragraph 2',
  'Long Latin passage',
  'Latin text (Page 3)',
  'Case-insensitive match',
];

const textSnippets = [
  { pageNumber: 1, content: 'This PDF is three pages long', color: '#4caf50' },
  { pageNumber: 1, content: 'metus. Sed aliquet risus a tortor. Integer id quam. Morbi mi. Quisque nisl felis, venenatis tristique', color: '#2196f3' },
  { pageNumber: 1, content: 'Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh', color: '#ff9800' },
  { pageNumber: 1, content: 'Ut eu diam at pede suscipit sodales. Aenean lectus elit, fermentum non, convallis id, sagittis at,neque.', color: '#9c27b0' },
  { pageNumber: 3, content: 'Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus', color: '#f44336' },
  { pageNumber: 1, content: 'sample pdf', caseSensitive: false, color: '#00bcd4' }
];

function App() {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(1.0);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setScale(1.0);

  const toggleHighlight = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const removeHighlight = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // don't toggle the card
    setSelectedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const clearAll = () => setSelectedIndices(new Set());

  const activeHighlights = Array.from(selectedIndices).map(i => textSnippets[i]);

  const handleDownload = async () => {
    if (activeHighlights.length === 0) return;
    setIsDownloading(true);
    try {
      await downloadHighlightedPdf({
        file: PDF_URL,
        highlights: activeHighlights,
        fileName: 'annotated-document.pdf',
        pdfjs: pdfjs // Pass the same instance to guarantee 100% worker version match!
      });
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download highlighted PDF. Check console for details.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{
        width: '350px',
        padding: '20px',
        borderRight: '1px solid #ddd',
        overflowY: 'auto',
        backgroundColor: '#f5f5f5'
      }}>
        <h2 style={{ marginTop: 0, color: '#333' }}>Text Snippets</h2>
        <p style={{ fontSize: '12px', color: '#888', marginTop: -8 }}>
          Click to toggle highlights (multiple allowed)
        </p>

        {textSnippets.map((snippet, index) => {
          const isSelected = selectedIndices.has(index);
          return (
            <div
              key={index}
              onClick={() => toggleHighlight(index)}
              style={{
                padding: '12px',
                marginBottom: '10px',
                backgroundColor: isSelected ? '#ffeb3b' : 'white',
                border: `2px solid ${isSelected ? snippet.color : '#ddd'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                position: 'relative',
              }}
            >
              <div style={{
                fontWeight: 'bold',
                marginBottom: '5px',
                color: snippet.color,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>Page {snippet.pageNumber}: {snippetLabels[index]}</span>
                {isSelected && (
                  <button
                    onClick={(e) => removeHighlight(index, e)}
                    title="Remove this highlight"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#999',
                      cursor: 'pointer',
                      fontSize: '18px',
                      lineHeight: 1,
                      padding: '0 4px',
                      borderRadius: '50%',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f44336'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {snippet.content}
              </div>
            </div>
          );
        })}

        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>Selected:</strong> {selectedIndices.size} highlight{selectedIndices.size !== 1 ? 's' : ''}
        </div>

        {selectedIndices.size > 0 && (
          <>
            <button
              onClick={clearAll}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '10px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
            >
              🗑 Clear All Highlights
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '10px',
                backgroundColor: isDownloading ? '#90caf9' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => { if (!isDownloading) e.currentTarget.style.backgroundColor = '#1565c0'; }}
              onMouseLeave={(e) => { if (!isDownloading) e.currentTarget.style.backgroundColor = '#1976d2'; }}
            >
              {isDownloading ? '⏳ Downloading...' : '📥 Download with Highlights'}
            </button>
          </>
        )}
      </div>

      {/* PDF Viewer */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        backgroundColor: '#fff'
      }}>
        {/* Header + Zoom Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <h1 style={{ margin: 0, color: '#333', fontSize: '24px' }}>React PDF Highlighter Demo</h1>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            padding: '4px 8px',
          }}>
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              title="Zoom Out"
              style={{
                width: '32px',
                height: '32px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: scale <= 0.5 ? '#e0e0e0' : '#fff',
                color: scale <= 0.5 ? '#bbb' : '#333',
                cursor: scale <= 0.5 ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                boxShadow: scale <= 0.5 ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              −
            </button>

            <button
              onClick={resetZoom}
              title="Reset to 100%"
              style={{
                minWidth: '60px',
                height: '32px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#fff',
                color: '#333',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              onClick={zoomIn}
              disabled={scale >= 3.0}
              title="Zoom In"
              style={{
                width: '32px',
                height: '32px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: scale >= 3.0 ? '#e0e0e0' : '#fff',
                color: scale >= 3.0 ? '#bbb' : '#333',
                cursor: scale >= 3.0 ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                boxShadow: scale >= 3.0 ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              +
            </button>
          </div>
        </div>

        <PdfHighlighter
          file={PDF_URL}
          highlights={activeHighlights}
          onLoadError={(error) => console.error('PDF load error:', error)}
          pageProps={{
            renderTextLayer: true,
            renderAnnotationLayer: false,
            scale: scale,
          }}
        />
      </div>
    </div>
  );
}

export default App;

