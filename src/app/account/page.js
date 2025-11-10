// apps/avasquishi/src/app/account/page.js
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function formatMoney(cents) { return `$${(Number(cents || 0) / 100).toFixed(2)}`; }
function ninetyDaysAgoISO() { return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); }

export default function AccountPage() {
  const [authReady, setAuthReady] = useState(false);   // ← NEW
  const [emailInput, setEmailInput] = useState("");
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  // Load current user (and subscribe to changes) before rendering either state
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data?.user ?? null);
      if (data?.user?.email) setEmailInput(data.user.email);
      setAuthReady(true);                                // ← READY
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) setEmailInput(session.user.email);
    });

    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  // Claim guest orders after login
  useEffect(() => {
    if (!user?.email) return;
    let done = false;
    (async () => {
      try {
        setClaiming(true);
        await fetch("/api/account/claim", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: user.email, userId: user.id }),
        });
      } finally { if (!done) setClaiming(false); }
    })();
    return () => { done = true; };
  }, [user?.email, user?.id]);

  // Fetch orders (90 days)
  useEffect(() => {
    if (!user?.email) return;
    let mounted = true;

    (async () => {
      setLoadingOrders(true);
      setError("");

      const since = ninetyDaysAgoISO();
      let query = supabase
        .schema("wileypay")
        .from("sales")
        .select("checkout_session_id, created_at, total, item_id, qty, status")
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      if (user?.id) query = query.or(`user_id.eq.${user.id},email.eq.${user.email}`);
      else query = query.eq("email", user.email);

      const { data: rows, error: errRows } = await query;
      if (errRows) { setError(errRows.message); setLoadingOrders(false); return; }

      const itemIds = Array.from(new Set((rows || []).map(r => r.item_id)));
      let nameById = new Map();
      if (itemIds.length) {
        const { data: items } = await supabase.schema("wileypay")
          .from("inventory_items").select("id,name").in("id", itemIds);
        nameById = new Map((items || []).map(i => [i.id, i.name || "Item"]));
      }

      const bySession = new Map();
      for (const r of rows || []) {
        const key = r.checkout_session_id;
        const entry = bySession.get(key) || {
          checkout_session_id: key, first_created_at: r.created_at,
          status: r.status || "completed", total_cents: 0, lines: [],
        };
        entry.first_created_at = entry.first_created_at < r.created_at ? entry.first_created_at : r.created_at;
        entry.total_cents += Number(r.total || 0);
        entry.lines.push({ name: nameById.get(r.item_id) || "Item", qty: r.qty || 1 });
        bySession.set(key, entry);
      }

      const out = Array.from(bySession.values()).sort((a,b)=>b.first_created_at.localeCompare(a.first_created_at));
      if (mounted) setOrders(out);
      setLoadingOrders(false);
    })();

    return () => { mounted = false; };
  }, [user?.email, user?.id]);

  async function sendMagicLink(e) {
    e.preventDefault();
    setSending(true); setError("");
    const redirectTo = `${window.location.origin}/account`;
    const { error: err } = await supabase.auth.signInWithOtp({
      email: emailInput,
      options: { emailRedirectTo: redirectTo },
    });
    setSending(false);
    if (err) { setError(err.message); alert("Login failed: " + err.message); }
    else alert("Magic link sent! Check your email.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null); setOrders([]);
  }

  // ⛔️ Prevent flicker: render nothing (or a skeleton) until authReady
  if (!authReady) {
    return <main style={{ padding: "2rem" }}>Loading…</main>;
  }

  if (!user) {
    return (
      <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Sign in with a magic link</h1>
        <form onSubmit={sendMagicLink} style={{ display: "flex", gap: 8 }}>
          <input type="email" required value={emailInput}
            onChange={(e)=>setEmailInput(e.target.value)} placeholder="you@example.com"
            style={{ padding: "0.5rem", flex: 1, border: "1px solid #ddd", borderRadius: 6 }} />
          <button type="submit" disabled={sending}
            style={{ padding: "0.5rem 0.9rem", borderRadius: 6, background: "#000", color: "#fff" }}>
            {sending ? "Sending…" : "Send link"}
          </button>
        </form>
        {error && <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>}
        <div style={{ marginTop: 16, color: "#666" }}>
          <small>No password needed. We’ll email you a one-time link.</small>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Your account</h1>
          <div style={{ color: "#666" }}>Signed in as {user.email}</div>
        </div>
        <button onClick={signOut} style={{ padding: "0.4rem 0.8rem", borderRadius: 6, border: "1px solid #ddd" }}>
          Sign out
        </button>
      </header>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Your orders (last 90 days)</h2>
        {claiming && <div style={{ color: "#666", marginBottom: 8 }}>(Claiming your past orders…)</div>}
        {loadingOrders ? <p>Loading…</p> :
          orders.length === 0 ? <p style={{ color: "#666" }}>No orders yet.</p> :
          <ul style={{ display: "grid", gap: 12 }}>
            {orders.map(o => (
              <li key={o.checkout_session_id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Order #{o.checkout_session_id.slice(-8).toUpperCase()}</div>
                    <div style={{ color: "#666", fontSize: 13 }}>{new Date(o.first_created_at).toLocaleString()}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatMoney(o.total_cents)}</div>
                </div>
                <div style={{ marginTop: 8, color: "#444" }}>
                  {o.lines.map((l,i)=>(<span key={i}>{l.name} × {l.qty}{i<o.lines.length-1?", ":""}</span>))}
                </div>
              </li>
            ))}
          </ul>}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Recommended for you</h2>
        <div style={{ color: "#666" }}>Bestsellers and “Frequently bought with …” go here.</div>
      </section>
    </main>
  );
}
