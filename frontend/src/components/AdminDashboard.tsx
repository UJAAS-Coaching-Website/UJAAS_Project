import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { User, LandingData } from '../App';
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
  Layout,
  MessageSquare,
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
import { AdminProfile } from './AdminProfile';
import { NotificationCenter, Notification } from './NotificationCenter';
import { Footer } from './Footer';
import { CreateTestSeries } from './CreateTestSeries';
import { CreateDPP } from './CreateDPP';
import { UploadNotes } from './UploadNotes';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.svg';
import demotimetable from '../assets/demotimetable.jpg';

interface AdminDashboardProps {
  user: User;
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  adminSection: AdminSection;
  onNavigateSection: (section: AdminSection) => void;
  selectedBatch: Batch | null;
  onSelectBatch: (batch: Batch) => void;
  onClearBatch: () => void;
  batches: BatchInfo[];
  onCreateBatch: (label: string, subjects?: string[], facultyAssigned?: string[]) => { ok: boolean; error?: string; label?: string };
  onUpdateBatch: (label: string, subjects?: string[], facultyAssigned?: string[]) => { ok: boolean; error?: string };
  onDeleteBatch: (label: string) => { ok: boolean; error?: string };
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  landingData: LandingData;
  onUpdateLandingData: (data: LandingData) => void;
  queries: import('../App').LandingQuery[];
  onUpdateQueries: (queries: import('../App').LandingQuery[]) => void;
}

type Tab = 'home' | 'students' | 'faculty' | 'content' | 'analytics' | 'test-series' | 'ratings' | 'rankings' | 'create-test' | 'create-dpp' | 'upload-notice' | 'profile' | 'add-student';
type Batch = string;
type AdminSection = 'landing' | 'batches' | 'students' | 'faculty' | 'test-series' | 'queries';
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
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  parentContact?: string;
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

type TeacherFormState = {
  id?: string;
  name: string;
  email: string;
  subject: string;
  phone: string;
};

