import { defineMiddleware } from "astro:middleware";
import { verifyProtectedRoute } from "./lib/protectedRoutes";
import { verifyToken } from "./lib/token";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const isProtectedRoute = verifyProtectedRoute(url.pathname);
  if (!isProtectedRoute) {
    return next();
  }

  const token = cookies.get("auth_token")?.value;
  if (!token) {
    return redirect("/login");
  }
  const isValidToken = await verifyToken(token);
  if (!isValidToken) {
    return redirect("/login");
  }
  return next();
});
