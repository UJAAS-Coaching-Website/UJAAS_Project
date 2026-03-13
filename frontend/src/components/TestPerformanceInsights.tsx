import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Download
} from 'lucide-react';
import { StudentAnalytics } from './StudentAnalytics';
import logo from '../assets/logo.svg';
import { fetchTestAnalysis } from '../api/tests';

export interface StudentPerformance {
  attemptId: string;
  studentId: string;
  studentName: string;
  attemptNo: number;
  submittedAt: string;
  score: number;
  totalMarks: number;
  accuracy: number;
  rank: number;
  timeSpent: number;
  result: any; // The full result object for StudentAnalytics
}

interface TestPerformanceInsightsProps {
  testTitle: string;
  testId: string;
  onClose: () => void;
  scheduledDateTime?: string; // ISO string of test start time
  testQuestions?: any[];
  testDuration?: number;
  testInstructions?: string;
}

export function TestPerformanceInsights({ 
  testTitle, 
  testId, 
  onClose, 
  scheduledDateTime,
  testQuestions,
  testDuration,
  testInstructions
}: TestPerformanceInsightsProps) {
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [performances, setPerformances] = useState<StudentPerformance[]>([]);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const analysis = await fetchTestAnalysis(testId);
        setPerformances(analysis.performances.map((perf) => ({
          attemptId: perf.attemptId,
          studentId: perf.studentId,
          studentName: perf.studentName,
          attemptNo: perf.attemptNo,
          submittedAt: perf.submittedAt,
          score: perf.score,
          totalMarks: perf.totalMarks,
          accuracy: perf.accuracy,
          rank: perf.rank,
          timeSpent: perf.timeSpent,
          result: {
            ...perf.result,
            questions: perf.result.questions.map((question) => ({
              id: question.id,
              text: question.question_text,
              question: question.question_text,
              options: question.options || undefined,
              correctAnswer: question.type === 'MCQ' ? Number(question.correct_answer) : question.correct_answer,
              subject: question.subject,
              marks: question.marks,
              type: question.type,
              metadata: { section: question.section || undefined },
              explanation: question.explanation || undefined,
              explanationImage: question.explanation_img || undefined,
              userAnswer: question.user_answer,
            })),
          },
        })));
      } catch (error) {
        console.error('Failed to load test analysis', error);
        setPerformances([]);
      }
    };

    void loadAnalysis();
  }, [testId]);

  // Sort by score and recalculate rank
  const rankedPerformances = useMemo(() => {
    return [...performances]
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        ...p,
        rank: index + 1
      }));
  }, [performances]);

  const filteredPerformances = rankedPerformances.filter(p => 
    p.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubmissionStatus = (submittedAt: string, timeSpentInSeconds: number) => {
    if (!scheduledDateTime) return null;
    
    // Calculate when the student actually started by subtracting time spent from submission time
    const startOfTestSession = new Date(new Date(submittedAt).getTime() - (timeSpentInSeconds * 1000));
    const scheduledStart = new Date(scheduledDateTime);
    
    const diffInMinutes = (startOfTestSession.getTime() - scheduledStart.getTime()) / (1000 * 60);
    
    // If started after 30 minutes of scheduled start time, it's late
    return diffInMinutes > 30 ? 'late' : 'on-time';
  };

  const handleDownloadTestPDF = () => {
    if (!testQuestions) return;

    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    // Group questions by Subject and then Section
    const groupedQuestions: Record<string, Record<string, any[]>> = {};
    testQuestions.forEach(q => {
      if (!groupedQuestions[q.subject]) groupedQuestions[q.subject] = {};
      const section = q.metadata?.section || 'Section A';
      if (!groupedQuestions[q.subject][section]) groupedQuestions[q.subject][section] = [];
      groupedQuestions[q.subject][section].push(q);
    });

    let globalIdx = 0;
    const contentHtml = Object.entries(groupedQuestions).map(([subject, sections]) => `
      <div class="subject-block">
        <h2 class="subject-title">${escapeHtml(subject)}</h2>
        ${Object.entries(sections).map(([section, questions]) => `
          <div class="section-block">
            <h3 class="section-title">${escapeHtml(section)}</h3>
            ${questions.map((q) => {
              globalIdx++;
              return `
                <div class="question-container">
                  <div class="question-header">
                    <span class="question-number">Q${globalIdx}.</span>
                    <div class="question-text">${escapeHtml(q.question || q.text)}</div>
                    <span class="question-marks">[${q.marks} Marks]</span>
                  </div>
                  ${q.type !== 'Numerical' && q.options ? `
                    <div class="options-grid">
                      ${q.options.map((opt: string, optIdx: number) => `
                        <div class="option">
                          <span class="option-label">(${String.fromCharCode(65 + optIdx)})</span>
                          <span class="option-text">${escapeHtml(opt)}</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <div class="numerical-box">
                      Answer: _______________________
                    </div>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>
    `).join('');

    const printableHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(testTitle)}</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: A4 portrait; margin: 15mm; }
            body { margin: 0; padding: 0; font-family: "Segoe UI", Tahoma, sans-serif; color: #0f172a; font-size: 11px; line-height: 1.4; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
            .brand { display: flex; align-items: center; gap: 10px; }
            .brand-logo { width: 45px; height: 45px; object-fit: contain; }
            .brand-title { margin: 0; font-size: 18px; color: #0f172a; font-weight: 700; }
            .test-info { text-align: right; }
            .test-info h1 { margin: 0; font-size: 16px; color: #0d9488; }
            .info-banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .instructions-section { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 15px; margin-bottom: 25px; page-break-inside: avoid; }
            .instructions-title { color: #92400e; font-size: 12px; font-weight: 800; text-transform: uppercase; margin: 0 0 8px 0; border-bottom: 1px solid #fde68a; padding-bottom: 4px; display: flex; align-items: center; gap: 6px; }
            .instructions-content { color: #78350f; font-size: 10.5px; white-space: pre-wrap; line-height: 1.6; }
            .subject-title { background: #0d9488; color: white; padding: 6px 12px; border-radius: 6px; font-size: 14px; margin: 25px 0 15px; text-transform: uppercase; }
            .section-title { border-bottom: 1px solid #e2e8f0; color: #0f766e; padding-bottom: 4px; margin: 15px 0 10px; font-size: 12px; }
            .question-container { margin-bottom: 18px; page-break-inside: avoid; }
            .question-header { display: flex; gap: 8px; margin-bottom: 8px; font-weight: 600; }
            .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-left: 25px; }
            .option { display: flex; gap: 6px; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <img src="${logo}" alt="Logo" class="brand-logo" />
              <div>
                <p class="brand-title">UJAAS Career Institute</p>
              </div>
            </div>
            <div class="test-info">
              <h1>${escapeHtml(testTitle)}</h1>
            </div>
          </div>
          <div class="info-banner">
            <div><b>Duration:</b> ${testDuration || 0} mins</div>
            <div><b>Max Marks:</b> ${testQuestions.reduce((acc, q) => acc + (q.marks || 0), 0)}</div>
          </div>
          ${testInstructions ? `
            <div class="instructions-section">
              <h4 class="instructions-title">General Instructions</h4>
              <div class="instructions-content">${escapeHtml(testInstructions)}</div>
            </div>
          ` : ''}
          <div class="questions-list">${contentHtml}</div>
          <div class="footer">© ${new Date().getFullYear()} UJAAS Career Institute. Authorized use only.</div>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);
    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printableHtml);
      doc.close();
      printFrame.onload = () => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => document.body.removeChild(printFrame), 1000);
      };
    }
  };

  if (selectedStudent) {
    return (
      <div className="fixed inset-0 bg-white z-[10005] overflow-y-auto">
        <StudentAnalytics 
          result={selectedStudent.result} 
          onClose={() => setSelectedStudent(null)} 
          hideExplanations={true}
          hideDownload={true}
        />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{testTitle}</h1>
                <p className="text-gray-500">Performance Insights & Student Submissions</p>
              </div>
            </div>
            {testQuestions && (
              <button
                onClick={handleDownloadTestPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download Test Paper
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Search by student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm border border-blue-100 whitespace-nowrap">
              <Users className="w-4 h-4" />
              {performances.length} Submissions
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Attempt</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Submitted At</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Accuracy</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPerformances.map((perf) => {
                  const status = getSubmissionStatus(perf.submittedAt, perf.timeSpent);
                  return (
                    <tr 
                      key={perf.attemptId}
                      onClick={() => setSelectedStudent(perf)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          perf.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          perf.rank === 2 ? 'bg-slate-100 text-slate-600' :
                          perf.rank === 3 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          #{perf.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{perf.studentName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-700">Attempt {perf.attemptNo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(perf.submittedAt).toLocaleDateString()}
                          <Clock className="w-3.5 h-3.5 ml-1" />
                          {new Date(perf.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {status && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                            status === 'late' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {status === 'late' ? 'Late' : 'On Time'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{perf.score} / {perf.totalMarks}</span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(perf.score / perf.totalMarks) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-green-500" />
                          <span className="font-bold text-gray-700">{perf.accuracy}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">
                          View Details
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredPerformances.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500">No students found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
