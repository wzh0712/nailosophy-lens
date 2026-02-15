import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import * as THREE from 'three';

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('overlay');
const statusElement = document.getElementById('status');
const flipBtn = document.getElementById('flip-camera');

let facingMode = 'user';
let camera = null;

// --- Three.js Setup ---
const scene = new THREE.Scene();
const threeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: canvasElement,
  alpha: true,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Placeholder Nail: A simple red capsule-like box
const nailGeometry = new THREE.BoxGeometry(0.02, 0.04, 0.005); // Width, Height (Length), Thickness
const nailMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.5, roughness: 0.2 });
const nailMesh = new THREE.Mesh(nailGeometry, nailMaterial);
nailMesh.visible = false;
scene.add(nailMesh);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(0, 1, 1);
scene.add(directionalLight);

function updateStatus(msg) {
  statusElement.innerText = msg;
}

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  threeCamera.aspect = width / height;
  threeCamera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    updateStatus(`AR Active - Tracking Hand`);
    const landmarks = results.multiHandLandmarks[0];
    
    // Landmark 8: Index Tip, Landmark 7: Index DIP (joint below tip)
    const tip = landmarks[8];
    const dip = landmarks[7];

    // Convert MediaPipe (0 to 1) to Three.js Screen Space (-1 to 1)
    // MediaPipe x is 0(left) to 1(right). In selfie mode, we might need to flip.
    let x = (tip.x * 2 - 1);
    let y = -(tip.y * 2 - 1);
    
    // Flip X if using front camera (selfie)
    if (facingMode === 'user') {
       x = -x;
       videoElement.style.transform = 'scaleX(-1)';
    } else {
       videoElement.style.transform = 'scaleX(1)';
    }

    // Position the nail at the tip
    // Note: Z is tricky, using a fixed plane for now in this sprint
    nailMesh.position.set(x * (threeCamera.aspect), y, -1); 
    
    // Rotation Logic: Point from DIP to TIP
    const dx = tip.x - dip.x;
    const dy = tip.y - dip.y;
    const angle = Math.atan2(dy, dx);
    nailMesh.rotation.z = -angle - Math.PI/2;

    // Scale Logic: Simple heuristic based on hand distance (distance between landmark 0 and 9)
    const handSize = Math.sqrt(Math.pow(landmarks[0].x - landmarks[9].x, 2) + Math.pow(landmarks[0].y - landmarks[9].y, 2));
    const scaleFactor = handSize * 1.5;
    nailMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

    nailMesh.visible = true;
  } else {
    updateStatus('Searching for hand...');
    nailMesh.visible = false;
  }
  
  renderer.render(scene, threeCamera);
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

async function startCamera() {
  if (camera) await camera.stop();
  camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({image: videoElement});
    },
    facingMode: facingMode,
    width: 1280,
    height: 720
  });
  camera.start().catch(err => updateStatus('Error: ' + err.message));
}

flipBtn.addEventListener('click', () => {
  facingMode = facingMode === 'user' ? 'environment' : 'user';
  startCamera();
});

startCamera();
