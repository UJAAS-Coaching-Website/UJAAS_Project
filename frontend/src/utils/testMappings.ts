import type { PublishedTest } from '../App';
import type {
  ApiAttemptResult,
  ApiAttemptResultQuestion,
  ApiQuestion,
  ApiTest,
} from '../api/tests';
import type { ApiDppAttemptResultQuestion, ApiDppQuestion } from '../api/dpps';

type ApiQuestionLike = Pick<
  ApiQuestion,
  | 'id'
  | 'type'
  | 'subject'
  | 'section'
  | 'question_text'
  | 'question_img'
  | 'options'
  | 'option_imgs'
  | 'correct_answer'
  | 'marks'
  | 'neg_marks'
  | 'explanation'
  | 'explanation_img'
  | 'difficulty'
> & {
  user_answer?: string | number | number[] | null;
};

type AnalyticsQuestionOptions = {
  includeNegativeMarks?: boolean;
};

export interface SubjectWiseStat {
  subject: string;
  scoredMarks: number;
  totalMarks: number;
  correct: number;
  incorrect: number;
  unattempted: number;
}

type SubjectAggregationQuestion = {
  subject?: string | null;
  type?: 'MCQ' | 'MSQ' | 'Numerical' | string;
  marks: number;
  negativeMarks?: number;
  correctAnswer: number | string | number[];
  userAnswer?: number | string | number[] | null;
};

const isUnattemptedValue = (value: string | number | number[] | null | undefined) =>
  Array.isArray(value) ? value.length === 0 : value === undefined || value === null || value === '';

const normalizeAttemptValue = (
  value: string | number | number[] | null | undefined,
  questionType: SubjectAggregationQuestion['type'],
) => {
  if (isUnattemptedValue(value)) return null;

  if (questionType === 'Numerical') {
    const raw = String(value).trim();
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  }

  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter(Number.isFinite).sort((a, b) => a - b);
  }

  if (typeof value === 'number') return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : String(value).trim();
};

const isQuestionCorrectByType = (question: SubjectAggregationQuestion) => {
  const normalizedUser = normalizeAttemptValue(question.userAnswer, question.type);
  if (normalizedUser === null) return false;

  const normalizedCorrect = normalizeAttemptValue(question.correctAnswer as any, question.type);
  if (normalizedCorrect === null) return false;

  if (Array.isArray(normalizedUser) && Array.isArray(normalizedCorrect)) {
    if (normalizedUser.length !== normalizedCorrect.length) return false;
    return normalizedUser.every((value, index) => value === normalizedCorrect[index]);
  }

  return normalizedUser === normalizedCorrect;
};

