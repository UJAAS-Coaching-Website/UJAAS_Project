import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Clock,
  Users,
  Award,
  TrendingUp,
  ChevronRight,
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
  status: 'not-started' | 'in-progress' | 'completed' | 'locked';
  score?: number;
  attempts: number;
  scheduledDate?: string;
  enrolled: number;
  passingMarks: number;
  savedAnswers?: Record<string, number | null>;
  timeSpent?: number;
  realQuestions?: any[];
}

const MOCK_TEST_SERIES: TestSeries[] = [
  {
    id: '1',
    title: 'JEE Main Full Length Test #1',
    subject: 'All Subjects',
    duration: 180,
    totalMarks: 300,
    questions: 90,
    difficulty: 'Hard',
    status: 'completed',
    score: 245,
    attempts: 1,
    scheduledDate: '2026-02-10',
    enrolled: 1234,
    passingMarks: 180
  },
  {
    id: '2',
    title: 'Physics Chapter Test - Mechanics',
    subject: 'Physics',
    duration: 90,
    totalMarks: 100,
    questions: 30,
    difficulty: 'Medium',
    status: 'in-progress',
    score: 65,
    attempts: 1,
    scheduledDate: '2026-02-12',
    enrolled: 856,
    passingMarks: 50,
    savedAnswers: {},
    timeSpent: 1800
  },
  {
    id: '3',
    title: 'Chemistry Organic Chemistry Test',
    subject: 'Chemistry',
    duration: 60,
    totalMarks: 80,
    questions: 25,
    difficulty: 'Medium',
    status: 'not-started',
    attempts: 0,
    scheduledDate: '2026-02-18',
    enrolled: 945,
    passingMarks: 40
  },
  {
    id: '4',
    title: 'Mathematics Advanced Calculus',
    subject: 'Mathematics',
    duration: 120,
    totalMarks: 120,
    questions: 40,
    difficulty: 'Hard',
    status: 'not-started',
    attempts: 0,
    scheduledDate: '2026-02-20',
    enrolled: 723,
    passingMarks: 60
  },
  {
    id: '5',
    title: 'JEE Advanced Mock Test #1',
    subject: 'All Subjects',
    duration: 180,
    totalMarks: 360,
    questions: 54,
    difficulty: 'Hard',
    status: 'locked',
    attempts: 0,
    scheduledDate: '2026-03-01',
    enrolled: 2100,
    passingMarks: 180
  },
  {
    id: '6',
    title: 'Physics Waves & Optics Test',
    subject: 'Physics',
    duration: 75,
    totalMarks: 100,
    questions: 30,
    difficulty: 'Easy',
    status: 'not-started',
    attempts: 0,
    scheduledDate: '2026-02-25',
    enrolled: 678,
    passingMarks: 50
  }
];

interface TestSeriesProps {
  onStartTest: (testId: string, testTitle: string, duration: number, totalMarks: number, questionCount: number, subject: string, questions?: any[]) => void;
  onContinueTest: (testId: string, testTitle: string, duration: number, totalMarks: number, questionCount: number, subject: string, savedAnswers: Record<string, number | null>, timeSpent: number) => void;
  onViewAnalytics: (testId: string) => void;
  onViewResults: () => void;
  publishedTests?: import('../App').PublishedTest[];
  userBatch?: string;
}

