"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const CONFIG = {
  beadRadius: 0.09,
  beadSpacing: 0.26,
  damping: 0.968,
  dropRadius: 0.22,
  gravity: -15,
  iterations: 5,
  maxBeadsPerString: 26,
  stringSpacing: 0.32,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type CrystalParticle = {
  hasBead: boolean;
  isBottom: boolean;
  mesh: THREE.Mesh | null;
  oldPosition: THREE.Vector3;
  pinned: boolean;
  position: THREE.Vector3;
};

type CrystalString = {
  anchorX: number;
  baseX: number;
  particles: CrystalParticle[];
  wire: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
};

function makeSparkleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  if (context) {
    const glow = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.4, "rgba(224,242,254,.8)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, 32, 32);
  }
  return new THREE.CanvasTexture(canvas);
}

function addRoofShape(
  group: THREE.Group,
  points: Array<[number, number]>,
  material: THREE.Material,
  depth = 0.22,
  z = 0,
) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) shape.lineTo(x, y);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    curveSegments: 8,
    depth,
  });
  geometry.translate(0, 0, -depth / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = z;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addRoofTrim(
  group: THREE.Group,
  points: Array<[number, number, number]>,
  material: THREE.Material,
  radius = 0.035,
) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const geometry = new THREE.TubeGeometry(curve, Math.max(24, points.length * 10), radius, 7, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function buildCrystalRoof(logoTexture: THREE.Texture) {
  const group = new THREE.Group();
  const roofMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    color: 0x03111d,
    emissive: 0x020812,
    emissiveIntensity: 0.24,
    metalness: 0.34,
    roughness: 0.22,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    color: 0x071e2d,
    emissive: 0x03101b,
    emissiveIntensity: 0.3,
    ior: 1.45,
    metalness: 0.18,
    opacity: 0.96,
    roughness: 0.18,
    transparent: true,
    transmission: 0.06,
  });
  const chromeMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 1,
    color: 0x6e9cad,
    emissive: 0x0a3545,
    emissiveIntensity: 0.68,
    metalness: 0.82,
    roughness: 0.2,
  });
  const accentMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 1,
    color: 0x9d4f78,
    emissive: 0x5b193f,
    emissiveIntensity: 0.82,
    metalness: 0.68,
    roughness: 0.2,
  });

  addRoofShape(group, [[-2.75, 0], [0, 1.55], [2.75, 0], [2.42, -0.18], [0, 1.18], [-2.42, -0.18]], glassMaterial, 0.28, 0.04);
  addRoofShape(group, [[-6.4, 0.18], [-5.95, 0.52], [-2.2, 0.24], [-1.48, 0.55], [-2.2, -0.16], [-5.72, -0.24]], roofMaterial, 0.24, -0.04);
  addRoofShape(group, [[6.4, 0.18], [5.95, 0.52], [2.2, 0.24], [1.48, 0.55], [2.2, -0.16], [5.72, -0.24]], roofMaterial, 0.24, -0.04);
  const rear = addRoofShape(group, [[-2.25, 0.62], [0, 1.72], [2.25, 0.62], [1.92, 0.48], [0, 1.4], [-1.92, 0.48]], roofMaterial, 0.2, -0.3);
  rear.scale.setScalar(0.82);
  rear.position.y = 0.55;

  addRoofTrim(group, [[-2.75, 0.02, 0.23], [-1.25, 0.72, 0.23], [0, 1.56, 0.23], [1.25, 0.72, 0.23], [2.75, 0.02, 0.23]], chromeMaterial, 0.047);
  addRoofTrim(group, [[-6.38, 0.19, 0.16], [-5.95, 0.52, 0.16], [-4.1, 0.43, 0.16], [-2.2, 0.25, 0.16], [-1.48, 0.55, 0.16]], chromeMaterial, 0.04);
  addRoofTrim(group, [[6.38, 0.19, 0.16], [5.95, 0.52, 0.16], [4.1, 0.43, 0.16], [2.2, 0.25, 0.16], [1.48, 0.55, 0.16]], chromeMaterial, 0.04);
  addRoofTrim(group, [[-5.72, -0.23, 0.15], [-3.9, -0.18, 0.15], [-2.2, -0.15, 0.15], [0, 1.19, 0.22], [2.2, -0.15, 0.15], [3.9, -0.18, 0.15], [5.72, -0.23, 0.15]], accentMaterial, 0.028);

  const signBacking = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.12), glassMaterial);
  signBacking.position.set(0, 0.55, 0.31);
  group.add(signBacking);
  const logoMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fragmentShader: `
      uniform sampler2D logoMask;
      varying vec2 vUv;
      void main() {
        float mask = texture2D(logoMask, vUv).a;
        vec3 cyan = vec3(0.40, 0.91, 0.98);
        vec3 pink = vec3(0.96, 0.45, 0.71);
        float blend = smoothstep(0.22, 0.82, vUv.x + (1.0 - vUv.y) * 0.08);
        vec3 neon = mix(cyan, pink, blend) * 1.2;
        gl_FragColor = vec4(neon, mask);
      }
    `,
    transparent: true,
    uniforms: { logoMask: { value: logoTexture } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
  });
  logoMaterial.toneMapped = false;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.96), logoMaterial);
  sign.position.set(0, 0.84, 0.34);
  group.add(sign);

  const finialGeometry = new THREE.OctahedronGeometry(0.12, 1);
  for (const [x, y] of [[-6.38, 0.31], [0, 1.72], [6.38, 0.31]] as Array<[number, number]>) {
    const finial = new THREE.Mesh(finialGeometry, chromeMaterial);
    finial.position.set(x, y, 0.18);
    finial.scale.y = 2.4;
    group.add(finial);
  }

  return group;
}

