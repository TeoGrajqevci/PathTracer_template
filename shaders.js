// shaders.js
// Exporting all shader source codes

//
// 1) Vertex Shader
//
export const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

//
// 2) Path Tracer Fragment Shader
//
export const pathTracerFS = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform int u_frameCount;
uniform vec2 u_resolution;
uniform vec4 u_randomSeed;

uniform vec3 u_cameraPos;

const int MAX_BOUNCES = 6;
const float EPSILON = 0.0001;

// Light setup
const vec3 lightPos = vec3(0.0, 3.0, 0.0);
const vec2 lightSize = vec2(4.0, 4.0);
const vec3 lightEmission = vec3(5.0);

// Camera setup
const vec3 camTarget = vec3(0.0, 0.0, 0.0);
const vec3 camUp = vec3(0.0, 1.0, 0.0);
const float fov = 70.0 * 3.14159 / 180.0;




// Materials
struct Material {
    vec3 albedo;
    float roughness;
    float metalness;
    float ior;
    float transmission;
    float subsurface;
    float anisotropy;
    vec3 emission;
};

// First sphere material (red)
Material sphereMat = Material(vec3(0.9, 0.0, 0.0), 0.1, 0.0, 1.5, 0.0, 0.0, 0.0, vec3(0.0));
// Second sphere material (blue)
Material sphereMat2 = Material(vec3(0.0, 0.0, 0.9), 0.1, 0.0, 1.5, 0.0, 0.0, 0.0, vec3(0.0));

// Plane material
Material planeMat = Material(vec3(0.8, 0.8, 0.8), 0.5, 0.0, 1.0, 0.0, 0.0, 0.0, vec3(0.0));

// Hash and random
uint hash_uvec4(uvec4 x) {
    x = (x ^ (x >> 17U)) * 0xED5AD4BBU;
    x = (x ^ (x >> 11U)) * 0xAC4C1B51U;
    x = (x ^ (x >> 15U)) * 0x31848BABU;
    return x.x ^ x.y ^ x.z ^ x.w;
}
float random(inout uvec4 seed) {
    seed.x += 0x9E3779B9U;
    seed = uvec4(hash_uvec4(seed));
    return float(seed.x)/4294967295.0;
}
uvec4 seedFromVec4(vec4 v){return uvec4(floatBitsToUint(v.x),floatBitsToUint(v.y),floatBitsToUint(v.z),floatBitsToUint(v.w));}

// Camera matrix
mat3 calcCameraMatrix(vec3 origin, vec3 target, vec3 up) {
    vec3 fw = normalize(target - origin);
    vec3 r = normalize(cross(fw, up));
    vec3 u = cross(r, fw);
    return mat3(r, u, fw);
}

// SDF functions
float sphereSDF(vec3 p){return length(p - vec3(-1.0, 0.0, 0.0)) - 1.0;}
float sphere2SDF(vec3 p){return length(p - vec3(1.0, 0.0, 0.0)) - 1.0;}
float planeSDF(vec3 p){return p.y + 1.0;}

