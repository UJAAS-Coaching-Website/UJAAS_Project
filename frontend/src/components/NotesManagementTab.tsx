import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Calendar, Plus,
  Upload, Folder, Trash2, Download, FileText, ClipboardList, BookOpen, X, Megaphone, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { apiFetchChapters, apiCreateChapter, apiDeleteChapter, ApiChapter } from '../api/chapters';
import { apiFetchNotes, apiDeleteNote, ApiNote } from '../api/notes';
import { fetchDpps, deleteDpp, fetchDppAttemptResult, fetchDppAnalysis, fetchDppById, fetchMyDppAttemptSummary, startMyDppAttempt, type ApiDpp, type ApiDppAnalysis } from '../api/dpps';
import { createBatchNotification } from '../api/batches';
import { DppPerformanceInsights } from './DppPerformanceInsights';
import { TestTaking } from './TestTaking';
import { ChapterCardSkeleton, DppCardSkeleton, NoteCardSkeleton, TableRowsSkeleton } from './ui/content-skeletons';

// Type stubs that reflect the app
type Tab = any;
type BatchInfo = any;

const formatRelativeTime = (dateString: string) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 30) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  return date.toLocaleDateString();
};

interface NotesManagementTabProps {
  onNavigate: (t: Tab) => void;
  currentTab?: string;
  selectedBatch: string | null;
  onChangeBatch: () => void;
  onViewTimetable: () => void;
  facultySubject?: string | null;
  batches: BatchInfo[];
  readOnly?: boolean;
  variant?: 'admin' | 'faculty' | 'student';
  onUpdateBatch?: (label: string, subjects?: string[], facultyAssigned?: string[], oldLabel?: string) => { ok: boolean; error?: string };
  headerMode?: 'full' | 'tracker-only' | 'hidden';
}

const NOTES_RETURN_CONTEXT_KEY = 'ujaasNotesReturnContext';
const ACTIVE_DPP_SESSION_KEY = 'ujaasActiveDppSession';

function parseDppCorrectAnswer(type: string, correctAnswer: string) {
  if (type === 'MCQ') {
    return Number(correctAnswer);
  }

  if (type === 'MSQ') {
    try {
      const parsed = JSON.parse(correctAnswer);
      return Array.isArray(parsed) ? parsed.map((value) => Number(value)).filter(Number.isFinite) : [];
    } catch {
      return [];
    }
  }

  return correctAnswer;
}

async function preloadDppAssets(questions: ApiDpp['questions']) {
  const imageSources = (questions || []).flatMap((question) => [
    question.question_img,
    question.explanation_img,
    ...(question.option_imgs || []),
  ]).filter((value): value is string => Boolean(value));

  await Promise.all(imageSources.map((src) => {
    if (src.startsWith('data:')) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = src;
    });
  }));
}

