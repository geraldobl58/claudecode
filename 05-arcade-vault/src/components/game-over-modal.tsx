"use client";

import { useState } from "react";
import Link from "next/link";

const DEMO_FINAL_SCORE = 15780;

export function GameOverModal({ gameId }: { gameId: string }) {
  const [name, setName] = useState("GUEST");
  const [saved, setSaved] = useState(false);

  return (
    <div className="modal-bd">
      <div className="modal">
        <h2>GAME OVER</h2>
        <div className="final-label">FINAL SCORE</div>
        <div className="final">{DEMO_FINAL_SCORE.toLocaleString("en-US")}</div>
        {!saved ? (
          <div className="input-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="YOUR INITIALS"
            />
            <button className="btn yellow" onClick={() => setSaved(true)}>
              SAVE SCORE
            </button>
          </div>
        ) : (
          <div className="toast-saved">▸ SCORE SAVED_</div>
        )}
        <div className="actions">
          <Link href={`/games/${gameId}/play`} className="btn">
            PLAY AGAIN
          </Link>
          <Link href="/" className="btn magenta">
            BACK TO VAULT
          </Link>
        </div>
      </div>
    </div>
  );
}
