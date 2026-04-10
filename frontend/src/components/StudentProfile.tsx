import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { changeMyPassword, me, verifyMyPassword, updateMyProfile } from '../api/auth';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useIsMobileViewport } from '../hooks/useViewport';
import {
  formatDateForDisplay,
  getAttendanceRatingValue,
  normalizeDateForInput,
} from '../utils/profile';
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
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../theme';

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
  email: string;
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

export function StudentProfile({ user, onLogout, initialSection = 'overview' }: StudentProfileProps) {
  const [profileUser, setProfileUser] = useState(user);
  const [activeSection, setActiveSection] = useState<'overview' | 'performance' | 'settings'>(initialSection);
  const isMobileViewport = useIsMobileViewport();
  const { isDark } = useTheme();

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const normalizeDetails = (details?: StudentDetails | null): StudentDetails => {
    if (!details) {
      return {
        rollNumber: '',
        batch: '',
        joinDate: '',
        email: '',
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
      email: (details as any).email || '',
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

  const handleAvatarUpdate = (newAvatarUrl: string | null) => {
    setProfileUser(prev => ({ ...prev, avatarUrl: newAvatarUrl || undefined }));
  };

  const overallPerformance = calculateOverallPerformance();

  return (
    <div className={`space-y-6`}>
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`dark-mask-hero rounded-3xl ${isMobileViewport ? 'p-5' : 'p-8'} text-white shadow-2xl relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950'
            : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500'
        }`}
      >
        {/* Decorative elements */}
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 ${isDark ? 'bg-cyan-300/10' : 'bg-white/10'}`} />
        <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full -ml-24 -mb-24 ${isDark ? 'bg-blue-200/10' : 'bg-white/10'}`} />
        
        <div className={`relative flex ${isMobileViewport ? 'flex-row items-center gap-4' : 'flex-col md:flex-row items-start md:items-center gap-6'}`}>
          <EditableAvatar 
            user={profileUser as any} 
            onAvatarUpdate={handleAvatarUpdate} 
            size={isMobileViewport ? 'sm' : 'md'}
          />
          
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className={`${isMobileViewport ? 'text-2xl' : 'text-3xl'} font-bold mb-2`}>{profileUser.name}</h2>
                <div className={`flex flex-wrap ${isMobileViewport ? 'gap-2 text-xs' : 'gap-4 text-base'} ${isDark ? 'text-slate-300' : 'text-indigo-100'}`}>
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
              <div className="shrink-0">
                <ThemeToggle compact={isMobileViewport} />
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
            className={`flex items-center font-medium transition-all rounded-lg whitespace-nowrap ${
              isMobileViewport ? 'gap-2 px-3 py-2 text-xs' : 'gap-2 px-4 py-2 text-base'
            } ${
              activeSection === tab.id
                ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white shadow-lg'
                : isDark
                  ? 'text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700'
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
          details={studentDetails}
          profileName={profileUser.name}
          profileEmail={profileUser.email || ''}
          onProfileSaved={(next) => {
            setProfileUser((prev: any) => ({ ...prev, email: next.email }));
            setStudentDetails((prev) => ({
              ...prev,
              phone: next.phone,
              email: next.email,
              address: next.address,
              dateOfBirth: next.dateOfBirth,
            }));
          }}
          isMobileViewport={isMobileViewport}
        />
      )}

      {activeSection === 'performance' && (
        <PerformanceSection details={studentDetails} user={profileUser} isMobileViewport={isMobileViewport} />
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
  profileName,
  profileEmail,
  onProfileSaved,
  isMobileViewport
}: { 
  details: StudentDetails; 
  profileName: string;
  profileEmail: string;
  onProfileSaved?: (next: { phone: string; email: string; address: string; dateOfBirth: string }) => void;
  isMobileViewport: boolean;
}) {
  const { isDark } = useTheme();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    phone: details.phone || '',
    email: profileEmail || details.email || '',
    address: details.address || '',
    dateOfBirth: normalizeDateForInput(details.dateOfBirth || ''),
  });

  useEffect(() => {
    setProfileDraft({
      phone: details.phone || '',
      email: profileEmail || details.email || '',
      address: details.address || '',
      dateOfBirth: normalizeDateForInput(details.dateOfBirth || ''),
    });
  }, [details.phone, details.email, details.address, details.dateOfBirth, profileEmail]);

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      await updateMyProfile({
        name: profileName,
        phone: profileDraft.phone,
        email: profileDraft.email,
        address: profileDraft.address,
        dateOfBirth: profileDraft.dateOfBirth || null,
        parentContact: details.parentContact || '',
      });
      onProfileSaved?.({
        phone: profileDraft.phone,
        email: profileDraft.email,
        address: profileDraft.address,
        dateOfBirth: profileDraft.dateOfBirth,
      });
      setIsEditingProfile(false);
      window.alert('Profile updated successfully.');
    } catch (error: any) {
      window.alert(error?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileDraft({
      phone: details.phone || '',
      email: profileEmail || details.email || '',
      address: details.address || '',
      dateOfBirth: normalizeDateForInput(details.dateOfBirth || ''),
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-6">

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-2xl p-4 shadow-lg backdrop-blur-lg sm:p-6 ${
          isDark ? 'border border-slate-800 bg-slate-950/70' : 'border border-white bg-white/80'
        }`}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h3 className={`text-lg font-semibold sm:text-xl ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Personal Information</h3>
          {!isEditingProfile ? (
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isDark
                  ? 'bg-blue-900/40 text-blue-200 hover:bg-blue-900/60 border border-blue-700/50'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  isDark
                    ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={isSavingProfile}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-70"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
          {[
            { label: 'Phone', value: details.phone, icon: Phone, key: 'phone' },
            { label: 'Email', value: profileEmail || details.email, icon: Mail, key: 'email' },
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
              <label className={`mb-1.5 flex items-center gap-2 text-xs font-medium sm:mb-2 sm:text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                <field.icon className={isMobileViewport ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'} />
                {field.label}
              </label>
              
              {isEditingProfile && (field.key === 'phone' || field.key === 'email' || field.key === 'address' || field.key === 'dateOfBirth') ? (
                field.key === 'address' ? (
                  <textarea
                    rows={3}
                    value={profileDraft.address}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, address: event.target.value }))}
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-200 sm:px-4 sm:text-base ${
                      isDark
                        ? 'border-slate-600 bg-slate-900 text-slate-100'
                        : 'border-gray-200 text-gray-900'
                    }`}
                  />
                ) : (
                  <input
                    type={field.key === 'dateOfBirth' ? 'date' : field.key === 'email' ? 'email' : 'tel'}
                    value={field.key === 'phone' ? profileDraft.phone : field.key === 'email' ? profileDraft.email : profileDraft.dateOfBirth}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (field.key === 'phone') {
                        setProfileDraft((prev) => ({ ...prev, phone: nextValue }));
                        return;
                      }
                      if (field.key === 'email') {
                        setProfileDraft((prev) => ({ ...prev, email: nextValue }));
                        return;
                      }
                      setProfileDraft((prev) => ({ ...prev, dateOfBirth: nextValue }));
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-200 sm:px-4 sm:text-base ${
                      isDark
                        ? 'border-slate-600 bg-slate-900 text-slate-100'
                        : 'border-gray-200 text-gray-900'
                    }`}
                  />
                )
              ) : (
                <p className={`rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 sm:text-base ${
                isDark
                  ? 'bg-slate-900 text-slate-100 group-hover:bg-slate-800'
                  : 'bg-gray-50 text-gray-900 group-hover:bg-indigo-50'
              }`}>
                {field.type === 'date' ? formatDateForDisplay(field.value) : field.value}
              </p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function PerformanceSection({ details, user, isMobileViewport }: { details: StudentDetails; user: any; isMobileViewport: boolean }) {
  const { isDark } = useTheme();
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
    <div className={isMobileViewport ? 'space-y-4' : 'space-y-6'}>
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
              className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
                isDark ? 'bg-slate-950' : 'bg-white'
              }`}
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
                  const detailed = getDetailedRatings(selectedSubject) || { attendance: 0, tests: 0, dppPerformance: 0, behavior: 0 };
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
                          <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{item.label}</span>
                          <div className="scale-110">
                            {renderPerformanceStars(item.val)}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                  <div className={`rounded-2xl p-4 flex items-center justify-between ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Subject Average</p>
                      <p className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                        {(() => {
                          const detailed = getDetailedRatings(selectedSubject) || { attendance: 0, tests: 0, dppPerformance: 0, behavior: 0 };
                          return ((detailed.attendance + detailed.tests + detailed.dppPerformance + detailed.behavior) / 4).toFixed(1);
                        })()}
                        <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>/5.0</span>
                      </p>
                    </div>
                    {(() => {
                      const detailed = getDetailedRatings(selectedSubject) || { attendance: 0, tests: 0, dppPerformance: 0, behavior: 0 };
                      return renderPerformanceStars((detailed.attendance + detailed.tests + detailed.dppPerformance + detailed.behavior) / 4);
                    })()}
                  </div>
                </div>
              </div>

              <div className={`px-8 py-4 border-t flex justify-end ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-100'}`}>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className={`px-6 py-2 rounded-xl font-bold transition shadow-sm ${
                    isDark
                      ? 'bg-slate-950 border border-slate-700 text-slate-200 hover:bg-slate-800'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
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
        className={`dark-mask-soft rounded-3xl ${isMobileViewport ? 'p-6' : 'p-8'} shadow-xl border relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 border-slate-700'
            : 'bg-gradient-to-br from-yellow-50 to-orange-50 text-gray-900 border-white'
        }`}
      >
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full -mr-24 -mt-24 ${isDark ? 'bg-white/5' : 'bg-white/40'}`} />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`${isMobileViewport ? 'text-xl font-semibold' : 'text-2xl font-bold'} mb-1`}>Overall Rating</h3>
              <p className={`${isMobileViewport ? 'font-normal text-sm' : 'font-medium'} ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Based on all academic factors</p>
            </div>
            <div className={`${isMobileViewport ? 'w-12 h-12 rounded-lg' : 'w-14 h-14 rounded-2xl'} bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg`}>
              <Star className={isMobileViewport ? 'w-6 h-6 text-white' : 'w-7 h-7 text-white'} />
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className="scale-150 origin-left">
              {renderPerformanceStars(overallPerformance)}
            </div>
            <p className={`text-xl font-black mb-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>/</p>
            <p className={`text-3xl font-black mb-0.5 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>5.0</p>
          </div>
        </div>
      </motion.div>

      {/* Performance Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`backdrop-blur-lg rounded-2xl ${isMobileViewport ? 'p-4' : 'p-6'} shadow-lg border ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white/80 border-white'
        }`}
      >
        <h3 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
          <BarChart3 className={isMobileViewport ? 'w-5 h-5 text-indigo-600' : 'w-6 h-6 text-indigo-600'} />
          Subject-wise Performance
        </h3>
        <p className={`text-sm mb-6 -mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          {hasSubjects ? 'Click on a subject to see detailed breakdown' : 'No subject ratings available yet.'}
        </p>
        {hasSubjects ? (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isMobileViewport ? 'gap-4' : 'gap-6'}`}>
          {performanceData.map((item: any, index: number) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              onClick={() => setSelectedSubject(item.label)}
              className={`${isMobileViewport ? 'p-4' : 'p-6'} rounded-2xl shadow-md flex flex-col items-center text-center hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group border ${
                isDark ? 'bg-slate-900 border-slate-700' : `bg-gradient-to-br ${item.bgColor} border-white`
              }`}
            >
              <h4 className={`${isMobileViewport ? 'text-sm mb-2' : 'mb-3'} font-bold transition-colors ${
                isDark ? 'text-slate-100 group-hover:text-cyan-300' : 'text-gray-900 group-hover:text-teal-700'
              }`}>{item.label}</h4>
              <div className={`${isMobileViewport ? 'scale-110 mb-1' : 'scale-125 mb-2'} origin-center`}>
                {renderPerformanceStars(item.value)}
              </div>
              <p className={`${isMobileViewport ? 'text-[10px] mt-1' : 'text-xs mt-2'} font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{item.value.toFixed(1)} / 5.0</p>
              <div className={`${isMobileViewport ? 'mt-2 text-[9px]' : 'mt-4 text-[10px]'} font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-cyan-300' : 'text-indigo-600'}`}>
                View Detailed Breakdown {'>'}
              </div>
            </motion.button>
          ))}
        </div>
        ) : (
          <div className={`rounded-2xl border border-dashed px-6 py-10 text-center shadow-sm ${
            isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'
          }`}>
            <BarChart3 className={`mx-auto mb-3 h-10 w-10 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>No subject ratings to show</p>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Ratings will appear once faculty updates them.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function SettingsSection({ onLogout }: { onLogout: () => void }) {
  const { isDark } = useTheme();
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
          className={`w-full p-4 md:p-3 border-2 rounded-xl text-left transition ${
            isDark
              ? 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-700 hover:border-orange-500'
              : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:border-orange-400'
          }`}
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
              onClick={() => setShowLogoutConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={`rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-8 ${
                  isDark ? 'theme-surface border border-slate-700' : 'bg-white'
                }`}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogOut className="w-8 h-8 text-orange-600" />
                  </div>
                    <h3 className="text-2xl font-bold mb-2 theme-text-primary">Confirm Logout</h3>
                    <p className="theme-text-secondary">Are you sure you want to sign out of your account?</p>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-6 py-3 theme-surface-muted theme-text-secondary rounded-xl font-semibold transition"
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
                className={`rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-8 ${
                  isDark ? 'theme-surface border border-slate-700' : 'bg-white'
                }`}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-indigo-600" />
                  </div>
                    <h3 className="text-2xl font-bold mb-2 theme-text-primary">Change Password</h3>
                    <p className="theme-text-secondary">
                    {isPasswordVerified
                      ? 'Choose a new password and confirm it.'
                      : 'Enter your current password to continue.'}
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {!isPasswordVerified && (
                    <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Old Password
                      <input
                        type="password"
                        required
                        value={passwordForm.oldPassword}
                        onChange={handlePasswordChange('oldPassword')}
                        className={`mt-2 w-full rounded-xl border px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                          isDark ? 'border-slate-600 bg-slate-900 text-slate-100' : 'border-gray-200'
                        }`}
                        placeholder="Enter old password"
                      />
                    </label>
                  )}

                  {isPasswordVerified && (
                    <>
                      <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        New Password
                        <input
                          type="password"
                          required
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange('newPassword')}
                          className={`mt-2 w-full rounded-xl border px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                            isDark ? 'border-slate-600 bg-slate-900 text-slate-100' : 'border-gray-200'
                          }`}
                          placeholder="Enter new password"
                        />
                      </label>

                      <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        Confirm Password
                        <input
                          type="password"
                          required
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange('confirmPassword')}
                          className={`mt-2 w-full rounded-xl border px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                            isDark ? 'border-slate-600 bg-slate-900 text-slate-100' : 'border-gray-200'
                          }`}
                          placeholder="Re-enter new password"
                        />
                      </label>
                    </>
                  )}

                  <div className="pt-2 flex gap-3">
                    <motion.button
                      type="button"
                      onClick={closeChangePassword}
                      className="flex-1 px-6 py-3 theme-surface-muted theme-text-secondary rounded-xl font-semibold transition"
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

