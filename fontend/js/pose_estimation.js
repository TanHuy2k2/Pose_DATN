const videoElement = document.getElementById('camera');
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d', { willReadFrequently: true });

const input_name = document.getElementById('name');
const input_age = document.getElementById('age');
const input_gender = document.getElementById('gender');
const input_height = document.getElementById('height');
const input_weight = document.getElementById('weight');

function getCookies() {
    const cookies = document.cookie.split(';');
    const cookieObj = {};
    
    cookies.forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        cookieObj[key] = value;
    });
    input_name.value = cookieObj['name']
    input_age.value = cookieObj['age'];
    input_gender.value = cookieObj['gender'];
    input_height.value = cookieObj['height'];
    input_weight.value = cookieObj['weight'];
}
    
function onResults(results) {

    if (!results.poseLandmarks) {
        return;
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.drawImage(results.image, 0, 0,
                          canvasElement.width, canvasElement.height);
    
    // Only overwrite existing pixels.
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                     {color: '#00FF00', lineWidth: 2});
    drawLandmarks(canvasCtx, results.poseLandmarks,
                    {color: '#FF0000', lineWidth: 0.5});

    canvasCtx.restore();
}
    
const pose = new Pose({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

pose.onResults(onResults);
    
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({image: videoElement});
    },
    width: 640,
    height: 480
});

getCookies();
camera.start();
