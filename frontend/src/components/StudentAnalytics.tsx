import { motion } from 'motion/react';
import { TestTaking } from './TestTaking';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  BarChart3,
  Percent,
  Users,
  Calendar,
  BookOpen,
  ChevronRight,
  Download
} from 'lucide-react';
import logo from '../assets/logo.svg';

interface Question {
  id: string;
  text: string;
  question?: string;
  options?: string[];
  correctAnswer: number | string | number[];
  subject: string;
  marks: number;
  type?: 'MCQ' | 'MSQ' | 'Numerical';
  metadata?: {
    section?: string;
  };
  userAnswer?: number | string | null;
}

interface TestResult {
  testId: string;
  testTitle: string;
  totalMarks: number;
  obtainedMarks: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  timeSpent: number;
  duration: number;
  rank: number;
  totalStudents: number;
  submittedAt: string;
  questions: Question[];
  instructions?: string;
}

interface StudentAnalyticsProps {
  result: TestResult;
  onClose: () => void;
  onViewResults?: (testId: string) => void;
  hideExplanations?: boolean;
  hideDownload?: boolean;
}

export function StudentAnalytics({ result, onClose, onViewResults, hideExplanations = false, hideDownload = false }: StudentAnalyticsProps) {
  const accuracy = result.totalQuestions > 0 
    ? ((result.correctAnswers / result.totalQuestions) * 100).toFixed(1)
    : '0.0';
  
  const percentage = ((result.obtainedMarks / result.totalMarks) * 100).toFixed(1);

  const reviewAnswers = result.questions.reduce<Record<string, number | null>>((acc, question) => {
    acc[question.id] = (question.userAnswer as any) ?? null;
    return acc;
  }, {});

  const reviewQuestions = result.questions.map((question) => ({
    id: question.id,
    question: question.question ?? question.text,
    options: question.options,
    correctAnswer: question.correctAnswer,
    subject: question.subject,
    marks: question.marks,
    type: question.type ?? ('MCQ' as const),
    metadata: question.metadata,
    explanation: '',
  }));

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const handleDownloadTestPDF = () => {
    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    // Group questions by Subject and then Section
    const groupedQuestions: Record<string, Record<string, Question[]>> = {};
    result.questions.forEach(q => {
      if (!groupedQuestions[q.subject]) groupedQuestions[q.subject] = {};
      const section = q.metadata?.section || 'Section A';
      if (!groupedQuestions[q.subject][section]) groupedQuestions[q.subject][section] = [];
      groupedQuestions[q.subject][section].push(q);
    });

    // Track global question number
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
                      ${q.options.map((opt, optIdx) => `
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
          <title>${escapeHtml(result.testTitle)}</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: A4 portrait; margin: 15mm; }
            body {
              margin: 0;
              padding: 0;
              font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
              color: #0f172a;
              background: #ffffff;
              font-size: 11px;
              line-height: 1.4;
            }
            .header {
              border-bottom: 2px solid #0d9488;
              padding-bottom: 12px;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .brand-logo {
              width: 45px;
              height: 45px;
              object-fit: contain;
            }
            .brand-title {
              margin: 0;
              font-size: 18px;
              color: #0f172a;
              font-weight: 700;
            }
            .brand-location {
              margin: 1px 0 0;
              color: #334155;
              font-size: 11px;
              font-weight: 600;
            }
            .test-info {
              text-align: right;
              max-width: 60%;
            }
            .test-info h1 {
              margin: 0;
              font-size: 16px;
              color: #0d9488;
              line-height: 1.2;
            }
            .metadata {
              margin-top: 4px;
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
            }
            .info-banner {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 15px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
            }
            .info-item b { color: #0f766e; }
            
            .subject-title {
              background: #0d9488;
              color: white;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 14px;
              margin: 25px 0 15px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .section-title {
              border-bottom: 1px solid #e2e8f0;
              color: #0f766e;
              padding-bottom: 4px;
              margin: 15px 0 10px;
              font-size: 12px;
            }
            .question-container {
              margin-bottom: 18px;
              page-break-inside: avoid;
            }
            .question-header {
              display: flex;
              gap: 8px;
              margin-bottom: 8px;
              font-weight: 600;
              position: relative;
            }
            .question-number {
              color: #0d9488;
              flex-shrink: 0;
            }
            .question-text {
              flex: 1;
            }
            .question-marks {
              font-size: 9px;
              color: #64748b;
              white-space: nowrap;
            }
            .options-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              padding-left: 25px;
            }
            .option {
              display: flex;
              gap: 6px;
            }
            .option-label {
              font-weight: 700;
              color: #64748b;
            }
            .numerical-box {
              margin-left: 25px;
              color: #94a3b8;
              font-style: italic;
            }
            .instructions-section {
              background: #fffbeb;
              border: 1px solid #fde68a;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .instructions-title {
              color: #92400e;
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              margin: 0 0 8px 0;
              border-bottom: 1px solid #fde68a;
              padding-bottom: 4px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .instructions-content {
              color: #78350f;
              font-size: 10.5px;
              white-space: pre-wrap;
              line-height: 1.6;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <img src="${logo}" alt="Logo" class="brand-logo" />
              <div>
                <p class="brand-title">UJAAS Career Institute</p>
                <p class="brand-location">Navsari</p>
              </div>
            </div>
            <div class="test-info">
              <h1>${escapeHtml(result.testTitle)}</h1>
              <div class="metadata">Code: ${result.testId}</div>
            </div>
          </div>

          <div class="info-banner">
            <div class="info-item"><b>Duration:</b> ${result.duration} mins</div>
            <div class="info-item"><b>Max Marks:</b> ${result.totalMarks}</div>
            <div class="info-item"><b>Questions:</b> ${result.totalQuestions}</div>
          </div>

          ${result.instructions ? `
            <div class="instructions-section">
              <h4 class="instructions-title">General Instructions</h4>
              <div class="instructions-content">${escapeHtml(result.instructions)}</div>
            </div>
          ` : ''}

          <div class="questions-list">
            ${contentHtml}
          </div>

          <div class="footer">
            © ${new Date().getFullYear()} UJAAS Career Institute, Navsari. This document is for authorized use only.
          </div>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printableHtml);
      doc.close();

      printFrame.onload = () => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{result.testTitle}</h1>
              <p className="text-gray-600">Detailed Performance Analysis</p>
            </div>
            <div className="flex gap-3">
              {!hideDownload && (
                <button
                  onClick={handleDownloadTestPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mb-2">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-300" />
              </div>
              <p className="text-blue-100 text-sm mb-1">Your Score</p>
              <p className="text-5xl font-bold mb-1">{result.obtainedMarks}</p>
              <p className="text-blue-100">out of {result.totalMarks}</p>
              <div className="mt-3 inline-block px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-lg font-bold">{percentage}%</span>
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <Target className="w-12 h-12 mx-auto mb-3 text-green-300" />
              </div>
              <p className="text-blue-100 text-sm mb-1">Accuracy</p>
              <p className="text-5xl font-bold mb-1">{accuracy}%</p>
              <p className="text-blue-100">{result.correctAnswers}/{result.totalQuestions} correct</p>
              <div className="mt-3 text-sm">
                <span className="text-green-300">✓ {result.correctAnswers}</span>
                <span className="mx-2">•</span>
                <span className="text-red-300">✗ {result.wrongAnswers}</span>
                <span className="mx-2">•</span>
                <span className="text-gray-300">− {result.unattempted}</span>
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <Award className="w-12 h-12 mx-auto mb-3 text-purple-300" />
              </div>
              <p className="text-blue-100 text-sm mb-1">Your Rank</p>
              <p className="text-5xl font-bold mb-1">#{result.rank}</p>
              <p className="text-blue-100">out of {result.totalStudents}</p>
              <div className="mt-3 inline-block px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-lg font-bold">Top Performance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: CheckCircle, label: 'Correct', value: result.correctAnswers, color: 'green' },
            { icon: XCircle, label: 'Wrong', value: result.wrongAnswers, color: 'red' },
            { icon: Clock, label: 'Time Spent', value: formatTime(result.timeSpent), color: 'blue' },
            { icon: Percent, label: 'Percentage', value: `${percentage}%`, color: 'purple' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            >
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Review Mode (Read Only) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <TestTaking
            testId={result.testId}
            testTitle={`${result.testTitle} - Review`}
            duration={Math.max(1, Math.ceil(result.duration / 60))}
            questions={reviewQuestions}
            onSubmit={() => {}}
            onExit={onClose}
            initialAnswers={reviewAnswers}
            initialTimeSpent={result.timeSpent}
            isFacultyPreview={true}
            disableEditing={true}
            hideExplanations={hideExplanations}
          />
        </motion.div>
      </div>
    </div>
  );
}
