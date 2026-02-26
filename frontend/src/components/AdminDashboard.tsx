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
  courses: string[];
};

type TeacherFormState = {
  id?: string;
  name: string;
  email: string;
  subject: string;
  phone: string;
};

type BatchFormState = {
  label: string;
  subjects: string[];
  faculty: string[];
};

function renderPerformanceStars(rating: number) {
  const fillPercentage = (rating / 5) * 100;
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
  onDeleteNotification,
  landingData,
  onUpdateLandingData,
  queries,
  onUpdateQueries
}: AdminDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; color: string }[]>([]);
  const [chapters, setChapters] = useState<{ id: string; name: string; subjectId: string; batch: string }[]>([]);
  const [notes, setNotes] = useState<{ id: string; title: string; chapterId: string; type: string; url: string; batch: string }[]>([]);
  const [dpps, setDpps] = useState<{ id: string; title: string; chapterId: string; questions: number; duration: number; batch: string }[]>([]);
  
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddFacultyModalOpen, setIsAddFacultyModalOpen] = useState(false);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [activeSubjectForChapter, setActiveSubjectForChapter] = useState<string | null>(null);
  const [showFullTimetable, setShowFullTimetable] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
    ]);

    setFaculty([
      { id: 't1', name: 'Dr. V.K. Sharma', email: 'vk.sharma@example.com', subject: 'Physics' },
      { id: 't2', name: 'Prof. S. Gupta', email: 's.gupta@example.com', subject: 'Chemistry' },
      { id: 't3', name: 'Dr. R.K. Yadav', email: 'rk.yadav@example.com', subject: 'Mathematics' },
    ]);

    setSubjects([
      { id: 's1', name: 'Physics', color: '#3b82f6' },
      { id: 's2', name: 'Chemistry', color: '#10b981' },
      { id: 's3', name: 'Mathematics', color: '#8b5cf6' },
    ]);

    setChapters([
      { id: 'c1', name: 'Kinematics', subjectId: 's1', batch: '12th JEE' },
      { id: 'c2', name: 'Atomic Structure', subjectId: 's2', batch: '12th JEE' },
      { id: 'c3', name: 'Calculus', subjectId: 's3', batch: '12th JEE' },
    ]);

    setNotes([
      { id: 'n1', title: 'Projectile Motion Notes', chapterId: 'c1', type: 'PDF', url: '#', batch: '12th JEE' },
      { id: 'n2', title: 'Bohr\'s Model Summary', chapterId: 'c2', type: 'PDF', url: '#', batch: '12th JEE' },
    ]);

    setDpps([
      { id: 'd1', title: 'Kinematics Practice Set 1', chapterId: 'c1', questions: 15, duration: 45, batch: '12th JEE' },
      { id: 'd2', title: 'Organic Basics DPP', chapterId: 'c2', questions: 10, duration: 30, batch: '12th JEE' },
    ]);
  }, []);

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
      setStudents(students.map(s => s.id === data.id ? { ...s, ...data, enrolledCourses: data.courses } : s));
    } else {
      const newStudent: Student = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        enrolledCourses: data.courses,
        joinDate: new Date().toISOString().split('T')[0],
        performance: 0,
        rating: 0,
      };
      setStudents([...students, newStudent]);
    }
    closeStudentModal();
  };

  const handleSaveFaculty = (data: TeacherFormState) => {
    if (data.id) {
      setFaculty(faculty.map(f => f.id === data.id ? { ...f, ...data } : f));
    } else {
      const newTeacher: Teacher = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
      };
      setFaculty([...faculty, newTeacher]);
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

  const openStudentRatings = (student: Student) => {
    // This would typically open a modal or navigate to a details page
    console.log('Viewing student ratings:', student.name);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-20">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-[9999] shadow-md transition-all">
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
                  subjects={subjects}
                  chapters={chapters}
                  notes={notes}
                  dpps={dpps}
                  onAddSubject={() => setIsAddSubjectModalOpen(true)}
                  onAddChapter={(subject) => {
                    setActiveSubjectForChapter(subject);
                    setIsAddChapterModalOpen(true);
                  }}
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
        />
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
          <button type="submit" className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5" />Add</button>
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
          <button onClick={() => { setIsAddingFaculty(!isAddingFaculty); setEditingFacultyIndex(null); }} className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-bold flex items-center gap-2">
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
            <button type="submit" className="md:col-span-2 py-3 bg-cyan-600 text-white rounded-xl font-bold">Save</button>
          </form>
        )}
        {editingFacultyIndex !== null && (
          <form onSubmit={handleSaveEditedFaculty} className="bg-cyan-50 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" required defaultValue={data.faculty[editingFacultyIndex].name} className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="subject" required defaultValue={data.faculty[editingFacultyIndex].subject} className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="designation" required defaultValue={data.faculty[editingFacultyIndex].designation} className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="experience" required defaultValue={data.faculty[editingFacultyIndex].experience} className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="imageFile" type="file" accept="image/*" className="md:col-span-2 px-4 py-2 rounded-lg border border-gray-200 bg-white" />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold">Update</button>
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
                <img src={m.image} className="w-16 h-16 rounded-full object-cover border-2 border-cyan-100" />
                <div><h3 className="font-bold text-gray-900">{m.name}</h3><p className="text-sm text-cyan-600">{m.subject}</p><p className="text-xs text-gray-500">{m.designation}</p></div>
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
          <button onClick={() => setIsAddingAchiever(!isAddingAchiever)} className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-bold flex items-center gap-2">
            {isAddingAchiever ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {isAddingAchiever ? 'Cancel' : 'Add Achiever'}
          </button>
        </div>
        {isAddingAchiever && (
          <form onSubmit={handleAddAchiever} className="bg-gray-50 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" required placeholder="Name" className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="achievement" required placeholder="Achievement" className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="year" required placeholder="Year" className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="imageFile" type="file" accept="image/*" required className="px-4 py-2 rounded-lg border border-gray-200 bg-white" />
            <button type="submit" className="md:col-span-2 py-3 bg-cyan-600 text-white rounded-xl font-bold">Save</button>
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
            <button type="submit" className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold">Save</button>
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
        <div><h2 className="text-3xl font-bold text-gray-900">LPM Management</h2><p className="text-gray-600">Customize the content of your public landing page</p></div>
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
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-cyan-50 transition-colors">
          <Plus className="w-7 h-7 text-gray-400 group-hover:text-cyan-600" />
        </div>
        <span className="text-lg font-bold text-gray-500 group-hover:text-cyan-600">Create New Batch</span>
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
          <thead><tr className="text-left border-b border-gray-100"><th className="pb-4 font-bold text-gray-700">Date</th><th className="pb-4 font-bold text-gray-700">Student</th><th className="pb-4 font-bold text-gray-700">Course</th><th className="pb-4 font-bold text-gray-700">Status</th><th className="pb-4 font-bold text-gray-700">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {queries.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 text-sm text-gray-500">{new Date(q.date).toLocaleDateString()}</td>
                <td className="py-4"><div className="font-bold text-gray-900">{q.name}</div><div className="text-xs text-gray-500">{q.phone}</div></td>
                <td className="py-4"><span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold uppercase">{q.course}</span></td>
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
      <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-gray-900">{selectedBatch} Overview</h2><button onClick={() => onEditBatch(selectedBatch)} className="px-6 py-3 bg-white text-cyan-600 rounded-xl font-bold border border-cyan-100 shadow-sm hover:shadow-md transition">Edit Batch Settings</button></div>
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
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${assigned.includes(t.name) ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-400'}`}><GraduationCap className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold text-gray-900">{t.name}</h3><p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider">{t.subject}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotesManagementTab({ onNavigate, selectedBatch, subjects, chapters, notes, dpps, onAddSubject, onAddChapter }: { onNavigate: (t: Tab) => void; selectedBatch: Batch; subjects: any[]; chapters: any[]; notes: any[]; dpps: any[]; onAddSubject: () => void; onAddChapter: (sId: string) => void; onViewTimetable: () => void; onChangeBatch: () => void }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-gray-900">Academic Content</h2><div className="flex gap-3"><button onClick={() => onNavigate('create-test')} className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><FileText className="w-5 h-5" />New Test</button><button onClick={() => onNavigate('create-dpp')} className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" />New DPP</button></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {subjects.map(s => (
            <div key={s.id} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-50">
              <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: s.color }}><Folder className="w-5 h-5" /></div><h3 className="text-xl font-bold text-gray-900">{s.name}</h3></div><button onClick={() => onAddChapter(s.id)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"><Plus className="w-5 h-5" /></button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapters.filter(c => c.subjectId === s.id && c.batch === selectedBatch).map(c => (
                  <div key={c.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-cyan-200 transition-colors group">
                    <h4 className="font-bold text-gray-800 mb-3">{c.name}</h4>
                    <div className="flex gap-2"><span className="text-xs bg-white px-2 py-1 rounded-lg border border-gray-100 font-bold text-gray-500 uppercase">{notes.filter(n => n.chapterId === c.id).length} Notes</span><span className="text-xs bg-white px-2 py-1 rounded-lg border border-gray-100 font-bold text-gray-500 uppercase">{dpps.filter(d => d.chapterId === c.id).length} DPPs</span></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={onAddSubject} className="w-full py-4 bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl text-gray-500 font-bold hover:bg-white hover:border-cyan-200 transition-all flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Add New Subject</button>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-50"><h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-500" /> Batch Timetable</h3><img src={demotimetable} className="w-full rounded-2xl border border-gray-100" /></div>
        </div>
      </div>
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
        <div className="flex gap-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." className="pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-cyan-500 w-64" /></div><button onClick={onAddStudent} className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add Student</button></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="text-left border-b border-gray-100"><th className="pb-4 font-bold text-gray-700">Student</th><th className="pb-4 font-bold text-gray-700">Batch</th><th className="pb-4 font-bold text-gray-700">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4"><div className="font-bold text-gray-900">{s.name}</div><div className="text-xs text-gray-500">{s.email}</div></td>
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
        <button onClick={onAddFaculty} className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add Teacher</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onEditFaculty(t)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button><button onClick={() => onDeleteFaculty(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div>
            <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center mb-4"><GraduationCap className="w-6 h-6 text-cyan-600" /></div>
            <h3 className="text-xl font-bold text-gray-900">{t.name}</h3><p className="text-sm font-semibold text-cyan-600 uppercase mb-4">{t.subject}</p><div className="text-xs text-gray-500">{t.email}</div>
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

// STUB MODALS (to keep file complete and functional)
function AddStudentModal({ open, onClose, defaultBatch, batches, initialData, title, onSubmit }: any) { if (!open) return null; return <div className="fixed inset-0 bg-black/50 z-[10001] flex items-center justify-center p-4"><div className="bg-white rounded-3xl p-8 max-w-md w-full"><h2 className="text-2xl font-bold mb-6">{title}</h2><form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); onSubmit({ id: initialData?.id, name: f.get('name'), email: f.get('email'), rollNumber: f.get('roll'), batch: f.get('batch'), courses: [f.get('batch')] }); }} className="space-y-4"><input name="name" defaultValue={initialData?.name} placeholder="Student Name" required className="w-full px-4 py-2 border rounded-xl" /><input name="email" type="email" defaultValue={initialData?.email} placeholder="Email" required className="w-full px-4 py-2 border rounded-xl" /><input name="roll" defaultValue={initialData?.rollNumber} placeholder="Roll Number" required className="w-full px-4 py-2 border rounded-xl" /><select name="batch" defaultValue={initialData?.batch || defaultBatch || ''} className="w-full px-4 py-2 border rounded-xl">{batches.map((b:any) => <option key={b.slug} value={b.label}>{b.label}</option>)}</select><div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl">Cancel</button><button type="submit" className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold">Save</button></div></form></div></div>; }
function AddFacultyModal({ open, onClose, initialData, title, onSubmit }: any) { if (!open) return null; return <div className="fixed inset-0 bg-black/50 z-[10001] flex items-center justify-center p-4"><div className="bg-white rounded-3xl p-8 max-w-md w-full"><h2 className="text-2xl font-bold mb-6">{title}</h2><form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); onSubmit({ id: initialData?.id, name: f.get('name'), email: f.get('email'), subject: f.get('subject'), phone: f.get('phone') }); }} className="space-y-4"><input name="name" defaultValue={initialData?.name} placeholder="Name" required className="w-full px-4 py-2 border rounded-xl" /><input name="email" type="email" defaultValue={initialData?.email} placeholder="Email" required className="w-full px-4 py-2 border rounded-xl" /><input name="subject" defaultValue={initialData?.subject} placeholder="Subject" required className="w-full px-4 py-2 border rounded-xl" /><input name="phone" defaultValue={initialData?.phone} placeholder="Phone (optional)" className="w-full px-4 py-2 border rounded-xl" /><div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl">Cancel</button><button type="submit" className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold">Save</button></div></form></div></div>; }
function BatchFormModal({ open, mode, onClose, onCreateBatch, onUpdateBatch, batchLabel, faculty }: any) { if (!open) return null; return <div className="fixed inset-0 bg-black/50 z-[10001] flex items-center justify-center p-4"><div className="bg-white rounded-3xl p-8 max-w-md w-full"><h2 className="text-2xl font-bold mb-6">{mode === 'create' ? 'Create New Batch' : 'Edit Batch'}</h2><form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); if (mode === 'create') onCreateBatch(f.get('label') as string, ['Physics'], []); else onUpdateBatch(batchLabel, { subjects: ['Physics'] }); onClose(); }} className="space-y-4"><input name="label" defaultValue={batchLabel} placeholder="Batch Name (e.g. 12th NEET)" required className="w-full px-4 py-2 border rounded-xl" /><div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl">Cancel</button><button type="submit" className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold">{mode === 'create' ? 'Create' : 'Save'}</button></div></form></div></div>; }
