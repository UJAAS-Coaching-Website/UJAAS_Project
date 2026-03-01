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
  Clock,
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
import { FacultyProfile } from './FacultyProfile';
import { NotificationCenter, Notification } from './NotificationCenter';
import { Footer } from './Footer';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { CreateTestSeries } from './CreateTestSeries';
import { TestPerformanceInsights, StudentPerformance } from './TestPerformanceInsights';
import { CreateDPP } from './CreateDPP';
import { UploadNotes } from './UploadNotes';
import { TestTaking } from './TestTaking';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.svg';
import demotimetable from '../assets/demotimetable.jpg';

interface FacultyDashboardProps {
  user: User;
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  adminSection: FacultySection;
  onNavigateSection: (section: FacultySection) => void;
  selectedBatch: Batch | null;
  onSelectBatch: (batch: Batch) => void;
  onClearBatch: () => void;
  batches: BatchInfo[];
  onUpdateBatch: (label: string, subjects?: string[], facultyAssigned?: string[], oldLabel?: string) => { ok: boolean; error?: string };
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  publishedTests: import('../App').PublishedTest[];
  onPreviewTest: (testId: string) => void;
  onUpdatePublishedTest: (testId: string, updates: Partial<import('../App').PublishedTest>) => void;
  selectedPreviewTest: import('../App').PublishedTest | null;
}

type Tab = 'home' | 'students' | 'faculty' | 'content' | 'analytics' | 'test-series' | 'ratings' | 'rankings' | 'create-test' | 'create-dpp' | 'upload-notes' | 'profile';
type Batch = string;
type FacultySection = 'landing' | 'batches' | 'students' | 'faculty' | 'test-series';
type BatchInfo = { label: string; slug: string; subjects?: string[]; facultyAssigned?: string[] };

interface Student {
  id: string;
  name: string;
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
}

type StudentFormState = {
  id?: string;
  name: string;
  rollNumber: string;
  batch: Batch;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  parentContact: string;
};

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

