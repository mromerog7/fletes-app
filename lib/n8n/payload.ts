// ============================================================
// FletesPro — Payload Builder para n8n Webhook
// ============================================================
// El webhook de n8n recibirá este JSON y generará un PDF de cotización.
//
// ⚠️ URL DEL WEBHOOK: NEXT_PUBLIC_N8N_WEBHOOK_URL en .env.local
// ============================================================

import type { FormCotizacion, ResultadoCotizacion, PayloadN8N } from '@/types/cotizacion';

/**
 * Construye el payload JSON para el webhook de n8n.
 * Este objeto se enviará como POST body al workflow de n8n
 * que se encarga de generar el PDF de cotización.
 *
 * @param form      Estado actual del formulario
 * @param resultado Resultado del motor de cálculo
 * @param id        ID generado por Supabase (null si aún no se guardó)
 */
export function buildN8nPayload(
  form: FormCotizacion,
  resultado: ResultadoCotizacion,
  id: string | null = null
): PayloadN8N {
  return {
    evento: 'cotizacion_creada',
    timestamp: new Date().toISOString(),
    cotizacion_id: id,
    cliente: {
      nombre: form.cliente.nombre,
      telefono: form.cliente.telefono,
      empresa: form.cliente.empresa,
    },
    ruta: {
      origen: form.origen?.textoCompleto ?? '',
      destino: form.destino?.textoCompleto ?? '',
      distancia_km: resultado.distanciaKm,
      duracion: form.distancia?.duracionTexto ?? 'N/A',
    },
    desglose: {
      banderazo: resultado.banderazo,
      costo_km: resultado.subtotalKm / (resultado.distanciaKm || 1),
      km_total: resultado.distanciaKm,
      subtotal_km: resultado.subtotalKm,
      ayudantes: resultado.ayudantes,
      costo_ayudante: resultado.subtotalAyudantes / (resultado.ayudantes || 1),
      subtotal_ayudantes: resultado.subtotalAyudantes,
      dificil_acceso: resultado.dificilAcceso,
      recargo_da: resultado.recargoDA,
      total: resultado.total,
    },
    notas: form.cliente.notas,
  };
}

/**
 * Envía el payload al webhook de n8n via POST.
 * Falla silenciosamente si no hay URL configurada (modo desarrollo).
 *
 * @returns true si el webhook fue enviado, false si no había URL configurada
 * @throws Error si el webhook falla con status HTTP >= 400
 */
export async function enviarWebhookN8n(payload: PayloadN8N): Promise<boolean> {
  // ⚠️ Configurar NEXT_PUBLIC_N8N_WEBHOOK_URL en .env.local
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('[n8n] NEXT_PUBLIC_N8N_WEBHOOK_URL no configurada. Payload (solo consola):', payload);
    return false;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook n8n falló con status: ${response.status}`);
  }

  console.log('[n8n] Webhook enviado exitosamente. ID:', payload.cotizacion_id);
  return true;
}
