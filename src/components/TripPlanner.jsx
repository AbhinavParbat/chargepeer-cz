import React from 'react';
import { Route, Snowflake, Sun, AlertTriangle, CheckCircle2, Zap, ChevronRight, Mountain } from 'lucide-react';
import { analyzeTrip, legEnergyKwh, VEHICLE_BATTERY_KWH } from '../lib/calc';

const socColor = (soc, reserve) =>
  soc < 0 ? 'text-red-600' : soc < reserve ? 'text-amber-700' : 'text-slate-900';

function SocTimeline({ points, reserve }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
      {points.map((p, i) => (
        <div
          key={`${p.label}-${i}`}
          className={`rounded-lg px-1.5 py-1.5 text-center ${
            p.isCharge ? 'bg-emerald-50 ring-1 ring-emerald-200' : p.soc < reserve ? 'bg-red-50' : 'bg-slate-50'
          }`}
        >
          <div className={`text-[13px] font-bold leading-none ${p.isCharge ? 'text-emerald-700' : socColor(p.soc, reserve)}`}>
            {Math.round(p.soc)}%
          </div>
          <div className="text-[9.5px] text-slate-500 mt-1 leading-tight truncate">{p.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Road-trip range check (SO6): shows whether a scenic, remote detour on the
 * Prague → Berlin trip is possible on the current battery, and if not,
 * how long the driver must charge at the P2P host inside the charging gap.
 */
export default function TripPlanner({ trip, host, startSoc, setStartSoc, season, setSeason, onBookHost }) {
  const a = analyzeTrip(trip, host, { startSoc, season });
  const reserve = trip.reserveSoc;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-4 space-y-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold flex items-center gap-1.5">
            <Route className="w-4 h-4 text-sky-600" /> Road-trip range check
          </div>
          <div className="text-[12px] text-slate-500 mt-0.5">
            {trip.title} · {trip.subtitle}
          </div>
        </div>
        <span className="text-[11px] text-slate-500 shrink-0">{a.totalKm} km to Dresden</span>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <div className="flex justify-between text-[11.5px] mb-1">
            <span className="text-slate-600">Battery leaving Prague</span>
            <span className="font-semibold">{startSoc}%</span>
          </div>
          <input
            type="range"
            min="40"
            max="100"
            step="5"
            value={startSoc}
            onChange={(e) => setStartSoc(Number(e.target.value))}
            className="w-full accent-sky-600"
          />
        </div>
        <div className="bg-slate-100 p-0.5 rounded-lg flex text-[11px] font-semibold">
          {[
            { id: 'summer', label: 'Summer', icon: Sun },
            { id: 'winter', label: 'Winter', icon: Snowflake }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSeason(s.id)}
              className={`h-7 px-2 rounded-md flex items-center gap-1 ${
                season === s.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              <s.icon className="w-3 h-3" /> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legs */}
      <div className="space-y-1.5">
        {trip.legs.map((leg) => (
          <div key={leg.id} className="flex items-center justify-between text-[11.5px]">
            <span className="text-slate-600 flex items-center gap-1.5 min-w-0">
              {leg.terrainFactor >= 1.2 ? (
                <Mountain className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                </span>
              )}
              <span className="truncate">
                {leg.to} · {leg.km} km
              </span>
            </span>
            <span className="text-slate-900 font-medium shrink-0 ml-2">
              {legEnergyKwh(leg, season).toFixed(1)} kWh
            </span>
          </div>
        ))}
      </div>

      {/* Scenario A: no charging */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11.5px] font-semibold text-slate-700">Without charging</span>
          {a.reachableWithoutHost ? (
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Feasible
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {a.without.strandedRisk ? 'Battery runs out' : `Below ${reserve}% reserve`}
            </span>
          )}
        </div>
        <SocTimeline points={a.without.points} reserve={reserve} />
      </div>

      {/* Scenario B: with P2P host */}
      {!a.reachableWithoutHost && a.hostReachable && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] font-semibold text-slate-700">
              With {a.requiredHours} h at a shared wallbox ({host.powerKw} kW)
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Feasible
            </span>
          </div>
          <SocTimeline points={a.withCharge.points} reserve={reserve} />
        </div>
      )}

      {!a.hostReachable && (
        <div className="text-[11.5px] text-red-700 bg-red-50 rounded-xl p-2.5 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Not enough charge to reach the park safely. Charge at a motorway DC hub on the D8 first.
        </div>
      )}

      {a.reachableWithoutHost ? (
        <div className="text-[11.5px] text-emerald-800 bg-emerald-50 rounded-xl p-2.5">
          You can explore the park and reach Dresden without stopping. Arrival: {Math.round(a.without.finalSoc)}%.
        </div>
      ) : (
        a.hostReachable && (
          <button
            onClick={() => onBookHost(a.requiredHours, Math.round(a.arrivalSocAtHost))}
            className="w-full h-11 rounded-xl bg-emerald-700 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-800"
          >
            <Zap className="w-4 h-4" />
            Book {a.requiredHours} h at {host.municipality.split(' (')[0]} while you hike
            <ChevronRight className="w-4 h-4" />
          </button>
        )
      )}

      <p className="text-[10px] text-slate-500 leading-snug">
        Estimate for a {VEHICLE_BATTERY_KWH} kWh EV · hills ×1.3, winter ×1.25 · {trip.continuation}
      </p>
    </div>
  );
}
