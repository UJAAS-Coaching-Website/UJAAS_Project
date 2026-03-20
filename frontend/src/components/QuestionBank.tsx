import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronDown,
  Download,
  FileText,
  Folder,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useIsMobileViewport } from '../hooks/useViewport';
import {
  apiDeleteQuestionBankFromBatch,
  apiFetchQuestionBank,
  type ApiQuestionBankBatchSummary,
  type ApiQuestionBankFile,
} from '../api/questionBank';
import { QuestionBankUploadModal } from './question-bank/QuestionBankUploadModal';

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
  const isMobileViewport = useIsMobileViewport();
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
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 ${isMobileViewport ? 'p-5' : 'p-8'} rounded-3xl shadow-xl text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <h2 className={`${isMobileViewport ? 'text-[2rem]' : 'text-3xl'} font-bold tracking-tight`}>Question Bank</h2>
          <p className={`${isMobileViewport ? 'text-sm' : 'text-base'} text-teal-50/90 font-medium`}>
            {userRole === 'faculty'
              ? 'Publish subject-wise question sheets batch by batch'
              : 'Choose a subject and start practicing instantly'}
          </p>
        </div>
        {userRole === 'faculty' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`${isMobileViewport ? 'px-4 py-2 text-sm rounded-xl' : 'px-6 py-3 rounded-2xl'} bg-white text-teal-600 font-bold shadow-lg hover:bg-teal-50 transition flex items-center gap-2 relative z-10`}
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
              className="flex items-center text-teal-600 text-sm font-semibold hover:underline shrink-0 mt-1"
              aria-label="Go back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h3 className={`${isMobileViewport ? 'text-lg' : 'text-xl'} font-bold text-gray-900 break-words`}>{listTitle}</h3>
              <p className={`${isMobileViewport ? 'text-xs' : 'text-sm'} text-gray-500`}>{listSubtitle}</p>
            </div>
          </div>

          <div className="flex items-stretch gap-3">
            <div
              className="relative min-w-0 flex-1"
              style={isMobileViewport ? { flex: '1 1 0%' } : undefined}
            >
              <Search
                className={`${isMobileViewport ? 'h-4 w-4' : 'left-3 w-4 h-4'} absolute top-1/2 -translate-y-1/2 text-gray-400`}
                style={isMobileViewport ? { left: '0.95rem' } : undefined}
              />
              <input
                type="text"
                placeholder={isMobileViewport ? 'Search' : 'Search by name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isMobileViewport ? 'h-14 rounded-2xl pr-3 text-sm placeholder:text-gray-400' : 'rounded-xl pl-11 pr-4 py-3'} w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white`}
                style={isMobileViewport ? { fontSize: '12px', lineHeight: '1.2', letterSpacing: '0em', paddingLeft: '2.2rem', textAlign: 'left' } : undefined}
              />
            </div>
            <div
              className={`${isMobileViewport ? 'relative flex-none' : 'relative w-52 flex-none'}`}
              style={isMobileViewport ? { width: '42%' } : undefined}
            >
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`${isMobileViewport ? 'h-14 rounded-2xl px-4 pr-10 text-sm' : 'px-4 pr-12 py-3 rounded-xl'} border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white w-full appearance-none`}
                style={isMobileViewport ? { fontSize: '12px', lineHeight: '1.2', paddingLeft: '1.9rem', paddingRight: '1.2rem' } : undefined}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown
                className={`${isMobileViewport ? 'h-4 w-4' : 'right-4 h-4 w-4'} pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-500`}
                style={isMobileViewport ? { left: '0.7rem' } : undefined}
              />
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
        <div className={`${isMobileViewport ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
          {loadingFolders && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`${isMobileViewport ? 'rounded-2xl p-4' : 'rounded-3xl p-8'} bg-white shadow-lg border border-gray-100 animate-pulse`}>
              <div className={`${isMobileViewport ? 'mb-4 h-12 w-12 rounded-xl' : 'mb-6 h-20 w-20 rounded-2xl'} bg-gray-100`} />
              <div className={`${isMobileViewport ? 'mb-2 h-4' : 'mb-2 h-6'} bg-gray-100 rounded w-3/4`} />
              <div className={`${isMobileViewport ? 'h-3' : 'h-4'} bg-gray-100 rounded w-1/2`} />
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
              className={`${isMobileViewport ? 'rounded-2xl p-4' : 'rounded-3xl p-8'} bg-white shadow-lg border border-gray-100 flex flex-col items-center text-center cursor-pointer group hover:border-teal-200 transition-all`}
            >
              <div className={`${isMobileViewport ? 'mb-4 h-12 w-12 rounded-xl' : 'mb-6 h-20 w-20 rounded-2xl'} bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-inner`}>
                <Folder className={`${isMobileViewport ? 'h-6 w-6' : 'h-10 w-10'}`} />
              </div>
              <h3 className={`${isMobileViewport ? 'text-sm' : 'text-xl'} font-bold text-gray-900 mb-2`}>{batch.name}</h3>
              <p className={`${isMobileViewport ? 'text-xs' : 'text-sm'} text-gray-500`}>{facultyCounts.get(batch.id) || 0} Files</p>
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
              className={`${isMobileViewport ? 'rounded-2xl p-4' : 'rounded-3xl p-8'} bg-white shadow-lg border border-gray-100 flex flex-col items-center text-center cursor-pointer group hover:border-teal-200 transition-all`}
            >
              <div className={`${isMobileViewport ? 'mb-4 h-12 w-12 rounded-xl' : 'mb-6 h-20 w-20 rounded-2xl'} bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-inner`}>
                <BookOpen className={`${isMobileViewport ? 'h-6 w-6' : 'h-10 w-10'}`} />
              </div>
              <h3 className={`${isMobileViewport ? 'text-sm' : 'text-xl'} font-bold text-gray-900 mb-2`}>{subject}</h3>
              <p className={`${isMobileViewport ? 'text-xs' : 'text-sm'} text-gray-500`}>{items.filter((item) => item.subject_name === subject).length} Files</p>
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
                      <h4 className={`font-bold text-gray-900 truncate ${isMobileViewport ? 'text-base' : 'text-lg'}`}>{item.title}</h4>
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
