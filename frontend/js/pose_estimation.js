const videoElement = document.getElementById('camera');
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d', { willReadFrequently: true });

const source = document.getElementById("video_check");

const form = document.getElementById("formContainer");
const icon = document.getElementById("toggleIcon");

const notification= document.getElementById("notification-container");

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

let id;

let shoulder = [0,0], elbow = [0,0], wrist = [0,0], hip = [0,0], knee = [0,0], ankle = [0,0];
let sets, reps, count_reps, rest, count_rest, camera, check_reps = false, check_sets = false, set_ex = true, check_count = false;
let exercise = ["DUMBBELL CURL", "PUSH UP", "SQUAT", "form", "complete"], next_ex = 0, hasSpoken = false;
let box_ex = true, form_submit = false;

const ALPHA = 0.5;
let emaLandmarks = null;

const slider = document.getElementById('slider1');
const sliderValue = document.getElementById('sliderValue');
const check_form = document.getElementById('check-form');


function setCookieWithDate(name, value, hour) {
    const date = new Date();
    date.setTime(date.getTime() + (hour * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    const creationDate = new Date().toISOString();
    document.cookie = name + "=" + value + "|" + creationDate + ";" + expires;
}

function getCookieTime(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let c = cookies[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function isCookieExpired(name, hour) {
    const cookie = getCookieTime(name);
    if (!cookie) return true; // If cookie does not exist, consider it expired

    const [value, creationDate] = cookie.split('|');
    const creationTime = new Date(creationDate).getTime();
    const currentTime = new Date().getTime();

    // Check if 7 days (in milliseconds) have passed
    const timeRL = hour * 60 * 60 * 1000;
    return currentTime - creationTime >= timeRL;
}

slider.oninput = function() {
    sliderValue.textContent = this.value;
};

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

function showNotification(message) {
    notification.style.display = "block";
    notification.textContent = message;
  
    // Remove the notification after 5 seconds
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
}
  
function speakText(text) {
    // Check if the browser supports speech synthesis
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      
      // Optional: Set voice, pitch, rate, etc.
      speech.lang = 'en-US';
      speech.pitch = 1;  // Range between 0 and 2
      speech.rate = 1.5;   // Range between 0.1 and 2
      speech.volume = 1; // Range between 0 and 1

      // Speak the text
      window.speechSynthesis.speak(speech);

      console.log(text);
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
    }else if (type === 'getEX_3') {
        if (result['check'] === 'True') {
            sets = result['sets'];
            reps = result['reps'];
            rest = result['rest'];
            count_reps = reps;
            count_rest = rest;
            set_exercise(0, sets, reps, rest);
        }
    }else if (type === 'update') {
        if (result['check'] === 'True') {
            console.log("----------------True------------");
            next_ex += 1;
            check_form.style.display = "none";
            form_submit = false;

            setCookieWithDate("time", "true", 1/10);
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
    id = cookieObj['id'];
    input_name.value = cookieObj['name']
    input_age.value = cookieObj['age'];
    input_gender.value = cookieObj['gender'];
    input_bmi.value = cookieObj['bmi'];
    input_level.value = cookieObj['level'];

    speakText("Okay, let's start!!!");
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
    check_count = false;
    set_exercise(db_weights, sets, count_reps, count_rest);
    
    count_rest = restTime;
    let intervalId = setInterval(() => {
        if (count_rest > 0) {
            count_rest--;
        } else {
            clearInterval(intervalId); // Stop the interval
            if (!hasSpoken) {
                speakText("Do it again!!!");
                hasSpoken = true;
            }
            count_rest = rest;  // Reset for the next round
            check_sets = false;  // Reset for the next set
            set_ex = true;
        }
    }, 1000); // Run every second
}

// Hàm áp dụng EMA
function applyEma(currentLandmarks, emaLandmarks, alpha) {
    if (!emaLandmarks) {
        // Nếu chưa có dữ liệu trước, trả về landmark hiện tại
        return currentLandmarks.map(({ x, y, z, visibility }) => ({ x, y, z, visibility }));
    }
    return currentLandmarks.map((current, i) => ({
        x: alpha * current.x + (1 - alpha) * emaLandmarks[i].x,
        y: alpha * current.y + (1 - alpha) * emaLandmarks[i].y,
        z: alpha * current.z + (1 - alpha) * emaLandmarks[i].z,
        visibility: alpha * current.visibility + (1 - alpha) * emaLandmarks[i].visibility,
    }));
}

function draw_Canvas(results, specificLandmarks){
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.drawImage(results.image, 0, 0,
                          canvasElement.width, canvasElement.height);
    
    specificLandmarks.forEach((landmark, index) => {

        const x = landmark.x * canvasElement.width;
        const y = landmark.y * canvasElement.height;
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 4, 0, 2 * Math.PI);
        canvasCtx.fillStyle = 'red';
        canvasCtx.fill();
    });
    // // Only overwrite existing pixels.
    // drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
    //                  {color: '#00FF00', lineWidth: 1, radius: 2});

    // drawLandmarks(canvasCtx, results.poseLandmarks,
    //                 {color: '#FF0000', lineWidth: 0.2, radius: 2});
}
    
function onResults(results) {

    if (!results.poseLandmarks) {
        return;
    }

    if (!isCookieExpired("time", 1/10)) {
        exercise = exercise.filter(item => item !== "form");
    }

    const landmarks = results.poseLandmarks;

    if (landmarks) {

        emaLandmarks = applyEma(results.poseLandmarks, emaLandmarks, ALPHA);

        if (exercise[next_ex] == "DUMBBELL CURL"){
            if (box_ex){
                exercise_box.style.display = "flex";
                worker.postMessage({ type: 'get_exercise_1',  age_db: input_age.value, gender_db: input_gender.value, level_db: input_level.value, bmi_label: input_bmi.value});
                showNotification("Exercise is DUMBBELL CURL!!!");
                speakText('Get ready! Your exercise is Dumbbell Curl!');
                box_ex = false;
                speakText("Please! Straighten your hand.");
            }
            
            const specificLandmarks = [11, 12, 13, 14, 15, 16].map(index => emaLandmarks[index]);
            draw_Canvas(results, specificLandmarks);
            dumbbell_curl(specificLandmarks[0], specificLandmarks[1], specificLandmarks[2], 
                specificLandmarks[3], specificLandmarks[4], specificLandmarks[5]
            );
        }else if(exercise[next_ex] == "PUSH UP"){    
            dumbbell.style.display = "none";
            if (box_ex){
                exercise_box.style.display = "flex";
                sets = 0;
                worker.postMessage({ type: 'get_exercise_2',  age_db: input_age.value, gender_db: input_gender.value, level_db: input_level.value});
                showNotification("Next exercise is PUSH UP!!!");
                speakText("Get ready! Your next exercise is Push-Up!");
                box_ex = false;
                check_reps = false; 
                check_sets = false;
                hasSpoken = false;
                check_count = false;
                speakText('Place your hands wider than shoulder-width, body straight.');
            }
            const specificLandmarks = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].map(index => emaLandmarks[index]);
            draw_Canvas(results, specificLandmarks);
            push_up(specificLandmarks[0], specificLandmarks[1], specificLandmarks[2], 
                specificLandmarks[3], specificLandmarks[4], specificLandmarks[5], specificLandmarks[6],
                specificLandmarks[7], specificLandmarks[8], specificLandmarks[9], specificLandmarks[10],
                specificLandmarks[11]
            );
        }else if(exercise[next_ex] == "SQUAT"){
            dumbbell.style.display = "none";
            if (box_ex){
                exercise_box.style.display = "flex";
                sets = 0;
                worker.postMessage({ type: 'get_exercise_3',  age_db: input_age.value, gender_db: input_gender.value, level_db: input_level.value, bmi_label: input_bmi.value});
                showNotification("Next exercise is SQUAT!!!");
                speakText("Get ready! Your next exercise is Squat!");
                box_ex = false;
                check_reps = false; 
                check_sets = false;
                hasSpoken = false;
                check_count = false;
                speakText('Stand straight, feet shoulder-width apart, arms extended in front.');
            }
            const specificLandmarks = [11, 12, 23, 24, 25, 26, 27, 28].map(index => emaLandmarks[index]);
            draw_Canvas(results, specificLandmarks);
            squat(specificLandmarks[0], specificLandmarks[1], specificLandmarks[2],
                specificLandmarks[3], specificLandmarks[4], specificLandmarks[5], specificLandmarks[6],
                specificLandmarks[7]
            );
        }else if(exercise[next_ex] == "form"){
            check_form.style.display = "flex";
            exercise_box.style.display = "none";
            speakText("Enter your feedback on the exercise support system.");
            check_reps = false; 
            check_sets = true;
            hasSpoken = false;
            check_count = false;
        }else if(exercise[next_ex] == "complete"){
            speakText("Thank you for filling out the form! We appreciate your feedback and will use it to improve your experience with our exercises.");
            showNotification("You're complete!!!");
            location.href = 'http://localhost:3000/frontend/login_register.html';
        }
        
    }

    canvasCtx.restore();
}

check_form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (form_submit){
        const diffValue = document.getElementById("option2").value;

        const slider = parseInt(sliderValue.textContent);
        let fatigueValue;
    
        if (slider >= 1 && slider < 3) {
            fatigueValue = "Very Light";
          } else if (slider >= 3 && slider < 5) {
            fatigueValue = "Light";
          } else if (slider >= 5 && slider < 7) {
            fatigueValue = "Moderate";
          } else if (slider >= 7 && slider < 9) {
            fatigueValue = "Quite Tired";
          } else if (slider == 9) {
            fatigueValue = "Very Tired";
          } else if (slider == 10) {
            fatigueValue = "Extremely Tired";
          }
    
        const form_DB = fatigueValue + "-" + diffValue;
    
        worker.postMessage({ type: 'update_inf', point_id: id, exercise_db: exercise[next_ex - 1], form_db: form_DB});
    }
})

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
    // Tính góc với đk elbow và wrist cùng đường dọc có thể lệch nhau tầm 2-5px.
    const angle = calculate_angle(shoulder, elbow, wrist);

    if (angle > 155 && !check_reps && !check_sets){
        check_reps = true;
        speakText("Raise the weights!");
    }

    if (angle < 45 && check_reps){
        console.log("angle: ", angle);
        check_reps = false;
        if (Math.abs(shoulder[0] - elbow[0]) <= 0.07){
            speakText("Lower the weights!");
            count_reps -= 1;
        }
    }

    if (count_reps == 0 && set_ex){
        speakText("Rest and prepare for the next repetition!");
        sets -= 1
        hasSpoken = false;
        count_reps = reps;
        check_sets = true;
        check_count = true;
    }

    if (sets == 0){
        count_reps = 0;
        set_ex = false;
    }else if (sets < 0){
        check_sets = false;
        box_ex = true;
        check_count = false;
        form_submit = true;
        next_ex += 1;
        source.src = "video/pushup.mp4";
        source.load();
    }

    if (check_count){
        countdown(rest);
    }

    set_exercise(db_weights, sets, count_reps, count_rest);

    canvasCtx.font = '18px Arial';
    canvasCtx.fillStyle = '#00FF00';
    canvasCtx.fillText(String(Math.round(angle)), Math.round(elbow[0] * canvasElement.width), Math.round(elbow[1] * canvasElement.height));       
} 

