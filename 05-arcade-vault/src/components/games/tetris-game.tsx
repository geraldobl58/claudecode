"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface TetrisGameHandle {
  pause: () => void;
  resume: () => void;
  end: () => void;
  restart: () => void;
}

export interface TetrisHudState {
  score: number;
  lines: number;
  level: number;
  nextType: PieceType;
}

interface TetrisGameProps {
  onStateChange: (state: TetrisHudState) => void;
  onGameOver: (finalScore: number) => void;
}

const COLS = 10;
const ROWS = 20;

// Same 9 piece shapes as started-games/tetris/game.js. Square matrices
// (2x2/3x3/4x4), not the classic 4x4-only SRS convention — rotateMatrix
// pivots each piece around its own matrix center.
const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  PLUS: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
  ],
  U: [
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ]
};

export type PieceType = keyof typeof SHAPES;

export const COLORS: Record<PieceType, string> = {
  I: "#00f0f0",
  O: "#f0f000",
  T: "#a000f0",
  S: "#00f000",
  Z: "#f00000",
  J: "#0000f0",
  L: "#f0a000",
  PLUS: "#ff00ff",
  U: "#00a0ff"
};

export { SHAPES };

const PIECE_TYPES = Object.keys(SHAPES) as PieceType[];

// Points per simultaneous lines cleared (index = line count), × level.
const LINE_SCORES = [0, 40, 100, 300, 1200];
const LINES_PER_LEVEL = 10;

type Cell = string | null;
type Board = Cell[][];

interface Piece {
  type: PieceType;
  matrix: number[][];
  x: number;
  y: number;
}

interface GameState {
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
}

const CONTROL_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space"
]);

function rotateMatrix(matrix: number[][]): number[][] {
  const size = matrix.length;
  const rotated: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0)
  );
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      rotated[col][size - 1 - row] = matrix[row][col];
    }
  }
  return rotated;
}

function randomType(): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

function spawnPiece(type: PieceType): Piece {
  const matrix = SHAPES[type].map((row) => [...row]);
  return {
    type,
    matrix,
    x: Math.floor((COLS - matrix[0].length) / 2),
    y: 0
  };
}

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

function collides(
  matrix: number[][],
  x: number,
  y: number,
  board: Board
): boolean {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (!matrix[row][col]) continue;
      const boardX = x + col;
      const boardY = y + row;
      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
      if (boardY < 0) continue;
      if (board[boardY][boardX]) return true;
    }
  }
  return false;
}

function mergePiece(piece: Piece, board: Board) {
  piece.matrix.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value) {
        const boardY = piece.y + r;
        const boardX = piece.x + c;
        if (boardY >= 0) board[boardY][boardX] = COLORS[piece.type];
      }
    });
  });
}

// Detects full rows, removes them from the board, and returns how many
// were cleared (particle/explosion animation is out of scope — SPEC 06).
function clearLines(board: Board): number {
  const fullRows: number[] = [];
  for (let row = 0; row < ROWS; row++) {
    if (board[row].every((cell) => cell)) fullRows.push(row);
  }
  for (let i = fullRows.length - 1; i >= 0; i--) {
    board.splice(fullRows[i], 1);
    board.unshift(Array<Cell>(COLS).fill(null));
  }
  return fullRows.length;
}

function dropInterval(level: number): number {
  return Math.max(1000 - (level - 1) * 75, 100);
}

function getGhostY(piece: Piece, board: Board): number {
  let ghostY = piece.y;
  while (!collides(piece.matrix, piece.x, ghostY + 1, board)) {
    ghostY++;
  }
  return ghostY;
}

