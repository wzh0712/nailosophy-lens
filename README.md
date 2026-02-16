# Nailosophy Lens - AR Virtual Try-On

Virtual nail try-on powered by MediaPipe Hands and Three.js.

## 🖐️ How to Use (Best Results)

To get the most stable AR tracking, please follow these guidelines:

### 1. Hand Pose
*   **Keep it Flat**: Show your hand with fingers slightly spread and flat.
*   **Angle**: Tilt your hand slightly towards the camera (about 15-30 degrees) to let the AI see both the fingertip and the nail surface.
*   **Avoid Fists**: Closing your hand into a fist hides key landmarks, causing the virtual nail to disappear or jump.

### 2. Camera Positioning
*   **Distance**: Maintain 30cm to 50cm from the lens.
*   **Lighting**: Ensure your hand is well-lit. Shadows or backlighting can interfere with landmark detection.

### 3. Coordinate System
*   **Front Camera (User)**: Mirroring is enabled.
*   **Back Camera (Environment)**: Designed for showing your hand to others.

## 🛠️ Technical Logic
*   **Tracking Point**: Uses the vector between Landmark 7 (DIP) and Landmark 8 (Tip).
*   **Offset**: The virtual mesh is offset by `0.5` towards the joint to sit perfectly on the nail bed.
