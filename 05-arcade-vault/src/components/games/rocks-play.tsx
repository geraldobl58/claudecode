"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { GameOverModal } from "@/components/game-over-modal";
import {
  AsteroidsGame,
  type AsteroidsGameHandle,
  type AsteroidsHudState
} from "@/components/games/asteroids-game";

const INITIAL_HUD: AsteroidsHudState = { score: 0, lives: 3, wave: 1 };

export function RocksPlay({ gameId }: { gameId: string }) {
  const { user } = useAuth();
  const gameRef = useRef<AsteroidsGameHandle>(null);

  const [hud, setHud] = useState<AsteroidsHudState>(INITIAL_HUD);
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
    setHud(INITIAL_HUD);
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
          <div className="hud-stat level">
            <div className="l">Level</div>
            <div className="v">{String(hud.wave).padStart(2, "0")}</div>
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
          <AsteroidsGame
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
          <span>ROCKS · CRT-83 · 60 HZ</span>
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
