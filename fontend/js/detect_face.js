const video = document.getElementById('camera');
const toggleButton = document.getElementById('toggleButton');
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d', { willReadFrequently: true });
const canvas_Loading = canvasElement.getContext('2d', { willReadFrequently: true });
const drawingUtils = window;
const container = document.getElementById('container');

let camera = null;
let faceDetection = null;
let count = 0;
let check = false
const ar_age = [];
const ar_gender = [];

async function checkFace(face) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = face.width;
    canvas.height = face.height;
    context.putImageData(face, 0, 0);

    const imageBase64 = canvas.toDataURL('image/jpeg', 1.0);

    // Send the base64 image to the server
    const response = await fetch('http://localhost:2000/predictAgeGender', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: imageBase64 })

    });

    const result = await response.json();
    return result;    
}

async function put2DB(face, gender, age) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = face.width;
    canvas.height = face.height;
    context.putImageData(face, 0, 0);

    const imageBase64 = canvas.toDataURL('image/jpeg', 1.0);

    // Send the base64 image to the server
    const response = await fetch('http://localhost:2000/put2DB', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: imageBase64, gender: gender, age: age})

    });

    const result = await response.json();
    return result;
}

async function onResults(results) {
    // Set the canvas size to match the video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    // Set the canvas resolution (high-DPI support)
    canvasElement.width = videoWidth * pixelRatio;
    canvasElement.height = videoHeight * pixelRatio;
    canvasElement.style.width = `${videoWidth}px`;
    canvasElement.style.height = `${videoHeight}px`;
    
    // Scale the drawing context to account for pixel ratio
    canvasCtx.scale(pixelRatio, pixelRatio);

    // Draw the image from the results
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, videoWidth, videoHeight);
    
    // Draw the results image maintaining the aspect ratio
    canvasCtx.drawImage(results.image, 0, 0, videoWidth, videoHeight);

    if (results.detections && results.detections.length > 0) {
        const detection = results.detections[0];

        if (detection){
            drawingUtils.drawRectangle(
                canvasCtx, detection.boundingBox,
                {color: 'blue', lineWidth: 2, fillColor: '#00000000'});

            // Extract the face based on bounding box dimensions
            const {xCenter, yCenter, width, height} = detection.boundingBox;

            const startX = (xCenter - (width / 2)) * videoWidth;
            const startY = (yCenter - (height / 2)) * videoHeight;
            const faceWidth = width * videoWidth;
            const faceHeight = height * videoHeight;

            const face = canvasCtx.getImageData(startX, startY, faceWidth, faceHeight);
 
            if (face && check == false){
                const a = await checkFace(face)
                if (a['check'] == 'True'){
                    // window.location.href('http://localhost:3000/fontend/main.html')
                    console.log(a)
                    check = true
                }else{
                    if (face && count < 3 ){
                        // Convert image data to a tensor
                        const tensorImage = tf.browser.fromPixels(face);

                        const result = await predict(tensorImage);

                        ar_age.push(result[0]);
                        ar_gender.push(result[1]);
            
                    }
                    if (ar_age.length == 3 & ar_gender.length == 3){
                        const age = mostCommon(ar_age);
                        const gender = mostCommon(ar_gender);

                        const res = await put2DB(face, gender, age)

                        console.log(res)
                        check = true
                    }
                } 
            }
            count += 1;
        }
    }
    canvasCtx.restore();
}

// Initialize FaceDetection instance
function initializeFaceDetection() {
    faceDetection = new FaceDetection({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
    }});

    faceDetection.setOptions({
        model: 'short',
        minDetectionConfidence: 0.5
    });

    faceDetection.onResults(onResults);
}

// Function to start the camera
function startCamera() {
    initializeFaceDetection();
    count = 0;
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

// Function to stop the camera
function stopCamera() {
    if (camera) {
        camera.stop();
        camera = null;
    }
    if (faceDetection){
        faceDetection.close();
    }
    toggleButton.textContent = 'Turn On';
    toggleButton.classList.add('off');
    disableCanvas();
}

// Disable the canvas (clear and visually disable it)
function disableCanvas() {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasElement.classList.add('disabled');
}

// Enable the canvas (remove disabled state)
function enableCanvas() {
    canvasElement.classList.remove('disabled');
}

// Toggle button functionality
toggleButton.addEventListener('click', () => {
    if (camera) {
        stopCamera();
    } else {
        startCamera();
    }
});

function mostCommon(arr) {
    // Create a Map to count occurrences
    const counter = new Map();
  
    // Count occurrences of each element
    arr.forEach(element => {
        counter.set(element, (counter.get(element) || 0) + 1);
    });
  
    // Convert Map to array of [key, value] pairs and sort by occurrences
    const sorted = [...counter.entries()].sort(function(a, b){return b - a});
  
    // Return the most common element(s)
    mostCommonElement = sorted[0][0];
  
    return mostCommonElement;
}