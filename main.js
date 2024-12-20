// main.js
// Main application logic: sets up WebGL, creates textures, runs the render loop.
// Imports shader sources from shaders.js

import {
  vertexShaderSource,
  pathTracerFS,
  accumulateFS,
  displayFS,
} from "./shaders.js";

const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl2", { antialias: false });
if (!gl) {
  alert("WebGL2 not supported");
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const extColorBufferFloat = gl.getExtension("EXT_color_buffer_float");
let internalFormat = gl.RGBA32F;
if (!extColorBufferFloat) {
  internalFormat = gl.RGBA16F;
}

function compileShader(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

function createProgram(vsSrc, fsSrc) {
  const vs = compileShader(gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

const pathTracerProg = createProgram(vertexShaderSource, pathTracerFS);
const accumulateProg = createProgram(vertexShaderSource, accumulateFS);
const displayProg = createProgram(vertexShaderSource, displayFS);

const quadVao = gl.createVertexArray();
gl.bindVertexArray(quadVao);
const quadBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
const quadVerts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
gl.bindVertexArray(null);

function enablePositionAttrib(prog) {
  gl.bindVertexArray(quadVao);
  const posLoc = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
}

function createFloatTex(w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    internalFormat,
    w,
    h,
    0,
    gl.RGBA,
    gl.FLOAT,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

const fbo = gl.createFramebuffer();

let width = canvas.width;
let height = canvas.height;

let accumTexA = createFloatTex(width, height);
let accumTexB = createFloatTex(width, height);
let sampleTex = createFloatTex(width, height);

function clearTex(tex) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0
  );
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
clearTex(accumTexA);
clearTex(accumTexB);

let frameCount = 0;

const u_time_PT = gl.getUniformLocation(pathTracerProg, "u_time");
const u_frameCount_PT = gl.getUniformLocation(pathTracerProg, "u_frameCount");
const u_res_PT = gl.getUniformLocation(pathTracerProg, "u_resolution");
const u_rand_PT = gl.getUniformLocation(pathTracerProg, "u_randomSeed");

const u_frameCount_ACC = gl.getUniformLocation(accumulateProg, "u_frameCount");
const u_prevAccum_ACC = gl.getUniformLocation(accumulateProg, "u_prevAccum");
const u_currentSample_ACC = gl.getUniformLocation(
  accumulateProg,
  "u_currentSample"
);

const u_accum_DISP = gl.getUniformLocation(displayProg, "u_accum");

function resizeIfNeeded() {
  let w = canvas.clientWidth;
  let h = canvas.clientHeight;
  if (w != canvas.width || h != canvas.height) {
    canvas.width = w;
    canvas.height = h;
    gl.deleteTexture(accumTexA);
    gl.deleteTexture(accumTexB);
    gl.deleteTexture(sampleTex);
    accumTexA = createFloatTex(w, h);
    accumTexB = createFloatTex(w, h);
    sampleTex = createFloatTex(w, h);
    clearTex(accumTexA);
    clearTex(accumTexB);
    frameCount = 0;
  }
  width = w;
  height = h;
}

function render() {
  resizeIfNeeded();
  frameCount++;

  let readAccumTex = frameCount % 2 == 0 ? accumTexA : accumTexB;
  let writeAccumTex = frameCount % 2 == 0 ? accumTexB : accumTexA;

  // 1. Path tracing pass
  gl.useProgram(pathTracerProg);
  enablePositionAttrib(pathTracerProg);
  gl.uniform1f(u_time_PT, performance.now() * 0.001);
  gl.uniform1i(u_frameCount_PT, frameCount);
  gl.uniform2f(u_res_PT, width, height);
  gl.uniform4f(
    u_rand_PT,
    Math.random(),
    Math.random(),
    Math.random(),
    Math.random()
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    sampleTex,
    0
  );
  gl.viewport(0, 0, width, height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // 2. Accumulation pass
  gl.useProgram(accumulateProg);
  enablePositionAttrib(accumulateProg);
  gl.uniform1i(u_frameCount_ACC, frameCount);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, readAccumTex);
  gl.uniform1i(u_prevAccum_ACC, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, sampleTex);
  gl.uniform1i(u_currentSample_ACC, 1);

  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    writeAccumTex,
    0
  );
  gl.viewport(0, 0, width, height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // 3. Display pass
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.useProgram(displayProg);
  enablePositionAttrib(displayProg);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, writeAccumTex);
  gl.uniform1i(u_accum_DISP, 0);

  gl.viewport(0, 0, width, height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  requestAnimationFrame(render);
}

render();
