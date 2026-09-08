const COLS = 10;
const ROWS = 20;
const CELL = 30;
const PREVIEW_SIZE = 4;

// Cada peça é uma matriz quadrada (0 = vazio, 1 = bloco preenchido),
// na orientação de spawn. Peças de tamanhos diferentes (2x2, 3x3, 4x4)
// giram em torno do próprio centro da matriz.
const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  PLUS: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
  U: [
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const COLORS = {
  I: "#00f0f0",
  O: "#f0f000",
  T: "#a000f0",
  S: "#00f000",
  Z: "#f00000",
  J: "#0000f0",
  L: "#f0a000",
  PLUS: "#ff00ff",
  U: "#00a0ff",
};

// Temas visuais: cada entrada descreve parâmetros para as funções de
// desenho (drawCell/drawGrid/drawGhost), que ramificam em `currentTheme`.
// COLORS e o conteúdo gravado em `board` nunca mudam — só a pintura muda.
const THEMES = {
  retro: { label: "Retro" },
  neon: { label: "Neon", glowBlur: 16 },
  pastel: { label: "Pastel", whiteMix: 0.45, radius: 6 },
  pixel: { label: "Pixel Art" },
};

const PIECE_TYPES = Object.keys(SHAPES);

// Pontos por linhas simultâneas (índice = nº de linhas), multiplicado pelo nível.
const LINE_SCORES = [0, 40, 100, 300, 1200];
const LINES_PER_LEVEL = 10;

// Gira uma matriz quadrada 90° no sentido horário.
function rotateMatrix(matrix) {
  const size = matrix.length;
  const rotated = Array.from({ length: size }, () => Array(size).fill(0));
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      rotated[col][size - 1 - row] = matrix[row][col];
    }
  }
  return rotated;
}

function randomType() {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

function spawnPiece(type = randomType()) {
  const matrix = SHAPES[type].map((row) => [...row]);
  return {
    type,
    matrix,
    x: Math.floor((COLS - matrix[0].length) / 2),
    y: 0,
  };
}

// Spawna a peça que já estava em espera (mostrada no preview) e sorteia a
// próxima, mantendo o preview sempre um passo à frente da peça em jogo.
function advancePiece() {
  const piece = spawnPiece(nextType);
  nextType = randomType();
  return piece;
}

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// Mistura uma cor hex em direção ao branco por `ratio` (0 = cor original,
// 1 = branco puro). Usado pelo tema Pastel para clarear a paleta base sem
// precisar declarar um segundo mapa de cores hand-picked.
function mixWithWhite(hex, ratio) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c) => Math.round(c + (255 - c) * ratio);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Traça um retângulo de cantos arredondados no path atual, usando
// ctx.roundRect quando disponível e um path manual como fallback.
function tracePath(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Cache de padrões (um mini-tile 8x8 por cor) usado pelo tema Pixel Art
// para dar textura aos blocos em vez de um preenchimento chapado.
const pixelPatternCache = {};
function getPixelPattern(ctx, color) {
  if (pixelPatternCache[color]) return pixelPatternCache[color];
  const size = 8;
  const tile = document.createElement("canvas");
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext("2d");
  tctx.fillStyle = color;
  tctx.fillRect(0, 0, size, size);
  tctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  tctx.fillRect(0, 0, size / 2, size / 2);
  tctx.fillRect(size / 2, size / 2, size / 2, size / 2);
  tctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  tctx.fillRect(size / 2, 0, size / 2, size / 2);
  tctx.fillRect(0, size / 2, size / 2, size / 2);
  const pattern = ctx.createPattern(tile, "repeat");
  pixelPatternCache[color] = pattern;
  return pattern;
}

function drawCell(ctx, x, y, color) {
  const px = x * CELL;
  const py = y * CELL;

  if (currentTheme === "neon") {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = THEMES.neon.glowBlur;
    ctx.fillStyle = color;
    ctx.fillRect(px, py, CELL, CELL);
    ctx.restore();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
    return;
  }

  if (currentTheme === "pastel") {
    const pastelColor = mixWithWhite(color, THEMES.pastel.whiteMix);
    const r = THEMES.pastel.radius;
    tracePath(ctx, px + 1, py + 1, CELL - 2, CELL - 2, r);
    ctx.fillStyle = pastelColor;
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    return;
  }

  if (currentTheme === "pixel") {
    ctx.fillStyle = color;
    ctx.fillRect(px, py, CELL, CELL);
    const pattern = getPixelPattern(ctx, color);
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(px, py, CELL, CELL);
    }
    ctx.strokeStyle = "#000";
    ctx.strokeRect(px, py, CELL, CELL);
    return;
  }

  // Retro (padrão): comportamento original, inalterado.
  ctx.fillStyle = color;
  ctx.fillRect(px, py, CELL, CELL);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(px, py, CELL, CELL);
}

