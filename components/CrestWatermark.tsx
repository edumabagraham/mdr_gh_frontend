/**
 * The registry lockup washed into the page behind the content.
 *
 * Absolutely positioned, so the element it sits in needs `relative`, and
 * whatever should read above it needs `relative` too.
 *
 * The width is given in `vmin` so the mark keeps its presence against the
 * viewport instead of shrinking into a dot on a large monitor, and the height
 * is `auto` — the lockup is roughly 1.95:1, and naming both axes (as a square
 * `75vmin_75vmin` does) squashes it. The full lockup is used rather than the
 * cropped mark so the wordmark reads under the cardiac trace.
 */
export default function CrestWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[url('/mndr-watermark.png')]
                 bg-[length:75vmin_auto] bg-center bg-no-repeat opacity-[0.05]"
    />
  );
}
