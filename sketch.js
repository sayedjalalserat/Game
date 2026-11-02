
const tileSize = 40;
const pacmanSpeed = 3;
const ghostSpeed = 3; 
const lifeLostDuration = 90; // 90 frames = 1.5 sec
const totalLevels = 2;

const gameState = {
  MENU: 0,
  PLAYING: 1,
  LIFELOST: 2,
  GAMEOVER: 3,
  LEVELCOMPLETE: 4
};

let mazeLayout = [
  "11111111111111111111",
  "12222222211222222221",
  "12112111211211121121",
  "12112111211211121121",
  "12222222222222222221",
  "12112111111111121121",
  "12222221222212222221",
  "11111122211222111111",
  "12222221222212222221",
  "12112111111111121121",
  "12222222222222222221",
  "12112111211211121121",
  "12112111211211121121",
  "12222222211222222221",
  "11111111111111111111"
];


let mazeLayout2 = [
  "11111111111111111111",
  "12222222222222222221",
  "12121212121212121211",
  "12222222222222222221",
  "11212121212121212121",
  "12222222222222222221",
  "12121212121212121211",
  "12222222222222222221",
  "11212121212121212121",
  "12222222222222222221",
  "12121212121212121211",
  "12222222222222222221",
  "11212121212121212121",
  "12222222222222222221",
  "11111111111111111111"
];

// ---------- Global variables ----------
let offsetX, offsetY;
let currentLayout = mazeLayout;

let pacmanImg, ghostImg, pelletImg;
let playBtnImg, resetBtnImg, exitBtnImg, returnBtnImg, nextLevelBtnImg;

let game, maze, pacman, ghost, pellets, endScreen;
let playBtn, resetBtn, exitBtn;
let pelletSound, hitSound, winSound, loseSound;

// ============================================================
// p5 LIFECYCLE
// ============================================================

function preload() {
  pacmanImg = loadImage('assets/pacmanImg.png');
  ghostImg = loadImage('assets/ghostImg.png');
  pelletImg = loadImage('assets/pelletImg.png');
  playBtnImg = loadImage('assets/playBtnImg.png');
  exitBtnImg = loadImage('assets/exitBtnImg.png');
  resetBtnImg = loadImage('assets/resetBtnImg.png');
  returnBtnImg = loadImage('assets/returnBtnImg.png');
  nextLevelBtnImg = loadImage('assets/nextLevelBtnImg.png');
}

function setup() {
  new Canvas(1000, 800);
  displayMode('centered');

  const cols = mazeLayout[0].length;
  const rows = mazeLayout.length;

  // Centre the maze on the canvas
  offsetX = (width - cols * tileSize) / 2;
  offsetY = (height - rows * tileSize) / 2 + 25;

  game = new Game();
  maze = new Maze(tileSize);
  pellets = new Pellets(pelletImg, tileSize);

  maze.wallGroup.tile = '1';
  pellets.group.tile = '2';

  new Tiles(mazeLayout, offsetX + tileSize / 2, offsetY + tileSize / 2, tileSize, tileSize);

  maze.hide();
  pellets.hide();

  // Pac-Man starts top left, the ghost starts bottom right (works for any layout size)
  pacman = new PacMan(offsetX + tileSize * 1.5, offsetY + tileSize * 1.5, pacmanImg);
  ghost = new Ghost(offsetX + tileSize * (cols - 3), offsetY + tileSize * (rows - 6), ghostImg);
  ghost1 = new Ghost(offsetX + tileSize * (cols - 4.5), offsetY + tileSize * (rows - 5), ghostImg);
  ghost2 = new Ghost(offsetX + tileSize * (cols - 6), offsetY + tileSize * (rows - 4), ghostImg);
  ghost3 = new Ghost(offsetX + tileSize * (cols - 9), offsetY + tileSize * (rows - 3), ghostImg);


  playBtn = new Button(width / 2, height / 2 - 60, 120, 35, playBtnImg);
  resetBtn = new Button(width / 2, height / 2, 120, 35, resetBtnImg);
  exitBtn = new Button(width / 2, height / 2 + 60, 120, 35, exitBtnImg);
  endScreen = new EndScreen(width / 2, height / 2 + 80, 160, 40, returnBtnImg, nextLevelBtnImg);

  pelletSound = new Sound('assets/pellet.mp3', 0.1);
  hitSound = new Sound('assets/hit.mp3');
  winSound = new Sound('assets/win.mp3');
  loseSound = new Sound('assets/lose.mp3');

  returnToMenu();
}

