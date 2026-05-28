const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const speedEl = document.getElementById("speed");

const mainMenu = document.getElementById("mainMenu");
const gameOverMenu = document.getElementById("gameOverMenu");

const finalScoreEl = document.getElementById("finalScore");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

const ROAD_LEFT = 60;
const ROAD_RIGHT = GAME_WIDTH - 60;

let animationId;

class InputHandler {
  constructor() {
    this.keys = {};

    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  left() {
    return this.keys["arrowleft"] || this.keys["a"];
  }

  right() {
    return this.keys["arrowright"] || this.keys["d"];
  }
}

class Particle {
  constructor(x, y, color, velocityX, velocityY, size, life) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.size = size;
    this.life = life;
    this.maxLife = life;
  }

  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.life--;
  }

  draw() {
    ctx.save();

    ctx.globalAlpha = this.life / this.maxLife;

    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class PlayerCar {
  constructor() {
    this.width = 48;
    this.height = 90;

    this.x = GAME_WIDTH / 2 - this.width / 2;
    this.y = GAME_HEIGHT - 140;

    this.speed = 7;
  }

  update(input) {
    if (input.left()) {
      this.x -= this.speed;
      createSmoke(this.x + this.width / 2, this.y + this.height);
    }

    if (input.right()) {
      this.x += this.speed;
      createSmoke(this.x + this.width / 2, this.y + this.height);
    }

    if (this.x < ROAD_LEFT + 10) {
      this.x = ROAD_LEFT + 10;
    }

    if (this.x + this.width > ROAD_RIGHT - 10) {
      this.x = ROAD_RIGHT - 10 - this.width;
    }
  }

  draw() {
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(this.x + 4, this.y + 6, this.width, this.height);

    // Main Body
    ctx.fillStyle = "#00d9ff";
    roundRect(this.x, this.y, this.width, this.height, 12);

    // Windshield
    ctx.fillStyle = "#dff6ff";
    roundRect(this.x + 8, this.y + 12, this.width - 16, 20, 6);

    // Roof
    ctx.fillStyle = "#0b2030";
    roundRect(this.x + 10, this.y + 34, this.width - 20, 28, 6);

    // Lights
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.x + 8, this.y + 6, 8, 8);
    ctx.fillRect(this.x + this.width - 16, this.y + 6, 8, 8);

    ctx.fillStyle = "#ff4040";
    ctx.fillRect(this.x + 8, this.y + this.height - 12, 8, 8);
    ctx.fillRect(this.x + this.width - 16, this.y + this.height - 12, 8, 8);
  }
}

class EnemyCar {
  constructor(speedMultiplier) {
    this.width = 46;
    this.height = 84;

    this.x =
      ROAD_LEFT +
      15 +
      Math.random() * (ROAD_RIGHT - ROAD_LEFT - this.width - 30);

    this.y = -120;

    this.speed = 4 + Math.random() * 4 + speedMultiplier;

    this.color = randomCarColor();
  }

  update() {
    this.y += this.speed;
  }

  draw() {
    ctx.fillStyle = this.color;
    roundRect(this.x, this.y, this.width, this.height, 12);

    ctx.fillStyle = "#ffffff";
    roundRect(this.x + 7, this.y + 10, this.width - 14, 18, 6);

    ctx.fillStyle = "#1d1d1d";
    roundRect(this.x + 10, this.y + 32, this.width - 20, 24, 6);

    ctx.fillStyle = "#ff5757";
    ctx.fillRect(this.x + 7, this.y + this.height - 12, 8, 8);
    ctx.fillRect(this.x + this.width - 15, this.y + this.height - 12, 8, 8);
  }
}

class Obstacle {
  constructor(speedMultiplier) {
    this.width = 60;
    this.height = 22;

    this.x =
      ROAD_LEFT +
      10 +
      Math.random() * (ROAD_RIGHT - ROAD_LEFT - this.width - 20);

    this.y = -40;

    this.speed = 5 + speedMultiplier;

    this.color = "#f59e0b";
  }

  update() {
    this.y += this.speed;
  }

  draw() {
    ctx.fillStyle = this.color;
    roundRect(this.x, this.y, this.width, this.height, 8);

    ctx.fillStyle = "#111";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(this.x + 8 + i * 10, this.y + 4, 4, 14);
    }
  }
}

class Game {
  constructor() {
    this.input = new InputHandler();
    this.player = new PlayerCar();

    this.enemyCars = [];
    this.obstacles = [];
    this.particles = [];

    this.score = 0;
    this.highScore = localStorage.getItem("velocityRushHighScore") || 0;

    this.gameSpeed = 6;

    this.spawnTimer = 0;
    this.spawnInterval = 70;

    this.roadOffset = 0;

    this.running = false;

    highScoreEl.textContent = this.highScore;
  }

  start() {
    this.reset();

    this.running = true;

    mainMenu.classList.remove("active");
    gameOverMenu.classList.remove("active");

    this.loop();
  }