// Smooth min function
float smin(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

struct HitInfo{
    float dist;
    int id;
    float blend;
};

struct SceneHit {
    bool hit;
    int id;
    vec3 pos;
    vec3 normal;
    float blend;
};

// Scene SDF: Smooth union of two spheres (ID=1) and a plane (ID=2)
HitInfo sceneSDF(vec3 p){
    float k = 1.0;  // no smoothing
    float s1 = sphereSDF(p);
    float s2 = sphere2SDF(p);
    float d_smooth = smin(s1, s2, k);

    // blend factor for material interpolation
    float h = clamp(0.5 + 0.5 * (s2 - s1) / k, 0.0, 1.0);

    float sdP = planeSDF(p - vec3(0.0));
    float d = d_smooth;
    int id = 1;
    float blend = h;

    if(sdP < d){
        d = sdP;
        id = 2;
        blend = 0.0;
    }

    HitInfo hInfo;
    hInfo.dist = d;
    hInfo.id = id;
    hInfo.blend = blend;
    return hInfo;
}

vec3 calcNormal(vec3 p) {
    float h = 0.005;
    float d = sceneSDF(p).dist;
    vec3 n = normalize(vec3(
        sceneSDF(p + vec3(h, 0, 0)).dist - d,
        sceneSDF(p + vec3(0, h, 0)).dist - d,
        sceneSDF(p + vec3(0, 0, h)).dist - d
    ));
    return n;
}

SceneHit rayMarch(vec3 ro, vec3 rd){
    float t = 0.0;
    for(int i=0;i<200;i++){
        vec3 p = ro + rd * t;
        HitInfo h = sceneSDF(p);
        if(h.dist < EPSILON){
            SceneHit sh;
            sh.hit = true;
            sh.id = h.id;
            sh.pos = p;
            sh.normal = calcNormal(p);
            sh.blend = h.blend;
            return sh;
        }
        if(t > 50.0) break;
        t += h.dist;
    }
    SceneHit nh;
    nh.hit = false;
    return nh;
}

// Material blending
Material getBlendedMaterial(float blend) {
    Material m;
    m.albedo      = mix(sphereMat.albedo,       sphereMat2.albedo,       blend);
    m.roughness   = mix(sphereMat.roughness,    sphereMat2.roughness,    blend);
    m.metalness   = mix(sphereMat.metalness,    sphereMat2.metalness,    blend);
    m.ior         = mix(sphereMat.ior,          sphereMat2.ior,          blend);
    m.transmission= mix(sphereMat.transmission, sphereMat2.transmission, blend);
    m.subsurface  = mix(sphereMat.subsurface,   sphereMat2.subsurface,   blend);
    m.anisotropy  = mix(sphereMat.anisotropy,   sphereMat2.anisotropy,   blend);
    m.emission    = mix(sphereMat.emission,     sphereMat2.emission,     blend);
    return m;
}

Material getMaterial(int id, float blend){
    if(id == 1) {
        return getBlendedMaterial(blend);
    }
    if(id == 2) {
        return planeMat;
    }
    return sphereMat;
}

void buildTangentFrame(vec3 N, out vec3 T, out vec3 B){
    if(abs(N.x) > abs(N.z)) {
        T = vec3(-N.y, N.x, 0.0);
    } else {
        T = vec3(0.0, -N.z, N.y);
    }
    T = normalize(T);
    B = cross(N, T);
}

// GGX and Fresnel
vec3 fresnelSchlick(float cosTheta, vec3 F0){
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}
float D_GGX(vec3 N, vec3 H, float r){
    float a = r*r;
    float a2 = a*a;
    float NdotH = max(dot(N, H), 0.0);
    float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
    return a2 / (3.14159 * denom * denom);
}
float G_SmithGGXCorrelated(float NdotV, float NdotL, float r){
    float k = (r + 1.0) * (r + 1.0) / 8.0;
    float gv = NdotV / (NdotV * (1.0 - k) + k);
    float gl = NdotL / (NdotL * (1.0 - k) + k);
    return gv * gl;
}

vec3 sampleGGXHemisphere(vec3 N, float r, float r1, float r2){
    float a = r*r;
    float phi = 2.0 * 3.14159 * r1;
    float cosT = sqrt((1.0 - r2) / (1.0 + (a*a - 1.0) * r2));
    float sinT = sqrt(1.0 - cosT*cosT);
    vec3 T, B;
    buildTangentFrame(N, T, B);
    vec3 H = T*(cos(phi)*sinT) + B*(sin(phi)*sinT) + N*cosT;
    return normalize(H);
}
vec3 sampleHemisphereCosine(vec3 N, float r1, float r2){
    float phi = 2.0 * 3.14159 * r1;
    float cosT = sqrt(1.0 - r2);
    float sinT = sqrt(r2);
    vec3 T, B;
    buildTangentFrame(N, T, B);
    vec3 L = T*(cos(phi)*sinT) + B*(sin(phi)*sinT) + N*cosT;
    return normalize(L);
}

vec3 evalBSDF(Material mat, vec3 N, vec3 V, vec3 L, out float pdf){
    vec3 H = normalize(L + V);
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    float VdotH = max(dot(V, H), 0.0);

    vec3 baseColor = mat.albedo;
    vec3 F0 = mix(vec3(0.04), baseColor, mat.metalness);
    float diffW = (1.0 - mat.metalness) * (1.0 - mat.transmission);
    vec3 diffuse = diffW * baseColor / 3.14159;

    float D = D_GGX(N, H, mat.roughness);
    float G = G_SmithGGXCorrelated(NdotV, NdotL, mat.roughness);
    vec3 F = fresnelSchlick(VdotH, F0);

    vec3 spec = (D * G * F) / (4.0 * NdotV * NdotL + 0.0001);
    vec3 bsdf = diffuse + spec;

    float pdfDiffuse = diffW > 0.0 ? (NdotL / 3.14159) : 0.0;
    float pdfSpec = (NdotH * D) / (4.0 * VdotH + 0.0001);
    float wD = (diffW > 0.0) ? 0.5 : 0.0;
    float wS = 0.5;
    pdf = wD * pdfDiffuse + wS * pdfSpec + 0.000001;
    return bsdf;
}

float areaLightPDF(vec3 Lpos, vec3 hp, vec3 N){
    float area = lightSize.x * lightSize.y;
    vec3 ld = Lpos - hp;
    float dist2 = dot(ld, ld);
    float dist = sqrt(dist2);
    float NdotL_light = max(dot(normalize(ld), vec3(0,1,0)), 0.0);
    if(NdotL_light > 0.0) return dist2 / (NdotL_light * area);
    return 0.0;
}
vec3 areaLightEmission(vec3 Lpos, vec3 hp){return lightEmission;}

vec3 sampleAreaLight(inout uvec4 seed){
    float r1 = random(seed);
    float r2 = random(seed);
    vec3 lp = lightPos + vec3((r1 - 0.5) * lightSize.x, 0.0, (r2 - 0.5) * lightSize.y);
    return lp;
}

vec3 traceRay(inout uvec4 seed, vec3 ro, vec3 rd){
    vec3 L = vec3(0.0);
    vec3 tp = vec3(1.0);
    for(int b=0; b<MAX_BOUNCES; b++){
        SceneHit hit = rayMarch(ro, rd);
        if(!hit.hit) break;
        Material mat = getMaterial(hit.id, hit.blend);
        if(length(mat.emission) > 0.0){
            L += tp * mat.emission;
            break;
        }
        vec3 N = hit.normal;
        vec3 V = -rd;

        // direct light sampling
        vec3 lpos = sampleAreaLight(seed);
        vec3 ldir = normalize(lpos - hit.pos);
        float ldist = length(lpos - hit.pos);
        SceneHit sh = rayMarch(hit.pos + N*EPSILON, ldir);
        bool unsh = (!sh.hit || length(sh.pos - hit.pos) > ldist - EPSILON);
        float dpl = areaLightPDF(lpos, hit.pos, N);
        float dpb;
        vec3 bsdfVal = evalBSDF(mat, N, V, ldir, dpb);
        float NdotL = max(dot(N, ldir), 0.0);
        if(unsh && NdotL > 0.0 && dpl > 0.0){
            vec3 Le = areaLightEmission(lpos, hit.pos);
            float misw = (dpl + dpb > 0.0) ? dpl / (dpb + dpl) : 0.0;
            L += tp * Le * bsdfVal * (NdotL / (dpl + 0.000001)) * misw;
        }

        // importance sampling BSDF
        float clobe = random(seed);
        vec3 ndir;
        float diffW = (1.0 - mat.metalness) * (1.0 - mat.transmission);
        if(clobe < 0.5 && diffW > 0.0){
            float r1 = random(seed);
            float r2 = random(seed);
            ndir = sampleHemisphereCosine(N, r1, r2);
        } else {
            float r1 = random(seed);
            float r2 = random(seed);
            vec3 H = sampleGGXHemisphere(N, mat.roughness, r1, r2);
            ndir = reflect(-V, H);
        }

        float npdf;
        vec3 be = evalBSDF(mat, N, V, ndir, npdf);
        float NdotNext = max(dot(N, ndir), 0.0);
        if(npdf < 1e-7 || NdotNext < EPSILON) break;
        float p = 0.9;
        if(random(seed) > p) break;
        be /= p;
        tp *= be * NdotNext / npdf;

        ro = hit.pos + N * EPSILON;
        rd = ndir;
    }
    // Just clamp final L for safety
    return min(L, vec3(10.0));
}

mat3 rotationX(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        1.0, 0.0, 0.0,
        0.0, c,   -s,
        0.0, s,    c
    );
}

