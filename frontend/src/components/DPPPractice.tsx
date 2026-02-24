import { useState, useEffect } from 'react';
import { X, Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, ArrowRight } from 'lucide-react';

interface DPP {
  id: string;
  title: string;
  subject: string;
  totalQuestions: number;
  duration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed: boolean;
  score?: number;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface DPPPracticeProps {
  dpp: DPP;
  onExit: () => void;
}

// Mock questions
const generateQuestions = (count: number): Question[] => {
  const questions: Question[] = [];
  for (let i = 1; i <= count; i++) {
    questions.push({
      id: i,
      question: `Sample question ${i} for the practice test. Which of the following is the correct answer?`,
      options: [
        'Option A: First answer choice',
        'Option B: Second answer choice',
        'Option C: Third answer choice',
        'Option D: Fourth answer choice'
      ],
      correctAnswer: Math.floor(Math.random() * 4)
    });
  }
  return questions;
};

export function DPPPractice({ dpp, onExit }: DPPPracticeProps) {
  const [questions] = useState<Question[]>(() => generateQuestions(dpp.totalQuestions));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(dpp.totalQuestions).fill(null));
  const [timeLeft, setTimeLeft] = useState(dpp.duration * 60); // Convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Timer
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    if (isSubmitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowConfirmSubmit(false);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const answeredCount = answers.filter(a => a !== null).length;
  const score = isSubmitted ? calculateScore() : 0;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{dpp.title}</h2>
              <p className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono font-semibold text-lg">{formatTime(timeLeft)}</span>
              </div>

              {/* Exit Button */}
              <button
                onClick={onExit}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Exit"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!isSubmitted ? (
            <div className="space-y-6">
              {/* Question */}
              <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-start gap-3 mb-6">
                  <span className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {currentQuestion + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg text-gray-900 leading-relaxed">
                      {questions[currentQuestion].question}
                    </h3>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition ${
                        answers[currentQuestion] === index
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          answers[currentQuestion] === index
                            ? 'border-teal-600 bg-teal-600'
                            : 'border-gray-300'
                        }`}>
                          {answers[currentQuestion] === index && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-gray-900">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {currentQuestion < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition shadow-lg"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={answers.some(a => a === null)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Submit
                    </button>
                  )}
                </div>
              </div>

              {/* Question Grid */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Questions</h4>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`aspect-square rounded-lg font-medium text-sm transition ${
                        currentQuestion === index
                          ? 'bg-teal-600 text-white ring-2 ring-teal-600 ring-offset-2'
                          : answers[index] !== null
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Results */
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  DPP Completed! 🎉
                </h2>
                <p className="text-gray-600">
                  Great job! Here's your performance summary
                </p>
              </div>

              <div className="max-w-md mx-auto mb-8">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-8 border border-teal-200">
                  <p className="text-sm text-gray-600 mb-2">Your Score</p>
                  <p className="text-6xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                    {score}%
                  </p>
                  <p className="text-gray-700">
                    {answers.filter((a, i) => a === questions[i].correctAnswer).length} out of {questions.length} correct
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Correct</p>
                  <p className="text-2xl font-bold text-green-600">
                    {answers.filter((a, i) => a === questions[i].correctAnswer).length}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Incorrect</p>
                  <p className="text-2xl font-bold text-red-600">
                    {questions.length - answers.filter((a, i) => a === questions[i].correctAnswer).length}
                  </p>
                </div>
              </div>

              <button
                onClick={onExit}
                className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition shadow-lg"
              >
                Back to DPP List
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Test?</h3>
            <p className="text-gray-600 mb-6">
              You have answered {answeredCount} out of {questions.length} questions. Are you sure you want to submit?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}