import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Crown, Star, TrendingUp, Target, MessageSquare, Code2, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardEntry {
  user_id: string; display_name: string | null; avatar_url: string | null;
  total_sessions: number; total_questions: number; average_score: number;
  best_score: number; consistency: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => { loadLeaderboard(); }, []);

  const loadLeaderboard = async () => {
    try {
      const { data: statsData, error } = await supabase.rpc('get_leaderboard_stats') as { data: any[] | null; error: any };
      if (error) throw error;
      if (!statsData?.length) { setLeaderboard([]); setIsLoading(false); return; }
      const entries: LeaderboardEntry[] = statsData.map((stat: any) => {
        const scores: number[] = stat.all_scores || [];
        const avgScore = Number(stat.avg_score) || 0;
        const bestScore = Number(stat.best_score) || 0;
        let consistency = 100;
        if (scores.length > 1) {
          const variance = scores.reduce((acc: number, val: number) => acc + Math.pow(Number(val) - avgScore, 2), 0) / scores.length;
          const cv = avgScore > 0 ? (Math.sqrt(variance) / avgScore) * 100 : 100;
          consistency = Math.max(0, Math.min(100, 100 - cv * 10));
        }
        return { user_id: stat.user_id, display_name: stat.display_name || null, avatar_url: stat.avatar_url || null, total_sessions: Number(stat.total_sessions) || 0, total_questions: Number(stat.total_questions) || 0, average_score: avgScore, best_score: bestScore, consistency };
      });
      entries.sort((a, b) => b.average_score !== a.average_score ? b.average_score - a.average_score : b.total_questions - a.total_questions);
      setLeaderboard(entries);
      if (user) { const r = entries.findIndex(e => e.user_id === user.id); setCurrentUserRank(r !== -1 ? r + 1 : null); }
    } catch (error) { console.error('Error loading leaderboard:', error); }
    finally { setIsLoading(false); }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-7 h-7 text-yellow-400 drop-shadow-lg" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-7 h-7 flex items-center justify-center text-muted-foreground font-bold text-lg">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/15 to-amber-500/10 border-yellow-500/40 shadow-yellow-500/10 shadow-lg';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300/10 to-gray-400/5 border-gray-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/10 to-orange-600/5 border-amber-600/30';
    return '';
  };

  const getInitials = (e: LeaderboardEntry) => e.display_name ? e.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const getScoreColor = (s: number) => s >= 8 ? 'text-success' : s >= 6 ? 'text-warning' : 'text-destructive';

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">Leaderboard</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">Dashboard</Button>
        </motion.div>

        {/* Current User Rank */}
        {currentUserRank && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
            <Card className="glass-card border-primary/40 bg-gradient-to-r from-primary/10 to-accent/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3"><Star className="w-5 h-5 text-primary" /><span className="font-semibold">Your Rank</span></div>
                <div className="flex items-center gap-3">
                  <Badge className="text-lg px-5 py-1.5 bg-primary text-primary-foreground font-bold">#{currentUserRank}</Badge>
                  <span className="text-sm text-muted-foreground">of {leaderboard.length}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : leaderboard.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No Rankings Yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to complete an interview!</p>
            <Button onClick={() => navigate('/')}>Start Interview</Button>
          </motion.div>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-3">
              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 0, 2].map((podiumIdx) => {
                    const entry = leaderboard[podiumIdx];
                    if (!entry) return null;
                    const rank = podiumIdx + 1;
                    const isMe = user?.id === entry.user_id;
                    return (
                      <motion.div key={entry.user_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: podiumIdx * 0.1 }}
                        className={`text-center ${rank === 1 ? '-mt-4' : 'mt-2'}`}>
                        <Card className={`glass-card ${getRankBg(rank)} ${isMe ? 'ring-2 ring-primary' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-center mb-2">{getRankIcon(rank)}</div>
                            <Avatar className={`w-14 h-14 mx-auto border-2 ${rank === 1 ? 'border-yellow-400' : 'border-border'}`}>
                              {entry.avatar_url ? <AvatarImage src={entry.avatar_url} /> : null}
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">{getInitials(entry)}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-sm mt-2 truncate">{entry.display_name || 'Anonymous'}</p>
                            {isMe && <Badge variant="outline" className="text-[10px] mt-1">You</Badge>}
                            <p className={`text-2xl font-bold mt-1 ${getScoreColor(entry.average_score)}`}>{entry.average_score.toFixed(1)}</p>
                            <p className="text-[10px] text-muted-foreground">{entry.total_questions} questions</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Rest of leaderboard */}
              {leaderboard.slice(leaderboard.length >= 3 ? 3 : 0).map((entry, index) => {
                const rank = (leaderboard.length >= 3 ? 3 : 0) + index + 1;
                const isMe = user?.id === entry.user_id;
                return (
                  <motion.div key={entry.user_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                    <Card className={`glass-card border-border/50 ${isMe ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 flex items-center justify-center font-bold text-muted-foreground">{rank}</div>
                          <Avatar className="w-10 h-10 border border-border">
                            {entry.avatar_url ? <AvatarImage src={entry.avatar_url} /> : null}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(entry)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm truncate">{entry.display_name || 'Anonymous'}</h3>
                              {isMe && <Badge variant="outline" className="text-[10px]">You</Badge>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{entry.total_sessions} sessions</span>
                              <span>{entry.total_questions} questions</span>
                              <span>{entry.consistency.toFixed(0)}% consistent</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getScoreColor(entry.average_score)}`}>{entry.average_score.toFixed(1)}</div>
                            <div className="text-[10px] text-muted-foreground">Best: {entry.best_score.toFixed(1)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
