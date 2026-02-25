import { useState } from 'react';
import { User } from '../App';
import {
  LogOut,
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Search,
  TrendingUp,
  Download,
  Calendar,
  Star,
  Trophy,
  FileText,
  LayoutDashboard,
  ChevronRight
} from 'lucide-react';
import { StudentRating } from './StudentRating';
import { StudentRankingsEnhanced } from './StudentRankingsEnhanced';
import { StudentProfile } from './StudentProfile';
import { NotificationCenter, Notification } from './NotificationCenter';
import { Footer } from './Footer';
import { CreateTestSeries } from './CreateTestSeries';
import { CreateDPP } from './CreateDPP';
import { UploadNotes } from './UploadNotes';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  user: User;
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  adminSection: AdminSection;
  onNavigateSection: (section: AdminSection) => void;
  selectedBatch: Batch | null;
  onSelectBatch: (batch: Batch) => void;
  onClearBatch: () => void;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

type Tab = 'home' | 'students' | 'content' | 'analytics' | 'test-series' | 'ratings' | 'rankings' | 'create-test' | 'create-dpp' | 'upload-notes' | 'profile';
type Batch = '11th JEE' | '11th NEET' | '12th JEE' | '12th NEET' | 'Dropper JEE' | 'Dropper NEET';
type AdminSection = 'batches' | 'students' | 'faculty';

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
  joinDate: string;
  performance: number;
  batch: Batch;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  experience: string;
}

const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Rahul Kumar',
    email: 'rahul@example.com',
    enrolledCourses: ['JEE Advanced', 'JEE Mains'],
    joinDate: '2025-09-01',
    performance: 87,
    batch: '11th JEE'
  },
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    enrolledCourses: ['NEET', 'JEE Mains'],
    joinDate: '2025-09-05',
    performance: 92,
    batch: '11th NEET'
  },
  {
    id: '3',
    name: 'Amit Patel',
    email: 'amit@example.com',
    enrolledCourses: ['JEE Advanced'],
    joinDate: '2025-09-10',
    performance: 78,
    batch: '12th JEE'
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    email: 'sneha@example.com',
    enrolledCourses: ['NEET'],
    joinDate: '2025-09-12',
    performance: 95,
    batch: '12th NEET'
  },
  {
    id: '5',
    name: 'Karan Mehta',
    email: 'karan@example.com',
    enrolledCourses: ['JEE Mains'],
    joinDate: '2025-09-14',
    performance: 84,
    batch: 'Dropper JEE'
  },
  {
    id: '6',
    name: 'Ananya Singh',
    email: 'ananya@example.com',
    enrolledCourses: ['NEET'],
    joinDate: '2025-09-18',
    performance: 90,
    batch: 'Dropper NEET'
  },
];

const DEMO_BATCHES: Batch[] = ['11th JEE', '11th NEET', '12th JEE', '12th NEET', 'Dropper JEE', 'Dropper NEET'];

const MOCK_FACULTY: Teacher[] = [
  { id: 'f1', name: 'Arvind Sir', email: 'arvind@example.com', subject: 'Physics', experience: '8 years' },
  { id: 'f2', name: 'Megha Maam', email: 'megha@example.com', subject: 'Chemistry', experience: '6 years' },
  { id: 'f3', name: 'Rohit Sir', email: 'rohit@example.com', subject: 'Mathematics', experience: '10 years' },
  { id: 'f4', name: 'Nidhi Maam', email: 'nidhi@example.com', subject: 'Biology', experience: '7 years' },
];

