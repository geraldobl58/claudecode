export type BlockColor =
  "gray" | "cyan" | "green" | "yellow" | "magenta" | "red" | "hotpink";

export interface SpriteRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export type SpriteName = "paddle" | "ball" | `block_${BlockColor}`;

const SPRITESHEET_SRC = "/games/arkanoid/spritesheet-breakout.png";

export const EXPLOSION_DURATION = 150;

function explosionRow(sy: number): SpriteRect[] {
  return [256, 288, 320, 352].map((sx) => ({ sx, sy, sw: 32, sh: 16 }));
}

export const EXPLOSION_FRAMES: Record<BlockColor, SpriteRect[]> = {
  red: explosionRow(176),
  cyan: explosionRow(192),
  green: explosionRow(208),
  magenta: explosionRow(224),
  yellow: explosionRow(240),
  hotpink: explosionRow(256),
  // The sheet has no gray explosion row; the prototype reuses red's frames.
  gray: explosionRow(176)
};

export const SPRITES = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 }
  }
} satisfies {
  paddle: SpriteRect;
  ball: SpriteRect;
  blocks: Record<BlockColor, SpriteRect>;
};

export function loadSpritesheet(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Failed to load spritesheet: ${SPRITESHEET_SRC}`));
    img.src = SPRITESHEET_SRC;
  });
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  frame: SpriteRect,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.drawImage(sheet, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  name: SpriteName,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const sprite = name.startsWith("block_")
    ? SPRITES.blocks[name.slice(6) as BlockColor]
    : SPRITES[name as "paddle" | "ball"];
  if (!sprite) return;
  drawFrame(ctx, sheet, sprite, x, y, w, h);
}
