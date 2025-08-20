import { useState, useRef, useCallback } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

export function FileUploadArea({
  onFileSelect,
  accept = 'application/pdf',
  maxSize = 100 * 1024 * 1024, // 100MB default
  className,
}: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      setError(`Please upload a ${accept.replace('application/', '').toUpperCase()} file`);
      return false;
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      setError(`File size must be less than ${sizeMB}MB`);
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
      setError(null);
      setUrlInput('');
    }
  };

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  }, []);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  const handleUrlAttach = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Note: URL attachment would require backend support for fetching PDFs from URLs
    // For now, we'll just show an informative message
    setError('URL attachment is not yet supported. Please upload a file directly.');
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <div className="space-y-8">
        {/* Main Upload Section */}
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed p-16 text-center transition-colors",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-gray-300 hover:border-gray-400",
            error && "border-red-500"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-6">
            <div className={cn(
              "rounded-full p-6 transition-colors",
              isDragging ? "bg-primary/10" : "bg-gray-100"
            )}>
              {isDragging ? (
                <FileUp className="h-16 w-16 text-primary" />
              ) : (
                <Upload className="h-16 w-16 text-gray-500" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-gray-900">Upload PDF for OCR Processing</h3>
              <p className="text-lg text-gray-600">
                Select a PDF file (up to 100MB) to extract text using advanced OCR technology
              </p>
              <p className="text-base text-gray-500">
                Drag and drop your file here, or click below to browse
              </p>
            </div>

            <Button
              onClick={handleSelectFiles}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              Select PDF File
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* URL Attachment Section */}
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <label className="text-lg font-medium text-gray-700">
            Or attach from URL
          </label>
          <div className="flex gap-3">
            <Input
              type="url"
              placeholder="Enter a publicly accessible PDF URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 h-12 text-base"
            />
            <Button
              onClick={handleUrlAttach}
              variant="outline"
              size="lg"
              disabled={!urlInput.trim()}
              className="px-6"
            >
              Attach
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}