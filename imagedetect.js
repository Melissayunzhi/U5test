// set global - needed for external libraries
/* globals ml5 */

const message = document.querySelector("#message")
const fileButton = document.querySelector("#file")
const img = document.querySelector("#img")
const synth = window.speechSynthesis

// Initialize the Image Classifier method with MobileNet
const classifier = ml5.imageClassifier('MobileNet', modelLoaded);

fileButton.addEventListener("change", event => loadFile(event))
img.addEventListener("load", () => userImageUploaded())

function loadFile(event) {
  img.src = URL.createObjectURL(event.target.files[0])
}

function userImageUploaded() {
  message.innerHTML = "Image was loaded!"
  
  
    // Make a prediction with a selected image
  classifier.classify(img, (err, results) => {
    console.log(results);
    message.innerHTML = `it's propbably a ${results[0].label}, I'm ${parseFloat((results[0].confidence*100).toFixed(2))} percent sure.`
    speak(`it's propbably a ${results[0].label}, and I'm ${parseFloat((results[0].confidence*100).toFixed(2))} percent sure.`)
  });
}


// When the model is loaded
function modelLoaded() {
  console.log('Model Loaded!');
  message.innerHTML = "Please upload an image of an hampster."
  


}



function speak(text) {
  if (synth.speaking) {
    return
  }
  if (text !== "") {
    let utterThis = new SpeechSynthesisUtterance(text)
    synth.speak(utterThis)
  }
}