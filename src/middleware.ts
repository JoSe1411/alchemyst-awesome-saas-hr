import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth(.*)', // Sign-in and sub-routes
  '/api/webhooks(.*)', // Webhook endpoints (if you have any)
  '/api/jd-generator(.*)', // JD generator endpoint
  '/api/general-chat(.*)', // General chat endpoint
  '/onboarding(.*)'
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();

  // If the user is signed in and trying to access the homepage, redirect them to their dashboard
  if (userId && req.nextUrl.pathname === '/') {
    // Redirect to manager dashboard by default - the dashboard page will handle onboarding checks
    const dashboardUrl = new URL(`/dashboard/manager/${userId}`, req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Redirect Clerk's default sign-up to our custom sign-up form
  if (req.nextUrl.pathname === '/sign-up' || req.nextUrl.pathname === '/signup') {
    const customSignUpUrl = new URL('/auth/sign-up', req.url);
    return NextResponse.redirect(customSignUpUrl);
  }

  // Note: Onboarding check is now handled by the dashboard pages themselves
  // to avoid Prisma client issues in middleware

  // If the user is not signed in and trying to access a protected route, redirect them to the sign-in page
  if (!isPublicRoute(req) && !userId) {
    return (await auth()).redirectToSignIn();
  }
});


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}