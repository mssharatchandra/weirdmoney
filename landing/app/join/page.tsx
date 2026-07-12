"use client";

import { FormEvent, useState } from "react";

export default function Join() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const r = await fetch("/api/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "join" }),
      });
      const result = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(result.error || "could not join");
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "something went sideways");
    }
  }

  return (
    <main className="signup-wrap" id="join">
      <div className="section-head">
        <h1>join the weird money</h1>
        <p className="index-explainer">
          the internet&apos;s strangest bets, delivered. no advice. no betting. just the
          weirdest things people are putting real money on.
        </p>
      </div>

      {status === "success" ? (
        <div className="success">
          <p>you&apos;re in. the weird will find you.</p>
          <p className="form-note">want it faster? get every drop the second it lands:</p>
          <a className="mega-cta" href="/telegram">get it on telegram →</a>
        </div>
      ) : (
        <form className="signup-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "joining…" : "join →"}
          </button>
          {status === "error" && <p className="error">{message}</p>}
          <p className="form-note">or skip the inbox — <a href="/telegram">get it on telegram →</a></p>
        </form>
      )}
    </main>
  );
}
