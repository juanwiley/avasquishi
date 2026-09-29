// apps/avasquishi/src/app/account/page.js
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function ninetyDaysAgoISO() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString();
}

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [emailInput, setEmailInput] = useState("");
  const [sending, setSending] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState("");

  // Resolve current session before rendering either state (prevents flicker)
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingUser(true);
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;

      if (error) {
        setUser(null);
      } else {
        const u = data?.user ?? null;
        setUser(u);
        if (u?.email) setEmailInput(u.email);
      }
      setLoadingUser(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u?.email) setEmailInput(u.email);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Fetch orders once authenticated
  useEffect(() => {
    if (!user?.email) return;
    let mounted = true;

    (async () => {
      setLoadingOrders(true);
      setError("");

      const since = ninetyDaysAgoISO();

      let query = supabase
        .schema("wileypay")
        .from("orders")
        .select(`
          id,
          checkout_session_id,
          created_at,
          total_cents,
          order_items (
            qty,
            inventory_items ( name )
          )
        `)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      if (user?.id) query = query.or(`user_id.eq.${user.id},email.eq.${user.email}`);
      else query = query.eq("email", user.email);

      const { data: rows, error: errRows } = await query;
      if (!mounted) return;

      if (errRows) {
        setError(errRows.message);
        setLoadingOrders(false);
        return;
      }

      const out = (rows || []).map((o) => ({
        checkout_session_id: o.checkout_session_id,
        created_at: o.created_at,
        total_cents: o.total_cents,
        lines: (o.order_items || [])
          .map((item) => ({
            name: item.inventory_items?.name,
            qty: item.qty,
          }))
          .filter((ln) => ln.name),
      }));

      setOrders(out);
      setLoadingOrders(false);
    })();

    return () => {
      mounted = false;
    };
  }, [user?.email, user?.id]);

  async function sendMagicLink(e) {
    e.preventDefault();
    setSending(true);
    setError("");
    const redirectTo = `${window.location.origin}/account`;
    const { error: err } = await supabase.auth.signInWithOtp({
      email: emailInput,
      options: { emailRedirectTo: redirectTo },
    });
    setSending(false);
    if (err) {
      setError(err.message);
    } else {
      alert("Magic link sent! Check your email.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setOrders([]);
  }

  // Prevent rendering either branch until session is resolved
  if (loadingUser) {
    return <main style={{ padding: "2rem" }}>Loading…</main>;
  }

  // Unauthenticated: magic-link entry
  if (!user) {
    return (
      <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
          Sign in with a magic link
        </h1>
        <form onSubmit={sendMagicLink} style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="you@example.com"
            style={{ padding: "0.5rem", flex: 1, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <button
            type="submit"
            disabled={sending}
            style={{ padding: "0.5rem 0.9rem", borderRadius: 6, background: "#000", color: "#fff" }}
          >
            {sending ? "Sending…" : "Send link"}
          </button>
        </form>
        {error && <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>}
        <div style={{ marginTop: 16, color: "#666" }}>
          <small>No password needed. We&apos;ll email you a one-time link.</small>
        </div>
      </main>
    );
  }

  // Authenticated: orders view
  return (
    <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Your account</h1>
          <div style={{ color: "#666" }}>Signed in as {user.email}</div>
        </div>
        <button
          onClick={signOut}
          style={{ padding: "0.4rem 0.8rem", borderRadius: 6, border: "1px solid #ddd" }}
        >
          Sign out
        </button>
      </header>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Your orders (last 90 days)
        </h2>

        {loadingOrders ? (
          <p>Loading…</p>
        ) : error ? (
          <p style={{ color: "crimson" }}>{error}</p>
        ) : orders.length === 0 ? (
          <p style={{ color: "#666" }}>No orders yet.</p>
        ) : (
          <ul style={{ display: "grid", gap: 12, padding: 0, listStyle: "none" }}>
            {orders.map((o) => (
              <li
                key={o.checkout_session_id}
                style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      Order #{String(o.checkout_session_id).slice(-8).toUpperCase()}
                    </div>
                    <div style={{ color: "#666", fontSize: 13 }}>
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatMoney(o.total_cents)}</div>
                </div>

                {o.lines.length > 0 && (
                  <div style={{ marginTop: 8, color: "#444" }}>
                    {o.lines.map((ln, idx) => (
                      <span key={idx}>
                        {ln.name} × {ln.qty}
                        {idx < o.lines.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
