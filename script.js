const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;

let snake, direction, food, score, game, speed;
let obstacles = [];
let level = 1;
let particles = [];
let powerUps = [];
let isPaused = false;
let invincible = false;
let speedBoost = false;
let magnetMode = false;
let waitingForStart = false;
let gameStarted = false;

const eatSound = document.getElementById("eatSound");
const gameOverSound = document.getElementById("gameOverSound");

// HIGH SCORE
let highScore = localStorage.getItem("highScore") || 0;
document.getElementById("highScore").textContent = highScore;

// INIT GAME
function initGame() {
  snake = [{ x: 200, y: 200 }];
  direction = "RIGHT";
  food = randomFood();
  score = 0;
  speed = 150;
  level = 1;
  particles = [];
  powerUps = [];
  isPaused = false;
  invincible = false;
  speedBoost = false;
  magnetMode = false;
  waitingForStart = true;
  gameStarted = false;

  generateObstacles();
  generatePowerUps();

  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
  document.getElementById("gameOverScreen").classList.add("hidden");

  clearInterval(game);
  game = setInterval(draw, speed);
}

// RANDOM FOOD
function randomFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * 20) * box,
      y: Math.floor(Math.random() * 20) * box,
      type: Math.random() < 0.1 ? "golden" : "normal"
    };
  } while (isOccupied(newFood.x, newFood.y));
  return newFood;
}

// GENERATE POWER-UPS
function generatePowerUps() {
  powerUps = [];
  if (Math.random() < 0.3) {
    let types = ["speed", "invincible", "magnet", "points"];
    let type = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
      x: Math.floor(Math.random() * 20) * box,
      y: Math.floor(Math.random() * 20) * box,
      type: type,
      duration: 5000
    });
  }
}

// CHECK IF POSITION IS OCCUPIED
function isOccupied(x, y) {
  if (snake.some(s => s.x === x && s.y === y)) return true;
  if (obstacles.some(o => o.x === x && o.y === y)) return true;
  if (powerUps.some(p => p.x === x && p.y === y)) return true;
  return false;
}

// CREATE PARTICLE EFFECT
function createParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + box / 2,
      y: y + box / 2,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color: color,
      life: 1.0,
      size: Math.random() * 4 + 2
    });
  }
}

// UPDATE PARTICLES
function updateParticles() {
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
    p.vy += 0.1;
    return p.life > 0;
  });
}

// DRAW PARTICLES
function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

// GENERATE OBSTACLES
function generateObstacles() {
  obstacles = [];
  for (let i = 0; i < level + 2; i++) {
    obstacles.push({
      x: Math.floor(Math.random() * 20) * box,
      y: Math.floor(Math.random() * 20) * box
    });
  }
}

// KEYBOARD CONTROLS
document.addEventListener("keydown", e => {
  if (waitingForStart && (e.key.startsWith("Arrow"))) {
    e.preventDefault();
    waitingForStart = false;
    gameStarted = true;
  }
  
  if (!waitingForStart && gameStarted) {
    if (e.key === "ArrowUp" && direction !== "DOWN") {
      e.preventDefault();
      direction = "UP";
    }
    if (e.key === "ArrowDown" && direction !== "UP") {
      e.preventDefault();
      direction = "DOWN";
    }
    if (e.key === "ArrowLeft" && direction !== "RIGHT") {
      e.preventDefault();
      direction = "LEFT";
    }
    if (e.key === "ArrowRight" && direction !== "LEFT") {
      e.preventDefault();
      direction = "RIGHT";
    }
  }
  
  if (e.key === " " || e.key === "p") {
    e.preventDefault();
    togglePause();
  }
});

// MOBILE SWIPE
let startX, startY;

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});

document.addEventListener("touchend", e => {
  let dx = e.changedTouches[0].clientX - startX;
  let dy = e.changedTouches[0].clientY - startY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && direction !== "LEFT") direction = "RIGHT";
    else if (dx < 0 && direction !== "RIGHT") direction = "LEFT";
  } else {
    if (dy > 0 && direction !== "UP") direction = "DOWN";
    else if (dy < 0 && direction !== "DOWN") direction = "UP";
  }
});

