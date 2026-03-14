import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentTestTaking } from './StudentTestTaking';
import { StudentAnalytics, type AnalyticsDetailedResult, type AnalyticsResult } from './StudentAnalytics';
import {
  fetchDppAttemptResult,
  fetchDppAttemptQuestionExplanation,
  fetchDppAttemptSummaryResult,
  fetchMyDppAttemptSummary,
  submitMyDppAttempt,
  type ApiDppAttemptHistoryEntry,
  type ApiDppAttemptResult,
  type ApiDppAttemptSummaryResult,
  type ApiStartDppAttemptPayload,
} from '../api/dpps';

type StudentAnswer = string | number | number[] | null;

export type DppPracticeSession =
  | { mode: 'attempt'; payload: ApiStartDppAttemptPayload }
  | { mode: 'result'; result: ApiDppAttemptSummaryResult; history: ApiDppAttemptHistoryEntry[] };

interface DPPPracticeProps {
  session: DppPracticeSession;
  onExit: () => void;
  onSessionChange?: (session: DppPracticeSession) => void;
}

function mapQuestions(payload: ApiStartDppAttemptPayload) {
  return (payload.dpp.questions || []).map((question) => ({
    id: question.id,
    question: question.question_text,
    options: question.options || undefined,
    optionImages: question.option_imgs || undefined,
    questionImage: question.question_img || undefined,
    correctAnswer:
      question.type === 'MCQ'
        ? Number(question.correct_answer)
        : question.type === 'MSQ'
          ? (() => {
              try {
                const parsed = JSON.parse(question.correct_answer);
                return Array.isArray(parsed) ? parsed.map((value) => Number(value)) : [];
              } catch {
                return [];
              }
            })()
          : question.correct_answer,
    subject: question.subject,
    marks: question.marks,
    type: question.type,
    explanation: question.explanation || undefined,
    explanationImage: question.explanation_img || undefined,
    metadata: { section: question.section || undefined },
  }));
}

function mapDppAttemptSummaryToAnalytics(result: ApiDppAttemptSummaryResult): AnalyticsResult {
  return {
    attempt_id: result.attempt_id,
    testId: result.dppId,
    testTitle: result.dppTitle,
    totalMarks: result.totalMarks,
    obtainedMarks: result.obtainedMarks,
    totalQuestions: result.totalQuestions,
    correctAnswers: result.correctAnswers,
    wrongAnswers: result.wrongAnswers,
    unattempted: result.unattempted,
    timeSpent: 0,
    duration: 0,
    submittedAt: result.submittedAt,
    instructions: result.instructions,
  };
}

function mapDppAttemptResultToAnalytics(result: ApiDppAttemptResult): AnalyticsDetailedResult {
  return {
    ...mapDppAttemptSummaryToAnalytics(result),
    questions: result.questions.map((question) => ({
      id: question.id,
      text: question.question_text,
      question: question.question_text,
      questionImage: question.question_img || undefined,
      options: question.options || undefined,
      optionImages: question.option_imgs || undefined,
      correctAnswer:
        question.type === 'MCQ'
          ? Number(question.correct_answer)
          : question.type === 'MSQ'
            ? (() => {
                try {
                  const parsed = JSON.parse(question.correct_answer);
                  return Array.isArray(parsed) ? parsed.map((value) => Number(value)) : [];
                } catch {
                  return [];
                }
              })()
            : question.correct_answer,
      subject: question.subject,
      marks: question.marks,
      type: question.type,
      metadata: { section: question.section || undefined },
      userAnswer: question.user_answer,
    })),
  };
}

