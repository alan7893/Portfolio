export { default } from "next-auth/middleware";

export const config = {
  // Protect everything except the login page, NextAuth endpoints,
  // Next internals and static assets.
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt).*)",
  ],
};
