const gameArea = document.getElementById("gameArea");
  let roadLines = document.querySelectorAll(".road-line");

  roadLines.forEach(line => {
    if(line.y >= 700) {
      line.y -= 750;
    }

    line.y += game.speed;
    line.style.top = line.y + "px";
  });
}

function moveEnemies(playerRect) {
  let enemies = document.querySelectorAll(".enemy-car");

  enemies.forEach(enemy => {
    let enemyRect = enemy.getBoundingClientRect();

    if(isCollide(playerRect, enemyRect)) {
      endGame();
    }

    if(enemy.y >= 750) {
      enemy.y = -300;
      enemy.style.left = Math.floor(Math.random() * 350) + "px";
    }

    enemy.y += game.speed;
    enemy.style.top = enemy.y + "px";
  });
}

function isCollide(a, b) {
  return !(
    a.bottom < b.top ||
    a.top > b.bottom ||
    a.right < b.left ||
    a.left > b.right
  );
}

function playGame() {
  if(!game.running) return;

  let playerRect = playerCar.getBoundingClientRect();

  moveRoadLines();
  moveEnemies(playerRect);

  let playerLeft = parseInt(playerCar.style.left);

  if(keys.ArrowLeft && playerLeft > 0) {
    playerCar.style.left = playerLeft - game.speed + "px";
  }

  if(keys.ArrowRight && playerLeft < 340) {
    playerCar.style.left = playerLeft + game.speed + "px";
  }

  game.score++;
  scoreElement.innerText = game.score;

  if(game.score % 500 === 0) {
    game.speed += 1;
  }

  requestAnimationFrame(playGame);
}

function endGame() {
  game.running = false;

  startScreen.style.display = "block";
  startScreen.innerHTML = `
    <h1>Game Over</h1>
    <p>Your Score: ${game.score}</p>
    <button onclick="location.reload()">Restart</button>
  `;
}
