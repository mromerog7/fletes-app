// ============================================================
// FletesPro — Supabase Queries (Cotizaciones y Tarifas)
// ============================================================

import type { CotizacionDB, ConfigTarifas } from '@/types/cotizacion';
import { createSupabaseClient } from './client';

const TABLE = 'cotizaciones';

/**
 * Inserta una cotización en Supabase.
 * Retorna el registro creado con su ID generado por la BD.
 *
 * @throws Error si la inserción falla
 */
export async function guardarCotizacion(
  datos: Omit<CotizacionDB, 'id' | 'created_at'>
): Promise<CotizacionDB> {
  const supabase = createSupabaseClient();

  // 1. Buscar o registrar al cliente en la tabla 'clientes'
  let clienteId: string | null = null;
  if (datos.cliente_tel) {
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefono', datos.cliente_tel)
      .limit(1)
      .maybeSingle();

    if (clienteExistente) {
      clienteId = clienteExistente.id;
    }
  }

  if (!clienteId) {
    // Insertar nuevo cliente
    const { data: nuevoCliente, error: errorCrearCliente } = await supabase
      .from('clientes')
      .insert([
        {
          nombre: datos.cliente_nombre,
          telefono: datos.cliente_tel,
          empresa: datos.cliente_empresa,
        }
      ])
      .select('id')
      .single();

    if (errorCrearCliente) {
      console.error('[Supabase] Error al registrar cliente:', errorCrearCliente);
      throw new Error(`Error al registrar cliente: ${errorCrearCliente.message}`);
    }
    clienteId = nuevoCliente.id;
  } else {
    // Actualizar datos de contacto y empresa si cambiaron
    await supabase
      .from('clientes')
      .update({
        nombre: datos.cliente_nombre,
        empresa: datos.cliente_empresa,
      })
      .eq('id', clienteId);
  }

  // 2. Insertar la cotización en 'cotizaciones' mapeando a tus columnas reales
  const { data, error } = await supabase
    .from('cotizaciones')
    .insert([
      {
        cliente_id: clienteId,
        direccion_origen: datos.origen_texto,
        direccion_destino: datos.destino_texto,
        distancia_km: datos.distancia_km,
        tarifa_base: datos.banderazo,
        costo_por_km: datos.costo_km,
        numero_ayudantes: datos.ayudantes,
        costo_maniobras: datos.ayudantes * datos.costo_ayudante,
        zona_dificil: datos.dificil_acceso,
        total_estimado: datos.total,
        estado: 'pendiente',
        notas: datos.notas,
        duracion_texto: datos.duracion_texto,
        webhook_enviado: false,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error al guardar cotización:', error);
    throw new Error(`Error al guardar cotización: ${error.message}`);
  }

  // Retornar en el formato de interfaz CotizacionDB para compatibilidad
  return {
    id: data.id,
    cliente_nombre: datos.cliente_nombre,
    cliente_tel: datos.cliente_tel,
    cliente_empresa: datos.cliente_empresa,
    origen_texto: data.direccion_origen,
    destino_texto: data.direccion_destino,
    origen_lat: datos.origen_lat,
    origen_lng: datos.origen_lng,
    destino_lat: datos.destino_lat,
    destino_lng: datos.destino_lng,
    distancia_km: Number(data.distancia_km),
    duracion_texto: data.duracion_texto,
    ayudantes: data.numero_ayudantes,
    dificil_acceso: data.zona_dificil,
    banderazo: Number(data.tarifa_base),
    costo_km: Number(data.costo_por_km),
    costo_ayudante: datos.costo_ayudante,
    subtotal: datos.subtotal,
    recargo_da: datos.recargo_da,
    total: Number(data.total_estimado),
    notas: data.notas,
    status: 'borrador',
    webhook_enviado: data.webhook_enviado,
  };
}

/**
 * Marca una cotización como "webhook enviado".
 * Llamar después de hacer el POST al webhook de n8n.
 */
export async function marcarWebhookEnviado(cotizacionId: string): Promise<void> {
  const supabase = createSupabaseClient();

  const { error } = await supabase
    .from(TABLE)
    .update({ webhook_enviado: true })
    .eq('id', cotizacionId);

  if (error) {
    console.error('[Supabase] Error al marcar webhook:', error);
    // No re-throw — fallo no-crítico
  }
}

/**
 * Obtiene las cotizaciones recientes (últimas 50).
 * Preparado para futuro módulo de historial.
 */
export async function getCotizacionesRecientes(): Promise<CotizacionDB[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Supabase] Error al obtener cotizaciones:', error);
    return [];
  }

  return (data ?? []) as CotizacionDB[];
}

/**
 * Obtiene las tarifas activas de Supabase.
 * Si no hay, o falla, retorna las tarifas por defecto.
 */
export async function getTarifasActivas(): Promise<ConfigTarifas> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('tarifas')
    .select('*')
    .eq('activa', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.warn('[Supabase] No se encontraron tarifas activas, usando default:', error);
    return {
      banderazo: 450,
      costoPorKm: 15.0,
      costoAyudante: 300,
      multiplicadorDA: 0.20,
    };
  }

  return {
    banderazo: Number(data.banderazo),
    costoPorKm: Number(data.costo_km),
    costoAyudante: Number(data.costo_ayudante),
    multiplicadorDA: Number(data.multiplicador_da),
  };
}

/**
 * Guarda una nueva tarifa activa en Supabase y desactiva las anteriores.
 */
export async function actualizarTarifas(tarifas: ConfigTarifas): Promise<void> {
  const supabase = createSupabaseClient();

  // 1. Desactivar tarifas activas existentes
  await supabase
    .from('tarifas')
    .update({ activa: false })
    .eq('activa', true);

  // 2. Insertar nueva tarifa activa
  const { error } = await supabase
    .from('tarifas')
    .insert([
      {
        banderazo: tarifas.banderazo,
        costo_km: tarifas.costoPorKm,
        costo_ayudante: tarifas.costoAyudante,
        multiplicador_da: tarifas.multiplicadorDA,
        activa: true,
        notas: `Actualizado por operador el ${new Date().toLocaleDateString('es-MX')}`
      }
    ]);

  if (error) {
    console.error('[Supabase] Error al guardar nuevas tarifas:', error);
    throw new Error(`Error al actualizar tarifas: ${error.message}`);
  }
}
