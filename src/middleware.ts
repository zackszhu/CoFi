export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/statistics/:path*",
    "/user-management/:path*",
    // Add other routes here that need to be protected
    // For example, if you had an API route like /api/protected-data
    // you could add "/api/protected-data/:path*"
  ],
};
