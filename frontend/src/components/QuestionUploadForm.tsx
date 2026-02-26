import { useState, FormEvent, ChangeEvent } from 'react';
import { 
  Plus, 
  X,
  Image as ImageIcon,
  Target
} from 'lucide-react';
import { motion } from 'motion/react';

export interface Question {
  id: string;
  type: 'MCQ' | 'MSQ' | 'Numerical';
  question: string;
  questionImage?: string;
  options?: string[];
  optionImages?: (string | undefined)[];
  correctAnswer: number | number[] | string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks?: number;
  subject?: string;
}

interface QuestionUploadFormProps {
  onAddQuestion: (question: Question) => void;
  buttonLabel?: string;
  showMarks?: boolean;
  showSubject?: boolean;
  subjects?: string[];
  fixedType?: 'MCQ' | 'MSQ' | 'Numerical';
  defaultMarks?: number;
  fixedSubject?: string;
}

export function QuestionUploadForm({ 
  onAddQuestion, 
  buttonLabel = "Add Question",
  showMarks = false,
  showSubject = false,
  subjects = [],
  fixedType,
  defaultMarks = 4,
  fixedSubject
}: QuestionUploadFormProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: Date.now().toString(),
    type: fixedType || 'MCQ',
    question: '',
    options: (fixedType || 'MCQ') === 'Numerical' ? undefined : ['', '', '', ''],
    optionImages: (fixedType || 'MCQ') === 'Numerical' ? undefined : [undefined, undefined, undefined, undefined],
    correctAnswer: (fixedType || 'MCQ') === 'MSQ' ? [] : (fixedType || 'MCQ') === 'Numerical' ? '' : 0,
    difficulty: 'Medium',
    marks: defaultMarks,
    subject: fixedSubject || subjects[0] || ''
  });

  // Update effect if fixed props change
  useEffect(() => {
    setCurrentQuestion(prev => ({
      ...prev,
      type: fixedType || prev.type,
      marks: defaultMarks,
      subject: fixedSubject || prev.subject
    }));
  }, [fixedType, defaultMarks, fixedSubject]);

  const difficulties: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, type: 'question' | 'option', index?: number) => {
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

  const handleAdd = () => {
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
      onAddQuestion({ ...currentQuestion, id: Date.now().toString() });
      setCurrentQuestion({
        ...currentQuestion,
        id: Date.now().toString(),
        question: '',
        options: currentQuestion.type === 'Numerical' ? undefined : ['', '', '', ''],
        optionImages: currentQuestion.type === 'Numerical' ? undefined : [undefined, undefined, undefined, undefined],
        questionImage: undefined
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Target className="w-6 h-6 text-cyan-600" />
        Question Details
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!fixedType && (
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
          )}
          <div className={fixedType ? "md:col-span-2" : ""}>
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

        {/* Conditional Marks and Subject */}
        {(showMarks || showSubject) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showMarks && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Marks
                </label>
                <input
                  type="number"
                  value={currentQuestion.marks}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            )}
            {showSubject && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  value={currentQuestion.subject}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, subject: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

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
                Upload Image
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
          </div>
        )}

        <div className="pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            {buttonLabel}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
