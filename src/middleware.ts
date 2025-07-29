import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth(.*)', // Sign-in and sub-routes
  '/api/webhooks(.*)', // Webhook endpoints (if you have any)
  '/api/jd-generator(.*)', // JD generator endpoint
  '/api/general-chat(.*)', // General chat endpoint
  '/onboarding(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const pathName = req.nextUrl.pathname;

  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // Adding onboarding logic 
  if(!isPublicRoute(req) && pathName !== '/onboarding'){
         const {userId} = await auth();

         if(userId){
         // Checking if the  userId is present in the database or not.
         const user = await prisma.employee.findUnique({ where: { id: userId } }) ||
                      await prisma.manager.findUnique({ where: { id: userId } });


        // If the user does not exist in the database, then the redirect to onboarding page
        if(!user){
          return Response.redirect(new URL('/onboarding',req.url));
        }
        
        }

  }
})


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}