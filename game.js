// ======================================================
// 1. REFERENCIAS AL DOM (CONEXIÓN CON HTML)
// ======================================================
// 💡 Obtenemos acceso a los elementos creados en HTML por su ID
const splashScreen = document.getElementById("splashScreen");
const selectScreen = document.getElementById("selectScreen");
const gameScreen = document.getElementById("gameScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const resultsDiv = document.getElementById("results");
const pauseOverlay = document.getElementById("pauseOverlay");
const audioBtn = document.getElementById("audioBtn");

// Referencias a las partes de la barra superior (HUD)
const uiLives = document.getElementById("ui-lives");
const uiScore = document.getElementById("ui-score");
const uiKills = document.getElementById("ui-kills");
const uiWeaponName = document.getElementById("weapon-name");
const uiWeaponIcon = document.getElementById("weapon-icon");

// AL HACER CLIC EN START:
document.getElementById("startBtn").onclick = () => {
    splashScreen.classList.add("hidden"); // Oculta portada
    selectScreen.classList.remove("hidden"); // Muestra selección
};

// AL HACER CLIC EN EXIT:
document.getElementById("exitBtn").onclick = () => {
    alert("Gracias por jugar VazKills Zombies");
    window.close(); // Intenta cerrar la ventana
};

// ======================================================
// 2. CONFIGURACIÓN DEL CANVAS & EFECTOS
// ======================================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d"); // El "pincel" para dibujar
const gameArea = document.getElementById("gameArea");
const flashOverlay = document.getElementById("flashOverlay");

// EFECTO: Temblor de pantalla (Shake)
function triggerShake() {
    gameArea.classList.add("shaking"); // Añade la clase CSS de temblor
    setTimeout(() => { 
        gameArea.classList.remove("shaking"); // La quita después de 0.5s
    }, 500);
}

// EFECTO: Destello de color (Rojo al herir, Verde al curar)
function triggerFlash(color) {
    if(!flashOverlay) return; // Seguridad por si no existe
    flashOverlay.style.backgroundColor = color;
    flashOverlay.style.opacity = "0.4"; // Se vuelve visible
    setTimeout(() => { flashOverlay.style.opacity = "0"; }, 150); // Se oculta rápido
}

// EFECTO: Texto Flotante (+10, +1 Vida)
function spawnFloatingText(x, y, text, color) {
    let el = document.createElement("div"); // Crea un elemento nuevo en memoria
    el.innerText = text;
    el.className = "floating-text"; // Le asigna la animación CSS
    el.style.left = (x - 10) + "px"; // Posición X
    el.style.top = (y - 30) + "px"; // Posición Y
    el.style.color = color;
    gameArea.appendChild(el); // Lo pone en pantalla
    setTimeout(() => { el.remove(); }, 1000); // Lo borra tras 1s
}

// SISTEMA DE PARTÍCULAS (Explosión de sangre)
let particles = []; // Aquí guardamos todas las gotitas
function spawnBloodExplosion(x, y) {
    // 💡 SI LO MODIFICAS: Cambia '20' para más o menos sangre
    for (let i = 0; i < 20; i++) { 
        const size = Math.random() * 5 + 2; // Tamaño aleatorio
        const angle = Math.random() * Math.PI * 2; // Dirección aleatoria 360°
        const speed = Math.random() * 6 + 2; // Velocidad aleatoria
        // Variación de rojo para realismo
        const redShade = Math.floor(Math.random() * 100 + 155);
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed, // Física: Velocidad X
            vy: Math.sin(angle) * speed, // Física: Velocidad Y
            size: size, color: `rgb(${redShade}, 0, 0)`, life: 1.0 // Opacidad inicial
        });
    }
}

