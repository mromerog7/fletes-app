'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useCotizacion } from '@/hooks/useCotizacion';
import { AddressInput } from './AddressInput';
import { ClienteFields } from './ClienteFields';
import { DesgloseCosto } from './DesgloseCosto';
import { MapContainer } from './MapContainer';

/**
 * Genera el mensaje estructurado de WhatsApp a partir de la cotización calculada.
 */
const generarTextoWhatsapp = (form: any, resultado: any, tarifas: any) => {
  if (!resultado) return '';

  const formattedBanderazo = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(resultado.banderazo);

  const formattedSubtotalKm = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(resultado.subtotalKm);

  const formattedSubtotalAyudantes = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(resultado.subtotalAyudantes);

  const formattedRecargoDA = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(resultado.recargoDA);

  const formattedTotal = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(resultado.total);

  let msg = `*COTIZACIÓN DE FLETE — FletesPro* 🚚\n\n`;
  msg += `*Cliente:* ${form.cliente.nombre}\n`;
  if (form.cliente.empresa) {
    msg += `*Empresa:* ${form.cliente.empresa}\n`;
  }
  msg += `*Teléfono:* ${form.cliente.telefono}\n\n`;

  msg += `*Detalle de Ruta:*\n`;
  msg += `📍 *Origen:* ${form.origen?.textoCompleto ?? ''}\n`;
  msg += `🏁 *Destino:* ${form.destino?.textoCompleto ?? ''}\n`;
  msg += `📏 *Distancia:* ${resultado.distanciaKm.toFixed(1)} km (${form.distancia?.duracionTexto ?? ''})\n\n`;

  msg += `*Desglose de Costos:*\n`;
  msg += `• Banderazo (base): ${formattedBanderazo}\n`;
  msg += `• Kilometraje (km × $${tarifas.costoPorKm}): ${formattedSubtotalKm}\n`;
  if (form.ayudantes > 0) {
    msg += `• Maniobras (${form.ayudantes} ayudante${form.ayudantes > 1 ? 's' : ''}): ${formattedSubtotalAyudantes}\n`;
  }
  if (form.dificilAcceso) {
    msg += `• Recargo difícil acceso (+${Math.round(tarifas.multiplicadorDA * 100)}%): ${formattedRecargoDA}\n`;
  }
  msg += `\n*TOTAL ESTIMADO:* *${formattedTotal}* MXN\n`;

  if (form.cliente.notas) {
    msg += `\n---\n*Notas adicionales:*\n${form.cliente.notas}\n`;
  }

  return msg;
};

/**
 * Componente raíz del Módulo de Cotización Inteligente.
 * Orquesta todos los sub-componentes y conecta los hooks.
 */
