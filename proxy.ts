import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorised",
]);

const ADMIN_IDS = (process.env.ADMIN_USER_IDS || "").split(",").map(id => id.trim());
const isSatellite = process.env.NEXT_PUBLIC_IS_SATELLITE === "true";

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();
  const { userId } = await auth();
  if (!userId) {
    if (isSatellite) {
      const signInUrl = new URL("https://accounts.kya.com.ng/sign-in");
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
  if (!ADMIN_IDS.includes(userId)) {
    return NextResponse.redirect(new URL("/unauthorised", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};