// DRAW
function draw() {
  if (isPaused) return;
  
  // Update power-up indicators
  updatePowerUpIndicators();
  
  // Clear canvas with gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1e3c72');
  gradient.addColorStop(1, '#2a5298');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Show waiting message
  if (waitingForStart) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press any arrow key to start!', canvas.width/2, canvas.height/2 - 20);
    ctx.font = '16px Arial';
    ctx.fillText('Use arrow keys or buttons to control', canvas.width/2, canvas.height/2 + 10);
    return;
  }

  // Draw grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 20; i++) {
    ctx.beginPath();
    ctx.moveTo(i * box, 0);
    ctx.lineTo(i * box, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * box);
    ctx.lineTo(canvas.width, i * box);
    ctx.stroke();
  }

  // Draw snake with gradient
  snake.forEach((segment, index) => {
    const gradient = ctx.createRadialGradient(
      segment.x + box/2, segment.y + box/2, 0,
      segment.x + box/2, segment.y + box/2, box/2
    );
    
    if (invincible) {
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(1, '#FFA500');
    } else if (speedBoost) {
      gradient.addColorStop(0, '#00FFFF');
      gradient.addColorStop(1, '#0088FF');
    } else if (magnetMode) {
      gradient.addColorStop(0, '#FF00FF');
      gradient.addColorStop(1, '#AA00AA');
    } else {
      gradient.addColorStop(0, '#00FF00');
      gradient.addColorStop(1, '#008800');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(segment.x + 2, segment.y + 2, box - 4, box - 4);
    
    // Draw eyes on head
    if (index === 0) {
      ctx.fillStyle = 'white';
      let eyeX1, eyeY1, eyeX2, eyeY2;
      
      if (direction === "RIGHT") {
        eyeX1 = segment.x + box - 8; eyeY1 = segment.y + 6;
        eyeX2 = segment.x + box - 8; eyeY2 = segment.y + box - 6;
      } else if (direction === "LEFT") {
        eyeX1 = segment.x + 8; eyeY1 = segment.y + 6;
        eyeX2 = segment.x + 8; eyeY2 = segment.y + box - 6;
      } else if (direction === "UP") {
        eyeX1 = segment.x + 6; eyeY1 = segment.y + 8;
        eyeX2 = segment.x + box - 6; eyeY2 = segment.y + 8;
      } else {
        eyeX1 = segment.x + 6; eyeY1 = segment.y + box - 8;
        eyeX2 = segment.x + box - 6; eyeY2 = segment.y + box - 8;
      }
      
      ctx.fillRect(eyeX1, eyeY1, 4, 4);
      ctx.fillRect(eyeX2, eyeY2, 4, 4);
    }
  });

  // Draw food with animation
  const foodPulse = Math.sin(Date.now() * 0.005) * 2;
  if (food.type === "golden") {
    const foodGradient = ctx.createRadialGradient(
      food.x + box/2, food.y + box/2, 0,
      food.x + box/2, food.y + box/2, box/2
    );
    foodGradient.addColorStop(0, '#FFD700');
    foodGradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = foodGradient;
  } else {
    ctx.fillStyle = '#FF4444';
  }
  ctx.fillRect(food.x - foodPulse/2, food.y - foodPulse/2, box + foodPulse, box + foodPulse);

  // Draw power-ups
  powerUps.forEach(powerUp => {
    const powerGradient = ctx.createRadialGradient(
      powerUp.x + box/2, powerUp.y + box/2, 0,
      powerUp.x + box/2, powerUp.y + box/2, box/2
    );
    
    switch(powerUp.type) {
      case "speed":
        powerGradient.addColorStop(0, '#00FFFF');
        powerGradient.addColorStop(1, '#0088FF');
        break;
      case "invincible":
        powerGradient.addColorStop(0, '#FFD700');
        powerGradient.addColorStop(1, '#FFA500');
        break;
      case "magnet":
        powerGradient.addColorStop(0, '#FF00FF');
        powerGradient.addColorStop(1, '#AA00AA');
        break;
      case "points":
        powerGradient.addColorStop(0, '#00FF00');
        powerGradient.addColorStop(1, '#00AA00');
        break;
    }
    
    ctx.fillStyle = powerGradient;
    ctx.beginPath();
    ctx.arc(powerUp.x + box/2, powerUp.y + box/2, box/2 - 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw obstacles
  obstacles.forEach(o => {
    const obstacleGradient = ctx.createRadialGradient(
      o.x + box/2, o.y + box/2, 0,
      o.x + box/2, o.y + box/2, box/2
    );
    obstacleGradient.addColorStop(0, '#FF0066');
    obstacleGradient.addColorStop(1, '#660033');
    ctx.fillStyle = obstacleGradient;
    ctx.fillRect(o.x + 2, o.y + 2, box - 4, box - 4);
  });

  // Update and draw particles
  updateParticles();
  drawParticles();

  let headX = snake[0].x;
  let headY = snake[0].y;

  if (direction === "UP") headY -= box;
  if (direction === "DOWN") headY += box;
  if (direction === "LEFT") headX -= box;
  if (direction === "RIGHT") headX += box;

  // Don't move snake if waiting for start
  if (waitingForStart || !gameStarted) {
    return;
  }

  // CHECK POWER-UP COLLISION
  powerUps = powerUps.filter(powerUp => {
    if (headX === powerUp.x && headY === powerUp.y) {
      activatePowerUp(powerUp.type);
      createParticles(powerUp.x, powerUp.y, '#FFD700', 20);
      eatSound.play();
      return false;
    }
    return true;
  });

  // MAGNET MODE - PULL FOOD
  if (magnetMode && Math.abs(headX - food.x) <= box * 3 && Math.abs(headY - food.y) <= box * 3) {
    const dx = headX > food.x ? box : -box;
    const dy = headY > food.y ? box : -box;
    
    if (Math.abs(headX - food.x) > Math.abs(headY - food.y)) {
      food.x += dx;
    } else {
      food.y += dy;
    }
  }

  // EAT FOOD
  if (headX === food.x && headY === food.y) {
    const points = food.type === "golden" ? 5 : 1;
    const growthAmount = food.type === "golden" ? 3 : 2;
    score += points;
    document.getElementById("score").textContent = score;
    food = randomFood();
    createParticles(food.x, food.y, food.type === "golden" ? '#FFD700' : '#FF4444', 15);
    eatSound.play();

    // GROW SNAKE - Don't pop tail for multiple segments
    for (let i = 0; i < growthAmount - 1; i++) {
      snake.push({...snake[snake.length - 1]});
    }

    // GENERATE NEW POWER-UPS
    if (Math.random() < 0.2) {
      generatePowerUps();
    }

    // LEVEL UP
    if (score % 5 === 0) {
      level++;
      document.getElementById("level").textContent = level;
      generateObstacles();
      
      const newSpeed = speedBoost ? Math.max(30, speed - 15) : Math.max(50, speed - 10);
      speed = newSpeed;
      clearInterval(game);
      game = setInterval(draw, speed);
    }

  } else {
    snake.pop();
  }

  let newHead = { x: headX, y: headY };

  // GAME OVER
  if (
    (!invincible && (
      headX < 0 ||
      headY < 0 ||
      headX >= canvas.width ||
      headY >= canvas.height ||
      collision(newHead, snake) ||
      obstacles.some(o => o.x === headX && o.y === headY)
    ))
  ) {
    createParticles(headX, headY, '#FF0000', 30);
    endGame();
    return;
  }

  snake.unshift(newHead);
}

// COLLISION
function collision(head, body) {
  return body.some(p => p.x === head.x && p.y === head.y);
}

// END GAME
function endGame() {
  clearInterval(game);
  gameOverSound.play();

  document.getElementById("gameOverScreen").classList.remove("hidden");
  document.getElementById("finalScore").textContent = "Score: " + score;

  // SAVE HIGH SCORE
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    document.getElementById("highScore").textContent = highScore;
  }

  saveScore(score);
}

// LEADERBOARD
function saveScore(score) {
  let scores = JSON.parse(localStorage.getItem("leaderboard")) || [];

  scores.push(score);
  scores.sort((a, b) => b - a);
  scores = scores.slice(0, 5);

  localStorage.setItem("leaderboard", JSON.stringify(scores));
  displayLeaderboard();
}

function displayLeaderboard() {
  let scores = JSON.parse(localStorage.getItem("leaderboard")) || [];
  let list = document.getElementById("leaderboard");

  list.innerHTML = "";

  scores.forEach((s, i) => {
    let li = document.createElement("li");
    li.textContent = `#${i + 1} - ${s}`;
    list.appendChild(li);
  });
}

// ACTIVATE POWER-UP
function activatePowerUp(type) {
  switch(type) {
    case "speed":
      speedBoost = true;
      updatePowerUpIndicators();
      setTimeout(() => {
        speedBoost = false;
        updatePowerUpIndicators();
        const normalSpeed = Math.max(50, 150 - (level - 1) * 10);
        clearInterval(game);
        game = setInterval(draw, normalSpeed);
      }, 5000);
      
      const boostSpeed = Math.max(30, speed - 20);
      clearInterval(game);
      game = setInterval(draw, boostSpeed);
      break;
      
    case "invincible":
      invincible = true;
      updatePowerUpIndicators();
      setTimeout(() => {
        invincible = false;
        updatePowerUpIndicators();
      }, 5000);
      break;
      
    case "magnet":
      magnetMode = true;
      updatePowerUpIndicators();
      setTimeout(() => {
        magnetMode = false;
        updatePowerUpIndicators();
      }, 5000);
      break;
      
    case "points":
      score += 3;
      document.getElementById("score").textContent = score;
      createParticles(canvas.width/2, canvas.height/2, '#00FF00', 25);
      break;
  }
}

// TOGGLE PAUSE
function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
    ctx.font = '16px Arial';
    ctx.fillText('Press SPACE or P to continue', canvas.width/2, canvas.height/2 + 30);
  }
}

