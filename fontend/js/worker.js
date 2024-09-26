// Listen for messages from the main thread
onmessage = async function(e) {
    const { type, name_db, gender_db, age_db, image64 } = e.data;

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
        // Save data to database
        const response = await fetch('http://localhost:2000/put2DB', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: image64, name: name_db, gender: gender_db, age: age_db })
        });

        const result = await response.json();
        postMessage({ type: 'put2DBResult', result });
    }
};
