import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import { CotizacionForm } from '@/components/cotizacion/CotizacionForm';

export const metadata: Metadata = {
  title: 'Nueva Cotización',
  description: 'Calcula el costo exacto de tu flete con distancia real de Google Maps.',
};

/**
 * Página del Módulo de Cotización Inteligente.
 * Layout responsivo:
 * - Mobile: columna única (form vertical)
 * - Desktop (lg+): 2 columnas — formulario izquierda, mapa+desglose derecha sticky
 */
export default function CotizacionPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        {/* Título de sección */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-2">
            Módulo de Cotización
          </p>
          <h1
            className="text-2xl sm:text-3xl font-bold text-black tracking-tight"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            Nueva Cotización
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Ingresa la ruta para calcular el costo automáticamente.
          </p>
        </div>

        {/*
          Layout principal.
          En mobile: todo en columna única (CotizacionForm maneja el orden internamente).
          En desktop (lg+): no se divide porque CotizacionForm ya tiene todo integrado.
          El mapa aparece embebido en el flujo del formulario.
        */}
        <CotizacionForm />
      </main>

      {/* Footer minimal */}
      <footer className="py-4 text-center border-t border-neutral-200">
        <p className="text-[11px] text-neutral-400">
          FletesPro · Logística Inteligente
        </p>
      </footer>
    </div>
  );
}