function drawGrid(ctx) {
  // Neon mantém a grade mínima/omitida para o brilho dos blocos se destacar.
  if (currentTheme === "neon") return;

  ctx.strokeStyle = currentTheme === "pastel" ? "#d8cbe0" : "#222";
  for (let col = 0; col <= COLS; col++) {
    ctx.beginPath();
    ctx.moveTo(col * CELL, 0);
    ctx.lineTo(col * CELL, ROWS * CELL);
    ctx.stroke();
  }
  for (let row = 0; row <= ROWS; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * CELL);
    ctx.lineTo(COLS * CELL, row * CELL);
    ctx.stroke();
  }
}

function drawBoard(ctx, board) {
  board.forEach((row, r) => {
    row.forEach((color, c) => {
      if (color) {
        drawCell(ctx, c, r, color);
      }
    });
  });
}

function drawPiece(ctx, piece) {
  const color = COLORS[piece.type];
  piece.matrix.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value) {
        drawCell(ctx, piece.x + c, piece.y + r, color);
      }
    });
  });
}

// Retorna a posição Y mais baixa que a peça alcançaria caindo a partir
// da posição atual, para desenhar a sombra de pouso (ghost piece).
function getGhostY(piece, board) {
  let ghostY = piece.y;
  while (!collides(piece.matrix, piece.x, ghostY + 1, board)) {
    ghostY++;
  }
  return ghostY;
}

function drawGhost(ctx, piece, board) {
  const ghostY = getGhostY(piece, board);
  if (ghostY === piece.y) return;
  const baseColor = COLORS[piece.type];
  const color =
    currentTheme === "pastel"
      ? mixWithWhite(baseColor, THEMES.pastel.whiteMix)
      : baseColor;
  piece.matrix.forEach((row, r) => {
    row.forEach((value, c) => {
      if (!value) return;
      const x = piece.x + c;
      const y = ghostY + r;
      const px = x * CELL;
      const py = y * CELL;
      ctx.save();
      if (currentTheme === "neon") {
        ctx.shadowColor = color;
        ctx.shadowBlur = THEMES.neon.glowBlur / 2;
      }
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.2;
      if (currentTheme === "pastel") {
        tracePath(ctx, px + 1, py + 1, CELL - 2, CELL - 2, THEMES.pastel.radius);
        ctx.fill();
      } else {
        ctx.fillRect(px, py, CELL, CELL);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      if (currentTheme === "pastel") {
        tracePath(ctx, px + 1, py + 1, CELL - 2, CELL - 2, THEMES.pastel.radius);
        ctx.stroke();
      } else {
        ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
      }
      ctx.restore();
    });
  });
}

// Desenha a peça em espera (nextType) centralizada em uma caixa de
// PREVIEW_SIZE x PREVIEW_SIZE células, reaproveitando drawPiece/drawCell
// para manter a mesma aparência por tema (neon, pastel, pixel, retro) sem
// duplicar lógica de desenho.
function drawNextPiecePreview() {
  nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
  const matrix = SHAPES[nextType];
  const offset = (PREVIEW_SIZE - matrix.length) / 2;
  drawPiece(nextPieceCtx, { type: nextType, matrix, x: offset, y: offset });
}

// Verifica se a matriz da peça, na posição (x, y), colide com as bordas
// do tabuleiro ou com blocos já fixados.
function collides(matrix, x, y, board) {
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

function mergePiece(piece, board) {
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

// Detecta linhas completas, remove do board e devolve seus dados
// (linha + cores) para quem for gerar a animação de explosão.
function clearLines(board) {
  const fullRows = [];
  for (let row = 0; row < ROWS; row++) {
    if (board[row].every((cell) => cell)) {
      fullRows.push({ row, colors: [...board[row]] });
    }
  }
  for (let i = fullRows.length - 1; i >= 0; i--) {
    board.splice(fullRows[i].row, 1);
    board.unshift(Array(COLS).fill(null));
  }
  return fullRows;
}

let particles = [];
let shakeTime = 0;
let shakeMagnitude = 0;
let flashAlpha = 0;

// Cria partículas de explosão para cada bloco das linhas removidas, mais
// forte quanto mais linhas caírem juntas (combo maior = explosão maior).
function spawnExplosion(clearedRows) {
  const intensity = 1 + (clearedRows.length - 1) * 0.5;
  clearedRows.forEach(({ row, colors }) => {
    colors.forEach((color, col) => {
      if (!color) return;
      const cx = col * CELL + CELL / 2;
      const cy = row * CELL + CELL / 2;
      const count = Math.round(16 * intensity);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (140 + Math.random() * 320) * intensity;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (4 + Math.random() * 8) * intensity,
          color,
          life: 500 + Math.random() * 400,
          age: 0,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 12,
        });
      }
    });
  });
  shakeTime = 300 * intensity;
  shakeMagnitude = 10 * intensity;
  flashAlpha = Math.min(0.85, 0.4 * intensity);
}

