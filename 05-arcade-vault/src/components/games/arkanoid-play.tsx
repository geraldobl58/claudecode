"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { GameOverModal } from "@/components/game-over-modal";
import {
  ArkanoidGame,
  type ArkanoidGameHandle,
  type ArkanoidHudState,
  type SoundLevel
} from "@/components/games/arkanoid-game";

const INITIAL_HUD: ArkanoidHudState = {
  score: 0,
  lives: 3,
  soundLevel: "high"
};

const SOUND_LABELS: Record<SoundLevel, string> = {
  off: "OFF",
  medium: "MED",
  high: "HIGH"
};

export function ArkanoidPlay({ gameId }: { gameId: string }) {
  const { user } = useAuth();
  const gameRef = useRef<ArkanoidGameHandle>(null);

  const [hud, setHud] = useState<ArkanoidHudState>(INITIAL_HUD);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [playKey, setPlayKey] = useState(0);

  function handlePauseToggle() {
    if (paused) {
      gameRef.current?.resume();
      setPaused(false);
    } else {
      gameRef.current?.pause();
      setPaused(true);
    }
  }

  function handleEnd() {
    gameRef.current?.end();
  }

  function handlePlayAgain() {
    setHud((prev) => ({ ...INITIAL_HUD, soundLevel: prev.soundLevel }));
    setGameOver(false);
    setFinalScore(0);
    setPaused(false);
    setPlayKey((k) => k + 1);
  }

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Player</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {user?.name ?? "GUEST"}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Score</div>
            <div className="v">{hud.score}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Lives</div>
            <div className="v">
              {"♥ ".repeat(Math.max(hud.lives, 0)).trim() || "—"}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Sound (M)</div>
            <div className="v">{SOUND_LABELS[hud.soundLevel]}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button
            className="btn yellow"
            onClick={handlePauseToggle}
            disabled={gameOver}
          >
            {paused ? "RESUME" : "PAUSE"}
          </button>
          <button
            className="btn magenta"
            onClick={handleEnd}
            disabled={gameOver}
          >
            END
          </button>
          <Link href={`/games/${gameId}`} className="btn ghost">
            EXIT
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <ArkanoidGame
            key={playKey}
            ref={gameRef}
            onStateChange={setHud}
            onGameOver={(score) => {
              setFinalScore(score);
              setGameOver(true);
            }}
          />
        </div>
        <div className="crt-bottom">
          <span className="led">SIGNAL OK</span>
          <span>ARKANOID · CRT-83 · 60 HZ</span>
          <span>LOAD · 1MB</span>
        </div>
      </div>

      {gameOver && (
        <GameOverModal
          gameId={gameId}
          finalScore={finalScore}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
