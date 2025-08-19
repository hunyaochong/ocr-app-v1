# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Guidance

* To save main context space, for code searches, inspections, troubleshooting or analysis, use code-searcher subagent where appropriate - giving the subagent full context background for the task(s) you assign it.
* After receiving tool results, carefully reflect on their quality and determine optimal next steps before proceeding. Use your thinking to plan and iterate based on this new information, and then take the best next action.
* For maximum efficiency, whenever you need to perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially.
* Before you finish, please verify your solution
* Ensure each stop point or new feature utilizes the quality control agent.
* Do what has been asked; nothing more, nothing less.
* NEVER create files unless they're absolutely necessary for achieving your goal.
* ALWAYS prefer editing an existing file to creating a new one.
* NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
* When you update or modify core context files, also update markdown documentation and memory bank
* When asked to commit changes, exclude CLAUDE.md and CLAUDE-*.md referenced memory bank system files from any commits. Never delete these files.

## Memory Bank System

This project uses a structured memory bank system with specialized context files. Always check these files for relevant information before starting work:

### Core Context Files

* **CLAUDE-activeContext.md** - Current session state, goals, and progress (if exists)
* **CLAUDE-patterns.md** - Established code patterns and conventions (if exists)
* **CLAUDE-decisions.md** - Architecture decisions and rationale (if exists)
* **CLAUDE-troubleshooting.md** - Common issues and proven solutions (if exists)
* **CLAUDE-config-variables.md** - Configuration variables reference (if exists)
* **CLAUDE-temp.md** - Temporary scratch pad (only read when referenced)

**Important:** Always reference the active context file first to understand what's currently being worked on and maintain session continuity.

### Memory Bank System Backups

When asked to backup Memory Bank System files, you will copy the core context files above and @.claude settings directory to directory @/path/to/backup-directory. If files already exist in the backup directory, you will overwrite them.

## Project Overview

OCR App v1 is a React-based web application that extracts text from PDF documents using advanced OCR technology. The application provides a side-by-side comparison view of the original PDF and extracted text.

### Technology Stack
- **Frontend**: React 19.1.1 + TypeScript + Vite
- **Styling**: Tailwind CSS 4.1.12
- **UI Components**: shadcn/ui with Radix UI primitives
- **PDF Handling**: react-pdf with PDF.js 5.3.93
- **File Upload**: FilePond with validation plugins
- **OCR Backend**: n8n webhook hosted on Railway (Mistral AI OCR)
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useCallback, useRef)
- **API Integration**: Custom OCR API service with retry logic
- **Text Processing**: Advanced search with debouncing, regex caching, and highlighting
- **Component Architecture**: Modular design with focused subcomponents

### Component Architecture
- **TextOutput**: Modular container component (refactored from 268 to ~50 lines)
  - **TextHeader**: Controls (search toggle, copy button) with user feedback
  - **TextSearch**: Search input with navigation and results display
  - **TextDisplay**: Text rendering with ReactMarkdown and highlight support
  - **TextStats**: Word count, character count, and reading time statistics
- **Custom Hooks**: useTextSearch, useTextHighlighting, useOCRProcessing, usePDFViewer
- **Performance Optimizations**: LRU regex caching, debounced operations, safe iteration patterns

### Key Features
- PDF file upload with validation (100MB max, PDF only)
- OCR text extraction via external API
- Split-pane comparison view (PDF vs extracted text)
- Resizable panels with collapse/expand functionality
- Progress tracking and error handling with retry mechanisms
- Text copying functionality
- Advanced text search with debounced input and regex pattern caching
- Real-time text highlighting with performance optimization
- Text statistics display (word count, character count, reading time)
- Modular component architecture for improved maintainability

### Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production (runs TypeScript check + Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Current Project Status
- **Bundle Size**: ~890KB total (JS: 857KB, CSS: 33KB) - optimization needed for Phase 4
- **Recent Updates**: PDF dead white space issue resolved (August 19, 2025)
- **Phase Status**: Phases 1-3 completed, Phase 4 (Google Docs export, scroll sync) planned
- **Architecture**: Fully modular with advanced text search and highlighting implemented