import type { PublishedTest } from '../App';

export function slugifyText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function preloadTestAssets(questions: PublishedTest['questions']) {
  const imageSources = questions.flatMap((question) => [
    question.questionImage,
    question.explanationImage,
    ...(question.optionImages || []),
  ]).filter((value): value is string => Boolean(value));

  await Promise.all(imageSources.map((src) => {
    if (src.startsWith('data:')) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = src;
    });
  }));
}
