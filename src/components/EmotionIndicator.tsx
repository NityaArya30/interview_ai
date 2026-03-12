import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Meh, Frown, Brain, Zap, Eye, Clock, Heart, Lightbulb } from 'lucide-react';

interface EmotionIndicatorProps {
  emotion: string;
  confidence: number;
}

const emotionConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Happy: { icon: Smile, color: 'text-success', bg: 'bg-success/20' },
  Neutral: { icon: Meh, color: 'text-muted-foreground', bg: 'bg-muted/20' },
  Focused: { icon: Brain, color: 'text-primary', bg: 'bg-primary/20' },
  Confident: { icon: Zap, color: 'text-warning', bg: 'bg-warning/20' },
  Stressed: { icon: Frown, color: 'text-destructive', bg: 'bg-destructive/20' },
  Thinking: { icon: Lightbulb, color: 'text-warning', bg: 'bg-warning/20' },
  Engaged: { icon: Eye, color: 'text-primary', bg: 'bg-primary/20' },
  Anticipating: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/20' },
  Reflective: { icon: Heart, color: 'text-primary', bg: 'bg-primary/20' },
};

export const EmotionIndicator = ({ emotion, confidence }: EmotionIndicatorProps) => {
  const config = emotionConfig[emotion] || emotionConfig.Neutral;
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Detected Emotion</h3>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={emotion}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className={`p-3 rounded-xl ${config.bg}`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{emotion}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground">{confidence.toFixed(1)}%</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};