import { useMemo } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Award, BookOpen, ChevronLeft, Clock, FileText, Play } from 'lucide-react';
import { useIsMobileViewport } from '../../hooks/useViewport';
import type { PublishedTest } from '../../App';

export function TestOverview({
  test,
  onStart,
  onBack,
  isStarting = false,
  isLoadingOverview = false,
}: {
  test: PublishedTest;
  onStart: () => void;
  onBack: () => void;
  isStarting?: boolean;
  isLoadingOverview?: boolean;
}) {
  const isMobileViewport = useIsMobileViewport();
  const questions = Array.isArray(test.questions) ? test.questions : [];

  const breakdown = useMemo(() => {
    const stats: Record<string, Record<string, { count: number; marks: number; neg: number }>> = {};
    questions.forEach((question) => {
      const subject = question.subject || 'Default';
      const section = question.metadata?.section || 'Section A';
      if (!stats[subject]) stats[subject] = {};
      if (!stats[subject][section]) stats[subject][section] = { count: 0, marks: question.marks || 0, neg: question.negativeMarks || 0 };
      stats[subject][section].count++;
    });
    return stats;
  }, [questions]);

  return (
    <div className={isMobileViewport ? 'fixed inset-0 z-50 bg-white overflow-y-auto w-full scrollbar-hide' : 'w-full bg-transparent px-4'}>
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={isMobileViewport ? 'min-h-screen w-full bg-white' : 'bg-white max-w-4xl mx-auto rounded-3xl shadow-2xl border border-gray-100 overflow-hidden'}>
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 px-4 py-5 sm:px-8 sm:py-8 text-white">
          <button onClick={onBack} className="flex items-center gap-2 text-teal-100 hover:text-white mb-4 sm:mb-6 font-bold transition-colors group text-sm sm:text-base">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            Back to List
          </button>
          <h1 className="text-xl sm:text-3xl font-bold mb-2">{test.title}</h1>
          <div className="flex flex-wrap gap-3 sm:gap-6 text-teal-50 text-xs sm:text-base">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 sm:w-5 sm:h-5" /><span className="font-medium">{test.duration} Minutes</span></div>
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 sm:w-5 sm:h-5" /><span className="font-medium">{questions.length} Questions</span></div>
            <div className="flex items-center gap-2"><Award className="w-4 h-4 sm:w-5 sm:h-5" /><span className="font-medium">{test.totalMarks} Maximum Marks</span></div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-8 sm:py-8 space-y-8 sm:space-y-12">
          {test.instructions?.trim() ? (
            <section className="p-4 sm:p-8 bg-amber-50 rounded-2xl sm:rounded-3xl border border-amber-100 shadow-sm">
              <h3 className="text-sm sm:text-xl font-bold text-amber-900 mb-4 sm:mb-6 flex items-center gap-2"><AlertCircle className="w-4 h-4 sm:w-6 sm:h-6" />General Instructions</h3>
              <div className="text-amber-800 space-y-3 sm:space-y-4 leading-relaxed text-xs sm:text-base font-semibold">
                {test.instructions.split('\n').map((point, index) => point.trim() && <div key={index} className="flex gap-3"><span className="shrink-0">-</span><p>{point.trim()}</p></div>)}
              </div>
            </section>
          ) : null}

          <section>
            <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2"><BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-teal-600" />Question Breakdown & Marking Scheme</h3>
            {isLoadingOverview ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 text-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-gray-600 font-medium text-sm sm:text-base">Loading question breakdown...</p></div>
            ) : (
              <>
                <div className="overflow-x-auto hidden sm:block">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="px-3 py-2 text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">Subject</th><th className="px-3 py-2 text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">Section</th><th className="px-3 py-2 text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider text-center">Questions</th><th className="px-3 py-2 text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider text-center text-green-600">Positive</th><th className="px-3 py-2 text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider text-center text-red-600">Negative</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(breakdown).map(([subject, sections]) => Object.entries(sections).map(([section, data], index) => (
                        <tr key={`${subject}-${section}`} className="hover:bg-gray-50/50">
                          {index === 0 ? <td className="px-3 py-3 sm:px-4 sm:py-4 font-bold text-gray-900 border-r border-gray-100" rowSpan={Object.keys(sections).length}>{subject}</td> : null}
                          <td className="px-3 py-3 sm:px-4 sm:py-4 text-gray-600 font-medium">{section}</td>
                          <td className="px-3 py-3 sm:px-4 sm:py-4 text-center font-bold text-gray-900">{data.count}</td>
                          <td className="px-3 py-3 sm:px-4 sm:py-4 text-center font-bold text-green-600">+{data.marks}</td>
                          <td className="px-3 py-3 sm:px-4 sm:py-4 text-center font-bold text-red-600">-{data.neg}</td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto block sm:hidden">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="px-1 py-1.5 text-[10px] font-bold text-gray-700 uppercase tracking-tight">Sub</th><th className="px-1 py-1.5 text-[10px] font-bold text-gray-700 uppercase tracking-tight">Sec</th><th className="px-1 py-1.5 text-[10px] font-bold text-gray-700 uppercase tracking-tight text-center">Qs</th><th className="px-1 py-1.5 text-[10px] font-bold text-green-600 uppercase tracking-tight text-center">+ve</th><th className="px-1 py-1.5 text-[10px] font-bold text-red-600 uppercase tracking-tight text-center">-ve</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(breakdown).map(([subject, sections]) => Object.entries(sections).map(([section, data], index) => (
                        <tr key={`mobile-${subject}-${section}`} className="hover:bg-gray-50/50">
                          {index === 0 ? <td className="px-1 py-2 text-[10px] font-bold text-gray-900 border-r border-gray-100 max-w-[80px]" rowSpan={Object.keys(sections).length}><div className="line-clamp-2 leading-tight">{subject}</div></td> : null}
                          <td className="px-1 py-2 text-[10px] text-gray-600 font-medium max-w-[100px]"><div className="line-clamp-2 leading-tight">{section}</div></td>
                          <td className="px-1 py-2 text-[10px] text-center font-bold text-gray-900">{data.count}</td>
                          <td className="px-1 py-2 text-[10px] text-center font-bold text-green-600">+{data.marks}</td>
                          <td className="px-1 py-2 text-[10px] text-center font-bold text-red-600">-{data.neg}</td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <div className="flex flex-col items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onStart} disabled={isStarting} className="w-auto px-8 sm:w-64 py-3 sm:py-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg disabled:opacity-70 disabled:cursor-wait">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              {isStarting ? 'Loading Test...' : 'Confirm & Start Test'}
            </motion.button>
            <p className="text-xs sm:text-sm text-gray-500 font-medium italic text-center">By clicking start, the full test will be loaded before the timer begins.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