// ======================================================
// 3. SISTEMA DE AUDIO
// ======================================================
// Cargamos los sonidos. Asegúrate de que los archivos estén en la misma carpeta.
let normalSound = new Audio("shoot.wav");
let shotgunSound = new Audio("shotgun.mp3");
let laserSound = new Audio("laser.mp3");
let machineSound = new Audio("machinegun.mp3"); 
let bgMusic = new Audio("background.mp3");
let killSound = new Audio("kill.wav");
let gameOverSound = new Audio("gameover.wav");
let lifeSound = new Audio("life.mp3"); 
let hurtSound = new Audio("hurt.mp3");

bgMusic.loop = true; // La música de fondo se repite
bgMusic.volume = 0.4; // Volumen al 40%

let audioEnabled = true;
// Botón mute
audioBtn.onclick = () => {
    audioEnabled = !audioEnabled;
    audioEnabled ? bgMusic.play() : bgMusic.pause();
    audioBtn.innerText = audioEnabled ? "🔈" : "🔇";
};

// ======================================================
// 4. CONFIGURACIÓN DEL JUEGO Y DIFICULTAD
// ======================================================
const backgroundImg = new Image();
backgroundImg.src = "images/background.png";

let gameDifficulty = "normal";
let zombieSpeedMult = 1.0; // Multiplicador de velocidad base
let zombieSpawnRate = 1500; // Tiempo entre zombies (ms)
let zombieIntervalId = null; // Guardamos el reloj para poder detenerlo

// Función llamada desde el HTML al pulsar botones de dificultad
window.setDifficulty = function(level) {
    gameDifficulty = level;
    // Gestión visual de botones (quita 'selected' de todos)
    document.getElementById("btnEasy").classList.remove("selected");
    document.getElementById("btnNormal").classList.remove("selected");
    document.getElementById("btnHard").classList.remove("selected");
    
    // Configuración según nivel
    if(level === 'easy') {
        document.getElementById("btnEasy").classList.add("selected");
        zombieSpeedMult = 0.7; // 30% más lentos
        zombieSpawnRate = 2000; // Salen cada 2 segundos
    } else if(level === 'normal') {
        document.getElementById("btnNormal").classList.add("selected");
        zombieSpeedMult = 1.0; 
        zombieSpawnRate = 1500; // Cada 1.5 segundos
    } else if(level === 'hard') {
        document.getElementById("btnHard").classList.add("selected");
        zombieSpeedMult = 1.5; // 50% más rápidos
        zombieSpawnRate = 1000; // Cada 1 segundo
    }
};

// ======================================================
// 5. JUGADOR (PLAYER)
// ======================================================
const playerSprite = document.getElementById("playerSprite");

let player = {
    x: 400, y: 250, // Posición inicial
    size: 30, // Radio de colisión (círculo)
    speed: 4, // 💡 Velocidad de movimiento
    lives: 3, // Vidas iniciales
    dirX: 1, dirY: 0, // Dirección a la que mira
    weapon: "normal", // Arma inicial
    invulnerable: false, // Inmortalidad temporal tras golpe
    muzzleFlash: 0 // Contador para el efecto de disparo
};

// Variables globales del estado del juego
let score = 0; let kills = 0;
let gameOver = false; let gameStarted = false; let isPaused = false; 
let startTime = 0; let pauseStartTime = 0; 

// Función para seleccionar personaje e iniciar
function selectCharacter(img) {
    playerSprite.src = "images/" + img; // Carga la imagen seleccionada
    selectScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    resetGame(); // Prepara todo
    gameStarted = true;
    startTime = Date.now();
    if (audioEnabled) bgMusic.play();
}

