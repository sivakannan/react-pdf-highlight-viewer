import { useState } from 'react';
import { PdfHighlighter } from 'react-pdf-highlight-viewer';
import type { Highlight } from 'react-pdf-highlight-viewer';
import 'react-pdf-highlight-viewer/dist/react-pdf-highlight-viewer.css';
import './App.css';

const textSnippets = [
  { pageNumber: 1, content: 'This PDF is three pages long', color: '#4caf50' },
  { pageNumber: 1, content: 'metus. Sed aliquet risus a tortor. Integer id quam. Morbi mi. Quisque nisl felis, venenatis tristique', color: '#2196f3' },
  { pageNumber: 1, content: 'Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh', color: '#ff9800' },
  { pageNumber: 1, content: 'Ut eu diam at pede suscipit sodales. Aenean lectus elit, fermentum non, convallis id, sagittis at,neque...', color: '#9c27b0' },
  { pageNumber: 3, content: 'Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus...', color: '#f44336' },
  { pageNumber: 1, content: 'sample pdf', caseSensitive: false, color: '#00bcd4' }
];

function App() {
  const [selectedHighlight, setSelectedHighlight] = useState<number | null>(null);

  const toggleHighlight = (index: number) => {
    // If clicking the same snippet, deselect it; otherwise select the new one
    setSelectedHighlight(prev => prev === index ? null : index);
  };

  const activeHighlights = selectedHighlight !== null ? [textSnippets[selectedHighlight]] : [];

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

        {textSnippets.map((snippet, index) => (
          <div
            key={index}
            onClick={() => toggleHighlight(index)}
            style={{
              padding: '12px',
              marginBottom: '10px',
              backgroundColor: selectedHighlight === index ? '#ffeb3b' : 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: selectedHighlight === index ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            <div style={{
              fontWeight: 'bold',
              marginBottom: '5px',
              color: snippet.color
            }}>
              Page {snippet.pageNumber}: {index === 0 ? 'Opening text' :
                index === 1 ? 'Latin paragraph 1' :
                  index === 2 ? 'Latin paragraph 2' :
                    index === 3 ? 'Long Latin passage' :
                      index === 4 ? 'Latin text' :
                        'Case-insensitive match'}
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
        ))}

        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>Selected:</strong> {selectedHighlight !== null ? '1 highlight' : '0 highlights'}
        </div>

        {selectedHighlight !== null && (
          <button
            onClick={() => setSelectedHighlight(null)}
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
            Clear Highlight
          </button>
        )}
      </div>

      {/* PDF Viewer */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        backgroundColor: '#fff'
      }}>
        <h1 style={{ marginTop: 0, color: '#333' }}>React PDF Highlighter Demo</h1>

        <PdfHighlighter
          file="https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf"
          highlights={activeHighlights}
          width={800}
          // Example of passing react-pdf Document props
          onLoadError={(error) => console.error('PDF load error:', error)}
          // Example of passing react-pdf Page props
          pageProps={{
            renderTextLayer: true,
            renderAnnotationLayer: false,
            scale: 1.0
          }}
        />
      </div>
    </div>
  );
}

export default App;
