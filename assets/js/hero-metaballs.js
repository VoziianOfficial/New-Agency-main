import * as THREE from "https://esm.sh/three@0.178.0";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
const lowPowerDevice = coarsePointer || (navigator.hardwareConcurrency || 8) <= 4;
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const maxPixelRatio = coarsePointer ? 1.15 : 1.75;
const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
const accentColor =
  getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() ||
  "#ffa300";

const MAX_SPHERES = 9;

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  ${lowPowerDevice || isSafari ? "precision mediump float;" : "precision highp float;"}

  uniform float uTime;
  uniform vec2 uResolution;
  uniform int uSphereCount;
  uniform vec4 uSpheres[${MAX_SPHERES}];
  uniform vec3 uAccentColor;
  uniform vec3 uHighlightColor;
  uniform vec3 uDeepColor;
  uniform float uBlend;
  uniform float uAlpha;
  uniform int uSteps;
  uniform int uLowPower;

  varying vec2 vUv;

  const float MAX_DIST = 9.0;
  const float EPSILON = 0.0025;

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  float sdSphere(vec3 p, float r) {
    return length(p) - r;
  }

  vec2 getUv() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    return uv;
  }

  float sceneSDF(vec3 p) {
    float d = MAX_DIST;

    for (int i = 0; i < ${MAX_SPHERES}; i++) {
      if (i >= uSphereCount) break;

      vec4 sphere = uSpheres[i];
      float sphereDistance = sdSphere(p - sphere.xyz, sphere.w);
      d = smin(d, sphereDistance, uBlend);
    }

    return d;
  }

  vec3 calcNormal(vec3 p) {
    float e = uLowPower == 1 ? 0.005 : 0.003;
    vec2 h = vec2(e, 0.0);

    return normalize(vec3(
      sceneSDF(p + h.xyy) - sceneSDF(p - h.xyy),
      sceneSDF(p + h.yxy) - sceneSDF(p - h.yxy),
      sceneSDF(p + h.yyx) - sceneSDF(p - h.yyx)
    ));
  }

  float softShadow(vec3 ro, vec3 rd) {
    float shade = 1.0;
    float t = 0.03;

    for (int i = 0; i < 18; i++) {
      if (uLowPower == 1 && i > 8) break;

      float h = sceneSDF(ro + rd * t);
      shade = min(shade, 12.0 * h / t);
      t += clamp(h, 0.035, 0.18);
      if (h < EPSILON || t > 4.0) break;
    }

    return clamp(shade, 0.0, 1.0);
  }

  float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;

    for (int i = 0; i < 54; i++) {
      if (i >= uSteps) break;

      vec3 p = ro + rd * t;
      float d = sceneSDF(p);
      if (d < EPSILON) return t;
      if (t > MAX_DIST) break;

      t += d * 0.86;
    }

    return -1.0;
  }

  float fieldGlow(vec3 p) {
    float glow = 0.0;

    for (int i = 0; i < ${MAX_SPHERES}; i++) {
      if (i >= uSphereCount) break;

      vec4 sphere = uSpheres[i];
      float d = length(p.xy - sphere.xy);
      glow += smoothstep(sphere.w * 2.65, sphere.w * 0.78, d) * 0.09;
    }

    return clamp(glow, 0.0, 0.55);
  }

  void main() {
    vec2 uv = getUv();
    vec3 ro = vec3(uv * 2.12, -3.05);
    vec3 rd = normalize(vec3(uv * 0.06, 1.0));
    float t = raymarch(ro, rd);
    float glow = fieldGlow(vec3(uv * 2.12, 0.0));

    if (t < 0.0) {
      gl_FragColor = vec4(uAccentColor * glow, glow);
      return;
    }

    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);
    vec3 viewDir = normalize(-rd);
    vec3 lightDir = normalize(vec3(-0.36, 0.82, -0.44));
    vec3 fillDir = normalize(vec3(0.64, -0.28, -0.32));
    float diff = max(dot(n, lightDir), 0.0);
    float fill = max(dot(n, fillDir), 0.0);
    float shadow = softShadow(p + n * 0.02, lightDir);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(n, halfVec), 0.0), 42.0);
    float broadSpec = pow(max(dot(n, halfVec), 0.0), 9.0);
    float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), 2.25);
    float inner = smoothstep(-1.2, 1.0, n.y + n.z * 0.55);

    vec3 color = mix(uDeepColor, uAccentColor * 0.62, inner);
    color += uAccentColor * diff * shadow * 0.76;
    color += uAccentColor * fill * 0.18;
    color += uHighlightColor * spec * 1.45;
    color += uHighlightColor * broadSpec * 0.16;
    color += uAccentColor * fresnel * 0.48;
    color *= 0.72 + shadow * 0.34;
    color = color / (color + vec3(0.78));

    float alpha = smoothstep(MAX_DIST, 0.0, t) * uAlpha;
    alpha = max(alpha, glow * 0.62);
    color += uAccentColor * glow * 0.24;

    gl_FragColor = vec4(color, alpha);
  }
