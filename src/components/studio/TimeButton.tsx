"use client";

import type { EnvironmentState, TimeOfDay } from "@/lib/studio/engine/LotEngine";
import { cue } from "@/lib/studio/sound";
import styles from "@/components/studio/experience.module.css";

// Kept here rather than imported from the engine, so the button doesn't pull three.js into the page bundle.
const ORDER: TimeOfDay[] = ["morning", "noon", "sunset", "night"];
const NAMES: Record<TimeOfDay, string> = { morning: "Morning", noon: "Midday", sunset: "Sunset", night: "Night" };

/**
 * Picking the time of day, like the weather button: each press runs the sky on to the next part of the
 * day and holds it there, and after night hands it back to the visitor's real clock ("auto").
 */
function next(state: EnvironmentState): TimeOfDay | "auto" {
  const index = ORDER.indexOf(state.time);
  if (state.timeAuto) return ORDER[(index + 1) % ORDER.length];
  return index === ORDER.length - 1 ? "auto" : ORDER[index + 1];
}

function Icon({ time }: { time: TimeOfDay }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (time === "night") {
    return (
      <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">
        <path d="M18.5 15A7 7 0 0 1 9 5.5a7 7 0 1 0 9.5 9.5Z" {...common} />
        <path d="M17 4.5v2M16 5.5h2M20 9v1.5M19.25 9.75h1.5" {...common} />
      </svg>
    );
  }
  if (time === "noon") {
    return (
      <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">
        <circle cx="12" cy="10" r="3.5" {...common} />
        <path d="M12 2.5v1.5M5.5 10H4M20 10h-1.5M7.4 5.4l1 1M16.6 5.4l-1 1M3 19h18" {...common} />
      </svg>
    );
  }
  // Morning and sunset: the sun on the horizon, rising or setting.
  const arrow = time === "morning" ? "M12 3.5v4M10 5.5l2-2 2 2" : "M12 3.5v4M10 5.5l2 2 2-2";
  return (
    <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">
      <path d="M7 16a5 5 0 0 1 10 0M3 16h18M6 19.5h12" {...common} />
      <path d={arrow} {...common} />
    </svg>
  );
}

/** The time of day outside the glass: shows where the day is, and moves it on. */
export function TimeButton({ state, onChange }: { state: EnvironmentState; onChange: (time: TimeOfDay | "auto") => void }) {
  const upcoming = next(state);
  const now = `${NAMES[state.time]}${state.timeAuto ? ", following the real time" : ""}`;
  const action = upcoming === "auto" ? "follow the real time again" : `go to ${NAMES[upcoming].toLowerCase()}`;
  return (
    <button
      aria-label={`Time of day: ${now}. Press to ${action}.`}
      className={`${styles.roundButton} ${styles.timeToggle}`}
      data-cursor={upcoming === "auto" ? "Time: auto" : `Time: ${NAMES[upcoming]}`}
      onClick={() => {
        cue("tick");
        onChange(upcoming);
      }}
      title={`Time of day: ${now}`}
      type="button"
    >
      <Icon time={state.time} />
      {state.timeAuto ? <span className={styles.weatherAuto}>Auto</span> : null}
    </button>
  );
}
