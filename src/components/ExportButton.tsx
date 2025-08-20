import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Search,
  HardDriveIcon,
  FolderIcon,
  X
} from 'lucide-react';
import { useGoogleExport } from '@/hooks/useGoogleExport';

interface ExportButtonProps {
  text: string;
  disabled?: boolean;
  className?: string;
}

interface FolderSelectionModalProps {
  isOpen: boolean;
  folders: Array<{ id: string; name: string }>;
  selectedFolderId: string | null;
  isLoading: boolean;
  onSelect: (folderId: string | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const FolderSelectionModal: React.FC<FolderSelectionModalProps> = ({
  isOpen,
  folders,
  selectedFolderId,
  isLoading,
  onSelect,
  onConfirm,
  onCancel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter folders based on search term
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // CUSTOM PORTAL-FREE MODAL - Works with React 19
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div 
        className="relative bg-white rounded-lg shadow-xl w-full max-w-[600px] max-h-[85vh] mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <HardDriveIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Choose Export Location</h2>
                <p className="text-sm text-gray-600">Select a folder in your Google Drive</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Folder List */}
        <div className="flex-1 px-6 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Root folder option */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  (selectedFolderId === null) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSelect(null)}
              >
                <div className="flex items-center gap-3">
                  <HardDriveIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">My Drive (Root)</p>
                    <p className="text-sm text-gray-500">Save to the root of your Google Drive</p>
                  </div>
                  {(selectedFolderId === null) && <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />}
                </div>
              </div>

              {/* Folder list */}
              {filteredFolders.map((folder) => (
                <div 
                  key={folder.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedFolderId === folder.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onSelect(folder.id)}
                >
                  <div className="flex items-center gap-3">
                    <FolderIcon className="h-5 w-5 text-blue-600" />
                    <p className="font-medium flex-1">{folder.name}</p>
                    {selectedFolderId === folder.id && <CheckCircle className="h-5 w-5 text-blue-500" />}
                  </div>
                </div>
              ))}

              {filteredFolders.length === 0 && searchTerm && (
                <div className="text-center py-8 text-gray-500">
                  <p>No folders found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              'Export to Google Docs'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ExportButton: React.FC<ExportButtonProps> = ({
  text,
  disabled = false,
  className = '',
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const googleExport = useGoogleExport();

  const handleExport = async () => {
    try {
      await googleExport.startExport(text);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    googleExport.reset();
  };

  const handleRetry = () => {
    googleExport.retry();
  };

  // Show success modal
  if (googleExport.state === 'success' && googleExport.exportResult && !showSuccess) {
    setShowSuccess(true);
  }

  // Get button content based on state
  const getButtonContent = () => {
    switch (googleExport.state) {
      case 'authenticating':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline ml-2">Signing in...</span>
          </>
        );
      case 'loading-folders':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline ml-2">Loading...</span>
          </>
        );
      case 'exporting':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline ml-2">Exporting...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="hidden sm:inline ml-2">Exported!</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="hidden sm:inline ml-2">Error</span>
          </>
        );
      default:
        return (
          <>
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Export</span>
          </>
        );
    }
  };

  const getButtonVariant = (): "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" => {
    if (googleExport.state === 'error') return 'outline';
    if (googleExport.state === 'success') return 'outline';
    return 'outline';
  };

  const getButtonClassName = () => {
    const baseClass = className;
    if (googleExport.state === 'success') {
      return `${baseClass} bg-green-50 border-green-200 hover:bg-green-100`;
    }
    if (googleExport.state === 'error') {
      return `${baseClass} bg-red-50 border-red-200 hover:bg-red-100`;
    }
    return baseClass;
  };

  return (
    <>
      <Button
        variant={getButtonVariant()}
        size="sm"
        onClick={handleExport}
        disabled={disabled || googleExport.isLoading || !text.trim()}
        className={getButtonClassName()}
        title={
          !text.trim() 
            ? 'No text to export' 
            : googleExport.state === 'success' 
              ? 'Export completed successfully' 
              : googleExport.state === 'error'
                ? `Export failed: ${googleExport.error}`
                : 'Export to Google Docs'
        }
      >
        {getButtonContent()}
      </Button>

      {/* Folder Selection Modal */}
      <FolderSelectionModal
        isOpen={googleExport.state === 'selecting-folder'}
        folders={googleExport.folders}
        selectedFolderId={googleExport.selectedFolderId}
        isLoading={googleExport.isLoading}
        onSelect={googleExport.selectFolder}
        onConfirm={googleExport.confirmFolderAndExport}
        onCancel={googleExport.reset}
      />

      {/* Success Modal */}
      {showSuccess && googleExport.exportResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Export Successful!
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Your document "{googleExport.exportResult.title}" has been exported to Google Docs.
              </p>

              <div className="flex space-x-3">
                <Button
                  onClick={() => window.open(googleExport.exportResult!.documentUrl, '_blank')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Open Document
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSuccessClose}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {googleExport.state === 'error' && googleExport.error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Export Failed
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {googleExport.error}
              </p>

              <div className="flex space-x-3">
                <Button
                  onClick={handleRetry}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={googleExport.reset}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};