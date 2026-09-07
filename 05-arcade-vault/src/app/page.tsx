"use client";

import Link from "next/link";
import { useReveal } from "@/hooks/use-reveal";
import { FloatingSilhouettes } from "@/components/floating-silhouettes";
import { FeatureIcon, type FeatureIconKind } from "@/components/feature-icon";
import { MiniGameCard } from "@/components/mini-game-card";
import { GAMES, seededScores } from "@/data/games";

const FEATURES: Array<{ icon: FeatureIconKind; title: string; desc: string; color: "cyan" | "yellow" | "magenta" | "green" }> = [
  {
    icon: "GAMEPAD",
    title: "CLASSIC GAMES",
    desc: "Block Buster, Descent, Serpentine and many more. The best arcade games of all time in one place.",
    color: "cyan",
  },
  {
    icon: "FREE",
    title: "100% FREE",
    desc: "No subscriptions, no hidden fees. Every game is available for free, forever.",
    color: "yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    desc: "Compete with players from all over the world. Climb the ranking and prove who's the best.",
    color: "magenta",
  },
  {
    icon: "ROCKET",
    title: "ALWAYS GROWING",
    desc: "We add new games constantly. Come back often — there's always something new to play.",
    color: "green",
  },
];

const HOW_TO_PLAY = [
  { title: "PICK A GAME", desc: "Browse the library and choose any classic that catches your eye." },
  { title: "SIGN IN OR PLAY AS GUEST", desc: "Create an account to save your scores, or jump straight into a guest run." },
  { title: "USE KEYBOARD OR TOUCH", desc: "Every game responds to arrow keys, WASD, or touch controls on mobile." },
  { title: "CLIMB THE HALL OF FAME", desc: "Beat your best score and watch your name rise on the global leaderboard." },
];

const TICKER_COLORS = ["cyan", "magenta", "yellow", "green"] as const;

