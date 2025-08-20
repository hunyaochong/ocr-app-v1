// Browser-compatible Google API implementation

export interface GoogleDocsExportOptions {
  text: string;
  title?: string;
  folderId?: string;
}

export interface GoogleDocsExportResult {
  documentId: string;
  documentUrl: string;
  title: string;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export class GoogleDocsExportError extends Error {
  public type: 'auth' | 'network' | 'api' | 'permission' | 'rate_limit';
  public statusCode?: number;
  public retryable: boolean;

  constructor(
    message: string,
    type: 'auth' | 'network' | 'api' | 'permission' | 'rate_limit',
    statusCode?: number,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'GoogleDocsExportError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

class GoogleDocsService {
  private tokens: GoogleTokens | null = null;
  private readonly clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  private readonly clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
  private readonly redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  
  private readonly scopes = [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly'
  ];

  // Google OAuth endpoints
  private readonly OAUTH_ENDPOINTS = {
    auth: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
  };

  // Google API endpoints
  private readonly API_ENDPOINTS = {
    docs: 'https://docs.googleapis.com/v1',
    drive: 'https://www.googleapis.com/drive/v3',
  };

  constructor() {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new GoogleDocsExportError(
        'Missing Google OAuth configuration. Please check environment variables.',
        'auth',
        undefined,
        false
      );
    }
  }

  async authenticate(): Promise<string> {
    const state = this.generateState();
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    // Debug logging
    console.log('OAuth Configuration Debug:');
    console.log('Client ID:', this.clientId);
    console.log('Redirect URI:', this.redirectUri);
    console.log('Full Auth URL:', `${this.OAUTH_ENDPOINTS.auth}?${params.toString()}`);

    return `${this.OAUTH_ENDPOINTS.auth}?${params.toString()}`;
  }

  async handleAuthCallback(code: string): Promise<void> {
    try {
      const response = await fetch(this.OAUTH_ENDPOINTS.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new GoogleDocsExportError(
          'Failed to exchange authorization code for tokens',
          'auth',
          response.status,
          true
        );
      }

      const tokens: GoogleTokens = await response.json();
      this.tokens = tokens;

      // Verify the token by making a test API call
      await this.verifyAuthentication();
    } catch (error) {
      console.error('Auth callback error:', error);
      if (error instanceof GoogleDocsExportError) {
        throw error;
      }
      throw new GoogleDocsExportError(
        'Authentication failed. Please try again.',
        'auth',
        undefined,
        true
      );
    }
  }

  private async verifyAuthentication(): Promise<void> {
    if (!this.tokens?.access_token) {
      throw new GoogleDocsExportError('Not authenticated', 'auth', undefined, true);
    }

    try {
      const response = await fetch(`${this.API_ENDPOINTS.drive}/about?fields=user`, {
        headers: {
          'Authorization': `Bearer ${this.tokens.access_token}`,
        },
      });

      if (!response.ok) {
        throw new GoogleDocsExportError(
          'Authentication verification failed',
          'auth',
          response.status,
          true
        );
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      throw new GoogleDocsExportError(
        'Authentication verification failed',
        'auth',
        undefined,
        true
      );
    }
  }

  async getFolders(): Promise<GoogleDriveFolder[]> {
    if (!this.tokens?.access_token) {
      throw new GoogleDocsExportError('Not authenticated', 'auth', undefined, true);
    }

    try {
      const params = new URLSearchParams({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id,name)',
        orderBy: 'name',
        pageSize: '100',
      });

      const response = await fetch(`${this.API_ENDPOINTS.drive}/files?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.tokens.access_token}`,
        },
      });

      if (!response.ok) {
        throw this.handleApiError(response, 'Failed to fetch folders');
      }

      const data = await response.json();
      const folders = data.files || [];
      
      return folders.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
      }));
    } catch (error) {
      console.error('Error fetching folders:', error);
      if (error instanceof GoogleDocsExportError) {
        throw error;
      }
      throw this.handleApiError({ status: 500 } as Response, 'Failed to fetch folders');
    }
  }

  async exportToGoogleDocs(options: GoogleDocsExportOptions): Promise<GoogleDocsExportResult> {
    if (!this.tokens?.access_token) {
      throw new GoogleDocsExportError('Not authenticated', 'auth', undefined, true);
    }

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const title = options.title || `OCR Export - ${timestamp}`;

    try {
      // Create the document
      const createResponse = await fetch(`${this.API_ENDPOINTS.docs}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
        }),
      });

      if (!createResponse.ok) {
        throw this.handleApiError(createResponse, 'Failed to create Google Doc');
      }

      const createData = await createResponse.json();
      const documentId = createData.documentId;
      
      // Insert the text content
      await this.insertTextContent(documentId, options.text);

      // Move to specified folder if provided
      if (options.folderId) {
        await this.moveToFolder(documentId, options.folderId);
      }

      const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

      return {
        documentId,
        documentUrl,
        title,
      };
    } catch (error) {
      console.error('Export error:', error);
      if (error instanceof GoogleDocsExportError) {
        throw error;
      }
      throw this.handleApiError({ status: 500 } as Response, 'Failed to export to Google Docs');
    }
  }

  private async insertTextContent(documentId: string, text: string): Promise<void> {
    if (!this.tokens?.access_token) return;
    
    // Convert markdown-style formatting to plain text for now
    // TODO: Could be enhanced to use Google Docs rich text formatting
    const formattedText = this.convertMarkdownToPlainText(text);
    
    const response = await fetch(`${this.API_ENDPOINTS.docs}/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: formattedText,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw this.handleApiError(response, 'Failed to insert text content');
    }
  }

  private async moveToFolder(documentId: string, folderId: string): Promise<void> {
    if (!this.tokens?.access_token) return;

    try {
      const response = await fetch(`${this.API_ENDPOINTS.drive}/files/${documentId}?addParents=${folderId}&fields=id,parents`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.tokens.access_token}`,
        },
      });

      if (!response.ok) {
        console.error('Error moving to folder:', response.status, response.statusText);
        // Don't throw here as the document was created successfully
      }
    } catch (error) {
      console.error('Error moving to folder:', error);
      // Don't throw here as the document was created successfully
    }
  }

  private convertMarkdownToPlainText(text: string): string {
    return text
      .replace(/#{1,6}\s+/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/`(.*?)`/g, '$1') // Remove inline code formatting
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove markdown links, keep text
      .trim();
  }

  private handleApiError(response: Response, defaultMessage: string): GoogleDocsExportError {
    const status = response.status;
    
    if (status === 401) {
      return new GoogleDocsExportError('Authentication expired. Please sign in again.', 'auth', status, true);
    }
    
    if (status === 403) {
      return new GoogleDocsExportError('Permission denied. Please check your Google account permissions.', 'permission', status, false);
    }
    
    if (status === 429) {
      return new GoogleDocsExportError('Rate limit exceeded. Please try again in a few minutes.', 'rate_limit', status, true);
    }
    
    if (status >= 500) {
      return new GoogleDocsExportError('Google API server error. Please try again later.', 'api', status, true);
    }

    return new GoogleDocsExportError(defaultMessage, 'api', status, true);
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  isAuthenticated(): boolean {
    return this.tokens?.access_token != null;
  }

  async refreshTokenIfNeeded(): Promise<void> {
    if (!this.tokens?.refresh_token) return;

    try {
      const response = await fetch(this.OAUTH_ENDPOINTS.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new GoogleDocsExportError('Failed to refresh access token', 'auth', response.status, true);
      }

      const newTokens: Partial<GoogleTokens> = await response.json();
      this.tokens = { ...this.tokens, ...newTokens };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new GoogleDocsExportError('Session expired. Please sign in again.', 'auth', undefined, true);
    }
  }

  logout(): void {
    this.tokens = null;
  }
}

// Export singleton instance
export const googleDocsService = new GoogleDocsService();