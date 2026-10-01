"use client";

/**
 * Sound-ready interaction bus. Every meaningful interaction calls `cue(name)`; nothing plays
 * until the viewer turns sound on. Cues are tiny synthesised blips so no audio files ship
 * with the prototype — swap `voices` for recorded foley later without touching call sites.
 */
export type Cue = "hover" | "select" | "back" | "tick" | "open";

const storageKey = "studio-lot:sound";
const changeEvent = "studio-lot:sound-change";

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
    gain.gain.exponentialRampToValueAtTime(voice.gain, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + voice.duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + voice.duration + 0.02);
  } catch {
    // Audio is decoration; never let it break interaction.
  }
}
