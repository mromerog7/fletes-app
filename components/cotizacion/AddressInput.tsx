'use client';

import { forwardRef, useId } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressInputProps {
  label: string;
  placeholder: string;
  /** Color del ícono de pin: 'origin' (azul) | 'destination' (ámbar) */
  variant?: 'origin' | 'destination';
  loading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * Input de dirección con Places Autocomplete.
 * La ref del input es expuesta para que el hook useGoogleMaps
 * pueda adjuntar el Autocomplete de Google.
 */
export const AddressInput = forwardRef<HTMLInputElement, AddressInputProps>(
  function AddressInput(
    { label, placeholder, variant = 'origin', loading, error, className },
    ref
  ) {
    const id = useId();

    const pinColor =
      variant === 'origin'
        ? 'text-blue-600'
        : 'text-neutral-900';

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <label
          htmlFor={id}
          className="text-[11px] font-bold tracking-wider uppercase text-neutral-500"
        >
          {label}
        </label>
        <div className="relative">
          {/* Ícono izquierdo */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {loading ? (
              <Loader2 className="size-4 text-neutral-800 animate-spin" />
            ) : (
              <MapPin className={cn('size-4', pinColor)} />
            )}
          </div>

          <input
            ref={ref}
            id={id}
            type="text"
            placeholder={placeholder}
            autoComplete="off"
            className={cn(
              'input-field w-full pl-11 pr-4',
              'text-sm',
              error && 'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
            )}
            aria-label={label}
            aria-invalid={!!error}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-red-400 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
