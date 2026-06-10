'use client';

import { useId } from 'react';
import { User, Phone, Building2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormCotizacion } from '@/types/cotizacion';

interface ClienteFieldsProps {
  cliente: FormCotizacion['cliente'];
  onChange: (campo: keyof FormCotizacion['cliente'], valor: string) => void;
  className?: string;
}

interface FieldConfig {
  campo: keyof FormCotizacion['cliente'];
  label: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
}

const CAMPOS: FieldConfig[] = [
  {
    campo: 'nombre',
    label: 'Nombre del cliente',
    placeholder: 'Juan Pérez',
    icon: User,
    required: true,
    maxLength: 80,
  },
  {
    campo: 'telefono',
    label: 'Teléfono',
    placeholder: '55 1234 5678',
    icon: Phone,
    type: 'tel',
    required: true,
    inputMode: 'tel',
    maxLength: 15,
  },
  {
    campo: 'empresa',
    label: 'Empresa (opcional)',
    placeholder: 'Nombre de la empresa',
    icon: Building2,
    maxLength: 80,
  },
];

/**
 * Campos de datos del cliente.
 * Diseño compacto pero con inputs grandes para uso en móvil en exteriores.
 */
export function ClienteFields({ cliente, onChange, className }: ClienteFieldsProps) {
  const baseId = useId();

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
        Datos del cliente
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CAMPOS.map(({ campo, label, placeholder, icon: Icon, type = 'text', required, inputMode, maxLength }) => {
          const id = `${baseId}-${campo}`;
          const valor = cliente[campo];
          return (
            <div key={campo} className="flex flex-col gap-1.5">
              <label
                htmlFor={id}
                className="text-xs font-medium text-neutral-500 flex items-center gap-1"
              >
                {label}
                {required && (
                  <span className="text-red-500 text-[10px]">*</span>
                )}
              </label>
              <div className="relative">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  id={id}
                  type={type}
                  inputMode={inputMode}
                  value={valor}
                  onChange={(e) => onChange(campo, e.target.value)}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  required={required}
                  autoComplete={
                    campo === 'nombre' ? 'name' :
                    campo === 'telefono' ? 'tel' :
                    campo === 'empresa' ? 'organization' : 'off'
                  }
                  className="input-field w-full pl-10 pr-4 text-sm"
                  aria-label={label}
                  aria-required={required}
                />
              </div>
            </div>
          );
        })}

        {/* Notas — ocupa todo el ancho */}
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label
            htmlFor={`${baseId}-notas`}
            className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"
          >
            <FileText className="size-3.5" />
            Notas adicionales
          </label>
          <textarea
            id={`${baseId}-notas`}
            value={cliente.notas}
            onChange={(e) => onChange('notas', e.target.value)}
            placeholder="Indicaciones especiales, horario de entrega, referencia del inmueble..."
            rows={3}
            maxLength={500}
            className="input-field w-full px-4 py-3 text-sm resize-none"
            style={{ height: 'auto', minHeight: '5rem' }}
            aria-label="Notas adicionales"
          />
          <span className="text-right text-[10px] text-muted-foreground">
            {cliente.notas.length}/500
          </span>
        </div>
      </div>
    </div>
  );
}
