export function normalizeNumericValue(value) {
    const parsed = Number(String(value).trim());
    return Number.isFinite(parsed) ? parsed : null;
}

export function isNumericalAnswerCorrect(submittedAnswer, correctAnswerRaw) {
    const submittedNumeric = normalizeNumericValue(submittedAnswer);
    const correctNumeric = normalizeNumericValue(correctAnswerRaw);

    if (submittedNumeric !== null && correctNumeric !== null) {
        return submittedNumeric === correctNumeric;
    }

    return String(submittedAnswer).trim() === String(correctAnswerRaw).trim();
}

export function parseStoredAnswer(value, questionType) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (questionType === "Numerical") {
        return String(value).trim();
    }

    if (Array.isArray(value)) {
        return value.map((item) => Number(item)).filter(Number.isFinite).sort((a, b) => a - b);
    }

    if (typeof value === "number") {
        return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : String(value).trim();
}

export function buildJeeMainScorableSet(questions, _answers) {
    const scorable = new Set();

    for (const question of questions) {
        // Latest JEE Main pattern does not use a Section B attempt cap.
        scorable.add(question.id);
    }

    return scorable;
}

export function scoreAttempt(questions, answers, options = {}) {
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unattempted = 0;

    const normalizedAnswers = answers && typeof answers === "object" ? answers : {};
    const isJeeMain = options?.format === "JEE MAIN";
    const scorableIds = isJeeMain ? buildJeeMainScorableSet(questions, normalizedAnswers) : null;

    for (const question of questions) {
        if (scorableIds && !scorableIds.has(question.id)) {
            continue;
        }

        const submittedAnswer = parseStoredAnswer(normalizedAnswers[question.id], question.type);
        const correctAnswerRaw = question.correct_answer ?? question.correct_ans ?? "";

        if (submittedAnswer === null) {
            unattempted += 1;
            continue;
        }

        let isCorrect = false;
        if (question.type === "Numerical") {
            isCorrect = isNumericalAnswerCorrect(submittedAnswer, correctAnswerRaw);
        } else if (question.type === "MSQ") {
            let normalizedCorrect;
            try {
                normalizedCorrect = Array.isArray(correctAnswerRaw)
                    ? correctAnswerRaw
                    : JSON.parse(correctAnswerRaw);
            } catch {
                normalizedCorrect = [];
            }

            const sortedCorrect = (normalizedCorrect || []).map((item) => Number(item)).filter(Number.isFinite).sort((a, b) => a - b);
            const sortedSubmitted = Array.isArray(submittedAnswer) ? submittedAnswer : [];
            isCorrect = JSON.stringify(sortedCorrect) === JSON.stringify(sortedSubmitted);
        } else {
            const parsedCorrect = Number(correctAnswerRaw);
            isCorrect = Number.isFinite(parsedCorrect) && Number(submittedAnswer) === parsedCorrect;
        }

        if (isCorrect) {
            correctAnswers += 1;
            score += Number(question.marks || 0);
        } else {
            wrongAnswers += 1;
            score -= Number(question.neg_marks || 0);
        }
    }

    return {
        score,
        correctAnswers,
        wrongAnswers,
        unattempted,
    };
}

export function mapAssessmentQuestionRow(question) {
    return {
        id: question.id,
        subject: question.subject || "General",
        section: question.section || null,
        type: question.type,
        question_text: question.question_text,
        question_img: question.question_img || null,
        options: question.options || null,
        option_imgs: question.option_imgs || null,
        correct_answer: question.correct_answer ?? question.correct_ans ?? "",
        marks: Number(question.marks || 0),
        neg_marks: Number(question.neg_marks || 0),
        explanation: question.explanation || null,
        explanation_img: question.explanation_img || null,
        order_index: Number(question.order_index || 0),
        difficulty: question.difficulty || null,
    };
}

export function stripExplanationFields(question) {
    return {
        ...question,
        explanation: null,
        explanation_img: null,
    };
}

export function mapAttemptQuestionsForResult(questions, answers) {
    const normalizedAnswers = answers && typeof answers === "object" ? answers : {};

    return questions.map((question) => ({
        ...stripExplanationFields(question),
        user_answer: Object.prototype.hasOwnProperty.call(normalizedAnswers, question.id)
            ? normalizedAnswers[question.id]
            : null,
    }));
}

export function calculateTotalMarks(questions) {
    return questions.reduce((sum, question) => sum + Number(question.marks || 0), 0);
}
