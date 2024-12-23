import {
  vertexShaderSource,
  pathTracerFS,
  accumulateFS,
  denoiseFS,
  displayFS,
} from "./shaders.js";

class WebGLApp {
  constructor(canvasId) {
    // Get the canvas element and initialize WebGL2 context
    this.canvas = document.getElementById(canvasId);
    this.gl = this.canvas.getContext("webgl2", { antialias: false });

    if (!this.gl) {
      alert("WebGL2 not supported");
      throw new Error("WebGL2 not supported");
    }

    // Set initial canvas size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.extColorBufferFloat = this.gl.getExtension("EXT_color_buffer_float");
    this.internalFormat = this.extColorBufferFloat
      ? this.gl.RGBA32F
      : this.gl.RGBA16F;

    this.frameCount = 0;

    // Bind methods
    this.render = this.render.bind(this);
    this.resizeIfNeeded = this.resizeIfNeeded.bind(this);

    // Setup WebGL resources
    this.setupShaders();
    this.setupBuffers();
    this.setupFramebuffersAndTextures();
    this.getUniformLocations(); // Updated to fetch all uniforms

    // Handle window resize
    window.addEventListener("resize", this.resizeIfNeeded);
  }

  //------------------------------------------------------
  // Utility functions
  //------------------------------------------------------
  compileShader(type, src) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`Shader compile error: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createProgram(vsSrc, fsSrc) {
    const gl = this.gl;
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSrc);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSrc);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // Clean up shaders after linking
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(`Program link error: ${gl.getProgramInfoLog(program)}`);
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  //------------------------------------------------------
  // Setup shaders and programs
  //------------------------------------------------------
  setupShaders() {
    const gl = this.gl;
    // Create shader programs for each pass
    this.programs = {
      pathTracer: this.createProgram(vertexShaderSource, pathTracerFS),
      accumulate: this.createProgram(vertexShaderSource, accumulateFS),
      denoise: this.createProgram(vertexShaderSource, denoiseFS),
      display: this.createProgram(vertexShaderSource, displayFS),
    };

    // Check if all programs were created successfully
    for (const [name, prog] of Object.entries(this.programs)) {
      if (!prog) {
        throw new Error(`Failed to create shader program: ${name}`);
      }
    }
  }

  //------------------------------------------------------
  // Setup buffers and vertex arrays
  //------------------------------------------------------
  setupBuffers() {
    const gl = this.gl;

    // Setup fullscreen quad VAO
    this.quadVao = gl.createVertexArray();
    gl.bindVertexArray(this.quadVao);

    // Setup vertex buffer
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const quadVerts = new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    // Define vertex attributes for all programs
    for (const [programName, program] of Object.entries(this.programs)) {
      const posLoc = gl.getAttribLocation(program, "a_position");
      if (posLoc !== -1) {
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      }
    }

    gl.bindVertexArray(null);
  }

  //------------------------------------------------------
  // Create a floating point texture
  //------------------------------------------------------
  createFloatTex(w, h) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      this.internalFormat,
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

  //------------------------------------------------------
  // Setup framebuffers and textures
  //------------------------------------------------------
  setupFramebuffersAndTextures() {
    const gl = this.gl;
    this.fbo = gl.createFramebuffer();

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Create textures
    this.accumTexA = this.createFloatTex(this.width, this.height);
    this.accumTexB = this.createFloatTex(this.width, this.height);
    this.sampleTex = this.createFloatTex(this.width, this.height);
    this.denoiseTex = this.createFloatTex(this.width, this.height);

    // Clear accumulation and denoise textures
    this.clearTex(this.accumTexA);
    this.clearTex(this.accumTexB);
    this.clearTex(this.denoiseTex);
  }

  //------------------------------------------------------
  // Clear a texture by binding it to the framebuffer and clearing
  //------------------------------------------------------
  clearTex(tex) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
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

  //------------------------------------------------------
  // Get uniform locations for all programs
  //------------------------------------------------------
  getUniformLocations() {
    const gl = this.gl;
    this.uniformLocations = {};

    for (const [programName, program] of Object.entries(this.programs)) {
      this.uniformLocations[programName] = {};
      const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

      for (let i = 0; i < numUniforms; ++i) {
        const uniformInfo = gl.getActiveUniform(program, i);
        if (uniformInfo) {
          const name = uniformInfo.name.replace(/\[.*\]$/, ""); // Remove array suffix
          const location = gl.getUniformLocation(program, name);
          this.uniformLocations[programName][name] = location;
        }
      }
    }

    // Optional: Log fetched uniforms for debugging
    console.log("Fetched Uniforms:", this.uniformLocations);
  }

  //------------------------------------------------------
  // Enable position attribute for a given program
  //------------------------------------------------------
  enablePositionAttrib(program) {
    const gl = this.gl;
    gl.bindVertexArray(this.quadVao);
    const posLoc = gl.getAttribLocation(program, "a_position");
    if (posLoc === -1) {
      console.warn("a_position attribute not found in program");
      return;
    }
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  }

  //------------------------------------------------------
  // Handle window resizing
  //------------------------------------------------------
  resizeIfNeeded() {
    const gl = this.gl;
    const canvas = this.canvas;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w !== canvas.width || h !== canvas.height) {
      canvas.width = w;
      canvas.height = h;

      // Delete old textures
      gl.deleteTexture(this.accumTexA);
      gl.deleteTexture(this.accumTexB);
      gl.deleteTexture(this.sampleTex);
      gl.deleteTexture(this.denoiseTex);

      // Recreate textures with new size
      this.accumTexA = this.createFloatTex(w, h);
      this.accumTexB = this.createFloatTex(w, h);
      this.sampleTex = this.createFloatTex(w, h);
      this.denoiseTex = this.createFloatTex(w, h);

      // Clear textures
      this.clearTex(this.accumTexA);
      this.clearTex(this.accumTexB);
      this.clearTex(this.denoiseTex);

      // Reset frame count
      this.frameCount = 0;
    }

    this.width = w;
    this.height = h;
  }

  //------------------------------------------------------
  // Set uniform for a specific program
  // programName: 'pathTracer', 'accumulate', 'denoise', 'display'
  // uniformName: string
  // value: number or array
  //------------------------------------------------------
  setUniform(programName, uniformName, value) {
    const gl = this.gl;
    const prog = this.programs[programName];
    const loc = this.uniformLocations[programName][uniformName];
    if (loc === undefined || loc === null) {
      console.warn(
        `Uniform ${uniformName} not found in program ${programName}`
      );
      return;
    }
    gl.useProgram(prog);
    if (typeof value === "number") {
      gl.uniform1f(loc, value);
    } else if (Array.isArray(value)) {
      switch (value.length) {
        case 1:
          gl.uniform1fv(loc, value);
          break;
        case 2:
          gl.uniform2fv(loc, value);
          break;
        case 3:
          gl.uniform3fv(loc, value);
          break;
        case 4:
          gl.uniform4fv(loc, value);
          break;
        default:
          console.warn(`Unsupported uniform array length for ${uniformName}`);
      }
    } else {
      console.warn(`Unsupported uniform value type for ${uniformName}`);
    }

    // Reset frame count to restart accumulation
    this.resetFrameCount();
  }

  resetFrameCount() {
    this.frameCount = 0;

    // Clear accumulation textures
    this.clearTex(this.accumTexA);
    this.clearTex(this.accumTexB);
  }

  //------------------------------------------------------
  // Render loop
  //------------------------------------------------------
  render() {
    const gl = this.gl;
    this.resizeIfNeeded();
    this.frameCount++;

    // Determine ping-pong textures
    const readAccumTex =
      this.frameCount % 2 === 0 ? this.accumTexA : this.accumTexB;
    const writeAccumTex =
      this.frameCount % 2 === 0 ? this.accumTexB : this.accumTexA;

    //-----------------------------------------
    // 1) Path Trace --> sampleTex
    //-----------------------------------------
    const pathTracerProg = this.programs.pathTracer;
    gl.useProgram(pathTracerProg);
    this.enablePositionAttrib(pathTracerProg);

    // Set uniforms for path tracer
    const pathTracerUniforms = this.uniformLocations.pathTracer;
    gl.uniform1f(pathTracerUniforms.u_time, performance.now() * 0.001);
    gl.uniform1i(pathTracerUniforms.u_frameCount, this.frameCount);
    gl.uniform2f(pathTracerUniforms.u_resolution, this.width, this.height);
    gl.uniform4f(
      pathTracerUniforms.u_randomSeed,
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random()
    );

    // Bind sampleTex to framebuffer and render
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.sampleTex,
      0
    );
    gl.viewport(0, 0, this.width, this.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //-----------------------------------------
    // 2) Accumulate --> writeAccumTex
    //-----------------------------------------
    const accumulateProg = this.programs.accumulate;
    gl.useProgram(accumulateProg);
    this.enablePositionAttrib(accumulateProg);

    // Set uniforms for accumulate
    gl.uniform1i(
      this.uniformLocations.accumulate.u_frameCount,
      this.frameCount
    );

    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, readAccumTex);
    gl.uniform1i(this.uniformLocations.accumulate.u_prevAccum, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.sampleTex);
    gl.uniform1i(this.uniformLocations.accumulate.u_currentSample, 1);

    // Bind writeAccumTex to framebuffer and render
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      writeAccumTex,
      0
    );
    gl.viewport(0, 0, this.width, this.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //-----------------------------------------
    // 3) Denoise --> denoiseTex
    //-----------------------------------------
    const denoiseProg = this.programs.denoise;
    gl.useProgram(denoiseProg);
    this.enablePositionAttrib(denoiseProg);

    // Set uniforms for denoise
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, writeAccumTex);
    gl.uniform1i(this.uniformLocations.denoise.u_accum, 0);

    gl.uniform2f(
      this.uniformLocations.denoise.u_resolution,
      this.width,
      this.height
    );
    // Example sigma values (can be adjusted externally if needed)
    gl.uniform1f(this.uniformLocations.denoise.u_spatialSigma, 2.0);
    gl.uniform1f(this.uniformLocations.denoise.u_colorSigma, 0.1);

    // Bind denoiseTex to framebuffer and render
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.denoiseTex,
      0
    );
    gl.viewport(0, 0, this.width, this.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //-----------------------------------------
    // 4) Display --> screen
    //-----------------------------------------
    const displayProg = this.programs.display;
    gl.useProgram(displayProg);
    this.enablePositionAttrib(displayProg);

    // Bind denoiseTex as texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.denoiseTex);
    gl.uniform1i(this.uniformLocations.display.u_accum, 0);

    // Bind to default framebuffer (screen) and render
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Continue the render loop
    requestAnimationFrame(this.render);
  }

  //------------------------------------------------------
  // Start the render loop
  //------------------------------------------------------
  start() {
    requestAnimationFrame(this.render);
  }

  //------------------------------------------------------
  // Clean up resources (optional)
  //------------------------------------------------------
  destroy() {
    const gl = this.gl;
    // Delete programs
    for (const prog of Object.values(this.programs)) {
      gl.deleteProgram(prog);
    }

    // Delete textures
    gl.deleteTexture(this.accumTexA);
    gl.deleteTexture(this.accumTexB);
    gl.deleteTexture(this.sampleTex);
    gl.deleteTexture(this.denoiseTex);

    // Delete framebuffer
    gl.deleteFramebuffer(this.fbo);

    // Delete buffers and VAOs
    gl.deleteBuffer(this.quadBuffer);
    gl.deleteVertexArray(this.quadVao);

    // Remove event listeners
    window.removeEventListener("resize", this.resizeIfNeeded);
  }
}

export { WebGLApp };
