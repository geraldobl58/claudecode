export interface SpriteRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

const FRUIT_SHEET_SRC = "/games/snake/fruits.png";

// Ported from references/snake-assets/sprites.js (window.SPRITE_ATLAS.fruits).
// Sheet is 3790x442, transparent background; only the y=136..296 row is used.
export const FRUITS = {
  banana: { sx: 34, sy: 136, sw: 110, sh: 160 },
  orange: { sx: 186, sy: 136, sw: 150, sh: 160 },
  grape: { sx: 378, sy: 136, sw: 110, sh: 160 },
  garlic: { sx: 540, sy: 136, sw: 130, sh: 160 },
  eggplant: { sx: 712, sy: 136, sw: 130, sh: 160 },
  strawberry: { sx: 894, sy: 136, sw: 110, sh: 160 },
  cherry: { sx: 1066, sy: 136, sw: 110, sh: 160 },
  carrot: { sx: 1228, sy: 136, sw: 130, sh: 160 },
  mushroom: { sx: 1400, sy: 136, sw: 130, sh: 160 },
  broccoli: { sx: 1582, sy: 136, sw: 110, sh: 160 },
  watermelon: { sx: 1734, sy: 136, sw: 150, sh: 160 },
  pepper: { sx: 1906, sy: 136, sw: 150, sh: 160 },
  kiwi: { sx: 2068, sy: 136, sw: 170, sh: 160 },
  lemon: { sx: 2250, sy: 136, sw: 140, sh: 160 },
  peach: { sx: 2432, sy: 136, sw: 130, sh: 160 },
  peanut: { sx: 2604, sy: 136, sw: 130, sh: 160 },
  apple: { sx: 2786, sy: 136, sw: 110, sh: 160 },
  tomato: { sx: 2948, sy: 136, sw: 130, sh: 160 },
  berries: { sx: 3110, sy: 136, sw: 150, sh: 160 },
  grapes2: { sx: 3302, sy: 136, sw: 110, sh: 160 },
  pineapple: { sx: 3454, sy: 136, sw: 150, sh: 160 },
  melon: { sx: 3637, sy: 136, sw: 130, sh: 160 }
} satisfies Record<string, SpriteRect>;

export type FruitName = keyof typeof FRUITS;

export const FRUIT_NAMES = Object.keys(FRUITS) as FruitName[];

export function loadFruitSheet(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Failed to load fruit sheet: ${FRUIT_SHEET_SRC}`));
    img.src = FRUIT_SHEET_SRC;
  });
}

export function drawFruit(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  name: FruitName,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const sprite = FRUITS[name];
  ctx.drawImage(sheet, sprite.sx, sprite.sy, sprite.sw, sprite.sh, x, y, w, h);
}
