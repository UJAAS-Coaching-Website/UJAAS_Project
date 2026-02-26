import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from 'react';
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
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

type Tab = 'home' | 'students' | 'faculty' | 'content' | 'analytics' | 'test-series' | 'ratings' | 'rankings' | 'create-test' | 'create-dpp' | 'upload-notice' | 'profile' | 'add-student';
type Batch = string;
type AdminSection = 'batches' | 'students' | 'faculty' | 'test-series';
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

type FacultyFormState = {
  id?: string;
  subject: string;
  name: string;
  phone: string;
  email: string;
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
const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Rahul Kumar',
    email: 'rahul@example.com',
    rollNumber: 'UJAAS-001',
    enrolledCourses: ['JEE Advanced', 'JEE Mains'],
    joinDate: '2025-09-01',
    performance: 87,
    rating: 4,
    batch: '11th JEE',
    ratings: { attendance: 4, tests: 4, dppPerformance: 3, behavior: 5 }
  },
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    rollNumber: 'UJAAS-002',
    enrolledCourses: ['NEET', 'JEE Mains'],
    joinDate: '2025-09-05',
    performance: 92,
    rating: 3,
    batch: '11th NEET',
    ratings: { attendance: 5, tests: 4, dppPerformance: 4, behavior: 4 }
  },
  {
    id: '3',
    name: 'Amit Patel',
    email: 'amit@example.com',
    rollNumber: 'UJAAS-003',
    enrolledCourses: ['JEE Advanced'],
    joinDate: '2025-09-10',
    performance: 78,
    rating: 3,
    batch: '12th JEE',
    ratings: { attendance: 3, tests: 3, dppPerformance: 3, behavior: 4 }
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    email: 'sneha@example.com',
    rollNumber: 'UJAAS-004',
    enrolledCourses: ['NEET'],
    joinDate: '2025-09-12',
    performance: 95,
    rating: 5,
    batch: '12th NEET',
    ratings: { attendance: 5, tests: 5, dppPerformance: 5, behavior: 4 }
  },
  {
    id: '5',
    name: 'Karan Mehta',
    email: 'karan@example.com',
    rollNumber: 'UJAAS-005',
    enrolledCourses: ['JEE Mains'],
    joinDate: '2025-09-14',
    performance: 84,
    rating: 4,
    batch: 'Dropper JEE',
    ratings: { attendance: 4, tests: 4, dppPerformance: 4, behavior: 3 }
  },
  {
    id: '6',
    name: 'Ananya Singh',
    email: 'ananya@example.com',
    rollNumber: 'UJAAS-006',
    enrolledCourses: ['NEET'],
    joinDate: '2025-09-18',
    performance: 90,
    rating: 4,
    batch: 'Dropper NEET',
    ratings: { attendance: 4, tests: 5, dppPerformance: 4, behavior: 4 }
  },
];