// BUTTONS
document.getElementById("startBtn").addEventListener("click", initGame);
document.getElementById("pauseBtn").addEventListener("click", togglePause);
document.getElementById("restartBtn").addEventListener("click", initGame);

// MOBILE CONTROLS
document.getElementById("upBtn").addEventListener("click", () => {
  if (waitingForStart) {
    waitingForStart = false;
    gameStarted = true;
  }
  if (!waitingForStart && gameStarted && direction !== "DOWN") direction = "UP";
});

document.getElementById("downBtn").addEventListener("click", () => {
  if (waitingForStart) {
    waitingForStart = false;
    gameStarted = true;
  }
  if (!waitingForStart && gameStarted && direction !== "UP") direction = "DOWN";
});

document.getElementById("leftBtn").addEventListener("click", () => {
  if (waitingForStart) {
    waitingForStart = false;
    gameStarted = true;
  }
  if (!waitingForStart && gameStarted && direction !== "RIGHT") direction = "LEFT";
});

document.getElementById("rightBtn").addEventListener("click", () => {
  if (waitingForStart) {
    waitingForStart = false;
    gameStarted = true;
  }
  if (!waitingForStart && gameStarted && direction !== "LEFT") direction = "RIGHT";
});

// UPDATE POWER-UP INDICATORS
function updatePowerUpIndicators() {
  document.getElementById("speedIndicator").classList.toggle("active", speedBoost);
  document.getElementById("invincibleIndicator").classList.toggle("active", invincible);
  document.getElementById("magnetIndicator").classList.toggle("active", magnetMode);
}

function restartGame() {
  initGame();
}

// LOAD leaderboard on page load
displayLeaderboard();