import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement.getContext('2d');
const statusElement = document.getElementById('status');

function updateStatus(msg) {
  console.log(msg);
  statusElement.innerText = msg;
}

// Handle Window Resize
function onResize() {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
}
window.addEventListener('resize', onResize);
onResize();

function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    updateStatus(`Hands detected: ${results.multiHandLandmarks.length}`);
  } else {
    updateStatus('Searching for hands...');
  }
  
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Mirroring for selfie view
  canvasCtx.translate(canvasElement.width, 0);
  canvasCtx.scale(-1, 1);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [17, 18], [18, 19], [19, 20],
        [0, 17]
      ], {color: '#00FF00', lineWidth: 2});
      
      drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 3});

      const indexTip = landmarks[8];
      canvasCtx.fillStyle = '#FFFFFF';
      canvasCtx.beginPath();
      canvasCtx.arc(indexTip.x * canvasElement.width, indexTip.y * canvasElement.height, 10, 0, 2 * Math.PI);
      canvasCtx.fill();
    }
  }
  canvasCtx.restore();
}

updateStatus('Loading MediaPipe Hands...');

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

updateStatus('Starting Camera...');

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280,
  height: 720
});

camera.start()
  .then(() => updateStatus('Camera Active. Show your hands!'))
  .catch(err => {
    console.error(err);
    updateStatus('Error: ' + err.message);
  });
