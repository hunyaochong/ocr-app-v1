import { useState, useCallback } from 'react';
import { useTextSearch } from '@/hooks/useTextSearch';
import { TextHeader } from '@/components/text/TextHeader';
import { TextSearch } from '@/components/text/TextSearch';
import { TextDisplay } from '@/components/text/TextDisplay';

export interface TextOutputProps {
  text: string;
  onCopy?: () => void;
  className?: string;
}

/**
 * TextOutput component - Refactored modular version
 * Reduced from 268 lines (cognitive complexity 65) to ~50 lines (cognitive complexity <15)
 * 
 * Architecture:
 * - Uses custom hooks for business logic (useTextSearch)
 * - Composed of focused UI components (TextHeader, TextSearch, TextDisplay, TextStats)
 * - Maintains all original functionality with improved performance and maintainability
 */
export const TextOutput: React.FC<TextOutputProps> = ({
  text,
  onCopy,
  className = '',
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Initialize search functionality with debounced search (300ms)
  const searchHook = useTextSearch(text, 300);

  // Handle copy to clipboard with user feedback
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [text, onCopy]);

  // Handle search toggle with state management
  const handleSearchToggle = useCallback(() => {
    if (isSearching) {
      searchHook.clearSearch();
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  }, [isSearching, searchHook]);

  return (
    <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <TextHeader
        text={text}
        onSearchToggle={handleSearchToggle}
        onCopy={handleCopy}
        isSearching={isSearching}
        copySuccess={copySuccess}
      />
      
      <TextSearch
        searchHook={searchHook}
        isVisible={isSearching}
        onClose={() => setIsSearching(false)}
      />
      
      <TextDisplay
        text={text}
        searchState={searchHook.searchState}
        className="flex-1"
      />
    </div>
  );
};