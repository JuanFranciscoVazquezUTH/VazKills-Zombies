// -------------------
// Canvas y contexto
// -------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// -------------------
// Audios
// -------------------
let shootSound = new Audio("shoot.wav");     // normal
let laserSound = new Audio("laser.mp3");     // laser
let shotgunSound = new Audio("shotgun.mp3"); // escopeta
let killSound = new Audio("kill.wav");
let gameOverSound = new Audio("gameover.wav");
let bgMusic = new Audio("background.mp3");   // música de fondo

shootSound.volume = 0.3;
laserSound.volume = 0.3;
shotgunSound.volume = 0.3;
killSound.volume = 0.5;
gameOverSound.volume = 0.7;
bgMusic.volume = 0.2;
bgMusic.loop = true;

let audioEnabled = true;
let gameOverSoundPlayed = false;
let bgStarted = false;

// -------------------
// Botón audio
// -------------------
const audioBtn = document.getElementById("audioBtn");
audioBtn.textContent = "Silenciar Audio";
audioBtn.onclick = () => {
    audioEnabled = !audioEnabled;
    audioBtn.textContent = audioEnabled ? "Silenciar Audio" : "Activar Audio";
    if(audioEnabled) startBgMusic();
};

// -------------------
// Función iniciar música de fondo
// -------------------
function startBgMusic() {
    if(!bgStarted && audioEnabled){
        bgMusic.play().catch(e=>console.log("Error bgMusic:", e));
        bgStarted = true;
    }
}
document.addEventListener("keydown", startBgMusic);

// -------------------
// Imágenes
// -------------------
const playerImg = new Image();
playerImg.src = "images/player.png";

const zombieImg = new Image();
zombieImg.src = "images/zombie.png";

const backgroundImg = new Image();
backgroundImg.src = "images/background.png";

const weaponImgs = {
    shotgun: "images/shotgun.png",
    laser: "images/laser.png"
};

// -------------------
// Player
// -------------------
let player = {
    x: canvas.width/2,
    y: canvas.height/2,
    size: 25,  
    speed: 3,
    dx: 0,
    dy: 0,
    lastDx: 1,
    lastDy: 0,
    lives: 3,
    weapon: "normal",
    invincible: false,
    invTime: 0,
    shakeTime: 0
};

// -------------------
// Zombies
// -------------------
let zombies = [];
let spawnTime = 0;

// -------------------
// Balas
// -------------------
let bullets = [];
let kills = 0;

// -------------------
// Armas en mapa
// -------------------
let weaponItems = [];

// -------------------
// Score y GameOver
// -------------------
let score = 0;
let gameOver = false;

// -------------------
// Teclas
// -------------------
const keys = {};
let spacePressed = false;

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

function keyDown(e){
    keys[e.key] = true;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"," "].includes(e.key)) e.preventDefault();

    player.dx = 0;
    player.dy = 0;

    if (keys["ArrowUp"] || keys["w"]) player.dy = -player.speed;
    if (keys["ArrowDown"] || keys["s"]) player.dy = player.speed;
    if (keys["ArrowLeft"] || keys["a"]) player.dx = -player.speed;
    if (keys["ArrowRight"] || keys["d"]) player.dx = player.speed;

    if (player.dx !== 0 || player.dy !== 0){
        player.lastDx = player.dx / player.speed;
        player.lastDy = player.dy / player.speed;
    }

    if (e.code === "Space" && !spacePressed){
        shoot();
        spacePressed = true;
    }
}

function keyUp(e){
    keys[e.key] = false;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"," "].includes(e.key)) e.preventDefault();
    if (!keys["ArrowUp"] && !keys["w"] && !keys["ArrowDown"] && !keys["s"]) player.dy = 0;
    if (!keys["ArrowLeft"] && !keys["a"] && !keys["ArrowRight"] && !keys["d"]) player.dx = 0;
    if (e.code === "Space") spacePressed = false;
}

// -------------------
// Función reproducir sonido de disparo según arma
// -------------------
function playShootSound(){
    if(!audioEnabled) return;
    let audioSrc = shootSound;
    if(player.weapon === "laser") audioSrc = laserSound;
    if(player.weapon === "shotgun") audioSrc = shotgunSound;

    // Clonar el audio para reproducir múltiples disparos
    let s = audioSrc.cloneNode();
    s.currentTime = 0;
    s.play().catch(e=>console.log("Error disparo:", e));
}

