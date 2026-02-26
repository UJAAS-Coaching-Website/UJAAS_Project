import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Folder,
  Image as ImageIcon,
  Upload,
  X,
  Bell
} from 'lucide-react';
import { StudentRating } from './StudentRating';
import { StudentRankingsEnhanced } from './StudentRankingsEnhanced';
import { TeacherProfile } from './TeacherProfile';
import { NotificationCenter, Notification } from './NotificationCenter';
import { Footer } from './Footer';
import { CreateTestSeries } from './CreateTestSeries';
import { CreateDPP } from './CreateDPP';
import { UploadNotes } from './UploadNotes';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.svg';
import demotimetable from '../assets/demotimetable.jpg';

interface TeacherDashboardProps {
  user: User;
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  adminSection: TeacherSection;
  onNavigateSection: (section: TeacherSection) => void;
  selectedBatch: Batch | null;
  onSelectBatch: (batch: Batch) => void;
  onClearBatch: () => void;
  batches: BatchInfo[];
  onUpdateBatch: (label: string, subjects?: string[], facultyAssigned?: string[]) => { ok: boolean; error?: string };
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

type Tab = 'home' | 'students' | 'faculty' | 'content' | 'analytics' | 'test-series' | 'ratings' | 'rankings' | 'create-test' | 'create-dpp' | 'upload-notes' | 'profile';
type Batch = string;
type TeacherSection = 'landing' | 'batches' | 'students' | 'faculty' | 'test-series';
type BatchInfo = { label: string; slug: string; subjects?: string[]; facultyAssigned?: string[] };

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  enrolledCourses: string[];
  joinDate: string;
  performance: number;
  rating: number;
  batch: Batch;
  ratings?: {
    attendance: number;
    tests: number;
    dppPerformance: number;
    behavior: number;
  };
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  phone?: string;
}

type StudentFormState = {
  id?: string;
  name: string;
  email: string;
  rollNumber: string;
  batch: Batch;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  parentContact: string;
};

