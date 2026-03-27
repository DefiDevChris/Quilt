interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        className="text-error mb-4"
        aria-hidden="true"
      >
        <path
          d="M24 4L2 44h44L24 4z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M24 18v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="36" r="1.5" fill="currentColor" />
      </svg>
      <h3 className="text-xl font-semibold text-on-surface mb-2">{title}</h3>
      <p className="text-secondary text-center max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="bg-primary text-primary-on px-6 py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
