import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(request: NextRequest) {
  const requestedNextPath = request.nextUrl.searchParams.get("next");

  if (
    requestedNextPath?.startsWith("/") &&
    !requestedNextPath.startsWith("//")
  ) {
    return requestedNextPath;
  }

  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(request);

  if (code) {
    const supabase = await createClient();
    await supabase?.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
