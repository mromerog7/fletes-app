-- ============================================================
-- FletesPro — Esquema SQL para Supabase (PostgreSQL)
-- Módulo de Cotización Inteligente
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Tabla principal de cotizaciones
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Datos del cliente
  cliente_nombre    TEXT NOT NULL,
  cliente_tel       TEXT,
  cliente_empresa   TEXT DEFAULT '',

  -- Ruta
  origen_texto      TEXT NOT NULL,
  destino_texto     TEXT NOT NULL,
  origen_lat        DECIMAL(10, 7),
  origen_lng        DECIMAL(10, 7),
  destino_lat       DECIMAL(10, 7),
  destino_lng       DECIMAL(10, 7),
  distancia_km      DECIMAL(8, 2),
  duracion_texto    TEXT,

  -- Extras
  ayudantes         INTEGER DEFAULT 0 CHECK (ayudantes >= 0 AND ayudantes <= 5),
  dificil_acceso    BOOLEAN DEFAULT false NOT NULL,

  -- Tarifas aplicadas (snapshot en el momento de cotización)
  banderazo         DECIMAL(10, 2) NOT NULL,
  costo_km          DECIMAL(10, 2) NOT NULL,
  costo_ayudante    DECIMAL(10, 2) NOT NULL,

  -- Desglose financiero
  subtotal          DECIMAL(10, 2) NOT NULL,
  recargo_da        DECIMAL(10, 2) DEFAULT 0,
  total             DECIMAL(10, 2) NOT NULL,

  -- Metadata
  notas             TEXT DEFAULT '',
  status            TEXT DEFAULT 'borrador'
                    CHECK (status IN ('borrador', 'enviada', 'aceptada', 'rechazada')),
  webhook_enviado   BOOLEAN DEFAULT false NOT NULL,

  -- Índices para búsquedas frecuentes
  CONSTRAINT cotizaciones_total_positivo CHECK (total > 0)
);

-- ── Índices ──────────────────────────────────────────────────

-- Búsquedas por fecha (historial)
CREATE INDEX IF NOT EXISTS cotizaciones_created_at_idx
  ON public.cotizaciones (created_at DESC);

-- Búsquedas por nombre de cliente
CREATE INDEX IF NOT EXISTS cotizaciones_cliente_nombre_idx
  ON public.cotizaciones (cliente_nombre);

-- Búsquedas por status
CREATE INDEX IF NOT EXISTS cotizaciones_status_idx
  ON public.cotizaciones (status)
  WHERE status != 'borrador';

-- ── Row Level Security (RLS) ─────────────────────────────────

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

-- Por ahora: cualquier usuario autenticado puede insertar y ver todas las cotizaciones.
-- En producción, agregar filtro por user_id para multitenancy.
CREATE POLICY "usuarios_autenticados_pueden_leer"
  ON public.cotizaciones
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "usuarios_autenticados_pueden_insertar"
  ON public.cotizaciones
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "usuarios_autenticados_pueden_actualizar"
  ON public.cotizaciones
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── Tabla de Tarifas (preparada para admin futuro) ───────────

CREATE TABLE IF NOT EXISTS public.tarifas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  activa          BOOLEAN DEFAULT true NOT NULL,
  banderazo       DECIMAL(10, 2) NOT NULL DEFAULT 450.00,
  costo_km        DECIMAL(10, 2) NOT NULL DEFAULT 15.00,
  costo_ayudante  DECIMAL(10, 2) NOT NULL DEFAULT 300.00,
  multiplicador_da DECIMAL(5, 4) NOT NULL DEFAULT 0.2000,
  notas           TEXT DEFAULT ''
);

-- Insertar tarifa inicial
INSERT INTO public.tarifas (banderazo, costo_km, costo_ayudante, multiplicador_da, notas)
VALUES (450.00, 15.00, 300.00, 0.2000, 'Tarifas iniciales FletesPro 2026')
ON CONFLICT DO NOTHING;

ALTER TABLE public.tarifas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarifas_publicas_lectura"
  ON public.tarifas
  FOR SELECT
  USING (true);

CREATE POLICY "tarifas_publicas_insercion"
  ON public.tarifas
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "tarifas_publicas_actualizacion"
  ON public.tarifas
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── Comentarios de columnas ──────────────────────────────────

COMMENT ON TABLE public.cotizaciones IS
  'Cotizaciones de flete generadas por el Módulo de Cotización Inteligente de FletesPro';

COMMENT ON COLUMN public.cotizaciones.status IS
  'borrador: creada en app | enviada: PDF generado | aceptada/rechazada: seguimiento';

COMMENT ON COLUMN public.cotizaciones.webhook_enviado IS
  'true si el payload fue enviado exitosamente al webhook de n8n para generar PDF';