const toRoundedScore = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function aggregateSubjectWiseStats(
  questions: SubjectAggregationQuestion[],
): SubjectWiseStat[] {
  const stats = new Map<string, SubjectWiseStat>();

  questions.forEach((question) => {
    const subject = typeof question.subject === 'string' && question.subject.trim()
      ? question.subject.trim()
      : 'Other';

    if (!stats.has(subject)) {
      stats.set(subject, {
        subject,
        scoredMarks: 0,
        totalMarks: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
      });
    }

    const stat = stats.get(subject)!;
    const marks = Number(question.marks) || 0;
    const penalty = Math.abs(Number(question.negativeMarks) || 0);
    const isUnattempted = isUnattemptedValue(question.userAnswer);

    stat.totalMarks += marks;

    if (isUnattempted) {
      stat.unattempted += 1;
      return;
    }

    if (isQuestionCorrectByType(question)) {
      stat.correct += 1;
      stat.scoredMarks += marks;
      return;
    }

    stat.incorrect += 1;
    stat.scoredMarks -= penalty;
  });

  return Array.from(stats.values())
    .map((entry) => ({
      ...entry,
      scoredMarks: toRoundedScore(entry.scoredMarks),
      totalMarks: toRoundedScore(entry.totalMarks),
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

function normalizeSectionLabel(value: string | null | undefined) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return undefined;
  const compact = raw.toLowerCase().replace(/\s+/g, '');
  if (compact === 'sectiona' || compact === 'a') return 'Section A';
  if (compact === 'sectionb' || compact === 'b') return 'Section B';
  return raw;
}

export function parseQuestionCorrectAnswer(type: string, correctAnswer: string) {
  if (type === 'MCQ') {
    return Number(correctAnswer);
  }

  if (type === 'MSQ') {
    try {
      const parsed = JSON.parse(correctAnswer);
      return Array.isArray(parsed)
        ? parsed.map((value) => Number(value)).filter(Number.isFinite)
        : [];
    } catch {
      return [];
    }
  }

  return correctAnswer;
}

export function mapApiQuestionToPublishedQuestion(question: ApiQuestionLike) {
  return {
    id: question.id,
    type: question.type,
    subject: question.subject,
    question: question.question_text,
    questionImage: question.question_img || undefined,
    options: question.options || undefined,
    optionImages: question.option_imgs || undefined,
    correctAnswer: parseQuestionCorrectAnswer(question.type, question.correct_answer),
    marks: question.marks,
    negativeMarks: question.neg_marks,
    explanation: question.explanation || undefined,
    explanationImage: question.explanation_img || undefined,
    difficulty: question.difficulty || undefined,
    metadata: { section: normalizeSectionLabel(question.section) },
  };
}

export function mapApiQuestionToAnalyticsQuestion(
  question: ApiQuestionLike,
  options: AnalyticsQuestionOptions = {},
) {
  const mappedQuestion = {
    id: question.id,
    text: question.question_text,
    question: question.question_text,
    questionImage: question.question_img || undefined,
    options: question.options || undefined,
    optionImages: question.option_imgs || undefined,
    correctAnswer: parseQuestionCorrectAnswer(question.type, question.correct_answer),
    subject: question.subject,
    marks: question.marks,
    type: question.type,
    metadata: { section: normalizeSectionLabel(question.section) },
    explanation: question.explanation || undefined,
    explanationImage: question.explanation_img || undefined,
    userAnswer: question.user_answer,
  };

  if (options.includeNegativeMarks) {
    return {
      ...mappedQuestion,
      negativeMarks: question.neg_marks,
    };
  }

  return mappedQuestion;
}

export function mapApiTestToPublished(test: ApiTest): PublishedTest {
  const questionCount = Number(test.question_count);
  const enrolledCount = Number(test.enrolled_count);
  const submittedAttemptCount =
    test.submitted_attempt_count === undefined || test.submitted_attempt_count === null
      ? undefined
      : Number(test.submitted_attempt_count);

  return {
    id: test.id,
    title: test.title,
    format: test.format || 'Custom',
    batches: test.batches.map((batch) => batch.name),
    duration: test.duration_minutes,
    totalMarks: test.total_marks,
    questionCount: Number.isFinite(questionCount) ? questionCount : 0,
    enrolledCount: Number.isFinite(enrolledCount) ? enrolledCount : 0,
    scheduleDate: test.schedule_date || '',
    scheduleTime: test.schedule_time || '',
    instructions: test.instructions || undefined,
    status: test.status,
    submittedAttemptCount:
      submittedAttemptCount !== undefined && Number.isFinite(submittedAttemptCount)
        ? submittedAttemptCount
        : undefined,
    maxAttempts: submittedAttemptCount !== undefined ? 3 : undefined,
    hasActiveAttempt: test.has_active_attempt,
    activeAttemptId: test.active_attempt_id ?? null,
    latestAttemptId: test.latest_attempt_id ?? null,
    latestAttemptSubmittedAt: test.latest_attempt_submitted_at ?? null,
    latestAttemptTimeSpent: test.latest_attempt_time_spent ?? null,
    questions: (test.questions || []).map(mapApiQuestionToPublishedQuestion),
  };
}

export function mapApiAttemptResultToAnalytics(result: ApiAttemptResult) {
  return {
    ...result,
    questions: result.questions.map((question) =>
      mapApiQuestionToAnalyticsQuestion(question, { includeNegativeMarks: true }),
    ),
  };
}

export function mapApiAttemptQuestionsToAnalytics(
  questions: ApiAttemptResultQuestion[] | ApiDppAttemptResultQuestion[],
  options: AnalyticsQuestionOptions = {},
) {
  return questions.map((question) => mapApiQuestionToAnalyticsQuestion(question, options));
}

export function mapApiDppQuestionsToAnalytics(
  questions: ApiDppQuestion[] | ApiDppAttemptResultQuestion[],
) {
  return questions.map((question) => mapApiQuestionToAnalyticsQuestion(question));
}
