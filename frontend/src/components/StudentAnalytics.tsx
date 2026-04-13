import { motion } from 'motion/react';
import { TestPreviewAndReview } from './TestPreviewAndReview';
import { fetchAttemptQuestionExplanation, type ApiAttemptHistoryEntry } from '../api/tests';
import { useIsMobileViewport } from '../hooks/useViewport';
import { useRef, useState, useEffect } from 'react';
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
  Download,
  X
} from 'lucide-react';
import logo from '../assets/logo.svg';
import { printTestPaperPdf } from '../utils/testPaperPrint';
import { aggregateSubjectWiseStats } from '../utils/testMappings';

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
  negativeMarks?: number;
  type?: 'MCQ' | 'MSQ' | 'Numerical';
  metadata?: {
    section?: string;
  };
  userAnswer?: number | string | number[] | null;
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
  rank?: number;
  totalStudents?: number;
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
  downloadType?: 'test' | 'dpp';
  downloadBatchName?: string;
  downloadSubjectName?: string;
  hideRank?: boolean;
  hideTimeSpent?: boolean;
  hideSummaryCard?: boolean;
  forceStatsRow?: boolean;
  subtitle?: string;
  attemptHistory?: ApiAttemptHistoryEntry[];
  onSelectAttempt?: (attemptId: string) => void;
  loadingAttemptId?: string | null;
  viewerType?: 'student' | 'faculty';
}

