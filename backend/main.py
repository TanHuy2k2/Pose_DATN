from flask import Flask, request, jsonify
from PIL import Image
import os
import io
import numpy as np
import base64
from deepface import DeepFace
from qdrant import verify, load_face_data, save_face_data, save_face_file
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Enable CORS for all routes and methods from your frontend origin
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Define the necessary functions
def img_to_encoding(image):
    embedding = DeepFace.represent(image, "Facenet", enforce_detection=False)[0]["embedding"]
    return embedding

@app.route('/predictAgeGender', methods=['POST'])
def process_image():
    data = request.get_json()
    image_base64 = data.get('image')
    
    if not image_base64:
        return jsonify({'error': 'No image provided'}), 400

    image_data = image_base64.split(',')[1]

    # Decode the base64 string
    image_bytes = base64.b64decode(image_data)
    
    # Convert bytes to PIL Image
    image = Image.open(io.BytesIO(image_bytes ))

    # Convert PIL Image to numpy array
    image_array = np.array(image)

    face_embed = img_to_encoding(image_array)

    check = verify(face_embed)

    if check: 
        gender, age = load_face_data(face_embed)
        return jsonify({'check': 'True', 'age': age, 'gender': gender})
    
    return jsonify({'check': 'False', 'age': 0, 'gender': 0})

@app.route('/put2DB', methods=['POST'])
def putDB():
    data = request.get_json()
    image_base64 = data.get('image')
    age = data.get('age')
    gender = data.get('gender')
    
    if not image_base64:
        return jsonify({'error': 'No image'}), 400
    
    if not age:
        return jsonify({'error': 'No age'}), 400
    
    if not gender:
        return jsonify({'error': 'No gender'}), 400

    image_data = image_base64.split(',')[1]

    # Decode the base64 string
    image_bytes = base64.b64decode(image_data)
    
    # Convert bytes to PIL Image
    image = Image.open(io.BytesIO(image_bytes ))

    # Convert PIL Image to numpy array
    image_array = np.array(image)

    face_embed = img_to_encoding(image_array)

    save_face_data(face_embed, {"gender": str(gender), "age": str(age)})

    return jsonify({'check': 'True', 'age': age, 'gender': gender})


if __name__ == '__main__':
    app.run(debug=False, port = 2000)
