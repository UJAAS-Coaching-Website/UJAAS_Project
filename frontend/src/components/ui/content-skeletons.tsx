import { Skeleton } from "./skeleton";
import logo from '../../assets/logo.svg';

export function SubjectCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 flex items-center md:flex-col md:items-center gap-3 md:gap-4">
      <Skeleton className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl shrink-0" />
      <div className="min-w-0 flex-1 md:flex-none md:w-full md:text-center space-y-2">
        <Skeleton className="h-4 w-24 md:mx-auto" />
      </div>
    </div>
  );
}

export function ChapterCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </div>
  );
}

export function NoteCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-lg">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DppCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-lg">
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-md">
      <Skeleton className="mb-3 h-12 w-12 rounded-lg" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="mt-2 h-4 w-24" />
    </div>
  );
}

export function TestCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
      <div className="space-y-4 bg-gradient-to-r from-gray-50 to-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="w-full max-w-[75%] space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="mt-auto space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function TableRowsSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {showHeader ? (
          <thead className="bg-gray-50/80">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-6 py-4">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((__, columnIndex) => (
                <td key={columnIndex} className="px-6 py-4">
                  <Skeleton className={`h-4 ${columnIndex === 0 ? "w-32" : columnIndex === columns - 1 ? "w-24" : "w-full max-w-[10rem]"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardHeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-200 via-gray-200 to-slate-300 p-5 md:p-8 shadow-2xl">
      <div className="relative flex flex-row items-center gap-4 md:gap-6">
        <Skeleton className="h-16 w-16 md:h-24 md:w-24 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-8 md:h-9 w-48 md:w-64" />
          <Skeleton className="h-4 md:h-5 w-40 md:w-56" />
        </div>
      </div>
    </div>
  );
}

export function TestSeriesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="rounded-3xl md:rounded-2xl p-5 md:p-6 bg-white shadow-lg border border-gray-100 flex flex-row items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-8 md:h-10 w-32 md:w-48 mb-2" />
          <Skeleton className="h-3 md:h-4 w-48 md:w-64" />
        </div>
        <div className="flex shrink-0 items-center">
          <Skeleton className="h-9 w-20 md:h-12 md:w-32 rounded-lg md:rounded-xl" />
        </div>
      </div>

      {/* Stats Grid */}
      <div 
        className="grid gap-2 lg:gap-4" 
        style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-0 rounded-lg md:rounded-xl px-1.5 py-2 md:p-5 bg-white shadow-md border border-gray-100 flex flex-col items-center md:items-start text-center md:text-left">
            <Skeleton className="mb-1 md:mb-3 h-6 w-6 md:h-12 md:w-12 rounded-lg shrink-0" />
            <Skeleton className="h-4 md:h-9 w-8 md:w-16 shrink-0" />
            <Skeleton className="mt-1 md:mt-2 h-2 md:h-4 w-12 md:w-20 shrink-0" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl md:rounded-2xl p-4 md:p-6 bg-white shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Skeleton className="mb-3 md:mb-2 h-3 md:h-4 w-12 md:w-16" />
            <div className="flex items-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 md:h-10 flex-1 min-w-0 md:flex-none md:w-24 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Test Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {Array.from({ length: 6 }).map((_, i) => (
          <TestCardSkeleton key={`test-card-skeleton-${i}`} />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Header Block */}
      <div className="rounded-3xl p-5 md:p-8 bg-white shadow-xl border border-gray-100 flex flex-row items-center gap-4 md:gap-6 relative overflow-hidden">
        <Skeleton className="w-16 h-16 md:w-24 md:h-24 rounded-full shrink-0" />
        <div className="flex-1 space-y-3 w-full text-left flex flex-col items-start">
          <Skeleton className="h-6 md:h-8 w-48 md:w-64" />
          <Skeleton className="h-3 md:h-4 w-32 md:w-48" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Skeleton className="h-10 w-28 rounded-lg shrink-0" />
        <Skeleton className="h-10 w-32 rounded-lg shrink-0" />
        <Skeleton className="h-10 w-28 rounded-lg shrink-0" />
      </div>

      {/* Overview Grid Area */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-6 space-y-4">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuestionBankSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 md:p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10 w-full space-y-2">
          <Skeleton className="h-8 md:h-10 w-48 md:w-64" />
          <Skeleton className="h-4 md:h-5 w-64 md:w-96 max-w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl md:rounded-3xl p-4 md:p-8 bg-white shadow-lg border border-gray-100 flex flex-col items-center">
            <Skeleton className="mb-4 md:mb-6 h-12 w-12 md:h-20 md:w-20 rounded-xl md:rounded-2xl shrink-0" />
            <Skeleton className="mb-2 h-4 md:h-6 w-3/4" />
            <Skeleton className="h-3 md:h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardLoadingShell({ role }: { role: 'admin' | 'faculty' | 'student' }) {
  const showManagementRows = role === 'admin' || role === 'faculty';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <div className="border-b border-white bg-white/70 backdrop-blur-lg shadow-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="UJAAS Logo" className="h-10 w-10 object-contain opacity-80" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {showManagementRows ? (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-9 w-64" />
                  <Skeleton className="h-5 w-96 max-w-full" />
                </div>
                <div className="flex flex-wrap lg:justify-end lg:pl-6 gap-3">
                  <Skeleton className="h-12 w-40 rounded-xl" />
                  <Skeleton className="h-12 w-40 rounded-xl" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`admin-batch-skeleton-${index}`} className="p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-8 w-48" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <DashboardHeroSkeleton />

            <div className="grid gap-4 grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <StatCardSkeleton key={`dashboard-stat-skeleton-${index}`} />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <SubjectCardSkeleton key={`dashboard-card-skeleton-${index}`} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
