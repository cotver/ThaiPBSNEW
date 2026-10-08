import * as THREE from "three";
import { clamp01, damp, dampVector, easeInOutCubic } from "./math";

type Pose = { position: THREE.Vector3; target: THREE.Vector3 };

const TRACK_FOV = 52;
/** How fast the walking glance turns toward a room, and (slower) back to the hall. */
const GAZE_EASE_IN = 4;
const GAZE_EASE_OUT = 1.1;
/**
 * How fast the previous room's leftover glance clears after the hand-over to the next room —
 * quick enough that it never holds back the turn toward the room ahead.
 */
const GAZE_HANDOVER_FADE = 2.2;
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
  /** Where the walking camera's attention is pulled (a room's work), and how strongly (0..1). */
  private readonly gaze = new THREE.Vector3();
  private gazeWeight = 0;
  private gazeWeightTarget = 0;
  private hasGaze = false;
  /** The previous room's glance, easing out on its own after the hand-over to the next room. */
  private readonly fadingGaze = new THREE.Vector3();
  private fadingWeight = 0;
  private readonly gazeOffset = new THREE.Vector3();
  private initialised = false;
  onFocusSettled?: (focused: boolean) => void;

  private readonly endZ: number;

  /** `endZ` is the end wall; the walk is laid out to reach it however many rooms there are. */
  constructor(aspect: number, endZ: number) {
    this.endZ = endZ;
    // Far plane out past the hills and the sky dome outside the glass (see Nature, Environment).
    this.camera = new THREE.PerspectiveCamera(TRACK_FOV, aspect, 0.1, 2000);
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

  /**
   * While walking, turn the head toward an approaching room instead of always staring down the hall.
   * `weight` 0..1 is how far to turn (the rig eases toward it); pass null to look straight ahead.
   */
  setGaze(point: THREE.Vector3 | null, weight: number) {
    if (point && (!this.hasGaze || point.distanceToSquared(this.gaze) > 0.01)) {
      // A new room: let the current glance ease out by itself instead of jumping to the new point.
      if (this.hasGaze && this.gazeWeight > this.fadingWeight) {
        this.fadingGaze.copy(this.gaze);
        this.fadingWeight = this.gazeWeight;
      }
      this.gaze.copy(point);
      this.gazeWeight = 0;
      this.hasGaze = true;
    }
    this.gazeWeightTarget = point ? clamp01(weight) : 0;
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
    this.look.x = damp(this.look.x, this.lookTarget.x, 3, dt);
    this.look.y = damp(this.look.y, this.lookTarget.y, 3, dt);

    this.sampleTrack(this.progress, this.trackPose);
    // Lead the eye into the room you are approaching; eased so it never snaps.
    // Turning toward a room keeps its pace; turning back to the hall is eased about three times slower,
    // so passing a room glides the head back to centre instead of snapping it.
    const easing = this.gazeWeightTarget > this.gazeWeight ? GAZE_EASE_IN : GAZE_EASE_OUT;
    this.gazeWeight = reducedMotion ? this.gazeWeightTarget : damp(this.gazeWeight, this.gazeWeightTarget, easing, dt);
    this.fadingWeight = reducedMotion ? 0 : damp(this.fadingWeight, 0, GAZE_HANDOVER_FADE, dt);
    const base = this.gazeOffset.copy(this.trackPose.target);
    if (this.gazeWeight > 0.001) this.trackPose.target.addScaledVector(this.gaze.clone().sub(base), this.gazeWeight);
    if (this.fadingWeight > 0.001) this.trackPose.target.addScaledVector(this.fadingGaze.clone().sub(base), this.fadingWeight);

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

    // Head turn from the pointer; none once framed on a room, so the wall stays square-on.
    const lookStrength = 1 - blend;
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
