from flask import Flask, request, jsonify, render_template
import numpy as np
import cv2
from PIL import Image
import io
import base64
import tensorflow as tf
import os

app = Flask(__name__)
#load pre-trained model
try:
    model = tf.keras.models.load_model('model/mnist_model.h5')
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get the image data from the request
        data = request.get_json()
        image_data = data['image'].split(',')[1]
        
        # Decode base64 image
        image = Image.open(io.BytesIO(base64.b64decode(image_data)))
        
        # Convert to numpy array (grayscale)
        image_array = np.array(image.convert('L'))
        
        # OpenCV preprocessing
        _, binary = cv2.threshold(image_array, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Ensure digit is white (invert if needed)
        if np.sum(binary[binary == 255]) < np.sum(binary[binary == 0]):
            binary = cv2.bitwise_not(binary)
        
        # Remove background again
        _, final = cv2.threshold(binary, 240, 255, cv2.THRESH_BINARY)
        
        # Resize to MNIST format
        final = cv2.resize(final, (28, 28))
        
        # Normalize and reshape for model input
        final = final.reshape(1, 28, 28, 1) / 255.0
        
        # Make prediction
        prediction = model.predict(final)
        predicted_digit = np.argmax(prediction[0])
        confidence = float(prediction[0][predicted_digit])
        
        return jsonify({
            'success': True,
            'digit': int(predicted_digit),
            'confidence': confidence,
            'message': 'Prediction successful'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error processing prediction'
        })

if __name__ == '__main__':
    app.run()
