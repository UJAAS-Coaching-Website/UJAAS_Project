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
    metadata: { section: question.section || undefined },
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
    metadata: { section: question.section || undefined },
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
    version: test.version !== undefined && test.version !== null ? String(test.version) : undefined,
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
