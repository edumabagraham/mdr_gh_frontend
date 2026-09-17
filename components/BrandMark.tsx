import Image from 'next/image';

/**
 * The MDR KATH lockup: hospital crest, a divider, then the registry mark and
 * wordmark — the arrangement used on the signed-out pages and in the app header.
 *
 * Every dimension is a responsive class rather than a fixed prop, so the whole
 * lockup shrinks on a phone and grows on a large monitor. The `width`/`height`
 * on each image only fixes the aspect ratio for Next's image handling.
 */
export default function BrandMark({ compact = false }: { compact?: boolean }) {
  const crest = compact
    ? 'h-7 w-7 sm:h-8 sm:w-8'
    : 'h-10 w-10 sm:h-12 sm:w-12 2xl:h-14 2xl:w-14';

  const mark = compact
    ? 'h-6 w-6 sm:h-7 sm:w-7'
    : 'h-9 w-9 sm:h-11 sm:w-11 2xl:h-12 2xl:w-12';

  const divider = compact
    ? 'h-6 w-[3px] sm:h-7'
    : 'h-9 w-[3px] sm:h-11 sm:w-[4px] 2xl:h-12';

  const title = compact
    ? 'text-sm sm:text-base'
    : 'text-lg sm:text-xl lg:text-2xl 2xl:text-3xl lg:whitespace-nowrap';

  const subtitle = compact
    ? 'text-[10px] sm:text-[11px]'
    : 'text-xs sm:text-sm 2xl:text-base';

  return (
    <div className={`flex items-center ${compact ? 'gap-2 sm:gap-3' : 'gap-3 sm:gap-4'}`}>
      <span className="shrink-0 rounded-md bg-white p-0.5 ring-1 ring-line">
        <Image
          src="/kath_logo.png"
          alt="Komfo Anokye Teaching Hospital crest"
          width={64}
          height={64}
          priority
          className={`block ${crest}`}
        />
      </span>

      <span aria-hidden className={`shrink-0 rounded-full bg-line-strong ${divider}`} />

      <div className={`flex items-center ${compact ? 'gap-2 sm:gap-2.5' : 'gap-2.5 sm:gap-3'}`}>
        <Image
          src="/mdr-mark.svg"
          alt="Movement Disorder Registry mark"
          width={64}
          height={64}
          priority
          unoptimized
          className={`shrink-0 rounded-sm ${mark}`}
        />
        <div className="leading-tight">
          {/* The full name needs three lines inside a phone-width header bar,
              so the compact lockup falls back to the short form there. */}
          <p className={`font-bold tracking-tight text-foreground ${title}`}>
            {compact && <span className="sm:hidden">MDR KATH</span>}
            <span className={compact ? 'hidden sm:inline' : undefined}>
              Movement Disorder Registry
            </span>
          </p>
          <p className={`text-muted ${subtitle} ${compact ? 'hidden sm:block' : ''}`}>
            Komfo Anokye Teaching Hospital, Kumasi
          </p>
        </div>
      </div>
    </div>
  );
}
