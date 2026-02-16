import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import * as THREE from 'three';

// Debug logging
const log = (msg) => {
  console.log(`[Nailosophy] ${msg}`);
  const status = document.getElementById('status');
  if (status) status.innerText = msg;
};

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('overlay');
const flipBtn = document.getElementById('flip-camera');

let facingMode = 'user';
let camera = null;

// --- Three.js Setup ---
const scene = new THREE.Scene();
const threeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: canvasElement,
  alpha: true,
  antialias: false // Performance boost
});
renderer.setSize(window.innerWidth, window.innerHeight);

const nailGeometry = new THREE.BoxGeometry(0.02, 0.04, 0.005);
const nailMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // 改为绿色，测试缓存是否更新
const nailMesh = new THREE.Mesh(nailGeometry, nailMaterial);
nailMesh.visible = false;
scene.add(nailMesh);

function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    log('AR Active');
    const landmarks = results.multiHandLandmarks[0];
    const tip = landmarks[8]; // 指尖
    const dip = landmarks[7]; // 第一关节

    // 1. 先计算基础的 2D 映射位置
    let x2d = (tip.x * 2 - 1);
    let y2d = -(tip.y * 2 - 1);

    if (facingMode === 'user') {
        x2d = -x2d; 
    }

    const aspect = window.innerWidth / window.innerHeight;
    
    // 2. 直接在 3D 空间进行暴力偏移
    // 之前我们是在 2D 坐标里算，容易被投影矩阵搞晕
    // 现在：
    // - Y轴下移：减去 0.15 (Three.js 坐标系下移)
    // - X轴根据 dx/dy 稍微修正
    const yOffset = -0.15; 
    
    nailMesh.position.set(x2d * aspect, y2d + yOffset, -1); 

    const dx = tip.x - dip.x;
    const dy = tip.y - dip.y;
    let angle = Math.atan2(dy, -dx);
    nailMesh.rotation.z = -angle - Math.PI/2;

    const handSize = Math.sqrt(Math.pow(landmarks[0].x - landmarks[9].x, 2) + Math.pow(landmarks[0].y - landmarks[9].y, 2));
    nailMesh.scale.setScalar(handSize * 1.8);
    nailMesh.visible = true;
  } else {
    nailMesh.visible = false;
  }
  renderer.render(scene, threeCamera);
}

// MediaPipe Setup with robust error handling
let hands;
try {
  log('Initializing MediaPipe...');
  hands = new Hands({
    locateFile: (file) => {
      const url = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`;
      console.log(`[Nailosophy] Fetching: ${url}`);
      return url;
    }
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  hands.onResults(onResults);
  log('MediaPipe Ready');
} catch (e) {
  log('MediaPipe Init Error: ' + e.message);
}

async function startCamera() {
  log('Requesting Camera...');
  if (camera) {
    try { await camera.stop(); } catch(e) {}
  }

  videoElement.style.transform = (facingMode === 'user') ? 'scaleX(-1)' : 'scaleX(1)';

  try {
    camera = new Camera(videoElement, {
      onFrame: async () => {
        if (hands) await hands.send({image: videoElement});
      },
      facingMode: facingMode,
      width: 640,
      height: 480
    });

    await camera.start();
    log('Camera Active. Detecting...');
  } catch (err) {
    log('Camera Error: ' + err.message);
    console.error(err);
  }
}

flipBtn.addEventListener('click', () => {
  facingMode = facingMode === 'user' ? 'environment' : 'user';
  startCamera();
});

// Start initialization
startCamera();
