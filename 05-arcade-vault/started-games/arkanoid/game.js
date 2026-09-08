const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const BLOCK_ROWS = 7;
const BLOCK_COLS = 10;
const BLOCK_WIDTH = 32;
const BLOCK_HEIGHT = 16;
const BLOCK_GAP = 4;
const BLOCK_GRID_TOP = 60;

const BALL_PADDLE_GAP = 6;
const MAX_BOUNCE_ANGLE = ( 75 * Math.PI ) / 180;

const ARCADE_FONT = "'Press Start 2P', monospace";
const MAX_LIVES = 3;

const ROW_COLORS = [ 'gray', 'cyan', 'green', 'yellow', 'magenta', 'red', 'hotpink' ];
const COLOR_POINTS = {
  gray: 10,
  cyan: 20,
  green: 30,
  yellow: 40,
  magenta: 50,
  red: 60,
  hotpink: 70,
};

function createBlocks() {
  const blocks = [];
  const gridWidth = BLOCK_COLS * BLOCK_WIDTH + ( BLOCK_COLS - 1 ) * BLOCK_GAP;
  const startX = ( canvas.width - gridWidth ) / 2;

  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    const color = ROW_COLORS[ row ];
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      blocks.push( {
        x: startX + col * ( BLOCK_WIDTH + BLOCK_GAP ),
        y: BLOCK_GRID_TOP + row * ( BLOCK_HEIGHT + BLOCK_GAP ),
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color,
        points: COLOR_POINTS[ color ],
        alive: true,
      } );
    }
  }

  return blocks;
}

const HIGH_SCORE_KEY = 'arkanoid-highscore';

function loadHighScore() {
  try {
    const parsed = Number( localStorage.getItem( HIGH_SCORE_KEY ) );
    return Number.isFinite( parsed ) ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveHighScore( value ) {
  try {
    localStorage.setItem( HIGH_SCORE_KEY, String( value ) );
  } catch {
    // localStorage indisponível (ex.: modo privado); recorde some ao recarregar
  }
}

const SOUND_LEVELS = [ 'off', 'medium', 'high' ];
const SOUND_VOLUMES = { off: 0, medium: 0.5, high: 1.0 };
const SOUND_LEVEL_KEY = 'arkanoid-sound-level';
const SOUND_LEVEL_LABELS = { off: 'Desligado', medium: 'Médio', high: 'Alto' };

function loadSoundLevel() {
  try {
    const stored = localStorage.getItem( SOUND_LEVEL_KEY );
    return SOUND_LEVELS.includes( stored ) ? stored : 'high';
  } catch {
    return 'high';
  }
}

function saveSoundLevel( value ) {
  try {
    localStorage.setItem( SOUND_LEVEL_KEY, value );
  } catch {
    // localStorage indisponível (ex.: modo privado); nível de som some ao recarregar
  }
}

const state = {
  screen: 'start', // 'start' | 'playing' | 'paused' | 'gameover' | 'win'
  score: 0,
  lives: MAX_LIVES,
  highScore: loadHighScore(),
  soundLevel: loadSoundLevel(),
  paddle: { x: 320, y: 560, width: 162, height: 14, speed: 8 },
  ball: {
    x: 401,
    y: 546,
    radius: 8,
    dx: 0,
    dy: 0,
    speed: 5,
    attached: true,
  },
  blocks: createBlocks(),
  explosions: [],
};

const breakSound = new Audio( 'assets/sounds/break-sound.mp3' );
const ballBounceSound = new Audio( 'assets/sounds/ball-bounce.mp3' );

function playSound( audio ) {
  audio.volume = SOUND_VOLUMES[ state.soundLevel ];
  audio.currentTime = 0;
  audio.play().catch( () => {} );
}

function drawPlayingScene() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  for ( const block of state.blocks ) {
    if ( !block.alive ) continue;
    drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.width, block.height );
  }

  drawExplosions();

  drawSprite( ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height );

  const ball = state.ball;
  drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );

  drawHUD();
}

