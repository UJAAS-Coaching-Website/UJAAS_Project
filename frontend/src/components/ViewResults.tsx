import { Calendar, CheckCircle, Trophy, X, XCircle, BookOpen, Target, Award } from 'lucide-react';
import type { ApiStudentAttemptResultListItem } from '../api/tests';

interface ViewResultsProps {
  results: ApiStudentAttemptResultListItem[];
  onClose: () => void;
  onViewDetailedAnalytics: (attemptId: string) => void;
  loadingAttemptId?: string | null;
}

export function ViewResults({ results, onClose, onViewDetailedAnalytics, loadingAttemptId = null }: ViewResultsProps) {
  const totalAttempts = results.length;
  const averageScore = totalAttempts > 0
    ? results.reduce((sum, result) => sum + result.percentage, 0) / totalAttempts
    : 0;
  const averageRank = totalAttempts > 0
    ? Math.floor(results.reduce((sum, result) => sum + result.rank, 0) / totalAttempts)
    : 0;
  const averageAccuracy = totalAttempts > 0
    ? Math.floor(results.reduce((sum, result) => sum + ((result.correctAnswers / Math.max(1, result.totalQuestions)) * 100), 0) / totalAttempts)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Attempt History</h1>
            <p className="text-sm sm:text-base text-gray-600">All submitted attempts across your tests</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all self-start sm:self-auto"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Attempts', value: totalAttempts.toString(), icon: BookOpen, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Average Score', value: `${averageScore.toFixed(1)}%`, icon: Target, gradient: 'from-green-500 to-emerald-500' },
          { label: 'Average Rank', value: totalAttempts > 0 ? `#${averageRank}` : '-', icon: Trophy, gradient: 'from-yellow-500 to-orange-500' },
          { label: 'Avg Accuracy', value: `${averageAccuracy}%`, icon: Award, gradient: 'from-purple-500 to-pink-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-lg border border-gray-100">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Submitted Attempts</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Test</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Attempt</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Submitted</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Score</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Performance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-indigo-50/50 transition">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{result.testTitle}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-gray-900">Attempt {result.attemptNo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{new Date(result.submittedAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-gray-900">{result.score}/{result.totalMarks}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {result.rank <= 10 ? <Trophy className="w-4 h-4 text-yellow-500" /> : null}
                      <span className="font-bold text-gray-900">#{result.rank}</span>
                      <span className="text-sm text-gray-600">/ {result.totalStudents}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold">{result.correctAnswers}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span className="font-semibold">{result.wrongAnswers}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const isLoading = loadingAttemptId === result.id;
                      return (
                    <button
                      onClick={() => onViewDetailedAnalytics(result.id)}
                      disabled={isLoading}
                      className={`px-4 py-2 text-white rounded-lg font-medium transition-all ${
                        isLoading
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 cursor-wait'
                          : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 hover:shadow-lg'
                      }`}
                    >
                      {isLoading ? 'Loading Details...' : 'View Details'}
                    </button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {results.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No submitted attempts yet.</div>
        ) : null}
      </div>
    </div>
  );
}