export function CotizacionForm() {
  const maps = useGoogleMaps();
  const cotizacion = useCotizacion();

  const [textoWhatsapp, setTextoWhatsapp] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Sincroniza distancia + coordenadas del hook de Maps al hook de cotización
  useEffect(() => {
    cotizacion.setDistancia(maps.distancia);
  }, [maps.distancia]);

  useEffect(() => {
    cotizacion.setOrigen(maps.origen);
  }, [maps.origen]);

  useEffect(() => {
    cotizacion.setDestino(maps.destino);
  }, [maps.destino]);

  // Generar texto para WhatsApp cuando se guarde exitosamente la cotización
  const { estadoGuardado } = cotizacion;
  useEffect(() => {
    if (estadoGuardado === 'exito' && cotizacion.resultado) {
      const msg = generarTextoWhatsapp(
        cotizacion.form,
        cotizacion.resultado,
        cotizacion.tarifas
      );
      setTextoWhatsapp(msg);
    }
  }, [estadoGuardado, cotizacion.resultado]);

  const handleLimpiar = () => {
    cotizacion.limpiar();
    maps.limpiarRuta();
    setTextoWhatsapp('');
  };

  const handleCopiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(textoWhatsapp);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error('No se pudo copiar el texto:', err);
    }
  };

  const handleCompartirWhatsapp = () => {
    const textEncoded = encodeURIComponent(textoWhatsapp);
    window.open(`https://wa.me/?text=${textEncoded}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Bloque 1: Ruta ─────────────────────────────────── */}
      <section className="glass rounded-2xl p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-neutral-500">
            Ruta
          </h2>
          {(maps.origen || maps.destino) && (
            <button
              type="button"
              onClick={handleLimpiar}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-black transition-colors"
              aria-label="Limpiar ruta y formulario"
            >
              <RotateCcw className="size-3" />
              Limpiar
            </button>
          )}
        </div>

        {/* Campos de dirección */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <AddressInput
            ref={maps.origenInputRef}
            label="Origen"
            placeholder="Escribe o selecciona en el mapa..."
            variant="origin"
            loading={maps.cargandoGeocode}
            className="flex-1"
          />
          <div className="hidden sm:flex items-center justify-center size-11 shrink-0 rounded-xl bg-neutral-50 border border-neutral-200 mb-0.5">
            <ArrowRight className="size-4 text-neutral-600" />
          </div>
          <AddressInput
            ref={maps.destinoInputRef}
            label="Destino"
            placeholder="Escribe o selecciona en el mapa..."
            variant="destination"
            loading={maps.cargandoGeocode}
            className="flex-1"
          />
        </div>
      </section>

      {/* ── Bloque 2: Mapa ─────────────────────────────────── */}
      <MapContainer
        mapDivRef={maps.mapDivRef}
        distancia={maps.distancia}
        origen={maps.origen}
        destino={maps.destino}
        cargandoRuta={maps.cargandoRuta}
        cargandoGeocode={maps.cargandoGeocode}
        error={maps.errorMapa}
        mapMode={maps.mapMode}
        onSetMapMode={maps.setMapMode}
        className="h-72 sm:h-80 lg:h-96"
      />

      {/* ── Bloque 3: Desglose de Costos ────────────────────── */}
      <DesgloseCosto
        resultado={cotizacion.resultado}
        ayudantes={cotizacion.form.ayudantes}
        dificilAcceso={cotizacion.form.dificilAcceso}
        onAyudantesChange={cotizacion.setAyudantes}
        onDificilAccesoToggle={cotizacion.toggleDificilAcceso}
        tarifas={cotizacion.tarifas}
        cambiarTarifas={cotizacion.cambiarTarifas}
      />

      <Separator className="bg-neutral-200" />

      {/* ── Bloque 4: Datos del Cliente ─────────────────────── */}
      <section className="glass rounded-2xl p-5">
        <ClienteFields
          cliente={cotizacion.form.cliente}
          onChange={cotizacion.actualizarCliente}
        />
      </section>

      {/* ── Bloque 5: Botón Guardar ─────────────────────────── */}
      <div className="flex flex-col gap-3 pb-6">
        {!cotizacion.formularioValido && (
          <p className="text-xs text-neutral-500 text-center">
            Completa la ruta y los datos del cliente para guardar
          </p>
        )}

        <button
          type="button"
          id="btn-guardar-cotizacion"
          onClick={cotizacion.guardar}
          disabled={!cotizacion.formularioValido || estadoGuardado === 'guardando'}
          className={cn(
            'btn-primary-xl w-full flex items-center justify-center gap-2.5',
            estadoGuardado === 'exito' && 'bg-[#05944F] text-white hover:bg-[#047A40]'
          )}
          aria-label="Guardar cotización en Supabase y preparar PDF"
        >
          {estadoGuardado === 'guardando' && (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>Guardando...</span>
            </>
          )}
          {estadoGuardado === 'exito' && (
            <>
              <CheckCircle2 className="size-5" />
              <span>¡Cotización Guardada!</span>
            </>
          )}
          {(estadoGuardado === 'idle' || estadoGuardado === 'error') && (
            <>
              <Save className="size-5" />
              <span>Guardar Cotización</span>
            </>
          )}
        </button>

        {estadoGuardado === 'error' && (
          <p className="text-xs text-red-600 text-center">
            Error al guardar. Intenta de nuevo.
          </p>
        )}

        {/* ── Bloque Opcional: Resumen para enviar por WhatsApp ── */}
        {estadoGuardado === 'exito' && (
          <div className="glass border border-neutral-200 rounded-2xl p-5 mt-4 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-500">
                Resumen para WhatsApp
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 px-2 py-0.5 rounded-full">
                Guardado en BD
              </span>
            </div>

            <p className="text-xs text-neutral-500 leading-normal">
              Revisa y edita el texto a continuación antes de enviárselo al cliente por WhatsApp:
            </p>

            <textarea
              value={textoWhatsapp}
              onChange={(e) => setTextoWhatsapp(e.target.value)}
              className="w-full bg-[#F3F3F3] focus:bg-white border border-transparent focus:border-black rounded-xl p-4 text-xs text-black outline-none transition-all leading-relaxed font-data resize-none"
              style={{ minHeight: '13rem', height: 'auto' }}
              aria-label="Contenido del mensaje de WhatsApp"
            />

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleCopiarTexto}
                className="flex-1 min-h-[2.75rem] border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-98 transition-all rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-black cursor-pointer"
              >
                {copiado ? (
                  <>
                    <Check className="size-4 text-emerald-600" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4 text-neutral-600" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCompartirWhatsapp}
                className="flex-1 min-h-[2.75rem] bg-[#25D366] hover:bg-[#20BA5A] active:scale-98 transition-all rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/5"
              >
                <Share2 className="size-4" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
