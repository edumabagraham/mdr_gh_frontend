/**
 * The hospital crest washed into the page behind the content.
 *
 * Absolutely positioned, so the element it sits in needs `relative`, and
 * whatever should read above it needs `relative` too. The size is given in
 * `vmin` so the crest keeps its proportions against the viewport instead of
 * shrinking into a dot on a large monitor.
 */
export default function CrestWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[url('/kath_logo.png')]
                 bg-[length:75vmin_75vmin] bg-center bg-no-repeat opacity-[0.03]"
    />
  );
}
