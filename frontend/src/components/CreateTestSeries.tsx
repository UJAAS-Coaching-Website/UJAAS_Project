import { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  FileText,
  CheckCircle,
  AlertCircle,
  Book,
  Target,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  subject: string;
}

interface CreateTestSeriesProps {
  onBack: () => void;
}

export function CreateTestSeries({ onBack }: CreateTestSeriesProps) {
  const [step, setStep] = useState(1);
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    course: '',
    subject: '',
    duration: 180,
    totalMarks: 100,
    passingMarks: 40,
    startDate: '',
    endDate: '',
    instructions: ''
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: Date.now().toString(),
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    marks: 4,
    subject: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const courses = ['JEE Main', 'JEE Advanced', 'NEET', 'Foundation Course'];
  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  const handleAddQuestion = () => {
    if (currentQuestion.question && currentQuestion.options.every(opt => opt.trim())) {
      setQuestions([...questions, { ...currentQuestion, id: Date.now().toString() }]);
      setCurrentQuestion({
        id: Date.now().toString(),
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: 4,
        subject: currentQuestion.subject
      });
    }
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => {
      onBack();
    }, 2000);
  };

  const isStep1Valid = testData.title && testData.course && testData.subject && testData.startDate && testData.endDate;
  const isStep2Valid = questions.length >= 5;

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
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition mb-4"
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
                <h1 className="text-3xl font-bold text-gray-900">Create Test Series</h1>
                <p className="text-gray-600">Design comprehensive tests for your students</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-4 mt-6">
              {[
                { num: 1, label: 'Test Details' },
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

        {/* Step 1: Test Details */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Book className="w-6 h-6 text-teal-600" />
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Test Title *
                    </label>
                    <input
                      type="text"
                      value={testData.title}
                      onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                      placeholder="e.g., JEE Main Mock Test - Physics"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Course *
                    </label>
                    <select
                      value={testData.course}
                      onChange={(e) => setTestData({ ...testData, course: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      value={testData.subject}
                      onChange={(e) => setTestData({ ...testData, subject: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={testData.duration}
                      onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      value={testData.totalMarks}
                      onChange={(e) => setTestData({ ...testData, totalMarks: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Passing Marks
                    </label>
                    <input
                      type="number"
                      value={testData.passingMarks}
                      onChange={(e) => setTestData({ ...testData, passingMarks: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={testData.startDate}
                      onChange={(e) => setTestData({ ...testData, startDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={testData.description}
                      onChange={(e) => setTestData({ ...testData, description: e.target.value })}
                      rows={3}
                      placeholder="Brief description of the test..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Instructions
                    </label>
                    <textarea
                      value={testData.instructions}
                      onChange={(e) => setTestData({ ...testData, instructions: e.target.value })}
                      rows={4}
                      placeholder="Test instructions for students..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => isStep1Valid && setStep(2)}
                    disabled={!isStep1Valid}
                    className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Questions
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Add Questions */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Question Form */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-teal-600" />
                  Add Question {questions.length + 1}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                      rows={3}
                      placeholder="Enter your question here..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Option {String.fromCharCode(65 + index)} *
                        </label>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[index] = e.target.value;
                            setCurrentQuestion({ ...currentQuestion, options: newOptions });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Correct Answer *
                      </label>
                      <select
                        value={currentQuestion.correctAnswer}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      >
                        {currentQuestion.options.map((_, index) => (
                          <option key={index} value={index}>
                            Option {String.fromCharCode(65 + index)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Marks
                      </label>
                      <input
                        type="number"
                        value={currentQuestion.marks}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject
                      </label>
                      <select
                        value={currentQuestion.subject}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, subject: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddQuestion}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Add Question
                  </motion.button>
                </div>
              </div>

              {/* Questions List */}
              {questions.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Added Questions ({questions.length})
                  </h3>
                  <div className="space-y-3">
                    {questions.map((q, index) => (
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
                            <span className="px-2 py-1 bg-white rounded">Correct: {String.fromCharCode(65 + q.correctAnswer)}</span>
                            <span className="px-2 py-1 bg-white rounded">Marks: {q.marks}</span>
                            {q.subject && <span className="px-2 py-1 bg-white rounded">{q.subject}</span>}
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

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Previous
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => isStep2Valid && setStep(3)}
                  disabled={!isStep2Valid}
                  className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review & Publish
                </motion.button>
              </div>

              {questions.length < 5 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">
                      Add at least 5 questions to continue (Current: {questions.length})
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Review */}
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
                  <div className="p-4 bg-teal-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Title</p>
                    <p className="font-semibold text-gray-900">{testData.title}</p>
                  </div>
                  <div className="p-4 bg-cyan-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Course</p>
                    <p className="font-semibold text-gray-900">{testData.course}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Subject</p>
                    <p className="font-semibold text-gray-900">{testData.subject}</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Total Questions</p>
                    <p className="font-semibold text-gray-900">{questions.length}</p>
                  </div>
                  <div className="p-4 bg-cyan-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Duration</p>
                    <p className="font-semibold text-gray-900">{testData.duration} minutes</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Total Marks</p>
                    <p className="font-semibold text-gray-900">{testData.totalMarks}</p>
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

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
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
