import { motion } from 'framer-motion';
import { Code2, Globe, Brain, Sparkles, Database, Cpu, Server, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type InterviewType = 'web-development' | 'dsa' | 'ml' | 'data-science' | 'ai-specialized' | 'system-design';

interface InterviewTypeSelectorProps {
  onSelect: (type: InterviewType) => void;
}

const interviewTypes = [
  {
    id: 'web-development' as InterviewType,
    icon: Globe,
    title: 'Web Development',
    description: 'Frontend, Backend, Full-stack interview questions covering React, Node.js, APIs, databases, and more.',
    topics: ['React/Vue/Angular', 'Node.js/Express', 'REST/GraphQL', 'Databases', 'CSS/HTML'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'dsa' as InterviewType,
    icon: Code2,
    title: 'Data Structures & Algorithms',
    description: 'LeetCode-style coding challenges with an in-browser code editor, test cases, and AI evaluation.',
    topics: ['Arrays & Strings', 'Trees & Graphs', 'Dynamic Programming', 'Sorting & Searching', 'Linked Lists'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'ml' as InterviewType,
    icon: Brain,
    title: 'Machine Learning',
    description: 'ML Engineer and Deep Learning roles covering neural networks, training, optimization, and deployment.',
    topics: ['Neural Networks', 'Model Training', 'Optimization', 'Feature Engineering', 'ML Systems'],
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'data-science' as InterviewType,
    icon: BarChart3,
    title: 'Data Science',
    description: 'Data Scientist, Analyst, and Data Engineering roles covering statistics, analysis, pipelines, and visualization.',
    topics: ['Statistics', 'Data Analysis', 'SQL/ETL', 'Visualization', 'A/B Testing'],
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'ai-specialized' as InterviewType,
    icon: Cpu,
    title: 'AI/ML Specialized',
    description: 'Specialized AI roles including NLP, Computer Vision, MLOps, Robotics, and Applied Scientist positions.',
    topics: ['NLP', 'Computer Vision', 'MLOps', 'Robotics', 'Applied Science'],
    color: 'from-rose-500 to-fuchsia-500',
  },
  {
    id: 'system-design' as InterviewType,
    icon: Server,
    title: 'System Design',
    description: 'System architecture, API design, database design, scalability, and DevOps engineering interviews.',
    topics: ['Scalability', 'Microservices', 'Load Balancing', 'Caching', 'DevOps/CI-CD'],
    color: 'from-indigo-500 to-violet-500',
  },
];

export const InterviewTypeSelector = ({ onSelect }: InterviewTypeSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 w-full max-w-5xl"
    >
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Choose Interview Type</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">What would you like to practice?</h2>
        <p className="text-muted-foreground">Select an interview category to get started</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {interviewTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
          >
            <Card
              className="glass-card cursor-pointer group hover:border-primary/50 transition-all duration-300 h-full"
              onClick={() => onSelect(type.id)}
            >
              <CardHeader className="pb-3">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${type.color} mb-3 w-fit`}>
                  <type.icon className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {type.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {type.topics.map(topic => (
                    <span
                      key={topic}
                      className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
