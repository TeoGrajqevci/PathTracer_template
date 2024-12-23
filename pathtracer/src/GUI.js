import { Pane } from "tweakpane";

export function GUI(app, camera, light, sphere01, sphere02) {
  app.setUniform("pathTracer", "u_cameraPos", [
    camera.pos.x,
    camera.pos.y,
    camera.pos.z,
  ]);

  app.setUniform("pathTracer", "u_cameraRot", [
    camera.rot.x,
    camera.rot.y,
    camera.rot.z,
  ]);

  app.setUniform("pathTracer", "u_lightPos", [
    light.pos.x,
    light.pos.y,
    light.pos.z,
  ]);
  app.setUniform("pathTracer", "u_lightSize", [light.size.x, light.size.y]);
  app.setUniform("pathTracer", "u_lightIntensity", light.intensity);
  app.setUniform("pathTracer", "u_lightColor", [
    light.color.r / 255,
    light.color.g / 255,
    light.color.b / 255,
  ]);

  app.setUniform("pathTracer", "u_spherePos", [
    sphere01.pos.x,
    sphere01.pos.y,
    sphere01.pos.z,
  ]);

  app.setUniform("pathTracer", "u_sphereRadius", sphere01.radius);

  app.setUniform("pathTracer", "u_sphereAlbedo", [
    sphere01.albedo.r / 255,
    sphere01.albedo.g / 255,
    sphere01.albedo.b / 255,
  ]);
  app.setUniform("pathTracer", "u_sphereRoughness", sphere01.roughness);
  app.setUniform("pathTracer", "u_sphereMetalness", sphere01.metalness);
  app.setUniform("pathTracer", "u_sphereEmissive", [
    sphere01.emissive.r / 255,
    sphere01.emissive.g / 255,
    sphere01.emissive.b / 255,
  ]);

  app.setUniform("pathTracer", "u_sphere02Pos", [
    sphere02.pos.x,
    sphere02.pos.y,
    sphere02.pos.z,
  ]);

  app.setUniform("pathTracer", "u_sphere02Radius", sphere02.radius);

  app.setUniform("pathTracer", "u_sphere02Albedo", [
    sphere02.albedo.r / 255,
    sphere02.albedo.g / 255,
    sphere02.albedo.b / 255,
  ]);
  app.setUniform("pathTracer", "u_sphere02Roughness", sphere02.roughness);
  app.setUniform("pathTracer", "u_sphere02Metalness", sphere02.metalness);
  app.setUniform("pathTracer", "u_sphere02Emissive", [
    sphere02.emissive.r / 255,
    sphere02.emissive.g / 255,
    sphere02.emissive.b / 255,
  ]);

  let pane = new Pane();

  let folder01 = pane.addFolder({ title: "Camera" });
  folder01
    .addBinding(camera, "pos", { label: "Position" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_cameraPos", [
        camera.pos.x,
        camera.pos.y,
        camera.pos.z,
      ]);
    });

  let lightFolder = pane.addFolder({ title: "Light" });
  lightFolder
    .addBinding(light, "pos", { label: "Position" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_lightPos", [
        light.pos.x,
        light.pos.y,
        light.pos.z,
      ]);
    });

  lightFolder
    .addBinding(light, "size", { label: "Size" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_lightSize", [light.size.x, light.size.y]);
    });

  lightFolder
    .addBinding(light, "intensity", { label: "Intensity" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_lightIntensity", light.intensity);
    });

  lightFolder
    .addBinding(light, "color", { label: "Color" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_lightColor", [
        light.color.r / 255,
        light.color.g / 255,
        light.color.b / 255,
      ]);
    });

  let folder02 = pane.addFolder({ title: "sphere", expanded: false });
  folder02
    .addBinding(sphere01, "pos", { label: "Position" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_spherePos", [
        sphere01.pos.x,
        sphere01.pos.y,
        sphere01.pos.z,
      ]);
    });

  folder02
    .addBinding(sphere01, "radius", { label: "Radius" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphereRadius", sphere01.radius);
    });

  folder02
    .addBinding(sphere01, "albedo", { label: "Albedo" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphereAlbedo", [
        sphere01.albedo.r / 255,
        sphere01.albedo.g / 255,
        sphere01.albedo.b / 255,
      ]);
    });

  folder02
    .addBinding(sphere01, "roughness", { min: 0.02, max: 0.98, step: 0.01 })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphereRoughness", sphere01.roughness);
    });

  folder02
    .addBinding(sphere01, "metalness", { min: 0.02, max: 0.98, step: 0.01 })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphereMetalness", sphere01.metalness);
    });

  folder02
    .addBinding(sphere01, "emissive", { label: "Emissive" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphereEmissive", [
        sphere01.emissive.r / 255,
        sphere01.emissive.g / 255,
        sphere01.emissive.b / 255,
      ]);
    });

  let folder03 = pane.addFolder({ title: "box", expanded: false });
  folder03
    .addBinding(sphere02, "pos", { label: "Position" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphere02Pos", [
        sphere02.pos.x,
        sphere02.pos.y,
        sphere02.pos.z,
      ]);
    });

  folder03
    .addBinding(sphere02, "radius", { label: "Radius" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphere02Radius", sphere02.radius);
    });

  folder03
    .addBinding(sphere02, "albedo", { label: "Albedo" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphere02Albedo", [
        sphere02.albedo.r / 255,
        sphere02.albedo.g / 255,
        sphere02.albedo.b / 255,
      ]);
    });

  folder03
    .addBinding(sphere02, "roughness", { min: 0.02, max: 0.98, step: 0.01 })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphere02Roughness", sphere02.roughness);
    });

  folder03
    .addBinding(sphere02, "metalness", { min: 0.02, max: 0.98, step: 0.01 })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphere02Metalness", sphere02.metalness);
    });

  folder03
    .addBinding(sphere02, "emissive", { label: "Emissive" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphere02Emissive", [
        sphere02.emissive.r / 255,
        sphere02.emissive.g / 255,
        sphere02.emissive.b / 255,
      ]);
    });
}
