import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, RotateCcw, ArrowLeft, History, Loader2, ChevronLeft, ChevronRight, LogOut, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WebcamPreview } from './WebcamPreview';
import { EmotionIndicator } from './EmotionIndicator';
import { VoiceRecorder } from './VoiceRecorder';
import { QuestionCard } from './QuestionCard';
import { FeedbackCard } from './FeedbackCard';
import { SessionSummary } from './SessionSummary';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { InterviewType } from './InterviewTypeSelector';

interface InterviewSessionProps {
  onBack: () => void;
  defaultRole?: string;
  interviewCategory?: InterviewType;
}

const rolesByCategory: Record<string, string[]> = {
  'web-development': ['Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'React Developer', 'Node.js Developer', 'Python Developer'],
  'ml': ['Machine Learning Engineer', 'Deep Learning Engineer'],
  'data-science': ['Data Scientist', 'Data Analyst', 'Data Engineer'],
  'ai-specialized': ['NLP Engineer', 'Computer Vision Engineer', 'MLOps Engineer', 'Applied Scientist', 'Robotics Engineer'],
  'system-design': ['System Design', 'API Development', 'Database Design', 'DevOps Engineer'],
};

const difficulties = ['Easy', 'Medium', 'Hard'];

const fallbackQuestions: Record<string, string[]> = {
  Easy: ['What are the key principles of your field that every practitioner should know?', 'Explain the difference between common approaches in your domain.'],
  Medium: ['Describe a complex trade-off you might encounter in a real-world project.', 'How would you approach debugging a difficult issue in production?'],
  Hard: ['How would you architect a system that needs to handle millions of users?', 'Describe optimization strategies for performance-critical applications.'],
};

interface AnsweredQuestion {
  question: string;
  answer: string;
  feedback: string | null;
  score: number;
}

export const InterviewSession = ({ onBack, defaultRole, interviewCategory }: InterviewSessionProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const roles = rolesByCategory[interviewCategory || 'web-development'] || rolesByCategory['web-development'];
  const [role, setRole] = useState(defaultRole || roles[0]);
  const [difficulty, setDifficulty] = useState('Easy');
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [emotion, setEmotion] = useState({ name: 'Neutral', confidence: 85 });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackScore, setFeedbackScore] = useState<number>(5);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [totalQuestionsAsked, setTotalQuestionsAsked] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [isViewingPast, setIsViewingPast] = useState(false);
  const [viewingIndex, setViewingIndex] = useState(-1);
  const [showingFeedbackForCurrent, setShowingFeedbackForCurrent] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const answerLengthRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const activeQuestionRef = useRef<string | null>(null);
  const activeAnswerRef = useRef('');
  const scoresRef = useRef<number[]>([]);
  const emotionsRef = useRef<string[]>([]);
  const sessionStartRef = useRef<Date | null>(null);

  const {
    sessionId, questionsAnswered, averageScore, isGeneratingQuestion, isGettingFeedback,
    createSession, generateQuestion, getFeedback, saveAnswer, endSession,
  } = useInterviewSession();

  useEffect(() => {
    const detectEmotion = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const answerLength = answer.length;
      const answerGrowth = answerLength - answerLengthRef.current;
      let newEmotion = 'Neutral';
      let confidence = 75 + Math.random() * 15;
      if (isGettingFeedback) { newEmotion = 'Anticipating'; confidence = 82 + Math.random() * 15; }
      else if (answerGrowth > 10) { newEmotion = Math.random() > 0.3 ? 'Confident' : 'Focused'; confidence = 82 + Math.random() * 15; }
      else if (answerLength > 200) { newEmotion = Math.random() > 0.4 ? 'Confident' : 'Engaged'; confidence = 85 + Math.random() * 12; }
      else if (timeSinceLastActivity > 15000 && interviewStarted) { newEmotion = Math.random() > 0.5 ? 'Thinking' : 'Stressed'; confidence = 70 + Math.random() * 20; }
      else if (answerLength > 50) { newEmotion = 'Focused'; confidence = 80 + Math.random() * 15; }
      else if (feedback) { newEmotion = Math.random() > 0.6 ? 'Reflective' : 'Happy'; confidence = 82 + Math.random() * 15; }
      answerLengthRef.current = answerLength;
      setEmotion({ name: newEmotion, confidence: Math.min(99.5, confidence) });
    };
    const interval = setInterval(detectEmotion, 2500);
    return () => clearInterval(interval);
  }, [answer, interviewStarted, isGettingFeedback, feedback]);

  useEffect(() => { lastActivityRef.current = Date.now(); }, [answer]);

  const handleEmotionDetected = useCallback((name: string, confidence: number) => {
    setEmotion(prev => ({ name: Math.random() > 0.5 ? name : prev.name, confidence: (prev.confidence + confidence) / 2 }));
  }, []);

  const getFallbackQuestion = () => {
    const qs = fallbackQuestions[difficulty] || fallbackQuestions['Easy'];
    return qs[questionIndex % qs.length];
  };

  const startInterview = async () => {
    setInterviewStarted(true);
    setFeedback(null); setAnswer(''); setQuestionIndex(0); setViewingIndex(-1);
    setTotalQuestionsAsked(0); setAnsweredCount(0); setAnsweredQuestions([]);
    setIsViewingPast(false); setShowingFeedbackForCurrent(false);
    scoresRef.current = []; emotionsRef.current = [];
    sessionStartRef.current = new Date();
    await createSession(role, difficulty, 10);
    const aiQ = await generateQuestion(role, difficulty);
    const q = aiQ || getFallbackQuestion();
    setCurrentQuestion(q); activeQuestionRef.current = q; setTotalQuestionsAsked(1);
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentQuestion) return;
    const feedbackResult = await getFeedback(currentQuestion, answer);
    const newAnswered: AnsweredQuestion = {
      question: currentQuestion, answer, feedback: feedbackResult?.feedback || null, score: feedbackResult?.score ?? 5,
    };
    if (feedbackResult) { setFeedback(feedbackResult.feedback); setFeedbackScore(feedbackResult.score); }
    else { const fb = '**Overall Score: 5/10**\n\n**Summary:**\nUnable to get AI feedback.'; setFeedback(fb); setFeedbackScore(5); newAnswered.feedback = fb; newAnswered.score = 5; }
    setAnsweredQuestions(prev => [...prev, newAnswered]);
    setShowingFeedbackForCurrent(true);
    scoresRef.current.push(newAnswered.score);
    emotionsRef.current.push(emotion.name);
    await saveAnswer({ question: currentQuestion, answer, feedback: newAnswered.feedback || undefined, score: newAnswered.score }, emotion.name);
    setAnsweredCount(prev => prev + 1);
  };

  const goToNextQuestion = async () => {
    setFeedback(null); setAnswer(''); setIsViewingPast(false); setShowingFeedbackForCurrent(false);
    const nextIndex = questionIndex + 1; setQuestionIndex(nextIndex); setViewingIndex(-1);
    const aiQ = await generateQuestion(role, difficulty);
    const q = aiQ || getFallbackQuestion();
    setCurrentQuestion(q); activeQuestionRef.current = q; setTotalQuestionsAsked(prev => prev + 1);
  };

  const handleViewPrevious = () => {
    if (isViewingPast) {
      if (viewingIndex > 0) {
        const idx = viewingIndex - 1; setViewingIndex(idx);
        const p = answeredQuestions[idx]; setCurrentQuestion(p.question); setAnswer(p.answer); setFeedback(p.feedback); setFeedbackScore(p.score);
      }
    } else if (answeredQuestions.length > 0) {
      if (!showingFeedbackForCurrent) { activeQuestionRef.current = currentQuestion; activeAnswerRef.current = answer; }
      const idx = answeredQuestions.length - 1; setViewingIndex(idx); setIsViewingPast(true);
      const p = answeredQuestions[idx]; setCurrentQuestion(p.question); setAnswer(p.answer); setFeedback(p.feedback); setFeedbackScore(p.score);
    }
  };

  const handleViewNext = () => {
    if (isViewingPast) {
      if (viewingIndex < answeredQuestions.length - 1) {
        const idx = viewingIndex + 1; setViewingIndex(idx);
        const p = answeredQuestions[idx]; setCurrentQuestion(p.question); setAnswer(p.answer); setFeedback(p.feedback); setFeedbackScore(p.score);
      } else { handleBackToCurrent(); }
    } else if (showingFeedbackForCurrent) { goToNextQuestion(); }
  };

  const handleBackToCurrent = () => {
    setIsViewingPast(false); setViewingIndex(-1);
    if (showingFeedbackForCurrent && answeredQuestions.length > 0) {
      const last = answeredQuestions[answeredQuestions.length - 1];
      setCurrentQuestion(last.question); setAnswer(last.answer); setFeedback(last.feedback); setFeedbackScore(last.score);
    } else { setCurrentQuestion(activeQuestionRef.current); setAnswer(activeAnswerRef.current); setFeedback(null); }
  };

  const handleEndSession = async () => {
    await endSession();
    setInterviewStarted(false);
    if (scoresRef.current.length > 0) {
      setShowSummary(true);
    } else {
      onBack();
    }
  };

  const handleTranscription = (text: string) => setAnswer(text);
  const handleCameraToggle = (enabled: boolean) => setCameraEnabled(enabled);

  const canGoPrevious = isViewingPast ? viewingIndex > 0 : answeredQuestions.length > 0;
  const canGoNext = isViewingPast ? true : showingFeedbackForCurrent;
  const navLabel = isViewingPast ? `Viewing Q${viewingIndex + 1} of ${answeredQuestions.length}` : showingFeedbackForCurrent ? `Q${answeredQuestions.length} — Feedback` : `Question ${totalQuestionsAsked}`;

  if (showSummary) {
    const duration = sessionStartRef.current ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000) : 0;
    return (
      <SessionSummary
        stats={{ role, difficulty, questionsAnswered: scoresRef.current.length, averageScore: scoresRef.current.length > 0 ? scoresRef.current.reduce((a, b) => a + b, 0) / scoresRef.current.length : 0, totalDuration: duration, scores: scoresRef.current, emotions: emotionsRef.current }}
        onGoHome={onBack}
        onViewHistory={() => navigate('/history')}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
          <h1 className="text-xl md:text-2xl font-bold gradient-text">AI Interviewer</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/history')} className="gap-2"><History className="w-4 h-4" /><span className="hidden sm:inline">History</span></Button>
            <Button variant="ghost" onClick={signOut} className="gap-2 text-muted-foreground hover:text-destructive"><LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span></Button>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
          <div className="space-y-4">
            <WebcamPreview onEmotionDetected={handleEmotionDetected} cameraEnabled={cameraEnabled} onCameraToggle={handleCameraToggle} />
            {interviewStarted && currentQuestion && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <QuestionCard question={currentQuestion} questionNumber={isViewingPast ? viewingIndex + 1 : totalQuestionsAsked} totalQuestions={isViewingPast ? answeredQuestions.length : totalQuestionsAsked} difficulty={difficulty} />
                {answeredQuestions.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between glass-card p-3">
                    <Button variant="ghost" size="sm" onClick={handleViewPrevious} disabled={!canGoPrevious || isGeneratingQuestion} className="gap-1"><ChevronLeft className="w-4 h-4" /> Previous</Button>
                    <span className="text-sm text-muted-foreground">{navLabel}</span>
                    <Button variant="ghost" size="sm" onClick={handleViewNext} disabled={!canGoNext || isGeneratingQuestion} className="gap-1">
                      {!isViewingPast && showingFeedbackForCurrent ? 'Next Question' : 'Next'}
                      {!isViewingPast && showingFeedbackForCurrent ? <ArrowRight className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-4">
                  {isViewingPast && (
                    <div className="flex items-center justify-between p-2 bg-warning/10 rounded-lg border border-warning/20 mb-2">
                      <span className="text-sm text-warning">Viewing past answer (read-only)</span>
                      <Button size="sm" variant="outline" onClick={handleBackToCurrent} disabled={isGeneratingQuestion}>
                        {isGeneratingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue Interview'}
                      </Button>
                    </div>
                  )}
                  <Textarea placeholder="Type your answer here or use voice input..." value={answer} onChange={(e) => setAnswer(e.target.value)} className="min-h-[150px] bg-input border-border/50 resize-none text-base" disabled={isGettingFeedback || isViewingPast || showingFeedbackForCurrent} />
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <VoiceRecorder onTranscription={handleTranscription} />
                    {!isViewingPast && !showingFeedbackForCurrent && (
                      <div className="flex items-center gap-3">
                        <Button onClick={goToNextQuestion} variant="outline" className="gap-2" disabled={isGeneratingQuestion || isGettingFeedback}>
                          {isGeneratingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Skip
                        </Button>
                        <Button onClick={handleSubmitAnswer} disabled={!answer.trim() || isGettingFeedback} className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
                          {isGettingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {isGettingFeedback ? 'Analyzing...' : 'Submit Answer'}
                        </Button>
                      </div>
                    )}
                    {showingFeedbackForCurrent && !isViewingPast && (
                      <Button onClick={goToNextQuestion} className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground" disabled={isGeneratingQuestion}>
                        {isGeneratingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Next Question
                      </Button>
                    )}
                  </div>
                </motion.div>
                {feedback && <FeedbackCard feedback={feedback} score={feedbackScore} />}
              </motion.div>
            )}
            {interviewStarted && !currentQuestion && isGeneratingQuestion && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Generating your first question...</p>
              </motion.div>
            )}
          </div>

          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-4 space-y-4">
              <h2 className="font-semibold text-foreground">Select Field and Difficulty</h2>
              <div className="space-y-3">
                <Select value={role} onValueChange={setRole} disabled={interviewStarted}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={difficulty} onValueChange={setDifficulty} disabled={interviewStarted}>
                  <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                  <SelectContent>{difficulties.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
                {!interviewStarted ? (
                  <Button onClick={startInterview} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]" disabled={isGeneratingQuestion}>
                    {isGeneratingQuestion ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Starting...</> : 'Start Interview'}
                  </Button>
                ) : (
                  <Button onClick={handleEndSession} variant="outline" className="w-full">End Session</Button>
                )}
              </div>
            </motion.div>
            <EmotionIndicator emotion={emotion.name} confidence={emotion.confidence} />
            {interviewStarted && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Session Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Questions Asked</span><span className="font-medium">{totalQuestionsAsked}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Answered</span><span className="font-medium text-success">{answeredCount}</span></div>
                  {averageScore > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Score</span><span className="font-medium text-primary">{averageScore.toFixed(1)}/10</span></div>}
                  <div className="h-2 rounded-full bg-secondary overflow-hidden mt-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((answeredCount / Math.max(totalQuestionsAsked, 1)) * 100, 100)}%` }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent" />
                  </div>
                  <div className="flex justify-between text-sm mt-3"><span className="text-muted-foreground">Role</span><span className="font-medium text-primary">{role}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Difficulty</span><span className="font-medium">{difficulty}</span></div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
