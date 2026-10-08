import * as THREE from "three";
import type { Conditions } from "./engine/Environment";
import { onSoundChange, onVolumeChange, soundEnabled, soundVolume } from "./sound";

/** A place in the world a sound can come from (metres, the gallery's own coordinates). */
export type SoundPoint = { x: number; y: number; z: number };

/**
 * Where the soundscape's sources are, taken from the land outside (see Nature.soundMap): trees and
 * meadows for birds and gusts, the water's edge for frogs and lapping, the owl's tree, the cicadas' patches
 * of wood, and the hall's glass (for the gecko).
 */
export type SoundMap = {
  trees: SoundPoint[];
  meadows: SoundPoint[];
  water: SoundPoint[];
  lake: SoundPoint;
  owl: SoundPoint;
  cicadas: SoundPoint[];
  glass: { halfWidth: number; front: number; back: number };
};

/** One gust through the trees (see Ambience.rustle): bands of noise, and how they swell, flutter and move. */
type Gust = {
  bands: { frequency: number; q: number; gain: number }[];
  duration: number;
  /** Fraction of the gust (or of each half, for two swells) spent building up. */
  attack: number;
  swells: 1 | 2;
  /** Leaf-flutter rate in Hz (0 for none). */
  flutter: number;
  /** How many dry leaf clicks. */
  crackle: number;
  /** 1: rolls past rather than staying put. */
  sweep: number;
  peak: number;
};

/**
 * Sounds placed in the world are quieter with distance (full within ~10m, a third at 30m), so they are
 * played this much louder at the source to come through at a natural level.
 */
const NEAR = 3;

/**
 * A short, soft echo like a large gallery's: two seconds of decaying noise, slightly different in each ear.
 */
function hallEcho(context: AudioContext) {
  const length = Math.floor(context.sampleRate * 2);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  }
  return impulse;
}

/**
 * The gallery's ambient soundscape, following the world outside: wind always, gusting through the
 * trees now and then; birdsong and the odd koel call by day; cicadas, frogs, an owl and a tokay gecko at
 * night; water lapping at the lake; rain and distant thunder in the wet; and a soft room tone. The
 * occasional sounds are spaced well apart, so the place feels alive without getting busy.
 *
 * Sounds come from where they happen: walk toward the lake and its frogs and lapping grow louder; pass a
 * patch of wood and its cicadas swell then fade; the owl calls from its tree beyond the far glass. Like the
 * interaction cues (see sound.ts) it is synthesised, so no audio ships, and it only plays once the viewer
 * has turned sound on.
 */
export class Ambience {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  /**
   * Everything from outdoors goes through here: muffled as if heard through the glass, with a little of
   * the hall's echo, so it sounds like it comes from outside while the visitor is in the room.
   */
  private outside: AudioNode | null = null;
  private rain: GainNode | null = null;
  /** The cicada patches' shared level, as a control signal (each patch is its own placed source). */
  private cicadas: ConstantSourceNode | null = null;
  private wind: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private map: SoundMap | null = null;
  private loopsBuilt = false;
  /** Where the visitor is (the listener), updated every frame. */
  private readonly listener = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  /** Seconds until each occasional sound may play again. */
  private readonly timers = { rustle: 12, koel: 25, owl: 15, gecko: 40, thunder: 20 };
  private enabled = soundEnabled();
  private volume = soundVolume();
  private readonly unsubscribeVolume: () => void;
  private birdTimer = 4;
  /** Hushed while the visitor is looking at a room's content (see update). */
  private quiet = false;
  private frogTimer = 4;
  /**
   * The night insects sing in spells, not all night: a chorus of 10–20s, then 45–90s of quiet.
   * `chorus` is whether one is on, `chorusTimer` how long until it switches.
   */
  private chorus = false;
  private chorusTimer = 20;
  private readonly unsubscribe: () => void;
  private readonly resume = () => void this.context?.resume();

  constructor() {
    this.unsubscribe = onSoundChange((enabled) => {
      this.enabled = enabled;
      if (enabled) this.start();
      this.fade(enabled && !this.quiet ? 1 : 0);
    });
    this.unsubscribeVolume = onVolumeChange((volume) => {
      this.volume = volume;
      this.fade(this.enabled && !this.quiet ? 1 : 0);
    });
    if (this.enabled) this.start();
  }

