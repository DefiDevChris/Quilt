export function NumberInput({
  label,
  value,
  onChange,
  suffix,
  step = 1,
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  suffix?: string;
  step?: number;
}) {
  const increment = () => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onChange?.(String(parseFloat((num + step).toFixed(6))));
    }
  };

  const decrement = () => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onChange?.(String(parseFloat((num - step).toFixed(6))));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-body-sm text-secondary">{label}</label>
      <div className="flex items-center bg-surface-container rounded-sm h-9">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 bg-transparent font-mono text-body-sm text-on-surface px-2 outline-none min-w-0"
        />
        {suffix && <span className="text-body-sm text-secondary pr-2">{suffix}</span>}
        <div className="flex flex-col border-l border-outline-variant/20">
          <button
            type="button"
            onClick={increment}
            className="px-1.5 h-[18px] flex items-center justify-center text-secondary hover:text-on-surface"
            aria-label={`Increase ${label}`}
          >
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
              <path
                d="M1 4L4 1L7 4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={decrement}
            className="px-1.5 h-[18px] flex items-center justify-center text-secondary hover:text-on-surface"
            aria-label={`Decrease ${label}`}
          >
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
              <path
                d="M1 1L4 4L7 1"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