export default function Home() {
  useReveal();

  const recentScores = seededScores(4271, 7).map((row, i) => ({
    ...row,
    game: GAMES[i % GAMES.length],
    color: TICKER_COLORS[i % TICKER_COLORS.length],
  }));

  const topPlayersToday = seededScores(8842, 5);

  return (
    <div className="home fade-in">
      {/* HERO */}
      <section className="home-hero">
        <FloatingSilhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERT COIN<span className="blink">_</span>
          </div>
          <h1 className="home-title">
            <span className="line-1">THE CLASSIC</span>
            <span className="line-2">ARCADE IS</span>
            <span className="line-3">BACK</span>
          </h1>
          <p className="home-sub">
            Play the best classics straight from your browser.
            <br />
            No downloads. No cost. Just fun.
          </p>
          <div className="home-ctas">
            <Link href="/games" className="btn xl pulse">
              ▶ EXPLORE GAMES
            </Link>
            <Link href="/sign-in" className="btn xl magenta">
              ✦ CREATE ACCOUNT
            </Link>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            <span>SCROLL</span>
            <span className="arrow">▼</span>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-magenta">// 01</div>
          <h2 className="section-title">WHY ARCADE VAULT?</h2>
          <div className="section-rule" />
        </div>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`feature-card ${f.color}`} style={{ transitionDelay: `${i * 80}ms` }}>
              <FeatureIcon kind={f.icon} />
              <div className="ft-title pixel">{f.title}</div>
              <div className="ft-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW TO PLAY */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-cyan">// 02</div>
          <h2 className="section-title">HOW TO PLAY</h2>
          <div className="section-rule" />
        </div>
        <div className="feature-grid">
          {HOW_TO_PLAY.map((step, i) => (
            <div key={step.title} className="feature-card cyan" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="pixel" style={{ fontSize: 28, textShadow: "0 0 8px currentColor" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="ft-title pixel">{step.title}</div>
              <div className="ft-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GAMES PREVIEW */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-yellow">// 03</div>
          <h2 className="section-title">GAMES AVAILABLE NOW</h2>
          <div className="section-rule" />
        </div>
        <div className="mini-rail">
          {GAMES.slice(0, 6).map((g) => (
            <MiniGameCard key={g.id} game={g} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/games" className="btn lg">
            VIEW ALL GAMES →
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="home-stats reveal">
        <div className="stats-inner">
          {[
            { n: String(GAMES.length), u: "GAMES", s: "AND COUNTING" },
            { n: "THOUSANDS", u: "OF MATCHES", s: "PLAYED EVERY DAY" },
            { n: "GLOBAL", u: "RANKING", s: "COMPETE WITH THE WORLD" },
          ].map((st, i) => (
            <div key={st.u} className="stat-block" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="stat-n neon-yellow">{st.n}</div>
              <div className="stat-u pixel">{st.u}</div>
              <div className="stat-s">{st.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE ACTIVITY */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-magenta">// 04</div>
          <h2 className="section-title">LIVE ACTIVITY</h2>
          <div className="section-rule" />
        </div>
        <div className="activity-grid">
          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel">▸ RECENT SCORES</div>
            </div>
            <div className="ticker">
              {recentScores.map((r, i) => (
                <div key={r.name + i} className="tick-row" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className={`tk-p neon-${r.color}`}>{r.name}</span>
                  <span className="tk-mid">▸ {r.game.title}</span>
                  <span className="tk-s">+{r.score.toLocaleString("en-US")}</span>
                  <span className="tk-t">{r.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel neon-magenta">▸ TOP PLAYERS · TODAY</div>
              <Link href="/hall-of-fame" className="lb-link">
                VIEW HALL OF FAME →
              </Link>
            </div>
            <div className="top-list">
              {topPlayersToday.map((r, i) => (
                <div key={r.name} className={`top-row${i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : ""}`}>
                  <span className="tp-rk">#{String(r.rank).padStart(2, "0")}</span>
                  <span className="tp-p">{r.name}</span>
                  <span className="tp-s">{r.score.toLocaleString("en-US")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-green">// 05</div>
          <h2 className="section-title">PRICING</h2>
          <div className="section-rule" />
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="pc-label pixel">SINGLE PLAN</div>
            <div className="pc-name pixel">VAULT PLAYER</div>
            <div className="pc-amount">
              <span className="pc-amount-n">$0</span>
              <span className="pc-amount-u">/ FOREVER</span>
            </div>
            <div className="pc-tag">NO TRICKS · NO FINE PRINT</div>
            <ul className="pc-list">
              <li>✔ Access to every game</li>
              <li>✔ Global ranking and Hall of Fame</li>
              <li>✔ No ads between matches</li>
              <li>✔ Your scores are saved</li>
              <li>✔ New games every month</li>
              <li>✔ Works in any browser</li>
            </ul>
            <Link href="/sign-in" className="btn xl pulse" style={{ width: "100%" }}>
              START FREE →
            </Link>
            <div className="pc-foot">We don&apos;t ask for a card. We never will.</div>
            <div className="pc-stamp pixel">
              FREE
              <br />
              PLAY
            </div>
          </div>

          <div className="pricing-faq">
            <div className="faq-item">
              <div className="faq-q pixel">IS IT REALLY FREE?</div>
              <div className="faq-a">
                Yes. Arcade Vault is a non-profit project made out of love for the classics. There is no hidden
                &quot;premium&quot; tier.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-q pixel">DO I NEED AN ACCOUNT?</div>
              <div className="faq-a">
                No. You can play as a guest. If you want to save your score and appear on the ranking, sign up in 10
                seconds.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-q pixel">HOW DO YOU SURVIVE WITHOUT CHARGING?</div>
              <div className="faq-a">It&apos;s a community project. If you like it, share it. That&apos;s the only coin we accept.</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="home-final reveal">
        <h2 className="final-title pixel">READY TO PLAY?</h2>
        <Link href="/games" className="btn xl pulse final-cta">
          INSERT COIN →
        </Link>
        <div className="final-tag">Free. No mandatory sign-up. Start in seconds.</div>
      </section>
    </div>
  );
}
