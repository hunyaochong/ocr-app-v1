export interface OCRResult {
  markdown: string;
  processingTime?: number;
  wordCount?: number;
}

export interface ProcessingState {
  isUploading: boolean;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export interface FileUploadState {
  file: File | null;
  isValidFile: boolean;
  error: string | null;
}

export interface PDFViewerState {
  numPages: number;
  currentPage: number;
  scale: number;
  isLoading: boolean;
  error: string | null;
}

export interface ComparisonViewState {
  leftPanelWidth: number;
  rightPanelWidth: number;
  syncScrolling: boolean;
}

export interface TextSearchResult {
  index: number;
  length: number;
  preview: string;
}

export interface AppState {
  currentFile: File | null;
  extractedText: string | null;
  showComparison: boolean;
  isProcessing: boolean;
}