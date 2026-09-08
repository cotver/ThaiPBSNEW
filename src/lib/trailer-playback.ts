export async function playVideoWithSoundFallback(
  video: HTMLVideoElement,
  muted: boolean,
  onMutedFallback: () => void,
): Promise<boolean> {
  video.muted = muted;
  video.volume = muted ? 0 : 1;

  try {
    await video.play();
    return true;
  } catch {
    if (muted) return false;

    video.muted = true;
    video.volume = 0;
    onMutedFallback();

    try {
      await video.play();
      return true;
    } catch {
      return false;
    }
  }
}

export function isGifMedia(mimeType: string | undefined, rawUrl: string): boolean {
  if (mimeType?.trim().toLowerCase() === 'image/gif') return true;

  try {
    return new URL(rawUrl, 'http://localhost').pathname.toLowerCase().endsWith('.gif');
  } catch {
    return rawUrl.split(/[?#]/, 1)[0]?.toLowerCase().endsWith('.gif') ?? false;
  }
}
