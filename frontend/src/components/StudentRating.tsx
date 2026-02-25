import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  TrendingUp,
  Award,
  Save,
  X,
  ChevronRight,
  Trophy,
  Target,
  CheckCircle
} from 'lucide-react';

export interface StudentRating {
  studentId: string;
  studentName: string;
  studentEmail: string;
  attendance: number; // 0-100
  assignments: number; // 0-100
  tests: number; // 0-100
  participation: number; // 0-10
  behavior: number; // 0-10
  engagement: number; // 0-10
  overallScore: number; // calculated
  lastUpdated: string;
}

interface StudentRatingProps {
  students: Array<{
    id: string;
    name: string;
    email: string;
    enrolledCourses: string[];
  }>;
}

export function StudentRating({ students }: StudentRatingProps) {
  const [ratings, setRatings] = useState<StudentRating[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [editingRating, setEditingRating] = useState<StudentRating | null>(null);

  // Load ratings from localStorage
  useEffect(() => {
    const savedRatings = localStorage.getItem('student_ratings');
    if (savedRatings) {
      setRatings(JSON.parse(savedRatings));
    } else {
      // Initialize with default ratings
      const defaultRatings = students.map(student => ({
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        attendance: 0,
        assignments: 0,
        tests: 0,
        participation: 0,
        behavior: 0,
        engagement: 0,
        overallScore: 0,
        lastUpdated: new Date().toISOString()
      }));
      setRatings(defaultRatings);
      localStorage.setItem('student_ratings', JSON.stringify(defaultRatings));
    }
  }, [students]);

  const calculateOverallScore = (rating: StudentRating): number => {
    // Weighted average: attendance(20%), assignments(20%), tests(30%), participation(10%), behavior(10%), engagement(10%)
    const score = (
      rating.attendance * 0.20 +
      rating.assignments * 0.20 +
      rating.tests * 0.30 +
      (rating.participation * 10) * 0.10 +
      (rating.behavior * 10) * 0.10 +
      (rating.engagement * 10) * 0.10
    );
    return Math.round(score);
  };

  const handleSaveRating = () => {
    if (!editingRating) return;

    const updatedRating = {
      ...editingRating,
      overallScore: calculateOverallScore(editingRating),
      lastUpdated: new Date().toISOString()
    };

    const updatedRatings = ratings.map(r =>
      r.studentId === updatedRating.studentId ? updatedRating : r
    );

    setRatings(updatedRatings);
    localStorage.setItem('student_ratings', JSON.stringify(updatedRatings));
    
    // Also update individual student details
    const studentDetails = localStorage.getItem(`student_details_${updatedRating.studentId}`);
    if (studentDetails) {
      const details = JSON.parse(studentDetails);
      details.ratings = {
        attendance: updatedRating.attendance,
        assignments: updatedRating.assignments,
        tests: updatedRating.tests,
        participation: updatedRating.participation,
        behavior: updatedRating.behavior,
        engagement: updatedRating.engagement
      };
      localStorage.setItem(`student_details_${updatedRating.studentId}`, JSON.stringify(details));
    }

    setSelectedStudent(null);
    setEditingRating(null);
  };

  const handleEditRating = (studentId: string) => {
    const rating = ratings.find(r => r.studentId === studentId);
    if (rating) {
      setEditingRating({ ...rating });
      setSelectedStudent(studentId);
    }
  };

  const handleCancel = () => {
    setSelectedStudent(null);
    setEditingRating(null);
  };

  // Sort students by overall score for ranking
  const rankedStudents = [...ratings].sort((a, b) => b.overallScore - a.overallScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24" />
        <div className="relative">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Trophy className="w-8 h-8" />
            Student Rating & Ranking System
          </h2>
          <p className="text-purple-100">
            Rate students based on multiple attributes to generate rankings
          </p>
        </div>
      </motion.div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {students.map((student, index) => {
          const rating = ratings.find(r => r.studentId === student.id);
          const rank = rankedStudents.findIndex(r => r.studentId === student.id) + 1;
          
          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        rank === 2 ? 'bg-gray-200 text-gray-800' :
                        rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        Rank #{rank}
                      </div>
                    </div>
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1}}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-yellow-200"
                >
                  <div className="text-center">
                    <div className="text-xl">{rating?.overallScore || 0}</div>
                    <div className="text-[8px]">/ 100</div>
                  </div>
                </motion.div>
              </div>

              {rating && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Attendance</span>
                    <span className="font-medium text-gray-900">{rating.attendance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${rating.attendance}%` }}
                    />
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEditRating(student.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                <Star className="w-4 h-4" />
                {rating?.overallScore ? 'Update Rating' : 'Rate Student'}
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {selectedStudent && editingRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white p-6 rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <Star className="w-6 h-6" />
                      Rate Student
                    </h3>
                    <p className="text-purple-100 mt-1">{editingRating.studentName}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1}}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCancel}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Percentage-based ratings */}
                {[
                  { key: 'attendance', label: 'Attendance', max: 100, color: 'from-green-500 to-emerald-500', icon: CheckCircle },
                  { key: 'assignments', label: 'Assignment Completion', max: 100, color: 'from-blue-500 to-cyan-500', icon: CheckCircle },
                  { key: 'tests', label: 'Test Performance', max: 100, color: 'from-purple-500 to-pink-500', icon: Trophy }
                ].map((item, index) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 font-semibold text-gray-900">
                        <item.icon className="w-5 h-5 text-purple-600" />
                        {item.label}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {editingRating[item.key as keyof StudentRating]}
                        </span>
                        <span className="text-gray-600">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={item.max}
                      value={editingRating[item.key as keyof StudentRating] as number}
                      onChange={(e) => setEditingRating({
                        ...editingRating,
                        [item.key]: parseInt(e.target.value)
                      })}
                      className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, 
                          rgb(147, 51, 234) 0%, 
                          rgb(219, 39, 119) ${(editingRating[item.key as keyof StudentRating] as number)}%, 
                          rgb(229, 231, 235) ${(editingRating[item.key as keyof StudentRating] as number)}%, 
                          rgb(229, 231, 235) 100%)`
                      }}
                    />
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${editingRating[item.key as keyof StudentRating]}%` }}
                      />
                    </div>
                  </motion.div>
                ))}

                {/* Scale-based ratings (1-10) */}
                {[
                  { key: 'participation', label: 'Class Participation', color: 'from-yellow-500 to-orange-500', icon: TrendingUp },
                  { key: 'behavior', label: 'Behavior & Discipline', color: 'from-indigo-500 to-purple-500', icon: Award },
                  { key: 'engagement', label: 'Overall Engagement', color: 'from-pink-500 to-rose-500', icon: Target }
                ].map((item, index) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 font-semibold text-gray-900">
                        <item.icon className="w-5 h-5 text-purple-600" />
                        {item.label}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {editingRating[item.key as keyof StudentRating]}
                        </span>
                        <span className="text-gray-600">/ 10</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                        <motion.button
                          key={value}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingRating({
                            ...editingRating,
                            [item.key]: value
                          })}
                          className={`flex-1 h-10 rounded-lg font-semibold transition-all ${
                            (editingRating[item.key as keyof StudentRating] as number) >= value
                              ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {value}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {/* Overall Score Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-yellow-200 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Overall Performance Score</h4>
                      <p className="text-sm text-gray-600">
                        Based on weighted criteria (Tests 30%, Attendance 20%, Assignments 20%, Others 10% each)
                      </p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1}}
                      transition={{ duration: 0.5 }}
                      className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-yellow-200 shadow-lg"
                    >
                      {calculateOverallScore(editingRating)}
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-3xl border-t border-gray-200 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveRating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Rating
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
