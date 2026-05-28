const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const speedEl = document.getElementById("speed");

const mainMenu = document.getElementById("mainMenu");
const gameOverMenu = document.getElementById("gameOverMenu");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const finalScoreEl = document.getElementById("finalScore");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

canvas.width = 480;
canvas.height = 800;

let gameRunning = false;
let animationId;

const road = {
  x: 80,
  width: 320,
  lineOffset: 0
};

const keys = {
  left: false,
  right: false
};

let particles = [];
let enemies = [];
let spawnTimer = 0;

const highScore = localStorage.getItem("turboHighScore") || 0;
highScoreEl.textContent = highScore;

class Particle {
  constructor(x, y, color, size, speedX, speedY, life) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.speedX = speedX;
    this.speedY = speedY;
    this.life = life;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;
  }

  draw() {
    ctx.globalAlpha = this.life / 40;
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}

class Car {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 90;
    this.speed = 7;
    this.color = color;
  }

  draw() {
    // Car Body
    ctx.fillStyle = this.color;
    roundRect(ctx, this.x, this.y, this.width, this.height, 10, true);

    // Windshield
    ctx.fillStyle = "#bdefff";
    roundRect(
      ctx,
      this.x + 10,
      this.y + 10,
      this.width - 20,
      18,
      6,
      true
    );

    // Rear Window
    roundRect(
      ctx,
      this.x + 10,
      this.y + 60,
      this.width - 20,
      15,
      6,
      true
    );

    // Tires
    ctx.fillStyle = "#111";

    ctx.fillRect(this.x - 5, this.y + 12, 6, 18);
    ctx.fillRect(this.x + this.width - 1, this.y + 12, 6, 18);

    ctx.fillRect(this.x - 5, this.y + 58, 6, 18);
    ctx.fillRect(this.x + this.width - 1, this.y + 58, 6, 18);

    // Lights
    ctx.fillStyle = "#ffe066";

    ctx.fillRect(this.x + 8, this.y + 4, 8, 6);
    ctx.fillRect(this.x + this.width - 16, this.y + 4, 8, 6);

    ctx.fillStyle = "#ff4040";

    ctx.fillRect(this.x + 8, this.y + this.height - 8, 8, 6);
    ctx.fillRect(this.x + this.width - 16, this.y + this.height - 8, 8, 6);
  }
}

class Player extends Car {
  constructor() {
    super(canvas.width / 2 - 25, 650, "#00ffd5");
    this.score = 0;
    this.distance = 0;
  }

  update() {
    if (keys.left) {
      this.x -= this.speed;
    }

    if (keys.right) {
      this.x += this.speed;
    }

    // Boundaries
    if (this.x < road.x + 10) {
      this.x = road.x + 10;
    }

    if (this.x + this.width > road.x + road.width - 10) {
      this.x = road.x + road.width - 10 - this.width;
    }

    // Smoke particles
    particles.push(
      new Particle(
        this.x + 15,
        this.y + this.height,
        "#888",
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 1.5,
        Math.random() * 2 + 1,
        40
      )
    );

    particles.push(
      new Particle(
        this.x + 35,
        this.y + this.height,
        "#888",
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 1.5,
        Math.random() * 2 + 1,
        40
      )
    );
  }
}

class Enemy extends Car {
  constructor(x, speed, color) {
    super(x, -120, color);
    this.speed = speed;
  }

  update() {
    this.y += this.speed;
  }
}

const player = new Player();

