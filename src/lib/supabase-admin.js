// apps/avasquishi/src/lib/supabase-admin.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;        // preferred on server
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;       // safe fallback

// Never throw during build: fall back to anon if service is not present.
// This keeps server-only code working in CI where only public keys exist.
export const supabaseAdmin = createClient(url || '', service || anon || '', {
  auth: { persistSession: false },
});