function push_up(lm_11, lm_12, lm_13, lm_14, lm_15, lm_16, lm_23, lm_24, lm_25, lm_26, lm_27, lm_28){
    if ((lm_11.visibility > lm_12.visibility) && (lm_11.visibility > 0.8) && (lm_13.visibility > 0.8) 
        && (lm_15.visibility > 0.8) && (lm_23.visibility > 0.8)  
        && (lm_25.visibility > 0.8) && (lm_27.visibility > 0.8)){
        shoulder = [lm_11.x, lm_11.y];
        elbow = [lm_13.x, lm_13.y];
        wrist = [lm_15.x, lm_15.y];
        hip = [lm_23.x, lm_23.y];
        knee = [lm_25.x, lm_25.y];
        ankle = [lm_27.x, lm_27.y];
    }else if ((lm_12.visibility > lm_11.visibility) && (lm_12.visibility > 0.8) && (lm_14.visibility > 0.8) 
        && (lm_16.visibility > 0.8) && (lm_24.visibility > 0.8) 
        && (lm_26.visibility > 0.8) && (lm_28.visibility > 0.8)){
        shoulder = [lm_12.x, lm_12.y];
        elbow = [lm_14.x, lm_14.y];
        wrist = [lm_16.x, lm_16.y];
        hip = [lm_24.x, lm_24.y];
        knee = [lm_26.x, lm_26.y];
        ankle = [lm_28.x, lm_28.y];
    }   

    const angle_elbow = calculate_angle(shoulder, elbow, wrist); 
    const angle_hip = calculate_angle(shoulder, hip, knee); 
    const angle_knee = calculate_angle(hip, knee, ankle); 

    if (angle_elbow > 160 && (160 < angle_hip && angle_hip <= 180 && 160 < angle_knee && angle_knee <= 180) && !check_reps && !check_sets){
        check_reps = true;
        speakText("Lower your body until elbows form a 90-degree angle.");
    }
    if (angle_elbow < 90 && (160 < angle_hip && angle_hip <= 180 && 160 < angle_knee && angle_knee <= 180) && check_reps){
        check_reps = true;
        check_reps = false;
        count_reps -= 1;
        speakText("Push up, fully extending your arms.");
    }

    if (count_reps == 0 && set_ex){
        speakText("Rest and prepare for the next rep.!");
        sets -= 1
        hasSpoken = false;
        count_reps = reps;
        check_sets = true;
        check_count = true;
    }

    if (sets == 0){
        count_reps = 0;
        set_ex = false;
    }else if (sets < 0){
        check_sets = false;
        box_ex = true;
        check_count = false;
        form_submit = true;
        next_ex += 1;
        source.src = "video/squat.mp4";
        source.load();
    }

    if (check_count){
        countdown(rest);
    }

    set_exercise(0, sets, count_reps, count_rest);

    canvasCtx.font = '18px Arial';
    canvasCtx.fillStyle = '#00FF00';
    canvasCtx.fillText(String(Math.round(angle_elbow)), Math.round(elbow[0] * canvasElement.width), Math.round(elbow[1] * canvasElement.height));       
    canvasCtx.fillText(String(Math.round(angle_hip)), Math.round(hip[0] * canvasElement.width), Math.round(hip[1] * canvasElement.height));
    canvasCtx.fillText(String(Math.round(angle_knee)), Math.round(knee[0] * canvasElement.width), Math.round(knee[1] * canvasElement.height));              
}