// Función maestra de reinicio (Reset)
function resetGame() {
    score = 0; kills = 0;
    player.lives = 3; player.weapon = "normal";
    player.x = 400; player.y = 250;
    player.invulnerable = false;
    playerSprite.classList.remove("invulnerable");
    
    // Vaciar arrays (borrar enemigos y balas viejas)
    zombies = []; bullets = []; items = []; weapons = []; particles = [];
    
    gameOver = false; isPaused = false;
    pauseOverlay.classList.add("hidden");
    
    // Limpieza visual
    gameArea.classList.remove("shaking");
    flashOverlay.style.opacity = "0";
    
    // Borrar imágenes residuales del DOM
    document.querySelectorAll("#gameArea img:not(#playerSprite)").forEach(el => el.remove());
    document.querySelectorAll(".floating-text").forEach(el => el.remove());

    // Reiniciar el reloj de spawn de zombies con la nueva dificultad
    if (zombieIntervalId) clearInterval(zombieIntervalId);
    zombieIntervalId = setInterval(spawnZombie, zombieSpawnRate);
    
    updateUI(); // Dibujar HUD inicial
}

// ✅ ACTUALIZAR INTERFAZ (HUD)
function updateUI() {
    if(!uiScore || !uiLives) return; // Evita errores si no cargó el HTML

    uiScore.innerText = score;
    uiKills.innerText = kills;

    // Lógica inteligente de corazones
    let heartsHTML = "";
    if (player.lives <= 5) {
        // Dibuja un corazón por vida
        for(let i=0; i<player.lives; i++) heartsHTML += `<span class="heart">❤️</span>`;
    } else {
        // Si son muchas vidas, colapsa en "❤️ x 10"
        heartsHTML = `<span class="heart">❤️</span> <span style="font-family: 'Creepster', cursive; font-size: 30px; color: white;">x ${player.lives}</span>`;
    }
    uiLives.innerHTML = heartsHTML;

    // Actualizar icono de arma
    let wName = "PISTOLA";
    let wImg = "";
    if (player.weapon === "shotgun") { wName = "ESCOPETA"; wImg = "url('images/shotgun.png')"; }
    else if (player.weapon === "laser") { wName = "LÁSER"; wImg = "url('images/laser.png')"; }
    else if (player.weapon === "machinegun") { wName = "AMETRALLADORA"; wImg = "url('images/machinegun.png')"; }
    
    uiWeaponName.innerText = wName;
    uiWeaponIcon.style.backgroundImage = wImg;
}

// ======================================================
// 6. GENERADORES (SPAWNERS)
// ======================================================
let zombies = [];
const zombieImgs = ["images/zombie1.gif", "images/zombie2.gif", "images/zombie3.gif", "images/zombie4.gif"];

function spawnZombie() {
    if (!gameStarted || gameOver || isPaused) return;
    
    // Elegir lado aleatorio (0:izq, 1:der, 2:arriba, 3:abajo)
    let side = Math.floor(Math.random() * 4);
    let x, y, margin = 25; 
    if (side === 0) { x = margin; y = Math.random() * canvas.height; }
    if (side === 1) { x = canvas.width - margin; y = Math.random() * canvas.height; }
    if (side === 2) { x = Math.random() * canvas.width; y = margin; }
    if (side === 3) { x = Math.random() * canvas.width; y = canvas.height - margin; }

    const zombieImgSrc = zombieImgs[Math.floor(Math.random() * zombieImgs.length)];
    // Detectamos si es el zombie4 para corregir su dirección (si mira al revés)
    const isZombie4 = zombieImgSrc.includes("zombie4.gif"); 

    let z = {
        x, y, size: 25,
        // Velocidad = Base + (Kills * Incremento) * Dificultad
        speed: (1.4 + (kills * 0.015)) * zombieSpeedMult, 
        element: document.createElement("img"),
        isZombie4: isZombie4
    };
    z.element.src = zombieImgSrc;
    z.element.style.position = "absolute"; z.element.style.width = "50px"; z.element.style.zIndex = "5";
    gameArea.appendChild(z.element); zombies.push(z);
}

