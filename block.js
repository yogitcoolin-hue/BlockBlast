window.onload = () => {

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

  function resetGrid() {
    grid = Array.from({ length: GRID }, () => Array(GRID).fill(0));
  }

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

  function drawBackground() {
    ctx.fillStyle = "#05060a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function startMusic() {
    if (musicStarted) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    musicStarted = true;
  }

  function beep(freq = 400) {
    if (!audioCtx) return;

    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    o.frequency.value = freq;
    o.connect(g);
    g.connect(audioCtx.destination);

    o.start();
    o.stop(audioCtx.currentTime + 0.1);
  }

  function updateLevel() {
    level = Math.floor(score / 200) + 1;
  }

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

  function startGame() {
    resetGrid();
    pieces = [newPiece(), newPiece(), newPiece()];
    layoutPieces();

    score = 0;
    level = 1;
    combo = 0;
    state = "play";

    startMusic();
  }

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

  function draw() {
    drawBackground();

    if (state === "menu") {
      ctx.fillStyle = "white";
      ctx.font = "28px Arial";
      ctx.fillText("BLOCK BLAST", 80, 150);
      ctx.fillText("CLICK TO START", 100, 200);
      requestAnimationFrame(draw);
      return;
    }

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
    requestAnimationFrame(draw);
  }

  resetGrid();
  pieces = [newPiece(), newPiece(), newPiece()];
  draw();
};
