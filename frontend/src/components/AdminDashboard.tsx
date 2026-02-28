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
  Clock,
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
  Bell,
  Eye,
  Mail,
  Phone
} from 'lucide-react';
import { StudentRating } from './StudentRating';
import { StudentRankingsEnhanced } from './StudentRankingsEnhanced';
import { AdminProfile } from './AdminProfile';
import { NotificationCenter, Notification } from './NotificationCenter';
import { Footer } from './Footer';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { CreateTestSeries } from './CreateTestSeries';
import { CreateDPP } from './CreateDPP';
import { UploadNotes } from './UploadNotes';
import { TestTaking } from './TestTaking';
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
  onUpdateBatch: (label: string, subjects?: string[], facultyAssigned?: string[], oldLabel?: string) => { ok: boolean; error?: string };
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
  publishedTests: import('../App').PublishedTest[];
  onPublishTest: (test: Omit<import('../App').PublishedTest, 'id' | 'status'>) => void;
  onPreviewTest: (testId: string) => void;
  onUpdatePublishedTest: (testId: string, updates: Partial<import('../App').PublishedTest>) => void;
  onDeletePublishedTest: (testId: string) => void;
  selectedPreviewTest: import('../App').PublishedTest | null;
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
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  parentContact: string;
  subjectRatings?: Record<string, {
    attendance: number;
    tests: number;
    dppPerformance: number;
    behavior: number;
  }>;
  subjectRemarks?: Record<string, string>;
  adminRemark?: string;
}

interface Faculty {
  id: string;
  name: string;
  email: string;
  subject: string;
  phone?: string;
  rating?: number;
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
  name: string;
  email: string;
  subject: string;
  phone: string;
};

const STUDENT_REMARKS_STORAGE_KEY = 'ujaas_student_remarks';

type StoredStudentRemarks = Record<
  string,
  {
    subjectRemarks?: Record<string, string>;
    adminRemark?: string;
  }
>;

