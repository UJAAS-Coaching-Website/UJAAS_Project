import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  ChevronRight,
  Download,
} from 'lucide-react';
import { StudentAnalytics } from './StudentAnalytics';
import { clearCachedTestInsights, fetchAttemptResult, fetchTestAnalysis, fetchTestById, fetchTestStudentAnalysis, type ApiTestStudentAnalysis } from '../api/tests';
import logo from '../assets/logo.svg';
import { printTestPaperPdf } from '../utils/testPaperPrint';
import {
  mapApiAttemptResultToAnalytics,
  mapApiQuestionToPublishedQuestion,
} from '../utils/testMappings';
import { TableRowsSkeleton } from './ui/content-skeletons';

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  attemptCount: number;
  latestSubmittedAt: string;
  firstSubmittedAt?: string;
  score: number;
  totalMarks: number;
  accuracy: number;
  rank: number;
  timeSpent: number;
}

interface TestPerformanceInsightsProps {
  testTitle: string;
  testId: string;
  onClose: () => void;
  scheduledDateTime?: string;
  testQuestions?: any[];
  testDuration?: number;
  testInstructions?: string;
}

export function TestPerformanceInsights({
  testTitle,
  testId,
  onClose,
  scheduledDateTime,
  testQuestions,
  testDuration,
  testInstructions,
}: TestPerformanceInsightsProps) {
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  const [selectedStudentAnalysis, setSelectedStudentAnalysis] = useState<ApiTestStudentAnalysis | null>(null);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [performances, setPerformances] = useState<StudentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const searchTimerRef = useRef<number | null>(null);
  const tableLoadControllerRef = useRef<AbortController | null>(null);
  const studentLoadControllerRef = useRef<AbortController | null>(null);

  const isAbortError = (error: unknown) =>
    error instanceof DOMException
      ? error.name === 'AbortError'
      : (error as { name?: string } | null)?.name === 'AbortError';

  useEffect(() => {
    const loadAnalysis = async () => {
      tableLoadControllerRef.current?.abort();
      const controller = new AbortController();
      tableLoadControllerRef.current = controller;
      setIsLoading(true);
      try {
        const analysis = await fetchTestAnalysis(testId, searchQuery, { signal: controller.signal });
        setPerformances(
          analysis.performances.map((perf) => ({
            studentId: perf.studentId,
            studentName: perf.studentName,
            attemptCount: perf.attemptCount,
            latestSubmittedAt: perf.latestSubmittedAt,
            firstSubmittedAt: (perf as any).firstSubmittedAt,
            score: perf.score,
            totalMarks: perf.totalMarks,
            accuracy: perf.accuracy,
            rank: perf.rank,
            timeSpent: perf.timeSpent,
          }))
        );
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        console.error('Failed to load test analysis', error);
        setPerformances([]);
      } finally {
        if (tableLoadControllerRef.current === controller) {
          tableLoadControllerRef.current = null;
          setIsLoading(false);
        }
      }
    };

    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      void loadAnalysis();
    }, 250);

    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
      tableLoadControllerRef.current?.abort();
    };
  }, [testId, searchQuery]);

  useEffect(() => {
    return () => {
      tableLoadControllerRef.current?.abort();
      studentLoadControllerRef.current?.abort();
      clearCachedTestInsights(testId);
    };
  }, [testId]);

  const rankedPerformances = useMemo(() => {
    return [...performances].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }, [performances]);

  const filteredPerformances = rankedPerformances;

  const getSubmissionStatus = (submittedAt: string, timeSpentInSeconds: number) => {
    if (!scheduledDateTime) return null;

    const startOfTestSession = new Date(new Date(submittedAt).getTime() - timeSpentInSeconds * 1000);
    const scheduledStart = new Date(scheduledDateTime);
    const diffInMinutes = (startOfTestSession.getTime() - scheduledStart.getTime()) / (1000 * 60);

    return diffInMinutes > 30 ? 'late' : 'on-time';
  };

  const formatSubmissionTime = (submittedAt: string) => {
    const submittedDate = new Date(submittedAt);
    return {
      date: submittedDate.toLocaleDateString(),
      time: submittedDate.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const handleDownloadTestPDF = async () => {
    setIsDownloadingPdf(true);

    try {
      const resolvedQuestions = testQuestions?.length
        ? testQuestions
        : (await fetchTestById(testId)).questions?.map(mapApiQuestionToPublishedQuestion) || [];

      if (!resolvedQuestions.length) {
        window.alert('No test paper questions were found for this test.');
        return;
      }

      const totalMarks = resolvedQuestions.reduce((sum, question) => sum + Number(question.marks || 0), 0);

      await printTestPaperPdf({
        title: testTitle,
        testId,
        duration: testDuration || 0,
        totalMarks,
        totalQuestions: resolvedQuestions.length,
        instructions: testInstructions,
        questions: resolvedQuestions,
        logoSrc: logo,
      });
    } catch (error) {
      console.error('Failed to download test paper PDF', error);
      window.alert('Failed to download the test paper. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleOpenStudentAnalysis = async (performance: StudentPerformance) => {
    studentLoadControllerRef.current?.abort();
    const controller = new AbortController();
    studentLoadControllerRef.current = controller;
    setLoadingStudentId(performance.studentId);
    try {
      const analysis = await fetchTestStudentAnalysis(testId, performance.studentId, { signal: controller.signal });
      setSelectedStudent(performance);
      setSelectedStudentAnalysis(analysis);
      setSelectedAttemptIndex(0);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      console.error('Failed to load student analysis', error);
      window.alert('Failed to load detailed student analysis. Please try again.');
    } finally {
      if (studentLoadControllerRef.current === controller) {
        studentLoadControllerRef.current = null;
        setLoadingStudentId(null);
      }
    }
  };

  if (selectedStudent && selectedStudentAnalysis) {
    const attempts = selectedStudentAnalysis.attempts || [];
    const currentAttempt = attempts[selectedAttemptIndex] || attempts[0];
    return (
      <div className="fixed inset-0 bg-white z-[10005] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{selectedStudent.studentName}</h2>
                <p className="text-xs sm:text-sm text-gray-600">All attempts for this test</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {attempts.map((attempt: any, index: number) => (
                  <button
                    key={attempt.attempt_id}
                    onClick={() => setSelectedAttemptIndex(index)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                      index === selectedAttemptIndex
                        ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Attempt {attempt.attempt_no}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <StudentAnalytics
          result={currentAttempt}
          viewerType="faculty"
          loadDetailedResult={async (attemptId, signal) => mapApiAttemptResultToAnalytics(await fetchAttemptResult(attemptId, { expectedTestId: testId, signal }))}
          onClose={() => {
            studentLoadControllerRef.current?.abort();
            setSelectedStudent(null);
            setSelectedStudentAnalysis(null);
            setSelectedAttemptIndex(0);
          }}
          hideExplanations={true}
          hideDownload={true}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{testTitle}</h1>
                <p className="text-sm sm:text-base text-gray-500">Performance Insights & Student Attempts</p>
              </div>
            </div>
            {(testQuestions || testId) && (
              <button
                onClick={handleDownloadTestPDF}
                disabled={isDownloadingPdf}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-xl text-sm sm:text-base font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                {isDownloadingPdf ? 'Preparing PDF...' : 'Download Test Paper'}
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Search by student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs sm:text-sm border border-blue-100 whitespace-nowrap">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {performances.length} Students
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <TableRowsSkeleton rows={7} columns={8} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</th>
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Attempts</th>
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">First Submission</th>
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Score</th>
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Accuracy</th>
                    <th className="px-3 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPerformances.map((perf) => {
                    const submissionTimestamp = perf.firstSubmittedAt || perf.latestSubmittedAt;
                    const status = getSubmissionStatus(submissionTimestamp, perf.timeSpent);
                    const submissionDateTime = formatSubmissionTime(submissionTimestamp);
                    return (
                      <tr
                        key={perf.studentId}
                        onClick={() => {
                          void handleOpenStudentAnalysis(perf);
                        }}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm ${
                              perf.rank === 1
                                ? 'bg-yellow-100 text-yellow-700'
                                : perf.rank === 2
                                  ? 'bg-slate-100 text-slate-600'
                                  : perf.rank === 3
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-gray-50 text-gray-500'
                            }`}
                          >
                            #{perf.rank}
                          </div>
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <div className="font-bold text-gray-900 text-xs sm:text-sm">{perf.studentName}</div>
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <div className="font-semibold text-gray-700 text-xs sm:text-sm">{perf.attemptCount}</div>
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <div className="flex items-center text-[11px] sm:text-sm text-gray-600">
                            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="ml-1">{submissionDateTime.date}</span>
                            <span className="mx-2 text-gray-400">•</span>
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>{submissionDateTime.time}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          {status && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${
                                status === 'late' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {status === 'late' ? 'Late' : 'On Time'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <span className="font-bold text-gray-900 text-xs sm:text-sm">
                            {perf.score} / {perf.totalMarks}
                          </span>
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                            <span className="font-bold text-gray-700 text-xs sm:text-sm">{perf.accuracy}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                          <button
                            disabled={loadingStudentId === perf.studentId}
                            className={`flex items-center gap-1 text-xs sm:text-sm font-bold ${
                              loadingStudentId === perf.studentId
                                ? 'text-blue-400 cursor-wait'
                                : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            {loadingStudentId === perf.studentId ? 'Loading...' : 'View Details'}
                            <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loadingStudentId === perf.studentId ? '' : 'transition-transform group-hover:translate-x-1'}`} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              {filteredPerformances.length === 0 && (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-500">No students found matching your search.</p>
                </div>
              )}
            </div>
        )}
      </div>
    </motion.div>
  );
}
