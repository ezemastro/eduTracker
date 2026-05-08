import { db } from "../database";

export const saveFlashcardResult = async ({
  studentId,
  quality,
}: {
  studentId: number;
  quality: number; // 0-5
}) => {
  let { ease_factor, interval, repetitions } =
    await db.students.getById(studentId);

  // SM-2 ease factor adjustment
  const efChange = 0.1 - (5 - quality) * 0.15;
  ease_factor = Math.max(1.3, ease_factor + efChange);

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 3;
    else interval = Math.round(interval * ease_factor);
  }

  await db.students.updateFactor({
    id: studentId,
    ease_factor,
    interval,
    repetitions,
  });

  return { ease_factor, interval, repetitions };
};
