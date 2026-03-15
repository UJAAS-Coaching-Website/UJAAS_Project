import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronDown,
  Download,
  File,
  FileText,
  Folder,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import {
  apiDeleteQuestionBankFromBatch,
  apiFetchQuestionBank,
  apiUploadQuestionBank,
  type ApiQuestionBankBatchSummary,
  type ApiQuestionBankFile,
} from '../api/questionBank';

type SortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'difficulty_asc' | 'difficulty_desc';

interface QuestionBankProps {
  userRole: 'student' | 'faculty';
  userSubject?: string;
  userBatch?: string;
  batches?: string[];
  onBack?: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'difficulty_asc', label: 'Difficulty Easy-Hard' },
  { value: 'difficulty_desc', label: 'Difficulty Hard-Easy' },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDifficulty(value: ApiQuestionBankFile['difficulty']) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getDifficultyClasses(value: ApiQuestionBankFile['difficulty']) {
  if (value === 'easy') return 'bg-green-100 text-green-700';
  if (value === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) {
    return <ImageIcon className="w-5 h-5 text-blue-600" />;
  }
  if ((ext || '') === 'pdf') {
    return <FileText className="w-5 h-5 text-red-600" />;
  }
  return <File className="w-5 h-5 text-gray-600" />;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function buildDownloadFileName(item: ApiQuestionBankFile) {
  const ext = item.original_file_name.includes('.')
    ? item.original_file_name.split('.').pop()
    : '';
  const base = item.title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return ext ? `${base}.${ext}` : base;
}

async function forceDownload(url: string, filename: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

export function QuestionBank({ userRole, userSubject }: QuestionBankProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedBatch, setSelectedBatch] = useState<ApiQuestionBankBatchSummary | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [items, setItems] = useState<ApiQuestionBankFile[]>([]);
  const [facultyBatches, setFacultyBatches] = useState<ApiQuestionBankBatchSummary[]>([]);
  const [studentAssignedBatch, setStudentAssignedBatch] = useState<ApiQuestionBankBatchSummary | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useBodyScrollLock(isAddModalOpen);

  const facultyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      item.batches?.forEach((batch) => {
        counts.set(batch.id, (counts.get(batch.id) || 0) + 1);
      });
    });
    return counts;
  }, [items]);

  const studentSubjects = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.subject_name))).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const isListView = userRole === 'faculty' ? !!selectedBatch : !!selectedSubject;

  const loadFolders = async () => {
    setLoadingFolders(true);
    setErrorMessage('');
    try {
      const response = await apiFetchQuestionBank({ sort: 'newest' });
      setItems(response.items || []);
      setFacultyBatches(response.accessibleBatches || []);
      setStudentAssignedBatch(response.assignedBatch || null);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Failed to load question bank.');
    } finally {
      setLoadingFolders(false);
    }
  };

  const loadList = async () => {
    setLoadingItems(true);
    setErrorMessage('');
    try {
      const response = await apiFetchQuestionBank(
        userRole === 'faculty'
          ? { batch_id: selectedBatch?.id, search: searchQuery, sort: sortBy }
          : { subject_name: selectedSubject || undefined, search: searchQuery, sort: sortBy }
      );
      setItems(response.items || []);
      setFacultyBatches(response.accessibleBatches || []);
      setStudentAssignedBatch(response.assignedBatch || null);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Failed to load files.');
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    void loadFolders();
  }, [userRole]);

  useEffect(() => {
    if (userRole === 'faculty' && selectedBatch) {
      void loadList();
    }
  }, [userRole, selectedBatch, searchQuery, sortBy]);

  useEffect(() => {
    if (userRole === 'student' && selectedSubject) {
      void loadList();
    }
  }, [userRole, selectedSubject, searchQuery, sortBy]);

  const handleBack = () => {
    setSearchQuery('');
    setSortBy('newest');
    if (userRole === 'faculty') {
      setSelectedBatch(null);
    } else {
      setSelectedSubject(null);
    }
    void loadFolders();
  };

  const handleDownload = async (item: ApiQuestionBankFile, event: React.MouseEvent) => {
    event.stopPropagation();
    setDownloadingId(item.id);
    try {
      await forceDownload(item.file_url, buildDownloadFileName(item));
    } catch (error) {
      console.error('Download failed:', error);
      window.open(item.file_url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (item: ApiQuestionBankFile, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!selectedBatch) return;
    if (!window.confirm(`Delete "${item.title}" from ${selectedBatch.name}?`)) return;

    const deleteKey = `${item.id}:${selectedBatch.id}`;
    setDeletingKey(deleteKey);
    try {
      await apiDeleteQuestionBankFromBatch(item.id, selectedBatch.id);
      await loadList();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to delete file from this batch.');
    } finally {
      setDeletingKey(null);
    }
  };

  const listTitle = userRole === 'faculty'
    ? selectedBatch?.name || 'Question Bank'
    : selectedSubject || 'Question Bank';

  const listSubtitle = userRole === 'faculty'
    ? `${userSubject || 'Your subject'} practice questions for this batch`
    : (studentAssignedBatch?.name ? `Available in ${studentAssignedBatch.name}` : 'Available files');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight">Question Bank</h2>
          <p className="text-teal-50/90 font-medium">
            {userRole === 'faculty'
              ? 'Publish subject-wise question sheets batch by batch'
              : 'Browse subject-wise question sheets for your batch'}
          </p>
        </div>
        {userRole === 'faculty' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-white text-teal-600 rounded-2xl font-bold shadow-lg hover:bg-teal-50 transition flex items-center gap-2 relative z-10"
          >
            <Plus className="w-5 h-5" />
            Add to Question Bank
          </button>
        )}
      </div>

      {isListView && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white shadow-lg space-y-4">
          <div className="flex items-start gap-4 min-w-0">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-teal-600 text-sm font-semibold hover:underline shrink-0 mt-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-gray-900 break-words">{listTitle}</h3>
              <p className="text-sm text-gray-500">{listSubtitle}</p>
            </div>
          </div>

          <div className="flex items-stretch gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
            <div className="relative w-52 flex-none">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white w-full appearance-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      {!isListView && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingFolders && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 animate-pulse">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl mb-6" />
              <div className="h-6 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}

          {!loadingFolders && userRole === 'faculty' && facultyBatches.map((batch) => (
            <motion.button
              key={batch.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setSearchQuery('');
                setSortBy('newest');
                setSelectedBatch(batch);
              }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 flex flex-col items-center text-center cursor-pointer group hover:border-teal-200 transition-all"
            >
              <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <Folder className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{batch.name}</h3>
              <p className="text-sm text-gray-500">{facultyCounts.get(batch.id) || 0} Files</p>
            </motion.button>
          ))}

          {!loadingFolders && userRole === 'student' && studentSubjects.map((subject) => (
            <motion.button
              key={subject}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setSearchQuery('');
                setSortBy('newest');
                setSelectedSubject(subject);
              }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 flex flex-col items-center text-center cursor-pointer group hover:border-teal-200 transition-all"
            >
              <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <BookOpen className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{subject}</h3>
              <p className="text-sm text-gray-500">{items.filter((item) => item.subject_name === subject).length} Files</p>
            </motion.button>
          ))}
        </div>
      )}

      {!isListView && !loadingFolders && (
        ((userRole === 'faculty' && facultyBatches.length === 0) || (userRole === 'student' && studentSubjects.length === 0))
      ) && (
        <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Folder className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No content found</h3>
          <p className="text-gray-500">
            {userRole === 'faculty'
              ? 'No accessible batches or published files are available yet.'
              : 'No question bank files are available for your batch yet.'}
          </p>
        </div>
      )}

      {isListView && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadingItems && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}

          {!loadingItems && items.map((item) => {
            const deleteKey = selectedBatch ? `${item.id}:${selectedBatch.id}` : item.id;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 group hover:shadow-xl transition-all cursor-pointer"
                onClick={() => window.open(item.file_url, '_blank', 'noopener,noreferrer')}
                title="Click to open"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                    <FileText className="w-7 h-7 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-bold text-gray-900 truncate text-lg">{item.title}</h4>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getDifficultyClasses(item.difficulty)}`}>
                        {formatDifficulty(item.difficulty)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-gray-400 font-medium truncate">
                        {formatDate(item.created_at)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={(event) => void handleDownload(item, event)}
                          disabled={downloadingId === item.id}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors shadow-sm bg-white border border-gray-100 disabled:opacity-60"
                          title="Download"
                        >
                          {downloadingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>
                        {userRole === 'faculty' && selectedBatch && (
                          <button
                            onClick={(event) => void handleDelete(item, event)}
                            disabled={deletingKey === deleteKey}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white border border-gray-100 disabled:opacity-60"
                            title="Delete from this batch"
                          >
                            {deletingKey === deleteKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {!loadingItems && items.length === 0 && (
            <div className="md:col-span-2 py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No files found</h3>
              <p className="text-gray-500">Try adjusting your search or sorting.</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {isAddModalOpen && userRole === 'faculty' && (
          <QuestionBankUploadModal
            userSubject={userSubject || ''}
            availableBatches={facultyBatches}
            onClose={() => setIsAddModalOpen(false)}
            onUploaded={async () => {
              setIsAddModalOpen(false);
              if (selectedBatch) {
                await loadList();
              } else {
                await loadFolders();
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionBankUploadModal({
  userSubject,
  availableBatches,
  onClose,
  onUploaded,
}: {
  userSubject: string;
  availableBatches: ApiQuestionBankBatchSummary[];
  onClose: () => void;
  onUploaded: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const isFormValid = title.trim().length > 0 && selectedBatchIds.length > 0 && !!selectedFile;
  const allowedMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
  ]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileSelection = (fileList?: FileList | null) => {
    const nextFile = fileList?.[0];
    if (!nextFile) return;
    if (!allowedMimeTypes.has(nextFile.type)) {
      setSelectedFile(null);
      setUploadError('Unsupported file format. Allowed formats: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG.');
      return;
    }
    if (nextFile.size > 50 * 1024 * 1024) {
      setSelectedFile(null);
      setUploadError('File is too large. Maximum allowed size is 50MB.');
      return;
    }
    setUploadError('');
    setSelectedFile(nextFile);
  };

  const toggleBatch = (batchId: string) => {
    setUploadError('');
    setSelectedBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((value) => value !== batchId) : [...prev, batchId]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormValid || !selectedFile) return;

    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('difficulty', difficulty);
      selectedBatchIds.forEach((batchId) => formData.append('batch_ids', batchId));
      formData.append('file', selectedFile);
      await apiUploadQuestionBank(formData);
      await onUploaded();
    } catch (error: any) {
      console.error(error);
      setUploadError(error.message || 'Failed to upload question bank file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-layer-10001">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-blue-600 text-white flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Add to Question Bank</h3>
            <p className="text-teal-50 text-sm opacity-90">Upload one file and publish it to selected batches</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {uploadError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {uploadError}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              File Information
            </h2>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setUploadError('');
                    }}
                    placeholder="e.g., Electrostatics Practice Sheet 01"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty *</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    {(['easy', 'medium', 'hard'] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDifficulty(value)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          difficulty === value ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {formatDifficulty(value)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-bold">
                    {userSubject || 'Mapped from faculty profile'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Publish to Batches *</label>
                <div className="flex flex-wrap gap-2">
                  {availableBatches.map((batch) => (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => toggleBatch(batch.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedBatchIds.includes(batch.id)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {batch.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Upload File
            </h2>

            {!selectedFile && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDragActive(false);
                  handleFileSelection(event.dataTransfer.files);
                }}
                className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
              >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                    onChange={(event) => handleFileSelection(event.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop your file here or click to browse</h3>
                  <p className="text-sm text-gray-600 mb-4">Upload exactly one file for the question bank</p>
                  <p className="text-xs text-gray-500">Single file only, up to 50MB</p>
                </div>
              </div>
            )}

            {selectedFile && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Selected File</h3>
                <motion.div
                  key={selectedFile.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-100"
                >
                  <div className="flex-shrink-0">{getFileIcon(selectedFile.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-600">{formatFileSize(selectedFile.size)}</p>
                  </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadError('');
                      }}
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                    >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || uploading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {uploading ? 'Uploading...' : 'Upload Content'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
