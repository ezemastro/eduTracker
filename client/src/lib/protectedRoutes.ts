export const verifyProtectedRoute = (url: string) => {
  const unprotectedRoutes = ["/", "/login", "/api/login"];
  return !unprotectedRoutes.includes(url);
};
