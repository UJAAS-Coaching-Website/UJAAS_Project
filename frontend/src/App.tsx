import { useState, useEffect, useRef, useCallback } from 'react';
import { Login } from './components/Login';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard, type AdminTab, type AdminSection } from './components/AdminDashboard';
import { FacultyDashboard, type FacultyTab, type FacultySection } from './components/FacultyDashboard';
import { GetStarted } from './components/GetStarted';
import { Notification } from './components/NotificationCenter';
import { me, logout as logoutRequest, StudentDetails } from './api/auth';
import {
  fetchLandingData,
  updateLandingData as apiUpdateLanding,
  fetchQueries,
  submitQuery as apiSubmitQuery,
  updateQueryStatus as apiUpdateQueryStatus,
  deleteQuery as apiDeleteQuery,
} from './api/landing';
import {
  fetchBatches as apiFetchBatches,
  createBatch as apiCreateBatch,
  updateBatch as apiUpdateBatch,
  deleteBatch as apiDeleteBatch,
  permanentlyDeleteBatch as apiPermanentlyDeleteBatch,
  type ApiBatch,
} from './api/batches';
import {
  fetchFaculties,
  createFaculty as apiCreateFaculty,
  updateFaculty as apiUpdateFaculty,
  deleteFacultyApi as apiDeleteFaculty,
  type ApiFaculty,
} from './api/faculties';
import {
  fetchStudents as apiFetchStudents,
  createStudent as apiCreateStudent,
  updateStudent as apiUpdateStudent,
  deleteStudent as apiDeleteStudent,
  assignStudentToBatch as apiAssignStudentToBatch,
  removeStudentFromBatch as apiRemoveStudentFromBatch,
  updateStudentRating as apiUpdateStudentRating,
  type ApiStudent,
} from './api/students';
import {
  fetchSubjects as apiFetchSubjects,
  deleteSubjectGlobal as apiDeleteSubjectGlobal,
  deleteSubjectFromBatch as apiDeleteSubjectFromBatch,
  type ApiSubject,
} from './api/subjects';
import {
  fetchTests as apiFetchTests,
  fetchTestById as apiFetchTestById,
  createTest as apiCreateTest,
  updateTestStatus as apiUpdateTestStatus,
  forceTestLiveNow as apiForceTestLiveNow,
  updateTestApi,
  deleteTestApi as apiDeleteTest,
  type ApiTest,
} from './api/tests';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import logo from './assets/logo.svg';
import { DashboardHeroSkeleton, StatCardSkeleton, SubjectCardSkeleton, TableRowsSkeleton, TestCardSkeleton } from './components/ui/content-skeletons';
import { Skeleton } from './components/ui/skeleton';

function parseQuestionCorrectAnswer(type: string, correctAnswer: string) {
  if (type === 'MCQ') {
    return Number(correctAnswer);
  }

  if (type === 'MSQ') {
    try {
      const parsed = JSON.parse(correctAnswer);
      return Array.isArray(parsed) ? parsed.map((value) => Number(value)).filter(Number.isFinite) : [];
    } catch {
      return [];
    }
  }

  return correctAnswer;
}

export interface User {
  id: string;
  name: string;
  email?: string | null;
  role: 'student' | 'faculty' | 'admin';
  enrolledCourses?: string[];
  studentDetails?: StudentDetails | null;
}

export interface LandingFaculty {
  name: string;
  subject: string;
  designation: string;
  experience: string;
  image: string;
}

export interface LandingAchiever {
  name: string;
  achievement: string;
  year: string;
  image: string;
}

export interface LandingVision {
  id: string;
  name: string;
  designation: string;
  vision: string;
  image: string;
}

export interface LandingContact {
  phone: string;
  email: string;
  address: string;
}

export interface LandingQuery {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  courseId?: string;
  message?: string;
  date: string;
  status: 'new' | 'seen' | 'contacted';
}

export interface LandingCourse {
  id: string;
  name: string;
}

export interface LandingData {
  courses: LandingCourse[];
  faculty: LandingFaculty[];
  achievers: LandingAchiever[];
  visions: LandingVision[];
  contact: LandingContact;
}

export interface PublishedTest {
  id: string;
  title: string;
  format: string;
  batches: string[];
  duration: number;
  totalMarks: number;
  questionCount?: number;
  enrolledCount?: number;
  scheduleDate: string;
  scheduleTime: string;
  questions: any[];
  instructions?: string;
  status: 'draft' | 'upcoming' | 'live';
  submittedAttemptCount?: number;
  maxAttempts?: number;
  hasActiveAttempt?: boolean;
  activeAttemptId?: string | null;
  latestAttemptId?: string | null;
  latestAttemptSubmittedAt?: string | null;
  latestAttemptTimeSpent?: number | null;
}

export const studentTabs = ['home', 'test-series', 'profile', 'batch-detail', 'question-bank'] as const;
export const adminTabs = [
  'home',
  'students',
  'faculty',
  'content',
  'analytics',
  'test-series',
  'ratings',
  'rankings',
  'create-test',
  'create-dpp',
  'upload-notice',
  'upload-notes',
  'profile',
  'preview-test',
  'question-bank',
] as const;

export const adminLandingSections = ['landing', 'batches', 'students', 'faculty', 'test-series', 'queries'] as const;

export type StudentTab = (typeof studentTabs)[number];
export type Tab = StudentTab | AdminTab | FacultyTab | 'add-student';

export type AdminLandingSection = AdminSection | FacultySection;

