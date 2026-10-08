import * as THREE from "three";
import { clamp01, damp, dampVector, easeInOutCubic } from "./math";

type Pose = { position: THREE.Vector3; target: THREE.Vector3 };

const TRACK_FOV = 52;
/** Free look while walking: at most 55° either way (never back down the hall), and a nod up or down. */
const MAX_YAW = THREE.MathUtils.degToRad(55);
const MAX_PITCH = THREE.MathUtils.degToRad(35);
/** How quickly the head follows a drag or a key turn. */
const LOOK_EASE = 8;
/**
 * Lens when framed on a room. The camera faces the wall square-on, so a wider lens adds no skew —
 * it just fits the whole wall (title, work, label) beside the panel within the ~15m nave.
 * 60° is the narrowest that does so at common laptop sizes (1280–1440 wide).
 */
export const FOCUS_FOV = 60;

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
  /** Head turn while walking, in radians: x = yaw (right +), y = pitch (up +). 0, 0 faces straight down the hall. */
  private readonly look = new THREE.Vector2();
  private readonly lookTarget = new THREE.Vector2();
  private readonly lookDirection = new THREE.Vector3();
  private readonly lookRight = new THREE.Vector3();
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
    // Far plane out past the hills and the sky dome outside the glass (see Nature, Environment).
    this.camera = new THREE.PerspectiveCamera(TRACK_FOV, aspect, 0.1, 2000);
    // A visitor at eye height: foyer, through the portal, then straight down the middle of the nave —
    // no weave, so walking never turns the view; only the visitor's own look does (setLook, turn).
    const points = [new THREE.Vector3(0, 1.75, 25), new THREE.Vector3(0, 1.72, 13)];
    const stop = endZ + 10;
    for (let z = 1; z > stop; z -= 13) points.push(new THREE.Vector3(0, 1.7, z));
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

  /**
   * Look toward the mouse: `x`, `y` are the pointer in NDC (-1..1). The centre of the screen faces straight
   * down the hall; the left or right edge turns the full MAX_YAW (55°) toward that wall, never further;
   * the top or bottom edge nods up or down. Ignored while framed on a room.
   */
  setLook(x: number, y: number) {
    if (this.focusDirection === 1) return;
    this.lookTarget.set(THREE.MathUtils.clamp(x, -1, 1) * MAX_YAW, THREE.MathUtils.clamp(y, -1, 1) * MAX_PITCH);
  }

  /**
   * Turn the head by (yaw, pitch) radians — a touch swipe, where there is no mouse to follow. Free, but held within MAX_YAW (55°)
   * left or right of the walk, so you can look at the walls but never turn round. Ignored while framed on a room.
   */
  turn(yaw: number, pitch = 0) {
    if (this.focusDirection === 1) return;
    this.lookTarget.x = THREE.MathUtils.clamp(this.lookTarget.x + yaw, -MAX_YAW, MAX_YAW);
    this.lookTarget.y = THREE.MathUtils.clamp(this.lookTarget.y + pitch, -MAX_PITCH, MAX_PITCH);
  }

  /** Face straight down the hall again. */
  resetLook() {
    this.lookTarget.set(0, 0);
  }

  focus(pose: Pose | null, trackT: number | null, reducedMotion: boolean) {
    this.focusDuration = reducedMotion ? 0.001 : 1.9;
    if (pose) {
      this.focusPose.position.copy(pose.position);
      this.focusPose.target.copy(pose.target);
      if (trackT !== null) this.progressTarget = trackT;
      this.focusDirection = 1;
      // Stepping back out of the room, you face down the hall again.
      this.resetLook();
    } else {
      this.focusDirection = -1;
    }
  }

  /** Re-aim a focused (or focusing) camera without restarting the move — e.g. after a resize. */
  retarget(pose: Pose) {
    this.focusPose.position.copy(pose.position);
    this.focusPose.target.copy(pose.target);
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
    this.look.x = reducedMotion ? this.lookTarget.x : damp(this.look.x, this.lookTarget.x, LOOK_EASE, dt);
    this.look.y = reducedMotion ? this.lookTarget.y : damp(this.look.y, this.lookTarget.y, LOOK_EASE, dt);

    // Facing straight down the hall, along the walk, unless the visitor turns their head (see turn()).
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

    // The visitor's head turn, swung around the eye: yaw about the vertical, then pitch about the
    // sideways axis. None once framed on a room, so the wall stays square-on.
    const lookStrength = 1 - blend;
    if (lookStrength > 0.001 && (this.look.x !== 0 || this.look.y !== 0)) {
      const toTarget = desiredTarget.sub(desiredPosition);
      const distance = toTarget.length();
      const direction = this.lookDirection.copy(toTarget).normalize();
      direction.applyAxisAngle(this.camera.up, -this.look.x * lookStrength);
      const right = this.lookRight.crossVectors(direction, this.camera.up).normalize();
      direction.applyAxisAngle(right, this.look.y * lookStrength);
      desiredTarget.copy(desiredPosition).addScaledVector(direction, distance);
    }

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
