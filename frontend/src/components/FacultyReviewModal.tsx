import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Send, X, AlertCircle, Loader2 } from 'lucide-react';
import { FacultyToRate, submitFacultyRatings } from '../api/facultyReviews';

interface FacultyReviewModalProps {
  faculties: FacultyToRate[];
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export function FacultyReviewModal({ faculties, onClose, onSubmitSuccess }: FacultyReviewModalProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRate = (facultyId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [facultyId]: rating }));
  };

  const handleSubmit = async () => {
    // Validate all faculties rated
    if (Object.keys(ratings).length < faculties.length) {
      setError("Please rate all listed faculties before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = Object.entries(ratings).map(([facultyId, rating]) => ({
        facultyId,
        rating
      }));
      await submitFacultyRatings(payload);
      onSubmitSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit ratings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Faculty Review</h2>
              <p className="text-teal-100 text-sm">Help us improve your learning experience.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {faculties.map((faculty) => (
            <div key={faculty.id} className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-gray-900">{faculty.name}</h4>
                  <p className="text-sm text-gray-500">{faculty.subject}</p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(faculty.id, star)}
                      className="p-1 transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          (ratings[faculty.id] || 0) >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-4 shrink-0 bg-gray-50/50">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition shadow-sm"
          >
            Do it Later
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Submit Ratings
          </button>
        </div>
      </motion.div>
    </div>
  );
}
