export class OCRApiError extends Error {
  public type: 'validation' | 'network' | 'server' | 'processing' | 'timeout';
  public statusCode?: number;
  public retryable: boolean;

  constructor(
    message: string,
    type: 'validation' | 'network' | 'server' | 'processing' | 'timeout',
    statusCode?: number,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'OCRApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

export class OCRApi {
  private static readonly WEBHOOK_URL = 'https://primary-production-6654.up.railway.app/webhook/9d000de0-872a-4443-9c57-b339fc8ef60c';
  private static readonly TIMEOUT_MS = 600000; // 10 minutes
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  static async processFile(
    file: File,
    signal?: AbortSignal
  ): Promise<string> {
    // Client-side validation
    this.validateFile(file);

    // Create FormData for upload
    const formData = new FormData();
    formData.append('data', file);

    // Create abort controller for timeout
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), this.TIMEOUT_MS);

    // Combine user signal and timeout signal
    const combinedSignal = signal ? 
      this.combineAbortSignals([signal, timeoutController.signal]) : 
      timeoutController.signal;

    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        signal: combinedSignal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw this.createErrorFromResponse(response);
      }

      const text = await response.text();
      
      if (!text || text.trim().length === 0) {
        throw new OCRApiError(
          'Empty response from OCR service',
          'processing',
          response.status,
          true
        );
      }

      return text.trim();

    } catch (error) {
      clearTimeout(timeout);
      
      if (error instanceof OCRApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        if (signal?.aborted) {
          throw new OCRApiError('Upload cancelled by user', 'network', undefined, false);
        } else {
          throw new OCRApiError('Request timed out after 10 minutes', 'timeout', undefined, true);
        }
      }

      if (error instanceof TypeError) {
        throw new OCRApiError('Network error - please check your connection', 'network', undefined, true);
      }

      throw new OCRApiError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'processing',
        undefined,
        true
      );
    }
  }

  private static validateFile(file: File): void {
    if (!file) {
      throw new OCRApiError('No file provided', 'validation');
    }

    if (file.type !== 'application/pdf') {
      throw new OCRApiError('Only PDF files are supported', 'validation');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      throw new OCRApiError(
        `File size (${sizeMB}MB) exceeds maximum limit of 100MB`,
        'validation'
      );
    }

    if (file.size === 0) {
      throw new OCRApiError('File appears to be empty', 'validation');
    }
  }

  private static createErrorFromResponse(response: Response): OCRApiError {
    const statusCode = response.status;
    
    if (statusCode >= 400 && statusCode < 500) {
      return new OCRApiError(
        `Client error (${statusCode}): ${response.statusText}`,
        'validation',
        statusCode,
        false
      );
    }

    if (statusCode >= 500) {
      return new OCRApiError(
        `Server error (${statusCode}): ${response.statusText}`,
        'server',
        statusCode,
        true
      );
    }

    return new OCRApiError(
      `HTTP error (${statusCode}): ${response.statusText}`,
      'network',
      statusCode,
      true
    );
  }

  private static combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    
    return controller.signal;
  }
}

export const ocrApi = OCRApi;