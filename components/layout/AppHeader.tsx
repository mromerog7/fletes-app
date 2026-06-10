'use client';

import { Truck, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AppHeader() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center size-9 rounded-xl bg-black border border-black shadow-sm">
            <Truck className="size-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="text-lg font-bold tracking-tight text-black"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              FletesPro
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500">
              Cotización Inteligente
            </span>
          </div>
        </div>

        {/* Estado de conexión */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
            online
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}
        >
          {online ? (
            <>
              <Wifi className="size-3" />
              <span className="hidden sm:inline">En línea</span>
            </>
          ) : (
            <>
              <WifiOff className="size-3" />
              <span className="hidden sm:inline">Sin conexión</span>
            </>
          )}
          <span
            className={`size-1.5 rounded-full ${
              online ? 'bg-emerald-500' : 'bg-red-500'
            } ${online && 'animate-pulse'}`}
          />
        </div>
      </div>
    </header>
  );
}