const MOCK_STUDENTS: Student[] = [
  // 11th JEE
  { 
    id: '1', name: 'Rahul Kumar', rollNumber: 'UJAAS-11J-001', 
    enrolledCourses: ['JEE Advanced'], joinDate: '2025-09-01', performance: 87, rating: 4.2, batch: '11th JEE',
    phoneNumber: '+91 98765 43210', dateOfBirth: '2008-05-15', address: 'Mumbai', parentContact: '+91 98765 00000',
    subjectRatings: { 'Physics': { attendance: 4.5, tests: 4.0, dppPerformance: 4.2, behavior: 4.8 } }
  },
  { 
    id: '10', name: 'Aditya Singh', rollNumber: 'UJAAS-11J-002', 
    enrolledCourses: ['JEE Mains'], joinDate: '2025-09-02', performance: 75, rating: 3.8, batch: '11th JEE',
    phoneNumber: '+91 98765 43220', dateOfBirth: '2008-06-10', address: 'Pune', parentContact: '+91 98765 00010',
    subjectRatings: { 'Mathematics': { attendance: 4.0, tests: 3.5, dppPerformance: 3.8, behavior: 4.0 } }
  },
  { 
    id: '11', name: 'Ishaan Verma', rollNumber: 'UJAAS-11J-003', 
    enrolledCourses: ['JEE Advanced'], joinDate: '2025-09-03', performance: 92, rating: 4.7, batch: '11th JEE',
    phoneNumber: '+91 98765 43221', dateOfBirth: '2008-07-20', address: 'Nagpur', parentContact: '+91 98765 00011',
    subjectRatings: { 'Chemistry': { attendance: 4.8, tests: 4.6, dppPerformance: 4.7, behavior: 4.9 } }
  },

  // 11th NEET
  { 
    id: '2', name: 'Priya Sharma', rollNumber: 'UJAAS-11N-001', 
    enrolledCourses: ['NEET'], joinDate: '2025-09-05', performance: 92, rating: 4.5, batch: '11th NEET',
    phoneNumber: '+91 98765 43211', dateOfBirth: '2008-08-20', address: 'Delhi', parentContact: '+91 98765 11111',
    subjectRatings: { 'Biology': { attendance: 5.0, tests: 4.8, dppPerformance: 4.7, behavior: 4.9 } }
  },
  { 
    id: '12', name: 'Anjali Gupta', rollNumber: 'UJAAS-11N-002', 
    enrolledCourses: ['NEET'], joinDate: '2025-09-06', performance: 80, rating: 4.0, batch: '11th NEET',
    phoneNumber: '+91 98765 43222', dateOfBirth: '2008-09-15', address: 'Gurgaon', parentContact: '+91 98765 11112',
    subjectRatings: { 'Physics': { attendance: 4.0, tests: 3.8, dppPerformance: 4.0, behavior: 4.2 } }
  },
  { 
    id: '13', name: 'Riya Patel', rollNumber: 'UJAAS-11N-003', 
    enrolledCourses: ['NEET'], joinDate: '2025-09-07', performance: 85, rating: 4.2, batch: '11th NEET',
    phoneNumber: '+91 98765 43223', dateOfBirth: '2008-10-05', address: 'Noida', parentContact: '+91 98765 11113',
    subjectRatings: { 'Chemistry': { attendance: 4.2, tests: 4.0, dppPerformance: 4.3, behavior: 4.5 } }
  },

  // 12th JEE
  { 
    id: '3', name: 'Amit Patel', rollNumber: 'UJAAS-12J-001', 
    enrolledCourses: ['JEE Advanced'], joinDate: '2025-09-10', performance: 78, rating: 3.8, batch: '12th JEE',
    phoneNumber: '+91 98765 43212', dateOfBirth: '2007-12-10', address: 'Surat', parentContact: '+91 98765 22222',
    subjectRatings: { 'Physics': { attendance: 3.5, tests: 3.2, dppPerformance: 3.0, behavior: 4.0 } }
  },
  { 
    id: '14', name: 'Karan Mehra', rollNumber: 'UJAAS-12J-002', 
    enrolledCourses: ['JEE Mains'], joinDate: '2025-09-11', performance: 82, rating: 4.1, batch: '12th JEE',
    phoneNumber: '+91 98765 43224', dateOfBirth: '2007-11-12', address: 'Ahmedabad', parentContact: '+91 98765 22223',
    subjectRatings: { 'Mathematics': { attendance: 4.2, tests: 4.0, dppPerformance: 4.1, behavior: 4.3 } }
  },
  { 
    id: '15', name: 'Siddharth Jain', rollNumber: 'UJAAS-12J-003', 
    enrolledCourses: ['JEE Advanced'], joinDate: '2025-09-12', performance: 88, rating: 4.4, batch: '12th JEE',
    phoneNumber: '+91 98765 43225', dateOfBirth: '2007-10-25', address: 'Rajkot', parentContact: '+91 98765 22224',
    subjectRatings: { 'Chemistry': { attendance: 4.5, tests: 4.3, dppPerformance: 4.4, behavior: 4.6 } }
  },

  // 12th NEET
  { 
    id: '4', name: 'Sneha Reddy', rollNumber: 'UJAAS-12N-001', 
    enrolledCourses: ['NEET'], joinDate: '2025-09-12', performance: 85, rating: 4.0, batch: '12th NEET',
    phoneNumber: '+91 98765 43213', dateOfBirth: '2007-06-25', address: 'Hyderabad', parentContact: '+91 98765 33333',
    subjectRatings: { 'Biology': { attendance: 4.2, tests: 4.0, dppPerformance: 3.8, behavior: 4.5 } }
  },
  { 
    id: '16', name: 'Megha Rao', rollNumber: 'UJAAS-12N-002', 
    enrolledCourses: ['NEET'], joinDate: '2025-09-13', performance: 90, rating: 4.6, batch: '12th NEET',
    phoneNumber: '+91 98765 43226', dateOfBirth: '2007-05-10', address: 'Bangalore', parentContact: '+91 98765 33334',
    subjectRatings: { 'Chemistry': { attendance: 4.7, tests: 4.5, dppPerformance: 4.6, behavior: 4.8 } }
  },
  { 
    id: '17', name: 'Arjun Das', rollNumber: 'UJAAS-12N-003', 
    enrolledCourses: ['NEET'], joinDate: '2025-09-14', performance: 72, rating: 3.5, batch: '12th NEET',
    phoneNumber: '+91 98765 43227', dateOfBirth: '2007-04-15', address: 'Chennai', parentContact: '+91 98765 33335',
    subjectRatings: { 'Physics': { attendance: 3.5, tests: 3.0, dppPerformance: 3.2, behavior: 4.0 } }
  },

  // Dropper JEE
  { 
    id: '5', name: 'Vikram Singh', rollNumber: 'UJAAS-DRJ-001', 
    enrolledCourses: ['JEE Mains'], joinDate: '2025-10-01', performance: 80, rating: 3.9, batch: 'Dropper JEE',
    phoneNumber: '+91 98765 43214', dateOfBirth: '2006-11-05', address: 'Jaipur', parentContact: '+91 98765 44444',
    subjectRatings: { 'Mathematics': { attendance: 4.0, tests: 3.8, dppPerformance: 3.5, behavior: 4.2 } }
  },
  { 
    id: '18', name: 'Rohit Balan', rollNumber: 'UJAAS-DRJ-002', 
    enrolledCourses: ['JEE Advanced'], joinDate: '2025-10-02', performance: 85, rating: 4.2, batch: 'Dropper JEE',
    phoneNumber: '+91 98765 43228', dateOfBirth: '2006-10-10', address: 'Jodhpur', parentContact: '+91 98765 44445',
    subjectRatings: { 'Physics': { attendance: 4.3, tests: 4.1, dppPerformance: 4.0, behavior: 4.5 } }
  },
  { 
    id: '19', name: 'Sanjay Dutt', rollNumber: 'UJAAS-DRJ-003', 
    enrolledCourses: ['JEE Mains'], joinDate: '2025-10-03', performance: 70, rating: 3.4, batch: 'Dropper JEE',
    phoneNumber: '+91 98765 43229', dateOfBirth: '2006-09-15', address: 'Udaipur', parentContact: '+91 98765 44446',
    subjectRatings: { 'Chemistry': { attendance: 3.5, tests: 3.2, dppPerformance: 3.4, behavior: 3.8 } }
  },

  // Dropper NEET
  { 
    id: '6', name: 'Ananya Gupta', rollNumber: 'UJAAS-DRN-001', 
    enrolledCourses: ['NEET'], joinDate: '2025-10-05', performance: 88, rating: 4.3, batch: 'Dropper NEET',
    phoneNumber: '+91 98765 43215', dateOfBirth: '2006-03-12', address: 'Lucknow', parentContact: '+91 98765 55555',
    subjectRatings: { 'Chemistry': { attendance: 4.5, tests: 4.2, dppPerformance: 4.0, behavior: 4.8 } }
  },
  { 
    id: '20', name: 'Zoya Khan', rollNumber: 'UJAAS-DRN-002', 
    enrolledCourses: ['NEET'], joinDate: '2025-10-06', performance: 94, rating: 4.8, batch: 'Dropper NEET',
    phoneNumber: '+91 98765 43230', dateOfBirth: '2006-02-10', address: 'Kanpur', parentContact: '+91 98765 55556',
    subjectRatings: { 'Biology': { attendance: 4.9, tests: 4.8, dppPerformance: 4.7, behavior: 5.0 } }
  },
  { 
    id: '21', name: 'Vivek Oberoi', rollNumber: 'UJAAS-DRN-003', 
    enrolledCourses: ['NEET'], joinDate: '2025-10-07', performance: 76, rating: 3.7, batch: 'Dropper NEET',
    phoneNumber: '+91 98765 43231', dateOfBirth: '2006-01-15', address: 'Varanasi', parentContact: '+91 98765 55557',
    subjectRatings: { 'Physics': { attendance: 3.8, tests: 3.5, dppPerformance: 3.6, behavior: 4.0 } }
  }
];

const MOCK_FACULTY: Faculty[] = [
  { id: 'f1', name: 'Arvind Sir', email: 'arvind@example.com', subject: 'Physics', phone: '+91 98765 11111' },
  { id: 'f2', name: 'Megha Maam', email: 'megha@example.com', subject: 'Chemistry', phone: '+91 98765 22222' },
];

const STUDENT_REMARKS_STORAGE_KEY = 'ujaas_student_remarks';
const BATCH_ATTENDANCE_STORAGE_KEY = 'ujaas_batch_attendance';

type MonthlyAttendance = {
  month: string;
  totalClasses: number;
  studentAttendance: Record<string, number>;
};

type BatchAttendance = Record<string, MonthlyAttendance[]>;

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

