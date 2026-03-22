import { useState } from 'react';
import { Calendar, CheckCircle, Trophy, X, XCircle, BookOpen, Target, Award, ChevronRight } from 'lucide-react';
import type { ApiStudentAttemptResultListItem } from '../api/tests';
import { StatCardSkeleton, TableRowsSkeleton } from './ui/content-skeletons';
import { useIsMobileViewport } from '../hooks/useViewport';

interface ViewResultsProps {
  results: ApiStudentAttemptResultListItem[];
  onClose: () => void;
  onViewDetailedAnalytics: (attemptId: string) => void;
  loadingAttemptId?: string | null;
  isLoading?: boolean;
}

export function ViewResults({
  results,
  onClose,
  onViewDetailedAnalytics,
  loadingAttemptId = null,
  isLoading = false
}: ViewResultsProps) {
  const isMobileViewport = useIsMobileViewport();
  const [openingAttemptId, setOpeningAttemptId] = useState<string | null>(null);
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

  const formatAttemptOrdinal = (attemptNo: number) => {
    const mod100 = attemptNo % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${attemptNo}th`;
    switch (attemptNo % 10) {
      case 1:
        return `${attemptNo}st`;
      case 2:
        return `${attemptNo}nd`;
      case 3:
        return `${attemptNo}rd`;
      default:
        return `${attemptNo}th`;
    }
  };

  const triggerRowShimmer = (attemptId: string) => {
    setOpeningAttemptId(attemptId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Attempt History</h1>
            <p className="text-sm text-gray-600">All submitted attempts across your tests</p>
          </div>
          <button
            onClick={onClose}
            className={`${isMobileViewport ? 'absolute top-2 right-2' : 'self-start sm:self-auto'} p-2 hover:bg-gray-100 rounded-lg transition-all`}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div
        className={`${isMobileViewport ? 'grid gap-2' : 'grid grid-cols-2 lg:grid-cols-4 gap-4'}`}
        style={isMobileViewport ? { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' } : undefined}
      >
        {isLoading ? Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={`result-stat-skeleton-${index}`} />
        )) : [
          { label: 'Attempts', mobileLabel: 'Attempts', value: totalAttempts.toString(), icon: BookOpen, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Average Score', mobileLabel: 'Avg', value: `${averageScore.toFixed(1)}%`, icon: Target, gradient: 'from-green-500 to-emerald-500' },
          { label: 'Average Rank', mobileLabel: 'Rank', value: totalAttempts > 0 ? `#${averageRank}` : '-', icon: Trophy, gradient: 'from-yellow-500 to-orange-500' },
          { label: 'Avg Accuracy', mobileLabel: 'Acc', value: `${averageAccuracy}%`, icon: Award, gradient: 'from-purple-500 to-pink-500' },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className={`${isMobileViewport ? 'min-w-0 rounded-lg px-1.5 py-2 text-center' : 'rounded-xl p-5'} bg-white shadow-md border border-gray-100`}
          >
            <div className={`${isMobileViewport ? 'mx-auto mb-1 h-6 w-6 rounded-lg' : 'mb-3 h-12 w-12 rounded-lg'} bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
              <stat.icon className={`${isMobileViewport ? 'h-3 w-3' : 'h-6 w-6'} text-white`} />
            </div>
            <p className={`${isMobileViewport ? 'text-base leading-none' : 'text-3xl'} font-bold text-gray-900`}>{stat.value}</p>
            <p className={`${isMobileViewport ? 'mt-1 text-[10px] leading-tight' : 'mt-1 text-sm'} text-gray-600`}>
              {isMobileViewport ? stat.mobileLabel : stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Submitted Attempts</h2>
        </div>

        {isLoading ? (
          <TableRowsSkeleton rows={6} columns={7} />
        ) : (
        <div className="overflow-x-auto">
          <table className={`${isMobileViewport ? 'w-full table-fixed' : 'w-full'}`}>
            {isMobileViewport && (
              <colgroup>
                <col style={{ width: '46%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
            )}
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <th className={`${isMobileViewport ? 'px-4 py-3' : 'px-6 py-4'} text-left text-xs font-semibold text-gray-700 uppercase`}>Test</th>
                <th className={`${isMobileViewport ? 'pl-1 pr-2 py-3' : 'px-6 py-4'} text-left text-xs font-semibold text-gray-700 uppercase`}>Attempt</th>
                {!isMobileViewport && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Submitted</th>
                )}
                <th className={`${isMobileViewport ? 'px-4 py-3' : 'px-6 py-4'} text-left text-xs font-semibold text-gray-700 uppercase`}>Score</th>
                <th className={`${isMobileViewport ? 'px-4 py-3' : 'px-6 py-4'} text-left text-xs font-semibold text-gray-700 uppercase`}>Rank</th>
                {!isMobileViewport && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Performance
                  </th>
                )}
                {!isMobileViewport && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {results.map((result) => (
                (() => {
                  const isRowShimmering = isMobileViewport && openingAttemptId === result.id;
                  return (
                <tr
                  key={result.id}
                  className={`hover:bg-indigo-50/50 transition ${isMobileViewport ? 'cursor-pointer' : ''} ${
                    isRowShimmering ? 'ujaas-row-shimmer-bg' : ''
                  }`}
                  onClick={isMobileViewport ? () => {
                    triggerRowShimmer(result.id);
                    onViewDetailedAnalytics(result.id);
                  } : undefined}
                >
                  <td className={`${isMobileViewport ? 'px-2 py-3 text-sm' : 'px-6 py-4'}`}>
                    {isMobileViewport ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse shrink-0" aria-hidden="true" />
                        <p className="font-semibold text-gray-900 break-words">{result.testTitle}</p>
                      </div>
                    ) : (
                      <p className="font-semibold text-gray-900">{result.testTitle}</p>
                    )}
                  </td>
                  <td className={`${isMobileViewport ? 'pl-1 pr-2 py-3 text-sm' : 'px-6 py-4'} whitespace-nowrap`}>
                    <span className="font-semibold text-gray-900">
                      {formatAttemptOrdinal(result.attemptNo)}
                    </span>
                  </td>
                  {!isMobileViewport && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{new Date(result.submittedAt).toLocaleString()}</span>
                      </div>
                    </td>
                  )}
                  <td className={`${isMobileViewport ? 'px-2 py-3 text-sm' : 'px-6 py-4'} whitespace-nowrap`}>
                    <span className="font-semibold text-gray-900">{result.score}/{result.totalMarks}</span>
                  </td>
                  <td className={`${isMobileViewport ? 'px-2 py-3 text-sm' : 'px-6 py-4'} whitespace-nowrap`}>
                    <div className="flex items-center gap-2">
                      {!isMobileViewport && result.rank <= 10 ? <Trophy className="w-4 h-4 text-yellow-500" /> : null}
                      <span className="font-semibold text-gray-900">#{result.rank}</span>
                      <span className={`${isMobileViewport ? 'text-xs' : 'text-sm'} text-gray-600`}>/ {result.totalStudents}</span>
                    </div>
                  </td>
                  {!isMobileViewport && (
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
                  )}
                  {!isMobileViewport && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const isLoading = loadingAttemptId === result.id;
                        return (
                      <button
                        onClick={() => onViewDetailedAnalytics(result.id)}
                        disabled={isLoading}
                        className={`px-4 py-2 text-white rounded-lg font-medium transition-all flex items-center justify-center ${
                          isLoading
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 cursor-wait'
                            : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 hover:shadow-lg'
                        }`}
                      >
                      {isLoading ? 'Loading...' : 'View Details'}
                      </button>
                        );
                      })()}
                    </td>
                  )}
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
        </div>
        )}
        {!isLoading && results.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No submitted attempts yet.</div>
        ) : null}
      </div>
    </div>
  );
}
