
-- Make profiles publicly readable for leaderboard (display_name and avatar_url are not sensitive)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);

-- Create leaderboard aggregation function (SECURITY DEFINER bypasses RLS on interview_sessions)
CREATE OR REPLACE FUNCTION public.get_leaderboard_stats()
RETURNS TABLE(
  user_id uuid,
  total_sessions bigint,
  total_questions bigint,
  avg_score numeric,
  best_score numeric,
  all_scores numeric[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.user_id,
    COUNT(DISTINCT s.id)::bigint as total_sessions,
    COALESCE(SUM(s.questions_answered)::bigint, 0) as total_questions,
    ROUND(COALESCE(AVG(s.average_score), 0), 2) as avg_score,
    ROUND(COALESCE(MAX(s.average_score), 0), 2) as best_score,
    ARRAY_AGG(s.average_score::numeric) FILTER (WHERE s.average_score IS NOT NULL) as all_scores
  FROM interview_sessions s
  WHERE s.user_id IS NOT NULL
    AND s.questions_answered > 0
  GROUP BY s.user_id
  ORDER BY avg_score DESC
  LIMIT 100;
$$;
