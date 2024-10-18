let bmi;
// Listen for messages from the main thread
onmessage = async function(e) {
    const { type, name_db, gender_db, age_db, height_db, weight_db, level_db, image64, bmi_label } = e.data;

    if (type === 'checkFace') {
        // Perform face check
        const response = await fetch('http://localhost:2000/checkface', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: image64 })
        });

        const result = await response.json();
        postMessage({ type: 'checkFaceResult', result });

    } else if (type === 'put2DB') {

        bmi_score = parseInt(weight_db) / (parseFloat(height_db/100)**2)

        console.log("BMI: ",bmi_score);

        if (bmi_score < 18.5){
            bmi = "Underweight"
        }
        else if (bmi_score < 24.9){
            bmi = "Normal"
        }
        else{
            bmi = "Overweight"
        }

        // Save data to database
        const response = await fetch('http://localhost:2000/put2DB', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: image64, name: name_db, gender: gender_db, age: age_db, height: height_db, weight: weight_db, level: level_db, bmi: String(bmi) })
        });

        const result = await response.json();
        postMessage({ type: 'put2DBResult', result });
    }else if (type === "get_exercise"){
        // Save data to database
        const response = await fetch('http://localhost:2000/get_exercise', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gender: gender_db, age: age_db, level: level_db, bmi: bmi_label })
        });

        const result = await response.json();
        postMessage({ type: 'getEX', result });
    }
};
