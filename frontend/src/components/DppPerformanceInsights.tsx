import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  ArrowLeft,
  Calendar,
  Target,
} from 'lucide-react';
import { StudentAnalytics } from './StudentAnalytics';
import { fetchDppAnalysis, type ApiDppAnalysis } from '../api/dpps';
import { mapApiDppQuestionsToAnalytics } from '../utils/testMappings';
import { TableRowsSkeleton } from './ui/content-skeletons';

interface DppPerformanceInsightsProps {
  dppTitle: string;
  dppId: string;
  onClose: () => void;
  initialAnalysis?: ApiDppAnalysis | null;
}

export function DppPerformanceInsights({
  dppTitle,
  dppId,
  onClose,
  initialAnalysis = null,
}: DppPerformanceInsightsProps) {
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [performances, setPerformances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const mapAnalysisToPerformances = (analysis: ApiDppAnalysis) => (
      analysis.performances.map((perf) => ({
        ...perf,
        attempts: perf.attempts.map((attempt) => ({
          ...attempt,
          questions: mapApiDppQuestionsToAnalytics(attempt.questions),
        })),
      }))
    );

    const loadAnalysis = async () => {
      if (initialAnalysis && initialAnalysis.dppId === dppId && !searchQuery.trim()) {
        setPerformances(mapAnalysisToPerformances(initialAnalysis));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const analysis = await fetchDppAnalysis(dppId, searchQuery);
        setPerformances(mapAnalysisToPerformances(analysis));
      } catch (error) {
        console.error('Failed to load DPP analysis', error);
        setPerformances([]);
      } finally {
        setIsLoading(false);
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
    };
  }, [dppId, initialAnalysis, searchQuery]);

  const filteredPerformances = useMemo(() => performances, [performances]);

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
                <p className="text-sm text-gray-600">All attempts for this DPP</p>
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
          downloadType="dpp"
          downloadBatchName={currentAttempt?.batch_name}
          downloadSubjectName={currentAttempt?.subject_name}
          hideRank={true}
          hideTimeSpent={true}
          subtitle="DPP Performance Summary"
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
                <h1 className="text-2xl font-bold text-gray-900">{dppTitle}</h1>
                <p className="text-gray-500">Performance Insights & Student Attempts</p>
              </div>
            </div>
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
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <TableRowsSkeleton rows={7} columns={5} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Attempts</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Latest Submission</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPerformances.map((perf) => {
                    const submissionDateTime = formatSubmissionTime(perf.latestSubmittedAt);
                    return (
                      <tr
                        key={perf.studentId}
                        className="transition-colors"
                      >
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
                            <span className="text-gray-300">|</span>
                            {submissionDateTime.time}
                          </div>
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
