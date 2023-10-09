let CELL_SIZE = 10;       // Size of each cell
let gridSize;               // Number of columns and rows in the grid
let grid;                   // 2D array to store the grid
let isDrawing = false;              // Flag to indicate whether the mouse is being dragged

let DELAY = 500;          // Delay in milliseconds before new cells start following the rules
let followRules = false;            // Flag to indicate whether to follow the rules of Game of Life
let isPaused = false;               // Flag to indicate whether the simulation is paused
let timer;                      // Timer to track the delay
let showGrid = false;

let history = [];     // History of cell positions for undo

let zoomFactor = 1.0;         // Zoom factor
let offset;                 // Offset for panning



let audioContextStarted = false;

function setup() {
  var canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent("container");
  gridSize = createVector(width / CELL_SIZE, height / CELL_SIZE);
  
  grid = new Array(floor(gridSize.x));
  for (let i = 0; i < floor(gridSize.x); i++) {
    grid[i] = new Array(floor(gridSize.y));
  }
  
  initializeGrid(); // Clear the grid
  isDrawing = false;
  followRules = false;
  isPaused = false;
  timer = millis();
  showGrid = false;
  
  history = [];
  
  offset = createVector(0, 0);
}

function draw() {
  background(22, 30, 40);
  
  applyZoomAndOffset();
  displayGrid();
  
  // Check if the delay has passed and the simulation is not paused
  if (followRules && !isPaused && millis() - timer > DELAY) {
    nextGeneration();  // Calculate the next generation
    timer = millis();  // Reset the timer
  }
}

function applyZoomAndOffset() {
  translate(width / 2, height / 2);
  scale(zoomFactor);
  translate(-width / 2, -height / 2);
  translate(offset.x, offset.y);
}

function displayGrid() {
  // Rest of your displayGrid() function...

  // Display the cells
  for (let i = 0; i < gridSize.x; i++) {
    for (let j = 0; j < gridSize.y; j++) {
      // Rest of your code...
    }
  }
}

function mousePressed() {
  isDrawing = true;
  history = [];  // Clear history when starting to draw
  
  // Initialize the AudioContext if not started
  if (!audioContextStarted) {
    getAudioContext().resume().then(function() {
      console.log('AudioContext started.');
    });
    audioContextStarted = true;
  }
}

function mouseReleased() {
  isDrawing = false;
  followRules = true;  // Start following the rules of Game of Life
  timer = millis();    // Reset the timer
}

function mouseDragged() {
  if (isDrawing) {
    // Get the adjusted mouse position based on zoom and offset
    let mouseXAdjusted = (mouseX - offset.x - width / 2) / zoomFactor + width / 2;
    let mouseYAdjusted = (mouseY - offset.y - height / 2) / zoomFactor + height / 2;

    // Get the cell index based on the adjusted mouse position
    let i = floor(mouseXAdjusted / CELL_SIZE);
    let j = floor(mouseYAdjusted / CELL_SIZE);

    // Toggle the cell state
    if (i >= 0 && i < gridSize.x && j >= 0 && j < gridSize.y) {
      grid[i][j] = 1;
      history.push(createVector(i, j));  // Add cell position to history
    }
  }
}

function keyPressed() {
  if (key === 'r' /*|| key == 'R'*/) {
    // Clear the grid
    initializeGrid();
    followRules = false;  // Stop following the rules of Game of Life
    history = [];      // Clear the history
  } else if (key === ' ') {
    // Pause or continue the simulation
    isPaused = !isPaused;
  } else if (key === 'u' || key === 'U') {
    // Undo the last drawn cell
    if (history.length > 0) {
      let cellPos = history.pop();
      let i = floor(cellPos.x);
      let j = floor(cellPos.y);
      grid[i][j] = 0;
    }
  } else if (key === '+') {
    // Zoom in
    zoomFactor *= 1.2;
  } else if (key === '-') {
    // Zoom out
    zoomFactor *= 0.8;
  } else if (key === 'g' || key === 'G') {
    // Toggle grid visibility
    showGrid = !showGrid;
  }
}

// Calculate the next generation based on the Game of Life rules
function nextGeneration() {
  let nextGrid = new Array(floor(gridSize.x));
  for (let i = 0; i < floor(gridSize.x); i++) {
    nextGrid[i] = new Array(floor(gridSize.y));
  }

  // Loop through every cell in the grid
  for (let i = 0; i < gridSize.x; i++) {
    for (let j = 0; j < gridSize.y; j++) {
      let state = grid[i][j];
      let neighbors = countNeighbors(i, j);

      // Apply the Game of Life rule - some dies some alive
      /*if (state === 0 && neighbors === 3) {
        nextGrid[i][j] = 1;
      } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
        nextGrid[i][j] = 0;
      } else {
        nextGrid[i][j] = state;
      }
      */
      
      // Custom Rule 1 = spreading further and further
      /*
      if (state === 0 && neighbors == 2){
        nextGrid[i][j] = 1;
      }else if (state === 1 && (neighbors == 3)) {
        nextGrid[i][j] = 1;
      } else {
        nextGrid[i][j] = 0;
      }
      */
      
      // Higherlife rule - mostly move around, grow a little bit but go back to smaller stable state
      /*
      if (state === 0 && neighbors == 3){
        nextGrid[i][j] = 1;
      }else if (state === 1 && (neighbors == 2 ||neighbors == 3)) {
        nextGrid[i][j] = 1;
      } else {
        nextGrid[i][j] = 0;
      }
      */
      
      // Custom Rule 2 slowly grow bigger and bigger, like a brain pattern
      if (state === 0 && neighbors == 3 || neighbors == 6){
        nextGrid[i][j] = 1;
      }else if (state === 1 && (neighbors < 2 ||neighbors > 4)) {
        nextGrid[i][j] = 0;
      } else {
        nextGrid[i][j] = state;
      }
      
    }
  }

  // Update the grid with the new generation
  grid = nextGrid;
}

function countNeighbors(x, y) {
  let count = 0;

  // Check the 8 neighboring cells
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      let col = (x + i + floor(gridSize.x)) % floor(gridSize.x);
      let row = (y + j + floor(gridSize.y)) % floor(gridSize.y);
      count += grid[col][row];
    }
  }

  // Subtract the state of the current cell
  count -= grid[x][y];
  return count;
}

function initializeGrid() {
  for (let i = 0; i < gridSize.x; i++) {
    for (let j = 0; j < gridSize.y; j++) {
      grid[i][j] = 0; // Set all cells to 0 (clear the grid)
    }
  }
}

function windowResized(){
  resizeCanvas(windowWidth,windowHeight)
}
