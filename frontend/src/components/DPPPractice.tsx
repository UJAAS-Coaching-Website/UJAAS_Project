import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentTestTaking } from './StudentTestTaking';
import { TestPreviewAndReview } from './TestPreviewAndReview';
import { StudentAnalytics } from './StudentAnalytics';
import {
  fetchDppAttemptResult,
  fetchDppAttemptQuestionExplanation,
  fetchMyDppAttemptSummary,
  submitMyDppAttempt,
  type ApiDppAttemptHistoryEntry,
  type ApiDppAttemptResult,
  type ApiStartDppAttemptPayload,
} from '../api/dpps';

type StudentAnswer = string | number | number[] | null;

export type DppPracticeSession =
  | { mode: 'attempt'; payload: ApiStartDppAttemptPayload }
  | { mode: 'result'; result: ApiDppAttemptResult; history: ApiDppAttemptHistoryEntry[]; reviewOpen?: boolean };

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

function mapReviewQuestions(result: ApiDppAttemptResult) {
  return result.questions.map((question) => ({
    id: question.id,
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
    explanation: question.explanation || undefined,
    explanationImage: question.explanation_img || undefined,
  }));
}

function mapReviewAnswers(result: ApiDppAttemptResult) {
  return result.questions.reduce<Record<string, StudentAnswer>>((acc, question) => {
    acc[question.id] = question.user_answer;
    return acc;
  }, {});
}

export function DPPPractice({ session, onExit, onSessionChange }: DPPPracticeProps) {
  const [payload, setPayload] = useState<ApiStartDppAttemptPayload | null>(session.mode === 'attempt' ? session.payload : null);
  const [hasStarted, setHasStarted] = useState(session.mode === 'attempt' ? !(session.payload.dpp.instructions || '').trim() : false);
  const [result, setResult] = useState<ApiDppAttemptResult | null>(session.mode === 'result' ? session.result : null);
  const [history, setHistory] = useState<ApiDppAttemptHistoryEntry[]>(session.mode === 'result' ? session.history : session.mode === 'attempt' ? session.payload.history || [] : []);
  const [reviewOpen, setReviewOpen] = useState(session.mode === 'result' ? Boolean(session.reviewOpen) : false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAttemptId, setLoadingAttemptId] = useState<string | null>(null);
  const questions = useMemo(() => (payload ? mapQuestions(payload) : []), [payload]);

  useEffect(() => {
    if (session.mode === 'result') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [session.mode, session.mode === 'result' ? session.result.attempt_id : null]);

  useEffect(() => {
    if (session.mode === 'attempt') {
      setPayload(session.payload);
      setHasStarted(!(session.payload.dpp.instructions || '').trim());
      setResult(null);
      setHistory(session.payload.history || []);
      setReviewOpen(false);
      return;
    }

    setPayload(null);
    setResult(session.result);
    setHistory(session.history || []);
    setReviewOpen(Boolean(session.reviewOpen));
  }, [session]);

  const syncResultSession = (nextResult: ApiDppAttemptResult, nextHistory: ApiDppAttemptHistoryEntry[], nextReviewOpen = false) => {
    onSessionChange?.({
      mode: 'result',
      result: nextResult,
      history: nextHistory,
      reviewOpen: nextReviewOpen,
    });
  };

  const handleSubmit = async (answers: Record<string, StudentAnswer>) => {
    if (!payload) return;

    try {
      setSubmitting(true);
      const submitted = await submitMyDppAttempt(payload.dpp.id, answers);
      const summary = await fetchMyDppAttemptSummary(payload.dpp.id).catch(() => null);
      const nextHistory = summary?.history || history;
      setResult(submitted);
      setHistory(nextHistory);
      setReviewOpen(false);
      syncResultSession(submitted, nextHistory);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAttempt = async (attemptId: string) => {
    try {
      setLoadingAttemptId(attemptId);
      const selected = await fetchDppAttemptResult(attemptId);
      setResult(selected);
      setReviewOpen(false);
      syncResultSession(selected, history, false);
    } finally {
      setLoadingAttemptId(null);
    }
  };

  if (result && reviewOpen) {
    return (
      <TestPreviewAndReview
        testId={result.dppId}
        testTitle={`${result.dppTitle} - Review`}
        duration={0}
        questions={mapReviewQuestions(result) as any}
        onSubmit={() => {}}
        onExit={onExit}
        initialAnswers={mapReviewAnswers(result)}
        initialTimeSpent={0}
        isPreview={true}
        disableEditing={true}
        hideExplanations={false}
        reviewAttemptId={result.attempt_id}
        loadQuestionExplanation={fetchDppAttemptQuestionExplanation}
      />
    );
  }

  if (result) {
    return (
      <StudentAnalytics
        result={{
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
          attempt_id: result.attempt_id,
        } as any}
        onClose={onExit}
        hideRank={true}
        hideTimeSpent={true}
          downloadType="dpp"
        hideSummaryCard={true}
        forceStatsRow={true}
        subtitle="DPP Performance Summary"
        loadingAttemptId={loadingAttemptId}
        attemptHistory={history as any}
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
          <div className="dpp-preview-shell">
            <div className="dpp-preview-card">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 sm:h-14 sm:w-14">
                    <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 sm:text-3xl">{payload.dpp.title}</h2>
                    <p className="text-sm text-gray-600 sm:text-base">
                      {payload.dpp.subject_name} • {payload.dpp.chapter_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onExit}
                  className="inline-flex items-center justify-center rounded-full p-2 text-slate-700 transition hover:bg-slate-100"
                  aria-label="Close DPP instructions"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 flex-col">
                <div className="rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-800 sm:p-6 sm:text-base sm:leading-7">
                  <div className="space-y-2">
                    {payload.dpp.instructions.split('\n').map((line, index) => (
                      line.trim() ? <p key={index}>{line.trim()}</p> : null
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-gray-600 sm:text-sm">
                  <span>{payload.dpp.question_count} questions</span>
                  <span>Attempts used: {payload.submittedAttemptCount}/{payload.maxAttempts}</span>
                  <span>Attempts left: {payload.remainingAttempts}</span>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setHasStarted(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-xl sm:px-6 sm:py-3 sm:text-base"
                  >
                    Continue to DPP
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div key="attempt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <StudentTestTaking
            testId={payload.dpp.id}
            attemptId={`dpp-${payload.dpp.id}`}
            testTitle={payload.dpp.title}
            duration={0}
            questions={questions as any}
            onSubmit={handleSubmit as any}
            onExit={onExit}
            initialAnswers={{}}
            enableTimer={false}
            showMarksMeta={false}
            outerPaddingClassName="p-2 pb-3"
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
