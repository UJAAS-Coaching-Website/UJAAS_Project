import { useState, useEffect } from 'react';
import { TestSeriesSection } from './TestSeriesSection';
import { StudentTestTaking } from './StudentTestTaking';
import { StudentAnalytics } from './StudentAnalytics';
import { ViewResults } from './ViewResults';
import { User, PublishedTest } from '../App';

type TestState = 
  | { mode: 'list' }
  | { mode: 'taking'; test: PublishedTest }
  | { mode: 'analytics'; result?: any }
  | { mode: 'viewResults' };

// Helper to slugify test titles for URLs
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export function TestSeriesContainer({ 
  user, 
  publishedTests, 
  onStateChange,
  subTab,
  onNavigateSubTab
}: { 
  user: User; 
  publishedTests: PublishedTest[]; 
  onStateChange: (mode: TestState['mode']) => void;
  subTab?: string;
  onNavigateSubTab?: (subTab?: string) => void;
}) {
  const [testState, setTestState] = useState<TestState>({ mode: 'list' });

  // Sync testState with subTab from URL
  useEffect(() => {
    if (!subTab || subTab === 'list') {
      if (testState.mode !== 'list') setTestState({ mode: 'list' });
    } else if (subTab.startsWith('Analysis')) {
      if (testState.mode !== 'analytics') {
        const lastResult = localStorage.getItem('lastTestResult');
        const result = lastResult ? JSON.parse(lastResult) : null;
        if (result) {
          setTestState({ mode: 'analytics', result });
        } else {
          // If no result found, generate a dummy one so analysis mode works
          openMockAnalytics();
        }
      }
    } else if (subTab.startsWith('Test')) {
      // If we're at /Test but no test is selected, try to recover from localStorage or go back
      if (testState.mode !== 'taking') {
        const lastTaking = localStorage.getItem('lastTakingTest');
        if (lastTaking) {
          setTestState({ mode: 'taking', test: JSON.parse(lastTaking) });
        } else {
          onNavigateSubTab?.(undefined);
        }
      }
    } else if (subTab === 'Results') {
      if (testState.mode !== 'viewResults') setTestState({ mode: 'viewResults' });
    }
  }, [subTab]);

  useEffect(() => {
    onStateChange(testState.mode);
  }, [testState.mode, onStateChange]);

  const handleStartTest = (test: any) => {
    // Normalizing test data
    const normalizedTest: PublishedTest = {
      id: test.id,
      title: test.title,
      duration: test.duration,
      totalMarks: test.totalMarks,
      questions: test.realQuestions || test.questions || [],
      format: test.format || 'Custom',
      batches: test.batches || [],
      scheduleDate: test.scheduledDate || test.scheduleDate || '',
      scheduleTime: test.scheduleTime || '',
      status: test.status || 'live'
    };
    
    localStorage.setItem('lastTakingTest', JSON.stringify(normalizedTest));
    setTestState({ mode: 'taking', test: normalizedTest });
    
    // Append test name to URL: /Test-my-test-name
    const testSlug = slugify(normalizedTest.title);
    onNavigateSubTab?.(`Test-${testSlug}`);
  };

  const handleCompleteTest = (answers: Record<string, number | null>, timeSpent: number) => {
    if (testState.mode !== 'taking') return;
    
    const test = testState.test;
    
    // Calculate basic mock result
    const result = {
      testId: test.id,
      testTitle: test.title,
      totalMarks: test.totalMarks,
      obtainedMarks: Math.floor(Math.random() * test.totalMarks), // Mock obtained marks
      totalQuestions: test.questions.length,
      correctAnswers: Math.floor(Math.random() * test.questions.length),
      wrongAnswers: 0,
      unattempted: 0,
      timeSpent: timeSpent,
      duration: test.duration,
      rank: 1,
      totalStudents: 100,
      submittedAt: new Date().toISOString(),
      questions: test.questions.map((q: any) => ({
        ...q,
        userAnswer: answers[q.id]
      }))
    };

    localStorage.setItem('lastTestResult', JSON.stringify(result));
    setTestState({ mode: 'analytics', result });
    
    const testSlug = slugify(result.testTitle);
    onNavigateSubTab?.(`Analysis-${testSlug}`);
  };

  const openMockAnalytics = () => {
    // Generate a default mock result if none exists
    const lastResult = localStorage.getItem('lastTestResult');
    if (lastResult) {
      const result = JSON.parse(lastResult);
      setTestState({ mode: 'analytics', result });
      const testSlug = slugify(result.testTitle || 'Demo');
      onNavigateSubTab?.(`Analysis-${testSlug}`);
    } else {
      // Create a dummy result for demo if none exists
      const dummyResult = {
        testId: 'demo',
        testTitle: 'Demo Test Analysis',
        totalMarks: 300,
        obtainedMarks: 245,
        totalQuestions: 75,
        correctAnswers: 62,
        wrongAnswers: 10,
        unattempted: 3,
        timeSpent: 5400,
        duration: 180,
        rank: 12,
        totalStudents: 450,
        submittedAt: new Date().toISOString(),
        questions: []
      };
      localStorage.setItem('lastTestResult', JSON.stringify(dummyResult));
      setTestState({ mode: 'analytics', result: dummyResult });
      const testSlug = slugify(dummyResult.testTitle);
      onNavigateSubTab?.(`Analysis-${testSlug}`);
    }
  };

  const handleBackToList = () => {
    setTestState({ mode: 'list' });
    onNavigateSubTab?.(undefined);
  };

  if (testState.mode === 'taking' && testState.test) {
    return (
      <StudentTestTaking 
        testId={testState.test.id}
        testTitle={testState.test.title}
        duration={testState.test.duration}
        questions={testState.test.questions}
        onSubmit={handleCompleteTest}
        onExit={handleBackToList}
      />
    );
  }

  if (testState.mode === 'analytics' && testState.result) {
    return (
      <StudentAnalytics 
        result={testState.result} 
        onClose={handleBackToList}
      />
    );
  }

  if (testState.mode === 'viewResults') {
    return (
      <ViewResults 
        onClose={handleBackToList}
        onViewDetailedAnalytics={(testId) => {
          onNavigateSubTab?.('Analysis');
        }}
      />
    );
  }

  return (
    <TestSeriesSection 
      onStartTest={handleStartTest}
      onViewAnalytics={(testId) => {
        // Find existing result or generate mock
        openMockAnalytics();
      }}
      onViewResults={() => {
        setTestState({ mode: 'viewResults' });
        onNavigateSubTab?.('Results');
      }}
      publishedTests={publishedTests}
      userBatch={user.studentDetails?.batch || ''}
    />
  );
}