export const TetrisGame = forwardRef<TetrisGameHandle, TetrisGameProps>(
  function TetrisGame({ onStateChange, onGameOver }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cellRef = useRef(24);

    const pausedRef = useRef(false);

    const boardRef = useRef<Board | null>(null);
    const currentPieceRef = useRef<Piece | null>(null);
    const nextTypeRef = useRef<PieceType>("I");
    const stateRef = useRef<GameState | null>(null);
    const dropTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const lastReportedRef = useRef<TetrisHudState | null>(null);
    const gameOverReportedRef = useRef(false);

    function advancePiece(): Piece {
      const piece = spawnPiece(nextTypeRef.current);
      nextTypeRef.current = randomType();
      return piece;
    }

    function stopDropTimer() {
      if (dropTimerRef.current) clearInterval(dropTimerRef.current);
      dropTimerRef.current = null;
    }

    function restartDropTimer() {
      stopDropTimer();
      dropTimerRef.current = setInterval(
        tick,
        dropInterval(stateRef.current!.level)
      );
    }

    function resetGame() {
      boardRef.current = createBoard();
      nextTypeRef.current = randomType();
      currentPieceRef.current = advancePiece();
      stateRef.current = { score: 0, lines: 0, level: 1, gameOver: false };
      pausedRef.current = false;
      lastReportedRef.current = null;
      gameOverReportedRef.current = false;
      restartDropTimer();
    }

    function tryMove(dx: number, dy: number): boolean {
      const piece = currentPieceRef.current!;
      const board = boardRef.current!;
      const newX = piece.x + dx;
      const newY = piece.y + dy;
      if (collides(piece.matrix, newX, newY, board)) return false;
      piece.x = newX;
      piece.y = newY;
      return true;
    }

    function tryRotate() {
      const piece = currentPieceRef.current!;
      const board = boardRef.current!;
      const rotated = rotateMatrix(piece.matrix);
      if (!collides(rotated, piece.x, piece.y, board)) {
        piece.matrix = rotated;
      }
    }

    function lockPiece() {
      const state = stateRef.current!;
      const board = boardRef.current!;
      mergePiece(currentPieceRef.current!, board);
      const cleared = clearLines(board);
      if (cleared > 0) {
        state.score += LINE_SCORES[cleared] * state.level;
        state.lines += cleared;
        state.level = 1 + Math.floor(state.lines / LINES_PER_LEVEL);
        restartDropTimer();
      }
      currentPieceRef.current = advancePiece();
      if (
        collides(
          currentPieceRef.current.matrix,
          currentPieceRef.current.x,
          currentPieceRef.current.y,
          board
        )
      ) {
        state.gameOver = true;
        stopDropTimer();
      }
    }

    function softDrop() {
      const state = stateRef.current!;
      if (state.gameOver) return;
      if (tryMove(0, 1)) {
        state.score += 1;
      } else {
        lockPiece();
      }
    }

    function hardDrop() {
      const state = stateRef.current!;
      if (state.gameOver) return;
      let dropped = 0;
      while (tryMove(0, 1)) dropped++;
      state.score += dropped * 2;
      lockPiece();
    }

    function tick() {
      const state = stateRef.current;
      if (!state || state.gameOver || pausedRef.current) return;
      softDrop();
    }

    function drawCell(
      ctx: CanvasRenderingContext2D,
      gx: number,
      gy: number,
      color: string,
      cell: number
    ) {
      const px = gx * cell;
      const py = gy * cell;
      ctx.fillStyle = color;
      ctx.fillRect(px, py, cell, cell);
      ctx.strokeStyle = "#000";
      ctx.strokeRect(px, py, cell, cell);
    }

    function drawGrid(ctx: CanvasRenderingContext2D, cell: number) {
      ctx.strokeStyle = "#222";
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

    function drawBoard(
      ctx: CanvasRenderingContext2D,
      board: Board,
      cell: number
    ) {
      board.forEach((row, r) => {
        row.forEach((color, c) => {
          if (color) drawCell(ctx, c, r, color, cell);
        });
      });
    }

    function drawPiece(
      ctx: CanvasRenderingContext2D,
      piece: Piece,
      cell: number
    ) {
      const color = COLORS[piece.type];
      piece.matrix.forEach((row, r) => {
        row.forEach((value, c) => {
          if (value) drawCell(ctx, piece.x + c, piece.y + r, color, cell);
        });
      });
    }

    function drawGhost(
      ctx: CanvasRenderingContext2D,
      piece: Piece,
      board: Board,
      cell: number
    ) {
      const ghostY = getGhostY(piece, board);
      if (ghostY === piece.y) return;
      const color = COLORS[piece.type];
      piece.matrix.forEach((row, r) => {
        row.forEach((value, c) => {
          if (!value) return;
          const px = (piece.x + c) * cell;
          const py = (ghostY + r) * cell;
          ctx.save();
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.2;
          ctx.fillRect(px, py, cell, cell);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = color;
          ctx.strokeRect(px + 1, py + 1, cell - 2, cell - 2);
          ctx.restore();
        });
      });
    }

    function draw(ctx: CanvasRenderingContext2D) {
      const cell = cellRef.current;
      const board = boardRef.current!;
      const state = stateRef.current!;
      ctx.clearRect(0, 0, COLS * cell, ROWS * cell);
      drawGrid(ctx, cell);
      drawBoard(ctx, board, cell);
      if (!state.gameOver) {
        const piece = currentPieceRef.current!;
        drawGhost(ctx, piece, board, cell);
        drawPiece(ctx, piece, cell);
      }
    }

    useImperativeHandle(ref, () => ({
      pause: () => {
        pausedRef.current = true;
      },
      resume: () => {
        pausedRef.current = false;
      },
      end: () => {
        const state = stateRef.current;
        if (state && !state.gameOver) {
          state.gameOver = true;
          stopDropTimer();
        }
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

      function onKeyDown(e: KeyboardEvent) {
        if (CONTROL_KEYS.has(e.code)) e.preventDefault();
        const state = stateRef.current;
        if (!state || state.gameOver || pausedRef.current) return;

        switch (e.code) {
          case "ArrowLeft":
            tryMove(-1, 0);
            break;
          case "ArrowRight":
            tryMove(1, 0);
            break;
          case "ArrowDown":
            softDrop();
            break;
          case "ArrowUp":
            tryRotate();
            break;
          case "Space":
            hardDrop();
            break;
          default:
            return;
        }
      }
      window.addEventListener("keydown", onKeyDown);

      let raf = 0;

      function loop() {
        draw(ctx!);

        const state = stateRef.current!;
        const last = lastReportedRef.current;
        if (
          !last ||
          last.score !== state.score ||
          last.lines !== state.lines ||
          last.level !== state.level ||
          last.nextType !== nextTypeRef.current
        ) {
          const next = {
            score: state.score,
            lines: state.lines,
            level: state.level,
            nextType: nextTypeRef.current
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
        cancelAnimationFrame(raf);
        stopDropTimer();
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