  /** Where the sources are (call once the land outside is built). */
  setSoundMap(map: SoundMap) {
    this.map = map;
    this.buildLoops();
  }

  /**
   * Call every frame with the conditions outside and the camera (the listener). `quiet`: the visitor is
   * focused on a room's content, so the soundscape fades away until they step back.
   */
  update(dt: number, conditions: Conditions, quiet: boolean, camera: THREE.Camera) {
    const context = this.context;
    if (!this.enabled || !context || context.state !== "running" || !this.rain || !this.cicadas) return;
    this.hear(camera);
    if (quiet !== this.quiet) {
      this.quiet = quiet;
      this.fade(quiet ? 0 : 1);
    }
    if (quiet) return;
    const { day, night, rain, wind } = conditions;
    const now = context.currentTime;
    this.rain.gain.setTargetAtTime(rain * 0.06, now, 0.8);
    this.chorusTimer -= dt;
    if (this.chorusTimer <= 0) {
      this.chorus = !this.chorus;
      this.chorusTimer = this.chorus ? 10 + Math.random() * 10 : 45 + Math.random() * 45;
    }
    // Swelling in and dying away slowly, never switching abruptly.
    this.cicadas.offset.setTargetAtTime(this.chorus ? night * (1 - rain) * 0.03 * NEAR : 0, now, 2.5);
    // Wind: a steady bed that breathes in slow gusts, stronger on a windy day.
    const breath = 0.6 + 0.4 * Math.sin(now * 0.21) * Math.sin(now * 0.067 + 1.3);
    this.wind?.gain.setTargetAtTime((0.012 + wind * 0.05) * breath, now, 1.2);

    const t = this.timers;
    for (const key of Object.keys(t) as (keyof typeof t)[]) t[key] -= dt;
    // A gust through the trees: more often the windier it is.
    if (t.rustle <= 0) {
      t.rustle = (20 + Math.random() * 20) / (0.6 + wind);
      this.rustle(0.5 + wind);
    }
    // The koel's rising "ka-wao", from somewhere in the trees, by day.
    if (t.koel <= 0) {
      t.koel = 40 + Math.random() * 40;
      if (day * (1 - rain) > 0.4) this.koel(day);
    }
    // After dark: the owl in its tree, and now and then a tokay gecko on the glass.
    if (t.owl <= 0) {
      t.owl = 30 + Math.random() * 30;
      if (night > 0.6) this.hoot(night);
    }
    if (t.gecko <= 0) {
      t.gecko = 60 + Math.random() * 60;
      if (night > 0.6) this.gecko(night);
    }
    // Distant thunder in heavy rain.
    if (t.thunder <= 0) {
      t.thunder = 25 + Math.random() * 20;
      if (rain > 0.7) this.thunder(rain);
    }

    // Birdsong: an occasional little phrase of rising chirps, in fair daylight.
    const birds = day * (1 - rain);
    this.birdTimer -= dt;
    if (this.birdTimer <= 0) {
      this.birdTimer = 6 + Math.random() * 9;
      if (birds > 0.3) this.chirp(birds);
    }
    // Frogs croak at the water's edge after dark, more in the wet.
    this.frogTimer -= dt;
    if (this.frogTimer <= 0) {
      this.frogTimer = 3 + Math.random() * 5;
      if (night > 0.5) this.croak(night * (0.6 + rain * 0.6));
    }
  }

  dispose() {
    this.unsubscribe();
    this.unsubscribeVolume();
    window.removeEventListener("pointerdown", this.resume);
    void this.context?.close();
    this.context = null;
  }

