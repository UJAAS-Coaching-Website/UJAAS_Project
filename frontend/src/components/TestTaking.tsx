import { useState, useEffect, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
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
  metadata?: {
    section?: string;
  };
}

interface QuestionExplanationPayload {
  explanation: string | null;
  explanation_img: string | null;
}

type ExplanationStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface QuestionExplanationState {
  status: ExplanationStatus;
  visible: boolean;
  explanation?: string;
  explanationImage?: string;
}

interface TestTakingProps {
  testId: string;
  testTitle: string;
  duration: number; // in minutes
  questions: Question[];
  onSubmit: (answers: Record<string, string | number | number[] | null>, timeSpent: number) => void;
  onExit: () => void;
  onSave?: (testId: string, questions: Question[], title: string, batches: string[]) => Promise<void> | void;
  initialAnswers?: Record<string, string | number | number[] | null>;
  initialTimeSpent?: number;
  isPreview?: boolean;
  isFacultyPreview?: boolean;
  disableEditing?: boolean;
  hideExplanations?: boolean;
  availableBatches?: { label: string; slug: string }[];
  initialBatches?: string[];
  reviewAttemptId?: string;
  loadQuestionExplanation?: (attemptId: string, questionId: string) => Promise<QuestionExplanationPayload>;
}

const DEFAULT_EXPLANATION_STATE: QuestionExplanationState = {
  status: 'idle',
  visible: false,
};

const isUnattemptedValue = (value: string | number | number[] | null | undefined) =>
  Array.isArray(value) ? value.length === 0 : value === undefined || value === null || value === '';

const normalizeReviewAnswer = (value: string | number | number[] | null | undefined, questionType: Question['type']) => {
  if (isUnattemptedValue(value)) {
    return null;
  }

  if (questionType === 'Numerical') {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter(Number.isFinite).sort((a, b) => a - b);
  }

  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : String(value).trim();
};

const normalizeNumericReviewValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : raw;
};

const isNumericalReviewCorrect = (submittedAnswer: string | number | null, correctAnswer: string | number) => {
  const normalizedSubmitted = normalizeNumericReviewValue(submittedAnswer);
  const normalizedCorrect = normalizeNumericReviewValue(correctAnswer);

  if (normalizedSubmitted === null || normalizedCorrect === null) {
    return false;
  }

  return normalizedSubmitted === normalizedCorrect;
};

const getCorrectOptionIndices = (question: Question) => {
  if (question.type === 'MCQ') {
    return typeof question.correctAnswer === 'number' ? [question.correctAnswer] : [];
  }

  if (question.type === 'MSQ') {
    return Array.isArray(question.correctAnswer) ? [...question.correctAnswer].sort((a, b) => a - b) : [];
  }

  return [];
};

