import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  Loader2,
  Target,
  Trash2,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuestionUploadForm, Question } from './QuestionUploadForm';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { apiFetchChapterById, type ApiChapter } from '../api/chapters';
import { createDpp } from '../api/dpps';

interface CreateDPPProps {
  onBack: () => void;
}

const DEFAULT_DPP_INSTRUCTIONS = [
  '1. This DPP is intended for focused chapter-wise practice.',
  '2. Read each question carefully before answering.',
  '3. The DPP may include multiple-choice, multiple-select, and/or numerical answer questions.',
  '4. For multiple-select questions, select all correct options. Partial correctness is not treated as correct unless explicitly mentioned.',
  '5. For numerical answer questions, enter the answer in the required format using the on-screen numeric keypad.',
  '6. Marks and negative marks, if any, will be applied according to the settings of each question.',
  '7. You may move between questions and review your answers before submission.',
  '8. Submit the DPP only after reviewing your responses.',
  '9. Once submitted, the attempt cannot be edited.',
  '10. Use this DPP to improve speed, accuracy, and concept clarity for the assigned chapter.',
  '11. Follow any additional chapter-specific instructions provided by the faculty.',
].join('\n');

export function CreateDPP({ onBack }: CreateDPPProps) {
  const [step, setStep] = useState(1);
  const [chapter, setChapter] = useState<ApiChapter | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [dppData, setDppData] = useState({
    title: '',
    instructions: DEFAULT_DPP_INSTRUCTIONS
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useBodyScrollLock(showSuccess);

  useEffect(() => {
    const chapterId = localStorage.getItem('createDppTargetChapterId');
    if (!chapterId) {
      setLoadingChapter(false);
      return;
    }

    void apiFetchChapterById(chapterId)
      .then(setChapter)
      .finally(() => setLoadingChapter(false));
  }, []);

  const subjectLabel = useMemo(() => chapter?.subject_name || '', [chapter?.subject_name]);
  const handleAddQuestion = (question: Question) => {
    setQuestions((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === question.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = question;
        return next;
      }
      return [...prev, question];
    });
    setEditingQuestion(null);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
    if (editingQuestion?.id === id) {
      setEditingQuestion(null);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async () => {
    if (!chapter) return;

    try {
      setPublishing(true);
      await createDpp({
        title: dppData.title.trim(),
        instructions: dppData.instructions,
        chapter_id: chapter.id,
        questions,
      });
      setShowSuccess(true);
      localStorage.removeItem('createDppTargetChapterId');
      localStorage.removeItem('createDppTargetChapterName');
      setTimeout(() => {
        onBack();
      }, 1600);
    } catch (error: any) {
      alert(error?.message || 'Failed to create DPP');
    } finally {
      setPublishing(false);
    }
  };

  const isStep1Valid = dppData.title.trim().length > 0 && !!chapter;
  const isStep2Valid = questions.length >= 1;

  if (loadingChapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-center rounded-3xl bg-white p-10 shadow-xl">
          <div className="flex items-center gap-3 text-gray-700">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
            Loading chapter details...
          </div>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 py-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 shadow-xl">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 font-semibold text-gray-600 hover:text-cyan-600"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Select a chapter first</h1>
          <p className="mt-2 text-gray-600">
            Open a chapter in the faculty content screen and start DPP creation from there so the chapter context is locked.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 font-semibold text-gray-600 hover:text-cyan-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Daily Practice Paper</h1>
                <p className="text-gray-600">
                  {chapter.subject_name} • {chapter.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              {[
                { num: 1, label: 'DPP Details', icon: ClipboardList },
                { num: 2, label: 'Add Questions', icon: Target },
                { num: 3, label: 'Review & Publish', icon: CheckCircle }
              ].map((item, index) => (
                <div key={item.num} className="flex flex-1 items-center">
                  <div className="flex flex-1 items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                      step >= item.num ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step > item.num ? <CheckCircle className="w-5 h-5" /> : item.num}
                    </div>
                    <span className={`hidden text-sm font-medium sm:inline ${step >= item.num ? 'text-cyan-600' : 'text-gray-500'}`}>
                      {item.label}
                    </span>
                  </div>
                  {index < 2 && <div className={`mx-2 h-1 flex-1 rounded-full ${step > item.num ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                  <Zap className="w-6 h-6 text-cyan-600" />
                  DPP Configuration
                </h2>

                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                      <p className="text-sm text-gray-600">Subject</p>
                      <p className="font-semibold text-gray-900">{chapter.subject_name}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-sm text-gray-600">Chapter</p>
                      <p className="font-semibold text-gray-900">{chapter.name}</p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">DPP Title *</label>
                    <input
                      type="text"
                      value={dppData.title}
                      onChange={(e) => setDppData({ ...dppData, title: e.target.value })}
                      placeholder={`e.g., ${chapter.subject_name} - ${chapter.name} DPP 01`}
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Instructions for Students</label>
                    <textarea
                      value={dppData.instructions}
                      onChange={(e) => setDppData({ ...dppData, instructions: e.target.value })}
                      rows={5}
                      placeholder="Add instructions that should appear before the student starts the DPP..."
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => isStep1Valid && setStep(2)}
                    disabled={!isStep1Valid}
                    className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue to Questions
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div ref={formRef} className="scroll-mt-8">
                <QuestionUploadForm
                  onAddQuestion={handleAddQuestion}
                  buttonLabel="Add Question to DPP"
                  fixedSubject={subjectLabel}
                  showMarks={false}
                  editingQuestion={editingQuestion}
                  onCancelEdit={() => setEditingQuestion(null)}
                  uploadContext="dpps"
                  uploadContextId={chapter.id}
                />
              </div>

              {questions.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Added Questions ({questions.length})</h3>
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleEditQuestion(question)}
                        className={`flex items-start gap-4 rounded-xl border transition-all cursor-pointer ${editingQuestion?.id === question.id
                          ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-200'
                          : 'border-cyan-100 bg-cyan-50 hover:border-cyan-300 hover:shadow-md'
                        } p-4`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 font-semibold text-white">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <p className="font-medium text-gray-900">{question.question || 'Image-based question'}</p>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                              {question.type}
                            </span>
                            {editingQuestion?.id === question.id && (
                              <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                EDITING
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveQuestion(question.id);
                          }}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Previous
                </button>
                <button
                  onClick={() => isStep2Valid && setStep(3)}
                  disabled={!isStep2Valid}
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Review & Publish
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
                <h2 className="mb-6 text-xl font-bold text-gray-900">Review DPP Details</h2>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">Title</p>
                    <p className="font-semibold text-gray-900">{dppData.title}</p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-teal-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">Questions</p>
                    <p className="font-semibold text-gray-900">{questions.length}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">Subject</p>
                    <p className="font-semibold text-gray-900">{chapter.subject_name}</p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                    <p className="mb-1 text-sm text-gray-600">Chapter</p>
                    <p className="font-semibold text-gray-900">{chapter.name}</p>
                  </div>
                </div>

                {!!dppData.instructions.trim() && (
                  <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <p className="mb-2 text-sm font-semibold text-gray-700">Instructions Preview</p>
                    <div className="space-y-2 text-gray-700">
                      {dppData.instructions.split('\n').map((line, index) => (
                        line.trim() ? <p key={index}>{line.trim()}</p> : null
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={publishing}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 font-semibold text-white shadow-lg disabled:opacity-50"
                  >
                    {publishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {publishing ? 'Publishing...' : 'Publish DPP'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
              >
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-gray-900">DPP Created Successfully!</h3>
                <p className="text-gray-600">Your DPP is now available to students in this chapter.</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
