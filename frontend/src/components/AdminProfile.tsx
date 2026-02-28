import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { me } from '../api/auth';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { Mail, Lock, LogOut } from 'lucide-react';

interface AdminProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    role?: 'student' | 'faculty' | 'admin';
    enrolledCourses?: string[];
    studentDetails?: StudentDetails | null;
  };
  onLogout: () => void;
}

interface StudentDetails {
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

export function AdminProfile({ user, onLogout }: AdminProfileProps) {
  const [profileUser, setProfileUser] = useState(user);

  useEffect(() => {
    setProfileUser(user);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const refreshProfile = async () => {
      try {
        const response = await me();
        if (!mounted) return;

        const latestUser = response.user as any;
        setProfileUser(latestUser);
      } catch {
        // Keep existing profile state if refresh fails.
      }
    };

    refreshProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const displayName =
    profileUser.role === 'admin' && profileUser.name.trim().toLowerCase() === 'admin user'
      ? 'Administrator'
      : profileUser.name;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30"
          >
            {displayName.charAt(0).toUpperCase()}
          </motion.div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">{displayName}</h2>
                <div className="flex flex-wrap gap-4 text-indigo-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{profileUser.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <SettingsSection onLogout={onLogout} />
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <motion.button
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowChangePassword(true)}
          className="w-full p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl text-left hover:shadow-md transition flex items-center justify-between group border border-gray-200"
        >
          <div>
            <h4 className="font-semibold text-gray-900">Change Password</h4>
            <p className="text-sm text-gray-600">Update your account password</p>
          </div>
          <div className="w-8 h-8 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition">
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl text-left hover:border-orange-400 transition"
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
