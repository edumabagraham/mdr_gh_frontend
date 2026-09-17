import Image from 'next/image';

/**
 * The MDR KATH lockup: hospital crest, a divider, then the registry mark and
 * wordmark — the arrangement used on the signed-out pages and in the app header.
 *
 * Both marks are static assets: public/kath_logo.png (the KATH crest, which carries
 * its own white background) and public/mdr-mark.svg.
 */
export default function BrandMark({ compact = false }: { compact?: boolean }) {
  const crestSize = compact ? 34 : 54;
  const markSize = compact ? 30 : 48;

  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-3'}`}>
      <span className="rounded-md bg-white p-0.5 ring-1 ring-line">
        <Image
          src="/kath_logo.png"
          alt="Komfo Anokye Teaching Hospital crest"
          width={crestSize}
          height={crestSize}
          priority
          className="block"
        />
      </span>

      <span
        aria-hidden
        className={`shrink-0 full bg-line-strong ${
          compact ? 'h-7 w-[3px]' : 'h-14 w-[3px]'
        }`}
      />

      <div className={`flex items-center ${compact ? 'gap-2.5' : 'gap-3'}`}>
        <Image
          src="/mdr-mark.svg"
          alt="Movement Disorder Registry mark"
          width={markSize}
          height={markSize}
          priority
          unoptimized
          className="shrink-0 rounded-sm"
        />
        <div className="leading-tight">
          <p
            className={`font-bold tracking-tight text-foreground ${
              compact ? 'text-base' : 'text-2xl sm:whitespace-nowrap'
            }`}
          >
            Movement Disorder Registry
          </p>
          <p className={`text-muted ${compact ? 'text-[11px]' : 'text-sm'}`}>
            Komfo Anokye Teaching Hospital, Kumasi
          </p>
        </div>
      </div>
    </div>
  );
}
