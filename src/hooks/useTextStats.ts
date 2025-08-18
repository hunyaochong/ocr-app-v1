import { useMemo } from 'react';

export interface TextStats {
  lines: number;
  words: number;
  characters: number;
  charactersNoSpaces: number;
  readingTime: number;
}

export interface UseTextStatsReturn {
  stats: TextStats;
  isEmpty: boolean;
}

/**
 * Custom hook for calculating text statistics
 * @param text - The text to analyze
 * @returns Text statistics and metadata
 */
export function useTextStats(text: string): UseTextStatsReturn {
  const stats = useMemo((): TextStats => {
    if (!text || !text.trim()) {
      return {
        lines: 0,
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        readingTime: 0,
      };
    }

    const lines = text.split('\n').length;
    const words = text.trim().split(/\s+/).length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    
    // Average reading speed: 200 words per minute
    const readingTime = Math.ceil(words / 200);
    
    return {
      lines,
      words,
      characters,
      charactersNoSpaces,
      readingTime,
    };
  }, [text]);

  const isEmpty = !text || !text.trim();

  return {
    stats,
    isEmpty,
  };
}