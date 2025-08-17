import { useState, useCallback, useRef } from 'react';
import { OCRApiError, ocrApi } from '@/services/api';
import { retryManager, type RetryState, getErrorMessage } from '@/utils/errorHandling';

export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface ProcessingState {
  status: ProcessingStatus;
  progress: number;
  file: File | null;
  result: string | null;
  error: OCRApiError | null;
  retryState: RetryState | null;
  canCancel: boolean;
  canRetry: boolean;
}

export interface OCRProcessingOptions {
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: ProcessingStatus) => void;
  onError?: (error: OCRApiError) => void;
  onComplete?: (result: string) => void;
}

export function useOCRProcessing(options: OCRProcessingOptions = {}) {
  const [state, setState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    file: null,
    result: null,
    error: null,
    retryState: null,
    canCancel: false,
    canRetry: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateState = useCallback((updates: Partial<ProcessingState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // Notify status changes
      if (updates.status && updates.status !== prev.status) {
        options.onStatusChange?.(updates.status);
      }
      
      // Notify progress changes
      if (updates.progress !== undefined && updates.progress !== prev.progress) {
        options.onProgress?.(updates.progress);
      }
      
      return newState;
    });
  }, [options]);

  const processFile = useCallback(async (file: File) => {
    // Reset state for new processing
    updateState({
      status: 'uploading',
      progress: 0,
      file,
      result: null,
      error: null,
      retryState: null,
      canCancel: true,
      canRetry: false,
    });

    // Create abort controller for this operation
    abortControllerRef.current = new AbortController();

    try {
      // Simulate upload progress (since we can't track actual progress with n8n webhook)
      updateState({ progress: 10 });
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay for UX
      updateState({ status: 'processing', progress: 20 });

      const result = await retryManager.executeWithRetry(
        () => ocrApi.processFile(file, abortControllerRef.current?.signal),
        (attempt, error) => {
          updateState({
            error,
            retryState: retryManager.getRetryState(attempt + 1, error),
            progress: 20 + (attempt * 10), // Increment progress with retries
          });
        }
      );

      updateState({
        status: 'completed',
        progress: 100,
        result,
        error: null,
        retryState: null,
        canCancel: false,
        canRetry: false,
      });

      options.onComplete?.(result);

    } catch (error) {
      const ocrError = error instanceof OCRApiError ? error : 
        new OCRApiError('Unknown error occurred', 'processing', undefined, true);

      const retryState = retryManager.getRetryState(4, ocrError);

      updateState({
        status: 'error',
        error: ocrError,
        retryState,
        canCancel: false,
        canRetry: retryState.canRetry,
      });

      options.onError?.(ocrError);
    } finally {
      abortControllerRef.current = null;
    }
  }, [updateState, options]);

  const retry = useCallback(async () => {
    if (!state.file || !state.retryState?.canRetry) return;

    updateState({
      retryState: { ...state.retryState, isRetrying: true }
    });

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    const delay = state.retryState.nextRetryIn;
    
    if (delay > 0) {
      retryTimeoutRef.current = setTimeout(() => {
        processFile(state.file!);
      }, delay);
    } else {
      await processFile(state.file);
    }
  }, [state.file, state.retryState, processFile, updateState]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    updateState({
      status: 'idle',
      progress: 0,
      file: null,
      result: null,
      error: null,
      retryState: null,
      canCancel: false,
      canRetry: false,
    });
  }, [updateState]);

  const reset = useCallback(() => {
    cancel();
  }, [cancel]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  return {
    state,
    processFile,
    retry,
    cancel,
    reset,
    cleanup,
    
    // Computed values for convenience
    isProcessing: state.status === 'uploading' || state.status === 'processing',
    isComplete: state.status === 'completed',
    hasError: state.status === 'error',
    canRetry: state.retryState?.canRetry ?? false,
    errorMessage: state.error ? getErrorMessage(state.error) : null,
  };
}