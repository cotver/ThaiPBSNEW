import type { LotQuality } from "@/lib/studio/engine/LotEngine";

/**
 * The gallery's manual quality picker (QualityButton). Self-contained so it can be taken out later:
 * set this to false to hide the button and ignore any saved choice (every visitor gets auto-detection),
 * or delete this file, QualityButton.tsx and the lines that import them in LotExperience.tsx.
 */
export const QUALITY_PICKER_ENABLED = true;

/** "auto" follows what LotExperience detects for the device; the others force a tier. */
export type QualityChoice = LotQuality | "auto";

export const QUALITY_NAMES: Record<LotQuality, string> = { high: "High", low: "Low", verylow: "Very low" };

/** Highest first, so "above what the device supports" is a lower index. */
export const QUALITY_ORDER: LotQuality[] = ["high", "low", "verylow"];

/** What the device reported, shown in the picker so a visitor can see why auto chose what it did. */
export type DeviceInfo = { cores: number | null; memory: number | null; gpu: string };

const STORAGE_KEY = "thaipbs-lot-quality";

/** The visitor's saved choice (this browser only). Storage can be blocked or empty; then it's "auto". */
export function readQualityChoice(): QualityChoice {
  if (!QUALITY_PICKER_ENABLED) return "auto";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "high" || saved === "low" || saved === "verylow" ? saved : "auto";
  } catch {
    return "auto";
  }
}

/** Saves the choice; false when this browser blocks storage (private window, site data off), so it can't stick. */
export function saveQualityChoice(choice: QualityChoice): boolean {
  try {
    if (choice === "auto") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, choice);
    return true;
  } catch {
    return false;
  }
}
