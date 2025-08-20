import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useOCRProcessing } from '@/hooks/useOCRProcessing';
import { ProcessingStates } from '@/components/ProcessingStates';
import { FileUploadArea } from '@/components/FileUploadArea';
import { FileText } from 'lucide-react';

interface FileUploadProps {
  onComplete?: (result: string, file: File) => void;
}

export function FileUpload({ onComplete }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleReset = () => {
    setSelectedFile(null);
  };
  
  const ocrProcessing = useOCRProcessing({
    onComplete: (result) => {
      if (selectedFile) {
        onComplete?.(result, selectedFile);
      }
    },
    onStatusChange: (status) => {
      console.log('OCR processing status:', status);
    },
    onReset: handleReset,
  });

  const { state, processFile, retry, cancel, reset } = ocrProcessing;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleProcessStart = async () => {
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (state.status !== 'idle') {
      reset();
    }
  };

  // Auto-start processing when file is selected and we're in idle state
  useEffect(() => {
    if (selectedFile && state.status === 'idle') {
      processFile(selectedFile);
    }
  }, [selectedFile, state.status, processFile]);

  // Show processing states if we have a file and it's being processed
  if (selectedFile && state.status !== 'idle') {
    return (
      <div className="space-y-6">
        <ProcessingStates
          state={state}
          onRetry={retry}
          onCancel={cancel}
          onReset={reset}
        />
        
        {state.status === 'completed' && state.result && (
          <div className="w-full max-w-4xl mx-auto p-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Extracted Text Preview</h3>
              <div className="bg-white border rounded p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800">
                  {state.result.substring(0, 1000)}{state.result.length > 1000 ? '...' : ''}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      {!selectedFile ? (
        <FileUploadArea
          onFileSelect={handleFileSelect}
          accept="application/pdf"
          maxSize={100 * 1024 * 1024} // 100MB
        />
      ) : (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileText className="h-10 w-10 text-blue-500" />
                <div>
                  <p className="text-lg font-semibold">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRemoveFile}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          </div>

          <div className="text-center">
            <Button 
              onClick={handleProcessStart}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              Start OCR Processing
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}