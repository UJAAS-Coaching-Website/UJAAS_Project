import { motion } from 'motion/react';
import { TestTaking } from './TestTaking';
import type { ApiAttemptHistoryEntry } from '../api/tests';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  BarChart3,
  Percent,
  Users,
  Calendar,
  BookOpen,
  ChevronRight,
  Download
} from 'lucide-react';
import logo from '../assets/logo.svg';
import { printTestPaperPdf } from '../utils/testPaperPrint';

interface Question {
  id: string;
  text: string;
  question?: string;
  questionImage?: string;
  options?: string[];
  optionImages?: (string | undefined)[];
  correctAnswer: number | string | number[];
  subject: string;
  marks: number;
  type?: 'MCQ' | 'MSQ' | 'Numerical';
  metadata?: {
    section?: string;
  };
  userAnswer?: number | string | null;
}

interface TestResult {
  testId: string;
  testTitle: string;
  totalMarks: number;
  obtainedMarks: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  timeSpent: number;
  duration: number;
  rank: number;
  totalStudents: number;
  submittedAt: string;
  questions: Question[];
  instructions?: string;
}

interface StudentAnalyticsProps {
  result: TestResult;
  onClose: () => void;
  onViewResults?: (testId: string) => void;
  hideExplanations?: boolean;
  hideDownload?: boolean;
  attemptHistory?: ApiAttemptHistoryEntry[];
  onSelectAttempt?: (attemptId: string) => void;
  loadingAttemptId?: string | null;
}

export function StudentAnalytics({
  result,
  onClose,
  onViewResults,
  hideExplanations = false,
  hideDownload = false,
  attemptHistory = [],
  onSelectAttempt,
  loadingAttemptId = null
}: StudentAnalyticsProps) {
  const accuracy = result.totalQuestions > 0 
    ? ((result.correctAnswers / result.totalQuestions) * 100).toFixed(1)
    : '0.0';
  
  const percentage = ((result.obtainedMarks / result.totalMarks) * 100).toFixed(1);

  const reviewAnswers = result.questions.reduce<Record<string, string | number | number[] | null>>((acc, question) => {
    acc[question.id] = (question.userAnswer as any) ?? null;
    return acc;
  }, {});

  const reviewQuestions = result.questions.map((question) => ({
    id: question.id,
    question: question.question ?? question.text,
    questionImage: question.questionImage,
    options: question.options,
    optionImages: question.optionImages,
    correctAnswer: question.correctAnswer,
    subject: question.subject,
    marks: question.marks,
    type: question.type ?? ('MCQ' as const),
    metadata: question.metadata,
    explanation: '',
  }));

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const handleDownloadTestPDF = () => {
    void printTestPaperPdf({
      title: result.testTitle,
      testId: result.testId,
      duration: result.duration,
      totalMarks: result.totalMarks,
      totalQuestions: result.totalQuestions,
      instructions: result.instructions,
      questions: result.questions,
      logoSrc: logo,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{result.testTitle}</h1>
              <p className="text-gray-600">Detailed Performance Analysis</p>
            </div>
            <div className="flex gap-3">
              {!hideDownload && (
                <button
                  onClick={handleDownloadTestPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {attemptHistory.length > 1 && onSelectAttempt ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Your Attempts</h2>
                <p className="text-sm text-gray-600">Switch between all submitted attempts for this test</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {attemptHistory.map((attempt) => {
                  const isActive = attempt.id === (result as any).attempt_id;
                  const isLoading = loadingAttemptId === attempt.id;
                  return (
                    <button
                      key={attempt.id}
                      onClick={() => onSelectAttempt(attempt.id)}
                      disabled={isLoading || isActive}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white'
                          : isLoading
                          ? 'bg-blue-100 text-blue-700 cursor-wait'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isLoading ? `Loading Attempt ${attempt.attempt_no}...` : `Attempt ${attempt.attempt_no}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Score Card */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mb-2">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-300" />
              </div>
              <p className="text-blue-100 text-sm mb-1">Your Score</p>
              <p className="text-5xl font-bold mb-1">{result.obtainedMarks}</p>
              <p className="text-blue-100">out of {result.totalMarks}</p>
              <div className="mt-3 inline-block px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-lg font-bold">{percentage}%</span>
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <Target className="w-12 h-12 mx-auto mb-3 text-green-300" />
              </div>
              <p className="text-blue-100 text-sm mb-1">Accuracy</p>
              <p className="text-5xl font-bold mb-1">{accuracy}%</p>
              <p className="text-blue-100">{result.correctAnswers}/{result.totalQuestions} correct</p>
              <div className="mt-3 text-sm">
                <span className="text-green-300">✓ {result.correctAnswers}</span>
                <span className="mx-2">•</span>
                <span className="text-red-300">✗ {result.wrongAnswers}</span>
                <span className="mx-2">•</span>
                <span className="text-gray-300">− {result.unattempted}</span>
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <Award className="w-12 h-12 mx-auto mb-3 text-purple-300" />
              </div>
              <p className="text-blue-100 text-sm mb-1">Your Rank</p>
              <p className="text-5xl font-bold mb-1">#{result.rank}</p>
              <p className="text-blue-100">out of {result.totalStudents}</p>
              <div className="mt-3 inline-block px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-lg font-bold">Top Performance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: CheckCircle, label: 'Correct', value: result.correctAnswers, color: 'green' },
            { icon: XCircle, label: 'Wrong', value: result.wrongAnswers, color: 'red' },
            { icon: Clock, label: 'Time Spent', value: formatTime(result.timeSpent), color: 'blue' },
            { icon: Percent, label: 'Percentage', value: `${percentage}%`, color: 'purple' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            >
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Review Mode (Read Only) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <TestTaking
            testId={result.testId}
            testTitle={`${result.testTitle} - Review`}
            duration={result.duration}
            questions={reviewQuestions}
            onSubmit={() => {}}
            onExit={onClose}
            initialAnswers={reviewAnswers}
            initialTimeSpent={result.timeSpent}
            isFacultyPreview={true}
            disableEditing={true}
            hideExplanations={hideExplanations}
          />
        </motion.div>
      </div>
    </div>
  );
}
