import { useState, useEffect } from 'react';
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

interface BatchInfo {
  label: string;
  slug: string;
}

interface CreateTestSeriesProps {
  onBack: () => void;
  batches: BatchInfo[];
}

export function CreateTestSeries({ onBack, batches }: CreateTestSeriesProps) {
  const [step, setStep] = useState(1);
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSubject, setActiveSubject] = useState('Physics');
  const [activeSection, setActiveSection] = useState<'Section A' | 'Section B'>('Section A');

  useEffect(() => {
    const validSubjects = getSubjects();
    if (!validSubjects.includes(activeSubject)) {
      setActiveSubject(validSubjects[0]);
    }
  }, [testData.format]);

  const formats = ['JEE MAIN', 'NEET', 'Custom'];
  
  const getSubjects = () => {
    if (testData.format === 'JEE MAIN') return ['Physics', 'Chemistry', 'Mathematics'];
    if (testData.format === 'NEET') return ['Physics', 'Chemistry', 'Biology'];
    return ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  };

  const currentSubjects = getSubjects();

  const handleAddQuestion = (question: Question) => {
    const enrichedQuestion = {
      ...question,
      subject: activeSubject,
      metadata: {
        section: testData.format === 'Custom' ? undefined : activeSection
      }
    };
    setQuestions([...questions, enrichedQuestion]);
  };

  const filteredQuestions = questions.filter(q => 
    q.subject === activeSubject && 
    (testData.format === 'Custom' || (q as any).metadata?.section === activeSection)
  );

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const toggleBatch = (label: string) => {
    setTestData(prev => ({
      ...prev,
      selectedBatches: prev.selectedBatches.includes(label)
        ? prev.selectedBatches.filter(b => b !== label)
        : [...prev.selectedBatches, label]
    }));
  };

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => {
      onBack();
    }, 2000);
  };

  const isStep1Valid = testData.title && testData.selectedBatches.length > 0 && testData.scheduleDate;
  
  const getRequiredCount = () => {
    if (testData.format === 'JEE MAIN') return 90;
    if (testData.format === 'NEET') return 200;
    return 5;
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= s.num 
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${
                      step >= s.num ? 'text-teal-600' : 'text-gray-500'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                      step > s.num ? 'bg-gradient-to-r from-teal-600 to-cyan-600' : 'bg-gray-200'
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
                            const duration = f === 'JEE MAIN' ? 180 : f === 'NEET' ? 200 : 180;
                            const marks = f === 'JEE MAIN' ? 300 : f === 'NEET' ? 720 : 300;
                            setTestData({ ...testData, format: f as any, duration, totalMarks: marks });
                          }}
                          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                            testData.format === f
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
                          className={`px-4 py-2 rounded-xl border-2 transition-all font-semibold text-sm ${
                            testData.selectedBatches.includes(batch.label)
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => isStep1Valid && setStep(2)}
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
              <div className="flex gap-2 p-1.5 bg-white/50 backdrop-blur rounded-2xl border border-white shadow-sm overflow-x-auto">
                {currentSubjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setActiveSubject(s);
                      setActiveSection('Section A');
                    }}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      activeSubject === s
                        ? 'bg-teal-600 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {testData.format !== 'Custom' && (
                <div className="flex gap-4">
                  {(['Section A', 'Section B'] as const).map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setActiveSection(sec)}
                      className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${
                        activeSection === sec
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
                      <p>{activeSection === 'Section A' ? 'Section A: 35 Compulsory MCQs (+4, -1)' : 'Section B: 15 MCQs (+4, -1) - Students attempt 10'}</p>
                    )}
                  </div>
                </div>
              )}

              <QuestionUploadForm 
                onAddQuestion={handleAddQuestion} 
                buttonLabel={`Add to ${activeSubject} - ${activeSection}`}
                showMarks={testData.format === 'Custom'}
                showSubject={testData.format === 'Custom'}
                subjects={currentSubjects}
                fixedType={
                  testData.format === 'JEE MAIN' 
                    ? (activeSection === 'Section A' ? 'MCQ' : 'Numerical')
                    : testData.format === 'NEET' ? 'MCQ' : undefined
                }
                defaultMarks={4}
                fixedSubject={activeSubject}
              />

              {filteredQuestions.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Added in {activeSubject} {testData.format !== 'Custom' && `- ${activeSection}`} ({filteredQuestions.length})
                  </h3>
                  <div className="space-y-3">
                    {filteredQuestions.map((q, index) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-4 p-4 bg-teal-50 rounded-xl border border-teal-100"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium mb-2">{q.question}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                            <span className="px-2 py-1 bg-white rounded border border-teal-100 text-teal-700 font-medium uppercase">
                              Type: {q.type}
                            </span>
                            <span className="px-2 py-1 bg-white rounded border border-teal-100 text-teal-700 font-medium">
                              Marks: {q.marks}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveQuestion(q.id)}
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => isStep2Valid && setStep(3)}
                    disabled={!isStep2Valid}
                    className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Review & Publish
                  </motion.button>
                  <p className="text-xs text-gray-500 font-medium">
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Publish Test Series
                  </motion.button>
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
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Test Series Created!</h3>
                <p className="text-gray-600">
                  Your test series has been successfully published and is now available to students.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