function drawExplosions() {
  for ( const explosion of state.explosions ) {
    const elapsed = performance.now() - explosion.startTime;
    const frameIndex = Math.min( 3, Math.floor( elapsed / ( EXPLOSION_DURATION / 4 ) ) );
    const frame = EXPLOSION_FRAMES[ explosion.color ][ frameIndex ];
    drawFrame( ctx, frame, explosion.x, explosion.y, explosion.width, explosion.height );
  }
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = `12px ${ ARCADE_FONT }`;
  ctx.textAlign = 'left';
  ctx.fillText( `Pontuação: ${ state.score }`, 16, 24 );
  ctx.textAlign = 'right';
  const hearts = '❤️'.repeat( state.lives ) + '🤍'.repeat( MAX_LIVES - state.lives );
  ctx.fillText( hearts, canvas.width - 16, 24 );

  ctx.font = `10px ${ ARCADE_FONT }`;
  ctx.textAlign = 'left';
  ctx.fillText( `Som (M): ${ SOUND_LEVEL_LABELS[ state.soundLevel ] }`, 16, canvas.height - 16 );
}

function drawStartScreen() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = `40px ${ ARCADE_FONT }`;
  ctx.fillText( 'ARKANOID', canvas.width / 2, 220 );
  ctx.font = `16px ${ ARCADE_FONT }`;
  ctx.fillText( `Recorde: ${ state.highScore }`, canvas.width / 2, 280 );
  ctx.font = `14px ${ ARCADE_FONT }`;
  ctx.fillText( 'Pressione ESPAÇO para começar', canvas.width / 2, 340 );
  ctx.font = `10px ${ ARCADE_FONT }`;
  ctx.fillText( `Som (M): ${ SOUND_LEVEL_LABELS[ state.soundLevel ] }`, canvas.width / 2, 380 );
}

function drawEndScreen( title ) {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = `40px ${ ARCADE_FONT }`;
  ctx.fillText( title, canvas.width / 2, 220 );
  ctx.font = `16px ${ ARCADE_FONT }`;
  ctx.fillText( `Pontuação: ${ state.score }`, canvas.width / 2, 280 );
  ctx.fillText( `Recorde: ${ state.highScore }`, canvas.width / 2, 310 );
  ctx.font = `14px ${ ARCADE_FONT }`;
  ctx.fillText( 'Pressione ESPAÇO ou ENTER para reiniciar', canvas.width / 2, 360 );
}

function draw() {
  if ( state.screen === 'start' ) {
    drawStartScreen();
    return;
  }

  if ( state.screen === 'gameover' ) {
    drawEndScreen( 'GAME OVER' );
    return;
  }

  if ( state.screen === 'win' ) {
    drawEndScreen( 'VITÓRIA!' );
    return;
  }

  drawPlayingScene();

  if ( state.screen === 'paused' ) {
    drawPauseOverlay();
  }
}

function drawPauseOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = `32px ${ ARCADE_FONT }`;
  ctx.fillText( 'PAUSADO', canvas.width / 2, canvas.height / 2 );
}

const keys = { left: false, right: false };

window.addEventListener( 'keydown', ( e ) => {
  if ( e.key === 'ArrowLeft' ) keys.left = true;
  if ( e.key === 'ArrowRight' ) keys.right = true;

  if ( e.code === 'KeyM' ) {
    const nextIndex = ( SOUND_LEVELS.indexOf( state.soundLevel ) - 1 + SOUND_LEVELS.length ) % SOUND_LEVELS.length;
    state.soundLevel = SOUND_LEVELS[ nextIndex ];
    saveSoundLevel( state.soundLevel );
    return;
  }

  if ( ( e.code === 'KeyP' || e.code === 'Escape' ) && ( state.screen === 'playing' || state.screen === 'paused' ) ) {
    e.preventDefault();
    state.screen = state.screen === 'playing' ? 'paused' : 'playing';
    return;
  }

  if ( state.screen === 'start' && e.code === 'Space' ) {
    e.preventDefault();
    resetGame();
    state.screen = 'playing';
    return;
  }

  if ( state.screen === 'playing' && e.code === 'Space' && state.ball.attached ) {
    e.preventDefault();
    launchBall();
    return;
  }

  if ( ( state.screen === 'gameover' || state.screen === 'win' ) && ( e.code === 'Space' || e.code === 'Enter' ) ) {
    e.preventDefault();
    resetGame();
  }
} );