export function StudentAnalytics({
  result,
  onClose,
  onViewResults,
  hideExplanations = false,
  hideDownload = false,
  downloadType = 'test',
  downloadBatchName,
  downloadSubjectName,
  hideRank = false,
  hideTimeSpent = false,
  hideSummaryCard = false,
  forceStatsRow = false,
  subtitle = 'Detailed Performance Analysis',
  attemptHistory = [],
  onSelectAttempt,
  loadingAttemptId = null,
  viewerType = 'student'
}: StudentAnalyticsProps) {
  const isMobileViewport = useIsMobileViewport();
  const [showReview, setShowReview] = useState(false);
  const reviewRef = useRef<HTMLDivElement | null>(null);
  const accuracy = result.totalQuestions > 0 
    ? ((result.correctAnswers / result.totalQuestions) * 100).toFixed(1)
    : '0.0';
  
  const percentage = ((result.obtainedMarks / result.totalMarks) * 100).toFixed(1);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const subjectWiseStats = aggregateSubjectWiseStats(result.questions);

  const numericRank = typeof result.rank === 'number' && Number.isFinite(result.rank) && result.rank > 0
    ? result.rank
    : null;
  const numericTotalStudents = typeof result.totalStudents === 'number'
    && Number.isFinite(result.totalStudents)
    && result.totalStudents > 0
    ? result.totalStudents
    : null;

  const hasRankData = numericRank !== null && numericTotalStudents !== null;
  const normalizedRank = hasRankData ? Math.min(numericRank as number, numericTotalStudents as number) : null;
  const percentile = hasRankData
    ? (1 - (((normalizedRank as number) - 1) / (numericTotalStudents as number))) * 100
    : null;

  const getRankBadgeLabel = () => {
    if (!hasRankData || (numericTotalStudents as number) < 10) return null;
    if ((normalizedRank as number) === 1) return 'Test Topper';
    if ((percentile as number) >= 99) return 'Top 1%';
    if ((percentile as number) >= 95) return 'Top 5%';
    if ((percentile as number) >= 90) return 'Top 10%';
    if ((percentile as number) >= 75) return 'Top 25%';
    return null;
  };

  const rankBadgeLabel = getRankBadgeLabel();
  const showImprovementCue = hasRankData && !rankBadgeLabel && (numericTotalStudents as number) >= 10;
  const improvementCueText = viewerType === 'faculty' ? 'Outside top performance band' : 'Keep pushing';

  useEffect(() => {
    if (!showReview) return;
    const frame = requestAnimationFrame(() => {
      reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [showReview]);

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

  const isDppDownload = downloadType === 'dpp';

  const handleDownloadTestPDF = async () => {
    setIsDownloadingPdf(true);
    try {
      await printTestPaperPdf({
        title: result.testTitle,
        testId: result.testId,
        duration: result.duration,
        totalMarks: result.totalMarks,
        totalQuestions: result.totalQuestions,
        instructions: isDppDownload ? undefined : result.instructions,
        questions: result.questions,
        logoSrc: logo,
        documentLabel: isDppDownload ? 'DPP' : 'Test Paper',
        codeLabel: isDppDownload ? '' : 'Code',
        batchName: isDppDownload ? downloadBatchName : undefined,
        subjectName: isDppDownload ? downloadSubjectName : undefined,
        groupBySubject: !isDppDownload,
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-2 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">{result.testTitle}</h1>
              <p className="hidden md:block text-xs sm:text-base text-gray-600">{subtitle}</p>
            </div>
            <div className="shrink-0">
              <div className="flex items-center flex-wrap justify-between md:justify-end gap-2 sm:gap-4 w-full md:w-auto">
                <button
                  onClick={() => setShowReview((prev) => !prev)}
                  className={`flex items-center justify-center ${isMobileViewport ? 'gap-1.5' : 'gap-2'} ${
                    isMobileViewport ? 'px-4 py-2 rounded-xl' : 'px-6 py-3 rounded-2xl'
                  } bg-white text-indigo-700 border border-indigo-200 shadow-sm hover:bg-indigo-50 transition-all`}
                  aria-label={showReview ? 'Hide Detailed Analysis' : 'Show Detailed Analysis'}
                >
                  <BarChart3 className={isMobileViewport ? 'w-4 h-4' : 'w-5 h-5'} />
                  <span className="text-sm sm:text-base font-semibold">
                    {isMobileViewport ? 'Detailed' : (showReview ? 'Hide Detailed Analysis' : 'Show Detailed Analysis')}
                  </span>
                </button>
                {!hideDownload && (
                  <button
                    onClick={handleDownloadTestPDF}
                    disabled={isDownloadingPdf}
                    className={`flex items-center justify-center ${isMobileViewport ? 'gap-1.5' : 'gap-2'} ${
                      isMobileViewport ? 'px-4 py-2 rounded-xl' : 'px-6 py-3 rounded-2xl'
                    } ${isDownloadingPdf ? 'bg-blue-200 text-blue-800 cursor-wait shadow-inner' : 'bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-200'} transition-all`}
                    aria-label={isDppDownload ? 'Download DPP' : 'Download Test'}
                  >
                    <Download className={`${isMobileViewport ? 'w-4 h-4' : 'w-5 h-5'} ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
                    <span className="text-sm sm:text-base font-medium">
                      {isDownloadingPdf ? 'Preparing PDF...' : isDppDownload ? 'Download DPP' : 'Download Test'}
                    </span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`flex items-center justify-center ${
                    isMobileViewport ? 'w-10 h-10 rounded-xl' : 'px-6 py-3 rounded-2xl'
                  } bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all`}
                  aria-label="Close"
                >
                  {isMobileViewport ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <span className="text-base font-semibold">Close</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {attemptHistory.length > 1 && onSelectAttempt ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Your Attempts</h2>
                <p className="hidden md:block text-xs sm:text-sm text-gray-600">Switch between all submitted attempts for this test</p>
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
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md'
                          : isLoading
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 cursor-wait'
                          : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800'
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

        
        {!hideSummaryCard && (
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-4 md:p-8 mb-4 sm:mb-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 md:w-64 md:h-64 bg-white/10 rounded-full -mr-20 -mt-20 md:-mr-32 md:-mt-32" />
            <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-white/10 rounded-full -ml-16 -mb-16 md:-ml-24 md:-mb-24" />
            
            <div className={`relative grid grid-cols-3 gap-3 md:gap-6 ${hideRank ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
              <div className="text-center">
                <div className="mb-2">
                  <Trophy className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-yellow-300" />
                </div>
                <p className="text-blue-100 text-xs md:text-sm mb-1">Your Score</p>
                <p className="text-3xl md:text-5xl font-bold mb-1">{result.obtainedMarks}</p>
                <p className="text-blue-100 hidden md:block">out of {result.totalMarks}</p>
                {!isMobileViewport && (
                  <div className="mt-2 md:mt-3 px-3 md:px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full inline-flex items-center justify-center">
                    <span className="text-base md:text-lg font-bold">{percentage}%</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="mb-2">
                  <Target className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-green-300" />
                </div>
                <p className="text-blue-100 text-xs md:text-sm mb-1">Accuracy</p>
                <p className="text-3xl md:text-5xl font-bold mb-1">{accuracy}%</p>
                <p className="text-blue-100 hidden md:block">{result.correctAnswers}/{result.totalQuestions} correct</p>
                <div className="mt-2 md:mt-3 text-sm hidden md:block">
                  <span className="text-green-300">&#10003; {result.correctAnswers}</span>
                  <span className="mx-2">&bull;</span>
                  <span className="text-red-300">&#10007; {result.wrongAnswers}</span>
                  <span className="mx-2">&bull;</span>
                  <span className="text-gray-300">&#8722; {result.unattempted}</span>
                </div>
              </div>

              {!hideRank ? (
                <div className="text-center">
                  <div className="mb-2">
                    <Award className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-purple-300" />
                  </div>
                  <p className="text-blue-100 text-xs md:text-sm mb-1">Your Rank</p>
                  <p className="text-3xl md:text-5xl font-bold mb-1">#{result.rank ?? 0}</p>
                  <p className="text-blue-100 hidden md:block">out of {result.totalStudents ?? 0}</p>
                  {!isMobileViewport && rankBadgeLabel && (
                    <div className="mt-2 md:mt-3 px-3 md:px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full inline-flex items-center justify-center">
                      <span className="text-base md:text-lg font-bold">{rankBadgeLabel}</span>
                    </div>
                  )}
                  {!isMobileViewport && showImprovementCue && (
                    <p className="mt-2 md:mt-3 text-sm text-blue-100/90">{improvementCueText}</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div className={`grid gap-3 md:gap-4 mb-4 sm:mb-6 ${
          forceStatsRow ? 'grid-cols-3' : (hideTimeSpent ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4')
        }`}>
          {[
            { icon: CheckCircle, label: 'Correct', value: result.correctAnswers, color: 'green' },
            { icon: XCircle, label: 'Wrong', value: result.wrongAnswers, color: 'red' },
            { icon: Percent, label: 'Percentage', value: `${percentage}%`, color: 'purple' }
          ]
            .concat(hideTimeSpent ? [] : [{ icon: Clock, label: 'Time Spent', value: formatTime(result.timeSpent), color: 'blue' as const }])
            .map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100"
            >
              <div className={`w-9 h-9 sm:w-12 sm:h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3`}>
                <stat.icon className={`w-4 h-4 sm:w-6 sm:h-6 text-${stat.color}-600`} />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-[11px] sm:text-sm text-gray-600 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {!isDppDownload && subjectWiseStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 mb-4 sm:mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Subject-Wise Analysis</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
              {subjectWiseStats.map((subject, index) => {
                const attemptedQuestions = subject.correct + subject.incorrect;
                const totalQuestions = attemptedQuestions + subject.unattempted;

                return (
                <motion.div
                  key={subject.subject}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.04 }}
                  className="bg-white rounded-xl p-4 sm:p-5 shadow-lg border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">{subject.subject}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] sm:text-xs text-gray-600 whitespace-nowrap">
                        Q: {attemptedQuestions}/{totalQuestions}
                      </span>
                      <span className="text-xs sm:text-sm px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold whitespace-nowrap">
                        {subject.scoredMarks}/{subject.totalMarks}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center rounded-xl bg-gray-50 border border-gray-100 px-2.5 py-1.5 flex-1 min-w-[150px]">
                      <p className="text-base text-gray-700 whitespace-nowrap">
                        Correct:{' '}
                        <span className="text-base font-bold text-emerald-700 leading-none align-middle">{subject.correct}</span>
                      </p>
                    </div>
                    <div className="flex items-center rounded-xl bg-gray-50 border border-gray-100 px-2.5 py-1.5 flex-1 min-w-[150px]">
                      <p className="text-base text-gray-700 whitespace-nowrap">
                        Incorrect:{' '}
                        <span className="text-base font-bold text-rose-700 leading-none align-middle">{subject.incorrect}</span>
                      </p>
                    </div>
                    <div className="flex items-center rounded-xl bg-gray-50 border border-gray-100 px-2.5 py-1.5 flex-1 min-w-[180px]">
                      <p className="text-base text-gray-700 whitespace-nowrap">
                        Not attempted:{' '}
                        <span className="text-base font-bold text-slate-700 leading-none align-middle">{subject.unattempted}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )})}
            </div>
          </motion.div>
        )}

        {/* Review Mode (Read Only) */}
        {showReview && (
          <motion.div
            ref={reviewRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <TestPreviewAndReview
              testId={result.testId}
              testTitle={`${result.testTitle} - Review`}
              duration={result.duration}
              questions={reviewQuestions}
              onSubmit={() => {}}
              onExit={() => setShowReview(false)}
              exitLabel="Hide"
              initialAnswers={reviewAnswers}
              initialTimeSpent={result.timeSpent}
              disableEditing={true}
              hideExplanations={hideExplanations}
              reviewAttemptId={(result as any).attempt_id}
              loadQuestionExplanation={fetchAttemptQuestionExplanation}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
