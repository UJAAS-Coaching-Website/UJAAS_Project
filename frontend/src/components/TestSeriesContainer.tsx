import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TestSeriesSection } from './TestSeriesSection';
import { StudentTestTaking } from './StudentTestTaking';
import { StudentAnalytics } from './StudentAnalytics';
import { ViewResults } from './ViewResults';
import { TestOverview } from './test-series/TestOverview';
import { User, PublishedTest } from '../App';
import { API_BASE_URL } from '../api/base';
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
} from '../api/tests';
import {
  mapApiAttemptResultToAnalytics,
  mapApiTestToPublished as apiTestToPublished,
} from '../utils/testMappings';
import { preloadTestAssets, slugifyText } from '../utils/testSession';
import { getDeviceId } from '../utils/deviceId';

type StudentAnswer = string | number | number[] | null;

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
const AUTO_SUBMIT_PENDING_KEY = 'ujaasAutoSubmitPending';
const ANSWER_FLAG_PREFIX = 'ujaasTestHasAnswer:';
const ANSWER_STORAGE_PREFIX = 'ujaasTestAnswers:';

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
  const previousResultsSubTabRef = useRef<string | null>(null);
  const previousResultsScrollRef = useRef<number | null>(null);
  const lastNonResultsSubTabRef = useRef<string | null>(null);
  const previousResultsStateRef = useRef<TestState | null>(null);
  const analyticsOriginRef = useRef<'results' | 'list'>('list');
  const isAliveRef = useRef(true);

  useEffect(() => {
    return () => {
      isAliveRef.current = false;
      analyticsRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    setStudentTests(publishedTests);
  }, [publishedTests]);

  useEffect(() => {
    onStateChange(testState.mode);
  }, [testState.mode, onStateChange]);

  const patchAttemptSummary = useCallback(async (testId: string) => {
    const summary = await fetchMyTestAttemptSummary(testId);
    if (!isAliveRef.current) return summary;
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
      if (!isAliveRef.current) return;
      setLoadingAnalysisAttemptId(attemptId);
      const result = await fetchAttemptResult(attemptId);
      if (analyticsRequestRef.current !== requestId || !isAliveRef.current) {
        return;
      }
      const summary = await fetchMyTestAttemptSummary(result.testId).catch(() => null);
      if (analyticsRequestRef.current !== requestId || !isAliveRef.current) {
        return;
      }
      localStorage.setItem(LAST_RESULT_STORAGE_KEY, attemptId);
      setTestState({ mode: 'analytics', result, history: summary?.history || [] });
      window.scrollTo({ top: 0, behavior: 'auto' });
      pendingSubTabRef.current = `Analysis-${attemptId}`;
      onNavigateSubTab?.(pendingSubTabRef.current);
    } finally {
      if (analyticsRequestRef.current === requestId && isAliveRef.current) {
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
      // Clear any stale auto-submit marker from previous versions
      localStorage.removeItem(AUTO_SUBMIT_PENDING_KEY);
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

      if (!isAliveRef.current) return;
      setTestState(nextState);
    } catch {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      onNavigateSubTab?.(undefined);
    }
  }, [onNavigateSubTab]);

  const loadAttemptResults = useCallback(async () => {
    if (!isAliveRef.current) return [];
    setIsLoadingResults(true);
    try {
      const results = await fetchMyAttemptResults();
      if (!isAliveRef.current) return results;
      setAttemptResults(results);
      return results;
    } finally {
      if (isAliveRef.current) {
        setIsLoadingResults(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadAttemptResults().catch(() => undefined);
  }, [loadAttemptResults]);

  useEffect(() => {
    if (subTab && subTab !== 'Results') {
      lastNonResultsSubTabRef.current = subTab;
    }
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

        if (testState.mode === 'analytics' && testState.result?.attempt_id === attemptId) {
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
        if (testState.mode === 'viewResults') {
          return;
        }

        if (!previousResultsSubTabRef.current) {
          previousResultsSubTabRef.current = lastNonResultsSubTabRef.current || 'list';
        }
        if (!previousResultsStateRef.current) {
          previousResultsStateRef.current = testState;
        }
        await loadAttemptResults();
        setTestState({ mode: 'viewResults' });
      }
    };

    void syncFromRoute();
  }, [subTab, testState.mode, hydrateActiveAttempt, loadAttemptResults, onNavigateSubTab, openAttemptAnalytics]);

  // Save progress eagerly on beforeunload so answers persist across refresh
  useEffect(() => {
    if (testState.mode !== 'taking') return;

    const attemptId = testState.attemptId;
    const token = localStorage.getItem('ujaasToken');

    const handleBeforeUnload = () => {
      const hasAnswer = localStorage.getItem(`${ANSWER_FLAG_PREFIX}${attemptId}`) === '1';
      if (!hasAnswer) return;
      let cachedAnswers: Record<string, StudentAnswer> | undefined;
      const storedAnswers = localStorage.getItem(`${ANSWER_STORAGE_PREFIX}${attemptId}`);
      if (storedAnswers) {
        try {
          cachedAnswers = JSON.parse(storedAnswers);
        } catch {
          cachedAnswers = undefined;
        }
      }
      if (cachedAnswers) {
        // Fire-and-forget progress save (NOT submit) so answers survive refresh
        void fetch(`${API_BASE_URL}/api/tests/attempts/${attemptId}/progress`, {
          method: 'PATCH',
          keepalive: true,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Device-Id': getDeviceId(),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ answers: cachedAnswers }),
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testState]);

  const handleStartTest = async (test: PublishedTest) => {
    if (loadingOverviewTestId) return;

    try {
      if (!isAliveRef.current) return;
      setLoadingOverviewTestId(test.id);
      setIsLoadingOverview(true);
      const fullApiTest = await fetchTestById(test.id);
      const fullTest = apiTestToPublished(fullApiTest);

      if (!isAliveRef.current) return;
      setStudentTests((prev) => prev.map((item) => (
        item.id === fullTest.id
          ? {
            ...item,
            ...fullTest,
          }
          : item
      )));

      setTestState({ mode: 'overview', test: fullTest });
      window.scrollTo({ top: 0, behavior: 'auto' });
      pendingSubTabRef.current = `Overview-${slugifyText(fullTest.title)}`;
      onNavigateSubTab?.(pendingSubTabRef.current);
    } catch (error: any) {
      window.alert(error?.message || 'Unable to load test overview');
    } finally {
      if (isAliveRef.current) {
        setIsLoadingOverview(false);
        setLoadingOverviewTestId(null);
      }
    }
  };

  const handleConfirmStart = async () => {
    if (testState.mode !== 'overview' || isStartingTest) return;

    try {
      if (!isAliveRef.current) return;
      setIsStartingTest(true);
      const payload: ApiActiveAttemptPayload = await startMyTestAttempt(testState.test.id);
      const fullTest = apiTestToPublished(payload.test);

      await preloadTestAssets(fullTest.questions);

      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify({
        testId: fullTest.id,
        attemptId: payload.attempt.id,
      }));

      if (!isAliveRef.current) return;
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
      pendingSubTabRef.current = `Test-${slugifyText(fullTest.title)}`;
      onNavigateSubTab?.(pendingSubTabRef.current);
    } catch (error: any) {
      window.alert(error?.message || 'Unable to start this test');
    } finally {
      if (isAliveRef.current) {
        setIsStartingTest(false);
      }
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
      localStorage.removeItem(AUTO_SUBMIT_PENDING_KEY);
      localStorage.removeItem(`${ANSWER_FLAG_PREFIX}${testState.attemptId}`);
      localStorage.removeItem(`${ANSWER_STORAGE_PREFIX}${testState.attemptId}`);
      localStorage.setItem(LAST_RESULT_STORAGE_KEY, result.attempt_id);
      await patchAttemptSummary(testState.test.id);
      await loadAttemptResults();
      setTestState({ mode: 'analytics', result });
      pendingSubTabRef.current = `Analysis-${result.attempt_id}`;
      onNavigateSubTab?.(pendingSubTabRef.current);
    } catch (error: any) {
      const message = error?.message || 'Unable to submit test';
      const shouldRecoverToLatestAttempt = Boolean(options?.autoSubmitted)
        && typeof message === 'string'
        && message.toLowerCase().includes('active attempt not found');

      if (shouldRecoverToLatestAttempt) {
        try {
          localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
          localStorage.removeItem(AUTO_SUBMIT_PENDING_KEY);
          localStorage.removeItem(`${ANSWER_FLAG_PREFIX}${testState.attemptId}`);
          localStorage.removeItem(`${ANSWER_STORAGE_PREFIX}${testState.attemptId}`);
          const summary = await patchAttemptSummary(testState.test.id).catch(() => fetchMyTestAttemptSummary(testState.test.id));
          const latestAttemptId = summary.history[0]?.id;

          if (latestAttemptId) {
            await loadAttemptResults().catch(() => undefined);
            await openAttemptAnalytics(latestAttemptId);
            return;
          }
        } catch (recoveryError) {
          console.error('Failed to recover auto-submitted attempt', recoveryError);
        }
      }

      window.alert(message);
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

  const handleBackFromAnalytics = () => {
    if (analyticsOriginRef.current === 'results') {
      analyticsOriginRef.current = 'list';
      setTestState({ mode: 'viewResults' });
      pendingSubTabRef.current = 'Results';
      onNavigateSubTab?.(pendingSubTabRef.current);
      const scrollTarget = previousResultsScrollRef.current;
      if (scrollTarget !== null) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollTarget, behavior: 'auto' });
        });
      }
      return;
    }
    handleBackToList();
  };

  const handleBackFromResults = () => {
    const previousSubTab = previousResultsSubTabRef.current;
    const previousState = previousResultsStateRef.current;
    const previousScroll = previousResultsScrollRef.current;

    previousResultsSubTabRef.current = null;
    previousResultsStateRef.current = null;
    previousResultsScrollRef.current = null;

    if (previousState) {
      setTestState(previousState);
      if (previousState.mode === 'analytics' && previousState.result?.attempt_id) {
        onNavigateSubTab?.(`Analysis-${previousState.result.attempt_id}`);
      } else if (previousState.mode === 'overview') {
        onNavigateSubTab?.(`Overview-${slugifyText(previousState.test.title)}`);
      } else if (previousState.mode === 'taking') {
        onNavigateSubTab?.(`Test-${slugifyText(previousState.test.title)}`);
      } else {
        onNavigateSubTab?.(previousSubTab === 'list' ? undefined : previousSubTab || undefined);
      }
      if (previousScroll !== null) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: previousScroll, behavior: 'auto' });
        });
      }
      return;
    }

    if (previousSubTab && previousSubTab !== 'Results') {
      onNavigateSubTab?.(previousSubTab === 'list' ? undefined : previousSubTab);
      return;
    }

    handleBackToList();
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
        attemptId={testState.attemptId}
        testTitle={testState.test.title}
        duration={testState.test.duration}
        format={testState.test.format}
        questions={testState.test.questions}
        onSubmit={handleCompleteTest}
        onExit={handleBackToList}
        initialAnswers={testState.initialAnswers}
        deadlineAt={testState.deadlineAt}
        serverNow={testState.serverNow}
        onSaveProgress={handleSaveProgress}
        outerPaddingClassName="p-2 pb-3"
      />
    );
  }

  if (testState.mode === 'analytics' && testState.result) {
    return (
      <StudentAnalytics
        result={mapApiAttemptResultToAnalytics(testState.result)}
        attemptHistory={testState.history || []}
        onSelectAttempt={(attemptId) => {
          void openAttemptAnalytics(attemptId);
        }}
        loadingAttemptId={loadingAnalysisAttemptId}
        onClose={handleBackFromAnalytics}
      />
    );
  }

  if (testState.mode === 'viewResults') {
    return (
      <ViewResults
        results={attemptResults}
        onClose={handleBackFromResults}
        loadingAttemptId={loadingAnalysisAttemptId}
        isLoading={isLoadingResults}
        onViewDetailedAnalytics={(attemptId) => {
          analyticsOriginRef.current = 'results';
          previousResultsScrollRef.current = window.scrollY;
          void openAttemptAnalytics(attemptId);
        }}
      />
    );
  }

  return (
    <TestSeriesSection
      loading={currentTests.length === 0 && isLoadingResults}
      onStartTest={handleStartTest}
      onViewAnalytics={(attemptId) => {
        if (attemptId) {
          analyticsOriginRef.current = 'list';
          void openAttemptAnalytics(attemptId);
        }
      }}
      onViewResults={() => {
        previousResultsScrollRef.current = window.scrollY;
        previousResultsStateRef.current = testState;
        void loadAttemptResults();
        previousResultsSubTabRef.current = pendingSubTabRef.current || subTab || 'list';
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
