import { pdfjs } from 'react-pdf';

// Configure PDF.js worker for Vite using manual worker import
// This is the recommended approach for Vite + react-pdf compatibility
// Based on research: https://github.com/wojtekmaj/react-pdf/issues/1377
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Alternative approaches (commented out):
// CDN approach (problematic with Vite):
// pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
// 
// Static asset approach:
// Copy pdf.worker.min.mjs to public/ folder and use:
// pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * PDF processing utilities for the OCR app
 */

export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
}

export interface PDFDocument {
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * Calculate optimal scale for PDF rendering based on container width
 */
export const calculateOptimalScale = (
  pageWidth: number, 
  containerWidth: number, 
  maxScale: number = 2.0
): number => {
  const scale = containerWidth / pageWidth;
  return Math.min(scale, maxScale);
};

/**
 * Get zoom preset values
 */
export const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0, 5.0] as const;

export type ZoomLevel = typeof ZOOM_PRESETS[number];

/**
 * Find the closest zoom preset to a given scale value
 */
export const findClosestZoomPreset = (scale: number): ZoomLevel => {
  return ZOOM_PRESETS.reduce((prev, curr) => 
    Math.abs(curr - scale) < Math.abs(prev - scale) ? curr : prev
  );
};

/**
 * Format zoom level for display (e.g., 1.5 -> "150%")
 */
export const formatZoomLevel = (zoom: number): string => {
  return `${Math.round(zoom * 100)}%`;
};

/**
 * Validate if a file is a valid PDF
 */
export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};