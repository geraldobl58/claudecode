(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function wrap(obj) {
    if (obj.x < 0) obj.x += canvas.width;
    if (obj.x > canvas.width) obj.x -= canvas.width;
    if (obj.y < 0) obj.y += canvas.height;
    if (obj.y > canvas.height) obj.y -= canvas.height;
  }

  function distance(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
  }

  const keys = {};
  const CONTROL_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space']);

  window.addEventListener('keydown', (e) => {
    if (CONTROL_KEYS.has(e.code)) e.preventDefault();
    keys[e.code] = true;
    if (e.code === 'Enter' && state.gameOver && !e.repeat) {
      resetGame();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  const ARCADE_FONT = '"Press Start 2P", monospace';
  document.fonts.load(`16px ${ARCADE_FONT}`);

  const SHIP_SIZE = 18;
  const SHIP_TURN_SPEED = Math.PI * 1.6;
  const SHIP_THRUST = 260;
  const FRICTION = 0.99;
  const SHIP_INVULNERABLE_TIME = 3;

  const BULLET_SPEED = 480;
  const BULLET_LIFE = 1.1;
  const BULLET_COOLDOWN = 0.25;
  const BULLET_SPREAD_ANGLE = Math.PI / 18;

  const ASTEROID_SIZES = { large: 55, medium: 32, small: 16 };
  const ASTEROID_SPEED = { large: 40, medium: 65, small: 100 };
  const ASTEROID_POINTS = { large: 20, medium: 50, small: 100 };

  let ship, bullets, asteroids, state;

  function createShip() {
    return {
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      thrusting: false,
      invulnerable: SHIP_INVULNERABLE_TIME,
      shootCooldown: 0,
    };
  }

  function createAsteroid(size, x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = ASTEROID_SPEED[size] * (0.5 + Math.random() * 0.5);
    const vertexCount = 10 + Math.floor(Math.random() * 4);
    const offsets = [];
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
      offsets,
    };
  }

  function randomEdgePosition() {
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0: return { x: Math.random() * canvas.width, y: 0 };
      case 1: return { x: canvas.width, y: Math.random() * canvas.height };
      case 2: return { x: Math.random() * canvas.width, y: canvas.height };
      default: return { x: 0, y: Math.random() * canvas.height };
    }
  }

  function spawnWave() {
    const count = 3 + state.wave;
    asteroids = [];
    for (let i = 0; i < count; i++) {
      const pos = randomEdgePosition();
      asteroids.push(createAsteroid('large', pos.x, pos.y));
    }
  }

  function resetGame() {
    ship = createShip();
    bullets = [];
    state = {
      score: 0,
      lives: 3,
      wave: 1,
      elapsed: 0,
      gameOver: false,
    };
    spawnWave();
  }

  function splitAsteroid(a) {
    state.score += ASTEROID_POINTS[a.size];
    if (a.size === 'large') {
      asteroids.push(createAsteroid('medium', a.x, a.y));
      asteroids.push(createAsteroid('medium', a.x, a.y));
    } else if (a.size === 'medium') {
      asteroids.push(createAsteroid('small', a.x, a.y));
      asteroids.push(createAsteroid('small', a.x, a.y));
    }
  }

  function shootBullet() {
    const noseX = ship.x + Math.cos(ship.angle) * SHIP_SIZE;
    const noseY = ship.y + Math.sin(ship.angle) * SHIP_SIZE;
    for (const spread of [-BULLET_SPREAD_ANGLE, 0, BULLET_SPREAD_ANGLE]) {
      const angle = ship.angle + spread;
      bullets.push({
        x: noseX,
        y: noseY,
        vx: Math.cos(angle) * BULLET_SPEED + ship.vx,
        vy: Math.sin(angle) * BULLET_SPEED + ship.vy,
        life: BULLET_LIFE,
      });
    }
  }

  function respawnShip() {
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = -Math.PI / 2;
    ship.invulnerable = SHIP_INVULNERABLE_TIME;
  }

  function update(dt) {
    if (state.gameOver) return;

    state.elapsed += dt;

    if (keys['ArrowLeft']) ship.angle -= SHIP_TURN_SPEED * dt;
    if (keys['ArrowRight']) ship.angle += SHIP_TURN_SPEED * dt;

    ship.thrusting = !!keys['ArrowUp'];
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

    if (keys['Space'] && ship.shootCooldown <= 0) {
      shootBullet();
      ship.shootCooldown = BULLET_COOLDOWN;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      wrap(b);
      b.life -= dt;
      if (b.life <= 0) bullets.splice(i, 1);
    }

    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.angle += a.spin * dt;
      wrap(a);
    }

    outer:
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (distance(a.x, a.y, b.x, b.y) < a.radius) {
          bullets.splice(j, 1);
          asteroids.splice(i, 1);
          splitAsteroid(a);
          continue outer;
        }
      }
    }

    if (ship.invulnerable <= 0) {
      for (const a of asteroids) {
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

    if (asteroids.length === 0) {
      state.wave++;
      spawnWave();
    }
  }

  function drawShip() {
    if (ship.invulnerable > 0 && Math.floor(ship.invulnerable * 10) % 2 === 0) {
      return;
    }
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE * 0.6);
    ctx.lineTo(-SHIP_SIZE * 0.4, 0);
    ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_SIZE * 0.6);
    ctx.closePath();
    ctx.stroke();

    if (ship.thrusting) {
      ctx.strokeStyle = '#f80';
      ctx.beginPath();
      ctx.moveTo(-SHIP_SIZE * 0.4, 0);
      ctx.lineTo(-SHIP_SIZE * 1.1, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const count = a.offsets.length;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const r = a.radius * a.offsets[i];
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawBullet(b) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `TIME ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function drawLifeIcon(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, size * 0.6);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size * 0.7, -size * 0.6);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.font = `14px ${ARCADE_FONT}`;
    ctx.fillText(`SCORE ${state.score}`, 16, 28);
    ctx.fillText(`WAVE ${state.wave}`, 16, 54);
    ctx.fillText(formatTime(state.elapsed), 16, 80);

    const iconSize = 8;
    const iconSpacing = 22;
    for (let i = 0; i < state.lives; i++) {
      drawLifeIcon(24 + i * iconSpacing, 102, iconSize);
    }
  }

  function drawGameOver() {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `28px ${ARCADE_FONT}`;
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = `12px ${ARCADE_FONT}`;
    ctx.fillText(`Pontuação final: ${state.score}`, canvas.width / 2, canvas.height / 2 + 24);
    ctx.fillText('Pressione ENTER para reiniciar', canvas.width / 2, canvas.height / 2 + 54);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawShip();
    for (const a of asteroids) drawAsteroid(a);
    for (const b of bullets) drawBullet(b);
    drawHUD();
    if (state.gameOver) drawGameOver();
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  resetGame();
  requestAnimationFrame(loop);
})();
