import { useState, useCallback, useEffect } from 'react';
import { 
  googleDocsService, 
  GoogleDocsExportError,
  type GoogleDocsExportResult, 
  type GoogleDriveFolder 
} from '../services/googleDocs';

export type ExportState = 
  | 'idle' 
  | 'authenticating' 
  | 'selecting-folder' 
  | 'loading-folders'
  | 'exporting' 
  | 'success' 
  | 'error';

export interface UseGoogleExportResult {
  // State
  state: ExportState;
  isLoading: boolean;
  error: string | null;
  exportResult: GoogleDocsExportResult | null;
  folders: GoogleDriveFolder[];
  selectedFolderId: string | null;
  
  // Actions
  startExport: (text: string) => Promise<void>;
  selectFolder: (folderId: string | null) => void;
  confirmFolderAndExport: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  
  // Auth actions
  authenticate: () => Promise<void>;
  logout: () => void;
  
  // Folder actions
  loadFolders: () => Promise<void>;
}

interface ExportContext {
  text: string;
  title?: string;
}

export function useGoogleExport(): UseGoogleExportResult {
  const [state, setState] = useState<ExportState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<GoogleDocsExportResult | null>(null);
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [exportContext, setExportContext] = useState<ExportContext | null>(null);
  const [authPopup, setAuthPopup] = useState<Window | null>(null);

  const isLoading = ['authenticating', 'loading-folders', 'exporting'].includes(state);

  // Handle auth popup message
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.code) {
        try {
          await googleDocsService.handleAuthCallback(event.data.code);
          setAuthPopup(null);
          
          // Continue with folder loading after successful auth
          if (exportContext) {
            setState('loading-folders');
            await loadFoldersInternal();
            setState('selecting-folder');
          } else {
            setState('idle');
          }
        } catch (err) {
          console.error('Auth callback error:', err);
          setError(err instanceof GoogleDocsExportError ? err.message : 'Authentication failed');
          setState('error');
        }
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setError('Authentication was cancelled or failed');
        setState('error');
        setAuthPopup(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [exportContext]);

  // Monitor auth popup
  useEffect(() => {
    if (!authPopup) return;

    const checkClosed = setInterval(() => {
      if (authPopup.closed) {
        setAuthPopup(null);
        if (state === 'authenticating') {
          setError('Authentication window was closed');
          setState('error');
        }
      }
    }, 1000);

    return () => clearInterval(checkClosed);
  }, [authPopup, state]);

  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    console.error('Export error:', err);
    if (err instanceof GoogleDocsExportError) {
      setError(err.message);
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError(defaultMessage);
    }
    setState('error');
  }, []);

  const loadFoldersInternal = useCallback(async () => {
    try {
      const folderList = await googleDocsService.getFolders();
      setFolders(folderList);
    } catch (err) {
      console.error('Error loading folders:', err);
      // Continue without folders - user can still export to root
      setFolders([]);
    }
  }, []);

  const authenticate = useCallback(async () => {
    try {
      setState('authenticating');
      setError(null);
      
      const authUrl = await googleDocsService.authenticate();
      
      const popup = window.open(
        authUrl,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('Failed to open authentication popup. Please allow popups for this site.');
      }
      
      setAuthPopup(popup);
    } catch (err) {
      handleError(err, 'Failed to start authentication');
    }
  }, [handleError]);

  const startExport = useCallback(async (text: string) => {
    setError(null);
    setExportResult(null);
    setExportContext({ text });
    
    try {
      // Check if already authenticated
      if (googleDocsService.isAuthenticated()) {
        // Try to refresh token if needed
        await googleDocsService.refreshTokenIfNeeded();
        setState('loading-folders');
        await loadFoldersInternal();
        setState('selecting-folder');
      } else {
        // Need to authenticate first
        await authenticate();
      }
    } catch (err) {
      if (err instanceof GoogleDocsExportError && err.type === 'auth') {
        // Auth error - start authentication flow
        await authenticate();
      } else {
        handleError(err, 'Failed to start export process');
      }
    }
  }, [authenticate, handleError, loadFoldersInternal]);

  const selectFolder = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId);
  }, []);

  const confirmFolderAndExport = useCallback(async () => {
    if (!exportContext) {
      setError('No export context available');
      setState('error');
      return;
    }

    try {
      setState('exporting');
      setError(null);

      const result = await googleDocsService.exportToGoogleDocs({
        text: exportContext.text,
        title: exportContext.title,
        folderId: selectedFolderId || undefined,
      });

      setExportResult(result);
      setState('success');
    } catch (err) {
      handleError(err, 'Failed to export to Google Docs');
    }
  }, [exportContext, selectedFolderId, handleError]);

  const retry = useCallback(async () => {
    if (!exportContext) return;
    
    if (state === 'error' && error?.includes('Authentication')) {
      // Auth error - restart authentication
      await authenticate();
    } else if (selectedFolderId !== undefined) {
      // Folder already selected - retry export
      await confirmFolderAndExport();
    } else {
      // Restart the whole process
      await startExport(exportContext.text);
    }
  }, [exportContext, state, error, selectedFolderId, authenticate, confirmFolderAndExport, startExport]);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setExportResult(null);
    setFolders([]);
    setSelectedFolderId(null);
    setExportContext(null);
    if (authPopup) {
      authPopup.close();
      setAuthPopup(null);
    }
  }, [authPopup]);

  const logout = useCallback(() => {
    googleDocsService.logout();
    reset();
  }, [reset]);

  const loadFolders = useCallback(async () => {
    if (!googleDocsService.isAuthenticated()) {
      setError('Not authenticated');
      return;
    }

    try {
      setState('loading-folders');
      setError(null);
      await loadFoldersInternal();
      setState('selecting-folder');
    } catch (err) {
      handleError(err, 'Failed to load folders');
    }
  }, [handleError, loadFoldersInternal]);

  return {
    // State
    state,
    isLoading,
    error,
    exportResult,
    folders,
    selectedFolderId,
    
    // Actions
    startExport,
    selectFolder,
    confirmFolderAndExport,
    retry,
    reset,
    
    // Auth actions
    authenticate,
    logout,
    
    // Folder actions
    loadFolders,
  };
}