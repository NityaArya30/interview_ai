import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface SessionData {
  id: string;
  role: string;
  difficulty: string;
  totalQuestions: number;
  questionsAnswered: number;
  averageScore: number;
  durationSeconds: number;
  emotionsDetected: string[];
  createdAt: Date;
  completedAt?: Date;
}

interface Answer {
  question: string;
  answer: string;
  feedback?: string;
  score?: number;
  emotion?: string;
  timeTaken?: number;
}

export const useInterviewSession = () => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [emotionsLog, setEmotionsLog] = useState<string[]>([]);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const startTimeRef = useRef<Date | null>(null);
  const questionStartRef = useRef<Date | null>(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);

  // Create a new session
  const createSession = useCallback(async (role: string, difficulty: string, totalQuestions: number) => {
    if (!user) {
      toast.error('Please log in to save your progress.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          role,
          difficulty,
          total_questions: totalQuestions,
          questions_answered: 0,
          average_score: 0,
          duration_seconds: 0,
          emotions_detected: [],
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setQuestionsAnswered(0);
      setTotalScore(0);
      setEmotionsLog([]);
      setPreviousQuestions([]);
      startTimeRef.current = new Date();
      
      return data.id;
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to start session. Progress will not be saved.');
      return null;
    }
  }, [user]);

  // Generate AI question
  const generateQuestion = useCallback(async (role: string, difficulty: string) => {
    setIsGeneratingQuestion(true);
    questionStartRef.current = new Date();
    
    try {
      const { data, error } = await supabase.functions.invoke('interview-ai', {
        body: {
          type: 'generate_question',
          role,
          difficulty,
          previousQuestions,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const question = data.content;
      setPreviousQuestions(prev => [...prev, question]);
      
      return question;
    } catch (error) {
      console.error('Failed to generate question:', error);
      toast.error('Failed to generate AI question. Using fallback questions.');
      return null;
    } finally {
      setIsGeneratingQuestion(false);
    }
  }, [previousQuestions]);

  // Get AI feedback for answer
  const getFeedback = useCallback(async (question: string, answer: string) => {
    setIsGettingFeedback(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('interview-ai', {
        body: {
          type: 'provide_feedback',
          question,
          answer,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return {
        feedback: data.content,
        score: data.score ?? 5,
      };
    } catch (error) {
      console.error('Failed to get feedback:', error);
      toast.error('Failed to get AI feedback.');
      return null;
    } finally {
      setIsGettingFeedback(false);
    }
  }, []);

  // Save answer to database
  const saveAnswer = useCallback(async (answerData: Answer, currentEmotion: string) => {
    if (!sessionId) return;

    const timeTaken = questionStartRef.current 
      ? Math.floor((Date.now() - questionStartRef.current.getTime()) / 1000)
      : 0;

    try {
      await supabase.from('interview_answers').insert({
        session_id: sessionId,
        question: answerData.question,
        answer: answerData.answer,
        feedback: answerData.feedback,
        score: answerData.score,
        emotion_during: currentEmotion,
        time_taken_seconds: timeTaken,
      });

      // Update session stats
      const newQuestionsAnswered = questionsAnswered + 1;
      const newTotalScore = totalScore + (answerData.score || 0);
      const newAverage = newTotalScore / newQuestionsAnswered;
      const newEmotions = [...emotionsLog, currentEmotion];

      setQuestionsAnswered(newQuestionsAnswered);
      setTotalScore(newTotalScore);
      setEmotionsLog(newEmotions);

      const duration = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
        : 0;

      await supabase
        .from('interview_sessions')
        .update({
          questions_answered: newQuestionsAnswered,
          average_score: newAverage,
          duration_seconds: duration,
          emotions_detected: newEmotions,
        })
        .eq('id', sessionId);

      questionStartRef.current = new Date();
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  }, [sessionId, questionsAnswered, totalScore, emotionsLog]);

  // End session
  const endSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      const duration = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
        : 0;

      await supabase
        .from('interview_sessions')
        .update({
          completed_at: new Date().toISOString(),
          duration_seconds: duration,
        })
        .eq('id', sessionId);

      toast.success('Session saved successfully!');
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      setSessionId(null);
      startTimeRef.current = null;
    }
  }, [sessionId]);

  // Get session history
  const getSessionHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get session history:', error);
      return [];
    }
  }, []);

  // Get session details with answers
  const getSessionDetails = useCallback(async (id: string) => {
    try {
      const [sessionResult, answersResult] = await Promise.all([
        supabase.from('interview_sessions').select('*').eq('id', id).single(),
        supabase.from('interview_answers').select('*').eq('session_id', id).order('created_at'),
      ]);

      if (sessionResult.error) throw sessionResult.error;
      if (answersResult.error) throw answersResult.error;

      return {
        session: sessionResult.data,
        answers: answersResult.data,
      };
    } catch (error) {
      console.error('Failed to get session details:', error);
      return null;
    }
  }, []);

  return {
    sessionId,
    questionsAnswered,
    averageScore: questionsAnswered > 0 ? totalScore / questionsAnswered : 0,
    emotionsLog,
    isGeneratingQuestion,
    isGettingFeedback,
    createSession,
    generateQuestion,
    getFeedback,
    saveAnswer,
    endSession,
    getSessionHistory,
    getSessionDetails,
  };
};
