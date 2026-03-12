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
import { createBatchNotification } from '../api/batches';

// Type stubs that reflect the app
type Tab = any;
type BatchInfo = any;

interface NotesManagementTabProps {
  onNavigate: (t: Tab) => void;
  selectedBatch: string | null;
  onChangeBatch: () => void;
  onViewTimetable: () => void;
  facultySubject?: string | null;
  batches: BatchInfo[];
  readOnly?: boolean;
  variant?: 'admin' | 'faculty' | 'student';
  onUpdateBatch?: (label: string, subjects?: string[], facultyAssigned?: string[], oldLabel?: string) => { ok: boolean; error?: string };
}

export function NotesManagementTab({
  onNavigate,
  selectedBatch,
  onChangeBatch,
  onViewTimetable,
  facultySubject,
  batches,
  readOnly = false,
  variant = 'student',
  onUpdateBatch
}: NotesManagementTabProps) {
  const [currentView, setCurrentView] = useState<'root' | 'subject' | 'chapter'>('root');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // API Models
  const [apiChapters, setApiChapters] = useState<ApiChapter[]>([]);
  const [apiNotes, setApiNotes] = useState<ApiNote[]>([]);

  // Chapter State Reference
  const [selectedChapterObj, setSelectedChapterObj] = useState<ApiChapter | null>(null);
  const [activeContentType, setActiveContentType] = useState<'notes' | 'dpps'>('notes');

  const defaultSubjects = [
    { name: 'Physics', color: '#3b82f6' },
    { name: 'Chemistry', color: '#10b981' },
    { name: 'Mathematics', color: '#f59e0b' },
    { name: 'Biology', color: '#f43f5e' },
  ];

  const extraColors = ['#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];

  const currentBatch = batches.find(b => b.label === selectedBatch);
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

  // canEdit is true if NOT readOnly AND (admin OR matching faculty subject)
  const canEdit = !readOnly && (variant === 'admin' || !facultySubject || (selectedSubject && selectedSubject.toLowerCase() === facultySubject.toLowerCase()));

  // Wait, dpps are not API-backed yet. Let's keep a mock stub for now.
  const [dpps, setDpps] = useState([
    { id: 'd1', chapter: 'Kinematics', title: 'Kinematics DPP 01 - Basics', questions: 15, date: '2025-09-22', chapterId: 'dummy' }
  ]);

  // Load backend chapters whenever we view a subject
  useEffect(() => {
    if (selectedSubject && currentBatch?.id) {
      apiFetchChapters(currentBatch.id, selectedSubject)
        .then(setApiChapters)
        .catch(console.error);
    }
  }, [selectedSubject, currentBatch?.id]);

  // Load backend notes whenever we view a chapter
  useEffect(() => {
    if (selectedChapterObj?.id && activeContentType === 'notes') {
      apiFetchNotes(selectedChapterObj.id)
        .then(setApiNotes)
        .catch(console.error);
    }
  }, [selectedChapterObj?.id, activeContentType]);

  const handleAddChapter = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !canEdit || !currentBatch?.id) return;
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
    if (!canEdit) return;
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
    if (!canEdit) return;
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

  const handleDeleteDPP = (id: string) => {
    if (!canEdit) return;
    if (confirm('Are you sure you want to delete this DPP?')) {
      setDpps(dpps.filter(d => d.id !== id));
    }
  };

  const handleDeleteSubject = async (subjectName: string) => {
    if (!canEdit || !selectedBatch || !onUpdateBatch || !currentBatch) return;

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
    if (!canEdit || !selectedBatch || !onUpdateBatch || !currentBatch) return;

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
    if (!canEdit || !selectedBatch || !currentBatch) return;

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

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${variant === 'admin' ? 'bg-white rounded-2xl p-4 border border-gray-100' : 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {currentView !== 'root' && (<button onClick={goBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-700" /></button>)}
            <div>
              <h2 className={`font-bold text-gray-900 ${variant === 'admin' ? 'text-xl' : 'text-2xl'}`}>
                {currentView === 'root' ? 'Academic Content' : selectedSubject}
              </h2>
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
          <div className="flex items-center gap-3">
            {currentView === 'root' && (
              <>
                <button onClick={onViewTimetable} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition font-bold shadow-sm text-sm">
                  <Calendar className="w-4 h-4" />Time Table
                </button>
                {variant === 'admin' && (
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
            {currentView === 'subject' && canEdit && (<button onClick={() => setIsAddChapterModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition shadow-md font-bold text-sm"><Plus className="w-4 h-4" />Add Chapter</button>)}
            {currentView === 'chapter' && canEdit && (
              <div className="flex items-center gap-3">
                <button onClick={() => {
                  localStorage.setItem('uploadTargetChapterId', selectedChapterObj!.id);
                  localStorage.setItem('uploadTargetChapterName', selectedChapterObj!.name);
                  onNavigate('upload-notes');
                }} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition shadow-md font-bold text-sm"><Upload className="w-4 h-4" />Upload Notes</button>
                <button onClick={() => onNavigate('create-dpp')} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition shadow-md font-bold text-sm"><Plus className="w-4 h-4" />Create DPP</button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {currentView === 'root' && (
        <div className={`grid gap-6 ${variant === 'admin' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
          {subjects.map((sub: { id: string; name: string; color: string }, index: number) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigateToSubject(sub.name)}
              className={`${variant === 'admin'
                ? 'bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md flex items-center gap-4 cursor-pointer group transition-all'
                : 'bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white flex flex-col items-center gap-4 group cursor-pointer hover:shadow-xl transition-all'
                }`}
            >
              <div className={`${variant === 'admin'
                ? 'w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0'
                : 'w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform text-white'
                }`} style={{ backgroundColor: sub.color }}>
                <Folder className={`${variant === 'admin' ? 'w-6 h-6' : 'w-8 h-8'}`} />
              </div>
              <div className={variant === 'admin' ? 'flex-1' : 'text-center'}>
                <h4 className="font-bold text-gray-900">{sub.name}</h4>
                {variant === 'admin' && <p className="text-xs text-gray-500">Manage chapters & theory</p>}
              </div>
              {variant === 'admin' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubject(sub.name);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Subject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-600 transition-colors" />
                </div>
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-600 transition-colors" />
              )}
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
        <div className={variant === 'admin' ? 'bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
          {variant === 'admin' && apiChapters.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-6 font-bold text-gray-700 text-sm">Chapter Name</th>
                    <th className="py-4 px-6 font-bold text-gray-700 text-sm">Last Updated</th>
                    <th className="py-4 px-6 font-bold text-gray-700 text-sm text-right">Actions</th>
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
                      <td className="py-4 px-6 text-sm text-gray-500">Just now</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteChapter(chapter); }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-600" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {variant !== 'admin' && apiChapters.map((chapter, index) => (
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
                {canEdit && (
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

          {apiChapters.length === 0 && (
            <div className="col-span-full py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No chapters exist for this subject. {canEdit ? 'Create the first one!' : ''}</p>
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

          <div className={variant === 'admin' ? 'bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm' : 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}>
            {activeContentType === 'notes' ? (
              variant === 'admin' && apiNotes.length > 0 ? (
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
                        <tr key={item.id} className="hover:bg-teal-50/30 transition-colors group">
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
                              <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                              {canEdit && (
                                <button
                                  onClick={() => handleDeleteNote(item.id)}
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
                    className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg"><FileText className="w-6 h-6" /></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate mb-1">{item.title}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
                          <div className="flex gap-1">
                            <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteNote(item.id)}
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
              // DPP Placeholder
              <div className="col-span-full py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Digital Practice Papers (DPP) are coming soon to the backend.</p>
              </div>
            )}

            {activeContentType === 'notes' && apiNotes.length === 0 && (
              <div className="col-span-full py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No files found for this category.</p>
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
