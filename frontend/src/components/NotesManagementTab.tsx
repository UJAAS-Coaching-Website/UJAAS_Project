import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Calendar, Plus,
  Upload, Folder, Trash2, Download, FileText
} from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { apiFetchChapters, apiCreateChapter, apiDeleteChapter, ApiChapter } from '../api/chapters';
import { apiFetchNotes, apiDeleteNote, ApiNote } from '../api/notes';

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
}

export function NotesManagementTab({
  onNavigate,
  selectedBatch,
  onChangeBatch,
  onViewTimetable,
  facultySubject,
  batches,
  readOnly = false
}: NotesManagementTabProps) {
  const [currentView, setCurrentView] = useState<'root' | 'subject' | 'chapter'>('root');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  // API Models
  const [apiChapters, setApiChapters] = useState<ApiChapter[]>([]);
  const [apiNotes, setApiNotes] = useState<ApiNote[]>([]);
  
  // Chapter State Reference
  const [selectedChapterObj, setSelectedChapterObj] = useState<ApiChapter | null>(null);
  const [activeContentType, setActiveContentType] = useState<'notes' | 'dpps'>('notes');

  const allSubjects = [
    { id: 's1', name: 'Physics', color: '#3b82f6' },
    { id: 's2', name: 'Chemistry', color: '#10b981' },
    { id: 's3', name: 'Mathematics', color: '#f59e0b' },
    { id: 's4', name: 'Biology', color: '#f43f5e' },
  ];

  const currentBatch = batches.find(b => b.label === selectedBatch);
  const batchSubjects = currentBatch?.subjects || [];
  
  const subjects = allSubjects.filter(sub => batchSubjects.includes(sub.name));

  // Modals
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');

  useBodyScrollLock(isAddChapterModalOpen);

  // canEdit is true if NOT readOnly AND (admin OR matching faculty subject)
  const canEdit = !readOnly && (!facultySubject || (selectedSubject && selectedSubject.toLowerCase() === facultySubject.toLowerCase()));

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
      } catch (err) {
        console.error(err);
        alert('Failed to create chapter. It may already exist.');
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

  const navigateToSubject = (subject: string) => { setSelectedSubject(subject); setCurrentView('subject'); };
  const navigateToChapter = (chapter: ApiChapter) => { setSelectedChapterObj(chapter); setCurrentView('chapter'); setActiveContentType('notes'); };
  const goBack = () => { if (currentView === 'chapter') { setCurrentView('subject'); setSelectedChapterObj(null); } else if (currentView === 'subject') { setCurrentView('root'); setSelectedSubject(null); } };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {currentView !== 'root' && (<button onClick={goBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-700" /></button>)}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Content Management</h2>
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
            {currentView === 'root' && (<button onClick={onViewTimetable} className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition font-semibold shadow-sm"><Calendar className="w-5 h-5" />Time Table</button>)}
            {currentView === 'subject' && canEdit && (<button onClick={() => setIsAddChapterModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition shadow-md"><Plus className="w-5 h-5" />Add Chapter</button>)}
            {currentView === 'chapter' && canEdit && (
              <div className="flex items-center gap-3">
                <button onClick={() => {
                  // Pass the chapter ID to localStorage/state so upload can access it.
                  localStorage.setItem('uploadTargetChapterId', selectedChapterObj!.id);
                  localStorage.setItem('uploadTargetChapterName', selectedChapterObj!.name);
                  onNavigate('upload-notes');
                }} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition shadow-md"><Upload className="w-5 h-5" />Upload Content</button>
                <button onClick={() => onNavigate('create-dpp')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition shadow-md"><Plus className="w-5 h-5" />Upload DPP</button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {currentView === 'root' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {subjects.map((sub, index) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigateToSubject(sub.name)}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white flex flex-col items-center gap-4 group relative cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform" style={{ backgroundColor: sub.color }}><Folder className="w-8 h-8 text-white" /></div>
              <div className="text-center"><h4 className="font-bold text-gray-900">{sub.name}</h4></div>
            </motion.div>
          ))}
        </div>
      )}

      {currentView === 'subject' && selectedSubject && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apiChapters.map((chapter, index) => (
            <motion.button key={chapter.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} onClick={() => navigateToChapter(chapter)} className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white flex items-center justify-between group">
              <div className="flex items-center gap-4"><div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 transition-colors"><Folder className="w-5 h-5 text-cyan-600 group-hover:text-white" /></div><span className="font-bold text-gray-900">{chapter.name}</span></div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChapter(chapter);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-600 transition-colors" />
              </div>
            </motion.button>
          ))}
          {apiChapters.length === 0 && (
             <div className="col-span-full py-12 text-center text-gray-500">
               No chapters exist for this subject yet. Create one!
             </div>
          )}
        </div>
      )}

      {currentView === 'chapter' && selectedChapterObj && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-200">
            <button onClick={() => setActiveContentType('notes')} className={`pb-4 px-6 text-sm font-bold transition-all relative ${activeContentType === 'notes' ? 'text-teal-600' : 'text-gray-500'}`}>Study Notes{activeContentType === 'notes' && (<motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 rounded-t-full" />)}</button>
            <button onClick={() => setActiveContentType('dpps')} className={`pb-4 px-6 text-sm font-bold transition-all relative ${activeContentType === 'dpps' ? 'text-teal-600' : 'text-gray-500'}`}>DPPs{activeContentType === 'dpps' && (<motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 rounded-t-full" />)}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeContentType === 'notes' && apiNotes.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white group">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shrink-0`}><FileText className="w-6 h-6 text-white" /></div>
                  <div className="flex-1 min-w-0"><h4 className="font-bold text-gray-900 truncate mb-1">{item.title}</h4><div className="flex items-center justify-between"><span className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span><div className="flex gap-1">
                    <button className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"><Download className="w-4 h-4" /></button>
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteNote(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div></div></div>
                </div>
              </motion.div>
            ))}
            {activeContentType === 'notes' && apiNotes.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500">
                  No notes available for this chapter yet.
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
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white">
                <h3 className="text-xl font-bold">Add New Chapter</h3>
                <p className="text-teal-50 text-sm">Add to {selectedSubject}</p>
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                  >
                    Create Chapter
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
