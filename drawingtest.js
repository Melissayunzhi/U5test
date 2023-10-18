let CELL_SIZE = 15;       // Size of each cell
let gridSize;               // Number of columns and rows in the grid
let grid;                   // 2D array to store the grid
let isDrawing = false;              // Flag to indicate whether the mouse is being dragged

// Add some text-based art to represent cells:
const cellArt = ['█', '▒', '░', '▓', '▄', '■'];

let videoPaused = false;


let DELAY = 500;          // Delay in milliseconds before new cells start following the rules
let followRules = false;            // Flag to indicate whether to follow the rules of Game of Life
let isPaused = true;               // Flag to indicate whether the simulation is paused
let timer;                      // Timer to track the delay
let showGrid = false;

let history = [];     // History of cell positions for undo

let zoomFactor = 1.0;         // Zoom factor
let offset;                 // Offset for panning

let video;
let poseNet; 
let poses = [];
let skeletons = [];

let pg;
let noseX;
let noseY;

let pNoseX;
let pNoseY;

let wristX;
let wristY;


// let audioContextStarted = false;

// When the model is loaded
function modelLoaded() {
    console.log("Model Loaded!");
    // div.innerHTML = "Posenet model loaded!";
}

function setup() {

  createCanvas(windowWidth, windowHeight);
  //canvas.parent("container");
  gridSize = createVector(floor(width / CELL_SIZE), floor(height / CELL_SIZE));
  

  grid = new Array(gridSize.x);
  for (let i = 0; i < gridSize.x; i++) {
    grid[i] = new Array(gridSize.y);
  }
  
  initializeGrid(); // Clear the grid
  isDrawing = false;
  followRules = false;
  isPaused = true;
  timer = millis();
  showGrid = false;
  
  history = [];
  
  offset = createVector(0, 0);


  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide()

  pixelDensity(1);
  pg = createGraphics(width, height);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);

  poseNet.on('pose', function(results) {
    poses = results;
  });

  // Hide the video element, and just show the canvas
  video.hide();

    // Create an instruction section
    instructionsDiv = createDiv();
    instructionsDiv.html(
      "<p>Press <strong>'Spacebar'</strong> to pause/resume the simulation.</p>" +
      "<p>Press <strong>'r'</strong> to clear the grid.</p>" +
      "<p>Press <strong>'u'</strong> to undo the last drawn cell.</p>" +
      "<p>Press <strong>'+'</strong> to zoom in.</p>" +
      "<p>Press <strong>'-'</strong> to zoom out.</p>" +
      "<p>Press <strong>'g'</strong> to toggle grid visibility.</p>"
    );
    instructionsDiv.position(width - 220, 20);
    instructionsDiv.hide(); // Initially hide the instructions
  
}

function draw() {
  background(22, 30, 40);
  detectCursorHover();
  translate(width,0);
  scale(-1, 1);
  //image(video, 0, 0, width, height);

   image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();


  // applyZoomAndOffset();
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
  if (showGrid) {
    stroke(255,100);
    for (let i = 0; i <= width; i += CELL_SIZE) {
      line(i, 0, i, height);
    }
    for (let j = 0; j <= height; j += CELL_SIZE) {
      line(0, j, width, j);
    }
  }

  fill(255, 128); // 128 specifies the alpha (transparency)
  stroke(255, 128);


  // Display the cells
  for (let i = 0; i < gridSize.x; i++) {
    for (let j = 0; j < gridSize.y; j++) {
      let x = i * CELL_SIZE;
      let y = j * CELL_SIZE;

      if (grid[i][j] === 1) {
        
        // Assign different colors based on the stage of life
        let stage = countNeighbors(i, j);
        if (stage < 2) {
          fill(255, 102, 94);   // white for stage 0
        } else if (stage < 4) {
          fill(98, 194, 177);   // Green for stage 1
        } else {
          fill(0, 120, 191);   // Blue for stage 2 and above
        }

        rect(x, y, CELL_SIZE, CELL_SIZE);
        noStroke();
      }
    }
  }
}

// function mousePressed() {
//   isDrawing = true;
//   history = [];  // Clear history when starting to draw
  
//   // // Initialize the AudioContext if not started
//   // if (!audioContextStarted) {
//   //   getAudioContext().resume().then(function() {
//   //     console.log('AudioContext started.');
//   //   });
//   //   audioContextStarted = true;
//   // }
// }

