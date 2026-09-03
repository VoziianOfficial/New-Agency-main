import * as THREE from "https://esm.sh/three@0.178.0";

const hero = document.querySelector(".home-hero");

if (hero) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const lowPowerDevice = coarsePointer || (navigator.hardwareConcurrency || 8) <= 4;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const maxPixelRatio = coarsePointer ? 1.35 : 1.75;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
  const accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-accent")
    .trim() || "#ffa300";

  const canvasClass = "home-hero__metaballs";
  const canvas = document.createElement("canvas");
  canvas.className = canvasClass;
  canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);

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
  }

  if (renderer) {
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const clock = new THREE.Clock();
  const resolution = new THREE.Vector2(1, 1);
  const accent = new THREE.Color(accentColor);
  const warmHighlight = new THREE.Color("#ffd18a");
  const deepOrange = new THREE.Color("#2a1000");

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: resolution },
      uSphereCount: { value: 6 },
      uSpheres: { value: Array.from({ length: 9 }, () => new THREE.Vector4()) },
      uAccentColor: { value: accent },
      uHighlightColor: { value: warmHighlight },
      uDeepColor: { value: deepOrange },
      uBlend: { value: 0.58 },
      uSteps: { value: 44 },
      uLowPower: { value: lowPowerDevice ? 1 : 0 }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      ${lowPowerDevice || isSafari ? "precision mediump float;" : "precision highp float;"}

      uniform float uTime;
      uniform vec2 uResolution;
      uniform int uSphereCount;
      uniform vec4 uSpheres[9];
      uniform vec3 uAccentColor;
      uniform vec3 uHighlightColor;
      uniform vec3 uDeepColor;
      uniform float uBlend;
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

        for (int i = 0; i < 9; i++) {
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

        for (int i = 0; i < 9; i++) {
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

        float alpha = smoothstep(MAX_DIST, 0.0, t) * 0.78;
        alpha = max(alpha, glow * 0.62);
        color += uAccentColor * glow * 0.24;

        gl_FragColor = vec4(color, alpha);
      }
    `
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const sphereUniforms = material.uniforms.uSpheres.value;
  const cursor = {
    active: false,
    targetActive: 0,
    activity: 0,
    target: new THREE.Vector2(0.66, 0.46),
    current: new THREE.Vector2(0.66, 0.46)
  };
  const spheres = createSpheres();
  let bounds = hero.getBoundingClientRect();
  let isVisible = true;
  let rafId = 0;
  let needsStaticRender = true;

  function getSphereCount() {
    const width = window.innerWidth;

    if (width < 560) return 4;
    if (width < 900) return 5;
    if (width < 1180) return 6;

    return 8;
  }

  function createSpheres() {
    const presets = [
      { base: [-0.48, 0.24], radius: 0.76, amp: [0.4, 0.22, 0.16], speed: 0.23, phase: 0.2 },
      { base: [0.88, -0.18], radius: 0.66, amp: [0.36, 0.28, 0.2], speed: 0.19, phase: 2.1 },
      { base: [0.36, 0.42], radius: 0.43, amp: [0.42, 0.34, 0.24], speed: 0.29, phase: 4.0 },
      { base: [0.22, -0.42], radius: 0.34, amp: [0.28, 0.2, 0.16], speed: 0.34, phase: 5.6 },
      { base: [1.28, 0.52], radius: 0.32, amp: [0.28, 0.26, 0.18], speed: 0.26, phase: 1.35 },
      { base: [-1.24, -0.5], radius: 0.48, amp: [0.3, 0.22, 0.2], speed: 0.21, phase: 3.4 },
      { base: [0.02, 0.04], radius: 0.25, amp: [0.52, 0.38, 0.2], speed: 0.38, phase: 2.8 },
      { base: [0.7, -0.68], radius: 0.27, amp: [0.36, 0.24, 0.14], speed: 0.31, phase: 4.9 }
    ];

    return presets.map((sphere) => ({
      ...sphere,
      position: new THREE.Vector3(),
      radiusNow: sphere.radius
    }));
  }

  function viewportToWorld(x, y) {
    const nx = (x / bounds.width) * 2 - 1;
    const ny = 1 - (y / bounds.height) * 2;
    const aspect = bounds.width / Math.max(bounds.height, 1);

    return new THREE.Vector3(nx * aspect * 2.12, ny * 2.12, 0);
  }

  function updateBounds() {
    bounds = hero.getBoundingClientRect();
  }

  function resize() {
    updateBounds();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));

    renderer.setSize(width, height, false);
    resolution.set(width, height);
    material.uniforms.uSphereCount.value = getSphereCount() + 1;
    material.uniforms.uSteps.value = width < 560 ? 26 : lowPowerDevice ? 34 : 46;
    needsStaticRender = true;
  }

  function onPointerMove(event) {
    updateBounds();
    cursor.target.set(
      THREE.MathUtils.clamp(event.clientX - bounds.left, 0, bounds.width),
      THREE.MathUtils.clamp(event.clientY - bounds.top, 0, bounds.height)
    );
    cursor.active = true;
    cursor.targetActive = coarsePointer ? 0.72 : 1;
    needsStaticRender = true;
    startLoop();
  }

  function onPointerLeave() {
    cursor.active = false;
    cursor.targetActive = 0;
  }

  function updateSpheres(time, delta) {
    const count = getSphereCount();
    const aspect = bounds.width / Math.max(bounds.height, 1);
    const radiusScale = bounds.width < 560 ? 0.52 : bounds.width < 900 ? 0.72 : 0.94;
    const motionScale = bounds.width < 560 ? 0.72 : bounds.width < 900 ? 0.82 : 1;
    const cursorWorld = viewportToWorld(cursor.current.x, cursor.current.y);
    const cursorRadius = THREE.MathUtils.lerp(0.0, (coarsePointer ? 0.3 : 0.43) * radiusScale, cursor.activity);

    for (let i = 0; i < count; i += 1) {
      const sphere = spheres[i];
      const t = reducedMotion ? 0 : time * sphere.speed;
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
      const radiusPulse = reducedMotion ? 0 : Math.sin(t * 1.8 + sphere.phase) * 0.035;

      sphere.position.set(x, y, z);

      if (cursor.activity > 0.01) {
        const toCursor = cursorWorld.clone().sub(sphere.position);
        const distance = toCursor.length();
        const influence = 1 - THREE.MathUtils.smoothstep(distance, 0.15, 1.75);

        if (distance > 0.001 && influence > 0) {
          sphere.position.addScaledVector(toCursor.normalize(), influence * cursor.activity * 0.36);
        }

        sphere.radiusNow = (sphere.radius + radiusPulse) * radiusScale + influence * cursor.activity * 0.08 * radiusScale;
      } else {
        sphere.radiusNow = (sphere.radius + radiusPulse) * radiusScale;
      }

      sphereUniforms[i].set(
        sphere.position.x,
        sphere.position.y,
        sphere.position.z,
        sphere.radiusNow
      );
    }

    sphereUniforms[count].set(cursorWorld.x, cursorWorld.y, 0.02, cursorRadius);
    material.uniforms.uSphereCount.value = count + 1;
    material.uniforms.uTime.value = time;
  }

  function render() {
    rafId = 0;

    if (!isVisible && !needsStaticRender) return;

    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    const ease = 1 - Math.pow(0.001, delta);
    const cursorEase = coarsePointer ? 0.12 : 0.075;

    cursor.current.lerp(cursor.target, 1 - Math.pow(1 - cursorEase, delta * 60));
    cursor.activity = THREE.MathUtils.lerp(cursor.activity, cursor.targetActive, ease * 0.62);

    updateSpheres(elapsed, delta);
    renderer.render(scene, camera);
    needsStaticRender = false;

    if (!reducedMotion && isVisible) {
      startLoop();
    } else if (cursor.activity > 0.01 || needsStaticRender) {
      startLoop();
    }
  }

  function startLoop() {
    if (!rafId) {
      rafId = requestAnimationFrame(render);
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    startLoop();
  });

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;

      if (isVisible) {
        clock.getDelta();
        startLoop();
      }
    },
    { threshold: 0.02 }
  );

  resizeObserver.observe(hero);
  intersectionObserver.observe(hero);
  hero.addEventListener("pointermove", onPointerMove, { passive: true });
  hero.addEventListener("pointerenter", onPointerMove, { passive: true });
  hero.addEventListener("pointerleave", onPointerLeave, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("orientationchange", resize, { passive: true });

  resize();
  updateSpheres(0, 0);
  renderer.render(scene, camera);
  startLoop();
  }
}
