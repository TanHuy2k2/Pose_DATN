const videoElement = document.getElementById('camera');
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d', { willReadFrequently: true });

const form = document.getElementById("formContainer");
const icon = document.getElementById("toggleIcon");

const input_name = document.getElementById('name');
const input_age = document.getElementById('age');
const input_gender = document.getElementById('gender');
const input_bmi = document.getElementById('bmi');
const input_level = document.getElementById('level');

const input_db = document.getElementById('db_weights');
const input_sets = document.getElementById('sets');
const input_reps = document.getElementById('reps');
const input_rest = document.getElementById('rest');

let sets, reps, count_reps, rest, count_rest, camera, check_reps = false, check_sets = false;
let  exercise = ["dumbbell_curl", "complete"], next_ex = 0, hasSpoken = false;

function click_form() {

    if (form.style.display === "none" || form.style.display === "") {
      form.style.display = "block";
      icon.classList.remove("fa-bars");
      icon.classList.add("fa-remove");
    } else {
      form.style.display = "none";
      icon.classList.remove("fa-remove");
      icon.classList.add("fa-bars");
    }
}
function speakText(text) {
    // Check if the browser supports speech synthesis
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      
      // Optional: Set voice, pitch, rate, etc.
      speech.lang = 'en-US';
      speech.pitch = 1.5;  // Range between 0 and 2
      speech.rate = 0.8;   // Range between 0.1 and 10
      speech.volume = 1; // Range between 0 and 1

      // Speak the text
      window.speechSynthesis.speak(speech);
    } else {
      alert("Sorry, your browser doesn't support text-to-speech!");
    }
}

// Worker
let worker = new Worker('js/worker.js');

// Function to handle results from worker
worker.onmessage = function(e) {
    const { type, result } = e.data;

    if (type === 'getEX') {
        if (result['check'] === 'True') {
            console.log(result);
            db_weights = result['db_weights'];
            sets = result['sets'];
            reps = result['reps'];
            rest = result['rest'];
            count_reps = reps;
            count_rest = rest;
            set_exercise(db_weights, sets, reps, rest);
        }
    }
}

function set_exercise(db_weights, set, rep, rest){
    input_db.textContent = db_weights
    input_sets.textContent = set;
    input_reps.textContent = rep;
    input_rest.textContent = rest;
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
    
    speakText("Okay let's start!!!");
}

function calculate_angle(a, b, c){

    const radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
    let angle = Math.abs(radians * 180.0 / Math.PI);

    if (angle > 180.0) {
        angle = 360 - angle;
    }
    
    return angle;
}

function countdown(restTime) {
    set_exercise(sets, count_reps, count_rest);
    if (restTime > 0 ) {
        count_rest = restTime;
        setTimeout(() => {
            countdown(restTime - 1);
        }, 1000); // Decrease restTime every second
    } else {
        if (!hasSpoken){
            speakText("Do it again!!!");
            hasSpoken = true;
        }
        count_rest = rest;
        check_sets = false; // Reset check_sets for the next set

    }
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

        if (exercise[next_ex] == "dumbbell_curl"){
            dumbbell_curl(landmarks[11], landmarks[12], left_shoulder, left_elbow, left_wrist, right_shoulder, right_elbow, right_wrist);
        }else if (exercise[next_ex] == "complete"){
            speakText("You're done!!!");
            location.href = 'http://localhost:3000/fontend/main.html';
        }
        
    }

    canvasCtx.restore();
}

function dumbbell_curl(lm_11, lm_12, left_shoulder, left_elbow, left_wrist, right_shoulder, right_elbow, right_wrist){

    if ((lm_11.visibility > lm_12.visibility) && (lm_11.visibility > 0.8)){
        shoulder = left_shoulder;
        elbow = left_elbow;
        wrist = left_wrist;
    }else if ((lm_12.visibility > lm_11.visibility) && (lm_12.visibility > 0.8)){
        shoulder = right_shoulder;
        elbow = right_elbow;
        wrist = right_wrist;
    }        

    if (Math.abs(shoulder[0] - elbow[0]) <= 0.07){
        // Tính góc với đk elbow và wrist cùng đường dọc có thể lệch nhau tầm 2-5px.
        const angle = calculate_angle(shoulder, elbow, wrist);

        if (angle < 160 && angle > 150 && !check_reps && !check_sets){
            check_reps = true;
        }

        if (angle > 30 && angle < 40 && check_reps){
            console.log("angle: ", angle)
            check_reps = false;
            count_reps -= 1;
        }

        if (count_reps == 0){
            speakText("Rest time!!!");
            sets -= 1
            hasSpoken = false;
            count_reps = reps;
            check_sets = true;
        }

        if (sets == 0){
            check_sets = false;
            next_ex += 1;
        }

        if (check_sets){
            countdown(count_rest);
        }

        set_exercise(sets, count_reps, count_rest);

        canvasCtx.font = '18px Arial';
        canvasCtx.fillStyle = '#00FF00';
        canvasCtx.fillText(String(Math.round(angle)), Math.round(elbow[0] * canvasElement.width), Math.round(elbow[1] * canvasElement.height));       
        
    }
} 
    
const pose = new Pose({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});

pose.setOptions({
  modelComplexity: 2,
  static_image_mode: false, 
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.7,
  selfieMode: false,
});

pose.onResults(onResults);
    
camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({image: videoElement});
    },
    width: 640,
    height: 480
});

getCookies();
camera.start();
