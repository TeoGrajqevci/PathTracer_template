import { WebGLApp } from "./app.js";
import { GUI } from "./GUI.js";

let app = new WebGLApp("glcanvas");
app.start();

// Ensure the canvas element is correctly targeted
let canvas = document.getElementById("glcanvas");

let camera = {
  pos: { x: -5.0, y: 2.0, z: 7.0 },
  rot: { x: 0.0, y: 0.0, z: 0.0 },
  FOV : 60.0,
  aperture: 1.0,
  focusDist: 8.3,
  lensDistortion: { k1: 0.0, k2: 0.0 },
  chromaticAberration: 0.1,
  vignette: 0.9,
  angle: 0.0, // Angle for horizontal movement
  height: 0.0, // Vertical height offset
  radius: 8.0, // Distance from the center
};

let light = {
  pos: { x: -5.4, y: 6.0, z: -4.5 },
  size: { x: 4.0, y: 4.0 },
  intensity: 15.0,
  color: { r: 255, g: 255, b: 255 },
};

let sphere01 = {
  pos: { x: -0.3, y: 0.0, z: 0.0 },
  radius: 1.0,
  albedo: { r: 255, g: 0, b: 0 },
  roughness: 0.1,
  metalness: 0.0,
  subsurface: 0.0,
  subsurfaceRad: 0.0,
  subsurfaceColor: { r: 255, g: 255, b: 255 },
  emissive: { r: 0, g: 0, b: 0 },
};

let sphere02 = {
  pos: { x: 1.0, y: 1.4, z: 0.0 },
  radius: 0.4,
  albedo: { r: 0, g: 0, b: 255 },
  roughness: 0.4,
  metalness: 0.0,
  subsurface: 0.0,
  subsurfaceRad: 0.0,
  subsurfaceColor: { r: 255, g: 255, b: 255 },
  emissive: { r: 0, g: 0, b: 0 },
};

let gui = new GUI(app, camera, light, sphere01, sphere02);

// Interaction state
let isDragging = false;
let isCameraInteractionEnabled = false; // Toggles mouse interaction
let lastMouseX = 0;
let lastMouseY = 0;

let body = document.getElementsByTagName("body")[0];

// Update cursor style
function updateCursorStyle() {
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }


  body.style.cursor = isCameraInteractionEnabled ? "grab" : "default";
}

// Toggle interaction with the N key
function onKeyDown(event) {
  if (event.key === "n" || event.key === "N") {
    isCameraInteractionEnabled = !isCameraInteractionEnabled;
    console.log(
      `Camera interaction ${isCameraInteractionEnabled ? "enabled" : "disabled"}`
    );
    updateCursorStyle();
  }
}

function onMouseDown(event) {
  if (!isCameraInteractionEnabled) return;

  isDragging = true;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
  body.style.cursor = "grabbing"; // Change cursor when dragging
}

function onMouseMove(event) {
  if (!isCameraInteractionEnabled || !isDragging) return;

  const deltaX = event.clientX - lastMouseX;
  const deltaY = event.clientY - lastMouseY;

  lastMouseX = event.clientX;
  lastMouseY = event.clientY;

  // Adjust the camera's angle and height based on mouse movement
  camera.angle += deltaX * 0.015; // Adjust sensitivity
  camera.height = Math.min(Math.max(camera.height - deltaY * 0.05, -0.9), 10); // Clamp height

  updateCamera(); // Update camera position only on interaction
}

function onMouseUp() {
  isDragging = false;
  if (isCameraInteractionEnabled) body.style.cursor = "grab"; // Reset cursor to grab
}

function onWheel(event) {
  if (!isCameraInteractionEnabled) return;

  // Adjust the radius based on scroll input
  camera.radius += event.deltaY * 0.01; // Adjust sensitivity
  camera.radius = Math.max(camera.radius, 1.0); // Prevent radius from becoming too small

  updateCamera(); // Update camera position after scroll
}

function updateCamera() {
  // Calculate the new position using sin and cos
  camera.pos.x = camera.radius * Math.sin(camera.angle);
  camera.pos.z = camera.radius * Math.cos(camera.angle);
  camera.pos.y = camera.height;

  // Update uniform with new position
  app.setUniform("pathTracer", "u_cameraPos", [
    camera.pos.x,
    camera.pos.y,
    camera.pos.z,
  ]);
}

// Initialize cursor style
updateCursorStyle();

// Event listeners for mouse interaction and key toggle
window.addEventListener("mousedown", onMouseDown);
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("mouseup", onMouseUp);
window.addEventListener("wheel", onWheel);
window.addEventListener("keydown", onKeyDown);
