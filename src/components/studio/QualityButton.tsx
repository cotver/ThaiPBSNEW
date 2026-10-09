"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LotQuality } from "@/lib/studio/engine/LotEngine";
import { cue } from "@/lib/studio/sound";
import { QUALITY_NAMES, QUALITY_ORDER, saveQualityChoice, type DeviceInfo, type QualityChoice } from "@/lib/studio/quality";
import styles from "@/components/studio/experience.module.css";

const SHORT: Record<LotQuality, string> = { high: "HI", low: "LO", verylow: "VL" };

function describeDevice(device: DeviceInfo) {
  const parts = [
    device.cores ? `${device.cores} cores` : null,
    // deviceMemory is rounded down to a power of two and capped at 8, so 8 means "8 GB or more".
    device.memory ? `${device.memory >= 8 ? "8+" : device.memory} GB` : null,
    device.gpu || null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Not reported by this browser";
}

/**
 * Graphics quality, beside the time and weather buttons: Auto (what this device was detected to handle)
 * or a fixed tier. The engine builds its scene for one tier, so a change saves the choice and reloads.
 * Optional by design — see QUALITY_PICKER_ENABLED in lib/studio/quality.ts to switch it off or remove it.
 */
export function QualityButton({ choice, current, detected, device }: { choice: QualityChoice; current: LotQuality; detected: LotQuality; device: DeviceInfo }) {
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const pick = (next: QualityChoice) => {
    cue("tick");
    if (next === choice) return setOpen(false);
    if (!saveQualityChoice(next)) return setBlocked(true);
    const quality = next === "auto" ? detected : next;
    // Same tier as now (e.g. Auto, and auto picks what's already running): nothing to rebuild.
    if (quality === current) return setOpen(false);
    window.location.reload();
  };

  const options: { value: QualityChoice; label: string; note?: string }[] = [
    { value: "auto", label: "Auto", note: `${QUALITY_NAMES[detected]} on this device` },
    ...QUALITY_ORDER.map((tier) => ({
      value: tier,
      label: QUALITY_NAMES[tier],
      // A tier above what auto picked may run slowly here (the engine still steps down if it does).
      note: QUALITY_ORDER.indexOf(tier) < QUALITY_ORDER.indexOf(detected) ? "May be slow on this device" : tier === detected ? "Recommended" : undefined,
    })),
  ];

  return (
    <div
      className={styles.qualityControl}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          // Close the menu only, not the room panel behind it (LotExperience listens for Esc on window).
          event.stopPropagation();
          setOpen(false);
        }
      }}
      ref={rootRef}
    >
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Graphics quality: ${QUALITY_NAMES[current]}${choice === "auto" ? ", detected automatically" : ""}. Press to change.`}
        className={`${styles.roundButton} ${styles.qualityToggle}`}
        data-cursor="Graphics quality"
        onClick={() => {
          cue("tick");
          setOpen((value) => !value);
        }}
        title={`Graphics quality: ${QUALITY_NAMES[current]}`}
        type="button"
      >
        <span className={styles.qualityShort}>{SHORT[current]}</span>
        {choice === "auto" ? <span className={styles.weatherAuto}>Auto</span> : null}
      </button>

      {open ? (
        <div aria-label="Graphics quality" className={styles.qualityMenu} id={menuId} role="group">
          <p className={styles.qualityHeading}>Graphics quality</p>
          {options.map((option) => (
            <button
              aria-pressed={option.value === choice}
              className={styles.qualityOption}
              data-cursor={`Quality: ${option.label}`}
              key={option.value}
              onClick={() => pick(option.value)}
              type="button"
            >
              <span>{option.label}</span>
              {option.note ? <small>{option.note}</small> : null}
            </button>
          ))}
          <p className={styles.qualityDevice}>{describeDevice(device)}</p>
          {blocked ? <p className={styles.qualityDevice}>This browser blocks saving settings, so the choice can&apos;t be kept.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
