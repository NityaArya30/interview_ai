import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Target, Brain, TrendingUp, ChevronRight, Star, MessageSquare, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface Session { id: string; role: string; difficulty: string; total_questions: number; questions_answered: number; average_score: number; duration_seconds: number; emotions_detected: string[]; created_at: string; completed_at: string | null; }
interface Answer { id: string; question: string; answer: string; feedback: string | null; score: number | null; emotion_during: string | null; time_taken_seconds: number | null; created_at: string; }

const History = () => {
  const navigate = useNavigate();
  const { getSessionHistory, getSessionDetails } = useInterviewSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionAnswers, setSessionAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadSessions(); }, []);
  const loadSessions = async () => { setIsLoading(true); const data = await getSessionHistory(); setSessions(data as Session[]); setIsLoading(false); };
  const viewSessionDetails = async (session: Session) => { setSelectedSession(session); const d = await getSessionDetails(session.id); if (d) setSessionAnswers(d.answers as Answer[]); };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const getDiffColor = (d: string) => d === 'Easy' ? 'bg-success/20 text-success border-success/30' : d === 'Medium' ? 'bg-warning/20 text-warning border-warning/30' : d === 'Hard' ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-secondary text-secondary-foreground';
  const getScoreColor = (s: number) => s >= 8 ? 'text-success' : s >= 6 ? 'text-warning' : 'text-destructive';

  const filteredSessions = filter === 'all' ? sessions : filter === 'dsa' ? sessions.filter(s => s.role.startsWith('DSA')) : sessions.filter(s => !s.role.startsWith('DSA'));

  if (selectedSession) {
    const isDSA = selectedSession.role.startsWith('DSA');
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => setSelectedSession(null)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to History</Button>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isDSA ? <Code2 className="w-5 h-5 text-accent" /> : <MessageSquare className="w-5 h-5 text-success" />}
                    <CardTitle className="text-xl">{selectedSession.role}</CardTitle>
                  </div>
                  <Badge className={getDiffColor(selectedSession.difficulty)}>{selectedSession.difficulty}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{format(new Date(selectedSession.created_at), 'PPpp')}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg bg-secondary/50"><MessageSquare className="w-4 h-4 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{selectedSession.questions_answered}</p><p className="text-[10px] text-muted-foreground">Questions</p></div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50"><Star className="w-4 h-4 mx-auto mb-1 text-warning" /><p className={`text-2xl font-bold ${getScoreColor(Number(selectedSession.average_score))}`}>{Number(selectedSession.average_score).toFixed(1)}</p><p className="text-[10px] text-muted-foreground">Avg Score</p></div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50"><Clock className="w-4 h-4 mx-auto mb-1 text-accent" /><p className="text-2xl font-bold">{formatDuration(selectedSession.duration_seconds)}</p><p className="text-[10px] text-muted-foreground">Duration</p></div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50"><Brain className="w-4 h-4 mx-auto mb-1 text-success" /><p className="text-2xl font-bold">{(selectedSession.emotions_detected as string[])?.length || 0}</p><p className="text-[10px] text-muted-foreground">Emotions</p></div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Questions & Answers</h3>
              {sessionAnswers.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="glass-card border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">Q{i + 1}</Badge>
                        {a.score && <Badge className={`${getScoreColor(a.score)} bg-transparent text-xs`}>Score: {a.score}/10</Badge>}
                        {a.emotion_during && <Badge variant="secondary" className="text-xs">{a.emotion_during}</Badge>}
                        {isDSA && <Badge variant="outline" className="text-xs text-accent border-accent/30"><Code2 className="w-3 h-3 mr-1" />DSA</Badge>}
                      </div>
                      <p className="font-medium text-foreground text-sm">{a.question}</p>
                      {isDSA && a.answer.startsWith('Language:') ? (
                        <div className="bg-secondary/30 p-3 rounded-lg">
                          <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap text-muted-foreground">{a.answer}</pre>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">{a.answer}</p>
                      )}
                      {a.feedback && (
                        <div className="pt-3 border-t border-border/50">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">AI Feedback</p>
                          <div className="prose prose-sm prose-invert max-w-none text-sm">
                            <ReactMarkdown>{a.feedback}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
          <h1 className="text-2xl font-bold gradient-text">Interview History</h1>
          <div className="w-20" />
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : sessions.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground mb-6">Start your first interview to see history.</p>
            <Button onClick={() => navigate('/')} variant="gradient">Start Interview</Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="grid w-full max-w-sm grid-cols-3">
                <TabsTrigger value="all">All ({sessions.length})</TabsTrigger>
                <TabsTrigger value="dsa" className="gap-1"><Code2 className="w-3 h-3" />DSA</TabsTrigger>
                <TabsTrigger value="interview" className="gap-1"><MessageSquare className="w-3 h-3" />Interview</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="glass-card"><CardContent className="p-3 text-center"><Target className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{filteredSessions.length}</p><p className="text-[10px] text-muted-foreground">Sessions</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><MessageSquare className="w-5 h-5 mx-auto mb-1 text-accent" /><p className="text-xl font-bold">{filteredSessions.reduce((a, s) => a + s.questions_answered, 0)}</p><p className="text-[10px] text-muted-foreground">Questions</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><TrendingUp className="w-5 h-5 mx-auto mb-1 text-success" /><p className="text-xl font-bold">{(filteredSessions.reduce((a, s) => a + Number(s.average_score), 0) / (filteredSessions.length || 1)).toFixed(1)}</p><p className="text-[10px] text-muted-foreground">Avg Score</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><Clock className="w-5 h-5 mx-auto mb-1 text-warning" /><p className="text-xl font-bold">{formatDuration(filteredSessions.reduce((a, s) => a + s.duration_seconds, 0))}</p><p className="text-[10px] text-muted-foreground">Total Time</p></CardContent></Card>
            </motion.div>

            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredSessions.map((session, index) => {
                    const isDSA = session.role.startsWith('DSA');
                    return (
                      <motion.div key={session.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.03 }}>
                        <Card className="glass-card border-border/50 cursor-pointer hover:border-primary/50 transition-all" onClick={() => viewSessionDetails(session)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {isDSA ? <Code2 className="w-3 h-3 text-accent" /> : <MessageSquare className="w-3 h-3 text-success" />}
                                  <h3 className="font-semibold text-sm">{session.role}</h3>
                                  <Badge className={`text-[10px] ${getDiffColor(session.difficulty)}`}>{session.difficulty}</Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{session.questions_answered} questions</span>
                                  <span>{Number(session.average_score).toFixed(1)}/10</span>
                                  <span>{formatDuration(session.duration_seconds)}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(session.created_at), 'PPp')}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
