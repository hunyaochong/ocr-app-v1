import { useState, useRef, useCallback } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export function FileUploadDialog({
  open,
  onOpenChange,
  onFileSelect,
  accept = 'application/pdf',
  maxSize = 100 * 1024 * 1024, // 100MB default
}: FileUploadDialogProps) {
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
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Attach</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div
            className={cn(
              "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
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

            <div className="flex flex-col items-center space-y-3">
              <div className={cn(
                "rounded-full p-3 transition-colors",
                isDragging ? "bg-primary/10" : "bg-gray-100"
              )}>
                {isDragging ? (
                  <FileUp className="h-8 w-8 text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-500" />
                )}
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Upload files</h3>
                <p className="text-sm text-gray-500">Drag and drop to upload</p>
              </div>

              <Button
                onClick={handleSelectFiles}
                variant="secondary"
                className="mt-2"
              >
                Select files
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* URL Attachment Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Attach URL
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Enter a publicly accessible URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleUrlAttach}
                variant="outline"
                disabled={!urlInput.trim()}
              >
                Attach
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}