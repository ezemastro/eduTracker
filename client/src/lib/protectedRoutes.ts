export const verifyProtectedRoute = (url: string) => {
  const unprotectedRoutes = ["/", "/login"];
  return !(unprotectedRoutes.includes(url) || url.startsWith("/api/"));
};
