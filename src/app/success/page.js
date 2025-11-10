// apps/avasquishi/src/app/success/page.js
import { cookies } from "next/headers";
import SuccessClient from "./SuccessClient";

// Minimal, dependency-free check:
// Supabase sets cookies like "sb-<project>-auth-token" when a user is signed in.
function isSignedInFromCookies(cookieStore) {
  try {
    const all = cookieStore.getAll();
    return all.some((c) => /sb-.*-auth-token/i.test(c.name) && c.value);
  } catch {
    return false;
  }
}

export default async function Page() {
  const cookieStore = cookies();
  const signedIn = isSignedInFromCookies(cookieStore);

  return <SuccessClient signedIn={signedIn} />;
}
