import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { ArrowLeft, TrendingUp, Clock, Target, Brain, BarChart3, Calendar, Loader2, Code2, MessageSquare, Trophy, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface SessionData {
  id: string; role: string; difficulty: string; average_score: number | null;
  questions_answered: number; duration_seconds: number | null; emotions_detected: unknown;
  created_at: string; completed_at: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getSessionHistory } = useInterviewSession();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => { const data = await getSessionHistory(); setSessions((data || []) as SessionData[]); setLoading(false); };
    load();
  }, [getSessionHistory]);

  const completedSessions = sessions.filter(s => s.completed_at);
  const dsaSessions = completedSessions.filter(s => s.role.startsWith('DSA'));
  const interviewSessions = completedSessions.filter(s => !s.role.startsWith('DSA'));
  const totalQuestions = completedSessions.reduce((sum, s) => sum + s.questions_answered, 0);
  const totalTime = completedSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const avgScore = completedSessions.length > 0 ? completedSessions.reduce((sum, s) => sum + (s.average_score || 0), 0) / completedSessions.length : 0;
  const dsaAvg = dsaSessions.length > 0 ? dsaSessions.reduce((s, d) => s + (d.average_score || 0), 0) / dsaSessions.length : 0;
  const intAvg = interviewSessions.length > 0 ? interviewSessions.reduce((s, d) => s + (d.average_score || 0), 0) / interviewSessions.length : 0;

  // Streak calculation
  const today = startOfDay(new Date());
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const day = startOfDay(subDays(new Date(), i));
    const hasSession = completedSessions.some(s => startOfDay(new Date(s.created_at)).getTime() === day.getTime());
    if (hasSession) streak++; else if (i > 0) break;
  }

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dayStart = startOfDay(date);
    const daySessions = completedSessions.filter(s => startOfDay(new Date(s.created_at)).getTime() === dayStart.getTime());
    const as = daySessions.length > 0 ? daySessions.reduce((sum, s) => sum + (s.average_score || 0), 0) / daySessions.length : null;
    return { date: format(date, 'MMM d'), score: as ? Number(as.toFixed(1)) : null, sessions: daySessions.length };
  });

  const roleDistribution = completedSessions.reduce((acc, s) => { acc[s.role] = (acc[s.role] || 0) + 1; return acc; }, {} as Record<string, number>);
  const roleChartData = Object.entries(roleDistribution).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '…' : name, value }));
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

  const radarData = [
    { subject: 'DSA', A: dsaAvg || 0 },
    { subject: 'Interview', A: intAvg || 0 },
    { subject: 'Consistency', A: streak > 0 ? Math.min(streak * 2, 10) : 0 },
    { subject: 'Volume', A: Math.min(totalQuestions / 5, 10) },
    { subject: 'Speed', A: totalTime > 0 && totalQuestions > 0 ? Math.min(10, 600 / (totalTime / totalQuestions)) : 0 },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Performance Dashboard</h1>
              <p className="text-muted-foreground">Track your competitive interview stats</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/leaderboard')} variant="outline" className="gap-2"><Trophy className="w-4 h-4" />Leaderboard</Button>
            <Button onClick={() => navigate('/history')} variant="outline">View History</Button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: Target, label: 'Avg Score', value: `${avgScore.toFixed(1)}/10`, color: 'text-primary' },
            { icon: Code2, label: 'DSA Avg', value: `${dsaAvg.toFixed(1)}/10`, color: 'text-accent' },
            { icon: MessageSquare, label: 'Interview Avg', value: `${intAvg.toFixed(1)}/10`, color: 'text-success' },
            { icon: BarChart3, label: 'Sessions', value: `${completedSessions.length}`, color: 'text-foreground' },
            { icon: Flame, label: 'Streak', value: `${streak}d`, color: 'text-warning' },
            { icon: Clock, label: 'Total Time', value: `${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}m`, color: 'text-muted-foreground' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass-card">
                <CardContent className="p-3 text-center">
                  <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-base">Score Trend (14 Days)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last14Days}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} className="text-muted-foreground" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-base">Skill Radar</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid strokeDasharray="3 3" className="stroke-muted" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} />
                    <Radar name="Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DSA vs Interview Breakdown */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Code2 className="w-4 h-4 text-accent" /> DSA Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sessions</span><span className="font-medium">{dsaSessions.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Score</span><span className="font-medium text-accent">{dsaAvg.toFixed(1)}/10</span></div>
              <Progress value={dsaAvg * 10} className="h-2" />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Questions Solved</span><span className="font-medium">{dsaSessions.reduce((a, s) => a + s.questions_answered, 0)}</span></div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4 text-success" /> Interview Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sessions</span><span className="font-medium">{interviewSessions.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Score</span><span className="font-medium text-success">{intAvg.toFixed(1)}/10</span></div>
              <Progress value={intAvg * 10} className="h-2" />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Questions Answered</span><span className="font-medium">{interviewSessions.reduce((a, s) => a + s.questions_answered, 0)}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution */}
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-base">Practice Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {roleChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-muted-foreground" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={120} className="text-muted-foreground" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-muted-foreground">No data yet</div>}
            </div>
          </CardContent>
        </Card>

        {/* Recent */}
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Recent Sessions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedSessions.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => navigate('/history')}>
                  <div>
                    <div className="flex items-center gap-2">
                      {s.role.startsWith('DSA') ? <Code2 className="w-3 h-3 text-accent" /> : <MessageSquare className="w-3 h-3 text-success" />}
                      <p className="font-medium text-sm">{s.role}</p>
                      <Badge variant="outline" className="text-[10px]">{s.difficulty}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(s.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-sm">{(s.average_score || 0).toFixed(1)}/10</p>
                    <p className="text-[10px] text-muted-foreground">{s.questions_answered} Q's</p>
                  </div>
                </div>
              ))}
              {completedSessions.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No completed sessions yet.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
