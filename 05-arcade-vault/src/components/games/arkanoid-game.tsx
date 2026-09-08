"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  EXPLOSION_DURATION,
  EXPLOSION_FRAMES,
  drawFrame,
  drawSprite,
  loadSpritesheet,
  type BlockColor
} from "@/components/games/arkanoid-sprites";

export interface ArkanoidGameHandle {
  pause: () => void;
  resume: () => void;
  end: () => void;
  restart: () => void;
}

export type SoundLevel = "off" | "medium" | "high";

export interface ArkanoidHudState {
  score: number;
  lives: number;
  soundLevel: SoundLevel;
}

interface ArkanoidGameProps {
  onStateChange: (state: ArkanoidHudState) => void;
  onGameOver: (finalScore: number) => void;
}

// The prototype's canvas is 800x600 (4:3, the same ratio as .crt-screen), so all
// physics stays in these coordinates and only the context gets scaled.
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const BLOCK_ROWS = 7;
const BLOCK_COLS = 10;
const BLOCK_WIDTH = 32;
const BLOCK_HEIGHT = 16;
const BLOCK_GAP = 4;
const BLOCK_GRID_TOP = 60;

const BALL_PADDLE_GAP = 6;
const MAX_BOUNCE_ANGLE = (75 * Math.PI) / 180;
const MAX_LIVES = 3;

const ROW_COLORS: BlockColor[] = [
  "gray",
  "cyan",
  "green",
  "yellow",
  "magenta",
  "red",
  "hotpink"
];

const COLOR_POINTS: Record<BlockColor, number> = {
  gray: 10,
  cyan: 20,
  green: 30,
  yellow: 40,
  magenta: 50,
  red: 60,
  hotpink: 70
};

const CONTROL_KEYS = new Set(["ArrowLeft", "ArrowRight", "Space"]);

const SOUND_LEVELS: SoundLevel[] = ["off", "medium", "high"];
const SOUND_VOLUMES: Record<SoundLevel, number> = {
  off: 0,
  medium: 0.5,
  high: 1
};
const SOUND_LEVEL_KEY = "arkanoid-sound-level";

function loadSoundLevel(): SoundLevel {
  try {
    const stored = localStorage.getItem(SOUND_LEVEL_KEY) as SoundLevel | null;
    return stored && SOUND_LEVELS.includes(stored) ? stored : "high";
  } catch {
    return "high";
  }
}

function saveSoundLevel(value: SoundLevel) {
  try {
    localStorage.setItem(SOUND_LEVEL_KEY, value);
  } catch {
    // localStorage unavailable (private mode): the choice just won't persist.
  }
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: BlockColor;
  points: number;
  alive: boolean;
}

