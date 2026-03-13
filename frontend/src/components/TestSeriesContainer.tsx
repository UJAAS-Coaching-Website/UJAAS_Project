import { useState, useEffect, useMemo } from 'react';
import { TestSeriesSection } from './TestSeriesSection';
import { StudentTestTaking } from './StudentTestTaking';
import { StudentAnalytics } from './StudentAnalytics';
import { ViewResults } from './ViewResults';
import { User, PublishedTest } from '../App';
import { motion } from 'motion/react';
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  Award,
  ChevronLeft,
  Play
} from 'lucide-react';

type TestState = 
  | { mode: 'list' }
  | { mode: 'overview'; test: PublishedTest }
  | { mode: 'taking'; test: PublishedTest }
  | { mode: 'analytics'; result?: any }
  | { mode: 'viewResults' };

// Helper to slugify test titles for URLs
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export function TestSeriesContainer({ 
  user, 
  publishedTests, 
  onStateChange,
  subTab,
  onNavigateSubTab
}: { 
  user: User; 
  publishedTests: PublishedTest[]; 
  onStateChange: (mode: TestState['mode']) => void;
  subTab?: string;
  onNavigateSubTab?: (subTab?: string) => void;
}) {
  const [testState, setTestState] = useState<TestState>({ mode: 'list' });

  // Sync testState with subTab from URL
  useEffect(() => {
    if (!subTab || subTab === 'list') {
      if (testState.mode !== 'list') setTestState({ mode: 'list' });
    } else if (subTab.startsWith('Analysis')) {
      if (testState.mode !== 'analytics') {
        const lastResult = localStorage.getItem('lastTestResult');
        const result = lastResult ? JSON.parse(lastResult) : null;
        if (result) {
          setTestState({ mode: 'analytics', result });
        } else {
          openMockAnalytics();
        }
      }
    } else if (subTab.startsWith('Overview')) {
      if (testState.mode !== 'overview') {
        const lastTaking = localStorage.getItem('lastTakingTest');
        if (lastTaking) {
          setTestState({ mode: 'overview', test: JSON.parse(lastTaking) });
        } else {
          onNavigateSubTab?.(undefined);
        }
      }
    } else if (subTab.startsWith('Test')) {
      if (testState.mode !== 'taking') {
        const lastTaking = localStorage.getItem('lastTakingTest');
        if (lastTaking) {
          setTestState({ mode: 'taking', test: JSON.parse(lastTaking) });
        } else {
          onNavigateSubTab?.(undefined);
        }
      }
    } else if (subTab === 'Results') {
      if (testState.mode !== 'viewResults') setTestState({ mode: 'viewResults' });
    }
  }, [subTab]);

  useEffect(() => {
    onStateChange(testState.mode);
  }, [testState.mode, onStateChange]);

  const handleStartTest = (test: any) => {
    const normalizedStatus: PublishedTest['status'] =
      test.status === 'completed' || test.status === 'upcoming' || test.status === 'draft'
        ? test.status
        : 'live';

    const normalizedTest: PublishedTest = {
      id: test.id,
      title: test.title,
      duration: test.duration,
      totalMarks: test.totalMarks,
      questionCount: test.questions,
      enrolledCount: test.enrolled,
      questions: test.realQuestions || test.questions || [],
      format: test.format || 'Custom',
      batches: test.batches || [],
      scheduleDate: test.scheduledDate || test.scheduleDate || '',
      scheduleTime: test.scheduleTime || '',
      instructions: test.instructions || '',
      status: normalizedStatus
    };
    
    localStorage.setItem('lastTakingTest', JSON.stringify(normalizedTest));
    setTestState({ mode: 'overview', test: normalizedTest });
    
    const testSlug = slugify(normalizedTest.title);
    onNavigateSubTab?.(`Overview-${testSlug}`);
  };

  const handleConfirmStart = () => {
    if (testState.mode === 'overview') {
      const test = testState.test;
      setTestState({ mode: 'taking', test });
      const testSlug = slugify(test.title);
      onNavigateSubTab?.(`Test-${testSlug}`);
    }
  };

  const handleCompleteTest = (answers: Record<string, number | null>, timeSpent: number) => {
    if (testState.mode !== 'taking') return;
    
    const test = testState.test;
    const result = {
      testId: test.id,
      testTitle: test.title,
      totalMarks: test.totalMarks,
      obtainedMarks: Math.floor(Math.random() * test.totalMarks),
      totalQuestions: test.questions.length,
      correctAnswers: Math.floor(Math.random() * test.questions.length),
      wrongAnswers: 0,
      unattempted: 0,
      timeSpent: timeSpent,
      duration: test.duration,
      rank: 1,
      totalStudents: 100,
      submittedAt: new Date().toISOString(),
      questions: test.questions.map((q: any) => ({
        ...q,
        userAnswer: answers[q.id]
      }))
    };

    localStorage.setItem('lastTestResult', JSON.stringify(result));
    setTestState({ mode: 'analytics', result });
    
    const testSlug = slugify(result.testTitle);
    onNavigateSubTab?.(`Analysis-${testSlug}`);
  };

  const openMockAnalytics = () => {
    const lastResult = localStorage.getItem('lastTestResult');
    if (lastResult) {
      const result = JSON.parse(lastResult);
      setTestState({ mode: 'analytics', result });
      const testSlug = slugify(result.testTitle || 'Demo');
      onNavigateSubTab?.(`Analysis-${testSlug}`);
    } else {
      const dummyResult = {
        testId: 'demo',
        testTitle: 'Demo Test Analysis',
        totalMarks: 300,
        obtainedMarks: 245,
        totalQuestions: 75,
        correctAnswers: 62,
        wrongAnswers: 10,
        unattempted: 3,
        timeSpent: 5400,
        duration: 180,
        rank: 12,
        totalStudents: 450,
        submittedAt: new Date().toISOString(),
        questions: []
      };
      localStorage.setItem('lastTestResult', JSON.stringify(dummyResult));
      setTestState({ mode: 'analytics', result: dummyResult });
      const testSlug = slugify(dummyResult.testTitle);
      onNavigateSubTab?.(`Analysis-${testSlug}`);
    }
  };

  const handleBackToList = () => {
    setTestState({ mode: 'list' });
    onNavigateSubTab?.(undefined);
  };

  if (testState.mode === 'overview' && testState.test) {
    return (
      <TestOverview 
        test={testState.test} 
        onStart={handleConfirmStart} 
        onBack={handleBackToList} 
      />
    );
  }

  if (testState.mode === 'taking' && testState.test) {
    return (
      <StudentTestTaking 
        testId={testState.test.id}
        testTitle={testState.test.title}
        duration={testState.test.duration}
        questions={testState.test.questions}
        onSubmit={handleCompleteTest}
        onExit={handleBackToList}
      />
    );
  }

  if (testState.mode === 'analytics' && testState.result) {
    return (
      <StudentAnalytics 
        result={testState.result} 
        onClose={handleBackToList}
      />
    );
  }

  if (testState.mode === 'viewResults') {
    return (
      <ViewResults 
        onClose={handleBackToList}
        onViewDetailedAnalytics={(testId) => {
          onNavigateSubTab?.('Analysis');
        }}
      />
    );
  }

  return (
    <TestSeriesSection 
      onStartTest={handleStartTest}
      onViewAnalytics={(testId) => {
        openMockAnalytics();
      }}
      onViewResults={() => {
        setTestState({ mode: 'viewResults' });
        onNavigateSubTab?.('Results');
      }}
      publishedTests={publishedTests}
    />
  );
}

