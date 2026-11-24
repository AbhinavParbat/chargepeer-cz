import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Plus, Minus, Maximize2, Zap } from 'lucide-react';
import { PUBLIC_DC_HUBS, CHARGING_GAP_ZONES, CZ_BOUNDS } from '../data/mockData';
import { addBaseLayer, priceIcon, dcIcon, zoneLabelIcon, routeLabelIcon } from '../lib/mapConfig';

/**
 * Real geographic map of Czechia (Leaflet + OpenStreetMap/CARTO tiles).
 * - P2P stations rendered as price pins at their *public* (obfuscated) position
 * - Rural charging-gap zones (SO1) as dashed circles
 * - Optional overlay of commercial highway DC hubs for comparison
 * - Selecting a station flies to it and draws the 250 m privacy circle (NFR-03)
 */
export default function InteractiveMap({
  stations,
  selectedStation,
  onSelectStation,
  showPublicDcOverlay,
  setShowPublicDcOverlay,
  route // optional trip scenario: { legs:[{path, terrainFactor}], continuationPath }
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({});
  const onSelectRef = useRef(onSelectStation);
  onSelectRef.current = onSelectStation;
  const lastFlownId = useRef(selectedStation?.id);

  const fitCountry = (animate = true) => {
    mapRef.current?.fitBounds(CZ_BOUNDS, { padding: [8, 8], animate });
  };

  // 1) Create the map once
  useEffect(() => {
    const map = L.map(containerRef.current, {
      zoomControl: false,
      zoomSnap: 0.25,
      minZoom: 6,
      maxZoom: 18,
      maxBounds: L.latLngBounds(CZ_BOUNDS).pad(0.35),
      worldCopyJump: false
    });
    addBaseLayer(map);
    map.fitBounds(CZ_BOUNDS, { padding: [8, 8], animate: false });

    const zones = L.layerGroup().addTo(map);
    CHARGING_GAP_ZONES.forEach((z) => {
      L.circle([z.lat, z.lng], {
        radius: z.radiusKm * 1000,
        color: '#10b981',
        weight: 1.4,
        dashArray: '4 4',
        fillColor: '#10b981',
        fillOpacity: 0.1,
        interactive: false
      }).addTo(zones);
      L.marker([z.lat - z.radiusKm / 111, z.lng], {
        icon: zoneLabelIcon(z.label),
        interactive: false,
        keyboard: false
      }).addTo(zones);
    });

    layersRef.current = {
      route: L.layerGroup().addTo(map),
      dc: L.layerGroup().addTo(map),
      privacy: L.layerGroup().addTo(map),
      stations: L.layerGroup().addTo(map)
    };
    mapRef.current = map;

    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2) Station price pins + privacy circle
  useEffect(() => {
    const { stations: group, privacy } = layersRef.current;
    if (!group) return;
    group.clearLayers();
    privacy.clearLayers();

    stations.forEach((st) => {
      const selected = st.id === selectedStation?.id;
      const marker = L.marker([st.lat, st.lng], {
        icon: priceIcon(st, selected),
        zIndexOffset: selected ? 1000 : 0,
        keyboard: false,
        title: st.title
      });
      marker.on('click', () => onSelectRef.current(st));
      group.addLayer(marker);

      if (selected) {
        L.circle([st.lat, st.lng], {
          radius: 250,
          color: '#059669',
          weight: 1.5,
          dashArray: '4 3',
          fillColor: '#10b981',
          fillOpacity: 0.16,
          interactive: false
        }).addTo(privacy);
      }
    });
  }, [stations, selectedStation?.id]);

  // 3) Fly to a newly selected station (not on first render: keep the country overview)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStation) return;
    if (lastFlownId.current === selectedStation.id) return;
    lastFlownId.current = selectedStation.id;
    if (!stations.some((s) => s.id === selectedStation.id)) return;
    map.flyTo([selectedStation.lat, selectedStation.lng], 13, { duration: 0.9 });
  }, [selectedStation?.id, stations]);

  // 4) Road-trip route (Prague -> Berlin detour)
  useEffect(() => {
    const map = mapRef.current;
    const { route: group } = layersRef.current;
    if (!map || !group) return;
    group.clearLayers();
    if (!route) return;

    const all = [];
    route.legs.forEach((leg) => {
      const hilly = leg.terrainFactor >= 1.2;
      L.polyline(leg.path, { color: '#ffffff', weight: 8, opacity: 0.9, interactive: false }).addTo(group);
      L.polyline(leg.path, {
        color: hilly ? '#f59e0b' : '#0284c7',
        weight: 4.5,
        dashArray: hilly ? '6 6' : null,
        lineCap: 'round',
        interactive: false
      }).addTo(group);
      all.push(...leg.path);
    });
    if (route.continuationPath) {
      L.polyline(route.continuationPath, {
        color: '#64748b',
        weight: 3,
        dashArray: '2 7',
        lineCap: 'round',
        interactive: false
      }).addTo(group);
      const end = route.continuationPath[route.continuationPath.length - 1];
      L.marker(end, { icon: routeLabelIcon('to Berlin ↑'), interactive: false }).addTo(group);
    }
    const first = route.legs[0].path[0];
    const last = route.legs[route.legs.length - 1].path.slice(-1)[0];
    L.marker(first, { icon: routeLabelIcon('Prague'), interactive: false }).addTo(group);
    L.marker(last, { icon: routeLabelIcon('Dresden DC'), interactive: false }).addTo(group);

    map.fitBounds(L.latLngBounds(all), { padding: [36, 36] });
  }, [route]);

  // 5) Public DC overlay
  useEffect(() => {
    const { dc } = layersRef.current;
    if (!dc) return;
    dc.clearLayers();
    if (!showPublicDcOverlay) return;
    PUBLIC_DC_HUBS.forEach((hub) => {
      L.marker([hub.lat, hub.lng], { icon: dcIcon, keyboard: false })
        .bindTooltip(`<strong>${hub.name}</strong><br/>${hub.power} · ${hub.price}`, {
          direction: 'top',
          offset: [0, -12]
        })
        .addTo(dc);
    });
  }, [showPublicDcOverlay]);

  const btn =
    'w-8 h-8 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100';

  return (
    <div className="relative w-full h-[300px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm select-none">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top overlays */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[1000] flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-[11px] font-semibold text-slate-800">
          <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 fill-current" />
          </span>
          {stations.length} shared chargers
        </div>

        <button
          onClick={() => setShowPublicDcOverlay(!showPublicDcOverlay)}
          className={`pointer-events-auto px-2.5 py-1.5 rounded-full text-[11px] font-semibold shadow-md flex items-center gap-1.5 transition ${
            showPublicDcOverlay ? 'bg-amber-500 text-slate-900' : 'bg-white/95 text-slate-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${showPublicDcOverlay ? 'bg-slate-900' : 'bg-amber-500'}`}
          />
          {showPublicDcOverlay ? 'Hide public DC' : 'Compare public DC'}
        </button>
      </div>

      {/* Zoom / fit controls */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 z-[1000] flex flex-col rounded-xl overflow-hidden shadow-md divide-y divide-slate-200">
        <button aria-label="Zoom in" className={btn} onClick={() => mapRef.current?.zoomIn()}>
          <Plus className="w-4 h-4" />
        </button>
        <button aria-label="Zoom out" className={btn} onClick={() => mapRef.current?.zoomOut()}>
          <Minus className="w-4 h-4" />
        </button>
        <button aria-label="Show all of Czechia" className={btn} onClick={() => fitCountry()}>
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 backdrop-blur rounded-lg shadow px-2 py-1 flex items-center gap-2.5 text-[9.5px] font-medium text-slate-600">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-700" /> Home charger
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full border border-dashed border-emerald-600 bg-emerald-500/15" /> Charging gap
        </span>
        {showPublicDcOverlay && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Public DC
          </span>
        )}
        {route && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-[3px] rounded bg-sky-600" /> Route
          </span>
        )}
      </div>
    </div>
  );
}