  reset() {
    this.player = new PlayerCar();

    this.enemyCars = [];
    this.obstacles = [];
    this.particles = [];

    this.score = 0;
    this.gameSpeed = 6;

    this.spawnInterval = 70;
    this.spawnTimer = 0;
  }

  gameOver() {
    this.running = false;

    cancelAnimationFrame(animationId);

    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);

      localStorage.setItem(
        "velocityRushHighScore",
        this.highScore
      );

      highScoreEl.textContent = this.highScore;
    }

    createExplosion(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2
    );

    finalScoreEl.textContent = Math.floor(this.score);

    setTimeout(() => {
      gameOverMenu.classList.add("active");
    }, 600);
  }

  update() {
    this.player.update(this.input);

    this.roadOffset += this.gameSpeed;

    this.score += 0.12;

    // Difficulty Scaling
    this.gameSpeed = 6 + this.score / 120;

    this.spawnInterval = Math.max(
      24,
      70 - this.score / 25
    );

    this.spawnTimer++;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnEntities();
      this.spawnTimer = 0;
    }

    this.enemyCars.forEach((enemy, index) => {
      enemy.update();

      if (checkCollision(this.player, enemy)) {
        this.gameOver();
      }

      if (enemy.y > GAME_HEIGHT + 120) {
        this.enemyCars.splice(index, 1);
      }
    });

    this.obstacles.forEach((obstacle, index) => {
      obstacle.update();

      if (checkCollision(this.player, obstacle)) {
        this.gameOver();
      }

      if (obstacle.y > GAME_HEIGHT + 100) {
        this.obstacles.splice(index, 1);
      }
    });

    this.particles.forEach((particle, index) => {
      particle.update();

      if (particle.life <= 0) {
        this.particles.splice(index, 1);
      }
    });

    scoreEl.textContent = Math.floor(this.score);
    speedEl.textContent = this.gameSpeed.toFixed(1);
  }

  drawRoad() {
    // Grass
    ctx.fillStyle = "#0a4725";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Road
    ctx.fillStyle = "#242833";
    ctx.fillRect(
      ROAD_LEFT,
      0,
      ROAD_RIGHT - ROAD_LEFT,
      GAME_HEIGHT
    );

    // Road Borders
    ctx.fillStyle = "#ffef5a";

    ctx.fillRect(ROAD_LEFT - 6, 0, 6, GAME_HEIGHT);
    ctx.fillRect(ROAD_RIGHT, 0, 6, GAME_HEIGHT);

    // Lane Strips
    ctx.fillStyle = "#ffffff";

    const laneX = GAME_WIDTH / 2 - 4;
    const stripHeight = 45;
    const gap = 28;

    for (let y = -60; y < GAME_HEIGHT + 60; y += stripHeight + gap) {
      ctx.fillRect(
        laneX,
        y + (this.roadOffset % (stripHeight + gap)),
        8,
        stripHeight
      );
    }
  }

  draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.drawRoad();

    this.player.draw();

    this.enemyCars.forEach((enemy) => enemy.draw());

    this.obstacles.forEach((obstacle) => obstacle.draw());

    this.particles.forEach((particle) => particle.draw());
  }

  spawnEntities() {
    const chance = Math.random();

    if (chance < 0.72) {
      this.enemyCars.push(
        new EnemyCar(this.gameSpeed * 0.25)
      );
    } else {
      this.obstacles.push(
        new Obstacle(this.gameSpeed * 0.2)
      );
    }
  }

  loop() {
    if (!this.running) return;

    this.update();
    this.draw();

    animationId = requestAnimationFrame(() => this.loop());
  }
}

const game = new Game();

function randomCarColor() {
  const colors = [
    "#ff375f",
    "#ffcc00",
    "#7c4dff",
    "#22c55e",
    "#ff7a00",
    "#ffffff"
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function roundRect(x, y, width, height, radius) {
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

  ctx.fill();
}

function createSmoke(x, y) {
  if (Math.random() > 0.35) return;

  game.particles.push(
    new Particle(
      x + (Math.random() - 0.5) * 20,
      y,
      "rgba(220,220,220,0.8)",
      (Math.random() - 0.5) * 1.2,
      Math.random() * 1.5,
      2 + Math.random() * 4,
      22
    )
  );
}

function createExplosion(x, y) {
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6;

    game.particles.push(
      new Particle(
        x,
        y,
        Math.random() > 0.5 ? "#ff6600" : "#ffcc00",
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        2 + Math.random() * 5,
        45 + Math.random() * 30
      )
    );
  }
}

startBtn.addEventListener("click", () => {
  game.start();
});

restartBtn.addEventListener("click", () => {
  game.start();
});

function renderStartScreenBackground() {
  game.draw();
  requestAnimationFrame(renderStartScreenBackground);
}

renderStartScreenBackground();
