import { useState, useEffect } from 'react';
import { User } from '../App';
import { 
  GraduationCap,
  Star,
  Clock,
  Target,
  FileText,
  Download,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { fetchBatches, ApiBatch } from '../api/batches';
import { TestSeriesContainer } from './TestSeriesContainer';
import { StudentProfile } from './StudentProfile';
import { DPPPractice } from './DPPPractice';
import { QuestionBank } from './QuestionBank';
import { NotificationCenter, Notification } from './NotificationCenter';
import { Footer } from './Footer';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.svg';
import demotimetable from '../assets/demotimetable.jpg';
import { X, Calendar } from 'lucide-react';
import { NotesManagementTab } from './NotesManagementTab';

interface StudentDashboardProps {
  user: User;
  activeTab: Tab;
  subTab?: string;
  onNavigate: (tab: Tab, subTab?: string) => void;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  publishedTests: import('../App').PublishedTest[];
}

type Tab = 'home' | 'test-series' | 'profile' | 'batch-detail' | 'question-bank';

export function StudentDashboard({ 
  user, 
  activeTab,
  subTab,
  onNavigate,
  onLogout, 
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  publishedTests
}: StudentDashboardProps) {
  const [profileSection, setProfileSection] = useState<'overview' | 'performance' | 'settings'>('overview');
  const [selectedDPP, setSelectedDPP] = useState<any | null>(null);
  const [isNavbarInternalHidden, setIsNavbarInternalHidden] = useState(false);
  const [showFullTimetable, setShowFullTimetable] = useState(false);

  useEffect(() => {
    if (showFullTimetable) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showFullTimetable]);

  const [dppAttempts, setDppAttempts] = useState<Record<string, { attempts: number, score: number }>>(() => {
    const saved = localStorage.getItem('dppAttempts');
    return saved ? JSON.parse(saved) : {};
  });

  // Compute if navbar should be hidden (either by TestSeries state or DPP Practice)
  const isNavbarHidden = isNavbarInternalHidden || !!selectedDPP;

  const handleStartDPP = (dpp: any, subjectName?: string) => {
    setSelectedDPP({
      ...dpp,
      subject: subjectName || dpp.subject || 'General'
    });
  };

  const handleCompleteDPP = (score: number) => {
    if (!selectedDPP) return;
    
    setDppAttempts(prev => {
      const current = prev[selectedDPP.id] || { attempts: 0, score: 0 };
      const updated = {
        ...prev,
        [selectedDPP.id]: {
          attempts: current.attempts + 1,
          score: score
        }
      };
      localStorage.setItem('dppAttempts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSubTabNavigate = (newSubTab?: string) => {
    onNavigate(activeTab, newSubTab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex flex-col">
      {/* DPP Practice Overlay */}
      <AnimatePresence>
        {selectedDPP && (
          <DPPPractice 
            dpp={{
              id: selectedDPP.id,
              title: selectedDPP.title,
              subject: selectedDPP.subject,
              totalQuestions: selectedDPP.questions || selectedDPP.totalQuestions || 20,
              duration: selectedDPP.duration || 45,
              difficulty: selectedDPP.difficulty || 'Medium',
              completed: !!dppAttempts[selectedDPP.id],
              score: dppAttempts[selectedDPP.id]?.score
            }}
            onExit={() => setSelectedDPP(null)}
            onComplete={handleCompleteDPP}
          />
        )}
      </AnimatePresence>

      {/* Navigation */}
      {!isNavbarHidden && (
        <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white fixed top-0 left-0 right-0 z-layer-navbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setProfileSection('overview');
                  onNavigate('home');
                }}
                title="Go to Dashboard"
              >
                <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
                <span className="text-xl font-bold" style={{ color: 'rgb(159, 29, 14)' }}>
                  UJAAS
                </span>
              </motion.button>

              {/* Center Navigation Tabs */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'home', label: 'Dashboard', icon: GraduationCap },
                  { id: 'test-series', label: 'Test Series', icon: FileText },
                  { id: 'question-bank', label: 'Question Bank', icon: BookOpen }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'home') setProfileSection('overview');
                      onNavigate(tab.id as Tab);
                    }}
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
                  onClick={() => {
                    setProfileSection('overview');
                    onNavigate('profile');
                  }}
                  className="w-10 h-10 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  title="View Profile"
                >
                  {user.name.charAt(0).toUpperCase()}
                </motion.button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {!isNavbarHidden && <div className="h-16" />} {/* Spacer for fixed navbar */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'home' && (
            <HomeTab 
              user={user} 
              onNavigate={onNavigate} 
              onOpenPerformance={() => {
                setProfileSection('performance');
                onNavigate('profile');
              }} 
              dppAttempts={dppAttempts}
              onViewTimetable={() => setShowFullTimetable(true)}
            />
          )}
          {activeTab === 'test-series' && (
            <TestSeriesContainer 
              user={user} 
              publishedTests={publishedTests} 
              onStateChange={(mode) => setIsNavbarInternalHidden(mode !== 'list')}
              subTab={subTab}
              onNavigateSubTab={handleSubTabNavigate}
            />
          )}
          {activeTab === 'profile' && (
            <StudentProfile 
              user={user} 
              onLogout={onLogout} 
              initialSection={profileSection} 
            />
          )}
          {activeTab === 'batch-detail' && (
            <HomeTab 
              user={user} 
              onNavigate={onNavigate} 
              onOpenPerformance={() => {
                setProfileSection('performance');
                onNavigate('profile');
              }} 
              dppAttempts={dppAttempts}
              onViewTimetable={() => setShowFullTimetable(true)}
            />
          )}
          {activeTab === 'question-bank' && (
            <QuestionBank 
              userRole="student" 
              userBatch={user.studentDetails?.batch} 
              onBack={() => onNavigate('home')} 
            />
          )}
        </motion.div>
      </main>

      {/* Footer */}
      {!isNavbarHidden && <Footer />}

      {/* Timetable Modal */}
      <AnimatePresence>
        {showFullTimetable && (
          <motion.div
            key="timetable-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md z-layer-modal"
            onClick={() => setShowFullTimetable(false)}
          >
            <motion.div
              key="timetable-modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-5xl w-full h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col z-layer-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-20">
                <h3 className="text-xl font-bold text-gray-900">Batch Weekly Schedule</h3>
                <button onClick={() => setShowFullTimetable(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-500" /></button>
               </div>
              <div className="flex-1 bg-gray-100 p-4 flex items-center justify-center overflow-hidden min-h-0">
                <div className="w-full h-full flex items-center justify-center">
                  <img src={demotimetable} alt="Full Time Table" className="max-w-full max-h-full object-contain rounded-xl shadow-xl bg-white" />
                </div>
              </div>
              <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0 z-20">
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2"><Download className="w-4 h-4" />Download PDF</button>
                <button onClick={() => setShowFullTimetable(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderPerformanceStars(rating: number) {
  const normalizedRating = Math.max(0, Math.min(5, rating));

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        let fillPercentage = 0;
        if (normalizedRating >= star) {
          fillPercentage = 100;
        } else if (normalizedRating > star - 1) {
          fillPercentage = (normalizedRating - (star - 1)) * 100;
        }

        return (
          <div 
            key={star} 
            className="relative inline-block select-none"
            style={{ width: '16px', height: '16px', fontSize: '16px', lineHeight: '16px' }}
          >
            {/* Background star (Gray) */}
            <span style={{ color: '#d1d5db', position: 'absolute', left: 0, top: 0 }}>★</span>
            {/* Fill star (Gold) */}
            <div 
              style={{ 
                width: `${fillPercentage}%`, 
                overflow: 'hidden', 
                position: 'absolute', 
                left: 0, 
                top: 0, 
                whiteSpace: 'nowrap',
                color: '#f59e0b',
                transition: 'width 0.3s ease'
              }}
            >
              <span>★</span>
            </div>
          </div>
        );
      })}
      <span className="text-sm font-bold text-gray-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function HomeTab({ 
  user, 
  onNavigate, 
  onOpenPerformance,
  dppAttempts,
  onViewTimetable
}: { 
  user: User; 
  onNavigate: (t: Tab) => void;
  onOpenPerformance: () => void;
  dppAttempts: Record<string, { attempts: number, score: number }>;
  onViewTimetable: () => void;
}) {
  const calculateOverallRating = () => {
    if (!user.studentDetails?.ratings) return 0;
    const r = user.studentDetails.ratings;
    const dppPerformance = (r as any).dppPerformance || 0;
    const ratingsList = [r.attendance, r.tests, r.behavior, dppPerformance];
    const total = ratingsList.reduce((sum, value) => sum + value, 0);
    return Number((total / ratingsList.length).toFixed(1));
  };

  const currentRating = calculateOverallRating();
  const completedCount = dppAttempts ? Object.keys(dppAttempts).length : 0;

  const stats = [
    { 
      label: 'DPP Completed', 
      value: `${completedCount}/30`, 
      icon: ClipboardList, 
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      percentage: (completedCount / 30) * 100,
      clickable: false,
      onClick: undefined
    },
    { 
      label: 'My Performance Rating', 
      value: `${currentRating.toFixed(1)}/5.0`, 
      icon: Star, 
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50',
      percentage: (currentRating / 5) * 100,
      clickable: true,
      onClick: onOpenPerformance
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <motion.div
            className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30"
          >
            {user.name.charAt(0).toUpperCase()}
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold mb-2"
                >
                  {user.name}
                </motion.h2>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-4 text-teal-50/90"
                >
                  {user.email && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Roll: {user.studentDetails?.rollNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Batch: {user.studentDetails?.batch || 'N/A'}</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={stat.clickable ? stat.onClick : undefined}
            className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 shadow-lg border border-white relative overflow-hidden group ${stat.clickable ? 'cursor-pointer' : ''}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <motion.div
                  className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </motion.div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600 font-medium mb-3">{stat.label}</p>
              
              {stat.label === 'My Performance Rating' ? (
                <div className="mt-2">
                  {renderPerformanceStars(currentRating)}
                </div>
              ) : (
                <div className="mt-3 w-full bg-white/50 rounded-full h-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.percentage}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                    className={`h-1.5 rounded-full bg-gradient-to-r ${stat.gradient}`}
                  />
                </div>
              )}
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
          {user.enrolledCourses?.filter(c => c !== user.studentDetails?.batch).map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
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

          {(!user.enrolledCourses || user.enrolledCourses.filter(c => c !== user.studentDetails?.batch).length === 0) && (
            <div className="sm:col-span-3 rounded-2xl border border-dashed border-gray-200 bg-slate-50 px-5 py-6 text-sm text-gray-500">
              No extra courses are assigned right now.
            </div>
          )}
        </div>
      </motion.div>

      <AssignedBatchContent
        user={user}
        onNavigate={onNavigate}
        onViewTimetable={onViewTimetable}
      />

    </div>
  );
}

function AssignedBatchContent({ 
  user, 
  onNavigate,
  onViewTimetable
}: { 
  user: User; 
  onNavigate: (tab: Tab, subTab?: string) => void;
  onViewTimetable: () => void;
}) {
  const [batchDetails, setBatchDetails] = useState<ApiBatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBatch = async () => {
      try {
        const batches = await fetchBatches();
        const studentBatch = batches.find(b => b.name === user.studentDetails?.batch);
        if (studentBatch) {
          setBatchDetails(studentBatch);
        }
      } catch (err) {
        console.error("Failed to fetch batch details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user.studentDetails?.batch) {
      loadBatch();
    } else {
      setLoading(false);
    }
  }, [user.studentDetails?.batch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 rounded-3xl bg-white/60 border border-white shadow-lg">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user.studentDetails?.batch) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white/70 p-8 text-center shadow-lg">
        <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-xl font-semibold text-gray-900">No Batch Assigned</h3>
        <p className="text-sm text-gray-500 mt-2">Your dashboard content will appear here once a batch is assigned.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold tracking-tight">{user.studentDetails?.batch}</h2>
            <button 
              onClick={onViewTimetable}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition-all shadow-sm border border-white/20"
            >
              <Calendar className="w-5 h-5" />
              Time Table
            </button>
          </div>
          <p className="text-teal-50/90 font-medium mt-1">Batch Academic Overview & Content</p>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-1 border border-gray-100 shadow-xl">
        <div className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Batch Academic Content</h3>
        </div>
        <div className="p-1">
          <NotesManagementTab 
            onNavigate={onNavigate}
            selectedBatch={user.studentDetails?.batch || null}
            onChangeBatch={() => onNavigate('home')}
            onViewTimetable={onViewTimetable}
            batches={batchDetails ? [{ id: batchDetails.id, label: batchDetails.name, subjects: batchDetails.subjects }] : []}
            readOnly={true}
            variant="student"
          />
        </div>
      </div>
    </div>
  );
}


