import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { GetStarted } from './components/GetStarted';
import { Notification } from './components/NotificationCenter';
import { me, logout as logoutRequest, StudentDetails } from './api/auth';
import { motion, AnimatePresence } from 'motion/react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
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
  message?: string;
  date: string;
  status: 'new' | 'contacted' | 'completed';
}

export interface LandingData {
  courses: string[];
  faculty: LandingFaculty[];
  achievers: LandingAchiever[];
  contact: LandingContact;
}

function App() {
  const studentTabs = ['home', 'notes', 'dpp', 'test-series', 'profile'] as const;
  const adminTabs = [
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
  ] as const;

  type StudentTab = (typeof studentTabs)[number];
  type AdminTab = (typeof adminTabs)[number];
  type AdminBatch = string;
  type AdminBatchInfo = { label: string; slug: string; subjects?: string[]; facultyAssigned?: string[] };
  const initialAdminBatches: AdminBatchInfo[] = [
    { label: '11th JEE', slug: '11th-jee' },
    { label: '11th NEET', slug: '11th-neet' },
    { label: '12th JEE', slug: '12th-jee' },
    { label: '12th NEET', slug: '12th-neet' },
    { label: 'Dropper JEE', slug: 'dropper-jee' },
    { label: 'Dropper NEET', slug: 'dropper-neet' },
  ];
  const adminLandingSections = ['landing', 'batches', 'students', 'faculty', 'test-series', 'queries'] as const;
  type AdminLandingSection = (typeof adminLandingSections)[number];

  const [user, setUser] = useState<User | null>(null);

  const [queries, setQueries] = useState<LandingQuery[]>(() => {
    const stored = localStorage.getItem('ujaasQueries');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('ujaasQueries', JSON.stringify(queries));
  }, [queries]);

  const handleAddQuery = (query: Omit<LandingQuery, 'id' | 'date' | 'status'>) => {
    const newQuery: LandingQuery = {
      ...query,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      status: 'new'
    };
    setQueries(prev => [newQuery, ...prev]);
  };

  const [landingData, setLandingData] = useState<LandingData>(() => {
    const defaultData = {
      courses: [
        'JEE MAINS / ADVANCED',
        'NEET',
        'BOARDS',
        'GUJCET',
        '11TH SCIENCE',
        '12TH SCIENCE',
        '7TH TO 10TH FOUNDATION',
        'DROPPER BATCH'
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
        return {
          ...defaultData,
          ...parsed,
          courses: Array.isArray(parsed.courses) ? parsed.courses : defaultData.courses,
          faculty: Array.isArray(parsed.faculty) ? parsed.faculty : defaultData.faculty,
          achievers: Array.isArray(parsed.achievers) ? parsed.achievers : defaultData.achievers,
          contact: parsed.contact || defaultData.contact,
        };
      } catch (e) {
        console.error('Failed to parse landing data', e);
      }
    }
    return defaultData;
  });

  useEffect(() => {
    localStorage.setItem('ujaasLandingData', JSON.stringify(landingData));
  }, [landingData]);

  const [adminBatches, setAdminBatches] = useState<AdminBatchInfo[]>(() => {
    const stored = localStorage.getItem('ujaasAdminBatches');
    if (!stored) return initialAdminBatches;
    try {
      const parsed = JSON.parse(stored) as AdminBatchInfo[];
      if (!Array.isArray(parsed) || parsed.length === 0) return initialAdminBatches;
      const normalized = parsed
        .filter((entry) => entry && typeof entry.label === 'string' && typeof entry.slug === 'string')
        .map((entry) => {
          const subjectList = Array.isArray(entry.subjects)
            ? entry.subjects.map((subject) => subject.trim()).filter(Boolean)
            : entry.subject
            ? [String(entry.subject).trim()].filter(Boolean)
            : [];
          const facultyList = Array.isArray(entry.facultyAssigned)
            ? entry.facultyAssigned.map((faculty) => faculty.trim()).filter(Boolean)
            : entry.facultyAssigned
            ? [String(entry.facultyAssigned).trim()].filter(Boolean)
            : [];

          return {
            label: entry.label.trim(),
            slug: entry.slug.trim(),
            subjects: subjectList.length ? subjectList : undefined,
            facultyAssigned: facultyList.length ? facultyList : undefined,
          };
        })
        .filter((entry) => entry.label && entry.slug);
      return normalized.length ? normalized : initialAdminBatches;
    } catch {
      return initialAdminBatches;
    }
  });
  const [loading, setLoading] = useState(true);
  const [showGetStarted, setShowGetStarted] = useState(true);
  const [activeTab, setActiveTab] = useState<StudentTab | AdminTab>('home');
  const [adminBatch, setAdminBatch] = useState<AdminBatch | null>(null);
  const [adminLandingSection, setAdminLandingSection] = useState<AdminLandingSection>('batches');
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  const addAdminBatch = (label: string, subjects?: string[], facultyAssigned?: string[]) => {
    const trimmedLabel = label.trim();
    const trimmedSubjects = (subjects ?? []).map((subject) => subject.trim()).filter(Boolean);
    const trimmedFaculty = (facultyAssigned ?? []).map((faculty) => faculty.trim()).filter(Boolean);
    if (!trimmedLabel) {
      return { ok: false, error: 'Batch name is required.' };
    }
    if (trimmedSubjects.length === 0) {
      return { ok: false, error: 'At least one subject is required.' };
    }
    if (trimmedFaculty.length === 0) {
      return { ok: false, error: 'At least one faculty is required.' };
    }

    let result: { ok: boolean; error?: string; label?: string } = { ok: false, error: 'Unknown error.' };
    setAdminBatches((prev) => {
      const exists = prev.some((batch) => batch.label.toLowerCase() === trimmedLabel.toLowerCase());
      if (exists) {
        result = { ok: false, error: 'Batch already exists.' };
        return prev;
      }

      const baseSlug = trimmedLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'batch';
      let slug = baseSlug;
      let counter = 2;
      const existingSlugs = new Set(prev.map((batch) => batch.slug));
      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
      }

      result = { ok: true, label: trimmedLabel };
      return [
        ...prev,
        {
          label: trimmedLabel,
          slug,
          subjects: trimmedSubjects,
          facultyAssigned: trimmedFaculty.length ? trimmedFaculty : undefined,
        },
      ];
    });

    return result;
  };

  const updateAdminBatch = (label: string, subjects?: string[], facultyAssigned?: string[]) => {
    const trimmedLabel = label.trim();
    const trimmedSubjects = (subjects ?? []).map((subject) => subject.trim()).filter(Boolean);
    const trimmedFaculty = (facultyAssigned ?? []).map((faculty) => faculty.trim()).filter(Boolean);

    if (!trimmedLabel) {
      return { ok: false, error: 'Batch name is required.' };
    }

    let result: { ok: boolean; error?: string } = { ok: false, error: 'Batch not found.' };
    setAdminBatches((prev) => {
      const index = prev.findIndex((batch) => batch.label === trimmedLabel);
      if (index === -1) {
        result = { ok: false, error: 'Batch not found.' };
        return prev;
      }

      const next = [...prev];
      next[index] = {
        ...next[index],
        subjects: trimmedSubjects.length ? trimmedSubjects : undefined,
        facultyAssigned: trimmedFaculty.length ? trimmedFaculty : undefined,
      };
      result = { ok: true };
      return next;
    });

    return result;
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
      return { view: 'student' as const, tab: parts[1] || 'home' };
    }
    if (parts[0] === 'teacher') {
      if (parts.length === 1) {
        return { view: 'teacher' as const, section: 'batches' as AdminLandingSection };
      }

      const second = parts[1];
      const third = parts[2];

      if (isAdminBatchSlug(second)) {
        return { view: 'teacher' as const, batch: second, tab: third || 'home' };
      }

      if (isAdminLandingSection(second)) {
        return { view: 'teacher' as const, section: second };
      }

      if (isAdminTab(second)) {
        return { view: 'teacher' as const, tab: second };
      }

      return { view: 'teacher' as const, section: 'batches' as AdminLandingSection };
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

  const tabToPath = (role: User['role'], tab: StudentTab | AdminTab, batch: AdminBatch | null = null) => {
    if (role === 'student') return `/student/${tab}`;
    if (role === 'teacher') {
      const batchSlug = slugFromBatch(batch);
      if (batchSlug) return `/teacher/${batchSlug}/${tab}`;
      return tab === 'home' ? '/teacher' : `/teacher/${tab}`;
    }
    const batchSlug = slugFromBatch(batch);
    if (batchSlug) return `/admin/${batchSlug}/${tab}`;
    return tab === 'home' ? '/admin' : `/admin/${tab}`;
  };

  const adminSectionToPath = (section: AdminLandingSection) =>
    section === 'batches' ? '/admin' : `/admin/${section}`;

  const teacherSectionToPath = (section: AdminLandingSection) =>
    section === 'batches' ? '/teacher' : `/teacher/${section}`;

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
      if (route.view !== 'student' || route.tab !== tab) {
        window.history.replaceState({ tab }, '', tabToPath('student', tab));
      }
      return;
    }

    const isTeacherRole = currentUser.role === 'teacher';
    const isRoleMismatch =
      (currentUser.role === 'teacher' && route.view === 'admin') ||
      (currentUser.role === 'admin' && route.view === 'teacher');
    const parsedBatch = route.view === 'admin' || route.view === 'teacher' ? batchFromSlug(route.batch) : null;
    const parsedSection =
      (route.view === 'admin' || route.view === 'teacher') && isAdminLandingSection(route.section) ? route.section : 'batches';
    const adminTab = isAdminTab(route.tab) ? route.tab : 'home';
    setAdminBatch(parsedBatch);
    setAdminLandingSection(parsedSection);
    setActiveTab(adminTab);
    const canonicalPath = parsedBatch
      ? tabToPath(isTeacherRole ? 'teacher' : 'admin', adminTab, parsedBatch)
      : adminTab === 'profile'
      ? isTeacherRole
        ? '/teacher/profile'
        : '/admin/profile'
      : isTeacherRole
      ? teacherSectionToPath(parsedSection)
      : adminSectionToPath(parsedSection);
    if (window.location.pathname.replace(/\/+$/, '') !== canonicalPath || isRoleMismatch) {
      window.history.replaceState({ tab: adminTab, batch: parsedBatch, section: parsedSection }, '', canonicalPath);
    }
  };

  const navigateTab = (tab: StudentTab | AdminTab) => {
    if (!user) return;
    setActiveTab(tab);
    
    let path = '';
    if (user.role === 'student') {
      path = tabToPath('student', tab);
    } else {
      const role = user.role === 'teacher' ? 'teacher' : 'admin';
      if (adminBatch) {
        path = tabToPath(role, tab, adminBatch);
      } else if (tab === 'profile') {
        path = `/${role}/profile`;
      } else if (tab === 'create-test' || tab === 'create-dpp' || tab === 'upload-notice' || tab === 'upload-notes') {
        path = `/${role}/${adminLandingSection}/${tab}`;
      } else {
        path = user.role === 'teacher' ? teacherSectionToPath(adminLandingSection) : adminSectionToPath(adminLandingSection);
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
    const path = tabToPath(user?.role === 'teacher' ? 'teacher' : 'admin', 'home', batch);
    window.history.pushState({ tab: 'home', batch, section: 'batches' }, '', path);
  };

  const handleAdminClearBatch = () => {
    if (user?.role === 'student') return;
    setAdminBatch(null);
    setAdminLandingSection('batches');
    setActiveTab('home');
    window.history.pushState(
      { tab: 'home', batch: null, section: 'batches' },
      '',
      user?.role === 'teacher' ? '/teacher' : '/admin'
    );
  };

  const handleAdminNavigateSection = (section: AdminLandingSection) => {
    if (user?.role === 'student') return;
    setAdminLandingSection(section);
    setAdminBatch(null);
    const targetTab = section === 'test-series' ? 'test-series' : 'home';
    setActiveTab(targetTab);
    const path = user?.role === 'teacher' ? teacherSectionToPath(section) : adminSectionToPath(section);
    window.history.pushState({ tab: targetTab, batch: null, section }, '', path);
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const profile = await me();
        setUser(profile.user as User);
        setShowGetStarted(false);
      } catch {
        setUser(null);
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
      localStorage.setItem('ujaasNotifications', JSON.stringify(defaultNotifications));
    }

    initializeSession();
  }, []);

  useEffect(() => {
    localStorage.setItem('ujaasAdminBatches', JSON.stringify(adminBatches));
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
      localStorage.setItem('ujaasNotifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowGetStarted(false);

    const route = parsePath();
    if (
      userData.role === 'student' &&
      isStudentTab(route.tab) &&
      (route.view === 'student' || route.view === 'generic')
    ) {
      setActiveTab(route.tab);
      setAdminBatch(null);
      setAdminLandingSection('batches');
      return;
    }
    if (userData.role !== 'student' && (route.view === 'admin' || route.view === 'teacher')) {
      const parsedBatch = batchFromSlug(route.batch);
      const parsedSection = isAdminLandingSection(route.section) ? route.section : 'batches';
      const parsedTab = isAdminTab(route.tab) ? route.tab : 'home';
      setAdminBatch(parsedBatch);
      setAdminLandingSection(parsedSection);
      setActiveTab(parsedTab);
      const isTeacherRole = userData.role === 'teacher';
      const isRoleMismatch =
        (userData.role === 'teacher' && route.view === 'admin') ||
        (userData.role === 'admin' && route.view === 'teacher');
      const canonicalPath = parsedBatch
        ? tabToPath(isTeacherRole ? 'teacher' : 'admin', parsedTab, parsedBatch)
        : parsedTab === 'profile'
        ? isTeacherRole
          ? '/teacher/profile'
          : '/admin/profile'
        : isTeacherRole
        ? teacherSectionToPath(parsedSection)
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
      window.history.pushState({ tab: defaultTab }, '', tabToPath('student', defaultTab));
      return;
    }

    setAdminBatch(null);
    setAdminLandingSection('batches');
    window.history.pushState(
      { tab: defaultTab, batch: null, section: 'batches' },
      '',
      userData.role === 'teacher' ? '/teacher' : '/admin'
    );
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
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50"
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-2xl font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Loading...</div>
        </div>
      </motion.div>
    );
  }

  return (
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
            onNavigate={navigateTab}
            onLogout={handleLogout}
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteNotification={handleDeleteNotification}
          />
        </motion.div>
      ) : user.role === 'teacher' ? (
        <motion.div
          key="teacher"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TeacherDashboard 
            user={user} 
            activeTab={(isAdminTab(activeTab) ? activeTab : 'home')}
            onNavigate={navigateTab}
            adminSection={adminLandingSection}
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
            onCreateBatch={addAdminBatch}
            onUpdateBatch={updateAdminBatch}
            onLogout={handleLogout}
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteNotification={handleDeleteNotification}
            landingData={landingData}
            onUpdateLandingData={setLandingData}
            queries={queries}
            onUpdateQueries={setQueries}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
