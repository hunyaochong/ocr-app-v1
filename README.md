# OCR App v1

A React + TypeScript application for processing PDF files with OCR (Optical Character Recognition) capabilities.

## Features

- PDF file upload with drag-and-drop interface
- OCR processing with progress tracking
- Clean, modern UI built with Tailwind CSS and shadcn/ui
- Error handling and retry mechanisms
- File validation (PDF only, max 100MB)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure MCP servers (optional):
   ```bash
   cp .mcp.json.example .mcp.json
   # Edit .mcp.json with your actual API keys
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration

The application uses MCP (Model Context Protocol) servers for additional functionality. Copy `.mcp.json.example` to `.mcp.json` and replace the placeholder values with your actual API keys:

- `YOUR_SUPABASE_ACCESS_TOKEN`: Supabase project access token
- `YOUR_GITHUB_API_KEY`: GitHub personal access token
- `YOUR_FIGMA_API_KEY`: Figma personal access token
- `YOUR_N8N_API_URL`: N8N API endpoint URL
- `YOUR_N8N_API_KEY`: N8N API key

## Security

⚠️ **Important**: Never commit `.mcp.json` or any files containing API keys to version control. These files are already included in `.gitignore`.

## Technologies Used

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Lucide React icons

## API Integration

The app integrates with a Railway-hosted OCR service for PDF text extraction. The service endpoint is configured in `src/services/api.ts`.