window.addEventListener( 'keyup', ( e ) => {
  if ( e.key === 'ArrowLeft' ) keys.left = false;
  if ( e.key === 'ArrowRight' ) keys.right = false;
} );

function resetGame() {
  state.score = 0;
  state.lives = MAX_LIVES;
  state.blocks = createBlocks();
  state.explosions = [];
  state.paddle.x = 320;
  state.screen = 'start';
  resetBall();
}

function launchBall() {
  const ball = state.ball;
  ball.attached = false;
  ball.dx = ball.speed * 0.6;
  ball.dy = -ball.speed * 0.8;
}

function resetBall() {
  const ball = state.ball;
  const paddle = state.paddle;

  ball.attached = true;
  ball.dx = 0;
  ball.dy = 0;
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - ball.radius - BALL_PADDLE_GAP;
}

function checkWallCollision() {
  const ball = state.ball;

  if ( ball.x - ball.radius <= 0 ) {
    ball.x = ball.radius;
    ball.dx = Math.abs( ball.dx );
    playSound( ballBounceSound );
  } else if ( ball.x + ball.radius >= canvas.width ) {
    ball.x = canvas.width - ball.radius;
    ball.dx = -Math.abs( ball.dx );
    playSound( ballBounceSound );
  }

  if ( ball.y - ball.radius <= 0 ) {
    ball.y = ball.radius;
    ball.dy = Math.abs( ball.dy );
    playSound( ballBounceSound );
  }
}

function checkPaddleCollision() {
  const ball = state.ball;
  const paddle = state.paddle;

  if ( ball.dy <= 0 ) return;

  const ballBottom = ball.y + ball.radius;
  const withinX = ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width;
  const hitsPaddle = ballBottom >= paddle.y && ball.y < paddle.y + paddle.height && withinX;
  if ( !hitsPaddle ) return;

  const relativeX = ( ball.x - ( paddle.x + paddle.width / 2 ) ) / ( paddle.width / 2 );
  const clamped = Math.max( -1, Math.min( 1, relativeX ) );
  const angle = clamped * MAX_BOUNCE_ANGLE;

  ball.dx = ball.speed * Math.sin( angle );
  ball.dy = -ball.speed * Math.cos( angle );
  ball.y = paddle.y - ball.radius;
  playSound( ballBounceSound );
}

function endGame( screen ) {
  state.screen = screen;
  if ( state.score > state.highScore ) {
    state.highScore = state.score;
    saveHighScore( state.highScore );
  }
}

function checkWinCondition() {
  const allDestroyed = state.blocks.every( ( block ) => !block.alive );
  if ( allDestroyed ) endGame( 'win' );
}

function checkBlockCollision() {
  const ball = state.ball;

  for ( const block of state.blocks ) {
    if ( !block.alive ) continue;

    const withinX = ball.x + ball.radius >= block.x && ball.x - ball.radius <= block.x + block.width;
    const withinY = ball.y + ball.radius >= block.y && ball.y - ball.radius <= block.y + block.height;
    if ( !withinX || !withinY ) continue;

    block.alive = false;
    state.score += block.points;
    ball.dy = -ball.dy;
    state.explosions.push( {
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      color: block.color,
      startTime: performance.now(),
    } );
    playSound( breakSound );
    checkWinCondition();
    break;
  }
}

function updateExplosions() {
  state.explosions = state.explosions.filter(
    ( explosion ) => performance.now() - explosion.startTime < EXPLOSION_DURATION
  );
}

function checkBallLost() {
  const ball = state.ball;

  if ( ball.y - ball.radius > canvas.height ) {
    state.lives -= 1;
    resetBall();
    if ( state.lives <= 0 ) {
      state.lives = 0;
      endGame( 'gameover' );
    }
  }
}

function update() {
  if ( state.screen !== 'playing' ) return;

  updateExplosions();

  const paddle = state.paddle;

  if ( keys.left ) paddle.x -= paddle.speed;
  if ( keys.right ) paddle.x += paddle.speed;

  paddle.x = Math.max( 0, Math.min( canvas.width - paddle.width, paddle.x ) );

  const ball = state.ball;
  if ( ball.attached ) {
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

function loop() {
  update();
  draw();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => requestAnimationFrame( loop ) );
