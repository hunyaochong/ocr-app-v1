import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ComparisonView } from '@/components/ComparisonView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AuthCallbackPage } from '@/utils/authCallback';

function App() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [isAuthCallback, setIsAuthCallback] = useState(false);

  useEffect(() => {
    // Check if this is an auth callback URL
    const url = new URL(window.location.href);
    const hasAuthParams = url.searchParams.has('code') || url.searchParams.has('error');
    const isCallback = url.pathname.includes('/auth/callback') || hasAuthParams;
    
    // Debug logging
    if (hasAuthParams) {
      console.log('Auth callback detected:', {
        pathname: url.pathname,
        hasCode: url.searchParams.has('code'),
        hasError: url.searchParams.has('error'),
        fullUrl: url.href
      });
    }
    
    setIsAuthCallback(isCallback);
  }, []);

  const handleOCRComplete = (result: string, file: File) => {
    setExtractedText(result);
    setCurrentFile(file);
    setShowComparison(true);
    console.log('OCR processing completed:', result);
  };

  const handleBackToUpload = () => {
    setShowComparison(false);
    setCurrentFile(null);
    setExtractedText(null);
  };

  const handleCopyText = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
    }
  };

  // Handle auth callback
  if (isAuthCallback) {
    return <AuthCallbackPage />;
  }

  if (showComparison && currentFile && extractedText) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBackToUpload}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Upload New File
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">OCR Processing App</h1>
                  <p className="text-sm text-gray-600">
                    PDF and text comparison view
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Comparison View */}
          <main className="flex-1 overflow-hidden">
            <ComparisonView 
              file={currentFile}
              extractedText={extractedText}
              onCopyText={handleCopyText}
              className="h-full"
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">OCR Processing App</h1>
          <p className="text-xl text-gray-600">
            Extract text from PDF documents using advanced OCR technology
          </p>
        </header>

        <main>
          <FileUpload onComplete={handleOCRComplete} />
        </main>

        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Powered by Mistral AI OCR • Built with React + TypeScript</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
