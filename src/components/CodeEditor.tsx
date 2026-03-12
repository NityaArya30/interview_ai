import { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Check, X, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export interface TestCase {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
  isCustom?: boolean;
}

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  testCases?: TestCase[];
  onSubmit?: (code: string, language: string) => void;
  onRunTests?: (code: string, language: string, testCases: TestCase[]) => Promise<TestCase[]>;
  isEvaluating?: boolean;
  starterCode?: Record<string, string>;
}

const defaultTemplates: Record<string, string> = {
  javascript: `// JavaScript Solution\nfunction solution(input) {\n  // Your code here\n  \n  return result;\n}`,
  python: `# Python Solution\ndef solution(input):\n    # Your code here\n    \n    return result`,
  typescript: `// TypeScript Solution\nfunction solution(input: any): any {\n  // Your code here\n  \n  return result;\n}`,
  java: `// Java Solution\nclass Solution {\n    public static Object solution(Object input) {\n        // Your code here\n        \n        return result;\n    }\n}`,
  cpp: `// C++ Solution\n#include <iostream>\nusing namespace std;\n\nauto solution(auto input) {\n    // Your code here\n    \n    return result;\n}`,
};

const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

export const CodeEditor = ({
  initialCode,
  language: initialLanguage = 'javascript',
  testCases: initialTestCases = [],
  onSubmit,
  onRunTests,
  isEvaluating = false,
  starterCode,
}: CodeEditorProps) => {
  const getStarterForLanguage = (lang: string) => {
    if (starterCode && starterCode[lang]) return starterCode[lang];
    if (initialCode) return initialCode;
    return defaultTemplates[lang] || '// Start coding...';
  };

  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(getStarterForLanguage(initialLanguage));
  const [testResults, setTestResults] = useState<TestCase[]>(initialTestCases);
  const [isRunning, setIsRunning] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customExpected, setCustomExpected] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Reset code when problem changes (starterCode changes)
  useEffect(() => {
    setCode(getStarterForLanguage(language));
    setTestResults(initialTestCases);
  }, [starterCode]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(getStarterForLanguage(newLanguage));
  };

  const handleReset = () => {
    setCode(getStarterForLanguage(language));
    setTestResults(initialTestCases);
  };

  const handleAddCustomTestCase = () => {
    if (!customInput.trim() || !customExpected.trim()) return;
    const newCase: TestCase = {
      input: customInput.trim(),
      expectedOutput: customExpected.trim(),
      isCustom: true,
    };
    setTestResults(prev => [...prev, newCase]);
    setCustomInput('');
    setCustomExpected('');
    setShowCustomForm(false);
  };

  const handleRemoveCustomTestCase = (index: number) => {
    setTestResults(prev => prev.filter((_, i) => i !== index));
  };

  const handleRunTests = async () => {
    if (!onRunTests) {
      setIsRunning(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Without a callback, mark all as "not evaluated"
      const simulatedResults = testResults.map(tc => ({
        ...tc,
        actualOutput: 'No runner available',
        passed: false,
      }));
      setTestResults(simulatedResults);
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    try {
      const results = await onRunTests(code, language, testResults);
      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = () => {
    onSubmit?.(code, language);
  };

  const passedCount = testResults.filter(t => t.passed).length;
  const totalCount = testResults.length;
  const hasResults = testResults.some(t => t.passed !== undefined);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Editor Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunTests}
            disabled={isRunning || isEvaluating}
            className="gap-2"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Tests
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isEvaluating}
            className="gap-2 bg-gradient-to-r from-primary to-accent"
          >
            {isEvaluating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Submit
          </Button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Editor
          height="450px"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 12 },
          }}
        />
      </div>

      {/* Test Cases */}
      {testResults.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
              <div className="flex items-center gap-2">
                {hasResults && (
                  <Badge variant={passedCount === totalCount ? 'default' : 'secondary'} className={passedCount === totalCount ? 'bg-success text-success-foreground' : ''}>
                    {passedCount}/{totalCount} Passed
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomForm(!showCustomForm)}
                  className="gap-1 text-xs h-7"
                >
                  <Plus className="w-3 h-3" />
                  Custom
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {/* Custom Test Case Form */}
            {showCustomForm && (
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                <p className="text-xs font-medium text-foreground">Add Custom Test Case</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Input (e.g. [1,2,3], 5)"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Input
                    placeholder="Expected Output"
                    value={customExpected}
                    onChange={(e) => setCustomExpected(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Button size="sm" onClick={handleAddCustomTestCase} className="h-8 px-3">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {testResults.map((tc, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  tc.passed === true
                    ? 'border-success/50 bg-success/5'
                    : tc.passed === false
                    ? 'border-destructive/50 bg-destructive/5'
                    : 'border-border bg-secondary/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Input: </span>
                      <code className="text-foreground bg-background/50 px-1 rounded">{tc.input}</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected: </span>
                      <code className="text-foreground bg-background/50 px-1 rounded">{tc.expectedOutput}</code>
                    </div>
                    {tc.actualOutput !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Output: </span>
                        <code className={`px-1 rounded ${tc.passed ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
                          {tc.actualOutput}
                        </code>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {tc.isCustom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCustomTestCase(index)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                    {tc.passed !== undefined && (
                      <div className={`p-1.5 rounded-full ${tc.passed ? 'bg-success/20' : 'bg-destructive/20'}`}>
                        {tc.passed ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-destructive" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};
