# VazKills-Zombies

**Desarrollador:** Juan Francisco Vázquez Acedo  
**Juego Web Indie Minimalista en JavaScript**  
Link para jugar: https://juanfranciscovazquezuth.github.io/VazKills-Zombies/

---

## 🎮 Descripción del Juego

**VazKills-Zombies** es un juego web indie minimalista en el que controlas a un jugador en un escenario cerrado, enfrentando hordas de zombies.  
El objetivo es sobrevivir el mayor tiempo posible, eliminar enemigos y recoger armas especiales para aumentar tu poder de ataque.  

El juego está desarrollado completamente en **JavaScript, HTML y CSS**, incluyendo imágenes y efectos de sonido para una experiencia inmersiva.

---

## ⚙️ Mecánicas y Funciones

### **Jugador**
- Se mueve usando **WASD** o **flechas del teclado**.
- Puede disparar con **barra espaciadora**.
- Tiene **3 vidas** iniciales.
- Puede recoger armas especiales:
  - **Shotgun:** Dispara múltiples balas en abanico.
  - **Laser:** Disparo más rápido y potente.
- Al recibir daño:
  - Pierde una vida.
  - Pierde cualquier arma especial y vuelve a arma normal.
  - Se activa un **efecto shake de pantalla completa** por unos segundos.
  - Se vuelve **invencible temporalmente** para evitar perder varias vidas seguidas.

### **Zombies**
- Aparecen de los 4 lados del escenario.
- Persiguen al jugador con velocidad constante.
- Si chocan con el jugador, le quitan una vida.

### **Balas**
- Dependen del arma que tengas equipada:
  - Normal: bala simple.
  - Shotgun: abanico de 3 balas.
  - Laser: bala más rápida y grande.
- Cada bala elimina zombies al colisionar con ellos.
- Se reproduce sonido específico de cada arma al disparar.

### **Armas en el mapa**
- Aparecen aleatoriamente cada cierto tiempo.
- Desaparecen automáticamente si no se recogen después de **3 segundos**.
- Imagen personalizada de cada arma (PNG) se muestra en el mapa.
- Recoger un arma reemplaza el sonido de disparo por el correspondiente.

### **Score y Estadísticas**
- **Score:** Aumenta automáticamente con el tiempo.
- **Kills:** Contador de zombies eliminados.
- **Lives:** Vidas restantes.
- **Weapon:** Arma actual equipada.

### **Sonidos**
- Sonido de disparo según arma:
  - `shoot.wav` para arma normal.
  - `shotgun.mp3` para shotgun.
  - `laser.mp3` para laser.
- `kill.wav` al eliminar un zombie.
- `gameover.wav` al perder todas las vidas.
- `background.mp3` se reproduce en **loop** hasta el fin del juego.
- Botón para silenciar o activar audio durante el juego.

### **Botón Reiniciar**
- Reinicia la partida restableciendo:
  - Posición del jugador
  - Vidas, arma y estadísticas
  - Zombies, balas y armas en el mapa
  - Score y kills

---

## 🕹️ Cómo Jugar

1. Abrir el juego en un navegador moderno (Chrome, Edge, Firefox).  
2. Controles:
   - **Mover jugador:** W/A/S/D o flechas ↑ ↓ ← →  
   - **Disparar:** Barra espaciadora  
   - **Reiniciar juego:** Botón "Restart"  
   - **Silenciar/Activar audio:** Botón "Silenciar Audio"  

3. Sobrevive el mayor tiempo posible y elimina todos los zombies que aparezcan.  
4. Recoge armas para mejorar tu poder de ataque.  
5. Evita que los zombies te toquen para no perder vidas.

---

## 🛠️ Tecnologías Usadas

- **HTML5** – Estructura de la página y canvas.  
- **CSS3** – Estilos simples y funcionales.  
- **JavaScript** – Lógica del juego, animaciones y control de audio.  
- **Canvas API** – Para dibujar jugador, zombies, balas y armas.  
- **Audio** – Efectos de sonido y música de fondo.  
- **Git & GitHub** – Control de versiones y publicación en línea.  

---

## 📂 Estructura del Proyecto

