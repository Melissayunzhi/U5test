let CELL_SIZE = 10;
let gridSize;
let grid;
let isDrawing = false;
let DELAY = 500;
let followRules = false;
let isPaused = false;
let timer;
let showGrid = false;
let history = [];
let zoomFactor = 1.0;
let offset;
let video;
let poseNet;
let poses = [];
let redValue = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  gridSize = createVector(floor(width / CELL_SIZE), floor(height / CELL_SIZE));

  grid = new Array(gridSize.x);
  for (let i = 0; i < gridSize.x; i++) {
    grid[i] = new Array(gridSize.y);
  }

  initializeGrid();
  isDrawing = false;
  followRules = false;
  isPaused = false;
  timer = millis();
  showGrid = false;
  history = [];
  offset = createVector(0, 0);

  video = createCapture(VIDEO);
  video.size(640, 480); // Adjust the size as needed

  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on("pose", function (results) {
    poses = results;
  });

  video.hide(); // Hide the video element
}

function modelLoaded() {
  console.log("PoseNet model is loaded.");
}

function draw() {
  background(22, 30, 40);

  applyZoomAndOffset();
  displayGrid();

  // Check if the delay has passed and the simulation is not paused
  if (followRules && !isPaused && millis() - timer > DELAY) {
    nextGeneration();
    timer = millis();
  }

  drawCameraIntoCanvas();
}

function applyZoomAndOffset() {
  translate(width / 2, height / 2);
  scale(zoomFactor);
  translate(-width / 2, -height / 2);
  translate(offset.x, offset.y);
}

function displayGrid() {
  if (showGrid) {
    stroke(255, 100);
    for (let i = 0; i <= width; i += CELL_SIZE) {
      line(i, 0, i, height);
    }
    for (let j = 0; j <= height; j += CELL_SIZE) {
      line(0, j, width, j);
    }
  }

  for (let i = 0; i < gridSize.x; i++) {
    for (let j = 0; j < gridSize.y; j++) {
      let x = i * CELL_SIZE;
      let y = j * CELL_SIZE;

      if (grid[i][j] === 1) {
        let stage = countNeighbors(i, j);
        if (stage < 2) {
          fill(255, 132, 79);
        } else if (stage < 4) {
          fill(250, 206, 124);
        } else {
          fill(113, 224, 216, 150);
        }

        rect(x, y, CELL_SIZE, CELL_SIZE);
        noStroke();
      }
    }
  }
}

function mousePressed() {
  isDrawing = true;
  history = [];
}

function mouseReleased() {
  isDrawing = false;
  followRules = true;
  timer = millis();
}

function mouseDragged() {
  if (isDrawing) {
    let mouseXAdjusted = (mouseX - offset.x) / zoomFactor;
    let mouseYAdjusted = (mouseY - offset.y) / zoomFactor;

    let i = floor(mouseXAdjusted / CELL_SIZE);
    let j = floor(mouseYAdjusted / CELL_SIZE);

    if (i >= 0 && i < gridSize.x && j >= 0 && j < gridSize.y) {
      grid[i][j] = 1;
      history.push(createVector(i, j));
    }
  }
}

function keyPressed() {
  if (key === "r" || key === "R") {
    initializeGrid();
    followRules = false;
    history = [];
  } else if (key === " ") {
    isPaused = !isPaused;
  } else if (key === "u" || key === "U") {
    if (history.length > 0) {
      let cellPos = history.pop();
      let i = floor(cellPos.x);
      let j = floor(cellPos.y);
      grid[i][j] = 0;
    }
  } else if (key === "+") {
    zoomFactor *= 1.2;
  } else if (key === "-") {
    zoomFactor *= 0.8;
  } else if (key === "g" || key === "G") {
    showGrid = !showGrid;
  }
}

function nextGeneration() {
  let nextGrid = new Array(floor(gridSize.x));
  for (let i = 0; i < floor(gridSize.x); i++) {
    nextGrid[i] = new Array(floor(gridSize.y));
  }

  for (let i = 0; i < gridSize.x; i++) {
    for (let j = 0; j < gridSize.y; j++) {
      let state = grid[i][j];
      let neighbors = countNeighbors(i, j);

      if (state === 0 && neighbors == 3) {
        nextGrid[i][j] = 1;
      } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
        nextGrid[i][j] = 0;
      } else {
        nextGrid[i][j] = state;
      }
    }
  }

  grid = nextGrid;
}

function countNeighbors(x, y) {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      let col = (x + i + floor(gridSize.x)) % floor(gridSize.x);
      let row = (y + j + floor(gridSize.y)) % floor(gridSize.y);
      count += grid[col][row];
    }
  }
  count -= grid[x][y];
  return count;
}

function initializeGrid() {
  for (let i = 0; i < gridSize.x; i++) {
    for (let j = 0; j < gridSize.y; j++) {
      grid[i][j] = 0;
    }
  }
}

function drawCameraIntoCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "rgba(255,255,255,0.01)";
  ctx.rect(0, 0, 640, 360);
  ctx.fill();

  redValue += 0.5;
  if (redValue > 255) redValue = 0;
  ctx.fillStyle = `rgb(${redValue}, 0, 0)`;

  updateGridWithKeypoints();
  drawGrid();
  window.requestAnimationFrame(drawCameraIntoCanvas);
}

function updateGridWithKeypoints() {
  for (let i = 0; i < poses.length; i += 1) {
    const mirroredWidth = canvas.width;
    let leftWrist = poses[i].pose.leftWrist;
    let rightWrist = poses[i].pose.rightWrist;

    if (leftWrist.confidence > 0.2) {
      let gridX = Math.floor((mirroredWidth - leftWrist.x) / CELL_SIZE);
      let gridY = Math.floor(leftWrist.y / CELL_SIZE);
      gridX = constrain(gridX, 0, gridSize.x - 1);
      gridY = constrain(gridY, 0, gridSize.y - 1);
      grid[gridX][gridY] = 1;
    }

    if (rightWrist.confidence > 0.2) {
      let gridX = Math.floor((mirroredWidth - rightWrist.x) / CELL_SIZE);
      let gridY = Math.floor(rightWrist.y / CELL_SIZE);
      gridX = constrain(gridX, 0, gridSize.x - 1);
      gridY = constrain(gridY, 0, gridSize.y - 1);
      grid[gridX][gridY] = 1;
    }
  }
}

function drawGrid() {
  if (showGrid) {
    stroke(255, 100);
    for (let i = 0; i <= width; i += CELL_SIZE) {
      line(i, 0, i, height);
    }
    for (let j = 0; j <= height; j += CELL_SIZE) {
      line(0, j, width, j);
    }
  }

  for (let i = 0; i < gridSize.x; i++) {
    for (let j = 0; j < gridSize.y; j++) {
      let x = i * CELL_SIZE;
      let y = j * CELL_SIZE;
      if (grid[i][j] === 1) {
        fill(255, 132, 79);
        rect(x, y, CELL_SIZE, CELL_SIZE);
        noStroke();
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
