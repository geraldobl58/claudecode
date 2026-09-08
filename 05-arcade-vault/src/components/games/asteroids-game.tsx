"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface AsteroidsGameHandle {
  pause: () => void;
  resume: () => void;
  end: () => void;
  restart: () => void;
}

export interface AsteroidsHudState {
  score: number;
  lives: number;
  wave: number;
}

interface AsteroidsGameProps {
  onStateChange: (state: AsteroidsHudState) => void;
  onGameOver: (finalScore: number) => void;
}

const SHIP_SIZE = 18;
const SHIP_TURN_SPEED = Math.PI * 1.6;
const SHIP_THRUST = 260;
const FRICTION = 0.99;
const SHIP_INVULNERABLE_TIME = 3;

const BULLET_SPEED = 480;
const BULLET_LIFE = 1.1;
const BULLET_COOLDOWN = 0.25;
const BULLET_SPREAD_ANGLE = Math.PI / 18;

const ASTEROID_SIZES = { large: 55, medium: 32, small: 16 } as const;
const ASTEROID_SPEED = { large: 40, medium: 65, small: 100 } as const;
const ASTEROID_POINTS = { large: 20, medium: 50, small: 100 } as const;

type AsteroidSize = keyof typeof ASTEROID_SIZES;

interface Ship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  thrusting: boolean;
  invulnerable: number;
  shootCooldown: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: AsteroidSize;
  radius: number;
  angle: number;
  spin: number;
  offsets: number[];
}

interface GameState {
  score: number;
  lives: number;
  wave: number;
  gameOver: boolean;
}

const CONTROL_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "Space"]);

function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x1 - x2, y1 - y2);
}

export const AsteroidsGame = forwardRef<
  AsteroidsGameHandle,
  AsteroidsGameProps
