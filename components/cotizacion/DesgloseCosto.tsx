'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DollarSign,
  Users,
  AlertTriangle,
  Calculator,
  Minus,
  Plus,
  ChevronRight,
  Settings,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatearMXN } from '@/lib/cotizacion/calculator';
import type { ResultadoCotizacion, ConfigTarifas } from '@/types/cotizacion';

interface DesgloseCostoProps {
  resultado: ResultadoCotizacion | null;
  ayudantes: number;
  dificilAcceso: boolean;
  onAyudantesChange: (n: number) => void;
  onDificilAccesoToggle: () => void;
  tarifas: ConfigTarifas;
  cambiarTarifas: (nuevasTarifas: ConfigTarifas) => Promise<void>;
  className?: string;
}

interface LineaDesglose {
  label: string;
  valor: number;
  detalle?: string;
  color?: string;
}

/**
 * Panel del desglose de costos.
 * Rediseñado con el estilo Uber: blanco limpio, contrastes negros y grises.
 */
export function DesgloseCosto({
  resultado,
  ayudantes,
  dificilAcceso,
  onAyudantesChange,
  onDificilAccesoToggle,
  tarifas,
  cambiarTarifas,
  className,
}: DesgloseCostoProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevTotalRef = useRef<number | null>(null);

  // Estados para modo edición
  const [editando, setEditando] = useState(false);
  const [banderazoInput, setBanderazoInput] = useState(tarifas.banderazo);
  const [costoKmInput, setCostoKmInput] = useState(tarifas.costoPorKm);
  const [costoAyudanteInput, setCostoAyudanteInput] = useState(tarifas.costoAyudante);
  const [multiplicadorDAInput, setMultiplicadorDAInput] = useState(Math.round(tarifas.multiplicadorDA * 100));
  const [guardando, setGuardando] = useState(false);

  // Sincronizar inputs si cambian las tarifas desde Supabase
  useEffect(() => {
    setBanderazoInput(tarifas.banderazo);
    setCostoKmInput(tarifas.costoPorKm);
    setCostoAyudanteInput(tarifas.costoAyudante);
    setMultiplicadorDAInput(Math.round(tarifas.multiplicadorDA * 100));
  }, [tarifas]);

  // Anima el panel cada vez que el total cambia
  useEffect(() => {
    if (!resultado || !panelRef.current) return;
    if (prevTotalRef.current === resultado.total) return;

    panelRef.current.classList.remove('animate-scale-in');
    void panelRef.current.offsetWidth;
    panelRef.current.classList.add('animate-scale-in');

    prevTotalRef.current = resultado.total;
  }, [resultado?.total]);

  // Manejador para guardar tarifas
  const handleGuardarTarifas = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await cambiarTarifas({
        banderazo: Number(banderazoInput),
        costoPorKm: Number(costoKmInput),
        costoAyudante: Number(costoAyudanteInput),
        multiplicadorDA: Number(multiplicadorDAInput) / 100,
      });
      setEditando(false);
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const lineas: LineaDesglose[] = resultado
    ? [
        {
          label: 'Banderazo',
          valor: resultado.banderazo,
          detalle: 'Tarifa base',
        },
        {
          label: `${resultado.distanciaKm.toFixed(1)} km × $${tarifas.costoPorKm}/km`,
          valor: resultado.subtotalKm,
          detalle: 'Kilometraje',
        },
        ...(resultado.ayudantes > 0
          ? [
              {
                label: `${resultado.ayudantes} ayudante${resultado.ayudantes > 1 ? 's' : ''} × $${tarifas.costoAyudante}`,
                valor: resultado.subtotalAyudantes,
                detalle: 'Maniobras',
              },
            ]
          : []),
        ...(resultado.dificilAcceso && resultado.recargoDA > 0
          ? [
              {
                label: `Recargo difícil acceso (+${Math.round(tarifas.multiplicadorDA * 100)}%)`,
                valor: resultado.recargoDA,
                detalle: 'Zona especial',
                color: 'text-orange-600 font-semibold',
              },
            ]
          : []),
      ]
    : [];

  // ── Vista de Edición (Ajustes) ──────────────────────────────
  if (editando) {
    return (
      <div
        ref={panelRef}
        className={cn(
          'glass rounded-2xl overflow-hidden animate-scale-in border border-neutral-200',
          className
        )}
      >
        <div className="px-5 pt-5 pb-3 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-neutral-100 flex items-center justify-center">
              <Settings className="size-4 text-neutral-800" />
            </div>
            <h2
              className="text-sm font-bold text-black font-sora"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              Ajustar Costos Fijos
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setEditando(false)}
            disabled={guardando}
            className="size-7 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-100 transition-all disabled:opacity-50"
            aria-label="Cancelar edición"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleGuardarTarifas} className="p-5 flex flex-col gap-4">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Modifica las tarifas base del sistema. Los cambios afectarán de inmediato a los nuevos cálculos y se guardarán en Supabase.
          </p>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Input Banderazo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-500">Banderazo ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-500">$</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={banderazoInput}
                  onChange={(e) => setBanderazoInput(Number(e.target.value))}
                  disabled={guardando}
                  className="w-full bg-[#F3F3F3] border border-transparent focus:border-black rounded-xl py-2 pl-7 pr-3 text-xs text-black outline-none transition-all font-data"
                  required
                />
              </div>
            </div>

            {/* Input Costo Km */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-500">Costo por Km ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-500">$</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={costoKmInput}
                  onChange={(e) => setCostoKmInput(Number(e.target.value))}
                  disabled={guardando}
                  className="w-full bg-[#F3F3F3] border border-transparent focus:border-black rounded-xl py-2 pl-7 pr-3 text-xs text-black outline-none transition-all font-data"
                  required
                />
              </div>
            </div>

            {/* Input Costo Ayudante */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-500">Ayudante ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-500">$</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={costoAyudanteInput}
                  onChange={(e) => setCostoAyudanteInput(Number(e.target.value))}
                  disabled={guardando}
                  className="w-full bg-[#F3F3F3] border border-transparent focus:border-black rounded-xl py-2 pl-7 pr-3 text-xs text-black outline-none transition-all font-data"
                  required
                />
              </div>
            </div>

            {/* Input Difícil Acceso */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-500">Difícil Acceso (%)</label>
              <div className="relative">
                <span className="absolute right-3 top-2.5 text-xs text-neutral-500">%</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={multiplicadorDAInput}
                  onChange={(e) => setMultiplicadorDAInput(Number(e.target.value))}
                  disabled={guardando}
                  className="w-full bg-[#F3F3F3] border border-transparent focus:border-black rounded-xl py-2 pl-3 pr-7 text-xs text-black outline-none transition-all font-data"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={() => setEditando(false)}
              disabled={guardando}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 disabled:opacity-50 text-black rounded-xl py-2.5 text-xs font-bold transition-all active:scale-98"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              {guardando ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Vista Normal ───────────────────────────────────────────
  return (
    <div
      ref={panelRef}
      className={cn(
        'glass rounded-2xl overflow-hidden',
        resultado && 'amber-glow',
        className
      )}
    >
      {/* Header del panel */}
      <div className="px-5 pt-5 pb-3 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-neutral-100 flex items-center justify-center">
              <Calculator className="size-4 text-black" />
            </div>
            <h2
              className="text-sm font-bold text-black"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              Desglose de Cotización
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setEditando(true)}
            className="size-7 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 transition-all"
            aria-label="Editar costos fijos"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Controles: Ayudantes y Difícil Acceso */}
        <div className="flex flex-col gap-3">
          {/* Ayudantes */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="size-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Ayudantes</p>
                <p className="text-[10px] font-medium text-neutral-500">
                  ${tarifas.costoAyudante}/c.u. · Maniobras
                </p>
              </div>
            </div>
            {/* Spinner de cantidad */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAyudantesChange(ayudantes - 1)}
                disabled={ayudantes <= 0}
                className="size-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                aria-label="Quitar ayudante"
              >
                <Minus className="size-3.5" />
              </button>
              <span
                className="font-data text-lg font-bold text-black w-6 text-center tabular-nums"
                aria-live="polite"
                aria-label={`${ayudantes} ayudantes`}
              >
                {ayudantes}
              </span>
              <button
                type="button"
                onClick={() => onAyudantesChange(ayudantes + 1)}
                disabled={ayudantes >= 5}
                className="size-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                aria-label="Agregar ayudante"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Difícil Acceso Toggle */}
          <button
            type="button"
            onClick={onDificilAccesoToggle}
            className={cn(
              'flex items-center justify-between py-3 px-4 rounded-xl border transition-all duration-200 w-full text-left',
              dificilAcceso
                ? 'bg-orange-50 border-orange-200'
                : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
            )}
            aria-pressed={dificilAcceso}
            aria-label="Activar recargo por zona de difícil acceso"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'size-7 rounded-lg flex items-center justify-center transition-colors',
                  dificilAcceso ? 'bg-orange-100' : 'bg-neutral-100'
                )}
              >
                <AlertTriangle
                  className={cn(
                    'size-3.5 transition-colors',
                    dificilAcceso ? 'text-orange-600' : 'text-neutral-500'
                  )}
                />
              </div>
              <div>
                <p
                  className={cn(
                    'text-sm font-bold transition-colors',
                    dificilAcceso ? 'text-orange-800' : 'text-black'
                  )}
                >
                  Difícil Acceso
                </p>
                <p className="text-[10px] font-medium text-neutral-500">
                  +{Math.round(tarifas.multiplicadorDA * 100)}% al subtotal · Zona especial
                </p>
              </div>
            </div>
            {/* Toggle visual */}
            <div
              className={cn(
                'relative w-10 h-5 rounded-full transition-colors duration-200',
                dificilAcceso ? 'bg-black' : 'bg-neutral-200'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                  dificilAcceso ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </div>
          </button>
        </div>

        {/* Desglose de líneas */}
        {resultado ? (
          <div className="flex flex-col gap-1 animate-slide-up">
            <div className="h-px bg-neutral-200 mb-2" />

            {lineas.map((linea, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight className="size-3 text-neutral-400 shrink-0" />
                  <div>
                    <p className={cn('text-xs font-semibold', linea.color ?? 'text-neutral-700')}>
                      {linea.label}
                    </p>
                    {linea.detalle && (
                      <p className="text-[10px] text-neutral-500">{linea.detalle}</p>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    'font-data text-sm font-bold tabular-nums',
                    linea.color ?? 'text-black'
                  )}
                >
                  {formatearMXN(linea.valor)}
                </span>
              </div>
            ))}

            {/* Subtotal */}
            <div className="h-px bg-neutral-200 my-2" />
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-semibold text-neutral-500">Subtotal</span>
              <span className="font-data text-sm font-bold text-black tabular-nums">
                {formatearMXN(resultado.subtotal)}
              </span>
            </div>

            {/* Total */}
            <div className="mt-3 pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold tracking-widest uppercase text-neutral-400">
                    Total Cotización
                  </p>
                  {resultado.dificilAcceso && (
                    <p className="text-[10px] font-semibold text-orange-600 mt-0.5">
                      Incluye recargo difícil acceso
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className="font-data text-3xl font-bold text-black tabular-nums"
                    aria-label={`Total: ${formatearMXN(resultado.total)}`}
                  >
                    {formatearMXN(resultado.total)}
                  </span>
                  <p className="text-[10px] font-bold text-neutral-500">MXN</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Estado vacío del desglose */
          <div className="py-6 flex flex-col items-center gap-3 text-center">
            <div className="size-10 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center">
              <DollarSign className="size-5 text-neutral-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-700 font-bold">
                Ingresa la ruta para calcular
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                El costo se calcula automáticamente
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