function resizeCanvas() {
  const ratio = canvas.width / canvas.height;

  let newWidth = window.innerWidth;
  let newHeight = window.innerHeight;

  if (newWidth / newHeight > ratio) {
    newWidth = newHeight * ratio;
  } else {
    newHeight = newWidth / ratio;
  }

  canvas.style.width = `${newWidth}px`;
  canvas.style.height = `${newHeight}px`;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawRoad() {
  ctx.fillStyle = "#2c2c2c";
  ctx.fillRect(road.x, 0, road.width, canvas.height);

  // Road borders
  ctx.fillStyle = "#ffffff";

  ctx.fillRect(road.x, 0, 6, canvas.height);
  ctx.fillRect(road.x + road.width - 6, 0, 6, canvas.height);

  // Middle lines
  road.lineOffset += gameSpeed;

  if (road.lineOffset > 80) {
    road.lineOffset = 0;
  }

  for (let y = -80; y < canvas.height; y += 80) {
    ctx.fillRect(
      canvas.width / 2 - 6,
      y + road.lineOffset,
      12,
      45
    );
  }
}

function spawnEnemy() {
  const laneWidth = road.width / 3;

  const lane = Math.floor(Math.random() * 3);

  const x =
    road.x +
    laneWidth * lane +
    laneWidth / 2 -
    25;

  const colors = [
    "#ff4040",
    "#ffd000",
    "#8e44ff",
    "#00a2ff",
    "#ff7b00"
  ];

  const speed = gameSpeed + Math.random() * 2 + 2;

  enemies.push(
    new Enemy(
      x,
      speed,
      colors[Math.floor(Math.random() * colors.length)]
    )
  );
}

function updateEnemies() {
  enemies.forEach((enemy, index) => {
    enemy.update();
    enemy.draw();

    if (enemy.y > canvas.height + 100) {
      enemies.splice(index, 1);
    }

    // Collision Detection
    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      createCrashEffect();
      gameOver();
    }
  });
}

function updateParticles() {
  particles.forEach((particle, index) => {
    particle.update();
    particle.draw();

    if (particle.life <= 0) {
      particles.splice(index, 1);
    }
  });
}

function createCrashEffect() {
  for (let i = 0; i < 80; i++) {
    particles.push(
      new Particle(
        player.x + player.width / 2,
        player.y + player.height / 2,
        i % 2 === 0 ? "#ff4040" : "#ffaa00",
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        50
      )
    );
  }
}

let gameSpeed = 4;

function updateDifficulty() {
  gameSpeed = 4 + player.score / 400;

  speedEl.textContent = gameSpeed.toFixed(1);
}

function updateScore() {
  player.score += Math.floor(gameSpeed);
  scoreEl.textContent = player.score;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRoad();

  player.update();
  player.draw();

  spawnTimer++;

  const spawnRate = Math.max(25, 70 - Math.floor(player.score / 300));

  if (spawnTimer >= spawnRate) {
    spawnEnemy();
    spawnTimer = 0;
  }

  updateEnemies();
  updateParticles();

  updateScore();
  updateDifficulty();

  animationId = requestAnimationFrame(gameLoop);
}

function resetGame() {
  enemies = [];
  particles = [];

  player.x = canvas.width / 2 - 25;
  player.score = 0;

  gameSpeed = 4;
  spawnTimer = 0;

  scoreEl.textContent = "0";
  speedEl.textContent = "1";
}

function startGame() {
  resetGame();

  mainMenu.classList.remove("active");
  gameOverMenu.classList.remove("active");

  gameRunning = true;

  cancelAnimationFrame(animationId);
  gameLoop();
}

function gameOver() {
  gameRunning = false;

  cancelAnimationFrame(animationId);

  finalScoreEl.textContent = player.score;

  if (player.score > highScore) {
    localStorage.setItem("turboHighScore", player.score);
    highScoreEl.textContent = player.score;
  }

  gameOverMenu.classList.add("active");
}

function roundRect(ctx, x, y, width, height, radius, fill) {
  ctx.beginPath();

  ctx.moveTo(x + radius, y);

  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);

  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );

  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);

  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);

  ctx.closePath();

  if (fill) {
    ctx.fill();
  }
}

/* Keyboard Controls */
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
    keys.left = true;
  }

  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
    keys.right = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
    keys.left = false;
  }

  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
    keys.right = false;
  }
});

/* Mobile Buttons */
leftBtn.addEventListener("touchstart", () => {
  keys.left = true;
});

leftBtn.addEventListener("touchend", () => {
  keys.left = false;
});

rightBtn.addEventListener("touchstart", () => {
  keys.right = true;
});

rightBtn.addEventListener("touchend", () => {
  keys.right = false;
});

/* Touch Drag Support */
canvas.addEventListener("touchmove", (e) => {
  if (!gameRunning) return;

  const rect = canvas.getBoundingClientRect();

  const touchX = e.touches[0].clientX - rect.left;

  const scaleX = canvas.width / rect.width;

  player.x = touchX * scaleX - player.width / 2;
});

/* Buttons */
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
