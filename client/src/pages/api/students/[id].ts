import { db } from "@/lib/database";
import type { APIRoute } from "astro";

const isValidGender = (
  value: unknown,
): value is "male" | "female" => value === "male" || value === "female";

export const PUT: APIRoute = async ({ params, request }) => {
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

  const existingStudent = await db.students.getById(studentId);
  if (!existingStudent) {
    return new Response(
      JSON.stringify({ success: false, error: "Estudiante no encontrado" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 404,
      },
    );
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const lastName =
    typeof body.lastName === "string" ? body.lastName.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const groupId = Number(body.groupId);
  const gender = body.gender;

  if (!name || !lastName) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Nombre y apellido son obligatorios",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      },
    );
  }

  if (!isValidGender(gender)) {
    return new Response(
      JSON.stringify({ success: false, error: "Género inválido" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      },
    );
  }

  if (!Number.isInteger(groupId) || groupId <= 0) {
    return new Response(
      JSON.stringify({ success: false, error: "Grupo inválido" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      },
    );
  }

  const group = await db.groups.getById(groupId);
  if (!group) {
    return new Response(
      JSON.stringify({ success: false, error: "El grupo no existe" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      },
    );
  }

  await db.students.update(studentId, {
    name,
    lastName,
    gender,
    image: image || null,
    group_id: groupId,
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
