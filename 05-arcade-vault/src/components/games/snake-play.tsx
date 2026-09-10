"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { GameOverModal } from "@/components/game-over-modal";
import {
  SnakeGame,
  type SnakeGameHandle,
  type SnakeHudState
} from "@/components/games/snake-game";

const INITIAL_HUD: SnakeHudState = { score: 0, length: 4 };

export function SnakePlay({ gameId }: { gameId: string }) {
  const { user } = useAuth();
  const gameRef = useRef<SnakeGameHandle>(null);

  const [hud, setHud] = useState<SnakeHudState>(INITIAL_HUD);
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
          <div className="hud-stat">
            <div className="l">Length</div>
            <div className="v">{hud.length}</div>
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
          <SnakeGame
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
          <span>SNAKE · CRT-83 · 60 HZ</span>
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