export function DPPPractice({ session, onExit, onSessionChange }: DPPPracticeProps) {
  const [payload, setPayload] = useState<ApiStartDppAttemptPayload | null>(session.mode === 'attempt' ? session.payload : null);
  const [hasStarted, setHasStarted] = useState(session.mode === 'attempt' ? !(session.payload.dpp.instructions || '').trim() : false);
  const [result, setResult] = useState<ApiDppAttemptSummaryResult | null>(session.mode === 'result' ? session.result : null);
  const [history, setHistory] = useState<ApiDppAttemptHistoryEntry[]>(session.mode === 'result' ? session.history : session.mode === 'attempt' ? session.payload.history || [] : []);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAttemptId, setLoadingAttemptId] = useState<string | null>(null);
  const questions = useMemo(() => (payload ? mapQuestions(payload) : []), [payload]);

  useEffect(() => {
    if (session.mode === 'attempt') {
      setPayload(session.payload);
      setHasStarted(!(session.payload.dpp.instructions || '').trim());
      setResult(null);
      setHistory(session.payload.history || []);
      return;
    }

    setPayload(null);
    setResult(session.result);
    setHistory(session.history || []);
  }, [session]);

  const syncResultSession = (nextResult: ApiDppAttemptSummaryResult, nextHistory: ApiDppAttemptHistoryEntry[]) => {
    onSessionChange?.({
      mode: 'result',
      result: nextResult,
      history: nextHistory,
    });
  };

  const handleSubmit = async (answers: Record<string, StudentAnswer>) => {
    if (!payload) return;

    try {
      setSubmitting(true);
      const submitted = await submitMyDppAttempt(payload.dpp.id, answers);
      setResult(submitted);
      syncResultSession(submitted, history);

      void fetchMyDppAttemptSummary(payload.dpp.id)
        .then((summary) => {
          const nextHistory = summary?.history || [];
          setHistory(nextHistory);
          syncResultSession(submitted, nextHistory);
        })
        .catch(() => undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAttempt = async (attemptId: string) => {
    try {
      setLoadingAttemptId(attemptId);
      const selected = await fetchDppAttemptSummaryResult(attemptId);
      setResult(selected);
      syncResultSession(selected, history);
    } finally {
      setLoadingAttemptId(null);
    }
  };

  if (result) {
    return (
      <StudentAnalytics
        result={mapDppAttemptSummaryToAnalytics(result)}
        onClose={onExit}
        hideRank={true}
        hideTimeSpent={true}
        hideDownload={true}
        subtitle="DPP Performance Summary"
        loadingAttemptId={loadingAttemptId}
        attemptHistory={history as any}
        loadQuestionExplanation={fetchDppAttemptQuestionExplanation as any}
        loadDetailedReview={(attemptId) => fetchDppAttemptResult(attemptId).then(mapDppAttemptResultToAnalytics)}
        onSelectAttempt={(attemptId) => {
          void handleSelectAttempt(attemptId);
        }}
      />
    );
  }

  if (!payload) return null;

  return (
    <AnimatePresence mode="wait">
      {!hasStarted ? (
        <motion.div
          key="instructions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-[100dvh] overflow-hidden bg-[oklch(0.98_0.02_196.85)]"
        >
          <div className="flex h-full items-center justify-center px-4 py-4 sm:px-6">
            <div className="w-full max-w-4xl rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{payload.dpp.title}</h2>
                    <p className="text-gray-600">
                      {payload.dpp.subject_name} • {payload.dpp.chapter_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onExit}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                  Back
                </button>
              </div>

              <div className="rounded-2xl bg-gray-50 p-6 text-gray-800 whitespace-pre-wrap leading-7">
                {payload.dpp.instructions}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>{payload.dpp.question_count} questions</span>
                <span>Attempts used: {payload.submittedAttemptCount}/{payload.maxAttempts}</span>
                <span>Attempts left: {payload.remainingAttempts}</span>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setHasStarted(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 font-bold text-white shadow-lg hover:shadow-xl"
                >
                  Continue to DPP
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div key="attempt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <StudentTestTaking
            testId={payload.dpp.id}
            testTitle={payload.dpp.title}
            duration={0}
            questions={questions as any}
            onSubmit={handleSubmit as any}
            onExit={onExit}
            initialAnswers={{}}
            enableTimer={false}
            showMarksMeta={false}
          />
          {submitting && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="rounded-2xl bg-white px-6 py-5 shadow-xl">
                <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Submitting your DPP...
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
