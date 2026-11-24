import React, { useState } from 'react';
import { Database, Calculator, CheckCircle2, Layers, Terminal } from 'lucide-react';
import { PLATFORM_COMMISSION, DEFAULT_GRID_COST } from '../data/mockData';
import { computeSession, VEHICLE_BATTERY_KWH } from '../lib/calc';

export default function DefenseInspector({
  activeScreen,
  setActiveScreen,
  selectedStation,
  selectedSlots,
  currentSoc,
  bookings,
  stations
}) {
  const [activeTab, setActiveTab] = useState('requirements');

  const s = computeSession(selectedStation, selectedSlots, currentSoc);
  const durationHours = s.hours;
  const energyDelivered = s.energyKwh;
  const sessionCost = s.totalCost;
  const netHostRevenue = s.hostNet;
  const keep = (1 - PLATFORM_COMMISSION).toFixed(2);

  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-slate-200 flex flex-col max-h-[calc(100vh-120px)] overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400">
            FEM CZU Prague • KIT Defense Companion
          </span>
          <h2 className="text-lg font-bold text-white">
            Architecture, ERD & Formula Inspector
          </h2>
        </div>
        <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'requirements', label: 'UIS Features', icon: CheckCircle2 },
            { id: 'math', label: 'Ch.3 Formulas', icon: Calculator },
            { id: 'database', label: 'Live ERD State', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Screen Jumper for Chapter 4 Screenshots */}
      <div className="mb-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
        <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          Jump Directly to Any Prototype Screen (For Thesis Chapter 4 Figures):
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 1, name: 'Screen 1: Map & Search', fr: 'FR-02, FR-03' },
            { id: 2, name: 'Screen 2: Station & Trust', fr: 'FR-06, NFR-03' },
            { id: 3, name: 'Screen 3: Slot Booking', fr: 'FR-05, FR-07' },
            { id: 4, name: 'Screen 4: Gate Unlock & Rate', fr: 'FR-06, NFR-03' },
            { id: 5, name: 'Screen 5: Host Add Station', fr: 'FR-04' },
            { id: 6, name: 'Screen 6: Role & Earnings', fr: 'FR-01, FR-08' }
          ].map((scr) => (
            <button
              key={scr.id}
              onClick={() => setActiveScreen(scr.id)}
              className={`text-left px-2.5 py-2 rounded-xl text-xs font-medium border transition ${
                activeScreen === scr.id
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              {scr.name}
              <span className="block text-[10px] font-normal text-slate-500 mt-0.5">{scr.fr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {activeTab === 'requirements' && (
          <div className="space-y-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-emerald-400 mb-2">
                4 Mandatory UIS Assignment Workflows Implemented
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">1</span>
                  <div>
                    <strong className="text-white">Searching by Location (FR-02, FR-03):</strong> Real OpenStreetMap-based map of Czechia (Leaflet) highlighting rural charging deserts (Šumava, Vysočina, Jeseníky, Bohemian Switzerland, Kokořínsko) with power/availability filters and a Prague → Berlin road-trip range check that recommends a P2P host inside the charging gap.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">2</span>
                  <div>
                    <strong className="text-white">Listing Charging Stations (FR-04):</strong> Screen 5 enables private homeowners to list a wallbox, set kWh/hourly tariffs, and immediately plot a new pin on the map.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">3</span>
                  <div>
                    <strong className="text-white">Booking Availability (FR-05, FR-07):</strong> Screen 3 prevents double-booking of occupied time slots and computes battery SoC % and range gained.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">4</span>
                  <div>
                    <strong className="text-white">User Interaction & Digital Trust (FR-06, NFR-03):</strong> Masks exact driveway address within 250m until booked; unlocks Gate PIN on Screen 4 and supports bilateral 5-star reviews.
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-1">
                Rural Spatial Gap Impact (Chapter 5 Simulation Preview)
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Selected Station: <strong className="text-emerald-300">{selectedStation?.title}</strong> ({selectedStation?.municipality})
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Nearest Public Highway DC</div>
                  <div className="text-lg font-extrabold text-amber-400">
                    {selectedStation?.nearestPublicDcKm} km away
                  </div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/40">
                  <div className="text-slate-400">Distance to This P2P Node</div>
                  <div className="text-lg font-extrabold text-emerald-400">
                    {selectedStation?.distanceKm} km away
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'math' && (
          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-emerald-400 mb-2">
                Live Evaluation of Section 3.5 Mathematical Formulas
              </h3>
              <p className="text-slate-400 mb-3">
                Adjust slots on <strong>Screen 3</strong> to see the thesis equations recalculate in real time:
              </p>

              <div className="space-y-2 font-mono bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400">// 1. Energy Delivered (capped by free battery capacity)</div>
                <div className="text-white">
                  E_delivered = min(P × t, (1 − SoC) × B) = min({selectedStation?.powerKw} × {durationHours},{' '}
                  {(1 - currentSoc / 100).toFixed(2)} × {VEHICLE_BATTERY_KWH}) ={' '}
                  <span className="text-emerald-400 font-bold">{energyDelivered.toFixed(1)} kWh</span>
                  {s.batteryCapped && <span className="text-sky-300"> (battery-limited)</span>}
                </div>

                <div className="text-slate-400 pt-2">// 2. Total Guest Session Cost (C_session)</div>
                <div className="text-white">
                  C_session = ({energyDelivered.toFixed(1)} × {selectedStation?.pricePerKwh.toFixed(2)} CZK) + ({durationHours} h × {selectedStation?.hourlyFee} CZK) ={' '}
                  <span className="text-emerald-400 font-bold">{sessionCost.toFixed(2)} CZK</span>
                </div>

                <div className="text-slate-400 pt-2">
                  // 3. Net Host Revenue (R_host) with α={Math.round(PLATFORM_COMMISSION * 100)}% & C_grid={DEFAULT_GRID_COST.toFixed(2)} CZK
                </div>
                <div className="text-white">
                  R_host = ({keep} × {sessionCost.toFixed(2)}) − ({energyDelivered.toFixed(1)} × {DEFAULT_GRID_COST.toFixed(2)}) ={' '}
                  <span className="text-amber-300 font-bold">
                    {netHostRevenue >= 0 ? '+' : ''}
                    {netHostRevenue.toFixed(2)} CZK net profit
                  </span>
                </div>

                <div className="text-slate-400 pt-2">// 5. Road-trip leg energy (Prague → Berlin detour, Screen 1)</div>
                <div className="text-white">
                  E_leg = d × e_base × f_terrain × f_season, e_base = 1/5.6 ≈ 0.179 kWh/km, f_terrain ∈ [1.05, 1.3], f_season ∈ {'{'}1.0, 1.25{'}'}
                </div>
                <div className="text-white">
                  E_required_at_host = max(0, reserve × B + Σ E_remaining − SoC_arrival × B); t_host = ⌈E_required / P⌉
                </div>

                <div className="text-slate-400 pt-2">// 4. Battery state after charging</div>
                <div className="text-white">
                  SoC_departure = {currentSoc}% + {energyDelivered.toFixed(1)} / {VEHICLE_BATTERY_KWH} ={' '}
                  <span className="text-emerald-400 font-bold">{s.socDeparture}%</span> (+{s.rangeKm} km)
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] space-y-3">
            <div className="flex items-center justify-between text-emerald-400 font-sans font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4" /> Live Relational State (Stations: {stations.length} | Bookings: {bookings.length})
              </span>
              <span className="text-slate-400 font-normal">ERD Tables: CHARGING_STATIONS & BOOKINGS</span>
            </div>
            <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 overflow-x-auto text-slate-300 max-h-80">
              {JSON.stringify(
                {
                  active_bookings_table: bookings,
                  selected_station_record: {
                    station_id: selectedStation?.id,
                    title: selectedStation?.title,
                    public_location: [selectedStation?.lat, selectedStation?.lng],
                    exact_location_hidden: [selectedStation?.exactLat, selectedStation?.exactLng],
                    power_kw: selectedStation?.powerKw,
                    tariff_czk_kwh: selectedStation?.pricePerKwh,
                    booked_slots: selectedStation?.bookedSlots
                  }
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
