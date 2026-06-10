'use client';
// ============================================================
// FletesPro — Hook: useGoogleMaps (v2)
// - SIN Directions API (usa Polyline + Distance Matrix)
// - Marcadores clickeables en el mapa para seleccionar origen/destino
// - Geocoder reverso para obtener dirección desde coordenadas
// - Fallback Haversine si Distance Matrix falla
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps/loader';
import { calcularDistancia } from '@/lib/google-maps/distance-matrix';
import type { DireccionGoogle, ResultadoDistancia } from '@/types/cotizacion';

/** Modo del mapa: qué se fija al hacer click */
export type MapMode = 'view' | 'set-origin' | 'set-destination';

interface UseGoogleMapsReturn {
  // Estado
  apiCargada: boolean;
  origen: DireccionGoogle | null;
  destino: DireccionGoogle | null;
  distancia: ResultadoDistancia | null;
  cargandoRuta: boolean;
  cargandoGeocode: boolean;
  errorMapa: string | null;
  mapMode: MapMode;
  // Refs
  origenInputRef: React.RefObject<HTMLInputElement | null>;
  destinoInputRef: React.RefObject<HTMLInputElement | null>;
  mapDivRef: React.RefObject<HTMLDivElement | null>;
  // Acciones
  setMapMode: (mode: MapMode) => void;
  setOrigenManual: (dir: DireccionGoogle) => void;
  setDestinoManual: (dir: DireccionGoogle) => void;
  limpiarRuta: () => void;
}

