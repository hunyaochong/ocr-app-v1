import React from 'react';

/**
 * OAuth callback handler for Google authentication
 * Handles the redirect from Google OAuth and communicates back to parent window
 */

export interface AuthCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export class AuthCallbackHandler {
  static init(): void {
    // Check if this is an auth callback page
    if (this.isAuthCallback()) {
      this.handleAuthCallback();
    }
  }

  private static isAuthCallback(): boolean {
    const url = new URL(window.location.href);
    return url.pathname.includes('/auth/callback') || url.searchParams.has('code') || url.searchParams.has('error');
  }

  private static handleAuthCallback(): void {
    const params = this.parseAuthParams();
    
    try {
      if (params.error) {
        this.sendMessageToParent({
          type: 'GOOGLE_AUTH_ERROR',
          error: params.error,
          errorDescription: params.error_description || 'Authentication failed',
        });
      } else if (params.code) {
        this.sendMessageToParent({
          type: 'GOOGLE_AUTH_SUCCESS',
          code: params.code,
          state: params.state,
        });
      } else {
        this.sendMessageToParent({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'missing_code',
          errorDescription: 'Authorization code not received',
        });
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      this.sendMessageToParent({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'callback_error',
        errorDescription: 'Failed to process authentication callback',
      });
    }

    // Close the popup window after a short delay
    setTimeout(() => {
      if (window.opener) {
        window.close();
      }
    }, 1000);
  }

  private static parseAuthParams(): AuthCallbackParams {
    const url = new URL(window.location.href);
    const params: AuthCallbackParams = {};

    // Check URL parameters
    params.code = url.searchParams.get('code') || undefined;
    params.state = url.searchParams.get('state') || undefined;
    params.error = url.searchParams.get('error') || undefined;
    params.error_description = url.searchParams.get('error_description') || undefined;

    // Also check hash parameters (in case of fragment-based flow)
    if (url.hash) {
      const hashParams = new URLSearchParams(url.hash.substring(1));
      params.code = params.code || hashParams.get('code') || undefined;
      params.state = params.state || hashParams.get('state') || undefined;
      params.error = params.error || hashParams.get('error') || undefined;
      params.error_description = params.error_description || hashParams.get('error_description') || undefined;
    }

    return params;
  }

  private static sendMessageToParent(message: any): void {
    if (window.opener && !window.opener.closed) {
      // Send to parent window (popup scenario)
      window.opener.postMessage(message, window.location.origin);
    } else if (window.parent && window.parent !== window) {
      // Send to parent frame (iframe scenario)
      window.parent.postMessage(message, window.location.origin);
    } else {
      console.warn('No parent window or opener found to send auth message to');
    }
  }
}

/**
 * Component to render in the auth callback route
 * Shows a simple loading message while processing the callback
 */
export const AuthCallbackPage: React.FC = () => {
  React.useEffect(() => {
    AuthCallbackHandler.init();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing Authentication...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your Google authentication.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          This window will close automatically.
        </p>
      </div>
    </div>
  );
};

// Auto-initialize when this module is loaded
if (typeof window !== 'undefined') {
  AuthCallbackHandler.init();
}