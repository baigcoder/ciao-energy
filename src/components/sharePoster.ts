import { BRAND } from '../data/brand';

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled' | 'failed';

/**
 * Shares the flavor's poster (built by scripts/build-social.mjs) through the
 * system share sheet where files can be shared, otherwise saves it.
 * Only ever runs from a click.
 */
export async function sharePoster(slug: string, flavorName: string): Promise<ShareOutcome> {
  const url = `/social/${slug}-poster.jpg`;
  const fileName = `grizzly-${slug}-poster.jpg`;
  try {
    const response = await fetch(url);
    if (!response.ok) return 'failed';
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    const data: ShareData = { files: [file], title: `${BRAND.name} · ${flavorName}`, text: BRAND.tagline };
    if (navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
        return 'shared';
      } catch (error) {
        if ((error as DOMException).name === 'AbortError') return 'cancelled';
      }
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
