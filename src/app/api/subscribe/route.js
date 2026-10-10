// POST /api/subscribe — add an email to the Squish Squad list.
// Stores address + the consent wording shown. Sends nothing (no email provider yet).
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CONSENT_TEXT } from "@/lib/signup";

const TENANT_ID = process.env.AVASQUISHI_TENANT_ID || "c113bbab-4d77-46c4-a2a8-5f6cbe4bd48f";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCES = new Set(["footer", "home", "notify-me"]);

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  // Honeypot: real people never fill the hidden "website" field.
  if (body?.website) return NextResponse.json({ ok: true });

  const email = String(body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (body?.consent !== true) {
    return NextResponse.json({ error: "Please tick the box to agree." }, { status: 400 });
  }
  const source = SOURCES.has(body?.source) ? body.source : "footer";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Signup is unavailable right now." }, { status: 503 });
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { error } = await supabase
    .schema("wileypay")
    .from("subscribers")
    .upsert(
      { tenant_id: TENANT_ID, email, source, consent_text: CONSENT_TEXT },
      { onConflict: "tenant_id,email", ignoreDuplicates: true }
    );

  if (error) {
    console.error("subscribe failed:", error.message);
    return NextResponse.json({ error: "Signup is unavailable right now. Please try again later." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