// function mouseReleased() {
//   isDrawing = false;
//   followRules = true;  // Start following the rules of Game of Life
//   timer = millis();    // Reset the timer
// }

function mouseDragged() {
  
}

function keyPressed() {
    pg.clear();

  if (key === 'r' /*|| key == 'R'*/) {
    // Clear the grid
    initializeGrid();
    followRules = false;  // Stop following the rules of Game of Life
    history = [];      // Clear the history
  } else if (key === ' ') {
    // Toggle video pause and play when the spacebar is pressed
    if (videoPaused) {
        video.play(); // Resume the video
        } else {
        video.pause(); // Pause the video
        }
        videoPaused = !videoPaused;

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
      if (state === 0 && neighbors === 3) {
        nextGrid[i][j] = 1;
      } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
        nextGrid[i][j] = 0;
      } else {
        nextGrid[i][j] = state;
      }
      
      
      // Custom Rule 1 = spreading further and further
      
      if (state === 0 && neighbors == 2){
        nextGrid[i][j] = 1;
      }else if (state === 1 && (neighbors == 3)) {
        nextGrid[i][j] = 1;
      } else {
        nextGrid[i][j] = 0;
      }
      
      
      // Higherlife rule - mostly move around, grow a little bit but go back to smaller stable state
      
      if (state === 0 && neighbors == 3){
        nextGrid[i][j] = 1;
      }else if (state === 1 && (neighbors == 2 ||neighbors == 3)) {
        nextGrid[i][j] = 1;
      } else {
        nextGrid[i][j] = 0;
      }
      
      
      // Custom Rule 2 slowly grow bigger and bigger, like a brain pattern
      // if (state === 0 && neighbors == 3 || neighbors == 6){
      //   nextGrid[i][j] = 1;
      // }else if (state === 1 && (neighbors < 2 ||neighbors > 4)) {
      //   nextGrid[i][j] = 0;
      // } else {
      //   nextGrid[i][j] = state;
      // }
      
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





// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  // Loop through all the poses detected
  for (let i = 0; i < min(poses.length, 1); i++) {
    // For each pose detected, loop through all the keypoints
    for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = poses[i].pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        
        isDrawing = true;
        followRules = true; 
        history = [];
        
        if (keypoint.part === 'leftWrist' || keypoint.part === 'rightWrist') {
            wristX = keypoint.position.x;
            wristY = keypoint.position.y;
          
            if (isDrawing) {
              // Get the cell index based on the wrist position
              let i = floor(wristX / CELL_SIZE);
              let j = floor(wristY / CELL_SIZE);
          
              // Toggle the cell state
              if (i >= 0 && i < gridSize.x && j >= 0 && j < gridSize.y) {
                grid[i][j] = 1;
                history.push(createVector(i, j)); // Add cell position to history
              }
            }
          }

        if (j == 0) {
          noseX = keypoint.position.x;
          noseY = keypoint.position.y;

          // pg.stroke(230, 80, 0);
          // pg.strokeWeight(5);
          // pg.line(noseX, noseY, pNoseX, pNoseY);
          

          pNoseX = noseX;
          pNoseY = noseY;


          if (isDrawing) {
            // // Get the adjusted mouse position based on zoom and offset
            // let mouseXAdjusted = (pNoseX) / zoomFactor;
            // let mouseYAdjusted = (pNoseY) / zoomFactor;
            
        
            // Get the cell index based on the adjusted mouse position
            let i = floor(pNoseX / CELL_SIZE);
            let j = floor(pNoseY / CELL_SIZE);
        
            // Toggle the cell state
            if (i >= 0 && i < gridSize.x && j >= 0 && j < gridSize.y) {
              grid[i][j] = 1;
              history.push(createVector(i, j));  // Add cell position to history
            }
          }
        }
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    // For every skeleton, loop through all body connections
    for (let j = 0; j < poses[i].skeleton.length; j++) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      stroke(255, 0, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}

// The callback that gets called every time there's an update from the model
function gotPoses(results) {
  poses = results;
}



function modelReady() {
  select('#status').html('model Loaded');
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

function saveCanvasImage() {
    // Save the canvas as an image (e.g., PNG format)
    saveCanvas('your_canvas_image', 'png');
  }

  // Detect cursor hover over the right corner
function detectCursorHover() {
    if (mouseX >= width - 30 && mouseY <= 30) {
      instructionsDiv.show(); // Show instructions when cursor hovers over the right corner
    } else {
      instructionsDiv.hide(); // Hide instructions otherwise
    }
  }