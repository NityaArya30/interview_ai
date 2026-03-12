import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogOut, History, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CodeEditor, TestCase } from './CodeEditor';
import { FeedbackCard } from './FeedbackCard';
import { SessionSummary } from './SessionSummary';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { dsaCategories, getProblemsByCategory, DSAProblem } from '@/data/dsaProblems';

interface DSASessionProps {
  onBack: () => void;
}

const difficulties = ['Easy', 'Medium', 'Hard'];

export const DSASession = ({ onBack }: DSASessionProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [category, setCategory] = useState('random');
  const [difficulty, setDifficulty] = useState('Easy');
  const [currentProblem, setCurrentProblem] = useState<DSAProblem | null>(null);
  const [usedProblemIds, setUsedProblemIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackScore, setFeedbackScore] = useState<number>(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Session tracking
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const questionsAnsweredRef = useRef(0);
  const totalScoreRef = useRef(0);
  const scoresRef = useRef<number[]>([]);
  const emotionsRef = useRef<string[]>([]);

  const createDSASession = useCallback(async () => {
    if (!user) return;
    try {
      const catLabel = dsaCategories.find(c => c.id === category)?.label || 'Random';
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          role: `DSA - ${catLabel}`,
          difficulty,
          total_questions: 10,
          questions_answered: 0,
          average_score: 0,
          duration_seconds: 0,
          emotions_detected: [],
          user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      sessionIdRef.current = data.id;
      sessionStartRef.current = new Date();
      questionsAnsweredRef.current = 0;
      totalScoreRef.current = 0;
      scoresRef.current = [];
      emotionsRef.current = [];
    } catch (error) {
      console.error('Failed to create DSA session:', error);
    }
  }, [user, difficulty, category]);

  const saveDSAAnswer = useCallback(async (problem: DSAProblem, code: string, language: string, score: number, feedbackText: string) => {
    if (!sessionIdRef.current) return;
    try {
      questionsAnsweredRef.current += 1;
      totalScoreRef.current += score;
      scoresRef.current.push(score);
      emotionsRef.current.push('Focused');
      const avgScore = totalScoreRef.current / questionsAnsweredRef.current;
      const duration = sessionStartRef.current
        ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
        : 0;

      await supabase.from('interview_answers').insert({
        session_id: sessionIdRef.current,
        question: `[DSA] ${problem.title} (${problem.difficulty}) [${problem.category}]`,
        answer: `Language: ${language}\n\n${code}`,
        feedback: feedbackText,
        score,
        emotion_during: 'Focused',
        time_taken_seconds: duration,
      });

      await supabase
        .from('interview_sessions')
        .update({
          questions_answered: questionsAnsweredRef.current,
          average_score: avgScore,
          duration_seconds: duration,
        })
        .eq('id', sessionIdRef.current);
    } catch (error) {
      console.error('Failed to save DSA answer:', error);
    }
  }, []);

  const endDSASession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      const duration = sessionStartRef.current
        ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
        : 0;
      await supabase
        .from('interview_sessions')
        .update({ completed_at: new Date().toISOString(), duration_seconds: duration })
        .eq('id', sessionIdRef.current);
    } catch (error) {
      console.error('Failed to end DSA session:', error);
    } finally {
      sessionIdRef.current = null;
      sessionStartRef.current = null;
    }
  }, []);

  useEffect(() => {
    createDSASession();
    return () => { if (sessionIdRef.current) endDSASession(); };
  }, []);

  const loadNewProblem = useCallback(async (diff?: string, cat?: string) => {
    setIsLoading(true);
    setFeedback(null);
    const d = diff || difficulty;
    const c = cat || category;
    const problems = getProblemsByCategory(c, d);
    const available = problems.filter(p => !usedProblemIds.has(p.id));
    const pool = available.length > 0 ? available : problems;
    if (pool.length === 0) {
      toast.info('No more problems in this category. Try another!');
      setIsLoading(false);
      return;
    }
    const randomProblem = pool[Math.floor(Math.random() * pool.length)];
    setUsedProblemIds(prev => new Set([...prev, randomProblem.id]));
    setCurrentProblem(randomProblem);
    setIsLoading(false);
  }, [difficulty, category, usedProblemIds]);

  useEffect(() => { loadNewProblem(); }, []);

  const handleRunTests = useCallback(async (code: string, language: string, testCases: TestCase[]): Promise<TestCase[]> => {
    if (!currentProblem) return testCases;
    try {
      const { data, error } = await supabase.functions.invoke('interview-ai', {
        body: { type: 'evaluate_test_cases', code, language, testCases: testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput })), problemTitle: currentProblem.title },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      const results = data.results;
      if (Array.isArray(results)) {
        return testCases.map((tc, i) => ({ ...tc, actualOutput: results[i]?.actualOutput || 'Unknown', passed: results[i]?.passed === true }));
      }
      return testCases.map(tc => ({ ...tc, actualOutput: 'Could not evaluate', passed: false }));
    } catch (error) {
      console.error('Error evaluating test cases:', error);
      toast.error('Failed to evaluate test cases.');
      return testCases.map(tc => ({ ...tc, actualOutput: 'Evaluation failed', passed: false }));
    }
  }, [currentProblem]);

  const handleSubmitCode = async (code: string, language: string) => {
    if (!currentProblem) return;
    setIsEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-ai', {
        body: {
          type: 'provide_feedback',
          interviewType: 'dsa',
          question: `DSA Problem: ${currentProblem.title}\n\n${currentProblem.description}\n\nExamples:\n${currentProblem.examples.map(e => `Input: ${e.input}\nOutput: ${e.output}`).join('\n\n')}\n\nConstraints:\n${currentProblem.constraints.join('\n')}`,
          answer: `Language: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      const score = data.score ?? 5;
      setFeedback(data.content);
      setFeedbackScore(score);
      toast.success('Code evaluated!');
      await saveDSAAnswer(currentProblem, code, language, score, data.content);
    } catch (error) {
      console.error('Error evaluating code:', error);
      toast.error('Failed to evaluate code.');
      setFeedback('**Overall Score: 5/10**\n\n**Summary:**\nUnable to evaluate. Please try again.');
      setFeedbackScore(5);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextProblem = () => {
    setFeedback(null);
    loadNewProblem();
  };

  const handleEndSession = async () => {
    await endDSASession();
    const duration = sessionStartRef.current ? Math.floor((Date.now() - (sessionStartRef.current?.getTime() || Date.now())) / 1000) : 0;
    if (questionsAnsweredRef.current > 0) {
      setShowSummary(true);
    } else {
      onBack();
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'text-success bg-success/10 border-success/30';
      case 'Medium': return 'text-warning bg-warning/10 border-warning/30';
      case 'Hard': return 'text-destructive bg-destructive/10 border-destructive/30';
      default: return 'text-muted-foreground';
    }
  };

  if (showSummary) {
    const duration = sessionStartRef.current ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000) : 0;
    return (
      <SessionSummary
        stats={{
          role: `DSA - ${dsaCategories.find(c => c.id === category)?.label || 'Random'}`,
          difficulty,
          questionsAnswered: questionsAnsweredRef.current,
          averageScore: questionsAnsweredRef.current > 0 ? totalScoreRef.current / questionsAnsweredRef.current : 0,
          totalDuration: duration,
          scores: scoresRef.current,
          emotions: emotionsRef.current,
        }}
        onGoHome={onBack}
        onViewHistory={() => navigate('/history')}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={handleEndSession} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-xl md:text-2xl font-bold gradient-text">DSA Practice</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/history')} className="gap-2">
              <History className="w-4 h-4" /><span className="hidden sm:inline">History</span>
            </Button>
            <Button variant="ghost" onClick={signOut} className="gap-2 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Select value={category} onValueChange={(val) => { setCategory(val); setUsedProblemIds(new Set()); loadNewProblem(difficulty, val); }}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {dsaCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={(val) => { setDifficulty(val); loadNewProblem(val, category); }}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {difficulties.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadNewProblem()} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'New Problem'}
          </Button>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span>Solved: <span className="font-medium text-primary">{questionsAnsweredRef.current}</span></span>
          </div>
          <Button variant="outline" onClick={handleEndSession} className="text-destructive border-destructive/30 hover:bg-destructive/10">
            End Session
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[400px,1fr]">
          {/* Left - Problem */}
          <div className="space-y-4">
            {isLoading ? (
              <Card className="glass-card"><CardContent className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></CardContent></Card>
            ) : currentProblem ? (
              <Card className="glass-card max-h-[calc(100vh-220px)] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{currentProblem.title}</CardTitle>
                    <Badge className={getDifficultyColor(currentProblem.difficulty)}>{currentProblem.difficulty}</Badge>
                  </div>
                  <Badge variant="outline" className="w-fit text-xs">{dsaCategories.find(c => c.id === currentProblem.category)?.label || currentProblem.category}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentProblem.description}</p>
                  <div className="space-y-3">
                    {currentProblem.examples.map((ex, i) => (
                      <div key={i} className="p-3 rounded-lg bg-secondary/50 text-sm">
                        <p className="font-medium text-foreground mb-1">Example {i + 1}:</p>
                        <p className="font-mono text-xs mt-1">Input: {ex.input}</p>
                        <p className="font-mono text-xs">Output: {ex.output}</p>
                        {ex.explanation && <p className="text-muted-foreground text-xs mt-1">{ex.explanation}</p>}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Constraints:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {currentProblem.constraints.map((c, i) => (<li key={i} className="font-mono">• {c}</li>))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {feedback && (
              <div className="space-y-3">
                <FeedbackCard feedback={feedback} score={feedbackScore} />
                <Button onClick={handleNextProblem} className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  Next Problem <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Right - Editor */}
          <div className="space-y-4">
            {currentProblem && (
              <CodeEditor
                testCases={currentProblem.testCases}
                onSubmit={handleSubmitCode}
                onRunTests={handleRunTests}
                isEvaluating={isEvaluating}
                starterCode={currentProblem.starterCode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
