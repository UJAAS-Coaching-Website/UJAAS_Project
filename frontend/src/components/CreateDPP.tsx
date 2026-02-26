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
  Zap,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  id: string;
  type: 'MCQ' | 'MSQ' | 'Numerical';
  question: string;
  questionImage?: string;
  options?: string[];
  optionImages?: (string | undefined)[];
  correctAnswer: number | number[] | string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface CreateDPPProps {
  onBack: () => void;
}

export function CreateDPP({ onBack }: CreateDPPProps) {
  const [step, setStep] = useState(1);
  const [dppData, setDppData] = useState({
    title: '',
    duration: 60,
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    instructions: ''
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: Date.now().toString(),
    type: 'MCQ',
    question: '',
    options: ['', '', '', ''],
    optionImages: [undefined, undefined, undefined, undefined],
    correctAnswer: 0,
    difficulty: 'Medium'
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const difficulties: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'question' | 'option', index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'question') {
          setCurrentQuestion({ ...currentQuestion, questionImage: result });
        } else if (type === 'option' && index !== undefined) {
          const newOptionImages = [...(currentQuestion.optionImages || [])];
          newOptionImages[index] = result;
          setCurrentQuestion({ ...currentQuestion, optionImages: newOptionImages });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTypeChange = (type: 'MCQ' | 'MSQ' | 'Numerical') => {
    setCurrentQuestion({
      ...currentQuestion,
      type,
      options: type === 'Numerical' ? undefined : ['', '', '', ''],
      optionImages: type === 'Numerical' ? undefined : [undefined, undefined, undefined, undefined],
      correctAnswer: type === 'MSQ' ? [] : type === 'Numerical' ? '' : 0
    });
  };

  const handleAddQuestion = () => {
    const isValid = currentQuestion.question && (
      currentQuestion.type === 'Numerical' 
        ? currentQuestion.correctAnswer !== '' 
        : (currentQuestion.options?.every(opt => opt.trim()) && (
            currentQuestion.type === 'MCQ' 
              ? typeof currentQuestion.correctAnswer === 'number'
              : (currentQuestion.correctAnswer as number[]).length > 0
          ))
    );

    if (isValid) {
      setQuestions([...questions, { ...currentQuestion, id: Date.now().toString() }]);
      setCurrentQuestion({
        id: Date.now().toString(),
        type: 'MCQ',
        question: '',
        options: ['', '', '', ''],
        optionImages: [undefined, undefined, undefined, undefined],
        correctAnswer: 0,
        difficulty: 'Medium'
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

  const isStep1Valid = dppData.title;
  const isStep2Valid = questions.length >= 1;

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
            className="flex items-center gap-2 text-gray-600 hover:text-cyan-600 transition mb-4 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Question Type
                      </label>
                      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                        {(['MCQ', 'MSQ', 'Numerical'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleTypeChange(t)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                              currentQuestion.type === t
                                ? 'bg-white text-cyan-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Difficulty
                      </label>
                      <select
                        value={currentQuestion.difficulty}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value as any })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                      >
                        {difficulties.map(diff => (
                          <option key={diff} value={diff}>{diff}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                      Question Text *
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => handleImageUpload(e, 'question')}
                        />
                        <button type="button" className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors border border-cyan-100 flex items-center gap-1.5 text-xs font-bold">
                          <ImageIcon className="w-4 h-4" />
                          Add Image
                        </button>
                      </div>
                    </label>
                    <div className="relative">
                      <textarea
                        value={currentQuestion.question}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                        rows={3}
                        placeholder="Enter your question here..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                      />
                      {currentQuestion.questionImage && (
                        <div className="mt-2 relative inline-block">
                          <img src={currentQuestion.questionImage} alt="Question" className="h-24 w-auto rounded-lg border border-gray-200 shadow-sm" />
                          <button 
                            onClick={() => setCurrentQuestion({ ...currentQuestion, questionImage: undefined })}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {currentQuestion.type !== 'Numerical' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options?.map((option, index) => (
                          <div key={index} className="relative group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                Option {String.fromCharCode(65 + index)} *
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => handleImageUpload(e, 'option', index)}
                                  />
                                  <ImageIcon className="w-4 h-4 text-gray-400 hover:text-cyan-600 cursor-pointer transition-colors" />
                                </div>
                              </span>
                              {currentQuestion.type === 'MCQ' ? (
                                <input
                                  type="radio"
                                  name="correctOption"
                                  checked={currentQuestion.correctAnswer === index}
                                  onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                                />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={(currentQuestion.correctAnswer as number[]).includes(index)}
                                  onChange={(e) => {
                                    const currentAnswers = [...(currentQuestion.correctAnswer as number[])];
                                    if (e.target.checked) {
                                      currentAnswers.push(index);
                                    } else {
                                      const idx = currentAnswers.indexOf(index);
                                      if (idx > -1) currentAnswers.splice(idx, 1);
                                    }
                                    setCurrentQuestion({ ...currentQuestion, correctAnswer: currentAnswers });
                                  }}
                                  className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                                />
                              )}
                            </label>
                            <div className="relative flex flex-col gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(currentQuestion.options || [])];
                                  newOptions[index] = e.target.value;
                                  setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition ${
                                  (currentQuestion.type === 'MCQ' ? currentQuestion.correctAnswer === index : (currentQuestion.correctAnswer as number[]).includes(index))
                                    ? 'border-cyan-500 bg-cyan-50/30'
                                    : 'border-gray-200'
                                }`}
                              />
                              {currentQuestion.optionImages?.[index] && (
                                <div className="relative inline-block self-start">
                                  <img src={currentQuestion.optionImages[index]} alt={`Option ${index}`} className="h-16 w-auto rounded-lg border border-gray-200 shadow-sm" />
                                  <button 
                                    onClick={() => {
                                      const newImgs = [...(currentQuestion.optionImages || [])];
                                      newImgs[index] = undefined;
                                      setCurrentQuestion({ ...currentQuestion, optionImages: newImgs });
                                    }}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 scale-75"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">
                        {currentQuestion.type === 'MCQ' 
                          ? 'Select the radio button next to the correct option.' 
                          : 'Select all correct options using the checkboxes.'}
                      </p>
                    </>
                  ) : (
                    <div className="bg-amber-50/50 p-6 rounded-2xl border-2 border-dashed border-amber-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Numerical Answer *
                      </label>
                      <input
                        type="text"
                        value={currentQuestion.correctAnswer as string}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                        placeholder="e.g., 25.5 or 42"
                        className="w-full max-w-xs px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition bg-white"
                      />
                      <p className="text-xs text-amber-600 mt-2 italic">
                        Enter the exact numeric value that students should provide.
                      </p>
                    </div>
                  )}

                  <div className="pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddQuestion}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Add Question to DPP
                    </motion.button>
                  </div>
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
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-gray-900 font-medium">{q.question}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {q.type}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-white rounded font-medium border border-cyan-100 text-cyan-700">
                              Correct: {
                                q.type === 'MCQ' 
                                  ? String.fromCharCode(65 + (q.correctAnswer as number))
                                  : q.type === 'MSQ'
                                    ? (q.correctAnswer as number[]).map(idx => String.fromCharCode(65 + idx)).join(', ')
                                    : q.correctAnswer
                              }
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
                    <p className="text-sm text-gray-600 mb-1">Title</p>
                    <p className="font-semibold text-gray-900">{dppData.title}</p>
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
