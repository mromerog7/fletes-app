// ============================================================
// FletesPro — Google Maps API Loader (Nueva API funcional)
// @googlemaps/js-api-loader v1.16+ usa setOptions + importLibrary.
// ============================================================
// ⚠️ CLAVE DE API: NEXT_PUBLIC_GOOGLE_MAPS_KEY en .env.local
// ============================================================

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ??
  'AIzaSyCPBg0ZUvvaCWE82009WrTztkOb0n438EM';

let configured = false;
let loadPromise: Promise<void> | null = null;

/**
 * Configura las opciones de la API (solo se aplica una vez).
 */
function configurar() {
  if (configured) return;
  setOptions({
    key: GOOGLE_MAPS_API_KEY,
    v: 'weekly',
    language: 'es',
    region: 'MX',
    libraries: ['maps', 'places', 'routes'],
  });
  configured = true;
}

/**
 * Carga las librerías de Google Maps necesarias (maps + places).
 * Es seguro llamar múltiples veces — devuelve la misma promesa.
 * Tras la resolución, window.google.maps está disponible.
 */
export async function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise;

  configurar();

  loadPromise = Promise.all([
    importLibrary('maps'),
    importLibrary('places'),
    importLibrary('routes'),
  ]).then(() => undefined);

  return loadPromise;
}

/**
 * Verifica si la API ya está disponible en el objeto global window.
 */
export function isGoogleMapsLoaded(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.google !== 'undefined' &&
    typeof window.google.maps !== 'undefined'
  );
}
