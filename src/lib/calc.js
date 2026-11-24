import { PLATFORM_COMMISSION, DEFAULT_GRID_COST } from '../data/mockData';

export const VEHICLE_BATTERY_KWH = 60;    // B = reference BEV battery capacity
export const EFFICIENCY_KM_PER_KWH = 5.6; // ~17.8 kWh / 100 km

/**
 * Section 3.5 formulas, in one place so the phone UI and the
 * defense inspector always show identical numbers.
 *
 *  E_potential = P × t
 *  E_needed    = (100 − SoC_arrival) / 100 × B
 *  E_delivered = min(E_potential, E_needed)          // a full battery stops accepting energy
 *  C_session   = E_delivered × p_kWh + t × p_hour
 *  R_host      = (1 − α) × C_session − E_delivered × C_grid
 */
export function computeSession(station, slots, socArrival, batteryKwh = VEHICLE_BATTERY_KWH) {
  const hours = slots.length;
  const energyPotentialKwh = station.powerKw * hours;
  const energyNeededKwh = ((100 - socArrival) / 100) * batteryKwh;
  const energyKwh = Math.min(energyPotentialKwh, energyNeededKwh);
  const batteryCapped = energyPotentialKwh > energyNeededKwh;

  const socDeparture = Math.min(100, Math.round(socArrival + (energyKwh / batteryKwh) * 100));
  const rangeKm = Math.round(energyKwh * EFFICIENCY_KM_PER_KWH);

  const energyCost = energyKwh * station.pricePerKwh;
  const occupancyCost = hours * station.hourlyFee;
  const totalCost = energyCost + occupancyCost;
  const platformFee = PLATFORM_COMMISSION * totalCost;
  const hostNet = (1 - PLATFORM_COMMISSION) * totalCost - energyKwh * DEFAULT_GRID_COST;

  return {
    hours,
    energyPotentialKwh,
    energyNeededKwh,
    energyKwh,
    batteryCapped,
    socDeparture,
    rangeKm,
    energyCost,
    occupancyCost,
    totalCost,
    platformFee,
    hostNet
  };
}

/** Host earnings estimate for a reference session of `hours` at full power. */
export function estimateHostEarnings({ powerKw, pricePerKwh, hourlyFee }, hours = 4) {
  const energy = Number(powerKw) * hours;
  const gross = energy * Number(pricePerKwh) + hours * Number(hourlyFee);
  const afterFee = (1 - PLATFORM_COMMISSION) * gross;
  const net = afterFee - energy * DEFAULT_GRID_COST;
  return { energy, gross, afterFee, net };
}

/* ---------- Time-slot helpers (FR-05: contiguous, conflict-free reservation) ---------- */

/**
 * Returns the next slot selection after tapping `slot`.
 * A charging session is one contiguous block of hours, so tapping extends
 * the block if possible, or starts a new one if a booked hour is in the way.
 */
export function nextSlotSelection(station, current, slot) {
  const all = station.availableSlots;
  const booked = new Set(station.bookedSlots);
  if (booked.has(slot)) return current;

  const idx = all.indexOf(slot);
  if (current.length === 0) return [slot];

  const idxs = current.map((s) => all.indexOf(s));
  const first = Math.min(...idxs);
  const last = Math.max(...idxs);

  if (current.includes(slot)) {
    if (idx === first || idx === last) return current.filter((s) => s !== slot);
    return [slot];
  }

  const range = all.slice(Math.min(first, idx), Math.max(last, idx) + 1);
  if (range.some((s) => booked.has(s))) return [slot];
  return range;
}

/** Picks a sensible default block (prefers 14:00–17:00) that is free. */
export function defaultSlots(station, preferred = '14:00', n = 3) {
  const all = station.availableSlots;
  const booked = new Set(station.bookedSlots);
  const tryFrom = (start) => {
    const r = all.slice(start, start + n);
    return r.length === n && r.every((s) => !booked.has(s)) ? r : null;
  };
  const p = all.indexOf(preferred);
  if (p >= 0) {
    const r = tryFrom(p);
    if (r) return r;
  }
  for (let i = 0; i < all.length; i++) {
    const r = tryFrom(i);
    if (r) return r;
  }
  const free = all.find((s) => !booked.has(s));
  return free ? [free] : [];
}

