const video = document.getElementById('camera');
const toggleButton = document.getElementById('toggleButton');
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const drawingUtils = window;
const container = document.getElementById('container');

let camera = null;

function onResults(results) {
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    drawRectangle(
        canvasCtx, results.detections[0].boundingBox,
        {color: 'blue', lineWidth: 2, fillColor: '#00000000'});
    canvasCtx.restore();
  }

const faceDetection = new FaceDetection({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
}});
faceDetection.setOptions({
    model: 'short',
    minDetectionConfidence: 0.5
});

// Function to start the camera
function startCamera() {
    faceDetection.onResults(onResults);
    if (video){
        camera = new Camera(video, {
            onFrame: async () => {
                await faceDetection.send({image: video});
            }
        });
        camera.start();      
        toggleButton.textContent = 'Turn Off';
        toggleButton.classList.remove('off');
        enableCanvas();
    }
}

// Function to stop the camera
function stopCamera() {
    if (camera) {
        toggleButton.textContent = 'Turn On';
        toggleButton.classList.add('off');
        video.remove();
        camera.stop();
        disableCanvas();
        camera = null;
    }
}

// Disable the canvas (clear and visually disable it)
function disableCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.add('disabled');
  }

  // Enable the canvas (remove disabled state)
  function enableCanvas() {
    canvas.classList.remove('disabled');
  }

// Toggle button functionality
toggleButton.addEventListener('click', () => {
    if (camera) {
        stopCamera();
    } else {
        startCamera();
    }
});