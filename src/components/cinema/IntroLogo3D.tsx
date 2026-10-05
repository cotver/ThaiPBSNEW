"use client";

import { useEffect, useRef } from "react";

/** Where the rounded logo tile sits inside /LOGO/Logo.png (fractions of the image, v measured from the bottom). */
const logoTile = { u0: 0.2568, u1: 0.745, v0: 0.2523, v1: 0.7432 };
const flyInMs = 1500;
const minFlyInMs = 900;
const flyInEndMs = 2050;
const dustCount = 220;

/**
 * The Thai PBS Parvilions logo as a gold-edged 3D tile that spins in from the dark and settles facing the
 * viewer, with a light glinting across it and dust drifting past. three.js is loaded only when the intro
 * plays. Calls onReady once the first frame is drawn, or onFail if WebGL or the logo can't load.
 */
export function IntroLogo3D({ onFail, onReady }: { onFail: () => void; onReady: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Mounted with the intro, which marks <html> before this runs; skipped visits never load three.js.
    if (!canvas || !document.documentElement.hasAttribute("data-intro-playing")) return;
    const startedAt = performance.now();
    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    (async () => {
      try {
        const THREE = await import("three");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        const texture = await new THREE.TextureLoader().loadAsync("/LOGO/Logo.png");
        if (disposed) {
          texture.dispose();
          return;
        }

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        // Neutral keeps the logo's black and orange true; ACES greys and desaturates them.
        renderer.toneMapping = THREE.NeutralToneMapping;
        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = environment;
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        camera.position.set(0, 0, 5.5);

        // A rounded tile, extruded with a bevel so its gold rim catches the light.
        const shape = new THREE.Shape();
        const radius = 0.42;
        shape.moveTo(-1 + radius, -1);
        shape.lineTo(1 - radius, -1);
        shape.quadraticCurveTo(1, -1, 1, -1 + radius);
        shape.lineTo(1, 1 - radius);
        shape.quadraticCurveTo(1, 1, 1 - radius, 1);
        shape.lineTo(-1 + radius, 1);
        shape.quadraticCurveTo(-1, 1, -1, 1 - radius);
        shape.lineTo(-1, -1 + radius);
        shape.quadraticCurveTo(-1, -1, -1 + radius, -1);
        const geometry = new THREE.ExtrudeGeometry(shape, {
          bevelEnabled: true,
          bevelSegments: 8,
          bevelSize: 0.05,
          bevelThickness: 0.07,
          curveSegments: 28,
          depth: 0.22,
        });
        geometry.center();

        // Cap UVs are the shape's own -1..1 coordinates; map them onto the tile inside the image.
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const halfWidth = (logoTile.u1 - logoTile.u0) / 2;
        const halfHeight = (logoTile.v1 - logoTile.v0) / 2;
        texture.repeat.set(halfWidth, halfHeight);
        texture.offset.set(logoTile.u0 + halfWidth, logoTile.v0 + halfHeight);
        // The printed face shows the logo exactly as drawn (unlit, no tone mapping); the gold rim does the shining.
        const face = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
        const rim = new THREE.MeshStandardMaterial({ color: 0xc8924f, metalness: 0.92, roughness: 0.26 });
        const tile = new THREE.Mesh(geometry, [face, rim]);
        scene.add(tile);

        const glint = new THREE.PointLight(0xffd2a8, 0, 9, 1.4);
        glint.position.set(-3, 1.2, 2.2);
        scene.add(glint);
        scene.add(new THREE.AmbientLight(0xffffff, 0.35));

        // Dust motes drifting toward the camera.
        const positions = new Float32Array(dustCount * 3);
        for (let index = 0; index < dustCount; index++) {
          positions[index * 3] = (Math.random() - 0.5) * 9;
          positions[index * 3 + 1] = (Math.random() - 0.5) * 6;
          positions[index * 3 + 2] = -Math.random() * 12;
        }
        const dustGeometry = new THREE.BufferGeometry();
        dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const dustMaterial = new THREE.PointsMaterial({
          blending: THREE.AdditiveBlending,
          color: 0xffc89a,
          depthWrite: false,
          opacity: 0.55,
          size: 0.035,
          transparent: true,
        });
        const dust = new THREE.Points(dustGeometry, dustMaterial);
        scene.add(dust);

        const resize = () => {
          const { clientHeight, clientWidth } = canvas;
          renderer.setSize(clientWidth, clientHeight, false);
          camera.aspect = clientWidth / Math.max(clientHeight, 1);
          camera.updateProjectionMatrix();
        };
        resize();
        window.addEventListener("resize", resize);

        // Fly in over whatever is left of the intro's hold, so a slow load still lands before the reveal.
        const begin = performance.now();
        const duration = Math.max(minFlyInMs, Math.min(flyInMs, flyInEndMs - (begin - startedAt)));
        const easeOut = (value: number) => 1 - Math.pow(1 - value, 4);
        let readySent = false;

        const render = (now: number) => {
          frame = requestAnimationFrame(render);
          const elapsed = now - begin;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOut(progress);
          tile.position.z = -11 * (1 - eased);
          tile.rotation.y = -Math.PI * 3 * (1 - eased) + Math.sin(elapsed / 900) * 0.06 * eased;
          tile.rotation.x = 0.55 * (1 - eased) + Math.sin(elapsed / 1300) * 0.03 * eased;
          tile.scale.setScalar(0.45 + 0.55 * eased);
          // Once it lands, a warm light glints across the rim from left to right.
          const glintProgress = Math.min(Math.max((elapsed - duration * 0.75) / 1100, 0), 1);
          glint.intensity = Math.sin(glintProgress * Math.PI) * 26;
          glint.position.x = -3 + glintProgress * 6;
          const drift = dustGeometry.attributes.position as InstanceType<typeof THREE.BufferAttribute>;
          for (let index = 0; index < dustCount; index++) {
            let z = drift.getZ(index) + 0.025;
            if (z > 4) z = -12;
            drift.setZ(index, z);
          }
          drift.needsUpdate = true;
          renderer.render(scene, camera);
          if (!readySent) {
            readySent = true;
            onReady();
          }
        };
        frame = requestAnimationFrame(render);

        cleanup = () => {
          window.removeEventListener("resize", resize);
          geometry.dispose();
          dustGeometry.dispose();
          dustMaterial.dispose();
          face.dispose();
          rim.dispose();
          texture.dispose();
          environment.dispose();
          pmrem.dispose();
          renderer.dispose();
        };
      } catch {
        if (!disposed) onFail();
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanup();
    };
    // Runs once per mount; the callbacks only report back to the intro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas aria-hidden="true" className="cine-intro__logo3d" ref={canvasRef} />;
}
