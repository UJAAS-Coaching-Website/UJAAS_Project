import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { me, type FacultyDetails } from '../api/auth';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import {
  User,
  Mail,
  BookOpen,
  Calendar,
  Settings,
  Lock,
  Phone,
  LogOut
} from 'lucide-react';

interface FacultyProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    role?: 'student' | 'faculty' | 'admin';
    enrolledCourses?: string[];
    facultyDetails?: FacultyDetails | null;
  };
  onLogout: () => void;
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

export function FacultyProfile({ user, onLogout }: FacultyProfileProps) {
  const [profileUser, setProfileUser] = useState(user);
  const [activeSection, setActiveSection] = useState<'overview' | 'settings'>('overview');

  const normalizeDetails = (details?: FacultyDetails | null): FacultyDetails => {
    if (!details) {
      return {
        phone: '+91 99999 11111',
        subjectSpecialty: 'General',
        joinDate: '2024-06-01'
      };
    }

    return {
      phone: details.phone || '',
      subjectSpecialty: details.subjectSpecialty || '',
      joinDate: normalizeDateForInput(details.joinDate)
    };
  };
  
  const [facultyDetails, setFacultyDetails] = useState<FacultyDetails>(() => {
    return normalizeDetails(user.facultyDetails);
  });

  useEffect(() => {
    setProfileUser(user);
    const normalized = normalizeDetails(user.facultyDetails);
    setFacultyDetails(normalized);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const refreshProfile = async () => {
      try {
        const response = await me();
        if (!mounted) return;

        const latestUser = response.user as any;
        setProfileUser(latestUser);
        const normalized = normalizeDetails(latestUser.facultyDetails);
        setFacultyDetails(normalized);
      } catch {
        // Keep existing profile state if refresh fails.
      }
    };

    refreshProfile();

    return () => {
      mounted = false;
    };
  }, []);

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
                    <BookOpen className="w-4 h-4" />
                    <span>Specialty: {facultyDetails.subjectSpecialty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined: {formatDateForDisplay(facultyDetails.joinDate)}</span>
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
          details={facultyDetails}
        />
      )}

      {activeSection === 'settings' && (
        <SettingsSection onLogout={onLogout} />
      )}
    </div>
  );
}

function OverviewSection({ 
  details
}: { 
  details: FacultyDetails;
}) {
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Faculty Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Phone', value: details.phone, icon: Phone, key: 'phone' },
            { label: 'Subject Specialty', value: details.subjectSpecialty, icon: BookOpen, key: 'subjectSpecialty' },
            { label: 'Join Date', value: details.joinDate, icon: Calendar, key: 'joinDate', type: 'date' }
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
              <p className="text-gray-900 font-medium px-4 py-2 bg-gray-50 rounded-lg group-hover:bg-teal-50 transition">
                {field.type === 'date' ? formatDateForDisplay(field.value) : field.value}
              </p>
            </motion.div>
          ))}
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
  useBodyScrollLock(showLogoutConfirm || showChangePassword);

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
          <Lock className="w-6 h-6 text-teal-600" />
          Security
        </h3>
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowChangePassword(true)}
            className="w-full p-4 bg-gradient-to-r from-gray-50 to-teal-50 rounded-xl text-left hover:shadow-md transition flex items-center justify-between group"
          >
            <div>
              <h4 className="font-semibold text-gray-900">Change Password</h4>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <div className="w-8 h-8 bg-teal-100 group-hover:bg-teal-200 rounded-lg flex items-center justify-center transition">
              <Lock className="w-4 h-4 text-teal-600" />
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
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-8"
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
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-8"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-teal-600" />
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
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
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
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
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
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
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

