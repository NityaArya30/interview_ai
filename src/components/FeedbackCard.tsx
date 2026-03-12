import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface FeedbackCardProps {
  feedback: string;
  score?: number;
  isLoading?: boolean;
}

export const FeedbackCard = ({ feedback, score, isLoading }: FeedbackCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
          <div className="h-3 bg-muted rounded animate-pulse w-4/6" />
        </div>
      </motion.div>
    );
  }

  const getScoreColor = (s: number) => {
    if (s >= 8) return 'text-success bg-success/20';
    if (s >= 6) return 'text-warning bg-warning/20';
    if (s >= 4) return 'text-orange-400 bg-orange-400/20';
    return 'text-destructive bg-destructive/20';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 9) return 'Excellent';
    if (s >= 8) return 'Strong';
    if (s >= 7) return 'Good';
    if (s >= 6) return 'Decent';
    if (s >= 5) return 'Average';
    if (s >= 4) return 'Below Avg';
    if (s >= 3) return 'Weak';
    return 'Poor';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-3"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-foreground">AI Feedback</h3>
        <div className="flex items-center gap-3">
          {score !== undefined && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${getScoreColor(score)}`}>
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold">{score}/10</span>
              <span className="text-xs opacity-80">({getScoreLabel(score)})</span>
            </div>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0"
        >
          <ReactMarkdown
            components={{
              strong: ({ children }) => (
                <strong className="text-foreground font-semibold">{children}</strong>
              ),
              ul: ({ children }) => (
                <ul className="space-y-1 my-2">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="text-sm text-muted-foreground leading-relaxed">{children}</li>
              ),
              p: ({ children }) => (
                <p className="text-sm text-muted-foreground leading-relaxed my-1.5">{children}</p>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold text-foreground mt-4 mb-1">{children}</h2>
              ),
            }}
          >
            {feedback}
          </ReactMarkdown>
        </motion.div>
      )}
    </motion.div>
  );
};
