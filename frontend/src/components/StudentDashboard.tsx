import { useState, useEffect, useCallback } from 'react';
import { User } from '../App';
import {
  GraduationCap,
  FileText,
  BookOpen,
} from 'lucide-react';
import { fetchBatches, fetchBatch, ApiBatch } from '../api/batches';
import { TestSeriesContainer } from './TestSeriesContainer';
import { StudentProfile } from './StudentProfile';
import { MiniAvatar } from './MiniAvatar';
import { FacultyReviewModal } from './FacultyReviewModal';
import { getFacultiesToRate, type FacultyToRate, type ReviewSession } from '../api/facultyReviews';
import { QuestionBank } from './QuestionBank';
import { Notification } from './NotificationCenter';
import { StudentNotificationSheet } from './StudentNotificationSheet';
import { Footer } from './Footer';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.svg';
import { DPPPractice, type DppPracticeSession } from './DPPPractice';
import { closeMyDppSession, type ApiStartDppAttemptPayload } from '../api/dpps';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useIsMobileViewport } from '../hooks/useViewport';
import { downloadFileFromUrl } from '../utils/downloads';
import { BatchTimetableModal } from './BatchTimetableModal';
import { StudentDashboardHome } from './student/StudentDashboardHome';

interface StudentDashboardProps {
  user: User;
  activeTab: Tab;
  subTab?: string;
  onNavigate: (tab: Tab, subTab?: string) => void;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  publishedTests: import('../App').PublishedTest[];
  reviewModalTrigger?: number;
  onCloseReview?: () => void;
}

type Tab = 'home' | 'test-series' | 'profile' | 'batch-detail' | 'question-bank';
const ACTIVE_DPP_SESSION_KEY = 'ujaasActiveDppSession';
const NOTES_RETURN_CONTEXT_KEY = 'ujaasNotesReturnContext';