export function TestSeriesSection({ 
  onStartTest, 
  onContinueTest, 
  onViewAnalytics, 
  onViewResults,
  publishedTests = [],
  userBatch
}: TestSeriesProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending' | 'locked'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const mappedPublishedTests: TestSeries[] = (publishedTests || [])
    .filter(t => !userBatch || t.batches.includes(userBatch))
    .map(t => ({
      id: t.id,
      title: t.title,
      subject: t.format === 'JEE MAIN' ? 'All Subjects' : t.format === 'NEET' ? 'All Subjects' : 'Custom',
      duration: t.duration,
      totalMarks: t.totalMarks,
      questions: t.questions.length,
      difficulty: 'Medium',
      status: 'not-started',
      attempts: 0,
      scheduledDate: t.scheduleDate,
      enrolled: 100,
      passingMarks: Math.floor(t.totalMarks * 0.4),
      realQuestions: t.questions
    }));

  const allTests = [...mappedPublishedTests, ...MOCK_TEST_SERIES];

  const filteredTests = allTests.filter(test => {
    const statusFilter = 
      selectedFilter === 'all' ? true :
      selectedFilter === 'completed' ? test.status === 'completed' :
      selectedFilter === 'pending' ? test.status === 'not-started' || test.status === 'in-progress' :
      selectedFilter === 'locked' ? test.status === 'locked' : true;
    
    const subjectFilter = selectedSubject === 'all' ? true : test.subject === selectedSubject;
    
    return statusFilter && subjectFilter;
  });

  const stats = {
    total: allTests.length,
    completed: allTests.filter(t => t.status === 'completed').length,
    pending: allTests.filter(t => t.status === 'not-started' || t.status === 'in-progress').length,
    avgScore: 82
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Series</h1>
            <p className="text-gray-600">Practice with comprehensive test series to excel in your exams</p>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={onViewResults}
            >
              View Results
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tests', value: stats.total, icon: FileText, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, gradient: 'from-green-500 to-emerald-500' },
          { label: 'Pending', value: stats.pending, icon: Clock, gradient: 'from-orange-500 to-red-500' },
          { label: 'Avg Score', value: `${stats.avgScore}%`, icon: TrendingUp, gradient: 'from-purple-500 to-pink-500' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-xl p-5 shadow-md border border-gray-100"
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Tests' },
                { id: 'completed', label: 'Completed' },
                { id: 'pending', label: 'Pending' },
                { id: 'locked', label: 'Locked' }
              ].map(filter => (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFilter(filter.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedFilter === filter.id
                      ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Subject Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'Physics', label: 'Physics' },
                { id: 'Chemistry', label: 'Chemistry' },
                { id: 'Mathematics', label: 'Mathematics' }
              ].map(subject => (
                <motion.button
                  key={subject.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedSubject === subject.id
                      ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {subject.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Test Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          <div
            key={test.id}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
          >
            {/* Card Header */}
            <div className={`p-6 ${
              test.status === 'completed' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
              test.status === 'in-progress' ? 'bg-gradient-to-r from-orange-50 to-yellow-50' :
              test.status === 'locked' ? 'bg-gradient-to-r from-gray-50 to-gray-100' :
              'bg-gradient-to-r from-blue-50 to-indigo-50'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-700">
                      {test.subject}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {test.title}
                  </h3>
                </div>
                {test.status === 'completed' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                )}
                {test.status === 'locked' && (
                  <div className="flex items-center gap-2">
                    <Lock className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Test Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium">{test.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium">{test.questions} Qs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium">{test.totalMarks} marks</span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Score Display */}
              {test.status === 'completed' && test.score !== undefined && (
                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Your Score</span>
                    <span className="text-2xl font-bold text-green-600">
                      {test.score}/{test.totalMarks}
                    </span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(test.score / test.totalMarks) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {test.score >= test.passingMarks ? '✓ Passed' : '✗ Not Passed'} • Passing: {test.passingMarks} marks
                  </p>
                </div>
              )}

              {/* Additional Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Scheduled</span>
                  </div>
                  <span className="font-medium text-gray-900">{test.scheduledDate}</span>
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
                  <span className="font-medium text-gray-900">{test.attempts}/3</span>
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (test.status === 'completed') {
                    onViewAnalytics(test.id);
                  } else if (test.status === 'in-progress') {
                    onContinueTest(
                      test.id,
                      test.title,
                      test.duration,
                      test.totalMarks,
                      test.questions,
                      test.subject,
                      test.savedAnswers || {},
                      test.timeSpent || 0
                    );
                  } else if (test.status === 'not-started') {
                    onStartTest(
                      test.id,
                      test.title,
                      test.duration,
                      test.totalMarks,
                      test.questions,
                      test.subject,
                      test.realQuestions
                    );
                  }
                }}
                disabled={test.status === 'locked'}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  test.status === 'locked'
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : test.status === 'completed'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {test.status === 'locked' ? (
                  <>
                    <Lock className="w-5 h-5" />
                    Locked
                  </>
                ) : test.status === 'completed' ? (
                  <>
                    <BarChart3 className="w-5 h-5" />
                    View Analysis
                  </>
                ) : test.status === 'in-progress' ? (
                  <>
                    <Play className="w-5 h-5" />
                    Continue Test
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Test
                  </>
                )}
              </motion.button>
            </div>
          </div>
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
