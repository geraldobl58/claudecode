"use client";

import { useState, type FormEvent } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { HighlightIcon, type HighlightIconKind } from "@/components/highlight-icon";

const HIGHLIGHTS: Array<{ icon: HighlightIconKind; text: string; color: "magenta" | "cyan" | "green" }> = [
  { icon: "HEART", text: "MADE WITH ❤️ FOR PLAYERS", color: "magenta" },
  { icon: "BROWSER", text: "GAMES BUILT IN HTML — RUN IN ANY BROWSER", color: "cyan" },
  { icon: "PLANT", text: "A PROJECT THAT NEVER STOPS GROWING", color: "green" },
];

export default function AboutPage() {
  useReveal();

  const [form, setForm] = useState({ name: "", email: "", msg: "" });
  const [sent, setSent] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setSent(form.name.trim());
  };

  return (
    <div className="about fade-in">
      {/* ABOUT */}
      <section className="about-hero">
        <div className="kicker pixel neon-yellow">▸ ABOUT</div>
        <h1 className="about-title">ABOUT ARCADE VAULT</h1>
        <p className="about-mission">
          ARCADE VAULT was born out of love for classic video games. Our mission is to preserve and celebrate the
          arcade games that defined a generation, making them accessible to everyone, everywhere, and free of
          charge.
        </p>

        <div className="highlight-row">
          {HIGHLIGHTS.map((h, i) => (
            <div key={h.text} className={`highlight ${h.color}`} style={{ transitionDelay: `${i * 80}ms` }}>
              <HighlightIcon kind={h.icon} />
              <div className="hl-text pixel">{h.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* divider banner */}
      <div className="about-divider reveal" aria-hidden="true">
        <div className="div-bar" />
        <div className="div-pixels">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="div-bar" />
      </div>

      {/* CONTACT */}
      <section className="about-contact reveal">
        <div className="contact-grid">
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan">▸ CONTACT</div>
            <h2 className="contact-title">GET IN TOUCH</h2>
            <p className="contact-sub">
              Got a suggestion, want to propose a game, or just want to say hi? Write to us.
            </p>
            <div className="contact-tips">
              <div className="tip">
                <span className="tip-led" />
                REPLY WITHIN 24-48H
              </div>
              <div className="tip">
                <span className="tip-led y" />
                SUGGESTIONS WELCOME
              </div>
              <div className="tip">
                <span className="tip-led m" />
                NEVER ANY SPAM
              </div>
            </div>
          </div>

          <form className={`contact-form${shake ? " shake" : ""}`} onSubmit={onSubmit}>
            {!sent ? (
              <>
                <div className="field">
                  <label>NAME</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="px_kai"
                  />
                </div>
                <div className="field">
                  <label>EMAIL</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="player@vault.gg"
                  />
                </div>
                <div className="field">
                  <label>MESSAGE</label>
                  <textarea
                    rows={5}
                    value={form.msg}
                    onChange={(e) => setForm({ ...form, msg: e.target.value })}
                    placeholder="Tell us what's on your mind…"
                  />
                </div>
                <button className="btn xl press" type="submit" style={{ width: "100%" }}>
                  ▶ SEND MESSAGE
                </button>
              </>
            ) : (
              <div className="terminal-success">
                <div className="term-bar">
                  <span className="dot r" />
                  <span className="dot y" />
                  <span className="dot g" />
                  <span className="term-title">VAULT-OS // TERMINAL</span>
                </div>
                <div className="term-body">
                  <div className="line">
                    <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
                  </div>
                  <div className="line dim">[OK] Connecting to server…</div>
                  <div className="line dim">[OK] Validating content…</div>
                  <div className="line dim">[OK] Transmitting packet…</div>
                  <div className="line success">
                    &gt; MESSAGE RECEIVED. WE&apos;LL GET BACK TO YOU SOON. THANKS, {sent.toUpperCase()}.
                    <span className="caret">_</span>
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => {
                        setSent(null);
                        setForm({ name: "", email: "", msg: "" });
                      }}
                    >
                      SEND ANOTHER MESSAGE
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
