const canvas = document.getElementById('game');
const ctx = canvas.getContext("2d");

// x, y - posicionar o objeto
// w, h - definir o tamanho do personagem
// vx - define a velocidade horizontal


const player = {x: 40, y: 160, w: 32, h: 32, vx: 100}; // 100 pixels por segundo


let last = 0; //Marca a posição do quadro anterior

function update(dt){
    player.x += player.vx * dt;
    //  se ele bater na parede esquerda ou direita? inverter o sinal vx
    if(player.x < 0 || player.x + player.w > canvas.width){
        player.vx *= -1;
    }
}

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff6998ff";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillStyle = "#96ff65ff";
    ctx.fillRect(player.x + 10, player.y + 10, player.w - 20, player.h - 20);

ctx.fillText("0 deltaTime - dt independe da taxa de quadros", 10, 20);
}

function loop(ts){
    if(!last) last = ts;

const dt = Math.min(0.05, (ts - last) / 1000); // ms = segundo
last = ts;
update(dt);
draw();
requestAnimationFrame(loop);
}

requestAnimationFrame(loop); // Executar o primeiro disparo
