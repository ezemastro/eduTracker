import { generateToken } from "@/lib/token";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
  // Get the password from the request body
  const { password } = await request.json();
  // Verify the password
  if (password !== "admin") {
    return new Response("Invalid password", {
      status: 401,
    });
  }
  // Generate a secure token
  const token = await generateToken();
  // Set cookie
  cookies.set("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: undefined,
  });
  // Return success response
  return new Response(null, {
    status: 200,
  });
};
