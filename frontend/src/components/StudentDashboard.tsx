import { useState, useEffect } from 'react';
import { User } from '../App';
import { 
  LogOut, 
  BookOpen, 
  ClipboardList, 
  GraduationCap,
  User as UserIcon,
  Trophy,
  Clock,
  TrendingUp,
  Target,
  FileText,
  ChevronRight,
  ChevronLeft,
  Folder,
  Download
} from 'lucide-react';
import { NotesSection } from './NotesSection';
import { DPPSection } from './DPPSection';
import { TestSeriesContainer } from './TestSeriesContainer';
import { StudentProfile } from './StudentProfile';
import { NotificationCenter, Notification } from './NotificationCenter';
import { Footer } from './Footer';
import { motion } from 'motion/react';
import logo from '../assets/logo.svg';

interface StudentDashboardProps {
  user: User;
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  publishedTests: import('../App').PublishedTest[];
}

type Tab = 'home' | 'notes' | 'dpp' | 'test-series' | 'profile' | 'batch-detail';

export function StudentDashboard({ 
  user, 
  activeTab,
  onNavigate,
  onLogout, 
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  publishedTests
}: StudentDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <span className="text-xl font-bold" style={{ color: 'rgb(159, 29, 14)' }}>
                UJAAS
              </span>
            </motion.div>

            {/* Center Navigation Tabs */}
            <div className="flex items-center gap-2">
              {[
                { id: 'home', label: 'Dashboard', icon: GraduationCap },
                { id: 'notes', label: 'Notes', icon: BookOpen },
                { id: 'dpp', label: 'DPP', icon: ClipboardList },
                { id: 'test-series', label: 'Test Series', icon: FileText }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id as Tab)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${
                    (activeTab === tab.id || (activeTab === 'batch-detail' && tab.id === 'home'))
                      ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Profile Button */}
            <div className="flex items-center gap-4">
              <NotificationCenter 
                notifications={notifications}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onDelete={onDeleteNotification}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('profile')}
                className="w-10 h-10 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg hover:shadow-xl transition-all"
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
        <div className="h-20" /> {/* Spacer for fixed navbar */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'home' && <HomeTab user={user} onNavigate={onNavigate} />}
          {activeTab === 'notes' && <NotesSection />}
          {activeTab === 'dpp' && <DPPSection />}
          {activeTab === 'test-series' && <TestSeriesContainer user={user} publishedTests={publishedTests} />}
          {activeTab === 'profile' && <StudentProfile user={user} onLogout={onLogout} />}
          {activeTab === 'batch-detail' && <BatchDashboard user={user} onBack={() => onNavigate('home')} />}
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function HomeTab({ user, onNavigate }: { user: User; onNavigate: (t: Tab) => void }) {
  const stats = [
    { 
      label: 'DPP Completed', 
      value: '24/30', 
      icon: ClipboardList, 
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      percentage: 80
    },
    { 
      label: 'Study Hours', 
      value: '45.5', 
      icon: Clock, 
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      percentage: 75
    },
    { 
      label: 'Notes Downloaded', 
      value: '18', 
      icon: BookOpen, 
      gradient: 'from-cyan-500 to-blue-500',
      bgGradient: 'from-cyan-50 to-blue-50',
      percentage: 60
    },
    { 
      label: 'Rank', 
      value: '#12', 
      icon: Trophy, 
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50',
      percentage: 95
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
        
        <div className="relative flex items-start justify-between">
          <div>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold mb-2"
            >
              Welcome back, {user.name.split(' ')[0]}! 👋
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-teal-100"
            >
              Ready to continue your learning journey?
            </motion.p>
          </div>
          <motion.div className="hidden sm:block">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8" />
            </div>
          </motion.div>
        </div>
      </motion.div>

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
                <div className="text-right">
                  <motion.div 
                    className="flex items-center gap-1 text-green-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-semibold">{stat.percentage}%</span>
                  </motion.div>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <div className="mt-3 w-full bg-white/50 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percentage}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                  className={`h-1.5 rounded-full bg-gradient-to-r ${stat.gradient}`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* My Batch & Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-6 h-6 text-teal-600" />
          <h3 className="text-xl font-semibold text-gray-900">My Batch & Courses</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {user.studentDetails?.batch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => onNavigate('batch-detail')}
              className="p-5 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 border-2 border-white rounded-2xl shadow-md hover:shadow-xl transition-all text-white cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-teal-100 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
              <p className="text-xs font-bold text-teal-100 uppercase tracking-wider mb-1">Primary Batch</p>
              <h4 className="font-bold mb-1 text-xl">{user.studentDetails.batch}</h4>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-sm text-teal-50">Current Enrollment</p>
              </div>
              <p className="text-xs font-bold text-teal-100 underline decoration-teal-100/30 underline-offset-4">View Batch Dashboard</p>
            </motion.div>
          )}

          {user.enrolledCourses?.filter(c => c !== user.studentDetails?.batch).map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-5 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 border-2 border-white rounded-2xl shadow-md hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Course</p>
              <h4 className="font-semibold text-gray-900 mb-1 text-lg">{course}</h4>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            {
              icon: ClipboardList,
              gradient: 'from-green-500 to-emerald-500',
              bgGradient: 'from-green-50 to-emerald-50',
              title: 'Completed Physics DPP #12',
              time: '2 hours ago',
              badge: '95%',
              badgeColor: 'text-green-600 bg-green-100'
            },
            {
              icon: BookOpen,
              gradient: 'from-blue-500 to-cyan-500',
              bgGradient: 'from-blue-50 to-cyan-50',
              title: 'Downloaded Chemistry Notes',
              time: '5 hours ago',
              badge: null,
              badgeColor: ''
            },
            {
              icon: ClipboardList,
              gradient: 'from-purple-500 to-pink-500',
              bgGradient: 'from-purple-50 to-pink-50',
              title: 'Started Mathematics DPP #8',
              time: 'Yesterday',
              badge: 'In Progress',
              badgeColor: 'text-yellow-600 bg-yellow-100'
            }
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ scale: 1.02, x: 5 }}
              className={`flex items-center gap-4 p-4 bg-gradient-to-r ${activity.bgGradient} rounded-xl border border-white shadow-md hover:shadow-lg transition-all`}
            >
              <motion.div className={`w-12 h-12 bg-gradient-to-br ${activity.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                <activity.icon className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.time}</p>
              </div>
              {activity.badge && (
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${activity.badgeColor}`}>
                  {activity.badge}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function BatchDashboard({ user, onBack }: { user: User; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 p-8 rounded-3xl shadow-xl text-white mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-teal-100 hover:text-white mb-4 font-bold transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <h2 className="text-3xl font-bold tracking-tight">{user.studentDetails?.batch} Dashboard</h2>
          <p className="text-teal-50/90 font-medium">Batch Academic Overview & Content</p>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-1 border border-white/20 shadow-xl">
        <div className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Batch Academic Content</h3>
        </div>
        <div className="p-1">
          <StudentContentTab />
        </div>
      </div>
    </div>
  );
}

function StudentContentTab() {
  const [currentView, setCurrentView] = useState<'root' | 'subject' | 'chapter'>('root');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [activeContentType, setActiveContentType] = useState<'notes' | 'dpps'>('notes');

  const subjects = [
    { id: 's1', name: 'Physics', color: '#3b82f6' },
    { id: 's2', name: 'Chemistry', color: '#10b981' },
    { id: 's3', name: 'Mathematics', color: '#f59e0b' },
    { id: 's4', name: 'Biology', color: '#f43f5e' },
  ];

  const chapters: Record<string, string[]> = {
    'Physics': ['Kinematics', 'Laws of Motion', 'Work Power Energy'],
    'Chemistry': ['Atomic Structure', 'Chemical Bonding', 'Thermodynamics'],
    'Mathematics': ['Sets', 'Relations & Functions', 'Trigonometry'],
    'Biology': ['Cell Structure', 'Cell Cycle', 'Plant Kingdom'],
  };

  const notes = [
    { id: 'n1', chapter: 'Kinematics', title: 'Kinematics Theory Notes', size: '2.4 MB', date: '2025-09-20' },
    { id: 'n2', chapter: 'Atomic Structure', title: 'Atomic Model Basics', size: '1.8 MB', date: '2025-09-22' },
  ];

  const dpps = [
    { id: 'd1', chapter: 'Kinematics', title: 'Kinematics DPP 01 - Basics', questions: 15, date: '2025-09-22' },
    { id: 'd2', chapter: 'Atomic Structure', title: 'Atomic Theory DPP', questions: 20, date: '2025-09-25' },
  ];

  const renderSubjectGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {subjects.map((subject) => (
        <motion.button
          key={subject.id}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSelectedSubject(subject.name);
            setCurrentView('subject');
          }}
          className="p-6 bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col items-center text-center group transition-all"
        >
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:rotate-6 transition-transform"
            style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
          >
            <BookOpen className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-gray-900">{subject.name}</h4>
          <p className="text-sm text-gray-500 mt-1">{chapters[subject.name]?.length || 0} Chapters</p>
        </motion.button>
      ))}
    </div>
  );

  const renderChapterList = () => (
    <div className="space-y-4 p-4">
      <button 
        onClick={() => setCurrentView('root')}
        className="flex items-center gap-2 text-teal-600 font-bold mb-2 hover:underline"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Subjects
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chapters[selectedSubject!]?.map((chapter) => (
          <motion.button
            key={chapter}
            whileHover={{ x: 5 }}
            onClick={() => {
              setSelectedChapter(chapter);
              setCurrentView('chapter');
            }}
            className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Folder className="w-5 h-5" />
              </div>
              <span className="font-bold text-gray-900">{chapter}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-600 transition-colors" />
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderContentItems = () => {
    const relevantNotes = notes.filter(n => n.chapter === selectedChapter);
    const relevantDpps = dpps.filter(d => d.chapter === selectedChapter);

    return (
      <div className="space-y-6 p-4">
        <button 
          onClick={() => setCurrentView('subject')}
          className="flex items-center gap-2 text-teal-600 font-bold mb-2 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Chapters
        </button>

        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveContentType('notes')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeContentType === 'notes' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveContentType('dpps')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeContentType === 'dpps' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
          >
            DPPs
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {activeContentType === 'notes' ? (
            relevantNotes.length > 0 ? relevantNotes.map(note => (
              <div key={note.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-teal-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">{note.title}</h5>
                    <p className="text-xs text-gray-500">{note.size} • {note.date}</p>
                  </div>
                </div>
                <button className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            )) : <p className="text-center py-12 text-gray-500 font-medium bg-gray-50 rounded-2xl border-2 border-dashed">No notes available for this chapter yet.</p>
          ) : (
            relevantDpps.length > 0 ? relevantDpps.map(dpp => (
              <div key={dpp.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-teal-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">{dpp.title}</h5>
                    <p className="text-xs text-gray-500">{dpp.questions} Questions • {dpp.date}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-teal-700 transition-all">Start Practice</button>
                  <button className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all"><Download className="w-4 h-4" /></button>
                </div>
              </div>
            )) : <p className="text-center py-12 text-gray-500 font-medium bg-gray-50 rounded-2xl border-2 border-dashed">No DPPs available for this chapter yet.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[400px]">
      {currentView === 'root' && renderSubjectGrid()}
      {currentView === 'subject' && renderChapterList()}
      {currentView === 'chapter' && renderContentItems()}
    </div>
  );
}
