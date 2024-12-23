import { WebGLApp } from "./app.js";

let app = new WebGLApp("glcanvas");
app.start();

let sphere01 = {
  pos: [-1.0, 0.0, 0.0],
  radius: 0.5,
  albedo: [0.9, 0.0, 0.0],
  roughness: 0.5,
  metalness: 0.0,
  emissive: [0.0, 0.0, 0.0],
};

let sphere02 = {
  pos: [1.0, 0.0, 0.0],
  radius: 0.5,
  albedo: [0.0, 0.0, 0.9],
  roughness: 0.5,
  metalness: 0.0,
  emissive: [0.0, 0.0, 0.0],
};

app.setUniform("pathTracer", "u_cameraPos", [0.0, 0.0, 3.0]);
