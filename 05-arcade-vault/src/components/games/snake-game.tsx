"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  FRUIT_NAMES,
  drawFruit,
  loadFruitSheet,
  type FruitName
} from "@/components/games/snake-sprites";

export interface SnakeGameHandle {
  pause: () => void;
  resume: () => void;
  end: () => void;
  restart: () => void;
}

export interface SnakeHudState {
  score: number;
  length: number;
}

interface SnakeGameProps {
  onStateChange: (state: SnakeHudState) => void;
  onGameOver: (finalScore: number) => void;
}

const COLS = 32;
const ROWS = 24;
const INITIAL_LENGTH = 4;

const INITIAL_TICK_MS = 140;
const TICK_DECAY = 0.98;
const MIN_TICK_MS = 60;
const FRUIT_POINTS = 10;

const HEAD_COLOR = "#c4ffe6";
const BODY_COLOR = "#00ff88";
const BOARD_FILL = "#03130a";
const GRID_LINE = "#0d2e1c";

const CONTROL_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown"
]);

interface Direction {
  dx: number;
  dy: number;
}

const DIRECTIONS: Record<string, Direction> = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 }
};

interface Cell {
  x: number;
  y: number;
}

interface Fruit extends Cell {
  name: FruitName;
}

interface GameState {
  score: number;
  length: number;
  gameOver: boolean;
}

export const SnakeGame = forwardRef<SnakeGameHandle, SnakeGameProps>(
  function SnakeGame({ onStateChange, onGameOver }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sheetRef = useRef<HTMLImageElement | null>(null);
    const cellRef = useRef(20);

    const pausedRef = useRef(false);

    const snakeRef = useRef<Cell[]>([]);
    const directionRef = useRef<Direction>({ dx: 1, dy: 0 });
    const pendingDirectionRef = useRef<Direction>({ dx: 1, dy: 0 });
    const fruitRef = useRef<Fruit | null>(null);
    const tickRef = useRef(INITIAL_TICK_MS);
    const accumulatorRef = useRef(0);
    const stateRef = useRef<GameState>({
      score: 0,
      length: INITIAL_LENGTH,
      gameOver: false
    });

    const lastReportedRef = useRef<SnakeHudState | null>(null);
    const gameOverReportedRef = useRef(false);

    function spawnFruit() {
      const snake = snakeRef.current;
      const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
      const empty: Cell[] = [];
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
        }
      }
      if (empty.length === 0) {
        fruitRef.current = null;
        return;
      }
      const cell = empty[Math.floor(Math.random() * empty.length)];
      const name = FRUIT_NAMES[Math.floor(Math.random() * FRUIT_NAMES.length)];
      fruitRef.current = { ...cell, name };
    }

    function resetGame() {
      const startX = Math.floor(COLS / 2);
      const startY = Math.floor(ROWS / 2);
      const snake: Cell[] = [];
      for (let i = 0; i < INITIAL_LENGTH; i++) {
        snake.push({ x: startX - i, y: startY });
      }
      snakeRef.current = snake;
      directionRef.current = { dx: 1, dy: 0 };
      pendingDirectionRef.current = { dx: 1, dy: 0 };
      tickRef.current = INITIAL_TICK_MS;
      accumulatorRef.current = 0;
      stateRef.current = {
        score: 0,
        length: INITIAL_LENGTH,
        gameOver: false
      };
      pausedRef.current = false;
      lastReportedRef.current = null;
      gameOverReportedRef.current = false;
      spawnFruit();
    }

    function endGame() {
      stateRef.current.gameOver = true;
    }

    function step() {
      const state = stateRef.current;
      if (state.gameOver) return;

      directionRef.current = pendingDirectionRef.current;
      const dir = directionRef.current;
      const snake = snakeRef.current;
      const head = snake[0];
      const newHead: Cell = { x: head.x + dir.dx, y: head.y + dir.dy };

      if (
        newHead.x < 0 ||
        newHead.x >= COLS ||
        newHead.y < 0 ||
        newHead.y >= ROWS
      ) {
        endGame();
        return;
      }

      const fruit = fruitRef.current;
      const willGrow =
        !!fruit && newHead.x === fruit.x && newHead.y === fruit.y;

      // The tail vacates its cell this step unless the snake is growing, so
      // moving into the current tail cell is legal (classic Snake rule).
      const bodyToCheck = willGrow ? snake : snake.slice(0, -1);
      if (bodyToCheck.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        endGame();
        return;
      }

      snake.unshift(newHead);
      if (willGrow) {
        state.score += FRUIT_POINTS;
        state.length = snake.length;
        tickRef.current = Math.max(MIN_TICK_MS, tickRef.current * TICK_DECAY);
        spawnFruit();
      } else {
        snake.pop();
      }
    }

    function drawBoard(ctx: CanvasRenderingContext2D, cell: number) {
      ctx.fillStyle = BOARD_FILL;
      ctx.fillRect(0, 0, COLS * cell, ROWS * cell);

      ctx.strokeStyle = GRID_LINE;
      for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * cell, 0);
        ctx.lineTo(col * cell, ROWS * cell);
        ctx.stroke();
      }
      for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * cell);
        ctx.lineTo(COLS * cell, row * cell);
        ctx.stroke();
      }
    }

    function draw(ctx: CanvasRenderingContext2D) {
      const sheet = sheetRef.current;
      if (!sheet) return;

      const cell = cellRef.current;
      drawBoard(ctx, cell);

      const fruit = fruitRef.current;
      if (fruit) {
        drawFruit(
          ctx,
          sheet,
          fruit.name,
          fruit.x * cell,
          fruit.y * cell,
          cell,
          cell
        );
      }

      const snake = snakeRef.current;
      snake.forEach((segment, i) => {
        ctx.fillStyle = i === 0 ? HEAD_COLOR : BODY_COLOR;
        ctx.fillRect(
          segment.x * cell + 1,
          segment.y * cell + 1,
          cell - 2,
          cell - 2
        );
      });
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
        const cell = Math.max(
          1,
          Math.floor(Math.min(containerWidth / COLS, containerHeight / ROWS))
        );
        cellRef.current = cell;
        canvas!.width = cell * COLS;
        canvas!.height = cell * ROWS;
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

      let cancelled = false;
      loadFruitSheet()
        .then((sheet) => {
          if (!cancelled) sheetRef.current = sheet;
        })
        .catch((error) => console.error(error));

      function onKeyDown(e: KeyboardEvent) {
        if (CONTROL_KEYS.has(e.code)) e.preventDefault();
        const state = stateRef.current;
        if (state.gameOver || pausedRef.current) return;

        const dir = DIRECTIONS[e.code];
        if (!dir) return;

        const current = directionRef.current;
        const isReverse = dir.dx === -current.dx && dir.dy === -current.dy;
        if (isReverse) return;

        pendingDirectionRef.current = dir;
      }
      window.addEventListener("keydown", onKeyDown);

      let lastTime = performance.now();
      let raf = 0;

      function loop(now: number) {
        const dt = now - lastTime;
        lastTime = now;

        const state = stateRef.current;
        if (!pausedRef.current && !state.gameOver) {
          accumulatorRef.current += dt;
          while (accumulatorRef.current >= tickRef.current) {
            accumulatorRef.current -= tickRef.current;
            step();
            if (stateRef.current.gameOver) {
              accumulatorRef.current = 0;
              break;
            }
          }
        }

        draw(ctx!);

        const last = lastReportedRef.current;
        if (
          !last ||
          last.score !== state.score ||
          last.length !== state.length
        ) {
          const next = { score: state.score, length: state.length };
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
