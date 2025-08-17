import { useState, useEffect, useRef } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import { Button } from '@/components/ui/button';
import { useOCRProcessing } from '@/hooks/useOCRProcessing';
import { ProcessingStates } from '@/components/ProcessingStates';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';

// Register FilePond plugins
registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

interface FileUploadProps {
  onComplete?: (result: string) => void;
}

export function FileUpload({ onComplete }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const filePondRef = useRef<FilePond>(null);
  
  const handleReset = () => {
    setSelectedFile(null);
    if (filePondRef.current) {
      filePondRef.current.removeFiles();
    }
  };
  
  const ocrProcessing = useOCRProcessing({
    onComplete: (result) => {
      onComplete?.(result);
    },
    onStatusChange: (status) => {
      console.log('OCR processing status:', status);
    },
    onReset: handleReset,
  });

  const { state, processFile, retry, cancel, reset } = ocrProcessing;

  const handleFileAdd = (fileItems: unknown[]) => {
    if (fileItems.length > 0) {
      const fileItem = fileItems[0] as { file: File };
      setSelectedFile(fileItem.file);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    if (state.status !== 'idle') {
      reset();
    }
  };

  const handleProcessStart = async () => {
    if (selectedFile) {
      await processFile(selectedFile);
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
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Upload PDF for OCR Processing</h2>
          <p className="text-muted-foreground">
            Select a PDF file (up to 100MB) to extract text using advanced OCR technology.
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <FilePond
            ref={filePondRef}
            allowMultiple={false}
            acceptedFileTypes={['application/pdf']}
            maxFileSize="100MB"
            labelIdle='Drag & Drop your PDF or <span class="filepond--label-action">Browse</span>'
            onupdatefiles={handleFileAdd}
            onremovefile={handleFileRemove}
            dropOnPage={true}
            dropValidation={true}
            className="mb-4"
          />
        </div>

        {selectedFile && (
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-4">
              Ready to process: {selectedFile.name}
            </div>
            <Button 
              onClick={handleProcessStart}
              size="lg"
              className="w-full sm:w-auto"
            >
              Start OCR Processing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}