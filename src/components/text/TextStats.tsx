import { useTextStats } from '@/hooks/useTextStats';

export interface TextStatsProps {
  text: string;
  className?: string;
  variant?: 'footer' | 'inline';
}

/**
 * TextStats component displays text statistics in a clean, readable format
 * @param text - The text to analyze
 * @param className - Additional CSS classes
 * @param variant - Display variant: 'footer' for bottom placement, 'inline' for compact display
 */
export function TextStats({ text, className = '', variant = 'footer' }: TextStatsProps) {
  const { stats, isEmpty } = useTextStats(text);

  if (isEmpty) {
    return null;
  }

  const baseClasses = variant === 'footer' 
    ? 'px-4 py-2 border-t border-gray-200 bg-gray-50'
    : 'text-sm text-gray-500';

  if (variant === 'inline') {
    return (
      <span className={`${baseClasses} ${className}`}>
        {stats.words} words • {stats.characters} chars
      </span>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>
          {stats.lines} lines • {stats.words} words • {stats.characters} characters
        </span>
        <span>
          ~{stats.readingTime} min read
        </span>
      </div>
    </div>
  );
}