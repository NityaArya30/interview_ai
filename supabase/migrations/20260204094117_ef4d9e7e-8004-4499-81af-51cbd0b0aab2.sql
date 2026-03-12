-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update interview_sessions to be user-specific
-- First drop the existing policies
DROP POLICY IF EXISTS "Allow public insert access to sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "Allow public read access to sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "Allow public update access to sessions" ON public.interview_sessions;

-- Create new user-specific policies
CREATE POLICY "Users can view their own sessions"
ON public.interview_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON public.interview_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.interview_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.interview_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Update interview_answers policies
DROP POLICY IF EXISTS "Allow public insert access to answers" ON public.interview_answers;
DROP POLICY IF EXISTS "Allow public read access to answers" ON public.interview_answers;

CREATE POLICY "Users can view their session answers"
ON public.interview_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.interview_sessions s
    WHERE s.id = session_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create answers for their sessions"
ON public.interview_answers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.interview_sessions s
    WHERE s.id = session_id AND s.user_id = auth.uid()
  )
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();