const MOCK_FACULTY: Teacher[] = [
  { id: 'f1', name: 'Arvind Sir', email: 'arvind@example.com', subject: 'Physics', phone: '+91 98765 11111' },
  { id: 'f2', name: 'Megha Maam', email: 'megha@example.com', subject: 'Chemistry', phone: '+91 98765 22222' },
  { id: 'f3', name: 'Rohit Sir', email: 'rohit@example.com', subject: 'Mathematics', phone: '+91 98765 33333' },
  { id: 'f4', name: 'Nidhi Maam', email: 'nidhi@example.com', subject: 'Biology', phone: '+91 98765 44444' },
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
  batches,
  onCreateBatch,
  onUpdateBatch,
  onLogout,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification
}: AdminDashboardProps) {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [faculty, setFaculty] = useState<Teacher[]>(MOCK_FACULTY);
  const [studentModal, setStudentModal] = useState<{
    open: boolean;
    initialData?: StudentFormState;
    defaultBatch: Batch | null;
    title: string;
  }>({
    open: false,
    defaultBatch: null,
    title: 'Add Student',
  });
  const [facultyModal, setFacultyModal] = useState<{
    open: boolean;
    initialData?: FacultyFormState;
    title: string;
  }>({
    open: false,
    title: 'Add Faculty',
  });
  const [batchModal, setBatchModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    batchLabel?: string;
  }>({
    open: false,
    mode: 'add',
  });
  const [ratingModal, setRatingModal] = useState<{ open: boolean; student?: Student }>({
    open: false,
  });
  const [showFullTimetable, setShowFullTimetable] = useState(false);
  const [timeTableImage, setTimeTableImage] = useState<string | null>(demotimetable);
  const timeTableInputRef = useRef<HTMLInputElement>(null);

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

  const openAddStudent = (batch: Batch | null = null) => {
    setStudentModal({ open: true, initialData: undefined, defaultBatch: batch, title: 'Add Student' });
  };
  const openEditStudent = (student: Student) => {
    setStudentModal({
      open: true,
      defaultBatch: student.batch,
      title: 'Edit Student',
      initialData: {
        id: student.id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        batch: student.batch,
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        parentContact: '',
      },
    });
  };
  const closeStudentModal = () => setStudentModal((prev) => ({ ...prev, open: false }));
  const handleSaveStudent = (data: StudentFormState) => {
    if (data.id) {
      setStudents((prev) =>
        prev.map((student) =>
          student.id === data.id
            ? {
                ...student,
                name: data.name,
                email: data.email,
                rollNumber: data.rollNumber,
                batch: data.batch,
              }
            : student
        )
      );
    } else {
      const newStudent: Student = {
        id: `student-${Date.now()}`,
        name: data.name,
        email: data.email,
        rollNumber: data.rollNumber,
        enrolledCourses: [],
        joinDate: new Date().toISOString().slice(0, 10),
        performance: 0,
        rating: 0,
        batch: data.batch,
      };
      setStudents((prev) => [newStudent, ...prev]);
    }
  };
  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((student) => student.id !== id));
  };
  const openStudentRatings = (student: Student) => setRatingModal({ open: true, student });
  const closeStudentRatings = () => setRatingModal({ open: false });

  const openAddFaculty = () => {
    setFacultyModal({ open: true, initialData: undefined, title: 'Add Faculty' });
  };
  const openEditFaculty = (teacher: Teacher) => {
    setFacultyModal({
      open: true,
      title: 'Edit Faculty',
      initialData: {
        id: teacher.id,
        subject: teacher.subject,
        name: teacher.name,
        phone: teacher.phone ?? '',
        email: teacher.email,
      },
    });
  };
  const closeFacultyModal = () => setFacultyModal((prev) => ({ ...prev, open: false }));
  const handleSaveFaculty = (data: FacultyFormState) => {
    if (data.id) {
      setFaculty((prev) =>
        prev.map((teacher) =>
          teacher.id === data.id
            ? {
                ...teacher,
                name: data.name,
                subject: data.subject,
                email: data.email,
                phone: data.phone,
              }
            : teacher
        )
      );
    } else {
      const newFaculty: Teacher = {
        id: `faculty-${Date.now()}`,
        name: data.name,
        email: data.email,
        subject: data.subject,
        phone: data.phone,
      };
      setFaculty((prev) => [newFaculty, ...prev]);
    }
  };
  const handleDeleteFaculty = (id: string) => {
    setFaculty((prev) => prev.filter((teacher) => teacher.id !== id));
  };

  const openAddBatch = () => setBatchModal({ open: true, mode: 'add' });
  const openEditBatch = (label: string) => setBatchModal({ open: true, mode: 'edit', batchLabel: label });
  const closeBatchModal = () => setBatchModal((prev) => ({ ...prev, open: false }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClearBatch}
              title="Go to admin home"
              className="flex items-center gap-2"
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
                  { id: 'batches', label: 'Batches', icon: BookOpen },
                  { id: 'students', label: 'Students', icon: Users },
                  { id: 'faculty', label: 'Faculty', icon: GraduationCap },
                  { id: 'test-series', label: 'Test Series', icon: FileText },
                ].map((section) => (
                  <motion.button
                    key={section.id}
                    onClick={() => onNavigateSection(section.id as AdminSection)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${
                      (adminSection === section.id || (section.id === 'test-series' && activeTab === 'test-series')) && activeTab !== 'profile'
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
          {!selectedBatch && activeTab !== 'profile' ? (
            <>
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
            </>
          ) : (
            <>
              {activeTab === 'home' && (
                <OverviewTab
                  selectedBatch={selectedBatch}
                  onEditBatch={openEditBatch}
                  students={students}
                />
              )}
              {activeTab === 'students' && selectedBatch && (
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
              {activeTab === 'faculty' && selectedBatch && (
                <BatchFacultyTab
                  selectedBatch={selectedBatch}
                  batches={batches}
                  faculty={faculty}
                  onUpdateBatch={onUpdateBatch}
                />
              )}
              {activeTab === 'ratings' && <StudentRating students={students.filter((student) => student.batch === selectedBatch)} />}
              {activeTab === 'rankings' && <StudentRankingsEnhanced />}
              {activeTab === 'content' && selectedBatch && (
                <NotesManagementTab 
                  onNavigate={onNavigate} 
                  selectedBatch={selectedBatch} 
                  onChangeBatch={onClearBatch} 
                  onViewTimetable={() => setShowFullTimetable(true)}
                />
              )}
              {activeTab === 'create-test' && <CreateTestSeries onBack={() => onNavigate('test-series')} />}
              {activeTab === 'create-dpp' && <CreateDPP onBack={() => onNavigate('analytics')} />}
              {activeTab === 'upload-notice' && (
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
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                      >
                        Post Notice
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {activeTab === 'profile' && <AdminProfile user={user} onLogout={onLogout} />}
            </>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />

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
      />

      <StudentRatingsModal
        open={ratingModal.open}
        student={ratingModal.student}
        onClose={closeStudentRatings}
      />

      {/* Timetable Modal - Placed at root level for proper overlay over navbar */}
      <AnimatePresence>
        {showFullTimetable && (
          <motion.div
            key="timetable-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
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
  );
}

function BatchSelectionTab({
  batches,
  onSelectBatch,
  onAddBatch,
}: {
  batches: BatchInfo[];
  onSelectBatch: (batch: Batch) => void;
  onAddBatch: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Batch</h2>
            <p className="text-gray-600">Choose a batch to open the admin dashboard in that context.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAddBatch}
            className="ml-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold shadow-md hover:shadow-lg transition whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            New Batch
          </motion.button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map((batch, index) => (
          <motion.button
            key={batch.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectBatch(batch.label)}
            className="bg-white/90 text-left rounded-2xl p-6 shadow-lg border border-white hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-cyan-700 font-semibold">Batch</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{batch.label}</h3>
                {batch.subjects && batch.subjects.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">Subjects: {batch.subjects.join(', ')}</p>
                )}
                {batch.facultyAssigned && batch.facultyAssigned.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">Faculty: {batch.facultyAssigned.join(', ')}</p>
                )}
              </div>
              <ChevronRight className="w-6 h-6 text-cyan-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function StudentsDirectoryTab({
  students,
  batches,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onViewStudent,
}: {
  students: Student[];
  batches: BatchInfo[];
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onViewStudent: (student: Student) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredStudents = students.filter((student) =>
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">All Students</h2>
            <p className="text-gray-600">Manage students across all batches</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddStudent}
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold leading-none whitespace-nowrap shadow-md hover:shadow-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Student
          </motion.button>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Batch</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rating</th>
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
                  onClick={() => onViewStudent(student)}
                  className="hover:bg-teal-50/60 transition cursor-pointer"
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                    {student.rollNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{student.batch}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderPerformanceStars(student.rating)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(event) => {
                          event.stopPropagation();
                          onEditStudent(student);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteStudent(student.id);
                        }}
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

function FacultyDirectoryTab({
  faculty,
  onAddFaculty,
  onEditFaculty,
  onDeleteFaculty,
}: {
  faculty: Teacher[];
  onAddFaculty: () => void;
  onEditFaculty: (teacher: Teacher) => void;
  onDeleteFaculty: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredFaculty = faculty.filter((teacher) =>
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">All Faculty</h2>
            <p className="text-gray-600">Manage faculty across all departments</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddFaculty}
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold leading-none whitespace-nowrap shadow-md hover:shadow-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Faculty
          </motion.button>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{teacher.phone || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEditFaculty(teacher)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDeleteFaculty(teacher.id)}
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

function OverviewTab({
  selectedBatch,
  onEditBatch,
  students,
}: {
  selectedBatch: Batch | null;
  onEditBatch: (label: string) => void;
  students: Student[];
}) {
  if (!selectedBatch) return null;

  const batchStudents = students.filter((student) => student.batch === selectedBatch);

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
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-700 font-semibold">Current Batch</p>
          <h2 className="text-xl font-bold text-gray-900">{selectedBatch}</h2>
        </div>
        <button
          onClick={() => onEditBatch(selectedBatch)}
          className="px-4 py-2 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition font-medium"
        >
          Edit Batch
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

    </div>
  );
}

function StudentsTab({
  students,
  selectedBatch,
  onChangeBatch,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onViewStudent,
}: {
  students: Student[];
  selectedBatch: Batch;
  onChangeBatch: () => void;
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onViewStudent: (student: Student) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter(student =>
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
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddStudent}
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
                  Roll No
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Rating
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
                  onClick={() => onViewStudent(student)}
                  className="hover:bg-teal-50/60 transition cursor-pointer"
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                    {student.rollNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderPerformanceStars(student.rating)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(event) => {
                          event.stopPropagation();
                          onEditStudent(student);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteStudent(student.id);
                        }}
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
  initialData?: StudentFormState;
  title?: string;
  onSubmit?: (data: StudentFormState) => void;
}) {
  const createInitialState = (batch: Batch | null, initial?: StudentFormState): StudentFormState => ({
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

  const handleChange = (field: keyof typeof formState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.(formState);
    onClose();
  };

  const requiredMark = <span className="text-red-500">*</span>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
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
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>
                Name {requiredMark}
              </span>
              <input
                type="text"
                required
                value={formState.name}
                onChange={handleChange('name')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="Student name"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>
                Email {requiredMark}
              </span>
              <input
                type="email"
                required
                value={formState.email}
                onChange={handleChange('email')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="name@email.com"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>
                Roll Number {requiredMark}
              </span>
              <input
                type="text"
                required
                value={formState.rollNumber}
                onChange={handleChange('rollNumber')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="UJAAS-###"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>
                Batch {requiredMark}
              </span>
              <select
                required
                value={formState.batch}
                onChange={handleChange('batch')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
              >
                <option value="" disabled>
                  Select batch
                </option>
                {batches.map((batch) => (
                  <option key={batch.slug} value={batch.label}>
                    {batch.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>
                Phone Number {requiredMark}
              </span>
              <input
                type="tel"
                required
                value={formState.phoneNumber}
                onChange={handleChange('phoneNumber')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="+91 9XXXX XXXXX"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>
                Date of Birth {requiredMark}
              </span>
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
            <span>
              Address {requiredMark}
            </span>
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
            <span>
              Parent Contact {requiredMark}
            </span>
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

function BatchFacultyTab({
  selectedBatch,
  batches,
  faculty,
  onUpdateBatch,
}: {
  selectedBatch: Batch;
  batches: BatchInfo[];
  faculty: Teacher[];
  onUpdateBatch: (label: string, subjects?: string[], facultyAssigned?: string[]) => { ok: boolean; error?: string };
}) {
  const batchInfo = batches.find((batch) => batch.label === selectedBatch);
  const assignedFaculty = batchInfo?.facultyAssigned ?? [];
  const assignedDetails = assignedFaculty
    .map((name) => faculty.find((item) => item.name === name) ?? { name, subject: '—', email: '', phone: '' })
    .filter(Boolean);
  const subjects = Array.from(new Set(faculty.map((item) => item.subject))).sort();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    subject: '',
    faculty: '',
    assignments: [] as { subject: string; faculty: string }[],
  });
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    const prefill = assignedDetails.map((faculty) => ({
      subject: faculty.subject || '—',
      faculty: faculty.name,
    }));
    setFormState({ subject: '', faculty: '', assignments: prefill });
    setError(null);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

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

  const handleSave = () => {
    const subjectsSet = Array.from(new Set(formState.assignments.map((item) => item.subject).filter((subject) => subject && subject !== '—')));
    const facultySet = Array.from(new Set(formState.assignments.map((item) => item.faculty)));
    const result = onUpdateBatch(selectedBatch, subjectsSet, facultySet);
    if (!result.ok) {
      setError(result.error ?? 'Unable to update batch.');
      return;
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Batch Faculty</h2>
            <p className="text-gray-600">Faculty assigned to {selectedBatch}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openModal}
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold leading-none whitespace-nowrap shadow-md hover:shadow-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Faculty
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white overflow-hidden"
      >
        {assignedDetails.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No faculty assigned yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Faculty</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {assignedDetails.map((faculty, index) => (
                  <motion.tr
                    key={`${faculty.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-teal-50/60 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {faculty.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{faculty.name}</div>
                          {faculty.email && <div className="text-sm text-gray-500">{faculty.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-700">{faculty.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{faculty.email || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{faculty.phone || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-white overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
              <h3 className="text-xl font-semibold">Assign Faculty</h3>
              <p className="text-sm text-white/80">Select subject and faculty, then add.</p>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-start">
                <label className="space-y-2 text-sm font-medium text-gray-700">
                  <span>Subject</span>
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
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-gray-700">
                  <span>Faculty</span>
                  <select
                    value={formState.faculty}
                    onChange={(event) => setFormState((prev) => ({ ...prev, faculty: event.target.value }))}
                    disabled={!formState.subject}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">{formState.subject ? 'Select faculty' : 'Select subject first'}</option>
                    {facultyOptions.map((faculty) => (
                      <option key={faculty.id} value={faculty.name}>
                        {faculty.name}
                      </option>
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

              {formState.assignments.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Assigned</p>
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

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 min-h-[44px] rounded-xl border border-gray-200 text-gray-700 font-medium leading-none whitespace-nowrap hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold leading-none whitespace-nowrap shadow-md hover:shadow-lg transition"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
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
  initialData?: FacultyFormState;
  title?: string;
  onSubmit?: (data: FacultyFormState) => void;
}) {
  const [formState, setFormState] = useState<FacultyFormState>({
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

  const handleChange = (field: keyof typeof formState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.(formState);
    onClose();
  };

  const requiredMark = <span className="text-red-500">*</span>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
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
            <span>
              Subject {requiredMark}
            </span>
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
            <span>
              Faculty Name {requiredMark}
            </span>
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
            <span>
              Phone Number {requiredMark}
            </span>
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
            <span>
              Email {requiredMark}
            </span>
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
}: {
  open: boolean;
  mode: 'add' | 'edit';
  batches: BatchInfo[];
  faculty: Teacher[];
  batchLabel?: string;
  onClose: () => void;
  onCreateBatch: (label: string, subjects?: string[], facultyAssigned?: string[]) => { ok: boolean; error?: string; label?: string };
  onUpdateBatch: (label: string, subjects?: string[], facultyAssigned?: string[]) => { ok: boolean; error?: string };
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
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
            <span>Batch Name *</span>
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
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Subject</span>
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
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Faculty</span>
                <select
                  value={formState.faculty}
                  onChange={(event) => setFormState((prev) => ({ ...prev, faculty: event.target.value }))}
                  disabled={!formState.subject}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">{formState.subject ? 'Select faculty' : 'Select subject first'}</option>
                  {facultyOptions.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
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
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
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

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
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

  const MOCK_DATA = {
    timeTable: { id: 'tt1', title: 'Batch Weekly Schedule', date: '2025-09-15', type: 'JPG', image: demotimetable },
    subjects: [
      { id: 's1', name: 'Physics', color: '#3b82f6' }, // blue-500
      { id: 's2', name: 'Chemistry', color: '#10b981' }, // emerald-500
      { id: 's3', name: 'Mathematics', color: '#f59e0b' }, // amber-500
      { id: 's4', name: 'Biology', color: '#f43f5e' }, // rose-500
    ],
    chapters: {
      'Physics': ['Kinematics', 'Laws of Motion', 'Work Energy Power'],
      'Chemistry': ['Atomic Structure', 'Chemical Bonding', 'States of Matter'],
      'Mathematics': ['Integration Basics', 'Differentiation', 'Calculus'],
      'Biology': ['Cell Division', 'Genetics', 'Evolution'],
    } as Record<string, string[]>,
    notes: [
      { id: 'n1', chapter: 'Kinematics', title: 'Kinematics Theory Notes', size: '2.4 MB', date: '2025-09-20' },
      { id: 'n2', chapter: 'Kinematics', title: '1D Motion Formula Sheet', size: '1.2 MB', date: '2025-09-21' },
    ],
    dpps: [
      { id: 'd1', chapter: 'Kinematics', title: 'Kinematics DPP 01 - Basics', questions: 15, date: '2025-09-22' },
      { id: 'd2', chapter: 'Kinematics', title: 'Kinematics DPP 02 - Projectile', questions: 20, date: '2025-09-23' },
    ]
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
    <div className="space-y-6">
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
                <span className={currentView === 'root' ? 'text-teal-600 font-semibold' : ''}>Root</span>
                {selectedSubject && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className={currentView === 'subject' ? 'text-teal-600 font-semibold' : ''}>{selectedSubject}</span>
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
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onViewTimetable}
                className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition border border-indigo-100 font-semibold shadow-sm"
              >
                <Calendar className="w-5 h-5" />
                Time Table
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

      {currentView === 'root' && (
        <>
                    {/* Subject Folders */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
                      {MOCK_DATA.subjects.map((sub, index) => (
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
                            <p className="text-xs text-gray-500 mt-1">{MOCK_DATA.chapters[sub.name]?.length || 0} Chapters</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}
          
                {currentView === 'subject' && selectedSubject && MOCK_DATA.chapters[selectedSubject] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MOCK_DATA.chapters[selectedSubject].map((chapter, index) => (
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
                          <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-cyan-600 transition-colors">
                            <Folder className="w-5 h-5 text-cyan-600 group-hover:text-white" />
                          </div>
                          <span className="font-bold text-gray-900">{chapter}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                      </motion.button>
                    ))}
                  </div>
                )}
          
                {currentView === 'chapter' && selectedChapter && (
                  <div className="space-y-6">
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
                        MOCK_DATA.notes
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
                                  <span className="text-xs text-gray-500">{note.size} • {note.date}</span>
                                  <div className="flex gap-1">
                                    <button className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"><Download className="w-4 h-4" /></button>
                                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        MOCK_DATA.dpps
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
                                  <span className="text-xs text-gray-500">{dpp.questions} Questions • {dpp.date}</span>
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

function DPPsManagementTab({
  onNavigate,
  selectedBatch,
  onChangeBatch,
}: {
  onNavigate: (tab: Tab) => void;
  selectedBatch: Batch | null;
  onChangeBatch: () => void;
}) {
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
            <p className="text-gray-600">
              {selectedBatch ? `Create and manage daily practice problems for ${selectedBatch}` : 'Create and manage daily practice problems across batches'}
            </p>
          </div>
          <div className="flex items-center gap-3">
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

function TestSeriesManagementTab({
  onNavigate,
  selectedBatch,
  onChangeBatch,
}: {
  onNavigate: (tab: Tab) => void;
  selectedBatch: Batch | null;
  onChangeBatch: () => void;
}) {
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
            <p className="text-gray-600">
              {selectedBatch ? `Create and manage test series for ${selectedBatch}` : 'Create and manage test series across batches'}
            </p>
          </div>
          <div className="flex items-center gap-3">
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