export function StudentDashboard({
  user,
  activeTab,
  subTab,
  onNavigate,
  onLogout,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  publishedTests,
  reviewModalTrigger,
  onCloseReview
}: StudentDashboardProps) {
  const MOBILE_NAV_SPACER_HEIGHT = 92;
  const MOBILE_NAV_HIDE_DISTANCE = 112;
  const [profileSection, setProfileSection] = useState<'overview' | 'performance' | 'settings'>('overview');
  const isMobileViewport = useIsMobileViewport();
  const [mobileNavOffset, setMobileNavOffset] = useState(0);
  const [isNavbarInternalHidden, setIsNavbarInternalHidden] = useState(false);
  const [testSeriesMode, setTestSeriesMode] = useState<'list' | 'overview' | 'taking' | 'analytics' | 'viewResults'>('list');
  const [showFullTimetable, setShowFullTimetable] = useState(false);
  const [activeDppSession, setActiveDppSession] = useState<DppPracticeSession | null>(null);
  const [batchDetails, setBatchDetails] = useState<ApiBatch | null>(null);
  const [batchDetailsLoading, setBatchDetailsLoading] = useState(false);
  const [batchDetailsError, setBatchDetailsError] = useState<string | null>(null);
  const [batchListCount, setBatchListCount] = useState<number | null>(null);
  const [batchMatchInfo, setBatchMatchInfo] = useState<string | null>(null);
  const [toRateFaculties, setToRateFaculties] = useState<FacultyToRate[]>([]);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [showReviewModalInternal, setShowReviewModalInternal] = useState(false);
  const [hasDismissedReview, setHasReviewDismissed] = useState(() => {
    return localStorage.getItem('ujaas_dismissed_review_session') === 'true';
  });

  useBodyScrollLock(showFullTimetable);

  useEffect(() => {
    const loadReviewInfo = async () => {
      try {
        const { faculties, session } = await getFacultiesToRate();
        setToRateFaculties(faculties);
        setReviewSession(session);

        // Show modal automatically if session is active, student has teachers to rate, 
        // and hasn't dismissed it in this session yet
        if (session && faculties.length > 0 && !hasDismissedReview) {
          setShowReviewModalInternal(true);
        }
      } catch (error) {
        console.error('Failed to load review session info:', error);
      }
    };
    loadReviewInfo();
  }, [hasDismissedReview]);

  // Sync with parent force-open prop (Numeric counter)
  useEffect(() => {
    if (reviewModalTrigger && reviewModalTrigger > 0) {
      const loadInfo = async () => {
        try {
          const { faculties, session } = await getFacultiesToRate();
          if (faculties.length > 0) {
            setToRateFaculties(faculties);
            setReviewSession(session);
            setShowReviewModalInternal(true);
          } else {
            import('sonner').then(({ toast }) => {
              toast.info("You've already rated all available faculties.");
            });
            if (onCloseReview) onCloseReview();
          }
        } catch (error) {
          console.error('Failed to check faculties to rate:', error);
        }
      };
      loadInfo();
    }
  }, [reviewModalTrigger]);

  const handleReviewSubmitSuccess = () => {
    setShowReviewModalInternal(false);
    if (onCloseReview) onCloseReview();

    // Find the review notification and delete it locally
    const reviewNotif = notifications.find(n => n.type === 'review');
    if (reviewNotif) {
      onDeleteNotification(reviewNotif.id);
    }

    setToRateFaculties([]);
    localStorage.removeItem('ujaas_dismissed_review_session');
  };

  const handleCloseReview = () => {
    setShowReviewModalInternal(false);
    if (onCloseReview) onCloseReview();
    setHasReviewDismissed(true);
    localStorage.setItem('ujaas_dismissed_review_session', 'true');
  };

  useEffect(() => {
    document.documentElement.classList.add('scrollbar-hide');
    document.body.classList.add('scrollbar-hide');
    return () => {
      document.documentElement.classList.remove('scrollbar-hide');
      document.body.classList.remove('scrollbar-hide');
    };
  }, []);

  useEffect(() => {
    if (!isMobileViewport) {
      setMobileNavOffset(0);
      return;
    }

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY <= 8) {
        setMobileNavOffset(0);
      } else if (Math.abs(delta) > 1) {
        setMobileNavOffset((prev) => {
          const next = prev + delta;
          return Math.max(0, Math.min(MOBILE_NAV_HIDE_DISTANCE, next));
        });
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobileViewport]);

  useEffect(() => {
    let cancelled = false;
    const loadBatchDetails = async () => {
      if (!user.studentDetails?.batch) {
        if (!cancelled) {
          setBatchDetails(null);
          setBatchDetailsLoading(false);
        }
        return;
      }
      try {
        if (!cancelled) {
          setBatchDetailsLoading(true);
          setBatchDetailsError(null);
        }
        const studentBatchId = user.studentDetails?.batchId;
        const target = user.studentDetails?.batch?.toLowerCase().trim();
        let studentBatch: ApiBatch | null = null;
        try {
          const batches = await fetchBatches();
          if (!cancelled) {
            setBatchListCount(batches.length);
          }
          studentBatch = batches.find((batch) =>
            (studentBatchId && batch.id === studentBatchId)
            || batch.name?.toLowerCase().trim() === target
            || batch.slug?.toLowerCase().trim() === target
          ) || null;
          if (!cancelled) {
            setBatchMatchInfo(studentBatch ? `matched:${studentBatch.name}` : 'not-found');
          }
        } catch (error: any) {
          console.error('Failed to fetch batches list:', error);
          if (!cancelled) {
            setBatchDetailsError(error?.message || 'Failed to load batches.');
          }
        }

        if (!studentBatch && studentBatchId) {
          try {
            studentBatch = await fetchBatch(studentBatchId);
          } catch (error) {
            console.error('Failed to fetch batch by id:', error);
            if (!cancelled) {
              setBatchDetailsError((error as any)?.message || 'Failed to load batch by id.');
            }
          }
        }
        if (!cancelled) {
          setBatchDetails(studentBatch);
        }
      } catch (err) {
        console.error('Failed to fetch batch details:', err);
        if (!cancelled) {
          setBatchDetails(null);
          setBatchDetailsError((err as any)?.message || 'Failed to load batch details.');
        }
      } finally {
        if (!cancelled) {
          setBatchDetailsLoading(false);
        }
      }
    };

    void loadBatchDetails();

    return () => {
      cancelled = true;
    };
  }, [user.studentDetails?.batch]);

  useEffect(() => {
    if (activeTab !== 'home' || subTab !== 'dpp') {
      setActiveDppSession(null);
      return;
    }

    try {
      const raw = sessionStorage.getItem(ACTIVE_DPP_SESSION_KEY);
      if (!raw) {
        setActiveDppSession(null);
        return;
      }

      setActiveDppSession(JSON.parse(raw) as DppPracticeSession);
    } catch (error) {
      console.error('Failed to restore active DPP session', error);
      sessionStorage.removeItem(ACTIVE_DPP_SESSION_KEY);
      setActiveDppSession(null);
    }
  }, [activeTab, subTab]);

  const homeTabProps = {
    user,
    onNavigate,
    onOpenPerformance: () => {
      setProfileSection('performance');
      onNavigate('profile');
    },
    isMobileViewport,
    activeTab,
    onViewTimetable: () => setShowFullTimetable(true),
    batchDetails,
    batchDetailsLoading,
    batchDetailsError,
    batchListCount,
    batchMatchInfo,
  };

  const isDppRoute = activeTab === 'home' && subTab === 'dpp';
  const isNavbarHidden = isNavbarInternalHidden || isDppRoute;
  const isTestAttemptRoute = activeTab === 'test-series' && testSeriesMode === 'taking';
  const isTestAnalyticsRoute = activeTab === 'test-series' && testSeriesMode === 'analytics';
  const mobileSpacerHeight = activeTab === 'profile' ? 56 : MOBILE_NAV_SPACER_HEIGHT;

  const handleSubTabNavigate = useCallback((newSubTab?: string) => {
    onNavigate(activeTab, newSubTab);
  }, [activeTab, onNavigate]);

  const handleTestSeriesStateChange = useCallback((mode: 'list' | 'overview' | 'taking' | 'analytics' | 'viewResults') => {
    setTestSeriesMode(mode);
    setIsNavbarInternalHidden(mode !== 'list');
  }, []);

  const handleExitDpp = () => {
    const dppId = activeDppSession?.mode === 'attempt'
      ? activeDppSession.payload.dpp.id
      : activeDppSession?.mode === 'result'
        ? activeDppSession.result.dppId
        : null;

    if (dppId) {
      closeMyDppSession(dppId).catch(() => undefined);
    }

    sessionStorage.removeItem(ACTIVE_DPP_SESSION_KEY);

    try {
      const raw = localStorage.getItem(NOTES_RETURN_CONTEXT_KEY);
      if (!raw) {
        onNavigate('home');
        return;
      }

      const saved = JSON.parse(raw) as { returnTab?: Tab };
      onNavigate(saved.returnTab || 'home');
    } catch {
      onNavigate('home');
    }
  };

  const handleTimetableDownload = async (fileUrl: string | null | undefined) => {
    if (!fileUrl) return;
    try {
      await downloadFileFromUrl(fileUrl, 'timetable');
    } catch (error) {
      console.error('Timetable download failed:', error);
      window.alert('Failed to download timetable. Please try again.');
    }
  };

  return (
    <div className="footer-reveal-page footer-reveal-page--nav min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex flex-col">
      {/* Navigation */}
      {!isNavbarHidden && (
        <nav
          className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white fixed top-0 left-0 right-0 z-layer-navbar transition-transform duration-300"
          style={{
            transform: isMobileViewport ? `translateY(-${mobileNavOffset}px)` : 'translateY(0)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isMobileViewport ? (
              <>
            <div className="flex items-center justify-between h-14">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  setProfileSection('overview');
                  onNavigate('home');
                }}
                title="Go to Dashboard"
              >
                <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                <span className="navbar-brand-wordmark text-lg" style={{ color: 'rgb(159, 29, 14)' }}>
                  UJAAS
                </span>
              </motion.button>

              <div className="flex items-center gap-3">
                <StudentNotificationSheet
                  notifications={notifications}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAllAsRead={onMarkAllAsRead}
                  onDelete={onDeleteNotification}
                />
                <motion.button
                  onClick={() => {
                    setProfileSection('overview');
                    onNavigate('profile');
                  }}
                  className="p-0 border-none bg-transparent"
                  title="View Profile"
                >
                  <MiniAvatar user={user} className="w-9 h-9" />
                </motion.button>
              </div>
            </div>

            {activeTab !== 'profile' && (
              <div className="border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 px-1 py-2">
                  {[
                    { id: 'home', label: 'Dashboard', icon: GraduationCap },
                    { id: 'test-series', label: 'Test Series', icon: FileText },
                    { id: 'question-bank', label: 'Question Bank', icon: BookOpen }
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'home') setProfileSection('overview');
                        onNavigate(tab.id as Tab);
                      }}
                      className={`flex min-w-0 items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium transition-all rounded-lg whitespace-nowrap ${
                        (activeTab === tab.id || (activeTab === 'batch-detail' && tab.id === 'home'))
                          ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100 bg-gray-50'
                        }`}
                      style={{ fontSize: '12px', width: 'calc((100% - 1rem) / 3)' }}
                    >
                      <tab.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {isMobileViewport && tab.id === 'question-bank' ? 'QB' : tab.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
              </>
            ) : (
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setProfileSection('overview');
                  onNavigate('home');
                }}
                title="Go to Dashboard"
              >
                <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
                <span className="navbar-brand-wordmark hidden text-xl sm:inline" style={{ color: 'rgb(159, 29, 14)' }}>
                  UJAAS
                </span>
              </motion.button>

              {/* Center Navigation Tabs */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'home', label: 'Dashboard', icon: GraduationCap },
                  { id: 'test-series', label: 'Test Series', icon: FileText },
                  { id: 'question-bank', label: 'Question Bank', icon: BookOpen }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'home') setProfileSection('overview');
                      onNavigate(tab.id as Tab);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${
                      (activeTab === tab.id || (activeTab === 'batch-detail' && tab.id === 'home'))
                        ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Profile Button */}
                <div className="flex items-center gap-4">
                <StudentNotificationSheet
                  notifications={notifications}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAllAsRead={onMarkAllAsRead}
                  onDelete={onDeleteNotification}
                />
                <motion.button
                  onClick={() => {
                    setProfileSection('overview');
                    onNavigate('profile');
                  }}
                  className="p-0 border-none bg-transparent"
                  title="View Profile"
                >
                  <MiniAvatar user={user} className="w-10 h-10" />
                </motion.button>
              </div>
            </div>
            )}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={`footer-reveal-main w-full flex-grow ${(isTestAttemptRoute || isTestAnalyticsRoute || isDppRoute) ? 'max-w-none mx-0 px-0 py-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {!isNavbarHidden && (
          <div style={{ height: isMobileViewport ? `${mobileSpacerHeight}px` : '4rem' }} />
        )}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'home' && subTab === 'dpp' && activeDppSession && (
            <DPPPractice
              session={activeDppSession}
              onExit={handleExitDpp}
              onSessionChange={(nextSession) => {
                setActiveDppSession(nextSession);
                sessionStorage.setItem(ACTIVE_DPP_SESSION_KEY, JSON.stringify(nextSession));
              }}
            />
          )}
          {activeTab === 'home' && subTab === 'dpp' && !activeDppSession && (
            <div className="rounded-3xl border border-gray-200 bg-white/80 p-10 text-center shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900">No active DPP session</h2>
              <p className="mt-2 text-gray-600">Open a DPP from your batch content to start a new attempt.</p>
              <button
                onClick={() => onNavigate('home')}
                className="mt-6 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-3 font-bold text-white shadow-lg"
              >
                Back to Dashboard
              </button>
            </div>
          )}
          {activeTab === 'home' && subTab !== 'dpp' && (
            <StudentDashboardHome {...homeTabProps} />
          )}
          {activeTab === 'test-series' && (
            <TestSeriesContainer
              user={user}
              publishedTests={publishedTests}
              onStateChange={handleTestSeriesStateChange}
              subTab={subTab}
              onNavigateSubTab={handleSubTabNavigate}
            />
          )}
          {activeTab === 'profile' && (
            <StudentProfile
              user={user}
              onLogout={onLogout}
              initialSection={profileSection}
            />
          )}
          {activeTab === 'batch-detail' && (
            <StudentDashboardHome {...homeTabProps} />
          )}
          {activeTab === 'question-bank' && (
            <QuestionBank
              userRole="student"
              userBatch={user.studentDetails?.batch}
              onBack={() => onNavigate('home')}
            />
          )}
        </motion.div>
      </main>

      {/* Footer */}
      {!isNavbarHidden && <Footer />}

      {/* Faculty Review Modal */}
      <AnimatePresence>
        {showReviewModalInternal && toRateFaculties.length > 0 && (
          <FacultyReviewModal
            faculties={toRateFaculties}
            onClose={handleCloseReview}
            onSubmitSuccess={handleReviewSubmitSuccess}
          />
        )}
      </AnimatePresence>

      <BatchTimetableModal
        open={showFullTimetable}
        onClose={() => setShowFullTimetable(false)}
        imageUrl={batchDetails?.timetable_url}
        isMobileViewport={isMobileViewport}
        onDownload={batchDetails?.timetable_url ? () => { void handleTimetableDownload(batchDetails.timetable_url); } : null}
      />
    </div>
  );
}

