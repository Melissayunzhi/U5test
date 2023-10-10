let x = width/2;
let y = height/2;
let rx = 200;
let ry = 200;
const palette = ["#0033cc55", "#eae2c055", "#2274aa55", "#1829a555","#FF572247"];

let i = 0;

function setup() {

    createCanvas(windowWidth, windowHeight);

  let colour = random(palette)

  background(colour);
  strokeWeight(5);
  stroke(255)
}

function draw() {
  noFill();
  ellipse( 250,250, x, y ); 
  rect(rx,ry,x,y);

}

function mouseClicked() {

  if (i > 7){
      x = width/2
      y = height/2
     rx = 200
     ry = 200
      i = 0
  }else{x += 50;
  y += 50;
  rx -= 25;
  ry -= 25;
       }

  draw();
  colour = random(palette);
  background(colour);
  ellipse( 250,250, x, y ); 
  rect(rx,ry,x,y);
  
  i += 1


}

function windowResized() {

resizeCanvas(windowWidth, windowHeight);
}