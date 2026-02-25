import { motion } from 'motion/react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Award,
  Clock,
  Target,
  Percent,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  Calendar
} from 'lucide-react';

interface StudentPerformance {
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  rank: number;
  percentile: number;
}

interface AdminTestAnalyticsProps {
  testTitle: string;
  testId: string;
  totalMarks: number;
  totalQuestions: number;
  duration: number;
  studentsAttempted: number;
  totalEnrolled: number;
  averageScore: number;
  averagePercentage: number;
  averageTime: number;
  highestScore: number;
  lowestScore: number;
  studentPerformances: StudentPerformance[];
  questionAnalysis: {
    questionNo: number;
    subject: string;
    correctAttempts: number;
    wrongAttempts: number;
    skipped: number;
    difficulty: number; // 0-100, higher = harder
  }[];
  onClose: () => void;
}

export function AdminTestAnalytics({
  testTitle,
  totalMarks,
  totalQuestions,
  duration,
  studentsAttempted,
  totalEnrolled,
  averageScore,
  averagePercentage,
  averageTime,
  highestScore,
  lowestScore,
  studentPerformances,
  questionAnalysis,
  onClose
}: AdminTestAnalyticsProps) {
  const attemptRate = ((studentsAttempted / totalEnrolled) * 100).toFixed(1);
  
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  // Distribution buckets
  const getDistribution = () => {
    const buckets = [
      { range: '0-25%', count: 0, color: 'red' },
      { range: '25-50%', count: 0, color: 'orange' },
      { range: '50-75%', count: 0, color: 'yellow' },
      { range: '75-100%', count: 0, color: 'green' }
    ];

    studentPerformances.forEach(student => {
      const percentage = (student.score / totalMarks) * 100;
      if (percentage < 25) buckets[0].count++;
      else if (percentage < 50) buckets[1].count++;
      else if (percentage < 75) buckets[2].count++;
      else buckets[3].count++;
    });

    return buckets;
  };

  const distribution = getDistribution();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{testTitle}</h1>
              <p className="text-gray-600">Admin Analytics Dashboard</p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-all"
              >
                <Download className="w-5 h-5" />
                Export Data
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { 
              icon: Users, 
              label: 'Attempted', 
              value: `${studentsAttempted}/${totalEnrolled}`,
              subtext: `${attemptRate}% attempt rate`,
              color: 'blue',
              gradient: 'from-blue-500 to-cyan-500'
            },
            { 
              icon: Target, 
              label: 'Average Score', 
              value: `${averageScore}/${totalMarks}`,
              subtext: `${averagePercentage.toFixed(1)}%`,
              color: 'purple',
              gradient: 'from-purple-500 to-pink-500'
            },
            { 
              icon: Award, 
              label: 'Highest Score', 
              value: highestScore.toString(),
              subtext: `Lowest: ${lowestScore}`,
              color: 'green',
              gradient: 'from-green-500 to-emerald-500'
            },
            { 
              icon: Clock, 
              label: 'Avg Time', 
              value: formatTime(averageTime),
              subtext: `of ${duration} min`,
              color: 'orange',
              gradient: 'from-orange-500 to-red-500'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
            </motion.div>
          ))}
        </div>

        {/* Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Score Distribution</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {distribution.map((bucket, index) => {
              const maxCount = Math.max(...distribution.map(b => b.count));
              const heightPercentage = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="relative h-48 bg-gray-100 rounded-xl mb-3 flex items-end justify-center p-4">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercentage}%` }}
                      transition={{ duration: 1, delay: 0.7 + index * 0.1 }}
                      className={`w-full bg-gradient-to-t ${
                        bucket.color === 'red' ? 'from-red-500 to-pink-500' :
                        bucket.color === 'orange' ? 'from-orange-500 to-yellow-500' :
                        bucket.color === 'yellow' ? 'from-yellow-500 to-amber-500' :
                        'from-green-500 to-emerald-500'
                      } rounded-lg flex items-center justify-center`}
                    >
                      <span className="text-2xl font-bold text-white">{bucket.count}</span>
                    </motion.div>
                  </div>
                  <p className="font-semibold text-gray-900">{bucket.range}</p>
                  <p className="text-sm text-gray-600">
                    {studentsAttempted > 0 ? ((bucket.count / studentsAttempted) * 100).toFixed(1) : '0.0'}% students
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Question Difficulty Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Question Analysis</h2>
            </div>
            <p className="text-sm text-gray-600">Sorted by difficulty</p>
          </div>

          <div className="space-y-3">
            {questionAnalysis
              .sort((a, b) => b.difficulty - a.difficulty)
              .slice(0, 10)
              .map((question, index) => {
                const totalAttempts = question.correctAttempts + question.wrongAttempts;
                const successRate = totalAttempts > 0 
                  ? ((question.correctAttempts / totalAttempts) * 100).toFixed(1)
                  : '0.0';

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                          {question.questionNo}
                        </span>
                        <div>
                          <span className="font-semibold text-gray-900">Question {question.questionNo}</span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{question.subject}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-semibold">{question.correctAttempts}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="font-semibold">{question.wrongAttempts}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="font-semibold">{question.skipped} skipped</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${successRate}%` }}
                          transition={{ duration: 1, delay: 0.8 + index * 0.05 }}
                          className={`h-2 rounded-full ${
                            parseFloat(successRate) >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            parseFloat(successRate) >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 min-w-[4ch]">{successRate}%</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        question.difficulty >= 70 ? 'bg-red-100 text-red-700' :
                        question.difficulty >= 40 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {question.difficulty >= 70 ? 'Hard' : question.difficulty >= 40 ? 'Medium' : 'Easy'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>

        {/* Student Performance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Student Performance</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-all"
              >
                <Filter className="w-4 h-4" />
                Filter
              </motion.button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Score</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Percentage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Accuracy</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Percentile</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {studentPerformances
                  .sort((a, b) => b.score - a.score)
                  .map((student, index) => {
                    const percentage = ((student.score / totalMarks) * 100).toFixed(1);
                    const accuracy = ((student.correctAnswers / totalQuestions) * 100).toFixed(1);

                    return (
                      <motion.tr
                        key={student.studentId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + index * 0.02 }}
                        className="hover:bg-purple-50/50 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {index < 3 && (
                              <Award className={`w-5 h-5 ${
                                index === 0 ? 'text-yellow-500' :
                                index === 1 ? 'text-gray-400' :
                                'text-orange-600'
                              }`} />
                            )}
                            <span className="font-bold text-gray-900">#{student.rank}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {student.studentName.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">{student.studentName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-gray-900">{student.score}/{totalMarks}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  parseFloat(percentage) >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                  parseFloat(percentage) >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                  'bg-gradient-to-r from-red-500 to-pink-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-900">{percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">{accuracy}%</span>
                          <span className="text-sm text-gray-600 ml-1">
                            ({student.correctAnswers}/{totalQuestions})
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{formatTime(student.timeSpent)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                            {student.percentile}th
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
