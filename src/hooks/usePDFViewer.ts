import { useState, useCallback, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ZoomLevel } from '@/utils/pdfUtils';
import { ZOOM_PRESETS, findClosestZoomPreset } from '@/utils/pdfUtils';

export interface PDFViewerState {
  document: PDFDocumentProxy | null;
  numPages: number;
  currentPage: number;
  scale: number;
  isLoading: boolean;
  error: string | null;
  containerWidth: number;
  containerHeight: number;
}

export interface PDFViewerActions {
  setDocument: (document: PDFDocumentProxy | null | Record<string, unknown>) => void;
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoomPreset: (preset: ZoomLevel) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setContainerSize: (width: number, height: number) => void;
  reset: () => void;
}

export const usePDFViewer = () => {
  const [state, setState] = useState<PDFViewerState>({
    document: null,
    numPages: 0,
    currentPage: 1,
    scale: 1.0,
    isLoading: false,
    error: null,
    containerWidth: 800,
    containerHeight: 600,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const setDocument = useCallback((document: PDFDocumentProxy | null | Record<string, unknown>) => {
    const numPages = document && 'numPages' in document ? (document.numPages as number) : 0;
    setState(prev => ({
      ...prev,
      document: document as PDFDocumentProxy | null,
      numPages,
      currentPage: 1,
      error: null,
      isLoading: false,
    }));
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => {
      const newPage = Math.max(1, Math.min(page, prev.numPages));
      return { ...prev, currentPage: newPage };
    });
  }, []);

  const goToNextPage = useCallback(() => {
    setState(prev => {
      if (prev.currentPage < prev.numPages) {
        return { ...prev, currentPage: prev.currentPage + 1 };
      }
      return prev;
    });
  }, []);

  const goToPreviousPage = useCallback(() => {
    setState(prev => {
      if (prev.currentPage > 1) {
        return { ...prev, currentPage: prev.currentPage - 1 };
      }
      return prev;
    });
  }, []);

  const setScale = useCallback((scale: number) => {
    const clampedScale = Math.max(0.1, Math.min(scale, 5.0));
    setState(prev => ({ ...prev, scale: clampedScale }));
  }, []);

  const zoomIn = useCallback(() => {
    setState(prev => {
      const currentScale = prev.scale;
      const currentIndex = ZOOM_PRESETS.findIndex(preset => preset >= currentScale);
      const nextIndex = currentIndex === -1 ? ZOOM_PRESETS.length - 1 : Math.min(currentIndex + 1, ZOOM_PRESETS.length - 1);
      return { ...prev, scale: ZOOM_PRESETS[nextIndex] };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setState(prev => {
      const currentScale = prev.scale;
      const currentIndex = ZOOM_PRESETS.findIndex(preset => preset > currentScale);
      const prevIndex = currentIndex === -1 ? 0 : Math.max(currentIndex - 2, 0);
      return { ...prev, scale: ZOOM_PRESETS[prevIndex] };
    });
  }, []);

  const resetZoom = useCallback(() => {
    setState(prev => ({ ...prev, scale: 1.0 }));
  }, []);

  const setZoomPreset = useCallback((preset: ZoomLevel) => {
    setState(prev => ({ ...prev, scale: preset }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setContainerSize = useCallback((width: number, height: number) => {
    setState(prev => ({ ...prev, containerWidth: width, containerHeight: height }));
  }, []);

  const reset = useCallback(() => {
    setState({
      document: null,
      numPages: 0,
      currentPage: 1,
      scale: 1.0,
      isLoading: false,
      error: null,
      containerWidth: 800,
      containerHeight: 600,
    });
  }, []);

  const actions: PDFViewerActions = {
    setDocument,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    setScale,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomPreset,
    setLoading,
    setError,
    setContainerSize,
    reset,
  };

  return {
    ...state,
    ...actions,
    canGoNext: state.currentPage < state.numPages,
    canGoPrevious: state.currentPage > 1,
    currentZoomPreset: findClosestZoomPreset(state.scale),
  };
};