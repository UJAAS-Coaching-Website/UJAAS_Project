import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  Award
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  subject: string;
  marks: number;
}

interface TestTakingProps {
  testId: string;
  testTitle: string;
  duration: number; // in minutes
  questions: Question[];
  onSubmit: (answers: Record<string, number | null>, timeSpent: number) => void;
  onExit: () => void;
  initialAnswers?: Record<string, number | null>;
  initialTimeSpent?: number;
}

export function TestTaking({
  testId,
  testTitle,
  duration,
  questions,
  onSubmit,
  onExit,
  initialAnswers = {},
  initialTimeSpent = 0
}: TestTakingProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>(initialAnswers);
  const [timeLeft, setTimeLeft] = useState((duration * 60) - initialTimeSpent);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
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
  }, []);

  const handleAutoSubmit = () => {
    const timeSpent = (duration * 60) - timeLeft;
    onSubmit(answers, timeSpent);
  };

  const handleSubmit = () => {
    const timeSpent = (duration * 60) - timeLeft;
    onSubmit(answers, timeSpent);
    setShowSubmitDialog(false);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (questionId: string, optionIndex: number) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
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
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const questionCount = questions.length;

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{testTitle}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  {questionCount} Questions
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                  {totalMarks} Marks
                </span>
              </div>
            </div>

            {/* Timer */}
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
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Question Card */}
            <div
              key={currentQuestion}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {question.subject}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {question.marks} marks
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                    {question.text}
                  </h2>
                </div>
                <button
                  onClick={() => toggleFlag(question.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    flaggedQuestions.has(question.id)
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-gray-100 text-gray-400 hover:text-amber-600'
                  }`}
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectAnswer(question.id, index)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      answers[question.id] === index
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        answers[question.id] === index
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {answers[question.id] === index && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="text-gray-900 font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSubmitDialog(true)}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Submit Test
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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

              {/* Stats */}
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

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentQuestion(index)}
                    className={`aspect-square rounded-lg font-semibold text-sm relative ${
                      currentQuestion === index
                        ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                        : getQuestionStatus(index) === 'answered'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                    {flaggedQuestions.has(q.id) && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Legend */}
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
                  <div className="w-4 h-4 bg-blue-600 rounded" />
                  <span className="text-xs text-gray-600">Current</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Submit Test?</h3>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Total Questions:</span>
                <span className="font-bold text-gray-900">{questions.length}</span>
              </div>
              <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Answered:</span>
                <span className="font-bold text-green-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-gray-700">Not Answered:</span>
                <span className="font-bold text-red-600">{notAnsweredCount}</span>
              </div>
            </div>

            {notAnsweredCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  You have {notAnsweredCount} unanswered question{notAnsweredCount > 1 ? 's' : ''}. Are you sure you want to submit?
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSubmitDialog(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Submit
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}