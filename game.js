// ======================================================
// 1. REFERENCIAS AL DOM
// ======================================================
const splashScreen = document.getElementById("splashScreen");
const selectScreen = document.getElementById("selectScreen");
const gameScreen = document.getElementById("gameScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const creditsScreen = document.getElementById("creditsScreen");
const resultsDiv = document.getElementById("results");
const pauseOverlay = document.getElementById("pauseOverlay");
const audioBtn = document.getElementById("audioBtn");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const criticalOverlay = document.getElementById("criticalOverlay");

const uiLives = document.getElementById("ui-lives");
const uiScore = document.getElementById("ui-score");
const uiKills = document.getElementById("ui-kills");
const uiWeaponName = document.getElementById("weapon-name");
const uiWeaponIcon = document.getElementById("weapon-icon");
const uiAmmoDisplay = document.getElementById("ammo-display");
const dashBarFill = document.getElementById("dash-bar-fill");

let highScore = localStorage.getItem("vazkillsHighScore") || 0;
if(highScoreDisplay) highScoreDisplay.innerText = "RÉCORD: " + highScore;

document.getElementById("startBtn").onclick = () => { splashScreen.classList.add("hidden"); selectScreen.classList.remove("hidden"); };
document.getElementById("creditsBtn").onclick = () => { splashScreen.classList.add("hidden"); creditsScreen.classList.remove("hidden"); };
document.getElementById("backFromCredits").onclick = () => { creditsScreen.classList.add("hidden"); splashScreen.classList.remove("hidden"); };
document.getElementById("exitBtn").onclick = () => { alert("Gracias por jugar VazKills Zombies"); window.close(); };

// ======================================================
// 2. MOTOR Y EFECTOS
// ======================================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameArea = document.getElementById("gameArea");
const flashOverlay = document.getElementById("flashOverlay");
const nukeOverlay = document.getElementById("nukeOverlay");

function triggerShake() {
    gameArea.classList.add("shaking");
    setTimeout(() => { gameArea.classList.remove("shaking"); }, 500);
}

function triggerFlash(color) {
    if(!flashOverlay) return;
    flashOverlay.style.backgroundColor = color;
    flashOverlay.style.opacity = "0.4";
    setTimeout(() => { flashOverlay.style.opacity = "0"; }, 150);
}

function triggerNukeEffect() {
    if(!nukeOverlay) return;
    nukeOverlay.classList.add("nuke-active"); 
    triggerShake(); 
    setTimeout(() => { nukeOverlay.classList.remove("nuke-active"); }, 1500);
}

function spawnFloatingText(x, y, text, color) {
    let el = document.createElement("div");
    el.innerText = text;
    el.className = "floating-text";
    el.style.left = (x - 10) + "px"; el.style.top = (y - 30) + "px"; el.style.color = color;
    gameArea.appendChild(el);
    setTimeout(() => { el.remove(); }, 1000);
}

let particles = []; 
function spawnBloodExplosion(x, y) {
    for (let i = 0; i < 20; i++) { 
        const size = Math.random() * 5 + 2; 
        const angle = Math.random() * Math.PI * 2; 
        const speed = Math.random() * 6 + 2; 
        const redShade = Math.floor(Math.random() * 100 + 155);
        particles.push({
            x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            size: size, color: `rgb(${redShade}, 0, 0)`, life: 1.0 
        });
    }
}

// ======================================================
// 3. AUDIO
// ======================================================
let normalSound = new Audio("shoot.wav");
let shotgunSound = new Audio("shotgun.mp3");
let laserSound = new Audio("laser.mp3");
let machineSound = new Audio("machinegun.mp3"); 
let bgMusic = new Audio("background.mp3");
let killSound = new Audio("kill.wav");
let gameOverSound = new Audio("gameover.wav");
let lifeSound = new Audio("life.mp3"); 
let hurtSound = new Audio("hurt.mp3");
let nukeSound = new Audio("boom.mp3");
// ✅ NUEVOS SONIDOS
let dashSound = new Audio("dash.mp3");
let clickSound = new Audio("click.mp3");

bgMusic.loop = true; bgMusic.volume = 0.4;
let audioEnabled = true;
audioBtn.onclick = () => { audioEnabled = !audioEnabled; audioEnabled ? bgMusic.play() : bgMusic.pause(); audioBtn.innerText = audioEnabled ? "🔈" : "🔇"; };

// ======================================================
// 4. CONFIGURACIÓN
// ======================================================
const backgroundImg = new Image();
backgroundImg.src = "images/background.png";

let gameDifficulty = "normal";
let zombieSpeedMult = 1.0;
let zombieSpawnRate = 1500;
let zombieIntervalId = null;

window.setDifficulty = function(level) {
    gameDifficulty = level;
    document.getElementById("btnEasy").classList.remove("selected");
    document.getElementById("btnNormal").classList.remove("selected");
    document.getElementById("btnHard").classList.remove("selected");
    if(level === 'easy') { document.getElementById("btnEasy").classList.add("selected"); zombieSpeedMult = 0.7; zombieSpawnRate = 2000; }
    else if(level === 'normal') { document.getElementById("btnNormal").classList.add("selected"); zombieSpeedMult = 1.0; zombieSpawnRate = 1500; }
    else if(level === 'hard') { document.getElementById("btnHard").classList.add("selected"); zombieSpeedMult = 1.5; zombieSpawnRate = 1000; }
};

// ======================================================
// 5. JUGADOR
// ======================================================
const playerSprite = document.getElementById("playerSprite");

let player = {
    x: 400, y: 250, size: 30, speed: 4, lives: 3,
    dirX: 1, dirY: 0, weapon: "normal",
    invulnerable: false, muzzleFlash: 0,
    dashCooldown: 0, maxDashCooldown: 180, isDashing: false,
    ammo: 0
};

let score = 0; let kills = 0;
let gameOver = false; let gameStarted = false; let isPaused = false; 
let startTime = 0; let pauseStartTime = 0; 

function selectCharacter(img) {
    playerSprite.src = "images/" + img;
    selectScreen.classList.add("hidden"); gameScreen.classList.remove("hidden");
    resetGame(); gameStarted = true; startTime = Date.now();
    if (audioEnabled) bgMusic.play();
}

function resetGame() {
    score = 0; kills = 0;
    player.lives = 3; player.weapon = "normal"; player.ammo = 0;
    player.x = 400; player.y = 250;
    player.invulnerable = false; player.dashCooldown = 0;
    playerSprite.classList.remove("invulnerable");
    
    zombies = []; bullets = []; items = []; weapons = []; particles = [];
    
    gameOver = false; isPaused = false;
    pauseOverlay.classList.add("hidden");
    criticalOverlay.classList.remove("critical-active");
    
    gameArea.classList.remove("shaking"); flashOverlay.style.opacity = "0";
    if(nukeOverlay) nukeOverlay.classList.remove("nuke-active");
    
    document.querySelectorAll("#gameArea img:not(#playerSprite)").forEach(el => el.remove());
    document.querySelectorAll(".floating-text").forEach(el => el.remove());

    if (zombieIntervalId) clearInterval(zombieIntervalId);
    zombieIntervalId = setInterval(spawnZombie, zombieSpawnRate);
    updateUI();
}

function updateUI() {
    if(!uiScore) return;
    uiScore.innerText = score; uiKills.innerText = kills;

    let heartsHTML = "";
    if (player.lives <= 5) for(let i=0; i<player.lives; i++) heartsHTML += `<span class="heart">❤️</span>`;
    else heartsHTML = `<span class="heart">❤️</span> <span style="font-family: 'Creepster', cursive; font-size: 30px; color: white;">x ${player.lives}</span>`;
    uiLives.innerHTML = heartsHTML;

    let wName = "PISTOLA";
    let wImg = "";
    let ammoText = "∞";

    if (player.weapon === "shotgun") { wName = "ESCOPETA"; wImg = "url('images/shotgun.png')"; ammoText = player.ammo; }
    else if (player.weapon === "laser") { wName = "LÁSER"; wImg = "url('images/laser.png')"; ammoText = player.ammo; }
    else if (player.weapon === "machinegun") { wName = "AMETRALLADORA"; wImg = "url('images/machinegun.png')"; ammoText = player.ammo; }
    
    uiWeaponName.innerText = wName;
    uiAmmoDisplay.innerText = ammoText;
    uiWeaponIcon.style.backgroundImage = wImg;
}

// ======================================================
// 6. SPAWNERS
// ======================================================
let zombies = [];
const zombieImgs = ["images/zombie1.gif", "images/zombie2.gif", "images/zombie3.gif", "images/zombie4.gif"];

function spawnZombie() {
    if (!gameStarted || gameOver || isPaused) return;
    
    // Spawn Seguro
    let x, y, safe = false;
    let attempts = 0;
    while (!safe && attempts < 10) {
        let side = Math.floor(Math.random() * 4);
        let margin = 40;
        if (side === 0) { x = margin; y = Math.random() * canvas.height; }
        if (side === 1) { x = canvas.width - margin; y = Math.random() * canvas.height; }
        if (side === 2) { x = Math.random() * canvas.width; y = margin; }
        if (side === 3) { x = Math.random() * canvas.width; y = canvas.height - margin; }
        
        let dx = x - player.x; let dy = y - player.y;
        if (Math.sqrt(dx*dx + dy*dy) > 150) safe = true;
        attempts++;
    }

    const zombieImgSrc = zombieImgs[Math.floor(Math.random() * zombieImgs.length)];
    const isZombie4 = zombieImgSrc.includes("zombie4.gif"); 

    // ✅ FILTROS VISUALES MEJORADOS
    let rand = Math.random();
    let type = "normal";
    let speedMult = 1.0;
    let size = 25;
    let hp = 1;
    let visualFilter = ""; 

    if (rand < 0.2) { 
        type = "runner"; speedMult = 1.8; size = 20; hp = 1; 
        visualFilter = "sepia(1) saturate(5) hue-rotate(-50deg)"; // Naranja intenso
    } else if (rand < 0.35) { 
        type = "tank"; speedMult = 0.5; size = 40; hp = 5; 
        visualFilter = "grayscale(100%) contrast(1.5) brightness(0.6)"; // Gris oscuro metalizado
    }

    let z = {
        x, y, size: size, hp: hp, maxHp: hp, type: type,
        speed: (1.4 + (kills * 0.015)) * zombieSpeedMult * speedMult,
        element: document.createElement("img"), isZombie4: isZombie4, enraged: false
    };
    z.element.src = zombieImgSrc;
    z.element.style.position = "absolute"; z.element.style.width = (size * 2) + "px"; z.element.style.zIndex = "5";
    z.element.style.filter = visualFilter;
    gameArea.appendChild(z.element); zombies.push(z);
}

let items = [];
function spawnWeapon() {
    if (!gameStarted || gameOver || isPaused) return;
    let ix = Math.random() * (canvas.width - 60) + 30;
    let iy = Math.random() * (canvas.height - 60) + 30;
    let r = Math.random();
    let type = "shotgun"; let imgSrc = "images/shotgun.png";
    let ammoCount = 0;

    if (r < 0.10) { type = "nuke"; imgSrc = "images/nuke.png"; } 
    else if (r < 0.40) { type = "shotgun"; imgSrc = "images/shotgun.png"; ammoCount = 15; }
    else if (r < 0.70) { type = "laser"; imgSrc = "images/laser.png"; ammoCount = 20; }
    else { type = "machinegun"; imgSrc = "images/machinegun.png"; ammoCount = 60; }
    
    let w = { x: ix, y: iy, size: 20, type: type, ammo: ammoCount, element: document.createElement("img") }; 
    w.element.onerror = () => { w.element.src = "images/shotgun.png"; }; 
    w.element.src = imgSrc;
    w.element.style.position = "absolute"; w.element.style.width = "40px"; w.element.style.zIndex = 4;
    w.element.classList.add("item-glow"); 
    gameArea.appendChild(w.element); items.push(w);
    setTimeout(() => { if(w.element.parentNode && !isPaused) { w.element.remove(); items = items.filter(x => x !== w); } }, 5000);
}

function spawnHeart() {
    if (!gameStarted || gameOver || isPaused) return;
    let h = { x: Math.random() * (canvas.width - 60) + 30, y: Math.random() * (canvas.height - 60) + 30, size: 20, type: "life", element: document.createElement("img") };
    h.element.src = "images/life.gif"; h.element.style.position = "absolute"; h.element.style.width = "40px"; h.element.style.zIndex = 5;
    h.element.classList.add("item-glow");
    gameArea.appendChild(h.element); items.push(h);
    setTimeout(() => { if(h.element.parentNode && !isPaused) { h.element.remove(); items = items.filter(x => x !== h); } }, 3000);
}

// ======================================================
// 7. DISPARO
// ======================================================
let bullets = [];

function shoot() {
    if (!gameStarted || gameOver || isPaused) return;
    player.muzzleFlash = 3; 

    if (player.weapon !== "normal") {
        player.ammo--; 
        updateUI();
        if (player.ammo <= 0) {
            player.weapon = "normal"; 
            spawnFloatingText(player.x, player.y, "SIN BALAS", "white");
            if(audioEnabled) clickSound.cloneNode().play().catch(()=>{}); // SONIDO CLICK
            updateUI();
        }
    }

    if (player.weapon === "machinegun") {
        let shots = 0;
        let burstInterval = setInterval(() => {
            if (gameOver || isPaused) { clearInterval(burstInterval); return; }
            let spreadX = (Math.random() - 0.5) * 4; let spreadY = (Math.random() - 0.5) * 4;
            bullets.push({ x: player.x, y: player.y, dx: (player.dirX * 15) + spreadX, dy: (player.dirY * 15) + spreadY, size: 4, type: "machinegun", damage: 1 });
            player.muzzleFlash = 2; 
            if (audioEnabled) { let m = machineSound.cloneNode(); m.volume = 0.25; m.play().catch(()=>{}); }
            shots++; if (shots >= 4) clearInterval(burstInterval);
        }, 80);
        return;
    }

    let sound;
    if (player.weapon === "shotgun") {
        bullets.push({ x: player.x, y: player.y, dx: player.dirX * 7, dy: player.dirY * 7, size: 3, type: "shotgun", damage: 1 });
        bullets.push({ x: player.x, y: player.y, dx: player.dirX * 7 + 0.7, dy: player.dirY * 7 + 0.7, size: 3, type: "shotgun", damage: 1 });
        bullets.push({ x: player.x, y: player.y, dx: player.dirX * 7 - 0.7, dy: player.dirY * 7 - 0.7, size: 3, type: "shotgun", damage: 1 });
        sound = shotgunSound;
    } else if (player.weapon === "laser") {
        bullets.push({ x: player.x, y: player.y, dx: player.dirX * 12, dy: player.dirY * 12, size: 3, type: "laser", damage: 3 }); 
        sound = laserSound;
    } else {
        bullets.push({ x: player.x, y: player.y, dx: player.dirX * 8, dy: player.dirY * 8, size: 4, type: "normal", damage: 1 });
        sound = normalSound;
    }
    if (audioEnabled && sound) sound.cloneNode().play().catch(()=>{});
}

// ======================================================
// 8. CONTROLES
// ======================================================
const keys = {};
document.addEventListener("keydown", e => {
    if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if(gameStarted && !gameOver) {
            isPaused = !isPaused;
            if(isPaused) { pauseOverlay.classList.remove("hidden"); bgMusic.pause(); pauseStartTime = Date.now(); } 
            else { pauseOverlay.classList.add("hidden"); if(audioEnabled) bgMusic.play(); startTime += (Date.now() - pauseStartTime); }
        }
    }
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Shift"].includes(e.key)) e.preventDefault();
    keys[e.key] = true;
    if (e.code === "Space" && !e.repeat) shoot();
    if (e.key === "Shift" && !e.repeat && player.dashCooldown <= 0) performDash();

    if(!isPaused) {
        if (e.key === "ArrowLeft") { player.dirX = -1; player.dirY = 0; }
        if (e.key === "ArrowRight") { player.dirX = 1; player.dirY = 0; }
        if (e.key === "ArrowUp") { player.dirY = -1; player.dirX = 0; }
        if (e.key === "ArrowDown") { player.dirY = 1; player.dirX = 0; }
    }
});
document.addEventListener("keyup", e => keys[e.key] = false);

