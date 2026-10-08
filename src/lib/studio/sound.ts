"use client";

/**
 * Sound-ready interaction bus. Every meaningful interaction calls `cue(name)`; nothing plays
 * until the viewer turns sound on. Cues are tiny synthesised blips so no audio files ship
 * with the prototype — swap `voices` for recorded foley later without touching call sites.
 */
export type Cue = "hover" | "select" | "back" | "tick" | "open";

const storageKey = "studio-lot:sound";
const changeEvent = "studio-lot:sound-change";
const volumeKey = "studio-lot:volume";
const volumeEvent = "studio-lot:volume-change";
/** Volume when the viewer has not set one (0..1). */
const DEFAULT_VOLUME = 0.5;

const voices: Record<Cue, { frequency: number; to: number; duration: number; type: OscillatorType; gain: number }> = {
  hover: { frequency: 880, to: 990, duration: 0.05, type: "sine", gain: 0.025 },
  tick: { frequency: 1600, to: 1500, duration: 0.025, type: "square", gain: 0.012 },
  select: { frequency: 420, to: 640, duration: 0.18, type: "triangle", gain: 0.05 },
  open: { frequency: 300, to: 520, duration: 0.32, type: "sine", gain: 0.05 },
  back: { frequency: 560, to: 320, duration: 0.2, type: "triangle", gain: 0.045 },
};

let context: AudioContext | null = null;

export function soundEnabled() {
  try {
    return window.localStorage.getItem(storageKey) === "on";
  } catch {
    return false;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(storageKey, enabled ? "on" : "off");
  } catch {
    // Storage blocked: the toggle still works for this page view.
  }
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: enabled }));
  if (enabled) cue("select");
}

/** The viewer's volume for all gallery sound, 0..1 (remembered in this browser). */
export function soundVolume() {
  try {
    const stored = window.localStorage.getItem(volumeKey);
    const value = stored === null ? DEFAULT_VOLUME : Number(stored);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function setSoundVolume(volume: number) {
  const value = Math.min(1, Math.max(0, volume));
  try {
    window.localStorage.setItem(volumeKey, String(value));
  } catch {
    // Storage blocked: the slider still works for this page view.
  }
  window.dispatchEvent(new CustomEvent(volumeEvent, { detail: value }));
}

export function onVolumeChange(listener: (volume: number) => void) {
  const handler = (event: Event) => listener(Number((event as CustomEvent<number>).detail));
  window.addEventListener(volumeEvent, handler);
  return () => window.removeEventListener(volumeEvent, handler);
}

export function onSoundChange(listener: (enabled: boolean) => void) {
  const handler = (event: Event) => listener(Boolean((event as CustomEvent<boolean>).detail));
  window.addEventListener(changeEvent, handler);
  return () => window.removeEventListener(changeEvent, handler);
}

export function cue(name: Cue) {
  if (typeof window === "undefined" || !soundEnabled()) return;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    const voice = voices[name];
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = voice.type;
    oscillator.frequency.setValueAtTime(voice.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(voice.to, now + voice.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, voice.gain * soundVolume() * 3.2), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + voice.duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + voice.duration + 0.02);
  } catch {
    // Audio is decoration; never let it break interaction.
  }
}
