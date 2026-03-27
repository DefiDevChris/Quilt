'use client';

interface HelpButtonProps {
  readonly onClick: () => void;
}

export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Help"
      className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-surface-container hover:bg-surface-container-high shadow-elevation-2 rounded-full transition-colors z-30 text-on-surface"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M6.75 6.75C6.75 5.50736 7.75736 4.5 9 4.5C10.2426 4.5 11.25 5.50736 11.25 6.75C11.25 7.99264 10.2426 9 9 9V10.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="9" cy="13" r="0.75" fill="currentColor" />
      </svg>
    </button>
  );
}
