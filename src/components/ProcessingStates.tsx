import type { ProcessingState, ProcessingStatus } from '@/hooks/useOCRProcessing';
import { getRetryButtonText, getErrorSuggestions, formatFileSize } from '@/utils/errorHandling';
import { Button } from '@/components/ui/button';

interface ProcessingStatesProps {
  state: ProcessingState;
  onRetry: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export function ProcessingStates({ state, onRetry, onCancel, onReset }: ProcessingStatesProps) {
  const renderUploadingState = () => (
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <div className="text-lg font-medium text-blue-600">Uploading PDF...</div>
        <div className="text-sm text-muted-foreground">
          {state.file ? `${formatFileSize(state.file.size)} • ${state.file.name}` : 'Preparing upload...'}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(state.progress, 20)}%` }}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {state.progress}% complete
      </div>

      {state.canCancel && (
        <Button variant="outline" onClick={onCancel} size="sm">
          Cancel Upload
        </Button>
      )}
    </div>
  );

  const renderProcessingState = () => (
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <div className="text-lg font-medium text-green-600">Processing with OCR...</div>
        <div className="text-sm text-muted-foreground">
          This may take 2-5 minutes for complex documents
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(20, state.progress)}%` }}
        />
      </div>

      <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent"></div>
        <span className="text-sm text-muted-foreground">
          Extracting text and analyzing document...
        </span>
      </div>

      {state.canCancel && (
        <Button variant="outline" onClick={onCancel} size="sm">
          Cancel Processing
        </Button>
      )}
    </div>
  );

  const renderCompletedState = () => (
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <div className="text-lg font-medium text-green-600">✅ Processing Complete!</div>
        <div className="text-sm text-muted-foreground">
          Your PDF has been successfully processed and text extracted.
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="bg-green-600 h-3 rounded-full w-full" />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">
          {state.result ? `${state.result.split('\n').length} lines extracted` : 'Text extracted'}
        </div>
        <Button onClick={onReset} size="sm">
          Process Another File
        </Button>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <div className="text-lg font-medium text-red-600">❌ Processing Failed</div>
        <div className="text-sm text-muted-foreground">
          {state.error?.message || 'An error occurred during processing'}
        </div>
      </div>

      {state.error && (
        <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
          <div className="text-sm font-medium text-red-800">What went wrong:</div>
          <div className="text-sm text-red-700">{state.error.message}</div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium text-red-800">Suggestions:</div>
            <ul className="text-sm text-red-700 space-y-1">
              {getErrorSuggestions(state.error).map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-center space-x-3">
        {state.canRetry && (
          <Button 
            onClick={onRetry} 
            disabled={state.retryState?.isRetrying}
            size="sm"
          >
            {state.retryState ? getRetryButtonText(state.retryState) : 'Retry'}
          </Button>
        )}
        <Button variant="outline" onClick={onReset} size="sm">
          Start Over
        </Button>
      </div>

      {state.retryState && state.retryState.nextRetryIn > 0 && (
        <div className="text-xs text-muted-foreground">
          Automatic retry in {Math.ceil(state.retryState.nextRetryIn / 1000)} seconds
        </div>
      )}
    </div>
  );

  const renderIdleState = () => (
    <div className="text-center space-y-2">
      <div className="text-lg font-medium text-muted-foreground">Ready to Process</div>
      <div className="text-sm text-muted-foreground">
        Select a PDF file to extract text using advanced OCR technology
      </div>
    </div>
  );

  const getStateContent = (status: ProcessingStatus) => {
    switch (status) {
      case 'uploading':
        return renderUploadingState();
      case 'processing':
        return renderProcessingState();
      case 'completed':
        return renderCompletedState();
      case 'error':
        return renderErrorState();
      case 'idle':
      default:
        return renderIdleState();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        {getStateContent(state.status)}
      </div>
    </div>
  );
}