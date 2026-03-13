import { useEffect, useMemo, useState } from 'react';
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
import { fetchTestAnalysis, fetchTestById } from '../api/tests';
import logo from '../assets/logo.svg';
import { printTestPaperPdf } from '../utils/testPaperPrint';

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  attemptCount: number;
  latestSubmittedAt: string;
  score: number;
  totalMarks: number;
  accuracy: number;
  rank: number;
  timeSpent: number;
  attempts: any[];
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
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [performances, setPerformances] = useState<StudentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    const loadAnalysis = async () => {
      setIsLoading(true);
      try {
        const analysis = await fetchTestAnalysis(testId);
        setPerformances(
          analysis.performances.map((perf) => ({
            studentId: perf.studentId,
            studentName: perf.studentName,
            attemptCount: perf.attemptCount,
            latestSubmittedAt: perf.latestSubmittedAt,
            score: perf.score,
            totalMarks: perf.totalMarks,
            accuracy: perf.accuracy,
            rank: perf.rank,
            timeSpent: perf.timeSpent,
            attempts: perf.attempts.map((attempt) => ({
              ...attempt,
              questions: attempt.questions.map((question) => ({
                id: question.id,
                text: question.question_text,
                question: question.question_text,
                questionImage: question.question_img || undefined,
                options: question.options || undefined,
                optionImages: question.option_imgs || undefined,
                correctAnswer: question.type === 'MCQ' ? Number(question.correct_answer) : question.correct_answer,
                subject: question.subject,
                marks: question.marks,
                type: question.type,
                metadata: { section: question.section || undefined },
                explanation: question.explanation || undefined,
                explanationImage: question.explanation_img || undefined,
                userAnswer: question.user_answer,
              })),
            })),
          }))
        );
      } catch (error) {
        console.error('Failed to load test analysis', error);
        setPerformances([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadAnalysis();
  }, [testId]);

  const rankedPerformances = useMemo(() => {
    return [...performances]
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        ...p,
        rank: index + 1,
      }));
  }, [performances]);

  const filteredPerformances = rankedPerformances.filter((p) =>
    p.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        : (await fetchTestById(testId)).questions?.map((question) => ({
            id: question.id,
            type: question.type,
            subject: question.subject,
            question: question.question_text,
            questionImage: question.question_img || undefined,
            options: question.options || undefined,
            optionImages: question.option_imgs || undefined,
            correctAnswer: question.type === 'MCQ' ? Number(question.correct_answer) : question.correct_answer,
            marks: question.marks,
            negativeMarks: question.neg_marks,
            explanation: question.explanation || undefined,
            explanationImage: question.explanation_img || undefined,
            difficulty: question.difficulty || undefined,
            metadata: { section: question.section || undefined },
          })) || [];

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

  if (selectedStudent) {
    const attempts = selectedStudent.attempts || [];
    const currentAttempt = attempts[selectedAttemptIndex] || attempts[0];
    return (
      <div className="fixed inset-0 bg-white z-[10005] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedStudent.studentName}</h2>
                <p className="text-sm text-gray-600">All attempts for this test</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {attempts.map((attempt: any, index: number) => (
                  <button
                    key={attempt.attempt_id}
                    onClick={() => setSelectedAttemptIndex(index)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
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
          onClose={() => {
            setSelectedStudent(null);
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
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{testTitle}</h1>
                <p className="text-gray-500">Performance Insights & Student Attempts</p>
              </div>
            </div>
            {(testQuestions || testId) && (
              <button
                onClick={handleDownloadTestPDF}
                disabled={isDownloadingPdf}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <Download className="w-5 h-5" />
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
                className="w-full px-6 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm border border-blue-100 whitespace-nowrap">
              <Users className="w-4 h-4" />
              {performances.length} Students
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-16 text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading student analysis...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Attempts</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Latest Submission</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Accuracy</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPerformances.map((perf) => {
                    const status = getSubmissionStatus(perf.latestSubmittedAt, perf.timeSpent);
                    const submissionDateTime = formatSubmissionTime(perf.latestSubmittedAt);
                    return (
                      <tr
                        key={perf.studentId}
                        onClick={() => {
                          setSelectedStudent(perf);
                          setSelectedAttemptIndex(0);
                        }}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
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
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{perf.studentName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-700">{perf.attemptCount}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5" />
                            {submissionDateTime.date}
                            <Clock className="w-3.5 h-3.5 ml-1" />
                            {submissionDateTime.time}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {status && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                                status === 'late' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {status === 'late' ? 'Late' : 'On Time'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">
                            {perf.score} / {perf.totalMarks}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-500" />
                            <span className="font-bold text-gray-700">{perf.accuracy}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">
                            View Details
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
                <p className="text-gray-500">No students found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
