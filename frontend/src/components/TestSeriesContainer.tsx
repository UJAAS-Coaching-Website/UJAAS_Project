import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TestSeriesSection } from './TestSeriesSection';
import { StudentTestTaking } from './StudentTestTaking';
import { StudentAnalytics } from './StudentAnalytics';
import { ViewResults } from './ViewResults';
import { User, PublishedTest } from '../App';
import {
  fetchAttemptResult,
  fetchMyAttemptResults,
  fetchMyTestAttemptSummary,
  fetchTestById,
  startMyTestAttempt,
  saveMyAttemptProgress,
  submitMyAttempt,
  type ApiActiveAttemptPayload,
  type ApiAttemptResult,
  type ApiAttemptHistoryEntry,
  type ApiStudentAttemptResultListItem,
  type ApiTest,
} from '../api/tests';
import { motion } from 'motion/react';
import {
  Clock,
  FileText,
  AlertCircle,
  BookOpen,
  Award,
  ChevronLeft,
  Play
} from 'lucide-react';

type StudentAnswer = string | number | number[] | null;

function parseQuestionCorrectAnswer(type: string, correctAnswer: string) {
  if (type === 'MCQ') {
    return Number(correctAnswer);
  }

  if (type === 'MSQ') {
    try {
      const parsed = JSON.parse(correctAnswer);
      return Array.isArray(parsed) ? parsed.map((value) => Number(value)).filter(Number.isFinite) : [];
    } catch {
      return [];
    }
  }

  return correctAnswer;
}

type TestState =
  | { mode: 'list' }
  | { mode: 'overview'; test: PublishedTest }
  | {
      mode: 'taking';
      test: PublishedTest;
      attemptId: string;
      initialAnswers: Record<string, StudentAnswer>;
      deadlineAt: string;
      serverNow: string;
    }
  | { mode: 'analytics'; result?: ApiAttemptResult; history?: ApiAttemptHistoryEntry[] }
  | { mode: 'viewResults' };

const ACTIVE_SESSION_STORAGE_KEY = 'ujaasActiveTestSession';
const LAST_RESULT_STORAGE_KEY = 'ujaasLastAttemptResultId';
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

const apiTestToPublished = (t: ApiTest): PublishedTest => ({
  id: t.id,
  title: t.title,
  format: t.format || 'Custom',
  batches: t.batches.map(b => b.name),
  duration: t.duration_minutes,
  totalMarks: t.total_marks,
  questionCount: t.question_count,
  enrolledCount: t.enrolled_count,
  scheduleDate: t.schedule_date || '',
  scheduleTime: t.schedule_time || '',
  instructions: t.instructions || undefined,
  status: t.status,
  submittedAttemptCount: t.submitted_attempt_count,
  maxAttempts: t.submitted_attempt_count !== undefined ? 3 : undefined,
  hasActiveAttempt: t.has_active_attempt,
  activeAttemptId: t.active_attempt_id ?? null,
  latestAttemptId: t.latest_attempt_id ?? null,
  latestAttemptSubmittedAt: t.latest_attempt_submitted_at ?? null,
  latestAttemptTimeSpent: t.latest_attempt_time_spent ?? null,
  questions: (t.questions || []).map((q) => ({
    id: q.id,
    type: q.type,
    subject: q.subject,
    question: q.question_text,
    questionImage: q.question_img || undefined,
    options: q.options || undefined,
    optionImages: q.option_imgs || undefined,
    correctAnswer: parseQuestionCorrectAnswer(q.type, q.correct_answer),
    marks: q.marks,
    negativeMarks: q.neg_marks,
    explanation: q.explanation || undefined,
    explanationImage: q.explanation_img || undefined,
    difficulty: q.difficulty || undefined,
    metadata: { section: q.section || undefined },
  })),
});

