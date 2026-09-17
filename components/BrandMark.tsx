import Image from 'next/image';

/**
 * Logo and wordmark lockup.
 *
 * The image lives at public/logo.png — replace that file to change the crest
 * everywhere it appears.
 */
export default function BrandMark({ compact = false }: { compact?: boolean }) {
  const dimension = compact ? 40 : 64;

  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo.png"
        alt="Komfo Anokye Teaching Hospital crest"
        width={dimension}
        height={dimension}
        priority
        className="shrink-0"
      />
      <div className="leading-tight">
        <p
          className={`font-semibold tracking-tight text-foreground ${
            compact ? 'text-base' : 'text-xl'
          }`}
        >
          Movement Disorder Registry
        </p>
        <p className={`text-muted ${compact ? 'text-[11px]' : 'text-sm'}`}>
          Komfo Anokye Teaching Hospital, Kumasi
        </p>
      </div>
    </div>
  );
}