/** "14:00", "15:00", "16:00" -> "14:00 – 17:00" */
export function formatSlotRange(slots) {
  if (!slots || slots.length === 0) return '—';
  const sorted = [...slots].sort();
  const endHour = parseInt(sorted[sorted.length - 1].slice(0, 2), 10) + 1;
  return `${sorted[0]} – ${String(endHour).padStart(2, '0')}:00`;
}

export function formatCzk(value, digits = 0) {
  return `${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })} CZK`;
}

/* ---------- Road-trip range check (SO6: range anxiety & route flexibility) ---------- */

export const BASE_CONSUMPTION_KWH_PER_KM = 1 / EFFICIENCY_KM_PER_KWH; // ≈ 0.179 kWh/km
export const SEASON_FACTORS = { summer: 1.0, winter: 1.25 }; // cold battery + cabin heating

/** E_leg = d × e_base × f_terrain × f_season */
export function legEnergyKwh(leg, season) {
  return leg.km * BASE_CONSUMPTION_KWH_PER_KM * leg.terrainFactor * SEASON_FACTORS[season];
}

/**
 * Simulates battery state of charge along the trip legs.
 * `chargeKwh` is added at the end of leg `trip.hostAfterLeg` (the P2P stop),
 * capped by the free battery capacity.
 */
export function simulateTrip(trip, { startSoc, season, batteryKwh = VEHICLE_BATTERY_KWH, chargeKwh = 0 }) {
  let soc = startSoc;
  const points = [{ label: trip.legs[0].from, soc }];
  let chargedKwh = 0;
  trip.legs.forEach((leg, i) => {
    soc -= (legEnergyKwh(leg, season) / batteryKwh) * 100;
    points.push({ label: leg.short || leg.to, soc, legId: leg.id });
    if (i === trip.hostAfterLeg && chargeKwh > 0) {
      const room = ((100 - soc) / 100) * batteryKwh;
      chargedKwh = Math.min(chargeKwh, room);
      soc += (chargedKwh / batteryKwh) * 100;
      points.push({ label: 'Charged', soc, isCharge: true });
    }
  });
  const minSoc = Math.min(...points.map((p) => p.soc));
  return {
    points,
    chargedKwh,
    finalSoc: soc,
    minSoc,
    feasible: minSoc >= trip.reserveSoc,
    strandedRisk: minSoc < 0
  };
}

/**
 * Full analysis: is the detour possible without charging? If not, how many
 * kWh (and hours at the host's power) are needed at the P2P stop so that every
 * point of the remaining trip stays above the reserve SoC?
 */
export function analyzeTrip(trip, host, { startSoc, season, batteryKwh = VEHICLE_BATTERY_KWH }) {
  const without = simulateTrip(trip, { startSoc, season, batteryKwh });
  const arrivalSocAtHost = without.points[trip.hostAfterLeg + 1].soc;

  // Energy for every leg after the host stop
  const remainingKwh = trip.legs
    .slice(trip.hostAfterLeg + 1)
    .reduce((sum, leg) => sum + legEnergyKwh(leg, season), 0);
  const needAtHostKwh = (trip.reserveSoc / 100) * batteryKwh + remainingKwh;
  const haveAtHostKwh = (arrivalSocAtHost / 100) * batteryKwh;
  const requiredKwh = Math.max(0, needAtHostKwh - haveAtHostKwh);
  const requiredHours = requiredKwh > 0 ? Math.ceil(requiredKwh / host.powerKw) : 0;

  const withCharge = simulateTrip(trip, {
    startSoc,
    season,
    batteryKwh,
    chargeKwh: requiredHours * host.powerKw
  });

  return {
    without,
    withCharge,
    arrivalSocAtHost,
    remainingKwh,
    requiredKwh,
    requiredHours,
    reachableWithoutHost: without.feasible,
    hostReachable: arrivalSocAtHost >= trip.reserveSoc,
    totalKm: trip.legs.reduce((s, l) => s + l.km, 0)
  };
}
