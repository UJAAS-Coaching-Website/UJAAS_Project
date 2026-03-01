import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  ChevronRight
} from 'lucide-react';
import { StudentAnalytics } from './StudentAnalytics';

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  submittedAt: string;
  score: number;
  totalMarks: number;
  accuracy: number;
  rank: number;
  timeSpent: number;
  result: any; // The full result object for StudentAnalytics
}

interface TestPerformanceInsightsProps {
  testTitle: string;
  testId: string;
  performances: StudentPerformance[];
  onClose: () => void;
}

export function TestPerformanceInsights({ testTitle, performances, onClose }: TestPerformanceInsightsProps) {
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPerformances = performances.filter(p => 
    p.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedStudent) {
    return (
      <div className="fixed inset-0 bg-white z-[10005] overflow-y-auto">
        <StudentAnalytics 
          result={selectedStudent.result} 
          onClose={() => setSelectedStudent(null)} 
          hideExplanations={true}
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
        {/* Header */}
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
                <p className="text-gray-500">Performance Insights & Student Submissions</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {performances.length} Submissions
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Submitted At</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Accuracy</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPerformances.map((perf) => (
                  <tr 
                    key={perf.studentId}
                    onClick={() => setSelectedStudent(perf)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        perf.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        perf.rank === 2 ? 'bg-slate-100 text-slate-600' :
                        perf.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        #{perf.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{perf.studentName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(perf.submittedAt).toLocaleDateString()}
                        <Clock className="w-3.5 h-3.5 ml-1" />
                        {new Date(perf.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{perf.score} / {perf.totalMarks}</span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(perf.score / perf.totalMarks) * 100}%` }}
                          />
                        </div>
                      </div>
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
                ))}
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
      </div>
    </motion.div>
  );
}