function mapAttemptResultToAnalytics(result: ApiAttemptResult) {
  return {
    ...result,
    questions: result.questions.map((question) => ({
      id: question.id,
      text: question.question_text,
      question: question.question_text,
      questionImage: question.question_img || undefined,
      options: question.options || undefined,
      optionImages: question.option_imgs || undefined,
      correctAnswer: parseQuestionCorrectAnswer(question.type, question.correct_answer),
      subject: question.subject,
      marks: question.marks,
      type: question.type,
      metadata: { section: question.section || undefined },
      explanation: question.explanation || undefined,
      explanationImage: question.explanation_img || undefined,
      userAnswer: question.user_answer,
    })),
  };
}

async function preloadTestAssets(questions: PublishedTest['questions']) {
  const imageSources = questions.flatMap((question) => [
    question.questionImage,
    question.explanationImage,
    ...(question.optionImages || []),
  ]).filter((value): value is string => Boolean(value));

  await Promise.all(imageSources.map((src) => {
    if (src.startsWith('data:')) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = src;
    });
  }));
}

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
  const [studentTests, setStudentTests] = useState<PublishedTest[]>(publishedTests);
  const [attemptResults, setAttemptResults] = useState<ApiStudentAttemptResultListItem[]>([]);
  const [isStartingTest, setIsStartingTest] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [loadingOverviewTestId, setLoadingOverviewTestId] = useState<string | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [loadingAnalysisAttemptId, setLoadingAnalysisAttemptId] = useState<string | null>(null);
  const pendingSubTabRef = useRef<string | null>(null);
  const analyticsRequestRef = useRef(0);

  useEffect(() => {
    setStudentTests(publishedTests);
  }, [publishedTests]);

  useEffect(() => {
    onStateChange(testState.mode);
  }, [testState.mode, onStateChange]);

  const patchAttemptSummary = useCallback(async (testId: string) => {
    const summary = await fetchMyTestAttemptSummary(testId);
    setStudentTests((prev) => prev.map((test) => (
      test.id === testId
        ? {
            ...test,
            submittedAttemptCount: summary.submittedAttemptCount,
            maxAttempts: summary.maxAttempts,
            hasActiveAttempt: summary.hasActiveAttempt,
            activeAttemptId: summary.activeAttempt?.id ?? null,
            latestAttemptId: summary.history[0]?.id ?? null,
            latestAttemptSubmittedAt: summary.history[0]?.submitted_at ?? null,
            latestAttemptTimeSpent: summary.history[0]?.time_spent ?? null,
          }
        : test
    )));
    return summary;
  }, []);

  const openAttemptAnalytics = useCallback(async (attemptId: string) => {
    const requestId = analyticsRequestRef.current + 1;
    analyticsRequestRef.current = requestId;

    try {
      setLoadingAnalysisAttemptId(attemptId);
      const result = await fetchAttemptResult(attemptId);
      if (analyticsRequestRef.current !== requestId) {
        return;
      }
      const summary = await fetchMyTestAttemptSummary(result.testId).catch(() => null);
      if (analyticsRequestRef.current !== requestId) {
        return;
      }
      localStorage.setItem(LAST_RESULT_STORAGE_KEY, attemptId);
      setTestState({ mode: 'analytics', result, history: summary?.history || [] });
      window.scrollTo({ top: 0, behavior: 'auto' });
      pendingSubTabRef.current = `Analysis-${attemptId}`;
      onNavigateSubTab?.(pendingSubTabRef.current);
    } finally {
      if (analyticsRequestRef.current === requestId) {
        setLoadingAnalysisAttemptId(null);
      }
    }
  }, [onNavigateSubTab]);

  const hydrateActiveAttempt = useCallback(async (mode: 'overview' | 'taking') => {
    const stored = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!stored) {
      onNavigateSubTab?.(undefined);
      return;
    }

    try {
      const session = JSON.parse(stored) as { testId: string };
      const payload = await startMyTestAttempt(session.testId);
      const fullTest = apiTestToPublished(payload.test);
      const nextState = mode === 'overview'
        ? { mode: 'overview' as const, test: fullTest }
        : {
            mode: 'taking' as const,
            test: fullTest,
            attemptId: payload.attempt.id,
            initialAnswers: payload.attempt.answers || {},
            deadlineAt: payload.attempt.deadline_at,
            serverNow: payload.serverNow,
          };

      setTestState(nextState);
    } catch {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      onNavigateSubTab?.(undefined);
    }
  }, [onNavigateSubTab]);

  const loadAttemptResults = useCallback(async () => {
    setIsLoadingResults(true);
    try {
      const results = await fetchMyAttemptResults();
      setAttemptResults(results);
      return results;
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    void loadAttemptResults().catch(() => undefined);
  }, [loadAttemptResults]);

  useEffect(() => {
    const syncFromRoute = async () => {
      if (subTab && pendingSubTabRef.current === subTab) {
        pendingSubTabRef.current = null;
      }

      if (!subTab || subTab === 'list') {
        if (!subTab && pendingSubTabRef.current) {
          return;
        }
        if (testState.mode !== 'list') {
          setTestState({ mode: 'list' });
        }
        return;
      }

      if (subTab.startsWith('Analysis')) {
        const attemptId = subTab.startsWith('Analysis-')
          ? subTab.replace('Analysis-', '')
          : localStorage.getItem(LAST_RESULT_STORAGE_KEY);

        if (!attemptId) {
          onNavigateSubTab?.(undefined);
          return;
        }

        await openAttemptAnalytics(attemptId);
        return;
      }

      if (subTab.startsWith('Overview')) {
        if (testState.mode !== 'overview') {
          const stored = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
          if (stored) {
            await hydrateActiveAttempt('overview');
          }
        }
        return;
      }

      if (subTab.startsWith('Test')) {
        if (testState.mode !== 'taking') {
          await hydrateActiveAttempt('taking');
        }
        return;
      }

      if (subTab === 'Results') {
        await loadAttemptResults();
        if (testState.mode !== 'viewResults') {
          setTestState({ mode: 'viewResults' });
        }
      }
    };

    void syncFromRoute();
  }, [subTab, testState.mode, hydrateActiveAttempt, loadAttemptResults, onNavigateSubTab, openAttemptAnalytics]);

  useEffect(() => {
    if (testState.mode !== 'taking') return;

    const attemptId = testState.attemptId;
    const token = localStorage.getItem('ujaasToken');

    const handleBeforeUnload = () => {
      void fetch(`${API_BASE_URL}/api/tests/attempts/${attemptId}/submit`, {
        method: 'POST',
        keepalive: true,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          autoSubmitted: true,
        }),
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testState]);

  const handleStartTest = async (test: PublishedTest) => {
    if (loadingOverviewTestId) return;

    try {
      setLoadingOverviewTestId(test.id);
      setIsLoadingOverview(true);
      const fullApiTest = await fetchTestById(test.id);
      const fullTest = apiTestToPublished(fullApiTest);

      setStudentTests((prev) => prev.map((item) => (
        item.id === fullTest.id
          ? {
              ...item,
              ...fullTest,
            }
          : item
      )));

      setTestState({ mode: 'overview', test: fullTest });
      pendingSubTabRef.current = `Overview-${slugify(fullTest.title)}`;
      onNavigateSubTab?.(pendingSubTabRef.current);
    } catch (error: any) {
      window.alert(error?.message || 'Unable to load test overview');
    } finally {
      setIsLoadingOverview(false);
      setLoadingOverviewTestId(null);
    }
  };

  const handleConfirmStart = async () => {
    if (testState.mode !== 'overview' || isStartingTest) return;

    try {
      setIsStartingTest(true);
      const payload: ApiActiveAttemptPayload = await startMyTestAttempt(testState.test.id);
      const fullTest = apiTestToPublished(payload.test);

      await preloadTestAssets(fullTest.questions);

      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify({
        testId: fullTest.id,
        attemptId: payload.attempt.id,
      }));

      setStudentTests((prev) => prev.map((test) => (
        test.id === fullTest.id
          ? {
              ...test,
              questions: fullTest.questions,
              questionCount: fullTest.questionCount,
              hasActiveAttempt: true,
              activeAttemptId: payload.attempt.id,
              submittedAttemptCount: payload.submittedAttemptCount,
              maxAttempts: payload.maxAttempts,
            }
          : test
      )));

      setTestState({
        mode: 'taking',
        test: fullTest,
        attemptId: payload.attempt.id,
        initialAnswers: payload.attempt.answers || {},
        deadlineAt: payload.attempt.deadline_at,
        serverNow: payload.serverNow,
      });
      pendingSubTabRef.current = `Test-${slugify(fullTest.title)}`;
      onNavigateSubTab?.(pendingSubTabRef.current);
    } catch (error: any) {
      window.alert(error?.message || 'Unable to start this test');
    } finally {
      setIsStartingTest(false);
    }
  };

  const handleSaveProgress = async (answers: Record<string, StudentAnswer>) => {
    if (testState.mode !== 'taking') return;
    try {
      await saveMyAttemptProgress(testState.attemptId, answers);
    } catch (error) {
      console.error('Failed to save attempt progress', error);
    }
  };

  const handleCompleteTest = async (
    answers: Record<string, StudentAnswer>,
    options?: { autoSubmitted?: boolean }
  ) => {
    if (testState.mode !== 'taking') return;

    try {
      const result = await submitMyAttempt(testState.attemptId, answers, Boolean(options?.autoSubmitted));
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      localStorage.setItem(LAST_RESULT_STORAGE_KEY, result.attempt_id);
      await patchAttemptSummary(testState.test.id);
      await loadAttemptResults();
      setTestState({ mode: 'analytics', result });
      pendingSubTabRef.current = `Analysis-${result.attempt_id}`;
      onNavigateSubTab?.(pendingSubTabRef.current);
    } catch (error: any) {
      window.alert(error?.message || 'Unable to submit test');
    }
  };

  const handleBackToList = () => {
    analyticsRequestRef.current += 1;
    setLoadingAnalysisAttemptId(null);
    pendingSubTabRef.current = null;
    setTestState({ mode: 'list' });
    window.scrollTo({ top: 0, behavior: 'auto' });
    onNavigateSubTab?.(undefined);
  };

  const currentTests = useMemo(() => studentTests, [studentTests]);

  if (testState.mode === 'overview' && testState.test) {
    return (
      <TestOverview
        test={testState.test}
        onStart={handleConfirmStart}
        onBack={handleBackToList}
        isStarting={isStartingTest}
        isLoadingOverview={isLoadingOverview}
      />
    );
  }

  if (testState.mode === 'taking' && testState.test) {
    return (
      <StudentTestTaking
        testId={testState.test.id}
        testTitle={testState.test.title}
        duration={testState.test.duration}
        questions={testState.test.questions}
        onSubmit={handleCompleteTest}
        onExit={handleBackToList}
        initialAnswers={testState.initialAnswers}
        deadlineAt={testState.deadlineAt}
        serverNow={testState.serverNow}
        onSaveProgress={handleSaveProgress}
      />
    );
  }

  if (testState.mode === 'analytics' && testState.result) {
    return (
      <StudentAnalytics
        result={mapAttemptResultToAnalytics(testState.result)}
        attemptHistory={testState.history || []}
        onSelectAttempt={(attemptId) => {
          void openAttemptAnalytics(attemptId);
        }}
        loadingAttemptId={loadingAnalysisAttemptId}
        onClose={handleBackToList}
      />
    );
  }

  if (testState.mode === 'viewResults') {
    return (
      <ViewResults
        results={attemptResults}
        onClose={handleBackToList}
        loadingAttemptId={loadingAnalysisAttemptId}
        isLoading={isLoadingResults}
        onViewDetailedAnalytics={(attemptId) => {
          void openAttemptAnalytics(attemptId);
        }}
      />
    );
  }

  return (
    <TestSeriesSection
      onStartTest={handleStartTest}
      onViewAnalytics={(attemptId) => {
        if (attemptId) {
          void openAttemptAnalytics(attemptId);
        }
      }}
      onViewResults={() => {
        void loadAttemptResults();
        setTestState({ mode: 'viewResults' });
        pendingSubTabRef.current = 'Results';
        onNavigateSubTab?.(pendingSubTabRef.current);
      }}
      publishedTests={currentTests}
      loadingOverviewTestId={loadingOverviewTestId}
      loadingAnalysisAttemptId={loadingAnalysisAttemptId}
      isLoadingResults={isLoadingResults}
      attemptResults={attemptResults}
    />
  );
}

