import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

export interface SearchResult {
  index: number;
  length: number;
  preview: string;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  currentIndex: number;
  isActive: boolean;
  isSearching: boolean;
}

export interface UseTextSearchReturn {
  searchState: SearchState;
  performSearch: (query: string) => void;
  navigateToNext: () => void;
  navigateToPrev: () => void;
  clearSearch: () => void;
  toggleSearch: () => void;
  setSearchQuery: (query: string) => void;
}

/**
 * Custom hook for text search functionality with debouncing and performance optimization
 * @param text - The text to search within
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns Search state and control functions
 */
export function useTextSearch(text: string, debounceMs: number = 300): UseTextSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const regexCacheRef = useRef<Map<string, { regex: RegExp; lastUsed: number }>>(new Map());

  // LRU cache cleanup function
  const cleanupRegexCache = useCallback(() => {
    const cache = regexCacheRef.current;
    const maxCacheSize = 50;
    
    if (cache.size <= maxCacheSize) return;
    
    // Convert to array and sort by lastUsed (oldest first)
    const entries = Array.from(cache.entries()).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    // Remove oldest entries until we're under the limit
    const entriesToRemove = entries.slice(0, cache.size - maxCacheSize + 10); // Remove extra to avoid frequent cleanup
    entriesToRemove.forEach(([key]) => cache.delete(key));
  }, []);

  // Memoized regex compilation with LRU caching
  const getCompiledRegex = useCallback((query: string): RegExp | null => {
    if (!query.trim()) return null;
    
    const now = Date.now();
    
    // Check cache first
    if (regexCacheRef.current.has(query)) {
      const cached = regexCacheRef.current.get(query)!;
      // Update last used timestamp
      cached.lastUsed = now;
      return cached.regex;
    }
    
    try {
      // Escape special regex characters
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'gi');
      
      // Cache the compiled regex with timestamp
      regexCacheRef.current.set(query, { regex, lastUsed: now });
      
      // Clean up cache if it's getting too large
      cleanupRegexCache();
      
      return regex;
    } catch (error) {
      console.warn('Invalid regex pattern:', query, error);
      return null;
    }
  }, [cleanupRegexCache]);

  // Core search function
  const executeSearch = useCallback((query: string) => {
    if (!query.trim() || !text) {
      setSearchResults([]);
      setCurrentIndex(-1);
      return;
    }

    const regex = getCompiledRegex(query);
    if (!regex) {
      setSearchResults([]);
      setCurrentIndex(-1);
      return;
    }

    const results: SearchResult[] = [];
    let match;
    let lastIndex = -1;
    let iterationCount = 0;
    const maxIterations = 10000; // Prevent infinite loops
    
    // Reset regex lastIndex to ensure proper matching
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null && iterationCount < maxIterations) {
      iterationCount++;
      
      // Prevent infinite loop for zero-length matches or stuck positions
      if (match[0].length === 0 || match.index === lastIndex) {
        regex.lastIndex = match.index + 1;
        if (regex.lastIndex >= text.length) break;
        continue;
      }
      
      lastIndex = match.index;
      
      const start = Math.max(0, match.index - 20);
      const end = Math.min(text.length, match.index + match[0].length + 20);
      const preview = text.slice(start, end);
      
      results.push({
        index: match.index,
        length: match[0].length,
        preview: preview,
      });
    }
    
    // Log warning if we hit the iteration limit
    if (iterationCount >= maxIterations) {
      console.warn('Search regex hit iteration limit, truncating results to prevent infinite loop');
    }

    setSearchResults(results);
    setCurrentIndex(results.length > 0 ? 0 : -1);
  }, [text, getCompiledRegex]);

  // Debounced search function
  const performSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      executeSearch(query);
    }, debounceMs);
  }, [executeSearch, debounceMs]);

  // Navigation functions
  const navigateToNext = useCallback(() => {
    if (searchResults && searchResults.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % searchResults.length);
    }
  }, [searchResults]);

  const navigateToPrev = useCallback(() => {
    if (searchResults && searchResults.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }
  }, [searchResults]);

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentIndex(-1);
    setIsSearching(false);
    
    // Clear any pending debounced search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  // Toggle search function
  const toggleSearch = useCallback(() => {
    if (isSearching) {
      clearSearch();
    } else {
      setIsSearching(true);
    }
  }, [isSearching, clearSearch]);

  // Search state object
  const searchState = useMemo((): SearchState => ({
    query: searchQuery,
    results: searchResults || [],
    currentIndex,
    isActive: searchResults ? searchResults.length > 0 : false,
    isSearching,
  }), [searchQuery, searchResults, currentIndex, isSearching]);

  // Cleanup on unmount
  useEffect(() => {
    const debounceTimeout = debounceTimeoutRef.current;
    const regexCache = regexCacheRef.current;
    
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      // Clear regex cache to prevent memory leaks
      regexCache.clear();
    };
  }, []);

  return {
    searchState,
    performSearch,
    navigateToNext,
    navigateToPrev,
    clearSearch,
    toggleSearch,
    setSearchQuery,
  };
}