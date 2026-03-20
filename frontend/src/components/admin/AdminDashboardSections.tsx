import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Edit, Eye, Megaphone, MessageSquare, Plus, Trash2 } from 'lucide-react';

type BatchInfo = {
  label: string;
  slug: string;
  is_active?: boolean;
};

type StudentDirectoryStudent = {
  id: string;
  name: string;
  rollNumber: string;
  rating: number;
  batch: string;
};

type LandingQuery = {
  id: string;
  name: string;
  phone: string;
  course: string;
  message?: string;
  date: string;
  status: 'new' | 'seen' | 'contacted';
};

export function AdminBatchSelectionTab({
  batches,
  onSelectBatch,
  onAddBatch,
  onUploadNotice,
}: {
  batches: BatchInfo[];
  onSelectBatch: (batch: string) => void;
  onAddBatch: () => void;
  onUploadNotice: () => void;
}) {
  const sortedBatches = [...batches].sort((a, b) => {
    if ((a.is_active !== false) === (b.is_active !== false)) return a.label.localeCompare(b.label);
    return a.is_active === false ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl font-bold text-gray-900">Batch Management</h2>
            <p className="text-gray-600">Open a batch dashboard, review assigned groups, and manage new batches.</p>
          </div>
          <div className="flex flex-wrap lg:justify-end lg:pl-6 gap-3">
            <button
              onClick={onUploadNotice}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md whitespace-nowrap"
            >
              <Megaphone className="w-5 h-5" />
              Upload Notice
            </button>
            <button
              onClick={onAddBatch}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-500 text-white rounded-xl font-bold shadow-md whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Add New Batch
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedBatches.map((batch) => (
          <motion.button key={batch.slug} onClick={() => onSelectBatch(batch.label)} className={`p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white text-left group transition-all duration-300 ${batch.is_active === false ? 'opacity-60 grayscale' : 'hover:shadow-2xl'} flex items-center justify-between gap-4`}>
            <div className="flex-1">
              <div className="mb-1">
                <span className="text-black font-normal text-xs tracking-widest uppercase">Batch</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-between">
                {batch.label}
                {batch.is_active === false && <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-3 py-1 rounded-full uppercase tracking-wider">Inactive</span>}
              </h3>
            </div>
            <ChevronRight className="w-8 h-8 text-cyan-600 group-hover:translate-x-1 transition-transform shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function AdminQueriesManagementTab({
  queries,
  onViewQuery,
  onDeleteQuery,
}: {
  queries: LandingQuery[];
  onViewQuery: (query: LandingQuery) => void;
  onDeleteQuery: (id: string) => void;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg"><MessageSquare className="w-6 h-6 text-white" /></div>
        <div><h2 className="text-3xl font-bold text-gray-900">Interest Queries</h2><p className="text-gray-600">Manage interest registered through the landing page</p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-4 px-4 font-bold text-gray-700">Date</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Student</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Course</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Message</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Status</th>
              <th className="pb-4 px-4 font-bold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {queries.map((query) => (
              <tr key={query.id} onClick={() => onViewQuery(query)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <td className="py-4 px-4 text-sm text-gray-500 whitespace-nowrap">{new Date(query.date).toLocaleDateString()}</td>
                <td className="py-4 px-4">
                  <div className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors whitespace-nowrap">{query.name}</div>
                  <div className="text-xs text-gray-500">{query.phone}</div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold uppercase whitespace-nowrap">{query.course}</span>
                </td>
                <td className="py-4 px-4 max-w-xs">
                  <p className="text-sm text-gray-700 break-words line-clamp-2" title={query.message}>{query.message || '—'}</p>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm border ${
                    query.status === 'new' ? 'bg-teal-100 text-teal-700 border-teal-200' :
                    query.status === 'seen' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {query.status.charAt(0).toUpperCase() + query.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={(event) => { event.stopPropagation(); onViewQuery(query); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors" title="View Details">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={(event) => { event.stopPropagation(); onDeleteQuery(query.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Delete Query">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminStudentsDirectoryTab({
  students,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onViewStudent,
  renderStars,
}: {
  students: StudentDirectoryStudent[];
  onAddStudent: () => void;
  onEditStudent: (student: StudentDirectoryStudent) => void;
  onDeleteStudent: (id: string) => void;
  onViewStudent: (student: StudentDirectoryStudent) => void;
  renderStars: (rating: number) => React.ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'rank-desc' | 'rank-asc' | 'batch-asc'>('name-asc');

  const filtered = students
    .filter((student) => student.name.toLowerCase().includes(query.toLowerCase()) || student.rollNumber.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'rank-desc':
          return b.rating - a.rating;
        case 'rank-asc':
          return a.rating - b.rating;
        case 'batch-asc':
          return (a.batch || '').localeCompare(b.batch || '');
        default:
          return 0;
      }
    });

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div><h2 className="text-3xl font-bold text-gray-900">Students Directory</h2><p className="text-gray-500">Manage all students across all batches</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students..." className="px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-teal-500 w-64" />
          </div>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'name-asc' | 'rank-desc' | 'rank-asc' | 'batch-asc')}
            className="px-6 py-3 pr-10 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-sm font-bold text-gray-700 outline-none cursor-pointer hover:bg-gray-200 transition appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
          >
            <option value="name-asc">Sort: A to Z</option>
            <option value="rank-desc">Sort: Rank (High to Low)</option>
            <option value="rank-asc">Sort: Rank (Low to High)</option>
            <option value="batch-asc">Sort: By Batch</option>
          </select>
          <button onClick={onAddStudent} className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 hover:shadow-xl transition"><Plus className="w-5 h-5" />Add Student</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-4 px-4 font-bold text-gray-700">Student</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Performance</th>
              <th className="pb-4 px-4 font-bold text-gray-700">Batch</th>
              <th className="pb-4 px-4 font-bold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((student) => (
              <tr key={student.id} onClick={() => onViewStudent(student)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <td className="py-4 px-4">
                  <div className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{student.name}</div>
                  <div className="text-xs text-gray-500">{student.rollNumber}</div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">{renderStars(student.rating)}</td>
                <td className="py-4 px-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap">{student.batch}</span>
                </td>
                <td className="py-4 px-4 flex gap-1 justify-end">
                  <button onClick={(event) => { event.stopPropagation(); onEditStudent(student); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors" title="Edit Student">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={(event) => { event.stopPropagation(); onDeleteStudent(student.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Delete Student">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
