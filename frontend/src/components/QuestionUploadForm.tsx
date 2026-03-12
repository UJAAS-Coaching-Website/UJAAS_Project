import { useState, ChangeEvent, useEffect } from 'react';
import { 
  Plus, 
  X,
  Image as ImageIcon,
  Target,
  CheckCircle
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
  marks?: number;
  negativeMarks?: number;
  subject?: string;
  explanation?: string;
  explanationImage?: string;
  difficulty?: string;
}

interface QuestionUploadFormProps {
  onAddQuestion: (question: Question) => void;
  buttonLabel?: string;
  showMarks?: boolean;
  showSubject?: boolean;
  subjects?: string[];
  fixedType?: 'MCQ' | 'MSQ' | 'Numerical';
  defaultMarks?: number;
  defaultNegativeMarks?: number;
  fixedSubject?: string;
  editingQuestion?: Question | null;
  onCancelEdit?: () => void;
}

export function QuestionUploadForm({ 
  onAddQuestion, 
  buttonLabel = "Add Question",
  showMarks = false,
  showSubject = false,
  subjects = [],
  fixedType,
  defaultMarks = 4,
  defaultNegativeMarks = 0,
  fixedSubject,
  editingQuestion,
  onCancelEdit
}: QuestionUploadFormProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: crypto.randomUUID(),
    type: fixedType || 'MCQ',
    question: '',
    options: (fixedType || 'MCQ') === 'Numerical' ? undefined : ['', '', '', ''],
    optionImages: (fixedType || 'MCQ') === 'Numerical' ? undefined : [undefined, undefined, undefined, undefined],
    correctAnswer: (fixedType || 'MCQ') === 'MSQ' ? [] : (fixedType || 'MCQ') === 'Numerical' ? '' : 0,
    difficulty: 'Medium',
    marks: defaultMarks,
    negativeMarks: defaultNegativeMarks,
    subject: fixedSubject || subjects[0] || ''
  });
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Update effect if fixed props change or editingQuestion changes
  useEffect(() => {
    if (editingQuestion) {
      setCurrentQuestion(editingQuestion);
    } else {
      setCurrentQuestion(prev => ({
        ...prev,
        type: fixedType || prev.type,
        marks: defaultMarks,
        negativeMarks: defaultNegativeMarks,
        subject: fixedSubject || prev.subject,
        question: '',
        options: (fixedType || prev.type) === 'Numerical' ? undefined : ['', '', '', ''],
        optionImages: (fixedType || prev.type) === 'Numerical' ? undefined : [undefined, undefined, undefined, undefined],
        correctAnswer: (fixedType || prev.type) === 'MSQ' ? [] : (fixedType || prev.type) === 'Numerical' ? '' : 0,
        questionImage: undefined,
        explanation: '',
        explanationImage: undefined
      }));
    }
  }, [fixedType, defaultMarks, defaultNegativeMarks, fixedSubject, editingQuestion]);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'question' | 'option' | 'explanation', index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const context = window.location.pathname.includes('dpps') ? 'dpps' : 'tests';
      formData.append('context', context);
      
      // QuestionUploadForm is often used during creation.
      // If we don't have a testId in the URL, provide a temporary collision-resistant one
      const pathSegments = window.location.pathname.split('/');
      const contextId = pathSegments[pathSegments.length - 1] || Date.now().toString();
      formData.append('contextId', contextId);
      formData.append('itemRole', type);

      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
      
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Image upload failed');
      }

      const imageUrl = data.imageUrl;

      if (type === 'question') {
        setCurrentQuestion(prev => ({ ...prev, questionImage: imageUrl }));
      } else if (type === 'explanation') {
        setCurrentQuestion(prev => ({ ...prev, explanationImage: imageUrl }));
      } else if (type === 'option' && index !== undefined) {
        setCurrentQuestion(prev => {
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
      e.target.value = '';
    }
  };

  // Delete an image from S3 and clear it from state
  const handleImageRemove = async (type: 'question' | 'option' | 'explanation', index?: number) => {
    const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
    let imageUrl: string | undefined;

    if (type === 'question') imageUrl = currentQuestion.questionImage;
    else if (type === 'explanation') imageUrl = currentQuestion.explanationImage;
    else if (type === 'option' && index !== undefined) imageUrl = currentQuestion.optionImages?.[index];

    // Clear from state immediately
    if (type === 'question') {
      setCurrentQuestion(prev => ({ ...prev, questionImage: undefined }));
    } else if (type === 'explanation') {
      setCurrentQuestion(prev => ({ ...prev, explanationImage: undefined }));
    } else if (type === 'option' && index !== undefined) {
      setCurrentQuestion(prev => {
        const newOptionImages = [...(prev.optionImages || [])];
        newOptionImages[index] = undefined;
        return { ...prev, optionImages: newOptionImages };
      });
    }

    // Fire S3 delete in background
    if (imageUrl && imageUrl.startsWith('http')) {
      try {
        await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl })
        });
      } catch (err) {
        console.warn('Failed to delete image from S3:', err);
      }
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
    const hasQuestionContent =
      currentQuestion.question.trim().length > 0 || !!currentQuestion.questionImage;
    const hasValidOptions =
      currentQuestion.type === 'Numerical'
        ? true
        : (currentQuestion.options || []).every((opt, index) => {
            const hasText = opt.trim().length > 0;
            const hasImage = !!currentQuestion.optionImages?.[index];
            return hasText || hasImage;
          });
    const hasValidAnswer =
      currentQuestion.type === 'Numerical'
        ? String(currentQuestion.correctAnswer).trim().length > 0
        : currentQuestion.type === 'MCQ'
        ? typeof currentQuestion.correctAnswer === 'number'
        : (currentQuestion.correctAnswer as number[]).length > 0;
    const isValid = hasQuestionContent && hasValidOptions && hasValidAnswer;

    if (isValid) {
      onAddQuestion(currentQuestion);
      if (editingQuestion) {
        onCancelEdit?.();
      } else {
        setCurrentQuestion({
          ...currentQuestion,
          id: Date.now().toString(),
          question: '',
                  options: currentQuestion.type === 'Numerical' ? undefined : ['', '', '', ''],
                  optionImages: currentQuestion.type === 'Numerical' ? undefined : [undefined, undefined, undefined, undefined],
                  questionImage: undefined,
                  explanation: '',
                  explanationImage: undefined
                });      }
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
        </div>

        {/* Conditional Marks and Subject */}
        {(showMarks || showSubject) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showMarks && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Positive Marks
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={currentQuestion.marks ?? 0}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        marks: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Negative Marks
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={currentQuestion.negativeMarks ?? 0}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        negativeMarks: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
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
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={(e) => handleImageUpload(e, 'question')}
                disabled={isUploadingImage}
              />
              <button type="button" className={`p-1.5 rounded-lg transition-colors border flex items-center gap-1.5 text-xs font-bold ${isUploadingImage ? 'text-gray-400 border-gray-200 bg-gray-50' : 'text-cyan-600 border-cyan-100 hover:bg-cyan-50'}`}>
                {isUploadingImage ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/> : <ImageIcon className="w-4 h-4" />}
                {isUploadingImage ? 'Uploading...' : 'Upload Image'}
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
                  onClick={() => handleImageRemove('question')}
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
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          onChange={(e) => handleImageUpload(e, 'option', index)}
                          disabled={isUploadingImage}
                        />
                        {isUploadingImage ? (
                           <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"/>
                        ) : (
                          <ImageIcon className="w-4 h-4 text-gray-400 hover:text-cyan-600 cursor-pointer transition-colors" />
                        )}
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
                          onClick={() => handleImageRemove('option', index)}
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

        <div className="space-y-4 pt-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center justify-between">
            Explanation / Solution
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={(e) => handleImageUpload(e, 'explanation')}
                disabled={isUploadingImage}
              />
              <button type="button" className={`p-1.5 rounded-lg transition-colors border flex items-center gap-1.5 text-xs font-bold ${isUploadingImage ? 'text-gray-400 border-gray-200 bg-gray-50' : 'text-blue-600 border-blue-100 hover:bg-blue-50'}`}>
                {isUploadingImage ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/> : <ImageIcon className="w-4 h-4" />}
                {isUploadingImage ? 'Uploading...' : 'Add Solution Image'}
              </button>
            </div>
          </label>
          <textarea
            value={currentQuestion.explanation || ''}
            onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
            rows={2}
            placeholder="Add solution explanation here..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          {currentQuestion.explanationImage && (
            <div className="relative inline-block">
              <img src={currentQuestion.explanationImage} alt="Solution" className="h-24 w-auto rounded-lg border border-gray-200 shadow-sm" />
               <button 
                onClick={() => handleImageRemove('explanation')}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="pt-4 flex items-center gap-3">
          <motion.button
            onClick={handleAdd}
            disabled={isUploadingImage}
            className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${editingQuestion ? 'from-orange-500 to-red-500' : 'from-cyan-600 to-blue-600'} text-white rounded-xl font-semibold shadow-lg transition-all ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}`}
          >
            {editingQuestion ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingQuestion ? 'Update Question' : buttonLabel}
          </motion.button>
          
          {editingQuestion && (
            <button
              onClick={onCancelEdit}
              className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