mat3 rotationY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        c,   0.0, s,
        0.0, 1.0, 0.0,
       -s,   0.0, c
    );
}

mat3 rotationZ(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        c, -s, 0.0,
        s,  c, 0.0,
        0.0, 0.0, 1.0
    );
}

void main(){
    // Prepare random seed
    vec4 sb = u_randomSeed + vec4(v_uv, float(u_frameCount), u_time);
    uvec4 seed = seedFromVec4(sb);

    float aspect = u_resolution.x / u_resolution.y;
    mat3 cam = calcCameraMatrix(u_cameraPos, camTarget, camUp);
    float fs = tan(fov * 0.5);

    // Jitter for DOF or anti-aliasing
    float r1 = random(seed) - 0.5;
    float r2 = random(seed) - 0.5;
    float px = (v_uv.x + r1 * (1.0 / u_resolution.x)) * 2.0 - 1.0;
    float py = (v_uv.y + r2 * (1.0 / u_resolution.y)) * 2.0 - 1.0;
    px *= aspect * fs;
    py *= fs;

    vec3 rd = normalize(cam * vec3(px, py, 1.0));
    // Example extra rotation if desired:
    rd = rotationX(0.0) * rotationY(0.0) * rotationZ(0.0) * rd;

    vec3 ro = u_cameraPos;
    vec3 c = traceRay(seed, ro, rd);
    outColor = vec4(c, 1.0);
}
`;

//
// 3) Accumulate Fragment Shader
//
export const accumulateFS = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform int u_frameCount;
uniform sampler2D u_prevAccum;
uniform sampler2D u_currentSample;

void main(){
    vec3 prevAccum = texture(u_prevAccum, v_uv).rgb;
    vec3 currentSample = texture(u_currentSample, v_uv).rgb;

    float f = float(u_frameCount);
    // Incremental accumulation
    vec3 accum = prevAccum + (currentSample - prevAccum) / f;

    outColor = vec4(accum, 1.0);
}
`;

