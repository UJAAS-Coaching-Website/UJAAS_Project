import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle, ChevronRight, Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentTestTaking } from './StudentTestTaking';
import { TestTaking } from './TestTaking';
import {
  fetchDppAttemptResult,
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

function ResultCard({
  result,
  history,
  loadingAttemptId,
  onSelectAttempt,
  onOpenReview,
  onExit,
}: {
  result: ApiDppAttemptResult;
  history: ApiDppAttemptHistoryEntry[];
  loadingAttemptId: string | null;
  onSelectAttempt: (attemptId: string) => void;
  onOpenReview: () => void;
  onExit: () => void;
}) {
  const percentage = result.totalMarks > 0 ? Math.round((result.obtainedMarks / result.totalMarks) * 100) : 0;

  return (
    <div className="h-[100dvh] overflow-hidden bg-[oklch(0.98_0.02_196.85)]">
      <div className="flex h-full items-center justify-center px-4 py-4 sm:px-6">
        <div className="w-full max-w-4xl rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{result.dppTitle}</h2>
              <p className="mt-2 text-gray-600">
                Attempt {result.attempt_no} submitted on {new Date(result.submittedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onExit}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>

          {history.length > 1 && (
            <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900">Your Attempts</h3>
                <p className="text-sm text-gray-600">Switch between submitted DPP attempts</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((attempt) => {
                  const isActive = attempt.id === result.attempt_id;
                  const isLoading = loadingAttemptId === attempt.id;
                  return (
                    <button
                      key={attempt.id}
                      onClick={() => onSelectAttempt(attempt.id)}
                      disabled={isActive || isLoading}
                      className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white'
                          : isLoading
                          ? 'bg-blue-100 text-blue-700 cursor-wait'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {isLoading ? `Loading Attempt ${attempt.attempt_no}...` : `Attempt ${attempt.attempt_no}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-sm text-blue-700">Score</p>
              <p className="text-3xl font-bold text-blue-900">{result.obtainedMarks}</p>
              <p className="text-xs text-blue-700">out of {result.totalMarks}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm text-emerald-700">Correct</p>
              <p className="text-3xl font-bold text-emerald-900">{result.correctAnswers}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-5">
              <p className="text-sm text-rose-700">Wrong</p>
              <p className="text-3xl font-bold text-rose-900">{result.wrongAnswers}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-5">
              <p className="text-sm text-amber-700">Unattempted</p>
              <p className="text-3xl font-bold text-amber-900">{result.unattempted}</p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Percentage</p>
                <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Rank</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.rank}/{result.totalStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onOpenReview}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 px-6 py-3 font-bold text-white shadow-lg hover:shadow-xl"
            >
              See Detailed Breakdown
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
      <TestTaking
        testId={result.dppId}
        testTitle={`${result.dppTitle} - Review`}
        duration={0}
        questions={mapReviewQuestions(result) as any}
        onSubmit={() => {}}
        onExit={() => {
          setReviewOpen(false);
          syncResultSession(result, history, false);
        }}
        initialAnswers={mapReviewAnswers(result)}
        initialTimeSpent={0}
        isPreview={true}
        disableEditing={true}
        hideExplanations={false}
      />
    );
  }

  if (result) {
    return (
      <ResultCard
        result={result}
        history={history}
        loadingAttemptId={loadingAttemptId}
        onSelectAttempt={(attemptId) => {
          void handleSelectAttempt(attemptId);
        }}
        onOpenReview={() => {
          setReviewOpen(true);
          syncResultSession(result, history, true);
        }}
        onExit={onExit}
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