  private start() {
    if (this.context) return;
    try {
      const context = new AudioContext();
      this.context = context;
      // Browsers keep audio paused until the visitor interacts; pick it up on their next click.
      if (context.state === "suspended") window.addEventListener("pointerdown", this.resume);
      this.master = context.createGain();
      this.master.gain.value = 0;
      // A gentle limiter, so the louder end of the volume slider never clips.
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.knee.value = 6;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.25;
      this.master.connect(limiter).connect(context.destination);

      // Through the glass: highs and sharp onsets softened, plus some of the hall's echo.
      const glass = context.createBiquadFilter();
      glass.type = "lowpass";
      glass.frequency.value = 1700;
      glass.Q.value = 0.5;
      const pane = context.createGain();
      pane.gain.value = 1.6;
      glass.connect(pane).connect(this.master);
      const echo = context.createConvolver();
      echo.buffer = hallEcho(context);
      const wet = context.createGain();
      wet.gain.value = 0.6;
      glass.connect(echo).connect(wet).connect(this.master);
      this.outside = glass;

      const noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
      this.noise = noise;
      // Room tone: a low, steady hush.
      this.loop("lowpass", 260, 0.7, 0.02).connect(this.master);
      // Wind and rain are all around, not from one place.
      this.wind = this.loop("lowpass", 520, 0.6, 0);
      this.wind.connect(glass);
      this.rain = this.loop("bandpass", 1800, 0.5, 0);
      this.rain.connect(glass);
      this.cicadas = context.createConstantSource();
      this.cicadas.offset.value = 0;
      this.cicadas.start();
      this.buildLoops();
      this.fade(1);
    } catch {
      // Audio is decoration; never let it break the gallery.
      this.context = null;
    }
  }

  /** A looping band of noise at a fixed level, started now. */
  private loop(filter: BiquadFilterType, frequency: number, q: number, level: number) {
    const context = this.context!;
    const player = context.createBufferSource();
    player.buffer = this.noise;
    player.loop = true;
    const shape = context.createBiquadFilter();
    shape.type = filter;
    shape.frequency.value = frequency;
    shape.Q.value = q;
    const gain = context.createGain();
    gain.gain.value = level;
    player.connect(shape).connect(gain);
    player.start(0, Math.random() * 2);
    return gain;
  }

  /**
   * The sources that sound all the time from one place: each patch of cicadas (a high buzz pulsed by a
   * fast tremolo, each at its own rate) and the water lapping at the lake's near shore.
   */
  private buildLoops() {
    const context = this.context;
    const map = this.map;
    if (!context || !map || !this.cicadas || this.loopsBuilt) return;
    this.loopsBuilt = true;
    for (const point of map.cicadas) {
      // Each patch hums at its own pitch, pulsed at its own tremolo rate.
      const tremolo = context.createGain();
      tremolo.gain.value = 0.5;
      const lfo = context.createOscillator();
      lfo.frequency.value = 32 + Math.random() * 12;
      const depth = context.createGain();
      depth.gain.value = 0.5;
      lfo.connect(depth).connect(tremolo.gain);
      lfo.start();
      // Its loudness follows the shared cicada level (night, dry).
      const level = context.createGain();
      level.gain.value = 0;
      this.cicadas.connect(level.gain);
      this.loop("bandpass", 4600 + Math.random() * 1400, 8, 1).connect(tremolo).connect(level).connect(this.place(point));
    }
    // Water: a soft, slow wash at the lake's edge, rising and falling like small waves.
    const water = this.loop("lowpass", 420, 0.7, 0.04 * NEAR);
    const waves = context.createGain();
    waves.gain.value = 0.6;
    const swell = context.createOscillator();
    swell.frequency.value = 0.18;
    const swellDepth = context.createGain();
    swellDepth.gain.value = 0.4;
    swell.connect(swellDepth).connect(waves.gain);
    swell.start();
    water.connect(waves).connect(this.place(map.lake));
  }

  /** Move the listener with the camera, so near things are loud and far things quiet. */
  private hear(camera: THREE.Camera) {
    const listener = this.context?.listener;
    if (!listener) return;
    camera.getWorldPosition(this.listener);
    camera.getWorldDirection(this.forward);
    const { x, y, z } = this.listener;
    const f = this.forward;
    if (listener.positionX) {
      const now = this.context!.currentTime;
      listener.positionX.setTargetAtTime(x, now, 0.05);
      listener.positionY.setTargetAtTime(y, now, 0.05);
      listener.positionZ.setTargetAtTime(z, now, 0.05);
      listener.forwardX.setTargetAtTime(f.x, now, 0.05);
      listener.forwardY.setTargetAtTime(f.y, now, 0.05);
      listener.forwardZ.setTargetAtTime(f.z, now, 0.05);
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    } else {
      // Older Firefox: the deprecated setters.
      listener.setPosition(x, y, z);
      listener.setOrientation(f.x, f.y, f.z, 0, 1, 0);
    }
  }

