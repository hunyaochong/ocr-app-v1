import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTextHighlighting } from '@/hooks/useTextHighlighting';
import type { SearchState } from '@/hooks/useTextSearch';

export interface TextDisplayProps {
  text: string;
  searchState: SearchState;
  className?: string;
}

/**
 * TextDisplay component renders text with optional search highlighting
 * @param text - The text to display
 * @param searchState - Current search state for highlighting
 * @param className - Additional CSS classes
 */
export function TextDisplay({ text, searchState, className = '' }: TextDisplayProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const { highlightedElements, hasHighlights } = useTextHighlighting(text, searchState);

  if (!text) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-gray-500 text-lg">No text available</p>
          <p className="text-gray-400 text-sm mt-2">Process a PDF to see extracted text here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-auto p-4 ${className}`}>
      <div 
        ref={textRef}
        className="prose prose-sm max-w-none"
      >
        {hasHighlights ? (
          <div className="whitespace-pre-wrap">
            {highlightedElements}
          </div>
        ) : (
          <ReactMarkdown 
            allowedElements={['p', 'br', 'strong', 'em', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote']}
            skipHtml
          >
            {text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}