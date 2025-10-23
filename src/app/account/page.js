// apps/avasquishi/src/app/account/page.js
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      console.error(error.message);
      alert("Login failed: " + error.message);
      setStatus("error");
    } else {
      alert("Magic link sent! Check your email.");
      setStatus("sent");
    }
  }

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Account Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ padding: "0.5rem", marginRight: "0.5rem" }}
        />
        <button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending..." : "Send Magic Link"}
        </button>
      </form>
    </main>
  );
}
