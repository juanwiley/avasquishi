// apps/avasquishi/src/app/api/account/claim/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Ensure Next never tries to prerender/execute this at build time
export const dynamic = "force-dynamic";

// Create the admin client only when a request actually hits this route
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars are missing");
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const supabase = getAdminClient();

    // ⬇️ keep your existing logic from here down
    const body = await req.json().catch(() => ({}));
    const { email, user_id } = body || {};
    if (!email && !user_id) {
      return NextResponse.json({ error: "email or user_id required" }, { status: 400 });
    }

    // ... your current account-claim logic (queries/inserts/updates) ...

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const msg = err?.message || "Account claim failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