function performDash() {
    player.isDashing = true; player.invulnerable = true; player.dashCooldown = player.maxDashCooldown; 
    let dashDistance = 100;
    player.x += player.dirX * dashDistance; player.y += player.dirY * dashDistance;
    playerSprite.style.filter = "brightness(3) sepia(1) hue-rotate(180deg)"; 
    if(audioEnabled) dashSound.cloneNode().play().catch(()=>{}); // SONIDO DASH
    setTimeout(() => { 
        player.isDashing = false; player.invulnerable = false; playerSprite.style.filter = "none";
    }, 200); 
}

function collision(a, b) {
    let dx = a.x - b.x; let dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < a.size + b.size;
}

// ======================================================
// 9. LOOP PRINCIPAL
// ======================================================
function update() {
    requestAnimationFrame(update);
    if(isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    if (gameStarted && !gameOver) {
        if (player.dashCooldown > 0) player.dashCooldown--;
        let dashPercent = 100 - ((player.dashCooldown / player.maxDashCooldown) * 100);
        dashBarFill.style.width = dashPercent + "%";
        dashBarFill.style.backgroundColor = (player.dashCooldown <= 0) ? "#00ffff" : "#555";

        if (player.lives === 1) criticalOverlay.classList.add("critical-active");
        else criticalOverlay.classList.remove("critical-active");

        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.02; p.size *= 0.98;
            if (p.life <= 0 || p.size <= 0.5) { particles.splice(i, 1); continue; }
            ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.fillRect(p.x, p.y, p.size, p.size); ctx.restore();
        }

        if (!player.isDashing) {
            if (keys["ArrowLeft"]) player.x -= player.speed;
            if (keys["ArrowRight"]) player.x += player.speed;
            if (keys["ArrowUp"]) player.y -= player.speed;
            if (keys["ArrowDown"]) player.y += player.speed;
        }
        player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
        player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
        playerSprite.style.transform = player.dirX === -1 ? "scaleX(-1)" : "scaleX(1)";
        playerSprite.style.left = (player.x - 32) + "px"; playerSprite.style.top = (player.y - 32) + "px";

        if (player.muzzleFlash > 0) {
            ctx.save(); ctx.translate(player.x, player.y);
            let angle = Math.atan2(player.dirY, player.dirX); ctx.rotate(angle);
            ctx.beginPath(); ctx.ellipse(32, 0, 12, 6, 0, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 220, 50, ${player.muzzleFlash / 3})`; ctx.fill();
            ctx.restore(); player.muzzleFlash--; 
        }

        for (let i = zombies.length - 1; i >= 0; i--) {
            let z = zombies[i];
            let angle = Math.atan2(player.y - z.y, player.x - z.x);
            z.x += Math.cos(angle) * z.speed; z.y += Math.sin(angle) * z.speed;
            
            let scaleDirection = 1;
            if (z.x > player.x) scaleDirection = -1;
            if (z.isZombie4) scaleDirection *= -1; 
            z.element.style.transform = `scaleX(${scaleDirection})`;
            z.element.style.left = (z.x - (z.size)) + "px"; z.element.style.top = (z.y - (z.size)) + "px";

            if (collision(player, z) && !player.invulnerable) {
                player.lives--; player.weapon = "normal";
                triggerShake(); triggerFlash("red");
                if(audioEnabled) hurtSound.cloneNode().play().catch(()=>{});
                player.invulnerable = true; playerSprite.classList.add("invulnerable");
                setTimeout(() => { player.invulnerable = false; playerSprite.classList.remove("invulnerable"); }, 1500);
                updateUI();

                if (player.lives <= 0) {
                    gameOver = true; bgMusic.pause(); if(audioEnabled) gameOverSound.play();
                    criticalOverlay.classList.remove("critical-active");
                    let timeSurvived = Math.floor((Date.now() - startTime) / 1000);
                    if (score > highScore) { highScore = score; localStorage.setItem("vazkillsHighScore", highScore); }
                    gameScreen.classList.add("hidden"); gameOverScreen.classList.remove("hidden");
                    resultsDiv.innerHTML = `KILLS: <strong>${kills}</strong><br>SCORE: <strong>${score}</strong><br>TIEMPO: <strong>${timeSurvived} seg</strong><br><br><span style="color:gold">RÉCORD: ${highScore}</span>`;
                }
            }
        }

        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            let b = bullets[bi];
            b.x += b.dx; b.y += b.dy;
            ctx.save();
            if (b.type === "laser") {
                ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.dx * 1.5, b.y - b.dy * 1.5);
                ctx.lineWidth = b.size; ctx.strokeStyle = "cyan"; ctx.lineCap = "round"; ctx.shadowBlur = 10; ctx.shadowColor = "cyan"; ctx.stroke();
            } else if (b.type === "shotgun") {
                ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fillStyle = "orange"; ctx.fill();
            } else if (b.type === "machinegun") {
                ctx.beginPath(); ctx.ellipse(b.x, b.y, b.size * 3, b.size, Math.atan2(b.dy, b.dx), 0, Math.PI * 2);
                ctx.fillStyle = "#39FF14"; ctx.shadowBlur = 5; ctx.shadowColor = "#39FF14"; ctx.fill();
            } else {
                ctx.beginPath(); ctx.ellipse(b.x, b.y, b.size * 2, b.size, Math.atan2(b.dy, b.dx), 0, Math.PI * 2); ctx.fillStyle = "#FFD700"; ctx.fill();
            }
            ctx.restore();

            if(b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) { bullets.splice(bi, 1); continue; }

            for (let zi = zombies.length - 1; zi >= 0; zi--) {
                let z = zombies[zi];
                if (collision(b, z)) {
                    let dmg = b.damage || 1; 
                    z.hp -= dmg;
                    bullets.splice(bi, 1); 
                    spawnBloodExplosion(z.x, z.y); 

                    // ✅ LÓGICA DE TANQUE FURIOSO
                    if (z.type === "tank" && z.hp <= 2 && !z.enraged) {
                        z.enraged = true;
                        z.speed *= 2.5; // Se vuelve rápido
                        z.element.style.filter = "sepia(1) saturate(5) hue-rotate(-50deg)"; // Rojo Furioso
                    }

                    if (z.hp <= 0) {
                        z.element.remove(); zombies.splice(zi, 1);
                        kills++; 
                        let points = (z.type === "tank" ? 50 : (z.type === "runner" ? 20 : 10));
                        score += points;
                        spawnFloatingText(z.x, z.y, "+" + points, "yellow");
                        if (audioEnabled) killSound.cloneNode().play();
                    }
                    updateUI(); break; 
                }
            }
        }

        items.forEach((item, index) => {
            item.element.style.left = (item.x - 20) + "px"; item.element.style.top = (item.y - 20) + "px";
            if (collision(player, item)) {
                if (item.type === "nuke") {
                    zombies.forEach(z => { spawnBloodExplosion(z.x, z.y); z.element.remove(); kills++; score += 10; });
                    zombies = [];
                    triggerNukeEffect(); spawnFloatingText(player.x, player.y, "¡BOOM!", "red");
                    if(audioEnabled) nukeSound.cloneNode().play().catch(()=>{});
                } else if (item.type === "life") {
                    player.lives++; triggerFlash("lime"); spawnFloatingText(item.x, item.y, "+1 VIDA", "lime");
                    if(audioEnabled) lifeSound.cloneNode().play().catch(()=>{});
                } else {
                    player.weapon = item.type; player.ammo = item.ammo; 
                    spawnFloatingText(item.x, item.y, item.type.toUpperCase(), "cyan");
                }
                item.element.remove(); items.splice(index, 1);
                updateUI(); 
            }
        });
    }
}

setInterval(spawnWeapon, 6000); 
setInterval(spawnHeart, 15000); 

update();