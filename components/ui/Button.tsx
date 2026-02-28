'use client';

import * as React from 'react';

import { cn } from '@/lib/cn';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 focus-visible:ring-zinc-900/30',
        variant === 'secondary' &&
          'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:ring-zinc-900/20',
        variant === 'ghost' &&
          'bg-transparent text-zinc-900 hover:bg-zinc-100 focus-visible:ring-zinc-900/20',
        className,
      )}
      {...props}
    />
  );
}

