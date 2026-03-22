'use client';

import { cn } from '@/lib/utils';

interface BapXLogoProps {
  size?: number;
  variant?: 'symbol' | 'logomark';
  className?: string;
}

export function BapXLogo({ size = 24, variant = 'symbol', className }: BapXLogoProps) {
  // For logomark variant, use logomark-white.svg
  if (variant === 'logomark') {
    return (
      <img
        src="/logomark-white.svg"
        alt="bapX"
        className={cn('flex-shrink-0', className)}
        style={{ height: `${size}px`, width: 'auto' }}
        suppressHydrationWarning
      />
    );
  }

  // Default symbol variant - use favicon SVG
  return (
    <img
      src="/bapx-favicon.svg"
      alt="bapX"
      className={cn('flex-shrink-0', className)}
      style={{ width: `${size}px`, height: `${size}px` }}
      suppressHydrationWarning
    />
  );
}
