export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-default focus:text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-[0_1px_2px_rgba(26,26,26,0.08)] focus:border focus:border-primary"
    >
      Skip to main content
    </a>
  );
}