// -------------------
// Función disparo según arma
// -------------------
function shoot(){
    if(player.weapon === "normal"){
        bullets.push({ x: player.x, y: player.y, size: 4, speed: 6, dx: player.lastDx, dy: player.lastDy });
    }
    else if(player.weapon === "shotgun"){
        let angles = [-0.2, 0, 0.2];
        angles.forEach(a=>{
            let dx = Math.cos(a)*player.lastDx - Math.sin(a)*player.lastDy;
            let dy = Math.sin(a)*player.lastDx + Math.cos(a)*player.lastDy;
            bullets.push({ x: player.x, y: player.y, size: 4, speed: 6, dx: dx, dy: dy });
        });
    }
    else if(player.weapon === "laser"){
        bullets.push({ x: player.x, y: player.y, size: 6, speed: 10, dx: player.lastDx, dy: player.lastDy });
    }

    playShootSound(); // reproducir sonido según arma
}

// -------------------
// Spawns
// -------------------
function spawnZombie(){
    let side = Math.floor(Math.random()*4);
    let z = {x:0,y:0,size:25,speed:1.4};
    if(side===0) z.x=0,z.y=Math.random()*canvas.height;
    if(side===1) z.x=canvas.width,z.y=Math.random()*canvas.height;
    if(side===2) z.x=Math.random()*canvas.width,z.y=0;
    if(side===3) z.x=Math.random()*canvas.width,z.y=canvas.height;
    zombies.push(z);
}

function spawnWeaponItem(){
    let types = ["shotgun","laser"];
    let type = types[Math.floor(Math.random()*types.length)];
    let item = {
        x: Math.random()*(canvas.width-40)+20,
        y: Math.random()*(canvas.height-40)+20,
        type: type,
        size: 20,
        timer: 0
    };
    weaponItems.push(item);
}

// -------------------
// Movimiento
// -------------------
function moveZombies(){
    zombies.forEach(z=>{
        let angle = Math.atan2(player.y - z.y, player.x - z.x);
        z.x += Math.cos(angle)*z.speed;
        z.y += Math.sin(angle)*z.speed;

        if(!player.invincible && collision(player,z)){
            player.lives--;
            player.weapon="normal";
            player.invincible = true;
            player.invTime = 0;
            player.shakeTime = 20; // activar shake de pantalla completa
            if(player.lives<=0) gameOver=true;
        }
    });
}

function moveBullets(){
    bullets = bullets.filter(b=>{
        b.x+=b.dx*b.speed;
        b.y+=b.dy*b.speed;
        return b.x>0 && b.x<canvas.width && b.y>0 && b.y<canvas.height;
    });
}

function bulletHitZombie(){
    for(let zi=zombies.length-1;zi>=0;zi--){
        for(let bi=bullets.length-1;bi>=0;bi--){
            let z=zombies[zi];
            let b=bullets[bi];
            let dx=b.x-z.x;
            let dy=b.y-z.y;
            if(Math.sqrt(dx*dx+dy*dy)<b.size+z.size){
                zombies.splice(zi,1);
                bullets.splice(bi,1);
                kills++;
                if(audioEnabled && killSound){killSound.currentTime=0; killSound.play().catch(e=>console.log("Error kill:",e));}
                break;
            }
        }
    }
}

function pickupWeapon(){
    for(let i=weaponItems.length-1;i>=0;i--){
        let w = weaponItems[i];
        w.timer++;
        if(w.timer>180){ // 3 segundos -> eliminar
            weaponItems.splice(i,1);
            continue;
        }
        let dx = player.x-w.x;
        let dy = player.y-w.y;
        if(Math.sqrt(dx*dx+dy*dy)<player.size+w.size){
            player.weapon = w.type;
            weaponItems.splice(i,1);
        }
    }
}

// -------------------
// Dibujos
// -------------------
function drawBackground(){
    if(backgroundImg.complete) ctx.drawImage(backgroundImg,0,0,canvas.width,canvas.height);
    else {ctx.fillStyle="#000"; ctx.fillRect(0,0,canvas.width,canvas.height);}
}

