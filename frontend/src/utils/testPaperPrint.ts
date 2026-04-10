interface PrintableQuestion {
  id: string;
  subject: string;
  marks: number;
  type?: 'MCQ' | 'MSQ' | 'Numerical';
  metadata?: {
    section?: string;
  };
  text?: string;
  question?: string;
  questionImage?: string;
  options?: string[];
  optionImages?: (string | undefined)[] | null;
}

interface PrintTestPaperOptions {
  title: string;
  testId?: string;
  duration: number;
  totalMarks: number;
  totalQuestions: number;
  instructions?: string;
  questions: PrintableQuestion[];
  logoSrc?: string;
  instituteName?: string;
  locationName?: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderOptionalImage(src?: string, className = 'question-image') {
  if (!src) return '';
  return `<div class="image-block"><img src="${escapeHtml(src)}" alt="" class="${className}" /></div>`;
}

function buildPrintableHtml({
  title,
  testId,
  duration,
  totalMarks,
  totalQuestions,
  instructions,
  questions,
  logoSrc,
  instituteName = 'UJAAS Career Institute',
  locationName = 'Navsari',
}: PrintTestPaperOptions) {
  const groupedQuestions: Record<string, Record<string, PrintableQuestion[]>> = {};

  questions.forEach((question) => {
    const subject = question.subject || 'General';
    const section = question.metadata?.section || 'Section A';
    if (!groupedQuestions[subject]) groupedQuestions[subject] = {};
    if (!groupedQuestions[subject][section]) groupedQuestions[subject][section] = [];
    groupedQuestions[subject][section].push(question);
  });

  let questionNumber = 0;

  const contentHtml = Object.entries(groupedQuestions)
    .map(([subject, sections]) => `
      <section class="subject-block">
        <h2 class="subject-title">${escapeHtml(subject)}</h2>
        ${Object.entries(sections)
          .map(([section, sectionQuestions]) => `
            <div class="section-block">
              <h3 class="section-title">${escapeHtml(section)}</h3>
              ${sectionQuestions
                .map((question) => {
                  questionNumber += 1;
                  const questionText = question.question || question.text || '';
                  return `
                    <article class="question-container">
                      <div class="question-header">
                        <span class="question-number">Q${questionNumber}.</span>
                        <div class="question-body">
                          <div class="question-text">${escapeHtml(questionText)}</div>
                          ${renderOptionalImage(question.questionImage)}
                        </div>
                        <span class="question-marks">[${question.marks} Marks]</span>
                      </div>
                      ${
                        question.type !== 'Numerical' && Array.isArray(question.options) && question.options.length > 0
                          ? `
                            <div class="options-grid">
                              ${question.options
                                .map((option, optionIndex) => `
                                  <div class="option">
                                    <div class="option-line">
                                      <span class="option-label">(${String.fromCharCode(65 + optionIndex)})</span>
                                      <span class="option-text">${escapeHtml(option)}</span>
                                    </div>
                                    ${renderOptionalImage(question.optionImages?.[optionIndex], 'option-image')}
                                  </div>
                                `)
                                .join('')}
                            </div>
                          `
                          : `
                            <div class="numerical-box">
                              Answer: _______________________
                            </div>
                          `
                      }
                    </article>
                  `;
                })
                .join('')}
            </div>
          `)
          .join('')}
      </section>
    `)
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          @page { size: A4 portrait; margin: 14mm; }
          body {
            margin: 0;
            color: #0f172a;
            background: #ffffff;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11px;
            line-height: 1.45;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 12px;
            margin-bottom: 18px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .brand-logo {
            width: 44px;
            height: 44px;
            object-fit: contain;
          }
          .brand-title {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
          }
          .brand-location {
            margin: 2px 0 0;
            color: #475569;
            font-size: 11px;
            font-weight: 600;
          }
          .test-info {
            text-align: right;
          }
          .test-info h1 {
            margin: 0;
            color: #0f766e;
            font-size: 17px;
            line-height: 1.25;
          }
          .metadata {
            margin-top: 4px;
            color: #64748b;
            font-size: 10px;
            font-weight: 600;
          }
          .info-banner {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 18px;
          }
          .info-item {
            font-size: 10px;
            color: #334155;
          }
          .info-item b {
            color: #0f766e;
          }
          .instructions-section {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 22px;
            page-break-inside: avoid;
          }
          .instructions-title {
            margin: 0 0 8px;
            color: #92400e;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .instructions-content {
            color: #78350f;
            white-space: pre-wrap;
          }
          .subject-title {
            margin: 24px 0 14px;
            padding: 7px 12px;
            border-radius: 8px;
            background: #0d9488;
            color: #ffffff;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .section-title {
            margin: 0 0 10px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e2e8f0;
            color: #0f766e;
            font-size: 12px;
          }
          .question-container {
            margin-bottom: 18px;
            page-break-inside: avoid;
          }
          .question-header {
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 8px;
            align-items: start;
          }
          .question-number {
            color: #0d9488;
            font-weight: 700;
          }
          .question-body {
            min-width: 0;
          }
          .question-text {
            font-weight: 600;
            white-space: pre-wrap;
          }
          .question-marks {
            color: #64748b;
            font-size: 9px;
            font-weight: 700;
            white-space: nowrap;
          }
          .image-block {
            margin-top: 8px;
          }
          .question-image,
          .option-image {
            display: block;
            max-width: 100%;
            height: auto;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #ffffff;
          }
          .question-image {
            max-height: 170px;
            padding: 6px;
          }
          .options-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            padding-left: 24px;
            margin-top: 10px;
          }
          .option-line {
            display: flex;
            gap: 6px;
          }
          .option-label {
            font-weight: 700;
            color: #64748b;
          }
          .option-text {
            white-space: pre-wrap;
          }
          .option-image {
            max-height: 96px;
            margin-top: 6px;
            padding: 4px;
          }
          .numerical-box {
            margin-left: 24px;
            margin-top: 8px;
            color: #94a3b8;
            font-style: italic;
          }
          .footer {
            margin-top: 28px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 9px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            ${logoSrc ? `<img src="${escapeHtml(logoSrc)}" alt="Logo" class="brand-logo" />` : ''}
            <div>
              <p class="brand-title">${escapeHtml(instituteName)}</p>
              <p class="brand-location">${escapeHtml(locationName)}</p>
            </div>
          </div>
          <div class="test-info">
            <h1>${escapeHtml(title)}</h1>
            ${testId ? `<div class="metadata">Code: ${escapeHtml(testId)}</div>` : ''}
          </div>
        </div>

        <div class="info-banner">
          <div class="info-item"><b>Duration:</b> ${duration} mins</div>
          <div class="info-item"><b>Max Marks:</b> ${totalMarks}</div>
          <div class="info-item"><b>Questions:</b> ${totalQuestions}</div>
        </div>

        ${instructions?.trim() ? `
          <div class="instructions-section">
            <h4 class="instructions-title">General Instructions</h4>
            <div class="instructions-content">${escapeHtml(instructions)}</div>
          </div>
        ` : ''}

        ${contentHtml}

        <div class="footer">
          &copy; ${new Date().getFullYear()} ${escapeHtml(instituteName)}. This document is for authorized use only.
        </div>
      </body>
    </html>
  `;
}

export async function printTestPaperPdf(options: PrintTestPaperOptions) {
  const printableHtml = buildPrintableHtml(options);
  const printFrame = document.createElement('iframe');

  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';

  document.body.appendChild(printFrame);

  const frameWindow = printFrame.contentWindow;
  const doc = frameWindow?.document;
  if (!frameWindow || !doc) {
    document.body.removeChild(printFrame);
    throw new Error('Unable to open print window');
  }

  await new Promise<void>((resolve) => {
    doc.open();
    doc.write(printableHtml);
    doc.close();

    const waitForImages = async () => {
      const images = Array.from(doc.images);
      await Promise.all(
        images.map((image) => {
          if (image.complete) return Promise.resolve();
          return new Promise<void>((imageResolve) => {
            image.onload = () => imageResolve();
            image.onerror = () => imageResolve();
          });
        })
      );
      resolve();
    };

    if (doc.readyState === 'complete') {
      void waitForImages();
    } else {
      printFrame.onload = () => {
        void waitForImages();
      };
    }
  });

  frameWindow.focus();
  frameWindow.print();

  window.setTimeout(() => {
    if (document.body.contains(printFrame)) {
      document.body.removeChild(printFrame);
    }
  }, 1000);
}
