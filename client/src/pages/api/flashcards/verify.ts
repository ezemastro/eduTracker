import { db } from "@/lib/database";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const { studentId, selectedName, difficulty } = await request.json();

  const student = await db.students.getById(studentId);
  const correctName = `${student.name} ${student.lastName}`;
  const isCorrect = correctName === selectedName;

  let { ease_factor, interval, repetitions } = student;

  if (!isCorrect) {
    // If is wrong: reset streak and interval.
    repetitions = 0;
    interval = 1; // tomorrow
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  } else {
    // If correct: Evaluate how difficult it was (1: Hard, 2: Medium, 3: Easy)
    repetitions += 1;

    if (repetitions === 1) interval = 1;
    else if (repetitions === 2)
      interval = 3; // We saw it 2 times in a row, jump to 3 days
    else {
      // SRS: Multiply the previous interval by the ease factor, and adjust based on difficulty feedback
      const modifier =
        difficulty === "easy" ? 1.3 : difficulty === "hard" ? 0.8 : 1;
      interval = Math.round(interval * ease_factor * modifier);
    }

    // Adjust ease factor based on difficulty feedback
    if (difficulty === "hard") ease_factor = Math.max(1.3, ease_factor - 0.15);
    if (difficulty === "easy") ease_factor += 0.15;
  }

  // Save the updated SRS data for the student
  await db.students.updateFactor({
    id: studentId,
    ease_factor,
    interval,
    repetitions,
  });

  return new Response(
    JSON.stringify({
      isCorrect,
      correctName, // Se lo mandamos AHORA para que lo muestre si falló
      nextReviewDays: interval,
    }),
    { status: 200 },
  );
};