let items = [];
function spawnWeapon() {
    if (!gameStarted || gameOver || isPaused) return;
    // Posición aleatoria dentro del mapa
    let ix = Math.random() * (canvas.width - 60) + 30;
    let iy = Math.random() * (canvas.height - 60) + 30;
    
    // Probabilidad de arma
    let r = Math.random();
    let type = r < 0.33 ? "shotgun" : (r < 0.66 ? "laser" : "machinegun");
    
    let w = { x: ix, y: iy, size: 20, type: type, element: document.createElement("img") }; 
    w.element.src = "images/" + type + ".png";
    w.element.style.position = "absolute"; w.element.style.width = "40px"; w.element.style.zIndex = 4;
    w.element.classList.add("item-glow"); // Añadir brillo
    gameArea.appendChild(w.element); items.push(w);
    
    // Desaparece en 5s si no la agarras
    setTimeout(() => { if(w.element.parentNode && !isPaused) { w.element.remove(); items = items.filter(x => x !== w); } }, 5000);
}

function spawnHeart() {
    if (!gameStarted || gameOver || isPaused) return;
    let h = { x: Math.random() * (canvas.width - 60) + 30, y: Math.random() * (canvas.height - 60) + 30, size: 20, type: "life", element: document.createElement("img") };
    h.element.src = "images/life.gif"; h.element.style.position = "absolute"; h.element.style.width = "40px"; h.element.style.zIndex = 5;
    h.element.classList.add("item-glow");
    gameArea.appendChild(h.element); items.push(h);
    
    // Desaparece en 3s
    setTimeout(() => { if(h.element.parentNode && !isPaused) { h.element.remove(); items = items.filter(x => x !== h); } }, 3000);
}

// ======================================================
// 7. LÓGICA DE DISPARO
// ======================================================
let bullets = [];

function shoot() {
    if (!gameStarted || gameOver || isPaused) return;
    player.muzzleFlash = 3; // Activar fogonazo visual (dura 3 frames)

    // LÓGICA ESPECIAL: Ametralladora (Dispara ráfaga de 4 balas)
    if (player.weapon === "machinegun") {
        let shots = 0;
        let burstInterval = setInterval(() => {
            if (gameOver || isPaused) { clearInterval(burstInterval); return; }
            // Añade dispersión (imprecisión) para realismo
            let spreadX = (Math.random() - 0.5) * 4; 
            let spreadY = (Math.random() - 0.5) * 4;
            bullets.push({ 
                x: player.x, y: player.y, 
                dx: (player.dirX * 15) + spreadX, 
                dy: (player.dirY * 15) + spreadY, 
                size: 4, type: "machinegun" 
            });
            player.muzzleFlash = 2; // Mantiene el fogonazo
            if (audioEnabled) { let m = machineSound.cloneNode(); m.volume = 0.25; m.play().catch(()=>{}); }
            shots++; if (shots >= 4) clearInterval(burstInterval);
        }, 80); // Cada 80ms
        return; // Salir para no ejecutar la lógica de abajo
    }

    // LÓGICA ARMAS NORMALES
    let sound;
    if (player.weapon === "shotgun") {
        // Escopeta: 3 balas en abanico
        bullets.push({ x: player.x, y: player.y, dx: player.dirX * 7, dy: player.dirY * 7, size: 3, type: "shotgun" });
        bullets.push({ x: player.x, y: player.y, dx: player.dirX * 7 + 0.7, dy: player.dirY * 7 + 0.7, size: 3, type: "shotgun" });
        bullets.push({ x: player.x, y: player.y, dx: player.dirX * 7 - 0.7, dy: player.dirY * 7 - 0.7, size: 3, type: "shotgun" });
        sound = shotgunSound;
    } else if (player.weapon === "laser") {
        // Laser: Muy rápido y preciso
        bullets.push({ x: player.x, y: player.y, dx: player.dirX * 12, dy: player.dirY * 12, size: 3, type: "laser" });
        sound = laserSound;
    } else {
        // Normal
        bullets.push({ x: player.x, y: player.y, dx: player.dirX * 8, dy: player.dirY * 8, size: 4, type: "normal" });
        sound = normalSound;
    }
    if (audioEnabled && sound) sound.cloneNode().play().catch(()=>{});
}

