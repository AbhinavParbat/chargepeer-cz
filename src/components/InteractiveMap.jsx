import React from 'react';
import { Zap, Shield, Navigation } from 'lucide-react';
import { PUBLIC_DC_HUBS } from '../data/mockData';

export default function InteractiveMap({
  stations,
  selectedStation,
  onSelectStation,
  showPublicDcOverlay,
  setShowPublicDcOverlay
}) {
  return (
    <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-inner select-none">
      {/* Stylized Czech Republic Topographic Grid & Rural Zones */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full opacity-90">
        <defs>
          <pattern id="czGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="#0f172a" />
        <rect width="100" height="100" fill="url(#czGrid)" />

        {/* Czech Republic Approximate Border Polygon */}
        <polygon
          points="8,44 18,26 35,18 56,22 72,30 92,38 94,56 76,76 62,84 42,80 22,82 12,64"
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="0.8"
        />

        {/* Rural "Charging Desert" Highlight Zones (SO1) */}
        <circle cx="26" cy="74" r="9" fill="#10b981" fillOpacity="0.12" stroke="#10b981" strokeDasharray="1.5,1.5" strokeWidth="0.4" />
        <circle cx="49" cy="66" r="8" fill="#10b981" fillOpacity="0.12" stroke="#10b981" strokeDasharray="1.5,1.5" strokeWidth="0.4" />
        <circle cx="78" cy="38" r="8" fill="#10b981" fillOpacity="0.12" stroke="#10b981" strokeDasharray="1.5,1.5" strokeWidth="0.4" />

        {/* D1 & D5 Primary Highway Corridors */}
        <polyline
          points="22,50 38,40 48,54 65,67 76,55"
          fill="none"
          stroke="#475569"
          strokeWidth="1.2"
          strokeDasharray="2,1"
        />

        {/* Geographic Labels */}
        <text x="36" y="36" fill="#94a3b8" fontSize="3.2" fontWeight="700">PRAHA</text>
        <text x="63" y="72" fill="#94a3b8" fontSize="3" fontWeight="600">BRNO (D1)</text>
        <text x="16" y="86" fill="#34d399" fontSize="2.7" fontWeight="600">Šumava (Rural)</text>
        <text x="43" y="77" fill="#34d399" fontSize="2.7" fontWeight="600">Vysočina</text>
        <text x="72" y="29" fill="#34d399" fontSize="2.7" fontWeight="600">Jeseníky</text>
      </svg>

      {/* Optional Commercial Public DC Highway Hubs Overlay (SO1 / RQ1 Comparison) */}
      {showPublicDcOverlay &&
        PUBLIC_DC_HUBS.map((dc) => (
          <div
            key={dc.id}
            style={{ left: `${dc.mapX}%`, top: `${dc.mapY}%` }}
            title={`${dc.name} (${dc.price})`}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
          >
            <div className="w-4 h-4 rounded-full bg-amber-500/90 border border-white flex items-center justify-center shadow">
              <span className="text-[7px] font-bold text-slate-950">DC</span>
            </div>
          </div>
        ))}

      {/* P2P Private Charging Station Markers */}
      {stations.map((station) => {
        const isSelected = selectedStation?.id === station.id;
        return (
          <button
            key={station.id}
            onClick={() => onSelectStation(station)}
            style={{ left: `${station.mapX}%`, top: `${station.mapY}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
              isSelected ? 'z-30 scale-125' : 'z-20 hover:scale-110'
            }`}
          >
            {/* 250m Privacy Circle when selected */}
            {isSelected && (
              <span className="absolute -inset-3 rounded-full bg-emerald-400/25 border border-emerald-400/60 animate-ping" />
            )}
            <div
              className={`px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg border text-[10px] font-bold ${
                !station.availableNow
                  ? 'bg-slate-700 text-slate-300 border-slate-500'
                  : isSelected
                  ? 'bg-emerald-500 text-slate-950 border-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 text-white border-emerald-300'
              }`}
            >
              <Zap className="w-2.5 h-2.5 fill-current" />
              <span>{station.pricePerKwh.toFixed(1)}</span>
            </div>
          </button>
        );
      })}

      {/* Map Header Controls */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5">
          <Navigation className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-semibold text-slate-200">
            CZ Geospatial Grid ({stations.length} P2P Nodes)
          </span>
        </div>

        <button
          onClick={() => setShowPublicDcOverlay(!showPublicDcOverlay)}
          className={`pointer-events-auto px-2 py-1 rounded-lg text-[10px] font-semibold border transition ${
            showPublicDcOverlay
              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500'
          }`}
        >
          {showPublicDcOverlay ? 'Hide Highway DC' : 'Compare Highway DC'}
        </button>
      </div>

      {/* Bottom Legend & NFR-03 Privacy Indicator */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] bg-slate-950/85 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> P2P (5.8–7.2 CZK)
          </span>
          {showPublicDcOverlay && (
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Hwy DC (~13 CZK)
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <Shield className="w-2.5 h-2.5" /> 250m Privacy Active
        </span>
      </div>
    </div>
  );
}
