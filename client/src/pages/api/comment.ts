import { db } from "@/lib/database";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const { studentId, content } = await request.json();
  const cleanContent = content.trim();

  if (!cleanContent) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "El comentario no puede estar vacío",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
  await db.comments.add(studentId, cleanContent);

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
