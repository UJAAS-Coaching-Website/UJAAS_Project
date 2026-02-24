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
  role: 'student' | 'admin';
  enrolledCourses?: string[];
  studentDetails?: StudentDetails | null;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGetStarted, setShowGetStarted] = useState(true);
  const [isNewSignup, setIsNewSignup] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

    // Check if user has visited before
    const hasVisited = localStorage.getItem('ujaasHasVisited');
    if (hasVisited) {
      setShowGetStarted(false);
    }
    
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

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('ujaasNotifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleSignup = (userData: User) => {
    setUser(userData);
    setIsNewSignup(true);
    setShowGetStarted(true);
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Proceed with local cleanup even if API call fails.
    }
    setUser(null);
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
    setIsNewSignup(false);
    localStorage.setItem('ujaasHasVisited', 'true');
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
      {showGetStarted && user && isNewSignup ? (
        <motion.div
          key="getstarted-signup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
        >
          <GetStarted onGetStarted={handleGetStarted} isNewUser={true} userName={user.name} />
        </motion.div>
      ) : showGetStarted && !user ? (
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
          <Login onLogin={handleLogin} onSignup={handleSignup} />
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
