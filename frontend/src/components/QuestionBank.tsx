import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Folder, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Download,
  Plus,
  Upload,
  X,
  CheckCircle,
  BarChart,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.svg';

export interface Question {
  id: string;
  name: string;
  chapter: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  batches: string[];
  date: string;
  size: string;
}

interface QuestionBankProps {
  userRole: 'student' | 'faculty';
  userSubject?: string; // For faculty
  userBatch?: string; // For student
  batches?: string[]; // Available batches for faculty to select
  onBack?: () => void;
}

const STORAGE_KEY = 'ujaas_question_bank';

const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q1',
    name: 'Kinematics Practice Set 01',
    chapter: 'Kinematics',
    subject: 'Physics',
    difficulty: 'Medium',
    batches: ['11th JEE', '11th NEET'],
    date: '2025-10-15',
    size: '1.2 MB'
  },
  {
    id: 'q2',
    name: 'Atomic Structure Advanced Problems',
    chapter: 'Atomic Structure',
    subject: 'Chemistry',
    difficulty: 'Hard',
    batches: ['11th JEE', 'Dropper JEE'],
    date: '2025-10-18',
    size: '2.5 MB'
  }
];

export function QuestionBank({ userRole, userSubject, userBatch, batches = [], onBack }: QuestionBankProps) {
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
  });

  const [currentView, setCurrentView] = useState<'subjects' | 'chapters' | 'questions'>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  }, [questions]);

  // Filter questions based on role and selection
  const filteredQuestions = questions.filter(q => {
    if (userRole === 'faculty' && userSubject && q.subject !== userSubject) return false;
    if (userRole === 'student' && userBatch && !q.batches.includes(userBatch)) return false;
    if (selectedSubject && q.subject !== selectedSubject) return false;
    if (selectedChapter && q.chapter !== selectedChapter) return false;
    if (searchQuery && !q.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const subjects = userRole === 'faculty' && userSubject 
    ? [userSubject] 
    : Array.from(new Set(questions.map(q => q.subject)));

  const chapters = selectedSubject 
    ? Array.from(new Set(questions.filter(q => q.subject === selectedSubject).map(q => q.chapter)))
    : [];

  const handleAddQuestion = (newQuestion: Omit<Question, 'id' | 'date' | 'size'>) => {
    const question: Question = {
      ...newQuestion,
      id: `q-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`
    };
    setQuestions(prev => [question, ...prev]);
    setIsAddModalOpen(false);
    
    // If we were on the subjects view and added for a subject, maybe navigate?
    // For now stay where we are.
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const renderBreadcrumbs = () => (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-white/50 p-3 rounded-xl border border-white/50 w-fit">
      <button 
        onClick={() => { setCurrentView('subjects'); setSelectedSubject(null); setSelectedChapter(null); }}
        className="hover:text-teal-600 transition-colors"
      >
        Subjects
      </button>
      {selectedSubject && (
        <>
          <ChevronRight className="w-4 h-4" />
          <button 
            onClick={() => { setCurrentView('chapters'); setSelectedChapter(null); }}
            className={`hover:text-teal-600 transition-colors ${currentView === 'chapters' ? 'text-teal-600 font-bold' : ''}`}
          >
            {selectedSubject}
          </button>
        </>
      )}
      {selectedChapter && (
        <>
          <ChevronRight className="w-4 h-4" />
          <span className="text-teal-600 font-bold">{selectedChapter}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 rounded-3xl shadow-xl text-white mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-teal-100 hover:text-white mb-4 font-bold transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
          )}
          <h2 className="text-3xl font-bold tracking-tight">Question Bank</h2>
          <p className="text-teal-50/90 font-medium">Access and manage practice materials</p>
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

      {renderBreadcrumbs()}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {currentView === 'subjects' && (
          <motion.div
            key="subjects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {subjects.map((sub) => (
              <motion.div
                key={sub}
                whileHover={{ scale: 1.02 }}
                onClick={() => { setSelectedSubject(sub); setCurrentView('chapters'); }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 flex flex-col items-center text-center cursor-pointer group hover:border-teal-200 transition-all"
              >
                <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-inner">
                  <BookOpen className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{sub}</h3>
                <p className="text-sm text-gray-500">
                  {Array.from(new Set(questions.filter(q => q.subject === sub).map(q => q.chapter))).length} Chapters
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {currentView === 'chapters' && (
          <motion.div
            key="chapters"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => { setCurrentView('subjects'); setSelectedSubject(null); }}
                className="flex items-center gap-2 text-teal-600 font-bold hover:underline"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Subjects
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapters.map((chapter) => (
                <motion.div
                  key={chapter}
                  whileHover={{ x: 10 }}
                  onClick={() => { setSelectedChapter(chapter); setCurrentView('questions'); }}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-md flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                      <Folder className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{chapter}</h4>
                      <p className="text-xs text-gray-500">
                        {questions.filter(q => q.subject === selectedSubject && q.chapter === chapter).length} Questions
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-600 transition-colors" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {currentView === 'questions' && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <button 
                onClick={() => { setCurrentView('chapters'); setSelectedChapter(null); }}
                className="flex items-center gap-2 text-teal-600 font-bold hover:underline"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Chapters
              </button>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 group hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                        <FileText className="w-7 h-7 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-bold text-gray-900 truncate text-lg">{q.name}</h4>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">
                            {q.chapter}
                          </span>
                          {userRole === 'faculty' && q.batches.map(b => (
                            <span key={b} className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded-md text-[10px] font-bold">
                              {b}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-medium">
                            {q.size} • {q.date}
                          </span>
                          <div className="flex gap-2">
                            <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors shadow-sm bg-white border border-gray-100">
                              <Download className="w-4 h-4" />
                            </button>
                            {userRole === 'faculty' && (
                              <button 
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white border border-gray-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="md:col-span-2 py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No questions found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[3000]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-cyan-600 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Add to Question Bank</h3>
                  <p className="text-teal-50 text-xs opacity-90">Upload new practice material</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <QuestionForm 
                  userSubject={userSubject!} 
                  batches={batches} 
                  onSubmit={handleAddQuestion} 
                  onCancel={() => setIsAddModalOpen(false)} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionForm({ userSubject, batches, onSubmit, onCancel }: { 
  userSubject: string; 
  batches: string[]; 
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    chapter: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    batches: [] as string[]
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please upload a PDF file');
      return;
    }
    if (formData.batches.length === 0) {
      alert('Please select at least one batch');
      return;
    }

    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      onSubmit({
        ...formData,
        subject: userSubject
      });
      setUploading(false);
    }, 1500);
  };

  const toggleBatch = (batch: string) => {
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.includes(batch)
        ? prev.batches.filter(b => b !== batch)
        : [...prev.batches, batch]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Question PDF Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., JEE Advanced 2024 Practice Set"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Chapter *</label>
          <input
            type="text"
            required
            value={formData.chapter}
            onChange={e => setFormData({ ...formData, chapter: e.target.value })}
            placeholder="e.g., Rotational Motion"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty *</label>
            <div className="flex gap-2">
              {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: d })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    formData.difficulty === d 
                      ? 'bg-teal-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
            <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-bold">
              {userSubject}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Target Batches *</label>
          <div className="flex flex-wrap gap-2">
            {batches.map(batch => (
              <button
                key={batch}
                type="button"
                onClick={() => toggleBatch(batch)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  formData.batches.includes(batch)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {batch}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Upload PDF *</label>
          <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all ${
            file ? 'border-teal-500 bg-teal-50' : 'border-gray-300 bg-gray-50 hover:border-teal-400'
          }`}>
            <input
              type="file"
              accept=".pdf"
              required
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText className="w-8 h-8 text-teal-600 mb-2" />
                  <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-600">Click to upload PDF</p>
                  <p className="text-[10px] text-gray-400 mt-1">Maximum 50MB</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploading}
          className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              Uploading...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Upload Question
            </>
          )}
        </button>
      </div>
    </form>
  );
}
