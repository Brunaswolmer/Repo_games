const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pontosElement = document.getElementById('pontos');
const vidasElement = document.getElementById('vidas');
const ondasElement = document.getElementById('ondas');

const KEYS = {};

window.addEventListener('keydown', (e) => {
    const key = e.key.toLocaleLowerCase();
    KEYS[key] = true;

    if ([" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) {
        e.preventDefault();
    }
    if (key === "p" && !gameOver) {
        pausa = !pausa;
    }
    if (key === "r" && gameOver) {
        startGame();
    }
});

window.addEventListener('keyup', (e) => {
    KEYS[e.key.toLocaleLowerCase()] = false;
});

function aabb(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

// Estrelas do fundo
class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 1.5 + 0.5;
        this.speed = Math.random() * 40 + 15;
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Nave com asas, cabine e propulsor
class Player {
    constructor() {
        this.w = 40;
        this.h = 38;
        this.x = canvas.width / 2 - this.w / 2;
        this.y = canvas.height - 65;
        this.speed = 290;
        this.cooldown = 0;
    }

    update(dt) {
        const left = KEYS["arrowleft"] || KEYS["a"];
        const right = KEYS["arrowright"] || KEYS["d"];
        const up = KEYS["arrowup"] || KEYS["w"];
        const down = KEYS["arrowdown"] || KEYS["s"];

        if (left) this.x -= this.speed * dt;
        if (right) this.x += this.speed * dt;
        if (up) this.y -= this.speed * dt;
        if (down) this.y += this.speed * dt;

        this.x = Math.max(8, Math.min(canvas.width - this.w - 8, this.x));
        this.y = Math.max(8, Math.min(canvas.height - this.h - 8, this.y));

        this.cooldown = Math.max(0, this.cooldown - dt);

        if (KEYS[" "] && this.cooldown === 0) {
            bullets.push(new Bullet(this.x + this.w / 2 - 3, this.y - 8));
            this.cooldown = 0.22;
        }
    }

    draw() {
        const cx = this.x + this.w / 2;

        // Chama do propulsor (piscando)
        ctx.fillStyle = Math.random() > 0.5 ? "#ff9800" : "#ffeb3b";
        ctx.beginPath();
        ctx.moveTo(cx - 6, this.y + this.h - 4);
        ctx.lineTo(cx, this.y + this.h + (Math.random() * 10 + 6));
        ctx.lineTo(cx + 6, this.y + this.h - 4);
        ctx.closePath();
        ctx.fill();

        // Corpo e asas da nave
        ctx.fillStyle = "#66fcf1";
        ctx.beginPath();
        ctx.moveTo(cx, this.y); // Bico
        ctx.quadraticCurveTo(cx + 10, this.y + 15, this.x + this.w, this.y + this.h); // Asa direita curva
        ctx.lineTo(cx, this.y + this.h - 8); // Recorte traseiro
        ctx.lineTo(this.x, this.y + this.h); // Asa esquerda
        ctx.quadraticCurveTo(cx - 10, this.y + 15, cx, this.y); // Volta ao bico
        ctx.closePath();
        ctx.fill();

        // Cabine (vidro)
        ctx.fillStyle = "#0b0c10";
        ctx.beginPath();
        ctx.ellipse(cx, this.y + 18, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Tiros arredondados com brilho
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 6;
        this.h = 16;
        this.speed = 480;
    }

    update(dt) {
        this.y -= this.speed * dt;
    }

    draw() {
        ctx.save();
        ctx.shadowColor = "#ffeb3b";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#fff59d";
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, 4);
        ctx.fill();
        ctx.restore();
    }
}

// Asteroides irregulares e girando
class Asteroid {
    constructor(onda) {
        this.radius = Math.random() * 14 + 16; // Raio entre 16 e 30
        this.w = this.radius * 2;
        this.h = this.radius * 2;
        this.x = Math.random() * (canvas.width - this.w);
        this.y = -this.h;
        this.speed = (Math.random() * 80 + 90) + (onda * 15);
        this.angle = 0;
        this.rotSpeed = (Math.random() - 0.5) * 3; // Velocidade de giro

        // Gera vértices irregulares para parecer uma pedra espacial
        this.vertices = [];
        const sides = 10;
        for (let i = 0; i < sides; i++) {
            const theta = (i / sides) * Math.PI * 2;
            const offset = Math.random() * 0.35 + 0.75; // Variação do formato
            this.vertices.push({
                x: Math.cos(theta) * this.radius * offset,
                y: Math.sin(theta) * this.radius * offset
            });
        }
    }

    update(dt) {
        this.y += this.speed * dt;
        this.angle += this.rotSpeed * dt;
    }

    draw() {
        const cx = this.x + this.radius;
        const cy = this.y + this.radius;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.angle);

        // Corpo do asteroide
        ctx.fillStyle = "#7f8c8d";
        ctx.strokeStyle = "#bdc3c7";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crateras decorativas
        ctx.fillStyle = "#566573";
        ctx.beginPath();
        ctx.arc(-this.radius * 0.25, -this.radius * 0.2, this.radius * 0.22, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.3, this.radius * 0.25, this.radius * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

let player;
let bullets = [];
let asteroids = [];
let stars = [];
let pontos = 0;
let vidas = 3;
let onda = 1;
let pausa = false;
let gameOver = false;
let spawnTimer = 0;
let lastTime = 0;

// Cria 50 estrelas no fundo
for (let i = 0; i < 50; i++) {
    stars.push(new Star());
}

function atualizarHUD() {
    pontosElement.textContent = pontos;
    vidasElement.textContent = vidas;
    ondasElement.textContent = onda;
}

function startGame() {
    player = new Player();
    bullets = [];
    asteroids = [];
    pontos = 0;
    vidas = 3;
    onda = 1;
    pausa = false;
    gameOver = false;
    spawnTimer = 0;
    atualizarHUD();
}

function update(dt) {
    stars.forEach(s => s.update(dt));

    if (pausa || gameOver) return;

    player.update(dt);

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(dt);
        if (bullets[i].y + bullets[i].h < 0) {
            bullets.splice(i, 1);
        }
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        asteroids.push(new Asteroid(onda));
        spawnTimer = Math.max(0.3, 1.2 - onda * 0.1);
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        const ast = asteroids[i];
        ast.update(dt);

        if (aabb(player, ast)) {
            asteroids.splice(i, 1);
            vidas--;
            atualizarHUD();
            if (vidas <= 0) gameOver = true;
            continue;
        }

        if (ast.y > canvas.height) {
            asteroids.splice(i, 1);
            vidas--;
            atualizarHUD();
            if (vidas <= 0) gameOver = true;
            continue;
        }

        for (let j = bullets.length - 1; j >= 0; j--) {
            if (aabb(bullets[j], ast)) {
                bullets.splice(j, 1);
                asteroids.splice(i, 1);
                pontos += 10;
                onda = Math.floor(pontos / 100) + 1;
                atualizarHUD();
                break;
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => s.draw());
    player.draw();
    bullets.forEach(b => b.draw());
    asteroids.forEach(a => a.draw());

    if (pausa) {
        ctx.fillStyle = "rgba(11, 12, 16, 0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#66fcf1";
        ctx.font = "bold 32px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("JOGO PAUSADO", canvas.width / 2, canvas.height / 2);
    }

    if (gameOver) {
        ctx.fillStyle = "rgba(11, 12, 16, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff5252";
        ctx.font = "bold 38px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 15);
        ctx.fillStyle = "#c5c6c7";
        ctx.font = "18px 'Segoe UI', sans-serif";
        ctx.fillText("Pressione R para reiniciar", canvas.width / 2, canvas.height / 2 + 25);
    }
}

function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000 || 0;
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

startGame();
requestAnimationFrame(gameLoop);