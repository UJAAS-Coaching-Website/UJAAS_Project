import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { me } from '../api/auth';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  BookOpen,
  Calendar,
  Award,
  Star,
  Target,
  BarChart3,
  Settings,
  Lock,
  Phone,
  MapPin,
  LogOut
} from 'lucide-react';

interface TeacherProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    role?: 'student' | 'teacher' | 'admin';
    enrolledCourses?: string[];
    studentDetails?: StudentDetails | null;
  };
  onLogout: () => void;
}

interface StudentDetails {
  rollNumber: string;
  batch: string;
  joinDate: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  parentContact: string;
  ratings?: {
    attendance: number;
    assignments: number;
    tests: number;
    participation: number;
    behavior: number;
    engagement: number;
    dppPerformance: number;
  };
}

function normalizeDateForInput(value?: string | null): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (typeof value === 'string' && value.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(value?: string | null): string {
  if (!value) return 'N/A';
  const normalized = normalizeDateForInput(value);
  if (!normalized) return 'N/A';
  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function TeacherProfile({ user, onLogout }: TeacherProfileProps) {
  const [profileUser, setProfileUser] = useState(user);
  const [activeSection, setActiveSection] = useState<'overview' | 'performance' | 'settings'>('overview');

  const normalizeDetails = (details?: StudentDetails | null): StudentDetails => {
    if (!details) {
      return {
        rollNumber: 'UG2025001',
        batch: '2025-26',
        joinDate: '2025-09-01',
        phone: '+91 98765 43210',
        address: 'Mumbai, Maharashtra',
        dateOfBirth: '2005-05-15',
        parentContact: '+91 98765 43211',
        ratings: {
          attendance: 4,
          assignments: 4,
          tests: 4,
          participation: 4,
          behavior: 4,
          engagement: 4,
          dppPerformance: 4
        }
      };
    }

    const fallbackRatings = {
      attendance: 4,
      assignments: 4,
      tests: 4,
      participation: 4,
      behavior: 4,
      engagement: 4,
      dppPerformance: 4
    };

    const hasMeaningfulRatings = !!details.ratings && Object.values(details.ratings).some((value) => value > 0);

    return {
      rollNumber: details.rollNumber || '',
      batch: details.batch || '',
      joinDate: normalizeDateForInput(details.joinDate),
      phone: details.phone || '',
      address: details.address || '',
      dateOfBirth: normalizeDateForInput(details.dateOfBirth),
      parentContact: details.parentContact || '',
      ratings: hasMeaningfulRatings
        ? {
            attendance: details.ratings?.attendance ?? 0,
            assignments: details.ratings?.assignments ?? 0,
            tests: details.ratings?.tests ?? 0,
            participation: details.ratings?.participation ?? 0,
            behavior: details.ratings?.behavior ?? 0,
            engagement: details.ratings?.engagement ?? 0,
            dppPerformance: details.ratings?.dppPerformance ?? 0
          }
        : fallbackRatings
    };
  };
  
  // Use backend profile details when available; fallback to defaults.
  const [studentDetails, setStudentDetails] = useState<StudentDetails>(() => {
    return normalizeDetails(user.studentDetails);
  });

  useEffect(() => {
    setProfileUser(user);
    const normalized = normalizeDetails(user.studentDetails);
    setStudentDetails(normalized);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const refreshProfile = async () => {
      try {
        const response = await me();
        if (!mounted) return;

        const latestUser = response.user as any;
        setProfileUser(latestUser);
        const normalized = normalizeDetails(latestUser.studentDetails);
        setStudentDetails(normalized);
      } catch {
        // Keep existing profile state if refresh fails.
      }
    };

    refreshProfile();

    return () => {
      mounted = false;
    };
  }, []);

  // Calculate overall rating (out of 5)
  const calculateOverallPerformance = () => {
    if (!studentDetails.ratings) return 0;
    const { attendance, tests, behavior, dppPerformance } = studentDetails.ratings;

    const ratings = [attendance, tests, behavior, dppPerformance];
    const total = ratings.reduce((sum, value) => sum + value, 0);
    return Number((total / ratings.length).toFixed(1));
  };

  const overallPerformance = calculateOverallPerformance();

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.05}}
            className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30"
          >
            {profileUser.name.charAt(0).toUpperCase()}
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">{profileUser.name}</h2>
                <div className="flex flex-wrap gap-4 text-indigo-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{profileUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Roll: {studentDetails.rollNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Batch: {studentDetails.batch}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'performance', label: 'Performance', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg whitespace-nowrap ${
              activeSection === tab.id
                ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white shadow-lg'
                : 'text-gray-600 bg-white hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content Sections */}
      {activeSection === 'overview' && (
        <OverviewSection
          user={profileUser}
          details={studentDetails}
          overallPerformance={overallPerformance}
        />
      )}

      {activeSection === 'performance' && (
        <PerformanceSection details={studentDetails} overallPerformance={overallPerformance} />
      )}

      {activeSection === 'settings' && (
        <SettingsSection onLogout={onLogout} />
      )}
    </div>
  );
}

function renderRatingStars(rating: number) {
  const normalizedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${normalizedRating} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => {
        const isFilled = index < normalizedRating;

        return (
          <span
            key={index}
            className="inline-block text-[18px] leading-5"
            style={{ color: isFilled ? '#f59e0b' : '#d1d5db' }}
          >
            {'\u2605'}
          </span>
        );
      })}
    </div>
  );
}

