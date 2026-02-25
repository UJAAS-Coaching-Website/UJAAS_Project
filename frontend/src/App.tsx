import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
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

function App() {
  const studentTabs = ['home', 'notes', 'dpp', 'test-series', 'profile'] as const;
  const adminTabs = [
    'home',
    'students',
    'content',
    'analytics',
    'test-series',
    'ratings',
    'rankings',
    'create-test',
    'create-dpp',
    'upload-notes',
    'profile',
  ] as const;

  type StudentTab = (typeof studentTabs)[number];
  type AdminTab = (typeof adminTabs)[number];

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGetStarted, setShowGetStarted] = useState(true);
  const [activeTab, setActiveTab] = useState<StudentTab | AdminTab>('home');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const isStudentTab = (tab?: string): tab is (typeof studentTabs)[number] =>
    !!tab && studentTabs.includes(tab as (typeof studentTabs)[number]);

  const isAdminTab = (tab?: string): tab is (typeof adminTabs)[number] =>
    !!tab && adminTabs.includes(tab as (typeof adminTabs)[number]);

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
    if (parts[0] === 'admin') {
      return { view: 'admin' as const, tab: parts[1] || 'home' };
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

  const tabToPath = (role: User['role'], tab: StudentTab | AdminTab) => {
    return role === 'student' ? `/student/${tab}` : `/admin/${tab}`;
  };

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
      const tab = isStudentTab(route.tab) ? route.tab : 'home';
      setActiveTab(tab);
      if (route.view !== 'student' || route.tab !== tab) {
        window.history.replaceState({ tab }, '', tabToPath('student', tab));
      }
      return;
    }

    const adminTab = isAdminTab(route.tab) ? route.tab : 'home';
    setActiveTab(adminTab);
    if (route.view !== 'admin' || route.tab !== adminTab) {
      window.history.replaceState({ tab: adminTab }, '', tabToPath('admin', adminTab));
    }
  };

  const navigateTab = (tab: StudentTab | AdminTab) => {
    if (!user) return;
    setActiveTab(tab);
    const path = tabToPath(user.role, tab);
    window.history.pushState({ tab }, '', path);
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
      return;
    }
    if (
      userData.role !== 'student' &&
      isAdminTab(route.tab) &&
      (route.view === 'admin' || route.view === 'generic')
    ) {
      setActiveTab(route.tab);
      return;
    }

    const defaultTab = 'home';
    setActiveTab(defaultTab);
    window.history.pushState({ tab: defaultTab }, '', tabToPath(userData.role, defaultTab));
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Proceed with local cleanup even if API call fails.
    }
    setUser(null);
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
          <GetStarted onGetStarted={handleGetStarted} isNewUser={false} userName="" />
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
            onLogout={handleLogout}
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteNotification={handleDeleteNotification}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
