import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const { pathname } = req.nextUrl;

    // Force password change on first login
    if (token?.mustChangePassword && pathname !== "/change-password") {
      const url = req.nextUrl.clone();
      url.pathname = "/change-password";
      return NextResponse.redirect(url);
    }

    // Admin-only routes
    if (pathname.startsWith("/admin") && !token?.isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/picks";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/picks/:path*", "/leaderboard/:path*", "/bracket/:path*", "/admin/:path*", "/change-password"],
};
