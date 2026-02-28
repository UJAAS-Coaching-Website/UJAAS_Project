import { motion } from 'motion/react';
import {
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
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

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  subject: string;
  marks: number;
  userAnswer?: number | null;
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
  subjectWise: {
    subject: string;
    total: number;
    correct: number;
    wrong: number;
    unattempted: number;
    marks: number;
    maxMarks: number;
  }[];
}

interface StudentAnalyticsProps {
  result: TestResult;
  onClose: () => void;
  onViewResults?: (testId: string) => void;
}

export function StudentAnalytics({ result, onClose, onViewResults }: StudentAnalyticsProps) {
  const accuracy = result.totalQuestions > 0 
    ? ((result.correctAnswers / result.totalQuestions) * 100).toFixed(1)
    : '0.0';
  
  const percentage = ((result.obtainedMarks / result.totalMarks) * 100).toFixed(1);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
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
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-all"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>

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

        {/* Subject-wise Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Subject-wise Performance</h2>
          </div>

          <div className="space-y-4">
            {result.subjectWise.map((subject, index) => {
              const subjectPercentage = ((subject.marks / subject.maxMarks) * 100).toFixed(1);
              const subjectAccuracy = subject.total > 0 
                ? ((subject.correct / subject.total) * 100).toFixed(1)
                : '0.0';

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{subject.subject}</h3>
                        <p className="text-sm text-gray-600">
                          {subject.correct} correct • {subject.wrong} wrong • {subject.unattempted} unattempted
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{subject.marks}/{subject.maxMarks}</p>
                      <p className="text-sm text-gray-600">{subjectPercentage}% • Accuracy: {subjectAccuracy}%</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${subjectPercentage}%` }}
                      transition={{ duration: 1, delay: 0.7 + index * 0.1 }}
                      className={`h-3 rounded-full ${
                        parseFloat(subjectPercentage) >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        parseFloat(subjectPercentage) >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Question-wise Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Question-wise Analysis</h2>

          <div className="space-y-4">
            {result.questions.map((question, index) => {
              const isCorrect = question.userAnswer === question.correctAnswer;
              const isAttempted = question.userAnswer !== undefined && question.userAnswer !== null;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.02 }}
                  className={`p-5 rounded-xl border-2 ${
                    !isAttempted ? 'bg-gray-50 border-gray-200' :
                    isCorrect ? 'bg-green-50 border-green-200' :
                    'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !isAttempted ? 'bg-gray-200 text-gray-600' :
                      isCorrect ? 'bg-green-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {!isAttempted ? '−' : isCorrect ? '✓' : '✗'}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-gray-900">Q{index + 1}.</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {question.subject}
                        </span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          {question.marks} marks
                        </span>
                      </div>
                      
                      <p className="text-gray-900 font-medium mb-3">{question.text}</p>

                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const isUserAnswer = question.userAnswer === optIndex;
                          const isCorrectAnswer = question.correctAnswer === optIndex;

                          return (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border ${
                                isCorrectAnswer ? 'bg-green-100 border-green-300' :
                                isUserAnswer ? 'bg-red-100 border-red-300' :
                                'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCorrectAnswer && <CheckCircle className="w-4 h-4 text-green-600" />}
                                {isUserAnswer && !isCorrectAnswer && <XCircle className="w-4 h-4 text-red-600" />}
                                <span className="text-sm text-gray-900">{option}</span>
                                {isCorrectAnswer && (
                                  <span className="ml-auto text-xs font-semibold text-green-700">Correct Answer</span>
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <span className="ml-auto text-xs font-semibold text-red-700">Your Answer</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
