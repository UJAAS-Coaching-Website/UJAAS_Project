import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import type { AdminTab, AdminSection } from './components/AdminDashboard';
import type { FacultyTab, FacultySection } from './components/FacultyDashboard';
import { Notification } from './components/NotificationCenter';
import { me, logout as logoutRequest, StudentDetails } from './api/auth';
import {
  fetchLandingData,
  updateLandingData as apiUpdateLanding,
  fetchQueries,
  submitQuery as apiSubmitQuery,
  updateQueryStatus as apiUpdateQueryStatus,
  deleteQuery as apiDeleteQuery,
  setQueriesCache,
} from './api/landing';
import {
  fetchBatches as apiFetchBatches,
  createBatch as apiCreateBatch,
  updateBatch as apiUpdateBatch,
  deleteBatch as apiDeleteBatch,
  permanentlyDeleteBatch as apiPermanentlyDeleteBatch,
  uploadBatchTimetable as apiUploadBatchTimetable,
  deleteBatchTimetable as apiDeleteBatchTimetable,
  setBatchesCache,
  type ApiBatch,
} from './api/batches';
import {
  fetchFaculties,
  createFaculty as apiCreateFaculty,
  updateFaculty as apiUpdateFaculty,
  deleteFacultyApi as apiDeleteFaculty,
  setFacultiesCache,
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
  setStudentsCache,
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
  setTestsCache,
  type ApiTest,
} from './api/tests';
import { clearQuestionBankCache } from './api/questionBank';
import { formatTimeAgo } from './utils/time';
import { mapApiTestToPublished as apiTestToPublished } from './utils/testMappings';
import { useIsMobileViewport } from './hooks/useViewport';
import { useBatchSaveToast } from './hooks/useBatchSaveToast';
import { useLandingContent } from './hooks/useLandingContent';
import { useStudentNotifications } from './hooks/useStudentNotifications';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import logo from './assets/logo.svg';
import { DashboardHeroSkeleton, StatCardSkeleton, SubjectCardSkeleton, TableRowsSkeleton, TestCardSkeleton, DashboardLoadingShell } from './components/ui/content-skeletons';
import { Skeleton } from './components/ui/skeleton';
import { BatchSaveToast } from './components/BatchSaveToast';

