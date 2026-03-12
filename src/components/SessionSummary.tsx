import { motion } from 'framer-motion';
import { Trophy, Clock, Target, Brain, TrendingUp, ArrowRight, Star, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SessionStats {
  role: string;
  difficulty: string;
  questionsAnswered: number;
  averageScore: number;
  totalDuration: number;
  scores: number[];
  emotions: string[];
}

interface SessionSummaryProps {
  stats: SessionStats;
  onGoHome: () => void;
  onViewHistory: () => void;
}

export const SessionSummary = ({ stats, onGoHome, onViewHistory }: SessionSummaryProps) => {
  const bestScore = Math.max(...(stats.scores.length ? stats.scores : [0]));
  const worstScore = Math.min(...(stats.scores.length ? stats.scores : [0]));
  const passingCount = stats.scores.filter(s => s >= 6).length;
  const mins = Math.floor(stats.totalDuration / 60);
  const secs = stats.totalDuration % 60;

  const getGrade = (avg: number) => {
    if (avg >= 9) return { label: 'Outstanding', color: 'text-success', icon: '🏆' };
    if (avg >= 7.5) return { label: 'Excellent', color: 'text-success', icon: '⭐' };
    if (avg >= 6) return { label: 'Good', color: 'text-warning', icon: '👍' };
    if (avg >= 4) return { label: 'Needs Work', color: 'text-orange-400', icon: '📝' };
    return { label: 'Keep Practicing', color: 'text-destructive', icon: '💪' };
  };

  const grade = getGrade(stats.averageScore);
  const topEmotion = stats.emotions.length > 0
    ? Object.entries(stats.emotions.reduce((acc, e) => ({ ...acc, [e]: (acc[e as keyof typeof acc] || 0) + 1 }), {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral'
    : 'Neutral';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen p-4 md:p-8 flex items-center justify-center"
    >
      <div className="max-w-2xl w-full space-y-6">
        {/* Title Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="text-5xl">{grade.icon}</div>
          <h1 className="text-3xl font-bold gradient-text">Session Complete!</h1>
          <p className={`text-xl font-semibold ${grade.color}`}>{grade.label}</p>
          <p className="text-sm text-muted-foreground">{stats.role} • {stats.difficulty}</p>
        </motion.div>

        {/* Score Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="relative w-36 h-36">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="42" stroke="hsl(var(--primary))" strokeWidth="8" fill="none"
                strokeDasharray={`${stats.averageScore * 26.4} 264`}
                strokeLinecap="round" transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-primary">{stats.averageScore.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">/10</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{stats.questionsAnswered}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-accent" />
              <p className="text-2xl font-bold">{mins}m {secs}s</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Star className="w-5 h-5 mx-auto mb-1 text-warning" />
              <p className="text-2xl font-bold">{bestScore}/10</p>
              <p className="text-xs text-muted-foreground">Best Score</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Brain className="w-5 h-5 mx-auto mb-1 text-success" />
              <p className="text-2xl font-bold">{topEmotion}</p>
              <p className="text-xs text-muted-foreground">Top Mood</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Score Breakdown</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success" /> Passed (≥6)
                </span>
                <span className="font-medium text-success">{passingCount}/{stats.questionsAnswered}</span>
              </div>
              <Progress value={(passingCount / Math.max(stats.questionsAnswered, 1)) * 100} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Best</span>
                <span className="font-medium text-success">{bestScore}/10</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Worst</span>
                <span className="font-medium text-destructive">{worstScore}/10</span>
              </div>
              {stats.scores.length > 0 && (
                <div className="flex gap-1 pt-2">
                  {stats.scores.map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-sm ${s >= 7 ? 'bg-success' : s >= 5 ? 'bg-warning' : 'bg-destructive'}`}
                        style={{ height: `${Math.max(s * 4, 4)}px` }}
                      />
                      <span className="text-[10px] text-muted-foreground">Q{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3"
        >
          <Button onClick={onViewHistory} variant="outline" className="flex-1 gap-2">
            <TrendingUp className="w-4 h-4" />
            View History
          </Button>
          <Button onClick={onGoHome} className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <ArrowRight className="w-4 h-4" />
            Back to Home
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
