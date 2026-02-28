import { useState } from 'react';
import { TestSeriesSection } from './TestSeriesSection';
import { StudentTestTaking } from './StudentTestTaking';
import { StudentAnalytics } from './StudentAnalytics';
import { ViewResults } from './ViewResults';

interface ReviewMeta {
  id: string;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  questionCount: number;
}

const REVIEW_TESTS: ReviewMeta[] = [
  { id: '1', title: 'JEE Main Full Length Test #1', subject: 'All Subjects', duration: 180, totalMarks: 300, questionCount: 90 },
  { id: '2', title: 'Physics Chapter Test - Mechanics', subject: 'Physics', duration: 90, totalMarks: 100, questionCount: 30 },
  { id: '3', title: 'Chemistry Organic Chemistry Test', subject: 'Chemistry', duration: 60, totalMarks: 80, questionCount: 25 },
  { id: '4', title: 'Mathematics Advanced Calculus', subject: 'Mathematics', duration: 120, totalMarks: 120, questionCount: 40 },
  { id: '5', title: 'Physics Waves & Optics Test', subject: 'Physics', duration: 75, totalMarks: 100, questionCount: 30 },
];

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

const getSeedFromId = (testId: string) =>
  testId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

const getDeterministicAnswer = (seed: number, index: number, correct: number) => {
  const pattern = (seed + index) % 6;
  if (pattern === 0) return null; // unattempted
  if (pattern === 1 || pattern === 2 || pattern === 3) return correct; // mostly correct
  return (correct + 1 + ((seed + index) % 2)) % 4; // wrong
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

  const handleViewResults = (_testId: string) => {
    setTestState({ mode: 'viewResults' });
  };

  const openMockAnalytics = (testId: string) => {
    const reviewMeta = REVIEW_TESTS.find((test) => test.id === testId) ?? REVIEW_TESTS[0];
    const questions = generateMockQuestions(reviewMeta.questionCount, reviewMeta.subject);
    const seed = getSeedFromId(testId);
    const answers: Record<string, number | null> = {};

    questions.forEach((q, index) => {
      answers[q.id] = getDeterministicAnswer(seed, index, q.correctAnswer);
    });

    // Calculate results using the same path as a real submission.
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unattempted = 0;
    let obtainedMarks = 0;

    const questionsWithAnswers = questions.map((q) => {
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

      return { ...q, userAnswer };
    });

    const subjectMap = new Map<string, any>();
    questionsWithAnswers.forEach((q) => {
      if (!subjectMap.has(q.subject)) {
        subjectMap.set(q.subject, {
          subject: q.subject,
          total: 0,
          correct: 0,
          wrong: 0,
          unattempted: 0,
          marks: 0,
          maxMarks: 0,
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
      testId: reviewMeta.id,
      testTitle: reviewMeta.title,
      totalMarks: reviewMeta.totalMarks,
      obtainedMarks,
      totalQuestions: questionsWithAnswers.length,
      correctAnswers,
      wrongAnswers,
      unattempted,
      timeSpent: Math.floor(reviewMeta.duration * 60 * 0.78),
      duration: reviewMeta.duration * 60,
      rank: (seed % 80) + 1,
      totalStudents: 1234,
      submittedAt: new Date().toISOString(),
      questions: questionsWithAnswers,
      subjectWise: Array.from(subjectMap.values()),
    };

    setTestState({
      mode: 'analytics',
      result,
    });
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
        onViewDetailedAnalytics={openMockAnalytics}
      />
    );
  }

  return (
    <TestSeriesSection
      onStartTest={handleStartTest}
      onViewAnalytics={openMockAnalytics}
      onViewResults={() => setTestState({ mode: 'viewResults' })}
      publishedTests={publishedTests}
      userBatch={user.batch}
    />
  );
}