function renderPerformanceStars(rating: number) {
  const normalizedRating = Math.max(0, Math.min(5, Math.round(rating)));
  const fillPercentage = (normalizedRating / 5) * 100;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className="inline-block w-4 text-center text-[16px] leading-4"
          style={{
            background: `linear-gradient(90deg, #f59e0b ${fillPercentage}%, #d1d5db ${fillPercentage}%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ★
        </span>
      ))}
      <span className="text-sm font-bold text-gray-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Rahul Kumar', email: 'rahul@example.com', rollNumber: 'UJAAS-001', enrolledCourses: ['JEE Advanced'], joinDate: '2025-09-01', performance: 87, rating: 4, batch: '11th JEE' },
  { id: '2', name: 'Priya Sharma', email: 'priya@example.com', rollNumber: 'UJAAS-002', enrolledCourses: ['NEET'], joinDate: '2025-09-05', performance: 92, rating: 3, batch: '11th NEET' },
  { id: '3', name: 'Amit Patel', email: 'amit@example.com', rollNumber: 'UJAAS-003', enrolledCourses: ['JEE Advanced'], joinDate: '2025-09-10', performance: 78, rating: 3, batch: '12th JEE' },
];

const MOCK_FACULTY: Teacher[] = [
  { id: 'f1', name: 'Arvind Sir', email: 'arvind@example.com', subject: 'Physics', phone: '+91 98765 11111' },
  { id: 'f2', name: 'Megha Maam', email: 'megha@example.com', subject: 'Chemistry', phone: '+91 98765 22222' },
];

export function TeacherDashboard({ 
  user, 
  activeTab,
  onNavigate,
  adminSection,
  onNavigateSection,
  selectedBatch,
  onSelectBatch,
  onClearBatch,
  batches,
  onUpdateBatch,
  onLogout,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification
}: TeacherDashboardProps) {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [faculty, setFaculty] = useState<Teacher[]>(MOCK_FACULTY);
  
  const [studentModal, setStudentModal] = useState<{ open: boolean; initialData?: StudentFormState; defaultBatch: Batch | null; title: string; }>({
    open: false,
    defaultBatch: null,
    title: 'Add Student',
  });
  
  const [batchModal, setBatchModal] = useState<{ open: boolean; batchLabel?: string; }>({ open: false });
  const [ratingModal, setRatingModal] = useState<{ open: boolean; student?: Student; }>({ open: false });
  const [showFullTimetable, setShowFullTimetable] = useState(false);

  // Content Management State (Keeping it internal as requested)
  const [subjects, setSubjects] = useState([
    { id: 's1', name: 'Physics', color: '#3b82f6' },
    { id: 's2', name: 'Chemistry', color: '#10b981' },
    { id: 's3', name: 'Mathematics', color: '#f59e0b' },
    { id: 's4', name: 'Biology', color: '#f43f5e' },
  ]);

  const [chapters, setChapters] = useState<Record<string, string[]>>({
    'Physics': ['Kinematics', 'Laws of Motion'],
    'Chemistry': ['Atomic Structure', 'Chemical Bonding'],
  });

  const [notes, setNotes] = useState([
    { id: 'n1', chapter: 'Kinematics', title: 'Kinematics Theory Notes', size: '2.4 MB', date: '2025-09-20' },
  ]);

  const [dpps, setDpps] = useState([
    { id: 'd1', chapter: 'Kinematics', title: 'Kinematics DPP 01 - Basics', questions: 15, date: '2025-09-22' },
  ]);

  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  const [activeSubjectForChapter, setActiveSubjectForChapter] = useState<string | null>(null);

  const handleAddSubject = (e: FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setSubjects([...subjects, { id: `s${Date.now()}`, name: newSubjectName.trim(), color: randomColor }]);
      setChapters({ ...chapters, [newSubjectName.trim()]: [] });
      setNewSubjectName('');
      setIsAddSubjectModalOpen(false);
    }
  };

  const handleAddChapter = (e: FormEvent) => {
    e.preventDefault();
    if (!activeSubjectForChapter) return;
    if (newChapterName.trim()) {
      setChapters({
        ...chapters,
        [activeSubjectForChapter]: [...(chapters[activeSubjectForChapter] || []), newChapterName.trim()]
      });
      setNewChapterName('');
      setIsAddChapterModalOpen(false);
    }
  };

  const openAddStudent = (batch: Batch | null = null) => setStudentModal({ open: true, initialData: undefined, defaultBatch: batch, title: 'Add Student' });
  const openEditStudent = (student: Student) => setStudentModal({
    open: true,
    defaultBatch: student.batch,
    title: 'Edit Student',
    initialData: { id: student.id, name: student.name, email: student.email, rollNumber: student.rollNumber, batch: student.batch, phoneNumber: '', dateOfBirth: '', address: '', parentContact: '' },
  });
  const closeStudentModal = () => setStudentModal((prev) => ({ ...prev, open: false }));
  
  const handleSaveStudent = (data: StudentFormState) => {
    if (data.id) {
      setStudents(prev => prev.map(s => s.id === data.id ? { ...s, name: data.name, email: data.email, rollNumber: data.rollNumber, batch: data.batch } : s));
    } else {
      setStudents(prev => [{ id: `student-${Date.now()}`, name: data.name, email: data.email, rollNumber: data.rollNumber, enrolledCourses: [], joinDate: new Date().toISOString().slice(0, 10), performance: 0, rating: 0, batch: data.batch }, ...prev]);
    }
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const openStudentRatings = (student: Student) => setRatingModal({ open: true, student });
  const closeStudentRatings = () => setRatingModal({ open: false });
  const openEditBatch = (label: string) => setBatchModal({ open: true, batchLabel: label });
  const closeBatchModal = () => setBatchModal((prev) => ({ ...prev, open: false }));

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-[9999] shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.button
              onClick={onClearBatch}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3"
            >
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <span className="text-xl font-bold" style={{ color: 'rgb(159, 29, 14)' }}>
                UJAAS Teacher
              </span>
            </motion.button>

            {/* Center Navigation Tabs */}
            {!selectedBatch ? (
              <div className="flex items-center gap-2">
                {[
                  { id: 'batches', label: 'Batches', icon: BookOpen },
                  { id: 'students', label: 'Students', icon: Users },
                  { id: 'test-series', label: 'Test Series', icon: FileText },
                ].map((section) => (
                  <motion.button
                    key={section.id}
                    onClick={() => onNavigateSection(section.id as TeacherSection)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${
                      (adminSection === section.id || (section.id === 'test-series' && (activeTab === 'test-series' || activeTab === 'create-test'))) && activeTab !== 'profile'
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
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => onNavigate(tab.id as Tab)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${
                      activeTab === tab.id && activeTab !== 'profile'
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
          {/* Layered Rendering Logic - Standard across dashboards */}
          {activeTab === 'create-test' ? (
            <CreateTestSeries onBack={() => onNavigate('test-series')} batches={batches} />
          ) : activeTab === 'create-dpp' ? (
            <CreateDPP onBack={() => onNavigate('content')} />
          ) : activeTab === 'upload-notes' ? (
            <UploadNotes onBack={() => onNavigate('content')} />
          ) : activeTab === 'profile' ? (
            <TeacherProfile user={user} onLogout={onLogout} />
          ) : !selectedBatch ? (
            /* GLOBAL CONTEXT */
            <>
              {adminSection === 'batches' && (
                <BatchSelectionTab
                  batches={batches}
                  onSelectBatch={onSelectBatch}
                />
              )}
              {adminSection === 'students' && (
                <StudentsDirectoryTab
                  students={students}
                  batches={batches}
                  onAddStudent={() => openAddStudent(null)}
                  onEditStudent={openEditStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onViewStudent={openStudentRatings}
                />
              )}
              {adminSection === 'test-series' && (
                <TestSeriesManagementTab onNavigate={onNavigate} selectedBatch={null as unknown as Batch} onChangeBatch={() => {}} />
              )}
            </>
          ) : (
            /* BATCH CONTEXT */
            <>
              {activeTab === 'home' && (
                <OverviewTab
                  selectedBatch={selectedBatch}
                  students={students}
                  onEditBatch={openEditBatch}
                />
              )}
              {activeTab === 'students' && (
                <StudentsTab
                  students={students}
                  selectedBatch={selectedBatch}
                  onChangeBatch={onClearBatch}
                  onAddStudent={() => openAddStudent(selectedBatch)}
                  onEditStudent={openEditStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onViewStudent={openStudentRatings}
                />
              )}
              {activeTab === 'ratings' && <StudentRating students={students.filter((student) => student.batch === selectedBatch)} />}
              {activeTab === 'rankings' && <StudentRankingsEnhanced />}
              {activeTab === 'content' && (
                <NotesManagementTab 
                  onNavigate={onNavigate} 
                  selectedBatch={selectedBatch} 
                  onChangeBatch={onClearBatch} 
                  onViewTimetable={() => setShowFullTimetable(true)}
                />
              )}
            </>
          )}
        </motion.div>
      </main>

      <Footer />

      {/* Modals */}
      <div className="relative z-[10000] isolate">
        <AddStudentModal
          open={studentModal.open}
          onClose={closeStudentModal}
          defaultBatch={studentModal.defaultBatch}
          batches={batches}
          initialData={studentModal.initialData}
          title={studentModal.title}
          onSubmit={handleSaveStudent}
        />

        <BatchFormModal
          open={batchModal.open}
          batchLabel={batchModal.batchLabel}
          batches={batches}
          faculty={faculty}
          onClose={closeBatchModal}
          onUpdateBatch={onUpdateBatch}
        />

        <StudentRatingsModal
          open={ratingModal.open}
          student={ratingModal.student}
          onClose={closeStudentRatings}
        />

        {/* Timetable Modal */}
        <AnimatePresence>
          {showFullTimetable && (
            <motion.div
              key="timetable-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setShowFullTimetable(false)}
            >
              <motion.div
                key="timetable-modal-content"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative max-w-5xl w-full h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
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
    </div>
  );
}

// SUB-COMPONENTS

function BatchSelectionTab({ batches, onSelectBatch }: { batches: BatchInfo[]; onSelectBatch: (batch: Batch) => void; }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {batches.map((batch) => (
        <motion.button
          key={batch.slug}
          onClick={() => onSelectBatch(batch.label)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white text-left group"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{batch.label}</h3>
          <p className="text-gray-500 text-sm">View and manage this batch's academic progress</p>
        </motion.button>
      ))}
    </div>
  );
}

function StudentsDirectoryTab({ students, batches, onAddStudent, onEditStudent, onDeleteStudent, onViewStudent }: { students: Student[]; batches: BatchInfo[]; onAddStudent: () => void; onEditStudent: (s: Student) => void; onDeleteStudent: (id: string) => void; onViewStudent: (s: Student) => void; }) {
  const [q, setQ] = useState('');
  const filtered = students.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div><h2 className="text-3xl font-bold text-gray-900">Students Directory</h2><p className="text-gray-500">Manage all students in your assigned batches</p></div>
        <div className="flex gap-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." className="pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-cyan-500 w-64" /></div><button onClick={onAddStudent} className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add Student</button></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="text-left border-b border-gray-100"><th className="pb-4 font-bold text-gray-700">Student</th><th className="pb-4 font-bold text-gray-700">Batch</th><th className="pb-4 font-bold text-gray-700">Performance</th><th className="pb-4 font-bold text-gray-700">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => (
              <tr key={s.id} onClick={() => onViewStudent(s)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                <td className="py-4"><div className="font-bold text-gray-900">{s.name}</div><div className="text-xs text-gray-500">{s.email}</div></td>
                <td className="py-4"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{s.batch}</span></td>
                <td className="py-4">{renderPerformanceStars(s.rating)}</td>
                <td className="py-4 flex gap-2"><button onClick={(e) => { e.stopPropagation(); onEditStudent(s); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button><button onClick={(e) => { e.stopPropagation(); onDeleteStudent(s.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverviewTab({ selectedBatch, students, onEditBatch }: { selectedBatch: Batch | null; students: Student[]; onEditBatch: (l: string) => void; }) {
  if (!selectedBatch) return null;
  const batchStudents = students.filter(s => s.batch === selectedBatch);
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-gray-900">{selectedBatch} Overview</h2><button onClick={() => onEditBatch(selectedBatch)} className="px-6 py-3 bg-white text-cyan-600 rounded-xl font-bold border border-cyan-100 shadow-sm hover:shadow-md transition">Edit Batch Settings</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Batch Students', value: batchStudents.length, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Avg. Attendance', value: '94%', icon: Calendar, color: 'from-teal-500 to-emerald-500' },
          { label: 'Performance', value: 'Excellent', icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-50 flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-md`}><stat.icon className="w-6 h-6" /></div>
            <div><p className="text-sm font-medium text-gray-500">{stat.label}</p><p className="text-2xl font-bold text-gray-900">{stat.value}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentsTab({ students, selectedBatch, onChangeBatch, onAddStudent, onEditStudent, onDeleteStudent, onViewStudent }: { students: Student[]; selectedBatch: Batch; onChangeBatch: () => void; onAddStudent: () => void; onEditStudent: (s: Student) => void; onDeleteStudent: (id: string) => void; onViewStudent: (s: Student) => void }) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex justify-between items-center mb-8">
        <div><h2 className="text-3xl font-bold text-gray-900">Batch Students</h2><p className="text-gray-500">{selectedBatch}</p></div>
        <div className="flex gap-3"><button onClick={onChangeBatch} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition">Change Batch</button><button onClick={onAddStudent} className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add Student</button></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="text-left border-b border-gray-100"><th className="pb-4 font-bold text-gray-700">Student</th><th className="pb-4 font-bold text-gray-700">Roll No</th><th className="pb-4 font-bold text-gray-700">Performance</th><th className="pb-4 font-bold text-gray-700">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {students.filter(s => s.batch === selectedBatch).map((s) => (
              <tr key={s.id} onClick={() => onViewStudent(s)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                <td className="py-4"><div className="font-bold text-gray-900">{s.name}</div><div className="text-xs text-gray-500">{s.email}</div></td>
                <td className="py-4 text-sm text-gray-600 font-mono">{s.rollNumber}</td>
                <td className="py-4">{renderPerformanceStars(s.rating)}</td>
                <td className="py-4 flex gap-2"><button onClick={(e) => { e.stopPropagation(); onEditStudent(s); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button><button onClick={(e) => { e.stopPropagation(); onDeleteStudent(s.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotesManagementTab({ onNavigate, selectedBatch, onChangeBatch, onViewTimetable }: { onNavigate: (t: Tab) => void; selectedBatch: Batch | null; onChangeBatch: () => void; onViewTimetable: () => void; }) {
  // Logic kept same as per request
  const [currentView, setCurrentView] = useState<'root' | 'subject' | 'chapter'>('root');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [activeContentType, setActiveContentType] = useState<'notes' | 'dpps'>('notes');

  const [subjects] = useState([
    { id: 's1', name: 'Physics', color: '#3b82f6' },
    { id: 's2', name: 'Chemistry', color: '#10b981' },
    { id: 's3', name: 'Mathematics', color: '#f59e0b' },
    { id: 's4', name: 'Biology', color: '#f43f5e' },
  ]);

  const [chapters] = useState<Record<string, string[]>>({
    'Physics': ['Kinematics', 'Laws of Motion'],
    'Chemistry': ['Atomic Structure', 'Chemical Bonding'],
  });

  const [notes] = useState([
    { id: 'n1', chapter: 'Kinematics', title: 'Kinematics Theory Notes', size: '2.4 MB', date: '2025-09-20' },
  ]);

  const [dpps] = useState([
    { id: 'd1', chapter: 'Kinematics', title: 'Kinematics DPP 01 - Basics', questions: 15, date: '2025-09-22' },
  ]);

  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);

  const navigateToSubject = (subject: string) => { setSelectedSubject(subject); setCurrentView('subject'); };
  const navigateToChapter = (chapter: string) => { setSelectedChapter(chapter); setCurrentView('chapter'); setActiveContentType('notes'); };
  const goBack = () => { if (currentView === 'chapter') { setCurrentView('subject'); setSelectedChapter(null); } else if (currentView === 'subject') { setCurrentView('root'); setSelectedSubject(null); } };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {currentView !== 'root' && (<button onClick={goBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-700" /></button>)}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Content Management</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className={currentView === 'root' ? 'text-teal-600 font-semibold' : ''}>Root</span>
                {selectedSubject && (<><ChevronRight className="w-4 h-4" /><span>{selectedSubject}</span></>)}
                {selectedChapter && (<><ChevronRight className="w-4 h-4" /><span>{selectedChapter}</span></>)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentView === 'root' && (<button onClick={onViewTimetable} className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition font-semibold shadow-sm"><Calendar className="w-5 h-5" />Time Table</button>)}
            {currentView === 'subject' && (<button onClick={() => setIsAddChapterModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition shadow-md"><Plus className="w-5 h-5" />Add Chapter</button>)}
            {currentView === 'chapter' && (
              <div className="flex items-center gap-3">
                <button onClick={() => onNavigate('upload-notes')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition shadow-md"><Upload className="w-5 h-5" />Upload Content</button>
                <button onClick={() => onNavigate('create-dpp')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition shadow-md"><Plus className="w-5 h-5" />Upload DPP</button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {currentView === 'root' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {subjects.map((sub, index) => (
            <motion.button key={sub.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigateToSubject(sub.name)} className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white flex flex-col items-center gap-4 group">
              <div className="w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform" style={{ backgroundColor: sub.color }}><Folder className="w-8 h-8 text-white" /></div>
              <div className="text-center"><h4 className="font-bold text-gray-900">{sub.name}</h4><p className="text-xs text-gray-500 mt-1">{chapters[sub.name]?.length || 0} Chapters</p></div>
            </motion.button>
          ))}
        </div>
      )}

      {currentView === 'subject' && selectedSubject && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters[selectedSubject]?.map((chapter, index) => (
            <motion.button key={chapter} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ x: 10 }} onClick={() => navigateToChapter(chapter)} className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white flex items-center justify-between group">
              <div className="flex items-center gap-4"><div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-cyan-600 transition-colors"><Folder className="w-5 h-5 text-cyan-600 group-hover:text-white" /></div><span className="font-bold text-gray-900">{chapter}</span></div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-600 transition-colors" />
            </motion.button>
          ))}
        </div>
      )}

      {currentView === 'chapter' && selectedChapter && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-200">
            <button onClick={() => setActiveContentType('notes')} className={`pb-4 px-6 text-sm font-bold transition-all relative ${activeContentType === 'notes' ? 'text-teal-600' : 'text-gray-500'}`}>Study Notes{activeContentType === 'notes' && (<motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />)}</button>
            <button onClick={() => setActiveContentType('dpps')} className={`pb-4 px-6 text-sm font-bold transition-all relative ${activeContentType === 'dpps' ? 'text-teal-600' : 'text-gray-500'}`}>DPPs{activeContentType === 'dpps' && (<motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />)}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(activeContentType === 'notes' ? notes : dpps).filter(item => item.chapter === selectedChapter).map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white group">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${activeContentType === 'notes' ? 'from-cyan-500 to-blue-500' : 'from-emerald-500 to-teal-500'} rounded-xl flex items-center justify-center shrink-0`}><FileText className="w-6 h-6 text-white" /></div>
                  <div className="flex-1 min-w-0"><h4 className="font-bold text-gray-900 truncate mb-1">{item.title}</h4><div className="flex items-center justify-between"><span className="text-xs text-gray-500">{(item as any).size || (item as any).questions + ' Questions'} • {item.date}</span><div className="flex gap-1"><button className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"><Download className="w-4 h-4" /></button><button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div></div></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TestSeriesManagementTab({ onNavigate, selectedBatch }: { onNavigate: (t: Tab) => void; selectedBatch: Batch | null; onChangeBatch: () => void; }) {
  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-gray-900">Test Series Management</h2><p className="text-gray-600">{selectedBatch ? `For ${selectedBatch}` : 'Across all batches'}</p></div>
        <button onClick={() => onNavigate('create-test')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-500 text-white rounded-xl font-bold shadow-md"><Plus className="w-5 h-5" />Create Test Series</button>
      </div>
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-lg border border-white text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="w-10 h-10 text-blue-600" /></div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Create New Test</h3>
        <p className="text-gray-600 mb-6">Standard patterns for JEE Main, NEET and custom tests</p>
        <button onClick={() => onNavigate('create-test')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition">Get Started</button>
      </div>
    </div>
  );
}

function AddStudentModal({ open, onClose, defaultBatch, batches, initialData, title, onSubmit }: any) { 
  if (!open) return null; 
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); onSubmit({ id: initialData?.id, name: f.get('name'), email: f.get('email'), rollNumber: f.get('roll'), batch: f.get('batch') }); onClose(); }} className="space-y-4">
          <input name="name" defaultValue={initialData?.name} placeholder="Student Name" required className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <input name="email" type="email" defaultValue={initialData?.email} placeholder="Email" required className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <input name="roll" defaultValue={initialData?.rollNumber} placeholder="Roll Number" required className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <select name="batch" defaultValue={initialData?.batch || defaultBatch || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white">
            {batches.map((b:any) => <option key={b.slug} value={b.label}>{b.label}</option>)}
          </select>
          <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancel</button><button type="submit" className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold">Save</button></div>
        </form>
      </div>
    </div>
  ); 
}

function BatchFormModal({ open, batchLabel, onClose, onUpdateBatch }: any) { 
  if (!open) return null; 
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white">
        <h2 className="text-2xl font-bold mb-6">Edit Batch</h2>
        <form onSubmit={(e) => { e.preventDefault(); onUpdateBatch(batchLabel); onClose(); }} className="space-y-4">
          <input name="label" defaultValue={batchLabel} disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500" />
          <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancel</button><button type="submit" className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold">Save</button></div>
        </form>
      </div>
    </div>
  ); 
}

function StudentRatingsModal({ open, student, onClose }: any) { 
  if (!open || !student) return null; 
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white text-center">
        <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4"><Star className="w-10 h-10 text-cyan-600" /></div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{student.name}</h3>
        <p className="text-gray-500 mb-6">Performance Rating: {student.rating}/5</p>
        <button onClick={onClose} className="w-full py-3 bg-gray-100 rounded-xl font-bold">Close</button>
      </div>
    </div>
  ); 
}
