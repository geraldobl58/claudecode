"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { GameOverModal } from "@/components/game-over-modal";
import {
  TetrisGame,
  SHAPES,
  COLORS,
  type TetrisGameHandle,
  type TetrisHudState,
  type PieceType
} from "@/components/games/tetris-game";

const INITIAL_HUD: TetrisHudState = {
  score: 0,
  lines: 0,
  level: 1,
  nextType: "I"
};

const PREVIEW_SIZE = 4;
const PREVIEW_CELL = 12;

function NextPiecePreview({ type }: { type: PieceType }) {
  const matrix = SHAPES[type];
  const offset = Math.floor((PREVIEW_SIZE - matrix.length) / 2);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${PREVIEW_SIZE}, ${PREVIEW_CELL}px)`,
        gridTemplateRows: `repeat(${PREVIEW_SIZE}, ${PREVIEW_CELL}px)`,
        gap: 1
      }}
    >
      {Array.from({ length: PREVIEW_SIZE * PREVIEW_SIZE }, (_, i) => {
        const row = Math.floor(i / PREVIEW_SIZE) - offset;
        const col = (i % PREVIEW_SIZE) - offset;
        const filled =
          row >= 0 &&
          row < matrix.length &&
          col >= 0 &&
          col < matrix[0].length &&
          matrix[row][col];
        return (
          <div
            key={i}
            style={{
              width: PREVIEW_CELL,
              height: PREVIEW_CELL,
              background: filled ? COLORS[type] : "transparent",
              border: filled ? "1px solid #000" : "none"
            }}
          />
        );
      })}
    </div>
  );
}

export function TetrisPlay({ gameId }: { gameId: string }) {
  const { user } = useAuth();
  const gameRef = useRef<TetrisGameHandle>(null);

  const [hud, setHud] = useState<TetrisHudState>(INITIAL_HUD);
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
            <div className="l">Lines</div>
            <div className="v">{hud.lines}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Level</div>
            <div className="v">{String(hud.level).padStart(2, "0")}</div>
          </div>
          <div className="hud-stat">
            <div className="l">Next</div>
            <div className="v">
              <NextPiecePreview type={hud.nextType} />
            </div>
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
          <TetrisGame
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
          <span>TETRIS · CRT-83 · 60 HZ</span>
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
