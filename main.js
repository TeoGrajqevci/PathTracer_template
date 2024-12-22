import { WebGLApp } from "./app.js";

let app = new WebGLApp("glcanvas");
app.start();

app.setUniform("pathTracer", "u_cameraPos", [0.0, 0.0, 3.0]);
