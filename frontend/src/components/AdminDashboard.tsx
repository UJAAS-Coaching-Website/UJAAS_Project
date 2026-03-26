import { useEffect, useState, useRef, lazy, Suspense, type ChangeEvent, type FormEvent } from 'react';
import { DashboardHeroSkeleton, StatCardSkeleton, TableRowsSkeleton, TestCardSkeleton, ProfileSkeleton, DashboardLoadingShell } from './ui/content-skeletons';
import { createPortal } from 'react-dom';
import { User, LandingData, Tab } from '../App';
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
  Phone,
  AlertTriangle,
  AlertCircle,
  Megaphone,
  Loader2
} from 'lucide-react';
import { ApiBatch } from '../api/batches';
const NoticesManagement = lazy(() => import('./NoticesManagement').then(m => ({ default: m.NoticesManagement })));
import { triggerReviewSession } from '../api/facultyReviews';
const StudentRating = lazy(() => import('./StudentRating').then(m => ({ default: m.StudentRating })));
const StudentRankingsEnhanced = lazy(() => import('./StudentRankingsEnhanced').then(m => ({ default: m.StudentRankingsEnhanced })));
const AdminProfile = lazy(() => import('./AdminProfile').then(m => ({ default: m.AdminProfile })));
import { MiniAvatar } from './MiniAvatar';
import { NotificationCenter, Notification } from './NotificationCenter';
import { Footer } from './Footer';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
const CreateTestSeries = lazy(() => import('./CreateTestSeries').then(m => ({ default: m.CreateTestSeries })));
import type { StudentPerformance } from './TestPerformanceInsights';
const TestPerformanceInsights = lazy(() => import('./TestPerformanceInsights').then(m => ({ default: m.TestPerformanceInsights })));
const TestPreviewAndReview = lazy(() => import('./TestPreviewAndReview').then(m => ({ default: m.TestPreviewAndReview })));
import { fetchTestAnalysis, fetchTests, forceTestLiveNow as apiForceTestLiveNow } from '../api/tests';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.svg';
import { BatchTimetableModal } from './BatchTimetableModal';
import { downloadFileFromUrl } from '../utils/downloads';
import { NotesManagementTab } from './NotesManagementTab';
import { uploadLandingImage, deleteLandingImage } from '../api/landing';
import { adminResetUserPassword } from '../api/auth';
import { generateInitialPassword } from '../utils/passwords';
import { getAttendanceRatingValue } from '../utils/profile';
import { withStoredRemarks, writeStoredRemarks } from '../utils/studentRemarks';
import { formatLinkSummary } from '../utils/subjectAlerts';
const AdminBatchSelectionTab = lazy(() => import('./admin/AdminDashboardSections').then(m => ({ default: m.AdminBatchSelectionTab })));
const AdminQueriesManagementTab = lazy(() => import('./admin/AdminDashboardSections').then(m => ({ default: m.AdminQueriesManagementTab })));
const AdminStudentsTab = lazy(() => import('./admin/AdminStudentsTab').then(m => ({ default: m.AdminStudentsTab })));
import { formatIndianMobileInput } from '../utils/phone';

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
  adminFaculties: import('../api/faculties').ApiFaculty[];
  onCreateFaculty: (data: import('../api/faculties').CreateFacultyPayload) => Promise<import('../api/faculties').ApiFaculty>;
  onUpdateFaculty: (id: string, data: Partial<import('../api/faculties').CreateFacultyPayload>) => Promise<import('../api/faculties').ApiFaculty>;
  onDeleteFaculty: (id: string) => Promise<void>;
  adminStudents: import('../api/students').ApiStudent[];
  onCreateStudent: (data: import('../api/students').CreateStudentPayload) => Promise<import('../api/students').ApiStudent>;
  onUpdateStudent: (id: string, data: import('../api/students').UpdateStudentPayload) => Promise<import('../api/students').ApiStudent>;
  onDeleteStudent: (id: string) => Promise<void>;
  onAssignStudentToBatch: (studentId: string, batchId: string) => Promise<import('../api/students').ApiStudent>;
  onRemoveStudentFromBatch: (studentId: string, batchId: string) => Promise<void>;
  onCreateBatch: (label: string, subjects?: string[], facultyAssigned?: string[]) => Promise<{ ok: boolean; error?: string; label?: string }>;
  onUpdateBatch: (label: string, subjects?: string[], facultyAssigned?: string[], oldLabel?: string) => Promise<{ ok: boolean; error?: string }>;
  onDeleteBatch: (label: string) => Promise<{ ok: boolean; error?: string }>;
  onUploadBatchTimetable: (batchId: string, file: File) => Promise<{ ok: boolean; error?: string; timetableUrl?: string | null }>;
  onDeleteBatchTimetable: (batchId: string) => Promise<{ ok: boolean; error?: string }>;
  onPermanentDeleteBatch: (label: string) => Promise<{ ok: boolean; error?: string }>;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  landingData: LandingData;
  onUpdateLandingData: (data: LandingData) => void;
  queries: import('../App').LandingQuery[];
  onUpdateQueries: (queries: import('../App').LandingQuery[]) => void;
  onDeleteQuery: (id: string) => Promise<void>;
  publishedTests: import('../App').PublishedTest[];
  onPublishTest: (test: Omit<import('../App').PublishedTest, 'id' | 'status'> & { id?: string; requiresSaveBeforePublish?: boolean }) => Promise<void> | void;
  onSaveDraft: (test: Omit<import('../App').PublishedTest, 'id' | 'status'> & { id?: string }) => Promise<string>;
  resumeDraftId: string | null;
  onClearResumeDraft: () => void;
  onResumeDraft: (testId: string) => void;
  onPreviewTest: (testId: string) => void;
  onUpdatePublishedTest: (testId: string, updates: Partial<import('../App').PublishedTest>) => void;
  onForceTestLiveNow?: (testId: string) => Promise<import('../App').PublishedTest>;
  onDeletePublishedTest: (testId: string) => void;
  selectedPreviewTest: import('../App').PublishedTest | null;
  subjectCatalog: import('../api/subjects').ApiSubject[];
  onRemoveSubjectFromBatch: (batchId: string, subjectId: string) => Promise<SubjectActionResult>;
  onRefreshFaculties: () => void;
  onSearchStudents?: (query: string) => void;
  isDataLoading?: boolean;
}

export type AdminTab = 'home' | 'students' | 'faculty' | 'content' | 'analytics' | 'test-series' | 'ratings' | 'rankings' | 'create-test' | 'create-dpp' | 'notices' | 'upload-notes' | 'profile' | 'add-student' | 'preview-test' | 'question-bank';
export type FacultyTab = 'home' | 'students' | 'content' | 'analytics' | 'test-series' | 'ratings' | 'rankings' | 'create-test' | 'create-dpp' | 'notices' | 'upload-notes' | 'profile' | 'add-student' | 'preview-test' | 'question-bank';
type Batch = string;
export type AdminSection = 'landing' | 'batches' | 'students' | 'faculty' | 'test-series' | 'queries';
export type FacultySection = 'batches' | 'students' | 'test-series';
type BatchInfo = { id?: string; label: string; slug: string; subjects?: string[]; facultyAssigned?: string[]; is_active?: boolean; studentCount?: number; testsConducted?: number; averagePerformance?: number; timetable_url?: string | null; };

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
    total_classes?: number;
    attendanceRating?: number;
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
  designation?: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  joinDate?: string;
}

type StudentFormState = {
  id?: string;
  name: string;
  rollNumber: string;
  batch: Batch;
  email: string;
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
  designation: string;
  phone: string;
  joinDate: string;
  rating: number;
  reviewCount: number;
  password?: string;
};

