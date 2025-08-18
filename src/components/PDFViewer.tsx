import { useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { usePDFViewer } from '@/hooks/usePDFViewer';
import { formatZoomLevel, ZOOM_PRESETS, type ZoomLevel } from '@/utils/pdfUtils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// Import PDF.js worker setup
import '@/utils/pdfUtils';

// Note: react-pdf CSS imports cause build issues with Vite
// The PDF viewer will work without them, just without some advanced styling

export interface PDFViewerProps {
  file: File | null;
  onLoadSuccess?: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  onLoadSuccess,
  onLoadError,
  className = '',
}) => {
  const {
    numPages,
    currentPage,
    scale,
    isLoading,
    error,
    setDocument,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomPreset,
    setLoading,
    setError,
    setContainerSize,
    canGoNext,
    canGoPrevious,
    currentZoomPreset,
  } = usePDFViewer();

  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number>(0);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setContainerSize(offsetWidth, offsetHeight);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setContainerSize]);

  // Handle PDF document load
  const handleDocumentLoadSuccess = (pdf: { numPages: number }) => {
    setDocument(pdf); // Type handled in hook
    onLoadSuccess?.(pdf.numPages);
  };

  const handleDocumentLoadError = (error: Error) => {
    console.error('PDF loading error:', error);
    
    // Provide more specific error messages
    let userMessage = 'Failed to load PDF';
    if (error.message.includes('worker')) {
      userMessage = 'PDF worker loading failed. Please check your internet connection and try again.';
    } else if (error.message.includes('Invalid PDF')) {
      userMessage = 'Invalid or corrupted PDF file. Please try a different file.';
    } else if (error.message.includes('fetch')) {
      userMessage = 'Network error loading PDF. Please check your connection and try again.';
    } else {
      userMessage = `Failed to load PDF: ${error.message}`;
    }
    
    setError(userMessage);
    onLoadError?.(error);
  };

  // Handle page load to get dimensions
  const handlePageLoadSuccess = (page: { width: number }) => {
    setPageWidth(page.width);
    setLoading(false);
  };

  const handlePageLoadError = (error: Error) => {
    setError(`Failed to load page: ${error.message}`);
  };

  // Handle page number input
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value, 10);
    if (!isNaN(page)) {
      setCurrentPage(page);
    }
  };

  // Handle zoom select change
  const handleZoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const zoomValue = parseFloat(e.target.value);
    setZoomPreset(zoomValue as ZoomLevel);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // Don't interfere with input fields
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          goToNextPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPreviousPage, zoomIn, zoomOut, resetZoom]);

  if (!file) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-gray-500 text-lg">No PDF file selected</p>
          <p className="text-gray-400 text-sm mt-2">Upload a PDF to view it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        {/* Page Navigation */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPreviousPage}
            disabled={!canGoPrevious || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max={numPages}
              value={currentPage}
              onChange={handlePageInputChange}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-600">of {numPages}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextPage}
            disabled={!canGoNext || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={zoomOut}
            disabled={scale <= ZOOM_PRESETS[0] || isLoading}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <select
            value={currentZoomPreset}
            onChange={handleZoomChange}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
            disabled={isLoading}
          >
            {ZOOM_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {formatZoomLevel(preset)}
              </option>
            ))}
          </select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={zoomIn}
            disabled={scale >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1] || isLoading}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetZoom}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Display Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 p-4"
      >
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-4">
              <p className="text-red-600 text-lg font-medium mb-2">Error loading PDF</p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              {file && (
                <Button 
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Document
              file={file}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading PDF...</p>
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                onLoadSuccess={handlePageLoadSuccess}
                onLoadError={handlePageLoadError}
                loading={
                  <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                }
                className="shadow-lg"
              />
            </Document>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {numPages > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
          Page {currentPage} of {numPages} • {formatZoomLevel(scale)} zoom
          {pageWidth > 0 && ` • ${Math.round(pageWidth * scale)}px wide`}
        </div>
      )}
    </div>
  );
};