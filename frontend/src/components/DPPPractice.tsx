import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle, ChevronRight, Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentTestTaking } from './StudentTestTaking';
import type { ApiDppAttemptHistoryEntry, ApiDppAttemptResult, ApiStartDppAttemptPayload } from '../api/dpps';
import { submitMyDppAttempt } from '../api/dpps';

type StudentAnswer = string | number | number[] | null;

interface DPPPracticeProps {
  payload: ApiStartDppAttemptPayload;
  onExit: () => void;
  onSubmitted?: (result: ApiDppAttemptResult) => void | Promise<void>;
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

function ResultCard({
  result,
  history,
  onExit,
}: {
  result: ApiDppAttemptResult;
  history: ApiDppAttemptHistoryEntry[];
  onExit: () => void;
}) {
  const percentage = result.totalMarks > 0 ? Math.round((result.obtainedMarks / result.totalMarks) * 100) : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-gray-600 hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{result.dppTitle}</h2>
            <p className="mt-2 text-gray-600">
              Attempt {result.attempt_no} submitted on {new Date(result.submittedAt).toLocaleString()}
            </p>
          </div>

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

          {history.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-bold text-gray-900">Attempt History</h3>
              <div className="space-y-3">
                {history.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900">Attempt {attempt.attempt_no}</p>
                      <p className="text-sm text-gray-500">{new Date(attempt.submitted_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{attempt.score} marks</p>
                      <p className="text-sm text-gray-500">Rank {attempt.rank}/{attempt.total_students}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DPPPractice({ payload, onExit, onSubmitted }: DPPPracticeProps) {
  const [hasStarted, setHasStarted] = useState(!(payload.dpp.instructions || '').trim());
  const [result, setResult] = useState<ApiDppAttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const questions = useMemo(() => mapQuestions(payload), [payload]);

  const handleSubmit = async (answers: Record<string, StudentAnswer>) => {
    try {
      setSubmitting(true);
      const submitted = await submitMyDppAttempt(payload.dpp.id, answers);
      setResult(submitted);
      await onSubmitted?.(submitted);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return <ResultCard result={result} history={payload.history || []} onExit={onExit} />;
  }

  return (
    <AnimatePresence mode="wait">
      {!hasStarted ? (
        <motion.div
          key="instructions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
        >
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="mb-4 flex justify-end">
              <button
                onClick={onExit}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-gray-600 hover:bg-amber-50"
              >
                <X className="w-4 h-4" />
                Back
              </button>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-white p-8 shadow-xl">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{payload.dpp.title}</h2>
                  <p className="text-gray-600">
                    {payload.dpp.subject_name} • {payload.dpp.chapter_name}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 p-6 text-gray-800 whitespace-pre-wrap leading-7">
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