function updateParticles(dt) {
  particles = particles.filter((p) => {
    p.age += dt;
    if (p.age >= p.life) return false;
    p.x += p.vx * (dt / 1000);
    p.y += p.vy * (dt / 1000);
    p.vy += 600 * (dt / 1000);
    p.rotation += p.rotationSpeed * (dt / 1000);
    return true;
  });

  if (shakeTime > 0) {
    shakeTime = Math.max(shakeTime - dt, 0);
  }
  if (flashAlpha > 0) {
    flashAlpha = Math.max(flashAlpha - dt / 150, 0);
  }
}

function drawParticles(ctx) {
  particles.forEach((p) => {
    const alpha = Math.max(1 - p.age / p.life, 0);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function currentShakeOffset() {
  if (shakeTime <= 0) return { x: 0, y: 0 };
  const factor = shakeTime / 1000;
  return {
    x: (Math.random() * 2 - 1) * shakeMagnitude * factor,
    y: (Math.random() * 2 - 1) * shakeMagnitude * factor,
  };
}

function drawFlash(ctx) {
  if (flashAlpha <= 0) return;
  ctx.globalAlpha = flashAlpha;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
}

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const gameOverEl = document.getElementById("game-over");
const pauseOverlayEl = document.getElementById("pause-overlay");
const pauseResumeBtn = document.getElementById("pause-resume-btn");
const pauseRestartBtn = document.getElementById("pause-restart-btn");
const initialLevelSelectEl = document.getElementById("initial-level-select");
const themeSelectEl = document.getElementById("theme-select");
const nextPieceCanvas = document.getElementById("next-piece-canvas");
const nextPieceCtx = nextPieceCanvas.getContext("2d");

// Tema visual ativo, lido de localStorage (com fallback seguro caso o
// armazenamento esteja indisponível, ex.: file:// ou modo privado) e
// aplicado ao <body> antes do primeiro render() para evitar um flash
// de tema errado.
let currentTheme = "retro";
try {
  const storedTheme = localStorage.getItem("tetris-theme");
  if (storedTheme) currentTheme = storedTheme;
} catch (err) {
  currentTheme = "retro";
}
if (!THEMES[currentTheme]) currentTheme = "retro";
document.body.setAttribute("data-theme", currentTheme);

const startScreenEl = document.getElementById("start-screen");
const startButtonEl = document.getElementById("start-button");
const startLeaderboardBody = document.querySelector("#start-leaderboard tbody");
const startBestComboEl = document.getElementById("start-best-combo");
const startMaxLinesEl = document.getElementById("start-max-lines");
const clearScoresButtonEl = document.getElementById("clear-scores-button");
const gameOverLeaderboardBody = document.querySelector("#gameover-leaderboard tbody");
const highScoreEntryEl = document.getElementById("game-over-highscore-entry");
const nameInputEl = document.getElementById("name-input");
const submitScoreButtonEl = document.getElementById("submit-score-button");

let board = createBoard();
let nextType = randomType();
let currentPiece = advancePiece();
let score = 0;
let lines = 0;
let level = 1;
let paused = false;
let gameOver = false;
let dropTimer = null;
let selectedInitialLevel = 1;
let startLevel = 1;
let gameStarted = false;
let combo = 0;
let bestComboThisGame = 0;

// ---- Local high-score table (localStorage) ----
const HIGH_SCORES_KEY = "tetris-highscores";
const BEST_COMBO_KEY = "tetris-best-combo";
const MAX_LINES_KEY = "tetris-max-lines";
function loadHighScores() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveHighScores(scores) {
  try {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
  } catch (e) {
    // localStorage indisponível (ex.: navegação privada) — ignora silenciosamente.
  }
}

function loadBestCombo() {
  return Number(localStorage.getItem(BEST_COMBO_KEY)) || 0;
}

function saveBestCombo(value) {
  try {
    localStorage.setItem(BEST_COMBO_KEY, String(value));
  } catch (e) {
    // localStorage indisponível — ignora silenciosamente.
  }
}

function loadMaxLines() {
  return Number(localStorage.getItem(MAX_LINES_KEY)) || 0;
}

function saveMaxLines(value) {
  try {
    localStorage.setItem(MAX_LINES_KEY, String(value));
  } catch (e) {
    // localStorage indisponível — ignora silenciosamente.
  }
}

// Adiciona uma entrada e reordena por score desc. Todos os jogadores
// entram na lista, sem corte de topo N.
function addHighScore(entry) {
  const scores = loadHighScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  saveHighScores(scores);
  return scores;
}

function clearHighScores() {
  localStorage.removeItem(HIGH_SCORES_KEY);
  localStorage.removeItem(BEST_COMBO_KEY);
  localStorage.removeItem(MAX_LINES_KEY);
  renderAllLeaderboards();
}

function renderLeaderboardTable(tbodyEl, scores, highlightEntry) {
  if (!tbodyEl) return;
  tbodyEl.innerHTML = "";
  if (scores.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "Sem recordes";
    cell.className = "leaderboard-empty";
    row.appendChild(cell);
    tbodyEl.appendChild(row);
    return;
  }
  scores.forEach((entry) => {
    const row = document.createElement("tr");
    // Comparação por `date` (timestamp ISO com precisão de ms) em vez de
    // identidade de objeto: `scores` vem de um round-trip por localStorage
    // (JSON.parse), então a referência original de `entry` nunca sobrevive.
    if (highlightEntry && entry.date === highlightEntry.date) {
      row.classList.add("leaderboard-row-new");
    }
    const nameCell = document.createElement("td");
    nameCell.textContent = entry.name || "---";
    const scoreCell = document.createElement("td");
    scoreCell.textContent = entry.score;
    const linesCell = document.createElement("td");
    linesCell.textContent = entry.lines;
    const comboCell = document.createElement("td");
    comboCell.textContent = entry.combo;
    row.append(nameCell, scoreCell, linesCell, comboCell);
    tbodyEl.appendChild(row);
  });
}

function renderAllTimeStats() {
  if (startBestComboEl) startBestComboEl.textContent = loadBestCombo();
  if (startMaxLinesEl) startMaxLinesEl.textContent = loadMaxLines();
}

function renderAllLeaderboards(highlightEntry) {
  const scores = loadHighScores();
  renderLeaderboardTable(startLeaderboardBody, scores, highlightEntry);
  renderLeaderboardTable(gameOverLeaderboardBody, scores, highlightEntry);
  renderAllTimeStats();
}

// Atualiza estatísticas all-time e sempre revela o input de nome, para
// qualquer jogador salvar sua entrada no placar.
function handleGameOver() {
  if (bestComboThisGame > loadBestCombo()) saveBestCombo(bestComboThisGame);
  if (lines > loadMaxLines()) saveMaxLines(lines);

  highScoreEntryEl.hidden = false;
  nameInputEl.value = "";
  nameInputEl.focus();
  renderAllLeaderboards();
}

function submitHighScore() {
  const typed = nameInputEl.value.trim().slice(0, 12);
  const name = typed || "Jogador";
  const entry = {
    name,
    score,
    lines,
    combo: bestComboThisGame,
    date: new Date().toISOString(),
  };
  addHighScore(entry);
  highScoreEntryEl.hidden = true;
  renderAllLeaderboards(entry);
}

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  startScreenEl.hidden = true;
  updateStats();
  restartDropTimer();
}

function dropInterval() {
  return Math.max(1000 - (level - 1) * 75, 100);
}

function updateStats() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const shake = currentShakeOffset();
  ctx.save();
  ctx.translate(shake.x, shake.y);
  drawGrid(ctx);
  drawBoard(ctx, board);
  if (!gameOver) {
    drawGhost(ctx, currentPiece, board);
    drawPiece(ctx, currentPiece);
  }
  drawParticles(ctx);
  ctx.restore();
  drawFlash(ctx);
  drawNextPiecePreview();
}

function tryMove(dx, dy) {
  if (!gameStarted || gameOver || paused) return false;
  const newX = currentPiece.x + dx;
  const newY = currentPiece.y + dy;
  if (collides(currentPiece.matrix, newX, newY, board)) return false;
  currentPiece.x = newX;
  currentPiece.y = newY;
  return true;
}

function tryRotate() {
  if (!gameStarted || gameOver || paused) return;
  const rotated = rotateMatrix(currentPiece.matrix);
  if (!collides(rotated, currentPiece.x, currentPiece.y, board)) {
    currentPiece.matrix = rotated;
  }
}

function lockPiece() {
  mergePiece(currentPiece, board);
  const clearedRows = clearLines(board);
  const cleared = clearedRows.length;
  if (cleared > 0) {
    spawnExplosion(clearedRows);
    score += LINE_SCORES[cleared] * level;
    lines += cleared;
    level = startLevel + Math.floor(lines / LINES_PER_LEVEL);
    combo++;
    bestComboThisGame = Math.max(bestComboThisGame, combo);
    restartDropTimer();
  } else {
    combo = 0;
  }
  currentPiece = advancePiece();
  if (collides(currentPiece.matrix, currentPiece.x, currentPiece.y, board)) {
    gameOver = true;
    gameOverEl.hidden = false;
    stopDropTimer();
    handleGameOver();
  }
  updateStats();
}

function softDrop() {
  if (!gameStarted || gameOver || paused) return;
  if (tryMove(0, 1)) {
    score += 1;
    updateStats();
  } else {
    lockPiece();
  }
}

function hardDrop() {
  if (!gameStarted || gameOver || paused) return;
  let dropped = 0;
  while (tryMove(0, 1)) dropped++;
  score += dropped * 2;
  lockPiece();
  updateStats();
}

function tick() {
  if (!gameStarted || gameOver || paused) return;
  softDrop();
}

function stopDropTimer() {
  if (dropTimer) clearInterval(dropTimer);
  dropTimer = null;
}

function restartDropTimer() {
  stopDropTimer();
  dropTimer = setInterval(tick, dropInterval());
}

function setPaused(next) {
  if (gameOver) return;
  paused = next;
  pauseOverlayEl.hidden = !paused;
}

function togglePause() {
  setPaused(!paused);
}

// Aplica um tema visual: atualiza o estado usado pelas funções de desenho,
// persiste a escolha e re-skina o chrome da página via data-theme no body.
// render() já roda a cada requestAnimationFrame, então a mudança aparece
// no próximo frame sem precisar recarregar a página.
function applyTheme(themeName) {
  if (!THEMES[themeName]) themeName = "retro";
  currentTheme = themeName;
  try {
    localStorage.setItem("tetris-theme", themeName);
  } catch (err) {
    // Armazenamento indisponível (ex.: file://, modo privado) — segue sem persistir.
  }
  document.body.setAttribute("data-theme", themeName);
}

function restartGame() {
  board = createBoard();
  currentPiece = advancePiece();
  score = 0;
  lines = 0;
  startLevel = selectedInitialLevel;
  level = startLevel;
  paused = false;
  gameOver = false;
  combo = 0;
  bestComboThisGame = 0;
  particles = [];
  shakeTime = 0;
  flashAlpha = 0;
  gameOverEl.hidden = true;
  pauseOverlayEl.hidden = true;
  highScoreEntryEl.hidden = true;
  updateStats();
  restartDropTimer();
}

pauseResumeBtn.addEventListener("click", () => {
  setPaused(false);
});

pauseRestartBtn.addEventListener("click", () => {
  restartGame();
});

initialLevelSelectEl.addEventListener("change", (event) => {
  selectedInitialLevel = Number(event.target.value);
});

if (themeSelectEl) {
  themeSelectEl.value = currentTheme;
  themeSelectEl.addEventListener("change", (event) => {
    applyTheme(event.target.value);
  });
}

startButtonEl.addEventListener("click", startGame);
clearScoresButtonEl.addEventListener("click", clearHighScores);
submitScoreButtonEl.addEventListener("click", submitHighScore);
nameInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitHighScore();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.target && event.target.tagName === "INPUT") return;

  if (!gameStarted) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startGame();
    }
    return;
  }

  // Let Escape close the native <select> popup without also toggling pause.
  if (event.key === "Escape" && event.target === initialLevelSelectEl) {
    return;
  }
  if (event.key.toLowerCase() === "p" || event.key === "Escape") {
    if (event.repeat) return;
    togglePause();
    return;
  }
  if (event.key.toLowerCase() === "r" && !paused) {
    restartGame();
    return;
  }
  if (gameOver || paused) return;

  switch (event.key) {
    case "ArrowLeft":
      tryMove(-1, 0);
      break;
    case "ArrowRight":
      tryMove(1, 0);
      break;
    case "ArrowDown":
      softDrop();
      return;
    case "ArrowUp":
      tryRotate();
      break;
    case " ":
      hardDrop();
      return;
    default:
      return;
  }
});

let lastFrameTime = null;

function animationLoop(time) {
  if (lastFrameTime === null) lastFrameTime = time;
  const dt = time - lastFrameTime;
  lastFrameTime = time;
  updateParticles(dt);
  render();
  requestAnimationFrame(animationLoop);
}

renderAllLeaderboards();
requestAnimationFrame(animationLoop);
