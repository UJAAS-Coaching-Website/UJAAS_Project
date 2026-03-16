import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { changeMyPassword, me, verifyMyPassword } from '../api/auth';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
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
  LogOut,
  X,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Camera
} from 'lucide-react';
import { EditableAvatar } from './EditableAvatar';

interface StudentProfileProps {
  user: {
    id: string;
    name: string;
    email?: string | null;
    role?: 'student' | 'faculty' | 'admin';
    enrolledCourses?: string[];
    studentDetails?: StudentDetails | null;
    subjectRatings?: Record<string, {
      attendance: number;
      total_classes?: number;
      attendanceRating?: number;
      tests: number;
      dppPerformance: number;
      behavior: number;
    }>;
    subjectRemarks?: Record<string, string>;
  };
  onLogout: () => void;
  initialSection?: 'overview' | 'performance' | 'settings';
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

function getAttendanceRatingValue(attendance?: number, totalClasses?: number, attendanceRating?: number): number {
  if (typeof attendanceRating === 'number' && Number.isFinite(attendanceRating)) {
    return Math.max(0, Math.min(5, attendanceRating));
  }

  const attendanceCount = Number(attendance ?? 0);
  const classCount = Number(totalClasses ?? 0);
  if (classCount > 0) {
    return Math.max(0, Math.min(5, (attendanceCount / classCount) * 5));
  }

  return Math.max(0, Math.min(5, attendanceCount));
}

export function StudentProfile({ user, onLogout, initialSection = 'overview' }: StudentProfileProps) {
  const [profileUser, setProfileUser] = useState(user);
  const [activeSection, setActiveSection] = useState<'overview' | 'performance' | 'settings'>(initialSection);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const normalizeDetails = (details?: StudentDetails | null): StudentDetails => {
    if (!details) {
      return {
        rollNumber: '',
        batch: '',
        joinDate: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        parentContact: '',
        ratings: {
          attendance: 0,
          assignments: 0,
          tests: 0,
          participation: 0,
          behavior: 0,
          engagement: 0,
          dppPerformance: 0
        }
      };
    }

    return {
      rollNumber: details.rollNumber || '',
      batch: details.batch || '',
      joinDate: normalizeDateForInput(details.joinDate),
      phone: details.phone || '',
      address: details.address || '',
      dateOfBirth: normalizeDateForInput(details.dateOfBirth),
      parentContact: details.parentContact || '',
      ratings: {
        attendance: details.ratings?.attendance ?? 0,
        assignments: details.ratings?.assignments ?? 0,
        tests: details.ratings?.tests ?? 0,
        participation: details.ratings?.participation ?? 0,
        behavior: details.ratings?.behavior ?? 0,
        engagement: details.ratings?.engagement ?? 0,
        dppPerformance: details.ratings?.dppPerformance ?? 0
      }
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
    const { attendance, tests, behavior } = studentDetails.ratings;
    const dppPerformance = (studentDetails.ratings as any).dppPerformance || 0;

    const ratingsList = [attendance, tests, behavior, dppPerformance];
    const total = ratingsList.reduce((sum, value) => sum + Number(value || 0), 0);
    return Number((total / ratingsList.length).toFixed(1));
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setProfileUser(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
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
          <EditableAvatar 
            user={profileUser as any} 
            onAvatarUpdate={handleAvatarUpdate} 
          />
          
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">{profileUser.name}</h2>
                <div className="flex flex-wrap gap-4 text-indigo-100">
                  {profileUser.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{profileUser.email}</span>
                    </div>
                  )}
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
        <PerformanceSection details={studentDetails} user={profileUser} />
      )}

      {activeSection === 'settings' && (
        <SettingsSection onLogout={onLogout} />
      )}
    </div>
  );
}

