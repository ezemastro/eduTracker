export const verifyProtectedRoute = (url: string) => {
  const unprotectedRoutes = ["/", "/login"];
  return !unprotectedRoutes.some((route) => url === route);
};
