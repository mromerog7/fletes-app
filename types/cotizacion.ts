// ============================================================
// FletesPro — Tipos TypeScript Compartidos
// Módulo de Cotización Inteligente
// ============================================================

/** Resultado de Google Places Autocomplete */
export interface DireccionGoogle {
  textoCompleto: string;
  lat: number;
  lng: number;
  placeId?: string;
}

/** Resultado de Google Distance Matrix API */
export interface ResultadoDistancia {
  distanciaKm: number;
  distanciaTexto: string;   // ej: "45.2 km"
  duracionTexto: string;    // ej: "52 min"
  duracionSegundos: number;
}

/** Variables de tarifa — hardcodeadas ahora, vendrán de Supabase en fases futuras */
export interface ConfigTarifas {
  banderazo: number;           // Tarifa base fija — MXN
  costoPorKm: number;          // Costo por kilómetro — MXN
  costoAyudante: number;       // Costo por ayudante de maniobras — MXN
  multiplicadorDA: number;     // Multiplicador zona difícil acceso (ej: 0.20 = 20%)
}

/** Datos del cliente en el formulario */
export interface DatosCliente {
  nombre: string;
  telefono: string;
  empresa: string;
  notas: string;
}

/** Estado completo del formulario de cotización */
export interface FormCotizacion {
  cliente: DatosCliente;
  origen: DireccionGoogle | null;
  destino: DireccionGoogle | null;
  distancia: ResultadoDistancia | null;
  ayudantes: number;
  dificilAcceso: boolean;
  tipoServicio: 'local' | 'foraneo' | 'especial';
}

/** Resultado del motor de cálculo */
export interface ResultadoCotizacion {
  banderazo: number;
  subtotalKm: number;
  subtotalAyudantes: number;
  subtotal: number;
  recargoDA: number;
  total: number;
  // Datos de referencia para el desglose
  distanciaKm: number;
  ayudantes: number;
  dificilAcceso: boolean;
}

/** Estado de guardado de cotización */
export type EstadoGuardado = 'idle' | 'guardando' | 'exito' | 'error';

/** Registro completo en Supabase (tabla cotizaciones) */
export interface CotizacionDB {
  id?: string;
  created_at?: string;
  cliente_nombre: string;
  cliente_tel: string;
  cliente_empresa: string;
  origen_texto: string;
  destino_texto: string;
  origen_lat: number | null;
  origen_lng: number | null;
  destino_lat: number | null;
  destino_lng: number | null;
  distancia_km: number | null;
  duracion_texto: string | null;
  ayudantes: number;
  dificil_acceso: boolean;
  banderazo: number;
  costo_km: number;
  costo_ayudante: number;
  subtotal: number;
  recargo_da: number;
  total: number;
  notas: string;
  status: 'borrador' | 'enviada' | 'aceptada' | 'rechazada';
  webhook_enviado: boolean;
}

/** Payload JSON para el webhook de n8n (generación de PDF) */
export interface PayloadN8N {
  evento: 'cotizacion_creada';
  timestamp: string;
  cotizacion_id: string | null;
  cliente: {
    nombre: string;
    telefono: string;
    empresa: string;
  };
  ruta: {
    origen: string;
    destino: string;
    distancia_km: number;
    duracion: string;
  };
  desglose: {
    banderazo: number;
    costo_km: number;
    km_total: number;
    subtotal_km: number;
    ayudantes: number;
    costo_ayudante: number;
    subtotal_ayudantes: number;
    dificil_acceso: boolean;
    recargo_da: number;
    total: number;
  };
  notas: string;
}
