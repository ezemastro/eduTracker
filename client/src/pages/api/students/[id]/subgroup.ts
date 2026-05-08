import { db } from "@/lib/database";
import type { APIRoute } from "astro";

export const PATCH: APIRoute = async ({ params, request }) => {
  const studentId = Number(params.id);

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return new Response(
      JSON.stringify({ success: false, error: "ID de estudiante inválido" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      },
    );
  }

  const student = await db.students.getById(studentId);
  if (!student) {
    return new Response(
      JSON.stringify({ success: false, error: "Estudiante no encontrado" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 404,
      },
    );
  }

  const body = await request.json();
  const sub_group = body.sub_group;

  if (sub_group !== "green" && sub_group !== "yellow" && sub_group !== null) {
    return new Response(
      JSON.stringify({ success: false, error: "Subgrupo inválido" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      },
    );
  }

  await db.students.update(studentId, { sub_group });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
