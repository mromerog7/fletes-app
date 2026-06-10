// ============================================================
// FletesPro — Supabase Browser Client
// ============================================================
// ⚠️ CONFIGURACIÓN REQUERIDA:
//   NEXT_PUBLIC_SUPABASE_URL   → URL del proyecto Supabase
//   NEXT_PUBLIC_SUPABASE_ANON_KEY → Clave anon/public de Supabase
//
// Ambas variables deben estar en .env.local
// ============================================================

import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente de Supabase para uso en componentes del browser (client components).
 * Usa @supabase/ssr para compatibilidad con Next.js App Router.
 *
 * IMPORTANTE: No usar en Server Components ni Route Handlers.
 * Para Server Components, usar createServerClient de @supabase/ssr.
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan variables de entorno de Supabase.\n' +
      'Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY a .env.local'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