`;

function hashString(value) {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function randomFromSeed(seed) {
  let state = seed || 1;

  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function createSpheres(seed, isService) {
  const random = randomFromSeed(seed);
  const base = isService
    ? [
        { base: [-1.18, -0.1], radius: 0.52, amp: [0.26, 0.2, 0.15], speed: 0.2 },
        { base: [1.12, 0.04], radius: 0.48, amp: [0.25, 0.22, 0.18], speed: 0.18 },
        { base: [0.62, -0.42], radius: 0.34, amp: [0.28, 0.2, 0.18], speed: 0.26 },
        { base: [-0.62, -0.46], radius: 0.28, amp: [0.24, 0.17, 0.14], speed: 0.31 },
        { base: [1.32, 0.42], radius: 0.24, amp: [0.22, 0.2, 0.16], speed: 0.24 },
        { base: [-1.36, 0.4], radius: 0.3, amp: [0.22, 0.18, 0.16], speed: 0.22 },
        { base: [0.12, -0.68], radius: 0.21, amp: [0.3, 0.22, 0.16], speed: 0.34 }
      ]
    : [
        { base: [-0.48, 0.24], radius: 0.76, amp: [0.4, 0.22, 0.16], speed: 0.23 },
        { base: [0.88, -0.18], radius: 0.66, amp: [0.36, 0.28, 0.2], speed: 0.19 },
        { base: [0.36, 0.42], radius: 0.43, amp: [0.42, 0.34, 0.24], speed: 0.29 },
        { base: [0.22, -0.42], radius: 0.34, amp: [0.28, 0.2, 0.16], speed: 0.34 },
        { base: [1.28, 0.52], radius: 0.32, amp: [0.28, 0.26, 0.18], speed: 0.26 },
        { base: [-1.24, -0.5], radius: 0.48, amp: [0.3, 0.22, 0.2], speed: 0.21 },
        { base: [0.02, 0.04], radius: 0.25, amp: [0.52, 0.38, 0.2], speed: 0.38 },
        { base: [0.7, -0.68], radius: 0.27, amp: [0.36, 0.24, 0.14], speed: 0.31 }
      ];

  return base.map((sphere, index) => {
    const spread = isService ? 0.18 : 0.08;

    return {
      ...sphere,
      base: [
        sphere.base[0] + (random() - 0.5) * spread,
        sphere.base[1] + (random() - 0.5) * spread
      ],
      radius: sphere.radius * (0.9 + random() * 0.2),
      amp: sphere.amp.map((value) => value * (0.86 + random() * 0.22)),
      speed: sphere.speed * (0.88 + random() * 0.2),
      phase: random() * Math.PI * 2 + index * 0.29,
      position: new THREE.Vector3(),
      radiusNow: sphere.radius
    };
  });
}

function getSphereCount(width, isService) {
  if (width < 560) return isService ? 2 : 3;
  if (width < 900) return isService ? 3 : 4;
  if (width < 1180) return isService ? 5 : 6;

  return isService ? 6 : 8;
}

function initMetaballs(element, options = {}) {
  if (!element || element.dataset.metaballsReady === "true") return;

  element.dataset.metaballsReady = "true";

  const isService = options.variant === "service";
  const canvas = document.createElement("canvas");
  canvas.className = isService ? "service-hero__metaballs" : "home-hero__metaballs";
  canvas.setAttribute("aria-hidden", "true");
  element.prepend(canvas);

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !lowPowerDevice,
      powerPreference: lowPowerDevice ? "default" : "high-performance",
      premultipliedAlpha: true,
      preserveDrawingBuffer: false
    });
  } catch (error) {
    canvas.remove();
    return;
  }

  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const clock = new THREE.Clock();
  const resolution = new THREE.Vector2(1, 1);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: resolution },
      uSphereCount: { value: 1 },
      uSpheres: {
        value: Array.from({ length: MAX_SPHERES }, () => new THREE.Vector4(0, 0, 0, 0))
      },
      uAccentColor: { value: new THREE.Color(accentColor) },
      uHighlightColor: { value: new THREE.Color("#ffd18a") },
      uDeepColor: { value: new THREE.Color("#2a1000") },
      uBlend: { value: isService ? 0.5 : 0.58 },
      uAlpha: { value: isService ? 0.58 : 0.78 },
      uSteps: { value: 42 },
      uLowPower: { value: lowPowerDevice ? 1 : 0 }
    },
    vertexShader,
    fragmentShader
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const label =
    options.seed ||
    element.querySelector(".service-hero__label, .home-hero__label")?.textContent.trim() ||
    window.location.pathname;
  const spheres = createSpheres(hashString(label), isService);
  const sphereUniforms = material.uniforms.uSpheres.value;
  const cursor = {
    targetActive: 0,
    activity: 0,
    target: new THREE.Vector2(0.62, 0.48),
    current: new THREE.Vector2(0.62, 0.48)
  };

  let bounds = element.getBoundingClientRect();
  let isVisible = false;
  let rafId = 0;
  let needsStaticRender = true;
  let resizeFrame = 0;

  function updateBounds() {
    bounds = element.getBoundingClientRect();
  }

  function viewportToWorld(x, y) {
    const nx = (x / Math.max(bounds.width, 1)) * 2 - 1;
    const ny = 1 - (y / Math.max(bounds.height, 1)) * 2;
    const aspect = bounds.width / Math.max(bounds.height, 1);

    return new THREE.Vector3(nx * aspect * 2.12, ny * 2.12, 0);
  }

  function resize() {
    updateBounds();

    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));

    renderer.setSize(width, height, false);
    resolution.set(width, height);
    material.uniforms.uSteps.value = width < 560 ? 16 : width < 900 ? 22 : lowPowerDevice ? 32 : isService ? 40 : 46;
    needsStaticRender = true;

    if (isVisible) {
      startLoop();
    }
  }

  function requestResize() {
    if (resizeFrame) return;

    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      resize();
    });
  }

  function onPointerMove(event) {
    if (coarsePointer) return;

    updateBounds();
    cursor.target.set(
      THREE.MathUtils.clamp(event.clientX - bounds.left, 0, bounds.width),
      THREE.MathUtils.clamp(event.clientY - bounds.top, 0, bounds.height)
    );
    cursor.targetActive = coarsePointer ? 0.7 : 1;
    needsStaticRender = true;
    startLoop();
  }

  function onPointerLeave() {
    if (coarsePointer) return;

    cursor.targetActive = 0;
    startLoop();
  }

  function updateSpheres(time) {
    const count = getSphereCount(bounds.width, isService);
    const aspect = bounds.width / Math.max(bounds.height, 1);
    const radiusScale =
      bounds.width < 560 ? (isService ? 0.34 : 0.48) : bounds.width < 900 ? (isService ? 0.58 : 0.68) : isService ? 0.82 : 0.94;
    const motionScale =
      bounds.width < 560 ? 0.46 : bounds.width < 900 ? 0.68 : isService ? 0.88 : 1;
    const cursorWorld = viewportToWorld(cursor.current.x, cursor.current.y);
    const cursorRadius = THREE.MathUtils.lerp(
      0,
      (coarsePointer ? 0.3 : 0.43) * radiusScale,
      cursor.activity
    );

    for (let i = 0; i < count; i += 1) {
      const sphere = spheres[i];
      const t = prefersReducedMotion ? 0 : time * sphere.speed;
      const x =
        sphere.base[0] * aspect +
        Math.sin(t + sphere.phase) * sphere.amp[0] * motionScale +
        Math.sin(t * 0.41 + sphere.phase * 1.7) * sphere.amp[0] * 0.34 * motionScale;
      const y =
        sphere.base[1] +
        Math.cos(t * 0.83 + sphere.phase) * sphere.amp[1] * motionScale +
        Math.sin(t * 0.58 + sphere.phase * 0.8) * sphere.amp[1] * 0.38 * motionScale;
      const z =
        Math.sin(t * 0.67 + sphere.phase * 1.4) * sphere.amp[2] +
        Math.cos(t * 0.37 + sphere.phase) * 0.12;
      const radiusPulse = prefersReducedMotion ? 0 : Math.sin(t * 1.8 + sphere.phase) * 0.035;

      sphere.position.set(x, y, z);

      if (cursor.activity > 0.01) {
        const toCursor = cursorWorld.clone().sub(sphere.position);
        const distance = toCursor.length();
        const influence = 1 - THREE.MathUtils.smoothstep(distance, 0.15, isService ? 1.55 : 1.75);

        if (distance > 0.001 && influence > 0) {
          sphere.position.addScaledVector(
            toCursor.normalize(),
            influence * cursor.activity * (isService ? 0.28 : 0.36)
          );
        }

        sphere.radiusNow =
          (sphere.radius + radiusPulse) * radiusScale +
          influence * cursor.activity * 0.08 * radiusScale;
      } else {
        sphere.radiusNow = (sphere.radius + radiusPulse) * radiusScale;
      }

      sphereUniforms[i].set(sphere.position.x, sphere.position.y, sphere.position.z, sphere.radiusNow);
    }

    sphereUniforms[count].set(cursorWorld.x, cursorWorld.y, 0.02, cursorRadius);
    material.uniforms.uSphereCount.value = count + 1;
    material.uniforms.uTime.value = time;
  }

  function render() {
    rafId = 0;

    if (!isVisible && !needsStaticRender && cursor.activity < 0.01) return;

    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    const activityEase = 1 - Math.pow(0.001, delta);
    const cursorEase = coarsePointer ? 0.12 : 0.075;

    cursor.current.lerp(cursor.target, 1 - Math.pow(1 - cursorEase, delta * 60));
    cursor.activity = THREE.MathUtils.lerp(cursor.activity, cursor.targetActive, activityEase * 0.62);

    updateSpheres(elapsed);
    renderer.render(scene, camera);
    needsStaticRender = false;

    if ((!prefersReducedMotion && isVisible) || cursor.activity > 0.01 || needsStaticRender) {
      startLoop();
    }
  }

  function startLoop() {
    if (!rafId) {
      rafId = requestAnimationFrame(render);
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;

      if (isVisible) {
        clock.getDelta();
        needsStaticRender = true;
        startLoop();
      } else if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },
    { rootMargin: "80px 0px", threshold: 0.02 }
  );

  resizeObserver.observe(element);
  intersectionObserver.observe(element);
  if (!coarsePointer) {
    element.addEventListener("pointermove", onPointerMove, { passive: true });
    element.addEventListener("pointerenter", onPointerMove, { passive: true });
    element.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }
  window.addEventListener("orientationchange", requestResize, { passive: true });

  resize();
  updateSpheres(0);
  renderer.render(scene, camera);
}

document.querySelectorAll(".home-hero").forEach((element) => {
  initMetaballs(element, { variant: "home" });
});

document.querySelectorAll(".service-hero").forEach((element) => {
  initMetaballs(element, { variant: "service" });
});
