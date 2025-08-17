import { OCRApiError } from '@/services/api';

export interface RetryConfig {
  maxAttempts: number;
  delays: number[]; // in milliseconds
  shouldRetry: (error: OCRApiError) => boolean;
}

export interface RetryState {
  attempt: number;
  nextRetryIn: number;
  canRetry: boolean;
  isRetrying: boolean;
}

export class RetryManager {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 4,
    delays: [0, 2000, 8000, 30000], // immediate, 2s, 8s, 30s
    shouldRetry: (error: OCRApiError) => error.retryable
  };

  private config: RetryConfig;

  constructor(config: RetryConfig = RetryManager.DEFAULT_CONFIG) {
    this.config = config;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: OCRApiError) => void
  ): Promise<T> {
    let lastError: OCRApiError;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof OCRApiError ? error : 
          new OCRApiError('Unknown error', 'processing', undefined, true);

        const isLastAttempt = attempt === this.config.maxAttempts;
        const shouldRetry = this.config.shouldRetry(lastError);

        if (isLastAttempt || !shouldRetry) {
          break;
        }

        onRetry?.(attempt, lastError);
        
        const delay = this.config.delays[attempt - 1] || this.config.delays[this.config.delays.length - 1];
        if (delay > 0) {
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  getRetryState(currentAttempt: number, lastError?: OCRApiError): RetryState {
    const canRetry = currentAttempt < this.config.maxAttempts && 
                    (!lastError || this.config.shouldRetry(lastError));
    
    const nextRetryIn = canRetry ? 
      this.config.delays[currentAttempt - 1] || this.config.delays[this.config.delays.length - 1] : 0;

    return {
      attempt: currentAttempt,
      nextRetryIn,
      canRetry,
      isRetrying: false
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const getErrorMessage = (error: OCRApiError): string => {
  switch (error.type) {
    case 'validation':
      return error.message;
    
    case 'network':
      return 'Network connection error. Please check your internet connection and try again.';
    
    case 'timeout':
      return 'Processing timed out. Large files may take longer to process. Please try again.';
    
    case 'server':
      return 'Server error occurred. Our team has been notified. Please try again in a few minutes.';
    
    case 'processing':
      return 'OCR processing failed. Please ensure your PDF is not corrupted and try again.';
    
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

export const getErrorSuggestions = (error: OCRApiError): string[] => {
  switch (error.type) {
    case 'validation':
      if (error.message.includes('PDF')) {
        return ['Please select a valid PDF file', 'Ensure the file is not corrupted'];
      }
      if (error.message.includes('size')) {
        return ['Reduce file size to under 100MB', 'Consider compressing the PDF'];
      }
      return ['Check your file format and size'];

    case 'network':
      return [
        'Check your internet connection',
        'Try again in a few moments',
        'Ensure you\'re not behind a restrictive firewall'
      ];

    case 'timeout':
      return [
        'Large files may take longer to process',
        'Try again - processing times can vary',
        'Consider breaking large documents into smaller files'
      ];

    case 'server':
      return [
        'Wait a few minutes and try again',
        'Check if the service is experiencing issues',
        'Contact support if the problem persists'
      ];

    case 'processing':
      return [
        'Ensure your PDF is not password-protected',
        'Try with a different PDF file',
        'Check if the PDF contains readable text or images'
      ];

    default:
      return ['Try again in a few moments', 'Contact support if the issue persists'];
  }
};

export const shouldShowRetryButton = (error: OCRApiError): boolean => {
  return error.retryable;
};

export const getRetryButtonText = (retryState: RetryState): string => {
  if (retryState.isRetrying) {
    return 'Retrying...';
  }
  
  if (retryState.nextRetryIn > 0) {
    const seconds = Math.ceil(retryState.nextRetryIn / 1000);
    return `Retry in ${seconds}s`;
  }
  
  return `Retry (${retryState.attempt}/${4})`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const retryManager = new RetryManager();