>(function AsteroidsGame({ onStateChange, onGameOver }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  const keysRef = useRef<Record<string, boolean>>({});
  const pausedRef = useRef(false);

  const shipRef = useRef<Ship | null>(null);
  const bulletsRef = useRef<Bullet[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const stateRef = useRef<GameState | null>(null);

  const lastReportedRef = useRef<AsteroidsHudState | null>(null);
  const gameOverReportedRef = useRef(false);

  function wrap(obj: { x: number; y: number }) {
    const { width, height } = sizeRef.current;
    if (obj.x < 0) obj.x += width;
    if (obj.x > width) obj.x -= width;
    if (obj.y < 0) obj.y += height;
    if (obj.y > height) obj.y -= height;
  }

  function createShip(): Ship {
    const { width, height } = sizeRef.current;
    return {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      thrusting: false,
      invulnerable: SHIP_INVULNERABLE_TIME,
      shootCooldown: 0
    };
  }

  function createAsteroid(size: AsteroidSize, x: number, y: number): Asteroid {
    const angle = Math.random() * Math.PI * 2;
    const speed = ASTEROID_SPEED[size] * (0.5 + Math.random() * 0.5);
    const vertexCount = 10 + Math.floor(Math.random() * 4);
    const offsets: number[] = [];
    for (let i = 0; i < vertexCount; i++) {
      offsets.push(0.8 + Math.random() * 0.4);
    }
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      radius: ASTEROID_SIZES[size],
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 1.5,
      offsets
    };
  }

  function randomEdgePosition() {
    const { width, height } = sizeRef.current;
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0:
        return { x: Math.random() * width, y: 0 };
      case 1:
        return { x: width, y: Math.random() * height };
      case 2:
        return { x: Math.random() * width, y: height };
      default:
        return { x: 0, y: Math.random() * height };
    }
  }

  function spawnWave() {
    const state = stateRef.current!;
    const count = 3 + state.wave;
    const asteroids: Asteroid[] = [];
    for (let i = 0; i < count; i++) {
      const pos = randomEdgePosition();
      asteroids.push(createAsteroid("large", pos.x, pos.y));
    }
    asteroidsRef.current = asteroids;
  }

  function resetGame() {
    shipRef.current = createShip();
    bulletsRef.current = [];
    stateRef.current = { score: 0, lives: 3, wave: 1, gameOver: false };
    spawnWave();
    lastReportedRef.current = null;
    gameOverReportedRef.current = false;
    pausedRef.current = false;
  }

  function splitAsteroid(a: Asteroid) {
    const state = stateRef.current!;
    state.score += ASTEROID_POINTS[a.size];
    if (a.size === "large") {
      asteroidsRef.current.push(createAsteroid("medium", a.x, a.y));
      asteroidsRef.current.push(createAsteroid("medium", a.x, a.y));
    } else if (a.size === "medium") {
      asteroidsRef.current.push(createAsteroid("small", a.x, a.y));
      asteroidsRef.current.push(createAsteroid("small", a.x, a.y));
    }
  }

  function shootBullet() {
    const ship = shipRef.current!;
    const noseX = ship.x + Math.cos(ship.angle) * SHIP_SIZE;
    const noseY = ship.y + Math.sin(ship.angle) * SHIP_SIZE;
    for (const spread of [-BULLET_SPREAD_ANGLE, 0, BULLET_SPREAD_ANGLE]) {
      const angle = ship.angle + spread;
      bulletsRef.current.push({
        x: noseX,
        y: noseY,
        vx: Math.cos(angle) * BULLET_SPEED + ship.vx,
        vy: Math.sin(angle) * BULLET_SPEED + ship.vy,
        life: BULLET_LIFE
      });
    }
  }

  function respawnShip() {
    const ship = shipRef.current!;
    const { width, height } = sizeRef.current;
    ship.x = width / 2;
    ship.y = height / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = -Math.PI / 2;
    ship.invulnerable = SHIP_INVULNERABLE_TIME;
  }

  function update(dt: number) {
    const state = stateRef.current!;
    const ship = shipRef.current!;
    if (state.gameOver) return;

    const keys = keysRef.current;
    if (keys["ArrowLeft"]) ship.angle -= SHIP_TURN_SPEED * dt;
    if (keys["ArrowRight"]) ship.angle += SHIP_TURN_SPEED * dt;

    ship.thrusting = !!keys["ArrowUp"];
    if (ship.thrusting) {
      ship.vx += Math.cos(ship.angle) * SHIP_THRUST * dt;
      ship.vy += Math.sin(ship.angle) * SHIP_THRUST * dt;
    }

    const frictionFactor = Math.pow(FRICTION, dt * 60);
    ship.vx *= frictionFactor;
    ship.vy *= frictionFactor;

    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    wrap(ship);

    if (ship.invulnerable > 0) ship.invulnerable -= dt;
    if (ship.shootCooldown > 0) ship.shootCooldown -= dt;

    if (keys["Space"] && ship.shootCooldown <= 0) {
      shootBullet();
      ship.shootCooldown = BULLET_COOLDOWN;
    }

    const bullets = bulletsRef.current;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      wrap(b);
      b.life -= dt;
      if (b.life <= 0) bullets.splice(i, 1);
    }

    for (const a of asteroidsRef.current) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.angle += a.spin * dt;
      wrap(a);
    }

    outer: for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
      const a = asteroidsRef.current[i];
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (distance(a.x, a.y, b.x, b.y) < a.radius) {
          bullets.splice(j, 1);
          asteroidsRef.current.splice(i, 1);
          splitAsteroid(a);
          continue outer;
        }
      }
    }

    if (ship.invulnerable <= 0) {
      for (const a of asteroidsRef.current) {
        if (distance(a.x, a.y, ship.x, ship.y) < a.radius + SHIP_SIZE * 0.6) {
          state.lives--;
          if (state.lives <= 0) {
            state.gameOver = true;
          } else {
            respawnShip();
          }
          break;
        }
      }
    }

    if (asteroidsRef.current.length === 0) {
      state.wave++;
      spawnWave();
    }
  }

  function drawShip(ctx: CanvasRenderingContext2D) {
    const ship = shipRef.current!;
    if (ship.invulnerable > 0 && Math.floor(ship.invulnerable * 10) % 2 === 0) {
      return;
    }
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE * 0.6);
    ctx.lineTo(-SHIP_SIZE * 0.4, 0);
    ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_SIZE * 0.6);
    ctx.closePath();
    ctx.stroke();

    if (ship.thrusting) {
      ctx.strokeStyle = "#f80";
      ctx.beginPath();
      ctx.moveTo(-SHIP_SIZE * 0.4, 0);
      ctx.lineTo(-SHIP_SIZE * 1.1, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.strokeStyle = "#bbb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const count = a.offsets.length;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const r = a.radius * a.offsets[i];
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw(ctx: CanvasRenderingContext2D) {
    const { width, height } = sizeRef.current;
    ctx.clearRect(0, 0, width, height);
    drawShip(ctx);
    for (const a of asteroidsRef.current) drawAsteroid(ctx, a);
    for (const b of bulletsRef.current) drawBullet(ctx, b);
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
      if (state && !state.gameOver) state.gameOver = true;
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

    function applySize(width: number, height: number) {
      sizeRef.current = { width, height };
      canvas!.width = width;
      canvas!.height = height;
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
      keysRef.current[e.code] = true;
    }
    function onKeyUp(e: KeyboardEvent) {
      keysRef.current[e.code] = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let lastTime = performance.now();
    let raf = 0;

    function loop(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!pausedRef.current) {
        update(dt);
      }
      draw(ctx!);

      const state = stateRef.current!;
      const last = lastReportedRef.current;
      if (
        !last ||
        last.score !== state.score ||
        last.lives !== state.lives ||
        last.wave !== state.wave
      ) {
        const next = {
          score: state.score,
          lives: state.lives,
          wave: state.wave
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
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
});
