import { saveFlashcardDifficulty } from "@/lib/flashcards/saveDifficulty";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const { studentId, difficulty } = await request.json();

  await saveFlashcardDifficulty({
    studentId,
    difficulty,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
