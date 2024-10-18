const videoElement = document.getElementById('camera');
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d', { willReadFrequently: true });

const input_name = document.getElementById('name');
const input_age = document.getElementById('age');
const input_gender = document.getElementById('gender');
const input_bmi = document.getElementById('bmi');
const input_level = document.getElementById('level');

// Worker
let worker = new Worker('js/worker.js');

// Function to handle results from worker
worker.onmessage = function(e) {
    const { type, result } = e.data;

    if (type === 'getEX') {
        if (result['check'] === 'True') {
            console.log(result);
        }
    }
}
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
    input_bmi.value = cookieObj['bmi'];
    input_level.value = cookieObj['level'];

    worker.postMessage({ type: 'get_exercise',  age_db: input_age.value, gender_db: input_gender.value, level_db: input_level.value, bmi_label: input_bmi.value});

}

function calculate_angle(a, b, c){

    const radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
    let angle = Math.abs(radians * 180.0 / Math.PI);

    if (angle > 180.0) {
        angle = 360 - angle;
    }

    return angle;
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
                     {color: '#00FF00', lineWidth: 1, radius: 2});
    drawLandmarks(canvasCtx, results.poseLandmarks,
                    {color: '#FF0000', lineWidth: 0.2, radius: 2});

    const landmarks = results.poseLandmarks;

    if (landmarks) {

        const right_shoulder = [landmarks[12].x, landmarks[12].y];
        const left_shoulder = [landmarks[11].x, landmarks[11].y];

        const right_elbow = [landmarks[14].x, landmarks[14].y];
        const left_elbow = [landmarks[13].x, landmarks[13].y];

        const right_wrist = [landmarks[16].x, landmarks[16].y];
        const left_wrist = [landmarks[15].x, landmarks[15].y];

        const right_hip = [landmarks[24].x, landmarks[24].y];
        const left_hip = [landmarks[23].x, landmarks[23].y];

        const leftShoulderDistance = Math.abs(left_shoulder[0] - left_hip[0]);
        const rightShoulderDistance = Math.abs(right_shoulder[0] - right_hip[0]);
                        
        if (leftShoulderDistance < rightShoulderDistance){
            shoulder = left_shoulder;
            elbow = left_elbow;
            wrist = left_wrist;
        }else{
            shoulder = right_shoulder;
            elbow = right_elbow;
            wrist = right_wrist;
        }        

        // Calculate angle
        const angle = calculate_angle(shoulder, elbow, wrist);

        canvasCtx.font = '18px Arial';
        canvasCtx.fillStyle = '#00FF00';
        canvasCtx.fillText(String(Math.round(angle)), Math.round(elbow[0] * canvasElement.width), Math.round(elbow[1] * canvasElement.height));    
        canvasCtx.fillText("counter", 10, 20);    
    }

    canvasCtx.restore();
}
    
const pose = new Pose({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});
pose.setOptions({
  modelComplexity: 0,
  static_image_mode: false, 
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.7,
  selfieMode: false,
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