function DashboardLoadingShell({ role }: { role: User['role'] }) {
  const showManagementRows = role === 'admin' || role === 'faculty';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <div className="border-b border-white bg-white/70 backdrop-blur-lg shadow-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="UJAAS Logo" className="h-10 w-10 object-contain opacity-80" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <DashboardHeroSkeleton />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={`dashboard-stat-skeleton-${index}`} />
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: role === 'student' ? 4 : 6 }).map((_, index) => (
              <SubjectCardSkeleton key={`dashboard-card-skeleton-${index}`} />
            ))}
          </div>

          {showManagementRows ? (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
              <TableRowsSkeleton rows={6} columns={role === 'admin' ? 5 : 4} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <TestCardSkeleton key={`dashboard-test-skeleton-${index}`} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  type AdminBatch = string;
  type AdminBatchInfo = {
    id?: string;
    label: string;
    slug: string;
    subjects?: string[];
    facultyAssigned?: string[];
    is_active?: boolean;
    studentCount?: number;
    testsConducted?: number;
    averagePerformance?: number;
  };

  /** Convert API batch to local AdminBatchInfo format */
  const apiBatchToInfo = (b: ApiBatch): AdminBatchInfo => ({
    id: b.id,
    label: b.name,
    slug: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'batch',
    subjects: b.subjects ?? undefined,
    facultyAssigned: b.faculty?.map((f: { name: string }) => f.name) ?? undefined,
    is_active: b.is_active,
    studentCount: b.student_count || 0,
    testsConducted: (b as any).testsConducted || 0,
    averagePerformance: (b as any).averagePerformance || 0,
  });

  const [user, setUser] = useState<User | null>(null);
  const hasShownStorageWarning = useRef(false);

  const safeSetLocalStorage = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to persist ${key} in localStorage`, error);
      if (
        key === 'ujaasLandingData' &&
        !hasShownStorageWarning.current &&
        typeof window !== 'undefined'
      ) {
        hasShownStorageWarning.current = true;
        window.alert('Storage is full. New faculty/achiever images will work now but may not be saved after refresh. Use smaller images.');
      }
    }
  };

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [studentSubTab, setStudentSubTab] = useState<string | undefined>(undefined);
  const [queries, setQueries] = useState<LandingQuery[]>([]);

  const handleAddQuery = async (query: { name: string; email: string; phone: string; courseId: string; message?: string }) => {
    try {
      const newQuery = await apiSubmitQuery(query);
      setQueries(prev => [newQuery as LandingQuery, ...prev]);
    } catch (error) {
      console.error('Failed to submit query:', error);
      // Fallback: add locally
      const courseName = landingData.courses.find(c => c.id === query.courseId)?.name ?? query.courseId;
      const fallback: LandingQuery = {
        name: query.name,
        email: query.email,
        phone: query.phone,
        course: courseName,
        courseId: query.courseId,
        message: query.message,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        status: 'new'
      };
      setQueries(prev => [fallback, ...prev]);
    }
  };

  const handleUpdateQueries = useCallback(async (updatedQueries: LandingQuery[]) => {
    // Find queries whose status changed and sync with API
    for (const q of updatedQueries) {
      const prev = queries.find(old => old.id === q.id);
      if (prev && prev.status !== q.status) {
        try {
          await apiUpdateQueryStatus(q.id, q.status);
        } catch (error) {
          console.error('Failed to update query status:', error);
        }
      }
    }
    setQueries(updatedQueries);
  }, [queries]);

  const handleDeleteQuery = useCallback(async (id: string) => {
    try {
      await apiDeleteQuery(id);
      setQueries(prev => prev.filter(q => q.id !== id));
    } catch (error) {
      console.error('Failed to delete query:', error);
    }
  }, []);

  const [landingData, setLandingData] = useState<LandingData>(() => {
    const defaultData = {
      courses: [
        { id: 'fallback-1', name: 'JEE MAINS / ADVANCED' },
        { id: 'fallback-2', name: 'NEET' },
        { id: 'fallback-3', name: 'BOARDS' },
        { id: 'fallback-4', name: 'GUJCET' },
        { id: 'fallback-5', name: '11TH SCIENCE' },
        { id: 'fallback-6', name: '12TH SCIENCE' },
        { id: 'fallback-7', name: '7TH TO 10TH FOUNDATION' },
        { id: 'fallback-8', name: 'DROPPER BATCH' }
      ],
      faculty: [
        {
          name: 'Dr. Rajesh Kumar',
          subject: 'Physics',
          designation: 'Demo Designation',
          experience: '15+ Years',
          image: 'https://images.unsplash.com/photo-1659353887617-8cf154b312c5?w=400&h=400&fit=crop'
        },
        {
          name: 'Prof. Priya Sharma',
          subject: 'Mathematics',
          designation: 'Demo Designation',
          experience: '12+ Years',
          image: 'https://images.unsplash.com/photo-1593442808882-775dfcd90699?w=400&h=400&fit=crop'
        },
        {
          name: 'Dr. Anand Verma',
          subject: 'Chemistry',
          designation: 'Demo Designation',
          experience: '18+ Years',
          image: 'https://images.unsplash.com/photo-1758685734511-4f49ce9a382b?w=400&h=400&fit=crop'
        },
        {
          name: 'Dr. Sneha Patel',
          subject: 'Biology',
          designation: 'Demo Designation',
          experience: '10+ Years',
          image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop'
        },
        {
          name: 'Prof. Arun Singh',
          subject: 'Mathematics',
          designation: 'Demo Designation',
          experience: '14+ Years',
          image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop'
        },
        {
          name: 'Dr. Meera Reddy',
          subject: 'Physics',
          designation: 'Demo Designation',
          experience: '16+ Years',
          image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop'
        }
      ],
      achievers: [
        {
          name: 'Rahul Kumar',
          achievement: 'JEE Advanced AIR 234',
          year: '2025',
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop'
        },
        {
          name: 'Priya Sharma',
          achievement: 'NEET AIR 567',
          year: '2025',
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop'
        },
        {
          name: 'Amit Patel',
          achievement: 'JEE Mains 99.8%ile',
          year: '2025',
          image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop'
        }
      ],
      visions: [
        {
          id: 'v1',
          name: 'Shri G.S. Sharma',
          designation: 'Founder & Director',
          vision: 'Our vision is to provide quality education and guidance to every student, empowering them to achieve their dreams and build a better future for themselves and the nation.',
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop'
        },
        {
          id: 'v2',
          name: 'Dr. A.K. Singh',
          designation: 'Academic Head',
          vision: 'We believe in nurturing raw talent into brilliant minds. Our focus is on holistic development, critical thinking, and instilling a lifelong passion for learning.',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop'
        },
        {
          id: 'v3',
          name: 'Mrs. R. Desai',
          designation: 'Chief Administrator',
          vision: 'Education is the most powerful weapon to change the world. We ensure an environment where students feel supported, motivated, and challenged to exceed their own expectations.',
          image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop'
        }
      ],
      contact: {
        phone: '+91 98765 43210',
        email: 'info@ujaas.com',
        address: '123 Education St, Delhi'
      }
    };

    const stored = localStorage.getItem('ujaasLandingData');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Merge visions: keep stored ones, but add any defaults that are missing by ID
        const mergedVisions = [...(Array.isArray(parsed.visions) ? parsed.visions : [])];
        defaultData.visions.forEach(v => {
          if (!mergedVisions.some(mv => mv.id === v.id)) {
            mergedVisions.push(v);
          }
        });

        return {
          ...defaultData,
          ...parsed,
          courses: Array.isArray(parsed.courses) ? parsed.courses : defaultData.courses,
          faculty: Array.isArray(parsed.faculty) ? parsed.faculty : defaultData.faculty,
          achievers: Array.isArray(parsed.achievers) ? parsed.achievers : defaultData.achievers,
          visions: mergedVisions,
          contact: parsed.contact || defaultData.contact,
        };
      } catch (e) {
        console.error('Failed to parse landing data', e);
      }
    }
    return defaultData;
  });

  const handleUpdateLandingData = useCallback(async (data: LandingData) => {
    setLandingData(data);
    try {
      await apiUpdateLanding(data);
    } catch (error) {
      console.error('Failed to save landing data to API:', error);
      throw error;
    }
  }, []);

  const [publishedTests, setPublishedTests] = useState<PublishedTest[]>([]);

  const apiTestToPublished = (t: ApiTest): PublishedTest => ({
    id: t.id,
    title: t.title,
    format: t.format || 'Custom',
    batches: t.batches.map(b => b.name),
    duration: t.duration_minutes,
    totalMarks: t.total_marks,
    questionCount: t.question_count,
    enrolledCount: t.enrolled_count,
    scheduleDate: t.schedule_date || '',
    scheduleTime: t.schedule_time || '',
    instructions: t.instructions || undefined,
    status: t.status,
    submittedAttemptCount: t.submitted_attempt_count,
    maxAttempts: t.submitted_attempt_count !== undefined ? 3 : undefined,
    hasActiveAttempt: t.has_active_attempt,
    activeAttemptId: t.active_attempt_id ?? null,
    latestAttemptId: t.latest_attempt_id ?? null,
    latestAttemptSubmittedAt: t.latest_attempt_submitted_at ?? null,
    latestAttemptTimeSpent: t.latest_attempt_time_spent ?? null,
    questions: (t.questions || []).map((q, i) => ({
      id: q.id,
      type: q.type,
      subject: q.subject,
      question: q.question_text,
      questionImage: q.question_img || undefined,
      options: q.options || undefined,
      optionImages: q.option_imgs || undefined,
      correctAnswer: parseQuestionCorrectAnswer(q.type, q.correct_answer),
      marks: q.marks,
      negativeMarks: q.neg_marks,
      explanation: q.explanation || undefined,
      explanationImage: q.explanation_img || undefined,
      difficulty: q.difficulty || undefined,
      metadata: { section: q.section || undefined },
    })),
  });

  const [selectedPreviewTest, setSelectedPreviewTest] = useState<PublishedTest | null>(null);

  const handlePublishTest = async (test: Omit<PublishedTest, 'id' | 'status'> & { id?: string; requiresSaveBeforePublish?: boolean }) => {
    showBatchToast('saving', 'Publishing test to database...');
    try {
      const batchIds = adminBatches
        .filter(b => test.batches.includes(b.label))
        .map(b => b.id)
        .filter(Boolean) as string[];

      if (test.id) {
        // Publishing from an existing draft — update it and change status
        if (test.requiresSaveBeforePublish) {
          await updateTestApi(test.id, {
            title: test.title,
            format: test.format,
            durationMinutes: test.duration,
            totalMarks: test.totalMarks,
            scheduleDate: test.scheduleDate,
            scheduleTime: test.scheduleTime,
            instructions: test.instructions,
            batchIds,
            questions: test.questions,
          });
        }
        const updatedApiTest = await apiUpdateTestStatus(test.id, 'upcoming');
        setPublishedTests(prev => prev.map(t => t.id === test.id ? apiTestToPublished(updatedApiTest) : t));
      } else {
        // Fresh publish
        const apiTest = await apiCreateTest({
          title: test.title,
          format: test.format,
          durationMinutes: test.duration,
          totalMarks: test.totalMarks,
          scheduleDate: test.scheduleDate,
          scheduleTime: test.scheduleTime,
          instructions: test.instructions,
          batchIds,
          questions: test.questions,
        });
        setPublishedTests(prev => [apiTestToPublished(apiTest), ...prev]);
      }

      setResumeDraftId(null);
      showBatchToast('saved', 'Test published successfully');
    } catch (err: any) {
      showBatchToast('error', err.message || 'Failed to publish test');
      throw err;
    }
  };

  const [resumeDraftId, setResumeDraftId] = useState<string | null>(null);

  const handleSaveDraft = async (test: Omit<PublishedTest, 'id' | 'status'> & { id?: string }) => {
    showBatchToast('saving', 'Saving draft...');
    try {
      const batchIds = adminBatches
        .filter(b => test.batches.includes(b.label))
        .map(b => b.id)
        .filter(Boolean) as string[];

      if (test.id) {
        // Update existing draft
        await updateTestApi(test.id, {
          title: test.title,
          format: test.format,
          durationMinutes: test.duration,
          totalMarks: test.totalMarks,
          scheduleDate: test.scheduleDate,
          scheduleTime: test.scheduleTime,
          instructions: test.instructions,
          batchIds,
          questions: test.questions,
        });
        const updatedApiTest = await apiFetchTestById(test.id);
        setPublishedTests(prev => prev.map(t => t.id === test.id ? apiTestToPublished(updatedApiTest) : t));
        showBatchToast('saved', 'Draft saved successfully');
        return test.id;
      } else {
        // Create new draft
        const apiTest = await apiCreateTest({
          title: test.title || 'Untitled Draft',
          format: test.format,
          durationMinutes: test.duration,
          totalMarks: test.totalMarks,
          scheduleDate: test.scheduleDate,
          scheduleTime: test.scheduleTime,
          instructions: test.instructions,
          batchIds,
          questions: test.questions,
          status: 'draft',
        } as any);
        setPublishedTests(prev => [apiTestToPublished(apiTest), ...prev]);
        showBatchToast('saved', 'Draft saved successfully');
        return apiTest.id;
      }
    } catch (err: any) {
      showBatchToast('error', err.message || 'Failed to save draft');
      throw err;
    }
  };

  const handlePreviewTest = async (testId: string) => {
    // Show a loading toast while fetching the test details
    showBatchToast('saving', 'Loading test details...');
    try {
      // Fetch full test details including questions
      const apiTest = await apiFetchTestById(testId);
      const fullTest = apiTestToPublished(apiTest);

      // Update the test in our state so it has the questions
      setPublishedTests(prev => prev.map(t => t.id === testId ? fullTest : t));

      setSelectedPreviewTest(fullTest);
      showBatchToast('saved', 'Test loaded for preview');
      navigateTab('preview-test');
    } catch (err: any) {
      showBatchToast('error', err.message || 'Failed to load test details');
    }
  };

  const updatePublishedTest = async (testId: string, updates: Partial<PublishedTest>) => {
    showBatchToast('saving', 'Saving test changes...');
    try {
      const test = publishedTests.find(t => t.id === testId);
      if (!test) throw new Error("Test not found");

      // We need to map batch names back to IDs if batches are updated
      let batchIds;
      if (updates.batches) {
        batchIds = adminBatches
          .filter(b => updates.batches!.includes(b.label))
          .map(b => b.id)
          .filter(Boolean) as string[];
      } else {
        batchIds = adminBatches
          .filter(b => test.batches.includes(b.label))
          .map(b => b.id)
          .filter(Boolean) as string[];
      }

      await updateTestApi(testId, {
        title: updates.title || test.title,
        format: updates.format || test.format,
        durationMinutes: updates.duration || test.duration,
        totalMarks: updates.totalMarks || test.totalMarks,
        scheduleDate: updates.scheduleDate || test.scheduleDate,
        scheduleTime: updates.scheduleTime || test.scheduleTime,
        instructions: updates.instructions !== undefined ? updates.instructions : test.instructions,
        batchIds,
        questions: updates.questions || test.questions,
      });

      setPublishedTests(prev => prev.map(t => {
        if (t.id !== testId) return t;
        return { ...t, ...updates };
      }));

      setSelectedPreviewTest(prev => {
        if (!prev || prev.id !== testId) return prev;
        return { ...prev, ...updates };
      });

      showBatchToast('saved', 'Test changes saved successfully');
    } catch (err: any) {
      showBatchToast('error', err.message || 'Failed to save test changes');
      throw err;
    }
  };

  const handleDeletePublishedTest = async (testId: string) => {
    showBatchToast('saving', 'Deleting test from database...');
    try {
      await apiDeleteTest(testId);
      setPublishedTests(prev => prev.filter(test => test.id !== testId));
      if (selectedPreviewTest?.id === testId) {
        setSelectedPreviewTest(null);
        if (activeTab === 'preview-test') {
          setActiveTab('test-series');
        }
      }
      showBatchToast('saved', 'Test deleted successfully');
    } catch (err: any) {
      showBatchToast('error', err.message || 'Failed to delete test');
    }
  };

  const handleForceTestLiveNow = async (testId: string) => {
    showBatchToast('saving', 'Setting test live now...');
    try {
      const updatedApiTest = await apiForceTestLiveNow(testId);
      const updatedTest = apiTestToPublished(updatedApiTest);

      setPublishedTests(prev => prev.map(test => test.id === testId ? updatedTest : test));
      setSelectedPreviewTest(prev => prev?.id === testId ? updatedTest : prev);

      showBatchToast('saved', 'Test is now live');
      return updatedTest;
    } catch (err: any) {
      showBatchToast('error', err.message || 'Failed to set test live');
      throw err;
    }
  };

  const [adminBatches, setAdminBatches] = useState<AdminBatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGetStarted, setShowGetStarted] = useState(true);
  const [adminFaculties, setAdminFaculties] = useState<ApiFaculty[]>([]);
  const [adminStudents, setAdminStudents] = useState<ApiStudent[]>([]);
  const [adminSubjects, setAdminSubjects] = useState<ApiSubject[]>([]);
  const [adminBatch, setAdminBatch] = useState<AdminBatch | null>(null);
  const [adminLandingSection, setAdminLandingSection] = useState<AdminLandingSection>('batches');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [batchSaveToast, setBatchSaveToast] = useState<{ visible: boolean; status: 'saving' | 'saved' | 'error'; message: string }>({ visible: false, status: 'saving', message: '' });
  const batchSaveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBatchToast = (status: 'saving' | 'saved' | 'error', message: string, autoHideMs = 2500) => {
    if (batchSaveToastTimer.current) clearTimeout(batchSaveToastTimer.current);
    setBatchSaveToast({ visible: true, status, message });
    if (status !== 'saving') {
      batchSaveToastTimer.current = setTimeout(() => {
        setBatchSaveToast(prev => ({ ...prev, visible: false }));
      }, autoHideMs);
    }
  };

  const refreshAdminBatchDependencies = async () => {
    const [apiBatches, apiTests, apiFaculties, apiStudents] = await Promise.all([
      apiFetchBatches(),
      apiFetchTests().catch((e) => {
        console.warn('Could not fetch tests from API:', e);
        return [];
      }),
      fetchFaculties().catch((e) => {
        console.warn('Could not fetch faculties from API:', e);
        return [];
      }),
      apiFetchStudents().catch((e) => {
        console.warn('Could not fetch students from API:', e);
        return [];
      }),
    ]);

    setAdminBatches(apiBatches.map(apiBatchToInfo));
    setPublishedTests((apiTests as ApiTest[]).map(apiTestToPublished));
    setAdminFaculties(apiFaculties);
    setAdminStudents(apiStudents);
  };

  const refreshAdminSubjects = async () => {
    try {
      const subjects = await apiFetchSubjects();
      setAdminSubjects(subjects);
    } catch (error) {
      console.warn('Could not fetch subjects from API:', error);
      setAdminSubjects([]);
    }
  };

  const handleRemoveSubjectFromBatch = async (batchId: string, subjectId: string) => {
    showBatchToast('saving', 'Checking subject linkage...');
    const result = await apiDeleteSubjectFromBatch(batchId, subjectId);
    if (result.ok) {
      try {
        const apiBatches = await apiFetchBatches();
        setAdminBatches(apiBatches.map(apiBatchToInfo));
      } catch (error) {
        console.warn('Could not refresh batches after subject removal:', error);
      }
      if (result.action === 'deleted') {
        showBatchToast('saved', 'Subject deleted globally');
      } else {
        showBatchToast('saved', 'Subject removed from batch');
      }
      return result;
    }
    if (result.status === 409) {
      showBatchToast('error', 'Cannot delete subject. Unlink content first.');
      return result;
    }
    showBatchToast('error', result.message || 'Failed to delete subject');
    return result;
  };

  const handleDeleteSubjectGlobal = async (subjectId: string) => {
    const result = await apiDeleteSubjectGlobal(subjectId);
    if (result.ok) {
      await refreshAdminBatchDependencies();
      await refreshAdminSubjects();
    }
    return result;
  };

  const isStudentTab = (tab?: string): tab is (typeof studentTabs)[number] =>
    !!tab && studentTabs.includes(tab as (typeof studentTabs)[number]);

  const isAdminTab = (tab?: string): tab is (typeof adminTabs)[number] =>
    !!tab && adminTabs.includes(tab as (typeof adminTabs)[number]);

  const isAdminLandingSection = (section?: string): section is AdminLandingSection =>
    !!section && adminLandingSections.includes(section as AdminLandingSection);

  const isAdminBatchSlug = (slug?: string): slug is string =>
    !!slug && adminBatches.some((batch) => batch.slug === slug);

  const batchFromSlug = (slug?: string): AdminBatch | null => {
    if (!slug) return null;
    return adminBatches.find((batch) => batch.slug === slug)?.label ?? null;
  };

  const slugFromBatch = (label?: AdminBatch | null): string | null => {
    if (!label) return null;
    return adminBatches.find((batch) => batch.label === label)?.slug ?? null;
  };

  const addAdminBatch = async (label: string, subjects?: string[], facultyAssigned?: string[]) => {
    const trimmedLabel = label.trim();
    if (adminBatches.some((b) => b.label.toLowerCase() === trimmedLabel.toLowerCase())) {
      return { ok: false, error: 'A batch with this name already exists' };
    }

    const trimmedSubjects = (subjects ?? []).map(s => s.trim()).filter(Boolean);
    const facultyIds = (facultyAssigned ?? []).map(name => {
      const fac = adminFaculties.find(f => f.name === name);
      return fac?.id;
    }).filter((id): id is string => !!id);

    try {
      showBatchToast('saving', 'Creating batch in database...');
      const apiBatch = await apiCreateBatch({
        name: trimmedLabel,
        subjects: trimmedSubjects,
        facultyIds: facultyIds,
      });
      setAdminBatches((prev) => [...prev, apiBatchToInfo(apiBatch)]);
      showBatchToast('saved', 'Batch created in database.');
      return { ok: true, label: trimmedLabel };
    } catch (err) {
      console.error('Failed to create batch in API:', err);
      showBatchToast('error', 'Failed to save batch to database');
      return { ok: false, error: 'Failed to save batch to database' };
    }
  };

  const updateAdminBatch = async (label: string, subjects?: string[], facultyAssigned?: string[], oldLabel?: string) => {
    const targetLabel = oldLabel || label;
    const trimmedLabel = label.trim();

    // Find the batch we are updating to get its ID
    const batchToUpdate = adminBatches.find((b) => b.label === targetLabel);
    const batchId = batchToUpdate?.id;

    if (trimmedLabel !== targetLabel && adminBatches.some((b) => b.label.toLowerCase() === trimmedLabel.toLowerCase() && b.id !== batchId)) {
      return { ok: false, error: 'A batch with this name already exists' };
    }

    const trimmedSubjects = (subjects ?? []).map(s => s.trim()).filter(Boolean);
    const facultyIds = (facultyAssigned ?? []).map(name => {
      const fac = adminFaculties.find(f => f.name === name);
      return fac?.id;
    }).filter((id): id is string => !!id);

    if (!batchId) {
      return { ok: false, error: 'Batch not found in database.' };
    }

    try {
      showBatchToast('saving', 'Saving changes to database...');
      const apiBatch = await apiUpdateBatch(batchId, {
        name: trimmedLabel,
        subjects: trimmedSubjects,
        facultyIds: facultyIds,
      });
      setAdminBatches((prev) =>
        prev.map((b) => b.id === batchId ? apiBatchToInfo(apiBatch) : b)
      );
      if (adminBatch === targetLabel) {
        setAdminBatch(trimmedLabel);
      }
      showBatchToast('saved', 'Batch updated and saved to database.');
      return { ok: true };
    } catch (err) {
      console.error('Failed to update batch in API:', err);
      showBatchToast('error', 'Failed to save changes to database');
      return { ok: false, error: 'Failed to save changes to database' };
    }
  };

  const deleteAdminBatch = async (label: string) => {
    const batch = adminBatches.find((b) => b.label === label);
    if (!batch) {
      return { ok: false, error: 'Batch not found.' };
    }
    if (!batch.id) {
      return { ok: false, error: 'Batch not found in database.' };
    }

    try {
      showBatchToast('saving', 'Deleting batch from database...');
      await apiDeleteBatch(batch.id);
      setAdminBatches((prev) => prev.map((b) => b.label === label ? { ...b, is_active: false } : b));
      if (adminBatch === label) {
        setAdminBatch(null);
      }
      showBatchToast('saved', 'Batch deleted from database.');
      return { ok: true };
    } catch (err) {
      console.error('Failed to delete batch in API:', err);
      showBatchToast('error', 'Failed to delete batch from database');
      return { ok: false, error: 'Failed to delete batch from database' };
    }
  };

  const permanentlyDeleteAdminBatch = async (label: string) => {
    const batch = adminBatches.find((b) => b.label === label);
    if (!batch?.id) {
      return { ok: false, error: 'Batch not found.' };
    }

    showBatchToast('saving', 'Deleting batch permanently...');

    try {
      await apiPermanentlyDeleteBatch(batch.id);

      if (adminBatch === label) {
        setAdminBatch(null);
        setActiveTab('home');
      }

      await refreshAdminBatchDependencies();
      showBatchToast('saved', 'Batch permanently deleted');
      return { ok: true };
    } catch (error: any) {
      console.error('Failed to permanently delete batch in API:', error);
      showBatchToast('error', error?.message || 'Failed to permanently delete batch');
      return { ok: false, error: error?.message || 'Failed to permanently delete batch' };
    }
  };

  const parsePath = () => {
    const path = window.location.pathname.replace(/\/+$/, '');
    if (path === '' || path === '/' || path === '/get-started') {
      return { view: 'get-started' as const };
    }
    if (path === '/login') {
      return { view: 'login' as const };
    }
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'student') {
      return {
        view: 'student' as const,
        tab: parts[1] || 'home',
        subTab: parts[2]
      };
    }
    if (parts[0] === 'faculty') {
      if (parts.length === 1) {
        return { view: 'faculty' as const, section: 'batches' as AdminLandingSection };
      }

      const second = parts[1];
      const third = parts[2];

      if (isAdminBatchSlug(second)) {
        return { view: 'faculty' as const, batch: second, tab: third || 'home' };
      }

      if (isAdminLandingSection(second)) {
        return { view: 'faculty' as const, section: second };
      }

      if (isAdminTab(second)) {
        return { view: 'faculty' as const, tab: second };
      }

      return { view: 'faculty' as const, section: 'batches' as AdminLandingSection };
    }
    if (parts[0] === 'admin') {
      if (parts.length === 1) {
        return { view: 'admin' as const, section: 'batches' as AdminLandingSection };
      }

      const second = parts[1];
      const third = parts[2];

      if (isAdminBatchSlug(second)) {
        return { view: 'admin' as const, batch: second, tab: third || 'home' };
      }

      if (isAdminLandingSection(second)) {
        return { view: 'admin' as const, section: second };
      }

      if (isAdminTab(second)) {
        return { view: 'admin' as const, tab: second };
      }

      return { view: 'admin' as const, section: 'batches' as AdminLandingSection };
    }
    if (parts.length === 1) {
      const tab = parts[0];
      const isStudent = isStudentTab(tab);
      const isAdmin = isAdminTab(tab);
      if (isStudent && !isAdmin) {
        return { view: 'student' as const, tab };
      }
      if (isAdmin && !isStudent) {
        return { view: 'admin' as const, tab };
      }
      if (isStudent && isAdmin) {
        return { view: 'generic' as const, tab };
      }
    }
    return { view: 'get-started' as const };
  };

  const tabToPath = (role: User['role'], tab: StudentTab | AdminTab, batch: AdminBatch | null = null, subTab?: string) => {
    if (role === 'student') {
      return subTab ? `/student/${tab}/${subTab}` : `/student/${tab}`;
    }
    if (role === 'faculty') {
      const batchSlug = slugFromBatch(batch);
      if (batchSlug) return `/faculty/${batchSlug}/${tab}`;
      return tab === 'home' ? '/faculty' : `/faculty/${tab}`;
    }
    const batchSlug = slugFromBatch(batch);
    if (batchSlug) return `/admin/${batchSlug}/${tab}`;
    return tab === 'home' ? '/admin' : `/admin/${tab}`;
  };

  const adminSectionToPath = (section: AdminLandingSection) =>
    section === 'batches' ? '/admin' : `/admin/${section}`;

  const facultySectionToPath = (section: AdminLandingSection) =>
    section === 'batches' ? '/faculty' : `/faculty/${section}`;

  const setTabFromPath = (currentUser: User | null) => {
    const route = parsePath();

    if (!currentUser) {
      const shouldShowGetStarted = route.view !== 'login';
      setShowGetStarted(shouldShowGetStarted);
      if (route.view === 'login') {
        window.history.replaceState({ view: 'login' }, '', '/login');
      } else if (route.view !== 'get-started') {
        window.history.replaceState({ view: 'get-started' }, '', '/get-started');
      }
      return;
    }

    if (currentUser.role === 'student') {
      setAdminBatch(null);
      setAdminLandingSection('batches');
      const tab = isStudentTab(route.tab) ? route.tab : 'home';
      setActiveTab(tab);
      setStudentSubTab(route.view === 'student' ? route.subTab : undefined);
      if (route.view !== 'student' || route.tab !== tab || (route.view === 'student' && route.subTab)) {
        window.history.replaceState({ tab, subTab: route.subTab }, '', tabToPath('student', tab, null, route.subTab));
      }
      return;
    }

    const isFacultyRole = currentUser.role === 'faculty';
    const isRoleMismatch =
      (currentUser.role === 'faculty' && route.view === 'admin') ||
      (currentUser.role === 'admin' && route.view === 'faculty');
    const parsedBatch = route.view === 'admin' || route.view === 'faculty' ? batchFromSlug(route.batch) : null;
    const parsedSection =
      (route.view === 'admin' || route.view === 'faculty') && isAdminLandingSection(route.section) ? route.section : 'batches';
    const adminTab = isAdminTab(route.tab) ? route.tab : 'home';
    setAdminBatch(parsedBatch);
    setAdminLandingSection(parsedSection);
    setActiveTab(adminTab);
    setStudentSubTab(undefined);
    const canonicalPath = parsedBatch
      ? tabToPath(isFacultyRole ? 'faculty' : 'admin', adminTab, parsedBatch)
      : adminTab === 'profile'
        ? isFacultyRole
          ? '/faculty/profile'
          : '/admin/profile'
        : isFacultyRole
          ? facultySectionToPath(parsedSection)
          : adminSectionToPath(parsedSection);
    if (window.location.pathname.replace(/\/+$/, '') !== canonicalPath || isRoleMismatch) {
      window.history.replaceState({ tab: adminTab, batch: parsedBatch, section: parsedSection }, '', canonicalPath);
    }
  };

  const navigateTab = (tab: StudentTab | AdminTab, subTab?: string) => {
    if (!user) return;
    setActiveTab(tab);

    let path = '';
    if (user.role === 'student') {
      setStudentSubTab(subTab);
      path = tabToPath('student', tab as StudentTab, null, subTab);
    } else {
      setStudentSubTab(undefined);
      const role = user.role === 'faculty' ? 'faculty' : 'admin';
      if (adminBatch) {
        path = tabToPath(role, tab, adminBatch);
      } else if (tab === 'profile') {
        path = `/${role}/profile`;
      } else if (tab === 'create-test' || tab === 'create-dpp' || tab === 'upload-notice' || tab === 'upload-notes') {
        path = `/${role}/${adminLandingSection}/${tab}`;
      } else {
        path = user.role === 'faculty' ? facultySectionToPath(adminLandingSection) : adminSectionToPath(adminLandingSection);
      }
    }

    window.history.pushState(
      { tab, batch: user.role === 'student' ? null : adminBatch, section: user.role === 'student' ? undefined : adminLandingSection },
      '',
      path
    );
  };

  const handleAdminSelectBatch = (batch: AdminBatch) => {
    if (user?.role === 'student') return;
    setAdminBatch(batch);
    setAdminLandingSection('batches');
    setActiveTab('home');
    setStudentSubTab(undefined);
    const path = tabToPath(user?.role === 'faculty' ? 'faculty' : 'admin', 'home', batch);
    window.history.pushState({ tab: 'home', batch, section: 'batches' }, '', path);
  };

  const handleAdminClearBatch = () => {
    if (user?.role === 'student') return;
    setAdminBatch(null);
    setAdminLandingSection('batches');
    setActiveTab('home');
    setStudentSubTab(undefined);
    window.history.pushState(
      { tab: 'home', batch: null, section: 'batches' },
      '',
      user?.role === 'faculty' ? '/faculty' : '/admin'
    );
  };

  const handleAdminNavigateSection = (section: AdminLandingSection) => {
    if (user?.role === 'student') return;
    setAdminLandingSection(section);
    setAdminBatch(null);
    const targetTab = section === 'test-series' ? 'test-series' : 'home';
    setActiveTab(targetTab);
    setStudentSubTab(undefined);
    const path = user?.role === 'faculty' ? facultySectionToPath(section) : adminSectionToPath(section);
    window.history.pushState({ tab: targetTab, batch: null, section }, '', path);
  };

  const handleUpdateStudentRating = async (studentId: string, data: any) => {
    try {
      const updatedRating = await apiUpdateStudentRating(studentId, data);
      
      // Update local adminStudents state to reflect changes
      setAdminStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          // The backend returns a joined record representing the rating for ONE subject.
          // However, we need to update the main rating fields IF this is the first/primary rating,
          // OR better yet, update the subject_ratings/subject_remarks maps.
          
          const newSubjectRatings = { ...(s.subject_ratings || {}) };
          const newSubjectRemarks = { ...(s.subject_remarks || {}) };
          
          if (updatedRating.subject) {
            newSubjectRatings[updatedRating.subject] = {
              attendance: updatedRating.attendance,
              total_classes: updatedRating.total_classes,
              tests: updatedRating.tests,
              dppPerformance: updatedRating.dppPerformance,
              behavior: updatedRating.behavior
            };
            if (updatedRating.remarks !== undefined) {
              newSubjectRemarks[updatedRating.subject] = updatedRating.remarks;
            }
          }

          return {
            ...s,
            // Update top-level rating fields as well (usually reflects first subject or aggregate)
            rating_attendance: updatedRating.attendance,
            rating_total_classes: updatedRating.total_classes,
            rating_assignments: updatedRating.tests,
            rating_participation: updatedRating.dppPerformance,
            rating_behavior: updatedRating.behavior,
            subject_ratings: newSubjectRatings,
            subject_remarks: newSubjectRemarks,
            admin_remark: updatedRating.admin_remark !== undefined ? updatedRating.admin_remark : s.admin_remark
          };
        }
        return s;
      }));
    } catch (error: any) {
      console.error('Failed to update student rating:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const hasStoredToken = (() => {
          const token = localStorage.getItem('ujaasToken');
          return Boolean(token && token !== 'null' && token !== 'undefined');
        })();

        const [apiLanding, profileResponse] = await Promise.all([
          fetchLandingData().catch(e => { console.warn('Could not fetch landing data from API:', e); return null; }),
          hasStoredToken
            ? me().catch(e => { console.warn('Could not fetch user profile:', e); return null; })
            : Promise.resolve(null),
        ]);

        if (apiLanding) {
          setLandingData(apiLanding as unknown as LandingData);
        }

        if (profileResponse && profileResponse.user) {
          const loggedInUser = profileResponse.user as User;
          setUser(loggedInUser);
          setShowGetStarted(false);

          const apiTests = await apiFetchTests().catch(e => { console.warn('Could not fetch tests from API:', e); return []; });
          setPublishedTests((apiTests as ApiTest[]).map(apiTestToPublished));

          if (loggedInUser.role === 'admin') {
            try {
              const { queries: dbQueries } = await fetchQueries();
              setQueries(dbQueries as LandingQuery[]);
            } catch {
              console.warn('Could not fetch queries from API');
            }
          }

          if (loggedInUser.role === 'admin' || loggedInUser.role === 'faculty') {
            const apiBatches = await apiFetchBatches().catch(e => { console.warn('Could not fetch batches from API:', e); return []; });
            setAdminBatches(apiBatches.map(apiBatchToInfo));

            const fetchTasks: Promise<any>[] = [];
            if (loggedInUser.role === 'admin') {
              fetchTasks.push(fetchFaculties().catch(e => { console.warn('Could not fetch faculties from API:', e); return []; }));
            }
            fetchTasks.push(apiFetchStudents().catch(e => { console.warn('Could not fetch students from API:', e); return []; }));

              const results = await Promise.all(fetchTasks);
              if (loggedInUser.role === 'admin') {
                setAdminFaculties(results[0]);
                setAdminStudents(results[1]);
                await refreshAdminSubjects();
              } else {
                setAdminFaculties([]);
                setAdminStudents(results[0]);
              }
            }
        } else {
          setUser(null);
          // If no user, set empty batches
          setAdminBatches([]);
        }
      } catch (error) {
        console.error('Error during session initialization:', error);
        setUser(null);
        setAdminBatches([]); // Fallback to empty on error
      }

      setLoading(false);
    };

    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem('ujaasNotifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    } else {
      // Initialize with some default notifications
      const defaultNotifications: Notification[] = [
        {
          id: '1',
          type: 'announcement',
          title: 'Welcome to UJAAS!',
          message: 'Start your learning journey with our comprehensive study materials and practice tests.',
          time: '2 hours ago',
          read: false,
          icon: 'award'
        },
        {
          id: '2',
          type: 'info',
          title: 'New Notes Available',
          message: 'Physics Wave Optics notes have been uploaded. Download now!',
          time: '5 hours ago',
          read: false,
          icon: 'notes'
        },
        {
          id: '3',
          type: 'warning',
          title: 'DPP Deadline Approaching',
          message: 'Chemistry DPP #8 is due in 2 days. Complete it soon!',
          time: '1 day ago',
          read: false,
          icon: 'dpp'
        },
      ];
      setNotifications(defaultNotifications);
      safeSetLocalStorage('ujaasNotifications', JSON.stringify(defaultNotifications));
    }

    initializeSession();
  }, []);

  useEffect(() => {
    // Keep localStorage as a cache for faster initial loads, but API is the source of truth
    safeSetLocalStorage('ujaasAdminBatches', JSON.stringify(adminBatches));
  }, [adminBatches]);

  useEffect(() => {
    const handlePopState = () => {
      setTabFromPath(user);
    };

    window.addEventListener('popstate', handlePopState);
    setTabFromPath(user);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      safeSetLocalStorage('ujaasNotifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const handleLogin = async (userData: User) => {
    setUser(userData);
    setShowGetStarted(false);

    const route = parsePath();
    if (
      userData.role === 'student' &&
      isStudentTab(route.tab) &&
      (route.view === 'student' || route.view === 'generic')
    ) {
      setActiveTab(route.tab);
      setStudentSubTab(route.view === 'student' ? route.subTab : undefined);
      setAdminBatch(null);
      setAdminLandingSection('batches');
      return;
    }
    if (userData.role !== 'student' && (route.view === 'admin' || route.view === 'faculty')) {
      const parsedBatch = batchFromSlug(route.batch);
      const parsedSection = isAdminLandingSection(route.section) ? route.section : 'batches';
      const parsedTab = isAdminTab(route.tab) ? route.tab : 'home';
      setAdminBatch(parsedBatch);
      setAdminLandingSection(parsedSection);
      setActiveTab(parsedTab);
      setStudentSubTab(undefined);
      const isFacultyRole = userData.role === 'faculty';
      const isRoleMismatch =
        (userData.role === 'faculty' && route.view === 'admin') ||
        (userData.role === 'admin' && route.view === 'faculty');
      const canonicalPath = parsedBatch
        ? tabToPath(isFacultyRole ? 'faculty' : 'admin', parsedTab, parsedBatch)
        : parsedTab === 'profile'
          ? isFacultyRole
            ? '/faculty/profile'
            : '/admin/profile'
          : isFacultyRole
            ? facultySectionToPath(parsedSection)
            : adminSectionToPath(parsedSection);
      if (window.location.pathname.replace(/\/+$/, '') !== canonicalPath || isRoleMismatch) {
        window.history.replaceState({ tab: parsedTab, batch: parsedBatch, section: parsedSection }, '', canonicalPath);
      }
      return;
    }

    const defaultTab = 'home';
    setActiveTab(defaultTab);
    if (userData.role === 'student') {
      setAdminBatch(null);
      setAdminLandingSection('batches');
      setStudentSubTab(undefined);
      window.history.pushState({ tab: defaultTab }, '', tabToPath('student', defaultTab));
      return;
    }

    setAdminBatch(null);
    setAdminLandingSection('batches');
    setStudentSubTab(undefined);
    window.history.pushState(
      { tab: defaultTab, batch: null, section: 'batches' },
      '',
      userData.role === 'faculty' ? '/faculty' : '/admin'
    );

    // Fetch batches and queries from API for admin/faculty
    if (userData.role === 'admin' || userData.role === 'faculty' || userData.role === 'student') {
      setLoading(true);
      try {
        const apiTests = await apiFetchTests().catch(e => { console.warn('Could not fetch tests from API:', e); return []; });
        setPublishedTests((apiTests as ApiTest[]).map(apiTestToPublished));

        if (userData.role === 'admin' || userData.role === 'faculty') {
          const apiBatches = await apiFetchBatches().catch(e => { console.warn('Could not fetch batches from API:', e); return []; });
          setAdminBatches(apiBatches.map(apiBatchToInfo));

            if (userData.role === 'admin') {
              const [apiFaculties, apiStudents] = await Promise.all([
                fetchFaculties().catch(e => { console.warn('Could not fetch faculties from API:', e); return []; }),
                apiFetchStudents().catch(e => { console.warn('Could not fetch students from API:', e); return []; }),
              ]);

              setAdminFaculties(apiFaculties);
              setAdminStudents(apiStudents);
              await refreshAdminSubjects();
            } else {
              setAdminFaculties([]);
              const apiStudents = await apiFetchStudents().catch(e => { console.warn('Could not fetch students from API:', e); return []; });
              setAdminStudents(apiStudents);
            }
        }
        if (userData.role === 'admin') {
          try {
            const { queries: dbQueries } = await fetchQueries();
            setQueries(dbQueries as LandingQuery[]);
          } catch {
            console.warn('Could not fetch queries from API');
          }
        }
      } catch (error) {
        console.warn('Error fetching batches/faculties on login:', error);
        setAdminBatches([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Proceed with local cleanup even if API call fails.
    }
    setUser(null);
    setAdminBatch(null);
    setAdminLandingSection('batches');
    setShowGetStarted(true);
    window.history.pushState({ view: 'get-started' }, '', '/get-started');
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleGetStarted = () => {
    setShowGetStarted(false);
    window.history.pushState({ view: 'login' }, '', '/login');
  };

  if (loading) {
    if (user) {
      return <DashboardLoadingShell role={user.role} />;
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="text-center relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8 relative"
          >
            <div className="w-24 h-24 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img src={logo} alt="UJAAS Logo" className="w-12 h-12 object-contain animate-pulse" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              UJAAS Career Institute
            </h2>
            <p className="text-gray-500 font-medium">Empowering Your Success</p>
          </motion.div>

          {/* Progress bar simulation */}
          <div className="mt-8 w-64 h-1.5 bg-gray-100 rounded-full mx-auto overflow-hidden">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-full h-full bg-gradient-to-r from-teal-400 to-blue-500"
            ></motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (<>
    <MotionConfig reducedMotion="always">
      <AnimatePresence mode="wait">
        {showGetStarted && !user ? (
          <motion.div
            key="getstarted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <GetStarted
              onGetStarted={handleGetStarted}
              isNewUser={false}
              userName=""
              landingData={landingData}
              onSubmitQuery={handleAddQuery}
            />
          </motion.div>
        ) : !user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Login onLogin={handleLogin} />
          </motion.div>
        ) : user.role === 'student' ? (
          <motion.div
            key="student"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StudentDashboard
              user={user}
              activeTab={(isStudentTab(activeTab) ? activeTab : 'home')}
              subTab={studentSubTab}
              onNavigate={navigateTab}
              onLogout={handleLogout}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDeleteNotification={handleDeleteNotification}
              publishedTests={publishedTests}
            />
          </motion.div>
        ) : user.role === 'faculty' ? (
          <motion.div
            key="faculty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FacultyDashboard
              user={user}
              activeTab={(isAdminTab(activeTab) ? activeTab : 'home') as import('./components/FacultyDashboard').FacultyTab}
              onNavigate={navigateTab}
              adminSection={adminLandingSection as import('./components/FacultyDashboard').FacultySection}
              onNavigateSection={handleAdminNavigateSection}
              selectedBatch={adminBatch}
              onSelectBatch={handleAdminSelectBatch}
              onClearBatch={handleAdminClearBatch}
              batches={adminBatches}
              onUpdateBatch={updateAdminBatch}
              onLogout={handleLogout}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDeleteNotification={handleDeleteNotification}
              publishedTests={publishedTests}
              onPreviewTest={handlePreviewTest}
              onUpdatePublishedTest={updatePublishedTest}
              selectedPreviewTest={selectedPreviewTest}
              adminStudents={adminStudents}
              onUpdateStudentRating={handleUpdateStudentRating}
            />
          </motion.div>
        ) : (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminDashboard
              user={user}
              activeTab={(isAdminTab(activeTab) ? activeTab : 'home')}
              onNavigate={navigateTab}
              adminSection={adminLandingSection}
              onNavigateSection={handleAdminNavigateSection}
              selectedBatch={adminBatch}
              onSelectBatch={handleAdminSelectBatch}
              onClearBatch={handleAdminClearBatch}
              batches={adminBatches}
              adminFaculties={adminFaculties}
              onCreateFaculty={async (data: import('./api/faculties').CreateFacultyPayload) => {
                showBatchToast('saving', 'Saving faculty to database...');
                try {
                  const fac = await apiCreateFaculty(data);
                  setAdminFaculties(prev => [...prev, fac]);
                  showBatchToast('saved', 'Faculty created successfully');
                  return fac;
                } catch (err: any) {
                  showBatchToast('error', err.message || 'Failed to create faculty');
                  throw err;
                }
              }}
              onUpdateFaculty={async (id: string, data: Partial<import('./api/faculties').CreateFacultyPayload>) => {
                showBatchToast('saving', 'Saving changes to database...');
                try {
                  const fac = await apiUpdateFaculty(id, data);
                  setAdminFaculties(prev => prev.map(f => f.id === id ? fac : f));
                  showBatchToast('saved', 'Faculty updated successfully');
                  return fac;
                } catch (err: any) {
                  showBatchToast('error', err.message || 'Failed to update faculty');
                  throw err;
                }
              }}
              onDeleteFaculty={async (id: string) => {
                showBatchToast('saving', 'Saving changes to database...');
                try {
                  await apiDeleteFaculty(id);
                  setAdminFaculties(prev => prev.filter(f => f.id !== id));
                  showBatchToast('saved', 'Faculty deleted successfully');
                } catch (err: any) {
                  showBatchToast('error', err.message || 'Failed to delete faculty');
                  throw err;
                }
              }}
              adminStudents={adminStudents}
              onCreateStudent={async (data: import('./api/students').CreateStudentPayload) => {
                showBatchToast('saving', 'Saving student to database...');
                try {
                  const student = await apiCreateStudent(data);
                  setAdminStudents(prev => [...prev, student]);
                  // Refresh batches to update student count
                  apiFetchBatches().then(b => setAdminBatches(b.map(apiBatchToInfo))).catch(() => { });
                  showBatchToast('saved', 'Student created successfully');
                  return student;
                } catch (err: any) {
                  showBatchToast('error', err.message || 'Failed to create student');
                  throw err;
                }
              }}
              onUpdateStudent={async (id: string, data: import('./api/students').UpdateStudentPayload) => {
                showBatchToast('saving', 'Saving changes to database...');
                try {
                  const student = await apiUpdateStudent(id, data);
                  setAdminStudents(prev => prev.map(s => s.id === id ? student : s));
                  showBatchToast('saved', 'Student updated successfully');
                  return student;
                } catch (err: any) {
                  showBatchToast('error', err.message || 'Failed to update student');
                  throw err;
                }
              }}
              onDeleteStudent={async (id: string) => {
                showBatchToast('saving', 'Saving changes to database...');
                try {
                  await apiDeleteStudent(id);
                  setAdminStudents(prev => prev.filter(s => s.id !== id));
                  apiFetchBatches().then(b => setAdminBatches(b.map(apiBatchToInfo))).catch(() => { });
                  showBatchToast('saved', 'Student deleted successfully');
                } catch (err: any) {
                  showBatchToast('error', err.message || 'Failed to delete student');
                  throw err;
                }
              }}
              onAssignStudentToBatch={async (studentId: string, batchId: string) => {
                showBatchToast('saving', 'Saving changes to database...');
                try {
                  const student = await apiAssignStudentToBatch(studentId, batchId);
                  setAdminStudents(prev => prev.map(s => s.id === studentId ? student : s));
                  // Refresh batches to update student count
                  apiFetchBatches().then(b => setAdminBatches(b.map(apiBatchToInfo))).catch(() => { });
                  showBatchToast('saved', 'Student assigned to batch');
                  return student;
                } catch (err: any) {
                  showBatchToast('error', err.message || 'Failed to assign student');
                  throw err;
                }
              }}
              onRemoveStudentFromBatch={async (studentId: string, batchId: string) => {
                showBatchToast('saving', 'Saving changes to database...');
                try {
                  await apiRemoveStudentFromBatch(studentId, batchId);
                  setAdminStudents(prev => prev.map(s => s.id === studentId ? { ...s, assigned_batch: null } : s));
                  apiFetchBatches().then(b => setAdminBatches(b.map(apiBatchToInfo))).catch(() => { });
                  showBatchToast('saved', 'Student removed from batch');
                } catch (err: any) {
                  showBatchToast('error', err.message || 'Failed to remove student');
                  throw err;
                }
              }}
              onCreateBatch={addAdminBatch}
              onUpdateBatch={updateAdminBatch}
              onDeleteBatch={deleteAdminBatch}
              onPermanentDeleteBatch={permanentlyDeleteAdminBatch}
              onLogout={handleLogout}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDeleteNotification={handleDeleteNotification}
              landingData={landingData}
              onUpdateLandingData={handleUpdateLandingData}
              queries={queries}
              onUpdateQueries={handleUpdateQueries}
              onDeleteQuery={handleDeleteQuery}
              publishedTests={publishedTests}
              onPublishTest={handlePublishTest}
              onSaveDraft={handleSaveDraft}
              resumeDraftId={resumeDraftId}
              onClearResumeDraft={() => setResumeDraftId(null)}
              onResumeDraft={(testId: string) => { setResumeDraftId(testId); setActiveTab('create-test' as any); }}
              onPreviewTest={handlePreviewTest}
              onUpdatePublishedTest={updatePublishedTest}
              onForceTestLiveNow={handleForceTestLiveNow}
              onDeletePublishedTest={handleDeletePublishedTest}
              selectedPreviewTest={selectedPreviewTest}
              subjectCatalog={adminSubjects}
              onRemoveSubjectFromBatch={handleRemoveSubjectFromBatch}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>

    {/* Batch Save-to-Database Toast */}
    <AnimatePresence>
      {batchSaveToast.visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 22px',
            borderRadius: 16,
            background: batchSaveToast.status === 'error'
              ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
              : batchSaveToast.status === 'saved'
                ? 'linear-gradient(135deg, #059669, #047857)'
                : 'linear-gradient(135deg, #0891b2, #0e7490)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            backdropFilter: 'blur(8px)',
            minWidth: 220,
          }}
        >
          {batchSaveToast.status === 'saving' && (
            <span style={{
              display: 'inline-block',
              width: 18,
              height: 18,
              border: '2.5px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              flexShrink: 0,
            }} />
          )}
          {batchSaveToast.status === 'saved' && (
            <span style={{ fontSize: 18, flexShrink: 0 }}>✓</span>
          )}
          {batchSaveToast.status === 'error' && (
            <span style={{ fontSize: 18, flexShrink: 0 }}>✕</span>
          )}
          <span>{batchSaveToast.message}</span>
          <button
            onClick={() => setBatchSaveToast(prev => ({ ...prev, visible: false }))}
            style={{
              marginLeft: 'auto',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Inline keyframes for spinner */}
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </>);
}

export default App;
