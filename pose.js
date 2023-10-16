// set global - needed for external libraries
/* globals ml5 */

const div = document.querySelector("#message");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.strokeStyle = "red";
ctx.fillStyle = "rgb(255,0,0)";
ctx.lineWidth = 3;

let redvalue = 0;
let poses = [];

// Create a new poseNet method
const poseNet = ml5.poseNet(video, modelLoaded);
poseNet.on("pose", (results) => {
  poses = results;
});

// When the model is loaded
function modelLoaded() {
  console.log("Model Loaded!");
  div.innerHTML = "Posenet model loaded!";
}

// Create a webcam capture
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
    video.srcObject = stream;
    video.play();

    /* double check your webcam width / height */
    let stream_settings = stream.getVideoTracks()[0].getSettings();
    console.log("Width: " + stream_settings.width);
    console.log("Height: " + stream_settings.height);
  });
}

// // A function to draw the video and poses into the canvas independently of posenet
// function drawMirroredIntoCanvas() {
//     //draw a white square
//     ctx.fillStyle = "rgba(255,255,255,0.05)";
//     ctx.rect(0, height/2, 640, 480);
//     ctx.fill();
  
//     // draw the webcam image
//     //ctx.drawImage(video, 0, 0, 640, 480); //16:9 - 640:360 4:3 - 640:480
//     redvalue += 0.5;
//     greenvalue -= 0.5;
  
//     if (redvalue > 255) redvalue = 0;
//     if (greenvalue <0 ) greenvalue = 255;
  
//     ctx.fillStyle = `rgb(${redvalue}, ${greenvalue}, 0)`;
  
//     drawMirroredKeypoints();
//     //drawSkeleton()
//     //console.log(poses)
//     window.requestAnimationFrame(drawMirroredIntoCanvas);
//   }
  
//   // A function to draw ellipses over the detected keypoints
//   function drawMirroredKeypoints() {
//     // Loop through all the poses detected
//     for (let i = 0; i < poses.length; i += 1) {
//       // only draw the wrists
      
//       let leftWrist = poses[0].pose.leftWrist
//       let rightWrist = poses[0].pose.rightWrist
      
//       if(poses[0].pose.leftWrist.confidence > 0.2){
//           ctx.beginPath();
//           ctx.arc(leftWrist.x, leftWrist.y, 10, 0, 2 * Math.PI);
//           ctx.fill();
//       }
      
//       if(poses[0].pose.rightWrist.confidence > 0.2){
//           ctx.beginPath();
//           ctx.arc(rightWrist.x, rightWrist.y, 10, 0, 2 * Math.PI);
//           ctx.fill();
//       }
      
  
//       // draw all the keypoints
//       // for (let j = 0; j < poses[i].pose.keypoints.length; j += 1) {
//       //   let keypoint = poses[i].pose.keypoints[j];
//       //   // Only draw an ellipse is the pose probability is bigger than 0.2
//       //   if (keypoint.score > 0.2) {
//       //     ctx.beginPath();
//       //     ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
//       //     ctx.fill();
//       //   }
//       // }
//     }
//   }
  


// A function to draw the video and poses into the canvas independently of posenet
function drawCameraIntoCanvas() {
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Mirror the video and canvas horizontally
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);

  // Draw the mirrored video
  // ctx.drawImage(video, 0, 0, 640, 480);

  // Restore the canvas context to its original state
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  //draw a white square
  ctx.fillStyle = "rgba(255,255,255,0.01)";
  ctx.rect(0, 0, 640, 360);
  ctx.fill();

  // draw the webcam image
  //ctx.drawImage(video, 0, 0, 640, 480); //16:9 - 640:360 4:3 - 640:480
  redvalue += 0.5;
  if (redvalue > 255) redvalue = 0;
  ctx.fillStyle = `rgb(${redvalue}, 0, 0)`;

  drawKeypoints();
  //drawSkeleton()
  //console.log(poses)
  window.requestAnimationFrame(drawCameraIntoCanvas);
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i += 1) {
    // Get the mirrored width (flipped)
    const mirroredWidth = canvas.width;

    // only draw the wrists
    let leftWrist = poses[i].pose.leftWrist;
    let rightWrist = poses[i].pose.rightWrist;

    if (leftWrist.confidence > 0.2) {
      ctx.beginPath();
      // Mirror the x-coordinate of the left wrist
      ctx.arc(mirroredWidth - leftWrist.x, leftWrist.y, 10, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (rightWrist.confidence > 0.2) {
      ctx.beginPath();
      // Mirror the x-coordinate of the right wrist
      ctx.arc(mirroredWidth - rightWrist.x, rightWrist.y, 10, 0, 2 * Math.PI);
      ctx.fill();

    // draw all the keypoints
    // for (let j = 0; j < poses[i].pose.keypoints.length; j += 1) {
    //   let keypoint = poses[i].pose.keypoints[j];
    //   // Only draw an ellipse is the pose probability is bigger than 0.2
    //   if (keypoint.score > 0.2) {
    //     ctx.beginPath();
    //     ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
    //     ctx.fill();
    //   }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i += 1) {
    // For every skeleton, loop through all body connections
    for (let j = 0; j < poses[i].skeleton.length; j += 1) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      ctx.beginPath();
      ctx.moveTo(partA.position.x, partA.position.y);
      ctx.lineTo(partB.position.x, partB.position.y);
      ctx.stroke();
    }
  }
}

drawCameraIntoCanvas();
// drawMirroredIntoCanvas();