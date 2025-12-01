# 🧟‍♂️ VazKills Zombies

> **Desarrollador:** Juan Francisco Vázquez Acedo  
> **Versión:** 1.0 (Final Release)  
> **Tecnologías:** JavaScript Vanilla, HTML5 Canvas, CSS3

## 🎮 Descripción

**VazKills Zombies** es un *shooter* de supervivencia 2D de ritmo rápido desarrollado en tecnologías web nativas. El jugador debe resistir oleadas infinitas de enemigos en un entorno cerrado, utilizando un arsenal variado y reflejos rápidos.

Esta versión final incluye mejoras significativas en **"Game Feel"** (retroalimentación visual), un sistema de dificultad escalable y una interfaz de usuario (HUD) moderna.

## ✨ Novedades de la Versión Final

* **🩸 Sistema de Gore:** Explosiones de partículas de sangre al eliminar enemigos.
* **🔫 Nueva Arma:** Ametralladora (Machine Gun) con alta cadencia de fuego.
* **❤️ Power-ups:** Corazones recolectables para recuperar vidas.
* **⚙️ Dificultad Dinámica:** Selector de dificultad (Fácil, Normal, Difícil) que ajusta la velocidad y frecuencia de los enemigos.
* **🖥️ HUD Profesional:** Interfaz gráfica superpuesta con fuentes personalizadas (*Creepster*).
* **✨ Feedback Visual:** Destellos al disparar (*Muzzle Flash*), temblor de pantalla (*Screen Shake*), texto flotante de daño y efectos de parpadeo por daño.

## ⚙️ Mecánicas de Juego

### 🕹️ Controles
| Acción | Tecla / Input |
| :--- | :--- |
| **Moverse** | `W`, `A`, `S`, `D` o Flechas `↑`, `↓`, `←`, `→` |
| **Disparar** | `Barra Espaciadora` |
| **Pausar** | `P` o `ESC` |
| **Interfaz** | `Clic Izquierdo` (Mouse) |

### ⚔️ Armas y Combate
El jugador comienza con una pistola básica, pero puede recoger cajas de armas que aparecen aleatoriamente (brillan en el suelo):

1.  **Pistola:** Disparo simple, cadencia media.
2.  **Escopeta (Shotgun):** Dispara 3 proyectiles en abanico. Ideal para control de masas a corta distancia.
3.  **Láser:** Proyectil de alta velocidad y precisión (cian).
4.  **Ametralladora (Machine Gun):** Dispara ráfagas rápidas de 4 balas (verde neón).

### ❤️ Salud y Daño
* **Vidas Iniciales:** 3 Corazones.
* **Daño:** Al ser tocado por un zombie, el jugador pierde una vida, el arma especial se rompe y la pantalla tiembla y parpadea en rojo.
* **Invulnerabilidad:** Tras recibir daño, el jugador es inmune brevemente (parpadeo visual).
* **Recuperación:** Aparecen ítems de corazón (`life.gif`) que otorgan `+1 Vida`.

### 🧟 Enemigos (Zombies)
* Utilizan un algoritmo de persecución vectorial para seguir al jugador constantemente.
* Su velocidad incrementa progresivamente según el número de *Kills* y el nivel de dificultad seleccionado.

## 🔊 Audio y Efectos

El juego cuenta con un sistema de audio inmersivo con gestión de canales múltiples (clonación de nodos de audio para sonidos simultáneos):

* **Disparos:** Sonidos únicos para cada arma (`shoot.wav`, `shotgun.mp3`, `laser.mp3`, `machinegun.mp3`).
* **Feedback:** Sonido de impacto (`kill.wav`), daño recibido (`hurt.mp3`) y vida extra (`life.mp3`).
* **Ambiente:** Música de fondo en loop (`background.mp3`) y Game Over (`gameover.wav`).

## 🛠️ Tecnologías Implementadas

* **HTML5:** Estructura semántica y contenedor del juego.
* **CSS3:** Estilos avanzados, animaciones (`keyframes` para brillo y temblor), fuentes web (Google Fonts) y diseño responsivo.
* **JavaScript (ES6):**
    * Lógica del bucle de juego (`requestAnimationFrame`).
    * Motor de física propio (Colisiones círculo-círculo).
    * Gestión de Arrays para entidades (balas, partículas, enemigos).
    * Manipulación del DOM para el HUD.

## 🚀 Instalación y Ejecución

1.  Clonar el repositorio o descargar el archivo `.zip`.
2.  Asegurarse de que la estructura de carpetas sea:
    * `index.html`
    * `style.css`
    * `game.js`
    * `/images` (carpeta con los assets gráficos)
    * *(Archivos de audio en la raíz)*
3.  Abrir `index.html` en cualquier navegador moderno (Chrome, Firefox, Edge).

---
**© 2023 VazKills Zombies** - Desarrollado con fines educativos.
