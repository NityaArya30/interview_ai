-- Create interview_sessions table for saving sessions
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  role TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  average_score NUMERIC(3,2) DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  emotions_detected JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create interview_answers table for individual answers
CREATE TABLE public.interview_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  feedback TEXT,
  score INTEGER,
  emotion_during TEXT,
  time_taken_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for now, can add auth later)
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required initially)
CREATE POLICY "Allow public read access to sessions" 
ON public.interview_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to sessions" 
ON public.interview_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to sessions" 
ON public.interview_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public read access to answers" 
ON public.interview_answers 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to answers" 
ON public.interview_answers 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_sessions_created_at ON public.interview_sessions(created_at DESC);
CREATE INDEX idx_answers_session_id ON public.interview_answers(session_id);