// ======================================================
// 8. CONTROLES
// ======================================================
const keys = {};
document.addEventListener("keydown", e => {
    // Tecla P o ESC para PAUSAR
    if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if(gameStarted && !gameOver) {
            isPaused = !isPaused;
            if(isPaused) { 
                pauseOverlay.classList.remove("hidden"); bgMusic.pause(); 
                pauseStartTime = Date.now(); // Guardar hora de pausa
            } 
            else { 
                pauseOverlay.classList.add("hidden"); if(audioEnabled) bgMusic.play(); 
                startTime += (Date.now() - pauseStartTime); // Compensar tiempo pausado
            }
        }
    }
    // Evitar scroll con flechas
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
    keys[e.key] = true;
    
    // Disparo con Espacio
    if (e.code === "Space" && !e.repeat) shoot();

    // Actualizar dirección si no está pausado
    if(!isPaused) {
        if (e.key === "ArrowLeft") { player.dirX = -1; player.dirY = 0; }
        if (e.key === "ArrowRight") { player.dirX = 1; player.dirY = 0; }
        if (e.key === "ArrowUp") { player.dirY = -1; player.dirX = 0; }
        if (e.key === "ArrowDown") { player.dirY = 1; player.dirX = 0; }
    }
});
document.addEventListener("keyup", e => keys[e.key] = false);

// ======================================================
// 9. COLISIONES
// ======================================================
// Detecta si dos círculos se tocan
function collision(a, b) {
    let dx = a.x - b.x; let dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < a.size + b.size;
}

