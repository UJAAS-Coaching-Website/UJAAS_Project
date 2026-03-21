import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, ClipboardList, GraduationCap, Star } from 'lucide-react';
import { fetchBatch, fetchBatches, type ApiBatch } from '../../api/batches';
import { apiFetchChapters } from '../../api/chapters';
import { fetchDpps } from '../../api/dpps';
import { MiniAvatar } from '../MiniAvatar';
import { NotesManagementTab } from '../NotesManagementTab';
import { DashboardHeroSkeleton, SubjectCardSkeleton } from '../ui/content-skeletons';
import { Skeleton } from '../ui/skeleton';
import type { User } from '../../App';

type StudentHomeTab = 'home' | 'test-series' | 'profile' | 'batch-detail' | 'question-bank';

function renderPerformanceStars(rating: number) {
  const normalizedRating = Math.max(0, Math.min(5, rating));
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        let fillPercentage = 0;
        if (normalizedRating >= star) fillPercentage = 100;
        else if (normalizedRating > star - 1) fillPercentage = (normalizedRating - (star - 1)) * 100;
        return (
          <div key={star} className="relative inline-block select-none" style={{ width: '16px', height: '16px', fontSize: '16px', lineHeight: '16px' }}>
            <span style={{ color: '#d1d5db', position: 'absolute', left: 0, top: 0 }}>★</span>
            <div style={{ width: `${fillPercentage}%`, overflow: 'hidden', position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', color: '#f59e0b', transition: 'width 0.3s ease' }}>
              <span>★</span>
            </div>
          </div>
        );
      })}
      <span className="text-sm font-bold text-gray-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export function StudentDashboardHome({
  user,
  onNavigate,
  onOpenPerformance,
  isMobileViewport,
  activeTab,
  onViewTimetable,
  batchDetails,
  batchDetailsLoading,
}: {
  user: User;
  onNavigate: (tab: StudentHomeTab, subTab?: string) => void;
  onOpenPerformance: () => void;
  isMobileViewport: boolean;
  activeTab: StudentHomeTab;
  onViewTimetable: () => void;
  batchDetails: ApiBatch | null;
  batchDetailsLoading: boolean;
  batchDetailsError: string | null;
  batchListCount: number | null;
  batchMatchInfo: string | null;
}) {
  const [dppProgress, setDppProgress] = useState({ completed: 0, total: 0, loading: true });

  useEffect(() => {
    let cancelled = false;
    const loadDppProgress = async () => {
      if (!user.studentDetails?.batch) {
        if (!cancelled) setDppProgress({ completed: 0, total: 0, loading: false });
        return;
      }
      try {
        if (!cancelled) setDppProgress((prev) => ({ ...prev, loading: true }));
        const studentBatchId = user.studentDetails?.batchId;
        const target = user.studentDetails?.batch?.toLowerCase().trim();
        let studentBatch: ApiBatch | null = null;
        if (studentBatchId) {
          try { studentBatch = await fetchBatch(studentBatchId); } catch (error) { console.error('Failed to fetch batch by id:', error); }
        }
        if (!studentBatch) {
          const batches = await fetchBatches();
          studentBatch = batches.find((batch) => batch.name?.toLowerCase().trim() === target || batch.slug?.toLowerCase().trim() === target) || null;
        }
        if (!studentBatch) {
          if (!cancelled) setDppProgress({ completed: 0, total: 0, loading: false });
          return;
        }
        const chapters = await apiFetchChapters(studentBatch.id);
        const dppGroups = await Promise.all(chapters.map((chapter) => fetchDpps(chapter.id).catch(() => [])));
        const dppMap = new Map<string, { submitted_attempt_count?: number }>();
        dppGroups.flat().forEach((dpp) => {
          if (!dppMap.has(dpp.id)) dppMap.set(dpp.id, { submitted_attempt_count: dpp.submitted_attempt_count });
        });
        const total = dppMap.size;
        const completed = Array.from(dppMap.values()).filter((dpp) => Number(dpp.submitted_attempt_count || 0) > 0).length;
        if (!cancelled) setDppProgress({ completed, total, loading: false });
      } catch (error) {
        console.error('Failed to load DPP progress', error);
        if (!cancelled) setDppProgress({ completed: 0, total: 0, loading: false });
      }
    };
    void loadDppProgress();
    return () => { cancelled = true; };
  }, [user.studentDetails?.batch, user.studentDetails?.batchId]);

  const calculateOverallRating = () => {
    if (!user.studentDetails?.ratings) return 0;
    const ratings = user.studentDetails.ratings;
    const dppPerformance = (ratings as any).dppPerformance || 0;
    return Number((([ratings.attendance, ratings.tests, ratings.behavior, dppPerformance].reduce((sum, value) => sum + value, 0)) / 4).toFixed(1));
  };

  const currentRating = calculateOverallRating();
  const completedCount = dppProgress.completed;
  const totalDpps = dppProgress.total;
  const dppPercentage = totalDpps > 0 ? (completedCount / totalDpps) * 100 : 0;
  const firstName = user.name?.trim().split(/\s+/)[0] || 'Student';

  return (
    <div className="space-y-6">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`${isMobileViewport ? 'p-5' : 'p-8'} bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 rounded-3xl text-white shadow-2xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
        <div className={`relative flex ${isMobileViewport ? 'flex-row items-center' : 'flex-col md:flex-row items-start md:items-center'} gap-4 md:gap-6`}>
          <MiniAvatar user={user} className={`${isMobileViewport ? 'w-16 h-16 text-2xl' : 'w-24 h-24 text-4xl'} border-4 border-white/30 shadow-2xl`} />
          <div className="flex-1">
            <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={`${isMobileViewport ? 'text-[2rem]' : 'text-3xl'} font-bold leading-tight mb-2`}>
              Welcome {firstName}!
            </motion.h2>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className={`${isMobileViewport ? 'text-sm' : 'text-base'} max-w-xl text-teal-50/90`}>
              Pick up where you left off
            </motion.p>
          </div>
        </div>
      </motion.div>

      <div className={`grid ${isMobileViewport ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-4`}>
        {[
          { label: 'DPP Completed', value: dppProgress.loading ? 'Loading...' : `${completedCount}/${totalDpps}`, icon: ClipboardList, gradient: 'from-green-500 to-emerald-500', bgGradient: 'from-green-50 to-emerald-50', percentage: dppPercentage, stars: false, onClick: undefined },
          { label: 'Performance Rating', value: `${currentRating.toFixed(1)}/5.0`, icon: Star, gradient: 'from-yellow-500 to-orange-500', bgGradient: 'from-yellow-50 to-orange-50', percentage: (currentRating / 5) * 100, stars: true, onClick: onOpenPerformance },
        ].map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} onClick={stat.onClick} className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl ${isMobileViewport ? 'p-4' : 'p-6'} shadow-lg border border-white relative overflow-hidden group ${stat.onClick ? 'cursor-pointer' : ''}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            <div className="relative">
              <div className={`${isMobileViewport ? 'flex items-center gap-2 mb-2' : 'mb-3'}`}>
                <motion.div className={`${isMobileViewport ? 'w-9 h-9 rounded-lg' : 'w-12 h-12 rounded-xl'} bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                  <stat.icon className={`${isMobileViewport ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
                </motion.div>
                <p className={`${isMobileViewport ? 'mb-0 text-2xl' : 'mb-1 text-3xl'} font-bold text-gray-900`} style={isMobileViewport && stat.value === 'Loading...' ? { fontSize: '1.1rem', lineHeight: '1.2' } : undefined}>{stat.value}</p>
              </div>
              <p className={`${isMobileViewport ? 'text-xs' : 'text-sm'} text-gray-600 font-medium mb-3`}>{stat.label}</p>
              {stat.stars ? <div className="mt-2">{renderPerformanceStars(currentRating)}</div> : <div className="mt-3 w-full bg-white/50 rounded-full h-1.5"><motion.div initial={{ width: 0 }} animate={{ width: `${stat.percentage}%` }} transition={{ delay: 0.5 + index * 0.1, duration: 1 }} className={`h-1.5 rounded-full bg-gradient-to-r ${stat.gradient}`} /></div>}
            </div>
          </motion.div>
        ))}
      </div>

      <StudentAssignedBatchContent user={user} onNavigate={onNavigate} isMobileViewport={isMobileViewport} currentTab={activeTab} onViewTimetable={onViewTimetable} batchDetails={batchDetails} loading={batchDetailsLoading} />
    </div>
  );
}

function StudentAssignedBatchContent({
  user,
  onNavigate,
  isMobileViewport,
  currentTab,
  onViewTimetable,
  batchDetails,
  loading,
}: {
  user: User;
  onNavigate: (tab: StudentHomeTab, subTab?: string) => void;
  isMobileViewport: boolean;
  currentTab: StudentHomeTab;
  onViewTimetable: () => void;
  batchDetails: ApiBatch | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardHeroSkeleton />
        <div className="rounded-3xl border border-gray-100 bg-white/40 p-1 shadow-xl">
          <div className="p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 p-5 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <SubjectCardSkeleton key={index} />)}
          </div>
        </div>
      </div>
    );
  }
  if (!user.studentDetails?.batch) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white/70 p-8 text-center shadow-lg">
        <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-xl font-semibold text-gray-900">No Batch Assigned</h3>
        <p className="text-sm text-gray-500 mt-2">Your dashboard content will appear here once a batch is assigned.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 md:gap-4 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-lg border border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/60 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10 min-w-0 flex-1">
          <h2 className={`${isMobileViewport ? 'text-lg' : 'text-3xl'} font-bold tracking-tight text-slate-900`}>{user.studentDetails?.batch}</h2>
        </div>
        <button onClick={onViewTimetable} className={`relative z-10 ml-auto flex shrink-0 items-center gap-1.5 ${isMobileViewport ? 'px-3 py-1.5 text-xs rounded-lg' : 'px-4 py-2 rounded-xl'} bg-white text-slate-700 font-bold transition-all shadow-sm border border-teal-100 hover:bg-teal-50`}>
          <Calendar className={`${isMobileViewport ? 'w-4 h-4' : 'w-5 h-5'} text-teal-600`} />
          Time Table
        </button>
      </div>
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-1 border border-gray-100 shadow-xl">
        <div className={`${isMobileViewport ? 'p-3' : 'p-5'} flex items-center gap-3`}>
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><BookOpen className="w-6 h-6 text-emerald-600" /></div>
          <h3 className={`${isMobileViewport ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>Batch Academic Content</h3>
        </div>
        <div className="p-1">
          <NotesManagementTab onNavigate={onNavigate} currentTab={currentTab} selectedBatch={batchDetails?.name || user.studentDetails?.batch || null} onChangeBatch={() => onNavigate('home')} onViewTimetable={onViewTimetable} batches={batchDetails ? [{ id: batchDetails.id, label: batchDetails.name, subjects: batchDetails.subjects }] : []} readOnly={true} variant="student" headerMode="tracker-only" />
        </div>
      </div>
    </div>
  );
}
