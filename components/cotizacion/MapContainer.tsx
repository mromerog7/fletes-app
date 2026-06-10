'use client';

import { MapPin, Loader2, MapPinOff, Clock, Ruler, Navigation, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResultadoDistancia, DireccionGoogle } from '@/types/cotizacion';
import type { MapMode } from '@/hooks/useGoogleMaps';

interface MapContainerProps {
  mapDivRef: React.RefObject<HTMLDivElement | null>;
  distancia: ResultadoDistancia | null;
  origen: DireccionGoogle | null;
  destino: DireccionGoogle | null;
  cargandoRuta: boolean;
  cargandoGeocode: boolean;
  error: string | null;
  mapMode: MapMode;
  onSetMapMode: (mode: MapMode) => void;
  className?: string;
}

/**
 * Contenedor del mapa con:
 * - Botones de selección de origen/destino por click en el mapa (Estilo Uber)
 * - Badges flotantes de distancia y tiempo
 * - Estado vacío educativo
 * - Indicador de modo activo
 */
export function MapContainer({
  mapDivRef,
  distancia,
  origen,
  destino,
  cargandoRuta,
  cargandoGeocode,
  error,
  mapMode,
  onSetMapMode,
  className,
}: MapContainerProps) {
  const mostrarMapa = origen !== null || destino !== null;
  const modoActivo = mapMode !== 'view';

  return (
    <div
      className={cn(
        'relative glass rounded-2xl overflow-hidden',
        'border border-neutral-200',
        modoActivo && 'ring-2 ring-black',
        className
      )}
    >
      {/* ── Barra de herramientas del mapa ───────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 flex items-center justify-between gap-2">
        {/* Botones de modo */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSetMapMode(mapMode === 'set-origin' ? 'view' : 'set-origin')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border',
              mapMode === 'set-origin'
                ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-black'
            )}
            title="Haz click en el mapa para fijar el origen"
            aria-pressed={mapMode === 'set-origin'}
          >
            <MapPin
              className={cn(
                'size-3.5',
                mapMode === 'set-origin' ? 'text-blue-600' : 'text-blue-600/80'
              )}
            />
            {mapMode === 'set-origin' ? (
              <span className="text-blue-700">Click para origen</span>
            ) : (
              <span>{origen ? 'Cambiar origen' : 'Fijar origen'}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSetMapMode(mapMode === 'set-destination' ? 'view' : 'set-destination')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border',
              mapMode === 'set-destination'
                ? 'bg-neutral-100 border-neutral-900 text-neutral-900 shadow-sm'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-black'
            )}
            title="Haz click en el mapa para fijar el destino"
            aria-pressed={mapMode === 'set-destination'}
          >
            <MapPin
              className={cn(
                'size-3.5',
                mapMode === 'set-destination' ? 'text-neutral-900' : 'text-neutral-900/80'
              )}
            />
            {mapMode === 'set-destination' ? (
              <span className="text-neutral-900">Click para destino</span>
            ) : (
              <span>{destino ? 'Cambiar destino' : 'Fijar destino'}</span>
            )}
          </button>
        </div>

        {/* Indicador de modo activo */}
        {modoActivo && (
          <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 flex items-center gap-1.5 shadow-sm">
            <span
              className={cn(
                'size-2 rounded-full animate-pulse',
                mapMode === 'set-origin' ? 'bg-blue-600' : 'bg-neutral-900'
              )}
            />
            <span className="text-[11px] font-semibold text-neutral-700">
              Haz click en el mapa...
            </span>
          </div>
        )}
      </div>

      {/* ── Badge de distancia y tiempo ───────────────────────── */}
      {distancia && !cargandoRuta && (
        <div className="absolute bottom-3 left-3 z-10 flex gap-2 animate-slide-up">
          <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-md">
            <Ruler className="size-3.5 text-neutral-800 shrink-0" />
            <span className="font-data text-sm font-semibold text-neutral-900">
              {distancia.distanciaTexto}
            </span>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-md">
            <Clock className="size-3.5 text-blue-600 shrink-0" />
            <span className="font-data text-sm font-semibold text-neutral-900">
              {distancia.duracionTexto}
            </span>
          </div>
        </div>
      )}

      {/* Hint de marcadores arrastrables */}
      {mostrarMapa && !cargandoRuta && (
        <div className="absolute bottom-3 right-3 z-10">
          <div className="bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
            <Move className="size-3 text-neutral-500" />
            <span className="text-[10px] font-medium text-neutral-600">Arrastra los pines</span>
          </div>
        </div>
      )}

      {/* ── Overlay de geocodificando ─────────────────────────── */}
      {cargandoGeocode && (
        <div className="absolute inset-0 z-20 flex items-end justify-center pb-12 pointer-events-none">
          <div className="bg-white border border-neutral-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-md">
            <Loader2 className="size-4 text-neutral-800 animate-spin" />
            <span className="text-xs text-neutral-800 font-semibold">Obteniendo dirección...</span>
          </div>
        </div>
      )}

      {/* ── Estado de carga de ruta ───────────────────────────── */}
      {cargandoRuta && !cargandoGeocode && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="relative size-12">
              <div className="absolute inset-0 rounded-full border-2 border-neutral-200" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-black animate-spin" />
              <Navigation className="absolute inset-0 m-auto size-5 text-black" />
            </div>
            <p className="text-sm text-neutral-700 font-semibold">Calculando distancia...</p>
          </div>
        </div>
      )}

      {/* ── Estado de error ───────────────────────────────────── */}
      {error && !cargandoRuta && (
        <div className="absolute bottom-14 left-3 right-3 z-10">
          <div className="bg-white border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 shadow-md">
            <MapPinOff className="size-4 text-red-600 shrink-0" />
            <p className="text-xs font-medium text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* ── Estado vacío ──────────────────────────────────────── */}
      {!mostrarMapa && !cargandoRuta && !modoActivo && (
        <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
          <div className="text-center flex flex-col items-center gap-4 max-w-xs animate-scale-in">
            <div className="relative size-20 flex items-center justify-center">
              <div className="absolute size-20 rounded-full bg-blue-500/5 border border-blue-500/10 animate-pulse" />
              <div className="absolute size-14 rounded-full bg-neutral-500/5 border border-neutral-200" />
              <Navigation className="size-8 text-neutral-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-800 mb-1">
                Ingresa la ruta o toca el mapa
              </p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Escribe las direcciones arriba, o usa los botones para fijar puntos directamente en el mapa
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="size-2 rounded-full bg-blue-500" />
              <div className="flex gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="size-1 rounded-full bg-neutral-200"
                    style={{ opacity: 1 - i * 0.12 }}
                  />
                ))}
              </div>
              <div className="size-2 rounded-full bg-neutral-900" />
            </div>
          </div>
        </div>
      )}

      {/* Instrucción mientras está activo el modo de selección */}
      {modoActivo && !mostrarMapa && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/10">
          <div className="text-center bg-white/95 border border-neutral-200 shadow-md rounded-2xl px-5 py-4">
            <div
              className={cn(
                'size-12 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse',
                mapMode === 'set-origin' ? 'bg-blue-100' : 'bg-neutral-100'
              )}
            >
              <MapPin
                className={cn(
                  'size-6',
                  mapMode === 'set-origin' ? 'text-blue-600' : 'text-neutral-900'
                )}
              />
            </div>
            <p className="text-sm font-bold text-neutral-800">
              {mapMode === 'set-origin' ? 'Haz click para fijar el origen' : 'Haz click para fijar el destino'}
            </p>
          </div>
        </div>
      )}

      {/* El div del mapa — siempre presente para que Google Maps lo use */}
      <div
        ref={mapDivRef}
        className="w-full h-full bg-[#EEEEEE]"
        style={{
          cursor: modoActivo ? 'crosshair' : 'default',
        }}
        aria-label="Mapa de ruta"
        role="img"
      />
    </div>
  );
}
