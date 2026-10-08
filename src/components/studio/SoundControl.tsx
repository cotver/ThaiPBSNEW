"use client";

import { useEffect, useState } from "react";
import { onSoundChange, onVolumeChange, setSoundEnabled, setSoundVolume, soundEnabled, soundVolume } from "@/lib/studio/sound";
import styles from "@/components/studio/experience.module.css";

function Speaker({ on, volume }: { on: boolean; volume: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" {...common} />
      {on ? (
        <>
          {volume > 0.02 ? <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" {...common} /> : null}
          {volume > 0.5 ? <path d="M18 7a7 7 0 0 1 0 10" {...common} /> : null}
        </>
      ) : (
        <path d="M16 9.5l5 5M21 9.5l-5 5" {...common} />
      )}
    </svg>
  );
}

/**
 * Gallery sound: the speaker turns sound on or off (off until the visitor chooses), and a volume slider
 * shows above it on hover or focus while sound is on. Both are remembered in this browser.
 */
export function SoundControl() {
  const [on, setOn] = useState(soundEnabled);
  const [volume, setVolume] = useState(soundVolume);
  useEffect(() => onSoundChange(setOn), []);
  useEffect(() => onVolumeChange(setVolume), []);
  const percent = Math.round(volume * 100);
  return (
    <div className={styles.soundControl}>
      {on ? (
        <label className={styles.soundSlider}>
          <span className={styles.srOnly}>Volume</span>
          <input
            aria-valuetext={`${percent}%`}
            max={100}
            min={0}
            onChange={(event) => setSoundVolume(Number(event.target.value) / 100)}
            step={1}
            type="range"
            value={percent}
          />
        </label>
      ) : null}
      <button
        aria-label={on ? `Sound on, volume ${percent}%. Press to turn sound off.` : "Sound off. Press to turn sound on."}
        aria-pressed={on}
        className={styles.roundButton}
        data-cursor={on ? "Sound off" : "Sound on"}
        onClick={() => setSoundEnabled(!on)}
        title={on ? "Sound on" : "Sound off"}
        type="button"
      >
        <Speaker on={on} volume={volume} />
      </button>
    </div>
  );
}
