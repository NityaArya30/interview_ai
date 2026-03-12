import { useState } from 'react';
import { Hero } from '@/components/Hero';
import { InterviewSession } from '@/components/InterviewSession';
import { InterviewTypeSelector, InterviewType } from '@/components/InterviewTypeSelector';
import { DSASession } from '@/components/DSASession';

const typeToDefaultRole: Record<InterviewType, string> = {
  'web-development': 'Frontend Developer',
  'dsa': '',
  'ml': 'Machine Learning Engineer',
  'data-science': 'Data Scientist',
  'ai-specialized': 'NLP Engineer',
  'system-design': 'System Design',
};

const Index = () => {
  const [showInterview, setShowInterview] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [interviewType, setInterviewType] = useState<InterviewType | null>(null);

  const handleStart = () => {
    setShowTypeSelector(true);
  };

  const handleSelectType = (type: InterviewType) => {
    setInterviewType(type);
    setShowTypeSelector(false);
    setShowInterview(true);
  };

  const handleBack = () => {
    if (showInterview) {
      setShowInterview(false);
      setInterviewType(null);
      setShowTypeSelector(true);
    } else if (showTypeSelector) {
      setShowTypeSelector(false);
    }
  };

  const handleBackToHome = () => {
    setShowInterview(false);
    setShowTypeSelector(false);
    setInterviewType(null);
  };

  return (
    <div className="min-h-screen">
      {showInterview && interviewType === 'dsa' ? (
        <DSASession onBack={handleBackToHome} />
      ) : showInterview && interviewType ? (
        <InterviewSession onBack={handleBackToHome} defaultRole={typeToDefaultRole[interviewType]} interviewCategory={interviewType} />
      ) : showTypeSelector ? (
        <div className="min-h-screen p-4 md:p-6 lg:p-8 flex flex-col">
          <div className="mb-8">
            <button
              onClick={handleBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Home
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <InterviewTypeSelector onSelect={handleSelectType} />
          </div>
        </div>
      ) : (
        <Hero onStart={handleStart} />
      )}
    </div>
  );
};

export default Index;
