import Link from "next/link";
import { notFound } from "next/navigation";
import { GAMES } from "@/data/games";
import { GameOverModal } from "@/components/game-over-modal";
import { RocksPlay } from "@/components/games/rocks-play";

const DEMO_FINAL_SCORE = 15780;

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export default async function GamePlayPage({
  params
}: PageProps<"/games/[id]/play">) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  if (game.id === "rocks") {
    return <RocksPlay gameId={game.id} />;
  }

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Player</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              GUEST
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Score</div>
            <div className="v">0</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Lives</div>
            <div className="v">♥ ♥ ♥</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Level</div>
            <div className="v">01</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow">PAUSE</button>
          <button className="btn magenta">END</button>
          <Link href={`/games/${game.id}`} className="btn ghost">
            EXIT
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor" />
            <div className="enemy e1" />
            <div className="enemy e2" />
            <div className="enemy e3" />
            <div className="player-ship" />
          </div>
        </div>
        <div className="crt-bottom">
          <span className="led">SIGNAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>LOAD · 1MB</span>
        </div>
      </div>

      <GameOverModal gameId={game.id} finalScore={DEMO_FINAL_SCORE} />
    </div>
  );
}
