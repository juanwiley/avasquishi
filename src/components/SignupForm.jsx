"use client";
// "Squish Squad" email signup. Saves to /api/subscribe; nothing is sent yet.
import { useState } from "react";
import { CONSENT_TEXT } from "@/lib/signup";
import { track } from "@/lib/analytics";
import s from "./SignupForm.module.css";

export default function SignupForm({ source = "footer", title = "Join the Squish Squad", blurb = "Be the first to hear about new squishies and restocks." }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState({ state: "idle", msg: "" });

  async function onSubmit(e) {
    e.preventDefault();
    if (!consent) return setStatus({ state: "error", msg: "Please tick the box to agree." });
    setStatus({ state: "sending", msg: "" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, source, website }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong. Please try again.");
      setStatus({ state: "done", msg: "You're in! 🎉 Watch your inbox for new squishies." });
      track("newsletter_signup", { source });
    } catch (err) {
      setStatus({ state: "error", msg: err.message });
    }
  }

  if (status.state === "done") {
    return (
      <div className={`${s.box} ${s[source] || ""}`}>
        <p className={s.done} role="status">{status.msg}</p>
      </div>
    );
  }

  const id = `signup-${source}`;
  return (
    <form className={`${s.box} ${s[source] || ""}`} onSubmit={onSubmit} noValidate>
      <p className={s.title}>{title}</p>
      <p className={s.blurb}>{blurb}</p>
      <div className={s.row}>
        <label htmlFor={`${id}-email`} className={s.srOnly}>Email address</label>
        <input
          id={`${id}-email`}
          type="email"
          required
          autoComplete="email"
          placeholder="Grown-up's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={s.input}
        />
        <button type="submit" className={s.button} disabled={status.state === "sending"}>
          {status.state === "sending" ? "Joining…" : "Join"}
        </button>
      </div>
      <label className={s.consent}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{CONSENT_TEXT}</span>
      </label>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className={s.honeypot}
        aria-hidden="true"
      />
      {status.state === "error" && <p className={s.error} role="alert">{status.msg}</p>}
    </form>
  );
}
