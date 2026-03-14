import { Skeleton } from "./skeleton";

export function SubjectCardSkeleton() {
  return (
    <div className="rounded-3xl border border-white bg-white/80 p-6 shadow-lg">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="w-full space-y-2 text-center">
          <Skeleton className="mx-auto h-4 w-24" />
          <Skeleton className="mx-auto h-3 w-16" />
        </div>
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
    <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-200 via-gray-200 to-slate-300 p-8 shadow-2xl">
      <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
    </div>
  );
}
