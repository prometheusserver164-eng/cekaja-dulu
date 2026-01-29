import { forwardRef } from 'react';
import { Smile, Meh, Frown } from 'lucide-react';

interface SentimentIconProps {
  sentiment: 'positive' | 'neutral' | 'negative';
  className?: string;
}

export const SentimentIcon = forwardRef<HTMLDivElement, SentimentIconProps>(
  ({ sentiment, className = '' }, ref) => {
    const Icon = sentiment === 'positive' 
      ? Smile 
      : sentiment === 'neutral' 
        ? Meh 
        : Frown;

    const colorClass = sentiment === 'positive' 
      ? 'text-success' 
      : sentiment === 'neutral' 
        ? 'text-muted-foreground' 
        : 'text-destructive';

    return (
      <div ref={ref} className={className}>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
    );
  }
);

SentimentIcon.displayName = 'SentimentIcon';
