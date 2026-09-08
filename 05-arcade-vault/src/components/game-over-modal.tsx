"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { submitScore } from "@/lib/scores";

interface GameOverModalProps {
  gameId: string;
  finalScore: number;
  onPlayAgain?: () => void;
}

export function GameOverModal({
  gameId,
  finalScore,
  onPlayAgain
}: GameOverModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "GUEST");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  async function handleSave() {
    setStatus("saving");
    try {
      await submitScore(gameId, name || "GUEST", finalScore);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="modal-bd">
      <div className="modal">
        <h2>GAME OVER</h2>
        <div className="final-label">FINAL SCORE</div>
        <div className="final">{finalScore.toLocaleString("en-US")}</div>
        {status !== "saved" ? (
          <div className="input-row">
            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value.toUpperCase().slice(0, 10))
              }
              placeholder="YOUR INITIALS"
              disabled={status === "saving"}
            />
            <button
              className="btn yellow"
              onClick={handleSave}
              disabled={status === "saving"}
            >
              {status === "saving" ? "SAVING..." : "SAVE SCORE"}
            </button>
          </div>
        ) : (
          <div className="toast-saved">▸ SCORE SAVED_</div>
        )}
        {status === "error" && (
          <div className="toast-saved" style={{ color: "var(--magenta)" }}>
            ▸ COULD NOT SAVE SCORE, TRY AGAIN_
          </div>
        )}
        <div className="actions">
          {onPlayAgain ? (
            <button className="btn" onClick={onPlayAgain}>
              PLAY AGAIN
            </button>
          ) : (
            <Link href={`/games/${gameId}/play`} className="btn">
              PLAY AGAIN
            </Link>
          )}
          <Link href="/games" className="btn magenta">
            BACK TO VAULT
          </Link>
        </div>
      </div>
    </div>
  );
}
