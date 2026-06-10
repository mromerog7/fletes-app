'use client';
// ============================================================
// FletesPro — Hook: useCotizacion
// Estado central del formulario + cálculo en tiempo real.
// ============================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { calcularCotizacion, TARIFAS_DEFAULT } from '@/lib/cotizacion/calculator';
import { guardarCotizacion, getTarifasActivas, actualizarTarifas } from '@/lib/supabase/queries';
import { buildN8nPayload, enviarWebhookN8n } from '@/lib/n8n/payload';
import type {
  FormCotizacion,
  ResultadoCotizacion,
  EstadoGuardado,
  DireccionGoogle,
  ResultadoDistancia,
  ConfigTarifas,
} from '@/types/cotizacion';

const FORM_INICIAL: FormCotizacion = {
  cliente: {
    nombre: '',
    telefono: '',
    empresa: '',
    notas: '',
  },
  origen: null,
  destino: null,
  distancia: null,
  ayudantes: 0,
  dificilAcceso: false,
  tipoServicio: 'local',
};

interface UseCotizacionReturn {
  form: FormCotizacion;
  resultado: ResultadoCotizacion | null;
  estadoGuardado: EstadoGuardado;
  tarifas: ConfigTarifas;
  cargandoTarifas: boolean;
  // Actualizadores del formulario
  actualizarCliente: (campo: keyof FormCotizacion['cliente'], valor: string) => void;
  setOrigen: (origen: DireccionGoogle | null) => void;
  setDestino: (destino: DireccionGoogle | null) => void;
  setDistancia: (distancia: ResultadoDistancia | null) => void;
  setAyudantes: (n: number) => void;
  toggleDificilAcceso: () => void;
  setTipoServicio: (tipo: FormCotizacion['tipoServicio']) => void;
  // Acciones
  cambiarTarifas: (nuevasTarifas: ConfigTarifas) => Promise<void>;
  guardar: () => Promise<void>;
  limpiar: () => void;
  formularioValido: boolean;
}