function drawPlayer(){
    ctx.save();
    if(playerImg.complete){
        if(player.lastDx<0){
            ctx.translate(player.x+player.size,player.y-player.size);
            ctx.scale(-1,1);
            ctx.drawImage(playerImg,0,0,player.size*2,player.size*2);
        } else ctx.drawImage(playerImg,player.x-player.size,player.y-player.size,player.size*2,player.size*2);
    } else {
        ctx.fillStyle="cyan";
        ctx.beginPath();
        ctx.arc(player.x,player.y,player.size,0,Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
}

function drawZombies(){
    zombies.forEach(z=>{
        if(zombieImg.complete) ctx.drawImage(zombieImg,z.x-z.size,z.y-z.size,z.size*2,z.size*2);
        else {ctx.fillStyle="lime"; ctx.beginPath(); ctx.arc(z.x,z.y,z.size,0,Math.PI*2);ctx.fill();}
    });
}

function drawBullets(){
    bullets.forEach(b=>{
        ctx.fillStyle="yellow";
        ctx.beginPath();ctx.arc(b.x,b.y,b.size,0,Math.PI*2);ctx.fill();
    });
}

function drawWeaponItems(){
    weaponItems.forEach(w=>{
        if(weaponImgs[w.type]){
            let img = new Image();
            img.src = weaponImgs[w.type];
            ctx.drawImage(img, w.x-w.size, w.y-w.size, w.size*2, w.size*2);
        } else {
            ctx.fillStyle=w.type==="shotgun"?"orange":"pink";
            ctx.beginPath();ctx.arc(w.x,w.y,w.size,0,Math.PI*2);ctx.fill();
        }
    });
}

// -------------------
// Shake efecto pantalla completa
// -------------------
function applyShake(){
    if(player.shakeTime>0){
        let dx = (Math.random()-0.5)*10;
        let dy = (Math.random()-0.5)*10;
        ctx.translate(dx,dy);
        player.shakeTime--;
    }
}

// -------------------
// Colisiones
// -------------------
function collision(a,b){return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2)<a.size+b.size;}

// -------------------
// Loop principal
// -------------------
function update(){
    ctx.save();
    applyShake();
    drawBackground();

    if(!gameOver){
        player.x+=player.dx;
        player.y+=player.dy;

        if(player.x-player.size<0) player.x=player.size;
        if(player.x+player.size>canvas.width) player.x=canvas.width-player.size;
        if(player.y-player.size<0) player.y=player.size;
        if(player.y+player.size>canvas.height) player.y=canvas.height-player.size;

        if(player.invincible){
            player.invTime++;
            if(player.invTime>60) player.invincible=false;
        }

        drawPlayer();
        moveZombies();
        drawZombies();
        moveBullets();
        drawBullets();
        bulletHitZombie();
        pickupWeapon();
        drawWeaponItems();

        if(spawnTime%90===0) spawnZombie();
        if(spawnTime%500===0) spawnWeaponItem();
        spawnTime++;

        if(spawnTime%30===0) score++;

        ctx.fillStyle="white";
        ctx.font="20px Arial";
        ctx.fillText("Score: "+score,10,25);
        ctx.fillText("Kills: "+kills,10,50);
        ctx.fillText("Lives: "+player.lives,10,75);
        ctx.fillText("Weapon: "+player.weapon,10,100);

    } else {
        ctx.fillStyle="white";
        ctx.font="30px Arial";
        ctx.fillText("GAME OVER",canvas.width/2-80,canvas.height/2);
        ctx.fillText("Score: "+score,canvas.width/2-55,canvas.height/2+40);
        ctx.fillText("Kills: "+kills,canvas.width/2-50,canvas.height/2+80);

        if(audioEnabled && !gameOverSoundPlayed && gameOverSound){
            gameOverSound.currentTime=0;
            gameOverSound.play().catch(e=>console.log("Error gameover:",e));
            gameOverSoundPlayed=true;
        }
    }

    ctx.restore();
    requestAnimationFrame(update);
}

// -------------------
// Iniciar loop
// -------------------
update();

// -------------------
// Botón reiniciar
// -------------------
document.getElementById("restartBtn").onclick=()=>{
    player.x=canvas.width/2;
    player.y=canvas.height/2;
    player.dx=0; player.dy=0;
    player.lastDx=1; player.lastDy=0;
    player.lives=3; player.weapon="normal"; player.invincible=false; player.invTime=0; player.shakeTime=0;

    zombies=[]; bullets=[]; weaponItems=[];
    kills=0; score=0; spawnTime=0;
    gameOver=false; gameOverSoundPlayed=false;
};
