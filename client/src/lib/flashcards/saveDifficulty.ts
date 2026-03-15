import { db } from "../database";

export const saveFlashcardDifficulty = async ({
  studentId,
  difficulty,
}: {
  studentId: number;
  difficulty: "easy" | "medium" | "hard";
}) => {
  if (difficulty === "medium") return; // Already handled as default in verify.ts

  const student = await db.students.getById(studentId);
  let { ease_factor, interval } = student;
  const { repetitions } = student;

  // Only adjust if the student has gone through the initial learning phase (reps > 2)
  if (repetitions > 2) {
    const modifier = difficulty === "easy" ? 1.3 : 0.8; // "hard" is 0.8
    interval = Math.round(interval * modifier);
  }

  // Adjustment of the factor for the NEXT time
  if (difficulty === "hard") ease_factor = Math.max(1.3, ease_factor - 0.15);
  if (difficulty === "easy") ease_factor += 0.15;

  await db.students.updateFactor({
    id: studentId,
    ease_factor,
    interval,
    repetitions,
  });
};