function OverviewSection({ 
  details, 
  overallPerformance
}: { 
  details: StudentDetails; 
  overallPerformance: number;
}) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-white"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mb-2">{renderRatingStars(overallPerformance)}</div>
          <p className="text-sm text-gray-600">Overall Rating</p>
        </motion.div>
      </div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Phone', value: details.phone, icon: Phone, key: 'phone' },
            { label: 'Date of Birth', value: details.dateOfBirth, icon: Calendar, key: 'dateOfBirth', type: 'date' },
            { label: 'Address', value: details.address, icon: MapPin, key: 'address' },
            { label: 'Parent Contact', value: details.parentContact, icon: Phone, key: 'parentContact' },
            { label: 'Roll Number', value: details.rollNumber, icon: Award, key: 'rollNumber', editable: false },
            { label: 'Join Date', value: details.joinDate, icon: Calendar, key: 'joinDate', type: 'date', editable: false }
          ].map((field, index) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="group"
            >
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <field.icon className="w-4 h-4" />
                {field.label}
              </label>
              <p className="text-gray-900 font-medium px-4 py-2 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition">
                {field.type === 'date' ? formatDateForDisplay(field.value) : field.value}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function PerformanceSection({ details, overallPerformance }: { details: StudentDetails; overallPerformance: number }) {
  const ratings = details.ratings || {
    attendance: 0,
    assignments: 0,
    tests: 0,
    participation: 0,
    behavior: 0,
    engagement: 0,
    dppPerformance: 0
  };

  const performanceData = [
    { label: 'Attendance', value: ratings.attendance, max: 5, color: 'from-green-500 to-emerald-500', bgColor: 'from-green-50 to-emerald-50' },
    { label: 'Test Performance', value: ratings.tests, max: 5, color: 'from-purple-500 to-pink-500', bgColor: 'from-purple-50 to-pink-50' },
    { label: 'DPP Performance', value: ratings.dppPerformance, max: 5, color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-50 to-cyan-50' },
    { label: 'Class Behaviour', value: ratings.behavior, max: 5, color: 'from-indigo-500 to-purple-500', bgColor: 'from-indigo-50 to-purple-50' }
  ];

  return (
    <div className="space-y-6">
      {/* Overall Performance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Overall Rating</h3>
              <p className="text-white/80">Based on all evaluated criteria</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.1}}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30"
            >
              <div className="text-center">
                <div className="text-4xl font-bold">{overallPerformance}</div>
                <div className="text-xs">/ 5</div>
              </div>
            </motion.div>
          </div>
          <div className="mt-4">{renderRatingStars(overallPerformance)}</div>
        </div>
      </motion.div>

      {/* Performance Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          Performance Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {performanceData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className={`p-5 bg-gradient-to-br ${item.bgColor} rounded-xl border border-white shadow-md`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{item.label}</h4>
                <span className="text-2xl font-bold text-gray-900">
                  {item.value}<span className="text-lg text-gray-600">/{item.max}</span>
                </span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / item.max) * 100}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                  className={`h-3 rounded-full bg-gradient-to-r ${item.color} shadow-sm`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-600" />
          Performance Insights
        </h3>
        <div className="space-y-3">
          {overallPerformance >= 4.5 && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
              <p className="text-green-800 font-medium">🎉 Excellent Performance! Keep up the great work!</p>
            </div>
          )}
          {overallPerformance >= 3.5 && overallPerformance < 4.5 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg">
              <p className="text-blue-800 font-medium">👍 Good Performance! You're doing well!</p>
            </div>
          )}
          {overallPerformance >= 2.5 && overallPerformance < 3.5 && (
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg">
              <p className="text-yellow-800 font-medium">📈 Keep Improving! There's room for growth!</p>
            </div>
          )}
          {overallPerformance < 2.5 && overallPerformance > 0 && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-800 font-medium">💪 Focus Required! Let's work on improvement together!</p>
            </div>
          )}
          {overallPerformance === 0 && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-500 rounded-lg">
              <p className="text-gray-800 font-medium">📊 No ratings yet. Your performance will be evaluated by the admin.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SettingsSection({ onLogout }: { onLogout: () => void }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const closeChangePassword = () => {
    setShowChangePassword(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handlePasswordChange = (field: keyof typeof passwordForm) => (event: ChangeEvent<HTMLInputElement>) => {
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePasswordSubmit = (event: FormEvent) => {
    event.preventDefault();
    closeChangePassword();
  };

  return (
    <div className="space-y-6">
      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Lock className="w-6 h-6 text-indigo-600" />
          Security
        </h3>
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowChangePassword(true)}
            className="w-full p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl text-left hover:shadow-md transition flex items-center justify-between group"
          >
            <div>
              <h4 className="font-semibold text-gray-900">Change Password</h4>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <div className="w-8 h-8 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition">
              <Lock className="w-4 h-4 text-indigo-600" />
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Account Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Management</h3>
        
        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl text-left hover:border-orange-400 transition mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <LogOut className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-orange-700">Logout</h4>
              <p className="text-sm text-orange-600">Sign out of your account</p>
            </div>
          </div>
        </motion.button>
      </motion.div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
                <p className="text-gray-600">Are you sure you want to sign out of your account?</p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4"
            onClick={closeChangePassword}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h3>
                <p className="text-gray-600">Enter your current password and choose a new one.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Old Password
                  <input
                    type="password"
                    required
                    value={passwordForm.oldPassword}
                    onChange={handlePasswordChange('oldPassword')}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Enter old password"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  New Password
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange('newPassword')}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Enter new password"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange('confirmPassword')}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Re-enter new password"
                  />
                </label>

                <div className="pt-2 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={closeChangePassword}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
                  >
                    Update Password
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
