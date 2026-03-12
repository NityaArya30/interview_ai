import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Camera, Save, Loader2, Shield, Target, Clock, Code2, MessageSquare, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getSessionHistory } = useInterviewSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState({ sessions: 0, questions: 0, avgScore: 0, totalTime: 0, dsaSessions: 0, intSessions: 0 });

  useEffect(() => {
    if (user) { loadProfile(); loadStats(); }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('profiles').select('display_name, avatar_url').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) { setDisplayName(data.display_name || ''); setAvatarUrl(data.avatar_url); }
    } catch (e) { console.error(e); toast.error('Failed to load profile'); }
    finally { setIsLoading(false); }
  };

  const loadStats = async () => {
    const data = await getSessionHistory();
    if (data) {
      const completed = (data as any[]).filter((s: any) => s.completed_at);
      const totalQ = completed.reduce((a: number, s: any) => a + s.questions_answered, 0);
      const avg = completed.length > 0 ? completed.reduce((a: number, s: any) => a + (s.average_score || 0), 0) / completed.length : 0;
      const time = completed.reduce((a: number, s: any) => a + (s.duration_seconds || 0), 0);
      setStats({
        sessions: completed.length, questions: totalQ, avgScore: avg, totalTime: time,
        dsaSessions: completed.filter((s: any) => s.role.startsWith('DSA')).length,
        intSessions: completed.filter((s: any) => !s.role.startsWith('DSA')).length,
      });
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be less than 2MB'); return; }
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(newUrl);
      await supabase.from('profiles').update({ avatar_url: newUrl }).eq('user_id', user.id);
      toast.success('Avatar updated!');
    } catch (e) { console.error(e); toast.error('Failed to upload avatar'); }
    finally { setIsUploading(false); }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Profile updated!');
    } catch (e) { console.error(e); toast.error('Failed to save'); }
    finally { setIsSaving(false); }
  };

  const getInitials = () => displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : user?.email?.slice(0, 2).toUpperCase() || 'U';
  const maskedEmail = user?.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '';

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
          <h1 className="text-2xl font-bold gradient-text">Your Profile</h1>
        </motion.div>

        <div className="grid md:grid-cols-[280px,1fr] gap-6">
          {/* Left - Avatar & Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="w-28 h-28 border-4 border-primary/20">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <button onClick={handleAvatarClick} disabled={isUploading} className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <Camera className="w-6 h-6 text-primary" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">{displayName || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center mt-1"><Shield className="w-3 h-3" /> {maskedEmail}</p>
                </div>

                {/* Quick Stats */}
                <div className="w-full space-y-2 pt-4 border-t border-border/50">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sessions</span><span className="font-medium">{stats.sessions}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Questions</span><span className="font-medium">{stats.questions}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Score</span><span className="font-medium text-primary">{stats.avgScore.toFixed(1)}/10</span></div>
                  <Progress value={stats.avgScore * 10} className="h-2" />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {stats.sessions >= 1 && <Badge variant="secondary" className="text-[10px]">🎯 First Session</Badge>}
                  {stats.sessions >= 10 && <Badge variant="secondary" className="text-[10px]">🔥 10 Sessions</Badge>}
                  {stats.avgScore >= 8 && <Badge variant="secondary" className="text-[10px]">⭐ Top Scorer</Badge>}
                  {stats.dsaSessions >= 5 && <Badge variant="secondary" className="text-[10px]">💻 DSA Pro</Badge>}
                  {stats.questions >= 50 && <Badge variant="secondary" className="text-[10px]">📚 50 Questions</Badge>}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right - Edit & Stats */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="glass-card border-border/50">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="w-4 h-4 text-primary" /> Edit Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs">Email (masked)</Label>
                    <Input id="email" value={maskedEmail} disabled className="bg-secondary/50 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-xs">Display Name</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your display name" className="text-sm" />
                  </div>
                  <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2" variant="gradient">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Cards */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="grid grid-cols-2 gap-3">
                <Card className="glass-card"><CardContent className="p-4 text-center">
                  <Code2 className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <p className="text-2xl font-bold">{stats.dsaSessions}</p>
                  <p className="text-[10px] text-muted-foreground">DSA Sessions</p>
                </CardContent></Card>
                <Card className="glass-card"><CardContent className="p-4 text-center">
                  <MessageSquare className="w-5 h-5 mx-auto mb-1 text-success" />
                  <p className="text-2xl font-bold">{stats.intSessions}</p>
                  <p className="text-[10px] text-muted-foreground">Interview Sessions</p>
                </CardContent></Card>
                <Card className="glass-card"><CardContent className="p-4 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-warning" />
                  <p className="text-2xl font-bold">{Math.floor(stats.totalTime / 3600)}h {Math.floor((stats.totalTime % 3600) / 60)}m</p>
                  <p className="text-[10px] text-muted-foreground">Practice Time</p>
                </CardContent></Card>
                <Card className="glass-card"><CardContent className="p-4 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{stats.questions}</p>
                  <p className="text-[10px] text-muted-foreground">Total Questions</p>
                </CardContent></Card>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