function TestOverview({ 
  test, 
  onStart, 
  onBack 
}: { 
  test: PublishedTest; 
  onStart: () => void; 
  onBack: () => void;
}) {
  const breakdown = useMemo(() => {
    const stats: Record<string, Record<string, { count: number, marks: number, neg: number }>> = {};
    
    test.questions.forEach(q => {
      const sub = q.subject || 'Default';
      const sec = q.metadata?.section || 'Section A';
      
      if (!stats[sub]) stats[sub] = {};
      if (!stats[sub][sec]) {
        stats[sub][sec] = { count: 0, marks: q.marks || 0, neg: q.negativeMarks || 0 };
      }
      
      stats[sub][sec].count++;
    });
    
    return stats;
  }, [test.questions]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 text-white">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-teal-100 hover:text-white mb-6 font-bold transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to List
          </button>
          <h1 className="text-3xl font-bold mb-2">{test.title}</h1>
          <div className="flex flex-wrap gap-6 text-teal-50">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{test.duration} Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="font-medium">{test.questions.length} Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span className="font-medium">{test.totalMarks} Maximum Marks</span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-12">
          {/* Question Breakdown */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-teal-600" />
              Question Breakdown & Marking Scheme
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wider">Subject</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wider">Section</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wider text-center">Questions</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wider text-center text-green-600">Positive</th>
                    <th className="px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wider text-center text-red-600">Negative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(breakdown).map(([subject, sections]) => (
                    Object.entries(sections).map(([section, data], idx) => (
                      <tr key={`${subject}-${section}`} className="hover:bg-gray-50/50">
                        {idx === 0 ? (
                          <td className="px-4 py-4 font-bold text-gray-900 border-r border-gray-100" rowSpan={Object.keys(sections).length}>
                            {subject}
                          </td>
                        ) : null}
                        <td className="px-4 py-4 text-gray-600 font-medium">{section}</td>
                        <td className="px-4 py-4 text-center font-bold text-gray-900">{data.count}</td>
                        <td className="px-4 py-4 text-center font-bold text-green-600">+{data.marks}</td>
                        <td className="px-4 py-4 text-center font-bold text-red-600">-{data.neg}</td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Instructions */}
          <section className="p-8 bg-amber-50 rounded-3xl border border-amber-100 shadow-sm">
            <h3 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              General Instructions
            </h3>
            <div className="text-amber-800 space-y-4 leading-relaxed font-semibold">
              {(test.instructions || "1. Ensure you have a stable internet connection.\n2. Do not refresh or close the tab during the test.\n3. The test will automatically submit when the timer ends.\n4. Use of unfair means will lead to disqualification.")
                .split('\n')
                .map((point, i) => point.trim() && (
                  <div key={i} className="flex gap-3">
                    <span className="shrink-0">•</span>
                    <p>{point.trim()}</p>
                  </div>
                ))
              }
            </div>
          </section>

          {/* Start Action */}
          <div className="flex flex-col items-center gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              className="w-full sm:w-64 py-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 text-lg"
            >
              <Play className="w-6 h-6 fill-current" />
              Confirm & Start Test
            </motion.button>
            <p className="text-sm text-gray-500 font-medium italic">
              By clicking start, you agree to follow the exam instructions.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
