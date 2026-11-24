import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { addBaseLayer, homePinIcon } from '../lib/mapConfig';

/**
 * Small embedded map used for:
 *  - Station detail: 250 m privacy circle only (no exact pin)       -> privacyRadius
 *  - Booking access: exact driveway pin, revealed after booking      -> exactPin
 *  - Host onboarding: tap / drag to place the charger                -> picker + onPick
 */
export default function MiniMap({
  center,
  zoom = 15,
  privacyRadius,
  exactPin = false,
  picker = false,
  onPick,
  className = 'h-44'
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    const map = L.map(containerRef.current, {
      zoomControl: false,
      zoomSnap: 0.25,
      dragging: picker,
      scrollWheelZoom: picker ? 'center' : false,
      doubleClickZoom: picker,
      touchZoom: picker,
      boxZoom: false,
      keyboard: false
    }).setView(center, zoom);
    addBaseLayer(map);
    layerRef.current = L.layerGroup().addTo(map);
    if (picker) {
      L.control.zoom({ position: 'topright' }).addTo(map);
      map.on('click', (e) => onPickRef.current?.(e.latlng));
    }
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const g = layerRef.current;
    if (!map || !g) return;
    g.clearLayers();

    if (privacyRadius) {
      L.circle(center, {
        radius: privacyRadius,
        color: '#059669',
        weight: 2,
        dashArray: '6 5',
        fillColor: '#10b981',
        fillOpacity: 0.18,
        interactive: false
      }).addTo(g);
    }
    if (exactPin) {
      const m = L.marker(center, { icon: homePinIcon, draggable: picker, keyboard: false });
      if (picker) m.on('dragend', (e) => onPickRef.current?.(e.target.getLatLng()));
      m.addTo(g);
    }
    if (!picker) map.setView(center, zoom, { animate: false });
  }, [center[0], center[1], privacyRadius, exactPin, zoom, picker]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
