import { motion } from 'framer-motion';
import { Brain, Camera, Mic, MessageSquare, Sparkles, ChevronRight, History, BarChart3, User, Trophy, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HeroProps {
  onStart: () => void;
}

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Questions',
    description: 'Dynamic questions tailored to your role and experience level',
  },
  {
    icon: Camera,
    title: 'Emotion Analysis',
    description: 'Real-time feedback on your confidence and composure',
  },
  {
    icon: Mic,
    title: 'Voice Recognition',
    description: 'Speak naturally and get your answers transcribed instantly',
  },
  {
    icon: MessageSquare,
    title: 'Smart Feedback',
    description: 'Detailed analysis and tips to improve your responses',
  },
];

const roles = [
  'Web Development',
  'DSA & Algorithms',
  'Machine Learning',
  'Data Science',
  'AI/ML Specialized',
  'System Design',
];

export const Hero = ({ onStart }: HeroProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null }>({
    display_name: null,
    avatar_url: null,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const getInitials = () => {
    if (profile.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background Glow */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ background: 'var(--gradient-glow)' }}
      />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between p-6 md:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20 glow-effect">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">InterviewAI</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/history')} 
            className="gap-2 hidden md:flex"
          >
            <History className="w-4 h-4" />
            History
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')} 
            className="gap-2 hidden md:flex"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/leaderboard')} 
            className="gap-2 hidden md:flex"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSignOut} 
            className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {profile.display_name && (
                    <p className="font-medium">{profile.display_name}</p>
                  )}
                  <p className="text-sm text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/history')} className="cursor-pointer md:hidden">
                <History className="mr-2 h-4 w-4" />
                History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer md:hidden">
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/leaderboard')} className="cursor-pointer md:hidden">
                <Trophy className="mr-2 h-4 w-4" />
                Leaderboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Interview Preparation</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Ace Your Next
            <br />
            <span className="gradient-text">Technical Interview</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Practice with AI-generated questions, get real-time emotion feedback, and receive 
            detailed analysis to improve your interview performance.
          </p>

          {/* Role Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {roles.map((role, index) => (
              <motion.span
                key={role}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="px-4 py-2 rounded-full bg-secondary text-sm font-medium text-secondary-foreground border border-border/50"
              >
                {role}
              </motion.span>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button 
              onClick={onStart}
              className="gap-2 animate-pulse-glow h-14 rounded-xl px-10 text-lg bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Practicing
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-6xl w-full"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="glass-card p-6 text-center group hover:border-primary/30 transition-colors"
            >
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-sm text-muted-foreground">
        <p>Built for aspiring engineers — Web, ML, Data Science & more</p>
      </footer>
    </div>
  );
};
