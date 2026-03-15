import { db } from "../database";

export const saveFlashcardResult = async ({
  studentId,
  isCorrect,
}: {
  studentId: number;
  isCorrect: boolean;
}) => {
  let { ease_factor, interval, repetitions } =
    await db.students.getById(studentId);

  if (!isCorrect) {
    repetitions = 0;
    interval = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
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
