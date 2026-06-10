import { redirect } from 'next/navigation';

/**
 * Redirige la raíz al módulo de cotización.
 * En fases futuras, esta página puede ser un dashboard
 * con autenticación de Supabase.
 */
export default function HomePage() {
  redirect('/cotizacion');
}
