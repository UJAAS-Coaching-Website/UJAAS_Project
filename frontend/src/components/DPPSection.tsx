import { ClipboardList, Award, BookOpen } from 'lucide-react';

export function DPPSection() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daily Practice Problems</h2>
            <p className="text-gray-600">DPPs now run from the chapter content view with preload, instructions, and timerless attempts.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">Source of Truth</p>
              <p className="text-3xl font-bold text-gray-900">API</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">Attempt Limit</p>
              <p className="text-3xl font-bold text-gray-900">3</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">Attempt UI</p>
              <p className="text-3xl font-bold text-gray-900">No Timer</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
              <BookOpen className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="font-semibold text-gray-900">Open a chapter and switch to the `Practice DPPs` tab to work with live DPPs.</p>
        <p className="mt-2 text-sm text-gray-500">This legacy standalone section is kept only as a lightweight placeholder.</p>
      </div>
    </div>
  );
}
