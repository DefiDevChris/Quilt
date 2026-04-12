/**
 * Inline UI components for the social feed — brand-compliant replacements for shadcn/ui.
 * All colors come from @/lib/design-system (COLORS, COLORS_HOVER, SHADOW).
 * Radius: buttons/pills = rounded-full, inputs/cards = rounded-lg.
 */

import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import * as React from 'react';
import { COLORS, COLORS_HOVER, SHADOW } from '@/lib/design-system';

// ─── Button ───────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
}

export function Button({
  variant = 'default',
  size = 'default',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 outline-none';
  const radius = 'rounded-full';

  const variantClasses = {
    default: `bg-[${COLORS.primary}] text-white hover:bg-[${COLORS_HOVER.primary}]`,
    ghost: 'bg-transparent hover:bg-[var(--color-bg)]',
    outline: `bg-transparent border border-[${COLORS.border}] text-[${COLORS.text}] hover:bg-[var(--color-bg)]`,
  };

  const sizeClasses = {
    default: 'h-9 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-sm',
    icon: 'size-9',
  };

  const classes = [base, radius, variantClasses[variant], sizeClasses[size], className].filter(Boolean).join(' ');

  return <button className={classes} disabled={disabled} {...props} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: React.ReactNode;
}

export function Avatar({ src, alt = '', fallback, className = '', ...props }: AvatarProps) {
  const base = 'relative flex overflow-hidden rounded-full';
  const classes = [base, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {src ? (
        <img src={src} alt={alt} className="aspect-square size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center bg-[var(--color-bg)]">{fallback}</div>
      )}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const base = `flex h-9 w-full min-w-0 rounded-full border border-[${COLORS.border}] bg-transparent px-3 py-1 text-sm text-[${COLORS.text}] placeholder:text-[${COLORS.textDim}] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[${COLORS.primary}]/20 disabled:pointer-events-none disabled:opacity-50`;
  const classes = [base, className].filter(Boolean).join(' ');
  return <input className={classes} {...props} />;
}

// ─── Textarea ─────────────────────────────────────────────────────────

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const base = `flex min-h-16 w-full rounded-lg border border-[${COLORS.border}] bg-transparent px-3 py-2 text-sm text-[${COLORS.text}] placeholder:text-[${COLORS.textDim}] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[${COLORS.primary}]/20 disabled:pointer-events-none disabled:opacity-50 resize-none`;
  const classes = [base, className].filter(Boolean).join(' ');
  return <textarea className={classes} {...props} />;
}

// ─── Dropdown Menu ────────────────────────────────────────────────────

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

const useDropdown = () => {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error('Dropdown components must be used within DropdownMenu');
  return ctx;
};

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return <DropdownContext.Provider value={{ isOpen, setIsOpen }}>{children}</DropdownContext.Provider>;
}

export function DropdownMenuTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useDropdown();

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        child.props.onClick?.(e);
        setIsOpen(!isOpen);
      },
    });
  }

  return <div onClick={() => setIsOpen(!isOpen)}>{children}</div>;
}

export function DropdownMenuContent({
  align = 'start',
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' }) {
  const { isOpen, setIsOpen } = useDropdown();
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const alignClass = align === 'end' ? 'right-0' : 'left-0';
  const classes = [`absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-lg border border-[${COLORS.border}] bg-[${COLORS.surface}] p-2 shadow-[${SHADOW.brand}]`, alignClass, className].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
}

export function DropdownMenuItem({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const classes = [`cursor-pointer rounded-full px-3 py-2.5 text-sm text-[${COLORS.text}] hover:bg-[${COLORS.bg}] transition-colors duration-150`, className].filter(Boolean).join(' ');
  return <div className={classes} {...props} />;
}

export function DropdownMenuLabel({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const classes = [`px-3 py-2 text-sm font-semibold text-[${COLORS.text}]`, className].filter(Boolean).join(' ');
  return <div className={classes} {...props} />;
}

export function DropdownMenuSeparator({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const classes = [`mx-0 my-1 h-px bg-[${COLORS.border}]`, className].filter(Boolean).join(' ');
  return <div className={classes} {...props} />;
}
