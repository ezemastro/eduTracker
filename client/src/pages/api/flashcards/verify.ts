import { saveFlashcardResult } from "@/lib/flashcards/saveResult";
import { verifyFlashcard } from "@/lib/flashcards/verify";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const { studentId, mode, selectedName, typedName, selectedId, tracking = false } =
    await request.json();

  const result = await verifyFlashcard({
    studentId,
    mode,
    selectedName,
    typedName,
    selectedId,
  });

  if (result.mode === "multiple") {
    const { isCorrect, correctName } = result.result;

    if (tracking && !isCorrect) {
      await saveFlashcardResult({ studentId, quality: 0 });
    }

    return new Response(
      JSON.stringify({
        isCorrect,
        correctName,
        waitingForFeedback: tracking && isCorrect,
      }),
      { status: 200 },
    );
  }

  if (result.mode === "type") {
    const {
      score,
      quality,
      correctName,
      correctLastName,
      details,
    } = result.result;

    if (tracking) {
      await saveFlashcardResult({ studentId, quality });
    }

    return new Response(
      JSON.stringify({
        score,
        quality,
        correctName,
        correctLastName,
        details,
        waitingForFeedback: false,
      }),
      { status: 200 },
    );
  }

  if (result.mode === "reverse") {
    const { isCorrect, correctId } = result.result;

    if (tracking && !isCorrect) {
      await saveFlashcardResult({ studentId, quality: 0 });
    }

    return new Response(
      JSON.stringify({
        isCorrect,
        correctId,
        waitingForFeedback: tracking && isCorrect,
      }),
      { status: 200 },
    );
  }

  return new Response(JSON.stringify({ error: "Invalid mode" }), {
    status: 400,
  });
};
