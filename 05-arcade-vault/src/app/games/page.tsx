"use client";

import { useMemo, useState } from "react";
import { GameCard } from "@/components/game-card";
import { CATS, GAMES } from "@/data/games";

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATS)[number]>("ALL");

  const filtered = useMemo(() => {
    return GAMES.filter(
      (g) => (category === "ALL" || g.cat === category) && g.title.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, category]);

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERT COIN TO PLAY <span className="blink">_</span>
        </div>
      </section>

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a game by name…" />
        </div>
        <div className="av-chips">
          {CATS.map((c) => (
            <button key={c} className={`chip${category === c ? " active" : ""}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="av-grid">
        {filtered.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 80, color: "var(--ink-faint)" }}>
            <div className="pixel" style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}>
              NO RESULTS FOUND
            </div>
            <div>Try another search or category.</div>
          </div>
        )}
      </div>
    </div>
  );
}
