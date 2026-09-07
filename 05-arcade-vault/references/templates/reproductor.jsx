// ===== reproductor.jsx =====
const { useState: useStateP, useEffect: useEffectP } = React;

function GamePlayer({ id, user, navigate, onSaveScore }) {
  const game = GAMES.find(g => g.id === id);
  const [score, setScore] = useStateP(0);
  const [lives, setLives] = useStateP(3);
  const [level, setLevel] = useStateP(1);
  const [paused, setPaused] = useStateP(false);
  const [over, setOver] = useStateP(false);
  const [name, setName] = useStateP(user ? user.name : "GUEST");
  const [saved, setSaved] = useStateP(false);

  useEffectP(() => {
    if (over || paused) return;
    const t = setInterval(() => setScore(s => s + Math.floor(10 + Math.random() * 90)), 220);
    return () => clearInterval(t);
  }, [over, paused]);

  useEffectP(() => {
    if (score > 0 && score % 2500 < 100) setLevel(l => l + 1);
  }, [score]);

  const endGame = () => setOver(true);
  const restart = () => { setScore(0); setLives(3); setLevel(1); setPaused(false); setOver(false); setSaved(false); };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat"><div className="l">Player</div><div className="v" style={{ color: "var(--ink)" }}>{name}</div></div>
          <div className="hud-stat"><div className="l">Score</div><div className="v">{score.toLocaleString("en-US")}</div></div>
          <div className="hud-stat lives"><div className="l">Lives</div><div className="v">{"♥ ".repeat(lives).trim() || "—"}</div></div>
          <div className="hud-stat level"><div className="l">Level</div><div className="v">{String(level).padStart(2, "0")}</div></div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused(p => !p)}>{paused ? "RESUME" : "PAUSE"}</button>
          <button className="btn magenta" onClick={endGame}>END</button>
          <button className="btn ghost" onClick={() => navigate({ name: "detail", id: game.id })}>EXIT</button>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
            <div className="player-ship"></div>
          </div>
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>PAUSED</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, letterSpacing: "0.16em" }}>PRESS RESUME TO CONTINUE</div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SIGNAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>LOAD · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd" onClick={() => {}}>
          <div className="modal">
            <h2>GAME OVER</h2>
            <div className="final-label">FINAL SCORE</div>
            <div className="final">{score.toLocaleString("en-US")}</div>
            {!saved ? (
              <React.Fragment>
                <div className="input-row">
                  <input value={name} onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))} placeholder="YOUR INITIALS" />
                  <button className="btn yellow" onClick={() => { onSaveScore && onSaveScore({ game: game.id, score, name }); setSaved(true); }}>SAVE SCORE</button>
                </div>
              </React.Fragment>
            ) : (
              <div className="toast-saved">▸ SCORE SAVED_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>PLAY AGAIN</button>
              <button className="btn magenta" onClick={() => navigate({ name: "library" })}>BACK TO VAULT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.GamePlayer = GamePlayer;
