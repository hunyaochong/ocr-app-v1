import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFViewer } from './PDFViewer';
import { TextOutput } from './TextOutput';
import { Button } from './ui/button';
import { PanelLeftClose, PanelRightClose, Maximize2, Minimize2 } from 'lucide-react';

export interface ComparisonViewProps {
  file: File | null;
  extractedText: string;
  onCopyText?: () => void;
  className?: string;
}

interface PanelSizes {
  leftWidth: number;
  rightWidth: number;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  file,
  extractedText,
  onCopyText,
  className = '',
}) => {
  const [panelSizes, setPanelSizes] = useState<PanelSizes>({
    leftWidth: 50,
    rightWidth: 50,
  });
  const [isResizing, setIsResizing] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  
  // Handle panel resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // Calculate new percentages
    const leftPercentage = Math.max(20, Math.min(80, (mouseX / containerWidth) * 100));
    const rightPercentage = 100 - leftPercentage;
    
    setPanelSizes({
      leftWidth: leftPercentage,
      rightWidth: rightPercentage,
    });
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Panel toggle functions
  const toggleLeftPanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
    if (leftPanelCollapsed) {
      // Restore from collapsed state
      setPanelSizes({ leftWidth: 50, rightWidth: 50 });
    }
  };

  const toggleRightPanel = () => {
    setRightPanelCollapsed(!rightPanelCollapsed);
    if (rightPanelCollapsed) {
      // Restore from collapsed state
      setPanelSizes({ leftWidth: 50, rightWidth: 50 });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Reset panels to 50/50
  const resetPanels = () => {
    setPanelSizes({ leftWidth: 50, rightWidth: 50 });
    setLeftPanelCollapsed(false);
    setRightPanelCollapsed(false);
  };

  // Calculate actual panel widths based on collapsed state
  const getActualPanelSizes = () => {
    if (leftPanelCollapsed && rightPanelCollapsed) {
      return { leftWidth: 50, rightWidth: 50 };
    } else if (leftPanelCollapsed) {
      return { leftWidth: 0, rightWidth: 100 };
    } else if (rightPanelCollapsed) {
      return { leftWidth: 100, rightWidth: 0 };
    }
    return panelSizes;
  };

  const actualSizes = getActualPanelSizes();
  const showResizer = !leftPanelCollapsed && !rightPanelCollapsed;

  return (
    <div className={`h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-900">
            PDF & Text Comparison
          </h2>
          {file && (
            <span className="text-sm text-gray-500">
              • {file.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleLeftPanel}
            className={leftPanelCollapsed ? 'bg-blue-50 border-blue-200' : ''}
          >
            <PanelLeftClose className="h-4 w-4" />
            PDF
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleRightPanel}
            className={rightPanelCollapsed ? 'bg-blue-50 border-blue-200' : ''}
          >
            <PanelRightClose className="h-4 w-4" />
            Text
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetPanels}
            disabled={panelSizes.leftWidth === 50 && panelSizes.rightWidth === 50 && !leftPanelCollapsed && !rightPanelCollapsed}
          >
            Reset
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        ref={containerRef}
        className="flex h-full overflow-hidden"
        style={{ height: isFullscreen ? 'calc(100vh - 73px)' : 'calc(100% - 73px)' }}
      >
        {/* Left Panel - PDF Viewer */}
        {actualSizes.leftWidth > 0 && (
          <div 
            className="relative border-r border-gray-200"
            style={{ width: `${actualSizes.leftWidth}%` }}
          >
            <PDFViewer 
              file={file}
              className="h-full"
              onLoadSuccess={(numPages) => {
                console.log(`PDF loaded with ${numPages} pages`);
              }}
              onLoadError={(error) => {
                console.error('PDF load error:', error);
              }}
            />
          </div>
        )}

        {/* Resizer */}
        {showResizer && (
          <div
            ref={resizerRef}
            className={`w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors ${
              isResizing ? 'bg-blue-400' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-0.5 h-8 bg-gray-400 rounded"></div>
            </div>
          </div>
        )}

        {/* Right Panel - Text Output */}
        {actualSizes.rightWidth > 0 && (
          <div 
            className="relative"
            style={{ width: `${actualSizes.rightWidth}%` }}
          >
            <TextOutput 
              text={extractedText}
              onCopy={onCopyText}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Mobile View Message */}
      <div className="md:hidden block p-4 bg-yellow-50 border-t border-yellow-200">
        <p className="text-sm text-yellow-800">
          💡 For the best experience, view this on a larger screen. On mobile, use the panel toggle buttons above to switch between PDF and text views.
        </p>
      </div>
    </div>
  );
};