// ── Haversine (fallback sin Distance Matrix) ──────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── SVG de pines personalizados (Estilo Uber) ──────────────────
function makePinSvg(color: string, letra: string, isSquare = false): string {
  const shape = isSquare
    ? `<rect x="8" y="8" width="20" height="20" rx="4" fill="${color}"/>
       <rect x="13" y="13" width="10" height="10" rx="2" fill="white"/>`
    : `<circle cx="18" cy="18" r="10" fill="${color}"/>
       <circle cx="18" cy="18" r="5" fill="white"/>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <path d="M18 16v32" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="18" cy="44" r="3.5" fill="${color}"/>
      <circle cx="18" cy="18" r="16" fill="white" stroke="${color}" stroke-width="3.5"/>
      ${shape}
    </svg>
  `)}`;
}

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [apiCargada, setApiCargada] = useState(false);
  const [origen, setOrigen] = useState<DireccionGoogle | null>(null);
  const [destino, setDestino] = useState<DireccionGoogle | null>(null);
  const [distancia, setDistancia] = useState<ResultadoDistancia | null>(null);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [cargandoGeocode, setCargandoGeocode] = useState(false);
  const [errorMapa, setErrorMapa] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('view');

  const origenInputRef = useRef<HTMLInputElement>(null);
  const destinoInputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);

  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const origenMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinoMarkerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const origenACRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinoACRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  // Ref para acceder al mapMode actual dentro de los listeners
  const mapModeRef = useRef<MapMode>('view');

  // ── Carga de API ──────────────────────────────────────────────
  useEffect(() => {
    loadGoogleMaps()
      .then(() => setApiCargada(true))
      .catch(() => setErrorMapa('No se pudo cargar Google Maps. Verifica tu clave de API.'));
  }, []);

  // ── Inicialización del mapa ───────────────────────────────────
  useEffect(() => {
    if (!apiCargada || !mapDivRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapDivRef.current, {
      center: { lat: 18.0042, lng: -93.2029 }, // Centro: Tabasco, México
      zoom: 10,
      mapTypeId: 'roadmap',
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
        { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e9e9e9' }] },
        { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
        { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0e0e0' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
      ],
    });

    geocoderRef.current = new window.google.maps.Geocoder();

    // Polyline negra de alta visibilidad (Estilo Uber)
    polylineRef.current = new window.google.maps.Polyline({
      strokeColor: '#000000',
      strokeOpacity: 0.9,
      strokeWeight: 5,
      geodesic: true,
      map: mapInstanceRef.current,
    });

    // Marcadores estilo Uber
    origenMarkerRef.current = new window.google.maps.Marker({
      map: mapInstanceRef.current,
      visible: false,
      icon: {
        url: makePinSvg('#276EF1', 'A', false), // Circulo azul Uber para el origen
        scaledSize: new window.google.maps.Size(36, 48),
        anchor: new window.google.maps.Point(18, 48),
      },
      title: 'Origen',
      draggable: true,
    });

    destinoMarkerRef.current = new window.google.maps.Marker({
      map: mapInstanceRef.current,
      visible: false,
      icon: {
        url: makePinSvg('#000000', 'B', true), // Cuadrado negro Uber para el destino
        scaledSize: new window.google.maps.Size(36, 48),
        anchor: new window.google.maps.Point(18, 48),
      },
      title: 'Destino',
      draggable: true,
    });

    // Drag de marcadores → actualizar coordenadas + geocodificar
    origenMarkerRef.current.addListener('dragend', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      geocodificarCoordenadas(e.latLng.lat(), e.latLng.lng(), 'origin');
    });

    destinoMarkerRef.current.addListener('dragend', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      geocodificarCoordenadas(e.latLng.lat(), e.latLng.lng(), 'destination');
    });
  }, [apiCargada]);

  // ── Click en mapa → colocar marcador ─────────────────────────
  useEffect(() => {
    if (!apiCargada || !mapInstanceRef.current) return;

    // Limpiar listener anterior
    if (mapClickListenerRef.current) {
      window.google.maps.event.removeListener(mapClickListenerRef.current);
    }

    // Solo escuchar clicks cuando estamos en modo de selección
    if (mapMode === 'view') return;

    mapModeRef.current = mapMode;

    mapClickListenerRef.current = mapInstanceRef.current.addListener(
      'click',
      (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const currentMode = mapModeRef.current;
        geocodificarCoordenadas(
          e.latLng.lat(),
          e.latLng.lng(),
          currentMode === 'set-origin' ? 'origin' : 'destination'
        );
        // Volver a modo view tras seleccionar
        setMapMode('view');
        mapModeRef.current = 'view';
      }
    );

    return () => {
      if (mapClickListenerRef.current) {
        window.google.maps.event.removeListener(mapClickListenerRef.current);
        mapClickListenerRef.current = null;
      }
    };
  }, [mapMode, apiCargada]);

  // ── Geocoder reverso ─────────────────────────────────────────
  const geocodificarCoordenadas = useCallback(
    (lat: number, lng: number, tipo: 'origin' | 'destination') => {
      if (!geocoderRef.current) return;
      setCargandoGeocode(true);

      geocoderRef.current.geocode(
        { location: { lat, lng }, language: 'es', region: 'MX' },
        (results, status) => {
          setCargandoGeocode(false);
          if (status !== 'OK' || !results || results.length === 0) {
            // Fallback: usar coordenadas sin dirección textual
            const dir: DireccionGoogle = {
              textoCompleto: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              lat,
              lng,
            };
            if (tipo === 'origin') {
              setOrigenDirección(dir);
            } else {
              setDestinoDirección(dir);
            }
            return;
          }
          const dir: DireccionGoogle = {
            textoCompleto: results[0].formatted_address,
            lat,
            lng,
            placeId: results[0].place_id,
          };
          if (tipo === 'origin') {
            setOrigenDirección(dir);
          } else {
            setDestinoDirección(dir);
          }
        }
      );
    },
    []
  );

  // ── Helpers para actualizar origen/destino ────────────────────
  const setOrigenDirección = useCallback((dir: DireccionGoogle) => {
    setOrigen(dir);
    setErrorMapa(null);
    // Actualizar input de texto
    if (origenInputRef.current) origenInputRef.current.value = dir.textoCompleto;
    // Mover marcador
    if (origenMarkerRef.current) {
      origenMarkerRef.current.setPosition({ lat: dir.lat, lng: dir.lng });
      origenMarkerRef.current.setVisible(true);
    }
  }, []);

  const setDestinoDirección = useCallback((dir: DireccionGoogle) => {
    setDestino(dir);
    setErrorMapa(null);
    if (destinoInputRef.current) destinoInputRef.current.value = dir.textoCompleto;
    if (destinoMarkerRef.current) {
      destinoMarkerRef.current.setPosition({ lat: dir.lat, lng: dir.lng });
      destinoMarkerRef.current.setVisible(true);
    }
  }, []);

  // ── Autocomplete en inputs ────────────────────────────────────
  useEffect(() => {
    if (!apiCargada) return;

    const opciones: google.maps.places.AutocompleteOptions = {
      componentRestrictions: { country: 'mx' },
      fields: ['formatted_address', 'geometry', 'place_id', 'name'],
    };

    if (origenInputRef.current && !origenACRef.current) {
      origenACRef.current = new window.google.maps.places.Autocomplete(
        origenInputRef.current,
        opciones
      );
      origenACRef.current.addListener('place_changed', () => {
        const place = origenACRef.current!.getPlace();
        if (!place.geometry?.location) return;
        setOrigenDirección({
          textoCompleto: place.formatted_address ?? place.name ?? '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id,
        });
      });
    }

    if (destinoInputRef.current && !destinoACRef.current) {
      destinoACRef.current = new window.google.maps.places.Autocomplete(
        destinoInputRef.current,
        opciones
      );
      destinoACRef.current.addListener('place_changed', () => {
        const place = destinoACRef.current!.getPlace();
        if (!place.geometry?.location) return;
        setDestinoDirección({
          textoCompleto: place.formatted_address ?? place.name ?? '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id,
        });
      });
    }
  }, [apiCargada, setOrigenDirección, setDestinoDirección]);

  // ── Calcular distancia + dibujar Polyline ─────────────────────
  useEffect(() => {
    if (!origen || !destino || !apiCargada) return;

    const calcular = async () => {
      setCargandoRuta(true);
      setErrorMapa(null);

      // Ajustar zoom para ver ambos marcadores
      if (mapInstanceRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: origen.lat, lng: origen.lng });
        bounds.extend({ lat: destino.lat, lng: destino.lng });
        mapInstanceRef.current.fitBounds(bounds, 80);
      }

      // Intentar primero con Directions API para obtener la ruta por carretera y la distancia/duración
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: { lat: origen.lat, lng: origen.lng },
          destination: { lat: destino.lat, lng: destino.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        async (result, status) => {
          if (status === 'OK' && result && result.routes && result.routes[0]) {
            const route = result.routes[0];
            const leg = route.legs[0];

            // Dibujar Polyline por carretera
            if (polylineRef.current) {
              polylineRef.current.setPath(route.overview_path);
            }

            const distanciaMetros = leg.distance?.value ?? 0;
            const distanciaKm = Math.round((distanciaMetros / 1000) * 10) / 10;

            setDistancia({
              distanciaKm,
              distanciaTexto: leg.distance?.text ?? `${distanciaKm} km`,
              duracionTexto: leg.duration?.text ?? '',
              duracionSegundos: leg.duration?.value ?? 0,
            });
            setCargandoRuta(false);
          } else {
            console.warn('[Maps] Directions API falló o no dio resultados:', status, '. Usando fallback a Distance Matrix.');

            // Fallback a Polyline de línea recta
            if (polylineRef.current) {
              polylineRef.current.setPath([
                { lat: origen.lat, lng: origen.lng },
                { lat: destino.lat, lng: destino.lng },
              ]);
            }

            try {
              const resultadoDist = await calcularDistancia(origen, destino);
              setDistancia(resultadoDist);
            } catch (err) {
              console.warn('[Maps] Distance Matrix falló, usando Haversine:', err);
              const km = haversineKm(origen.lat, origen.lng, destino.lat, destino.lng);
              const kmRedondeado = Math.round(km * 10) / 10;
              const minutos = Math.round((kmRedondeado / 60) * 60);
              const horas = Math.floor(minutos / 60);
              const mins = minutos % 60;
              const duracionTexto = horas > 0 ? `${horas}h ${mins} min` : `${mins} min`;
              setDistancia({
                distanciaKm: kmRedondeado,
                distanciaTexto: `~${kmRedondeado.toFixed(1)} km`,
                duracionTexto: `~${duracionTexto} (est.)`,
                duracionSegundos: minutos * 60,
              });
            } finally {
              setCargandoRuta(false);
            }
          }
        }
      );
    };

    calcular();
  }, [origen, destino, apiCargada]);

  // ── Limpiar todo ─────────────────────────────────────────────
  const limpiarRuta = useCallback(() => {
    setOrigen(null);
    setDestino(null);
    setDistancia(null);
    setErrorMapa(null);
    setMapMode('view');
    mapModeRef.current = 'view';

    if (polylineRef.current) polylineRef.current.setPath([]);
    if (origenMarkerRef.current) origenMarkerRef.current.setVisible(false);
    if (destinoMarkerRef.current) destinoMarkerRef.current.setVisible(false);
    if (origenInputRef.current) origenInputRef.current.value = '';
    if (destinoInputRef.current) destinoInputRef.current.value = '';

    // Reset zoom
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 18.0042, lng: -93.2029 });
      mapInstanceRef.current.setZoom(10);
    }
  }, []);

  // ── Setters públicos para uso externo ─────────────────────────
  const setOrigenManual = useCallback(
    (dir: DireccionGoogle) => setOrigenDirección(dir),
    [setOrigenDirección]
  );

  const setDestinoManual = useCallback(
    (dir: DireccionGoogle) => setDestinoDirección(dir),
    [setDestinoDirección]
  );

  return {
    apiCargada,
    origen,
    destino,
    distancia,
    cargandoRuta,
    cargandoGeocode,
    errorMapa,
    mapMode,
    origenInputRef,
    destinoInputRef,
    mapDivRef,
    setMapMode,
    setOrigenManual,
    setDestinoManual,
    limpiarRuta,
  };
}
