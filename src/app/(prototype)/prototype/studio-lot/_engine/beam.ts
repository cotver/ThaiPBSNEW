import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uLength;
  varying float vAlong;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  void main() {
    vAlong = 1.0 + position.y / uLength;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlong;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  void main() {
    // pow() of a negative is NaN in GLSL; with bloom one NaN pixel blurs into a black frame.
    float facing = clamp(1.0 - abs(dot(normalize(vNormalView), normalize(vViewDir))), 0.0, 1.0);
    float along = clamp(vAlong, 0.0, 1.0);
    float alpha = pow(along, 1.6) * (1.0 - pow(facing, 1.4)) * uOpacity;
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;

/**
 * A soft visible light cone with its apex at `from`, opening toward `to`.
 * Brightest at the fixture, fading toward the lit surface — like haze in a gallery spot.
 */
export function lightCone(from: THREE.Vector3, to: THREE.Vector3, radius: number, colour: string, opacity: number) {
  const length = from.distanceTo(to);
  const geometry = new THREE.ConeGeometry(radius, length, 28, 1, true);
  geometry.translate(0, -length / 2, 0);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uLength: { value: length }, uColor: { value: new THREE.Color(colour) }, uOpacity: { value: opacity } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(from);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize());
  mesh.raycast = () => {};
  return { mesh, material };
}