export function FacultyDashboard({ 
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
  onDeleteNotification,
  publishedTests,
  onPreviewTest,
  onUpdatePublishedTest,
  selectedPreviewTest
}: FacultyDashboardProps) {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [faculty, setFaculty] = useState<Faculty[]>(MOCK_FACULTY);

  const [batchAttendance, setBatchAttendance] = useState<BatchAttendance>(() => {
    try {
      const stored = localStorage.getItem(BATCH_ATTENDANCE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(BATCH_ATTENDANCE_STORAGE_KEY, JSON.stringify(batchAttendance));
  }, [batchAttendance]);

  useEffect(() => {
    // Ensure mock students are always loaded and correctly assigned to current batches
    setStudents(withStoredRemarks(MOCK_STUDENTS));
  }, [batches]);
  
  const [studentModal, setStudentModal] = useState<{ open: boolean; initialData?: StudentFormState; defaultBatch: Batch | null; title: string; }>({
    open: false,
    defaultBatch: null,
    title: 'Add Student',
  });
  
  const [batchModal, setBatchModal] = useState<{ open: boolean; batchLabel?: string; }>({ open: false });
  const [ratingModal, setRatingModal] = useState<{ open: boolean; student?: Student; }>({ open: false });
  const [showFullTimetable, setShowFullTimetable] = useState(false);
  const [batchStudentPicker, setBatchStudentPicker] = useState<{ open: boolean; batch: Batch | null }>({
    open: false,
    batch: null
  });
  const [attendanceModal, setAttendanceModal] = useState<{ open: boolean; batch: Batch | null }>({ open: false, batch: null });
  const [attendanceEditMode, setAttendanceEditMode] = useState(false);
  const [performanceInsightsTestId, setPerformanceInsightsTestId] = useState<string | null>(null);

  const generateMockPerformances = (testId: string): StudentPerformance[] => {
    const test = publishedTests.find(t => t.id === testId);
    if (!test) return [];

    return students.slice(0, 5).map((student, index) => {
      const obtainedMarks = Math.floor(Math.random() * test.totalMarks);
      const accuracy = Math.floor(Math.random() * 40) + 60;
      const correctAnswers = Math.floor((accuracy / 100) * test.questions.length);
      
      return {
        studentId: student.id,
        studentName: student.name,
        submittedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        score: obtainedMarks,
        totalMarks: test.totalMarks,
        accuracy,
        rank: index + 1,
        timeSpent: Math.floor(Math.random() * test.duration * 60),
        result: {
          testId: test.id,
          testTitle: test.title,
          totalMarks: test.totalMarks,
          obtainedMarks,
          totalQuestions: test.questions.length,
          correctAnswers,
          wrongAnswers: test.questions.length - correctAnswers,
          unattempted: 0,
          timeSpent: Math.floor(Math.random() * test.duration * 60),
          duration: test.duration,
          rank: index + 1,
          totalStudents: 5,
          submittedAt: new Date().toISOString(),
          questions: test.questions.map(q => ({
            ...q,
            userAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0
          }))
        }
      };
    });
  };

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

  useBodyScrollLock(
    studentModal.open ||
      batchModal.open ||
      ratingModal.open ||
      showFullTimetable ||
      batchStudentPicker.open ||
      isAddSubjectModalOpen ||
      isAddChapterModalOpen ||
      attendanceModal.open
  );

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
    initialData: { id: student.id, name: student.name, rollNumber: student.rollNumber, batch: student.batch, phoneNumber: '', dateOfBirth: '', address: '', parentContact: '' },
  });
  const closeStudentModal = () => setStudentModal((prev) => ({ ...prev, open: false }));
  
  const handleSaveStudent = (data: StudentFormState) => {
    if (data.id) {
      setStudents(prev => prev.map(s => s.id === data.id ? { ...s, name: data.name, rollNumber: data.rollNumber, batch: data.batch } : s));
    } else {
      setStudents(prev => [{ id: `student-${Date.now()}`, name: data.name, rollNumber: data.rollNumber, enrolledCourses: [], joinDate: new Date().toISOString().slice(0, 10), performance: 0, rating: 0, batch: data.batch }, ...prev]);
    }
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
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

  const openStudentRatings = (student: Student) => setRatingModal({ open: true, student });
  const closeStudentRatings = () => setRatingModal({ open: false });
  const facultySubject =
    ((user as any).facultyDetails?.subjectSpecialty ||
    faculty.find(
      (f) =>
        (user.loginId && f.email.toLowerCase() === user.loginId.toLowerCase()) ||
        f.name.toLowerCase() === user.name.toLowerCase()
    )?.subject) ?? null;
  const handleSaveFacultySubjectRating = (
    studentId: string, 
    subject: string, 
    ratings: { attendance: number; tests: number; dppPerformance: number; behavior: number }
  ) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const updatedSubjectRatings = {
          ...(student.subjectRatings ?? {}),
          [subject]: {
            attendance: Math.max(0, Math.min(5, ratings.attendance)),
            tests: Math.max(0, Math.min(5, ratings.tests)),
            dppPerformance: Math.max(0, Math.min(5, ratings.dppPerformance)),
            behavior: Math.max(0, Math.min(5, ratings.behavior)),
          },
        };

        const values = Object.values(updatedSubjectRatings);
        const avg =
          values.length > 0
            ? values.reduce((acc, curr) => acc + (curr.attendance + curr.tests + curr.dppPerformance + curr.behavior) / 4, 0) /
              values.length
            : student.rating;

        return {
          ...student,
          subjectRatings: updatedSubjectRatings,
          rating: Number(avg.toFixed(1)),
        };
      })
    );
    setRatingModal((prev) => {
      if (!prev.student || prev.student.id !== studentId) return prev;
      return {
        ...prev,
        student: {
          ...prev.student,
          subjectRatings: {
            ...(prev.student.subjectRatings ?? {}),
            [subject]: {
              attendance: Math.max(0, Math.min(5, ratings.attendance)),
              tests: Math.max(0, Math.min(5, ratings.tests)),
              dppPerformance: Math.max(0, Math.min(5, ratings.dppPerformance)),
              behavior: Math.max(0, Math.min(5, ratings.behavior)),
            },
          },
        },
      };
    });
  };
  const handleSaveFacultySubjectRemark = (studentId: string, subject: string, remark: string) => {
    const cleanedRemark = remark.trim();
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? {
              ...student,
              subjectRemarks: {
                ...(student.subjectRemarks ?? {}),
                [subject]: cleanedRemark,
              },
            }
          : student
      )
    );
    setRatingModal((prev) => {
      if (!prev.student || prev.student.id !== studentId) return prev;
      return {
        ...prev,
        student: {
          ...prev.student,
          subjectRemarks: {
            ...(prev.student.subjectRemarks ?? {}),
            [subject]: cleanedRemark,
          },
        },
      };
    });
    writeStoredRemarks(studentId, { subjectRemarks: { [subject]: cleanedRemark } });
  };
  const closeBatchModal = () => setBatchModal((prev) => ({ ...prev, open: false }));

  const handleUpdateBatchAttendance = (batch: string, updatedMonthlyAttendance: MonthlyAttendance[]) => {
    setBatchAttendance(prev => ({
      ...prev,
      [batch]: updatedMonthlyAttendance
    }));

    // Update students' attendance ratings based on last month
    if (updatedMonthlyAttendance.length > 0 && facultySubject) {
      const lastMonth = [...updatedMonthlyAttendance].sort((a, b) => b.month.localeCompare(a.month))[0];
      const hasAttendanceData = Object.keys(lastMonth.studentAttendance).length > 0;

      if (lastMonth.totalClasses > 0 && hasAttendanceData) {
        setStudents(prev => prev.map(student => {
          if (student.batch !== batch) return student;
          const attended = lastMonth.studentAttendance[student.id] || 0;
          const rating = (attended / lastMonth.totalClasses) * 5;
          
          const updatedSubjectRatings = {
            ...(student.subjectRatings ?? {}),
            [facultySubject]: {
              ...(student.subjectRatings?.[facultySubject] ?? { tests: 0, dppPerformance: 0, behavior: 0 }),
              attendance: Number(rating.toFixed(1))
            }
          };

          const values = Object.values(updatedSubjectRatings);
          const avg = values.length > 0
            ? values.reduce((acc, curr) => acc + (curr.attendance + curr.tests + curr.dppPerformance + curr.behavior) / 4, 0) / values.length
            : student.rating;

          return {
            ...student,
            subjectRatings: updatedSubjectRatings,
            rating: Number(avg.toFixed(1))
          };
        }));
      }
    }
  };

  const handleSaveAllStudentsAttendance = (batch: string, month: string, studentAttendance: Record<string, number>) => {
    const currentBatchAtt = batchAttendance[batch] || [];
    const updated = currentBatchAtt.map(m => m.month === month ? { ...m, studentAttendance } : m);
    handleUpdateBatchAttendance(batch, updated);
    setAttendanceEditMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-layer-navbar shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.button
              onClick={onClearBatch}
              className="flex items-center gap-3"
            >
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <span className="text-xl font-bold" style={{ color: 'rgb(159, 29, 14)' }}>
                UJAAS Faculty
              </span>
            </motion.button>

            {/* Center Navigation Tabs */}
            {!selectedBatch ? (
              <div className="flex items-center gap-2">
                {[
                  { id: 'batches', label: 'Batches', icon: BookOpen },
                  { id: 'test-series', label: 'Test Series', icon: FileText },
                ].map((section) => (
                  <motion.button
                    key={section.id}
                    onClick={() => onNavigateSection(section.id as FacultySection)}
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
          ) : performanceInsightsTestId ? (
            <div className="fixed inset-0 bg-white overflow-y-auto z-layer-10002">
              {(() => {
                const test = publishedTests.find(t => t.id === performanceInsightsTestId);
                const scheduledDateTime = test ? `${test.scheduleDate}T${test.scheduleTime}` : undefined;
                return (
                  <TestPerformanceInsights
                    testId={performanceInsightsTestId}
                    testTitle={test?.title || ''}
                    scheduledDateTime={scheduledDateTime}
                    testQuestions={test?.questions}
                    testDuration={test?.duration}
                    testInstructions={test?.instructions}
                    performances={generateMockPerformances(performanceInsightsTestId)}
                    onClose={() => setPerformanceInsightsTestId(null)}
                  />
                );
              })()}
            </div>
          ) : activeTab === 'preview-test' && selectedPreviewTest ? (
            <div className="fixed inset-0 bg-white overflow-y-auto z-layer-10002">
              <TestTaking 
                testId={selectedPreviewTest.id}
                testTitle={selectedPreviewTest.title}
                duration={selectedPreviewTest.duration}
                questions={selectedPreviewTest.questions}
                onSubmit={() => onNavigate('test-series')}
                onExit={() => onNavigate('test-series')}
                onSave={(testId, updatedQuestions) => {
                  onUpdatePublishedTest(testId, {
                    questions: updatedQuestions
                  });
                }}
                isPreview={false}
                isFacultyPreview={true}
                availableBatches={batches}
                initialBatches={selectedPreviewTest.batches}
              />
            </div>
          ) : activeTab === 'create-dpp' ? (
            <CreateDPP onBack={() => onNavigate('content')} />
          ) : activeTab === 'upload-notes' ? (
            <UploadNotes onBack={() => onNavigate('content')} />
          ) : activeTab === 'profile' ? (
            <FacultyProfile user={user} onLogout={onLogout} />
          ) : !selectedBatch ? (
            /* GLOBAL CONTEXT */
            <>
              {adminSection === 'batches' && (
                <BatchSelectionTab
                  batches={batches}
                  onSelectBatch={onSelectBatch}
                />
              )}
              {adminSection === 'test-series' && (
                <TestSeriesManagementTab 
                  onNavigate={onNavigate} 
                  selectedBatch={null as unknown as Batch} 
                  onChangeBatch={() => {}} 
                  publishedTests={publishedTests}
                  onPreviewTest={onPreviewTest}
                  onViewInsights={(testId) => setPerformanceInsightsTestId(testId)}
                />
              )}
            </>
          ) : (
            /* BATCH CONTEXT */
            <>
              {activeTab === 'home' && (
                <OverviewTab
                  selectedBatch={selectedBatch}
                  students={students}
                  onNavigate={onNavigate}
                  onClearBatch={onClearBatch}
                  onViewTimetable={() => setShowFullTimetable(true)}
                  facultySubject={facultySubject}
                  onOpenAttendance={() => setAttendanceModal({ open: true, batch: selectedBatch })}
                />
              )}
              {activeTab === 'students' && (
                <StudentsTab
                  students={students}
                  selectedBatch={selectedBatch}
                  onChangeBatch={onClearBatch}
                  onViewStudent={openStudentRatings}
                  batchAttendance={batchAttendance[selectedBatch] || []}
                  editMode={attendanceEditMode}
                  onToggleEditMode={() => setAttendanceEditMode(!attendanceEditMode)}
                  onSaveAttendance={(studentAttendance) => {
                    const lastMonth = [...(batchAttendance[selectedBatch] || [])].sort((a, b) => b.month.localeCompare(a.month))[0];
                    if (lastMonth) {
                      handleSaveAllStudentsAttendance(selectedBatch, lastMonth.month, studentAttendance);
                    }
                  }}
                />
              )}
              {activeTab === 'ratings' && <StudentRating students={students.filter((student) => student.batch === selectedBatch)} />}
              {activeTab === 'rankings' && <StudentRankingsEnhanced />}
            </>
          )}
        </motion.div>
      </main>

      <Footer />

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

        <BatchFormModal
          open={batchModal.open}
          batchLabel={batchModal.batchLabel}
          batches={batches}
          faculty={faculty}
          onClose={closeBatchModal}
          onUpdateBatch={onUpdateBatch}
        />
        <BatchStudentPickerModal
          open={batchStudentPicker.open}
          selectedBatch={batchStudentPicker.batch}
          students={students}
          onClose={closeBatchStudentPicker}
          onAssign={handleAssignExistingStudentToBatch}
        />

        <AnimatePresence>
          {ratingModal.open && (
            <StudentRatingsModal
              open={ratingModal.open}
              student={ratingModal.student}
              onClose={closeStudentRatings}
              facultySubject={facultySubject}
              onSaveSubjectRating={handleSaveFacultySubjectRating}
              onSaveSubjectRemark={handleSaveFacultySubjectRemark}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {attendanceModal.open && attendanceModal.batch && (
            <AttendanceCalendarModal
              open={attendanceModal.open}
              batch={attendanceModal.batch}
              onClose={() => setAttendanceModal({ open: false, batch: null })}
              monthlyAttendance={batchAttendance[attendanceModal.batch] || []}
              onUpdateAttendance={(updated) => handleUpdateBatchAttendance(attendanceModal.batch!, updated)}
            />
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
              className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md z-layer-2000"
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
  const filtered = students.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || s.rollNumber.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div><h2 className="text-3xl font-bold text-gray-900">Students Directory</h2><p className="text-gray-500">Manage all students in your assigned batches</p></div>
        <div className="flex gap-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." className="pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-cyan-500 w-64" /></div><button onClick={onAddStudent} className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add Student</button></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="text-left border-b border-gray-100"><th className="pb-4 font-bold text-gray-700">Student</th><th className="pb-4 font-bold text-gray-700">Batch</th><th className="pb-4 font-bold text-gray-700">Performance</th><th className="pb-4 font-bold text-gray-700">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => (
              <tr key={s.id} onClick={() => onViewStudent(s)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                <td className="py-4"><div className="font-bold text-gray-900">{s.name}</div><div className="text-xs text-gray-500">{s.rollNumber}</div></td>
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

function OverviewTab({ 
  selectedBatch, 
  students,
  onNavigate,
  onClearBatch,
  onViewTimetable,
  facultySubject,
  onOpenAttendance
}: { 
  selectedBatch: Batch | null; 
  students: Student[];
  onNavigate: (tab: Tab) => void;
  onClearBatch: () => void;
  onViewTimetable: () => void;
  facultySubject: string | null;
  onOpenAttendance: () => void;
}) {
  if (!selectedBatch) return null;
  const batchStudents = students.filter(s => s.batch === selectedBatch);
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 p-8 rounded-3xl shadow-xl text-white mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{selectedBatch} Dashboard</h2>
          <p className="text-teal-50/90 font-medium">Batch Academic Overview & Content</p>
        </div>
        <button
          onClick={onOpenAttendance}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl font-bold transition flex items-center gap-2 border border-white/30"
        >
          <Calendar className="w-5 h-5" />
          Classes Taken
        </button>
      </div>

      {/* Batch Content Section */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-1 border border-gray-100">
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
            facultySubject={facultySubject}
          />
        </div>
      </div>
    </div>
  );
}

function StudentsTab({ 
  students, 
  selectedBatch, 
  onChangeBatch: _onChangeBatch, 
  onViewStudent,
  batchAttendance,
  editMode,
  onToggleEditMode,
  onSaveAttendance
}: { 
  students: Student[]; 
  selectedBatch: Batch; 
  onChangeBatch: () => void; 
  onViewStudent: (s: Student) => void;
  batchAttendance: MonthlyAttendance[];
  editMode: boolean;
  onToggleEditMode: () => void;
  onSaveAttendance: (studentAttendance: Record<string, number>) => void;
}) {
  const batchStudents = students.filter(s => s.batch === selectedBatch);
  const lastMonth = [...batchAttendance].sort((a, b) => b.month.localeCompare(a.month))[0];
  const [localAttendance, setLocalAttendance] = useState<Record<string, number>>({});

  useEffect(() => {
    if (lastMonth) {
      setLocalAttendance(lastMonth.studentAttendance || {});
    }
  }, [lastMonth, editMode]);

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Batch Students</h2>
          <p className="text-gray-500">{selectedBatch} • {batchStudents.length} Students</p>
        </div>
        {lastMonth && (
          <div className="flex gap-3">
            {!editMode ? (
              <button
                onClick={onToggleEditMode}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 transition flex items-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Fill Attendance ({new Date(lastMonth.month).toLocaleString('default', { month: 'long', year: 'numeric' })})
              </button>
            ) : (
              <button
                onClick={() => onSaveAttendance(localAttendance)}
                className="px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
              >
                Save Attendance
              </button>
            )}
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-4 px-4 font-bold text-gray-700" style={{ width: '40%' }}>Student</th>
              <th className="pb-4 px-4 font-bold text-gray-700" style={{ width: '20%' }}>Roll No</th>
              <th className="pb-4 px-4 font-bold text-gray-700" style={{ width: '20%' }}>Attendance</th>
              <th className="pb-4 px-4 font-bold text-gray-700" style={{ width: '20%' }}>Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {batchStudents.map((s) => (
              <tr key={s.id} onClick={() => !editMode && onViewStudent(s)} className={`hover:bg-gray-50/50 transition-colors ${!editMode ? 'cursor-pointer' : ''} group`}>
                <td className="py-4 px-4">
                  <div className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors truncate">{s.name}</div>
                  <div className="text-xs text-gray-500 truncate">{s.rollNumber}</div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600 font-mono">{s.rollNumber}</td>
                <td className="py-4 px-4">
                  {lastMonth ? (
                    <div className="flex items-center gap-2">
                      {editMode ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            max={lastMonth.totalClasses}
                            value={localAttendance[s.id] || 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setLocalAttendance({ ...localAttendance, [s.id]: Math.min(val, lastMonth.totalClasses) });
                            }}
                            className="w-16 px-2 py-1 rounded border border-teal-200 focus:ring-2 focus:ring-teal-100 outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-gray-400 font-medium">/ {lastMonth.totalClasses}</span>
                        </>
                      ) : (
                        <span className="font-bold text-gray-700">
                          {lastMonth.studentAttendance[s.id] || 0} / {lastMonth.totalClasses}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm italic">Not set</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    {renderPerformanceStars(s.rating)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editMode && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => onSaveAttendance(localAttendance)}
            className="px-10 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1"
          >
            Save All Attendance
          </button>
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
  facultySubject 
}: { 
  onNavigate: (t: Tab) => void; 
  selectedBatch: Batch | null; 
  onChangeBatch: () => void; 
  onViewTimetable: () => void; 
  facultySubject: string | null;
}) {
  // Logic kept same as per request
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
    'Physics': ['Kinematics', 'Laws of Motion'],
    'Chemistry': ['Atomic Structure', 'Chemical Bonding'],
  });

  const [notes, setNotes] = useState([
    { id: 'n1', chapter: 'Kinematics', title: 'Kinematics Theory Notes', size: '2.4 MB', date: '2025-09-20' },
  ]);

  const [dpps, setDpps] = useState([
    { id: 'd1', chapter: 'Kinematics', title: 'Kinematics DPP 01 - Basics', questions: 15, date: '2025-09-22' },
  ]);

  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');

  useBodyScrollLock(isAddChapterModalOpen);

  const canEdit = !!facultySubject && selectedSubject?.toLowerCase() === facultySubject.toLowerCase();

  const handleAddChapter = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !canEdit) return;
    if (newChapterName.trim()) {
      setChapters({
        ...chapters,
        [selectedSubject]: [...(chapters[selectedSubject] || []), newChapterName.trim()]
      });
      setNewChapterName('');
      setIsAddChapterModalOpen(false);
    }
  };

  const handleDeleteChapter = (chapterName: string) => {
    if (!selectedSubject || !canEdit) return;
    if (confirm(`Are you sure you want to delete the chapter "${chapterName}"?`)) {
      setChapters({
        ...chapters,
        [selectedSubject]: chapters[selectedSubject].filter(c => c !== chapterName)
      });
      setNotes(notes.filter(n => n.chapter !== chapterName));
      setDpps(dpps.filter(d => d.chapter !== chapterName));
    }
  };

  const handleDeleteNote = (id: string) => {
    if (!canEdit) return;
    if (confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const handleDeleteDPP = (id: string) => {
    if (!canEdit) return;
    if (confirm('Are you sure you want to delete this DPP?')) {
      setDpps(dpps.filter(d => d.id !== id));
    }
  };

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
            {currentView === 'root' && (<button onClick={onViewTimetable} className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition font-semibold shadow-sm"><Calendar className="w-5 h-5" />Time Table</button>)}
            {currentView === 'subject' && canEdit && (<button onClick={() => setIsAddChapterModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition shadow-md"><Plus className="w-5 h-5" />Add Chapter</button>)}
            {currentView === 'chapter' && canEdit && (
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
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigateToSubject(sub.name)}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white flex flex-col items-center gap-4 group relative cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform" style={{ backgroundColor: sub.color }}><Folder className="w-8 h-8 text-white" /></div>
              <div className="text-center"><h4 className="font-bold text-gray-900">{sub.name}</h4><p className="text-xs text-gray-500 mt-1">{chapters[sub.name]?.length || 0} Chapters</p></div>
            </motion.div>
          ))}
        </div>
      )}

      {currentView === 'subject' && selectedSubject && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters[selectedSubject]?.map((chapter, index) => (
            <motion.button key={chapter} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} onClick={() => navigateToChapter(chapter)} className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white flex items-center justify-between group">
              <div className="flex items-center gap-4"><div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 transition-colors"><Folder className="w-5 h-5 text-cyan-600 group-hover:text-white" /></div><span className="font-bold text-gray-900">{chapter}</span></div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChapter(chapter);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-600 transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {currentView === 'chapter' && selectedChapter && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-200">
            <button onClick={() => setActiveContentType('notes')} className={`pb-4 px-6 text-sm font-bold transition-all relative ${activeContentType === 'notes' ? 'text-teal-600' : 'text-gray-500'}`}>Study Notes{activeContentType === 'notes' && (<motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 rounded-t-full" />)}</button>
            <button onClick={() => setActiveContentType('dpps')} className={`pb-4 px-6 text-sm font-bold transition-all relative ${activeContentType === 'dpps' ? 'text-teal-600' : 'text-gray-500'}`}>DPPs{activeContentType === 'dpps' && (<motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 rounded-t-full" />)}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(activeContentType === 'notes' ? notes : dpps).filter(item => item.chapter === selectedChapter).map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white group">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${activeContentType === 'notes' ? 'from-cyan-500 to-blue-500' : 'from-emerald-500 to-teal-500'} rounded-xl flex items-center justify-center shrink-0`}><FileText className="w-6 h-6 text-white" /></div>
                  <div className="flex-1 min-w-0"><h4 className="font-bold text-gray-900 truncate mb-1">{item.title}</h4><div className="flex items-center justify-between"><span className="text-xs text-gray-500">{(item as any).size || (item as any).questions + ' Questions'} • {item.date}</span><div className="flex gap-1">
                    <button className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"><Download className="w-4 h-4" /></button>
                    {canEdit && (
                      <button 
                        onClick={() => activeContentType === 'notes' ? handleDeleteNote(item.id) : handleDeleteDPP(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div></div></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

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
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                  >
                    Create Chapter
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TestSeriesManagementTab({ 
  onNavigate, 
  publishedTests,
  onPreviewTest,
  onViewInsights
}: { 
  onNavigate: (t: Tab) => void; 
  selectedBatch: Batch | null; 
  onChangeBatch: () => void; 
  publishedTests: import('../App').PublishedTest[];
  onPreviewTest: (testId: string) => void;
  onViewInsights: (testId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-gray-900">Faculty Test Series</h2><p className="text-gray-600">Review student performance and manage tests</p></div>
      </div>

      {publishedTests.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-lg border border-white text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="w-10 h-10 text-blue-600" /></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tests available</h3>
          <p className="text-gray-600">Tests created by administrator will appear here for your review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedTests.map((test) => (
            <motion.div
              key={test.id}
              onClick={() => onViewInsights(test.id)}
              className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col h-full cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  test.status === 'live' ? 'bg-green-100 text-green-700' :
                  test.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {test.status}
                </div>
                <span className="text-xs font-bold text-gray-400">{test.format}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{test.title}</h3>
              <div className="space-y-2 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{test.scheduleDate} at {test.scheduleTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{test.duration} mins • {test.totalMarks} marks</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="truncate">{test.batches.join(', ')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onPreviewTest(test.id); }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" /> Review
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onViewInsights(test.id); }}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" /> Performance
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddStudentModal({ open, onClose, defaultBatch, batches, initialData, title, onSubmit }: any) { 
  if (!open) return null; 
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-layer-2000">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); onSubmit({ id: initialData?.id, name: f.get('name'), rollNumber: f.get('roll'), batch: f.get('batch') }); onClose(); }} className="space-y-4">
          <input name="name" defaultValue={initialData?.name} placeholder="Student Name" required className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <input name="roll" defaultValue={initialData?.rollNumber} placeholder="Roll Number" required className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <select name="batch" defaultValue={initialData?.batch || defaultBatch || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white">
            {batches.map((b:any) => <option key={b.slug} value={b.label}>{b.label}</option>)}
          </select>
          <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancel</button><button type="submit" className="flex-1 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold">Save</button></div>
        </form>
      </div>
    </div>
  ); 
}

function BatchFormModal({ open, batchLabel, onClose, onUpdateBatch }: any) { 
  if (!open) return null; 
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-layer-2000">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white">
        <h2 className="text-2xl font-bold mb-6">Edit Batch</h2>
        <form onSubmit={(e) => { e.preventDefault(); onUpdateBatch(batchLabel); onClose(); }} className="space-y-4">
          <input name="label" defaultValue={batchLabel} disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500" />
          <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancel</button><button type="submit" className="flex-1 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold">Save</button></div>
        </form>
      </div>
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
    <div className="fixed inset-0 flex items-center justify-center p-4 z-layer-2000">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl h-[70vh] bg-white rounded-2xl shadow-2xl border border-white overflow-hidden flex flex-col"
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
                  <p className="text-sm text-gray-500">{student.rollNumber}</p>
                  <p className="text-xs text-gray-400 mt-1">Current batch: {student.batch || 'Unassigned'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAssign(student)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition"
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
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StudentRatingsModal({
  open,
  student,
  onClose,
  facultySubject,
  onSaveSubjectRating,
  onSaveSubjectRemark,
}: {
  open: boolean;
  student?: Student;
  onClose: () => void;
  facultySubject?: string | null;
  onSaveSubjectRating?: (
    studentId: string,
    subject: string,
    ratings: { attendance: number; tests: number; dppPerformance: number; behavior: number }
  ) => void;
  onSaveSubjectRemark?: (studentId: string, subject: string, remark: string) => void;
}) {
  const [activeView, setActiveView] = useState<'profile' | 'ratings' | 'performance'>('profile');
  const [draftRatings, setDraftRatings] = useState<Record<string, { attendance: string; tests: string; dppPerformance: string; behavior: string }>>({});
  const [draftRemarks, setDraftRemarks] = useState<Record<string, string>>({});
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingRemarkSubject, setEditingRemarkSubject] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !student) return;
    setActiveView('profile');
    setEditingSubject(null);
    setEditingRemarkSubject(null);
    const nextDrafts: Record<string, { attendance: string; tests: string; dppPerformance: string; behavior: string }> = {};
    const nextRemarks: Record<string, string> = {};
    Object.entries(student.subjectRatings ?? {}).forEach(([subject, r]) => {
      nextDrafts[subject] = {
        attendance: r.attendance.toString(),
        tests: r.tests.toString(),
        dppPerformance: r.dppPerformance.toString(),
        behavior: r.behavior.toString(),
      };
      nextRemarks[subject] = student.subjectRemarks?.[subject] ?? '';
    });
    setDraftRatings(nextDrafts);
    setDraftRemarks(nextRemarks);
  }, [open, student]);
  if (!open || !student) return null;

  const mockTestPerformance = [
    { title: 'Unit Test 1: Physics Basics', date: '2025-08-15', score: '85/100', rank: '12/150', accuracy: '88%', status: 'Attempted' },
    { title: 'Monthly Mock: JEE Main Pattern', date: '2025-09-01', score: '245/300', rank: '45/1200', accuracy: '82%', status: 'Attempted' },
    { title: 'Surprise Quiz: Organic Chemistry', date: '2025-09-10', score: '-', rank: '-', accuracy: '-', status: 'Not Attempted' },
    { title: 'Unit Test 2: Calculus I', date: '2025-09-20', score: '92/100', rank: '5/160', accuracy: '95%', status: 'Attempted' },
    { title: 'Full Length Mock 01', date: '2025-10-05', score: '-', rank: '-', accuracy: '-', status: 'Not Attempted' },
  ];

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

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-layer-2000">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-white overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-bold">{student.name}</h3>
            <p className="text-teal-50 text-sm opacity-90">{student.batch} • {student.rollNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeView === 'profile' ? (
            <div className="space-y-8">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roll Number</p>
                  <p className="text-gray-900 font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-600" /> {student.rollNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</p>
                  <p className="text-gray-900 font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> {student.phoneNumber || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date of Birth</p>
                  <p className="text-gray-900 font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-600" /> {student.dateOfBirth || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Parent's Contact</p>
                  <p className="text-gray-900 font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-orange-600" /> {student.parentContact || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Residential Address</p>
                  <p className="text-gray-900 font-semibold flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-emerald-600" /> {student.address || 'Not provided'}</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveView('ratings')}
                  className="py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Star className="w-5 h-5 fill-current" /> View Detailed Ratings
                </button>
                <button
                  onClick={() => setActiveView('performance')}
                  className="py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-5 h-5" /> View Test Performance
                </button>
              </div>
            </div>
          ) : activeView === 'performance' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button onClick={() => setActiveView('profile')} className="text-purple-600 font-bold flex items-center gap-1 hover:underline">
                  <ChevronLeft className="w-4 h-4" /> Back to Profile
                </button>
                <h4 className="text-xl font-bold text-gray-900">Test Performance Summary</h4>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Test Name</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Score</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Rank</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-center">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50">
                    {mockTestPerformance.map((perf, idx) => {
                      const isAttempted = perf.status === 'Attempted';
                      return (
                        <tr 
                          key={idx} 
                          className={`transition-colors ${
                            isAttempted ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'bg-red-50/40 hover:bg-red-50/70'
                          }`}
                        >
                          <td className="px-4 py-3 font-bold text-gray-900 text-xs sm:text-sm w-48 min-w-[12rem] break-words" title={perf.title}>
                            {perf.title}
                          </td>
                          <td className="px-4 py-3 text-[10px] font-medium text-gray-500 whitespace-nowrap">
                            {perf.date}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono font-bold text-gray-700 text-center">
                            {perf.score}
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-blue-600 text-center">
                            {perf.rank}
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-teal-600 text-center">
                            {perf.accuracy}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 italic">* This table is for review only.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setActiveView('profile')} className="text-teal-600 font-bold flex items-center gap-1 hover:underline">
                  <ChevronLeft className="w-4 h-4" /> Back to Profile
                </button>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Final Average</p>
                  <p className="text-xl font-black text-gray-900">{finalRating.toFixed(1)}/5.0</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {facultySubject
                  ? `You can edit ratings for ${facultySubject}.`
                  : 'Faculty subject is not mapped, so rating edit is disabled.'}
              </p>

              {student.subjectRatings && Object.keys(student.subjectRatings).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(student.subjectRatings).map(([subject, r]) => {
                    const subAvg = calculateSubjectRating(r);
                    const canEditThisSubject =
                      !!facultySubject && 
                      (subject.toLowerCase() === facultySubject.toLowerCase() || facultySubject.toLowerCase() === 'general');
                    
                    const isEditing = editingSubject === subject;

                    const currentDraft = draftRatings[subject] || {
                      attendance: r.attendance.toString(),
                      tests: r.tests.toString(),
                      dppPerformance: r.dppPerformance.toString(),
                      behavior: r.behavior.toString(),
                    };

                    return (
                      <div key={subject} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                          <h5 className="font-bold text-gray-900">{subject}</h5>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500 px-2 py-1 bg-white rounded-lg border border-gray-100">Avg: {subAvg.toFixed(1)}</span>
                              {renderPerformanceStars(subAvg)}
                            </div>
                            {canEditThisSubject && !isEditing && (
                              <button
                                onClick={() => setEditingSubject(subject)}
                                className="px-3 py-1 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition"
                              >
                                Edit
                              </button>
                            )}
                            {isEditing && (
                              <button
                                onClick={() => setEditingSubject(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 transition"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                        {isEditing && (
                          <div className="p-6 border-b border-gray-100 bg-teal-50/50 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              {[
                                { label: 'Attendance', key: 'attendance', readOnly: true },
                                { label: 'Test Performance', key: 'tests' },
                                { label: 'DPP Performance', key: 'dppPerformance' },
                                { label: 'Class Behaviour', key: 'behavior' },
                              ].map((item) => (
                                <div key={item.key} className="space-y-1">
                                  <label className="text-xs font-bold text-gray-500 uppercase">
                                    {item.label} {(item as any).readOnly && <span className="text-[10px] text-teal-600 normal-case ml-1">(Calculated)</span>}
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    readOnly={(item as any).readOnly}
                                    value={currentDraft[item.key as keyof typeof currentDraft]}
                                    onChange={(e) => setDraftRatings((prev) => ({
                                      ...prev,
                                      [subject]: {
                                        ...(prev[subject] || currentDraft),
                                        [item.key]: e.target.value
                                      }
                                    }))}
                                    className={`w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all ${
                                      (item as any).readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                                    }`}
                                  />
                                </div>
                              ))}                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const ratings = {
                                  attendance: Number(currentDraft.attendance),
                                  tests: Number(currentDraft.tests),
                                  dppPerformance: Number(currentDraft.dppPerformance),
                                  behavior: Number(currentDraft.behavior),
                                };

                                const invalid = Object.values(ratings).some(v => Number.isNaN(v) || v < 0 || v > 5);
                                if (invalid) {
                                  window.alert('Please enter ratings between 0 and 5 for all factors.');
                                  return;
                                }
                                
                                if (window.confirm(`Are you sure you want to save updated ratings for ${subject}?`)) {
                                  onSaveSubjectRating?.(student.id, subject, ratings);
                                  setEditingSubject(null);
                                }
                              }}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white font-bold shadow-lg hover:bg-teal-700 transition"
                            >
                              Save {subject} Ratings
                            </button>
                          </div>
                        )}
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
                        <div className="px-6 pb-6 space-y-3">
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Faculty Remark</p>
                            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3 whitespace-pre-wrap">
                              {(student.subjectRemarks?.[subject] || '').trim() || 'No remark added yet.'}
                            </p>
                          </div>
                          {canEditThisSubject && (
                            editingRemarkSubject === subject ? (
                              <div className="space-y-2">
                                <textarea
                                  rows={3}
                                  value={draftRemarks[subject] ?? ''}
                                  onChange={(e) =>
                                    setDraftRemarks((prev) => ({
                                      ...prev,
                                      [subject]: e.target.value,
                                    }))
                                  }
                                  placeholder={`Add ${subject} remark`}
                                  className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDraftRemarks((prev) => ({
                                        ...prev,
                                        [subject]: student.subjectRemarks?.[subject] ?? '',
                                      }));
                                      setEditingRemarkSubject(null);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Save remark for ${subject}?`)) {
                                        onSaveSubjectRemark?.(student.id, subject, draftRemarks[subject] ?? '');
                                        setEditingRemarkSubject(null);
                                      }
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition"
                                  >
                                    Save Remark
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setDraftRemarks((prev) => ({
                                    ...prev,
                                    [subject]: student.subjectRemarks?.[subject] ?? '',
                                  }));
                                  setEditingRemarkSubject(subject);
                                }}
                                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition"
                              >
                                Edit {subject} Remark
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium mb-4">No rating data available for this student.</p>
                  {!!facultySubject && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Initialize ${facultySubject} rating for this student?`)) {
                          onSaveSubjectRating?.(student.id, facultySubject, { attendance: 0, tests: 0, dppPerformance: 0, behavior: 0 });
                          setEditingSubject(facultySubject);
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 transition"
                    >
                      Add Initial {facultySubject} Rating
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 shrink-0">
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

export function AttendanceCalendarModal({ open, batch, onClose, monthlyAttendance, onUpdateAttendance }: { open: boolean; batch: string; onClose: () => void; monthlyAttendance: MonthlyAttendance[]; onUpdateAttendance: (updated: MonthlyAttendance[]) => void; }) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const year = new Date().getFullYear();
  
  const handleUpdateClasses = (monthStr: string, totalClasses: number) => {
    const [y, m] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const validatedClasses = Math.min(totalClasses, daysInMonth);

    const existing = monthlyAttendance.find(m => m.month === monthStr);
    let updated;
    if (existing) {
      updated = monthlyAttendance.map(m => m.month === monthStr ? { ...m, totalClasses: validatedClasses } : m);
    } else {
      updated = [...monthlyAttendance, { month: monthStr, totalClasses: validatedClasses, studentAttendance: {} }];
    }
    onUpdateAttendance(updated);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-layer-2000">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Classes Taken - {batch}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {months.map((month, idx) => {
            const monthStr = `${year}-${(idx + 1).toString().padStart(2, '0')}`;
            const data = monthlyAttendance.find(m => m.month === monthStr);
            const [y, m] = monthStr.split('-').map(Number);
            const daysInMonth = new Date(y, m, 0).getDate();
            return (
              <div key={month} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">{month} {year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-500">Total Classes:</label>
                  <input
                    type="number"
                    min="0"
                    max={daysInMonth}
                    value={data?.totalClasses || ''}
                    onChange={(e) => handleUpdateClasses(monthStr, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-20 px-3 py-1 rounded-lg border border-gray-200 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 transition">Done</button>
        </div>
      </motion.div>
    </div>
  );
}

