/**
 * Snake Caldeira — exemplo didático para o 3º trimestre da Turma 202.
 * Conceitos: game loop, grid, fila (array), colisão, estados, localStorage.
 */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const stateEl = document.getElementById("state");

const CELL = 24;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;
const TICK_MS = 110;

// Configurações da Maçã Dourada
const APPLES_TO_SPAWN_GOLDEN = 5; // Aparece a cada 5 maçãs normais comidas
const GOLDEN_DURATION = 15000;    // Some após 15s (em milissegundos)
const GOLDEN_POINTS = 20;

const STATES = { READY: "PRONTO", PLAYING: "JOGANDO", PAUSED: "PAUSA", OVER: "GAME OVER" };

let state = STATES.READY;
let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = { x: 10, y: 10 };

let goldenFood = null; // { x, y } ou null
let goldenLifeTimer = 0;
let normalApplesEaten = 0; // Contador de maçãs normais

let score = 0;
let best = Number(localStorage.getItem("snake-best") || 0);
let acc = 0;
let last = 0;

bestEl.textContent = best;

function reset() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    snake = [
        { x: midX, y: midY },
        { x: midX - 1, y: midY },
        { x: midX - 2, y: midY },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = score;

    // Reseta estado da maçã dourada e contador
    goldenFood = null;
    goldenLifeTimer = 0;
    normalApplesEaten = 0;

    spawnFood();
    state = STATES.READY;
    stateEl.textContent = state;
}

function spawnFood() {
    do {
        food = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS),
        };
    } while (
        snake.some((s) => s.x === food.x && s.y === food.y) ||
        (goldenFood && goldenFood.x === food.x && goldenFood.y === food.y)
    );
}

function spawnGoldenFood() {
    do {
        goldenFood = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS),
        };
    } while (
        snake.some((s) => s.x === goldenFood.x && s.y === goldenFood.y) ||
        (food.x === goldenFood.x && food.y === goldenFood.y)
    );
    goldenLifeTimer = 0;
}

function setDirection(x, y) {
    if (dir.x + x === 0 && dir.y + y === 0) return; // impede 180°
    nextDir = { x, y };
}

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
    }
    if (key === "arrowup" || key === "w") setDirection(0, -1);
    if (key === "arrowdown" || key === "s") setDirection(0, 1);
    if (key === "arrowleft" || key === "a") setDirection(-1, 0);
    if (key === "arrowright" || key === "d") setDirection(1, 0);

    if (key === " ") {
        if (state === STATES.PLAYING) {
            state = STATES.PAUSED;
        } else if (state === STATES.PAUSED || state === STATES.READY) {
            state = STATES.PLAYING;
        }
        stateEl.textContent = state;
    }
    if (key === "r") reset();
    if (
        state === STATES.READY &&
        ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)
    ) {
        state = STATES.PLAYING;
        stateEl.textContent = state;
    }
});

function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
    const hitBody = snake.some((s) => s.x === head.x && s.y === head.y);
    if (hitWall || hitBody) {
        state = STATES.OVER;
        stateEl.textContent = state;
        if (score > best) {
            best = score;
            localStorage.setItem("snake-best", String(best));
            bestEl.textContent = best;
        }
        return;
    }

    snake.unshift(head);

    // Comeu maçã normal (+10)
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = score;
        normalApplesEaten++;

        // Ao atingir múltiplos de 5, invoca a maçã dourada
        if (normalApplesEaten % APPLES_TO_SPAWN_GOLDEN === 0) {
            spawnGoldenFood();
        }

        spawnFood();
    } 
    // Comeu maçã dourada (+20)
    else if (goldenFood && head.x === goldenFood.x && head.y === goldenFood.y) {
        score += GOLDEN_POINTS;
        scoreEl.textContent = score;
        goldenFood = null;
        goldenLifeTimer = 0;
    } else {
        snake.pop();
    }
}

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
}

function draw() {
    ctx.fillStyle = "#022c22";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Maçã normal
    drawCell(food.x, food.y, "#8e0b0bff");

    // Maçã dourada (com efeito visual piscando nos últimos 3 segundos)
    if (goldenFood) {
        const remaining = GOLDEN_DURATION - goldenLifeTimer;
        const blink = remaining < 3000 && Math.floor(remaining / 200) % 2 === 0;
        if (!blink) {
            drawCell(goldenFood.x, goldenFood.y, "#fbbf24");
        }
    }

    // Cobrinha
    snake.forEach((s, i) => drawCell(s.x, s.y, i === 0 ? "#dc3496ff" : "#b7267aff"));

    if (state !== STATES.PLAYING) {
        ctx.fillStyle = "rgba(15,23,42,0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#c92793ff";
        ctx.textAlign = "center";
        ctx.font = "bold 28px Segoe UI";
        ctx.fillText(state, canvas.width / 2, canvas.height / 2);

        ctx.font = "16px Segoe UI";
        ctx.fillText(
            state === STATES.OVER
                ? "Pressione R para reiniciar"
                : "Pressione ESPAÇO para jogar",
            canvas.width / 2,
            canvas.height / 2 + 32
        );
    }
}

function loop(ts) {
    const dt = ts - last;
    last = ts;

    if (state === STATES.PLAYING) {
        // Controla os 15 segundos da maçã dourada
        if (goldenFood) {
            goldenLifeTimer += dt;
            if (goldenLifeTimer >= GOLDEN_DURATION) {
                goldenFood = null;
                goldenLifeTimer = 0;
            }
        }

        acc += dt;
        while (acc >= TICK_MS) {
            tick();
            acc -= TICK_MS;
        }
    }

    draw();
    requestAnimationFrame(loop);
}

reset();
requestAnimationFrame(loop);