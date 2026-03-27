'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  parseFraction,
  add,
  subtract,
  multiply,
  divide,
  toDecimal,
  toMixedNumberString,
  inchesToCm,
  cmToInches,
} from '@/lib/fraction-math';

type Operation = '+' | '-' | '*' | '/';

interface FractionCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FractionCalculator({ isOpen, onClose }: FractionCalculatorProps) {
  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  const [operation, setOperation] = useState<Operation>('+');
  const [resultFraction, setResultFraction] = useState('');
  const [resultDecimal, setResultDecimal] = useState('');
  const [error, setError] = useState('');
  const [convertValue, setConvertValue] = useState('');
  const [convertFrom, setConvertFrom] = useState<'inches' | 'cm'>('inches');
  const [convertResult, setConvertResult] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const calculate = useCallback(() => {
    setError('');
    setResultFraction('');
    setResultDecimal('');

    if (!inputA.trim() || !inputB.trim()) {
      setError('Enter values in both fields');
      return;
    }

    try {
      const a = parseFraction(inputA.trim());
      const b = parseFraction(inputB.trim());

      let result;
      switch (operation) {
        case '+':
          result = add(a, b);
          break;
        case '-':
          result = subtract(a, b);
          break;
        case '*':
          result = multiply(a, b);
          break;
        case '/':
          result = divide(a, b);
          break;
      }

      setResultFraction(toMixedNumberString(result));
      setResultDecimal(toDecimal(result).toFixed(4));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input');
    }
  }, [inputA, inputB, operation]);

  const convert = useCallback(() => {
    setConvertResult('');
    if (!convertValue.trim()) return;

    const val = parseFloat(convertValue);
    if (isNaN(val)) {
      setConvertResult('Invalid number');
      return;
    }

    if (convertFrom === 'inches') {
      setConvertResult(`${inchesToCm(val).toFixed(4)} cm`);
    } else {
      setConvertResult(`${cmToInches(val).toFixed(4)} in`);
    }
  }, [convertValue, convertFrom]);

  const clear = useCallback(() => {
    setInputA('');
    setInputB('');
    setResultFraction('');
    setResultDecimal('');
    setError('');
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    // Delay to prevent immediate close from the click that opened the panel
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  const operations: { value: Operation; label: string }[] = [
    { value: '+', label: '+' },
    { value: '-', label: '-' },
    { value: '*', label: '\u00d7' },
    { value: '/', label: '\u00f7' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-0 right-0 h-full w-[300px] bg-surface border-l border-outline-variant shadow-elevation-3 z-40 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <h3 className="text-sm font-semibold text-on-surface">Fraction Calculator</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded text-secondary hover:text-on-surface hover:bg-background transition-colors"
              title="Close (Esc)"
            >
              &times;
            </button>
          </div>

          {/* Calculator */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Fraction Math Section */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-secondary uppercase tracking-wider">
                Fraction Math
              </div>

              {/* Input A */}
              <div>
                <label className="text-xs text-secondary block mb-1">
                  Value A (e.g., 5/8, 2 1/4, 0.625)
                </label>
                <input
                  type="text"
                  value={inputA}
                  onChange={(e) => setInputA(e.target.value)}
                  placeholder="5/8"
                  className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') calculate();
                  }}
                />
              </div>

              {/* Operation Selector */}
              <div className="flex gap-1">
                {operations.map((op) => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setOperation(op.value)}
                    className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                      operation === op.value
                        ? 'bg-primary text-white'
                        : 'bg-background text-secondary border border-outline-variant hover:bg-outline-variant'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>

              {/* Input B */}
              <div>
                <label className="text-xs text-secondary block mb-1">
                  Value B
                </label>
                <input
                  type="text"
                  value={inputB}
                  onChange={(e) => setInputB(e.target.value)}
                  placeholder="1/4"
                  className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') calculate();
                  }}
                />
              </div>

              {/* Calculate + Clear Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={calculate}
                  className="flex-1 h-9 rounded-md bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Calculate
                </button>
                <button
                  type="button"
                  onClick={clear}
                  className="h-9 px-3 rounded-md bg-background text-secondary text-sm border border-outline-variant hover:bg-outline-variant transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Result */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-error">
                  {error}
                </div>
              )}
              {resultFraction && (
                <div className="rounded-lg bg-background border border-outline-variant p-3 space-y-1">
                  <div className="text-xs text-secondary">Result (fraction)</div>
                  <div className="text-lg font-mono font-semibold text-on-surface">
                    {resultFraction}
                  </div>
                  <div className="text-xs text-secondary">Result (decimal)</div>
                  <div className="text-sm font-mono text-secondary">{resultDecimal}</div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-outline-variant" />

            {/* Unit Conversion Section */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-secondary uppercase tracking-wider">
                Unit Conversion
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={convertValue}
                  onChange={(e) => setConvertValue(e.target.value)}
                  placeholder="Enter value"
                  className="flex-1 rounded-sm border border-outline-variant bg-surface px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') convert();
                  }}
                />
                <select
                  value={convertFrom}
                  onChange={(e) => setConvertFrom(e.target.value as 'inches' | 'cm')}
                  className="rounded-sm border border-outline-variant bg-surface px-2 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="inches">in</option>
                  <option value="cm">cm</option>
                </select>
              </div>

              <button
                type="button"
                onClick={convert}
                className="w-full h-9 rounded-md bg-primary-container text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Convert to {convertFrom === 'inches' ? 'cm' : 'inches'}
              </button>

              {convertResult && (
                <div className="rounded-lg bg-background border border-outline-variant p-3">
                  <div className="text-xs text-secondary">Conversion result</div>
                  <div className="text-lg font-mono font-semibold text-on-surface">
                    {convertResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
