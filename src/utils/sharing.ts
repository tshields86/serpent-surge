/** Capture the canvas as a PNG Blob */
export async function captureCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to capture canvas'));
      },
      'image/png',
    );
  });
}

/** Share game result using Web Share API or clipboard fallback */
export async function shareResult(
  canvas: HTMLCanvasElement,
  score: number,
  arenaReached: number,
): Promise<void> {
  const text = `I scored ${score} points and reached Arena ${arenaReached} in Serpent Surge! 🐍⚡`;

  // Try Web Share API with image (mobile)
  if (navigator.share && navigator.canShare) {
    try {
      const blob = await captureCanvas(canvas);
      const file = new File([blob], 'serpent-surge-score.png', { type: 'image/png' });
      const shareData: ShareData = {
        title: 'Serpent Surge',
        text,
        files: [file],
      };

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // Fall through to text-only share
    }

    // Try text-only share
    try {
      await navigator.share({ title: 'Serpent Surge', text });
      return;
    } catch {
      // Fall through to clipboard
    }
  }

  // Clipboard fallback (desktop)
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Silent fail — nothing we can do
  }
}
