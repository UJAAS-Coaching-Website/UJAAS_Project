import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Target,
  Users,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuestionUploadForm, Question } from './QuestionUploadForm';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface BatchInfo {
  label: string;
  slug: string;
  subjects?: string[];
}

interface CreateTestSeriesProps {
  onBack: () => void;
  batches: BatchInfo[];
  onPublish?: (test: any) => Promise<void> | void;
  onSaveDraft?: (test: any) => Promise<string>;
  resumeTest?: import('../App').PublishedTest;
}

export function CreateTestSeries({ onBack, batches, onPublish, onSaveDraft, resumeTest }: CreateTestSeriesProps) {
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(resumeTest?.id || null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [testData, setTestData] = useState({
    title: '',
    format: 'JEE MAIN' as 'JEE MAIN' | 'NEET' | 'Custom',
    selectedBatches: [] as string[],
    duration: 180,
    totalMarks: 300,
    passingMarks: 120,
    scheduleDate: '',
    scheduleTime: '09:00',
    instructions: ''
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Resume from draft: pre-populate data
  useEffect(() => {
    if (resumeTest) {
      setTestData({
        title: resumeTest.title || '',
        format: (resumeTest.format || 'Custom') as any,
        selectedBatches: resumeTest.batches || [],
        duration: resumeTest.duration || 180,
        totalMarks: resumeTest.totalMarks || 300,
        passingMarks: 120,
        scheduleDate: resumeTest.scheduleDate || '',
        scheduleTime: resumeTest.scheduleTime || '09:00',
        instructions: resumeTest.instructions || ''
      });
      setQuestions(resumeTest.questions || []);
      // Jump to step 2 if config is already filled
      if (resumeTest.title && resumeTest.batches?.length) {
        setStep(2);
      }
    }
  }, []);

  const handleEditClick = (q: Question) => {
    setEditingQuestion(q);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [activeSubject, setActiveSubject] = useState('Physics');
  const [activeSection, setActiveSection] = useState<'Section A' | 'Section B'>('Section A');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  useBodyScrollLock(showSuccess);

  const allWebsiteSubjects = useMemo(() => {
    const defaults = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    const fromBatches = batches.flatMap((batch) => batch.subjects ?? []);
    return Array.from(new Set([...defaults, ...fromBatches.map((subject) => subject.trim()).filter(Boolean)]));
  }, [batches]);

  const [customSubjects, setCustomSubjects] = useState<string[]>(allWebsiteSubjects);

  useEffect(() => {
    const validSubjects = getSubjects();
    if (!validSubjects.includes(activeSubject)) {
      setActiveSubject(validSubjects[0]);
    }
  }, [testData.format, customSubjects, allWebsiteSubjects, activeSubject]);

  useEffect(() => {
    setEditingQuestion(null);
  }, [activeSubject, activeSection]);

  useEffect(() => {
    if (customSubjects.length === 0) {
      setCustomSubjects(allWebsiteSubjects);
      return;
    }
    const unknownSubjects = customSubjects.filter((subject) => !allWebsiteSubjects.includes(subject));
    if (unknownSubjects.length > 0) {
      setCustomSubjects((prev) => prev.filter((subject) => allWebsiteSubjects.includes(subject)));
    }
  }, [allWebsiteSubjects, customSubjects]);

  const formats = ['JEE MAIN', 'NEET', 'Custom'];

  const getSubjects = () => {
    if (testData.format === 'JEE MAIN') return ['Physics', 'Chemistry', 'Mathematics'];
    if (testData.format === 'NEET') return ['Physics', 'Chemistry', 'Biology'];
    return customSubjects.length > 0 ? customSubjects : allWebsiteSubjects;
  };

  const currentSubjects = getSubjects();

  const handleAddQuestion = (question: Question) => {
    const enrichedQuestion = {
      ...question,
      subject: activeSubject,
      metadata: {
        section: testData.format === 'JEE MAIN' ? activeSection : undefined
      }
    };

    let nextQuestions: Question[] = [];
    setQuestions(prev => {
      const exists = prev.findIndex(q => q.id === question.id);
      if (exists > -1) {
        nextQuestions = [...prev];
        nextQuestions[exists] = enrichedQuestion;
      } else {
        nextQuestions = [...prev, enrichedQuestion];
      }
      // Auto-save with the new list
      handleSaveDraftClick(undefined, nextQuestions);
      return nextQuestions;
    });
    setEditingQuestion(null);
  };

  const filteredQuestions = questions.filter(q =>
    q.subject === activeSubject &&
    (testData.format !== 'JEE MAIN' || (q as any).metadata?.section === activeSection)
  );

  const handleRemoveQuestion = (id: string) => {
    const nextQuestions = questions.filter(q => q.id !== id);
    setQuestions(nextQuestions);
    // Auto-save
    handleSaveDraftClick(undefined, nextQuestions);
  };

  const fillDemoQuestions = () => {
    const demoQuestions: any[] = [];
    const subjects = getSubjects();
    const timestamp = Date.now();

    if (testData.format === 'JEE MAIN') {
      subjects.forEach(subject => {
        // 20 MCQ (Section A)
        for (let i = 1; i <= 20; i++) {
          demoQuestions.push({
            id: crypto.randomUUID(),
            type: 'MCQ',
            question: `${subject} - Practice Question ${i} (Section A)`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            difficulty: 'Medium',
            marks: 4,
            negativeMarks: 1,
            subject: subject,
            metadata: { section: 'Section A' }
          });
        }
        // 10 Numerical (Section B)
        for (let i = 1; i <= 10; i++) {
          demoQuestions.push({
            id: crypto.randomUUID(),
            type: 'Numerical',
            question: `${subject} - Numerical Practice ${i} (Section B)`,
            correctAnswer: '10',
            difficulty: 'Medium',
            marks: 4,
            negativeMarks: 0,
            subject: subject,
            metadata: { section: 'Section B' }
          });
        }
      });
    } else if (testData.format === 'NEET') {
      const neetSubjectCounts: Record<string, number> = {
        Physics: 45,
        Chemistry: 45,
        Biology: 90
      };
      subjects.forEach(subject => {
        const count = neetSubjectCounts[subject] ?? 0;
        for (let i = 1; i <= count; i++) {
          demoQuestions.push({
            id: crypto.randomUUID(),
            type: 'MCQ',
            question: `${subject} - NEET Practice Question ${i}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            difficulty: 'Medium',
            marks: 4,
            negativeMarks: 1,
            subject: subject
          });
        }
      });
    } else {
      subjects.forEach(subject => {
        for (let i = 1; i <= 2; i++) {
          demoQuestions.push({
            id: crypto.randomUUID(),
            type: 'MCQ',
            question: `${subject} - Custom Practice Question ${i}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            difficulty: 'Medium',
            marks: 4,
            negativeMarks: 0,
            subject: subject
          });
        }
      });
    }
    setQuestions(demoQuestions);
  };

  const toggleBatch = (label: string) => {
    setTestData(prev => ({
      ...prev,
      selectedBatches: prev.selectedBatches.includes(label)
        ? prev.selectedBatches.filter(b => b !== label)
        : [...prev.selectedBatches, label]
    }));
  };

  const handleSubmit = async () => {
    if (onPublish) {
      setIsPublishing(true);
      try {
        await onPublish({
          id: draftId || undefined,
          title: testData.title,
          format: testData.format,
          batches: testData.selectedBatches,
          duration: testData.duration,
          totalMarks: testData.totalMarks,
          scheduleDate: testData.scheduleDate,
          scheduleTime: testData.scheduleTime,
          questions: questions,
          instructions: testData.instructions
        });
        setShowSuccess(true);
        setTimeout(() => {
          onBack();
        }, 2000);
      } catch (error) {
        console.error("Failed to publish test:", error);
      } finally {
        setIsPublishing(false);
      }
    } else {
      setShowSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    }
  };

  const handleSaveDraftClick = async (overrideTestData?: typeof testData, overrideQuestions?: Question[]) => {
    if (!onSaveDraft) return;
    setIsSavingDraft(true);
    try {
      const dataToSave = {
        id: draftId || undefined,
        title: (overrideTestData?.title || testData.title) || 'Untitled Draft',
        format: overrideTestData?.format || testData.format,
        batches: overrideTestData?.selectedBatches || testData.selectedBatches,
        duration: overrideTestData?.duration || testData.duration,
        totalMarks: overrideTestData?.totalMarks || testData.totalMarks,
        scheduleDate: overrideTestData?.scheduleDate || testData.scheduleDate,
        scheduleTime: overrideTestData?.scheduleTime || testData.scheduleTime,
        questions: overrideQuestions || questions,
        instructions: overrideTestData?.instructions || testData.instructions
      };
      
      const newId = await onSaveDraft(dataToSave);
      if (newId) setDraftId(newId);
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleContinueToAddQuestions = async () => {
    if (isStep1Valid) {
      setStep(2);
      // Create draft when moving to step 2 if not already created
      handleSaveDraftClick();
    }
  };

  const isStep1Valid = testData.title && testData.selectedBatches.length > 0 && testData.scheduleDate;

  const getRequiredCount = () => {
    if (testData.format === 'JEE MAIN') return 90;
    if (testData.format === 'NEET') return 180;
    return 5;
  };

  const toggleCustomSubject = (subject: string) => {
    setCustomSubjects((prev) => {
      if (prev.includes(subject)) {
        if (prev.length === 1) return prev;
        const next = prev.filter((item) => item !== subject);
        if (activeSubject === subject) {
          setActiveSubject(next[0]);
        }
        return next;
      }
      return [...prev, subject];
    });
  };

  const isStep2Valid = questions.length >= getRequiredCount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition mb-4 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create {testData.format} Test</h1>
                <p className="text-gray-600">
                  {testData.format === 'Custom'
                    ? 'Design a custom test with flexible configuration'
                    : `Follow standard ${testData.format} examination pattern`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              {[
                { num: 1, label: 'Test Config' },
                { num: 2, label: 'Add Questions' },
                { num: 3, label: 'Review & Publish' }
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= s.num
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-500'
                      }`}>
                      {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${step >= s.num ? 'text-teal-600' : 'text-gray-500'
                      }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${step > s.num ? 'bg-gradient-to-r from-teal-600 to-cyan-600' : 'bg-gray-200'
                      }`} />
                  )}
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
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-teal-600" />
                  Test Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Test Name *
                    </label>
                    <input
                      type="text"
                      value={testData.title}
                      onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                      placeholder="e.g., Full Syllabus Mock Test #01"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Test Format *
                    </label>
                    <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
                      {formats.map((f) => (
                        <button
                          key={f}
                          onClick={() => {
                            const duration = f === 'JEE MAIN' ? 180 : f === 'NEET' ? 180 : 180;
                            const marks = f === 'JEE MAIN' ? 300 : f === 'NEET' ? 720 : 300;
                            setTestData({ ...testData, format: f as any, duration, totalMarks: marks });
                          }}
                          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${testData.format === f
                            ? 'bg-white text-teal-600 shadow-md'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Select Batches *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {batches.map((batch) => (
                        <button
                          key={batch.slug}
                          onClick={() => toggleBatch(batch.label)}
                          className={`px-4 py-2 rounded-xl border-2 transition-all font-semibold text-sm ${testData.selectedBatches.includes(batch.label)
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                        >
                          {batch.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date *
                    </label>
                    <input
                      type="date"
                      value={testData.scheduleDate}
                      onChange={(e) => setTestData({ ...testData, scheduleDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={testData.scheduleTime}
                      onChange={(e) => setTestData({ ...testData, scheduleTime: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={testData.duration}
                      onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      value={testData.totalMarks}
                      readOnly={testData.format !== 'Custom'}
                      onChange={(e) => setTestData({ ...testData, totalMarks: parseInt(e.target.value) })}
                      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${testData.format !== 'Custom' ? 'bg-gray-50' : ''}`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Instructions / Remarks
                    </label>
                    <textarea
                      value={testData.instructions}
                      onChange={(e) => setTestData({ ...testData, instructions: e.target.value })}
                      rows={4}
                      placeholder="Enter test instructions or special remarks..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <motion.button
                    onClick={handleContinueToAddQuestions}
                    disabled={!isStep1Valid}
                    className="px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Continue to Add Questions
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </motion.button>
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
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 w-full">
                  {testData.format === 'Custom' ? (
                    <div className="bg-white/60 backdrop-blur rounded-2xl border border-white shadow-sm p-3">
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Subjects (Multi Select)</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsSubjectDropdownOpen((prev) => !prev)}
                          className="w-full text-left px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-teal-400 transition"
                        >
                          {customSubjects.length > 0 ? customSubjects.join(', ') : 'Select subjects'}
                        </button>
                        {isSubjectDropdownOpen && (
                          <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto p-2">
                            {allWebsiteSubjects.map((subject) => (
                              <label key={subject} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={customSubjects.includes(subject)}
                                  onChange={() => toggleCustomSubject(subject)}
                                  className="w-4 h-4 text-teal-600 rounded border-gray-300"
                                />
                                <span>{subject}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {currentSubjects.map((s) => (
                          <button
                            key={s}
                            onClick={() => setActiveSubject(s)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeSubject === s
                              ? 'bg-teal-600 text-white'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
                              }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 p-1.5 bg-white/50 backdrop-blur rounded-2xl border border-white shadow-sm overflow-x-auto w-full">
                      {currentSubjects.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setActiveSubject(s);
                            setActiveSection('Section A');
                          }}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeSubject === s
                            ? 'bg-teal-600 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fillDemoQuestions}
                  className="px-5 py-2.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors border border-amber-200 whitespace-nowrap"
                >
                  Fill Demo Questions
                </button>
              </div>

              {testData.format === 'JEE MAIN' && (
                <div className="flex gap-4">
                  {(['Section A', 'Section B'] as const).map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setActiveSection(sec)}
                      className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${activeSection === sec
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-white bg-white/50 text-gray-500'
                        }`}
                    >
                      {sec}
                      <span className="ml-2 text-xs opacity-60">
                        ({questions.filter(q => q.subject === activeSubject && (q as any).metadata?.section === sec).length} questions)
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {testData.format !== 'Custom' && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">Standard {testData.format} Pattern:</p>
                    {testData.format === 'JEE MAIN' ? (
                      <p>{activeSection === 'Section A' ? 'Section A: 20 Multiple Choice Questions (+4, -1)' : 'Section B: 10 Numerical Value Questions (+4, 0) - Students attempt 5'}</p>
                    ) : (
                      <p>Physics: 45 MCQs, Chemistry: 45 MCQs, Biology: 90 MCQs (all +4, -1)</p>
                    )}
                  </div>
                </div>
              )}

              <div ref={formRef} className="scroll-mt-8">
                <QuestionUploadForm
                  onAddQuestion={handleAddQuestion}
                  buttonLabel={`Add to ${activeSubject}${testData.format === 'JEE MAIN' ? ` - ${activeSection}` : ''}`}
                  showMarks={testData.format === 'Custom'}
                  showSubject={false}
                  subjects={currentSubjects}
                  fixedType={
                    testData.format === 'JEE MAIN'
                      ? (activeSection === 'Section A' ? 'MCQ' : 'Numerical')
                      : testData.format === 'NEET' ? 'MCQ' : undefined
                  }
                  defaultMarks={4}
                  defaultNegativeMarks={testData.format === 'JEE MAIN' || testData.format === 'NEET' ? 1 : 0}
                  fixedSubject={activeSubject}
                  editingQuestion={editingQuestion}
                  onCancelEdit={() => setEditingQuestion(null)}
                />
              </div>

              {filteredQuestions.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Added in {activeSubject} {testData.format === 'JEE MAIN' && `- ${activeSection}`} ({filteredQuestions.length})
                  </h3>
                  <div className="space-y-3">
                    {filteredQuestions.map((q, index) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleEditClick(q)}
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group ${editingQuestion?.id === q.id
                          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                          : 'bg-teal-50 border-teal-100 hover:border-teal-300 hover:shadow-md'
                          }`}
                        title="Click to edit question"
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-semibold ${editingQuestion?.id === q.id ? 'bg-amber-600' : 'bg-teal-600'
                          } text-white`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium mb-2">{q.question}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                            <span className="px-2 py-1 bg-white rounded border border-teal-100 text-teal-700 font-medium uppercase">
                              Type: {q.type}
                            </span>
                            <span className="px-2 py-1 bg-white rounded border border-teal-100 text-teal-700 font-medium">
                              Marks: +{q.marks ?? 0}
                            </span>
                            <span className="px-2 py-1 bg-white rounded border border-teal-100 text-rose-700 font-medium">
                              Negative: -{(q as any).negativeMarks ?? 0}
                            </span>
                            {editingQuestion?.id === q.id && (
                              <span className="px-2 py-1 bg-amber-600 text-white rounded font-bold">
                                EDITING...
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveQuestion(q.id);
                          }}
                          className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition"
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
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Previous
                </button>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-xl border border-gray-100 italic text-xs text-gray-500">
                      <div className={`w-2 h-2 rounded-full ${isSavingDraft ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
                      {isSavingDraft ? 'Auto-saving...' : 'Draft saved'}
                    </div>
                    {onSaveDraft && (
                      <motion.button
                        onClick={() => handleSaveDraftClick()}
                        disabled={isSavingDraft}
                        className="px-6 py-3 bg-amber-100 text-amber-700 rounded-xl font-semibold border border-amber-200 hover:bg-amber-200 transition-all disabled:opacity-60 flex items-center gap-2"
                      >
                        {isSavingDraft ? (
                          <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        {isSavingDraft ? 'Saving...' : draftId ? 'Update Draft' : 'Save as Draft'}
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => isStep2Valid && setStep(3)}
                      disabled={!isStep2Valid}
                      className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Review & Publish
                    </motion.button>
                  </div>
                  <p className="w-full text-right text-xs text-gray-500 font-medium">
                    Total: {questions.length} / {getRequiredCount()} questions added
                  </p>
                </div>
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
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Review Test Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                    <p className="text-sm text-gray-600 mb-1 font-bold">Title</p>
                    <p className="font-semibold text-gray-900">{testData.title}</p>
                  </div>
                  <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                    <p className="text-sm text-gray-600 mb-1 font-bold">Format</p>
                    <p className="font-semibold text-gray-900">{testData.format}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-600 mb-1 font-bold">Target Batches</p>
                    <p className="font-semibold text-gray-900">{testData.selectedBatches.join(', ')}</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                    <p className="text-sm text-gray-600 mb-1 font-bold">Total Questions</p>
                    <p className="font-semibold text-gray-900">{questions.length}</p>
                  </div>
                  <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                    <p className="text-sm text-gray-600 mb-1 font-bold">Duration</p>
                    <p className="font-semibold text-gray-900">{testData.duration} minutes</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-600 mb-1 font-bold">Total Marks</p>
                    <p className="font-semibold text-gray-900">{testData.totalMarks}</p>
                  </div>
                  {testData.instructions && (
                    <div className="md:col-span-2 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-sm text-gray-600 mb-1 font-bold">General Instructions</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{testData.instructions}</p>
                    </div>
                  )}
                </div>

                <div className="mb-6 p-6 bg-gray-50 rounded-2xl">
                  <h3 className="font-bold text-gray-900 mb-4">Questions Distribution</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {currentSubjects.map(s => (
                      <div key={s} className="text-center">
                        <div className="text-2xl font-bold text-teal-600">
                          {questions.filter(q => q.subject === s).length}
                        </div>
                        <div className="text-xs text-gray-500 uppercase font-bold">{s}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-xl border border-gray-100 italic text-xs text-gray-500">
                      <div className={`w-2 h-2 rounded-full ${isSavingDraft ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
                      {isSavingDraft ? 'Auto-saving...' : 'Draft saved'}
                    </div>
                    {onSaveDraft && (
                      <motion.button
                        onClick={() => handleSaveDraftClick()}
                        disabled={isSavingDraft}
                        className="px-6 py-3 bg-amber-100 text-amber-700 rounded-xl font-semibold border border-amber-200 hover:bg-amber-200 transition-all disabled:opacity-60 flex items-center gap-2"
                      >
                        {isSavingDraft ? (
                          <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        {isSavingDraft ? 'Saving...' : draftId ? 'Update Draft' : 'Save as Draft'}
                      </motion.button>
                    )}
                    <motion.button
                      onClick={handleSubmit}
                      disabled={isPublishing}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Publish Test Series
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(showSuccess || isPublishing) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto text-center shadow-2xl"
              >
                {isPublishing ? (
                  <>
                    <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Creating Test Series...</h3>
                    <p className="text-gray-600">
                      Please wait while we set up your test and save the questions.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Test Series Created!</h3>
                    <p className="text-gray-600">
                      Your test series has been successfully published and is now available to students.
                    </p>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

