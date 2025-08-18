import React, { useMemo, type ReactNode } from 'react';
import type { SearchState } from '@/hooks/useTextSearch';

export interface TextSegment {
  id: string;
  text: string;
  isHighlight: boolean;
  isCurrent: boolean;
  matchIndex?: number;
}

export interface UseTextHighlightingReturn {
  highlightedElements: ReactNode[];
  hasHighlights: boolean;
  highlightCount: number;
}

/**
 * Custom hook for text highlighting that creates proper React elements
 * instead of using dangerouslySetInnerHTML
 * @param text - The text to highlight
 * @param searchState - Current search state
 * @returns Highlighted React elements and metadata
 */
export function useTextHighlighting(
  text: string,
  searchState: SearchState
): UseTextHighlightingReturn {
  const highlightedElements = useMemo((): ReactNode[] => {
    // Return plain text if no search is active or results are undefined
    if (!searchState.isActive || !searchState.query.trim() || !searchState.results || searchState.results.length === 0) {
      return [text];
    }

    const segments: TextSegment[] = [];
    let lastIndex = 0;
    let segmentCounter = 0;

    // Sort results by index to process them in order
    const sortedResults = [...searchState.results].sort((a, b) => a.index - b.index);

    sortedResults.forEach((result, resultIndex) => {
      // Add text before the match
      if (result.index > lastIndex) {
        segments.push({
          id: `text-${segmentCounter++}`,
          text: text.slice(lastIndex, result.index),
          isHighlight: false,
          isCurrent: false,
        });
      }

      // Add the highlighted match
      const matchText = text.slice(result.index, result.index + result.length);
      const isCurrent = resultIndex === searchState.currentIndex;
      
      segments.push({
        id: `highlight-${segmentCounter++}`,
        text: matchText,
        isHighlight: true,
        isCurrent,
        matchIndex: resultIndex,
      });

      lastIndex = result.index + result.length;
    });

    // Add remaining text after the last match
    if (lastIndex < text.length) {
      segments.push({
        id: `text-${segmentCounter++}`,
        text: text.slice(lastIndex),
        isHighlight: false,
        isCurrent: false,
      });
    }

    // Convert segments to React elements
    return segments.map((segment) => {
      if (!segment.isHighlight) {
        return segment.text;
      }

      // Create highlight element with appropriate styling
      const className = segment.isCurrent
        ? 'bg-yellow-300 text-black font-medium'
        : 'bg-yellow-100 text-black';

      return React.createElement(
        'mark',
        {
          key: segment.id,
          className: className,
          'data-match-index': segment.matchIndex,
        },
        segment.text
      );
    });
  }, [text, searchState]);

  const hasHighlights = searchState.isActive && searchState.results && searchState.results.length > 0;
  const highlightCount = searchState.results ? searchState.results.length : 0;

  return {
    highlightedElements,
    hasHighlights,
    highlightCount,
  };
}