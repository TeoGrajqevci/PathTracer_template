import { Pane } from "tweakpane";

export function GUI(app, camera, light, ambientLight, sphere01, sphere02, volume) {

////////////////////////////// CAMERA //////////////////////////////

  app.setUniform("pathTracer", "u_cameraPos", [
    camera.pos.x,
    camera.pos.y,
    camera.pos.z,
  ]);

  app.setUniform("pathTracer", "u_cameraFov", camera.FOV);
  app.setUniform("pathTracer", "u_cameraAperture", camera.aperture);
  app.setUniform("pathTracer", "u_cameraFocusDistance", camera.focusDist);
  app.setUniform("pathTracer", "u_lensDistortionK", [camera.lensDistortion.k1, camera.lensDistortion.k2]);
 
  app.setUniform("pathTracer", "u_chromaticAberration", camera.chromaticAberration);
  app.setUniform("pathTracer", "u_vignetteStrength", camera.vignette);


  app.setUniform("pathTracer", "u_cameraRot", [
    camera.rot.x,
    camera.rot.y,
    camera.rot.z,
  ]);

////////////////////////////// LIGHT //////////////////////////////

  app.setUniform("pathTracer", "u_lightPos", [
    light.pos.x,
    light.pos.y,
    light.pos.z,
  ]);
  app.setUniform("pathTracer", "u_lightRot", [
    light.rot.x,
    light.rot.y,
    light.rot.z,
  ]);
  app.setUniform("pathTracer", "u_lightSize", [light.size.x, light.size.y]);
  app.setUniform("pathTracer", "u_lightIntensity", light.intensity);
  app.setUniform("pathTracer", "u_lightColor", [
    light.color.r / 255,
    light.color.g / 255,
    light.color.b / 255,
  ]);

////////////////////////////// AMBIENT LIGHT //////////////////////////////

  app.setUniform("pathTracer", "u_ambientLightIntensity", ambientLight.intensity);
  app.setUniform("pathTracer", "u_ambientLightColor", [
    ambientLight.color.r / 255,
    ambientLight.color.g / 255,
    ambientLight.color.b / 255,
  ]);


  ////////////////////////////// VOLUME //////////////////////////////

  app.setUniform("pathTracer", "u_volumeSigmaA", volume.absorbtion);
  app.setUniform("pathTracer", "u_volumeSigmaS", volume.scattering);
  app.setUniform("pathTracer", "u_volumeG", volume.scatteringAnisotropy);
  app.setUniform("pathTracer", "u_volumeAlbedo", [
    volume.albedo.r / 255,
    volume.albedo.g / 255,
    volume.albedo.b / 255,
  ]);
  app.setUniform("pathTracer", "u_volumeEmission", [
    volume.emissive.r / 255,
    volume.emissive.g / 255,
    volume.emissive.b / 255,
  ]);



////////////////////////////// SPHERE //////////////////////////////

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
  app.setUniform("pathTracer", "u_sphereSubsurface", sphere01.subsurface);
  app.setUniform("pathTracer", "u_sphereSubsurfaceRadius", sphere01.subsurfaceRad);
  app.setUniform("pathTracer", "u_sphereSubsurfaceColor", [
    sphere01.subsurfaceColor.r / 255,
    sphere01.subsurfaceColor.g / 255,
    sphere01.subsurfaceColor.b / 255,
  ]);
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
  app.setUniform("pathTracer", "u_sphere02Subsurface", sphere02.subsurface);
  app.setUniform("pathTracer", "u_sphere02SubsurfaceRadius", sphere02.subsurfaceRad);
  app.setUniform("pathTracer", "u_sphere02SubsurfaceColor", [
    sphere02.subsurfaceColor.r / 255,
    sphere02.subsurfaceColor.g / 255,
    sphere02.subsurfaceColor.b / 255,
  ]);
  app.setUniform("pathTracer", "u_sphere02Emissive", [
    sphere02.emissive.r / 255,
    sphere02.emissive.g / 255,
    sphere02.emissive.b / 255,
  ]);

  ////////////////////////////// GUI //////////////////////////////

  let pane = new Pane();

  let parameterFolder = pane.addFolder({ title: "Parameter", expanded: false });

  ////////////////////////////// CAMERA //////////////////////////////

  let cameraFolder = parameterFolder.addFolder({ title: "Camera", expanded: false });

  cameraFolder
  .addBinding(camera, "FOV", { label: "FOV" })
  .on("change", (value) => {
    app.setUniform("pathTracer", "u_cameraFov", camera.FOV);
  });

  cameraFolder
  .addBinding(camera, "aperture", { label: "Aperture" })
  .on("change", (value) => {
    app.setUniform("pathTracer", "u_cameraAperture", camera.aperture);
  });

  cameraFolder
  .addBinding(camera, "focusDist", { label: "Focus Distance" })
  .on("change", (value) => {
    app.setUniform("pathTracer", "u_cameraFocusDistance", camera.focusDist);
  });

  cameraFolder
  .addBinding(camera, "chromaticAberration", { label: "Chromatic Aberration" })
  .on("change", (value) => {
    app.setUniform("pathTracer", "u_chromaticAberration", camera.chromaticAberration);
  });

  cameraFolder
  .addBinding(camera.lensDistortion, "k1", { label: "Lens Dist k1" })
  .on("change", () => {
    app.setUniform("pathTracer", "u_lensDistortionK", [
      camera.lensDistortion.k1,
      camera.lensDistortion.k2,
    ]);
  });

  cameraFolder
  .addBinding(camera.lensDistortion, "k2", { label: "Lens Dist k2" })
  .on("change", () => {
    app.setUniform("pathTracer", "u_lensDistortionK", [
      camera.lensDistortion.k1,
      camera.lensDistortion.k2,
    ]);
  });

  cameraFolder
  .addBinding(camera, "vignette", { label: "Vignette" })
  .on("change", (value) => {
    app.setUniform("pathTracer", "u_vignetteStrength", camera.vignette);
  });


  ////////////////////////////// LIGHT //////////////////////////////

  let lightFolder = parameterFolder.addFolder({ title: "Light", expanded: false });
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
    .addBinding(light, "rot", { label: "Rotation" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_lightRot", [
        light.rot.x,
        light.rot.y,
        light.rot.z,
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

  ////////////////////////////// VOLUME //////////////////////////////

  let volumeFolder = parameterFolder.addFolder({ title: "Volume", expanded: false });

  volumeFolder
    .addBinding(volume, "absorbtion", { label: "Absorbtion" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_volumeSigmaA", volume.absorbtion);
    });

  volumeFolder
    .addBinding(volume, "scattering", { label: "Scattering" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_volumeSigmaS", volume.scattering);
    });

  volumeFolder
    .addBinding(volume, "scatteringAnisotropy", { label: "Anisotropy" , min: -1.0, max: 1.0, step: 0.01})
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_volumeG", volume.scatteringAnisotropy);
    });

  volumeFolder
    .addBinding(volume, "albedo", { label: "Albedo" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_volumeAlbedo", [
        volume.albedo.r / 255,
        volume.albedo.g / 255,
        volume.albedo.b / 255,
      ]);
    });

  volumeFolder
    .addBinding(volume, "emissive", { label: "Emissive" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_volumeEmission", [
        volume.emissive.r / 255,
        volume.emissive.g / 255,
        volume.emissive.b / 255,
      ]);
    });




  ////////////////////////////// SPHERE //////////////////////////////

  let folder02 = parameterFolder.addFolder({ title: "sphere", expanded: false });
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
    .addBinding(sphere01, "subsurface", { min: 0.0, max: 1.0, step: 0.01 })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphereSubsurface", sphere01.subsurface);
    });

    folder02
    .addBinding(sphere01, "subsurfaceRad", { min: 0.0, max: 10.0, step: 0.01 })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphereSubsurfaceRadius", sphere01.subsurfaceRad);
    });

    folder02
    .addBinding(sphere01, "subsurfaceColor", { label: "Subsurface Color" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphereSubsurfaceColor", [
        sphere01.subsurfaceColor.r / 255,
        sphere01.subsurfaceColor.g / 255,
        sphere01.subsurfaceColor.b / 255,
      ]);
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

  let folder03 = parameterFolder.addFolder({ title: "box", expanded: false });
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
    .addBinding(sphere02, "subsurface", { min: 0.0, max: 1.0, step: 0.01 })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphere02Subsurface", sphere02.subsurface);
    });

    folder03
    .addBinding(sphere02, "subsurfaceRad", { min: 0.0, max: 10.0, step: 0.01 })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphere02SubsurfaceRadius", sphere02.subsurfaceRad);
    });

    folder03 
    .addBinding(sphere02, "subsurfaceColor", { label: "Subsurface Color" })
    .on("change", (value) => {
      app.setUniform("pathTracer", "u_sphere02SubsurfaceColor", [
        sphere02.subsurfaceColor.r / 255,
        sphere02.subsurfaceColor.g / 255,
        sphere02.subsurfaceColor.b / 255,
      ]);
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
