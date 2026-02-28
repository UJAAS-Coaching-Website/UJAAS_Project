import { useState } from 'react';
import { TestSeriesSection } from './TestSeriesSection';
import { StudentTestTaking } from './StudentTestTaking';
import { StudentAnalytics } from './StudentAnalytics';
import { ViewResults } from './ViewResults';

// Mock question generator
const generateMockQuestions = (count: number, subject: string) => {
  const subjects = subject === 'All Subjects' 
    ? ['Physics', 'Chemistry', 'Mathematics']
    : [subject];
  
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    const currentSubject = subjects[i % subjects.length];
      questions.push({
        id: `q${i + 1}`,
        text: `${currentSubject} Question ${i + 1}: This is a sample question testing your understanding of ${currentSubject.toLowerCase()} concepts. Choose the correct option.`,
      options: [
        'Option A: First possible answer',
        'Option B: Second possible answer',
        'Option C: Third possible answer',
        'Option D: Fourth possible answer'
        ],
        correctAnswer: Math.floor(Math.random() * 4),
        subject: currentSubject,
        marks: 4,
        negativeMarks: 1
      });
  }
  
  return questions;
};

interface TestState {
  mode: 'list' | 'taking' | 'analytics' | 'viewResults';
  testId?: string;
  testTitle?: string;
  duration?: number;
  totalMarks?: number;
  questions?: any[];
  savedAnswers?: Record<string, number | null>;
  timeSpent?: number;
  result?: any;
}

interface TestSeriesContainerProps {
  user: any;
  publishedTests: import('../App').PublishedTest[];
}

export function TestSeriesContainer({ user, publishedTests }: TestSeriesContainerProps) {
  const [testState, setTestState] = useState<TestState>({ mode: 'list' });

  const handleStartTest = (testId: string, testTitle: string, duration: number, totalMarks: number, questionCount: number, subject: string, questions?: any[]) => {
    const questionsToUse = questions || generateMockQuestions(questionCount, subject);
    setTestState({
      mode: 'taking',
      testId,
      testTitle,
      duration,
      totalMarks,
      questions: questionsToUse,
      savedAnswers: {},
      timeSpent: 0
    });
  };

  const handleSubmitTest = (answers: Record<string, number | null>, timeSpent: number) => {
    if (!testState.questions) return;

    // Calculate results
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unattempted = 0;
    let obtainedMarks = 0;

    const questionsWithAnswers = testState.questions.map(q => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      const isAttempted = userAnswer !== undefined && userAnswer !== null;

      if (isAttempted) {
        if (isCorrect) {
          correctAnswers++;
          obtainedMarks += q.marks;
        } else {
          wrongAnswers++;
          obtainedMarks -= q.negativeMarks ?? 0;
        }
      } else {
        unattempted++;
      }

      return {
        ...q,
        userAnswer
      };
    });

    // Calculate subject-wise performance
    const subjectMap = new Map<string, any>();
    questionsWithAnswers.forEach(q => {
      if (!subjectMap.has(q.subject)) {
        subjectMap.set(q.subject, {
          subject: q.subject,
          total: 0,
          correct: 0,
          wrong: 0,
          unattempted: 0,
          marks: 0,
          maxMarks: 0
        });
      }
      
      const subjectData = subjectMap.get(q.subject);
      subjectData.total++;
      subjectData.maxMarks += q.marks;
      
      if (q.userAnswer !== undefined && q.userAnswer !== null) {
        if (q.userAnswer === q.correctAnswer) {
          subjectData.correct++;
          subjectData.marks += q.marks;
        } else {
          subjectData.wrong++;
          subjectData.marks -= q.negativeMarks ?? 0;
        }
      } else {
        subjectData.unattempted++;
      }
    });

    const result = {
      testId: testState.testId!,
      testTitle: testState.testTitle!,
      totalMarks: testState.totalMarks!,
      obtainedMarks,
      totalQuestions: testState.questions.length,
      correctAnswers,
      wrongAnswers,
      unattempted,
      timeSpent,
      duration: testState.duration! * 60,
      rank: Math.floor(Math.random() * 50) + 1, // Mock rank 1-50
      totalStudents: 1234,
      submittedAt: new Date().toISOString(),
      questions: questionsWithAnswers,
      subjectWise: Array.from(subjectMap.values())
    };

    setTestState({
      mode: 'analytics',
      result
    });
  };

  const handleExitTest = () => {
    // If exiting during a test, submit current answers
    if (testState.mode === 'taking') {
      handleSubmitTest(testState.savedAnswers || {}, testState.timeSpent || 0);
    } else {
      setTestState({ mode: 'list' });
    }
  };

  const handleCloseAnalytics = () => {
    setTestState({ mode: 'list' });
  };

  const handleViewResults = (testId: string) => {
    setTestState({ mode: 'viewResults' });
  };

  if (testState.mode === 'taking' && testState.questions) {
    return (
      <StudentTestTaking
        testId={testState.testId!}
        testTitle={testState.testTitle!}
        duration={testState.duration!}
        questions={testState.questions}
        onSubmit={handleSubmitTest}
        onExit={handleExitTest}
        initialAnswers={testState.savedAnswers}
        initialTimeSpent={testState.timeSpent}
      />
    );
  }

  if (testState.mode === 'analytics' && testState.result) {
    return (
      <StudentAnalytics
        result={testState.result}
        onClose={handleCloseAnalytics}
        onViewResults={handleViewResults}
      />
    );
  }

  if (testState.mode === 'viewResults') {
    return (
      <ViewResults
        onClose={handleCloseAnalytics}
        onViewDetailedAnalytics={(testId: string) => {
          // Generate mock result for detailed analytics
          const mockQuestions = generateMockQuestions(30, 'Physics');
          const mockAnswers: Record<string, number> = {};
          mockQuestions.forEach((q, i) => {
            // Mock some correct, some wrong, some unattempted
            if (i < 20) mockAnswers[q.id] = i % 3 === 0 ? q.correctAnswer : (q.correctAnswer + 1) % 4;
          });

          handleSubmitTest(mockAnswers, 3600);
        }}
      />
    );
  }

  return (
    <TestSeriesSection
      onStartTest={handleStartTest}
      onViewAnalytics={(testId: string) => {
        // Generate mock result for viewing analytics of completed test
        const mockQuestions = generateMockQuestions(30, 'Physics');
        const mockAnswers: Record<string, number> = {};
        mockQuestions.forEach((q, i) => {
          // Mock some correct, some wrong, some unattempted
          if (i < 20) mockAnswers[q.id] = i % 3 === 0 ? q.correctAnswer : (q.correctAnswer + 1) % 4;
        });

        handleSubmitTest(mockAnswers, 3600);
      }}
      onViewResults={() => setTestState({ mode: 'viewResults' })}
      publishedTests={publishedTests}
      userBatch={user.batch}
    />
  );
}