export function useCotizacion(): UseCotizacionReturn {
  const [form, setForm] = useState<FormCotizacion>(FORM_INICIAL);
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>('idle');
  const [tarifas, setTarifas] = useState<ConfigTarifas>(TARIFAS_DEFAULT);
  const [cargandoTarifas, setCargandoTarifas] = useState(true);

  // Cargar tarifas activas desde Supabase al montar el componente
  useEffect(() => {
    let activo = true;
    getTarifasActivas().then((data) => {
      if (activo) {
        setTarifas(data);
        setCargandoTarifas(false);
      }
    });
    return () => {
      activo = false;
    };
  }, []);

  // Cálculo en tiempo real — se recalcula solo cuando cambian las dependencias
  const resultado = useMemo<ResultadoCotizacion | null>(() => {
    if (!form.distancia || form.distancia.distanciaKm <= 0) return null;
    return calcularCotizacion(
      form.distancia.distanciaKm,
      form.ayudantes,
      form.dificilAcceso,
      tarifas
    );
  }, [form.distancia, form.ayudantes, form.dificilAcceso, tarifas]);

  // Validación del formulario
  const formularioValido = useMemo(() => {
    return (
      form.cliente.nombre.trim().length >= 2 &&
      form.cliente.telefono.trim().length >= 10 &&
      form.origen !== null &&
      form.destino !== null &&
      form.distancia !== null &&
      resultado !== null
    );
  }, [form.cliente.nombre, form.cliente.telefono, form.origen, form.destino, form.distancia, resultado]);

  // Actualizadores
  const actualizarCliente = useCallback(
    (campo: keyof FormCotizacion['cliente'], valor: string) => {
      setForm((prev) => ({
        ...prev,
        cliente: { ...prev.cliente, [campo]: valor },
      }));
    },
    []
  );

  const setOrigen = useCallback((origen: DireccionGoogle | null) => {
    setForm((prev) => ({ ...prev, origen }));
  }, []);

  const setDestino = useCallback((destino: DireccionGoogle | null) => {
    setForm((prev) => ({ ...prev, destino }));
  }, []);

  const setDistancia = useCallback((distancia: ResultadoDistancia | null) => {
    setForm((prev) => ({ ...prev, distancia }));
  }, []);

  const setAyudantes = useCallback((n: number) => {
    const clamp = Math.max(0, Math.min(5, n));
    setForm((prev) => ({ ...prev, ayudantes: clamp }));
  }, []);

  const toggleDificilAcceso = useCallback(() => {
    setForm((prev) => ({ ...prev, dificilAcceso: !prev.dificilAcceso }));
  }, []);

  const setTipoServicio = useCallback((tipo: FormCotizacion['tipoServicio']) => {
    setForm((prev) => ({ ...prev, tipoServicio: tipo }));
  }, []);

  // Cambiar tarifas locales y guardarlas en Supabase
  const cambiarTarifas = useCallback(async (nuevasTarifas: ConfigTarifas) => {
    try {
      await actualizarTarifas(nuevasTarifas);
      setTarifas(nuevasTarifas);
      toast.success('Tarifas actualizadas', {
        description: 'Las tarifas fijas se actualizaron correctamente en Supabase.',
      });
    } catch (err) {
      console.error('[useCotizacion] Error al actualizar tarifas:', err);
      toast.error('Error al actualizar tarifas', {
        description: err instanceof Error ? err.message : 'Intenta de nuevo.',
      });
      throw err;
    }
  }, []);

  // Acción principal: guardar cotización
  const guardar = useCallback(async () => {
    if (!formularioValido || !resultado || !form.distancia) {
      toast.error('Formulario incompleto', {
        description: 'Completa todos los campos requeridos antes de guardar.',
      });
      return;
    }

    setEstadoGuardado('guardando');

    try {
      // 1. Guardar en Supabase
      const registro = await guardarCotizacion({
        cliente_nombre: form.cliente.nombre,
        cliente_tel: form.cliente.telefono,
        cliente_empresa: form.cliente.empresa,
        origen_texto: form.origen?.textoCompleto ?? '',
        destino_texto: form.destino?.textoCompleto ?? '',
        origen_lat: form.origen?.lat ?? null,
        origen_lng: form.origen?.lng ?? null,
        destino_lat: form.destino?.lat ?? null,
        destino_lng: form.destino?.lng ?? null,
        distancia_km: resultado.distanciaKm,
        duracion_texto: form.distancia.duracionTexto,
        ayudantes: form.ayudantes,
        dificil_acceso: form.dificilAcceso,
        banderazo: resultado.banderazo,
        costo_km: tarifas.costoPorKm,
        costo_ayudante: tarifas.costoAyudante,
        subtotal: resultado.subtotal,
        recargo_da: resultado.recargoDA,
        total: resultado.total,
        notas: form.cliente.notas,
        status: 'borrador',
        webhook_enviado: false,
      });

      // 2. Enviar webhook a n8n (no bloquea si falla)
      const payload = buildN8nPayload(form, resultado, registro.id ?? null);
      enviarWebhookN8n(payload)
        .then((enviado) => {
          if (enviado && registro.id) {
            // Marcar como enviado en Supabase (importación dinámica para no bloquear)
            import('@/lib/supabase/queries').then(({ marcarWebhookEnviado }) => {
              marcarWebhookEnviado(registro.id!);
            });
          }
        })
        .catch((err) => {
          console.warn('[n8n] Webhook no enviado (no crítico):', err);
        });

      setEstadoGuardado('exito');
      toast.success('¡Cotización guardada!', {
        description: `ID: ${registro.id?.slice(0, 8)}... — El PDF será generado en breve.`,
        duration: 5000,
      });
    } catch (err) {
      console.error('[useCotizacion] Error al guardar:', err);
      setEstadoGuardado('error');
      toast.error('Error al guardar', {
        description: err instanceof Error ? err.message : 'Intenta de nuevo.',
      });
    }
  }, [form, resultado, formularioValido, tarifas]);

  const limpiar = useCallback(() => {
    setForm(FORM_INICIAL);
    setEstadoGuardado('idle');
  }, []);

  return {
    form,
    resultado,
    estadoGuardado,
    tarifas,
    cargandoTarifas,
    actualizarCliente,
    setOrigen,
    setDestino,
    setDistancia,
    setAyudantes,
    toggleDificilAcceso,
    setTipoServicio,
    cambiarTarifas,
    guardar,
    limpiar,
    formularioValido,
  };
}
