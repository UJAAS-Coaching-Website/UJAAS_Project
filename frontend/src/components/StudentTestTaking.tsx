import { useState, useEffect, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  BookOpen,
  Award,
  Edit,
  Image as ImageIcon,
  Check,
  Settings,
  Users
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options?: string[];
  optionImages?: (string | undefined)[];
  questionImage?: string;
  correctAnswer: number | number[] | string;
  subject: string;
  marks: number;
  type: 'MCQ' | 'MSQ' | 'Numerical';
  explanation?: string;
  explanationImage?: string;
}

type StudentAnswer = string | number | null;

interface StudentTestTakingProps {
  testId: string;
  testTitle: string;
  duration: number; // in minutes
  questions: Question[];
  onSubmit: (answers: Record<string, StudentAnswer>, options?: { autoSubmitted?: boolean }) => void | Promise<void>;
  onExit: () => void;
  onSave?: (testId: string, questions: Question[], title: string, batches: string[]) => void;
  initialAnswers?: Record<string, StudentAnswer>;
  initialTimeSpent?: number;
  isPreview?: boolean;
  isFacultyPreview?: boolean;
  availableBatches?: { label: string; slug: string }[];
  initialBatches?: string[];
  deadlineAt?: string;
  serverNow?: string;
  onSaveProgress?: (answers: Record<string, StudentAnswer>) => void | Promise<void>;
  enableTimer?: boolean;
  showMarksMeta?: boolean;
}

