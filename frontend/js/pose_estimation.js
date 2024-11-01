const videoElement = document.getElementById('camera');
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d', { willReadFrequently: true });

const source = document.getElementById("video_check");

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

const exercise_box = document.getElementById('exercise-box');
const exercise_name = document.getElementById('exercise-name');
const dumbbell = document.getElementById('dumbbell');

let shoulder = [0,0], elbow = [0,0], wrist = [0,0];
let sets, reps, count_reps, rest, count_rest, camera, check_reps = false, check_sets = false;
let exercise = ["DUMBBELL CURL", "PUSH UP", "complete"], next_ex = 0, hasSpoken = false;
let box_ex = true;

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

    if (type === 'getEX_1') {
        if (result['check'] === 'True') {
            db_weights = result['db_weights'];
            sets = result['sets'];
            reps = result['reps'];
            rest = result['rest'];
            count_reps = reps;
            count_rest = rest;
            set_exercise(db_weights, sets, reps, rest);
        }
    }else if (type === 'getEX_2') {
        if (result['check'] === 'True') {
            sets = result['sets'];
            reps = result['reps'];
            rest = result['rest'];
            count_reps = reps;
            count_rest = rest;
            set_exercise(0, sets, reps, rest);
        }
    }
}

function set_exercise(db_weights = 0, set = 0, rep = 0, rest = 0){
    input_db.textContent = db_weights
    input_sets.textContent = set;
    input_reps.textContent = rep;
    input_rest.textContent = rest;
    exercise_name.textContent = exercise[next_ex];
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
    set_exercise( db_weights, sets, count_reps, count_rest);
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

        if (exercise[next_ex] == "DUMBBELL CURL"){
            if (box_ex){
                exercise_box.style.display = "flex";
                worker.postMessage({ type: 'get_exercise_1',  age_db: input_age.value, gender_db: input_gender.value, level_db: input_level.value, bmi_label: input_bmi.value});
                box_ex = false;
            }
            dumbbell_curl(landmarks[11], landmarks[12], landmarks[13], landmarks[14], landmarks[15], landmarks[16]);
        }else if(exercise[next_ex] == "PUSH UP"){    
            dumbbell.style.display = "none";
            if (box_ex){
                worker.postMessage({ type: 'get_exercise_2',  age_db: input_age.value, gender_db: input_gender.value, level_db: input_level.value});
                box_ex = false;
            }
        }else if(exercise[next_ex] == "complete"){
            speakText("You're done!!!");
            location.href = 'http://localhost:3000/frontend/main.html';
        }
        
    }

    canvasCtx.restore();
}

function dumbbell_curl(lm_11, lm_12, lm_13, lm_14, lm_15, lm_16){

    if ((lm_11.visibility > lm_12.visibility) && (lm_11.visibility > 0.8) && (lm_15.visibility > 0.8)){
        shoulder = [lm_11.x, lm_11.y];
        elbow = [lm_13.x, lm_13.y];
        wrist = [lm_15.x, lm_15.y];
    }else if ((lm_12.visibility > lm_11.visibility) && (lm_12.visibility > 0.8) && (lm_16.visibility > 0.8)){
        shoulder = [lm_12.x, lm_12.y];
        elbow = [lm_14.x, lm_14.y];
        wrist = [lm_16.x, lm_16.y];
    }        
    if (Math.abs(shoulder[0] - elbow[0]) <= 0.07){
        // Tính góc với đk elbow và wrist cùng đường dọc có thể lệch nhau tầm 2-5px.
        const angle = calculate_angle(shoulder, elbow, wrist);

        if (angle > 155 && !check_reps && !check_sets){
            check_reps = true;
        }

        if (angle < 45 && check_reps){
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
            box_ex = true;
            next_ex += 1;
            source.src = "video/pushup.mp4";
            source.load();
            source.play(); 
        }

        if (check_sets){
            countdown(count_rest);
        }

        set_exercise(db_weights, sets, count_reps, count_rest);

        canvasCtx.font = '18px Arial';
        canvasCtx.fillStyle = '#00FF00';
        canvasCtx.fillText(String(Math.round(angle)), Math.round(elbow[0] * canvasElement.width), Math.round(elbow[1] * canvasElement.height));       
        
    }
} 

function push_up(lm_11, lm_12, lm13, lm14, lm_15, lm_16, lm_23, lm_24, lm_25, lm_26, lm_27, lm_28){

}
    
const pose = new Pose({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});

pose.setOptions({
  modelComplexity: 1,
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
