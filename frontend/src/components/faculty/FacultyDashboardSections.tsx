import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Edit, Megaphone, Plus, Search, Trash2 } from 'lucide-react';

type BatchInfo = {
  label: string;
  slug: string;
  facultyAssigned?: string[];
  is_active?: boolean;
};

type StudentDirectoryStudent = {
  id: string;
  name: string;
  rollNumber: string;
  rating: number;
  batch: string;
};

export function FacultyBatchSelectionTab({
  batches,
  onSelectBatch,
  facultyName,
  onOpenNotices,
}: {
  batches: BatchInfo[];
  onSelectBatch: (batch: string) => void;
  facultyName: string;
  onOpenNotices: () => void;
}) {
  const facultyBatches = batches.filter((batch) => batch.facultyAssigned?.includes(facultyName));
  const sortedBatches = [...facultyBatches].sort((a, b) => {
    if ((a.is_active !== false) === (b.is_active !== false)) return a.label.localeCompare(b.label);
    return a.is_active === false ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Batch Management</h2>
            <p className="text-gray-600">Open one of your assigned batches to review students, attendance, and academic content.</p>
          </div>
          <button onClick={onOpenNotices} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md whitespace-nowrap">
            <Megaphone className="w-5 h-5" />
            Notices
          </button>
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

export function FacultyStudentsDirectoryTab({
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
  const filtered = students.filter((student) => student.name.toLowerCase().includes(query.toLowerCase()) || student.rollNumber.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div><h2 className="text-3xl font-bold text-gray-900">Students Directory</h2><p className="text-gray-500">Manage all students in your assigned batches</p></div>
        <div className="flex gap-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students..." className="pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-cyan-500 w-64" /></div><button onClick={onAddStudent} className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add Student</button></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="text-left border-b border-gray-100"><th className="pb-4 font-bold text-gray-700">Student</th><th className="pb-4 font-bold text-gray-700">Batch</th><th className="pb-4 font-bold text-gray-700">Performance</th><th className="pb-4 font-bold text-gray-700">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((student) => (
              <tr key={student.id} onClick={() => onViewStudent(student)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                <td className="py-4"><div className="font-bold text-gray-900">{student.name}</div><div className="text-xs text-gray-500">{student.rollNumber}</div></td>
                <td className="py-4"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{student.batch}</span></td>
                <td className="py-4">{renderStars(student.rating)}</td>
                <td className="py-4 flex gap-2"><button onClick={(event) => { event.stopPropagation(); onEditStudent(student); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button><button onClick={(event) => { event.stopPropagation(); onDeleteStudent(student.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