function renderPerformanceStars(rating: number) {
  const normalizedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${normalizedRating} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => {
        const starNumber = index + 1;
        const fillPercentage = normalizedRating >= starNumber ? 100 : 0;

        return (
          <span
            key={starNumber}
            className="inline-block w-4 text-center text-[16px] leading-4"
            style={{
              background: `linear-gradient(90deg, #f59e0b ${fillPercentage}%, #d1d5db ${fillPercentage}%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
            {'\u2605'}
          </span>
        );
      })}
    </div>
  );
}

export function AdminDashboard({
  user,
  activeTab,
  onNavigate,
  adminSection,
  onNavigateSection,
  selectedBatch,
  onSelectBatch,
  onClearBatch,
  batches,
  onCreateBatch,
  onUpdateBatch,
  onDeleteBatch,
  onLogout,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  landingData,
  onUpdateLandingData,
  queries,
  onUpdateQueries
}: AdminDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Teacher[]>([]);
  const [showFullTimetable, setShowFullTimetable] = useState(false);
  const [timeTableImage, setTimeTableImage] = useState<string | null>(demotimetable);
  const timeTableInputRef = useRef<HTMLInputElement>(null);

  const [studentModal, setStudentModal] = useState<{ open: boolean; defaultBatch: Batch | null; initialData?: Student; title: string }>({
    open: false,
    defaultBatch: null,
    title: 'Add Student'
  });

  const [facultyModal, setFacultyModal] = useState<{ open: boolean; initialData?: Teacher; title: string }>({
    open: false,
    title: 'Add Teacher'
  });

  const [batchModal, setBatchModal] = useState<{ open: boolean; mode: 'create' | 'edit'; batchLabel?: string }>({
    open: false,
    mode: 'create'
  });

  useEffect(() => {
    // Simulated data fetch
    setStudents([
      { id: '1', name: 'Rahul Sharma', email: 'rahul@example.com', rollNumber: '2024001', enrolledCourses: ['JEE Main'], joinDate: '2024-01-15', performance: 85, rating: 4.5, batch: '12th JEE' },
      { id: '2', name: 'Priya Patel', email: 'priya@example.com', rollNumber: '2024002', enrolledCourses: ['NEET'], joinDate: '2024-01-20', performance: 92, rating: 4.8, batch: '12th NEET' },
      { id: '3', name: 'Amit Kumar', email: 'amit@example.com', rollNumber: '2024003', enrolledCourses: ['JEE Advanced'], joinDate: '2024-02-05', performance: 78, rating: 4.2, batch: 'Dropper JEE' },
      { id: '4', name: 'Sneha Mehta', email: 'sneha.m@example.com', rollNumber: '2024004', enrolledCourses: ['JEE Main', 'NEET'], joinDate: '2024-02-12', performance: 88, rating: 4.6, batch: '11th JEE' },
      { id: '5', name: 'Karan Desai', email: 'karan.d@example.com', rollNumber: '2024005', enrolledCourses: ['NEET'], joinDate: '2024-03-03', performance: 79, rating: 4.1, batch: '11th NEET' },
      { id: '6', name: 'Ananya Kapoor', email: 'ananya.k@example.com', rollNumber: '2024006', enrolledCourses: ['JEE Advanced', 'NEET'], joinDate: '2024-03-10', performance: 91, rating: 4.9, batch: '12th JEE' },
    ]);

    setFaculty([
      { id: 't1', name: 'Dr. V.K. Sharma', email: 'vk.sharma@example.com', subject: 'Physics' },
      { id: 't2', name: 'Prof. S. Gupta', email: 's.gupta@example.com', subject: 'Chemistry' },
      { id: 't3', name: 'Dr. R.K. Yadav', email: 'rk.yadav@example.com', subject: 'Mathematics' },
      { id: 't4', name: 'Ms. Tanya Bose', email: 'tanya.bose@example.com', subject: 'Biology' },
      { id: 't5', name: 'Mr. Arjun Malhotra', email: 'arjun.m@example.com', subject: 'Mathematics' },
      { id: 't6', name: 'Dr. Leena Rao', email: 'leena.rao@example.com', subject: 'Chemistry' },
    ]);
  }, []);

  const handleTimeTableUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTimeTableImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTimeTableDelete = () => {
    if (window.confirm('Are you sure you want to delete the timetable?')) {
      setTimeTableImage(null);
      setShowFullTimetable(false);
    }
  };

  const openAddStudent = (batch: Batch | null) => setStudentModal({ open: true, defaultBatch: batch, title: 'Add Student' });
  const openEditStudent = (student: Student) => setStudentModal({ open: true, defaultBatch: student.batch, initialData: student, title: 'Edit Student' });
  const closeStudentModal = () => setStudentModal({ ...studentModal, open: false });

  const openAddFaculty = () => setFacultyModal({ open: true, title: 'Add Teacher' });
  const openEditFaculty = (teacher: Teacher) => setFacultyModal({ open: true, initialData: teacher, title: 'Edit Teacher' });
  const closeFacultyModal = () => setFacultyModal({ ...facultyModal, open: false });

  const openAddBatch = () => setBatchModal({ open: true, mode: 'create' });
  const openEditBatch = (label: string) => setBatchModal({ open: true, mode: 'edit', batchLabel: label });
  const closeBatchModal = () => setBatchModal({ ...batchModal, open: false });

  const handleSaveStudent = (data: StudentFormState) => {
    if (data.id) {
      setStudents(prev => prev.map(s => s.id === data.id ? { 
        ...s, 
        name: data.name,
        email: data.email,
        rollNumber: data.rollNumber,
        batch: data.batch,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        parentContact: data.parentContact
      } : s));
    } else {
      const newStudent: Student = {
        id: `student-${Date.now()}`,
        name: data.name,
        email: data.email,
        rollNumber: data.rollNumber,
        batch: data.batch,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        parentContact: data.parentContact,
        enrolledCourses: [data.batch],
        joinDate: new Date().toISOString().split('T')[0],
        performance: 0,
        rating: 0,
      };
      setStudents(prev => [...prev, newStudent]);
    }
    closeStudentModal();
  };

  const handleSaveFaculty = (data: TeacherFormState) => {
    if (data.id) {
      setFaculty(prev => prev.map(f => f.id === data.id ? { ...f, ...data } : f));
    } else {
      const newTeacher: Teacher = {
        ...data,
        id: `faculty-${Date.now()}`,
      };
      setFaculty(prev => [...prev, newTeacher]);
    }
    closeFacultyModal();
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const handleDeleteFaculty = (id: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      setFaculty(faculty.filter(f => f.id !== id));
    }
  };

  const [ratingModal, setRatingModal] = useState<{ open: boolean; student?: Student }>({
    open: false,
  });

  const openStudentRatings = (student: Student) => setRatingModal({ open: true, student });
  const closeStudentRatings = () => setRatingModal({ open: false });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-20">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-[1000] shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Branding */}
            <motion.button
              onClick={onClearBatch}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3"
            >
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <span className="text-xl font-bold" style={{ color: 'rgb(159, 29, 14)' }}>
                UJAAS Admin
              </span>
            </motion.button>

            {/* Center Navigation Tabs */}
            {!selectedBatch ? (
              <div className="flex items-center gap-2">
                {[
                  { id: 'landing', label: 'LPM', icon: Layout },
                  { id: 'batches', label: 'Batches', icon: BookOpen },
                  { id: 'students', label: 'Students', icon: Users },
                  { id: 'faculty', label: 'Faculty', icon: GraduationCap },
                  { id: 'test-series', label: 'Test Series', icon: FileText },
                  { id: 'queries', label: 'Queries', icon: MessageSquare },
                ].map((section) => (
                  <motion.button
                    key={section.id}
                    onClick={() => onNavigateSection(section.id as AdminSection)}
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
                  { id: 'faculty', label: 'Batch Faculty', icon: GraduationCap },
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
          {/* Layered Rendering Logic */}
          {activeTab === 'create-test' ? (
            <CreateTestSeries onBack={() => onNavigate('test-series')} batches={batches} />
          ) : activeTab === 'create-dpp' ? (
            <CreateDPP onBack={() => onNavigate('content')} />
          ) : activeTab === 'profile' ? (
            <AdminProfile user={user} onLogout={onLogout} />
          ) : !selectedBatch ? (
            /* GLOBAL CONTEXT */
            <>
              {adminSection === 'landing' && (
                <LandingManagementTab 
                  data={landingData} 
                  onUpdate={onUpdateLandingData} 
                />
              )}
              {adminSection === 'batches' && (
                <BatchSelectionTab
                  batches={batches}
                  onSelectBatch={onSelectBatch}
                  onAddBatch={openAddBatch}
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
              {adminSection === 'faculty' && (
                <FacultyDirectoryTab
                  faculty={faculty}
                  onAddFaculty={openAddFaculty}
                  onEditFaculty={openEditFaculty}
                  onDeleteFaculty={handleDeleteFaculty}
                />
              )}
              {adminSection === 'test-series' && (
                <TestSeriesManagementTab onNavigate={onNavigate} selectedBatch={null as unknown as Batch} onChangeBatch={() => {}} />
              )}
              {adminSection === 'queries' && (
                <QueriesManagementTab queries={queries} onUpdate={onUpdateQueries} />
              )}
            </>
          ) : (
            /* BATCH CONTEXT */
            <>
              {activeTab === 'home' && (
                <OverviewTab
                  selectedBatch={selectedBatch}
                  onEditBatch={openEditBatch}
                  students={students}
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
              {activeTab === 'faculty' && (
                <BatchFacultyTab
                  selectedBatch={selectedBatch}
                  batches={batches}
                  faculty={faculty}
                  onUpdateBatch={onUpdateBatch}
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
              {activeTab === 'upload-notice' && (
                <NoticeUploadForm onNavigate={onNavigate} />
              )}
            </>
          )}
        </motion.div>
      </main>

      {/* Footer */}
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

        <AddFacultyModal
          open={facultyModal.open}
          onClose={closeFacultyModal}
          initialData={facultyModal.initialData}
          title={facultyModal.title}
          onSubmit={handleSaveFaculty}
        />

        <BatchFormModal
          open={batchModal.open}
          mode={batchModal.mode}
          batches={batches}
          faculty={faculty}
          batchLabel={batchModal.batchLabel}
          onClose={closeBatchModal}
          onCreateBatch={onCreateBatch}
          onUpdateBatch={onUpdateBatch}
          onDeleteBatch={onDeleteBatch}
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
                {/* Sticky Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-20">
                  <h3 className="text-xl font-bold text-gray-900">Batch Weekly Schedule</h3>
                  <button
                    onClick={() => setShowFullTimetable(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Image Container - Strictly contained */}
                <div className="flex-1 bg-gray-100 p-4 flex items-center justify-center overflow-hidden min-h-0">
                  {timeTableImage ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={timeTableImage}
                        alt="Full Time Table"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-xl bg-white"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-20 w-full">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No timetable uploaded yet.</p>
                      <button
                        onClick={() => timeTableInputRef.current?.click()}
                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                      >
                        Upload Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Sticky Footer */}
                <div className="p-4 bg-white border-t border-gray-100 flex flex-wrap justify-between items-center gap-3 shrink-0 z-20">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={timeTableInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleTimeTableUpload}
                    />
                    <button
                      onClick={() => timeTableInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition text-sm"
                    >
                      {timeTableImage ? 'Change Image' : 'Upload Image'}
                    </button>
                    {timeTableImage && (
                      <button
                        onClick={handleTimeTableDelete}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {timeTableImage && (
                      <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    )}
                    <button
                      onClick={() => setShowFullTimetable(false)}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                      Close
                    </button>
                  </div>
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

function NoticeUploadForm({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload Batch Notice</h2>
          <p className="text-gray-600">Post a text update with an accompanying image</p>
        </div>
      </div>
      
      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onNavigate('content'); }}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Notice</label>
          <input 
            type="text"
            required
            placeholder="Type the notice message here..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Upload Image</label>
          <div className="p-8 bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl text-center group hover:bg-orange-100 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={() => {}} 
            />
            <ImageIcon className="w-10 h-10 text-orange-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm text-gray-600 font-medium">Click or drag to upload notice image</p>
            <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, WEBP</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            type="button"
            onClick={() => onNavigate('content')}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
          >
            Post Notice
          </button>
        </div>
      </form>
    </div>
  );
}

function LandingManagementTab({ data, onUpdate }: { data: LandingData; onUpdate: (data: LandingData) => void }) {
  const [activeSubSection, setActiveSubSection] = useState<'overview' | 'courses' | 'faculty' | 'achievers' | 'contact'>('overview');
  const [newCourse, setNewCourse] = useState('');
  const [isAddingFaculty, setIsAddingFaculty] = useState(false);
  const [editingFacultyIndex, setEditingFacultyIndex] = useState<number | null>(null);
  const [isAddingAchiever, setIsAddingAchiever] = useState(false);

  const handleAddCourse = (e: FormEvent) => {
    e.preventDefault();
    if (newCourse.trim()) {
      onUpdate({ ...data, courses: [...data.courses, newCourse.trim()] });
      setNewCourse('');
    }
  };

  const handleRemoveCourse = (index: number) => {
    onUpdate({ ...data, courses: data.courses.filter((_, i) => i !== index) });
  };

  const handleUpdateContact = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    onUpdate({
      ...data,
      contact: {
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
      }
    });
    setActiveSubSection('overview');
  };

  const handleAddFaculty = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const file = formData.get('imageFile') as File;
    const save = (url: string) => {
      onUpdate({
        ...data,
        faculty: [...data.faculty, {
          name: formData.get('name') as string,
          subject: formData.get('subject') as string,
          designation: formData.get('designation') as string,
          experience: formData.get('experience') as string,
          image: url
        }]
      });
      setIsAddingFaculty(false);
    };
    if (file && file.size > 0) {
      const r = new FileReader();
      r.onloadend = () => save(r.result as string);
      r.readAsDataURL(file);
    } else save('https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop');
  };

  const handleSaveEditedFaculty = (e: FormEvent) => {
    e.preventDefault();
    if (editingFacultyIndex === null) return;
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const file = formData.get('imageFile') as File;
    const existing = data.faculty[editingFacultyIndex].image;
    const save = (url: string) => {
      const next = [...data.faculty];
      next[editingFacultyIndex] = {
        name: formData.get('name') as string,
        subject: formData.get('subject') as string,
        designation: formData.get('designation') as string,
        experience: formData.get('experience') as string,
        image: url
      };
      onUpdate({ ...data, faculty: next });
      setEditingFacultyIndex(null);
    };
    if (file && file.size > 0) {
      const r = new FileReader();
      r.onloadend = () => save(r.result as string);
      r.readAsDataURL(file);
    } else save(existing);
  };

  const handleAddAchiever = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const file = formData.get('imageFile') as File;
    const save = (url: string) => {
      onUpdate({
        ...data,
        achievers: [...data.achievers, {
          name: formData.get('name') as string,
          achievement: formData.get('achievement') as string,
          year: formData.get('year') as string,
          image: url
        }]
      });
      setIsAddingAchiever(false);
    };
    if (file && file.size > 0) {
      const r = new FileReader();
      r.onloadend = () => save(r.result as string);
      r.readAsDataURL(file);
    } else save('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop');
  };

  if (activeSubSection === 'courses') {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setActiveSubSection('overview')} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
          <h2 className="text-3xl font-bold text-gray-900">Manage Courses</h2>
        </div>
        <form onSubmit={handleAddCourse} className="flex gap-4 mb-8">
          <input type="text" value={newCourse} onChange={(e) => setNewCourse(e.target.value)} placeholder="Course name..." className="flex-1 px-4 py-3 rounded-xl border border-gray-200" />
          <button type="submit" className="px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition"><Plus className="w-5 h-5" />Add</button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.courses.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group">
              <span className="font-medium text-gray-700">{c}</span>
              <button onClick={() => handleRemoveCourse(i)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSubSection === 'faculty') {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveSubSection('overview')} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-3xl font-bold text-gray-900">Manage Faculty</h2>
          </div>
          <button onClick={() => { setIsAddingFaculty(!isAddingFaculty); setEditingFacultyIndex(null); }} className="px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition">
            {isAddingFaculty ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {isAddingFaculty ? 'Cancel' : 'Add Faculty'}
          </button>
        </div>
        {isAddingFaculty && (
          <form onSubmit={handleAddFaculty} className="bg-gray-50 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" required placeholder="Name" className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="subject" required placeholder="Subject" className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="designation" required placeholder="Designation" className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="experience" required placeholder="Experience" className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="imageFile" type="file" accept="image/*" className="md:col-span-2 px-4 py-2 rounded-lg border border-gray-200 bg-white" />
            <button type="submit" className="md:col-span-2 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition">Save</button>
          </form>
        )}
        {editingFacultyIndex !== null && (
          <form onSubmit={handleSaveEditedFaculty} className="bg-teal-50 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" required defaultValue={data.faculty[editingFacultyIndex].name} className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="subject" required defaultValue={data.faculty[editingFacultyIndex].subject} className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="designation" required defaultValue={data.faculty[editingFacultyIndex].designation} className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="experience" required defaultValue={data.faculty[editingFacultyIndex].experience} className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="imageFile" type="file" accept="image/*" className="md:col-span-2 px-4 py-2 rounded-lg border border-gray-200 bg-white" />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition">Update</button>
              <button type="button" onClick={() => setEditingFacultyIndex(null)} className="flex-1 py-3 bg-gray-200 rounded-xl">Cancel</button>
            </div>
          </form>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.faculty.map((m, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 relative group">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingFacultyIndex(i); setIsAddingFaculty(false); }} className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => onUpdate({ ...data, faculty: data.faculty.filter((_, idx) => idx !== i) })} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-4">
                <img src={m.image} className="w-16 h-16 rounded-full object-cover border-2 border-teal-100" />
                <div><h3 className="font-bold text-gray-900">{m.name}</h3><p className="text-sm text-teal-600">{m.subject}</p><p className="text-xs text-gray-500">{m.designation}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSubSection === 'achievers') {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveSubSection('overview')} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-3xl font-bold text-gray-900">Manage Achievers</h2>
          </div>
          <button onClick={() => setIsAddingAchiever(!isAddingAchiever)} className="px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition">
            {isAddingAchiever ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {isAddingAchiever ? 'Cancel' : 'Add Achiever'}
          </button>
        </div>
        {isAddingAchiever && (
          <form onSubmit={handleAddAchiever} className="bg-gray-50 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" required placeholder="Name" className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="achievement" required placeholder="Achievement" className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="year" required placeholder="Year" className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="imageFile" type="file" accept="image/*" required className="px-4 py-2 rounded-lg border border-gray-200 bg-white" />
            <button type="submit" className="md:col-span-2 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition">Save</button>
          </form>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.achievers.map((a, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 relative group">
              <button onClick={() => onUpdate({ ...data, achievers: data.achievers.filter((_, idx) => idx !== i) })} className="absolute top-2 right-2 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
              <div className="flex items-center gap-4">
                <img src={a.image} className="w-16 h-16 rounded-xl object-cover border-2 border-cyan-100" />
                <div><h3 className="font-bold text-gray-900">{a.name}</h3><p className="text-sm text-cyan-600">{a.achievement}</p><p className="text-xs text-gray-500">Year: {a.year}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSubSection === 'contact') {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setActiveSubSection('overview')} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
          <h2 className="text-3xl font-bold text-gray-900">Manage Contact Info</h2>
        </div>
        <form onSubmit={handleUpdateContact} className="max-w-xl space-y-6">
          <input name="phone" defaultValue={data.contact.phone} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <input name="email" type="email" defaultValue={data.contact.email} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <textarea name="address" rows={3} defaultValue={data.contact.address} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <div className="flex gap-4">
            <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition">Save</button>
            <button type="button" onClick={() => setActiveSubSection('overview')} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 via-blue-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Layout className="w-6 h-6 text-white" />
        </div>
        <div><h2 className="text-3xl font-bold text-gray-900">Landing Page Management</h2><p className="text-gray-600">Customize the content of your public landing page</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 'courses', title: 'Courses', description: 'Manage available courses' },
          { id: 'faculty', title: 'Faculty', icon: GraduationCap, description: 'Update faculty showcase' },
          { id: 'achievers', title: 'Achievers', description: 'Manage student success stories' },
          { id: 'contact', title: 'Contact Info', description: 'Update address and phone' },
        ].map((item) => (
          <div key={item.id} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{item.description}</p>
            <button onClick={() => setActiveSubSection(item.id as any)} className="text-cyan-600 font-semibold text-sm hover:underline">Edit Section →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BatchSelectionTab({ batches, onSelectBatch, onAddBatch }: { batches: BatchInfo[]; onSelectBatch: (b: Batch) => void; onAddBatch: () => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {batches.map((batch) => (
        <motion.button key={batch.slug} onClick={() => onSelectBatch(batch.label)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white text-left group">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{batch.label}</h3>
          <p className="text-gray-500 text-sm">View and manage this batch's academic progress</p>
        </motion.button>
      ))}
      <motion.button onClick={onAddBatch} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-8 bg-white/40 backdrop-blur-lg rounded-3xl shadow-xl border border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 group">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-teal-50 transition-colors">
          <Plus className="w-7 h-7 text-gray-400 group-hover:text-teal-600" />
        </div>
        <span className="text-lg font-bold text-gray-500 group-hover:text-teal-600">Create New Batch</span>
      </motion.button>
    </div>
  );
}

function QueriesManagementTab({ queries, onUpdate }: { queries: import('../App').LandingQuery[]; onUpdate: (queries: import('../App').LandingQuery[]) => void }) {
  const handleDelete = (id: string) => onUpdate(queries.filter(q => q.id !== id));
  const handleStatusChange = (id: string, status: 'new' | 'contacted' | 'completed') => onUpdate(queries.map(q => q.id === id ? { ...q, status } : q));
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg"><MessageSquare className="w-6 h-6 text-white" /></div>
        <div><h2 className="text-3xl font-bold text-gray-900">Interest Queries</h2><p className="text-gray-600">Manage interest registered through the landing page</p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="text-left border-b border-gray-100"><th className="pb-4 font-bold text-gray-700">Date</th><th className="pb-4 font-bold text-gray-700">Student</th><th className="pb-4 font-bold text-gray-700">Course</th><th className="pb-4 font-bold text-gray-700">Message</th><th className="pb-4 font-bold text-gray-700">Status</th><th className="pb-4 font-bold text-gray-700">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {queries.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 text-sm text-gray-500">{new Date(q.date).toLocaleDateString()}</td>
                <td className="py-4"><div className="font-bold text-gray-900">{q.name}</div><div className="text-xs text-gray-500">{q.phone}</div></td>
                <td className="py-4"><span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold uppercase">{q.course}</span></td>
                <td className="py-4 max-w-xs"><p className="text-sm text-gray-700 break-words">{q.message || '—'}</p></td>
                <td className="py-4">
                  <select value={q.status} onChange={(e) => handleStatusChange(q.id, e.target.value as any)} className={`text-xs font-bold rounded-lg px-2 py-1 ${q.status === 'new' ? 'bg-orange-100 text-orange-700' : q.status === 'contacted' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    <option value="new">New</option><option value="contacted">Contacted</option><option value="completed">Completed</option>
                  </select>
                </td>
                <td className="py-4"><button onClick={() => handleDelete(q.id)} className="p-2 text-red-500"><Trash2 className="w-5 h-5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverviewTab({ selectedBatch, onEditBatch, students }: { selectedBatch: Batch; onEditBatch: (l: string) => void; students: Student[] }) {
  return (
    <div className="space-y-8">
                <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-gray-900">{selectedBatch} Overview</h2><button onClick={() => onEditBatch(selectedBatch)} className="px-6 py-3 bg-white text-teal-600 rounded-xl font-bold border border-teal-100 shadow-sm hover:shadow-md transition">Edit Batch Settings</button></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: students.filter(s => s.batch === selectedBatch).length, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Avg. Attendance', value: '92%', icon: Calendar, color: 'from-teal-500 to-emerald-500' },
          { label: 'Pending DPPs', value: '12', icon: ClipboardList, color: 'from-orange-500 to-red-500' },
          { label: 'Performance', value: 'High', icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
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
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4"><div className="font-bold text-gray-900">{s.name}</div><div className="text-xs text-gray-500">{s.email}</div></td>
                <td className="py-4 text-sm text-gray-600 font-mono">{s.rollNumber}</td>
                <td className="py-4">{renderPerformanceStars(s.rating)}</td>
                <td className="py-4 flex gap-2"><button onClick={() => onEditStudent(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button><button onClick={() => onDeleteStudent(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BatchFacultyTab({ selectedBatch, faculty, batches, onUpdateBatch }: { selectedBatch: Batch; faculty: Teacher[]; batches: BatchInfo[]; onUpdateBatch: any }) {
  const currentBatch = batches.find(b => b.label === selectedBatch);
  const [assigned, setAssigned] = useState<string[]>(currentBatch?.facultyAssigned || []);
  const handleToggle = (name: string) => {
    const next = assigned.includes(name) ? assigned.filter(n => n !== name) : [...assigned, name];
    setAssigned(next);
    onUpdateBatch(selectedBatch, { facultyAssigned: next });
  };
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Manage Batch Faculty</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.map((t) => (
          <button key={t.id} onClick={() => handleToggle(t.name)} className={`p-6 rounded-3xl border-2 transition-all text-left ${assigned.includes(t.name) ? 'border-cyan-500 bg-cyan-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${assigned.includes(t.name) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}><GraduationCap className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold text-gray-900">{t.name}</h3><p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider">{t.subject}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotesManagementTab({
  onNavigate,
  selectedBatch,
  onChangeBatch,
  onViewTimetable,
}: {
  onNavigate: (tab: Tab) => void;
  selectedBatch: Batch | null;
  onChangeBatch: () => void;
  onViewTimetable: () => void;
}) {
  const [currentView, setCurrentView] = useState<'root' | 'subject' | 'chapter'>('root');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [activeContentType, setActiveContentType] = useState<'notes' | 'dpps'>('notes');

  const [subjects, setSubjects] = useState([
    { id: 's1', name: 'Physics', color: '#3b82f6' },
    { id: 's2', name: 'Chemistry', color: '#10b981' },
    { id: 's3', name: 'Mathematics', color: '#f59e0b' },
    { id: 's4', name: 'Biology', color: '#f43f5e' },
  ]);

  const [chapters, setChapters] = useState<Record<string, string[]>>({
    'Physics': ['Kinematics', 'Laws of Motion', 'Work Energy Power'],
    'Chemistry': ['Atomic Structure', 'Chemical Bonding', 'States of Matter'],
    'Mathematics': ['Integration Basics', 'Differentiation', 'Calculus'],
    'Biology': ['Cell Division', 'Genetics', 'Evolution'],
  });

  const [notes, setNotes] = useState([
    { id: 'n1', chapter: 'Kinematics', title: 'Kinematics Theory Notes', size: '2.4 MB', date: '2025-09-20' },
    { id: 'n2', chapter: 'Kinematics', title: '1D Motion Formula Sheet', size: '1.2 MB', date: '2025-09-21' },
  ]);

  const [dpps, setDpps] = useState([
    { id: 'd1', chapter: 'Kinematics', title: 'Kinematics DPP 01 - Basics', questions: 15, date: '2025-09-22' },
    { id: 'd2', chapter: 'Kinematics', title: 'Kinematics DPP 02 - Projectile', questions: 20, date: '2025-09-23' },
  ]);

  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newChapterName, setNewChapterName] = useState('');

  const handleAddSubject = (e: FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      setSubjects([...subjects, { 
        id: `s${Date.now()}`, 
        name: newSubjectName.trim(), 
        color: randomColor 
      }]);
      setChapters({ ...chapters, [newSubjectName.trim()]: [] });
      setNewSubjectName('');
      setIsAddSubjectModalOpen(false);
    }
  };

  const handleAddChapter = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    if (newChapterName.trim()) {
      setChapters({
        ...chapters,
        [selectedSubject]: [...(chapters[selectedSubject] || []), newChapterName.trim()]
      });
      setNewChapterName('');
      setIsAddChapterModalOpen(false);
    }
  };

  const navigateToSubject = (subject: string) => {
    setSelectedSubject(subject);
    setCurrentView('subject');
  };

  const navigateToChapter = (chapter: string) => {
    setSelectedChapter(chapter);
    setCurrentView('chapter');
    setActiveContentType('notes');
  };

  const goBack = () => {
    if (currentView === 'chapter') {
      setCurrentView('subject');
      setSelectedChapter(null);
    } else if (currentView === 'subject') {
      setCurrentView('root');
      setSelectedSubject(null);
    }
  };

  return (
    <div className="space-y-6 relative z-0">
      {/* Header & Breadcrumbs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {currentView !== 'root' && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goBack}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </motion.button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Content Management</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className={currentView === 'root' ? 'text-teal-600 font-semibold cursor-pointer' : 'cursor-pointer'} onClick={() => { setCurrentView('root'); setSelectedSubject(null); setSelectedChapter(null); }}>Root</span>
                {selectedSubject && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className={currentView === 'subject' ? 'text-teal-600 font-semibold cursor-pointer' : 'cursor-pointer'} onClick={() => { setCurrentView('subject'); setSelectedChapter(null); }}>{selectedSubject}</span>
                  </>
                )}
                {selectedChapter && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className={currentView === 'chapter' ? 'text-teal-600 font-semibold' : ''}>{selectedChapter}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentView === 'root' && (
              <>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onViewTimetable}
                  className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition border border-indigo-100 font-semibold shadow-sm"
                >
                  <Calendar className="w-5 h-5" />
                  Time Table
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddSubjectModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Add Subject
                </motion.button>
              </>
            )}
            {currentView === 'subject' && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddChapterModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition shadow-md"
              >
                <Plus className="w-5 h-5" />
                Add Chapter
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('upload-notice')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition shadow-md"
            >
              <Bell className="w-5 h-5" />
              Upload Notice
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Add Subject Modal */}
      <AnimatePresence>
        {isAddSubjectModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAddSubjectModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
                <h3 className="text-xl font-bold">Add New Subject</h3>
                <p className="text-teal-50 text-sm">Create a new subject folder</p>
              </div>
              <form onSubmit={handleAddSubject} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Subject Name</label>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g., Organic Chemistry"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                  >
                    Create Subject
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Chapter Modal */}
      <AnimatePresence>
        {isAddChapterModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAddChapterModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
                <h3 className="text-xl font-bold">Add New Chapter</h3>
                <p className="text-teal-50 text-sm">Add to {selectedSubject}</p>
              </div>
              <form onSubmit={handleAddChapter} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Chapter Name</label>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    placeholder="e.g., Rotation Mechanics"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddChapterModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                  >
                    Create Chapter
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {currentView === 'root' && (
        <>
                    {/* Subject Folders */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 relative z-0">
                      {subjects.map((sub, index) => (
                        <motion.button
                          key={sub.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigateToSubject(sub.name)}
                          className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white flex flex-col items-center gap-4 group"
                        >
                          <div 
                            className="w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform"
                            style={{ backgroundColor: sub.color }}
                          >
                            <Folder className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-center">
                            <h4 className="font-bold text-gray-900">{sub.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{chapters[sub.name]?.length || 0} Chapters</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}
          
                {currentView === 'subject' && selectedSubject && chapters[selectedSubject] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-0">
                    {chapters[selectedSubject].map((chapter, index) => (
                      <motion.button
                        key={chapter}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 10 }}
                        onClick={() => navigateToChapter(chapter)}
                        className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-teal-600 transition-colors">
                            <Folder className="w-5 h-5 text-teal-600 group-hover:text-white" />
                          </div>
                          <span className="font-bold text-gray-900">{chapter}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                      </motion.button>
                    ))}
                  </div>
                )}
          
                {currentView === 'chapter' && selectedChapter && (
                  <div className="space-y-6 relative z-0">
                    {/* Internal Navigation */}
                    <div className="flex items-center gap-4 border-b border-gray-200">
                      <button
                        onClick={() => setActiveContentType('notes')}
                        className={`pb-4 px-6 text-sm font-bold transition-all relative ${
                          activeContentType === 'notes' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Study Notes
                        {activeContentType === 'notes' && (
                          <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />
                        )}
                      </button>
                      <button
                        onClick={() => setActiveContentType('dpps')}
                        className={`pb-4 px-6 text-sm font-bold transition-all relative ${
                          activeContentType === 'dpps' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Daily Practice Problems (DPPs)
                        {activeContentType === 'dpps' && (
                          <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />
                        )}
                      </button>
                    </div>
          
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeContentType === 'notes' ? (
                        notes
                          .filter(n => n.chapter === selectedChapter)
                          .map((note, index) => (
                          <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white group"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 truncate mb-1">{note.title}</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">{note.size} â€¢ {note.date}</span>
                                  <div className="flex gap-1">
                                    <button className="p-2 text-teal-600 hover:bg-cyan-50 rounded-lg transition-colors"><Download className="w-4 h-4" /></button>
                                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        dpps
                          .filter(d => d.chapter === selectedChapter)
                          .map((dpp, index) => (
                          <motion.div
                            key={dpp.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white group"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shrink-0">
                                <ClipboardList className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 truncate mb-1">{dpp.title}</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">{dpp.questions} Questions â€¢ {dpp.date}</span>
                                  <div className="flex gap-1">
                                    <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Download className="w-4 h-4" /></button>
                                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}
    </div>
  );
}

function StudentsDirectoryTab({ students, batches, onAddStudent, onEditStudent, onDeleteStudent, onViewStudent }: { students: Student[]; batches: BatchInfo[]; onAddStudent: () => void; onEditStudent: (s: Student) => void; onDeleteStudent: (id: string) => void; onViewStudent: (s: Student) => void }) {
  const [q, setQ] = useState('');
  const filtered = students.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div><h2 className="text-3xl font-bold text-gray-900">Students Directory</h2><p className="text-gray-500">Manage all students across all batches</p></div>
        <div className="flex gap-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." className="pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-teal-500 w-64" /></div><button onClick={onAddStudent} className="px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 hover:shadow-xl transition"><Plus className="w-5 h-5" />Add Student</button></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="text-left border-b border-gray-100"><th className="pb-4 font-bold text-gray-700">Student</th><th className="pb-4 font-bold text-gray-700">Performance</th><th className="pb-4 font-bold text-gray-700">Batch</th><th className="pb-4 font-bold text-gray-700">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4"><div className="font-bold text-gray-900">{s.name}</div><div className="text-xs text-gray-500">{s.email}</div></td>
                <td className="py-4">{renderPerformanceStars(s.rating)}</td>
                <td className="py-4"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{s.batch}</span></td>
                <td className="py-4 flex gap-2"><button onClick={() => onEditStudent(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button><button onClick={() => onDeleteStudent(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FacultyDirectoryTab({ faculty, onAddFaculty, onEditFaculty, onDeleteFaculty }: { faculty: Teacher[]; onAddFaculty: () => void; onEditFaculty: (t: Teacher) => void; onDeleteFaculty: (id: string) => void }) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex justify-between items-center mb-8">
        <div><h2 className="text-3xl font-bold text-gray-900">Faculty Directory</h2><p className="text-gray-500">Manage all teachers and subject experts</p></div>
        <button onClick={onAddFaculty} className="px-6 py-3  bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add Teacher</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onEditFaculty(t)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button><button onClick={() => onDeleteFaculty(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div>
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center mb-4"><GraduationCap className="w-6 h-6 text-teal-600" /></div>
            <h3 className="text-xl font-bold text-gray-900">{t.name}</h3><p className="text-sm font-semibold text-teal-600 uppercase mb-4">{t.subject}</p><div className="text-xs text-gray-500">{t.email}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestSeriesManagementTab({ onNavigate, selectedBatch, onChangeBatch }: { onNavigate: (t: Tab) => void; selectedBatch: Batch | null; onChangeBatch: () => void }) {
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

function AddStudentModal({
  open,
  onClose,
  defaultBatch,
  batches,
  initialData,
  title,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  defaultBatch: Batch | null;
  batches: BatchInfo[];
  initialData?: Student;
  title?: string;
  onSubmit?: (data: StudentFormState) => void;
}) {
  const createInitialState = (batch: Batch | null, initial?: Student): StudentFormState => ({
    id: initial?.id,
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    rollNumber: initial?.rollNumber ?? '',
    batch: initial?.batch ?? batch ?? '',
    phoneNumber: initial?.phoneNumber ?? '',
    dateOfBirth: initial?.dateOfBirth ?? '',
    address: initial?.address ?? '',
    parentContact: initial?.parentContact ?? '',
  });

  const [formState, setFormState] = useState(createInitialState(defaultBatch, initialData));

  useEffect(() => {
    if (!open) return;
    setFormState(createInitialState(defaultBatch, initialData));
  }, [open, defaultBatch, initialData]);

  if (!open) return null;

  const handleChange = (field: keyof StudentFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.(formState);
    onClose();
  };

  const requiredMark = <span className="text-red-500">*</span>;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-white overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
          <h3 className="text-xl font-semibold">{title ?? 'Add Student'}</h3>
          <p className="text-sm text-white/80">Fields marked with * are mandatory.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Name {requiredMark}</span>
              <input
                type="text"
                required
                value={formState.name}
                onChange={handleChange('name')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="Student name"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Email {requiredMark}</span>
              <input
                type="email"
                required
                value={formState.email}
                onChange={handleChange('email')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="name@email.com"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Roll Number {requiredMark}</span>
              <input
                type="text"
                required
                value={formState.rollNumber}
                onChange={handleChange('rollNumber')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="UJAAS-###"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Batch {requiredMark}</span>
              <select
                required
                value={formState.batch}
                onChange={handleChange('batch')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
              >
                <option value="" disabled>Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.slug} value={batch.label}>{batch.label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Phone Number {requiredMark}</span>
              <input
                type="tel"
                required
                value={formState.phoneNumber}
                onChange={handleChange('phoneNumber')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="+91 9XXXX XXXXX"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Date of Birth {requiredMark}</span>
              <input
                type="date"
                required
                value={formState.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Address {requiredMark}</span>
            <textarea
              required
              rows={3}
              value={formState.address}
              onChange={handleChange('address')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Street, city, state, postal code"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Parent Contact {requiredMark}</span>
            <input
              type="tel"
              required
              value={formState.parentContact}
              onChange={handleChange('parentContact')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Parent/guardian phone number"
            />
          </label>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 min-h-[44px] rounded-xl border border-gray-200 text-gray-700 font-medium leading-none whitespace-nowrap hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold leading-none whitespace-nowrap shadow-lg hover:shadow-xl transition"
            >
              Save Student
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AddFacultyModal({
  open,
  onClose,
  initialData,
  title,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: Teacher;
  title?: string;
  onSubmit?: (data: TeacherFormState) => void;
}) {
  const [formState, setFormState] = useState<TeacherFormState>({
    id: initialData?.id,
    subject: initialData?.subject ?? '',
    name: initialData?.name ?? '',
    phone: initialData?.phone ?? '',
    email: initialData?.email ?? '',
  });

  useEffect(() => {
    if (!open) return;
    setFormState({
      id: initialData?.id,
      subject: initialData?.subject ?? '',
      name: initialData?.name ?? '',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
    });
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (field: keyof TeacherFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.(formState);
    onClose();
  };

  const requiredMark = <span className="text-red-500">*</span>;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-white overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
          <h3 className="text-xl font-semibold">{title ?? 'Add Faculty'}</h3>
          <p className="text-sm text-white/80">Fields marked with * are mandatory.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Subject {requiredMark}</span>
            <input
              type="text"
              required
              value={formState.subject}
              onChange={handleChange('subject')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="e.g. Physics"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Faculty Name {requiredMark}</span>
            <input
              type="text"
              required
              value={formState.name}
              onChange={handleChange('name')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Faculty name"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Phone Number {requiredMark}</span>
            <input
              type="tel"
              required
              value={formState.phone}
              onChange={handleChange('phone')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="+91 9XXXX XXXXX"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Email {requiredMark}</span>
            <input
              type="email"
              required
              value={formState.email}
              onChange={handleChange('email')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="faculty@email.com"
            />
          </label>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 min-h-[44px] rounded-xl border border-gray-200 text-gray-700 font-medium leading-none whitespace-nowrap hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold leading-none whitespace-nowrap shadow-lg hover:shadow-xl transition"
            >
              Save Faculty
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function BatchFormModal({
  open,
  mode,
  batches,
  faculty,
  batchLabel,
  onClose,
  onCreateBatch,
  onUpdateBatch,
  onDeleteBatch,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  batches: BatchInfo[];
  faculty: Teacher[];
  batchLabel?: string;
  onClose: () => void;
  onCreateBatch: (label: string, subjects?: string[], facultyAssigned?: string[]) => { ok: boolean; error?: string; label?: string };
  onUpdateBatch: (label: string, subjects?: string[], facultyAssigned?: string[]) => { ok: boolean; error?: string };
  onDeleteBatch: (label: string) => { ok: boolean; error?: string };
}) {
  const [formState, setFormState] = useState({
    name: '',
    subject: '',
    faculty: '',
    assignments: [] as { subject: string; faculty: string }[],
  });
  const [error, setError] = useState<string | null>(null);
  const subjects = Array.from(new Set(faculty.map((item) => item.subject))).sort();

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && batchLabel) {
      const current = batches.find((batch) => batch.label === batchLabel);
      const assignments = (current?.facultyAssigned ?? [])
        .map((name) => {
          const found = faculty.find((item) => item.name === name);
          return found ? { subject: found.subject, faculty: found.name } : null;
        })
        .filter((item): item is { subject: string; faculty: string } => !!item);
      setFormState({
        name: current?.label ?? batchLabel,
        subject: '',
        faculty: '',
        assignments,
      });
    } else {
      setFormState({ name: '', subject: '', faculty: '', assignments: [] });
    }
    setError(null);
  }, [open, mode, batchLabel, batches, faculty]);

  if (!open) return null;

  const facultyOptions = formState.subject
    ? faculty.filter((item) => item.subject === formState.subject)
    : [];

  const addAssignment = () => {
    if (!formState.subject || !formState.faculty) return;
    setFormState((prev) => {
      const exists = prev.assignments.some(
        (item) => item.subject === prev.subject && item.faculty === prev.faculty
      );
      if (exists) {
        return { ...prev, subject: '', faculty: '' };
      }
      return {
        ...prev,
        assignments: [...prev.assignments, { subject: prev.subject, faculty: prev.faculty }],
        subject: '',
        faculty: '',
      };
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const selectedSubjects = Array.from(new Set(formState.assignments.map((item) => item.subject)));
    const selectedFaculty = Array.from(new Set(formState.assignments.map((item) => item.faculty)));
    if (!formState.name.trim()) {
      setError('Batch name is required.');
      return;
    }
    if (selectedSubjects.length === 0 || selectedFaculty.length === 0) {
      setError('Add at least one subject and faculty.');
      return;
    }
    const result =
      mode === 'edit'
        ? onUpdateBatch(formState.name.trim(), selectedSubjects, selectedFaculty)
        : onCreateBatch(formState.name.trim(), selectedSubjects, selectedFaculty);
    if (!result.ok) {
      setError(result.error ?? 'Unable to save batch.');
      return;
    }
    onClose();
  };

  const handleDelete = () => {
    if (!batchLabel) return;
    if (window.confirm(`Are you sure you want to delete the batch "${batchLabel}"?`)) {
      const result = onDeleteBatch(batchLabel);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error ?? 'Unable to delete batch.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-white overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
          <h3 className="text-xl font-semibold">{mode === 'edit' ? 'Edit Batch' : 'Create New Batch'}</h3>
          <p className="text-sm text-white/80">Add batch details and faculty assignment.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Batch Name *</span>
            <input
              type="text"
              required
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              disabled={mode === 'edit'}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="e.g. 11th JEE Evening"
            />
          </label>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Subject & Faculty *</p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-start">
              <label className="space-y-2 text-sm font-medium text-gray-700 block">
                <span className="block">Subject</span>
                <select
                  value={formState.subject}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      subject: event.target.value,
                      faculty: '',
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-gray-700 block">
                <span className="block">Faculty</span>
                <select
                  value={formState.faculty}
                  onChange={(event) => setFormState((prev) => ({ ...prev, faculty: event.target.value }))}
                  disabled={!formState.subject}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">{formState.subject ? 'Select faculty' : 'Select subject first'}</option>
                  {facultyOptions.map((item) => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={addAssignment}
                className="mt-7 px-5 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold leading-none whitespace-nowrap shadow-md hover:shadow-lg transition"
              >
                Add
              </button>
            </div>
          </div>

          {formState.assignments.length > 0 && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">Selected</p>
              <div className="space-y-1">
                {formState.assignments.map((item, index) => (
                  <div key={`${item.subject}-${item.faculty}-${index}`} className="flex items-center justify-between text-sm text-gray-700">
                    <span>
                      {item.subject} — <span className="font-semibold">{item.faculty}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          assignments: prev.assignments.filter((_, i) => i !== index),
                        }))
                      }
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 min-h-[44px] rounded-xl border border-red-200 text-red-600 font-medium leading-none whitespace-nowrap hover:bg-red-50 transition mr-auto"
              >
                Delete Batch
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 min-h-[44px] rounded-xl border border-gray-200 text-gray-700 font-medium leading-none whitespace-nowrap hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold leading-none whitespace-nowrap shadow-md hover:shadow-lg transition"
            >
              {mode === 'edit' ? 'Save Batch' : 'Add Batch'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function StudentRatingsModal({
  open,
  student,
  onClose,
}: {
  open: boolean;
  student?: Student;
  onClose: () => void;
}) {
  if (!open || !student) return null;

  const ratings = student.ratings ?? {
    attendance: 0,
    tests: 0,
    dppPerformance: 0,
    behavior: 0,
  };

  const performanceData = [
    { label: 'Attendance', value: ratings.attendance },
    { label: 'Test Performance', value: ratings.tests },
    { label: 'DPP Performance', value: ratings.dppPerformance },
    { label: 'Class Behaviour', value: ratings.behavior },
  ];

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-white overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
          <h3 className="text-xl font-semibold">{student.name}</h3>
          <p className="text-sm text-white/80">Performance Breakdown</p>
        </div>

        <div className="p-6 space-y-4">
          {performanceData.map((item) => (
            <div key={item.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div className="text-sm font-medium text-gray-700">{item.label}</div>
              <div className="flex items-center gap-2">
                {renderPerformanceStars(item.value)}
                <span className="text-sm font-semibold text-gray-700">{item.value}/5</span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 min-h-[44px] rounded-xl border border-gray-200 text-gray-700 font-medium leading-none whitespace-nowrap hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