function TestOverview({
  test,
  onStart,
  onBack,
  isStarting = false,
  isLoadingOverview = false
}: {
  test: PublishedTest;
  onStart: () => void;
  onBack: () => void;
  isStarting?: boolean;
  isLoadingOverview?: boolean;
}) {
  const questions = Array.isArray(test.questions) ? test.questions : [];

  const breakdown = useMemo(() => {
    const stats: Record<string, Record<string, { count: number, marks: number, neg: number }>> = {};

    questions.forEach(q => {
      const sub = q.subject || 'Default';
      const sec = q.metadata?.section || 'Section A';

      if (!stats[sub]) stats[sub] = {};
      if (!stats[sub][sec]) {
        stats[sub][sec] = { count: 0, marks: q.marks || 0, neg: q.negativeMarks || 0 };
      }

      stats[sub][sec].count++;
    });

    return stats;
  }, [questions]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 text-white">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-teal-100 hover:text-white mb-6 font-bold transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to List
          </button>
          <h1 className="text-3xl font-bold mb-2">{test.title}</h1>
          <div className="flex flex-wrap gap-6 text-teal-50">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{test.duration} Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="font-medium">{questions.length} Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span className="font-medium">{test.totalMarks} Maximum Marks</span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-12">
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-teal-600" />
              Question Breakdown & Marking Scheme
            </h3>
            {isLoadingOverview ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Loading question breakdown...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wider">Section</th>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wider text-center">Questions</th>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wider text-center text-green-600">Positive</th>
                      <th className="px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wider text-center text-red-600">Negative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(breakdown).map(([subject, sections]) => (
                      Object.entries(sections).map(([section, data], idx) => (
                        <tr key={`${subject}-${section}`} className="hover:bg-gray-50/50">
                          {idx === 0 ? (
                            <td className="px-4 py-4 font-bold text-gray-900 border-r border-gray-100" rowSpan={Object.keys(sections).length}>
                              {subject}
                            </td>
                          ) : null}
                          <td className="px-4 py-4 text-gray-600 font-medium">{section}</td>
                          <td className="px-4 py-4 text-center font-bold text-gray-900">{data.count}</td>
                          <td className="px-4 py-4 text-center font-bold text-green-600">+{data.marks}</td>
                          <td className="px-4 py-4 text-center font-bold text-red-600">-{data.neg}</td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="p-8 bg-amber-50 rounded-3xl border border-amber-100 shadow-sm">
            <h3 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              General Instructions
            </h3>
            <div className="text-amber-800 space-y-4 leading-relaxed font-semibold">
              {(test.instructions || "1. Ensure you have a stable internet connection.\n2. Do not refresh or close the tab during the test.\n3. The test will automatically submit when the timer ends.\n4. Use of unfair means will lead to disqualification.")
                .split('\n')
                .map((point, i) => point.trim() && (
                  <div key={i} className="flex gap-3">
                    <span className="shrink-0">-</span>
                    <p>{point.trim()}</p>
                  </div>
                ))
              }
            </div>
          </section>

          <div className="flex flex-col items-center gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              disabled={isStarting}
              className="w-full sm:w-64 py-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-70 disabled:cursor-wait"
            >
              <Play className="w-6 h-6 fill-current" />
              {isStarting ? 'Loading Test...' : 'Confirm & Start Test'}
            </motion.button>
            <p className="text-sm text-gray-500 font-medium italic">
              By clicking start, the full test will be loaded before the timer begins.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
