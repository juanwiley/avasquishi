import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 0;

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables");
    return NextResponse.json(
      { error: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("active", true)
    .limit(20);

  if (error) {
    console.error("Supabase query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
