import localFont from "next/font/local";

export const plexThai = localFont({
  src: [
    { path: "../../home-redesign/fonts/IBMPlexSansThai-regular.ttf", weight: "400", style: "normal" },
    { path: "../../home-redesign/fonts/IBMPlexSansThai-semibold.ttf", weight: "600", style: "normal" },
    { path: "../../home-redesign/fonts/IBMPlexSansThai-bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--lot-font",
  display: "swap",
});
