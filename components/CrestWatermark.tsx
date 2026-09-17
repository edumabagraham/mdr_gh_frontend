/**
 * The hospital crest washed into the page behind the content.
 *
 * Absolutely positioned, so the element it sits in needs `relative`, and
 * whatever should read above it needs `relative` too.
 */
export default function CrestWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[url('/kath_logo.png')] bg-[length:620px_620px]
                 bg-center bg-no-repeat opacity-[0.03]"
    />
  );
}
