import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protect all /admin routes...
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
// ...EXCEPT the sign-in route
const isSignInRoute = createRouteMatcher(["/admin/sign-in(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) && !isSignInRoute(req)) {
    await auth.protect();
  }
});


export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};