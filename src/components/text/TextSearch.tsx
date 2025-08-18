import { useRef, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import type { UseTextSearchReturn } from '@/hooks/useTextSearch';

export interface TextSearchProps {
  searchHook: UseTextSearchReturn;
  isVisible: boolean;
  onClose?: () => void;
}

/**
 * TextSearch component provides search input and navigation controls
 * @param searchHook - The text search hook instance
 * @param isVisible - Whether the search bar is visible
 * @param onClose - Optional callback when search is closed
 */
export function TextSearch({ searchHook, isVisible, onClose }: TextSearchProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { searchState, performSearch, navigateToNext, navigateToPrev, clearSearch, setSearchQuery } = searchHook;

  // Auto-focus search input when it becomes visible
  useLayoutEffect(() => {
    if (isVisible && searchInputRef.current) {
      // Use a microtask to ensure DOM is ready
      Promise.resolve().then(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isVisible]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  const handleClear = () => {
    clearSearch();
    onClose?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="p-4 border-b border-gray-200 bg-blue-50">
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchState.query}
            onChange={handleInputChange}
            placeholder="Search in text..."
            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search text"
          />
          {searchState.query && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {searchState.results.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600" aria-live="polite">
              {searchState.currentIndex + 1} of {searchState.results.length}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateToPrev}
              disabled={searchState.results.length === 0}
              aria-label="Previous result"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateToNext}
              disabled={searchState.results.length === 0}
              aria-label="Next result"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {searchState.query && searchState.results.length === 0 && (
        <p className="text-sm text-gray-500 mt-2" role="status">
          No matches found
        </p>
      )}
    </div>
  );
}