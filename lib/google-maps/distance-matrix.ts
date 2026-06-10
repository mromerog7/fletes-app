// ============================================================
// FletesPro — Distance Matrix API Service
// Solo usa Distance Matrix API (NO requiere Directions API).
// ============================================================

import type { DireccionGoogle, ResultadoDistancia } from '@/types/cotizacion';

/**
 * Obtiene distancia y duración entre dos puntos usando
 * la Google Distance Matrix API (modo conducción).
 *
 * NOTA: Requiere que "Distance Matrix API" esté habilitada
 * en Google Cloud Console (es diferente a "Directions API").
 *
 * @throws Error si la API no está habilitada o la ruta no existe
 */
export async function calcularDistancia(
  origen: DireccionGoogle,
  destino: DireccionGoogle
): Promise<ResultadoDistancia> {
  if (!window.google?.maps?.DistanceMatrixService) {
    throw new Error('Google Maps no está cargado. Llama a loadGoogleMaps() primero.');
  }

  const service = new window.google.maps.DistanceMatrixService();

  return new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: [{ lat: origen.lat, lng: origen.lng }],
        destinations: [{ lat: destino.lat, lng: destino.lng }],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
        region: 'MX',
        language: 'es',
      },
      (response, status) => {
        if (status !== 'OK' || !response) {
          reject(new Error(`Distance Matrix falló: ${status}`));
          return;
        }

        const element = response.rows[0]?.elements[0];

        if (!element || element.status !== 'OK') {
          reject(new Error(`Ruta no encontrada: ${element?.status ?? 'UNKNOWN'}`));
          return;
        }

        const distanciaMetros = element.distance.value;
        const distanciaKm = Math.round((distanciaMetros / 1000) * 10) / 10;

        resolve({
          distanciaKm,
          distanciaTexto: element.distance.text,
          duracionTexto: element.duration.text,
          duracionSegundos: element.duration.value,
        });
      }
    );
  });
}
