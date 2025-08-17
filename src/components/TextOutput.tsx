import { useState, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Copy, Search, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface TextOutputProps {
  text: string;
  onCopy?: () => void;
  className?: string;
}

interface SearchResult {
  index: number;
  length: number;
  preview: string;
}

export const TextOutput: React.FC<TextOutputProps> = ({
  text,
  onCopy,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const textRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Text statistics
  const stats = useMemo(() => {
    const lines = text.split('\n').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const readingTime = Math.ceil(words / 200); // Average 200 words per minute
    
    return { lines, words, characters, charactersNoSpaces, readingTime };
  }, [text]);

  // Search functionality
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const results: SearchResult[] = [];
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(text.length, match.index + match[0].length + 20);
      const preview = text.slice(start, end);
      
      results.push({
        index: match.index,
        length: match[0].length,
        preview: preview,
      });
    }

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  }, [text]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  const goToNextResult = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    }
  };

  const goToPrevResult = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    setIsSearching(false);
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      clearSearch();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  // Highlight search results in text
  const highlightedText = useMemo(() => {
    if (!searchQuery.trim() || searchResults.length === 0) {
      return text;
    }

    let highlightedText = text;
    const regex = new RegExp(
      searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
      'gi'
    );

    highlightedText = highlightedText.replace(regex, (match, offset) => {
      const isCurrentResult = searchResults[currentSearchIndex]?.index === offset;
      const className = isCurrentResult 
        ? 'bg-yellow-300 text-black font-medium' 
        : 'bg-yellow-100 text-black';
      return `<mark class="${className}">${match}</mark>`;
    });

    return highlightedText;
  }, [text, searchQuery, searchResults, currentSearchIndex]);

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
    <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Extracted Text</h3>
          <span className="text-sm text-gray-500">
            {stats.words} words • {stats.characters} chars
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSearch}
            className={isSearching ? 'bg-blue-50 border-blue-200' : ''}
          >
            <Search className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            className={copySuccess ? 'bg-green-50 border-green-200' : ''}
          >
            <Copy className="h-4 w-4" />
            {copySuccess ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {isSearching && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search in text..."
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {searchResults.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPrevResult}
                  disabled={searchResults.length === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToNextResult}
                  disabled={searchResults.length === 0}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {searchQuery && searchResults.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">No matches found</p>
          )}
        </div>
      )}

      {/* Text content */}
      <div className="flex-1 overflow-auto p-4">
        <div 
          ref={textRef}
          className="prose prose-sm max-w-none"
        >
          {searchQuery && searchResults.length > 0 ? (
            <div 
              dangerouslySetInnerHTML={{ __html: highlightedText }}
              className="whitespace-pre-wrap"
            />
          ) : (
            <ReactMarkdown>
              {text}
            </ReactMarkdown>
          )}
        </div>
      </div>

      {/* Footer with statistics */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {stats.lines} lines • {stats.words} words • {stats.characters} characters
          </span>
          <span>
            ~{stats.readingTime} min read
          </span>
        </div>
      </div>
    </div>
  );
};