//
// 4) Denoise Fragment Shader (NEW)
//    Simple bilateral-like filter with a 5x5 kernel.
//    Weighted by spatial distance + color distance to preserve edges.
//
export const denoiseFS = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

// The accumulated color to be denoised
uniform sampler2D u_accum;

// The resolution of the texture (width, height)
uniform vec2 u_resolution;

// Control how strong the bilateral filter is in space and color
uniform float u_spatialSigma;  // e.g. 2.0
uniform float u_colorSigma;    // e.g. 0.1

// Gaussian function for distance
float gauss(float x, float sigma) {
    return exp(-0.5 * (x*x) / (sigma*sigma));
}

void main() {
    // Current pixel color
    vec3 centerColor = texture(u_accum, v_uv).rgb;

    // We use a 5x5 kernel => radius=2
    int radius = 2;

    float totalWeight = 0.0;
    vec3  sumColor   = vec3(0.0);

    for(int j=-radius; j<=radius; j++){
        for(int i=-radius; i<=radius; i++){
            vec2 offset = vec2(float(i), float(j)) / u_resolution;
            vec3 neighborColor = texture(u_accum, v_uv + offset).rgb;

            // Spatial weight
            float dist2 = float(i*i + j*j);
            float spatialWeight = gauss(sqrt(dist2), u_spatialSigma);

            // Color weight
            float colorDiff = length(neighborColor - centerColor);
            float colorWeight = gauss(colorDiff, u_colorSigma);

            float w = spatialWeight * colorWeight;
            sumColor    += neighborColor * w;
            totalWeight += w;
        }
    }

    if(totalWeight > 0.0) {
        sumColor /= totalWeight;
    }

    outColor = vec4(sumColor, 1.0);
}
`;

//
// 5) Display Fragment Shader
//
export const displayFS = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_accum;

void main(){
    // Read the final texture (could be raw accumulated or denoised)
    vec3 accum = texture(u_accum, v_uv).rgb;

    // Gamma correction
    vec3 gammaColor = pow(accum, vec3(1.0/2.2));
    outColor = vec4(gammaColor, 1.0);
}
`;