const readStoredRemarks = (): StoredStudentRemarks => {
  try {
    const raw = localStorage.getItem(STUDENT_REMARKS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredStudentRemarks;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStoredRemarks = (
  studentId: string,
  updates: { subjectRemarks?: Record<string, string>; adminRemark?: string }
) => {
  const current = readStoredRemarks();
  const prevEntry = current[studentId] ?? {};
  current[studentId] = {
    ...prevEntry,
    ...updates,
    subjectRemarks: {
      ...(prevEntry.subjectRemarks ?? {}),
      ...(updates.subjectRemarks ?? {}),
    },
  };
  localStorage.setItem(STUDENT_REMARKS_STORAGE_KEY, JSON.stringify(current));
};

const withStoredRemarks = (list: Student[]): Student[] => {
  const stored = readStoredRemarks();
  return list.map((student) => {
    const entry = stored[student.id];
    if (!entry) return student;
    return {
      ...student,
      subjectRemarks: {
        ...(student.subjectRemarks ?? {}),
        ...(entry.subjectRemarks ?? {}),
      },
      adminRemark: entry.adminRemark ?? student.adminRemark,
    };
  });
};

function renderPerformanceStars(rating: number) {
  const normalizedRating = Math.max(0, Math.min(5, rating));

  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${normalizedRating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((starNumber) => {
        let fillPercentage = 0;
        if (normalizedRating >= starNumber) {
          fillPercentage = 100;
        } else if (normalizedRating > starNumber - 1) {
          fillPercentage = (normalizedRating - (starNumber - 1)) * 100;
        }

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
  onDeleteBatch,
  onLogout,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  landingData,
  onUpdateLandingData,
  queries,
  onUpdateQueries,
  publishedTests,
  onPublishTest,
  onPreviewTest,
  onUpdatePublishedTest,
  onDeletePublishedTest,
  selectedPreviewTest,
}: AdminDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [showFullTimetable, setShowFullTimetable] = useState(false);
  const [timeTableImage, setTimeTableImage] = useState<string | null>(demotimetable);
  const timeTableInputRef = useRef<HTMLInputElement>(null);

  const [studentModal, setStudentModal] = useState<{ open: boolean; defaultBatch: Batch | null; initialData?: Student; title: string }>({
    open: false,
    defaultBatch: null,
    title: 'Add Student'
  });

  const [facultyModal, setFacultyModal] = useState<{ open: boolean; initialData?: Faculty; title: string }>({
    open: false,
    title: 'Add Faculty'
  });

  const [batchModal, setBatchModal] = useState<{ open: boolean; mode: 'create' | 'edit'; batchLabel?: string }>({
    open: false,
    mode: 'create'
  });
  const [batchStudentPicker, setBatchStudentPicker] = useState<{ open: boolean; batch: Batch | null }>({
    open: false,
    batch: null
  });
  const [batchFacultyPicker, setBatchFacultyPicker] = useState<{ open: boolean; batch: Batch | null }>({
    open: false,
    batch: null
  });

  const [queryModal, setQueryModal] = useState<{ open: boolean; query: import('../App').LandingQuery | null }>({
    open: false,
    query: null
  });

  useEffect(() => {
    // Simulated data fetch
    const seededStudents: Student[] = [
      { 
        id: '1', 
        name: 'Rahul Sharma', 
        email: 'rahul@example.com', 
        rollNumber: '2024001', 
        enrolledCourses: ['JEE Main'], 
        joinDate: '2024-01-15', 
        performance: 85, 
        rating: 4.5, 
        batch: '12th JEE',
        phoneNumber: '+91 99999 11111',
        dateOfBirth: '2007-04-12',
        address: 'Sector 15, Vasundhara, Ghaziabad',
        parentContact: '+91 99999 22222',
        subjectRatings: {
          'Physics': { attendance: 4.8, tests: 4.5, dppPerformance: 4.6, behavior: 4.9 },
          'Chemistry': { attendance: 4.2, tests: 4.0, dppPerformance: 4.1, behavior: 4.5 },
          'Mathematics': { attendance: 4.9, tests: 4.8, dppPerformance: 4.7, behavior: 5.0 }
        },
        subjectRemarks: {
          'Physics': 'Good conceptual clarity. Keep revising numericals regularly.',
          'Chemistry': 'Theory is decent, focus more on reaction mechanism practice.',
          'Mathematics': 'Excellent consistency and speed in problem solving.'
        }
      },
      { 
        id: '2', 
        name: 'Priya Patel', 
        email: 'priya@example.com', 
        rollNumber: '2024002', 
        enrolledCourses: ['NEET'], 
        joinDate: '2024-01-20', 
        performance: 92, 
        rating: 4.8, 
        batch: '12th NEET',
        phoneNumber: '+91 88888 11111',
        dateOfBirth: '2007-06-18',
        address: 'MG Road, Pune, Maharashtra',
        parentContact: '+91 88888 22222',
        subjectRatings: {
          'Biology': { attendance: 5.0, tests: 4.9, dppPerformance: 4.9, behavior: 5.0 },
          'Physics': { attendance: 4.5, tests: 4.2, dppPerformance: 4.4, behavior: 4.6 },
          'Chemistry': { attendance: 4.8, tests: 4.7, dppPerformance: 4.7, behavior: 4.9 }
        },
        subjectRemarks: {
          'Biology': 'Strong retention and neat diagram presentation.',
          'Physics': 'Needs more confidence in multi-step numericals.',
          'Chemistry': 'Very disciplined and improving test performance.'
        }
      },
      { 
        id: '3', 
        name: 'Amit Kumar', 
        email: 'amit@example.com', 
        rollNumber: '2024003', 
        enrolledCourses: ['JEE Advanced'], 
        joinDate: '2024-02-05', 
        performance: 78, 
        rating: 4.2, 
        batch: 'Dropper JEE',
        phoneNumber: '+91 77777 11111',
        dateOfBirth: '2006-09-22',
        address: 'Indira Nagar, Bengaluru, Karnataka',
        parentContact: '+91 77777 22222',
        subjectRatings: {
          'Physics': { attendance: 4.0, tests: 3.8, dppPerformance: 3.9, behavior: 4.2 },
          'Mathematics': { attendance: 4.5, tests: 4.3, dppPerformance: 4.4, behavior: 4.5 }
        },
        subjectRemarks: {
          'Physics': 'Basics are clear, but revise formulas before tests.',
          'Mathematics': 'Good progress. Keep practicing advanced level questions.'
        }
      },
      { 
        id: '4', 
        name: 'Sneha Mehta', 
        email: 'sneha.m@example.com', 
        rollNumber: '2024004', 
        enrolledCourses: ['JEE Main', 'NEET'], 
        joinDate: '2024-02-12', 
        performance: 88, 
        rating: 4.6, 
        batch: '11th JEE', 
        phoneNumber: '+91 98989 11111', 
        dateOfBirth: '2008-01-05', 
        address: 'Satellite Road, Ahmedabad, Gujarat', 
        parentContact: '+91 98989 22222',
        subjectRatings: {
          'Physics': { attendance: 4.5, tests: 4.6, dppPerformance: 4.4, behavior: 4.8 },
          'Mathematics': { attendance: 4.7, tests: 4.5, dppPerformance: 4.6, behavior: 4.7 }
        },
        subjectRemarks: {
          'Physics': 'Very attentive in class and asks relevant doubts.',
          'Mathematics': 'Accurate approach. Work slightly on time management.'
        }
      },
      { 
        id: '5', 
        name: 'Karan Desai', 
        email: 'karan.d@example.com', 
        rollNumber: '2024005', 
        enrolledCourses: ['NEET'], 
        joinDate: '2024-03-03', 
        performance: 79, 
        rating: 4.1, 
        batch: '11th NEET', 
        phoneNumber: '+91 97979 11111', 
        dateOfBirth: '2008-03-15', 
        address: 'Banjara Hills, Hyderabad, Telangana', 
        parentContact: '+91 97979 22222',
        subjectRatings: {
          'Biology': { attendance: 4.0, tests: 3.9, dppPerformance: 4.1, behavior: 4.3 },
          'Chemistry': { attendance: 4.2, tests: 4.0, dppPerformance: 4.0, behavior: 4.2 }
        },
        subjectRemarks: {
          'Biology': 'Regular in class; needs deeper NCERT revision.',
          'Chemistry': 'Maintain short notes and increase daily question count.'
        }
      },
      { 
        id: '6', 
        name: 'Ananya Kapoor', 
        email: 'ananya.k@example.com', 
        rollNumber: '2024006', 
        enrolledCourses: ['JEE Advanced', 'NEET'], 
        joinDate: '2024-03-10', 
        performance: 91, 
        rating: 4.9, 
        batch: '12th JEE', 
        phoneNumber: '+91 96969 11111', 
        dateOfBirth: '2007-11-30', 
        address: 'Civil Lines, Delhi', 
        parentContact: '+91 96969 22222',
        subjectRatings: {
          'Physics': { attendance: 5.0, tests: 4.9, dppPerformance: 4.8, behavior: 5.0 },
          'Mathematics': { attendance: 4.9, tests: 5.0, dppPerformance: 4.9, behavior: 4.9 },
          'Chemistry': { attendance: 4.8, tests: 4.8, dppPerformance: 4.9, behavior: 4.8 }
        },
        subjectRemarks: {
          'Physics': 'Outstanding class participation and analytical skills.',
          'Mathematics': 'Excellent accuracy. Continue with mixed mock practice.',
          'Chemistry': 'Consistent performer with very good discipline.'
        }
      },
    ];
    setStudents(withStoredRemarks(seededStudents));

    setFaculty([
      { id: 't1', name: 'Dr. V.K. Sharma', email: 'vk.sharma@example.com', subject: 'Physics', rating: 4.8 },
      { id: 't2', name: 'Prof. S. Gupta', email: 's.gupta@example.com', subject: 'Chemistry', rating: 4.5 },
      { id: 't3', name: 'Dr. R.K. Yadav', email: 'rk.yadav@example.com', subject: 'Mathematics', rating: 4.9 },
      { id: 't4', name: 'Ms. Tanya Bose', email: 'tanya.bose@example.com', subject: 'Biology', rating: 4.2 },
      { id: 't5', name: 'Mr. Arjun Malhotra', email: 'arjun.m@example.com', subject: 'Mathematics', rating: 4.6 },
      { id: 't6', name: 'Dr. Leena Rao', email: 'leena.rao@example.com', subject: 'Chemistry', rating: 4.7 },
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

  const openAddFaculty = () => setFacultyModal({ open: true, title: 'Add Faculty' });
  const openEditFaculty = (faculty: Faculty) => setFacultyModal({ open: true, initialData: faculty, title: 'Edit Faculty' });
  const closeFacultyModal = () => setFacultyModal({ ...facultyModal, open: false });

  const openAddBatch = () => setBatchModal({ open: true, mode: 'create' });
  const openEditBatch = (label: string) => setBatchModal({ open: true, mode: 'edit', batchLabel: label });
  const closeBatchModal = () => setBatchModal({ ...batchModal, open: false });

  const openQueryDetails = (query: import('../App').LandingQuery) => setQueryModal({ open: true, query });
  const closeQueryDetails = () => setQueryModal({ open: false, query: null });

  const handleDeleteQuery = (id: string) => {
    if (confirm('Are you sure you want to delete this query?')) {
      onUpdateQueries(queries.filter(q => q.id !== id));
      if (queryModal.query?.id === id) closeQueryDetails();
    }
  };

  const handleQueryStatusChange = (id: string, status: 'new' | 'contacted' | 'completed') => {
    onUpdateQueries(queries.map(q => q.id === id ? { ...q, status } : q));
    if (queryModal.query?.id === id) {
      setQueryModal(prev => ({ ...prev, query: prev.query ? { ...prev.query, status } : null }));
    }
  };

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

  const handleSaveFaculty = (data: FacultyFormState) => {
    if (data.id) {
      setFaculty(prev => prev.map(f => f.id === data.id ? { ...f, ...data } : f));
    } else {
      const newFaculty: Faculty = {
        ...data,
        id: `faculty-${Date.now()}`,
      };
      setFaculty(prev => [...prev, newFaculty]);
    }
    closeFacultyModal();
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const handleRemoveStudentFromBatch = (id: string, batch: Batch) => {
    if (window.confirm('Remove this student from the current batch?')) {
      setStudents((prev) =>
        prev.map((student) =>
          student.id === id && student.batch === batch
            ? {
                ...student,
                batch: 'Unassigned',
                enrolledCourses: student.enrolledCourses.filter((course) => course !== batch),
              }
            : student
        )
      );
    }
  };

  const handleDeleteFaculty = (id: string) => {
    if (window.confirm('Are you sure you want to delete this faculty?')) {
      setFaculty(faculty.filter(f => f.id !== id));
    }
  };

  const openBatchStudentPicker = (batch: Batch) => setBatchStudentPicker({ open: true, batch });
  const closeBatchStudentPicker = () => setBatchStudentPicker({ open: false, batch: null });
  const handleAssignExistingStudentToBatch = (studentId: string, batch: Batch) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? {
              ...student,
              batch,
            }
          : student
      )
    );
  };
  const openBatchFacultyPicker = (batch: Batch) => setBatchFacultyPicker({ open: true, batch });
  const closeBatchFacultyPicker = () => setBatchFacultyPicker({ open: false, batch: null });
  const handleAssignExistingFacultyToBatch = (facultyName: string, batch: Batch) => {
    const currentBatch = batches.find((item) => item.label === batch);
    if (!currentBatch) return;
    const nextAssigned = Array.from(new Set([...(currentBatch.facultyAssigned ?? []), facultyName]));
    onUpdateBatch(batch, currentBatch.subjects ?? [], nextAssigned);
  };

  const [ratingModal, setRatingModal] = useState<{ open: boolean; student?: Student }>({
    open: false,
  });

  const openStudentRatings = (student: Student) => setRatingModal({ open: true, student });
  const closeStudentRatings = () => setRatingModal({ open: false });
  const handleSaveStudentProfile = (
    studentId: string,
    updates: Pick<Student, 'name' | 'email' | 'phoneNumber' | 'dateOfBirth' | 'parentContact' | 'address'>
  ) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, ...updates } : s)));
    setRatingModal((prev) => (prev.student?.id === studentId ? { ...prev, student: { ...prev.student, ...updates } } : prev));
  };
  const handleSaveAdminRemark = (studentId: string, remark: string) => {
    const cleanedRemark = remark.trim();
    setStudents((prev) =>
      prev.map((student) => (student.id === studentId ? { ...student, adminRemark: cleanedRemark } : student))
    );
    setRatingModal((prev) =>
      prev.student?.id === studentId
        ? { ...prev, student: { ...prev.student, adminRemark: cleanedRemark } }
        : prev
    );
    writeStoredRemarks(studentId, { adminRemark: cleanedRemark });
  };

  useBodyScrollLock(
    studentModal.open ||
      facultyModal.open ||
      batchModal.open ||
      batchStudentPicker.open ||
      batchFacultyPicker.open ||
      ratingModal.open ||
      showFullTimetable
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-20">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-layer-navbar shadow-md transition-all">
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
            <CreateTestSeries onBack={() => onNavigate('test-series')} batches={batches} onPublish={onPublishTest} />
          ) : activeTab === 'preview-test' && selectedPreviewTest ? (
            <div className="fixed inset-0 bg-white overflow-y-auto z-layer-10002">
              <TestTaking 
                testId={selectedPreviewTest.id}
                testTitle={selectedPreviewTest.title}
                duration={selectedPreviewTest.duration}
                questions={selectedPreviewTest.questions}
                onSubmit={() => onNavigate('test-series')}
                onExit={() => onNavigate('test-series')}
                onSave={(testId, updatedQuestions, updatedTitle, updatedBatches) => {
                  onUpdatePublishedTest(testId, {
                    questions: updatedQuestions,
                    title: updatedTitle,
                    batches: updatedBatches
                  });
                }}
                isPreview={true}
                availableBatches={batches}
                initialBatches={selectedPreviewTest.batches}
              />
            </div>
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
                <TestSeriesManagementTab 
                  onNavigate={onNavigate} 
                  selectedBatch={null as unknown as Batch} 
                  onChangeBatch={() => {}} 
                  publishedTests={publishedTests}
                  onPreviewTest={onPreviewTest}
                  onDeletePublishedTest={onDeletePublishedTest}
                />
              )}
              {adminSection === 'queries' && (
                <QueriesManagementTab 
                  queries={queries} 
                  onViewQuery={openQueryDetails}
                  onDeleteQuery={handleDeleteQuery}
                  onStatusChange={handleQueryStatusChange}
                />
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
                  faculty={faculty}
                  batches={batches}
                  onNavigate={onNavigate}
                  onClearBatch={onClearBatch}
                  onViewTimetable={() => setShowFullTimetable(true)}
                  onUpdateBatch={onUpdateBatch}
                  onOpenAddFaculty={() => openBatchFacultyPicker(selectedBatch)}
                />
              )}
              {activeTab === 'students' && (
                <StudentsTab
                  students={students}
                  selectedBatch={selectedBatch}
                  onChangeBatch={onClearBatch}
                  onAddStudent={() => openBatchStudentPicker(selectedBatch)}
                  onEditStudent={openEditStudent}
                  onDeleteStudent={(id) => handleRemoveStudentFromBatch(id, selectedBatch)}
                  onViewStudent={openStudentRatings}
                />
              )}
              {activeTab === 'ratings' && <StudentRating students={students.filter((student) => student.batch === selectedBatch)} />}
              {activeTab === 'rankings' && <StudentRankingsEnhanced />}
              {activeTab === 'upload-notice' && (
                <NoticeUploadForm onNavigate={onNavigate} />
              )}
            </>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      {activeTab !== 'preview-test' && <Footer />}

      {/* Modals */}
      <div className="relative isolate">
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
        <BatchStudentPickerModal
          open={batchStudentPicker.open}
          selectedBatch={batchStudentPicker.batch}
          students={students}
          onClose={closeBatchStudentPicker}
          onAssign={handleAssignExistingStudentToBatch}
        />
        <BatchFacultyPickerModal
          open={batchFacultyPicker.open}
          selectedBatch={batchFacultyPicker.batch}
          batches={batches}
          faculty={faculty}
          onClose={closeBatchFacultyPicker}
          onAssign={handleAssignExistingFacultyToBatch}
        />

        <AnimatePresence>
          {ratingModal.open && (
            <StudentRatingsModal
              open={ratingModal.open}
              student={ratingModal.student}
              onClose={closeStudentRatings}
              onSaveProfile={handleSaveStudentProfile}
              onSaveAdminRemark={handleSaveAdminRemark}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {queryModal.open && queryModal.query && (
            <div className="fixed inset-0 z-layer-10001 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={closeQueryDetails}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-xl font-bold">Query Details</h3>
                    <p className="text-teal-50 text-sm opacity-90">{new Date(queryModal.query.date).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={closeQueryDetails} 
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</p>
                      <p className="text-gray-900 font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-600" /> {queryModal.query.name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interested Course</p>
                      <p className="text-gray-900 font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" /> {queryModal.query.course}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                      <p className="text-gray-900 font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-600" /> {queryModal.query.email}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</p>
                      <p className="text-gray-900 font-semibold flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-600" /> {queryModal.query.phone}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message</p>
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 italic text-gray-700 leading-relaxed">
                      {queryModal.query.message || 'No message provided.'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Update Status</p>
                      <div className="flex gap-2">
                        {(['new', 'contacted', 'completed'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleQueryStatusChange(queryModal.query!.id, s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                              queryModal.query!.status === s
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteQuery(queryModal.query!.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Query
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Timetable Modal */}
        <AnimatePresence>
          {showFullTimetable && (
            <motion.div
              key="timetable-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md z-layer-10001"
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
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
          >
            Post Notice
          </button>
        </div>
      </form>
    </div>
  );
}

function LandingManagementTab({ data, onUpdate }: { data: LandingData; onUpdate: (data: LandingData) => void }) {
  const [activeSubSection, setActiveSubSection] = useState<'overview' | 'courses' | 'faculty' | 'achievers'>('overview');
  const [newCourse, setNewCourse] = useState('');
  const [isAddingFaculty, setIsAddingFaculty] = useState(false);
  const [editingFacultyIndex, setEditingFacultyIndex] = useState<number | null>(null);
  const [isAddingAchiever, setIsAddingAchiever] = useState(false);
  const maxImageUploadSizeBytes = 600 * 1024;

  const readImageAsDataUrl = (file: File, onReady: (url: string) => void, fallbackUrl: string) => {
    if (file && file.size > 0) {
      if (file.size > maxImageUploadSizeBytes) {
        window.alert('Image is too large. Please upload an image smaller than 600 KB.');
        return;
      }
      const r = new FileReader();
      r.onloadend = () => onReady(r.result as string);
      r.readAsDataURL(file);
      return;
    }
    onReady(fallbackUrl);
  };

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
    readImageAsDataUrl(file, save, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop');
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
    readImageAsDataUrl(file, save, existing);
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
    readImageAsDataUrl(file, save, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop');
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
              <button 
                onClick={() => {
                  if (confirm(`Are you sure you want to remove the course "${c}"?`)) {
                    handleRemoveCourse(i);
                  }
                }} 
                className="p-2 text-red-500 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
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
                <button 
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove ${m.name} from faculty?`)) {
                      onUpdate({ ...data, faculty: data.faculty.filter((_, idx) => idx !== i) });
                    }
                  }} 
                  className="p-2 bg-red-50 text-red-500 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
            <input name="year" placeholder="Year (optional)" className="px-4 py-2 rounded-lg border border-gray-200" />
            <input name="imageFile" type="file" accept="image/*" required className="px-4 py-2 rounded-lg border border-gray-200 bg-white" />
            <button type="submit" className="md:col-span-2 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition">Save</button>
          </form>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.achievers.map((a, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 relative group">
              <button 
                onClick={() => {
                  if (confirm(`Are you sure you want to remove achiever "${a.name}"?`)) {
                    onUpdate({ ...data, achievers: data.achievers.filter((_, idx) => idx !== i) });
                  }
                }} 
                className="absolute top-2 right-2 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <img src={a.image} className="w-16 h-16 rounded-xl object-cover border-2 border-cyan-100" />
                <div>
                  <h3 className="font-bold text-gray-900">{a.name}</h3>
                  <p className="text-sm text-cyan-600">{a.achievement}</p>
                  {a.year?.trim() ? <p className="text-xs text-gray-500">Year: {a.year}</p> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
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

function QueriesManagementTab({ 
  queries, 
  onViewQuery, 
  onDeleteQuery, 
  onStatusChange 
}: { 
  queries: import('../App').LandingQuery[]; 
  onViewQuery: (q: import('../App').LandingQuery) => void;
  onDeleteQuery: (id: string) => void;
  onStatusChange: (id: string, status: 'new' | 'contacted' | 'completed') => void;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg"><MessageSquare className="w-6 h-6 text-white" /></div>
        <div><h2 className="text-3xl font-bold text-gray-900">Interest Queries</h2><p className="text-gray-600">Manage interest registered through the landing page</p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-4 px-4 font-bold text-gray-700">Date</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Student</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Course</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Message</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Status</th>
              <th className="pb-4 px-4 font-bold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {queries.map((q) => (
              <tr 
                key={q.id} 
                onClick={() => onViewQuery(q)}
                className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
              >
                <td className="py-4 px-4 text-sm text-gray-500 whitespace-nowrap">{new Date(q.date).toLocaleDateString()}</td>
                <td className="py-4 px-4">
                  <div className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors whitespace-nowrap">{q.name}</div>
                  <div className="text-xs text-gray-500">{q.phone}</div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold uppercase whitespace-nowrap">
                    {q.course}
                  </span>
                </td>
                <td className="py-4 px-4 max-w-xs">
                  <p className="text-sm text-gray-700 break-words line-clamp-2" title={q.message}>
                    {q.message || '—'}
                  </p>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-md ${
                    q.status === 'new' ? 'bg-orange-100 text-orange-700' : 
                    q.status === 'contacted' ? 'bg-blue-100 text-blue-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {q.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onViewQuery(q); }} 
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteQuery(q.id); }} 
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete Query"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverviewTab({ 
  selectedBatch, 
  onEditBatch, 
  students,
  faculty,
  batches,
  onNavigate,
  onClearBatch,
  onViewTimetable,
  onUpdateBatch,
  onOpenAddFaculty
}: { 
  selectedBatch: Batch | null; 
  onEditBatch: (l: string) => void; 
  students: Student[];
  faculty: Faculty[];
  batches: BatchInfo[];
  onNavigate: (tab: Tab) => void;
  onClearBatch: () => void;
  onViewTimetable: () => void;
  onUpdateBatch: any;
  onOpenAddFaculty: () => void;
}) {
  if (!selectedBatch) return null;
  const batchStudents = students.filter(s => s.batch === selectedBatch);
  
  // Faculty logic
  const currentBatch = batches.find(b => b.label === selectedBatch);
  const assigned = currentBatch?.facultyAssigned ?? [];
  const assignedFaculty = faculty.filter((item) => assigned.includes(item.name));
  
  const handleRemoveFacultyFromBatch = (facultyName: string) => {
    if (!currentBatch) return;
    if (!window.confirm(`Remove ${facultyName} from ${selectedBatch}?`)) return;
    const nextAssigned = assigned.filter((name) => name !== facultyName);
    onUpdateBatch(selectedBatch, currentBatch.subjects ?? [], nextAssigned);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 rounded-3xl shadow-xl text-white mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{selectedBatch} Dashboard</h2>
          <p className="text-teal-50/90 font-medium">Batch Management & Academic Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onEditBatch(selectedBatch)} 
            className="px-8 py-3 bg-white/20 backdrop-blur-md text-white rounded-xl font-bold border border-white/30 shadow-lg hover:bg-white/30 transition-all text-sm"
          >
            Batch Settings
          </button>
        </div>
      </div>

      {/* Batch Faculty Section */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Batch Faculty</h3>
          </div>
          <button 
            onClick={onOpenAddFaculty}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition"
          >
            Assign Faculty
          </button>
        </div>
        
        {assignedFaculty.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedFaculty.map(t => (
              <div key={t.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-teal-600 font-bold border border-gray-50 shrink-0 text-lg">
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-base truncate">{t.name}</h4>
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">{t.subject}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveFacultyFromBatch(t.name)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Remove from batch"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm font-medium">No faculty assigned to this batch.</p>
          </div>
        )}
      </div>

      {/* Batch Content Section */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-1 border border-white/20">
        <div className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Academic Content</h3>
        </div>
        <div className="p-1">
          <NotesManagementTab
            onNavigate={onNavigate}
            selectedBatch={selectedBatch}
            onChangeBatch={onClearBatch}
            onViewTimetable={onViewTimetable}
          />
        </div>
      </div>
    </div>
  );
}

function StudentsTab({ students, selectedBatch, onChangeBatch: _onChangeBatch, onAddStudent, onEditStudent, onDeleteStudent, onViewStudent }: { students: Student[]; selectedBatch: Batch; onChangeBatch: () => void; onAddStudent: () => void; onEditStudent: (s: Student) => void; onDeleteStudent: (id: string) => void; onViewStudent: (s: Student) => void }) {
  const batchStudents = students.filter(s => s.batch === selectedBatch);
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Batch Students</h2>
          <p className="text-gray-500">{selectedBatch} • {batchStudents.length} Students</p>
        </div>
        <div className="flex gap-3"><button onClick={onAddStudent} className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add Student</button></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-4 px-4 font-bold text-gray-700">Student</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Roll No</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Performance</th>
              <th className="pb-4 px-4 font-bold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.filter(s => s.batch === selectedBatch).map((s) => (
              <tr key={s.id} onClick={() => onViewStudent(s)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <td className="py-4 px-4">
                  <div className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.email}</div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600 font-mono">{s.rollNumber}</td>
                <td className="py-4 px-4 whitespace-nowrap">{renderPerformanceStars(s.rating)}</td>
                <td className="py-4 px-4 flex gap-1 justify-end">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditStudent(s); }} 
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteStudent(s.id); }} 
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BatchFacultyTab({ selectedBatch, faculty, batches, onUpdateBatch, onOpenAddFaculty }: { selectedBatch: Batch; faculty: Faculty[]; batches: BatchInfo[]; onUpdateBatch: any; onOpenAddFaculty: () => void }) {
  const currentBatch = batches.find(b => b.label === selectedBatch);
  const assigned = currentBatch?.facultyAssigned ?? [];
  const assignedFaculty = faculty.filter((item) => assigned.includes(item.name));
  const handleRemoveFacultyFromBatch = (facultyName: string) => {
    if (!currentBatch) return;
    if (!window.confirm(`Remove ${facultyName} from ${selectedBatch}?`)) return;
    const nextAssigned = assigned.filter((name) => name !== facultyName);
    onUpdateBatch(selectedBatch, currentBatch.subjects ?? [], nextAssigned);
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Manage Batch Faculty</h2>
        <button
          type="button"
          onClick={onOpenAddFaculty}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Faculty
        </button>
      </div>
      {assignedFaculty.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-8 text-center text-gray-600">
          No faculty assigned to this batch yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedFaculty.map((t) => (
            <div key={t.id} className="p-6 rounded-3xl border-2 transition-all text-left border-cyan-500 bg-cyan-50 shadow-md">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-teal-600 text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t.name}</h3>
              <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider">{t.subject}</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => handleRemoveFacultyFromBatch(t.name)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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

  useBodyScrollLock(isAddSubjectModalOpen || isAddChapterModalOpen);

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

  const handleDeleteSubject = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the subject "${name}"? This will also remove its chapters.`)) {
      setSubjects(subjects.filter(s => s.id !== id));
      const nextChapters = { ...chapters };
      delete nextChapters[name];
      setChapters(nextChapters);
    }
  };

  const handleDeleteChapter = (chapterName: string) => {
    if (!selectedSubject) return;
    if (confirm(`Are you sure you want to delete the chapter "${chapterName}"?`)) {
      setChapters({
        ...chapters,
        [selectedSubject]: chapters[selectedSubject].filter(c => c !== chapterName)
      });
      // Also cleanup notes and dpps for this chapter
      setNotes(notes.filter(n => n.chapter !== chapterName));
      setDpps(dpps.filter(d => d.chapter !== chapterName));
    }
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const handleDeleteDPP = (id: string) => {
    if (confirm('Are you sure you want to delete this DPP?')) {
      setDpps(dpps.filter(d => d.id !== id));
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
          <div className="fixed inset-0 flex items-center justify-center p-4 z-layer-1000">
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
              className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
                <h3 className="text-xl font-bold">Add New Subject</h3>
                <p className="text-teal-50 text-sm">Create a new subject folder</p>
              </div>
              <form onSubmit={handleAddSubject} className="p-6 space-y-4 overflow-y-auto">
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
          <div className="fixed inset-0 flex items-center justify-center p-4 z-layer-1000">
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
              className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
                <h3 className="text-xl font-bold">Add New Chapter</h3>
                <p className="text-teal-50 text-sm">Add to {selectedSubject}</p>
              </div>
              <form onSubmit={handleAddChapter} className="p-6 space-y-4 overflow-y-auto">
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
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigateToSubject(sub.name)}
                          className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white flex flex-col items-center gap-4 group relative cursor-pointer"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubject(sub.id, sub.name);
                            }}
                            style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20 }}
                            className="p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                        </motion.div>
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChapter(chapter);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                        </div>
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
                                    <button 
                                      onClick={() => handleDeleteNote(note.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
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
                                    <button 
                                      onClick={() => handleDeleteDPP(dpp.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
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
        <div className="flex gap-3"><div className="relative"><input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="   Search students..." className="pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-teal-500 w-64" /></div><button onClick={onAddStudent} className="px-6 py- bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 hover:shadow-xl transition"><Plus className="w-5 h-5" />Add Student</button></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-4 px-4 font-bold text-gray-700">Student</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Performance</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Batch</th>
              <th className="pb-4 px-4 font-bold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => (
              <tr key={s.id} onClick={() => onViewStudent(s)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <td className="py-4 px-4">
                  <div className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.email}</div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">{renderPerformanceStars(s.rating)}</td>
                <td className="py-4 px-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap">
                    {s.batch}
                  </span>
                </td>
                <td className="py-4 px-4 flex gap-1 justify-end">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditStudent(s); }} 
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteStudent(s.id); }} 
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FacultyDirectoryTab({ faculty, onAddFaculty, onEditFaculty, onDeleteFaculty }: { faculty: Faculty[]; onAddFaculty: () => void; onEditFaculty: (t: Faculty) => void; onDeleteFaculty: (id: string) => void }) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex justify-between items-center mb-8">
        <div><h2 className="text-3xl font-bold text-gray-900">Faculty Directory</h2><p className="text-gray-500">Manage all faculties and subject experts</p></div>
        <button onClick={onAddFaculty} className="px-6 py-3  bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add Faculty</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group">
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onEditFaculty(t)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button><button onClick={() => onDeleteFaculty(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div>
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center mb-4"><GraduationCap className="w-6 h-6 text-teal-600" /></div>
            <h3 className="text-xl font-bold text-gray-900">{t.name}</h3>
            <p className="text-sm font-semibold text-teal-600 uppercase mb-2">{t.subject}</p>
            {t.rating && (
              <div className="mb-4">
                {renderPerformanceStars(t.rating)}
              </div>
            )}
            <div className="text-xs text-gray-500">{t.email}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestSeriesManagementTab({ 
  onNavigate, 
  selectedBatch, 
  publishedTests, 
  onPreviewTest,
  onDeletePublishedTest
}: { 
  onNavigate: (t: Tab) => void; 
  selectedBatch: Batch | null; 
  onChangeBatch: () => void;
  publishedTests: import('../App').PublishedTest[];
  onPreviewTest: (testId: string) => void;
  onDeletePublishedTest: (testId: string) => void;
}) {
  const handleDelete = (testId: string, testTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the test series "${testTitle}"? This action cannot be undone.`)) {
      onDeletePublishedTest(testId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-gray-900">Test Series Management</h2><p className="text-gray-600">{selectedBatch ? `For ${selectedBatch}` : 'Across all batches'}</p></div>
        <button onClick={() => onNavigate('create-test')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-500 text-white rounded-xl font-bold shadow-md"><Plus className="w-5 h-5" />Create Test Series</button>
      </div>

      {publishedTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedTests.map((test) => (
            <div key={test.id} className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white flex flex-col group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><FileText className="w-6 h-6" /></div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    test.format === 'JEE MAIN' ? 'bg-orange-100 text-orange-700' : 
                    test.format === 'NEET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>{test.format}</span>
                  <button 
                    onClick={() => handleDelete(test.id, test.title)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Test Series"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{test.title}</h3>
              <div className="space-y-2 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="w-4 h-4" />{new Date(test.scheduleDate).toLocaleDateString()} at {test.scheduleTime}</div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4" />{test.duration} Minutes</div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><Users className="w-4 h-4" />{test.batches.join(', ')}</div>
              </div>
              <button 
                onClick={() => onPreviewTest(test.id)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> Preview Test
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-lg border border-white text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="w-10 h-10 text-blue-600" /></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Create New Test</h3>
          <p className="text-gray-600 mb-6">Standard patterns for JEE Main, NEET and custom tests</p>
          <button onClick={() => onNavigate('create-test')} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition">Get Started</button>
        </div>
      )}
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
    <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-layer-10001">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-white overflow-hidden flex flex-col"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
          <h3 className="text-xl font-semibold">{title ?? 'Add Student'}</h3>
          <p className="text-sm text-white/80">Fields marked with * are mandatory.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
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
  initialData?: Faculty;
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

  const handleChange = (field: keyof FacultyFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.(formState);
    onClose();
  };

  const requiredMark = <span className="text-red-500">*</span>;

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-layer-10001">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-white overflow-hidden flex flex-col"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
          <h3 className="text-xl font-semibold">{title ?? 'Add Faculty'}</h3>
          <p className="text-sm text-white/80">Fields marked with * are mandatory.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
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

function BatchStudentPickerModal({
  open,
  selectedBatch,
  students,
  onClose,
  onAssign,
}: {
  open: boolean;
  selectedBatch: Batch | null;
  students: Student[];
  onClose: () => void;
  onAssign: (studentId: string, batch: Batch) => void;
}) {
  if (!open || !selectedBatch) return null;

  const availableStudents = students.filter((student) => student.batch !== selectedBatch);

  const handleAssign = (student: Student) => {
    if (
      student.batch &&
      student.batch !== 'Unassigned' &&
      student.batch !== selectedBatch &&
      !window.confirm(`Move ${student.name} from ${student.batch} to ${selectedBatch}?`)
    ) {
      return;
    }
    onAssign(student.id, selectedBatch);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-layer-10001">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[90vh] h-[70vh] bg-white rounded-2xl shadow-2xl border border-white overflow-hidden flex flex-col"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
          <h3 className="text-xl font-semibold">Add Existing Student</h3>
          <p className="text-sm text-white/80">Select a student to assign to {selectedBatch}.</p>
        </div>
        <div className="p-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3">
          {availableStudents.length === 0 ? (
            <p className="text-sm text-gray-500">No students available to add.</p>
          ) : (
            availableStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                <div>
                  <p className="font-semibold text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Current batch: {student.batch || 'Unassigned'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAssign(student)}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition"
                >
                  Add
                </button>
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
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

function BatchFacultyPickerModal({
  open,
  selectedBatch,
  batches,
  faculty,
  onClose,
  onAssign,
}: {
  open: boolean;
  selectedBatch: Batch | null;
  batches: BatchInfo[];
  faculty: Faculty[];
  onClose: () => void;
  onAssign: (facultyName: string, batch: Batch) => void;
}) {
  if (!open || !selectedBatch) return null;

  const currentBatch = batches.find((item) => item.label === selectedBatch);
  const assigned = currentBatch?.facultyAssigned ?? [];
  const availableFaculty = faculty.filter((item) => !assigned.includes(item.name));

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-layer-10001">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-white overflow-hidden flex flex-col"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
          <h3 className="text-xl font-semibold">Add Existing Faculty</h3>
          <p className="text-sm text-white/80">Select faculty to assign to {selectedBatch}.</p>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-3">
          {availableFaculty.length === 0 ? (
            <p className="text-sm text-gray-500">All available faculty are already assigned to this batch.</p>
          ) : (
            availableFaculty.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.subject}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onAssign(item.name, selectedBatch)}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition"
                >
                  Add
                </button>
              </div>
            ))
          )}
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
  faculty: Faculty[];
  batchLabel?: string;
  onClose: () => void;
  onCreateBatch: (label: string, subjects?: string[], facultyAssigned?: string[]) => { ok: boolean; error?: string; label?: string };
  onUpdateBatch: (label: string, subjects?: string[], facultyAssigned?: string[], oldLabel?: string) => { ok: boolean; error?: string };
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
        ? onUpdateBatch(formState.name.trim(), selectedSubjects, selectedFaculty, batchLabel)
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
    <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-layer-10001">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-white overflow-hidden flex flex-col"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
          <h3 className="text-xl font-semibold">{mode === 'edit' ? 'Edit Batch' : 'Create New Batch'}</h3>
          <p className="text-sm text-white/80">Add batch details and faculty assignment.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Batch Name *</span>
            <input
              type="text"
              required
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
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
  onSaveProfile,
  onSaveAdminRemark,
}: {
  open: boolean;
  student?: Student;
  onClose: () => void;
  onSaveProfile?: (
    studentId: string,
    updates: Pick<Student, 'name' | 'email' | 'phoneNumber' | 'dateOfBirth' | 'parentContact' | 'address'>
  ) => void;
  onSaveAdminRemark?: (studentId: string, remark: string) => void;
}) {
  const [showRatings, setShowRatings] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAdminRemark, setIsEditingAdminRemark] = useState(false);
  const [adminRemarkDraft, setAdminRemarkDraft] = useState('');
  const [profileDraft, setProfileDraft] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    parentContact: '',
    address: '',
  });

  useEffect(() => {
    if (!open || !student) return;
    setShowRatings(false);
    setIsEditingProfile(false);
    setIsEditingAdminRemark(false);
    setProfileDraft({
      name: student.name ?? '',
      email: student.email ?? '',
      phoneNumber: student.phoneNumber ?? '',
      dateOfBirth: student.dateOfBirth ?? '',
      parentContact: student.parentContact ?? '',
      address: student.address ?? '',
    });
    setAdminRemarkDraft(student.adminRemark ?? '');
  }, [open, student]);

  if (!open || !student) return null;

  const calculateSubjectRating = (r: { attendance: number; tests: number; dppPerformance: number; behavior: number }) => {
    return (r.attendance + r.tests + r.dppPerformance + r.behavior) / 4;
  };

  const calculateFinalRating = () => {
    if (!student.subjectRatings || Object.keys(student.subjectRatings).length === 0) return 0;
    const subjects = Object.values(student.subjectRatings);
    const total = subjects.reduce((acc, curr) => acc + calculateSubjectRating(curr), 0);
    return total / subjects.length;
  };

  const finalRating = calculateFinalRating();
  const getProfileValuesForPrint = () => ({
    name: isEditingProfile ? profileDraft.name : student.name,
    email: isEditingProfile ? profileDraft.email : student.email,
    phoneNumber: isEditingProfile ? profileDraft.phoneNumber : student.phoneNumber,
    dateOfBirth: isEditingProfile ? profileDraft.dateOfBirth : student.dateOfBirth,
    parentContact: isEditingProfile ? profileDraft.parentContact : student.parentContact,
    address: isEditingProfile ? profileDraft.address : student.address,
  });

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const handlePrintStudentDetails = () => {
    const profileValues = getProfileValuesForPrint();

    const detailsRows = [
      ['Student Name', profileValues.name || 'Not provided'],
      ['Email Address', profileValues.email || 'Not provided'],
      ['Phone Number', profileValues.phoneNumber || 'Not provided'],
      ['Date of Birth', profileValues.dateOfBirth || 'Not provided'],
      ["Parent's Contact", profileValues.parentContact || 'Not provided'],
      ['Residential Address', profileValues.address || 'Not provided'],
      ['Batch', student.batch || 'Not provided'],
      ['Roll Number', student.rollNumber || 'Not provided'],
      ['Final Average Rating', `${finalRating.toFixed(1)} / 5.0`],
    ]
      .map(
        ([label, value]) =>
          `<tr><td class="label">${escapeHtml(label)}</td><td class="value">${escapeHtml(value)}</td></tr>`
      )
      .join('');

    const subjectRatingsHtml =
      student.subjectRatings && Object.keys(student.subjectRatings).length > 0
        ? `<div class="subjects-grid">${Object.entries(student.subjectRatings)
            .map(([subject, r]) => {
              const subjectAverage = calculateSubjectRating(r);
              const subjectRemark = (student.subjectRemarks?.[subject] || '').trim();
              return `
                <section class="subject-card">
                  <h3>${escapeHtml(subject)}</h3>
                  <p class="subject-avg">Subject Average: ${subjectAverage.toFixed(1)} / 5.0</p>
                  <table>
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Attendance</td><td>${r.attendance.toFixed(1)} / 5.0</td></tr>
                      <tr><td>Test Performance</td><td>${r.tests.toFixed(1)} / 5.0</td></tr>
                      <tr><td>DPP Performance</td><td>${r.dppPerformance.toFixed(1)} / 5.0</td></tr>
                      <tr><td>Class Behaviour</td><td>${r.behavior.toFixed(1)} / 5.0</td></tr>
                    </tbody>
                  </table>
                  <div class="faculty-remark"><strong>Faculty Remark:</strong> ${escapeHtml(
                    subjectRemark || 'No remark provided.'
                  )}</div>
                </section>
              `;
            })
            .join('')}</div>`
        : '<p class="empty">No rating data available for this student.</p>';

    const adminRemarkHtml = `
      <section class="admin-remark">
        <h2>Admin Overall Remark</h2>
        <p>${escapeHtml((student.adminRemark || '').trim() || 'No admin remark provided.')}</p>
      </section>
    `;

    const printableHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Student Details - ${escapeHtml(profileValues.name || student.name)}</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: A4 portrait; margin: 8mm; }
            body {
              margin: 0;
              padding: 10px;
              font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
              color: #0f172a;
              background: #ffffff;
              font-size: 11px;
              line-height: 1.25;
            }
            .page {
              max-width: 780px;
              margin: 0 auto;
              position: relative;
              min-height: 1000px;
              padding-bottom: 90px;
            }
            .header {
              border-bottom: 2px solid #0d9488;
              padding-bottom: 6px;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .brand-logo {
              width: 38px;
              height: 38px;
              object-fit: contain;
              flex-shrink: 0;
            }
            .brand-title {
              margin: 0;
              font-size: 15px;
              line-height: 1.2;
              color: #0f172a;
              font-weight: 700;
            }
            .brand-location {
              margin: 1px 0 0;
              color: #334155;
              font-size: 10px;
              font-weight: 600;
            }
            .header-report {
              text-align: right;
            }
            h1 {
              margin: 0 0 2px;
              font-size: 18px;
            }
            .subtext {
              margin: 0;
              color: #334155;
              font-size: 10px;
            }
            h2 {
              margin: 10px 0 6px;
              font-size: 14px;
              color: #0f766e;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 4px;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 5px 7px;
              text-align: left;
              vertical-align: top;
              font-size: 10px;
            }
            th {
              background: #f1f5f9;
              font-weight: 700;
            }
            .label {
              width: 35%;
              font-weight: 700;
              background: #f8fafc;
            }
            .value {
              width: 65%;
            }
            .subject-card {
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 8px;
              margin-bottom: 6px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .subject-card h3 {
              margin: 0;
              font-size: 12px;
            }
            .subject-avg {
              margin: 2px 0 4px;
              color: #334155;
              font-size: 10px;
              font-weight: 600;
            }
            .subjects-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 6px;
            }
            .faculty-remark {
              margin-top: 4px;
              font-size: 10px;
              color: #1f2937;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 5px 6px;
              line-height: 1.35;
            }
            .admin-remark {
              margin-top: 8px;
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 8px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .admin-remark h2 {
              margin: 0 0 4px;
            }
            .admin-remark p {
              margin: 0;
              font-size: 10px;
              line-height: 1.4;
              color: #1f2937;
              white-space: pre-wrap;
            }
            .empty {
              padding: 8px;
              border: 1px dashed #cbd5e1;
              border-radius: 8px;
              color: #475569;
              font-size: 10px;
            }
            .signatory {
              position: absolute;
              right: 0;
              bottom: 8px;
              text-align: center;
              width: 180px;
            }
            .sign-line {
              border-top: 1px solid #334155;
              margin-bottom: 4px;
            }
            .sign-title {
              margin: 0;
              font-size: 10px;
              font-weight: 700;
              color: #0f172a;
              letter-spacing: 0.02em;
            }
            @media print {
              body { padding: 0; }
              .page { max-width: 100%; }
              .subjects-grid { gap: 4px; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="brand">
                <img src="${logo}" alt="UJAAS Logo" class="brand-logo" />
                <div>
                  <p class="brand-title">UJAAS Career Institue</p>
                  <p class="brand-location">Navsari</p>
                </div>
              </div>
              <div class="header-report">
                <h1>Student Details Report</h1>
                <p class="subtext">Generated on: ${escapeHtml(new Date().toLocaleString())}</p>
              </div>
            </div>

            <h2>Student Profile</h2>
            <table>
              <tbody>${detailsRows}</tbody>
            </table>

            <h2>Detailed Ratings</h2>
            ${subjectRatingsHtml}
            ${adminRemarkHtml}

            <div class="signatory">
              <div class="sign-line"></div>
              <p class="sign-title">Authorized Signatory</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!frameDoc || !printFrame.contentWindow) {
      document.body.removeChild(printFrame);
      window.alert('Unable to open print preview. Please try again.');
      return;
    }

    frameDoc.open();
    frameDoc.write(printableHtml);
    frameDoc.close();

    printFrame.onload = () => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      const cleanup = () => {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 200);
      };
      printFrame.contentWindow?.addEventListener('afterprint', cleanup, { once: true });
      setTimeout(cleanup, 2000);
    };
  };
  const saveProfile = () => {
    if (!student) return;
    onSaveProfile?.(student.id, profileDraft);
    setIsEditingProfile(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-layer-10001">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-white overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-bold">{student.name}</h3>
            <p className="text-teal-50 text-sm opacity-90">{student.batch} • {student.rollNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintStudentDetails}
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25 transition"
            >
              <FileText className="w-4 h-4" />
              Print Details
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {!showRatings ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition"
                  >
                    Edit Details
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileDraft({
                          name: student.name ?? '',
                          email: student.email ?? '',
                          phoneNumber: student.phoneNumber ?? '',
                          dateOfBirth: student.dateOfBirth ?? '',
                          parentContact: student.parentContact ?? '',
                          address: student.address ?? '',
                        });
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveProfile}
                      className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition"
                    >
                      Save Details
                    </button>
                  </div>
                )}
              </div>
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</p>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileDraft.name}
                      onChange={(e) => setProfileDraft((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-indigo-600" /> {student.name}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                  {isEditingProfile ? (
                    <input
                      type="email"
                      value={profileDraft.email}
                      onChange={(e) => setProfileDraft((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-600" /> {student.email}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</p>
                  {isEditingProfile ? (
                    <input
                      type="tel"
                      value={profileDraft.phoneNumber}
                      onChange={(e) => setProfileDraft((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> {student.phoneNumber || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date of Birth</p>
                  {isEditingProfile ? (
                    <input
                      type="date"
                      value={profileDraft.dateOfBirth}
                      onChange={(e) => setProfileDraft((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-600" /> {student.dateOfBirth || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Parent's Contact</p>
                  {isEditingProfile ? (
                    <input
                      type="tel"
                      value={profileDraft.parentContact}
                      onChange={(e) => setProfileDraft((prev) => ({ ...prev, parentContact: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-orange-600" /> {student.parentContact || 'Not provided'}</p>
                  )}
                </div>
                <div className="md:col-span-2 space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Residential Address</p>
                  {isEditingProfile ? (
                    <textarea
                      rows={3}
                      value={profileDraft.address}
                      onChange={(e) => setProfileDraft((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-emerald-600" /> {student.address || 'Not provided'}</p>
                  )}
                </div>
              </div>

              {/* Summary Rating */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Overall Performance</h4>
                  <p className="text-sm text-gray-500">Based on all academic factors</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    {renderPerformanceStars(finalRating)}
                  </div>
                  <p className="text-2xl font-black text-gray-900">{finalRating.toFixed(1)}<span className="text-sm text-gray-400 font-bold">/5.0</span></p>
                </div>
              </div>

              <button
                onClick={() => setShowRatings(true)}
                className="w-full py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5 fill-current" /> View Detailed Ratings
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setShowRatings(false)} className="text-teal-600 font-bold flex items-center gap-1 hover:underline">
                  <ChevronLeft className="w-4 h-4" /> Back to Profile
                </button>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Final Average</p>
                  <p className="text-xl font-black text-gray-900">{finalRating.toFixed(1)}/5.0</p>
                </div>
              </div>

              {student.subjectRatings && Object.keys(student.subjectRatings).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(student.subjectRatings).map(([subject, r]) => {
                    const subAvg = calculateSubjectRating(r);
                    return (
                      <div key={subject} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                          <h5 className="font-bold text-gray-900">{subject}</h5>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 px-2 py-1 bg-white rounded-lg border border-gray-100">Avg: {subAvg.toFixed(1)}</span>
                            {renderPerformanceStars(subAvg)}
                          </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { label: 'Attendance', val: r.attendance },
                            { label: 'Test Performance', val: r.tests },
                            { label: 'DPP Performance', val: r.dppPerformance },
                            { label: 'Class Behaviour', val: r.behavior }
                          ].map(param => (
                            <div key={param.label} className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-tighter">
                                <span>{param.label}</span>
                                <span>{param.val}/5</span>
                              </div>
                              {renderPerformanceStars(param.val)}
                            </div>
                          ))}
                        </div>
                        <div className="px-6 pb-6">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Faculty Remark</p>
                          <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3 whitespace-pre-wrap">
                            {(student.subjectRemarks?.[subject] || '').trim() || 'No remark added yet.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No rating data available for this student.</p>
                </div>
              )}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Admin Overall Remark</p>
                {!isEditingAdminRemark ? (
                  <>
                    <p className="text-sm text-gray-700 bg-white border border-blue-100 rounded-xl p-3 whitespace-pre-wrap">
                      {(student.adminRemark || '').trim() || 'No admin remark added yet.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminRemarkDraft(student.adminRemark ?? '');
                        setIsEditingAdminRemark(true);
                      }}
                      className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                    >
                      Edit Admin Remark
                    </button>
                  </>
                ) : (
                  <>
                    <textarea
                      rows={4}
                      value={adminRemarkDraft}
                      onChange={(e) => setAdminRemarkDraft(e.target.value)}
                      placeholder="Enter final overall remark for this student"
                      className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminRemarkDraft(student.adminRemark ?? '');
                          setIsEditingAdminRemark(false);
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Save admin overall remark for this student?')) {
                            onSaveAdminRemark?.(student.id, adminRemarkDraft);
                            setIsEditingAdminRemark(false);
                          }
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                      >
                        Save Admin Remark
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition shadow-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

