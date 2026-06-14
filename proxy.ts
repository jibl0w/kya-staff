import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorised",
]);

// Built-in super-admin fallback (Phase 1 bootstrap; replaced by RBAC in Phase 5).
const FALLBACK_ADMIN_IDS = ["user_3F5CZYO6zsPEbBW92FXPTOO1p3m"];

const ENV_ADMIN_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean);

const ADMIN_IDS = Array.from(new Set([...FALLBACK_ADMIN_IDS, ...ENV_ADMIN_IDS]));

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();
  const { userId } = await auth();
  if (!userId) {
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