type SubjectActionResult = {
  ok: boolean;
  status: number;
  links?: Record<string, number>;
  message?: string;
  action?: "removed" | "deleted";
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
  adminFaculties,
  onCreateFaculty,
  onUpdateFaculty,
  onDeleteFaculty,
  adminStudents,
  onCreateStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAssignStudentToBatch,
  onRemoveStudentFromBatch,
  onCreateBatch,
  onUpdateBatch,
  onDeleteBatch,
  onUploadBatchTimetable,
  onDeleteBatchTimetable,
  onPermanentDeleteBatch,
  onLogout,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  landingData,
  onUpdateLandingData,
  queries,
  onUpdateQueries,
  onDeleteQuery,
  publishedTests,
  onPublishTest,
  onSaveDraft,
  resumeDraftId,
  onClearResumeDraft,
  onResumeDraft,
  onPreviewTest,
  onUpdatePublishedTest,
  onForceTestLiveNow,
  onDeletePublishedTest,
  selectedPreviewTest,
  subjectCatalog,
  onRemoveSubjectFromBatch,
  onRefreshFaculties,
  onSearchStudents,
  isDataLoading,
}: AdminDashboardProps) {
  // Convert API students to local Student[] format
  const apiToLocalStudent = (s: import('../api/students').ApiStudent): Student => {
    const subjectRatings = (s as any).subject_ratings || {};
    const subjectValues = Object.values(subjectRatings);
    const overallFromSubjects = subjectValues.length > 0
      ? subjectValues.reduce((acc: number, curr: any) => {
        const attendanceRating = getAttendanceRatingValue(curr.attendance, curr.total_classes, curr.attendanceRating);
        return acc + (attendanceRating + curr.tests + curr.dppPerformance + curr.behavior) / 4;
      }, 0) / subjectValues.length
      : null;

    return {
      id: s.id,
      name: s.name,
      rollNumber: s.roll_number,
      enrolledCourses: s.assigned_batch ? [s.assigned_batch.name] : [],
      joinDate: s.join_date || '',
      performance: 0,
      rating: overallFromSubjects ?? (s.rating_attendance + s.rating_assignments + s.rating_participation + s.rating_behavior) / 4,
      batch: s.assigned_batch?.name || 'Unassigned',
      email: s.login_id?.includes('@') ? s.login_id : '',
      phoneNumber: s.phone || '',
      dateOfBirth: s.date_of_birth || '',
      address: s.address || '',
      parentContact: s.parent_contact || '',
      subjectRatings,
      subjectRemarks: (s as any).subject_remarks || {},
      adminRemark: (s as any).admin_remark || '',
    };
  };

  const students = adminStudents.map(apiToLocalStudent);
  // Use adminFaculties prop directly, ensuring we format joining_date to joinDate
  const faculty: Faculty[] = adminFaculties.map((f: any) => ({
    id: f.id,
    name: f.name,
    email: f.email,
    subject: f.subject,
    designation: f.designation,
    phone: f.phone,
    rating: f.rating,
    reviewCount: Number(f.reviewCount ?? f.review_count ?? 0),
    joinDate: f.joining_date
  }));
  const subjectOptions = Array.from(new Set([
    ...batches.flatMap((batch) => batch.subjects ?? []),
    ...faculty.map((item) => item.subject),
  ]))
    .map((subject) => subject.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const [showFullTimetable, setShowFullTimetable] = useState(false);
  const [timeTableImage, setTimeTableImage] = useState<string | null>(null);
  const timeTableInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    document.documentElement.classList.add('scrollbar-hide');
    document.body.classList.add('scrollbar-hide');
    return () => {
      document.documentElement.classList.remove('scrollbar-hide');
      document.body.classList.remove('scrollbar-hide');
    };
  }, []);

  const [studentModal, setStudentModal] = useState<{ open: boolean; defaultBatch: Batch | null; initialData?: Student; title: string }>({
    open: false,
    defaultBatch: null,
    title: 'Add Student'
  });

  const [facultyModal, setFacultyModal] = useState<{ open: boolean; initialData?: Faculty; title: string; isEditing?: boolean }>({
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
  const [permanentDeleteModal, setPermanentDeleteModal] = useState<{
    open: boolean;
    batchLabel: Batch | null;
    submitting: boolean;
    error: string | null;
  }>({
    open: false,
    batchLabel: null,
    submitting: false,
    error: null,
  });

  const [queryModal, setQueryModal] = useState<{ open: boolean; query: import('../App').LandingQuery | null }>({
    open: false,
    query: null
  });

  const [performanceInsightsTestId, setPerformanceInsightsTestId] = useState<string | null>(null);

  const fallbackForceTestLiveNow = async (testId: string): Promise<import('../App').PublishedTest> => {
    const updated = await apiForceTestLiveNow(testId);
    const existing = publishedTests.find((test) => test.id === testId);

    const fallbackUpdatedTest: import('../App').PublishedTest = existing
      ? {
        ...existing,
        status: 'live',
        scheduleDate: updated.schedule_date || existing.scheduleDate,
        scheduleTime: updated.schedule_time || existing.scheduleTime,
      }
      : {
        id: updated.id,
        title: updated.title,
        format: updated.format || 'Custom',
        batches: updated.batches.map((batch) => batch.name),
        duration: updated.duration_minutes,
        totalMarks: updated.total_marks,
        questionCount: updated.question_count,
        enrolledCount: updated.enrolled_count,
        scheduleDate: updated.schedule_date || '',
        scheduleTime: updated.schedule_time || '',
        questions: [],
        instructions: updated.instructions || undefined,
        status: updated.status,
        submittedAttemptCount: updated.submitted_attempt_count,
        maxAttempts: updated.submitted_attempt_count !== undefined ? 3 : undefined,
        hasActiveAttempt: updated.has_active_attempt,
        activeAttemptId: updated.active_attempt_id ?? null,
        latestAttemptId: updated.latest_attempt_id ?? null,
        latestAttemptSubmittedAt: updated.latest_attempt_submitted_at ?? null,
        latestAttemptTimeSpent: updated.latest_attempt_time_spent ?? null,
      };

    return fallbackUpdatedTest;
  };

  // Remarks are stored locally; load from localStorage
  useEffect(() => {
    // Apply stored remarks to students rendered from API
  }, [adminStudents]);

  const selectedBatchInfo = selectedBatch
    ? batches.find((batch) => batch.label === selectedBatch)
    : null;

  useEffect(() => {
    setTimeTableImage(selectedBatchInfo?.timetable_url ?? null);
  }, [selectedBatchInfo?.timetable_url]);

  const handleTimeTableUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBatchInfo?.id) return;
    const result = await onUploadBatchTimetable(selectedBatchInfo.id, file);
    if (result.ok) {
      setTimeTableImage(result.timetableUrl ?? null);
    } else {
      window.alert(result.error ?? 'Failed to upload timetable.');
    }
  };

  const handleTimeTableDelete = async () => {
    if (!selectedBatchInfo?.id) return;
    if (window.confirm('Are you sure you want to delete the timetable?')) {
      const result = await onDeleteBatchTimetable(selectedBatchInfo.id);
      if (result.ok) {
        setTimeTableImage(null);
        setShowFullTimetable(false);
      } else {
        window.alert(result.error ?? 'Failed to delete timetable.');
      }
    }
  };

  const openAddStudent = (batch: Batch | null) => setStudentModal({ open: true, defaultBatch: batch, title: 'Add Student' });
  const openEditStudent = (student: Student) => setStudentModal({ open: true, defaultBatch: student.batch, initialData: student, title: 'Edit Student' });
  const closeStudentModal = () => setStudentModal({ ...studentModal, open: false });

  const openAddFaculty = () => setFacultyModal({ open: true, title: 'Add Faculty', isEditing: true });
  const openEditFaculty = (faculty: Faculty) => setFacultyModal({ open: true, initialData: faculty, title: 'Edit Faculty', isEditing: true });
  const closeFacultyModal = () => setFacultyModal({ ...facultyModal, open: false });

  const openAddBatch = () => setBatchModal({ open: true, mode: 'create' });
  const openEditBatch = (label: string) => setBatchModal({ open: true, mode: 'edit', batchLabel: label });
  const closeBatchModal = () => setBatchModal({ ...batchModal, open: false });
  const openPermanentDeleteModal = (label: Batch) =>
    setPermanentDeleteModal({ open: true, batchLabel: label, submitting: false, error: null });
  const closePermanentDeleteModal = () => {
    setPermanentDeleteModal((prev) =>
      prev.submitting
        ? prev
        : { open: false, batchLabel: null, submitting: false, error: null }
    );
  };

  const handlePermanentDeleteBatch = async () => {
    const batchLabel = permanentDeleteModal.batchLabel;
    if (!batchLabel) return;

    setPermanentDeleteModal((prev) => ({ ...prev, submitting: true, error: null }));
    const result = await onPermanentDeleteBatch(batchLabel);

    if (result.ok) {
      setPermanentDeleteModal({ open: false, batchLabel: null, submitting: false, error: null });
      onClearBatch();
      return;
    }

    setPermanentDeleteModal((prev) => ({
      ...prev,
      submitting: false,
      error: result.error ?? 'Unable to delete batch permanently.',
    }));
  };

  const handleQueryStatusChange = (id: string, status: 'new' | 'seen' | 'contacted') => {
    onUpdateQueries(queries.map(q => q.id === id ? { ...q, status } : q));
    if (queryModal.query?.id === id) {
      setQueryModal(prev => ({ ...prev, query: prev.query ? { ...prev.query, status } : null }));
    }
  };

  const openQueryDetails = (query: import('../App').LandingQuery) => {
    setQueryModal({ open: true, query });
    // Auto-change status from 'new' to 'seen' when viewed
    if (query.status === 'new') {
      handleQueryStatusChange(query.id, 'seen');
    }
  };
  const closeQueryDetails = () => setQueryModal({ open: false, query: null });

  // Track which "new" query IDs admin has already seen
  const [seenQueryIds, setSeenQueryIds] = useState<Set<string>>(new Set());
  const unseenNewCount = queries.filter(q => q.status === 'new' && !seenQueryIds.has(q.id)).length;

  // Mark all current new queries as seen when admin visits queries tab
  useEffect(() => {
    if (adminSection === 'queries') {
      const newIds = queries.filter(q => q.status === 'new').map(q => q.id);
      if (newIds.length > 0) {
        setSeenQueryIds(prev => {
          const next = new Set(prev);
          newIds.forEach(id => next.add(id));
          return next;
        });
      }
    }
  }, [adminSection, queries]);

  const handleDeleteQuery = async (id: string) => {
    if (confirm('Are you sure you want to delete this query?')) {
      await onDeleteQuery(id);
      if (queryModal.query?.id === id) closeQueryDetails();
    }
  };

  const handleSaveStudent = async (data: StudentFormState) => {
    try {
      if (data.id) {
        // Find the batch ID for the selected batch name
        const batchInfo = batches.find(b => b.label === data.batch);
        const apiStudent = adminStudents.find(s => s.id === data.id);

        await onUpdateStudent(data.id, {
          name: data.name,
          rollNumber: data.rollNumber,
          phone: data.phoneNumber,
          address: data.address,
          dateOfBirth: data.dateOfBirth,
          parentContact: data.parentContact,
        });

        // Handle batch change for the single-batch model
        if (apiStudent) {
          const currentBatchId = apiStudent.assigned_batch?.id;
          const nextBatchId = batchInfo?.id;

          if (currentBatchId && currentBatchId !== nextBatchId) {
            await onRemoveStudentFromBatch(data.id, currentBatchId);
          }

          if (nextBatchId && currentBatchId !== nextBatchId) {
            await onAssignStudentToBatch(data.id, nextBatchId);
          }
        }
      } else {
        // Find the batch ID for assignment
        const batchInfo = batches.find(b => b.label === data.batch);
        const createdStudent = await onCreateStudent({
          name: data.name,
          rollNumber: data.rollNumber,
          email: data.email.trim() || undefined,
          phone: data.phoneNumber,
          address: data.address,
          dateOfBirth: data.dateOfBirth,
          parentContact: data.parentContact,
          batchId: batchInfo?.id,
        });
        const initialPassword = generateInitialPassword(data.name);
        const loginId = (createdStudent as any)?.login_id || data.rollNumber || 'Not provided';
        window.alert(`New Student added successfully!\n\nName: ${data.name}\nLogin ID: ${loginId}\nInitial Password: ${initialPassword}`);
      }
    } catch (error: any) {
      window.alert(`Error: ${error.message || 'Failed to save student'}`);
    }
    closeStudentModal();
  };

  const handleSaveFaculty = async (data: FacultyFormState) => {
    try {
      if (data.id) {
        await onUpdateFaculty(data.id, {
          name: data.name,
          email: data.email,
          subject: data.subject,
          designation: data.designation,
          phone: data.phone,
          joinDate: data.joinDate,
        });
      } else {
        await onCreateFaculty({
          name: data.name,
          email: data.email,
          subject: data.subject,
          designation: data.designation,
          phone: data.phone,
          joinDate: data.joinDate,
          password: data.password
        } as any);
        const loginId = data.email || 'Not provided';
        window.alert(`New Faculty added successfully!\n\nName: ${data.name}\nLogin ID: ${loginId}\nPassword: ${data.password}`);
      }
    } catch (error: any) {
      window.alert(`Error: ${error.message || 'Failed to save faculty'}`);
    }
    closeFacultyModal();
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await onDeleteStudent(id);
      } catch (error: any) {
        window.alert(`Error deleting student: ${error.message}`);
      }
    }
  };

  const handleRemoveStudentFromBatch = async (id: string, batch: Batch): Promise<void> => {
    if (window.confirm('Remove this student from the current batch?')) {
      try {
        const batchInfo = batches.find(b => b.label === batch);
        if (batchInfo?.id) {
          await onRemoveStudentFromBatch(id, batchInfo.id);
        }
      } catch (error: any) {
        window.alert(`Error removing student from batch: ${error.message}`);
      }
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this faculty?')) {
      try {
        await onDeleteFaculty(id);
      } catch (error: any) {
        window.alert(`Error deleting faculty: ${error.message}`);
      }
    }
  };

  const openBatchStudentPicker = (batch: Batch) => setBatchStudentPicker({ open: true, batch });
  const closeBatchStudentPicker = () => setBatchStudentPicker({ open: false, batch: null });
  const handleAssignExistingStudentToBatch = async (studentId: string, batch: Batch) => {
    try {
      const batchInfo = batches.find(b => b.label === batch);
      if (batchInfo?.id) {
        await onAssignStudentToBatch(studentId, batchInfo.id);
      }
    } catch (error: any) {
      window.alert(`Error assigning student to batch: ${error.message}`);
    }
  };

  const [ratingModal, setRatingModal] = useState<{ open: boolean; student?: Student }>({
    open: false,
  });

  const openStudentRatings = (student: Student) => setRatingModal({ open: true, student });
  const closeStudentRatings = () => setRatingModal({ open: false });
  const handleSaveStudentProfile = async (
    studentId: string,
    updates: Pick<Student, 'name' | 'phoneNumber' | 'dateOfBirth' | 'parentContact' | 'address'>
  ) => {
    try {
      await onUpdateStudent(studentId, {
        name: updates.name,
        phone: updates.phoneNumber,
        dateOfBirth: updates.dateOfBirth,
        parentContact: updates.parentContact,
        address: updates.address
      });
      setRatingModal((prev) => (prev.student?.id === studentId ? { ...prev, student: { ...prev.student, ...updates } } : prev));
    } catch (error: any) {
      window.alert(`Error updating student: ${error.message}`);
    }
  };
  const handleSaveAdminRemark = async (studentId: string, remark: string) => {
    const cleanedRemark = remark.trim();
    try {
      // We don't have a direct field for adminRemark in our UpdateStudentPayload yet, 
      // but we can store it in the local storage bridge we have.
      setRatingModal((prev) =>
        prev.student?.id === studentId
          ? { ...prev, student: { ...prev.student, adminRemark: cleanedRemark } }
          : prev
      );
      writeStoredRemarks(studentId, { adminRemark: cleanedRemark });
    } catch (error: any) {
      console.error(error);
    }
  };

  useBodyScrollLock(
    studentModal.open ||
    facultyModal.open ||
    batchModal.open ||
    batchStudentPicker.open ||
    ratingModal.open ||
    queryModal.open ||
    permanentDeleteModal.open ||
    showFullTimetable
  );

  return (
    <div className="footer-reveal-page footer-reveal-page--nav min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col pt-16">
      {/* Navigation */}

      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-layer-navbar shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Branding */}
            <motion.button
              onClick={onClearBatch}
              className="flex items-center gap-3"
            >
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <span className="navbar-brand-wordmark hidden text-xl sm:inline" style={{ color: 'rgb(159, 29, 14)' }}>
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
                    className={`relative flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${(adminSection === section.id || (section.id === 'test-series' && (activeTab === 'test-series' || activeTab === 'create-test'))) && activeTab !== 'profile'
                      ? 'bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <section.icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{section.label}</span>
                    {section.id === 'queries' && unseenNewCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
                      >
                        {unseenNewCount > 9 ? '9+' : unseenNewCount}
                      </motion.span>
                    )}
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
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${activeTab === tab.id && activeTab !== 'profile'
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
                onClick={() => onNavigate('profile')}
                className="p-0 border-none bg-transparent"
                title="View Profile"
              >
                <MiniAvatar user={user} className="w-10 h-10" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`footer-reveal-main w-full flex-grow ${performanceInsightsTestId ? 'max-w-none mx-0 px-0 py-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        <motion.div
          key={`${selectedBatch || adminSection}-${activeTab}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Layered Rendering Logic */}
          <Suspense fallback={
            activeTab === 'home' || adminSection === 'batches' ? <StatCardSkeleton /> :
              activeTab === 'students' || adminSection === 'students' ? <TableRowsSkeleton /> :
                (activeTab === 'test-series' || adminSection === 'test-series') ? <TestCardSkeleton /> :
                  <DashboardHeroSkeleton />
          }>
            {activeTab === 'create-test' ? (
              <CreateTestSeries
                onBack={() => { onClearResumeDraft(); onNavigate('test-series'); }}
                batches={batches.filter((batch) => batch.is_active)}
                onPublish={onPublishTest}
                onSaveDraft={onSaveDraft}
                resumeTest={resumeDraftId ? publishedTests.find(t => t.id === resumeDraftId) : undefined}
              />
            ) : performanceInsightsTestId ? (
              <div className="fixed inset-0 bg-white overflow-y-auto scrollbar-hide z-layer-10002">
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
                      onClose={() => setPerformanceInsightsTestId(null)}
                    />
                  );
                })()}
              </div>
            ) : activeTab === 'preview-test' && selectedPreviewTest ? (
              <div className="fixed inset-0 bg-white overflow-y-auto scrollbar-hide z-layer-10002">
                <TestPreviewAndReview
                  testId={selectedPreviewTest.id}
                  testTitle={selectedPreviewTest.title}
                  duration={selectedPreviewTest.duration}
                  questions={selectedPreviewTest.questions}
                  onSubmit={() => onNavigate('test-series')}
                  onExit={() => onNavigate('test-series')}
                  onSave={async (testId, updatedQuestions, updatedTitle, updatedBatches) => {
                    await onUpdatePublishedTest(testId, {
                      questions: updatedQuestions,
                      title: updatedTitle,
                      batches: updatedBatches
                    });
                  }}
                  isPreview={true}
                  availableBatches={batches.filter((batch) => batch.is_active)}
                  initialBatches={selectedPreviewTest.batches}
                />
              </div>
            ) : activeTab === 'profile' ? (
              <Suspense fallback={<ProfileSkeleton />}>
                <AdminProfile user={user} onLogout={onLogout} />
              </Suspense>
            ) : activeTab === 'notices' ? (
              <NoticesManagement
                batches={batches.map((b) => ({
                  id: b.id || '',
                  name: b.label,
                  slug: b.slug,
                  is_active: b.is_active !== false,
                  subjects: b.subjects,
                }) as ApiBatch)}
                userRole="admin"
                onBack={() => onNavigate('home')}
              />
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
                  <AdminBatchSelectionTab
                    batches={batches}
                    onSelectBatch={onSelectBatch}
                    onAddBatch={openAddBatch}
                    onOpenNotices={() => onNavigate('notices')}
                  />
                )}
                {adminSection === 'students' && (
                  <AdminStudentsTab
                    batches={batches}
                    onViewStudent={openStudentRatings}
                  />
                )}
                {adminSection === 'faculty' && (
                  <FacultyDirectoryTab
                    faculty={faculty}
                    onAddFaculty={openAddFaculty}
                    onViewFaculty={(f) => setFacultyModal({ open: true, initialData: f, title: 'Faculty Details' })}
                    onEditFaculty={openEditFaculty}
                    onDeleteFaculty={handleDeleteFaculty}
                    onRefreshFaculty={onRefreshFaculties}
                  />
                )}
                {adminSection === 'test-series' && (
                  <TestSeriesManagementTab
                    onNavigate={onNavigate}
                    selectedBatch={null as unknown as Batch}
                    onChangeBatch={() => { }}
                    publishedTests={publishedTests}
                    onPreviewTest={onPreviewTest}
                    onViewInsights={(testId) => setPerformanceInsightsTestId(testId)}
                    onDeletePublishedTest={onDeletePublishedTest}
                    onForceTestLiveNow={onForceTestLiveNow ?? fallbackForceTestLiveNow}
                    onResumeDraft={onResumeDraft}
                  />
                )}
                {adminSection === 'queries' && (
                  <AdminQueriesManagementTab
                    queries={queries}
                    onViewQuery={openQueryDetails}
                    onDeleteQuery={handleDeleteQuery}
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
                    onPermanentDeleteBatch={openPermanentDeleteModal}
                    students={students}
                    faculty={faculty}
                    batches={batches}
                    onNavigate={onNavigate}
                    onClearBatch={onClearBatch}
                    onViewTimetable={() => setShowFullTimetable(true)}
                    onUpdateBatch={onUpdateBatch}
                    subjectCatalog={subjectCatalog}
                    onRemoveSubjectFromBatch={onRemoveSubjectFromBatch}
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
                    isBatchActive={batches.find((batch) => batch.label === selectedBatch)?.is_active !== false}
                  />
                )}
                {activeTab === 'ratings' && <StudentRating students={students.filter((student) => student.batch === selectedBatch)} />}
                {activeTab === 'rankings' && <StudentRankingsEnhanced />}
              </>

            )}
          </Suspense>
        </motion.div>
      </main>

      {/* Footer */}
      {activeTab !== 'preview-test' && <Footer />}

      {/* Modals */}
      <div className="relative z-layer-modal">
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
          isInitialEditing={facultyModal.isEditing}
          subjectOptions={subjectOptions}
        />

        <BatchFormModal
          open={batchModal.open}
          mode={batchModal.mode}
          batches={batches}
          faculty={faculty}
          subjectCatalog={subjectCatalog}
          batchLabel={batchModal.batchLabel}
          onClose={closeBatchModal}
          onCreateBatch={onCreateBatch}
          onUpdateBatch={onUpdateBatch}
          onDeleteBatch={onDeleteBatch}
          onRemoveSubjectFromBatch={onRemoveSubjectFromBatch}
        />
        <PermanentDeleteBatchModal
          open={permanentDeleteModal.open}
          batchLabel={permanentDeleteModal.batchLabel}
          submitting={permanentDeleteModal.submitting}
          error={permanentDeleteModal.error}
          onClose={closePermanentDeleteModal}
          onConfirm={handlePermanentDeleteBatch}
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
              batches={batches}
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
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col mx-4"
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
                <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide max-h-[70vh]">
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
                        <Mail className="w-4 h-4 text-cyan-600" /> {queryModal.query.email}
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
                      <div className="flex flex-wrap gap-2">
                        {(['seen', 'contacted'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleQueryStatusChange(queryModal.query!.id, s)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${queryModal.query?.status === s
                                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
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
        <BatchTimetableModal
          open={showFullTimetable}
          onClose={() => setShowFullTimetable(false)}
          imageUrl={timeTableImage}
          onDownload={timeTableImage ? () => {
            void downloadFileFromUrl(timeTableImage, 'timetable');
          } : null}
          emptyStateAction={(
            <button
              onClick={() => timeTableInputRef.current?.click()}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition"
            >
              Upload Now
            </button>
          )}
          footerStart={(
            <>
              <input
                type="file"
                ref={timeTableInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleTimeTableUpload}
              />
              <button
                onClick={() => timeTableInputRef.current?.click()}
                className="px-4 py-2 bg-teal-50 text-teal-600 rounded-xl font-bold hover:bg-teal-100 transition text-sm"
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
            </>
          )}
        />
      </div>
    </div>
  );
}

// SUB-COMPONENTS

function LandingManagementTab({ data, onUpdate }: { data: LandingData; onUpdate: (data: LandingData) => void | Promise<void> }) {
  const [activeSubSection, setActiveSubSection] = useState<'overview' | 'courses' | 'faculty' | 'achievers' | 'visions'>('overview');
  const [newCourse, setNewCourse] = useState('');
  const [isAddingFaculty, setIsAddingFaculty] = useState(false);
  const [editingFacultyIndex, setEditingFacultyIndex] = useState<number | null>(null);
  const [isAddingAchiever, setIsAddingAchiever] = useState(false);
  const [isAddingVision, setIsAddingVision] = useState(false);
  const [editingVisionIndex, setEditingVisionIndex] = useState<number | null>(null);
  const maxImageUploadSizeBytes = 600 * 1024;
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const saveStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActionPending = (action: string) => pendingAction === action;
  const isActionInFlight = pendingAction !== null;
  const subjectOptions = Array.from(new Set([
    ...(data.courses || []).map((c) => c.name),
    ...(data.faculty || []).map((f) => f.subject),
  ]))
    .map((subject) => subject.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const [newFacultyImageFile, setNewFacultyImageFile] = useState<File | null>(null);
  const [newFacultyPreview, setNewFacultyPreview] = useState<string>('');
  const newFacultyInputRef = useRef<HTMLInputElement>(null);

  const [editFacultyImageFile, setEditFacultyImageFile] = useState<File | null>(null);
  const [editFacultyPreview, setEditFacultyPreview] = useState<string>('');
  const [editFacultyImageRemoved, setEditFacultyImageRemoved] = useState(false);
  const editFacultyInputRef = useRef<HTMLInputElement>(null);

  const [newAchieverImageFile, setNewAchieverImageFile] = useState<File | null>(null);
  const [newAchieverPreview, setNewAchieverPreview] = useState<string>('');
  const newAchieverInputRef = useRef<HTMLInputElement>(null);

  const [newVisionImageFile, setNewVisionImageFile] = useState<File | null>(null);
  const [newVisionPreview, setNewVisionPreview] = useState<string>('');
  const newVisionInputRef = useRef<HTMLInputElement>(null);

  const [editVisionImageFile, setEditVisionImageFile] = useState<File | null>(null);
  const [editVisionPreview, setEditVisionPreview] = useState<string>('');
  const [editVisionImageRemoved, setEditVisionImageRemoved] = useState(false);
  const editVisionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (newFacultyPreview.startsWith('blob:')) URL.revokeObjectURL(newFacultyPreview);
      if (editFacultyPreview.startsWith('blob:')) URL.revokeObjectURL(editFacultyPreview);
      if (newAchieverPreview.startsWith('blob:')) URL.revokeObjectURL(newAchieverPreview);
      if (newVisionPreview.startsWith('blob:')) URL.revokeObjectURL(newVisionPreview);
      if (editVisionPreview.startsWith('blob:')) URL.revokeObjectURL(editVisionPreview);
    };
  }, [newFacultyPreview, editFacultyPreview, newAchieverPreview, newVisionPreview, editVisionPreview]);

  useEffect(() => {
    if (!isAddingFaculty) {
      setNewFacultyImageFile(null);
      setNewFacultyPreview('');
    }
  }, [isAddingFaculty]);

  useEffect(() => {
    if (!isAddingAchiever) {
      setNewAchieverImageFile(null);
      setNewAchieverPreview('');
    }
  }, [isAddingAchiever]);

  useEffect(() => {
    if (!isAddingVision) {
      setNewVisionImageFile(null);
      setNewVisionPreview('');
    }
  }, [isAddingVision]);

  useEffect(() => {
    if (editingFacultyIndex === null) {
      setEditFacultyImageFile(null);
      setEditFacultyPreview('');
      setEditFacultyImageRemoved(false);
      return;
    }
    setEditFacultyImageFile(null);
    setEditFacultyImageRemoved(false);
    setEditFacultyPreview(data.faculty[editingFacultyIndex]?.image || '');
  }, [editingFacultyIndex, data.faculty]);

  useEffect(() => {
    if (editingVisionIndex === null) {
      setEditVisionImageFile(null);
      setEditVisionPreview('');
      setEditVisionImageRemoved(false);
      return;
    }
    setEditVisionImageFile(null);
    setEditVisionImageRemoved(false);
    setEditVisionPreview(data.visions[editingVisionIndex]?.image || '');
  }, [editingVisionIndex, data.visions]);

  const runLandingAction = async <T,>(action: string, task: () => Promise<T>) => {
    setPendingAction(action);
    try {
      return await task();
    } finally {
      setPendingAction((current) => (current === action ? null : current));
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
    setSaveStatus({ type, message });
    saveStatusTimer.current = setTimeout(() => setSaveStatus(null), 3000);
  };

  const safeUpdate = async (newData: LandingData) => {
    setIsSaving(true);
    try {
      await onUpdate(newData);
      showToast('success', 'Changes saved to database!');
      return true;
    } catch {
      showToast('error', 'Failed to save. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

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

  const uploadAndGetUrl = async (file: File, itemRole: 'faculty' | 'achiever' | 'vision'): Promise<string | null> => {
    if (!file) return null;
    if (file.size > maxImageUploadSizeBytes) {
      window.alert('Image is too large. Please upload an image smaller than 600 KB.');
      return null;
    }

    setIsSaving(true);
    try {
      return await uploadLandingImage(file, itemRole);
    } catch (error: any) {
      window.alert(`Upload failed: ${error.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const conditionallyDeleteImage = async (url: string) => {
    if (url && url.includes('/landing-page/')) {
      try {
        await deleteLandingImage(url);
      } catch (e) {
        console.warn('Failed to clean up old image:', e);
      }
    }
  };

  const handleAddCourse = async (e: FormEvent) => {
    e.preventDefault();
    if (newCourse.trim()) {
      const courseName = newCourse.trim();
      const saved = await runLandingAction('add-course', () =>
        safeUpdate({ ...data, courses: [...data.courses, { id: '', name: courseName }] })
      );
      if (saved) {
        setNewCourse('');
      }
    }
  };

  const handleRemoveCourse = async (index: number) => {
    await runLandingAction('remove-course', () =>
      safeUpdate({ ...data, courses: data.courses.filter((_, i) => i !== index) })
    );
  };

  const handleAddFaculty = async (e: FormEvent) => {
    e.preventDefault();
    await runLandingAction('add-faculty', async () => {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const file = newFacultyImageFile;
      if (!file) {
        window.alert('Please upload an image.');
        return false;
      }
      const url = await uploadAndGetUrl(file, 'faculty');
      if (url === null) return false;

      const saved = await safeUpdate({
        ...data,
        faculty: [...data.faculty, {
          name: formData.get('name') as string,
          subject: formData.get('subject') as string,
          designation: formData.get('designation') as string,
          experience: formData.get('experience') as string,
          image: url
        }]
      });
      if (saved) {
        setIsAddingFaculty(false);
        setNewFacultyImageFile(null);
        setNewFacultyPreview('');
      }
      return saved;
    });
  };

  const handleSaveEditedFaculty = async (e: FormEvent) => {
    e.preventDefault();
    if (editingFacultyIndex === null) return;
    await runLandingAction('update-faculty', async () => {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const existing = data.faculty[editingFacultyIndex].image;

      let url = existing;
      if (editFacultyImageRemoved && !editFacultyImageFile) {
        window.alert('Please upload a new image.');
        return false;
      }
      if (editFacultyImageFile) {
        const uploaded = await uploadAndGetUrl(editFacultyImageFile, 'faculty');
        if (uploaded === null) return false;
        url = uploaded;
        await conditionallyDeleteImage(existing);
      }

      const next = [...data.faculty];
      next[editingFacultyIndex] = {
        name: formData.get('name') as string,
        subject: formData.get('subject') as string,
        designation: formData.get('designation') as string,
        experience: formData.get('experience') as string,
        image: url
      };
      const saved = await safeUpdate({ ...data, faculty: next });
      if (saved) {
        setEditingFacultyIndex(null);
        setEditFacultyImageFile(null);
        setEditFacultyPreview('');
        setEditFacultyImageRemoved(false);
      }
      return saved;
    });
  };

  const handleAddAchiever = async (e: FormEvent) => {
    e.preventDefault();
    await runLandingAction('add-achiever', async () => {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const file = newAchieverImageFile;
      if (!file) {
        window.alert('Please upload an image.');
        return false;
      }
      const url = await uploadAndGetUrl(file, 'achiever');
      if (url === null) return false;

      const saved = await safeUpdate({
        ...data,
        achievers: [...data.achievers, {
          name: formData.get('name') as string,
          achievement: formData.get('achievement') as string,
          year: formData.get('year') as string,
          image: url
        }]
      });
      if (saved) {
        setIsAddingAchiever(false);
        setNewAchieverImageFile(null);
        setNewAchieverPreview('');
      }
      return saved;
    });
  };

  const handleAddVision = async (e: FormEvent) => {
    e.preventDefault();
    await runLandingAction('add-vision', async () => {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const file = newVisionImageFile;
      if (!file) {
        window.alert('Please upload an image.');
        return false;
      }
      const url = await uploadAndGetUrl(file, 'vision');
      if (url === null) return false;

      const saved = await safeUpdate({
        ...data,
        visions: [...(data.visions || []), {
          id: `v-${Date.now()}`,
          name: formData.get('name') as string,
          designation: formData.get('designation') as string,
          vision: formData.get('vision') as string,
          image: url
        }]
      });
      if (saved) {
        setIsAddingVision(false);
        setNewVisionImageFile(null);
        setNewVisionPreview('');
      }
      return saved;
    });
  };

  const handleSaveEditedVision = async (e: FormEvent) => {
    e.preventDefault();
    if (editingVisionIndex === null) return;
    await runLandingAction('update-vision', async () => {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const existing = data.visions[editingVisionIndex].image;

      let url = existing;
      if (editVisionImageRemoved && !editVisionImageFile) {
        window.alert('Please upload a new image.');
        return false;
      }
      if (editVisionImageFile) {
        const uploaded = await uploadAndGetUrl(editVisionImageFile, 'vision');
        if (uploaded === null) return false;
        url = uploaded;
        await conditionallyDeleteImage(existing);
      }

      const next = [...data.visions];
      next[editingVisionIndex] = {
        ...next[editingVisionIndex],
        name: formData.get('name') as string,
        designation: formData.get('designation') as string,
        vision: formData.get('vision') as string,
        image: url
      };
      const saved = await safeUpdate({ ...data, visions: next });
      if (saved) {
        setEditingVisionIndex(null);
        setEditVisionImageFile(null);
        setEditVisionPreview('');
        setEditVisionImageRemoved(false);
      }
      return saved;
    });
  };

  if (activeSubSection === 'courses') {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setActiveSubSection('overview')} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
          <h2 className="text-3xl font-bold text-gray-900">Manage Courses</h2>
        </div>
        <form onSubmit={handleAddCourse} className="flex gap-4 mb-8">
          <input type="text" value={newCourse} onChange={(e) => setNewCourse(e.target.value)} placeholder="Course name..." className="flex-1 px-4 py-3 rounded-xl border border-gray-200" disabled={isActionInFlight} />
          <button type="submit" disabled={isActionInFlight} className="px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70"><Plus className="w-5 h-5" />{isActionPending('add-course') ? 'Adding...' : 'Add'}</button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.courses.map((c, i) => (
            <div key={c.id || i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group">
              <span className="font-medium text-gray-700">{c.name}</span>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to remove the course "${c.name}"?`)) {
                    void handleRemoveCourse(i);
                  }
                }}
                disabled={isActionInFlight}
                className="p-2 text-red-500 opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
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
          <button onClick={() => { setIsAddingFaculty(!isAddingFaculty); setEditingFacultyIndex(null); }} disabled={isActionInFlight} className="px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70">
            {isAddingFaculty ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {isAddingFaculty ? 'Cancel' : 'Add Faculty'}
          </button>
        </div>
        {isAddingFaculty && (
          <form onSubmit={handleAddFaculty} className="bg-gray-50 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" required placeholder="Name" className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <input
              name="subject"
              required
              placeholder="Subject"
              className="px-4 py-2 rounded-lg border border-gray-200"
              disabled={isActionInFlight}
            />
            <input name="designation" required placeholder="Designation" className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <input name="experience" required placeholder="Experience" className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Faculty Image</label>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center rounded-xl border border-dashed border-gray-200 bg-white p-4">
                {newFacultyPreview ? (
                  <img src={newFacultyPreview} alt="Faculty preview" className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => newFacultyInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold shadow-md hover:shadow-lg transition"
                    disabled={isActionInFlight}
                  >
                    {newFacultyPreview ? 'Change Image' : 'Upload Image'}
                  </button>
                  {newFacultyPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        if (newFacultyPreview.startsWith('blob:')) URL.revokeObjectURL(newFacultyPreview);
                        setNewFacultyPreview('');
                        setNewFacultyImageFile(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                      disabled={isActionInFlight}
                    >
                      Remove Image
                    </button>
                  )}
                  {!newFacultyPreview && (
                    <p className="text-xs text-gray-500">Image is required.</p>
                  )}
                </div>
              </div>
              <input
                ref={newFacultyInputRef}
                name="imageFile"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) return;
                  if (file.size > maxImageUploadSizeBytes) {
                    window.alert('Image is too large. Please upload an image smaller than 600 KB.');
                    e.currentTarget.value = '';
                    return;
                  }
                  if (newFacultyPreview.startsWith('blob:')) URL.revokeObjectURL(newFacultyPreview);
                  setNewFacultyImageFile(file);
                  setNewFacultyPreview(URL.createObjectURL(file));
                }}
                disabled={isActionInFlight}
              />
            </div>
            <button type="submit" disabled={isActionInFlight} className="md:col-span-2 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70">{isActionPending('add-faculty') ? 'Adding Faculty...' : 'Save'}</button>
          </form>
        )}
        {editingFacultyIndex !== null && (
          <form onSubmit={handleSaveEditedFaculty} className="bg-teal-50 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" required defaultValue={data.faculty[editingFacultyIndex].name} className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <input
              name="subject"
              required
              defaultValue={data.faculty[editingFacultyIndex].subject}
              className="px-4 py-2 rounded-lg border border-gray-200"
              disabled={isActionInFlight}
            />
            <input name="designation" required defaultValue={data.faculty[editingFacultyIndex].designation} className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <input name="experience" required defaultValue={data.faculty[editingFacultyIndex].experience} className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Faculty Image</label>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center rounded-xl border border-dashed border-gray-200 bg-white p-4">
                {!editFacultyPreview && !editFacultyImageRemoved ? (
                  <div className="w-24 h-24 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                ) : editFacultyPreview ? (
                  <img src={editFacultyPreview} alt="Faculty preview" className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    Image removed
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => editFacultyInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold shadow-md hover:shadow-lg transition"
                    disabled={isActionInFlight}
                  >
                    {editFacultyPreview ? 'Change Image' : 'Upload Image'}
                  </button>
                  {editFacultyPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditFacultyImageRemoved(true);
                        setEditFacultyPreview('');
                        setEditFacultyImageFile(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                      disabled={isActionInFlight}
                    >
                      Remove Image
                    </button>
                  )}
                  {editFacultyImageRemoved && (
                    <p className="text-xs text-red-500">Please upload a new image to continue.</p>
                  )}
                </div>
              </div>
              <input
                ref={editFacultyInputRef}
                name="imageFile"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) return;
                  if (file.size > maxImageUploadSizeBytes) {
                    window.alert('Image is too large. Please upload an image smaller than 600 KB.');
                    e.currentTarget.value = '';
                    return;
                  }
                  if (editFacultyPreview.startsWith('blob:')) URL.revokeObjectURL(editFacultyPreview);
                  setEditFacultyImageFile(file);
                  setEditFacultyPreview(URL.createObjectURL(file));
                  setEditFacultyImageRemoved(false);
                }}
                disabled={isActionInFlight}
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={isActionInFlight} className="flex-1 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70">{isActionPending('update-faculty') ? 'Updating...' : 'Update'}</button>
              <button type="button" onClick={() => setEditingFacultyIndex(null)} disabled={isActionInFlight} className="flex-1 py-3 bg-gray-200 rounded-xl disabled:cursor-not-allowed disabled:opacity-70">Cancel</button>
            </div>
          </form>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.faculty.map((m, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 relative group">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingFacultyIndex(i); setIsAddingFaculty(false); }} disabled={isActionInFlight} className="p-2 bg-blue-50 text-blue-500 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"><Edit className="w-4 h-4" /></button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove ${m.name} from faculty?`)) {
                      void runLandingAction('remove-faculty', () => safeUpdate({ ...data, faculty: data.faculty.filter((_, idx) => idx !== i) }));
                    }
                  }}
                  disabled={isActionInFlight}
                  className="p-2 bg-red-50 text-red-500 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
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
          <button onClick={() => setIsAddingAchiever(!isAddingAchiever)} disabled={isActionInFlight} className="px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70">
            {isAddingAchiever ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {isAddingAchiever ? 'Cancel' : 'Add Achiever'}
          </button>
        </div>
        {isAddingAchiever && (
          <form onSubmit={handleAddAchiever} className="bg-gray-50 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" required placeholder="Name" className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <input name="achievement" required placeholder="Achievement" className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <input name="year" placeholder="Year (optional)" className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Achiever Image</label>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center rounded-xl border border-dashed border-gray-200 bg-white p-4">
                {newAchieverPreview ? (
                  <img src={newAchieverPreview} alt="Achiever preview" className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => newAchieverInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold shadow-md hover:shadow-lg transition"
                    disabled={isActionInFlight}
                  >
                    {newAchieverPreview ? 'Change Image' : 'Upload Image'}
                  </button>
                  {newAchieverPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        if (newAchieverPreview.startsWith('blob:')) URL.revokeObjectURL(newAchieverPreview);
                        setNewAchieverPreview('');
                        setNewAchieverImageFile(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                      disabled={isActionInFlight}
                    >
                      Remove Image
                    </button>
                  )}
                  {!newAchieverPreview && (
                    <p className="text-xs text-gray-500">Image is required.</p>
                  )}
                </div>
              </div>
              <input
                ref={newAchieverInputRef}
                name="imageFile"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) return;
                  if (file.size > maxImageUploadSizeBytes) {
                    window.alert('Image is too large. Please upload an image smaller than 600 KB.');
                    e.currentTarget.value = '';
                    return;
                  }
                  if (newAchieverPreview.startsWith('blob:')) URL.revokeObjectURL(newAchieverPreview);
                  setNewAchieverImageFile(file);
                  setNewAchieverPreview(URL.createObjectURL(file));
                }}
                disabled={isActionInFlight}
              />
            </div>
            <button type="submit" disabled={isActionInFlight} className="md:col-span-2 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70">{isActionPending('add-achiever') ? 'Adding Achiever...' : 'Save'}</button>
          </form>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.achievers.map((a, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 relative group">
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to remove achiever "${a.name}"?`)) {
                    void runLandingAction('remove-achiever', () => safeUpdate({ ...data, achievers: data.achievers.filter((_, idx) => idx !== i) }));
                  }
                }}
                disabled={isActionInFlight}
                className="absolute top-2 right-2 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
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

  if (activeSubSection === 'visions') {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveSubSection('overview')} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="text-3xl font-bold text-gray-900">Manage The Vision</h2>
          </div>
          <button onClick={() => setIsAddingVision(!isAddingVision)} disabled={isActionInFlight} className="px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70">
            {isAddingVision ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {isAddingVision ? 'Cancel' : 'Add Vision Tile'}
          </button>
        </div>
        {isAddingVision && (
          <form onSubmit={handleAddVision} className="bg-gray-50 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" required placeholder="Name (e.g., Founder Name)" className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <input name="designation" required placeholder="Designation" className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <textarea name="vision" required placeholder="Vision Text" className="md:col-span-2 px-4 py-2 rounded-lg border border-gray-200" rows={4} disabled={isActionInFlight} />
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Square Image</label>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center rounded-xl border border-dashed border-gray-200 bg-white p-4">
                {newVisionPreview ? (
                  <img src={newVisionPreview} alt="Vision preview" className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => newVisionInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold shadow-md hover:shadow-lg transition"
                    disabled={isActionInFlight}
                  >
                    {newVisionPreview ? 'Change Image' : 'Upload Image'}
                  </button>
                  {newVisionPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        if (newVisionPreview.startsWith('blob:')) URL.revokeObjectURL(newVisionPreview);
                        setNewVisionPreview('');
                        setNewVisionImageFile(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                      disabled={isActionInFlight}
                    >
                      Remove Image
                    </button>
                  )}
                  {!newVisionPreview && (
                    <p className="text-xs text-gray-500">Image is required.</p>
                  )}
                </div>
              </div>
              <input
                ref={newVisionInputRef}
                name="imageFile"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) return;
                  if (file.size > maxImageUploadSizeBytes) {
                    window.alert('Image is too large. Please upload an image smaller than 600 KB.');
                    e.currentTarget.value = '';
                    return;
                  }
                  if (newVisionPreview.startsWith('blob:')) URL.revokeObjectURL(newVisionPreview);
                  setNewVisionImageFile(file);
                  setNewVisionPreview(URL.createObjectURL(file));
                }}
                disabled={isActionInFlight}
              />
            </div>
            <button type="submit" disabled={isActionInFlight} className="md:col-span-2 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70">{isActionPending('add-vision') ? 'Saving Vision Tile...' : 'Save Vision Tile'}</button>
          </form>
        )}
        {editingVisionIndex !== null && (
          <form onSubmit={handleSaveEditedVision} className="bg-teal-50 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" required defaultValue={data.visions[editingVisionIndex].name} className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <input name="designation" required defaultValue={data.visions[editingVisionIndex].designation} className="px-4 py-2 rounded-lg border border-gray-200" disabled={isActionInFlight} />
            <textarea name="vision" required defaultValue={data.visions[editingVisionIndex].vision} className="md:col-span-2 px-4 py-2 rounded-lg border border-gray-200" rows={4} disabled={isActionInFlight} />
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Change Image</label>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center rounded-xl border border-dashed border-gray-200 bg-white p-4">
                {editVisionPreview ? (
                  <img src={editVisionPreview} alt="Vision preview" className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    {editVisionImageRemoved ? 'Image removed' : 'No image'}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => editVisionInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold shadow-md hover:shadow-lg transition"
                    disabled={isActionInFlight}
                  >
                    {editVisionPreview ? 'Change Image' : 'Upload Image'}
                  </button>
                  {editVisionPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditVisionImageRemoved(true);
                        setEditVisionPreview('');
                        setEditVisionImageFile(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                      disabled={isActionInFlight}
                    >
                      Remove Image
                    </button>
                  )}
                  {editVisionImageRemoved && (
                    <p className="text-xs text-red-500">Please upload a new image to continue.</p>
                  )}
                </div>
              </div>
              <input
                ref={editVisionInputRef}
                name="imageFile"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) return;
                  if (file.size > maxImageUploadSizeBytes) {
                    window.alert('Image is too large. Please upload an image smaller than 600 KB.');
                    e.currentTarget.value = '';
                    return;
                  }
                  if (editVisionPreview.startsWith('blob:')) URL.revokeObjectURL(editVisionPreview);
                  setEditVisionImageFile(file);
                  setEditVisionPreview(URL.createObjectURL(file));
                  setEditVisionImageRemoved(false);
                }}
                disabled={isActionInFlight}
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={isActionInFlight} className="flex-1 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70">{isActionPending('update-vision') ? 'Updating Vision Tile...' : 'Update Vision Tile'}</button>
              <button type="button" onClick={() => setEditingVisionIndex(null)} disabled={isActionInFlight} className="flex-1 py-3 bg-gray-200 rounded-xl font-bold transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-70">Cancel</button>
            </div>
          </form>
        )}
        <div className="space-y-6">
          {(data.visions || []).map((v, i) => (
            <div key={v.id} className="bg-white p-6 rounded-2xl border border-gray-100 relative group flex flex-col md:flex-row gap-6 items-center">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingVisionIndex(i); setIsAddingVision(false); }} disabled={isActionInFlight} className="p-2 bg-blue-50 text-blue-500 rounded-lg disabled:cursor-not-allowed disabled:opacity-50" title="Edit Vision"><Edit className="w-4 h-4" /></button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove vision for "${v.name}"?`)) {
                      void runLandingAction('remove-vision', () => safeUpdate({ ...data, visions: data.visions.filter((_, idx) => idx !== i) }));
                    }
                  }}
                  disabled={isActionInFlight}
                  className="p-2 bg-red-50 text-red-500 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                  title="Delete Vision"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <img src={v.image} className="w-24 h-24 rounded-xl object-cover border-2 border-teal-100" />
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-bold text-xl text-gray-900">{v.name}</h3>
                <p className="text-sm text-teal-600 font-semibold mb-2">{v.designation}</p>
                <p className="text-gray-600 italic">"{v.vision}"</p>
              </div>
            </div>
          ))}
          {(!data.visions || data.visions.length === 0) && (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 italic">No vision entries added yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Saving Overlay — portaled to body */}
      {isSaving && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            <p className="text-lg font-bold text-gray-900">Saving to database...</p>
            <p className="text-sm text-gray-500">Please wait while your changes are being saved</p>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification — portaled to body */}
      {saveStatus && createPortal(
        <div className={`fixed top-6 right-6 z-[99999] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all ${saveStatus.type === 'success'
          ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
          : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
          }`}>
          <span className="text-lg">{saveStatus.type === 'success' ? '✓' : '✕'}</span>
          <span className="font-semibold">{saveStatus.message}</span>
        </div>,
        document.body
      )}

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
            { id: 'faculty', title: 'Faculty', description: 'Update faculty showcase' },
            { id: 'achievers', title: 'Achievers', description: 'Manage student success stories' },
            { id: 'visions', title: 'The Vision', description: 'Manage vision statements and founders' },
          ].map((item) => (
            <div key={item.id} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{item.description}</p>
              <button onClick={() => setActiveSubSection(item.id as any)} className="text-cyan-600 font-semibold text-sm hover:underline">Edit Section →</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function OverviewTab({
  selectedBatch,
  onEditBatch,
  onPermanentDeleteBatch,
  students,
  faculty,
  batches,
  onNavigate,
  onClearBatch,
  onViewTimetable,
  onUpdateBatch,
  subjectCatalog,
  onRemoveSubjectFromBatch,
}: {
  selectedBatch: Batch | null;
  onEditBatch: (l: string) => void;
  onPermanentDeleteBatch: (label: Batch) => void;
  students: Student[];
  faculty: Faculty[];
  batches: BatchInfo[];
  onNavigate: (tab: Tab) => void;
  onClearBatch: () => void;
  onViewTimetable: () => void;
  onUpdateBatch: any;
  subjectCatalog: import('../api/subjects').ApiSubject[];
  onRemoveSubjectFromBatch: (batchId: string, subjectId: string) => Promise<SubjectActionResult>;
}) {
  if (!selectedBatch) return null;
  const batchStudents = students.filter(s => s.batch === selectedBatch);

  // Faculty logic
  const currentBatch = batches.find(b => b.label === selectedBatch);
  const isBatchActive = currentBatch?.is_active !== false;
  const assigned = currentBatch?.facultyAssigned ?? [];
  const assignedFaculty = faculty.filter((item) => assigned.includes(item.name));

  const handleRemoveFacultyFromBatch = async (facultyName: string) => {
    if (!currentBatch) return;
    if (!window.confirm(`Remove ${facultyName} from ${selectedBatch}?`)) return;
    const nextAssigned = assigned.filter((name) => name !== facultyName);
    const result = await onUpdateBatch(selectedBatch, currentBatch.subjects ?? [], nextAssigned);
    if (!result.ok) {
      window.alert(result.error ?? 'Unable to update batch faculty.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 rounded-3xl shadow-xl text-white mb-8">
        <div className="flex items-start gap-3">
          <button
            onClick={onClearBatch}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full border border-white/30 transition-colors mt-1"
            title="Back to batches"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{selectedBatch} Dashboard</h2>
            <p className="text-teal-50/90 font-medium">Batch Management & Academic Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isBatchActive ? (
            <button
              onClick={() => onEditBatch(selectedBatch)}
              className="px-8 py-3 bg-white/20 backdrop-blur-md text-white rounded-xl font-bold border border-white/30 shadow-lg hover:bg-white/30 transition-all text-sm"
            >
              Batch Settings
            </button>
          ) : (
            <button
              onClick={() => onPermanentDeleteBatch(selectedBatch)}
              className="px-8 py-3 bg-red-500/20 backdrop-blur-md text-white rounded-xl font-bold border border-red-200/40 shadow-lg hover:bg-red-500/30 transition-all text-sm"
            >
              Delete Permanently
            </button>
          )}
        </div>
      </div>

      {/* Batch Faculty Section */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Batch Faculty</h3>
          </div>
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
                {isBatchActive ? (
                  <button
                    onClick={() => handleRemoveFacultyFromBatch(t.name)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Remove from batch"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : null}
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
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-1 border border-gray-100">
        <div className="p-1">
          <NotesManagementTab
            onNavigate={onNavigate}
            selectedBatch={selectedBatch}
            onChangeBatch={onClearBatch}
            onViewTimetable={onViewTimetable}
            onUpdateBatch={onUpdateBatch}
            batches={batches}
            readOnly={!isBatchActive}
            headerMode="full"
            variant="admin"
            subjectCatalog={subjectCatalog}
            onRemoveSubjectFromBatch={onRemoveSubjectFromBatch}
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
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onViewStudent,
  isBatchActive
}: {
  students: Student[];
  selectedBatch: Batch;
  onChangeBatch: () => void;
  onAddStudent: () => void;
  onEditStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onViewStudent: (s: Student) => void;
  isBatchActive?: boolean;
}) {
  const STUDENTS_PER_PAGE = 20;
  const batchStudents = students.filter(s => s.batch === selectedBatch);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(batchStudents.length / STUDENTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStudents = batchStudents.slice(
    (safeCurrentPage - 1) * STUDENTS_PER_PAGE,
    safeCurrentPage * STUDENTS_PER_PAGE
  );
  const rangeStart = batchStudents.length === 0 ? 0 : (safeCurrentPage - 1) * STUDENTS_PER_PAGE + 1;
  const rangeEnd = Math.min(safeCurrentPage * STUDENTS_PER_PAGE, batchStudents.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBatch, students.length]);

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Batch Students</h2>
          <p className="text-gray-500">{selectedBatch} • {batchStudents.length} Students</p>
        </div>
        {isBatchActive ? (
          <div className="flex gap-3"><button onClick={onAddStudent} className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add Student</button></div>
        ) : null}
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
            {paginatedStudents.map((s) => (
              <tr key={s.id} onClick={() => onViewStudent(s)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <td className="py-4 px-4">
                  <div className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.rollNumber}</div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600 font-mono">{s.rollNumber}</td>
                <td className="py-4 px-4 whitespace-nowrap">{renderPerformanceStars(s.rating)}</td>
                <td className="py-4 px-4 flex gap-1 justify-end">
                  {isBatchActive ? (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditStudent(s); }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Edit Student"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteStudent(s.id); }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium text-gray-500">
          Showing {rangeStart}-{rangeEnd} of {batchStudents.length} students
        </p>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safeCurrentPage === 1}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="min-w-20 text-center text-sm font-semibold text-gray-600">
            Page {safeCurrentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safeCurrentPage === totalPages}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}


function FacultyDirectoryTab({ faculty, onAddFaculty, onViewFaculty, onEditFaculty, onDeleteFaculty, onRefreshFaculty }: { faculty: Faculty[]; onAddFaculty: () => void; onViewFaculty: (t: Faculty) => void; onEditFaculty: (t: Faculty) => void; onDeleteFaculty: (id: string) => void; onRefreshFaculty?: () => void }) {
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTriggerReview = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to trigger a new Faculty Review session?\n\nThis will:\n1. RESET all current faculty ratings to 0\n2. DELETE all previous individual review data\n3. Start a new 3-day rating window for students"
    );

    if (!confirmed) return;

    setIsTriggering(true);
    try {
      await triggerReviewSession();
      window.alert("Faculty Review session started successfully! All students will now see the rating notification.");
      if (onRefreshFaculty) {
        onRefreshFaculty();
      }
    } catch (error: any) {
      window.alert("Failed to trigger review session: " + error.message);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Faculty Directory</h2>
          <p className="text-gray-500">Manage all faculties and subject experts</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTriggerReview}
            disabled={isTriggering}
            className="px-6 py-3 bg-white border-2 border-orange-500 text-orange-600 rounded-xl font-bold shadow-sm flex items-center gap-2 hover:bg-orange-50 transition disabled:opacity-50"
          >
            {isTriggering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />}
            Trigger Faculty Review
          </button>
          <button onClick={onAddFaculty} className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 hover:shadow-xl transition">
            <Plus className="w-5 h-5" />
            Add Faculty
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.map(t => (
          <div
            key={t.id}
            onClick={() => onViewFaculty(t)}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group cursor-pointer hover:shadow-md hover:border-teal-100 transition-all"
          >
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEditFaculty(t); }}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                title="Edit Faculty"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteFaculty(t.id); }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                title="Delete Faculty"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-teal-600 transition-colors">
              <GraduationCap className="w-6 h-6 text-teal-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{t.name}</h3>
            <p className="text-sm font-semibold text-teal-600 uppercase mb-1">{t.subject}</p>
            {t.designation && <p className="text-xs text-gray-600 font-medium mb-3">{t.designation}</p>}
            {t.rating !== undefined && (
              <div className="flex items-center gap-2 mb-4">
                {renderPerformanceStars(t.rating)}
              </div>
            )}
            <div className="text-xs text-gray-500">{t.email}</div>
            {t.joinDate && (
              <div className="text-[10px] font-bold text-gray-400 uppercase mt-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Joined: {new Date(t.joinDate).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TestSeriesManagementTab({
  onNavigate,
  publishedTests,
  onPreviewTest,
  onViewInsights,
  onDeletePublishedTest,
  onForceTestLiveNow,
  onResumeDraft
}: {
  onNavigate: (t: Tab) => void;
  selectedBatch: Batch | null;
  onChangeBatch: () => void;
  publishedTests: import('../App').PublishedTest[];
  onPreviewTest: (testId: string) => void;
  onViewInsights: (testId: string) => void;
  onDeletePublishedTest: (testId: string) => void;
  onForceTestLiveNow?: (testId: string) => Promise<import('../App').PublishedTest>;
  onResumeDraft: (testId: string) => void;
}) {
  const [forceLiveLoadingTestId, setForceLiveLoadingTestId] = useState<string | null>(null);
  const [testOverrides, setTestOverrides] = useState<Record<string, import('../App').PublishedTest>>({});

  const handleDelete = (testId: string, testTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the test series "${testTitle}"? This action cannot be undone.`)) {
      onDeletePublishedTest(testId);
    }
  };

  const handleForceLiveNow = async (testId: string, testTitle: string) => {
    const confirmed = window.confirm(
      `Set "${testTitle}" live right now?\n\nThis emergency action will:\n- make the test live immediately\n- rewrite the scheduled date and time to the current trigger time\n- allow students to start the test right away`
    );

    if (!confirmed) return;
    try {
      setForceLiveLoadingTestId(testId);
      if (onForceTestLiveNow) {
        const updatedTest = await onForceTestLiveNow(testId);
        setTestOverrides((prev) => ({
          ...prev,
          [testId]: updatedTest,
        }));
      }
    } finally {
      setForceLiveLoadingTestId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-gray-900">Test Series Management</h2><p className="text-gray-600">Review student performance and manage tests</p></div>
        <button onClick={() => onNavigate('create-test')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-500 text-white rounded-xl font-bold shadow-md"><Plus className="w-5 h-5" />Create Test Series</button>
      </div>

      {publishedTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedTests.map((originalTest) => {
            const test = testOverrides[originalTest.id] || originalTest;
            return (
              <div key={test.id} className="h-full">
                <div
                  onClick={() => test.status === 'draft' ? undefined : onViewInsights(test.id)}
                  className={`h-full bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white flex flex-col group relative ${test.status === 'draft' ? 'opacity-80 border-dashed border-amber-300' : 'cursor-pointer hover:shadow-2xl hover:scale-[1.02]'} transition-all`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><FileText className="w-6 h-6" /></div>
                    <div className="flex items-center gap-2">
                      {test.status === 'draft' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">Draft</span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${test.format === 'JEE MAIN' ? 'bg-orange-100 text-orange-700' :
                        test.format === 'NEET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>{test.format}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(test.id, test.title); }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Test Series"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{test.title}</h3>
                  <div className="space-y-2 mb-6 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="w-4 h-4" />{test.scheduleDate ? new Date(test.scheduleDate).toLocaleDateString() : 'No date'} {test.scheduleTime ? `at ${test.scheduleTime}` : ''}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4" />{test.duration} Minutes</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Users className="w-4 h-4" />{test.batches.join(', ') || 'No batches'}</div>
                    {test.status === 'draft' && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold"><FileText className="w-4 h-4" />{test.questions?.length || 0} questions added</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {test.status === 'draft' ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onResumeDraft(test.id); }}
                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" /> Resume Editing
                      </button>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); onPreviewTest(test.id); }}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> Preview
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onViewInsights(test.id); }}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <BarChart3 className="w-4 h-4" /> Performance
                          </button>
                        </div>
                        {test.status === 'upcoming' && (
                          <button
                            disabled={forceLiveLoadingTestId === test.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleForceLiveNow(test.id, test.title);
                            }}
                            className={`w-full py-3 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 ${forceLiveLoadingTestId === test.id
                                ? 'cursor-wait'
                                : 'hover:shadow-lg'
                              }`}
                          >
                            {forceLiveLoadingTestId === test.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Setting Live...
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4" /> Set Live Now
                              </>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
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
    rollNumber: initial?.rollNumber ?? '',
    batch: initial?.batch ?? batch ?? '',
    email: initial?.email ?? '',
    phoneNumber: formatIndianMobileInput(initial?.phoneNumber ?? ''),
    dateOfBirth: initial?.dateOfBirth ?? '',
    address: initial?.address ?? '',
    parentContact: formatIndianMobileInput(initial?.parentContact ?? ''),
  });

  const [formState, setFormState] = useState(createInitialState(defaultBatch, initialData));

  useEffect(() => {
    if (!open) return;
    setFormState(createInitialState(defaultBatch, initialData));
  }, [open, defaultBatch, initialData]);

  if (!open) return null;

  const handleChange = (field: keyof StudentFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const raw = event.target.value;
    const nextValue = field === 'phoneNumber' || field === 'parentContact'
      ? formatIndianMobileInput(raw)
      : raw;
    setFormState((prev) => ({ ...prev, [field]: nextValue }));
  };

  const handleSubmit = async (event: FormEvent) => {
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto scrollbar-hide">
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
              <span className="block">Email (Optional)</span>
              <input
                type="email"
                value={formState.email}
                onChange={handleChange('email')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="student@email.com"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Phone Number (Optional)</span>
              <input
                type="tel"
                value={formState.phoneNumber}
                onChange={handleChange('phoneNumber')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="+91 9XXXX XXXXX"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Date of Birth (Optional)</span>
              <input
                type="date"
                value={formState.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Address (Optional)</span>
            <textarea
              rows={3}
              value={formState.address}
              onChange={handleChange('address')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Street, city, state, postal code"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Parent Contact (Optional)</span>
            <input
              type="tel"
              value={formState.parentContact}
              onChange={handleChange('parentContact')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="Parent/guardian phone number"
            />
          </label>

          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition"
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
  isInitialEditing,
  subjectOptions,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: Faculty;
  title?: string;
  onSubmit?: (data: FacultyFormState) => void;
  isInitialEditing?: boolean;
  subjectOptions: string[];
}) {
  const [isEditing, setIsEditing] = useState(isInitialEditing ?? !initialData?.id);
  const [formState, setFormState] = useState<FacultyFormState>({
    id: initialData?.id,
    subject: initialData?.subject ?? '',
    designation: initialData?.designation ?? '',
    name: initialData?.name ?? '',
    phone: formatIndianMobileInput(initialData?.phone ?? ''),
    email: initialData?.email ?? '',
    joinDate: initialData?.joinDate ?? '',
    rating: initialData?.rating ?? 0,
    reviewCount: initialData?.reviewCount ?? 0,
    password: '',
  });

  useEffect(() => {
    if (!open) return;
    setIsEditing(isInitialEditing ?? !initialData?.id);
    setFormState({
      id: initialData?.id,
      subject: initialData?.subject ?? '',
      designation: initialData?.designation ?? '',
      name: initialData?.name ?? '',
      phone: formatIndianMobileInput(initialData?.phone ?? ''),
      email: initialData?.email ?? '',
      joinDate: initialData?.joinDate ?? '',
      rating: initialData?.rating ?? 0,
      reviewCount: initialData?.reviewCount ?? 0,
      password: '',
    });
  }, [open, initialData, isInitialEditing]);

  if (!open) return null;

  const handleChange = (field: keyof FacultyFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const raw = event.target.value;
    const value = field === 'rating' || field === 'reviewCount'
      ? parseFloat(raw) || 0
      : field === 'phone'
        ? formatIndianMobileInput(raw)
        : raw;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };
  const mergedSubjectOptions = Array.from(new Set([...subjectOptions, formState.subject]))
    .map((subject) => subject.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const handleSubmit = async (event: FormEvent) => {
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
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">{isEditing ? (initialData?.id ? 'Edit Faculty' : 'Add Faculty') : 'Faculty Details'}</h3>
            {isEditing && <p className="text-sm text-white/80">Fields marked with * are mandatory.</p>}
          </div>
          {!isEditing && initialData?.id && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-bold text-sm transition border border-white/30"
            >
              Edit Details
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Subject {isEditing && requiredMark}</span>
              <select
                required={isEditing}
                disabled={!isEditing}
                value={formState.subject}
                onChange={handleChange('subject')}
                className={`w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 ${!isEditing ? 'bg-gray-50 text-gray-600' : ''}`}
              >
                <option value="">{mergedSubjectOptions.length > 0 ? 'Select subject' : 'No subjects available'}</option>
                {mergedSubjectOptions.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Designation</span>
              <input
                type="text"
                readOnly={!isEditing}
                value={formState.designation}
                onChange={handleChange('designation')}
                className={`w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 ${!isEditing ? 'bg-gray-50 text-gray-600' : ''}`}
                placeholder="e.g. Senior Lecturer"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Faculty Name {isEditing && requiredMark}</span>
              <input
                type="text"
                required={isEditing}
                readOnly={!isEditing}
                value={formState.name}
                onChange={handleChange('name')}
                className={`w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 ${!isEditing ? 'bg-gray-50 text-gray-600' : ''}`}
                placeholder="Faculty name"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Phone Number {isEditing && '(Optional)'}</span>
              <input
                type="tel"
                readOnly={!isEditing}
                value={formState.phone}
                onChange={handleChange('phone')}
                className={`w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 ${!isEditing ? 'bg-gray-50 text-gray-600' : ''}`}
                placeholder="+91 9XXXX XXXXX"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Email {isEditing && requiredMark}</span>
              <input
                type="email"
                required={isEditing}
                readOnly={!isEditing}
                value={formState.email}
                onChange={handleChange('email')}
                className={`w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 ${!isEditing ? 'bg-gray-50 text-gray-600' : ''}`}
                placeholder="faculty@email.com"
              />
            </label>

            {!initialData?.id && (
              <label className="space-y-2 text-sm font-medium text-gray-700 block">
                <span className="block">Password {isEditing && requiredMark}</span>
                <input
                  type="text"
                  required={isEditing && !initialData?.id}
                  readOnly={!isEditing}
                  value={formState.password || ''}
                  onChange={handleChange('password')}
                  className={`w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 ${!isEditing ? 'bg-gray-50 text-gray-600' : ''}`}
                  placeholder="Enter temporary password"
                />
              </label>
            )}

            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Join Date</span>
              <input
                type="date"
                readOnly={!isEditing}
                value={formState.joinDate}
                onChange={handleChange('joinDate')}
                className={`w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 ${!isEditing ? 'bg-gray-50 text-gray-600' : ''}`}
              />
            </label>

            {initialData?.id && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  <span className="block">Faculty Rating (0-5)</span>
                  <input
                    type="number"
                    readOnly
                    value={formState.rating}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                    placeholder="0.0"
                  />
                </label>
                {!isEditing && (
                  <p className="text-[10px] text-gray-400 font-bold uppercase ml-1">
                    Based on {formState.reviewCount || 0} reviews
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end shrink-0">
            {isEditing && initialData?.id && (
              <button
                type="button"
                onClick={async () => {
                  const newPass = prompt(`Enter new manual password for ${formState.name}:`);
                  if (!newPass) return;
                  if (!window.confirm(`Are you sure you want to reset the password for ${formState.name}?\n\nThe new password will be: ${newPass}`)) {
                    return;
                  }
                  try {
                    await adminResetUserPassword(formState.id as string, newPass);
                    window.alert(`Password for ${formState.name} has been reset successfully!`);
                  } catch (error: any) {
                    window.alert(error?.message || 'Unable to reset password. Please try again.');
                  }
                }}
                className="px-6 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition shadow-sm sm:mr-auto"
              >
                Reset Password
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition shadow-sm"
            >
              {isEditing && initialData?.id ? 'Cancel' : 'Close'}
            </button>
            {isEditing && (
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition"
              >
                {initialData?.id ? 'Save Changes' : 'Save Faculty'}
              </button>
            )}
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

  const availableStudents = students.filter((student) => !student.batch || student.batch === 'Unassigned');

  const handleAssign = (student: Student) => {
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
        <div className="p-6 flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3">
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
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition"
                >
                  Add
                </button>
              </div>
            ))
          )}
        </div>
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 shrink-0">
          <button
            type="button"
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

function PermanentDeleteBatchModal({
  open,
  batchLabel,
  submitting,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  batchLabel: Batch | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  if (!open || !batchLabel) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-layer-10001">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden"
      >
        <div
          className="px-6 py-5 border-b border-orange-200 text-white"
          style={{ background: 'linear-gradient(90deg, #c2410c 0%, #ea580c 55%, #f59e0b 100%)' }}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-black/10 flex items-center justify-center border border-white/20 shrink-0 p-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Delete Batch Permanently</h3>
              <p className="text-sm text-white/85">
                This will erase the inactive batch and all content that exists only under it.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-6 py-5 text-sm text-orange-950">
            <p className="font-semibold">
              You are about to permanently delete <span className="font-bold">"{batchLabel}"</span>.
            </p>
            <p className="mt-2 text-orange-900">
              This action cannot be undone. Shared items linked to other batches will be preserved, but batch-only data will be removed.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">This will remove:</p>
            <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
              <li>The batch itself and its timetable reference</li>
              <li>All chapters, notes, and DPPs created under this batch</li>
              <li>Tests linked only to this batch</li>
              <li>Student and faculty links to this batch</li>
              <li>Batch-scoped notifications and related attempt data that belongs only to deleted content</li>
            </ul>
          </div>

          {error ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl border border-orange-200 bg-orange-100 text-orange-900 font-semibold hover:bg-orange-200 transition disabled:opacity-60 justify-self-start"
              style={{ padding: '0.9rem 1.4rem' }}
            >
              Cancel
            </button>
            <div className="hidden sm:block" />
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl border border-orange-700 text-white font-semibold transition disabled:opacity-60 justify-self-end"
              style={{
                padding: '0.9rem 1.4rem',
                background: 'linear-gradient(90deg, #c2410c 0%, #ea580c 55%, #f59e0b 100%)',
              }}
            >
              {submitting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
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
  subjectCatalog,
  batchLabel,
  onClose,
  onCreateBatch,
  onUpdateBatch,
  onDeleteBatch,
  onRemoveSubjectFromBatch,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  batches: BatchInfo[];
  faculty: import('../api/faculties').ApiFaculty[];
  subjectCatalog: import('../api/subjects').ApiSubject[];
  batchLabel?: string;
  onClose: () => void;
  onCreateBatch: (label: string, subjects?: string[], facultyAssigned?: string[]) => Promise<{ ok: boolean; error?: string; label?: string }>;
  onUpdateBatch: (label: string, subjects?: string[], facultyAssigned?: string[], oldLabel?: string) => Promise<{ ok: boolean; error?: string }>;
  onDeleteBatch: (label: string) => Promise<{ ok: boolean; error?: string }>;
  onRemoveSubjectFromBatch: (batchId: string, subjectId: string) => Promise<SubjectActionResult>;
}) {
  const [formState, setFormState] = useState({
    name: '',
    subject: '',
    faculty: '',
    assignments: [] as { subject: string; faculty: string }[],
  });
  const [selectedFacultyNames, setSelectedFacultyNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const subjects = subjectCatalog
    .map((subject) => subject.name)
    .filter((name) => typeof name === 'string' && name.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
  const currentBatch = mode === 'edit' && batchLabel
    ? batches.find((batch) => batch.label === batchLabel)
    : null;
  const currentBatchSubjects = currentBatch?.subjects ?? [];

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
      const assignedSubjects = new Set(assignments.map((item) => item.subject));
      const subjectOnlyAssignments = (current?.subjects ?? [])
        .filter((subject) => subject && !assignedSubjects.has(subject))
        .map((subject) => ({ subject, faculty: '' }));
      setFormState({
        name: current?.label ?? batchLabel,
        subject: '',
        faculty: '',
        assignments: [...assignments, ...subjectOnlyAssignments],
      });
    } else {
      setFormState({ name: '', subject: '', faculty: '', assignments: [] });
    }
    setSelectedFacultyNames([]);
    setError(null);
  }, [open, mode, batchLabel, batches, faculty]);

  if (!open) return null;

  const facultyOptions = formState.subject
    ? faculty.filter((item) => item.subject === formState.subject)
    : [];

  const addAssignment = () => {
    if (!formState.subject) return;
    setFormState((prev) => {
      if (selectedFacultyNames.length === 0) {
        const alreadyExists = prev.assignments.some((item) => item.subject === prev.subject);
        if (alreadyExists) {
          return { ...prev, faculty: '' };
        }
        return {
          ...prev,
          assignments: [...prev.assignments, { subject: prev.subject, faculty: '' }],
          faculty: '',
        };
      }
      const additions = selectedFacultyNames
        .filter((name) => !prev.assignments.some((item) => item.subject === prev.subject && item.faculty === name))
        .map((name) => ({ subject: prev.subject, faculty: name }));
      if (additions.length === 0) {
        return { ...prev, faculty: '' };
      }
      const withoutPlaceholder = prev.assignments.filter(
        (item) => !(item.subject === prev.subject && item.faculty.trim().length === 0)
      );
      return {
        ...prev,
        assignments: [...withoutPlaceholder, ...additions],
        faculty: '',
      };
    });
    setSelectedFacultyNames([]);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedTypedSubject = formState.subject.trim();
    const inlineAssignments =
      normalizedTypedSubject.length > 0
        ? selectedFacultyNames.length > 0
          ? selectedFacultyNames.map((name) => ({ subject: normalizedTypedSubject, faculty: name }))
          : [{ subject: normalizedTypedSubject, faculty: '' }]
        : [];
    const effectiveAssignments = [...formState.assignments, ...inlineAssignments];
    const selectedSubjects = Array.from(
      new Set(
        effectiveAssignments
          .map((item) => item.subject.trim())
          .filter((subject) => subject.length > 0)
      )
    );
    const selectedFaculty = Array.from(
      new Set(
        effectiveAssignments
          .map((item) => item.faculty.trim())
          .filter((name) => name.length > 0)
      )
    );
    if (!formState.name.trim()) {
      setError('Batch name is required.');
      return;
    }
    if (selectedSubjects.length === 0) {
      setError('Add at least one subject.');
      return;
    }
    const result =
      mode === 'edit'
        ? await onUpdateBatch(formState.name.trim(), selectedSubjects, selectedFaculty, batchLabel)
        : await onCreateBatch(formState.name.trim(), selectedSubjects, selectedFaculty);
    if (!result.ok) {
      setError(result.error ?? 'Unable to save batch.');
      return;
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!batchLabel) return;
    if (window.confirm(`Are you sure you want to delete the batch "${batchLabel}"?`)) {
      const result = await onDeleteBatch(batchLabel);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error ?? 'Unable to delete batch.');
      }
    }
  };

  const resolveSubjectId = (subjectName: string) =>
    subjectCatalog.find((subject) => subject.name.toLowerCase() === subjectName.toLowerCase())?.id;

  const handleRemoveOrDeleteSubject = async (subjectName: string) => {
    if (!currentBatch?.id) return;
    const subjectId = resolveSubjectId(subjectName);
    if (!subjectId) {
      window.alert(`Unable to find subject "${subjectName}" in the catalog.`);
      return;
    }
    if (!window.confirm(`Delete "${subjectName}" for this batch? If it is linked to only one batch, it will be deleted globally.`)) {
      return;
    }
    const result = await onRemoveSubjectFromBatch(currentBatch.id, subjectId);
    if (result.ok) {
      setFormState((prev) => ({
        ...prev,
        assignments: prev.assignments.filter((item) => item.subject !== subjectName),
      }));
      return;
    }
    if (result.status === 409) {
      const summary = formatLinkSummary(result.links);
      window.alert(`Cannot delete "${subjectName}".\n\nDelete/unlink the following first:\n${summary}`);
      return;
    }
    window.alert(result.message || 'Failed to remove subject from batch.');
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto scrollbar-hide">
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
            <p className="text-sm font-medium text-gray-700">Subject & Faculty</p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-start">
              <label className="space-y-2 text-sm font-medium text-gray-700 block">
                <span className="block">Subject</span>
                <input
                  list="batch-subject-options"
                  value={formState.subject}
                  onChange={(event) => {
                    const nextSubject = event.target.value;
                    setFormState((prev) => ({
                      ...prev,
                      subject: nextSubject,
                      faculty: '',
                    }));
                    setSelectedFacultyNames([]);
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                  placeholder="Select or type a subject"
                />
                <datalist id="batch-subject-options">
                  {subjects.map((subject) => (
                    <option key={subject} value={subject} />
                  ))}
                </datalist>
              </label>

              <div className="space-y-2 text-sm font-medium text-gray-700">
                <span className="block">Faculty</span>
                <div className={`w-full rounded-xl border border-gray-200 px-4 py-3 bg-white ${!formState.subject ? 'bg-gray-50 text-gray-400' : ''}`}>
                  {!formState.subject ? (
                    <span className="text-sm text-gray-400">Select subject first</span>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide pr-1">
                      {facultyOptions.length === 0 && (
                        <span className="text-sm text-gray-500">No faculty found for this subject.</span>
                      )}
                      {facultyOptions.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedFacultyNames.includes(item.name)}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setSelectedFacultyNames((prev) =>
                                checked ? [...prev, item.name] : prev.filter((name) => name !== item.name)
                              );
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span>{item.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={addAssignment}
                className="mt-7 px-5 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-semibold leading-none whitespace-nowrap shadow-md hover:shadow-lg transition"
              >
                Add Selected
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
                      {item.subject} — <span className="font-semibold">{item.faculty ? item.faculty : 'Unassigned'}</span>
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

          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end pt-4">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition sm:mr-auto"
              >
                Delete Batch
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition"
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
  batches,
  onSaveProfile,
  onSaveAdminRemark,
}: {
  open: boolean;
  student?: Student;
  onClose: () => void;
  batches: BatchInfo[];
  onSaveProfile?: (
    studentId: string,
    updates: Pick<Student, 'name' | 'phoneNumber' | 'dateOfBirth' | 'parentContact' | 'address'>
  ) => void;
  onSaveAdminRemark?: (studentId: string, remark: string) => void;
}) {
  const [activeView, setActiveView] = useState<'profile' | 'ratings' | 'performance'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAdminRemark, setIsEditingAdminRemark] = useState(false);
  const [adminRemarkDraft, setAdminRemarkDraft] = useState('');
  const [profileDraft, setProfileDraft] = useState({
    name: '',
    phoneNumber: formatIndianMobileInput(''),
    dateOfBirth: '',
    parentContact: formatIndianMobileInput(''),
    address: '',
  });
  const [testPerformanceRows, setTestPerformanceRows] = useState<Array<{
    id: string;
    title: string;
    date: string;
    score: string;
    rank: string;
    accuracy: string;
    status: 'Attempted' | 'Not Attempted';
  }>>([]);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !student) return;
    setActiveView('profile');
    setIsEditingProfile(false);
    setIsEditingAdminRemark(false);
    setProfileDraft({
      name: student.name ?? '',
      phoneNumber: formatIndianMobileInput(student.phoneNumber ?? ''),
      dateOfBirth: student.dateOfBirth ?? '',
      parentContact: formatIndianMobileInput(student.parentContact ?? ''),
      address: student.address ?? '',
    });
    setAdminRemarkDraft(student.adminRemark ?? '');
    setTestPerformanceRows([]);
    setIsPerformanceLoading(false);
    setPerformanceError(null);
  }, [open, student]);

  if (!open || !student) return null;

  const formatPerformanceDate = (value?: string | null) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toISOString().slice(0, 10);
  };

  const loadTestPerformance = async () => {
    const batchId = batches.find((b) => b.label === student.batch)?.id;
    if (!batchId) {
      setTestPerformanceRows([]);
      setPerformanceError('Student batch is not assigned yet.');
      return;
    }

    setIsPerformanceLoading(true);
    setPerformanceError(null);
    try {
      const tests = await fetchTests();
      const relevantTests = tests.filter((test) =>
        (test.batches || []).some((b) => b.id === batchId || b.name === student.batch)
      );

      const analyses = await Promise.all(
        relevantTests.map(async (test) => {
          try {
            const analysis = await fetchTestAnalysis(test.id);
            return { test, analysis };
          } catch {
            return { test, analysis: null };
          }
        })
      );

      const rows = analyses.map(({ test, analysis }) => {
        const performance = analysis?.performances?.find((p) => p.studentId === student.id);
        const attempted = !!performance && performance.attemptCount > 0;
        const totalStudents = analysis?.performances?.length || 0;
        const rankDisplay = performance
          ? totalStudents > 0
            ? `${performance.rank}/${totalStudents}`
            : `${performance.rank}`
          : '-';
        return {
          id: test.id,
          title: test.title,
          date: performance?.latestSubmittedAt
            ? formatPerformanceDate(performance.latestSubmittedAt)
            : (test.schedule_date || '-'),
          score: performance ? `${performance.score}/${performance.totalMarks}` : '-',
          rank: rankDisplay,
          accuracy: performance ? `${Math.round(performance.accuracy)}%` : '-',
          status: attempted ? ('Attempted' as const) : ('Not Attempted' as const),
        };
      });

      setTestPerformanceRows(rows);
    } catch (error: any) {
      setPerformanceError(error?.message || 'Failed to load test performance.');
    } finally {
      setIsPerformanceLoading(false);
    }
  };

  useEffect(() => {
    if (!open || activeView !== 'performance') return;
    void loadTestPerformance();
  }, [open, activeView, student?.id, student?.batch]);

  const handleResetPassword = async () => {
    const newPass = generateInitialPassword(student.name);
    if (!window.confirm(`Are you sure you want to reset the password for ${student.name}?\n\nThe new password will be: ${newPass}`)) {
      return;
    }
    try {
      await adminResetUserPassword(student.id, newPass);
      window.alert(`Password for ${student.name} has been reset to: ${newPass}`);
    } catch (error: any) {
      window.alert(error?.message || 'Unable to reset password. Please try again.');
    }
  };

  const calculateSubjectRating = (r: { attendance: number; total_classes?: number; attendanceRating?: number; tests: number; dppPerformance: number; behavior: number }) => {
    const attendanceRating = getAttendanceRatingValue(r.attendance, r.total_classes, r.attendanceRating);
    return (attendanceRating + r.tests + r.dppPerformance + r.behavior) / 4;
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
    const currentBatchInfo = batches.find(b => b.label === student.batch);

    const detailsRows = [
      ['Student Name', profileValues.name || 'Not provided'],
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
          `<tr class="${label === 'Final Average Rating' ? 'highlight-rating' : ''}"><td class="label">${escapeHtml(label)}</td><td class="value">${escapeHtml(value)}</td></tr>`
      )
      .join('');

    const subjectRatingsHtml =
      student.subjectRatings && Object.keys(student.subjectRatings).length > 0
        ? `<div class="subjects-grid">${Object.entries(student.subjectRatings)
          .map(([subject, r]) => {
            const subjectAverage = calculateSubjectRating(r);
            const subjectRemark = (student.subjectRemarks?.[subject] || '').trim();

            const batchFacultyNames = currentBatchInfo?.facultyAssigned || [];
            const subjectFaculty = batchFacultyNames.find(name => true);

            return `
                <section class="subject-card">
                  <div class="subject-header">
                    <h3>${escapeHtml(subject)}</h3>
                    ${subjectFaculty ? `<p class="faculty-name">Faculty: ${escapeHtml(subjectFaculty)}</p>` : ''}
                  </div>
                  <p class="subject-avg highlight-sub-rating">Subject Average: ${subjectAverage.toFixed(1)} / 5.0</p>
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
                  ${subjectRemark ? `
                  <div class="faculty-remark"><strong>Faculty Remark:</strong> ${escapeHtml(subjectRemark)}</div>
                  ` : ''}
                </section>
              `;
          })
          .join('')}</div>`
        : '<p class="empty">No rating data available for this student.</p>';

    const adminRemarkHtml = (student.adminRemark || '').trim() ? `
      <section class="admin-remark">
        <h2>Overall Remark</h2>
        <p>${escapeHtml((student.adminRemark || '').trim())}</p>
      </section>
    ` : '';

    const printableHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Student Performance Report - ${escapeHtml(profileValues.name || student.name)}</title>
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
            .highlight-rating td {
              background: #fef2f2 !important;
              color: #991b1b !important;
              font-weight: 800 !important;
              font-size: 12px !important;
              border: 1px solid #fecaca !important;
            }
            .subject-card {
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 8px;
              margin-bottom: 6px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .subject-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 2px;
            }
            .subject-card h3 {
              margin: 0;
              font-size: 12px;
              color: #0f172a;
            }
            .faculty-name {
              margin: 0;
              font-size: 11px;
              color: #475569;
              font-weight: 700;
            }
            .subject-avg {
              margin: 4px 0 4px;
              color: #334155;
              font-size: 10px;
              font-weight: 600;
            }
            .highlight-sub-rating {
              background: #fff7ed;
              color: #c2410c;
              padding: 2px 6px;
              border-radius: 4px;
              display: inline-block;
              border: 1px solid #ffedd5;
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
              background: #f8fafc;
            }
            .admin-remark h2 {
              margin: 0 0 4px;
              color: #0f172a;
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
                <h1>Student Performance Report</h1>
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

        <div className="flex-1 overflow-y-auto scrollbar-hide p-8">
          {activeView === 'profile' ? (
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
                          phoneNumber: formatIndianMobileInput(student.phoneNumber ?? ''),
                          dateOfBirth: student.dateOfBirth ?? '',
                          parentContact: formatIndianMobileInput(student.parentContact ?? ''),
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
                    <p className="text-gray-900 font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-teal-600" /> {student.name}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roll Number</p>
                  <p className="text-gray-900 font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-600" /> {student.rollNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</p>
                  {isEditingProfile ? (
                    <input
                      type="tel"
                      value={profileDraft.phoneNumber}
                      onChange={(e) => setProfileDraft((prev) => ({ ...prev, phoneNumber: formatIndianMobileInput(e.target.value) }))}
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
                    <p className="text-gray-900 font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-cyan-600" /> {student.dateOfBirth || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Parent's Contact</p>
                  {isEditingProfile ? (
                    <input
                      type="tel"
                      value={profileDraft.parentContact}
                      onChange={(e) => setProfileDraft((prev) => ({ ...prev, parentContact: formatIndianMobileInput(e.target.value) }))}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveView('ratings')}
                  className="py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Star className="w-5 h-5 fill-current" /> View Detailed Ratings
                </button>
                <button
                  onClick={() => setActiveView('performance')}
                  className="py-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-5 h-5" /> View Test Performance
                </button>
              </div>
            </div>
          ) : activeView === 'performance' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button onClick={() => setActiveView('profile')} className="text-teal-600 font-bold flex items-center gap-1 hover:underline">
                  <ChevronLeft className="w-4 h-4" /> Back to Profile
                </button>
                <h4 className="text-xl font-bold text-gray-900">Test Performance Summary</h4>
              </div>

              {isPerformanceLoading ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center shadow-sm">
                  <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="font-semibold text-gray-700">Loading test performance...</p>
                </div>
              ) : performanceError ? (
                <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 px-6 py-10 text-center shadow-sm">
                  <BarChart3 className="mx-auto mb-3 h-10 w-10 text-red-300" />
                  <p className="font-semibold text-red-700">{performanceError}</p>
                </div>
              ) : testPerformanceRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center shadow-sm">
                  <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="font-semibold text-gray-700">No tests found for this batch</p>
                  <p className="mt-2 text-sm text-gray-500">Once tests are assigned to the batch, results will appear here.</p>
                </div>
              ) : (
                <>
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
                        {testPerformanceRows.map((perf) => {
                          const isAttempted = perf.status === 'Attempted';
                          return (
                            <tr
                              key={perf.id}
                              className={`transition-colors ${isAttempted ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'bg-red-50/40 hover:bg-red-50/70'
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
                  <p className="text-xs text-gray-400 italic">* This table is for review only and is not included in the printed report.</p>
                </>
              )}
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
                            { label: 'Attendance', val: Number(((r.attendance / (r.total_classes || 1)) * 5).toFixed(1)) },
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

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 shrink-0 justify-end">
          {isEditingProfile && (
            <button
              type="button"
              onClick={handleResetPassword}
              className="px-6 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition shadow-sm sm:mr-auto"
            >
              Reset Password
            </button>
          )}
          <button
            onClick={onClose}
            className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition shadow-sm flex-1 sm:flex-none"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}


