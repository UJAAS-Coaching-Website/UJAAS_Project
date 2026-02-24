import { useEffect, useState } from 'react';
import { me, updateMyProfile } from '../api/auth';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  BookOpen,
  Calendar,
  Award,
  TrendingUp,
  Edit2,
  Save,
  X,
  Star,
  Target,
  Clock,
  CheckCircle,
  BarChart3,
  Settings,
  Bell,
  Lock,
  Phone,
  MapPin,
  LogOut
} from 'lucide-react';

interface StudentProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    role?: 'student' | 'admin';
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

export function StudentProfile({ user, onLogout }: StudentProfileProps) {
  const [profileUser, setProfileUser] = useState(user);
  const [editedName, setEditedName] = useState(user.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeSection, setActiveSection] = useState<'overview' | 'academics' | 'performance' | 'settings'>('overview');

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
          attendance: 0,
          assignments: 0,
          tests: 0,
          participation: 0,
          behavior: 0,
          engagement: 0
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
        engagement: details.ratings?.engagement ?? 0
      }
    };
  };
  
  // Use backend profile details when available; fallback to defaults.
  const [studentDetails, setStudentDetails] = useState<StudentDetails>(() => {
    return normalizeDetails(user.studentDetails);
  });

  const [editedDetails, setEditedDetails] = useState(studentDetails);

  useEffect(() => {
    setProfileUser(user);
    setEditedName(user.name || '');
    const normalized = normalizeDetails(user.studentDetails);
    setStudentDetails(normalized);
    setEditedDetails(normalized);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const refreshProfile = async () => {
      try {
        const response = await me();
        if (!mounted) return;

        const latestUser = response.user as any;
        setProfileUser(latestUser);
        setEditedName(latestUser.name || '');
        const normalized = normalizeDetails(latestUser.studentDetails);
        setStudentDetails(normalized);
        setEditedDetails(normalized);
      } catch {
        // Keep existing profile state if refresh fails.
      }
    };

    refreshProfile();

    return () => {
      mounted = false;
    };
  }, []);

  // Calculate overall performance based on ratings
  const calculateOverallPerformance = () => {
    if (!studentDetails.ratings) return 0;
    const { attendance, assignments, tests, participation, behavior, engagement } = studentDetails.ratings;
    
    // Weighted average: attendance(20%), assignments(20%), tests(30%), participation(10%), behavior(10%), engagement(10%)
    const score = (
      attendance * 0.20 +
      assignments * 0.20 +
      tests * 0.30 +
      (participation * 10) * 0.10 +
      (behavior * 10) * 0.10 +
      (engagement * 10) * 0.10
    );
    
    return Math.round(score);
  };

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);
    try {
      const response = await updateMyProfile({
        name: editedName,
        phone: editedDetails.phone,
        address: editedDetails.address,
        dateOfBirth: editedDetails.dateOfBirth || null,
        parentContact: editedDetails.parentContact,
      });
      const latestUser = response.user as any;
      setProfileUser(latestUser);
      setEditedName(latestUser.name || '');
      const normalized = normalizeDetails(latestUser.studentDetails);
      setStudentDetails(normalized);
      setEditedDetails(normalized);
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedName(profileUser.name || '');
    setEditedDetails(studentDetails);
    setIsEditing(false);
  };

  const overallPerformance = calculateOverallPerformance();

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30"
          >
            {profileUser.name.charAt(0).toUpperCase()}
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-3xl font-bold mb-2 bg-white/20 border border-white/40 rounded-lg px-3 py-1 text-white placeholder-indigo-100 focus:outline-none focus:ring-2 focus:ring-white/70"
                    placeholder="Enter username"
                  />
                ) : (
                  <h2 className="text-3xl font-bold mb-2">{profileUser.name}</h2>
                )}
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
              
              {!isEditing && activeSection === 'overview' && profileUser.role !== 'admin' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'academics', label: 'Academics', icon: BookOpen },
          { id: 'performance', label: 'Performance', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => {
              setActiveSection(tab.id as any);
              setIsEditing(false);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg whitespace-nowrap ${
              activeSection === tab.id
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg'
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
          details={isEditing ? editedDetails : studentDetails}
          isEditing={isEditing}
          onDetailsChange={setEditedDetails}
          onSave={handleSave}
          onCancel={handleCancel}
          overallPerformance={overallPerformance}
          isSaving={isSaving}
          saveError={saveError}
        />
      )}

      {activeSection === 'academics' && (
        <AcademicsSection user={profileUser} details={studentDetails} />
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

function OverviewSection({ 
  user, 
  details, 
  isEditing, 
  onDetailsChange, 
  onSave, 
  onCancel,
  overallPerformance,
  isSaving,
  saveError
}: { 
  user: any; 
  details: StudentDetails; 
  isEditing: boolean; 
  onDetailsChange: (details: StudentDetails) => void;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
  overallPerformance: number;
  isSaving: boolean;
  saveError: string;
}) {
  const stats = [
    {
      label: 'Overall Performance',
      value: `${overallPerformance}%`,
      icon: Star,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50'
    },
    {
      label: 'Enrolled Courses',
      value: user.enrolledCourses?.length || 0,
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    {
      label: 'Days Active',
      value: details.joinDate
        ? Math.floor((new Date().getTime() - new Date(`${details.joinDate}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      icon: Calendar,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 shadow-lg border border-white`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
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
          {isEditing && (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg transition shadow-md hover:shadow-lg"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg transition shadow-md hover:shadow-lg"
              >
                <X className="w-4 h-4" />
                Cancel
              </motion.button>
            </div>
          )}
        </div>

        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {saveError}
          </div>
        )}

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
              {isEditing && field.editable !== false ? (
                <input
                  type={field.type || 'text'}
                  value={field.value}
                  onChange={(e) => onDetailsChange({ ...details, [field.key]: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              ) : (
                <p className="text-gray-900 font-medium px-4 py-2 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition">
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

function AcademicsSection({ user, details }: { user: any; details: StudentDetails }) {
  return (
    <div className="space-y-6">
      {/* Enrolled Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          Enrolled Courses
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user.enrolledCourses?.map((course: string, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-5 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-white rounded-2xl shadow-md hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2 text-lg">{course}</h4>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Academic Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          Academic Timeline
        </h3>
        <div className="space-y-4">
          {[
            { event: 'Enrolled in UJAAS', date: details.joinDate, status: 'completed' },
            {
              event: 'Completed Orientation',
              date: details.joinDate
                ? new Date(new Date(`${details.joinDate}T00:00:00`).getTime() + 7 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0]
                : '',
              status: 'completed'
            },
            { event: 'Mid-term Exams', date: '2025-12-15', status: 'upcoming' },
            { event: 'Final Exams', date: '2026-05-20', status: 'upcoming' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl hover:shadow-md transition"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                item.status === 'completed' 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              } shadow-lg`}>
                {item.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Clock className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.event}</h4>
                <p className="text-sm text-gray-600">
                  {formatDateForDisplay(item.date)}
                </p>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                item.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {item.status}
              </span>
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
    engagement: 0
  };

  const performanceData = [
    { label: 'Attendance', value: ratings.attendance, max: 100, color: 'from-green-500 to-emerald-500', bgColor: 'from-green-50 to-emerald-50' },
    { label: 'Assignments', value: ratings.assignments, max: 100, color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-50 to-cyan-50' },
    { label: 'Test Performance', value: ratings.tests, max: 100, color: 'from-purple-500 to-pink-500', bgColor: 'from-purple-50 to-pink-50' },
    { label: 'Class Participation', value: ratings.participation, max: 10, color: 'from-yellow-500 to-orange-500', bgColor: 'from-yellow-50 to-orange-50' },
    { label: 'Behavior', value: ratings.behavior, max: 10, color: 'from-indigo-500 to-purple-500', bgColor: 'from-indigo-50 to-purple-50' },
    { label: 'Engagement', value: ratings.engagement, max: 10, color: 'from-pink-500 to-rose-500', bgColor: 'from-pink-50 to-rose-50' }
  ];

  return (
    <div className="space-y-6">
      {/* Overall Performance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Overall Performance</h3>
              <p className="text-white/80">Based on all evaluated criteria</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30"
            >
              <div className="text-center">
                <div className="text-4xl font-bold">{overallPerformance}</div>
                <div className="text-xs">/ 100</div>
              </div>
            </motion.div>
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
              <div className="mt-2 text-right">
                <span className="text-sm text-gray-600">
                  {Math.round((item.value / item.max) * 100)}%
                </span>
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
          {overallPerformance >= 90 && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
              <p className="text-green-800 font-medium">🎉 Excellent Performance! Keep up the great work!</p>
            </div>
          )}
          {overallPerformance >= 70 && overallPerformance < 90 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg">
              <p className="text-blue-800 font-medium">👍 Good Performance! You're doing well!</p>
            </div>
          )}
          {overallPerformance >= 50 && overallPerformance < 70 && (
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg">
              <p className="text-yellow-800 font-medium">📈 Keep Improving! There's room for growth!</p>
            </div>
          )}
          {overallPerformance < 50 && overallPerformance > 0 && (
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Bell className="w-6 h-6 text-indigo-600" />
          Notification Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl">
            <div>
              <h4 className="font-semibold text-gray-900">Push Notifications</h4>
              <p className="text-sm text-gray-600">Receive notifications about updates and announcements</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-14 h-8 rounded-full transition-colors ${
                notificationsEnabled ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-300'
              } relative`}
            >
              <motion.div
                animate={{ x: notificationsEnabled ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
              />
            </motion.button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl">
            <div>
              <h4 className="font-semibold text-gray-900">Email Updates</h4>
              <p className="text-sm text-gray-600">Receive weekly summary emails</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setEmailUpdates(!emailUpdates)}
              className={`w-14 h-8 rounded-full transition-colors ${
                emailUpdates ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-300'
              } relative`}
            >
              <motion.div
                animate={{ x: emailUpdates ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
              />
            </motion.button>
          </div>
        </div>
      </motion.div>

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

        {/* Delete Account */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl text-left hover:border-red-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-red-700">Delete Account</h4>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
    </div>
  );
}