const Login = lazy(() => import('./components/Login').then((module) => ({ default: module.Login })));
const StudentDashboard = lazy(() => import('./components/StudentDashboard').then((module) => ({ default: module.StudentDashboard })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const FacultyDashboard = lazy(() => import('./components/FacultyDashboard').then((module) => ({ default: module.FacultyDashboard })));
const GetStarted = lazy(() => import('./components/GetStarted').then((module) => ({ default: module.GetStarted })));

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
  batch: string;
  email?: string;
  loginId?: string;
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
  'notices',
  'upload-notes',
  'profile',
  'preview-test',
  'question-bank',
] as const;

export const adminLandingSections = ['landing', 'batches', 'students', 'faculty', 'test-series', 'queries'] as const;

export type StudentTab = (typeof studentTabs)[number];
export type Tab = StudentTab | AdminTab | FacultyTab | 'add-student';

export type AdminLandingSection = AdminSection | FacultySection;


function AuthLoadingShell({ isMobile }: { isMobile: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 relative overflow-hidden"
    >
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="text-center relative z-10" style={isMobile ? { marginTop: '-15vh' } : {}}>
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
            UJAAS <span style={{ whiteSpace: 'nowrap' }}>Career Institute</span>
          </h2>
          <p className="text-gray-500 font-medium">Empowering Your Success</p>
        </motion.div>

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

function App() {
  type AdminBatch = string;
  type AdminBatchInfo = {
    id?: string;
    label: string;
    slug: string;
    subjects?: string[];
    facultyAssigned?: string[];
    facultyAssignments?: { id: string; name: string; subject?: string | null }[];
    is_active?: boolean;
    studentCount?: number;
    testsConducted?: number;
    averagePerformance?: number;
    timetable_url?: string | null;
  };

  /** Convert API batch to local AdminBatchInfo format */
  const apiBatchToInfo = (b: ApiBatch): AdminBatchInfo => ({
    id: b.id,
    label: b.name,
    slug: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'batch',
    subjects: b.subjects ?? undefined,
    facultyAssignments: b.faculty?.map((f) => ({ id: f.id, name: f.name, subject: f.subject ?? null })) ?? undefined,
    facultyAssigned: b.faculty?.map((f: { name: string }) => f.name) ?? undefined,
    is_active: b.is_active,
    studentCount: b.student_count || 0,
    testsConducted: (b as any).testsConducted || 0,
    averagePerformance: (b as any).averagePerformance || 0,
    timetable_url: b.timetable_url ?? null,
  });

  const [user, setUser] = useState<User | null>(null);
  const [reviewModalTrigger, setReviewModalTrigger] = useState(0);

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [studentSubTab, setStudentSubTab] = useState<string | undefined>(undefined);
  const isMobile = useIsMobileViewport();
  const {
    landingData,
    queries,
    setLandingData,
    setQueries,
    safeSetLocalStorage,
    handleAddQuery,
    handleUpdateQueries,
    handleDeleteQuery,
    handleUpdateLandingData,
  } = useLandingContent();

  const [publishedTests, setPublishedTests] = useState<PublishedTest[]>([]);

  const [selectedPreviewTest, setSelectedPreviewTest] = useState<PublishedTest | null>(null);

  const shouldBlockNonDesktop = Boolean(user && (user.role === 'admin' || user.role === 'faculty') && isMobile);

  const handlePublishTest = async (test: Omit<PublishedTest, 'id' | 'status'> & { id?: string; requiresSaveBeforePublish?: boolean }) => {
    showBatchToast('saving', 'Publishing test to database...');
    try {
      const resolveBatchIds = async (batchLabels: string[]) => {
        const normalize = (value: string) => value.trim().toLowerCase();
        const labelSet = new Set(batchLabels.map(normalize));

        let sourceBatches = adminBatches;
        if (sourceBatches.length === 0) {
          const latest = await apiFetchBatches(true);
          sourceBatches = latest.map(apiBatchToInfo);
          setAdminBatches(sourceBatches);
        }

        return sourceBatches
          .filter((b) => labelSet.has(normalize(b.label)))
          .map((b) => b.id)
          .filter(Boolean) as string[];
      };

      const batchIds = await resolveBatchIds(test.batches);

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

  const handleSaveDraft = async (test: Omit<PublishedTest, 'id' | 'status'> & { id?: string; partialQuestions?: boolean }) => {
    showBatchToast('saving', 'Saving draft...');
    try {
      const normalize = (value: string) => value.trim().toLowerCase();
      const labelSet = new Set(test.batches.map(normalize));

      let sourceBatches = adminBatches;
      if (sourceBatches.length === 0) {
        const latest = await apiFetchBatches(true);
        sourceBatches = latest.map(apiBatchToInfo);
        setAdminBatches(sourceBatches);
      }

      const batchIds = sourceBatches
        .filter((b) => labelSet.has(normalize(b.label)))
        .map((b) => b.id)
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
          partialQuestions: Boolean((test as any).partialQuestions),
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
      let sourceBatches = adminBatches;
      if (sourceBatches.length === 0) {
        const latest = await apiFetchBatches(true);
        sourceBatches = latest.map(apiBatchToInfo);
        setAdminBatches(sourceBatches);
      }

      if (updates.batches) {
        batchIds = sourceBatches
          .filter(b => updates.batches!.includes(b.label))
          .map(b => b.id)
          .filter(Boolean) as string[];
      } else {
        batchIds = sourceBatches
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
  const [isLandingDataLoading, setIsLandingDataLoading] = useState(true);
  const [isGlobalDataLoading, setIsGlobalDataLoading] = useState(false);
  const [showGetStarted, setShowGetStarted] = useState(true);
  const [isAdminFacultyLoading, setIsAdminFacultyLoading] = useState(false);
  const [adminFaculties, setAdminFaculties] = useState<ApiFaculty[]>([]);
  const [adminStudents, setAdminStudents] = useState<ApiStudent[]>([]);
  const [adminSubjects, setAdminSubjects] = useState<ApiSubject[]>([]);
  const [adminBatch, setAdminBatch] = useState<AdminBatch | null>(null);
  const [adminLandingSection, setAdminLandingSection] = useState<AdminLandingSection>('batches');
  const { batchSaveToast, setBatchSaveToast, showBatchToast } = useBatchSaveToast();
  const handleStudentNotificationNavigate = useCallback((tab: 'home' | 'test-series', subTab?: string) => {
    if (!user || user.role !== 'student') return;
    setActiveTab(tab);
    setStudentSubTab(subTab);
    const path = subTab ? `/student/${tab}/${subTab}` : `/student/${tab}`;
    window.history.pushState({ tab, subTab }, '', path);
  }, [user]);
  const {
    notifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDeleteNotification,
  } = useStudentNotifications({
    user,
    onOpenReview: () => {
      console.log("🌟 Review Notification Clicked! Triggering modal...");
      setReviewModalTrigger((prev) => prev + 1);
    },
    onNavigate: handleStudentNotificationNavigate,
    persistNotifications: safeSetLocalStorage,
  });

  const handleSearchAdminStudents = useCallback(async (query: string) => {
    if (!user || user.role !== 'admin') return;
    try {
      const results = await apiFetchStudents(query);
      setAdminStudents(results);
    } catch (error) {
      console.warn('Could not search students from API:', error);
    }
  }, [user]);

  const loadAdminFaculties = useCallback(async (forceRefresh = false) => {
    setIsAdminFacultyLoading(true);
    try {
      const faculties = await fetchFaculties(forceRefresh);
      setAdminFaculties(faculties);
      return faculties;
    } finally {
      setIsAdminFacultyLoading(false);
    }
  }, []);

  const refreshAdminBatchDependencies = async () => {
    const [apiBatches, apiTests, , apiStudents] = await Promise.all([
      apiFetchBatches(),
      apiFetchTests().catch((e) => {
        console.warn('Could not fetch tests from API:', e);
        return [];
      }),
      loadAdminFaculties().catch((e) => {
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

  const addAdminBatch = async (label: string, subjects?: string[], facultyIds?: string[]) => {
    const trimmedLabel = label.trim();
    if (adminBatches.some((b) => b.label.toLowerCase() === trimmedLabel.toLowerCase())) {
      return { ok: false, error: 'A batch with this name already exists' };
    }

    const trimmedSubjects = (subjects ?? []).map(s => s.trim()).filter(Boolean);

    try {
      showBatchToast('saving', 'Creating batch in database...');
      const apiBatch = await apiCreateBatch({
        name: trimmedLabel,
        subjects: trimmedSubjects,
        facultyIds: (facultyIds ?? []).filter(Boolean),
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

  const updateAdminBatch = async (label: string, subjects?: string[], facultyIds?: string[], oldLabel?: string) => {
    const targetLabel = oldLabel || label;
    const trimmedLabel = label.trim();

    // Find the batch we are updating to get its ID
    const batchToUpdate = adminBatches.find((b) => b.label === targetLabel);
    const batchId = batchToUpdate?.id;

    if (trimmedLabel !== targetLabel && adminBatches.some((b) => b.label.toLowerCase() === trimmedLabel.toLowerCase() && b.id !== batchId)) {
      return { ok: false, error: 'A batch with this name already exists' };
    }

    const trimmedSubjects = (subjects ?? []).map(s => s.trim()).filter(Boolean);

    if (!batchId) {
      return { ok: false, error: 'Batch not found in database.' };
    }

    try {
      showBatchToast('saving', 'Saving changes to database...');
      const apiBatch = await apiUpdateBatch(batchId, {
        name: trimmedLabel,
        subjects: trimmedSubjects,
        facultyIds: (facultyIds ?? []).filter(Boolean),
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
      showBatchToast('saving', 'Making batch inactive...');
      await apiDeleteBatch(batch.id);
      await refreshAdminBatchDependencies();
      if (adminBatch === label) {
        setAdminBatch(null);
      }
      showBatchToast('saved', 'Batch made inactive.');
      return { ok: true };
    } catch (err: any) {
      console.error('Failed to delete batch in API:', err);
      showBatchToast('error', err?.message || 'Failed to make batch inactive');
      return { ok: false, error: err?.message || 'Failed to make batch inactive' };
    }
  };

  const uploadAdminBatchTimetable = async (batchId: string, file: File) => {
    try {
      showBatchToast('saving', 'Uploading timetable...');
      const updated = await apiUploadBatchTimetable(batchId, file);
      setAdminBatches((prev) => prev.map((b) => (b.id === batchId ? apiBatchToInfo(updated) : b)));
      showBatchToast('saved', 'Timetable uploaded.');
      return { ok: true, timetableUrl: updated.timetable_url };
    } catch (error: any) {
      console.error('Failed to upload timetable:', error);
      showBatchToast('error', error?.message || 'Failed to upload timetable');
      return { ok: false, error: error?.message || 'Failed to upload timetable' };
    }
  };

  const deleteAdminBatchTimetable = async (batchId: string) => {
    try {
      showBatchToast('saving', 'Deleting timetable...');
      const updated = await apiDeleteBatchTimetable(batchId);
      setAdminBatches((prev) => prev.map((b) => (b.id === batchId ? apiBatchToInfo(updated) : b)));
      showBatchToast('saved', 'Timetable deleted.');
      return { ok: true };
    } catch (error: any) {
      console.error('Failed to delete timetable:', error);
      showBatchToast('error', error?.message || 'Failed to delete timetable');
      return { ok: false, error: error?.message || 'Failed to delete timetable' };
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
      await refreshAdminSubjects();
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
      } else if (tab === 'create-test' || tab === 'create-dpp' || tab === 'notices' || tab === 'upload-notes') {
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
    let cancelled = false;

    const initializeSession = async () => {
      const fetchLandingWithRetry = async (maxAttempts = 3) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            return await fetchLandingData();
          } catch (error) {
            const isLastAttempt = attempt === maxAttempts;
            if (isLastAttempt) {
              console.warn('Could not fetch landing data from API after retries:', error);
              return null;
            }
            await new Promise((resolve) => window.setTimeout(resolve, 250 * attempt));
          }
        }
        return null;
      };

      const loadLandingData = async () => {
        const apiLanding = await fetchLandingWithRetry();
        if (!cancelled && apiLanding) {
          const newData = apiLanding as unknown as LandingData;
          setLandingData(newData);
        }
        if (!cancelled) {
          setIsLandingDataLoading(false);
        }
      };

      void loadLandingData();

      try {
        const hasStoredToken = (() => {
          const token = localStorage.getItem('ujaasToken');
          return Boolean(token && token !== 'null' && token !== 'undefined');
        })();

        const profileResponse = hasStoredToken
          ? await me().catch(e => { console.warn('Could not fetch user profile:', e); return null; })
          : null;

        if (profileResponse && profileResponse.user) {
          const loggedInUser = profileResponse.user as User;
          if (!cancelled) {
            setUser(loggedInUser);
            setShowGetStarted(false);
          }
          
          // Parse the URL and route the user to the correct tab/subTab based on the URL
          if (!cancelled) {
            setTabFromPath(loggedInUser);
          }

          // Fetching is now handled reactively by the loadRequiredData useEffect hook
          // that listens to activeTab and adminLandingSection.
        } else {
          if (!cancelled) {
            setUser(null);
            // If no user, set empty batches
            setAdminBatches([]);
          }
        }
      } catch (error) {
        console.error('Error during session initialization:', error);
        if (!cancelled) {
          setUser(null);
          setAdminBatches([]); // Fallback to empty on error
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    void initializeSession();

    return () => {
      cancelled = true;
    };
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
    
    // On mount, if we are loading the user session, DO NOT wipe the URL.
    // Wait until the user is actually loaded.
    if (!loading && user) {
      setTabFromPath(user);
    } else if (!loading && !user) {
      // User definitively not logged in
      setTabFromPath(null);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user, loading]);

  // True Lazy Tab Loading Watcher Hook
  useEffect(() => {
    if (!user) return;
    let isFetching = false;
    const fetchTasks: Promise<any>[] = [];

    // 1. Batches & Students (Global Foundations, fetched strictly when on Batches/Home section)
    if (
      (user.role === 'admin' || user.role === 'faculty') &&
      adminLandingSection === 'batches' &&
      adminBatches.length === 0
    ) {
      isFetching = true;
      fetchTasks.push(apiFetchBatches().then(res => setAdminBatches(res.map(apiBatchToInfo))).catch(() => {}));
      if (adminStudents.length === 0) {
        fetchTasks.push(apiFetchStudents().then(res => setAdminStudents(res)).catch(() => {}));
        fetchTasks.push(refreshAdminSubjects());
      }
    }

    // 2. Faculties
    if (
      user.role === 'admin' &&
      (adminLandingSection === 'batches' || adminLandingSection === 'faculty') &&
      adminFaculties.length === 0
    ) {
      isFetching = true;
      fetchTasks.push(loadAdminFaculties().catch(() => {}));
    }

    // 3. Tests
    const shouldLoadTests = (activeTab === 'test-series' || adminLandingSection === 'test-series');
    const shouldForceRefreshTests = user.role === 'student' && activeTab === 'test-series';
    if (shouldLoadTests && (publishedTests.length === 0 || shouldForceRefreshTests)) {
      isFetching = true;
      fetchTasks.push(apiFetchTests(shouldForceRefreshTests).then(res => setPublishedTests((res as ApiTest[]).map(apiTestToPublished))).catch(() => {}));
    }

    // 4. Queries
    if (user.role === 'admin' && adminLandingSection === 'queries' && queries.length === 0) {
      isFetching = true;
      fetchTasks.push(fetchQueries().then(res => setQueries(res.queries as LandingQuery[])).catch(() => {}));
    }

    if (isFetching) {
      setIsGlobalDataLoading(true);
      Promise.all(fetchTasks).finally(() => setIsGlobalDataLoading(false));
    }
  }, [user, activeTab, adminLandingSection, adminBatches.length, adminStudents.length, adminFaculties.length, publishedTests.length, queries.length, loadAdminFaculties]);

  useEffect(() => {
    if (!user) return;
    const inTestSeriesView = activeTab === 'test-series' || adminLandingSection === 'test-series';
    if (!inTestSeriesView) return;

    apiFetchTests(true)
      .then((res) => setPublishedTests((res as ApiTest[]).map(apiTestToPublished)))
      .catch(() => {});
  }, [user, activeTab, adminLandingSection]);

  // Reset scroll position to top when navigating between tabs or sections
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, studentSubTab, adminLandingSection, adminBatch]);

  const clearAllApiCaches = () => {
    setQueriesCache(null);
    setBatchesCache(null);
    setFacultiesCache(null);
    setStudentsCache(null);
    setTestsCache(null);
    clearQuestionBankCache();
  };

  const handleLogin = async (userData: User) => {
    clearAllApiCaches();
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

    // Fetching is deferred to the Lazy Tab Loading Watcher Hook above
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Proceed with local cleanup even if API call fails.
    }
    clearAllApiCaches();
    // Hard clear all global React states to prevent cross-login stale data mounts
    setAdminBatches([]);
    setPublishedTests([]);
    setAdminFaculties([]);
    setAdminStudents([]);
    setAdminSubjects([]);
    setSelectedPreviewTest(null);
    setResumeDraftId(null);
    
    setUser(null);
    setAdminBatch(null);
    setAdminLandingSection('batches');
    setShowGetStarted(true);
    window.history.pushState({ view: 'get-started' }, '', '/get-started');
  };
  const handleGetStarted = () => {
    setShowGetStarted(false);
    window.history.pushState({ view: 'login' }, '', '/login');
  };

  if (loading) {
    if (user) {
      return <DashboardLoadingShell role={user.role} />;
    }
    const route = parsePath();
    if (route.view === 'login') {
      return (
        <Suspense fallback={<AuthLoadingShell isMobile={isMobile} />}>
          <Login onLogin={handleLogin} />
        </Suspense>
      );
    }
    if (route.view === 'get-started') {
      return (
        <Suspense fallback={<AuthLoadingShell isMobile={isMobile} />}>
          <GetStarted
            onGetStarted={handleGetStarted}
            isNewUser={false}
            userName=""
            landingData={landingData}
            isLandingLoading={isLandingDataLoading}
            onSubmitQuery={handleAddQuery}
          />
        </Suspense>
      );
    }
    return <AuthLoadingShell isMobile={isMobile} />;
  }

  if (shouldBlockNonDesktop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-2xl backdrop-blur">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 shadow-sm">
            <img src={logo} alt="UJAAS Logo" className="h-9 w-9 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Desktop View Required</h1>
          <p className="mt-3 text-sm text-gray-600 sm:text-base">
            The admin and faculty dashboards are optimized for desktop only. Please enable Desktop Site
            in your browser or open this page on a laptop/desktop to continue.
          </p>
          <div className="mt-6 rounded-2xl bg-teal-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-700 sm:text-sm">
            Tip: Browser menu → “Desktop site”
          </div>
        </div>
      </div>
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
            <Suspense fallback={<AuthLoadingShell isMobile={isMobile} />}>
              <GetStarted
                onGetStarted={handleGetStarted}
                isNewUser={false}
                userName=""
                landingData={landingData}
                isLandingLoading={isLandingDataLoading}
                onSubmitQuery={handleAddQuery}
              />
            </Suspense>
          </motion.div>
        ) : !user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Suspense fallback={<AuthLoadingShell isMobile={isMobile} />}>
              <Login onLogin={handleLogin} />
            </Suspense>
          </motion.div>
        ) : user.role === 'student' ? (
          <motion.div
            key="student"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<DashboardLoadingShell role="student" />}>
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
                reviewModalTrigger={reviewModalTrigger}
                onCloseReview={() => setReviewModalTrigger(0)}
              />
            </Suspense>
          </motion.div>
        ) : user.role === 'faculty' ? (
          <motion.div
            key="faculty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<DashboardLoadingShell role="faculty" />}>
              <FacultyDashboard
                isDataLoading={isGlobalDataLoading}
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
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<DashboardLoadingShell role="admin" />}>
            <AdminDashboard
              isDataLoading={isGlobalDataLoading}
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
              isFacultyDataLoading={isAdminFacultyLoading}
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
              onRefreshFaculties={async () => {
                try {
                  await loadAdminFaculties(true);
                } catch (err) {
                  console.error("Failed to refresh faculties:", err);
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
              onUploadBatchTimetable={uploadAdminBatchTimetable}
              onDeleteBatchTimetable={deleteAdminBatchTimetable}
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
              onSearchStudents={handleSearchAdminStudents}
            />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
    <BatchSaveToast
      toast={batchSaveToast}
      onDismiss={() => setBatchSaveToast(prev => ({ ...prev, visible: false }))}
    />

    {/* Inline keyframes for spinner */}
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </>);
}

export default App;


