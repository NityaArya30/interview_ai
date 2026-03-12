import { motion } from 'framer-motion';
import { HelpCircle, Lightbulb } from 'lucide-react';

interface QuestionCardProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  difficulty: string;
}

const difficultyColors: Record<string, string> = {
  Easy: 'bg-success/20 text-success border-success/30',
  Medium: 'bg-warning/20 text-warning border-warning/30',
  Hard: 'bg-destructive/20 text-destructive border-destructive/30',
};

export const QuestionCard = ({ question, questionNumber, totalQuestions, difficulty }: QuestionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border mt-1 ${difficultyColors[difficulty]}`}>
              {difficulty}
            </span>
          </div>
        </div>
      </div>

      <p className="text-lg font-medium text-foreground leading-relaxed">
        {question}
      </p>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Lightbulb className="w-3.5 h-3.5" />
        <span>Take your time to structure your answer clearly</span>
      </div>
    </motion.div>
  );
};
