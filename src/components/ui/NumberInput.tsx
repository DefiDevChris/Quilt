import { useState, useEffect } from 'react';

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
  const [localValue, setLocalValue] = useState(value);

  // Sync when parent drives a change (e.g. external reset or spinner in parent)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = (val: string) => onChange?.(val);

  const increment = () => {
    const num = parseFloat(localValue);
    if (!isNaN(num)) {
      const next = String(parseFloat((num + step).toFixed(6)));
      setLocalValue(next);
      onChange?.(next);
    }
  };

  const decrement = () => {
    const num = parseFloat(localValue);
    if (!isNaN(num)) {
      const next = String(parseFloat((num - step).toFixed(6)));
      setLocalValue(next);
      onChange?.(next);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-on-surface/80 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center bg-surface-container rounded-md h-[34px] focus-within:ring-1 focus-within:ring-primary/40 transition-colors">
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => commit(localValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(localValue);
          }}
          className="flex-1 bg-transparent font-mono text-[13px] text-on-surface px-2.5 outline-none min-w-0"
        />
        {suffix && <span className="text-[11px] text-on-surface/55 pr-2 font-mono">{suffix}</span>}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={increment}
            className="px-1.5 h-[17px] flex items-center justify-center text-on-surface/55 hover:text-on-surface/75 transition-colors"
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
            className="px-1.5 h-[17px] flex items-center justify-center text-on-surface/55 hover:text-on-surface/75 transition-colors"
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