function renderPerformanceStars(rating: number) {
  const normalizedRating = Math.max(0, Math.min(5, rating));

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        let fillPercentage = 0;
        if (normalizedRating >= star) {
          fillPercentage = 100;
        } else if (normalizedRating > star - 1) {
          fillPercentage = (normalizedRating - (star - 1)) * 100;
        }

        return (
          <div 
            key={star} 
            className="relative inline-block select-none"
            style={{ width: '16px', height: '16px', fontSize: '16px', lineHeight: '16px' }}
          >
            {/* Background star (Gray) */}
            <span style={{ color: '#d1d5db', position: 'absolute', left: 0, top: 0 }}>★</span>
            {/* Fill star (Gold) */}
            <div 
              style={{ 
                width: `${fillPercentage}%`, 
                overflow: 'hidden', 
                position: 'absolute', 
                left: 0, 
                top: 0, 
                whiteSpace: 'nowrap',
                color: '#f59e0b',
                transition: 'width 0.3s ease'
              }}
            >
              <span>★</span>
            </div>
          </div>
        );
      })}
      <span className="text-sm font-bold text-gray-700 ml-1">{rating.toFixed(1)}</span>
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
          className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-white"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mb-2">{renderPerformanceStars(overallPerformance)}</div>
          <p className="text-sm text-gray-600">Overall Rating</p>
        </motion.div>
      </div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-white bg-white/80 p-4 shadow-lg backdrop-blur-lg sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">Personal Information</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
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
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-gray-600 sm:mb-2 sm:text-sm">
                <field.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {field.label}
              </label>
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 transition group-hover:bg-indigo-50 sm:px-4 sm:text-base">
                {field.type === 'date' ? formatDateForDisplay(field.value) : field.value}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function PerformanceSection({ details, user }: { details: StudentDetails; user: any }) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const ratings = details.ratings || {};
  const subjectRatings = (user as any).subjectRatings || {};
  
  useBodyScrollLock(!!selectedSubject);
  
  // Define colors for subjects
  const subjectColors: Record<string, { color: string; bgColor: string }> = {
    'Physics': { color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-50 to-cyan-50' },
    'Chemistry': { color: 'from-green-500 to-emerald-500', bgColor: 'from-green-50 to-emerald-50' },
    'Mathematics': { color: 'from-purple-500 to-pink-500', bgColor: 'from-purple-50 to-pink-50' },
    'Biology': { color: 'from-pink-500 to-rose-500', bgColor: 'from-pink-50 to-rose-50' },
    'General': { color: 'from-indigo-500 to-purple-500', bgColor: 'from-indigo-50 to-purple-50' }
  };

  // Show only subjects assigned to this student
  const subjects = Object.keys(subjectRatings);
  const hasSubjects = subjects.length > 0;

  // Helper to get detailed ratings for a subject from backend data
  const getDetailedRatings = (subject: string) => {
    const sr = subjectRatings?.[subject];
    if (!sr) return null;

    return {
      attendance: getAttendanceRatingValue(sr.attendance, sr.total_classes, sr.attendanceRating),
      tests: Number(sr.tests || 0),
      dppPerformance: Number(sr.dppPerformance || 0),
      behavior: Number(sr.behavior || 0),
    };
  };

  const performanceData = subjects.map((subject: string) => {
    const detailed = getDetailedRatings(subject);
    const avg = detailed
      ? (detailed.attendance + detailed.tests + detailed.dppPerformance + detailed.behavior) / 4
      : 0;
    const style = subjectColors[subject];
    
    return {
      label: subject,
      value: avg,
      max: 5,
      color: style?.color || subjectColors['General'].color,
      bgColor: style?.bgColor || subjectColors['General'].bgColor,
      detailed
    };
  });

  // Calculate overall performance for the card
  const overallPerformance = performanceData.length > 0
    ? performanceData.reduce((acc: number, curr: any) => acc + curr.value, 0) / performanceData.length
    : 0;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {selectedSubject && (
          <div className="fixed inset-0 z-layer-modal flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedSubject(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className={`shrink-0 px-6 py-4 border-b border-gray-100 bg-gradient-to-r ${subjectColors[selectedSubject]?.color || subjectColors['General'].color} text-white flex justify-between items-center`}>
                <div>
                  <h3 className="text-xl font-bold">{selectedSubject} Breakdown</h3>
                  <p className="text-white/80 text-sm">Detailed academic performance</p>
                </div>
                <button onClick={() => setSelectedSubject(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
                {(() => {
                  const detailed = getDetailedRatings(selectedSubject);
                  const items = [
                    { label: 'Attendance', val: detailed.attendance },
                    { label: 'Test Performance', val: detailed.tests },
                    { label: 'DPP Performance', val: detailed.dppPerformance },
                    { label: 'Class Behaviour', val: detailed.behavior }
                  ];

                  return (
                    <div className="grid grid-cols-1 gap-6">
                      {items.map((item) => (
                        <div key={item.label} className="flex flex-col items-center gap-2">
                          <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">{item.label}</span>
                          <div className="scale-110">
                            {renderPerformanceStars(item.val)}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="pt-4 border-t border-gray-100">
                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subject Average</p>
                      <p className="text-2xl font-black text-gray-900">
                        {((getDetailedRatings(selectedSubject).attendance + 
                           getDetailedRatings(selectedSubject).tests + 
                           getDetailedRatings(selectedSubject).dppPerformance + 
                           getDetailedRatings(selectedSubject).behavior) / 4).toFixed(1)}
                        <span className="text-sm text-gray-400">/5.0</span>
                      </p>
                    </div>
                    {renderPerformanceStars(((getDetailedRatings(selectedSubject).attendance + 
                           getDetailedRatings(selectedSubject).tests + 
                           getDetailedRatings(selectedSubject).dppPerformance + 
                           getDetailedRatings(selectedSubject).behavior) / 4))}
                  </div>
                </div>
              </div>

              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Overall Performance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 text-gray-900 shadow-xl border border-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/40 rounded-full -mr-24 -mt-24" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold mb-1">Overall Rating</h3>
              <p className="text-gray-500 font-medium">Based on all academic factors</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Star className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className="scale-150 origin-left">
              {renderPerformanceStars(overallPerformance)}
            </div>
            <p className="text-xl font-black text-gray-400 mb-0.5">/</p>
            <p className="text-3xl font-black text-gray-900 mb-0.5">5.0</p>
          </div>
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
          Subject-wise Performance
        </h3>
        <p className="text-sm text-gray-500 mb-6 -mt-4">
          {hasSubjects ? 'Click on a subject to see detailed breakdown' : 'No subject ratings available yet.'}
        </p>
        {hasSubjects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {performanceData.map((item: any, index: number) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              onClick={() => setSelectedSubject(item.label)}
              className={`p-6 bg-gradient-to-br ${item.bgColor} rounded-2xl border border-white shadow-md flex flex-col items-center text-center hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group`}
            >
              <h4 className="font-bold text-gray-900 mb-3 group-hover:text-teal-700 transition-colors">{item.label}</h4>
              <div className="scale-125 mb-2 origin-center">
                {renderPerformanceStars(item.value)}
              </div>
              <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">{item.value.toFixed(1)} / 5.0</p>
              <div className="mt-4 text-[10px] font-bold text-indigo-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                View Detailed Breakdown {'>'}
              </div>
            </motion.button>
          ))}
        </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center shadow-sm">
            <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-semibold text-gray-700">No subject ratings to show</p>
            <p className="mt-2 text-sm text-gray-500">Ratings will appear once faculty updates them.</p>
          </div>
        )}
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
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'idle' | 'verifying' | 'updating'>('idle');
  useBodyScrollLock(showLogoutConfirm || showChangePassword);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
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
        className="space-y-3"
      >
        <motion.button
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

      {showLogoutConfirm &&
        modalRoot &&
        createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-layer-modal p-4"
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
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleLogout}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
                  >
                    Logout
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>,
            modalRoot
          )}

      {/* Change Password Modal */}
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

