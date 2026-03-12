
DROP FUNCTION IF EXISTS public.get_leaderboard_stats();

CREATE FUNCTION public.get_leaderboard_stats()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  total_sessions bigint,
  total_questions bigint,
  avg_score numeric,
  best_score numeric,
  all_scores numeric[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    s.user_id,
    p.display_name,
    p.avatar_url,
    COUNT(DISTINCT s.id)::bigint as total_sessions,
    COALESCE(SUM(s.questions_answered)::bigint, 0) as total_questions,
    ROUND(COALESCE(AVG(s.average_score), 0), 2) as avg_score,
    ROUND(COALESCE(MAX(s.average_score), 0), 2) as best_score,
    ARRAY_AGG(s.average_score::numeric) FILTER (WHERE s.average_score IS NOT NULL) as all_scores
  FROM interview_sessions s
  LEFT JOIN profiles p ON p.user_id = s.user_id
  WHERE s.user_id IS NOT NULL
    AND s.questions_answered > 0
  GROUP BY s.user_id, p.display_name, p.avatar_url
  ORDER BY avg_score DESC
  LIMIT 100;
$$;