export function NotesManagementTab({
  onNavigate,
  currentTab,
  selectedBatch,
  onChangeBatch,
  onViewTimetable,
  facultySubject,
  batches,
  readOnly = false,
  variant = 'student',
  onUpdateBatch,
  headerMode = 'full'
}: NotesManagementTabProps) {
  const [currentView, setCurrentView] = useState<'root' | 'subject' | 'chapter'>('root');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // API Models
  const [apiChapters, setApiChapters] = useState<ApiChapter[]>([]);
  const [apiNotes, setApiNotes] = useState<ApiNote[]>([]);
  const [apiDpps, setApiDpps] = useState<ApiDpp[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingDpps, setLoadingDpps] = useState(false);

  // Chapter State Reference
  const [selectedChapterObj, setSelectedChapterObj] = useState<ApiChapter | null>(null);
  const [activeContentType, setActiveContentType] = useState<'notes' | 'dpps'>('notes');
  const [loadingDppId, setLoadingDppId] = useState<string | null>(null);
  const [previewingDppId, setPreviewingDppId] = useState<string | null>(null);
  const [analyticsLoadingDppId, setAnalyticsLoadingDppId] = useState<string | null>(null);
  const [analyticsDpp, setAnalyticsDpp] = useState<{ id: string; title: string; analysis: ApiDppAnalysis } | null>(null);
  const [previewDpp, setPreviewDpp] = useState<ApiDpp | null>(null);

  const defaultSubjects = [
    { name: 'Physics', color: '#3b82f6' },
    { name: 'Chemistry', color: '#10b981' },
    { name: 'Mathematics', color: '#f59e0b' },
    { name: 'Biology', color: '#f43f5e' },
  ];

  const extraColors = ['#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];

  const currentBatch = batches.find(b => b.label === selectedBatch);
  const isCurrentBatchActive = currentBatch?.is_active !== false;
  const batchSubjects = currentBatch?.subjects || [];

  const subjects = batchSubjects.map((subName: string, index: number) => {
    const existing = defaultSubjects.find((s: { name: string; color: string }) => s.name === subName);
    if (existing) return { id: `sub-${index}`, name: subName, color: existing.color };
    const color = extraColors[index % extraColors.length];
    return { id: `sub-${index}`, name: subName, color };
  });

  // Modals
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isUploadNoticeModalOpen, setIsUploadNoticeModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [isSendingNotice, setIsSendingNotice] = useState(false);

  useBodyScrollLock(isAddChapterModalOpen || isAddSubjectModalOpen || isUploadNoticeModalOpen);

  const facultyMatchesSubject = !facultySubject || (selectedSubject && selectedSubject.toLowerCase() === facultySubject.toLowerCase());
  const canManageStructure = !readOnly && isCurrentBatchActive && variant === 'admin';
  const canManageContent = !readOnly && isCurrentBatchActive && variant === 'faculty' && facultyMatchesSubject;

  useEffect(() => {
    if (!selectedBatch) return;

    try {
      const raw = localStorage.getItem(NOTES_RETURN_CONTEXT_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw) as {
        batchLabel?: string;
        selectedSubject?: string;
        chapterId?: string;
        chapterName?: string;
        currentView?: 'root' | 'subject' | 'chapter';
        activeContentType?: 'notes' | 'dpps';
      };

      if (saved.batchLabel !== selectedBatch) return;

      if (saved.selectedSubject) {
        setSelectedSubject(saved.selectedSubject);
      }

      if (saved.chapterId && saved.chapterName && saved.currentView === 'chapter' && currentBatch?.id) {
        setSelectedChapterObj({
          id: saved.chapterId,
          batch_id: currentBatch.id,
          subject_name: saved.selectedSubject || '',
          name: saved.chapterName,
          order_index: 0,
          created_at: new Date().toISOString(),
        });
      } else {
        setSelectedChapterObj(null);
      }

      setCurrentView(saved.currentView || 'root');
      setActiveContentType(saved.activeContentType || 'notes');
      localStorage.removeItem(NOTES_RETURN_CONTEXT_KEY);
    } catch (error) {
      console.error('Failed to restore notes context', error);
      localStorage.removeItem(NOTES_RETURN_CONTEXT_KEY);
    }
  }, [selectedBatch, currentBatch?.id]);

  // Load backend chapters whenever we view a subject
  useEffect(() => {
    if (selectedSubject && currentBatch?.id) {
      setLoadingChapters(true);
      setApiChapters([]);
      apiFetchChapters(currentBatch.id, selectedSubject)
        .then(setApiChapters)
        .catch(console.error)
        .finally(() => setLoadingChapters(false));
    }
  }, [selectedSubject, currentBatch?.id]);

  // Load backend notes whenever we view a chapter
  useEffect(() => {
    if (selectedChapterObj?.id && activeContentType === 'notes') {
      setLoadingNotes(true);
      setApiNotes([]);
      apiFetchNotes(selectedChapterObj.id)
        .then(setApiNotes)
        .catch(console.error)
        .finally(() => setLoadingNotes(false));
    }
  }, [selectedChapterObj?.id, activeContentType]);

  useEffect(() => {
    if (selectedChapterObj?.id && activeContentType === 'dpps') {
      setLoadingDpps(true);
      setApiDpps([]);
      fetchDpps(selectedChapterObj.id)
        .then(setApiDpps)
        .catch(console.error)
        .finally(() => setLoadingDpps(false));
    }
  }, [selectedChapterObj?.id, activeContentType]);

  const handleAddChapter = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !canManageContent || !currentBatch?.id) return;
    if (newChapterName.trim()) {
      try {
        const newChapter = await apiCreateChapter({
          batch_id: currentBatch.id,
          subject_name: selectedSubject,
          name: newChapterName.trim(),
          order_index: apiChapters.length
        });
        setApiChapters([...apiChapters, newChapter]);
        setNewChapterName('');
        setIsAddChapterModalOpen(false);
      } catch (err: any) {
        console.error(err);
        alert(err?.message || 'Failed to create chapter.');
      }
    }
  };

  const handleDeleteChapter = async (chapter: ApiChapter) => {
    if (!canManageContent) return;
    if (confirm(`Are you sure you want to delete the chapter "${chapter.name}"?`)) {
      try {
        await apiDeleteChapter(chapter.id);
        setApiChapters(apiChapters.filter(c => c.id !== chapter.id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete chapter');
      }
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!canManageContent) return;
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await apiDeleteNote(id);
        setApiNotes(apiNotes.filter(n => n.id !== id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete note');
      }
    }
  };

  const handleForceDownload = async (e: any, url: string, filename: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Direct download failed. Opening file instead.');
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteDPP = async (id: string) => {
    if (!canManageContent) return;
    if (confirm('Are you sure you want to delete this DPP?')) {
      try {
        await deleteDpp(id);
        setApiDpps((prev) => prev.filter((dpp) => dpp.id !== id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete DPP');
      }
    }
  };

  const handleDeleteSubject = async (subjectName: string) => {
    if (!canManageStructure || !selectedBatch || !onUpdateBatch || !currentBatch) return;

    if (window.confirm(`Are you sure you want to delete the subject "${subjectName}" from this batch? This will NOT delete any content (notes/DPPs) but will remove the subject association for this batch.`)) {
      try {
        const nextSubjects = batchSubjects.filter((s: string) => s !== subjectName);
        const assigned = currentBatch.facultyAssigned ?? [];

        // Find faculty assigned to this subject in this batch (if any) and remove them too
        // We need to look up faculty by subject
        const result = onUpdateBatch(selectedBatch, nextSubjects, assigned);

        if (result.ok) {
          toast.success(`Subject "${subjectName}" removed successfully.`);
          // The component should re-render because batches/selectedBatch/currentBatch likely changes via parent state
        } else {
          toast.error(result.error || 'Failed to remove subject.');
        }
      } catch (err: any) {
        console.error(err);
        toast.error('An error occurred while removing the subject.');
      }
    }
  };

  const handleAddSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManageStructure || !selectedBatch || !onUpdateBatch || !currentBatch) return;

    const name = newSubjectName.trim();
    if (!name) return;

    if (batchSubjects.includes(name)) {
      toast.error(`Subject "${name}" already exists in this batch.`);
      return;
    }

    try {
      const nextSubjects = [...batchSubjects, name];
      const assigned = currentBatch.facultyAssigned ?? [];

      const result = onUpdateBatch(selectedBatch, nextSubjects, assigned);

      if (result.ok) {
        toast.success(`Subject "${name}" added successfully.`);
        setNewSubjectName('');
        setIsAddSubjectModalOpen(false);
      } else {
        toast.error(result.error || 'Failed to add subject.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('An error occurred while adding the subject.');
    }
  };

  const handleUploadNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManageStructure || !selectedBatch || !currentBatch) return;

    const title = noticeTitle.trim();
    const message = noticeMessage.trim();
    if (!title || !message) {
      toast.error('Please fill in both title and message.');
      return;
    }

    setIsSendingNotice(true);
    try {
      await createBatchNotification(currentBatch.id!, { title, message });
      toast.success('Notice sent successfully to all users in this batch.');
      setNoticeTitle('');
      setNoticeMessage('');
      setIsUploadNoticeModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to send notice.');
    } finally {
      setIsSendingNotice(false);
    }
  };

  const navigateToSubject = (subject: string) => { setSelectedSubject(subject); setCurrentView('subject'); };
  const navigateToChapter = (chapter: ApiChapter) => { setSelectedChapterObj(chapter); setCurrentView('chapter'); setActiveContentType('notes'); };
  const goBack = () => { if (currentView === 'chapter') { setCurrentView('subject'); setSelectedChapterObj(null); } else if (currentView === 'subject') { setCurrentView('root'); setSelectedSubject(null); } };

  const handleAttemptDpp = async (dppId: string) => {
    try {
      setLoadingDppId(dppId);
      const payload = await startMyDppAttempt(dppId);
      await preloadDppAssets(payload.dpp.questions);
      localStorage.setItem(NOTES_RETURN_CONTEXT_KEY, JSON.stringify({
        returnTab: currentTab || 'home',
        batchLabel: selectedBatch,
        selectedSubject,
        chapterId: selectedChapterObj?.id,
        chapterName: selectedChapterObj?.name,
        currentView,
        activeContentType,
      }));

      if (variant === 'student') {
        sessionStorage.setItem(ACTIVE_DPP_SESSION_KEY, JSON.stringify({
          mode: 'attempt',
          payload,
        }));
        onNavigate('home', 'dpp');
        return;
      }
    } catch (error: any) {
      alert(error?.message || 'Unable to start DPP');
    } finally {
      setLoadingDppId(null);
    }
  };

  const handlePreviewDpp = async (dppId: string) => {
    try {
      setPreviewingDppId(dppId);
      const summary = await fetchMyDppAttemptSummary(dppId);
      const latestAttempt = summary.history[0];
      if (!latestAttempt) return;

      const result = await fetchDppAttemptResult(latestAttempt.id);
      localStorage.setItem(NOTES_RETURN_CONTEXT_KEY, JSON.stringify({
        returnTab: currentTab || 'home',
        batchLabel: selectedBatch,
        selectedSubject,
        chapterId: selectedChapterObj?.id,
        chapterName: selectedChapterObj?.name,
        currentView,
        activeContentType,
      }));
      sessionStorage.setItem(ACTIVE_DPP_SESSION_KEY, JSON.stringify({
        mode: 'result',
        result,
        history: summary.history,
        reviewOpen: false,
      }));
      onNavigate('home', 'dpp');
    } catch (error: any) {
      alert(error?.message || 'Unable to open DPP preview');
    } finally {
      setPreviewingDppId(null);
    }
  };

  const handleOpenAdminFacultyPreview = async (dppId: string) => {
    try {
      setPreviewingDppId(dppId);
      const dpp = await fetchDppById(dppId);
      setPreviewDpp(dpp);
    } catch (error: any) {
      alert(error?.message || 'Unable to open DPP preview');
    } finally {
      setPreviewingDppId(null);
    }
  };

  const handleOpenDppAnalytics = async (dppId: string, title: string) => {
    try {
      setAnalyticsLoadingDppId(dppId);
      const analysis = await fetchDppAnalysis(dppId);
      setAnalyticsDpp({ id: dppId, title, analysis });
    } catch (error: any) {
      alert(error?.message || 'Unable to open DPP analytics');
    } finally {
      setAnalyticsLoadingDppId(null);
    }
  };

  if (analyticsDpp) {
    return (
      <DppPerformanceInsights
        dppId={analyticsDpp.id}
        dppTitle={analyticsDpp.title}
        initialAnalysis={analyticsDpp.analysis}
        onClose={() => setAnalyticsDpp(null)}
      />
    );
  }

  if (previewDpp) {
    return (
      <TestTaking
        testId={previewDpp.id}
        testTitle={previewDpp.title}
        duration={0}
        questions={(previewDpp.questions || []).map((question) => ({
          id: question.id,
          question: question.question_text,
          options: question.options || undefined,
          optionImages: question.option_imgs || undefined,
          questionImage: question.question_img || undefined,
          correctAnswer: parseDppCorrectAnswer(question.type, question.correct_answer),
          subject: question.subject,
          marks: question.marks,
          type: question.type,
          explanation: question.explanation || undefined,
          explanationImage: question.explanation_img || undefined,
          metadata: { section: question.section || undefined },
        })) as any}
        onSubmit={() => {}}
        onExit={() => setPreviewDpp(null)}
        initialAnswers={{}}
        initialTimeSpent={0}
        isPreview={variant === 'admin'}
        isFacultyPreview={variant === 'faculty'}
        disableEditing={true}
        hideExplanations={false}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Area */}
      {headerMode !== 'hidden' && (headerMode === 'full' || currentView !== 'root') && (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${variant === 'admin' ? 'bg-white rounded-2xl p-4 border border-gray-100' : 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {currentView !== 'root' && (<button onClick={goBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-700" /></button>)}
            <div>
              {headerMode === 'full' ? (
                currentView === 'root' ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className={`font-bold text-gray-900 ${variant === 'admin' ? 'text-xl' : 'text-2xl'}`}>
                      Academic Content
                    </h2>
                  </div>
                ) : (
                  <h2 className={`font-bold text-gray-900 ${variant === 'admin' ? 'text-xl' : 'text-2xl'}`}>
                    {selectedSubject}
                  </h2>
                )
              ) : (
                <h2 className="font-bold text-gray-900 text-lg">
                  {currentView === 'subject' ? selectedSubject : selectedChapterObj?.name}
                </h2>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {selectedSubject && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className={currentView === 'subject' ? 'text-teal-600 font-semibold' : ''}>{selectedSubject}</span>
                  </>
                )}
                {selectedChapterObj && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className={currentView === 'chapter' ? 'text-teal-600 font-semibold' : ''}>{selectedChapterObj.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {headerMode === 'full' && (
          <div className="flex items-center gap-3">
            {currentView === 'root' && (
              <>
                <button onClick={onViewTimetable} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition font-bold shadow-sm text-sm">
                  <Calendar className="w-4 h-4" />Time Table
                </button>
                {variant === 'admin' && isCurrentBatchActive && (
                  <>
                    <button onClick={() => setIsAddSubjectModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-100 transition font-bold shadow-sm text-sm">
                      <Plus className="w-4 h-4" />Add Subject
                    </button>
                    <button onClick={() => setIsUploadNoticeModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition font-bold shadow-sm text-sm">
                      <Megaphone className="w-4 h-4" />Upload Notice
                    </button>
                  </>
                )}
              </>
            )}
            {currentView === 'subject' && canManageContent && (<button onClick={() => setIsAddChapterModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition shadow-md font-bold"><Plus className="w-5 h-5" />Add Chapter</button>)}
            {currentView === 'chapter' && canManageContent && (
              <div className="flex items-center gap-3">
                <button onClick={() => {
                  localStorage.setItem('uploadTargetChapterId', selectedChapterObj!.id);
                  localStorage.setItem('uploadTargetChapterName', selectedChapterObj!.name);
                  localStorage.setItem(NOTES_RETURN_CONTEXT_KEY, JSON.stringify({
                    batchLabel: selectedBatch,
                    selectedSubject,
                    chapterId: selectedChapterObj!.id,
                    chapterName: selectedChapterObj!.name,
                    currentView,
                    activeContentType,
                  }));
                  onNavigate('upload-notes');
                }} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition shadow-md font-bold"><Upload className="w-5 h-5" />Upload Notes</button>
                <button onClick={() => {
                  localStorage.setItem('createDppTargetChapterId', selectedChapterObj!.id);
                  localStorage.setItem('createDppTargetChapterName', selectedChapterObj!.name);
                  localStorage.setItem(NOTES_RETURN_CONTEXT_KEY, JSON.stringify({
                    batchLabel: selectedBatch,
                    selectedSubject,
                    chapterId: selectedChapterObj!.id,
                    chapterName: selectedChapterObj!.name,
                    currentView,
                    activeContentType,
                  }));
                  onNavigate('create-dpp');
                }} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition shadow-md font-bold"><Plus className="w-5 h-5" />Create DPP</button>
              </div>
            )}
          </div>
          )}
        </div>
      </motion.div>
      )}

      {!isCurrentBatchActive && headerMode === 'full' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          This batch is inactive. Content can still be viewed, but management actions are hidden.
        </div>
      )}

      {currentView === 'root' && (
        <div className={`grid gap-6 ${variant === 'admin' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
          {subjects.map((sub: { id: string; name: string; color: string }, index: number) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigateToSubject(sub.name)}
              className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white flex flex-col items-center gap-4 group cursor-pointer hover:shadow-xl transition-all relative"
            >
              {variant === 'admin' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSubject(sub.name);
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
                  title="Delete Subject"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div
                className="w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform text-white"
                style={{ backgroundColor: sub.color }}
              >
                <Folder className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-gray-900">{sub.name}</h4>
              </div>
            </motion.div>
          ))}
          {subjects.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No subjects assigned yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Subject View: Chapter List */}
      {currentView === 'subject' && selectedSubject && (
        <div className={(variant === 'admin' || variant === 'faculty') ? 'bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
          {loadingChapters && (variant === 'admin' || variant === 'faculty') && <TableRowsSkeleton rows={5} columns={3} />}
          {loadingChapters && variant === 'student' && (
            <>
              {Array.from({ length: 6 }).map((_, index) => (
                <ChapterCardSkeleton key={`chapter-card-skeleton-${index}`} />
              ))}
            </>
          )}
          {(variant === 'admin' || variant === 'faculty') && apiChapters.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-6 font-bold text-gray-700 text-sm">Chapter Name</th>
                    <th className="py-4 px-6 font-bold text-gray-700 text-sm">Last Updated</th>
                    <th className="py-4 pl-6 pr-8 font-bold text-gray-700 text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {apiChapters.map((chapter) => (
                    <tr
                      key={chapter.id}
                      onClick={() => navigateToChapter(chapter)}
                      className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors">
                            <Folder className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-gray-900">{chapter.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">{formatRelativeTime(chapter.created_at)}</td>
                      <td className="py-4 pl-6 pr-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          {canManageContent && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteChapter(chapter); }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50"
                              aria-label={`Delete ${chapter.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 transition-colors group-hover:bg-teal-50 group-hover:text-teal-600">
                            <ChevronRight className="w-5 h-5" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {variant === 'student' && !loadingChapters && apiChapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white flex items-center justify-between group cursor-pointer"
              onClick={() => navigateToChapter(chapter)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-gradient-to-r from-cyan-600 to-blue-600 transition-colors text-cyan-600 group-hover:text-white">
                  <Folder className="w-5 h-5" />
                </div>
                <span className="font-bold text-gray-900 block">{chapter.name || `Chapter ${index + 1}`}</span>
              </div>
              <div className="flex items-center gap-2">
                {canManageContent && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChapter(chapter);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-600 transition-colors" />
              </div>
            </motion.div>
          ))}

          {!loadingChapters && apiChapters.length === 0 && (
            <div className="col-span-full py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No chapters exist for this subject. {canManageContent ? 'Create the first one!' : ''}</p>
            </div>
          )}
        </div>
      )}

      {currentView === 'chapter' && selectedChapterObj && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100">
            {[
              { id: 'notes', label: 'Study Notes', icon: FileText },
              { id: 'dpps', label: 'Practice DPPs', icon: ClipboardList }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveContentType(tab.id as any)}
                className={`pb-4 px-6 text-sm font-bold transition-all relative flex items-center gap-2 ${activeContentType === tab.id ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeContentType === tab.id && (<motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 to-blue-600 rounded-t-full" />)}
              </button>
            ))}
          </div>

          <div className={(variant === 'admin' || variant === 'faculty') ? 'bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm' : 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}>
            {activeContentType === 'notes' ? (
              loadingNotes ? (
                (variant === 'admin' || variant === 'faculty') ? (
                  <TableRowsSkeleton rows={5} columns={3} />
                ) : (
                  Array.from({ length: 6 }).map((_, index) => (
                    <NoteCardSkeleton key={`note-skeleton-${index}`} />
                  ))
                )
              ) : (variant === 'admin' || variant === 'faculty') && apiNotes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-100 bg-gray-50/50">
                        <th className="py-4 px-6 font-bold text-gray-700 text-sm">File Name</th>
                        <th className="py-4 px-6 font-bold text-gray-700 text-sm">Upload Date</th>
                        <th className="py-4 px-6 font-bold text-gray-700 text-sm text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {apiNotes.map((item) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-teal-50/30 transition-colors group cursor-pointer"
                          onClick={() => window.open(item.file_url, '_blank', 'noopener,noreferrer')}
                          title="click to open"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-gray-900">{item.title}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={(e) => handleForceDownload(e, item.file_url, item.title)}
                                className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {canManageContent && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNote(item.id);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                apiNotes.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white group cursor-pointer"
                    onClick={() => window.open(item.file_url, '_blank', 'noopener,noreferrer')}
                    title="click to open"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg"><FileText className="w-6 h-6" /></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate mb-1">{item.title}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => handleForceDownload(e, item.file_url, item.title)}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {canManageContent && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNote(item.id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )
            ) : (
              loadingDpps ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <DppCardSkeleton key={`dpp-skeleton-${index}`} />
                ))
              ) : apiDpps.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={`rounded-2xl border border-white bg-white/80 p-5 shadow-lg transition-opacity ${
                    previewingDppId === item.id ? 'cursor-wait opacity-70' : variant !== 'student' ? 'cursor-pointer' : ''
                  }`}
                  onClick={variant !== 'student' ? () => { void handleOpenAdminFacultyPreview(item.id); } : undefined}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                          {item.subject_name}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                          {item.question_count} Questions
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.chapter_name} • {new Date(item.created_at).toLocaleDateString()}
                      </p>
                      {variant === 'student' && (
                        <p className="mt-3 text-sm text-gray-600">
                          Attempts: {item.submitted_attempt_count || 0}/{item.max_attempts || 3}
                        </p>
                      )}
                      {variant !== 'student' && previewingDppId === item.id && (
                        <p className="mt-3 text-sm font-semibold text-blue-600">
                          Opening preview...
                        </p>
                      )}
                    </div>
                    <div className="flex items-center self-center gap-2">
                      {variant === 'student' ? (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleAttemptDpp(item.id)}
                            disabled={loadingDppId === item.id || (item.submitted_attempt_count || 0) >= (item.max_attempts || 3)}
                            className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {loadingDppId === item.id ? 'Loading...' : (item.submitted_attempt_count || 0) > 0 ? 'Re-attempt' : 'Attempt'}
                          </button>
                          {(item.submitted_attempt_count || 0) > 0 && (
                            <button
                              onClick={() => handlePreviewDpp(item.id)}
                              disabled={previewingDppId === item.id}
                              className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 font-bold text-teal-700 transition hover:bg-teal-100 disabled:cursor-wait disabled:opacity-60"
                            >
                              {previewingDppId === item.id ? 'Opening...' : 'Preview'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleOpenDppAnalytics(item.id, item.title);
                          }}
                          disabled={analyticsLoadingDppId === item.id}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          {analyticsLoadingDppId === item.id ? 'Loading...' : 'Analytics'}
                        </button>
                      )}
                      {canManageContent && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteDPP(item.id);
                          }}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Delete DPP"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            {!loadingNotes && activeContentType === 'notes' && apiNotes.length === 0 && (
              <div className="col-span-full py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No files found for this category.</p>
              </div>
            )}
            {!loadingDpps && activeContentType === 'dpps' && apiDpps.length === 0 && (
              <div className="col-span-full py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No DPPs found for this chapter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Chapter Modal */}
      <AnimatePresence>
        {isAddChapterModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-layer-modal">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAddChapterModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 leading-relaxed"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
                <h3 className="text-xl font-bold">Add New Chapter</h3>
                <p className="text-teal-50 text-sm opacity-90">Adding to {selectedSubject} folder</p>
              </div>
              <form onSubmit={handleAddChapter} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Chapter Name</label>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    placeholder="e.g., Rotation Mechanics"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddChapterModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                  >
                    Create Folder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Add Subject Modal */}
      <AnimatePresence>
        {isAddSubjectModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-layer-modal">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAddSubjectModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 leading-relaxed"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
                <h3 className="text-xl font-bold">Add New Subject</h3>
                <p className="text-teal-50 text-sm opacity-90">Adding to {selectedBatch} batch</p>
              </div>
              <form onSubmit={handleAddSubject} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Subject Name</label>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g., Mathematics"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                  >
                    Add Subject
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Upload Notice Modal */}
      <AnimatePresence>
        {isUploadNoticeModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-layer-modal">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsUploadNoticeModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 leading-relaxed"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Megaphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Upload Notice</h3>
                    <p className="text-purple-50 text-sm opacity-90">Send to all users in {selectedBatch}</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleUploadNotice} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Notice Title</label>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="e.g., Important: Class Rescheduled"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Message Content</label>
                  <textarea
                    required
                    value={noticeMessage}
                    onChange={(e) => setNoticeMessage(e.target.value)}
                    placeholder="Type your notice message here..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSendingNotice}
                    onClick={() => setIsUploadNoticeModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingNotice}
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSendingNotice ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : 'Send Notice'}
                  </button>
                </div>
              </form>

              {/* Loading Overlay */}
              <AnimatePresence>
                {isSendingNotice && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">Sending Notice</h4>
                    <p className="text-gray-500">Please wait while we notify everyone in the batch...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
