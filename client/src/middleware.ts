import { defineMiddleware } from "astro:middleware";
import { verifyProtectedRoute } from "./lib/protectedRoutes";
import { verifyToken } from "./lib/token";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, locals } = context;

  // Verify token
  const token = cookies.get("auth_token")?.value;
  const isValidToken = !!(token && (await verifyToken(token)));

  // Save session boolean
  locals.isLoggedIn = isValidToken;

  // Redirect to login if trying to access a protected route without a valid token
  const isProtectedRoute = verifyProtectedRoute(url.pathname);
  if (isProtectedRoute && !isValidToken) {
    return redirect("/login");
  }
  return next();
});
