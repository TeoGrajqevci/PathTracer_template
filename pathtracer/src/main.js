import { WebGLApp } from "./app.js";

import { GUI } from "./GUI.js";

let app = new WebGLApp("glcanvas");
app.start();

let camera = {
  pos: { x: 0.0, y: 0.0, z: 4.0 },
  rot: { x: 0.0, y: 0.0, z: 0.0 },
};

let light = {
  pos: { x: -3.0, y: 3.0, z: 0.0 },
  size: { x: 4.0, y: 4.0 },
  intensity: 5.0,
  color: { r: 255, g: 255, b: 255 },
};

let sphere01 = {
  pos: { x: -1.0, y: 0.0, z: 0.0 },
  radius: 1.0,
  albedo: { r: 255, g: 0, b: 0 },
  roughness: 0.1,
  metalness: 0.0,
  emissive: { r: 0, g: 0, b: 0 },
};

let sphere02 = {
  pos: { x: 1.0, y: 0.0, z: 0.0 },
  radius: 1.0,
  albedo: { r: 0, g: 0, b: 255 },
  roughness: 0.4,
  metalness: 0.0,
  emissive: { r: 0, g: 0, b: 0 },
};

let gui = new GUI(app, camera, light, sphere01, sphere02);
