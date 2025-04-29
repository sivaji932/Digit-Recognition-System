const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Set up canvas
ctx.strokeStyle = 'black';
ctx.lineWidth = 15;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// Fill canvas with white background
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Drawing event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
canvas.addEventListener('touchend', stopDrawing);

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    document.getElementById('result').innerHTML = '';
}

async function predict() {
    const predictBtn = document.getElementById('predict-btn');
    const resultDiv = document.getElementById('result');
    
    try {
        // Disable predict button and show loading state
        predictBtn.disabled = true;
        resultDiv.innerHTML = 'Predicting...';
        
        // Get the image data
        const imageData = canvas.toDataURL('image/png');
        
        // Send to backend
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const confidence = (data.confidence * 100).toFixed(2);
            resultDiv.innerHTML = `Predicted Digit: <strong>${data.digit}</strong><br>Confidence: ${confidence}%`;
        } else {
            resultDiv.innerHTML = `Error: ${data.message}`;
        }
    } catch (error) {
        resultDiv.innerHTML = 'Error making prediction';
        console.error('Error:', error);
    } finally {
        predictBtn.disabled = false;
    }
}