  /** A source at a place in the world, heard through the glass: louder close to, quieter far off. */
  private place(point: SoundPoint) {
    const context = this.context!;
    const panner = new PannerNode(context, {
      panningModel: "HRTF",
      distanceModel: "inverse",
      refDistance: 10,
      rolloffFactor: 1,
      maxDistance: 600,
      positionX: point.x,
      positionY: point.y,
      positionZ: point.z,
    });
    panner.connect(this.outside!);
    return panner;
  }

  /** One of `points`, preferring those within `radius` of the visitor (any, if none are that close). */
  private near(points: SoundPoint[], radius: number) {
    if (!points.length) return null;
    const close = points.filter((p) => Math.hypot(p.x - this.listener.x, p.z - this.listener.z) < radius);
    const pool = close.length ? close : points;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /** Fade the whole soundscape toward `to` (0 or 1), at the viewer's volume. */
  private fade(to: number) {
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(to * this.volume * 3.8, this.context.currentTime, 0.6);
  }

  /** A source for one sound: at `point` if there is one, else somewhere off to the left or right. */
  private spot(point?: SoundPoint | null) {
    const context = this.context;
    if (!context || !this.outside) return null;
    if (point) return this.place(point);
    const panner = context.createStereoPanner();
    panner.pan.value = (Math.random() * 2 - 1) * 0.8;
    panner.connect(this.outside);
    return panner;
  }

  /** A little phrase of rising chirps, from a tree or meadow near the visitor. */
  private chirp(level: number) {
    const context = this.context;
    const map = this.map;
    const out = this.spot(map ? this.near([...map.trees, ...map.meadows], 45) : null);
    if (!context || !out) return;
    const notes = 2 + Math.floor(Math.random() * 3);
    const base = 2200 + Math.random() * 1400;
    for (let i = 0; i < notes; i += 1) {
      const start = context.currentTime + i * (0.09 + Math.random() * 0.05);
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(base, start);
      osc.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), start + 0.07);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.012 * level * NEAR, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);
      osc.connect(gain).connect(out);
      osc.start(start);
      osc.stop(start + 0.1);
    }
  }

  /** A low rumble rolling in from far off (all around, not from one place). */
  private thunder(level: number) {
    const context = this.context;
    const out = this.spot();
    if (!context || !out || !this.noise) return;
    const start = context.currentTime;
    const player = context.createBufferSource();
    player.buffer = this.noise;
    player.loop = true;
    const shape = context.createBiquadFilter();
    shape.type = "lowpass";
    shape.frequency.value = 140;
    shape.Q.value = 0.8;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.09 * level, start + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 4.4);
    player.connect(shape).connect(gain).connect(out);
    player.start(start, Math.random());
    player.stop(start + 4.5);
  }

  /**
   * A gust through the trees, picked from eight kinds and varied every time, so no two sound alike: a
   * soft breeze in broadleaf trees, a sharp gust, a long whoosh through pines, fluttering leaves, a gust
   * rolling past, a double gust, dry crackly leaves, and a distant treeline.
   */
  private rustle(level: number) {
    const vary = (value: number, amount = 0.25) => value * (1 + (Math.random() * 2 - 1) * amount);
    const kinds: Gust[] = [
      { bands: [{ frequency: 1800, q: 0.6, gain: 1 }], duration: 5, attack: 0.45, swells: 1, flutter: 0, crackle: 0, sweep: 0, peak: 0.022 },
      { bands: [{ frequency: 3400, q: 0.8, gain: 1 }, { frequency: 6200, q: 1, gain: 0.4 }], duration: 2.4, attack: 0.15, swells: 1, flutter: 0, crackle: 0, sweep: 0, peak: 0.032 },
      { bands: [{ frequency: 900, q: 0.5, gain: 1 }, { frequency: 6500, q: 0.9, gain: 0.35 }], duration: 6.5, attack: 0.4, swells: 1, flutter: 0, crackle: 0, sweep: 0, peak: 0.026 },
      { bands: [{ frequency: 3000, q: 1.2, gain: 1 }], duration: 3, attack: 0.3, swells: 1, flutter: 12, crackle: 0, sweep: 0, peak: 0.026 },
      { bands: [{ frequency: 2400, q: 0.7, gain: 1 }, { frequency: 4800, q: 1, gain: 0.5 }], duration: 4.2, attack: 0.4, swells: 1, flutter: 0, crackle: 0, sweep: 1, peak: 0.028 },
      { bands: [{ frequency: 2600, q: 0.7, gain: 1 }], duration: 5, attack: 0.3, swells: 2, flutter: 5, crackle: 0, sweep: 0, peak: 0.026 },
      { bands: [{ frequency: 4200, q: 0.9, gain: 1 }], duration: 3.2, attack: 0.3, swells: 1, flutter: 0, crackle: 14, sweep: 0, peak: 0.02 },
      { bands: [{ frequency: 1200, q: 0.5, gain: 1 }], duration: 7, attack: 0.5, swells: 1, flutter: 0, crackle: 0, sweep: 0, peak: 0.012 },
    ];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    this.gust({
      ...kind,
      bands: kind.bands.map((band) => ({ ...band, frequency: vary(band.frequency, 0.3) })),
      duration: vary(kind.duration),
      attack: vary(kind.attack),
      flutter: kind.flutter ? vary(kind.flutter) : 0,
      crackle: Math.round(vary(kind.crackle, 0.4)),
      peak: vary(kind.peak, 0.2) * level * NEAR,
    });
  }

  /**
   * Play one gust, in a tree near the visitor: bands of noise swelling and fading, with flutter, crackle
   * and (for a rolling gust) the sound travelling past along the treeline.
   */
  private gust(gust: Gust) {
    const context = this.context;
    if (!context || !this.outside || !this.noise) return;
    const start = context.currentTime;
    const end = start + gust.duration;
    const tree = this.map ? this.near(this.map.trees, 40) : null;
    const source = this.spot(tree);
    if (!source) return;
    if (tree && gust.sweep && source instanceof PannerNode) {
      const along = Math.random() > 0.5 ? 1 : -1;
      source.positionZ.setValueAtTime(tree.z - along * 15, start);
      source.positionZ.linearRampToValueAtTime(tree.z + along * 15, end);
    }

    // The envelope: one swell, or two with a lull between.
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    if (gust.swells === 2) {
      const half = gust.duration / 2;
      envelope.gain.exponentialRampToValueAtTime(gust.peak * 0.8, start + gust.attack * half);
      envelope.gain.exponentialRampToValueAtTime(gust.peak * 0.25, start + half);
      envelope.gain.exponentialRampToValueAtTime(gust.peak, start + half + gust.attack * half);
    } else {
      envelope.gain.exponentialRampToValueAtTime(gust.peak, start + gust.attack * gust.duration);
    }
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);

    // Flutter: leaves trembling, as a fast wobble in loudness.
    let into: AudioNode = envelope;
    if (gust.flutter) {
      const wobble = context.createGain();
      wobble.gain.value = 0.65;
      const lfo = context.createOscillator();
      lfo.frequency.value = gust.flutter;
      const depth = context.createGain();
      depth.gain.value = 0.35;
      lfo.connect(depth).connect(wobble.gain);
      lfo.start(start);
      lfo.stop(end + 0.1);
      envelope.connect(wobble);
      into = wobble;
    }
    into.connect(source);

    for (const band of gust.bands) {
      const player = context.createBufferSource();
      player.buffer = this.noise;
      player.loop = true;
      const shape = context.createBiquadFilter();
      shape.type = "bandpass";
      shape.Q.value = band.q;
      // The pitch of the rustle drifts up as the gust builds, and settles as it passes.
      shape.frequency.setValueAtTime(band.frequency * 0.8, start);
      shape.frequency.linearRampToValueAtTime(band.frequency * 1.2, start + gust.duration * 0.45);
      shape.frequency.linearRampToValueAtTime(band.frequency * 0.9, end);
      const gain = context.createGain();
      gain.gain.value = band.gain;
      player.connect(shape).connect(gain).connect(envelope);
      player.start(start, Math.random());
      player.stop(end + 0.1);
    }

    // Crackle: tiny dry clicks of leaves knocking together, scattered through the gust.
    for (let i = 0; i < gust.crackle; i += 1) {
      const at = start + gust.duration * (0.15 + Math.random() * 0.7);
      const click = context.createBufferSource();
      click.buffer = this.noise;
      const shape = context.createBiquadFilter();
      shape.type = "highpass";
      shape.frequency.value = 3500 + Math.random() * 3000;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(gust.peak * (0.6 + Math.random() * 0.8), at + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.02 + Math.random() * 0.03);
      click.connect(shape).connect(gain).connect(source);
      click.start(at, Math.random());
      click.stop(at + 0.06);
    }
  }

  /** A pure, falling-then-rising whistle, the building block of the koel, owl and gecko calls. */
  private tone(out: AudioNode, type: OscillatorType, from: number, to: number, delay: number, duration: number, peak: number) {
    const context = this.context;
    if (!context) return;
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + duration * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(out);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  /** The Asian koel: a rising two-note "ka-wao", repeated a few times, from somewhere in the trees. */
  private koel(level: number) {
    const out = this.spot(this.map ? this.near(this.map.trees, 120) : null);
    if (!out) return;
    const repeats = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < repeats; i += 1) {
      const lift = 1 + i * 0.06;
      this.tone(out, "sine", 700 * lift, 820 * lift, i * 0.9, 0.18, 0.016 * level * NEAR);
      this.tone(out, "sine", 900 * lift, 1250 * lift, i * 0.9 + 0.22, 0.32, 0.018 * level * NEAR);
    }
  }

  /** The owl in its tree in the clearing: a soft "hoo ... hoo-hoo". Louder the nearer the far end you are. */
  private hoot(level: number) {
    const out = this.spot(this.map?.owl);
    if (!out) return;
    const loud = level * NEAR * 1.6;
    this.tone(out, "sine", 410, 380, 0, 0.42, 0.02 * loud);
    this.tone(out, "sine", 400, 370, 0.85, 0.28, 0.016 * loud);
    this.tone(out, "sine", 400, 360, 1.2, 0.36, 0.016 * loud);
  }

  /** A tokay gecko on the glass beside the visitor: a croaking "to-kay", a few times, slowing down. */
  private gecko(level: number) {
    const map = this.map;
    let point: SoundPoint | null = null;
    if (map) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const z = THREE.MathUtils.clamp(this.listener.z + (Math.random() * 2 - 1) * 12, map.glass.back, map.glass.front);
      point = { x: side * map.glass.halfWidth, y: 2.5, z };
    }
    const out = this.spot(point);
    if (!out) return;
    const repeats = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < repeats; i += 1) {
      const at = i * (0.75 + i * 0.12);
      this.tone(out, "square", 330, 300, at, 0.12, 0.008 * level * NEAR);
      this.tone(out, "square", 260, 200, at + 0.18, 0.22, 0.008 * level * NEAR);
    }
  }

  /** A frog at the water's edge: the nearer the lake or pond, the louder. */
  private croak(level: number) {
    const context = this.context;
    const out = this.spot(this.map ? this.near(this.map.water, 90) : null);
    if (!context || !out) return;
    const start = context.currentTime;
    const osc = context.createOscillator();
    const shape = context.createBiquadFilter();
    const gain = context.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150 + Math.random() * 40, start);
    osc.frequency.exponentialRampToValueAtTime(105, start + 0.18);
    shape.type = "lowpass";
    shape.frequency.value = 650;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.03 * level * NEAR, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
    osc.connect(shape).connect(gain).connect(out);
    osc.start(start);
    osc.stop(start + 0.22);
  }
}
