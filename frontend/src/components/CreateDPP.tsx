import { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Clock,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  Target,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface CreateDPPProps {
  onBack: () => void;
}

export function CreateDPP({ onBack }: CreateDPPProps) {
  const [step, setStep] = useState(1);
  const [dppData, setDppData] = useState({
    title: '',
    subject: '',
    topic: '',
    duration: 60,
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    instructions: ''
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: Date.now().toString(),
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'Medium'
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  const difficulties: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];

  const handleAddQuestion = () => {
    if (currentQuestion.question && currentQuestion.options.every(opt => opt.trim())) {
      setQuestions([...questions, { ...currentQuestion, id: Date.now().toString() }]);
      setCurrentQuestion({
        id: Date.now().toString(),
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        difficulty: currentQuestion.difficulty
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

  const isStep1Valid = dppData.title && dppData.subject && dppData.topic;
  const isStep2Valid = questions.length >= 10;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-700 bg-green-100';
      case 'Medium': return 'text-yellow-700 bg-yellow-100';
      case 'Hard': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-cyan-600 transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Daily Practice Paper</h1>
                <p className="text-gray-600">Build targeted practice problems for students</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-4 mt-6">
              {[
                { num: 1, label: 'DPP Details', icon: ClipboardList },
                { num: 2, label: 'Add Questions', icon: Target },
                { num: 3, label: 'Review & Publish', icon: CheckCircle }
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= s.num 
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${
                      step >= s.num ? 'text-cyan-600' : 'text-gray-500'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                      step > s.num ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Step 1: DPP Details */}
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
                  <Zap className="w-6 h-6 text-cyan-600" />
                  DPP Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      DPP Title *
                    </label>
                    <input
                      type="text"
                      value={dppData.title}
                      onChange={(e) => setDppData({ ...dppData, title: e.target.value })}
                      placeholder="e.g., Physics - Kinematics DPP #15"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      value={dppData.subject}
                      onChange={(e) => setDppData({ ...dppData, subject: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Topic *
                    </label>
                    <input
                      type="text"
                      value={dppData.topic}
                      onChange={(e) => setDppData({ ...dppData, topic: e.target.value })}
                      placeholder="e.g., Motion in a Straight Line"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={dppData.duration}
                      onChange={(e) => setDppData({ ...dppData, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={dppData.difficulty}
                      onChange={(e) => setDppData({ ...dppData, difficulty: e.target.value as any })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    >
                      {difficulties.map(diff => (
                        <option key={diff} value={diff}>{diff}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Instructions for Students
                    </label>
                    <textarea
                      value={dppData.instructions}
                      onChange={(e) => setDppData({ ...dppData, instructions: e.target.value })}
                      rows={4}
                      placeholder="Add any specific instructions or tips for students..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => isStep1Valid && setStep(2)}
                    disabled={!isStep1Valid}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <Target className="w-6 h-6 text-cyan-600" />
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Correct Answer *
                      </label>
                      <select
                        value={currentQuestion.correctAnswer}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
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
                        Difficulty
                      </label>
                      <select
                        value={currentQuestion.difficulty}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value as any })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                      >
                        {difficulties.map(diff => (
                          <option key={diff} value={diff}>{diff}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddQuestion}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
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
                        className="flex items-start gap-4 p-4 bg-cyan-50 rounded-xl border border-cyan-100"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-cyan-600 text-white rounded-lg flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium mb-2">{q.question}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-white rounded font-medium">
                              Correct: {String.fromCharCode(65 + q.correctAnswer)}
                            </span>
                            <span className={`px-2 py-1 rounded font-medium ${getDifficultyColor(q.difficulty)}`}>
                              {q.difficulty}
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
                  className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review & Publish
                </motion.button>
              </div>

              {questions.length < 10 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">
                      Add at least 10 questions to continue (Current: {questions.length})
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
                <h2 className="text-xl font-bold text-gray-900 mb-6">Review DPP Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
                    <p className="text-sm text-gray-600 mb-1">Title</p>
                    <p className="font-semibold text-gray-900">{dppData.title}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-600 mb-1">Subject</p>
                    <p className="font-semibold text-gray-900">{dppData.subject}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
                    <p className="text-sm text-gray-600 mb-1">Topic</p>
                    <p className="font-semibold text-gray-900">{dppData.topic}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-cyan-600" />
                      <p className="text-sm text-gray-600">Duration</p>
                    </div>
                    <p className="font-semibold text-gray-900">{dppData.duration} minutes</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-gray-600">Questions</p>
                    </div>
                    <p className="font-semibold text-gray-900">{questions.length}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-teal-600" />
                      <p className="text-sm text-gray-600">Difficulty</p>
                    </div>
                    <p className={`font-semibold ${getDifficultyColor(dppData.difficulty)}`}>
                      {dppData.difficulty}
                    </p>
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
                    Publish DPP
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">DPP Created Successfully!</h3>
                <p className="text-gray-600">
                  Your Daily Practice Paper is now available to students for practice.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