interface Explosion {
  x: number;
  y: number;
  width: number;
  height: number;
  color: BlockColor;
  startTime: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Ball {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  speed: number;
  attached: boolean;
}

interface GameState {
  score: number;
  lives: number;
  gameOver: boolean;
}

function createBlocks(): Block[] {
  const blocks: Block[] = [];
  const gridWidth = BLOCK_COLS * BLOCK_WIDTH + (BLOCK_COLS - 1) * BLOCK_GAP;
  const startX = (GAME_WIDTH - gridWidth) / 2;

  for (let row = 0; row < BLOCK_ROWS; row++) {
    const color = ROW_COLORS[row];
    for (let col = 0; col < BLOCK_COLS; col++) {
      blocks.push({
        x: startX + col * (BLOCK_WIDTH + BLOCK_GAP),
        y: BLOCK_GRID_TOP + row * (BLOCK_HEIGHT + BLOCK_GAP),
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color,
        points: COLOR_POINTS[color],
        alive: true
      });
    }
  }

  return blocks;
}

export const ArkanoidGame = forwardRef<ArkanoidGameHandle, ArkanoidGameProps>(
  function ArkanoidGame({ onStateChange, onGameOver }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sheetRef = useRef<HTMLImageElement | null>(null);
    const scaleRef = useRef(1);

    const keysRef = useRef({ left: false, right: false });
    const pausedRef = useRef(false);

    const paddleRef = useRef<Paddle>({
      x: 320,
      y: 560,
      width: 162,
      height: 14,
      speed: 8
    });
    const ballRef = useRef<Ball>({
      x: 401,
      y: 546,
      radius: 8,
      dx: 0,
      dy: 0,
      speed: 5,
      attached: true
    });
    const blocksRef = useRef<Block[]>([]);
    const explosionsRef = useRef<Explosion[]>([]);
    const stateRef = useRef<GameState>({
      score: 0,
      lives: MAX_LIVES,
      gameOver: false
    });
    const soundLevelRef = useRef<SoundLevel>("high");
    const bounceAudioRef = useRef<HTMLAudioElement | null>(null);
    const breakAudioRef = useRef<HTMLAudioElement | null>(null);

    const lastReportedRef = useRef<ArkanoidHudState | null>(null);
    const gameOverReportedRef = useRef(false);

    function playSound(audio: HTMLAudioElement | null) {
      if (!audio) return;
      audio.volume = SOUND_VOLUMES[soundLevelRef.current];
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }

    function resetBall() {
      const ball = ballRef.current;
      const paddle = paddleRef.current;
      ball.attached = true;
      ball.dx = 0;
      ball.dy = 0;
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius - BALL_PADDLE_GAP;
    }

    function launchBall() {
      const ball = ballRef.current;
      ball.attached = false;
      ball.dx = ball.speed * 0.6;
      ball.dy = -ball.speed * 0.8;
    }

    function resetGame() {
      stateRef.current = { score: 0, lives: MAX_LIVES, gameOver: false };
      blocksRef.current = createBlocks();
      explosionsRef.current = [];
      paddleRef.current.x = 320;
      keysRef.current = { left: false, right: false };
      pausedRef.current = false;
      lastReportedRef.current = null;
      gameOverReportedRef.current = false;
      resetBall();
    }

    function endGame() {
      stateRef.current.gameOver = true;
    }

    function checkWinCondition() {
      if (blocksRef.current.every((block) => !block.alive)) endGame();
    }

    function checkWallCollision() {
      const ball = ballRef.current;

      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.dx = Math.abs(ball.dx);
        playSound(bounceAudioRef.current);
      } else if (ball.x + ball.radius >= GAME_WIDTH) {
        ball.x = GAME_WIDTH - ball.radius;
        ball.dx = -Math.abs(ball.dx);
        playSound(bounceAudioRef.current);
      }

      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.dy = Math.abs(ball.dy);
        playSound(bounceAudioRef.current);
      }
    }

