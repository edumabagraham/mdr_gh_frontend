import { ReactNode } from 'react';

interface PrimaryButtonProps {
  children: ReactNode;
  type?: 'submit' | 'button';
  disabled?: boolean;
  onClick?: () => void;
}

/** Full-width action button in crest red. */
export default function PrimaryButton({
  children,
  type = 'submit',
  disabled = false,
  onClick,
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-md bg-brand-red px-4 py-2.5 text-sm font-semibold text-white
                 transition hover:bg-brand-red-dark focus:outline-none focus:ring-2
                 focus:ring-brand-red/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
