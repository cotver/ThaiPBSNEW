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
