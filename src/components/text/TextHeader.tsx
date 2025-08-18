import { Button } from '@/components/ui/button';
import { Copy, Search } from 'lucide-react';
import { TextStats } from './TextStats';

export interface TextHeaderProps {
  title?: string;
  text: string;
  onSearchToggle: () => void;
  onCopy: () => void;
  isSearching: boolean;
  copySuccess: boolean;
}

/**
 * TextHeader component provides controls and metadata for text display
 * @param title - Header title (defaults to "Extracted Text")
 * @param text - Text for statistics calculation
 * @param onSearchToggle - Function to toggle search mode
 * @param onCopy - Function to copy text to clipboard
 * @param isSearching - Whether search mode is active
 * @param copySuccess - Whether copy operation was successful
 */
export function TextHeader({
  title = 'Extracted Text',
  text,
  onSearchToggle,
  onCopy,
  isSearching,
  copySuccess,
}: TextHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <TextStats text={text} variant="inline" />
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSearchToggle}
          className={isSearching ? 'bg-blue-50 border-blue-200' : ''}
          aria-label="Toggle search"
        >
          <Search className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCopy}
          className={copySuccess ? 'bg-green-50 border-green-200' : ''}
          aria-label={copySuccess ? 'Copied to clipboard' : 'Copy to clipboard'}
        >
          <Copy className="h-4 w-4" />
          {copySuccess ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}