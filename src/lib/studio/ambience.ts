import type { Conditions } from "./engine/Environment";
import { onSoundChange, onVolumeChange, soundEnabled, soundVolume } from "./sound";

/**
 * The gallery's ambient soundscape, following the world outside: wind always, gusting through the
 * trees now and then; birdsong and the odd koel call by day; cicadas, frogs, an owl and a tokay gecko at
 * night; rain and distant thunder in the wet; and a soft room tone. The occasional sounds are spaced well
 * apart, so the place feels alive without getting busy. Like the interaction cues (see sound.ts) it is
 * synthesised, so no audio ships, and it only plays once the viewer has turned sound on.
 */
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
  /** 1: rolls across from one side to the other. */
  sweep: number;
  peak: number;
};

export class Ambience {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  /**
   * Everything from outdoors goes through here: muffled as if heard through the glass, with a little of
   * the hall's echo, so it sounds like it comes from outside while the visitor is in the room.
   */
  private outside: AudioNode | null = null;
  private rain: GainNode | null = null;
  private cicadas: GainNode | null = null;
  private wind: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  /** Seconds until each occasional sound may play again. */
  private readonly timers = { rustle: 12, koel: 25, owl: 15, gecko: 40, thunder: 20 };
  private enabled = soundEnabled();
  private volume = soundVolume();
  private readonly unsubscribeVolume: () => void;
  private birdTimer = 4;
  /** Hushed while the visitor is looking at a room's content (see update). */
  private quiet = false;
  private frogTimer = 4;
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

