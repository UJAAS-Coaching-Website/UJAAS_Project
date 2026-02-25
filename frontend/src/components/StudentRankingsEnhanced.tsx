import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Star,
  Target,
  Crown,
  Zap,
  Filter,
  ArrowUpDown,
  X,
  ChevronDown
} from 'lucide-react';
import { StudentRating } from './StudentRating';

type SortBy = 'score' | 'attendance' | 'tests' | 'assignments' | 'name';
type FilterLevel = 'all' | 'excellent' | 'good' | 'average' | 'needs-improvement';
type FilterCourse = 'all' | 'JEE Advanced' | 'JEE Mains' | 'NEET';

export function StudentRankingsEnhanced() {
  const [rankings, setRankings] = useState<StudentRating[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const [filterCourse, setFilterCourse] = useState<FilterCourse>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAndFilterRankings();
  }, [sortBy, sortOrder, filterLevel, filterCourse]);

  // Refresh rankings every second
  useEffect(() => {
    const interval = setInterval(() => {
      loadAndFilterRankings();
    }, 1000);
    return () => clearInterval(interval);
  }, [sortBy, sortOrder, filterLevel, filterCourse]);

  const loadAndFilterRankings = () => {
    const savedRatings = localStorage.getItem('student_ratings');
    if (savedRatings) {
      let ratings: StudentRating[] = JSON.parse(savedRatings);

      // Apply performance level filter
      if (filterLevel !== 'all') {
        ratings = ratings.filter(r => {
          if (filterLevel === 'excellent') return r.overallScore >= 90;
          if (filterLevel === 'good') return r.overallScore >= 75 && r.overallScore < 90;
          if (filterLevel === 'average') return r.overallScore >= 60 && r.overallScore < 75;
          if (filterLevel === 'needs-improvement') return r.overallScore > 0 && r.overallScore < 60;
          return true;
        });
      }

      // Apply course filter (this would need to be stored in ratings)
      // For now, we'll keep all courses visible

      // Apply sorting
      ratings.sort((a, b) => {
        let compareValue = 0;
        
        switch (sortBy) {
          case 'score':
            compareValue = b.overallScore - a.overallScore;
            break;
          case 'attendance':
            compareValue = b.attendance - a.attendance;
            break;
          case 'tests':
            compareValue = b.tests - a.tests;
            break;
          case 'assignments':
            compareValue = b.assignments - a.assignments;
            break;
          case 'name':
            compareValue = a.studentName.localeCompare(b.studentName);
            break;
        }

        return sortOrder === 'asc' ? -compareValue : compareValue;
      });

      setRankings(ratings);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return <Trophy className="w-6 h-6 text-blue-500" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-orange-500';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-400 to-red-500';
      default:
        return 'from-blue-400 to-indigo-500';
    }
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 75) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 60) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score > 0) return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100' };
    return { label: 'Not Rated', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const toggleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const activeFiltersCount = (filterLevel !== 'all' ? 1 : 0) + (filterCourse !== 'all' ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Trophy className="w-8 h-8" />
                Student Rankings
              </h2>
              <p className="text-yellow-100">
                {rankings.length} student{rankings.length !== 1 ? 's' : ''} ranked • {activeFiltersCount > 0 && `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active`}
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="hidden md:block"
            >
              <Zap className="w-16 h-16 text-yellow-300" />
            </motion.div>
          </div>

          {/* Filter and Sort Bar */}
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-lg transition-all ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-white text-orange-600'
                  : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 bg-orange-600 text-white rounded-full text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </motion.button>

            {/* Sort Buttons */}
            {[
              { id: 'score', label: 'Overall' },
              { id: 'tests', label: 'Tests' },
              { id: 'attendance', label: 'Attendance' },
              { id: 'assignments', label: 'Assignments' }
            ].map((sort) => (
              <motion.button
                key={sort.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSort(sort.id as SortBy)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-lg transition-all ${
                  sortBy === sort.id
                    ? 'bg-white text-orange-600'
                    : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                }`}
              >
                {sort.label}
                {sortBy === sort.id && (
                  <motion.div
                    animate={{ rotate: sortOrder === 'asc' ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
                {activeFiltersCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setFilterLevel('all');
                      setFilterCourse('all');
                    }}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </motion.button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Performance Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Performance Level</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'All', color: 'gray' },
                      { id: 'excellent', label: 'Excellent', color: 'green' },
                      { id: 'good', label: 'Good', color: 'blue' },
                      { id: 'average', label: 'Average', color: 'yellow' },
                      { id: 'needs-improvement', label: 'Needs Work', color: 'red' }
                    ].map((level) => (
                      <motion.button
                        key={level.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilterLevel(level.id as FilterLevel)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          filterLevel === level.id
                            ? `bg-${level.color}-500 text-white shadow-md`
                            : `bg-${level.color}-100 text-${level.color}-700 hover:bg-${level.color}-200`
                        }`}
                      >
                        {level.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Course Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'All Courses' },
                      { id: 'JEE Advanced', label: 'JEE Advanced' },
                      { id: 'JEE Mains', label: 'JEE Mains' },
                      { id: 'NEET', label: 'NEET' }
                    ].map((course) => (
                      <motion.button
                        key={course.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilterCourse(course.id as FilterCourse)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          filterCourse === course.id
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {course.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top 3 Podium */}
      {rankings.length >= 3 && rankings[0].overallScore > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="w-full bg-gradient-to-br from-gray-100 to-gray-300 rounded-2xl p-6 shadow-xl relative mt-8">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg"
                >
                  <Medal className="w-8 h-8 text-white" />
                </motion.div>
              </div>
              <div className="text-center mt-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xl">
                  {rankings[1].studentName.charAt(0)}
                </div>
                <h3 className="font-bold text-gray-900 mb-1 truncate">{rankings[1].studentName}</h3>
                <div className="text-3xl font-bold text-gray-700">{rankings[1].overallScore}</div>
                <p className="text-xs text-gray-600">2nd Place</p>
              </div>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="w-full bg-gradient-to-br from-yellow-100 to-orange-300 rounded-2xl p-6 shadow-2xl relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  animate={{ y: [0, -5, 0] }}
                  className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl"
                >
                  <Crown className="w-10 h-10 text-white" />
                </motion.div>
              </div>
              <div className="text-center mt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-2xl">
                  {rankings[0].studentName.charAt(0)}
                </div>
                <h3 className="font-bold text-gray-900 mb-1 text-lg truncate">{rankings[0].studentName}</h3>
                <div className="text-4xl font-bold text-orange-600">{rankings[0].overallScore}</div>
                <p className="text-xs text-gray-600 font-semibold">🏆 Champion</p>
              </div>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="w-full bg-gradient-to-br from-orange-100 to-red-300 rounded-2xl p-6 shadow-xl relative mt-8">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg"
                >
                  <Award className="w-8 h-8 text-white" />
                </motion.div>
              </div>
              <div className="text-center mt-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xl">
                  {rankings[2].studentName.charAt(0)}
                </div>
                <h3 className="font-bold text-gray-900 mb-1 truncate">{rankings[2].studentName}</h3>
                <div className="text-3xl font-bold text-orange-700">{rankings[2].overallScore}</div>
                <p className="text-xs text-gray-600">3rd Place</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full Rankings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            Complete Rankings
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-purple-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Overall Score
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rankings.map((student, index) => {
                const rank = index + 1;
                const performance = getPerformanceLevel(student.overallScore);
                
                return (
                  <motion.tr
                    key={student.studentId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="hover:bg-purple-50/50 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className={`w-10 h-10 bg-gradient-to-br ${getRankBadgeColor(rank)} rounded-full flex items-center justify-center text-white font-bold shadow-md`}
                        >
                          {rank <= 3 ? getRankIcon(rank) : rank}
                        </motion.div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getRankBadgeColor(rank)} rounded-full flex items-center justify-center text-white font-semibold`}>
                          {student.studentName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{student.studentName}</div>
                          <div className="text-sm text-gray-500">{student.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="text-3xl font-bold text-gray-900"
                        >
                          {student.overallScore}
                        </motion.div>
                        <span className="text-gray-600">/ 100</span>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${student.overallScore}%` }}
                          transition={{ delay: 0.7 + index * 0.05, duration: 1 }}
                          className={`bg-gradient-to-r ${getRankBadgeColor(rank)} h-2 rounded-full`}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${performance.bg} ${performance.color}`}>
                        {performance.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span>Tests: {student.tests}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span>Attendance: {student.attendance}%</span>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rankings.length === 0 && (
          <div className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Trophy className="w-10 h-10 text-gray-400" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students Match Your Filters</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or clear them to see all rankings</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setFilterLevel('all');
                setFilterCourse('all');
              }}
              className="px-6 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              Clear Filters
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Statistics */}
      {rankings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Highest Score',
              value: Math.max(...rankings.map(r => r.overallScore)),
              icon: TrendingUp,
              color: 'from-green-500 to-emerald-500',
              bgColor: 'from-green-50 to-emerald-50'
            },
            {
              label: 'Average Score',
              value: Math.round(rankings.reduce((acc, r) => acc + r.overallScore, 0) / rankings.length),
              icon: Target,
              color: 'from-blue-500 to-cyan-500',
              bgColor: 'from-blue-50 to-cyan-50'
            },
            {
              label: 'Total Rated',
              value: rankings.filter(r => r.overallScore > 0).length,
              icon: Trophy,
              color: 'from-purple-500 to-pink-500',
              bgColor: 'from-purple-50 to-pink-50'
            },
            {
              label: 'Excellence Rate',
              value: `${Math.round((rankings.filter(r => r.overallScore >= 90).length / rankings.length) * 100)}%`,
              icon: Star,
              color: 'from-yellow-500 to-orange-500',
              bgColor: 'from-yellow-50 to-orange-50'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`bg-gradient-to-br ${stat.bgColor} rounded-2xl p-6 shadow-lg border border-white`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