function draw() {
  background(0);

  if (game.state === gameState.MENU) {
    showMenu();
  } else if (game.state === gameState.PLAYING) {
    playGame();
  } else if (game.state === gameState.LIFELOST) {
    showLifeLostMessage();
  } else if (game.state === gameState.GAMEOVER) {
    showEndScreen('GAME OVER', color(255, 0, 0), false);
  } else if (game.state === gameState.LEVELCOMPLETE) {
    // Next Level button only shows if there is another level to go to
    showEndScreen('LEVEL COMPLETE', color(0, 255, 0), game.level < totalLevels);
  }
}

// ============================================================
// GAME FLOW
// ============================================================

function playGame() {
  maze.show();
  pacman.show();
  ghost.show();
  pellets.show();
  ghost.show();
  ghost1.show();
  ghost2.show();
  ghost3.show();
  pacman.move();
  ghost.chase(pacman.sprite);

  pacman.sprite.overlaps(pellets.group, function (player, pellet) {
    pellet.remove();
    game.addScore();
    pelletSound.play();
  });

  if (pacman.sprite.overlaps(ghost.sprite)) {
    handleGhostCollision();
  }

  game.checkLevelComplete(pellets.group.length);
  drawHUD();

  if (game.state === gameState.LEVELCOMPLETE) {
    winSound.play();
  }
}

function buildLevel(layout) {
  currentLayout = layout;
  maze.wallGroup.removeAll();
  pellets.group.removeAll();
  new Tiles(layout, offsetX + tileSize / 2, offsetY + tileSize / 2, tileSize, tileSize);
}

function startNewGame() {
  hideMenu();
  game.resetSession();
  buildLevel(mazeLayout);
  pacman.resetPosition();
  ghost.resetPosition();
  game.state = gameState.PLAYING;
}

function startNextLevel() {
  game.level++;
  buildLevel(mazeLayout2);
  pacman.resetPosition();
  ghost.resetPosition();
  game.state = gameState.PLAYING; // score and lives carry over, so no resetSession() here
}

function handleGhostCollision() {
  game.loseLife();
  pacman.resetPosition();
  ghost.resetPosition();
  hitSound.play();

  if (!game.checkGameOver()) {
    loseSound.play();
    game.state = gameState.LIFELOST;
    game.messageTimer = lifeLostDuration;
  }
}

function returnToMenu() {
  game.state = gameState.MENU;
  maze.hide();
  pacman.hide();
  ghost.hide();
  pellets.hide();
  endScreen.hide();
  playBtn.show();
  resetBtn.show();
  exitBtn.show();
}

function hideMenu() {
  playBtn.hide();
  resetBtn.hide();
  exitBtn.hide();
}

// ============================================================
// SCREENS
// ============================================================

function showMenu() {
  playBtn.show();
  resetBtn.show();
  exitBtn.show();

  fill(255, 255, 0);
  textAlign(CENTER, CENTER);
  textSize(36);
  text('PAC-MAN', width / 2, height / 2 - 140);

  fill(255);
  textSize(20);
  text('HIGH SCORE: ' + game.highScore, width / 2, height / 2 - 90);

  if (playBtn.isPressed()) {
    startNewGame();
  }

  if (resetBtn.isPressed()) {
    game.resetHighScore();
  }

  if (exitBtn.isPressed()) {
    window.location.href = 'https://www.google.com';
  }
}

function showLifeLostMessage() {
  maze.hide();
  pacman.hide();
  ghost.hide();
  pellets.hide();

  fill(255, 0, 0);
  textAlign(CENTER, CENTER);
  textSize(28);
  text('You lost a life! Try again', width / 2, height / 2 - 20);

  fill(255);
  textSize(18);
  text('Score: ' + game.score, width / 2, height / 2 + 20);

  game.messageTimer--;
  if (game.messageTimer <= 0) {
    game.state = gameState.PLAYING;
  }
}