  /**
   * Call every frame with the conditions outside. `quiet`: the visitor is focused on a room's content,
   * so the soundscape fades away until they step back.
   */
  update(dt: number, conditions: Conditions, quiet = false) {
    const context = this.context;
    if (!this.enabled || !context || context.state !== "running" || !this.rain || !this.cicadas) return;
    if (quiet !== this.quiet) {
      this.quiet = quiet;
      this.fade(quiet ? 0 : 1);
    }
    if (quiet) return;
    const { day, night, rain, wind } = conditions;
    const now = context.currentTime;
    this.rain.gain.setTargetAtTime(rain * 0.14, now, 0.8);
    this.cicadas.gain.setTargetAtTime(night * (1 - rain) * 0.045, now, 1.5);
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
    // After dark: an owl, and now and then a tokay gecko's "to-kay".
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
    // Frogs croak after dark, more in the wet.
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
      const source = (filter: BiquadFilterType, frequency: number, q: number, level: number) => {
        const player = context.createBufferSource();
        player.buffer = noise;
        player.loop = true;
        const shape = context.createBiquadFilter();
        shape.type = filter;
        shape.frequency.value = frequency;
        shape.Q.value = q;
        const gain = context.createGain();
        gain.gain.value = level;
        player.connect(shape).connect(gain);
        player.start();
        return gain;
      };
      // Room tone: a low, steady hush.
      source("lowpass", 260, 0.7, 0.02).connect(this.master);
      // Wind: a low, breathy whoosh (its level is set every frame).
      this.wind = source("lowpass", 520, 0.6, 0);
      this.wind.connect(glass);
      // Rain: broadband patter, up and down with the weather.
      this.rain = source("bandpass", 1800, 0.5, 0);
      this.rain.connect(glass);
      // Cicadas: a high buzz, pulsed by a fast tremolo.
      const buzz = source("bandpass", 5200, 8, 1);
      const tremolo = context.createGain();
      tremolo.gain.value = 0.5;
      const lfo = context.createOscillator();
      lfo.frequency.value = 38;
      const depth = context.createGain();
      depth.gain.value = 0.5;
      lfo.connect(depth).connect(tremolo.gain);
      lfo.start();
      this.cicadas = context.createGain();
      this.cicadas.gain.value = 0;
      buzz.connect(tremolo).connect(this.cicadas).connect(glass);
      this.fade(1);
    } catch {
      // Audio is decoration; never let it break the gallery.
      this.context = null;
    }
  }

  /** Fade the whole soundscape toward `to` (0 or 1), at the viewer's volume. */
  private fade(to: number) {
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(to * this.volume * 3.8, this.context.currentTime, 0.6);
  }

  /** A spot outside for one call: panned somewhere to the left or right, into the glass. */
  private spot() {
    const context = this.context;
    if (!context || !this.outside) return null;
    const panner = context.createStereoPanner();
    panner.pan.value = (Math.random() * 2 - 1) * 0.8;
    panner.connect(this.outside);
    return panner;
  }

  private chirp(level: number) {
    const context = this.context;
    const out = this.spot();
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
      gain.gain.exponentialRampToValueAtTime(0.012 * level, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);
      osc.connect(gain).connect(out);
      osc.start(start);
      osc.stop(start + 0.1);
    }
  }

  /** A burst of filtered noise shaped by an envelope: the base of the rustle and the thunder. */
  private noiseBurst(filter: BiquadFilterType, frequency: number, q: number, peak: number, attack: number, release: number) {
    const context = this.context;
    const out = this.spot();
    if (!context || !out || !this.noise) return;
    const start = context.currentTime;
    const player = context.createBufferSource();
    player.buffer = this.noise;
    player.loop = true;
    const shape = context.createBiquadFilter();
    shape.type = filter;
    shape.frequency.value = frequency;
    shape.Q.value = q;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + release);
    player.connect(shape).connect(gain).connect(out);
    player.start(start, Math.random());
    player.stop(start + attack + release + 0.1);
    return shape;
  }

  /**
   * A gust through the trees, picked from eight kinds and varied every time, so no two sound alike: a
   * soft breeze in broadleaf trees, a sharp gust, a long whoosh through pines, fluttering leaves, a gust
   * rolling across from one side to the other, a double gust, dry crackly leaves, and a distant treeline.
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
      peak: vary(kind.peak, 0.2) * level,
    });
  }

  /** Play one gust: bands of noise swelling and fading, with flutter, crackle and drift as asked. */
  private gust(gust: Gust) {
    const context = this.context;
    if (!context || !this.outside || !this.noise) return;
    const start = context.currentTime;
    const end = start + gust.duration;
    // Where it comes from, and (for a rolling gust) where it goes.
    const panner = context.createStereoPanner();
    const from = (Math.random() * 2 - 1) * 0.8;
    panner.pan.setValueAtTime(gust.sweep ? -Math.sign(from || 1) * 0.8 : from, start);
    if (gust.sweep) panner.pan.linearRampToValueAtTime(Math.sign(from || 1) * 0.8, end);
    panner.connect(this.outside);

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
    into.connect(panner);

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
      click.connect(shape).connect(gain).connect(panner);
      click.start(at, Math.random());
      click.stop(at + 0.06);
    }
  }

  /** A low rumble rolling in from far off. */
  private thunder(level: number) {
    this.noiseBurst("lowpass", 140, 0.8, 0.09 * level, 0.6, 3.8);
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

  /** The Asian koel: a rising two-note "ka-wao", repeated a few times, each a little higher. */
  private koel(level: number) {
    const out = this.spot();
    if (!out) return;
    const repeats = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < repeats; i += 1) {
      const lift = 1 + i * 0.06;
      this.tone(out, "sine", 700 * lift, 820 * lift, i * 0.9, 0.18, 0.016 * level);
      this.tone(out, "sine", 900 * lift, 1250 * lift, i * 0.9 + 0.22, 0.32, 0.018 * level);
    }
  }

  /** An owl: a soft "hoo ... hoo-hoo". */
  private hoot(level: number) {
    const out = this.spot();
    if (!out) return;
    this.tone(out, "sine", 410, 380, 0, 0.42, 0.02 * level);
    this.tone(out, "sine", 400, 370, 0.85, 0.28, 0.016 * level);
    this.tone(out, "sine", 400, 360, 1.2, 0.36, 0.016 * level);
  }

  /** A tokay gecko: a croaking "to-kay", a few times, slowing down. */
  private gecko(level: number) {
    const out = this.spot();
    if (!out) return;
    const repeats = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < repeats; i += 1) {
      const at = i * (0.75 + i * 0.12);
      this.tone(out, "square", 330, 300, at, 0.12, 0.008 * level);
      this.tone(out, "square", 260, 200, at + 0.18, 0.22, 0.008 * level);
    }
  }

  private croak(level: number) {
    const context = this.context;
    const out = this.spot();
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
    gain.gain.exponentialRampToValueAtTime(0.03 * level, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
    osc.connect(shape).connect(gain).connect(out);
    osc.start(start);
    osc.stop(start + 0.22);
  }
}
