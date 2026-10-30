const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const msgEl = document.getElementById("msg");

let score = 0;
let lives = 3;
let running = false;
let destroyedCount = 0; // Contador de tijolos destruídos

// Cores baseadas nas vidas restantes dos tijolos
const BRICK_COLORS = {
  1: "#facc15", // Amarelo (1 hit)
  2: "#a3e635", // Verde (2 hits)
  3: "#38bdf8", // Azul (3 hits)
  4: "#f472b6", // Rosa (4 hits)
  5: "#9ca3af"  // Cinza/Pedra (5 hits)
};

const paddle = {
  w: 75,
  h: 12,
  x: 202,
  y: 520,
  speed: 400
};

const ball = {
  x: 240,
  y: 505,
  r: 8,
  speed: 310, // Módulo da velocidade
  vx: 180,
  vy: -250,
  launched: false
};

let bricks = [];
const keys = {};

// Gera os tijolos misturados com espaços vazios
function buildBricks() {
  bricks = [];
  const cols = 9;
  const rows = 10;
  const brickW = 46;
  const brickH = 16;
  const gap = 4;
  const offsetX = 16;
  const offsetY = 30;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 20% de chance de deixar o espaço vazio
      if (Math.random() < 0.20) {
        continue;
      }

      // Sorteia a resistência de 1 a 5
      // 1: Amarelo, 2: Verde, 3: Azul, 4: Rosa, 5: Pedra
      const hits = Math.floor(Math.random() * 5) + 1;

      bricks.push({
        x: offsetX + c * (brickW + gap),
        y: offsetY + r * (brickH + gap),
        w: brickW,
        h: brickH,
        hits: hits,
        alive: true
      });
    }
  }
}

// Controles
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.code === "Space" && !ball.launched && lives > 0) {
    ball.launched = true;
    running = true;
    msgEl.innerText = "Use o mouse ou as setas para mover";
  }

  if (e.key.toLowerCase() === "r" && lives <= 0) {
    resetGame();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  paddle.x = e.clientX - rect.left - paddle.w / 2;
  clampPaddle();
});

function clampPaddle() {
  paddle.x = Math.max(8, Math.min(canvas.width - paddle.w - 8, paddle.x));
}

function resetBall() {
  ball.launched = false;
  ball.x = paddle.x + paddle.w / 2;
  ball.y = paddle.y - ball.r - 2;
  ball.speed = 310; // Restaura velocidade base
  ball.vx = 180 * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = -250;
  msgEl.innerText = "Aperte ESPAÇO para lançar a bola";
}

function resetGame() {
  score = 0;
  lives = 3;
  destroyedCount = 0;
  scoreEl.innerText = score;
  livesEl.innerText = lives;
  buildBricks();
  resetBall();
}

function update(dt) {
  // Movimento por teclado
  if (keys["arrowleft"] || keys["a"]) paddle.x -= paddle.speed * dt;
  if (keys["arrowright"] || keys["d"]) paddle.x += paddle.speed * dt;
  clampPaddle();

  // Bola acoplada à raquete
  if (!ball.launched) {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 2;
    return;
  }

  // Movimentação
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Bordas esquerda e direita
  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    ball.vx *= -1;
  } else if (ball.x + ball.r > canvas.width) {
    ball.x = canvas.width - ball.r;
    ball.vx *= -1;
  }

  // Borda superior
  if (ball.y - ball.r < 0) {
    ball.y = ball.r;
    ball.vy *= -1;
  }

  // Queda da bola
  if (ball.y > canvas.height) {
    lives--;
    livesEl.innerText = lives;
    if (lives <= 0) {
      running = false;
      msgEl.innerText = "Game Over! Pressione R para reiniciar";
      return;
    }
    resetBall();
  }

  // Colisão com a raquete
  if (
    ball.y + ball.r >= paddle.y &&
    ball.y - ball.r <= paddle.y + paddle.h &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.w &&
    ball.vy > 0
  ) {
    const hitPoint = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    ball.vx = hitPoint * (ball.speed * 0.85);
    // Mantém a velocidade vertical proporcional à velocidade total
    const remainingSpeed = Math.sqrt(Math.max(0, ball.speed * ball.speed - ball.vx * ball.vx));
    ball.vy = -Math.max(160, remainingSpeed);
  }

  // Colisão com os tijolos
  for (let b of bricks) {
    if (!b.alive) continue;

    if (
      ball.x + ball.r > b.x &&
      ball.x - ball.r < b.x + b.w &&
      ball.y + ball.r > b.y &&
      ball.y - ball.r < b.y + b.h
    ) {
      ball.vy *= -1;
      b.hits--;

      if (b.hits <= 0) {
        b.alive = false;
        score += 10;
        destroyedCount++;

        // A cada 10 tijolos quebrados, aumenta a velocidade em 15%
        if (destroyedCount % 10 === 0) {
          ball.speed *= 1.15;
          ball.vx *= 1.15;
          ball.vy *= 1.15;
        }
      } else {
        score += 5;
      }

      scoreEl.innerText = score;
      break;
    }
  }

  // Novo grid ao limpar os blocos
  if (bricks.every((b) => !b.alive)) {
    buildBricks();
    resetBall();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fundo
  ctx.fillStyle = "#fff8f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Desenhar tijolos
  for (let b of bricks) {
    if (!b.alive) continue;

    ctx.fillStyle = BRICK_COLORS[b.hits] || "#facc15";
    ctx.fillRect(b.x, b.y, b.w, b.h);

    // Linha de tijolos de pedra
    if (b.hits === 5) {
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
    }

    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }

  // Raquete
  ctx.fillStyle = "#e11d48";
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

  // Bola
  ctx.beginPath();
  ctx.fillStyle = "#ea580c";
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.stroke();
}

let lastTime = 0;
function loop(time) {
  if (!lastTime) lastTime = time;
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// Início
resetGame();
requestAnimationFrame(loop);