function showEndScreen(message, messageColor, showNext) {
  maze.hide();
  pacman.hide();
  ghost.hide();
  pellets.hide();

  fill(messageColor);
  textAlign(CENTER, CENTER);
  textSize(32);
  text(message, width / 2, height / 2 - 60);

  fill(255);
  textSize(18);
  text('Final Score: ' + game.score, width / 2, height / 2 - 10);

  endScreen.show(showNext);

  if (endScreen.isBackPressed()) {
    endScreen.hide();
    returnToMenu();
  }

  if (showNext && endScreen.isNextPressed()) {
    endScreen.hide();
    startNextLevel();
  }
}

function drawHUD() {
  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);
  text('Score: ' + game.score, 20, 15);
  text('High Score: ' + game.highScore, 200, 15);
  text('Lives: ' + game.lives, 420, 15);
}

// ============================================================
// CLASSES
// ============================================================

class Game {
  constructor() {
    this.state = gameState.MENU;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.highScore = parseInt(localStorage.getItem('pacman_high')) || 0;
    this.messageTimer = 0;
  }

  addScore() {
    this.score += 10;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pacman_high', this.highScore);
    }
  }

  loseLife() {
    this.lives--;
  }

  checkGameOver() {
    if (this.lives <= 0) {
      this.state = gameState.GAMEOVER;
      return true;
    }
    return false;
  }

  checkLevelComplete(remainingPellets) {
    if (remainingPellets <= 0 && this.state === gameState.PLAYING) {
      this.state = gameState.LEVELCOMPLETE;
    }
  }

  resetHighScore() {
    this.highScore = 0;
    localStorage.setItem('pacman_high', 0);
  }

  resetSession() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
  }
}

class Maze {
  constructor(tileSize) {
    this.tileSize = tileSize;
    this.wallGroup = new Group();
    this.wallGroup.collider = 'static';
    this.wallGroup.color = 'blue';
    this.wallGroup.w = this.tileSize;
    this.wallGroup.h = this.tileSize;
  }

  show() {
    this.wallGroup.visible = true;
  }

  hide() {
    this.wallGroup.visible = false;
  }
}

class Pellets {
  constructor(img, tileSize) {
    this.tileSize = tileSize;
    this.group = new Group();
    this.group.w = 16;
    this.group.h = 16;
    this.group.collider = 'none';
    this.group.img = pelletImg;
  }

  show() {
    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }
}

class PacMan {
  constructor(x, y, img) {
    this.startX = x;
    this.startY = y;

    this.sprite = new Sprite(x, y, tileSize - 6, tileSize - 6, 'dynamic');
    if (img) this.sprite.img = img;
    this.sprite.rotationLock = true;
    this.sprite.friction = 0;
    this.sprite.bounciness = 0;
    this.sprite.visible = false;

    this.dirX = 0;     // current direction
    this.dirY = 0;
    this.queuedX = 0;  // direction the player wants next
    this.queuedY = 0;
  }

  // Works out which tile Pac-Man is in and where that tile's centre is
  tileCentre() {
    const col = floor((this.sprite.x - offsetX) / tileSize);
    const row = floor((this.sprite.y - offsetY) / tileSize);
    return {
      col: col,
      row: row,
      x: offsetX + col * tileSize + tileSize / 2,
      y: offsetY + row * tileSize + tileSize / 2
    };
  }

  // Can Pac-Man switch to this direction right now?
  canTurn(dx, dy) {
    if (dx === 0 && dy === 0) return false;

    // Reversing along the same line is always safe
    const sameLine = (dx !== 0 && this.dirX !== 0) || (dy !== 0 && this.dirY !== 0);
    if (sameLine) return true;

    const t = this.tileCentre();
    const tolerance = 4;

    // Turning up/down needs x lined up, turning left/right needs y lined up
    if (dy !== 0 && abs(this.sprite.x - t.x) > tolerance) return false;
    if (dx !== 0 && abs(this.sprite.y - t.y) > tolerance) return false;

    // The tile in the new direction must not be a wall
    return currentLayout[t.row + dy][t.col + dx] !== '1';
  }

