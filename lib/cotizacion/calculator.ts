// ============================================================
// FletesPro — Motor de Cálculo de Cotización (Puro)
// Sin side-effects, testeable de forma aislada.
// ============================================================

import type { ConfigTarifas, ResultadoCotizacion } from '@/types/cotizacion';

/**
 * Tarifas por defecto hardcodeadas.
 * En fases futuras, estas vendrán de la tabla `tarifas` en Supabase.
 */
export const TARIFAS_DEFAULT: ConfigTarifas = {
  banderazo: 450,        // MXN — Tarifa base (banderazo)
  costoPorKm: 15.0,      // MXN por kilómetro
  costoAyudante: 300,    // MXN por ayudante de maniobras
  multiplicadorDA: 0.20, // 20% de recargo por zona de difícil acceso
};

/**
 * Calcula el desglose y total de una cotización.
 *
 * Fórmula:
 *   subtotal = banderazo + (distanciaKm × costoPorKm) + (ayudantes × costoAyudante)
 *   recargoDA = dificilAcceso ? subtotal × multiplicadorDA : 0
 *   total = subtotal + recargoDA
 *
 * @param distanciaKm  Kilómetros obtenidos de Google Distance Matrix API
 * @param ayudantes    Número de ayudantes de maniobras (0–5)
 * @param dificilAcceso ¿Aplica recargo de zona de difícil acceso?
 * @param tarifas      Configuración de tarifas (usa TARIFAS_DEFAULT si no se provee)
 */
export function calcularCotizacion(
  distanciaKm: number,
  ayudantes: number,
  dificilAcceso: boolean,
  tarifas: ConfigTarifas = TARIFAS_DEFAULT
): ResultadoCotizacion {
  const { banderazo, costoPorKm, costoAyudante, multiplicadorDA } = tarifas;

  const subtotalKm = distanciaKm * costoPorKm;
  const subtotalAyudantes = ayudantes * costoAyudante;
  const subtotal = banderazo + subtotalKm + subtotalAyudantes;
  const recargoDA = dificilAcceso ? subtotal * multiplicadorDA : 0;
  const total = subtotal + recargoDA;

  return {
    banderazo,
    subtotalKm,
    subtotalAyudantes,
    subtotal,
    recargoDA,
    total,
    // Datos de referencia
    distanciaKm,
    ayudantes,
    dificilAcceso,
  };
}

/**
 * Formatea un valor monetario en pesos mexicanos.
 * Ej: 1234.5 → "$1,234.50"
 */
export function formatearMXN(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(valor);
}

/**
 * Redondea kilómetros a 2 decimales para mostrar en UI.
 */
export function formatearKm(km: number): string {
  return `${km.toFixed(1)} km`;
}
