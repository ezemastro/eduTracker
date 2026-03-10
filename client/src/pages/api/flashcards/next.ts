import { db } from "@/lib/database";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  // Look for the next student to review
  const student = await db.students.getNextReview();

  // If nothing to review, return "done"
  if (!student) {
    return new Response(JSON.stringify({ status: "done" }), { status: 200 });
  }

  // Get distractors
  const distractors = await db.students.getDistractors({
    studentId: student.id,
    groupId: student.group_id,
    count: 3,
  });

  // Shuffle options
  const correctName = `${student.name} ${student.lastName}`;
  const distractorsNames = distractors.map((r) => r.fullName as string);
  const options = [correctName, ...distractorsNames].sort(
    () => Math.random() - 0.5,
  );

  return new Response(
    JSON.stringify({
      status: "playing",
      flashcard: {
        id: student.id,
        image: student.image,
        options: options,
      },
    }),
    { status: 200 },
  );
};
