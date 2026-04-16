import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { changeMyPassword, me, verifyMyPassword } from '../api/auth';
import { motion } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { Mail, Lock, LogOut, Camera } from 'lucide-react';
import { EditableAvatar } from './EditableAvatar';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../theme';

interface AdminProfileProps {
  user: {
    id: string;
    name: string;
    email?: string | null;
    loginId?: string | null;
    role?: 'student' | 'faculty' | 'admin';
    enrolledCourses?: string[];
    studentDetails?: any;
  };
  onLogout: () => void;
}
export function AdminProfile({ user, onLogout }: AdminProfileProps) {
  const [profileUser, setProfileUser] = useState(user);
  const { isDark } = useTheme();

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

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setProfileUser(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
  };

  const displayName =
    profileUser.role === 'admin' && profileUser.name.trim().toLowerCase() === 'admin user'
      ? 'Administrator'
      : profileUser.name;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`dark-mask-hero rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950'
            : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500'
        }`}
      >
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 ${isDark ? 'bg-cyan-300/10' : 'bg-white/10'}`} />
        <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full -ml-24 -mb-24 ${isDark ? 'bg-blue-200/10' : 'bg-white/10'}`} />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <EditableAvatar 
            user={profileUser as any} 
            onAvatarUpdate={handleAvatarUpdate} 
          />

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">{displayName}</h2>
                <div className={`flex flex-wrap gap-4 ${isDark ? 'text-slate-300' : 'text-indigo-100'}`}>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{profileUser.loginId || profileUser.email}</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {/* Toggle visibility control for main branch: change false to true to show this button again. */}
                {false && <ThemeToggle />}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <SettingsSection onLogout={onLogout} />
    </div>
  );
}

function SettingsSection({ onLogout }: { onLogout: () => void | Promise<void> }) {
  const { isDark } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'idle' | 'verifying' | 'updating'>('idle');
  useBodyScrollLock(showLogoutConfirm || showChangePassword);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await Promise.resolve(onLogout());
    } finally {
      if (isMountedRef.current) {
        setIsLoggingOut(false);
        setShowLogoutConfirm(false);
      }
    }
  };

  const closeChangePassword = () => {
    setShowChangePassword(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setIsPasswordVerified(false);
    setPasswordAction('idle');
  };

  const handlePasswordChange = (field: keyof typeof passwordForm) => (event: ChangeEvent<HTMLInputElement>) => {
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordForm;
    if (!isPasswordVerified) {
      if (!oldPassword) {
        window.alert('Please enter your current password.');
        return;
      }
      try {
        setPasswordAction('verifying');
        await verifyMyPassword(oldPassword);
        setIsPasswordVerified(true);
        setPasswordAction('idle');
      } catch (error: any) {
        setPasswordAction('idle');
        window.alert(error?.message || 'Current password is incorrect.');
      }
      return;
    }

    if (!newPassword || !confirmPassword) {
      window.alert('Please enter and confirm the new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      window.alert('New password and confirmation do not match.');
      return;
    }
    try {
      setPasswordAction('updating');
      await changeMyPassword(oldPassword, newPassword, confirmPassword);
      window.alert('Password updated successfully.');
      closeChangePassword();
      window.location.reload();
    } catch (error: any) {
      setPasswordAction('idle');
      window.alert(error?.message || 'Failed to update password.');
    }
  };
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-3"
      >
        <motion.button
          onClick={() => setShowChangePassword(true)}
          className={`w-full p-4 md:p-3 rounded-xl text-left hover:shadow-md transition flex items-center justify-between group border ${
            isDark
              ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700'
              : 'bg-gradient-to-r from-gray-50 to-indigo-50 border-gray-200'
          }`}
        >
          <div>
            <h4 className={`font-semibold md:text-sm ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Change Password</h4>
            <p className={`text-sm md:text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Update your account password</p>
          </div>
          <div className={`w-8 h-8 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition ${
            isDark ? 'bg-indigo-500/20 group-hover:bg-indigo-500/30' : 'bg-indigo-100 group-hover:bg-indigo-200'
          }`}>
            <Lock className="w-4 h-4 md:w-3.5 md:h-3.5 text-indigo-600" />
          </div>
        </motion.button>

        <motion.button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full p-4 md:p-3 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl text-left hover:border-orange-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-8 md:h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <LogOut className="w-5 h-5 md:w-4 md:h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-orange-700 md:text-sm">Logout</h4>
              <p className="text-sm text-orange-600 md:text-xs">Sign out of your account</p>
            </div>
          </div>
        </motion.button>
      </motion.div>

      {showLogoutConfirm &&
        modalRoot &&
        createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-layer-modal p-4"
              onClick={() => {
                if (!isLoggingOut) setShowLogoutConfirm(false);
              }}
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
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={isLoggingOut}
                    className={`flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold transition ${
                      isLoggingOut ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-lg transition ${
                      isLoggingOut ? 'opacity-90 cursor-wait' : 'hover:shadow-xl'
                    }`}
                  >
                    {isLoggingOut ? 'Please wait..' : 'Logout'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>,
            modalRoot
          )}

      {showChangePassword &&
        modalRoot &&
        createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-layer-modal p-4"
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
                  <p className="text-gray-600">
                    {isPasswordVerified
                      ? 'Choose a new password and confirm it.'
                      : 'Enter your current password to continue.'}
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {!isPasswordVerified && (
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
                  )}

                  {isPasswordVerified && (
                    <>
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
                    </>
                  )}

                  <div className="pt-2 flex gap-3">
                    <motion.button
                      type="button"
                      onClick={closeChangePassword}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={passwordAction !== 'idle'}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {passwordAction === 'verifying'
                        ? 'Verifying...'
                        : passwordAction === 'updating'
                          ? 'Updating...'
                          : isPasswordVerified
                            ? 'Update Password'
                            : 'Verify Password'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>,
            modalRoot
          )}
    </div>
  );
}