function squat(lm_11, lm_12, lm_23, lm_24, lm_25, lm_26, lm_27, lm_28){
    if ((lm_11.visibility > lm_12.visibility) && (lm_11.visibility > 0.8) && (lm_23.visibility > 0.8)  
        && (lm_25.visibility > 0.8) && (lm_27.visibility > 0.8)){
        shoulder = [lm_11.x, lm_11.y];
        hip = [lm_23.x, lm_23.y];
        knee = [lm_25.x, lm_25.y];
        ankle = [lm_27.x, lm_27.y];
    }else if ((lm_12.visibility > lm_11.visibility) && (lm_12.visibility > 0.8) && (lm_24.visibility > 0.8) 
        && (lm_26.visibility > 0.8) && (lm_28.visibility > 0.8)){
        shoulder = [lm_12.x, lm_12.y];
        hip = [lm_24.x, lm_24.y];
        knee = [lm_26.x, lm_26.y];
        ankle = [lm_28.x, lm_28.y];
    }   

    const angle_hip = calculate_angle(shoulder, hip, knee); 
    const angle_knee = calculate_angle(hip, knee, ankle); 

    if ((160 < angle_hip && angle_hip <= 180 && 160 < angle_knee && angle_knee <= 180) && !check_reps && !check_sets){
        check_reps = true;
        speakText("Lower your hips, keeping your back straight!")
    }
    if ((angle_hip < 70 && angle_knee < 70) && check_reps){
        check_reps = true;
        check_reps = false;
        count_reps -= 1;
        speakText("Push up to the starting position, keeping your body upright.")
    }

    if (count_reps == 0 && set_ex){
        speakText("Rest and prepare for the next rep!!");
        sets -= 1
        hasSpoken = false;
        count_reps = reps;
        check_sets = true;
        check_count = true;
    }

    if (sets == 0){
        count_reps = 0;
        set_ex = false;
    }else if (sets < 0){
        check_sets = false;
        box_ex = true;
        check_count = false;
        form_submit = true;
        next_ex += 1;
    }

    if (check_count){
        countdown(rest);
    }

    set_exercise(0, sets, count_reps, count_rest);

    canvasCtx.font = '18px Arial';
    canvasCtx.fillStyle = '#00FF00';
    canvasCtx.fillText(String(Math.round(angle_hip)), Math.round(hip[0] * canvasElement.width), Math.round(hip[1] * canvasElement.height));
    canvasCtx.fillText(String(Math.round(angle_knee)), Math.round(knee[0] * canvasElement.width), Math.round(knee[1] * canvasElement.height));              
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
