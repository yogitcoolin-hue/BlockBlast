const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ===== STATE =====
let state = "menu";
let theme = "space";

window.setTheme = function (t) {
  theme = t;
};

// ===== AUDIO =====
let audioCtx;
let musicStarted = false;

// ===== GAME =====
const GRID = 10;
const CELL = 30;
const OFFSET = 50;

let grid = [];
let pieces = [];
let mouse = { x: 0, y: 0 };

let score = 0;
let level = 1;
let combo = 0;

// ===== STARS =====
let stars = Array.from({ length: 80 }, () => ({
  x: Math.random() * 400,
  y: Math.random() * 600,
  r: Math.random() * 2
}));

// ===== SHAPES =====
const COLORS = ["#ff4d4d", "#4dff88", "#4d79ff", "#ffd24d"];

const SHAPES = [
  [[1,1]],
  [[1,1,1]],
  [[1],[1],[1]],
  [[1,1],[1,1]],
  [[1,1,1],[0,1,0]]
];

// ===== GRID =====
function resetGrid() {
  grid = Array.from({ length: GRID }, () => Array(GRID).fill(0));
}

// ===== PIECES =====
function newPiece() {
  return {
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    x: 0,
    y: 0,
    drag: false
  };
}

function layoutPieces() {
  const startX = canvas.width / 2 - 120;

  pieces.forEach((p, i) => {
    if (!p.drag) {
      p.x = startX + i * 120;
      p.y = 395;
    }
  });
}

// ===== BACKGROUND =====
function drawBackground() {
  if (theme === "space") {
    ctx.fillStyle = "#05060a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  else if (theme === "neon") {
    ctx.fillStyle = "#0a0015";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(0,255,255,0.12)";
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
  }

  else if (theme === "pastel") {
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, "#ffd6e0");
    g.addColorStop(1, "#d6e4ff");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  else {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ===== MUSIC =====
function startMusic() {
  if (musicStarted) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicStarted = true;

  const notes = [262,0,330,0,392,0,330,0,294,0,262,0];

  function loop() {
    const now = audioCtx.currentTime;

    notes.forEach((n, i) => {
      if (!n) return;

      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();

      o.frequency.value = n;
      o.type = "square";
      g.gain.value = 0.05;

      o.connect(g);
      g.connect(audioCtx.destination);

      o.start(now + i * 0.25);
      o.stop(now + i * 0.25 + 0.2);
    });

    setTimeout(loop, notes.length * 250);
  }

  loop();
}

// ===== SOUND =====
function beep(freq = 400) {
  if (!audioCtx) return;

  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  o.frequency.value = freq;
  o.type = "square";
  g.gain.value = 0.08;

  o.connect(g);
  g.connect(audioCtx.destination);

  o.start();
  o.stop(audioCtx.currentTime + 0.1);
}

// ===== LEVEL =====
function updateLevel() {
  level = Math.floor(score / 200) + 1;
}

// ===== CHECK =====
function canPlace(shape, gx, gy) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        let nx = gx + x;
        let ny = gy + y;

        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) return false;
        if (grid[ny][nx]) return false;
      }
    }
  }
  return true;
}

// ===== PLACE =====
function place(shape, color, gx, gy) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        grid[gy + y][gx + x] = color;
      }
    }
  }

  combo++;
  score += 10 * level + combo * 2;

  beep(500);
  updateLevel();
}

// ===== START =====
function startGame() {
  resetGrid();
  pieces = [newPiece(), newPiece(), newPiece()];
  layoutPieces();

  score = 0;
  level = 1;
  combo = 0;
  state = "play";

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  startMusic();
}

// ===== INPUT =====
canvas.onmousedown = (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;

  if (state === "menu") {
    startGame();
    return;
  }

  pieces.forEach(p => {
    if (
      mouse.x > p.x && mouse.x < p.x + 120 &&
      mouse.y > p.y && mouse.y < p.y + 120
    ) {
      p.drag = true;
    }
  });
};

canvas.onmouseup = () => {
  pieces.forEach((p, i) => {
    if (!p.drag) return;

    let gx = Math.floor((mouse.x - OFFSET) / CELL);
    let gy = Math.floor((mouse.y - OFFSET) / CELL);

    if (canPlace(p.shape, gx, gy)) {
      place(p.shape, p.color, gx, gy);
      pieces[i] = newPiece();
    }

    p.drag = false;
  });
};

canvas.onmousemove = (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;

  pieces.forEach(p => {
    if (p.drag) {
      p.x = mouse.x - 40;
      p.y = mouse.y - 40;
    }
  });
};

// ===== DRAW =====
function draw() {
  drawBackground();

  if (state === "menu") {
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.fillText("BLOCK BLAST", 80, 150);

    ctx.font = "16px Arial";
    ctx.fillText("CLICK TO START", 120, 200);

    requestAnimationFrame(draw);
    return;
  }

  // GRID
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.strokeRect(x * CELL + OFFSET, y * CELL + OFFSET, CELL, CELL);

      if (grid[y][x]) {
        ctx.fillStyle = grid[y][x];
        ctx.fillRect(x * CELL + OFFSET, y * CELL + OFFSET, CELL, CELL);
      }
    }
  }

  // PIECES
  pieces.forEach(p => {
    ctx.fillStyle = p.color;

    p.shape.forEach((row, y) => {
      row.forEach((v, x) => {
        if (v) {
          ctx.fillRect(p.x + x * CELL, p.y + y * CELL, CELL, CELL);
        }
      });
    });
  });

  layoutPieces();

  // ===== HUD (COLORFUL TEXT FIX) =====
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, canvas.width, 40);

  // SCORE (yellow)
  ctx.fillStyle = "#ffd24d";
  ctx.font = "14px Arial";
  ctx.fillText("Score: " + score, 10, 25);

  // LEVEL (green)
  ctx.fillStyle = "#4dff88";
  ctx.fillText("Level: " + level, 150, 25);

  // COMBO (blue)
  ctx.fillStyle = "#4d79ff";
  ctx.fillText("Combo: x" + combo, 270, 25);

  requestAnimationFrame(draw);
}

// ===== INIT =====
resetGrid();
pieces = [newPiece(), newPiece(), newPiece()];
draw();