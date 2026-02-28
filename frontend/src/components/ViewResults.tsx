import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  Target,
  Clock,
  Calendar,
  BarChart3,
  ChevronRight,
  X,
  Filter,
  Download,
  Trophy,
  BookOpen,
  CheckCircle,
  XCircle,
  Percent,
  Users
} from 'lucide-react';

interface TestResult {
  id: string;
  testTitle: string;
  date: string;
  score: number;
  totalMarks: number;
  percentage: number;
  rank: number;
  totalStudents: number;
  timeSpent: number;
  duration: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  totalQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const MOCK_RESULTS: TestResult[] = [
  {
    id: '1',
    testTitle: 'JEE Main Full Length Test #1',
    date: '2026-02-10',
    score: 245,
    totalMarks: 300,
    percentage: 81.7,
    rank: 23,
    totalStudents: 1234,
    timeSpent: 9600,
    duration: 10800,
    correctAnswers: 72,
    wrongAnswers: 13,
    unattempted: 5,
    totalQuestions: 90,
    difficulty: 'Hard'
  },
  {
    id: '2',
    testTitle: 'Physics Chapter Test - Mechanics',
    date: '2026-02-08',
    score: 78,
    totalMarks: 100,
    percentage: 78.0,
    rank: 45,
    totalStudents: 856,
    timeSpent: 4200,
    duration: 5400,
    correctAnswers: 24,
    wrongAnswers: 4,
    unattempted: 2,
    totalQuestions: 30,
    difficulty: 'Medium'
  },
  {
    id: '3',
    testTitle: 'Mathematics Calculus Test',
    date: '2026-02-05',
    score: 92,
    totalMarks: 120,
    percentage: 76.7,
    rank: 67,
    totalStudents: 723,
    timeSpent: 5800,
    duration: 7200,
    correctAnswers: 28,
    wrongAnswers: 8,
    unattempted: 4,
    totalQuestions: 40,
    difficulty: 'Hard'
  },
  {
    id: '4',
    testTitle: 'Chemistry Organic Test',
    date: '2026-02-01',
    score: 68,
    totalMarks: 80,
    percentage: 85.0,
    rank: 12,
    totalStudents: 945,
    timeSpent: 3200,
    duration: 3600,
    correctAnswers: 22,
    wrongAnswers: 2,
    unattempted: 1,
    totalQuestions: 25,
    difficulty: 'Medium'
  },
  {
    id: '5',
    testTitle: 'Physics Waves & Optics',
    date: '2026-01-28',
    score: 55,
    totalMarks: 100,
    percentage: 55.0,
    rank: 234,
    totalStudents: 678,
    timeSpent: 5000,
    duration: 4500,
    correctAnswers: 16,
    wrongAnswers: 10,
    unattempted: 4,
    totalQuestions: 30,
    difficulty: 'Easy'
  }
];

interface ViewResultsProps {
  onClose: () => void;
  onViewDetailedAnalytics: (testId: string) => void;
}

export function ViewResults({ onClose, onViewDetailedAnalytics }: ViewResultsProps) {
  const filteredResults = MOCK_RESULTS;

  // Calculate overall stats
  const totalTests = filteredResults.length;
  const averageScore = filteredResults.reduce((acc, r) => acc + r.percentage, 0) / totalTests;
  const averageRank = Math.floor(filteredResults.reduce((acc, r) => acc + r.rank, 0) / totalTests);
  const averageAccuracy = Math.floor(filteredResults.reduce((acc, r) => acc + (r.correctAnswers / r.totalQuestions) * 100, 0) / totalTests);
  
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Test Results</h1>
            <p className="text-sm sm:text-base text-gray-600">Your complete performance history and analytics</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Tests Attempted', 
            value: totalTests.toString(), 
            icon: BookOpen, 
            gradient: 'from-blue-500 to-cyan-500'
          },
          { 
            label: 'Average Score', 
            value: `${averageScore.toFixed(1)}%`, 
            icon: Target, 
            gradient: 'from-green-500 to-emerald-500'
          },
          { 
            label: 'Average Rank', 
            value: `#${averageRank}`, 
            icon: Trophy, 
            gradient: 'from-yellow-500 to-orange-500'
          },
          { 
            label: 'Avg Accuracy', 
            value: `${averageAccuracy}%`, 
            icon: Award, 
            gradient: 'from-purple-500 to-pink-500'
          }
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 shadow-lg border border-gray-100"
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Recent Test Results</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Test</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Score</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Percentage</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Performance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredResults.map((result, index) => {
                const accuracy = ((result.correctAnswers / result.totalQuestions) * 100).toFixed(1);

                return (
                  <tr
                    key={result.id}
                    className="hover:bg-indigo-50/50 transition"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{result.testTitle}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{result.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{result.score}/{result.totalMarks}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              result.percentage >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              result.percentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${result.percentage}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900">{result.percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {result.rank <= 10 && <Trophy className="w-4 h-4 text-yellow-500" />}
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
                      <button
                        onClick={() => onViewDetailedAnalytics(result.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
