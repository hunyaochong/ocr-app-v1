import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';

function App() {
  const [extractedText, setExtractedText] = useState<string | null>(null);

  const handleOCRComplete = (result: string) => {
    setExtractedText(result);
    console.log('OCR processing completed:', result);
  };

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
          
          {extractedText && (
            <div className="w-full max-w-4xl mx-auto mt-8 p-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Extracted Text</h2>
                  <button 
                    onClick={() => navigator.clipboard.writeText(extractedText)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                </div>
                <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                    {extractedText}
                  </pre>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  {extractedText.split('\n').length} lines • {extractedText.length} characters
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Powered by Mistral AI OCR • Built with React + TypeScript</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
