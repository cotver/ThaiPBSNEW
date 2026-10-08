"use client";

import type { EnvironmentState, Weather } from "@/lib/studio/engine/LotEngine";
import { cue } from "@/lib/studio/sound";
import styles from "@/components/studio/experience.module.css";

// Kept here rather than imported from the engine, so the button doesn't pull three.js into the page bundle.
const ORDER: Weather[] = ["clear", "cloudy", "rain", "mist"];
const NAMES: Record<Weather, string> = { clear: "Clear", cloudy: "Cloudy", rain: "Rain", mist: "Mist" };

/**
 * Picking the weather: each press moves to the next sky, and after the last one hands it back to the
 * sky itself ("auto"), which drifts from one weather to the next on its own.
 */
function next(state: EnvironmentState): Weather | "auto" {
  const index = ORDER.indexOf(state.weather);
  if (state.auto) return ORDER[(index + 1) % ORDER.length];
  return index === ORDER.length - 1 ? "auto" : ORDER[index + 1];
}

function Icon({ weather, night }: { weather: Weather; night: boolean }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const cloud = <path d="M7 17.5h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-1A4 4 0 0 0 7 17.5Z" {...common} />;
  if (weather === "clear") {
    return night ? (
      <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22"><path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" {...common} /></svg>
    ) : (
      <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">
        <circle cx="12" cy="12" r="4" {...common} />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" {...common} />
      </svg>
    );
  }
  if (weather === "cloudy") return <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">{cloud}</svg>;
  if (weather === "rain") {
    return (
      <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">
        <path d="M7 14.5h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-1A4 4 0 0 0 7 14.5Z" {...common} />
        <path d="M8.5 17.5l-1 2.5M12.5 17.5l-1 2.5M16.5 17.5l-1 2.5" {...common} />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">
      <path d="M4 9h13M7 12.5h13M4 16h12M8 19.5h9" {...common} />
    </svg>
  );
}

/** The weather outside the glass: shows the current sky, and changes it. */
export function WeatherButton({ state, onChange }: { state: EnvironmentState; onChange: (weather: Weather | "auto") => void }) {
  const upcoming = next(state);
  const now = `${NAMES[state.weather]}${state.night ? " night" : ""}${state.auto ? ", changing on its own" : ""}`;
  const action = upcoming === "auto" ? "let the weather change on its own" : `make it ${NAMES[upcoming].toLowerCase()}`;
  return (
    <button
      aria-label={`Weather: ${now}. Press to ${action}.`}
      className={`${styles.roundButton} ${styles.weatherToggle}`}
      data-cursor={upcoming === "auto" ? "Weather: auto" : `Weather: ${NAMES[upcoming]}`}
      onClick={() => {
        cue("tick");
        onChange(upcoming);
      }}
      title={`Weather: ${now}`}
      type="button"
    >
      <Icon night={state.night} weather={state.weather} />
      {state.auto ? <span className={styles.weatherAuto}>Auto</span> : null}
    </button>
  );
}
