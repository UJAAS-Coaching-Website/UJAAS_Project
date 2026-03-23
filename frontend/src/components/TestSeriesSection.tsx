import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useIsMobileViewport } from '../hooks/useViewport';
import { TestSeriesSkeleton } from './ui/content-skeletons';
import {
  FileText,
  Clock,
  Users,
  Award,
  Play,
  Lock,
  CheckCircle,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react';

interface TestSeries {
  id: string;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  questions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'pending' | 'completed' | 'upcoming';
  score?: number;
  attempts: number;
  scheduledDate?: string;
  scheduledTime?: string;
  enrolled: number;
  passingMarks: number;
  startTimeStatus?: 'on-time' | 'late';
  latestAttemptId?: string | null;
  maxAttempts?: number;
  hasActiveAttempt?: boolean;
}

interface TestSeriesProps {
  loading?: boolean;
  onStartTest: (test: import('../App').PublishedTest) => Promise<void>;
  onViewAnalytics: (attemptId?: string | null) => void;
  onViewResults: () => void;
  publishedTests?: import('../App').PublishedTest[];
  loadingOverviewTestId?: string | null;
  loadingAnalysisAttemptId?: string | null;
  isLoadingResults?: boolean;
  attemptResults?: import('../api/tests').ApiStudentAttemptResultListItem[];
}

export function TestSeriesSection({ 
  loading = false,
  onStartTest, 
  onViewAnalytics, 
  onViewResults,
  publishedTests = [],
  loadingOverviewTestId = null,
  loadingAnalysisAttemptId = null,
  isLoadingResults = false,
  attemptResults = []
}: TestSeriesProps) {
  const isMobileViewport = useIsMobileViewport();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending' | 'upcoming'>('all');

  const formatSchedule = (date?: string, time?: string) => {
    if (!date && !time) return 'Not scheduled';
    const formattedTime = time
      ? new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : '';

    if (!date) return formattedTime || 'Not scheduled';

    const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString();
    return formattedTime ? `${formattedDate} at ${formattedTime}` : formattedDate;
  };

  const getStatusLabel = (status: TestSeries['status']) => {
    if (status === 'completed') return 'Completed';
    if (status === 'upcoming') return 'Upcoming';
    return 'Pending';
  };

  const getStartTimeStatus = (
    scheduleDate?: string,
    scheduleTime?: string,
    submittedAt?: string | null,
    timeSpent?: number | null
  ): TestSeries['startTimeStatus'] | undefined => {
    if (!scheduleDate || !submittedAt || timeSpent === null || timeSpent === undefined) {
      return undefined;
    }

    const scheduledStart = new Date(`${scheduleDate}T${scheduleTime || '00:00'}:00`);
    const submittedDate = new Date(submittedAt);

    if (Number.isNaN(scheduledStart.getTime()) || Number.isNaN(submittedDate.getTime())) {
      return undefined;
    }

    const actualStart = new Date(submittedDate.getTime() - (Number(timeSpent) * 1000));
    const diffInMinutes = (actualStart.getTime() - scheduledStart.getTime()) / (1000 * 60);

    return diffInMinutes > 30 ? 'late' : 'on-time';
  };

  const mappedPublishedTests: TestSeries[] = (publishedTests || [])
    .map(t => ({
      id: t.id,
      title: t.title,
      subject: t.format === 'JEE MAIN' ? 'All Subjects' : t.format === 'NEET' ? 'All Subjects' : 'Custom',
      duration: t.duration,
      totalMarks: t.totalMarks,
      questions: t.questionCount ?? t.questions.length,
      difficulty: 'Medium',
      status: t.hasActiveAttempt
        ? 'pending'
        : ((t.submittedAttemptCount || 0) > 0
            ? 'completed'
            : (t.status === 'upcoming' ? 'upcoming' : 'pending')),
      attempts: t.submittedAttemptCount || 0,
      scheduledDate: t.scheduleDate,
      scheduledTime: t.scheduleTime,
      enrolled: t.enrolledCount ?? 0,
      passingMarks: Math.floor(t.totalMarks * 0.4),
      startTimeStatus: getStartTimeStatus(
        t.scheduleDate,
        t.scheduleTime,
        t.latestAttemptSubmittedAt,
        t.latestAttemptTimeSpent
      ),
      latestAttemptId: t.latestAttemptId,
      maxAttempts: t.maxAttempts,
      hasActiveAttempt: t.hasActiveAttempt,
    }));
  const allTests = mappedPublishedTests;

  const filteredTests = allTests.filter(test => {
    const statusFilter = 
      selectedFilter === 'all' ? true :
      selectedFilter === 'completed' ? test.status === 'completed' :
      selectedFilter === 'pending' ? test.status === 'pending' :
      selectedFilter === 'upcoming' ? test.status === 'upcoming' : true;
    
    return statusFilter;
  });

  const stats = useMemo(() => {
    const total = allTests.length;
    const completed = allTests.filter((test) => test.status === 'completed').length;
    const pending = allTests.filter((test) => test.status === 'pending').length;
    const avgScore = attemptResults.length > 0
      ? attemptResults.reduce((sum, result) => sum + result.percentage, 0) / attemptResults.length
      : 0;

    return { total, completed, pending, avgScore };
  }, [allTests, attemptResults]);

  if (loading) {
    return <TestSeriesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isMobileViewport ? 'rounded-3xl p-5' : 'rounded-2xl p-6'} bg-white shadow-lg border border-gray-100`}
      >
        <div className={isMobileViewport ? '' : 'flex flex-col md:flex-row md:items-center md:justify-between gap-4'}>
          {isMobileViewport ? (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-[2rem] font-bold text-gray-900">Test Series</h1>
                <p className="mt-2 text-sm text-gray-600">Start practicing and track your improvement</p>
              </div>
              <div className="flex shrink-0 items-center">
                <motion.button
                  className={`${isMobileViewport ? 'px-4 py-2 text-sm rounded-lg' : 'px-6 py-3 rounded-xl'} font-semibold shadow-lg transition-all ${
                    isLoadingResults
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white cursor-wait'
                      : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white hover:shadow-xl'
                  }`}
                  onClick={onViewResults}
                  disabled={isLoadingResults}
                >
                  {isLoadingResults ? 'Loading...' : 'Results'}
                </motion.button>
              </div>
            </div>
          ) : (
            <>
              <div className="">
                <h1 className={`${isMobileViewport ? 'text-[2rem]' : 'text-3xl'} font-bold text-gray-900 mb-2`}>Test Series</h1>
                <p className={`${isMobileViewport ? 'text-sm' : 'text-base'} text-gray-600`}>Start practicing and track your improvement</p>
              </div>
              <div className="flex items-center gap-4">
                <motion.button
                  className={`${isMobileViewport ? 'px-4 py-2 text-sm rounded-lg' : 'px-6 py-3 rounded-xl'} font-semibold shadow-lg transition-all ${
                    isLoadingResults
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white cursor-wait'
                      : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white hover:shadow-xl'
                }`}
                onClick={onViewResults}
                disabled={isLoadingResults}
              >
                {isLoadingResults ? 'Loading Results...' : 'View Results'}
              </motion.button>
            </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div
        className={`${isMobileViewport ? 'grid gap-2' : 'grid grid-cols-2 lg:grid-cols-4 gap-4'}`}
        style={isMobileViewport ? { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' } : undefined}
      >
        {[
          { label: 'Total Tests', mobileLabel: 'Tests', value: stats.total, icon: FileText, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Completed', mobileLabel: 'Done', value: stats.completed, icon: CheckCircle, gradient: 'from-green-500 to-emerald-500' },
          { label: 'Pending', mobileLabel: 'Pending', value: stats.pending, icon: Clock, gradient: 'from-orange-500 to-red-500' },
          { label: 'Avg Score', mobileLabel: 'Avg', value: `${stats.avgScore.toFixed(1)}%`, icon: Award, gradient: 'from-purple-500 to-pink-500' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${isMobileViewport ? 'min-w-0 rounded-lg px-1.5 py-2 text-center' : 'rounded-xl p-5'} bg-white shadow-md border border-gray-100`}
          >
            <div className={`${isMobileViewport ? 'mx-auto mb-1 h-6 w-6 rounded-lg' : 'mb-3 h-12 w-12 rounded-lg'} bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
              <stat.icon className={`${isMobileViewport ? 'h-3 w-3' : 'h-6 w-6'} text-white`} />
            </div>
            <p className={`${isMobileViewport ? 'text-base leading-none' : 'text-3xl'} font-bold text-gray-900`}>{stat.value}</p>
            <p className={`${isMobileViewport ? 'mt-1 text-[10px] leading-tight' : 'mt-1 text-sm'} text-gray-600`}>
              {isMobileViewport ? stat.mobileLabel : stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`${isMobileViewport ? 'rounded-xl p-4' : 'rounded-2xl p-6'} bg-white shadow-lg border border-gray-100`}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <label className={`block font-semibold text-gray-700 ${isMobileViewport ? 'mb-3 text-sm' : 'mb-2 text-sm'}`}>Status</label>
            <div className={isMobileViewport ? 'flex items-center gap-2' : 'flex flex-wrap gap-2'}>
              {[
                { id: 'all', label: 'All Tests' },
                { id: 'completed', label: 'Completed' },
                { id: 'pending', label: 'Pending' },
                { id: 'upcoming', label: 'Upcoming' }
              ].map(filter => (
                <motion.button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id as any)}
                  className={`${isMobileViewport ? 'min-w-0 flex-1 px-1 py-1.5 text-[10px]' : 'px-4 py-2'} rounded-lg font-medium transition-all ${
                    selectedFilter === filter.id
                      ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isMobileViewport
                    ? filter.id === 'all'
                      ? 'All'
                      : filter.id === 'completed'
                      ? 'Done'
                      : filter.label
                    : filter.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Test Cards Grid */}
      <div className="grid grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          (() => {
            const isLoadingOverview = loadingOverviewTestId === test.id;
            const isLoadingAnalysis = Boolean(
              test.status === 'completed' &&
              test.latestAttemptId &&
              loadingAnalysisAttemptId === test.latestAttemptId
            );

            return (
          <div
            key={test.id}
            className="h-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all flex flex-col"
          >
            {/* Card Header */}
            <div className={`p-6 ${
              test.status === 'completed' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
              test.status === 'upcoming' ? 'bg-gradient-to-r from-gray-50 to-gray-100' :
              'bg-gradient-to-r from-blue-50 to-indigo-50'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className={`${isMobileViewport ? 'text-lg' : 'text-xl'} font-bold text-gray-900 group-hover:text-indigo-600 transition-colors`}>
                    {test.title}
                  </h3>
                  <p className={`mt-2 ${isMobileViewport ? 'text-xs' : 'text-sm'} font-semibold text-gray-600`}>{getStatusLabel(test.status)}</p>
                </div>
                {test.status === 'completed' && (
                  <div className="flex items-center gap-2">
                    {test.startTimeStatus && (
                      <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                        test.startTimeStatus === 'on-time'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {test.startTimeStatus === 'on-time' ? 'ON TIME' : 'LATE'}
                      </span>
                    )}
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                )}
                {test.status === 'upcoming' && (
                  <div className="flex items-center gap-2">
                    <Lock className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Test Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className={`${isMobileViewport ? 'text-xs' : 'text-sm'} text-gray-700 font-medium`}>{test.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className={`${isMobileViewport ? 'text-xs' : 'text-sm'} text-gray-700 font-medium`}>{test.questions} Qs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-600" />
                  <span className={`${isMobileViewport ? 'text-xs' : 'text-sm'} text-gray-700 font-medium`}>{test.totalMarks} marks</span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 flex flex-1 flex-col">
              {/* Additional Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Scheduled</span>
                  </div>
                  <span className="font-medium text-gray-900 text-right">{formatSchedule(test.scheduledDate, test.scheduledTime)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Enrolled</span>
                  </div>
                  <span className="font-medium text-gray-900">{test.enrolled.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Target className="w-4 h-4" />
                    <span>Attempts</span>
                  </div>
                  <span className="font-medium text-gray-900">{test.attempts}/{test.maxAttempts ?? 1}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-auto space-y-3">
                <motion.button
                  onClick={() => {
                    if (test.status === 'completed') {
                      onViewAnalytics(test.latestAttemptId);
                    } else if (test.status === 'pending') {
                      const publishedMatch = publishedTests.find((publishedTest) => publishedTest.id === test.id);
                      if (publishedMatch) {
                        void onStartTest(publishedMatch);
                      }
                    }
                  }}
                  disabled={test.status === 'upcoming' || isLoadingAnalysis || isLoadingOverview}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    test.status === 'upcoming'
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isLoadingOverview
                      ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white cursor-wait shadow-lg'
                      : isLoadingAnalysis
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white cursor-wait'
                      : test.status === 'completed'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {test.status === 'upcoming' ? (
                    <>
                      <Calendar className="w-5 h-5" />
                      Upcoming
                    </>
                  ) : test.status === 'completed' ? (
                    <>
                      <BarChart3 className="w-5 h-5" />
                      {isLoadingAnalysis ? 'Loading Analysis...' : 'View Analysis'}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      {isLoadingOverview ? 'Loading...' : test.hasActiveAttempt ? 'Resume Test' : 'Start Test'}
                    </>
                  )}
                </motion.button>
                {test.status === 'completed' && test.attempts < (test.maxAttempts ?? 1) && (
                  <motion.button
                    onClick={() => {
                      const publishedMatch = publishedTests.find((publishedTest) => publishedTest.id === test.id);
                      if (publishedMatch) {
                        void onStartTest(publishedMatch);
                      }
                    }}
                    disabled={isLoadingOverview}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      isLoadingOverview
                        ? 'border border-blue-200 text-blue-700 bg-blue-100 cursor-wait'
                        : 'border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    {isLoadingOverview ? 'Loading...' : 'Attempt Again'}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
            );
          })()
        ))}
      </div>

      {/* Empty State */}
      {filteredTests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tests found</h3>
          <p className="text-gray-600">Try adjusting your filters to see more tests</p>
        </motion.div>
      )}
    </div>
  );
}