  // Switch direction and snap onto the centre line so he stays in the corridor
  turn(dx, dy) {
    const t = this.tileCentre();
    if (dy !== 0) this.sprite.x = t.x;
    if (dx !== 0) this.sprite.y = t.y;
    this.dirX = dx;
    this.dirY = dy;
  }

  move() {
    // 1. Keys only set the queued direction
    if (kb.presses('left') || kb.presses('a')) { this.queuedX = -1; this.queuedY = 0; }
    if (kb.presses('right') || kb.presses('d')) { this.queuedX = 1; this.queuedY = 0; }
    if (kb.presses('up') || kb.presses('w')) { this.queuedX = 0; this.queuedY = -1; }
    if (kb.presses('down') || kb.presses('s')) { this.queuedX = 0; this.queuedY = 1; }

    // 2. Turn as soon as the queued direction is possible
    if (this.canTurn(this.queuedX, this.queuedY)) {
      this.turn(this.queuedX, this.queuedY);
    }

    // 3. Keep moving in the current direction
    this.sprite.vel.x = this.dirX * pacmanSpeed;
    this.sprite.vel.y = this.dirY * pacmanSpeed;
  }

  resetPosition() {
    this.sprite.x = this.startX;
    this.sprite.y = this.startY;
    this.sprite.vel.x = 0;
    this.sprite.vel.y = 0;
    this.dirX = 0;
    this.dirY = 0;
    this.queuedX = 0;
    this.queuedY = 0;
  }

  show() {
    this.sprite.visible = true;
  }

  hide() {
    this.sprite.visible = false;
  }
}

class Ghost {
  constructor(x, y, img) {
    this.startX = x;
    this.startY = y;

    this.sprite = new Sprite(x, y, tileSize - 6, tileSize - 6, 'dynamic');
    if (img) this.sprite.img = img;
    this.sprite.rotationLock = true;
    this.sprite.friction = 0;
    this.sprite.bounciness = 0;
    this.sprite.visible = false;

    this.speed = ghostSpeed;
    this.path = [];       // route from the ghost to Pac-Man, found by A*
    this.nextTile = null; // the tile the ghost is currently walking to
  }

  // Run A* from the ghost's tile to Pac-Man's tile, then store the next tile to walk to
  planNextStep(target) {
    const from = pixelToTile(this.sprite.x, this.sprite.y);
    const to = pixelToTile(target.x, target.y);
    this.path = findPath(from.col, from.row, to.col, to.row);
    // path[0] is the tile the ghost is on, path[1] is the next one
    this.nextTile = this.path.length >= 2 ? this.path[1] : null;
  }

  chase(target) {
    if (this.nextTile === null) this.planNextStep(target);

    // Arrived at the next tile: snap to its centre and plan the next step straight away
    if (this.nextTile !== null) {
      const dest = tileToPixel(this.nextTile.col, this.nextTile.row);
      if (Math.hypot(dest.x - this.sprite.x, dest.y - this.sprite.y) <= this.speed) {
        this.sprite.x = dest.x;
        this.sprite.y = dest.y;
        this.planNextStep(target);
      }
    }

    // Nowhere to go (already on Pac-Man's tile, or no route)
    if (this.nextTile === null) {
      this.sprite.vel.x = 0;
      this.sprite.vel.y = 0;
      return;
    }

    // Move towards the centre of the next tile
    const dest = tileToPixel(this.nextTile.col, this.nextTile.row);
    const dx = dest.x - this.sprite.x;
    const dy = dest.y - this.sprite.y;
    const d = Math.hypot(dx, dy);
    this.sprite.vel.x = (dx / d) * this.speed;
    this.sprite.vel.y = (dy / d) * this.speed;
  }

  resetPosition() {
    this.sprite.x = this.startX;
    this.sprite.y = this.startY;
    this.sprite.vel.x = 0;
    this.sprite.vel.y = 0;
    this.path = [];
    this.nextTile = null;
  }

  show() {
    this.sprite.visible = true;
  }

  hide() {
    this.sprite.visible = false;
  }
}

class Button {
  constructor(x, y, w, h, img) {
    this.homeX = x;
    this.homeY = y;

    this.sprite = new Sprite(x, y, w, h, 'static');
    if (img) this.sprite.img = img;
    else this.sprite.color = 'gray';

    // Hidden buttons are moved off screen so their colliders never block the maze
    this.sprite.x = -1000;
    this.sprite.y = -1000;
    this.sprite.visible = false;
  }