export function CrystalCurtainCanvas({
  className,
  entranceRef,
}: {
  className: string;
  entranceRef: RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const entrance = entranceRef.current;
    if (!canvas || !entrance) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, -1.6, 12.5);
    camera.lookAt(0, -1.6, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const environmentGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnvironment = new RoomEnvironment();
    const environmentTexture = environmentGenerator.fromScene(roomEnvironment, 0.04).texture;
    roomEnvironment.dispose();

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const topLight = new THREE.PointLight(0xffffff, 2.5, 30);
    topLight.position.set(0, 6, 6);
    scene.add(topLight);
    const cyanLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    cyanLight.position.set(8, 5, 5);
    scene.add(cyanLight);
    const pinkLight = new THREE.DirectionalLight(0xf472b6, 0.8);
    pinkLight.position.set(-8, -2, 4);
    scene.add(pinkLight);

    const beadGeometry = new THREE.OctahedronGeometry(CONFIG.beadRadius * 1.12, 0);
    beadGeometry.scale(0.9, 1.42, 0.76);
    const dropGeometry = new THREE.LatheGeometry([
      new THREE.Vector2(0, -CONFIG.dropRadius * 1.55),
      new THREE.Vector2(CONFIG.dropRadius * 0.58, -CONFIG.dropRadius * 0.42),
      new THREE.Vector2(CONFIG.dropRadius * 0.78, CONFIG.dropRadius * 0.18),
      new THREE.Vector2(CONFIG.dropRadius * 0.5, CONFIG.dropRadius * 0.72),
      new THREE.Vector2(0, CONFIG.dropRadius * 1.12),
    ], 8);
    const crystalMaterial = new THREE.MeshPhysicalMaterial({
      clearcoat: 1,
      clearcoatRoughness: 0.035,
      color: 0xe9fbff,
      dispersion: 0.72,
      envMap: environmentTexture,
      envMapIntensity: 2.1,
      flatShading: true,
      ior: 1.52,
      iridescence: 0.72,
      iridescenceIOR: 1.32,
      iridescenceThicknessRange: [180, 620],
      metalness: 0,
      opacity: 0.94,
      reflectivity: 0.9,
      roughness: 0.025,
      thickness: 0.22,
      transparent: true,
      transmission: 0.82,
    });
    const crystalAccentMaterial = crystalMaterial.clone();
    crystalAccentMaterial.color.set(0xffeef9);
    crystalAccentMaterial.iridescence = 0.9;
    const wireMaterial = new THREE.LineBasicMaterial({ color: 0xc8d6e5, opacity: 0.45, transparent: true });
    const logoTexture = new THREE.TextureLoader().load(
      "/LOGO/thaipbs-logo-silhouette.png",
      () => renderer.render(scene, camera),
    );
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    const roofGroup = buildCrystalRoof(logoTexture);
    scene.add(roofGroup);

    const sparkleTexture = makeSparkleTexture();
    const sparkleGeometry = new THREE.BufferGeometry();
    const sparklePositions = new Float32Array(120 * 3);
    for (let index = 0; index < 120; index++) {
      sparklePositions[index * 3] = (Math.random() - 0.5) * 15;
      sparklePositions[index * 3 + 1] = (Math.random() - 0.5) * 8 - 1;
      sparklePositions[index * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    sparkleGeometry.setAttribute("position", new THREE.BufferAttribute(sparklePositions, 3));
    const sparkleMaterial = new THREE.PointsMaterial({
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: sparkleTexture,
      size: 0.25,
      transparent: true,
    });
    const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
    scene.add(sparkles);

    const orbMaterials: THREE.SpriteMaterial[] = [];
    const orbLights = Array.from({ length: 3 }, (_, index) => {
      const light = new THREE.PointLight(index === 1 ? 0xcffafe : 0xffffff, 2.4, 5.4, 1.8);
      const material = new THREE.SpriteMaterial({
        blending: THREE.AdditiveBlending,
        color: index === 2 ? 0xfce7f3 : 0xffffff,
        depthWrite: false,
        map: sparkleTexture,
        opacity: 0.92,
        transparent: true,
      });
      const dot = new THREE.Sprite(material);
      dot.scale.setScalar(index === 0 ? 0.22 : 0.16);
      orbMaterials.push(material);
      scene.add(light, dot);
      return { dot, index, light, phase: index * 2.17 + 0.4 };
    });

    const raycaster = new THREE.Raycaster();
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const pointer = {
      hovered: false,
      normalizedX: 0,
      normalizedY: 0,
      position: new THREE.Vector3(-1000, -1000, 0),
      previousPosition: new THREE.Vector3(-1000, -1000, 0),
      velocity: new THREE.Vector3(),
    };
    let strings: CrystalString[] = [];
    let curtainTopY = 0;
    let curtainSpan = 0;
    let visibleHeight = 0;
    let visibleWidth = 0;
    let animationFrame = 0;
    let audioContext: AudioContext | null = null;
    let lastNoteIndex = -1;
    let lastTime = 0;
    let nextJingleTime = 0;
    let lastCanvasHeight = 0;
    let lastCanvasWidth = 0;
    let lastOrbCssTime = 0;
    let visible = false;

    function clearStrings() {
      for (const string of strings) {
        for (const particle of string.particles) {
          if (particle.mesh) scene.remove(particle.mesh);
        }
        scene.remove(string.wire);
        string.wire.geometry.dispose();
      }
      strings = [];
    }

    function buildCurtain() {
      clearStrings();
      const topY = curtainTopY;
      const stringCount = Math.max(2, Math.floor(curtainSpan / CONFIG.stringSpacing / 2) * 2);
      const startX = -((stringCount - 1) * CONFIG.stringSpacing) / 2;

      for (let stringIndex = 0; stringIndex < stringCount; stringIndex++) {
        const x = startX + stringIndex * CONFIG.stringSpacing;
        const particles: CrystalParticle[] = [];
        for (let beadIndex = 0; beadIndex < CONFIG.maxBeadsPerString; beadIndex++) {
          const position = new THREE.Vector3(x, topY - beadIndex * CONFIG.beadSpacing, 0);
          const isBottom = beadIndex === CONFIG.maxBeadsPerString - 1;
          const hasBead = isBottom || beadIndex % 2 === 1;
          const particle: CrystalParticle = {
            hasBead,
            isBottom,
            mesh: null,
            oldPosition: position.clone(),
            pinned: beadIndex === 0,
            position,
          };
          if (hasBead) {
            const material = (stringIndex + beadIndex) % 5 === 0 ? crystalAccentMaterial : crystalMaterial;
            const mesh = new THREE.Mesh(isBottom ? dropGeometry : beadGeometry, material);
            mesh.castShadow = true;
            mesh.position.copy(position);
            mesh.rotation.set(
              ((stringIndex + beadIndex) % 5 - 2) * 0.055,
              stringIndex * 0.37 + beadIndex * 0.21,
              ((stringIndex * 2 + beadIndex) % 7 - 3) * 0.035,
            );
            if (!isBottom) {
              const variation = 0.9 + ((stringIndex + beadIndex) % 4) * 0.055;
              mesh.scale.set(variation, 0.94 + ((stringIndex * 3 + beadIndex) % 3) * 0.055, variation);
            }
            scene.add(mesh);
            particle.mesh = mesh;
          }
          particles.push(particle);
        }

        const wireGeometry = new THREE.BufferGeometry();
        wireGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(particles.length * 3), 3));
        const wire = new THREE.Line(wireGeometry, wireMaterial);
        scene.add(wire);
        strings.push({ anchorX: x, baseX: x, particles, wire });
      }
    }

    function resize() {
      const width = canvas!.clientWidth;
      const height = canvas!.clientHeight;
      if (!width || !height) return;
      if (Math.abs(width - lastCanvasWidth) < 1 && Math.abs(height - lastCanvasHeight) < 1) return;
      lastCanvasWidth = width;
      lastCanvasHeight = height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      visibleHeight = 2 * Math.tan(verticalFov / 2) * camera.position.z;
      visibleWidth = visibleHeight * camera.aspect;
      const viewportTop = camera.position.y + visibleHeight / 2;
      const roofHeightPixels = parseFloat(getComputedStyle(entrance!).getPropertyValue("--roof-height")) || 170;
      const roofWorldHeight = visibleHeight * (roofHeightPixels / height);
      const roofScaleX = clamp((visibleWidth - 0.24) / 12.8, 0.34, 1.5);
      const roofScaleY = clamp(roofWorldHeight / 2.1, 0.62, 0.84);
      curtainSpan = visibleWidth - CONFIG.stringSpacing;
      curtainTopY = viewportTop - visibleHeight * ((roofHeightPixels + 8) / height);
      roofGroup.scale.set(roofScaleX, roofScaleY, (roofScaleX + roofScaleY) / 2);
      roofGroup.position.set(0, curtainTopY + 0.13 * roofScaleY, 0.15);
      entrance!.style.setProperty("--canopy-width", `${Math.round((curtainSpan / visibleWidth) * width)}px`);
      buildCurtain();
      moveAnchors();
      syncMeshes();
      renderer.render(scene, camera);
    }

    function scrollProgress() {
      if (reducedMotion) return 0.78;
      const rect = entrance!.getBoundingClientRect();
      return clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
    }

    function moveAnchors() {
      const curtainOpen = clamp(scrollProgress() / 0.64, 0, 1);
      const openAmount = Math.pow(curtainOpen, 1.28);
      const halfCount = strings.length / 2;
      const leftEdge = -curtainSpan / 2;
      const rightEdge = curtainSpan / 2;
      const gatheredWidth = Math.min(curtainSpan * 0.14, 1.75);
      for (let index = 0; index < strings.length; index++) {
        const string = strings[index];
        const sideIndex = index < halfCount ? index : index - halfCount;
        const sideProgress = halfCount <= 1 ? 0 : sideIndex / (halfCount - 1);
        const gatheredX = index < halfCount
          ? leftEdge + sideProgress * gatheredWidth
          : rightEdge - gatheredWidth + sideProgress * gatheredWidth;
        const targetX = THREE.MathUtils.lerp(string.baseX, gatheredX, openAmount);
        const shift = targetX - string.anchorX;
        if (!shift) continue;
        string.anchorX = targetX;
        for (const particle of string.particles) {
          particle.position.x += shift;
          particle.oldPosition.x += shift;
        }
      }
    }

    function updatePointerInteraction() {
      if (!pointer.hovered || reducedMotion) return;
      pointer.velocity.subVectors(pointer.position, pointer.previousPosition).clampLength(0, 0.32);
      const pointerSpeed = pointer.velocity.length();
      if (pointerSpeed < 0.002) {
        pointer.previousPosition.copy(pointer.position);
        return;
      }
      const radius = 1.05;
      let affectedBeads = 0;
      for (const string of strings) {
        for (const particle of string.particles) {
          if (particle.pinned) continue;
          const dx = particle.position.x - pointer.position.x;
          const dy = particle.position.y - pointer.position.y;
          const dz = particle.position.z - pointer.position.z;
          const distance = Math.hypot(dx, dy, dz);
          if (distance >= radius) continue;
          if (particle.hasBead) affectedBeads++;
          const factor = (1 - (distance / radius) ** 2) * 0.3;
          const safeDistance = Math.max(distance, 0.0001);
          particle.position.x += pointer.velocity.x * factor + dx / safeDistance * factor * pointerSpeed * 0.34;
          particle.position.y += pointer.velocity.y * factor * 0.38;
          particle.position.z += factor * 0.58 + Math.abs(pointer.velocity.x) * factor * 0.3;
        }
      }
      if (affectedBeads > 0) {
        playCrystalJingle(clamp(pointerSpeed * 3.2 + affectedBeads / 24, 0.18, 1), affectedBeads);
      }
      pointer.previousPosition.copy(pointer.position);
    }

    function enableAudio() {
      if (!audioContext) audioContext = new AudioContext();
      if (audioContext.state === "suspended") void audioContext.resume();
    }

    function playCrystalJingle(strength: number, affectedBeads: number) {
      const context = audioContext;
      const nowMs = performance.now();
      if (!context || context.state !== "running" || nowMs < nextJingleTime) return;
      nextJingleTime = nowMs + 48 + Math.random() * 112;

      const now = context.currentTime;
      const notes = [659.25, 739.99, 783.99, 880, 987.77, 1174.66, 1318.51, 1479.98];
      const strikeCount = strength > 0.48 && affectedBeads > 3 && Math.random() < 0.42 ? 2 : 1;

      for (let strike = 0; strike < strikeCount; strike++) {
        let noteIndex = Math.floor(Math.random() * notes.length);
        if (noteIndex === lastNoteIndex) noteIndex = (noteIndex + 1 + Math.floor(Math.random() * (notes.length - 1))) % notes.length;
        lastNoteIndex = noteIndex;

        const verticalPitch = THREE.MathUtils.lerp(0.88, 1.14, clamp((pointer.normalizedY + 1) / 2, 0, 1));
        const registerRoll = Math.random();
        const register = registerRoll < 0.12 ? 0.75 : registerRoll > 0.84 ? 1.34 : 1;
        const frequency = notes[noteIndex] * verticalPitch * register * (0.988 + Math.random() * 0.024);
        const startTime = now + (strike === 0 ? 0 : 0.028 + Math.random() * 0.105);
        const materialVariation = Math.random();
        const decayVariation = 0.72 + Math.random() * 0.62;
        const levelVariation = 0.66 + Math.random() * 0.42;
        const panner = context.createStereoPanner();
        const highPass = context.createBiquadFilter();
        const lowPass = context.createBiquadFilter();
        highPass.type = "highpass";
        highPass.frequency.setValueAtTime(390 + Math.random() * 360, startTime);
        highPass.Q.setValueAtTime(0.3 + Math.random() * 0.45, startTime);
        lowPass.type = "lowpass";
        lowPass.frequency.setValueAtTime(6200 + strength * 3200 + Math.random() * 1700, startTime);
        lowPass.Q.setValueAtTime(0.35 + Math.random() * 0.5, startTime);
        panner.pan.setValueAtTime(
          clamp(pointer.normalizedX + (Math.random() - 0.5) * (strikeCount > 1 ? 0.32 : 0.16), -0.9, 0.9),
          startTime,
        );
        highPass.connect(lowPass);
        lowPass.connect(panner);
        panner.connect(context.destination);

        const partials = [
          { decay: 1, gain: 1, ratio: 1 },
          { decay: 0.68, gain: 0.3 + materialVariation * 0.1, ratio: 1.91 + materialVariation * 0.19 },
          { decay: 0.47, gain: 0.14 + (1 - materialVariation) * 0.09, ratio: 2.54 + Math.random() * 0.34 },
          { decay: 0.29, gain: 0.05 + Math.random() * 0.06, ratio: 3.72 + Math.random() * 0.58 },
        ];
        let remainingPartials = partials.length;
        for (let index = 0; index < partials.length; index++) {
          const partial = partials[index];
          const partialStart = startTime + index * 0.0018 + Math.random() * 0.005;
          const duration = partial.decay * decayVariation * (0.84 + strength * 0.48);
          const peakGain = (0.0045 + strength * 0.0125) * levelVariation * partial.gain / strikeCount;
          const oscillator = context.createOscillator();
          const partialGain = context.createGain();
          oscillator.type = index === partials.length - 1 && materialVariation > 0.55 ? "triangle" : "sine";
          oscillator.frequency.setValueAtTime(frequency * partial.ratio, partialStart);
          oscillator.detune.setValueAtTime((Math.random() - 0.5) * 14, partialStart);
          oscillator.detune.linearRampToValueAtTime(-3 - Math.random() * 13, partialStart + duration);
          partialGain.gain.setValueAtTime(0.0001, partialStart);
          partialGain.gain.exponentialRampToValueAtTime(peakGain, partialStart + 0.003 + Math.random() * 0.004);
          partialGain.gain.exponentialRampToValueAtTime(peakGain * (0.22 + Math.random() * 0.2), partialStart + duration * 0.24);
          partialGain.gain.exponentialRampToValueAtTime(0.0001, partialStart + duration);
          oscillator.connect(partialGain);
          partialGain.connect(highPass);
          oscillator.start(partialStart);
          oscillator.stop(partialStart + duration + 0.03);
          oscillator.onended = () => {
            oscillator.disconnect();
            partialGain.disconnect();
            remainingPartials--;
            if (remainingPartials === 0) {
              highPass.disconnect();
              lowPass.disconnect();
              panner.disconnect();
            }
          };
        }
      }
    }

    function updatePhysics(deltaTime: number) {
      updatePointerInteraction();
      for (const string of strings) {
        for (const particle of string.particles) {
          if (particle.pinned) continue;
          const velocity = particle.position.clone().sub(particle.oldPosition).multiplyScalar(CONFIG.damping);
          particle.oldPosition.copy(particle.position);
          particle.position.add(velocity);
          particle.position.y += CONFIG.gravity * deltaTime * deltaTime;
        }
      }

      for (let iteration = 0; iteration < CONFIG.iterations; iteration++) {
        for (const string of strings) {
          for (let index = 0; index < string.particles.length - 1; index++) {
            const first = string.particles[index];
            const second = string.particles[index + 1];
            const delta = second.position.clone().sub(first.position);
            const distance = delta.length() || 0.0001;
            const correction = delta.multiplyScalar((distance - CONFIG.beadSpacing) / distance);
            if (!first.pinned && !second.pinned) {
              first.position.addScaledVector(correction, 0.5);
              second.position.addScaledVector(correction, -0.5);
            } else if (!first.pinned) {
              first.position.add(correction);
            } else if (!second.pinned) {
              second.position.sub(correction);
            }
          }
        }
      }
    }

    function syncMeshes() {
      for (const string of strings) {
        const positions = string.wire.geometry.getAttribute("position") as THREE.BufferAttribute;
        for (let index = 0; index < string.particles.length; index++) {
          const particle = string.particles[index];
          if (particle.mesh) {
            particle.mesh.position.copy(particle.position);
            particle.mesh.rotation.y += particle.isBottom ? 0.003 : 0.008;
            particle.mesh.rotation.z += (particle.position.x - particle.oldPosition.x) * 0.018;
          }
          positions.setXYZ(index, particle.position.x, particle.position.y, particle.position.z);
        }
        positions.needsUpdate = true;
      }
    }

    function animate(time: number) {
      const deltaTime = Math.min((time - lastTime) / 1000, 0.032) || 0.016;
      lastTime = time;
      moveAnchors();
      updatePhysics(deltaTime);
      syncMeshes();
      topLight.position.x += ((pointer.hovered ? pointer.normalizedX * 5 : 0) - topLight.position.x) * 0.05;
      topLight.position.y += ((pointer.hovered ? 5 - pointer.normalizedY * 2 : 6) - topLight.position.y) * 0.05;
      cyanLight.position.x += ((pointer.hovered ? 8 + pointer.normalizedX * 3 : 8) - cyanLight.position.x) * 0.05;
      cyanLight.position.y += ((pointer.hovered ? 5 - pointer.normalizedY * 2 : 5) - cyanLight.position.y) * 0.05;
      pinkLight.position.x += ((pointer.hovered ? -8 + pointer.normalizedX * 2 : -8) - pinkLight.position.x) * 0.05;
      sparkles.rotation.y += 0.001;
      sparkles.rotation.x += ((pointer.hovered ? pointer.normalizedY * 0.018 : 0) - sparkles.rotation.x) * 0.04;
      const elapsed = time * 0.001;
      for (const orb of orbLights) {
        const horizontalSpeed = 0.2 + orb.index * 0.047;
        const verticalSpeed = 0.15 + orb.index * 0.039;
        const x = Math.sin(elapsed * horizontalSpeed + orb.phase) * visibleWidth * (0.3 + orb.index * 0.045);
        const y = camera.position.y + Math.cos(elapsed * verticalSpeed + orb.phase * 0.7) * visibleHeight * 0.34;
        const z = 1.05 + Math.sin(elapsed * (0.27 + orb.index * 0.06) + orb.phase) * 0.5;
        orb.light.position.set(x, y, z);
        orb.dot.position.set(x, y, z + 0.08);
        orb.light.intensity = 1.7 + Math.sin(elapsed * 1.4 + orb.phase) * 0.45 + (orb.index === 0 ? 0.55 : 0);
      }
      if (time - lastOrbCssTime > 32 && visibleWidth > 0 && visibleHeight > 0) {
        lastOrbCssTime = time;
        const leadPosition = orbLights[0].light.position;
        const orbX = clamp((leadPosition.x / visibleWidth + 0.5) * 100, 2, 98);
        const viewportTop = camera.position.y + visibleHeight / 2;
        const orbY = clamp(((viewportTop - leadPosition.y) / visibleHeight) * 100, 2, 98);
        entrance!.style.setProperty("--orb-x", `${orbX.toFixed(2)}%`);
        entrance!.style.setProperty("--orb-y", `${orbY.toFixed(2)}%`);
        entrance!.style.setProperty("--orb-glow", (0.62 + Math.sin(elapsed * 1.4 + orbLights[0].phase) * 0.18).toFixed(3));
      }
      renderer.render(scene, camera);
      if (visible && !reducedMotion) animationFrame = window.requestAnimationFrame(animate);
    }

    function updatePointer(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        pointer.hovered = false;
        return;
      }
      const normalized = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      pointer.normalizedX = normalized.x;
      pointer.normalizedY = normalized.y;
      raycaster.setFromCamera(normalized, camera);
      const target = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(interactionPlane, target)) return;
      if (!pointer.hovered) {
        pointer.previousPosition.copy(target);
        pointer.hovered = true;
      }
      pointer.position.copy(target);
    }

    function onPointerMove(event: PointerEvent) {
      updatePointer(event.clientX, event.clientY);
    }

    function onPointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse") enableAudio();
    }

    function onPointerLeave() {
      pointer.hovered = false;
      pointer.normalizedX = 0;
      pointer.normalizedY = 0;
      pointer.position.set(-1000, -1000, 0);
    }

    function renderStatic() {
      moveAnchors();
      syncMeshes();
      renderer.render(scene, camera);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      window.cancelAnimationFrame(animationFrame);
      if (visible && !reducedMotion) {
        lastTime = 0;
        animationFrame = window.requestAnimationFrame(animate);
      } else if (visible) {
        renderStatic();
      }
    });
    visibilityObserver.observe(entrance);
    entrance.addEventListener("pointermove", onPointerMove, { passive: true });
    entrance.addEventListener("pointerdown", onPointerDown, { passive: true });
    entrance.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", renderStatic, { passive: true });
    resize();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      entrance.removeEventListener("pointermove", onPointerMove);
      entrance.removeEventListener("pointerdown", onPointerDown);
      entrance.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", renderStatic);
      clearStrings();
      beadGeometry.dispose();
      dropGeometry.dispose();
      crystalMaterial.dispose();
      crystalAccentMaterial.dispose();
      wireMaterial.dispose();
      sparkleGeometry.dispose();
      sparkleMaterial.dispose();
      sparkleTexture.dispose();
      for (const orb of orbLights) scene.remove(orb.light, orb.dot);
      for (const material of orbMaterials) material.dispose();
      const roofGeometries = new Set<THREE.BufferGeometry>();
      const roofMaterials = new Set<THREE.Material>();
      roofGroup.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        roofGeometries.add(object.geometry);
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) roofMaterials.add(material);
      });
      for (const geometry of roofGeometries) geometry.dispose();
      for (const material of roofMaterials) material.dispose();
      logoTexture.dispose();
      environmentTexture.dispose();
      environmentGenerator.dispose();
      renderer.dispose();
      if (audioContext && audioContext.state !== "closed") void audioContext.close();
    };
  }, [entranceRef]);

  return <canvas aria-hidden="true" className={className} ref={canvasRef} />;
}