    function checkPaddleCollision() {
      const ball = ballRef.current;
      const paddle = paddleRef.current;

      if (ball.dy <= 0) return;

      const ballBottom = ball.y + ball.radius;
      const withinX =
        ball.x + ball.radius >= paddle.x &&
        ball.x - ball.radius <= paddle.x + paddle.width;
      const hitsPaddle =
        ballBottom >= paddle.y && ball.y < paddle.y + paddle.height && withinX;
      if (!hitsPaddle) return;

      const relativeX =
        (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      const clamped = Math.max(-1, Math.min(1, relativeX));
      const angle = clamped * MAX_BOUNCE_ANGLE;

      ball.dx = ball.speed * Math.sin(angle);
      ball.dy = -ball.speed * Math.cos(angle);
      ball.y = paddle.y - ball.radius;
      playSound(bounceAudioRef.current);
    }

    function checkBlockCollision() {
      const ball = ballRef.current;

      for (const block of blocksRef.current) {
        if (!block.alive) continue;

        const withinX =
          ball.x + ball.radius >= block.x &&
          ball.x - ball.radius <= block.x + block.width;
        const withinY =
          ball.y + ball.radius >= block.y &&
          ball.y - ball.radius <= block.y + block.height;
        if (!withinX || !withinY) continue;

        block.alive = false;
        stateRef.current.score += block.points;
        ball.dy = -ball.dy;
        explosionsRef.current.push({
          x: block.x,
          y: block.y,
          width: block.width,
          height: block.height,
          color: block.color,
          startTime: performance.now()
        });
        playSound(breakAudioRef.current);
        checkWinCondition();
        break;
      }
    }

    function checkBallLost() {
      const ball = ballRef.current;
      const state = stateRef.current;

      if (ball.y - ball.radius > GAME_HEIGHT) {
        state.lives -= 1;
        resetBall();
        if (state.lives <= 0) {
          state.lives = 0;
          endGame();
        }
      }
    }

    function updateExplosions() {
      const now = performance.now();
      explosionsRef.current = explosionsRef.current.filter(
        (explosion) => now - explosion.startTime < EXPLOSION_DURATION
      );
    }

    function update() {
      const state = stateRef.current;
      if (state.gameOver || pausedRef.current) return;

      updateExplosions();

      const paddle = paddleRef.current;
      const keys = keysRef.current;
      if (keys.left) paddle.x -= paddle.speed;
      if (keys.right) paddle.x += paddle.speed;
      paddle.x = Math.max(0, Math.min(GAME_WIDTH - paddle.width, paddle.x));

      const ball = ballRef.current;
      if (ball.attached) {
        ball.x = paddle.x + paddle.width / 2;
      } else {
        ball.x += ball.dx;
        ball.y += ball.dy;
        checkWallCollision();
        checkPaddleCollision();
        checkBlockCollision();
        checkBallLost();
      }
    }

    function draw(ctx: CanvasRenderingContext2D) {
      const sheet = sheetRef.current;
      if (!sheet) return;

      const scale = scaleRef.current;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      for (const block of blocksRef.current) {
        if (!block.alive) continue;
        drawSprite(
          ctx,
          sheet,
          `block_${block.color}`,
          block.x,
          block.y,
          block.width,
          block.height
        );
      }

      const now = performance.now();
      for (const explosion of explosionsRef.current) {
        const elapsed = now - explosion.startTime;
        const frameIndex = Math.min(
          3,
          Math.floor(elapsed / (EXPLOSION_DURATION / 4))
        );
        const frame = EXPLOSION_FRAMES[explosion.color][frameIndex];
        drawFrame(
          ctx,
          sheet,
          frame,
          explosion.x,
          explosion.y,
          explosion.width,
          explosion.height
        );
      }

      const paddle = paddleRef.current;
      drawSprite(
        ctx,
        sheet,
        "paddle",
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
      );

      const ball = ballRef.current;
      drawSprite(
        ctx,
        sheet,
        "ball",
        ball.x - ball.radius,
        ball.y - ball.radius,
        ball.radius * 2,
        ball.radius * 2
      );
    }

    useImperativeHandle(ref, () => ({
      pause: () => {
        pausedRef.current = true;
      },
      resume: () => {
        pausedRef.current = false;
      },
      end: () => {
        if (!stateRef.current.gameOver) endGame();
      },
      restart: () => {
        resetGame();
      }
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const container = canvas.parentElement;

      function applySize(containerWidth: number, containerHeight: number) {
        const scale = Math.min(
          containerWidth / GAME_WIDTH,
          containerHeight / GAME_HEIGHT
        );
        scaleRef.current = scale;
        canvas!.width = Math.round(GAME_WIDTH * scale);
        canvas!.height = Math.round(GAME_HEIGHT * scale);
      }

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        applySize(width, height);
      });
      if (container) {
        resizeObserver.observe(container);
        applySize(container.clientWidth, container.clientHeight);
      }

      resetGame();

      soundLevelRef.current = loadSoundLevel();
      bounceAudioRef.current = new Audio("/games/arkanoid/ball-bounce.mp3");
      breakAudioRef.current = new Audio("/games/arkanoid/break-sound.mp3");

      let cancelled = false;
      loadSpritesheet()
        .then((sheet) => {
          if (!cancelled) sheetRef.current = sheet;
        })
        .catch((error) => console.error(error));

      function onKeyDown(e: KeyboardEvent) {
        if (CONTROL_KEYS.has(e.code)) e.preventDefault();

        // Volume cycles even while paused or after game over, as in the prototype.
        if (e.code === "KeyM") {
          const current = SOUND_LEVELS.indexOf(soundLevelRef.current);
          const next =
            (current - 1 + SOUND_LEVELS.length) % SOUND_LEVELS.length;
          soundLevelRef.current = SOUND_LEVELS[next];
          saveSoundLevel(soundLevelRef.current);
          return;
        }

        const state = stateRef.current;
        if (state.gameOver || pausedRef.current) return;

        if (e.code === "ArrowLeft") keysRef.current.left = true;
        if (e.code === "ArrowRight") keysRef.current.right = true;
        if (e.code === "Space" && ballRef.current.attached) launchBall();
      }
      function onKeyUp(e: KeyboardEvent) {
        if (e.code === "ArrowLeft") keysRef.current.left = false;
        if (e.code === "ArrowRight") keysRef.current.right = false;
      }
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      let raf = 0;

      function loop() {
        update();
        draw(ctx!);

        const state = stateRef.current;
        const last = lastReportedRef.current;
        if (
          !last ||
          last.score !== state.score ||
          last.lives !== state.lives ||
          last.soundLevel !== soundLevelRef.current
        ) {
          const next = {
            score: state.score,
            lives: state.lives,
            soundLevel: soundLevelRef.current
          };
          lastReportedRef.current = next;
          onStateChange(next);
        }

        if (state.gameOver && !gameOverReportedRef.current) {
          gameOverReportedRef.current = true;
          onGameOver(state.score);
        }

        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);

      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        resizeObserver.disconnect();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)"
        }}
      />
    );
  }
);
