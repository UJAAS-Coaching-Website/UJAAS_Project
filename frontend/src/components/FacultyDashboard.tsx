import { useEffect, useState, type ChangeEvent } from 'react';
import { User, Tab } from '../App';
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
  Bell,
  Save,
  Check,
  Megaphone
} from 'lucide-react';
import UploadNoticeModal from './UploadNoticeModal';
import { StudentRating } from './StudentRating';
import { StudentRankingsEnhanced } from './StudentRankingsEnhanced';
import { FacultyProfile } from './FacultyProfile';
import { MiniAvatar } from './MiniAvatar';
import { NotificationCenter, Notification } from './NotificationCenter';
import { Footer } from './Footer';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { CreateTestSeries } from './CreateTestSeries';
import { TestPerformanceInsights, StudentPerformance } from './TestPerformanceInsights';
import { CreateDPP } from './CreateDPP';
import { UploadNotes } from './UploadNotes';
import { QuestionBank } from './QuestionBank';
import { TestPreviewAndReview } from './TestPreviewAndReview';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.svg';
import { NotesManagementTab } from './NotesManagementTab';
import { fetchTestAnalysis, fetchTests } from '../api/tests';
import { generateInitialPassword } from '../utils/passwords';

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
  onUpdateBatch: (label: string, subjects?: string[], facultyAssigned?: string[], oldLabel?: string) => Promise<{ ok: boolean; error?: string }>;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  publishedTests: import('../App').PublishedTest[];
  onPreviewTest: (testId: string) => void;
  onUpdatePublishedTest: (testId: string, updates: Partial<import('../App').PublishedTest>) => void;
  selectedPreviewTest: import('../App').PublishedTest | null;
  adminStudents?: import('../api/students').ApiStudent[];
  onUpdateStudentRating: (studentId: string, data: any) => Promise<void>;
}

export type FacultyTab = 'home' | 'students' | 'content' | 'analytics' | 'test-series' | 'ratings' | 'rankings' | 'create-test' | 'create-dpp' | 'upload-notes' | 'profile' | 'add-student' | 'preview-test' | 'question-bank';
type Batch = string;
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
  totalAttendance: number;
  totalClasses: number;
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

