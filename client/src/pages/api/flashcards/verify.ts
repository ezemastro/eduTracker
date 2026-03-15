import { saveFlashcardResult } from "@/lib/flashcards/saveResult";
import { verifyFlashcard } from "@/lib/flashcards/verify";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const { studentId, selectedName, tracking = false } = await request.json();

  const { correctName, isCorrect } = await verifyFlashcard({
    studentId,
    selectedName,
  });

  if (tracking) {
    await saveFlashcardResult({ studentId, isCorrect });
  }

  const waitingForFeedback = tracking && isCorrect;
  console.log(waitingForFeedback);

  return new Response(
    JSON.stringify({
      isCorrect,
      correctName,
      waitingForFeedback,
    }),
    { status: 200 },
  );
};