export function TestTaking({
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
  disableEditing = false,
  hideExplanations = false,
  availableBatches = [],
  initialBatches = [],
  reviewAttemptId,
  loadQuestionExplanation
}: TestTakingProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [testTitle, setTestTitle] = useState(initialTitle);
  const [selectedBatches, setSelectedBatches] = useState<string[]>(initialBatches);
  const [showSettings, setShowSettings] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | number[] | null>>(initialAnswers);
  const [timeLeft, setTimeLeft] = useState((duration * 60) - initialTimeSpent);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Question>>({});
  const [questionExplanations, setQuestionExplanations] = useState<Record<string, QuestionExplanationState>>({});
  useBodyScrollLock(showSubmitDialog || showExitConfirm || showSettings);

  const isAnyPreview = isPreview || isFacultyPreview;
  const isStudentReviewMode = disableEditing && Boolean(reviewAttemptId) && Boolean(loadQuestionExplanation);
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
    setQuestionExplanations({});
  }, [reviewAttemptId]);

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
        setIsSaving(true);
        try {
          await onSave(testId, questions, testTitle, selectedBatches);
          onExit();
        } catch (error) {
          console.error("Failed to save test changes:", error);
          // Don't exit if it failed, let the user see the toaster error
        } finally {
          setIsSaving(false);
        }
      } else {
        onExit();
      }
    } else {
      // For students, confirm exit means submit
      handleSubmit();
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'question' | 'option' | 'explanation', index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Use 'dpps' if the URL implies a DPP flow, otherwise 'tests'
      const context = window.location.pathname.includes('dpps') ? 'dpps' : 'tests';
      formData.append('context', context);
      formData.append('contextId', testId);
      formData.append('itemRole', type);

      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
      
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include', // Important for HTTP-only cookie auth
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Image upload failed');
      }

      // Success, assign the URL to the correct property
      const imageUrl = data.imageUrl;

      if (type === 'question') {
        setEditForm(prev => ({ ...prev, questionImage: imageUrl }));
      } else if (type === 'explanation') {
        setEditForm(prev => ({ ...prev, explanationImage: imageUrl }));
      } else if (type === 'option' && index !== undefined) {
        setEditForm(prev => {
          const newOptionImages = [...(prev.optionImages || [])];
          newOptionImages[index] = imageUrl;
          return { ...prev, optionImages: newOptionImages };
        });
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      // Clear the input so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  // Delete an image from S3 and clear it from editForm state
  const handleImageRemove = async (type: 'question' | 'option' | 'explanation', index?: number) => {
    const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
    let imageUrl: string | undefined;

    if (type === 'question') imageUrl = editForm.questionImage;
    else if (type === 'explanation') imageUrl = editForm.explanationImage;
    else if (type === 'option' && index !== undefined) imageUrl = editForm.optionImages?.[index];

    // Clear from state immediately for responsive UI
    if (type === 'question') {
      setEditForm(prev => ({ ...prev, questionImage: undefined }));
    } else if (type === 'explanation') {
      setEditForm(prev => ({ ...prev, explanationImage: undefined }));
    } else if (type === 'option' && index !== undefined) {
      setEditForm(prev => {
        const newOptionImages = [...(prev.optionImages || [])];
        newOptionImages[index] = undefined;
        return { ...prev, optionImages: newOptionImages };
      });
    }

    // Fire S3 delete in background (don't block UI)
    console.log('[S3 Delete] imageUrl:', imageUrl);
    if (imageUrl && imageUrl.startsWith('http')) {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl })
        });
        const result = await resp.json();
        console.log('[S3 Delete] Response:', result);
      } catch (err) {
        console.warn('Failed to delete image from S3:', err);
      }
    } else {
      console.log('[S3 Delete] Skipped — not an HTTP URL');
    }
  };

  useEffect(() => {
    if (isAnyPreview) return;

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

  const handleAutoSubmit = () => {
    const timeSpent = (duration * 60) - timeLeft;
    onSubmit(answers, timeSpent);
  };

  const handleSubmit = () => {
    const timeSpent = (duration * 60) - timeLeft;
    onSubmit(answers, timeSpent);
    setShowSubmitDialog(false);
    setShowExitConfirm(false);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isAnsweredValue = (value: string | number | number[] | null | undefined) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== '';

  const isOptionSelected = (questionId: string, optionIndex: number) => {
    const answer = answers[questionId];
    return Array.isArray(answer) ? answer.includes(optionIndex) : answer === optionIndex;
  };

  const selectAnswer = (questionId: string, value: string | number | number[] | null) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const toggleMsqAnswer = (questionId: string, optionIndex: number) => {
    const currentAnswer = answers[questionId];
    const currentValues = Array.isArray(currentAnswer) ? currentAnswer : [];
    const nextValues = currentValues.includes(optionIndex)
      ? currentValues.filter((value) => value !== optionIndex)
      : [...currentValues, optionIndex].sort((a, b) => a - b);
    selectAnswer(questionId, nextValues.length > 0 ? nextValues : null);
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
    if (isAnsweredValue(answers[question.id])) {
      return 'answered';
    }
    return 'not-answered';
  };

  const getExplanationState = (questionId: string) => questionExplanations[questionId] || DEFAULT_EXPLANATION_STATE;

  const toggleQuestionExplanation = async (questionId: string) => {
    if (hideExplanations) return;

    const existingState = getExplanationState(questionId);
    if (!existingState.visible && existingState.status === 'idle' && isStudentReviewMode && reviewAttemptId && loadQuestionExplanation) {
      setQuestionExplanations((prev) => ({
        ...prev,
        [questionId]: {
          ...existingState,
          visible: true,
          status: 'loading',
        },
      }));

      try {
        const payload = await loadQuestionExplanation(reviewAttemptId, questionId);
        setQuestionExplanations((prev) => ({
          ...prev,
          [questionId]: {
            visible: true,
            status: 'loaded',
            explanation: payload.explanation || '',
            explanationImage: payload.explanation_img || undefined,
          },
        }));
      } catch (error) {
        console.error('Failed to load question explanation', error);
        setQuestionExplanations((prev) => ({
          ...prev,
          [questionId]: {
            ...existingState,
            visible: true,
            status: 'error',
          },
        }));
      }
      return;
    }

    setQuestionExplanations((prev) => ({
      ...prev,
      [questionId]: {
        ...existingState,
        visible: !existingState.visible,
      },
    }));
  };

  const answeredCount = questions.filter(q => isAnsweredValue(answers[q.id])).length;
  const notAnsweredCount = questions.length - answeredCount;

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
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                  {totalMarks} Marks
                </span>
                {isAnyPreview && (
                  <>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      {selectedBatches.join(', ') || 'No batches assigned'}
                    </span>
                    {!disableEditing && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${isFacultyPreview ? 'bg-teal-100 text-teal-700 border-teal-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                        {isFacultyPreview ? 'Faculty Review Mode' : 'Admin Preview Mode'}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer - only for students */}
              {!isAnyPreview && (
                <div className={`flex items-center gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl border-2 ${timeLeft <= 300 ? 'bg-red-50 border-red-300' :
                  timeLeft <= 600 ? 'bg-yellow-50 border-yellow-300' :
                    'bg-blue-50 border-blue-300'
                  }`}>
                  <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${timeLeft <= 300 ? 'text-red-600' :
                    timeLeft <= 600 ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                  <div>
                    <p className="text-xs text-gray-600">Time Left</p>
                    <p className={`text-lg sm:text-2xl font-bold ${timeLeft <= 300 ? 'text-red-600' :
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
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <X className="w-5 h-5" />
                {isAnyPreview ? 'Exit Review' : 'Exit Test'}
              </button>
            </div>
          </div>
        </div>

        {/* Subject and Section Tabs (Preview Mode Only) */}
        {isAnyPreview && (
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
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${currentSubject === s
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
                    className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${currentSection === sec
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
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          {question.marks} marks
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold uppercase">
                          {question.type}
                        </span>
                        {isAnyPreview && !disableEditing && !hideExplanations && (
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
                    {!isAnyPreview && (
                      <button
                        onClick={() => toggleFlag(question.id)}
                        className={`p-2 rounded-lg transition-colors ${flaggedQuestions.has(question.id)
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-400 hover:text-amber-600'
                          }`}
                      >
                        <Flag className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {question.type !== 'Numerical' ? (
                      question.options?.map((option, index) => {
                        const isSelected = isOptionSelected(question.id, index);
                        const isMsq = question.type === 'MSQ';
                        const normalizedAnswer = normalizeReviewAnswer(answers[question.id], question.type);
                        const isUnattempted = normalizedAnswer === null;
                        const correctOptionIndices = getCorrectOptionIndices(question);
                        const isCorrectOption = correctOptionIndices.includes(index);
                        const selectedMsqValues = Array.isArray(normalizedAnswer) ? normalizedAnswer : [];
                        const hasWrongMsqSelection = question.type === 'MSQ'
                          ? selectedMsqValues.some((value) => !correctOptionIndices.includes(value))
                          : false;
                        const isAllCorrectMsq = question.type === 'MSQ'
                          ? !hasWrongMsqSelection
                            && selectedMsqValues.length === correctOptionIndices.length
                            && correctOptionIndices.every((value, valueIndex) => selectedMsqValues[valueIndex] === value)
                          : false;

                        let optionToneClasses = 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50';
                        let controlToneClasses = isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300';
                        let badgeLabel: string | null = null;
                        let badgeClasses = '';

                        if (isStudentReviewMode) {
                          const isWrongSelectedOption = isSelected && !isCorrectOption;

                          if (isWrongSelectedOption) {
                            optionToneClasses = 'border-red-500 bg-red-50 shadow-md ring-1 ring-red-200';
                            controlToneClasses = 'border-red-500 bg-red-500';
                            badgeLabel = question.type === 'MSQ' ? 'Wrong Answer' : 'Wrong';
                            badgeClasses = 'text-red-700 bg-red-100';
                          } else if (isCorrectOption) {
                            optionToneClasses = 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-200';
                            controlToneClasses = 'border-green-500 bg-green-500';

                            if (question.type === 'MCQ') {
                              if (isUnattempted) {
                                badgeLabel = 'Unattempted';
                                badgeClasses = 'text-green-700 bg-green-100';
                              } else if (isSelected) {
                                badgeLabel = 'Right Answer';
                                badgeClasses = 'text-green-700 bg-green-100';
                              }
                            } else if (isAllCorrectMsq) {
                              badgeLabel = 'Right Answer';
                              badgeClasses = 'text-green-700 bg-green-100';
                            }
                          }
                        } else if (isAnyPreview && isCorrectOption) {
                          optionToneClasses = 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-200';
                          controlToneClasses = 'border-green-500 bg-green-500';
                          badgeLabel = 'CORRECT';
                          badgeClasses = 'text-green-600 bg-green-100';
                        }

                        return (
                          <div key={index} className="space-y-2">
                            <button
                              onClick={() => {
                                if (isAnyPreview) return;
                                if (isMsq) {
                                  toggleMsqAnswer(question.id, index);
                                  return;
                                }
                                selectAnswer(question.id, index);
                              }}
                              disabled={isAnyPreview}
                              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                isStudentReviewMode
                                  ? optionToneClasses
                                  : correctOptionIndices.includes(index)
                                    ? optionToneClasses
                                    : isSelected
                                      ? 'border-blue-500 bg-blue-50 shadow-md'
                                      : optionToneClasses
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 border-2 flex items-center justify-center flex-shrink-0 ${isMsq ? 'rounded-md' : 'rounded-full'} ${
                                  isStudentReviewMode
                                    ? controlToneClasses
                                    : correctOptionIndices.includes(index)
                                      ? controlToneClasses
                                      : isSelected
                                        ? 'border-blue-500 bg-blue-500'
                                        : controlToneClasses
                                }`}>
                                  {(isSelected || correctOptionIndices.includes(index)) && (
                                    isMsq ? <Check className="w-4 h-4 text-white" /> : <div className="w-2 h-2 bg-white rounded-full" />
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
                                {badgeLabel && (
                                  <span className={`text-xs font-bold px-2 py-1 rounded ${badgeClasses}`}>{badgeLabel}</span>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-amber-50 p-6 rounded-2xl border-2 border-dashed border-amber-200">
                        <p className="text-sm font-bold text-amber-800 mb-2">Numerical Answer</p>
                        {isStudentReviewMode ? (
                          (() => {
                            const normalizedAnswer = normalizeReviewAnswer(answers[question.id], question.type);
                            const isUnattempted = normalizedAnswer === null;
                            const isCorrect = !isUnattempted && isNumericalReviewCorrect(normalizedAnswer as string | number, question.correctAnswer);

                            return (
                              <div className="space-y-3">
                                {!isUnattempted && (
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-sm font-semibold text-slate-700">Your Answer</span>
                                    <div className={`px-6 py-3 bg-white rounded-xl border-2 font-bold text-xl ${
                                      isCorrect ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'
                                    }`}>
                                      {String(normalizedAnswer)}
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                      isCorrect ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                                    }`}>
                                      {isCorrect ? 'Your Answer Is Right' : 'Your Answer Is Wrong'}
                                    </span>
                                  </div>
                                )}
                                {isUnattempted ? (
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-sm font-semibold text-slate-700">Right Answer</span>
                                    <div className="px-6 py-3 bg-white rounded-xl border-2 border-green-500 font-bold text-green-700 text-xl">
                                      {String(question.correctAnswer)}
                                    </div>
                                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Unattempted</span>
                                  </div>
                                ) : isCorrect ? null : (
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-sm font-semibold text-slate-700">Right Answer</span>
                                    <div className="px-6 py-3 bg-white rounded-xl border-2 border-green-500 font-bold text-green-700 text-xl">
                                      {String(question.correctAnswer)}
                                    </div>
                                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Right Answer</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        ) : isAnyPreview ? (
                          <div className="flex items-center gap-3">
                            <div className="px-6 py-3 bg-white rounded-xl border-2 border-green-500 font-bold text-green-700 text-xl">
                              {question.correctAnswer}
                            </div>
                            <span className="text-xs font-bold text-green-600">CORRECT ANSWER</span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={Array.isArray(answers[question.id]) ? '' : (answers[question.id] || '')}
                            onChange={(e) => selectAnswer(question.id, e.target.value as any)}
                            className="w-full max-w-xs px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                            placeholder="Enter numerical value"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Explanation Section */}
                  {isAnyPreview && !hideExplanations && isStudentReviewMode && (
                    <div className="mt-8">
                      <button
                        onClick={() => void toggleQuestionExplanation(question.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                      >
                        {getExplanationState(question.id).visible ? 'Hide Explanation' : 'Show Explanation'}
                      </button>
                      {getExplanationState(question.id).visible && (
                        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
                          <div className="mb-3 flex items-center gap-2 text-blue-700">
                            <AlertCircle className="w-5 h-5" />
                            <h3 className="font-bold">Explanation</h3>
                          </div>
                          <div className="space-y-4">
                            {getExplanationState(question.id).status === 'loading' && (
                              <p className="text-sm font-medium text-blue-700">Loading explanation...</p>
                            )}
                            {getExplanationState(question.id).status === 'error' && (
                              <p className="text-sm font-medium text-red-600">Unable to load explanation right now.</p>
                            )}
                            {getExplanationState(question.id).status === 'loaded' && (
                              <>
                                {(getExplanationState(question.id).explanation || !getExplanationState(question.id).explanationImage) && (
                                  <p className="text-gray-700 leading-relaxed italic">
                                    {getExplanationState(question.id).explanation || 'No explanation provided for this question.'}
                                  </p>
                                )}
                                {getExplanationState(question.id).explanationImage && (
                                  <div className="rounded-xl overflow-hidden border border-blue-100 inline-block bg-white p-2">
                                    <img src={getExplanationState(question.id).explanationImage} alt="Solution" className="max-h-64 w-auto object-contain" />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {isAnyPreview && !hideExplanations && !isStudentReviewMode && (
                    <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-700 mb-3">
                        <AlertCircle className="w-5 h-5" />
                        <h3 className="font-bold">Explanation</h3>
                      </div>
                      {(question.explanation || !question.explanationImage) && (
                        <p className="text-gray-700 leading-relaxed italic mb-4">
                          {question.explanation || "No explanation provided for this question."}
                        </p>
                      )}
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
                          <label className={`relative cursor-pointer transition ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'question')} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploadingImage} />
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 font-bold text-sm">
                              {isUploadingImage ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/> : <ImageIcon className="w-4 h-4" />}
                              {isUploadingImage ? 'Uploading...' : editForm.questionImage ? 'Change Image' : 'Add Image'}
                            </div>
                          </label>
                          {editForm.questionImage && (
                            <button onClick={() => handleImageRemove('question')} className="text-xs text-red-600 font-bold hover:underline">Remove Image</button>
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
                                  {/* Option Image Controls */}
                                  <div className="flex items-center gap-3">
                                    <label className={`relative cursor-pointer transition ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'option', idx)} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploadingImage} />
                                      <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 font-bold text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors">
                                        {isUploadingImage ? <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/> : <ImageIcon className="w-3.5 h-3.5" />}
                                        {isUploadingImage ? 'Uploading...' : editForm.optionImages?.[idx] ? 'Change' : 'Image'}
                                      </div>
                                    </label>
                                    {editForm.optionImages?.[idx] && (
                                      <button onClick={() => handleImageRemove('option', idx)} className="text-[10px] text-red-600 font-bold hover:underline">Remove</button>
                                    )}
                                  </div>
                                  {editForm.optionImages?.[idx] && (
                                    <div className="rounded-lg overflow-hidden border border-gray-100 inline-block">
                                      <img src={editForm.optionImages[idx]} alt={`Option ${idx + 1}`} className="max-h-24 w-auto object-contain" />
                                    </div>
                                  )}
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
                          <label className={`relative cursor-pointer transition ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'explanation')} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploadingImage} />
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 font-bold text-xs">
                              {isUploadingImage ? <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/> : <ImageIcon className="w-3.5 h-3.5" />}
                              {isUploadingImage ? 'Uploading...' : editForm.explanationImage ? 'Change Solution Image' : 'Add Solution Image'}
                            </div>
                          </label>
                          {editForm.explanationImage && (
                            <button onClick={() => handleImageRemove('explanation')} className="text-[10px] text-red-600 font-bold hover:underline">Remove</button>
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
                      disabled={isUploadingImage}
                      className={`flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r ${isUploadingImage ? 'from-gray-400 to-gray-500 cursor-not-allowed' : 'from-blue-600 to-indigo-600 hover:shadow-lg'} text-white rounded-xl font-bold shadow-md transition-all`}
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
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${currentQuestion === 0
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
                  className={`px-8 py-3 ${isAnyPreview ? 'border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl'} rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2`}
                >
                  {isAnyPreview ? <X className="w-5 h-5 text-slate-700" /> : null}
                  {isAnyPreview ? 'Exit Review' : 'Submit Test'}
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Sidebar - Question Palette */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Question Palette</h3>

              {/* Stats - only for students */}
              {!isAnyPreview && (
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Answered</span>
                    <span className="text-lg font-bold text-green-600">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Not Answered</span>
                    <span className="text-lg font-bold text-gray-600">{notAnsweredCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Flagged</span>
                    <span className="text-lg font-bold text-amber-600">{flaggedQuestions.size}</span>
                  </div>
                </div>
              )}

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
                        className={`aspect-square rounded-lg font-semibold text-sm relative ${currentQuestion === q.globalIndex
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white ring-2 ring-blue-600 ring-offset-2 scale-110 z-10'
                          : !isAnyPreview && getQuestionStatus(q.globalIndex) === 'answered'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : isAnyPreview && hasExplanationContent(q) && !hideExplanations
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : !isAnyPreview && flaggedQuestions.has(q.id)
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {q.globalIndex + 1}
                        {!isAnyPreview && flaggedQuestions.has(q.id) && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
                        )}
                        {isAnyPreview && !hasExplanationContent(q) && !hideExplanations && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                        )}
                      </motion.button>
                    ))}
                </div>
              </div>

              {/* Legend - Review Mode */}
              {isAnyPreview && !hideExplanations && (
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
                    <div className="w-4 h-4 bg-green-100 rounded" />
                    <span className="text-xs text-gray-600">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded" />
                    <span className="text-xs text-gray-600">Not Answered</span>
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
              className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Submit Test?</h3>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Answered</span>
                  <span className="font-bold text-green-600">{answeredCount}</span>
                </div>
                <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Not Answered</span>
                  <span className="font-bold text-red-600">{notAnsweredCount}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  onClick={handleSubmit}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Yes, Submit Now
                </motion.button>
                <button
                  onClick={() => setShowSubmitDialog(false)}
                  className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Go Back
                </button>
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
                  {isSaving ? (
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  ) : isAnyPreview ? (
                    <Save className="w-10 h-10 text-amber-600" />
                  ) : (
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isSaving ? 'Saving Changes...' : isAnyPreview ? 'Save Changes?' : 'Exit & Submit?'}
                </h3>
                <p className="text-gray-600 mt-2">
                  {isSaving
                    ? 'Please wait while we update the database.'
                    : isAnyPreview
                      ? 'You have made edits to this test. Would you like to keep these changes?'
                      : 'Tests cannot be paused. If you exit now, your current answers will be submitted and the test will end.'}
                </p>
              </div>

              {!isSaving && (
                <div className="flex flex-col gap-3">
                  <motion.button
                    onClick={() => isAnyPreview ? handleConfirmExit(true) : handleConfirmExit(false)}
                    className={`w-full py-4 bg-gradient-to-r ${isAnyPreview ? 'from-teal-600 to-cyan-600' : 'from-orange-500 to-red-600'} text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all`}
                  >
                    {isAnyPreview ? 'Save & Exit' : 'Exit & Submit Now'}
                  </motion.button>
                  {isAnyPreview && (
                    <motion.button
                      onClick={() => handleConfirmExit(false)}
                      className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      Discard Changes
                    </motion.button>
                  )}
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
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
                        className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${selectedBatches.includes(batch.label)
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