function getAttendanceRatingValue(attendance?: number, totalClasses?: number, attendanceRating?: number): number {
  if (typeof attendanceRating === 'number' && Number.isFinite(attendanceRating)) {
    return Math.max(0, Math.min(5, attendanceRating));
  }
  const attendanceCount = Number(attendance ?? 0);
  const classCount = Number(totalClasses ?? 0);
  if (classCount > 0) {
    return Math.max(0, Math.min(5, (attendanceCount / classCount) * 5));
  }
  return Math.max(0, Math.min(5, attendanceCount));
}

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
  selectedPreviewTest,
  adminStudents,
  onUpdateStudentRating
}: FacultyDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);

  const facultySubject =
    ((user as any).facultyDetails?.subjectSpecialty ||
      faculty.find(
        (f) =>
          (user.email && f.email.toLowerCase() === user.email.toLowerCase()) ||
          f.name.toLowerCase() === user.name.toLowerCase()
      )?.subject) ?? null;

  useEffect(() => {
    document.documentElement.classList.add('scrollbar-hide');
    document.body.classList.add('scrollbar-hide');
    return () => {
      document.documentElement.classList.remove('scrollbar-hide');
      document.body.classList.remove('scrollbar-hide');
    };
  }, []);

  useEffect(() => {
    if (adminStudents && adminStudents.length > 0) {
      const mappedStudents: Student[] = adminStudents.map(api => {
        const subRatings = (api as any).subject_ratings || {};
        const subRemarks = (api as any).subject_remarks || {};
        const facultySubData = facultySubject ? subRatings[facultySubject] : null;
        
        const subjectValues = Object.values(subRatings || {});
        const overallFromSubjects = subjectValues.length > 0
          ? subjectValues.reduce((acc, curr) => {
              const attendanceRating = getAttendanceRatingValue(curr.attendance, curr.total_classes, curr.attendanceRating);
              return acc + (attendanceRating + curr.tests + curr.dppPerformance + curr.behavior) / 4;
            }, 0) / subjectValues.length
          : null;

        return {
          id: api.id,
          name: api.name,
          rollNumber: api.roll_number,
          enrolledCourses: api.assigned_batch ? [api.assigned_batch.name] : [],
          joinDate: api.join_date || new Date().toISOString().split('T')[0],
          performance: (overallFromSubjects ?? (((api.rating_attendance || 0) + api.rating_assignments + api.rating_participation + api.rating_behavior) / 4)) * 20,
          rating: overallFromSubjects ?? (((api.rating_attendance || 0) + api.rating_assignments + api.rating_participation + api.rating_behavior) / 4),
          batch: api.assigned_batch?.name || "",
          phoneNumber: api.phone || '',
          dateOfBirth: api.date_of_birth || '',
          address: api.address || '',
          parentContact: api.parent_contact || '',
          totalAttendance: facultySubData ? facultySubData.attendance : api.rating_attendance,
          totalClasses: facultySubData ? facultySubData.total_classes : api.rating_total_classes,
          subjectRatings: subRatings,
          subjectRemarks: subRemarks,
          adminRemark: (api as any).admin_remark || '',
        };
      });
      setStudents(mappedStudents);
    } else {
      setStudents([]);
    }
  }, [adminStudents, batches, facultySubject]);

  const [studentModal, setStudentModal] = useState<{ open: boolean; initialData?: StudentFormState; defaultBatch: Batch | null; title: string; }>({
    open: false,
    defaultBatch: null,
    title: 'Add Student',
  });

  const [batchModal, setBatchModal] = useState<{ open: boolean; batchLabel?: string; }>({ open: false });
  const [ratingModal, setRatingModal] = useState<{ open: boolean; student?: Student; }>({ open: false });
  const [showFullTimetable, setShowFullTimetable] = useState(false);
  const selectedBatchInfo = selectedBatch
    ? batches.find((batch) => batch.label === selectedBatch)
    : null;

  useEffect(() => {
    if (showFullTimetable) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showFullTimetable]);
  const [batchStudentPicker, setBatchStudentPicker] = useState<{ open: boolean; batch: Batch | null }>({
    open: false,
    batch: null
  });
  const [performanceInsightsTestId, setPerformanceInsightsTestId] = useState<string | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  useBodyScrollLock(
    studentModal.open ||
    batchModal.open ||
    ratingModal.open ||
    showFullTimetable ||
    batchStudentPicker.open
  );

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
      setStudents(prev => [{ id: `student-${Date.now()}`, name: data.name, rollNumber: data.rollNumber, enrolledCourses: [], joinDate: new Date().toISOString().slice(0, 10), performance: 0, rating: 0, batch: data.batch, phoneNumber: data.phoneNumber, dateOfBirth: data.dateOfBirth, address: data.address, parentContact: data.parentContact, totalAttendance: 0, totalClasses: 0 }, ...prev]);
      const initialPassword = generateInitialPassword(data.name);
      const loginId = data.rollNumber || 'Not provided';
      window.alert(`New Student added successfully!\n\nName: ${data.name}\nLogin ID: ${loginId}\nInitial Password: ${initialPassword}`);
    }
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  }; const handleRemoveStudentFromBatch = (id: string, batch: Batch) => {
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

  const handleTimetableDownload = async (fileUrl: string | null | undefined) => {
    if (!fileUrl) return;
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to download timetable.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const fileName = fileUrl.split('/').pop()?.split('?')[0] || 'timetable';
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Timetable download failed:', error);
      window.alert('Failed to download timetable. Please try again.');
    }
  };

  const openStudentRatings = (student: Student) => setRatingModal({ open: true, student });
  const closeStudentRatings = () => setRatingModal({ open: false });
  const handleSaveFacultySubjectRating = async (
    studentId: string,
    subject: string,
    ratings: { attendance: number; total_classes?: number; tests: number; dppPerformance: number; behavior: number }
  ) => {
    try {
      await onUpdateStudentRating(studentId, {
        subject,
        ...ratings
      });

      setStudents((prev) =>
        prev.map((student) => {
          if (student.id !== studentId) return student;

          const updatedSubjectRatings = {
            ...(student.subjectRatings ?? {}),
            [subject]: {
              attendance: Math.max(0, ratings.attendance),
              total_classes: ratings.total_classes,
              tests: Math.max(0, Math.min(5, ratings.tests)),
              dppPerformance: Math.max(0, Math.min(5, ratings.dppPerformance)),
              behavior: Math.max(0, Math.min(5, ratings.behavior)),
            },
          };

          const values = Object.values(updatedSubjectRatings);
          const avg =
            values.length > 0
              ? values.reduce((acc, curr) => acc + (curr.attendance / (curr.total_classes || 1) * 5 + curr.tests + curr.dppPerformance + curr.behavior) / 4, 0) /
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
                attendance: Math.max(0, ratings.attendance),
                total_classes: ratings.total_classes,
                tests: Math.max(0, Math.min(5, ratings.tests)),
                dppPerformance: Math.max(0, Math.min(5, ratings.dppPerformance)),
                behavior: Math.max(0, Math.min(5, ratings.behavior)),
              },
            },
          },
        };
      });
    } catch (error: any) {
      alert("Failed to save rating: " + error.message);
    }
  };
  const handleSaveFacultySubjectRemark = async (studentId: string, subject: string, remark: string) => {
    const cleanedRemark = remark.trim();
    try {
      await onUpdateStudentRating(studentId, {
        subject,
        remarks: cleanedRemark
      });

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
    } catch (error: any) {
      alert("Failed to save remark: " + error.message);
    }
  };
  const closeBatchModal = () => setBatchModal((prev) => ({ ...prev, open: false }));

  return (
    <div className="footer-reveal-page footer-reveal-page--nav min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col pt-16">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-layer-navbar shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.button
              onClick={onClearBatch}
              className="flex items-center gap-3"
            >
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <span className="navbar-brand-wordmark hidden text-xl sm:inline" style={{ color: 'rgb(159, 29, 14)' }}>
                UJAAS Faculty
              </span>
            </motion.button>

            {/* Center Navigation Tabs */}
            {!selectedBatch ? (
              <div className="flex items-center gap-2">
                {[
                  { id: 'batches', label: 'Batches', icon: GraduationCap },
                  { id: 'test-series', label: 'Test Series', icon: FileText },
                  { id: 'question-bank', label: 'Question Bank', icon: BookOpen }
                ].map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        if (section.id === 'question-bank') {
                          onNavigate('question-bank');
                        } else {
                          onNavigateSection(section.id as FacultySection);
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${(activeTab === section.id || (section.id === 'test-series' && (activeTab === 'test-series' || activeTab === 'create-test')) || (section.id === 'batches' && adminSection === 'batches' && activeTab !== 'question-bank')) && activeTab !== 'profile'
                        ? 'bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="hidden sm:inline">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {[
                  { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'students', label: 'Batch Students', icon: Users },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onNavigate(tab.id as Tab)}
                      className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${activeTab === tab.id && activeTab !== 'profile'
                        ? 'bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => onNavigate('profile')}
                className="p-0 border-none bg-transparent"
                title="View Profile"
              >
                <MiniAvatar user={user as any} className="w-10 h-10" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="footer-reveal-main w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <motion.div
          key={`${selectedBatch || adminSection}-${activeTab}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Layered Rendering Logic - Standard across dashboards */}
          {activeTab === 'create-test' ? (
            <CreateTestSeries onBack={() => onNavigate('test-series')} batches={batches.filter((batch) => batch.is_active)} />
          ) : activeTab === 'question-bank' ? (
            <QuestionBank
              userRole="faculty"
              userSubject={facultySubject || 'Physics'}
              batches={batches.map(b => b.label)}
              onBack={() => onNavigate('home')}
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
                isPreview={false}
                isFacultyPreview={true}
                availableBatches={batches.filter((batch) => batch.is_active)}
                initialBatches={selectedPreviewTest.batches}
              />
            </div>
          ) : activeTab === 'create-dpp' ? (
            <CreateDPP onBack={() => onNavigate('home')} />
          ) : activeTab === 'upload-notes' ? (
            <UploadNotes onBack={() => onNavigate('home')} />
          ) : activeTab === 'profile' ? (
            <FacultyProfile user={user as any} onLogout={onLogout} />
          ) : !selectedBatch ? (
            /* GLOBAL CONTEXT */
            <>
              {adminSection === 'batches' && (
                <BatchSelectionTab
                  batches={batches}
                  onSelectBatch={onSelectBatch}
                  facultyName={user.name}
                  onUploadNotice={() => setIsNoticeModalOpen(true)}
                />
              )}
              {adminSection === 'test-series' && (
                <TestSeriesManagementTab
                  onNavigate={onNavigate}
                  selectedBatch={null as unknown as Batch}
                  onChangeBatch={() => { }}
                  publishedTests={publishedTests.filter(t => t.batches.some(tb => batches.some(b => b.label === tb && b.facultyAssigned?.includes(user.name))))}
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
                  batches={batches}
                />
              )}
              {activeTab === 'students' && (
                <StudentsTab
                  students={students}
                  selectedBatch={selectedBatch}
                  onChangeBatch={onClearBatch}
                  onViewStudent={openStudentRatings}
                  facultySubject={facultySubject}
                  onUpdateRating={onUpdateStudentRating}
                  isBatchActive={batches.find((batch) => batch.label === selectedBatch)?.is_active !== false}
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
              batches={batches}
              facultySubject={facultySubject}
              onSaveSubjectRating={handleSaveFacultySubjectRating}
              onSaveSubjectRemark={handleSaveFacultySubjectRemark}
            />
          )}
        </AnimatePresence>

        <UploadNoticeModal
          isOpen={isNoticeModalOpen}
          onClose={() => setIsNoticeModalOpen(false)}
          batches={batches
            .filter(b => b.facultyAssigned?.includes(user.name))
            .map(b => ({
              id: b.id || '',
              name: b.label,
              slug: b.slug,
              is_active: b.is_active !== false
            }))
          }
          userRole="faculty"
        />

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
                  {selectedBatchInfo?.timetable_url ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img src={selectedBatchInfo.timetable_url} alt="Full Time Table" className="max-w-full max-h-full object-contain rounded-xl shadow-xl bg-white" />
                    </div>
                  ) : (
                    <div className="text-center py-20 w-full">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No timetable uploaded yet.</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0 z-20">
                  {selectedBatchInfo?.timetable_url && (
                    <button
                      type="button"
                      onClick={() => handleTimetableDownload(selectedBatchInfo.timetable_url)}
                      className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-blue-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200/60 border border-indigo-500/60"
                    >
                      <Download className="w-4 h-4" />Download
                    </button>
                  )}
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

function BatchSelectionTab({ batches, onSelectBatch, facultyName, onUploadNotice }: { batches: BatchInfo[]; onSelectBatch: (batch: Batch) => void; facultyName: string; onUploadNotice: () => void }) {
  // Only show batches where faculty is assigned
  const facultyBatches = batches.filter(b => b.facultyAssigned?.includes(facultyName));
  const sortedBatches = [...facultyBatches].sort((a, b) => {
    if ((a.is_active !== false) === (b.is_active !== false)) return a.label.localeCompare(b.label);
    return a.is_active === false ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Batch Management</h2>
            <p className="text-gray-600">Open one of your assigned batches to review students, attendance, and academic content.</p>
          </div>
          <button
            onClick={onUploadNotice}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-md whitespace-nowrap"
          >
            <Megaphone className="w-5 h-5" />
            Upload Notice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedBatches.map((batch) => (
          <motion.button
            key={batch.slug}
            onClick={() => onSelectBatch(batch.label)}
            className={`p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white text-left group transition-all duration-300 ${batch.is_active === false ? 'opacity-60 grayscale' : 'hover:shadow-2xl'} flex items-center justify-between gap-4`}
          >
            <div className="flex-1">
              <div className="mb-1">
                <span className="text-black font-normal text-xs tracking-widest uppercase">Batch</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-between">
                {batch.label}
                {batch.is_active === false && <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-3 py-1 rounded-full uppercase tracking-wider">Inactive</span>}
              </h3>
            </div>
            <ChevronRight className="w-8 h-8 text-cyan-600 group-hover:translate-x-1 transition-transform shrink-0" />
          </motion.button>
        ))}
      </div>
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
  students: _students,
  onNavigate,
  onClearBatch,
  onViewTimetable,
  facultySubject,
  batches
}: {
  selectedBatch: Batch | null;
  students: Student[];
  onNavigate: (tab: Tab) => void;
  onClearBatch: () => void;
  onViewTimetable: () => void;
  facultySubject: string | null;
  batches: BatchInfo[];
}) {
  if (!selectedBatch) return null;
  const currentBatch = batches.find((batch) => batch.label === selectedBatch);
  const isBatchActive = currentBatch?.is_active !== false;
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 p-8 rounded-3xl shadow-xl text-white mb-8">
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
          <p className="text-teal-50/90 font-medium">Batch Academic Overview & Content</p>
          </div>
        </div>
      </div>

      {/* Batch Content Section */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-1 border border-gray-100">
        <div className="p-1">
          <NotesManagementTab
              onNavigate={onNavigate}
              selectedBatch={selectedBatch}
              onChangeBatch={onClearBatch}
              onViewTimetable={onViewTimetable}
              facultySubject={facultySubject}
              batches={batches}
              readOnly={!isBatchActive}
              headerMode="full"
              variant="faculty"
          />
        </div>
      </div>
    </div>
  );
}

function StudentsTab({
  students,
  selectedBatch,
  onViewStudent,
  facultySubject,
  onUpdateRating,
  isBatchActive
}: {
  students: Student[];
  selectedBatch: Batch;
  onChangeBatch: () => void;
  onViewStudent: (s: Student) => void;
  facultySubject: string | null;
  onUpdateRating: (studentId: string, data: any) => Promise<void>;
  isBatchActive?: boolean;
}) {
  const batchStudents = students.filter(s => s.batch === selectedBatch);
  
  // Local state for batch-level total classes
  const initialBatchTotalClasses = batchStudents.length > 0 ? batchStudents[0].totalClasses : 0;
  const [batchTotalClasses, setBatchTotalClasses] = useState(initialBatchTotalClasses);
  const [localAttendance, setLocalAttendance] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);

  useEffect(() => {
    const att: Record<string, number> = {};
    batchStudents.forEach(s => {
      att[s.id] = s.totalAttendance;
    });
    setLocalAttendance(att);
    setBatchTotalClasses(batchStudents.length > 0 ? batchStudents[0].totalClasses : 0);
  }, [students, selectedBatch]);

  const handleSaveTotalClasses = () => {
    setIsEditingTotal(false);
    setIsEditingAttendance(true);
  };

  const handleSaveAttendance = async () => {
    if (!facultySubject) {
      alert("Faculty subject not assigned.");
      return;
    }
    setIsSaving(true);
    try {
      const promises = batchStudents.map(s => 
        onUpdateRating(s.id, {
          subject: facultySubject,
          total_classes: batchTotalClasses,
          attendance: localAttendance[s.id] || 0
        })
      );
      await Promise.all(promises);
      alert("Attendance updated successfully!");
      setIsEditingAttendance(false);
    } catch (error: any) {
      alert("Failed to update attendance: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Batch Students</h2>
          <p className="text-gray-500">{selectedBatch} • {batchStudents.length} Students</p>
        </div>
        
        {isBatchActive && facultySubject && (
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-teal-700 whitespace-nowrap">Total Classes Taken:</label>
              {isEditingTotal ? (
                <input
                  type="number"
                  min="0"
                  value={batchTotalClasses}
                  onChange={(e) => setBatchTotalClasses(parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-2 rounded-xl border border-teal-200 focus:ring-2 focus:ring-teal-500 outline-none font-bold text-center"
                />
              ) : (
                <span className="text-xl font-black text-teal-900 px-4">{batchTotalClasses}</span>
              )}
            </div>
            
            {!isEditingTotal && !isEditingAttendance && (
              <button
                onClick={() => setIsEditingTotal(true)}
                className="px-6 py-2 bg-white text-teal-600 border border-teal-200 rounded-xl font-bold shadow-sm hover:bg-teal-50 transition flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Update Total Classes
              </button>
            )}

            {isEditingTotal && (
              <button
                onClick={handleSaveTotalClasses}
                className="px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Proceed to Attendance
              </button>
            )}

            {isEditingAttendance && (
              <button
                onClick={handleSaveAttendance}
                disabled={isSaving}
                className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save All Attendance'}
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
              <tr key={s.id} onClick={() => !isEditingAttendance && onViewStudent(s)} className={`hover:bg-gray-50/50 transition-colors ${!isEditingAttendance ? 'cursor-pointer' : ''} group`}>
                <td className="py-4 px-4">
                  <div className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors truncate">{s.name}</div>
                  <div className="text-xs text-gray-500 truncate">{s.rollNumber}</div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600 font-mono">{s.rollNumber}</td>
                <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {isEditingAttendance && batchTotalClasses > 0 ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          max={batchTotalClasses}
                          value={localAttendance[s.id] ?? 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setLocalAttendance({ ...localAttendance, [s.id]: Math.min(val, batchTotalClasses) });
                          }}
                          className="w-16 px-2 py-1 rounded border border-teal-200 focus:ring-2 focus:ring-teal-100 outline-none font-medium"
                        />
                        <span className="text-gray-400 font-medium">/ {batchTotalClasses}</span>
                      </>
                    ) : (
                      <span className="font-bold text-gray-700">
                        {s.totalAttendance} / {s.totalClasses}
                      </span>
                    )}
                  </div>
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
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${test.status === 'live' ? 'bg-green-100 text-green-700' :
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
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl border border-white">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); onSubmit({ id: initialData?.id, name: f.get('name'), rollNumber: f.get('roll'), batch: f.get('batch') }); onClose(); }} className="space-y-4">
          <input name="name" defaultValue={initialData?.name} placeholder="Student Name" required className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <input name="roll" defaultValue={initialData?.rollNumber} placeholder="Roll Number" required className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          <select name="batch" defaultValue={initialData?.batch || defaultBatch || ''} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white">
            {batches.map((b: any) => <option key={b.slug} value={b.label}>{b.label}</option>)}
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
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl border border-white">
        <h2 className="text-2xl font-bold mb-6">Edit Batch</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const result = await onUpdateBatch(batchLabel);
          if (result.ok) {
            onClose();
          } else {
            window.alert(result.error ?? 'Unable to update batch.');
          }
        }} className="space-y-4">
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
  batches,
  facultySubject,
  onSaveSubjectRating,
  onSaveSubjectRemark,
}: {
  open: boolean;
  student?: Student;
  onClose: () => void;
  batches: BatchInfo[];
  facultySubject?: string | null;
  onSaveSubjectRating?: (
    studentId: string,
    subject: string,
    ratings: { attendance: number; total_classes?: number; tests: number; dppPerformance: number; behavior: number }
  ) => void;
  onSaveSubjectRemark?: (studentId: string, subject: string, remark: string) => void;
}) {
  const [activeView, setActiveView] = useState<'profile' | 'ratings' | 'performance'>('profile');
  const [draftRatings, setDraftRatings] = useState<Record<string, { attendance: string; tests: string; dppPerformance: string; behavior: string }>>({});
  const [draftRemarks, setDraftRemarks] = useState<Record<string, string>>({});
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingRemarkSubject, setEditingRemarkSubject] = useState<string | null>(null);
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
    setEditingSubject(null);
    setEditingRemarkSubject(null);
    const nextDrafts: Record<string, { attendance: string; tests: string; dppPerformance: string; behavior: string }> = {};
    const nextRemarks: Record<string, string> = {};
    Object.entries(student.subjectRatings ?? {}).forEach(([subject, r]) => {
      const attRating = (r.attendance / (r.total_classes || 1)) * 5;
      nextDrafts[subject] = {
        attendance: attRating.toFixed(1),
        tests: (r.tests ?? 0).toString(),
        dppPerformance: (r.dppPerformance ?? 0).toString(),
        behavior: (r.behavior ?? 0).toString(),
      };
      nextRemarks[subject] = student.subjectRemarks?.[subject] ?? '';
    });
    setDraftRatings(nextDrafts);
    setDraftRemarks(nextRemarks);
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
          status: attempted ? 'Attempted' : 'Not Attempted',
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

        <div className="flex-1 overflow-y-auto scrollbar-hide p-8">
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
                      attendance: getAttendanceRatingValue(r.attendance, r.total_classes, r.attendanceRating).toFixed(1),
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
                                { label: 'Attendance Rating', key: 'attendance', readOnly: true },
                                { label: 'Test Performance', key: 'tests' },
                                { label: 'DPP Performance', key: 'dppPerformance' },
                                { label: 'Class Behaviour', key: 'behavior' },
                              ].map((item) => (
                                <div key={item.key} className="space-y-1">
                                  <label className="text-xs font-bold text-gray-500 uppercase">
                                    {item.label} {item.key === 'attendance' && <span className="text-[10px] text-teal-600 normal-case ml-1">(Auto-calculated)</span>}
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    readOnly={item.key === 'attendance'}
                                    value={currentDraft[item.key as keyof typeof currentDraft]}
                                    onChange={(e) => setDraftRatings((prev) => ({
                                      ...prev,
                                      [subject]: {
                                        ...(prev[subject] || currentDraft),
                                        [item.key]: e.target.value
                                      }
                                    }))}
                                    className={`w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all ${item.key === 'attendance' ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
                                  />
                                </div>
                              ))}                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const ratings = {
                                  attendance: null as any, // Do not update count from this modal
                                  tests: Number(currentDraft.tests),
                                  dppPerformance: Number(currentDraft.dppPerformance),
                                  behavior: Number(currentDraft.behavior),
                                };

                                const invalid = [ratings.tests, ratings.dppPerformance, ratings.behavior].some(v => Number.isNaN(v) || v < 0 || v > 5);
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
                        {!isEditing && (
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                              { label: 'Attendance', value: getAttendanceRatingValue(r.attendance, r.total_classes, r.attendanceRating) },
                              { label: 'Test Performance', value: Number(r.tests ?? 0) },
                              { label: 'DPP Performance', value: Number(r.dppPerformance ?? 0) },
                              { label: 'Class Behaviour', value: Number(r.behavior ?? 0) }
                            ].map(param => (
                              <div key={param.label} className="flex flex-col gap-3">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                                  <span>{param.label}</span>
                                  <span>{param.value.toFixed(1)}/5</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="scale-110 origin-left">
                                    {renderPerformanceStars(param.value)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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