export function StudentTestTaking({
  testId,
  testTitle: initialTitle,
  duration,
  questions: initialQuestions,
  onSubmit,
  onExit,
  onSave,
  initialAnswers = {},
  initialTimeSpent = 0,
  isPreview = false,
  isFacultyPreview = false,
  availableBatches = [],
  initialBatches = [],
  deadlineAt,
  serverNow,
  onSaveProgress,
  enableTimer = true,
  showMarksMeta = true
}: StudentTestTakingProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [testTitle, setTestTitle] = useState(initialTitle);
  const [selectedBatches, setSelectedBatches] = useState<string[]>(initialBatches);
  const [showSettings, setShowSettings] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>(initialAnswers);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (deadlineAt && serverNow) {
      const remaining = Math.floor((new Date(deadlineAt).getTime() - new Date(serverNow).getTime()) / 1000);
      return Math.max(0, remaining);
    }
    return Math.max(0, (duration * 60) - initialTimeSpent);
  });
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(
    () => new Set(initialQuestions && initialQuestions[0] ? [initialQuestions[0].id] : [])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Question>>({});
  useBodyScrollLock(showSubmitDialog || showExitConfirm || showSettings);

  const isAnyPreview = isPreview || isFacultyPreview;
  const hasExplanationContent = (item: { explanation?: string; explanationImage?: string }) =>
    Boolean(item.explanation?.trim() || item.explanationImage);

  const question = questions[currentQuestion];
  const questionCount = questions.length;
  const totalMarks = questions.reduce((sum, q) => sum + (q?.marks || 0), 0);

  // Group questions by subject and section for navigation
  const subjects = Array.from(new Set(questions.map(q => q?.subject).filter(Boolean)));
  const currentSubject = question?.subject;
  const sections = Array.from(new Set(questions.filter(q => q && q.subject === currentSubject).map(q => (q as any)?.metadata?.section || 'Default'))).sort();
  const currentSection = (question as any)?.metadata?.section || 'Default';

  useEffect(() => {
    if (isEditing) {
      setEditForm(questions[currentQuestion]);
    }
  }, [isEditing, currentQuestion, questions]);

  useEffect(() => {
    const current = questions[currentQuestion];
    if (!current) return;
    setVisitedQuestions((prev) => {
      if (prev.has(current.id)) return prev;
      const next = new Set(prev);
      next.add(current.id);
      return next;
    });
  }, [currentQuestion, questions]);

  const handleSaveEdit = () => {
    if (editForm.id) {
      setQuestions(prev => prev.map(q => q.id === editForm.id ? { ...q, ...editForm } as Question : q));
      setHasChanges(true);
      setIsEditing(false);
    }
  };

  const handleExitRequest = () => {
    if (isAnyPreview) {
      if (hasChanges) {
        setShowExitConfirm(true);
      } else {
        onExit();
      }
    } else {
      setShowExitConfirm(true);
    }
  };

  const handleConfirmExit = async (save: boolean) => {
    if (isAnyPreview) {
      if (save && onSave) {
        onSave(testId, questions, testTitle, selectedBatches);
      }
      onExit();
    } else {
      setShowExitConfirm(false);
      setShowSubmitDialog(true);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, type: 'question' | 'option' | 'explanation', index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'question') {
          setEditForm({ ...editForm, questionImage: result });
        } else if (type === 'explanation') {
          setEditForm({ ...editForm, explanationImage: result });
        } else if (type === 'option' && index !== undefined) {
          const newOptionImages = [...(editForm.optionImages || [])];
          newOptionImages[index] = result;
          setEditForm({ ...editForm, optionImages: newOptionImages });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isAnyPreview || !enableTimer) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnyPreview]);

  useEffect(() => {
    if (isAnyPreview || !onSaveProgress) return;
    const saveTimer = setTimeout(() => {
      void onSaveProgress(answers);
    }, 800);
    return () => clearTimeout(saveTimer);
  }, [answers, isAnyPreview, onSaveProgress]);

  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    await onSubmit(answers, { autoSubmitted: true });
  };

  const handleSubmit = async (autoSubmitted = false) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(answers, { autoSubmitted });
      setShowSubmitDialog(false);
      setShowExitConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (questionId: string, value: StudentAnswer) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const toggleFlag = (questionId: string) => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlaggedQuestions(newFlagged);
  };

  const getQuestionStatus = (index: number) => {
    const question = questions[index];
    if (answers[question.id] !== undefined && answers[question.id] !== null) {
      return 'answered';
    }
    return 'not-answered';
  };

  const answeredCount = questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== null).length;
  const notAnsweredCount = questions.length - answeredCount;

  // Grouped stats for summary table
  const getGroupedStats = () => {
    const stats: Record<string, Record<string, {
      answered: number;
      notAnswered: number;
      marked: number;
      answeredAndMarked: number;
      notVisited: number;
      total: number;
    }>> = {};

    subjects.forEach(subject => {
      stats[subject] = {};
      const subjectQuestions = questions.filter(q => q.subject === subject);
      const subjectSections = Array.from(new Set(subjectQuestions.map(q => (q as any).metadata?.section || 'Default'))).sort();
      
      subjectSections.forEach(section => {
        const sectionQuestions = subjectQuestions.filter(q => ((q as any).metadata?.section || 'Default') === section);
        
        const answered = sectionQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] !== null && !flaggedQuestions.has(q.id)).length;
        const marked = sectionQuestions.filter(q => flaggedQuestions.has(q.id) && (answers[q.id] === undefined || answers[q.id] === null)).length;
        const answeredAndMarked = sectionQuestions.filter(q => flaggedQuestions.has(q.id) && answers[q.id] !== undefined && answers[q.id] !== null).length;
        const visited = sectionQuestions.filter(q => visitedQuestions.has(q.id)).length;
        const total = sectionQuestions.length;
        const notAnswered = visited - (answered + marked + answeredAndMarked);
        const notVisited = total - visited;

        stats[subject][section] = {
          answered,
          notAnswered: Math.max(0, notAnswered),
          marked,
          answeredAndMarked,
          notVisited,
          total
        };
      });
    });

    return stats;
  };

  const groupedStats = getGroupedStats();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-2 sm:p-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{testTitle}</h1>
                {isPreview && (
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Test Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  {questionCount} Questions
                </span>
                {showMarksMeta && (
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                    {totalMarks} Marks
                  </span>
                )}
                {isAnyPreview && (
                  <>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      {selectedBatches.join(', ') || 'No batches assigned'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      isFacultyPreview ? 'bg-teal-100 text-teal-700 border-teal-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {isFacultyPreview ? 'Faculty Review Mode' : 'Admin Preview Mode'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer - only for students */}
              {!isAnyPreview && enableTimer && (
                <div className={`flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl border-2 ${
                  timeLeft <= 300 ? 'bg-red-50 border-red-300' : 
                  timeLeft <= 600 ? 'bg-yellow-50 border-yellow-300' :
                  'bg-blue-50 border-blue-300'
                }`}>
                  <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    timeLeft <= 300 ? 'text-red-600' :
                    timeLeft <= 600 ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <p className="text-xs text-gray-600">Time Left</p>
                    <p className={`text-lg sm:text-2xl font-bold ${
                      timeLeft <= 300 ? 'text-red-600' :
                      timeLeft <= 600 ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {formatTime(timeLeft)}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleExitRequest}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <X className="w-5 h-5" />
                {isSubmitting ? 'Submitting...' : isAnyPreview ? 'Exit Review' : 'Exit Test'}
              </button>
            </div>
          </div>
        </div>

        {/* Subject and Section Tabs */}
        {subjects.length > 0 && (
          <div className="flex flex-col gap-4 mb-6">
            {/* Subject Tabs */}
            <div className="flex gap-2 p-1.5 bg-white/50 backdrop-blur rounded-2xl border border-white shadow-sm overflow-x-auto">
              {subjects.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    const firstIdx = questions.findIndex(q => q.subject === s);
                    if (firstIdx > -1) setCurrentQuestion(firstIdx);
                  }}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    currentSubject === s
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Section Tabs */}
            {sections.length > 1 && (
              <div className="flex gap-3">
                {sections.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      const firstIdx = questions.findIndex(q => q.subject === currentSubject && ((q as any).metadata?.section || 'Default') === sec);
                      if (firstIdx > -1) setCurrentQuestion(firstIdx);
                    }}
                    className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${
                      currentSection === sec
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-white bg-white/50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {sec} 
                    <span className="ml-2 text-xs opacity-60">
                      ({questions.filter(q => q.subject === currentSubject && ((q as any).metadata?.section || 'Default') === sec).length})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Question Card */}
            <div
              key={currentQuestion}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8"
            >
              {!isEditing ? (
                <>
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-3 mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {question.subject}
                        </span>
                        {currentSection && currentSection !== 'Default' && (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                            {currentSection}
                          </span>
                        )}
                        {showMarksMeta && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            {question.marks} marks
                          </span>
                        )}
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold uppercase">
                          {question.type}
                        </span>
                        {isAnyPreview && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold hover:bg-amber-200 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" /> {isFacultyPreview ? 'Add/Edit Explanation' : 'Edit Question'}
                          </button>
                        )}
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 leading-relaxed mb-4">
                        {question.question}
                      </h2>
                      {question.questionImage && (
                        <div className="mb-6 rounded-xl overflow-hidden border border-gray-200 inline-block">
                          <img src={question.questionImage} alt="Question" className="max-h-64 w-auto object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {question.type !== 'Numerical' ? (
                      question.options?.map((option, index) => {
                        const isCorrect = isAnyPreview && (
                          question.type === 'MCQ' ? question.correctAnswer === index :
                          Array.isArray(question.correctAnswer) && (question.correctAnswer as number[]).includes(index)
                        );
                        
                        return (
                          <div key={index} className="space-y-2">
                            <button
                              onClick={() => !isAnyPreview && selectAnswer(question.id, index)}
                              disabled={isAnyPreview}
                              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                isCorrect ? 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-200' :
                                answers[question.id] === index
                                  ? 'border-blue-500 bg-blue-50 shadow-md'
                                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  isCorrect ? 'border-green-500 bg-green-500' :
                                  answers[question.id] === index
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300'
                                }`}>
                                  {(answers[question.id] === index || isCorrect) && (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <span className="text-gray-900 font-medium">{option}</span>
                                  {question.optionImages?.[index] && (
                                    <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 inline-block">
                                      <img src={question.optionImages[index]} alt={`Option ${index}`} className="max-h-32 w-auto object-contain" />
                                    </div>
                                  )}
                                </div>
                                {isCorrect && (
                                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">CORRECT</span>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-amber-50 p-6 rounded-2xl border-2 border-dashed border-amber-200">
                        <p className="text-sm font-bold text-amber-800 mb-2">Numerical Answer</p>
                        {isAnyPreview ? (
                          <div className="flex items-center gap-3">
                            <div className="px-6 py-3 bg-white rounded-xl border-2 border-green-500 font-bold text-green-700 text-xl">
                              {question.correctAnswer}
                            </div>
                            <span className="text-xs font-bold text-green-600">CORRECT ANSWER</span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={answers[question.id] || ''}
                            onChange={(e) => selectAnswer(question.id, e.target.value as any)}
                            className="w-full max-w-xs px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                            placeholder="Enter numerical value"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Explanation Section */}
                  {isAnyPreview && (
                    <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-blue-700">
                          <AlertCircle className="w-5 h-5" />
                          <h3 className="font-bold">Explanation</h3>
                        </div>
                        {isFacultyPreview && !hasExplanationContent(question) && (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                            Needs Explanation
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed italic mb-4">
                        {question.explanation || "No explanation provided for this question."}
                      </p>
                      {question.explanationImage && (
                        <div className="rounded-xl overflow-hidden border border-blue-100 inline-block bg-white p-2">
                          <img src={question.explanationImage} alt="Solution" className="max-h-64 w-auto object-contain" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Edit Form */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{isFacultyPreview ? 'Add/Edit Explanation' : 'Edit Question'}</h3>
                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {!isFacultyPreview && (
                      <>
                        <label className="block">
                          <span className="block text-sm font-bold text-gray-700 mb-2">Question Text</span>
                          <textarea
                            value={editForm.question}
                            onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                          />
                        </label>

                        <div className="flex items-center gap-4">
                          <label className="relative cursor-pointer">
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'question')} className="absolute inset-0 opacity-0" />
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 font-bold text-sm">
                              <ImageIcon className="w-4 h-4" /> {editForm.questionImage ? 'Change Image' : 'Add Image'}
                            </div>
                          </label>
                          {editForm.questionImage && (
                            <button onClick={() => setEditForm({ ...editForm, questionImage: undefined })} className="text-xs text-red-600 font-bold hover:underline">Remove Image</button>
                          )}
                        </div>

                        {editForm.type !== 'Numerical' && (
                          <div className="space-y-4 pt-4">
                            <p className="text-sm font-bold text-gray-700">Options & Correct Answer</p>
                            {editForm.options?.map((opt, idx) => (
                              <div key={idx} className="flex gap-3">
                                <div className="pt-3">
                                  <input 
                                    type={editForm.type === 'MCQ' ? 'radio' : 'checkbox'} 
                                    checked={editForm.type === 'MCQ' ? editForm.correctAnswer === idx : Array.isArray(editForm.correctAnswer) && editForm.correctAnswer.includes(idx)}
                                    onChange={() => {
                                      if (editForm.type === 'MCQ') {
                                        setEditForm({ ...editForm, correctAnswer: idx });
                                      } else {
                                        const current = Array.isArray(editForm.correctAnswer) ? [...editForm.correctAnswer] : [];
                                        const next = current.includes(idx) ? current.filter(i => i !== idx) : [...current, idx];
                                        setEditForm({ ...editForm, correctAnswer: next });
                                      }
                                    }}
                                    className="w-5 h-5 text-blue-600"
                                  />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <input
                                    value={opt}
                                    onChange={(e) => {
                                      const next = [...(editForm.options || [])];
                                      next[idx] = e.target.value;
                                      setEditForm({ ...editForm, options: next });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                    placeholder={`Option ${idx + 1}`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {editForm.type === 'Numerical' && (
                          <label className="block pt-4">
                            <span className="block text-sm font-bold text-gray-700 mb-2">Correct Numerical Answer</span>
                            <input
                              value={editForm.correctAnswer as string}
                              onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                              className="w-full max-w-xs px-4 py-2 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500"
                            />
                          </label>
                        )}
                      </>
                    )}

                    {isFacultyPreview && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Reference Question</p>
                        <p className="text-gray-700 font-medium">{editForm.question}</p>
                      </div>
                    )}

                    <label className="block pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="block text-sm font-bold text-gray-700">Explanation</span>
                        <div className="flex items-center gap-4">
                          <label className="relative cursor-pointer">
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'explanation')} className="absolute inset-0 opacity-0" />
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 font-bold text-xs">
                              <ImageIcon className="w-3.5 h-3.5" /> {editForm.explanationImage ? 'Change Solution Image' : 'Add Solution Image'}
                            </div>
                          </label>
                          {editForm.explanationImage && (
                            <button onClick={() => setEditForm({ ...editForm, explanationImage: undefined })} className="text-[10px] text-red-600 font-bold hover:underline">Remove</button>
                          )}
                        </div>
                      </div>
                      <textarea
                        value={editForm.explanation}
                        onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                        rows={6}
                        placeholder="Explain why the answer is correct..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                      />
                      {editForm.explanationImage && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 inline-block">
                          <img src={editForm.explanationImage} alt="Solution Preview" className="max-h-32 w-auto object-contain" />
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      <Check className="w-4 h-4" /> {isFacultyPreview ? 'Confirm Explanation' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <motion.button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  currentQuestion === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 shadow-sm'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </motion.button>

              {currentQuestion === questions.length - 1 ? (
                <motion.button
                  onClick={() => isAnyPreview ? handleExitRequest() : setShowSubmitDialog(true)}
                  className={`px-8 py-3 bg-gradient-to-r ${isAnyPreview ? 'from-gray-600 to-gray-700' : 'from-green-600 to-emerald-600'} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2`}
                >
                  {isAnyPreview ? <X className="w-5 h-5" /> : null}
                  {isAnyPreview ? 'Exit Review' : 'Submit Test'}
                </motion.button>
              ) : (
                <div className="flex items-center gap-3">
                  {!isAnyPreview && (
                    <>
                      <button
                        onClick={() => setAnswers({ ...answers, [question.id]: null })}
                        className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => toggleFlag(question.id)}
                        className={`px-6 py-3 border-2 rounded-xl font-semibold transition-all ${
                          flaggedQuestions.has(question.id)
                            ? 'bg-purple-100 border-purple-300 text-purple-700'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Mark for Review
                      </button>
                    </>
                  )}
                  <motion.button
                    onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {isAnyPreview ? 'Next' : 'Save & Next'}
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Question Palette */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Question Palette</h3>

              {/* Question Grid - Filtered by Active Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex flex-col">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Current Palette</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-600 uppercase">{currentSubject}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{currentSection}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, index) => ({ ...q, globalIndex: index }))
                    .filter(q => q.subject === currentSubject && ((q as any).metadata?.section || 'Default') === currentSection)
                    .map((q) => (
                      <motion.button
                        key={q.id}
                        onClick={() => setCurrentQuestion(q.globalIndex)}
                        className={`aspect-square rounded-lg font-semibold text-sm relative ${
                          currentQuestion === q.globalIndex
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white ring-2 ring-blue-600 ring-offset-2 scale-110 z-10'
                            : !isAnyPreview && flaggedQuestions.has(q.id) && getQuestionStatus(q.globalIndex) === 'answered'
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : !isAnyPreview && getQuestionStatus(q.globalIndex) === 'answered'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : isAnyPreview && hasExplanationContent(q)
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : !isAnyPreview && flaggedQuestions.has(q.id)
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : !isAnyPreview && visitedQuestions.has(q.id)
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {q.globalIndex + 1}
                        {!isAnyPreview && flaggedQuestions.has(q.id) && getQuestionStatus(q.globalIndex) === 'answered' && (
                          <div className="absolute top-1 right-1 z-10 w-3 h-3 bg-green-500 rounded-full" />
                        )}
                        {isAnyPreview && !hasExplanationContent(q) && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                        )}
                      </motion.button>
                    ))}
                </div>
              </div>

              {/* Legend - Review Mode */}
              {isAnyPreview && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-teal-50 border border-teal-200 rounded" />
                    <span className="text-xs text-gray-600">With Explanation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded relative">
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    </div>
                    <span className="text-xs text-gray-600">Needs Explanation</span>
                  </div>
                </div>
              )}

              {/* Legend - only for students */}
              {!isAnyPreview && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded" />
                    <span className="text-xs text-gray-600">Not visited yet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded" />
                    <span className="text-xs text-gray-600">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 rounded" />
                    <span className="text-xs text-gray-600">Visited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-100 rounded" />
                    <span className="text-xs text-gray-600">Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-100 rounded relative">
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
                    </div>
                    <span className="text-xs text-gray-600">Answered & Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded" />
                    <span className="text-xs text-gray-600">Current</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {/* Submit Dialog */}
        {showSubmitDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10004] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Test Summary</h3>
                <p className="text-gray-600">Please review your attempt before submitting.</p>
              </div>

              <div className="overflow-x-auto mb-8 border border-gray-100 rounded-2xl shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
                    <tr>
                      <th rowSpan={2} className="px-4 py-4 border-b border-r border-gray-200">Status</th>
                      {subjects.map(subject => (
                        <th 
                          key={subject} 
                          colSpan={Object.keys(groupedStats[subject]).length} 
                          className="px-4 py-2 border-b border-r border-gray-200 text-center bg-blue-50 text-blue-700"
                        >
                          {subject}
                        </th>
                      ))}
                      <th rowSpan={2} className="px-4 py-4 border-b border-gray-200 text-center bg-indigo-50 text-indigo-700">Grand Total</th>
                    </tr>
                    <tr>
                      {subjects.map(subject => 
                        Object.keys(groupedStats[subject]).map(section => (
                          <th key={`${subject}-${section}`} className="px-4 py-2 border-b border-r border-gray-200 text-center font-semibold text-[10px]">
                            {section}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { key: 'answered', label: 'Answered', color: 'text-green-600' },
                      { key: 'notAnswered', label: 'Visited', color: 'text-red-600' },
                      { key: 'marked', label: 'Marked for Review', color: 'text-purple-600' },
                      { key: 'answeredAndMarked', label: 'Ans & Marked for Review', color: 'text-indigo-600' },
                      { key: 'notVisited', label: 'Not Visited', color: 'text-gray-500' }
                    ].map(row => {
                      let grandTotal = 0;
                      return (
                        <tr key={row.key} className="hover:bg-gray-50/50 transition-colors">
                          <td className={`px-4 py-3 font-bold border-r border-gray-100 ${row.color}`}>{row.label}</td>
                          {subjects.map(subject => 
                            Object.keys(groupedStats[subject]).map(section => {
                              const val = (groupedStats[subject][section] as any)[row.key];
                              grandTotal += val;
                              return (
                                <td key={`${subject}-${section}-${row.key}`} className="px-4 py-3 text-center border-r border-gray-100 font-medium">
                                  {val}
                                </td>
                              );
                            })
                          )}
                          <td className={`px-4 py-3 text-center font-bold bg-indigo-50/30 ${row.color}`}>{grandTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50/50 font-bold">
                    <tr>
                      <td className="px-4 py-3 border-r border-gray-100">Total Questions</td>
                      {subjects.map(subject => 
                        Object.keys(groupedStats[subject]).map(section => (
                          <td key={`${subject}-${section}-total`} className="px-4 py-3 text-center border-r border-gray-100">
                            {groupedStats[subject][section].total}
                          </td>
                        ))
                      )}
                      <td className="px-4 py-3 text-center bg-indigo-50 text-indigo-900">{questions.length}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowSubmitDialog(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Back to Test
                </button>
                <motion.button
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-80 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Test Now'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Exit Confirmation */}
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10004] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className={`w-20 h-20 ${isAnyPreview ? 'bg-amber-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {isAnyPreview ? <Save className="w-10 h-10 text-amber-600" /> : <AlertCircle className="w-10 h-10 text-red-600" />}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{isAnyPreview ? 'Save Changes?' : 'Exit & Submit?'}</h3>
                <p className="text-gray-600 mt-2">
                  {isAnyPreview 
                    ? 'You have made edits to this test. Would you like to keep these changes?'
                    : 'Tests cannot be paused. If you exit now, your current answers will be submitted and the test will end.'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  onClick={() => void (isAnyPreview ? handleConfirmExit(true) : handleConfirmExit(false))}
                  disabled={isSubmitting}
                  className={`w-full py-4 bg-gradient-to-r ${isAnyPreview ? 'from-teal-600 to-cyan-600' : 'from-orange-500 to-red-600'} text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-80 disabled:cursor-wait flex items-center justify-center gap-2`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {isAnyPreview ? 'Saving...' : 'Submitting...'}
                    </>
                  ) : (
                    isAnyPreview ? 'Save & Exit' : 'Exit & Submit Now'
                  )}
                </motion.button>
                {isAnyPreview && (
                  <motion.button
                    onClick={() => void handleConfirmExit(false)}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-80 disabled:cursor-wait"
                  >
                    Discard Changes
                  </motion.button>
                )}
                <button
                  onClick={() => setShowExitConfirm(false)}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Global Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10004] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Test Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Test Title</label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => {
                      setTestTitle(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700">Target Batches</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {availableBatches.map(batch => (
                      <button
                        key={batch.slug}
                        onClick={() => {
                          const next = selectedBatches.includes(batch.label)
                            ? selectedBatches.filter(b => b !== batch.label)
                            : [...selectedBatches, batch.label];
                          setSelectedBatches(next);
                          setHasChanges(true);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          selectedBatches.includes(batch.label)
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {batch.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <motion.button
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Confirm Settings
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