  isPressed() {
    return this.sprite.visible && this.sprite.mouse.pressed();
  }

  show() {
    this.sprite.x = this.homeX;
    this.sprite.y = this.homeY;
    this.sprite.visible = true;
  }

  hide() {
    this.sprite.x = -1000;
    this.sprite.y = -1000;
    this.sprite.visible = false;
  }
}

class EndScreen {
  constructor(x, y, w, h, backImg, nextImg) {
    this.backButton = new Button(x - 90, y, w, h, backImg);
    this.nextButton = new Button(x + 90, y, w, h, nextImg);
  }

  show(showNext) {
    this.backButton.show();
    if (showNext) {
      this.nextButton.show();
    } else {
      this.nextButton.hide();
    }
  }

  hide() {
    this.backButton.hide();
    this.nextButton.hide();
  }

  isBackPressed() {
    return this.backButton.isPressed();
  }

  isNextPressed() {
    return this.nextButton.isPressed();
  }
}

class Sound {
  constructor(path, volume = 0.5) {
    this.audio = new Audio(path);
    this.audio.volume = volume; // 0 to 1
  }

  play() {
    this.audio.currentTime = 0; // restart from the start every time
    
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
}

// ============================================================
// PATHFINDING (A*)
// ============================================================

// Pixel position to tile column/row
function pixelToTile(x, y) {
  return {
    col: floor((x - offsetX) / tileSize),
    row: floor((y - offsetY) / tileSize)
  };
}

// Tile column/row to the pixel centre of that tile
function tileToPixel(col, row) {
  return {
    x: offsetX + col * tileSize + tileSize / 2,
    y: offsetY + row * tileSize + tileSize / 2
  };
}

// Open tiles directly up, down, left and right of a tile
function getNeighbours(col, row) {
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const result = [];

  for (const [dc, dr] of dirs) {
    const nc = col + dc;
    const nr = row + dr;
    if (nr < 0 || nr >= currentLayout.length || nc < 0 || nc >= currentLayout[0].length) continue;
    if (currentLayout[nr][nc] === '1') continue; // wall
    result.push({ col: nc, row: nr });
  }
  return result;
}

// A* pathfinding. Returns an array of {col, row} from start to goal, or [] if there is no path
function findPath(startCol, startRow, goalCol, goalRow) {
  const tileKey = (c, r) => c + ',' + r;
  const heuristic = (c, r) => abs(c - goalCol) + abs(r - goalRow); // Manhattan distance

  const nodes = new Map();      // every tile reached so far
  const openList = [];          // tiles to be checked
  const closedSet = new Set();  // checked tiles

  const startNode = {
    col: startCol,
    row: startRow,
    g: 0,
    f: heuristic(startCol, startRow),
    parent: null
  };
  nodes.set(tileKey(startCol, startRow), startNode);
  openList.push(startNode);

  while (openList.length > 0) {
    // 1. Take the open tile with the lowest f
    let bestIndex = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[bestIndex].f) bestIndex = i;
    }
    const current = openList.splice(bestIndex, 1)[0];

    // 2. Goal reached: follow the parents back to build the path
    if (current.col === goalCol && current.row === goalRow) {
      const path = [];
      let node = current;
      while (node !== null) {
        path.unshift({ col: node.col, row: node.row });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(tileKey(current.col, current.row));

    // 3. Check each neighbour
    for (const nb of getNeighbours(current.col, current.row)) {
      const k = tileKey(nb.col, nb.row);
      if (closedSet.has(k)) continue;

      const newG = current.g + 1;
      const existing = nodes.get(k);

      if (!existing) {
        // First time reaching this tile
        const node = {
          col: nb.col,
          row: nb.row,
          g: newG,
          f: newG + heuristic(nb.col, nb.row),
          parent: current
        };
        nodes.set(k, node);
        openList.push(node);
      } else if (newG < existing.g) {
        // Found a shorter way to a tile we already knew about
        existing.g = newG;
        existing.f = newG + heuristic(nb.col, nb.row);
        existing.parent = current;
      }
    }
  }

  return []; // no route
}