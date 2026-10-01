import * as THREE from "three";
import { clamp01, damp, dampVector, easeInOutCubic } from "./math";

type Pose = { position: THREE.Vector3; target: THREE.Vector3 };

const TRACK_FOV = 52;
const FOCUS_FOV = 44;

/**
 * Dolly track + crane moves. The camera never jumps: scroll moves a target along the track,
 * the actual position chases it with exponential damping, and focus moves blend between the
 * live track pose and a framed facade pose along a raised arc.
 */
export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  readonly track: THREE.CatmullRomCurve3;
  readonly velocity = new THREE.Vector3();

  private progress = 0;
  private progressTarget = 0;
  private readonly look = new THREE.Vector2();
  private readonly lookTarget = new THREE.Vector2();
  private focusBlend = 0;
  private focusDirection: 1 | -1 | 0 = 0;
  private focusDuration = 1.8;
  private readonly focusPose: Pose = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  private readonly trackPose: Pose = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  private readonly smoothed: Pose = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  private readonly previous = new THREE.Vector3();
  private readonly temp = new THREE.Vector3();
  private initialised = false;
  onFocusSettled?: (focused: boolean) => void;

  private readonly endZ: number;

  /** `endZ` is the end wall; the walk is laid out to reach it however many rooms there are. */
  constructor(aspect: number, endZ: number) {
    this.endZ = endZ;
    this.camera = new THREE.PerspectiveCamera(TRACK_FOV, aspect, 0.1, 160);
    // A visitor at eye height: foyer, through the portal, then weaving gently down the nave.
    const points = [new THREE.Vector3(0, 1.75, 25), new THREE.Vector3(0, 1.72, 13)];
    const stop = endZ + 10;
    let side = 1;
    for (let z = 1; z > stop; z -= 13) {
      points.push(new THREE.Vector3(0.7 * side, 1.7, z));
      side = -side;
    }
    points.push(new THREE.Vector3(0, 1.72, stop));
    this.track = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  }

  get trackProgress() {
    return this.progress;
  }

  get isFocused() {
    return this.focusDirection === 1 || this.focusBlend > 0.001;
  }

  /** Signed nudge along the dolly track (scroll, drag, keys). */
  nudge(delta: number) {
    if (this.focusDirection === 1) return;
    this.progressTarget = clamp01(this.progressTarget + delta);
  }

  setProgress(value: number, immediate = false) {
    this.progressTarget = clamp01(value);
    if (immediate) this.progress = this.progressTarget;
  }

  /** Pointer in NDC (-1..1); the head turns a few degrees toward it. */
  setLook(x: number, y: number) {
    this.lookTarget.set(x, y);
  }

  focus(pose: Pose | null, trackT: number | null, reducedMotion: boolean) {
    this.focusDuration = reducedMotion ? 0.001 : 1.9;
    if (pose) {
      this.focusPose.position.copy(pose.position);
      this.focusPose.target.copy(pose.target);
      if (trackT !== null) this.progressTarget = trackT;
      this.focusDirection = 1;
    } else {
      this.focusDirection = -1;
    }
  }

  private sampleTrack(t: number, out: Pose) {
    // The curve throws outside 0..1 (or on NaN), which would skip the frame and flash black.
    t = Number.isFinite(t) ? clamp01(t) : 0;
    this.track.getPointAt(t, out.position);
    this.track.getPointAt(Math.min(1, t + 0.06), out.target);
    if (t > 0.94) {
      // At the end of the street, look at the booth rather than past it.
      out.target.set(0, 2.4, this.endZ);
    }
    // Eye-line slightly up at the start so the gate arch sits in frame, settling to street level.
    out.target.y = THREE.MathUtils.lerp(2.9, 2.2, Math.min(1, t / 0.2));
    return out;
  }

  update(dt: number, reducedMotion: boolean) {
    if (!Number.isFinite(this.progress)) this.progress = this.progressTarget = 0;
    this.progress = reducedMotion ? this.progressTarget : damp(this.progress, this.progressTarget, 2.6, dt);
    this.look.x = damp(this.look.x, this.lookTarget.x, 3, dt);
    this.look.y = damp(this.look.y, this.lookTarget.y, 3, dt);

    this.sampleTrack(this.progress, this.trackPose);

    if (this.focusDirection !== 0) {
      const before = this.focusBlend;
      this.focusBlend = clamp01(this.focusBlend + (this.focusDirection * dt) / this.focusDuration);
      if (this.focusBlend !== before && (this.focusBlend === 1 || this.focusBlend === 0)) {
        const focused = this.focusBlend === 1;
        if (!focused) this.focusDirection = 0;
        this.onFocusSettled?.(focused);
      }
    }

    const blend = easeInOutCubic(this.focusBlend);
    const desiredPosition = this.temp.copy(this.trackPose.position).lerp(this.focusPose.position, blend);
    // A slight rise mid-move, like stepping back to take in the wall.
    desiredPosition.y += Math.sin(blend * Math.PI) * 0.35;
    const desiredTarget = new THREE.Vector3().copy(this.trackPose.target).lerp(this.focusPose.target, blend);

    // Head turn from the pointer, reduced while framed on a building.
    const lookStrength = 1 - blend * 0.75;
    const forward = desiredTarget.clone().sub(desiredPosition).normalize();
    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
    desiredTarget.addScaledVector(right, this.look.x * 1.6 * lookStrength);
    desiredTarget.y += this.look.y * 0.8 * lookStrength;

    if (!this.initialised || reducedMotion) {
      this.smoothed.position.copy(desiredPosition);
      this.smoothed.target.copy(desiredTarget);
      this.initialised = true;
    } else {
      dampVector(this.smoothed.position, desiredPosition, 9, dt);
      dampVector(this.smoothed.target, desiredTarget, 7, dt);
    }

    this.previous.copy(this.camera.position);
    this.camera.position.copy(this.smoothed.position);
    this.camera.lookAt(this.smoothed.target);
    if (dt > 0) this.velocity.copy(this.camera.position).sub(this.previous).divideScalar(dt);

    const fov = THREE.MathUtils.lerp(TRACK_FOV, FOCUS_FOV, blend);
    if (Math.abs(fov - this.camera.fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }

  resize(aspect: number) {
    this.camera.aspect = aspect;
    // Portrait screens need a wider lens to keep facades in frame.
    this.camera.zoom = aspect < 1 ? Math.max(0.62, aspect) : 1;
    this.camera.updateProjectionMatrix();
  }
}