export function AdminDashboard({ 
  user, 
  activeTab,
  onNavigate,
  adminSection,
  onNavigateSection,
  selectedBatch,
  onSelectBatch,
  onClearBatch,
  onLogout,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification
}: AdminDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClearBatch}
              title="Go to admin home"
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 via-blue-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 bg-clip-text text-transparent">
                UJAAS Admin
              </span>
            </motion.button>

            {/* Center Navigation Tabs */}
            {!selectedBatch ? (
              <div className="flex items-center gap-2">
                {[
                  { id: 'batches', label: 'Batches', icon: BookOpen },
                  { id: 'students', label: 'Students', icon: Users },
                  { id: 'faculty', label: 'Faculty', icon: GraduationCap },
                ].map((section) => (
                  <motion.button
                    key={section.id}
                    onClick={() => onNavigateSection(section.id as AdminSection)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${
                      adminSection === section.id
                        ? 'bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{section.label}</span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {[
                  { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'students', label: 'Batch Students', icon: Users },
                  { id: 'content', label: 'Content', icon: BookOpen },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { id: 'test-series', label: 'Test Series', icon: FileText },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => onNavigate(tab.id as Tab)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Profile Button */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('profile')}
                className="w-10 h-10 bg-gradient-to-br from-cyan-600 via-blue-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                title="View Profile"
              >
                {user.name.charAt(0).toUpperCase()}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={`${selectedBatch || adminSection}-${activeTab}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {!selectedBatch && activeTab !== 'profile' ? (
            <>
              {adminSection === 'batches' && <BatchSelectionTab onSelectBatch={onSelectBatch} />}
              {adminSection === 'students' && <StudentsDirectoryTab />}
              {adminSection === 'faculty' && <FacultyDirectoryTab />}
            </>
          ) : (
            <>
              {activeTab === 'home' && (
                <OverviewTab onNavigate={onNavigate} selectedBatch={selectedBatch} onChangeBatch={onClearBatch} />
              )}
              {activeTab === 'students' && selectedBatch && <StudentsTab selectedBatch={selectedBatch} onChangeBatch={onClearBatch} />}
              {activeTab === 'ratings' && <StudentRating students={MOCK_STUDENTS.filter((student) => student.batch === selectedBatch)} />}
              {activeTab === 'rankings' && <StudentRankingsEnhanced />}
              {activeTab === 'content' && selectedBatch && <NotesManagementTab onNavigate={onNavigate} selectedBatch={selectedBatch} onChangeBatch={onClearBatch} />}
              {activeTab === 'analytics' && selectedBatch && <DPPsManagementTab onNavigate={onNavigate} selectedBatch={selectedBatch} onChangeBatch={onClearBatch} />}
              {activeTab === 'test-series' && selectedBatch && <TestSeriesManagementTab onNavigate={onNavigate} selectedBatch={selectedBatch} onChangeBatch={onClearBatch} />}
              {activeTab === 'create-test' && <CreateTestSeries onBack={() => onNavigate('test-series')} />}
              {activeTab === 'create-dpp' && <CreateDPP onBack={() => onNavigate('analytics')} />}
              {activeTab === 'upload-notes' && <UploadNotes onBack={() => onNavigate('content')} />}
              {activeTab === 'profile' && <StudentProfile user={user} onLogout={onLogout} />}
            </>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function BatchSelectionTab({ onSelectBatch }: { onSelectBatch: (batch: Batch) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Batch</h2>
        <p className="text-gray-600">Choose a batch to open the admin dashboard in that context.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_BATCHES.map((batch, index) => (
          <motion.button
            key={batch}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectBatch(batch)}
            className="bg-white/90 text-left rounded-2xl p-6 shadow-lg border border-white hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-cyan-700 font-semibold">Batch</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{batch}</h3>
              </div>
              <ChevronRight className="w-6 h-6 text-cyan-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function StudentsDirectoryTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredStudents = MOCK_STUDENTS.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.batch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">All Students</h2>
          <p className="text-gray-600">Manage students across all batches</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-600 transition" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Batch</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Courses</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredStudents.map((student, index) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-teal-50/60 transition"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{student.batch}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {student.enrolledCourses.map((course, idx) => (
                        <span
                          key={idx}
                          className="inline-flex px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-teal-100 via-cyan-100 to-blue-100 text-teal-800 rounded-full"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 w-24">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${student.performance}%` }}
                          transition={{ delay: 0.5 + index * 0.05, duration: 1 }}
                          className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 h-2.5 rounded-full"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 min-w-[3ch]">{student.performance}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function FacultyDirectoryTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredFaculty = MOCK_FACULTY.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">All Faculty</h2>
          <p className="text-gray-600">Manage faculty across all departments</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-600 transition" />
          <input
            type="text"
            placeholder="Search faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Faculty</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredFaculty.map((teacher, index) => (
                <motion.tr
                  key={teacher.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-teal-50/60 transition"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 via-blue-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {teacher.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-sm text-gray-500">{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{teacher.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{teacher.experience}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function OverviewTab({
  onNavigate,
  selectedBatch,
  onChangeBatch,
}: {
  onNavigate: (tab: Tab) => void;
  selectedBatch: Batch | null;
  onChangeBatch: () => void;
}) {
  if (!selectedBatch) return null;

  const batchStudents = MOCK_STUDENTS.filter((student) => student.batch === selectedBatch);
  const averagePerformance = batchStudents.length
    ? Math.round(batchStudents.reduce((sum, student) => sum + student.performance, 0) / batchStudents.length)
    : 0;

  const stats = [
    { 
      label: 'Total Students', 
      value: `${batchStudents.length}`, 
      icon: Users, 
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Active DPPs', 
      value: '24', 
      icon: ClipboardList, 
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      trend: '+3',
      trendUp: true
    },
    { 
      label: 'Notes Uploaded', 
      value: '48', 
      icon: BookOpen, 
      gradient: 'from-cyan-500 to-blue-500',
      bgGradient: 'from-cyan-50 to-blue-50',
      trend: '+8',
      trendUp: true
    },
    { 
      label: 'Avg. Performance', 
      value: `${averagePerformance}%`, 
      icon: BarChart3, 
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50',
      trend: '+5%',
      trendUp: true
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-700 font-semibold">Current Batch</p>
          <h2 className="text-xl font-bold text-gray-900">{selectedBatch}</h2>
        </div>
        <button
          onClick={onChangeBatch}
          className="px-4 py-2 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition font-medium"
        >
          Change Batch
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05}}
            className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 shadow-lg border border-white relative overflow-hidden group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <motion.div 
                  whileHover={{ scale: 1.2}}
                  className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </motion.div>
                <div className={`flex items-center gap-1 ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">{stat.trend}</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            {
              icon: Users,
              gradient: 'from-blue-500 to-cyan-500',
              bgGradient: 'from-blue-50 to-cyan-50',
              title: 'New student enrolled: Sneha Reddy',
              time: '2 hours ago'
            },
            {
              icon: BookOpen,
              gradient: 'from-purple-500 to-pink-500',
              bgGradient: 'from-purple-50 to-pink-50',
              title: 'New notes uploaded: Wave Optics',
              time: '5 hours ago'
            },
            {
              icon: ClipboardList,
              gradient: 'from-green-500 to-emerald-500',
              bgGradient: 'from-green-50 to-emerald-50',
              title: 'DPP created: Physics Kinematics #15',
              time: 'Yesterday'
            }
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02, x: 5 }}
              className={`flex items-center gap-4 p-4 bg-gradient-to-r ${activity.bgGradient} rounded-xl border border-white shadow-md hover:shadow-lg transition-all`}
            >
              <motion.div
                className={`w-12 h-12 bg-gradient-to-br ${activity.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}
              >
                <activity.icon className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Plus, label: 'Add Student', desc: 'Enroll a new student', gradient: 'from-blue-500 to-cyan-500', action: () => {} },
          { icon: Plus, label: 'Upload Notes', desc: 'Add study materials', gradient: 'from-cyan-500 to-blue-500', action: () => onNavigate('upload-notes') },
          { icon: Plus, label: 'Create DPP', desc: 'Add practice tests', gradient: 'from-green-500 to-emerald-500', action: () => onNavigate('create-dpp') }
        ].map((action, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.action}
            className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white hover:shadow-xl transition-all text-left group"
          >
            <motion.div
              whileHover={{ scale: 1.2}}
              className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:shadow-lg transition-all`}
            >
              <action.icon className="w-6 h-6 text-white" />
            </motion.div>
            <h4 className="font-semibold text-gray-900 mb-1">{action.label}</h4>
            <p className="text-sm text-gray-600">{action.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function StudentsTab({ selectedBatch, onChangeBatch }: { selectedBatch: Batch; onChangeBatch: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = MOCK_STUDENTS.filter(student =>
    student.batch === selectedBatch &&
    (student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Student Management</h2>
            <p className="text-gray-600">Manage and monitor student progress for {selectedBatch}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onChangeBatch}
              className="px-4 py-3 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition font-medium"
            >
              Change Batch
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition shadow-md"
            >
              <Plus className="w-5 h-5" />
              Add Student
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-600 transition" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
          />
        </div>
      </motion.div>

      {/* Students List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredStudents.map((student, index) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-teal-50/60 transition"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {student.enrolledCourses.map((course, idx) => (
                        <span
                          key={idx}
                          className="inline-flex px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-teal-100 via-cyan-100 to-blue-100 text-teal-800 rounded-full"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(student.joinDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 w-24">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${student.performance}%` }}
                          transition={{ delay: 0.5 + index * 0.05, duration: 1 }}
                          className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 h-2.5 rounded-full"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 min-w-[3ch]">{student.performance}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function NotesManagementTab({ onNavigate, selectedBatch, onChangeBatch }: { onNavigate: (tab: Tab) => void; selectedBatch: Batch; onChangeBatch: () => void }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Notes Management</h2>
            <p className="text-gray-600">Manage and upload study materials for {selectedBatch}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onChangeBatch}
              className="px-4 py-3 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition font-medium"
            >
              Change Batch
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition shadow-md"
            >
              <Plus className="w-5 h-5" />
              Upload Notes
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-lg border border-white text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <BookOpen className="w-10 h-10 text-purple-600" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Notes Management</h3>
        <p className="text-gray-600 mb-6">Upload and organize study materials for your students</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl shadow-md hover:shadow-lg transition"
        >
          <Download className="w-5 h-5" />
          Get Started
        </motion.button>
      </motion.div>
    </div>
  );
}

function DPPsManagementTab({ onNavigate, selectedBatch, onChangeBatch }: { onNavigate: (tab: Tab) => void; selectedBatch: Batch; onChangeBatch: () => void }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">DPP Management</h2>
            <p className="text-gray-600">Create and manage daily practice problems for {selectedBatch}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onChangeBatch}
              className="px-4 py-3 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition font-medium"
            >
              Change Batch
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create DPP
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-lg border border-white text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <ClipboardList className="w-10 h-10 text-green-600" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">DPP Management</h3>
        <p className="text-gray-600 mb-6">Create and schedule practice tests for your students</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg transition"
        >
          <Plus className="w-5 h-5" />
          Get Started
        </motion.button>
      </motion.div>
    </div>
  );
}

function TestSeriesManagementTab({ onNavigate, selectedBatch, onChangeBatch }: { onNavigate: (tab: Tab) => void; selectedBatch: Batch; onChangeBatch: () => void }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Test Series Management</h2>
            <p className="text-gray-600">Create and manage test series for {selectedBatch}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onChangeBatch}
              className="px-4 py-3 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition font-medium"
            >
              Change Batch
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create Test Series
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-lg border border-white text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <FileText className="w-10 h-10 text-blue-600" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Test Series Management</h3>
        <p className="text-gray-600 mb-6">Create and schedule test series for your students</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-md hover:shadow-lg transition"
        >
          <Plus className="w-5 h-5" />
          Get Started
        </motion.button>
      </motion.div>
    </div>
  );
}
