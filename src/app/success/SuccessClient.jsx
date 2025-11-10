"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import styles from "./success.module.css";

export default function SuccessClient({ signedIn = false }) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";

  // 8-char order reference
  const shortRef = useMemo(
    () => (sessionId ? sessionId.slice(-8).toUpperCase() : ""),
    [sessionId]
  );

  const { clear } = useCart();

  // One-time cart clear per session_id (no loops; JS ref, no TS types)
  const handledSessionRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    if (handledSessionRef.current === sessionId) return; // already handled
    handledSessionRef.current = sessionId;

    const flagKey = `cartClearedForSession:${sessionId}`;
    try {
      if (!localStorage.getItem(flagKey)) {
        localStorage.setItem(flagKey, "1"); // set first to prevent re-entry
        clear();                            // clear in-memory cart
        localStorage.removeItem("cart");    // remove persisted key entirely
      }
    } catch {
      clear(); // storage blocked? still clear memory
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // intentionally exclude `clear` to avoid re-runs

  // Client-side signed-in fallback (look for Supabase token in localStorage)
  const [clientSignedIn, setClientSignedIn] = useState(signedIn);
  useEffect(() => {
    if (signedIn) return;
    try {
      const hasSbToken = Object.keys(localStorage).some(
        (k) => /^sb-.*-auth-token$/i.test(k) && localStorage.getItem(k)
      );
      if (hasSbToken) setClientSignedIn(true);
    } catch {}
  }, [signedIn]);

  // Claim/login via correct endpoint
  const [email, setEmail] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");

  async function onClaimSubmit(e) {
    e.preventDefault();

    
  setClaimError("");
   if (!email) return;
   try {
     setClaiming(true);
     const redirectTo = `${window.location.origin}/account?from=success&session_id=${encodeURIComponent(sessionId||"")}`;
     const { error } = await supabase.auth.signInWithOtp({
       email,
       options: { emailRedirectTo: redirectTo },
     });
     if (error) throw error;
     alert("Magic link sent! Check your email.");
   } catch (err) {
     setClaimError(err?.message || "Unable to send link. Please try again.");
   } finally {
     setClaiming(false);
   }


    
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">Thanks for your order!</h1>

      {shortRef ? (
        <p className="text-sm text-gray-700 mb-6">
          Order reference: <span className="font-mono font-semibold">{shortRef}</span>
        </p>
      ) : null}

      <div className="space-y-6">
        <p>Your payment was processed successfully. A receipt has been emailed to you.</p>

        {!clientSignedIn && (
          <section className="rounded-lg border p-4">
            <h2 className="font-medium mb-2">Want to view your order history?</h2>
            <p className="text-sm text-gray-700 mb-3">
              Enter your email to get a magic link. If you already have an account, this will sign you in.
              If not, it will let you claim this order and create an account for you.
            </p>
            <form onSubmit={onClaimSubmit} className={styles.claimRow}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={styles.claimInput}
              />
              <button type="submit" disabled={claiming} className={styles.claimButton}>
                {claiming ? "Sending…" : "Email me a link"}
              </button>
            </form>
            {claimError ? <p className="mt-2 text-sm text-red-600">{claimError}</p> : null}
          </section>
        )}

        <div className={styles.linkRow}>
          <Link href="/account" className={styles.link}>Go to your Account</Link>
          <Link href="/products" className={styles.link}>Continue shopping</Link>
        </div>
      </div>
    </main>
  );
}
