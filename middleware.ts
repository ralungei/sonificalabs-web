import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all pathnames except for:
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - /favicon.ico, /robots.txt, etc. (static files)
    // - files with extensions (e.g. /logo.png)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
