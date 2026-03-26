import { useState, useEffect, FormEvent, ChangeEvent, lazy, Suspense } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import {
  fetchStudents as apiFetchStudents,
  createStudent as apiCreateStudent,
  updateStudent as apiUpdateStudent,
  deleteStudent as apiDeleteStudent,
  assignStudentToBatch as apiAssignStudentToBatch,
  removeStudentFromBatch as apiRemoveStudentFromBatch,
  type ApiStudent,
} from '../../api/students';
import { formatIndianMobileInput } from '../../utils/phone';
import { TableRowsSkeleton } from '../ui/content-skeletons';
import { generateInitialPassword } from '../../utils/passwords';

type StudentDirectoryStudent = {
  id: string;
  name: string;
  rollNumber: string;
  rating: number;
  batch: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  parentContact?: string;
};

type StudentFormState = {
  id?: string;
  name: string;
  rollNumber: string;
  batch: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  parentContact: string;
};

// --- Extracted Modal ---
function AddStudentModal({
  open,
  onClose,
  defaultBatch,
  batches,
  initialData,
  title,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  defaultBatch: string | null;
  batches: { label: string; id?: string; slug: string }[];
  initialData?: StudentDirectoryStudent;
  title?: string;
  onSubmit?: (data: StudentFormState) => void;
}) {
  const createInitialState = (batch: string | null, initial?: StudentDirectoryStudent): StudentFormState => ({
    id: initial?.id,
    name: initial?.name ?? '',
    rollNumber: initial?.rollNumber ?? '',
    batch: initial?.batch ?? batch ?? '',
    email: initial?.email ?? '',
    phoneNumber: formatIndianMobileInput(initial?.phoneNumber ?? ''),
    dateOfBirth: initial?.dateOfBirth ?? '',
    address: initial?.address ?? '',
    parentContact: formatIndianMobileInput(initial?.parentContact ?? ''),
  });

  const [formState, setFormState] = useState(createInitialState(defaultBatch, initialData));

  useEffect(() => {
    if (!open) return;
    setFormState(createInitialState(defaultBatch, initialData));
  }, [open, defaultBatch, initialData]);

  if (!open) return null;

  const handleChange = (field: keyof StudentFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const raw = event.target.value;
    const nextValue = field === 'phoneNumber' || field === 'parentContact'
      ? formatIndianMobileInput(raw)
      : raw;
    setFormState((prev) => ({ ...prev, [field]: nextValue }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.(formState);
    onClose();
  };

  const requiredMark = <span className="text-red-500">*</span>;

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-layer-10001">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-white overflow-hidden flex flex-col"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
          <h3 className="text-xl font-semibold">{title ?? 'Add Student'}</h3>
          <p className="text-sm text-white/80">Fields marked with * are mandatory.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Name {requiredMark}</span>
              <input type="text" required value={formState.name} onChange={handleChange('name')} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200" placeholder="Student name" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Roll Number {requiredMark}</span>
              <input type="text" required value={formState.rollNumber} onChange={handleChange('rollNumber')} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200" placeholder="UJAAS-###" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Batch {requiredMark}</span>
              <select required value={formState.batch} onChange={handleChange('batch')} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white">
                <option value="" disabled>Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.slug} value={batch.label}>{batch.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Email (Optional)</span>
              <input type="email" value={formState.email} onChange={handleChange('email')} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200" placeholder="student@email.com" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Phone Number (Optional)</span>
              <input type="tel" value={formState.phoneNumber} onChange={handleChange('phoneNumber')} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200" placeholder="+91 9XXXX XXXXX" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700 block">
              <span className="block">Date of Birth (Optional)</span>
              <input type="date" value={formState.dateOfBirth} onChange={handleChange('dateOfBirth')} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200" />
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Address (Optional)</span>
            <textarea rows={3} value={formState.address} onChange={handleChange('address')} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200" placeholder="Street, city, state, postal code" />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 block">
            <span className="block">Parent Contact (Optional)</span>
            <input type="tel" value={formState.parentContact} onChange={handleChange('parentContact')} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200" placeholder="Parent/guardian phone number" />
          </label>
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition shadow-sm">Cancel</button>
            <button type="submit" className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition">Save Student</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// --- Main Tab Component ---
export function AdminStudentsTab({ batches, onViewStudent }: { batches: { label: string; id?: string; slug: string }[], onViewStudent: (student: any) => void }) {
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'rank-desc' | 'rank-asc' | 'batch-asc'>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const STUDENTS_PER_PAGE = 20;

  const [studentModal, setStudentModal] = useState<{ open: boolean; initialData?: StudentDirectoryStudent; title?: string }>({ open: false });

  const loadStudents = async (searchQuery?: string) => {
    try {
      if (!searchQuery && students.length === 0) setLoading(true);
      const res = await apiFetchStudents(searchQuery);
      setStudents(res);
    } catch (e) {
      console.error('Failed to fetch students:', e);
    } finally {
      if (!searchQuery) setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query.length > 0) loadStudents(query);
      else loadStudents();
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Convert ApiStudent to the format expected by the rendering logic
  const formattedStudents = students.map(s => ({
    id: s.id,
    name: s.name,
    rollNumber: s.roll_number || '',
    rating: s.rating_assignments || 0, // Fallback to a single rating for simplicity in the list
    batch: s.assigned_batch?.name || 'Unassigned',
    email: s.login_id || '',
    phoneNumber: s.phone || '',
    dateOfBirth: s.date_of_birth || '',
    address: s.address || '',
    parentContact: s.parent_contact || '',
    originalObject: s
  }));

  const filtered = formattedStudents.sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'rank-desc': return b.rating - a.rating;
      case 'rank-asc': return a.rating - b.rating;
      case 'batch-asc': return (a.batch || '').localeCompare(b.batch || '');
      default: return 0;
    }
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / STUDENTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStudents = filtered.slice((safeCurrentPage - 1) * STUDENTS_PER_PAGE, safeCurrentPage * STUDENTS_PER_PAGE);
  const rangeStart = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * STUDENTS_PER_PAGE + 1;
  const rangeEnd = Math.min(safeCurrentPage * STUDENTS_PER_PAGE, filtered.length);

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(totalPages, page)));

  const handleSaveStudent = async (data: StudentFormState) => {
    try {
      if (data.id) {
        const batchInfo = batches.find(b => b.label === data.batch);
        const apiStudent = students.find(s => s.id === data.id);

        await apiUpdateStudent(data.id, {
          name: data.name,
          rollNumber: data.rollNumber,
          phone: data.phoneNumber,
          address: data.address,
          dateOfBirth: data.dateOfBirth,
          parentContact: data.parentContact,
        });

        if (apiStudent) {
          const currentBatchId = apiStudent.assigned_batch?.id;
          const nextBatchId = batchInfo?.id;
          if (currentBatchId && currentBatchId !== nextBatchId) await apiRemoveStudentFromBatch(data.id, currentBatchId);
          if (nextBatchId && currentBatchId !== nextBatchId) await apiAssignStudentToBatch(data.id, nextBatchId);
        }
      } else {
        const batchInfo = batches.find(b => b.label === data.batch);
        const createdStudent = await apiCreateStudent({
          name: data.name,
          rollNumber: data.rollNumber,
          email: data.email.trim() || undefined,
          phone: data.phoneNumber,
          address: data.address,
          dateOfBirth: data.dateOfBirth,
          parentContact: data.parentContact,
          batchId: batchInfo?.id,
        });
        const initialPassword = generateInitialPassword(data.name);
        const loginId = (createdStudent as any)?.login_id || data.rollNumber || 'Not provided';
        window.alert(`New Student added successfully!\n\nName: ${data.name}\nLogin ID: ${loginId}\nInitial Password: ${initialPassword}`);
      }
      loadStudents(); // Refresh
    } catch (error: any) {
      window.alert(`Error: ${error.message || 'Failed to save student'}`);
    }
    setStudentModal({ open: false });
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await apiDeleteStudent(id);
        loadStudents(); // Refresh
      } catch (error: any) {
        window.alert(`Error deleting student: ${error.message}`);
      }
    }
  };

  const renderStars = (rating: number) => {
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
              <div style={{ width: `${fillPercentage}%`, overflow: 'hidden', position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', color: '#f59e0b' }}>
                <span>★</span>
              </div>
            </div>
          );
        })}
        <span className="text-sm font-bold text-gray-700 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
           <TableRowsSkeleton rows={8} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div><h2 className="text-3xl font-bold text-gray-900">Students Directory</h2><p className="text-gray-500">Manage all students across all batches</p></div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input type="text" value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} placeholder="Search students..." className="px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-teal-500 w-64" />
            </div>
            <select value={sortBy} onChange={(event) => { setSortBy(event.target.value as any); setCurrentPage(1); }} className="px-6 py-3 pr-10 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-sm font-bold text-gray-700 outline-none cursor-pointer hover:bg-gray-200 transition appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}>
              <option value="name-asc">Sort: A to Z</option>
              <option value="rank-desc">Sort: Rank (High to Low)</option>
              <option value="rank-asc">Sort: Rank (Low to High)</option>
              <option value="batch-asc">Sort: By Batch</option>
            </select>
            <button onClick={() => setStudentModal({ open: true, title: 'Add Student' })} className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 hover:shadow-xl transition"><Plus className="w-5 h-5" />Add Student</button>
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
              {paginatedStudents.map((student) => (
                <tr key={student.id} onClick={() => onViewStudent(student.originalObject)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                  <td className="py-4 px-4">
                    <div className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{student.name}</div>
                    <div className="text-xs text-gray-500">{student.rollNumber}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">{renderStars(student.rating)}</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap">{student.batch}</span>
                  </td>
                  <td className="py-4 px-4 flex gap-1 justify-end">
                    <button onClick={(event) => { event.stopPropagation(); setStudentModal({ open: true, title: 'Edit Student', initialData: student }); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors" title="Edit Student">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={(event) => { event.stopPropagation(); handleDeleteStudent(student.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Delete Student">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-medium text-gray-500">Showing {rangeStart}-{rangeEnd} of {filtered.length} students</p>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button type="button" onClick={() => goToPage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <span className="min-w-20 text-center text-sm font-semibold text-gray-600">Page {safeCurrentPage} of {totalPages}</span>
            <button type="button" onClick={() => goToPage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      <AddStudentModal
        open={studentModal.open}
        onClose={() => setStudentModal({ open: false })}
        initialData={studentModal.initialData}
        title={studentModal.title}
        onSubmit={handleSaveStudent}
        defaultBatch={null}
        batches={batches}
      />
    </>
  );
}