// ======================================================
// 10. LOOP PRINCIPAL (Aquí ocurre la magia)
// ======================================================
function update() {
    requestAnimationFrame(update); // Llama a esta función 60 veces por segundo
    if(isPaused) return; // Si está pausado, no hace nada

    // 1. Limpiar pantalla
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 2. Dibujar fondo
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    if (gameStarted && !gameOver) {
        // --- A. DIBUJAR Y MOVER SANGRE ---
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx; p.y += p.vy; // Mover
            p.vy += 0.1; // Gravedad
            p.life -= 0.02; p.size *= 0.98; // Desvanecer
            // Si es invisible, borrar del array
            if (p.life <= 0 || p.size <= 0.5) { particles.splice(i, 1); continue; }
            // Dibujar cuadrado rojo
            ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.fillRect(p.x, p.y, p.size, p.size); ctx.restore();
        }

        // --- B. MOVER JUGADOR ---
        if (keys["ArrowLeft"]) player.x -= player.speed;
        if (keys["ArrowRight"]) player.x += player.speed;
        if (keys["ArrowUp"]) player.y -= player.speed;
        if (keys["ArrowDown"]) player.y += player.speed;
        // Mantener dentro de pantalla
        player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
        player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
        // Actualizar imagen CSS del jugador
        playerSprite.style.transform = player.dirX === -1 ? "scaleX(-1)" : "scaleX(1)";
        playerSprite.style.left = (player.x - 32) + "px"; playerSprite.style.top = (player.y - 32) + "px";

        // --- C. DIBUJAR FOGONAZO ---
        if (player.muzzleFlash > 0) {
            ctx.save(); ctx.translate(player.x, player.y);
            let angle = Math.atan2(player.dirY, player.dirX); ctx.rotate(angle);
            // Dibujar óvalos amarillos en la punta del cañón
            ctx.beginPath(); ctx.ellipse(32, 0, 12, 6, 0, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 220, 50, ${player.muzzleFlash / 3})`; ctx.fill();
            ctx.beginPath(); ctx.ellipse(28, 0, 6, 3, 0, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 255, 200, ${player.muzzleFlash / 2})`; ctx.fill();
            ctx.restore(); player.muzzleFlash--; 
        }

        // --- D. GESTIÓN ZOMBIES ---
        for (let i = zombies.length - 1; i >= 0; i--) {
            let z = zombies[i];
            // Mover hacia el jugador
            let angle = Math.atan2(player.y - z.y, player.x - z.x);
            z.x += Math.cos(angle) * z.speed; z.y += Math.sin(angle) * z.speed;
            
            // Voltear sprite según donde esté el jugador
            let scaleDirection = 1;
            if (z.x > player.x) scaleDirection = -1;
            if (z.isZombie4) scaleDirection *= -1; // Corrección zombie 4
            
            z.element.style.transform = `scaleX(${scaleDirection})`;
            z.element.style.left = (z.x - 25) + "px"; z.element.style.top = (z.y - 25) + "px";

            // Colisión Jugador vs Zombie (DAÑO)
            if (collision(player, z) && !player.invulnerable) {
                player.lives--; player.weapon = "normal";
                triggerShake(); triggerFlash("red"); // Efectos
                if(audioEnabled) hurtSound.cloneNode().play().catch(()=>{});
                
                // Activar invulnerabilidad
                player.invulnerable = true; playerSprite.classList.add("invulnerable");
                setTimeout(() => { player.invulnerable = false; playerSprite.classList.remove("invulnerable"); }, 1500);
                
                updateUI(); // Actualizar corazones

                // Morir
                if (player.lives <= 0) {
                    gameOver = true; bgMusic.pause(); if(audioEnabled) gameOverSound.play();
                    let timeSurvived = Math.floor((Date.now() - startTime) / 1000);
                    gameScreen.classList.add("hidden"); gameOverScreen.classList.remove("hidden");
                    resultsDiv.innerHTML = `KILLS: <strong>${kills}</strong><br>SCORE: <strong>${score}</strong><br>TIEMPO: <strong>${timeSurvived} seg</strong>`;
                }
            }
        }

        // --- E. GESTIÓN BALAS ---
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            let b = bullets[bi];
            b.x += b.dx; b.y += b.dy;
            
            // Dibujar balas (diferentes colores y formas según tipo)
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

            // Borrar si salen de pantalla
            if(b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) { bullets.splice(bi, 1); continue; }

            // Colisión Bala vs Zombie
            for (let zi = zombies.length - 1; zi >= 0; zi--) {
                let z = zombies[zi];
                if (collision(b, z)) {
                    spawnBloodExplosion(z.x, z.y); // Sangre
                    z.element.remove(); zombies.splice(zi, 1); // Borrar zombie
                    bullets.splice(bi, 1); // Borrar bala
                    kills++; score += 10;
                    spawnFloatingText(z.x, z.y, "+10", "yellow");
                    if (audioEnabled) killSound.cloneNode().play();
                    updateUI(); // Actualizar score
                    break; // Una bala solo mata un zombie a la vez
                }
            }
        }

        // --- F. GESTIÓN ITEMS (Armas y Vidas) ---
        items.forEach((item, index) => {
            item.element.style.left = (item.x - 20) + "px"; item.element.style.top = (item.y - 20) + "px";
            if (collision(player, item)) {
                if (item.type === "life") {
                    player.lives++; triggerFlash("lime"); spawnFloatingText(item.x, item.y, "+1 VIDA", "lime");
                    if(audioEnabled) lifeSound.cloneNode().play().catch(()=>{});
                } else {
                    player.weapon = item.type; spawnFloatingText(item.x, item.y, item.type.toUpperCase(), "cyan");
                }
                item.element.remove(); items.splice(index, 1);
                updateUI(); 
            }
        });
    }
}

// ======================================================
// 11. INICIO DE TEMPORIZADORES SECUNDARIOS
// ======================================================
setInterval(spawnWeapon, 6000); // Armas cada 6s
setInterval(spawnHeart, 15000); // Vida cada 15s

// Arrancar el juego
update();