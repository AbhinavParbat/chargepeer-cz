import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MapPin,
  Zap,
  ShieldCheck,
  Star,
  CalendarCheck,
  Lock,
  Unlock,
  PlusCircle,
  User,
  Search,
  BatteryCharging,
  CheckCircle2,
  Camera,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Sparkles,
  Signal,
  Wifi,
  BatteryFull,
  Compass,
  Plug,
  KeyRound,
  Route,
  BadgeCheck,
  Clock,
  Info,
  X,
  ArrowLeftRight,
  Car,
  Wallet,
  Gauge
} from 'lucide-react';
import {
  INITIAL_STATIONS,
  PLATFORM_COMMISSION,
  DEFAULT_GRID_COST,
  DEMO_USER,
  HOST_BASELINE_STATS,
  NEW_LISTING_DEFAULT_LOCATION,
  TRIP_SCENARIO
} from './data/mockData';
import {
  computeSession,
  estimateHostEarnings,
  nextSlotSelection,
  defaultSlots,
  formatSlotRange,
  formatCzk,
  VEHICLE_BATTERY_KWH
} from './lib/calc';
import InteractiveMap from './components/InteractiveMap';
import MiniMap from './components/MiniMap';
import TripPlanner from './components/TripPlanner';
import DefenseInspector from './components/DefenseInspector';

const PHONE_W = 410;
const PHONE_H = 864;

const todayLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const monthYearLabel = () =>
  new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const initials = (name) =>
  name
    .replace(/^(Ing\.|Bc\.|Mgr\.)\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

/* ------------------------------------------------------------------ */
/* Small UI primitives                                                 */
/* ------------------------------------------------------------------ */

const Card = ({ className = '', children, ...rest }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    {...rest}
  >
    {children}
  </div>
);

const Pill = ({ tone = 'slate', icon: Icon, children }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-sky-50 text-sky-700'
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${tones[tone]}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

const Stat = ({ label, value, sub, accent = 'text-slate-900' }) => (
  <div className="bg-slate-50 rounded-xl px-2.5 py-2.5 text-center">
    <div className="text-[10.5px] text-slate-500 font-medium">{label}</div>
    <div className={`text-[15px] font-bold leading-tight mt-0.5 ${accent}`}>{value}</div>
    {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
  </div>
);

const SectionTitle = ({ children, right }) => (
  <div className="flex items-center justify-between px-0.5 mb-2">
    <h3 className="text-[13px] font-semibold text-slate-900">{children}</h3>
    {right}
  </div>
);

const PrimaryButton = ({ className = '', disabled, children, ...rest }) => (
  <button
    disabled={disabled}
    className={`h-12 rounded-2xl font-semibold text-[14px] transition flex items-center justify-center gap-2 ${
      disabled
        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
        : 'bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.99] shadow-[0_6px_16px_-6px_rgba(5,150,105,0.6)]'
    } ${className}`}
    {...rest}
  >
    {children}
  </button>
);

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="text-[11.5px] font-medium text-slate-600">{label}</span>
    <div className="mt-1">{children}</div>
    {hint && <span className="text-[10.5px] text-slate-500 mt-1 block">{hint}</span>}
  </label>
);

const inputCls =
  'w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-[13px] text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15';

/* ------------------------------------------------------------------ */
/* Scale the phone so it always fits the browser window                */
/* ------------------------------------------------------------------ */
function useFitScale(reserved) {
  const calc = () => Math.min(1, (window.innerHeight - reserved) / PHONE_H);
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const onResize = () => setScale(calc());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [reserved]);
  return scale;
}

/* ================================================================== */

export default function App() {
  const [stations, setStations] = useState(INITIAL_STATIONS);
  const [selectedStationId, setSelectedStationId] = useState(INITIAL_STATIONS[0].id);
  const [activeScreen, setActiveScreen] = useState(1); // 1 to 6
  const [userRole, setUserRole] = useState('GUEST'); // 'GUEST' | 'HOST'
  const [screenshotMode, setScreenshotMode] = useState(false);

  // Search & Filter states (Screen 1)
  const [searchQuery, setSearchQuery] = useState('');
  const [minPowerFilter, setMinPowerFilter] = useState(0);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showPublicDcOverlay, setShowPublicDcOverlay] = useState(false);

  // Road-trip range check (Screen 1, SO6)
  const [tripMode, setTripMode] = useState(false);
  const [tripStartSoc, setTripStartSoc] = useState(80);
  const [tripSeason, setTripSeason] = useState('winter');

  // Booking & EV Battery Range Calculator states (Screen 3)
  const [selectedSlots, setSelectedSlots] = useState(() => defaultSlots(INITIAL_STATIONS[0]));
  const [currentSoc, setCurrentSoc] = useState(24); // 24% battery (range anxiety threshold)

  // Reservations & Review (Screen 4)
  const [bookings, setBookings] = useState([
    {
      bookingId: 'BK-2026-801',
      stationId: 'P2P-CZ-01',
      stationTitle: 'Šumava Mountain Chalet Wallbox',
      municipality: 'Kvilda (Šumava Rural Zone)',
      exactAddress: 'Kvilda 48, 384 93 Kvilda (Driveway Carport)',
      exactLat: 49.0195,
      exactLng: 13.579,
      gatePin: '#4829*',
      slots: ['14:00', '15:00', '16:00'],
      date: todayLabel(),
      energyKwh: 33.0,
      totalCostCzk: 244.5,
      status: 'CONFIRMED',
      rated: false
    }
  ]);
  const [activeBookingId, setActiveBookingId] = useState('BK-2026-801');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTag, setReviewTag] = useState('Saved Rural Trip');
  const [reviewComment, setReviewComment] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef(null);

  // Host New Station Form (Screen 5)
  const [newStationForm, setNewStationForm] = useState({
    title: 'Český Krumlov Riverside Wallbox',
    municipality: 'Český Krumlov (South Bohemia)',
    powerKw: 11,
    connector: 'Type 2',
    pricePerKwh: 6.4,
    hourlyFee: 10,
    exactAddress: 'Parkán 105, 381 01 Český Krumlov',
    gatePin: '#5590*',
    lat: NEW_LISTING_DEFAULT_LOCATION.lat,
    lng: NEW_LISTING_DEFAULT_LOCATION.lng
  });

  const scrollRef = useRef(null);
  const scale = useFitScale(screenshotMode ? 48 : 120);

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) || stations[0],
    [stations, selectedStationId]
  );

  const filteredStations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stations
      .filter((s) => {
        const matchesSearch =
          !q || s.title.toLowerCase().includes(q) || s.municipality.toLowerCase().includes(q);
        const matchesPower = s.powerKw >= minPowerFilter;
        const matchesAvail = !onlyAvailable || s.availableNow;
        return matchesSearch && matchesPower && matchesAvail;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [stations, searchQuery, minPowerFilter, onlyAvailable]);

  const session = computeSession(selectedStation, selectedSlots, currentSoc);
  const activeBooking = bookings.find((b) => b.bookingId === activeBookingId) || bookings[0];

  // Reset scroll position when switching screens
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeScreen]);

  // Esc leaves screenshot mode
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setScreenshotMode(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const triggerToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(''), 3200);
  };

  const selectStation = (id) => {
    if (id === selectedStationId) return;
    const st = stations.find((s) => s.id === id);
    setSelectedStationId(id);
    if (st) setSelectedSlots(defaultSlots(st));
  };

  // Trip planner -> book the P2P host inside the charging gap for the required hours
  const handleBookTripHost = (hours, arrivalSoc) => {
    const host = stations.find((s) => s.id === TRIP_SCENARIO.hostStationId);
    if (!host) return;
    setSelectedStationId(host.id);
    setSelectedSlots(defaultSlots(host, '10:00', hours));
    const soc = Math.min(80, Math.max(5, arrivalSoc));
    setCurrentSoc(soc);
    setActiveScreen(3);
    triggerToast(`${hours} h pre-selected — arrival battery set to ${soc}%.`);
  };

  const toggleTimeSlot = (slot) => {
    setSelectedSlots((prev) => nextSlotSelection(selectedStation, prev, slot));
  };

  const handleConfirmBooking = () => {
    if (selectedSlots.length === 0) {
      triggerToast('Please select at least 1 available hour slot.');
      return;
    }
    const newBooking = {
      bookingId: `BK-2026-${Math.floor(100 + Math.random() * 899)}`,
      stationId: selectedStation.id,
      stationTitle: selectedStation.title,
      municipality: selectedStation.municipality,
      exactAddress: selectedStation.exactAddress,
      exactLat: selectedStation.exactLat,
      exactLng: selectedStation.exactLng,
      gatePin: selectedStation.gatePin,
      slots: [...selectedSlots],
      date: todayLabel(),
      energyKwh: Number(session.energyKwh.toFixed(1)),
      totalCostCzk: session.totalCost,
      status: 'CONFIRMED',
      rated: false
    };

    // Mark slots as booked to prevent conflicts (RQ2 / FR-05)
    setStations((prev) =>
      prev.map((st) =>
        st.id === selectedStation.id
          ? { ...st, bookedSlots: [...st.bookedSlots, ...selectedSlots] }
          : st
      )
    );
    setBookings((prev) => [newBooking, ...prev]);
    setActiveBookingId(newBooking.bookingId);
    setSelectedSlots([]);
    setActiveScreen(4);
    triggerToast('Booking confirmed — exact address & gate PIN unlocked.');
  };

  const handleSubmitReview = (bookingId) => {
    const targetBooking = bookings.find((b) => b.bookingId === bookingId);
    if (!targetBooking) return;

    setStations((prev) =>
      prev.map((st) => {
        if (st.id !== targetBooking.stationId) return st;
        const newRev = {
          id: `REV-${Date.now()}`,
          guest: 'Abhinav P.',
          rating: reviewRating,
          date: monthYearLabel(),
          tag: reviewTag,
          comment: reviewComment || 'Smooth charging session, accurate power output.'
        };
        const newCount = st.reviewCount + 1;
        const newAvg = Math.round(((st.rating * st.reviewCount + reviewRating) / newCount) * 100) / 100;
        return { ...st, rating: newAvg, reviewCount: newCount, reviews: [newRev, ...st.reviews] };
      })
    );

    setBookings((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId
          ? { ...b, status: 'COMPLETED', rated: true, givenRating: reviewRating }
          : b
      )
    );
    setReviewComment('');
    triggerToast('Thanks! Your review updated the host’s trust score.');
  };

  const handleCreateHostListing = (e) => {
    e.preventDefault();
    const nextNum = stations.length + 1;
    const createdStation = {
      id: `P2P-CZ-${String(nextNum).padStart(2, '0')}`,
      title: newStationForm.title,
      municipality: newStationForm.municipality,
      zoneType: 'New Host P2P Node',
      hostName: DEMO_USER.name,
      hostVerified: true,
      hardwareVerified: true,
      rating: 5.0,
      reviewCount: 0,
      connector: newStationForm.connector,
      powerKw: Number(newStationForm.powerKw),
      pricePerKwh: Number(newStationForm.pricePerKwh),
      hourlyFee: Number(newStationForm.hourlyFee),
      availableNow: true,
      instantBook: true,
      nearestPublicDcKm: 28.0,
      distanceKm: 1.5,
      // public point is offset ~150 m from the real driveway (NFR-03)
      lat: newStationForm.lat + 0.0011,
      lng: newStationForm.lng + 0.0013,
      exactLat: newStationForm.lat,
      exactLng: newStationForm.lng,
      publicAreaLabel: `${newStationForm.municipality} (250m Privacy Circle)`,
      exactAddress: newStationForm.exactAddress,
      gatePin: newStationForm.gatePin,
      hardwareModel: 'Smart Wallbox OCPP 1.6J',
      availableSlots: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
      bookedSlots: [],
      reviews: []
    };

    setStations((prev) => [createdStation, ...prev]);
    setSelectedStationId(createdStation.id);
    setSelectedSlots(defaultSlots(createdStation));
    setActiveScreen(1);
    triggerToast('Your charger is live on the ChargePeer map!');
  };

  const switchRole = () => {
    const nextRole = userRole === 'GUEST' ? 'HOST' : 'GUEST';
    setUserRole(nextRole);
    setActiveScreen(nextRole === 'HOST' ? 5 : 1);
  };

  /* ---------------- App bar per screen ---------------- */
  const screenMeta = {
    1: { title: 'Explore', subtitle: 'Shared home chargers across Czechia', tab: true },
    2: { title: 'Charger details', back: 1 },
    3: { title: 'Book a time slot', back: 2 },
    4: { title: 'My bookings', subtitle: 'Access details & reviews', tab: true },
    5: { title: 'Host a charger', subtitle: 'Share your wallbox, earn per kWh', tab: true },
    6: { title: 'Profile', subtitle: 'Account, roles & earnings', tab: true }
  }[activeScreen];

  const hostEstimate = estimateHostEarnings(newStationForm, 4);
  const myStations = stations.filter((s) => s.hostName.startsWith(DEMO_USER.name));
  const driverKwh = bookings.reduce((sum, b) => sum + b.energyKwh, 0);
  const driverSpend = bookings.reduce((sum, b) => sum + b.totalCostCzk, 0);

  /* ================================================================ */
  /* Phone                                                            */
  /* ================================================================ */
  const phone = (
    <div
      className="relative bg-[#111113] rounded-[60px] p-[11px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),inset_0_0_0_2px_#3a3a3c]"
      style={{ width: PHONE_W, height: PHONE_H }}
    >
      <div className="relative w-full h-full bg-slate-50 rounded-[49px] overflow-hidden flex flex-col text-slate-900">
        {/* iOS status bar */}
        <div className="relative h-[50px] shrink-0 bg-white flex items-center justify-between px-8 pt-1 text-[15px] font-semibold">
          <span className="tracking-tight">9:41</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-[11px] w-[120px] h-[34px] bg-black rounded-full" />
          <div className="flex items-center gap-1.5">
            <Signal className="w-4 h-4" strokeWidth={2.5} />
            <Wifi className="w-4 h-4" strokeWidth={2.5} />
            <BatteryFull className="w-6 h-6" strokeWidth={1.8} />
          </div>
        </div>

        {/* App bar */}
        <div className="shrink-0 bg-white px-4 pb-3 pt-1 border-b border-slate-200/70">
          {screenMeta.back ? (
            <div className="relative flex items-center h-9">
              <button
                onClick={() => setActiveScreen(screenMeta.back)}
                className="-ml-2 flex items-center text-emerald-700 text-[15px] font-medium"
              >
                <ChevronLeft className="w-6 h-6" />
                Back
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold">
                {screenMeta.title}
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-[26px] font-bold tracking-tight leading-tight">{screenMeta.title}</h1>
                <p className="text-[12.5px] text-slate-500">{screenMeta.subtitle}</p>
              </div>
              <button
                onClick={switchRole}
                className="mb-1 h-8 px-3 rounded-full bg-slate-100 text-slate-700 text-[11.5px] font-semibold flex items-center gap-1.5 hover:bg-slate-200"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                {userRole === 'GUEST' ? 'Host mode' : 'Driver mode'}
              </button>
            </div>
          )}
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-[108px] left-4 right-4 z-[2000] bg-slate-900 text-white px-3.5 py-3 rounded-2xl text-[12.5px] font-medium flex items-center gap-2.5 shadow-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Screen body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          {/* ============ SCREEN 1: MAP & DISCOVERY ============ */}
          {activeScreen === 1 && (
            <div className="px-4 pt-3 pb-6 space-y-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3.5 h-11 shadow-sm focus-within:border-emerald-500">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search town or region (Kvilda, Telč…)"
                  className="flex-1 bg-transparent text-[13.5px] placeholder-slate-500 focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter chips (FR-03) */}
              <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-0.5">
                {[
                  {
                    label: '22 kW',
                    icon: Zap,
                    active: minPowerFilter === 22,
                    onClick: () => setMinPowerFilter(minPowerFilter === 22 ? 0 : 22)
                  },
                  {
                    label: 'Available now',
                    icon: Clock,
                    active: onlyAvailable,
                    onClick: () => setOnlyAvailable(!onlyAvailable)
                  },
                  {
                    label: 'Prague → Berlin trip',
                    icon: Route,
                    active: tripMode,
                    onClick: () => setTripMode(!tripMode)
                  },
                  { label: 'Type 2 / CCS2', icon: Plug, active: false, static: true }
                ].map((c) => (
                  <button
                    key={c.label}
                    onClick={c.onClick}
                    disabled={c.static}
                    className={`h-8 px-3 rounded-full text-[12px] font-medium border shrink-0 flex items-center gap-1.5 transition ${
                      c.active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <c.icon className="w-3.5 h-3.5" />
                    {c.label}
                  </button>
                ))}
              </div>

              <InteractiveMap
                stations={filteredStations}
                selectedStation={selectedStation}
                onSelectStation={(st) => selectStation(st.id)}
                showPublicDcOverlay={showPublicDcOverlay}
                setShowPublicDcOverlay={setShowPublicDcOverlay}
                route={tripMode ? TRIP_SCENARIO : null}
              />

              {tripMode && (
                <TripPlanner
                  trip={TRIP_SCENARIO}
                  host={stations.find((s) => s.id === TRIP_SCENARIO.hostStationId)}
                  startSoc={tripStartSoc}
                  setStartSoc={setTripStartSoc}
                  season={tripSeason}
                  setSeason={setTripSeason}
                  onBookHost={handleBookTripHost}
                />
              )}

              <div className="flex items-center justify-between pt-1 px-0.5">
                <span className="text-[13px] font-semibold">
                  {filteredStations.length} chargers nearby
                </span>
                <span className="text-[11.5px] text-slate-500">Sorted by distance</span>
              </div>

              {filteredStations.length === 0 && (
                <Card className="p-6 text-center text-[13px] text-slate-500">
                  No chargers match your filters.
                </Card>
              )}

              {filteredStations.map((station) => {
                const isSelected = station.id === selectedStation.id;
                return (
                  <Card
                    key={station.id}
                    onClick={() => selectStation(station.id)}
                    className={`p-3.5 cursor-pointer transition ${
                      isSelected ? 'ring-2 ring-emerald-500 border-transparent' : 'hover:border-slate-300'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          station.availableNow ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Plug className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[14px] font-semibold leading-snug truncate">{station.title}</h3>
                          <div className="text-right shrink-0">
                            <div className="text-[15px] font-bold leading-none">
                              {station.pricePerKwh.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">CZK/kWh</div>
                          </div>
                        </div>
                        <p className="text-[12px] text-slate-500 flex items-center gap-1 -mt-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {station.municipality}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11.5px] text-slate-600 mt-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-semibold">{station.rating}</span>
                          <span className="text-slate-500">({station.reviewCount})</span>
                          <span className="text-slate-300">•</span>
                          <span>{station.distanceKm} km</span>
                          <span className="text-slate-300">•</span>
                          <span>
                            {station.powerKw} kW {station.connector}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {station.availableNow ? (
                          <Pill tone="green">● Available</Pill>
                        ) : (
                          <Pill tone="slate">In use</Pill>
                        )}
                        {station.hostVerified && (
                          <Pill tone="blue" icon={BadgeCheck}>
                            Verified host
                          </Pill>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectStation(station.id);
                          setActiveScreen(2);
                        }}
                        className="h-8 px-3.5 rounded-full bg-emerald-700 text-white font-semibold text-[12px] hover:bg-emerald-800 flex items-center gap-0.5"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ============ SCREEN 2: STATION DETAIL & TRUST ============ */}
          {activeScreen === 2 && (
            <div>
              <div className="relative">
                <MiniMap
                  key={selectedStation.id}
                  center={[selectedStation.lat, selectedStation.lng]}
                  zoom={15}
                  privacyRadius={250}
                  className="h-48"
                />
                <div className="absolute bottom-6 left-3 z-[1000] bg-white/95 backdrop-blur rounded-full pl-2 pr-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-md flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  Approximate area · exact address after booking
                </div>
              </div>

              <div className="px-4 -mt-4 relative z-[1001] space-y-3 pb-4">
                <Card className="p-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Pill tone="green">{selectedStation.zoneType}</Pill>
                    {selectedStation.instantBook ? (
                      <Pill tone="blue" icon={Zap}>
                        Instant book
                      </Pill>
                    ) : (
                      <Pill tone="amber">Host approval</Pill>
                    )}
                  </div>
                  <h2 className="text-[20px] font-bold tracking-tight leading-snug mt-2">
                    {selectedStation.title}
                  </h2>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">{selectedStation.municipality}</p>
                  <div className="flex items-center gap-1.5 text-[12.5px] mt-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-semibold">{selectedStation.rating}</span>
                    <span className="text-slate-500">· {selectedStation.reviewCount} reviews</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{selectedStation.distanceKm} km away</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <Stat label="Power" value={`${selectedStation.powerKw} kW`} sub={`AC · ${selectedStation.connector}`} />
                    <Stat
                      label="Energy"
                      value={selectedStation.pricePerKwh.toFixed(2)}
                      sub="CZK / kWh"
                      accent="text-emerald-700"
                    />
                    <Stat label="Parking" value={selectedStation.hourlyFee} sub="CZK / hour" />
                  </div>
                </Card>

                {/* Rural gap comparison */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-[13px] font-semibold">
                    <Route className="w-4 h-4 text-emerald-700" /> Detour saved
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {[
                      { label: 'Nearest public fast charger', km: selectedStation.nearestPublicDcKm, color: 'bg-amber-400' },
                      { label: 'This shared home charger', km: selectedStation.distanceKm, color: 'bg-emerald-500' }
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="flex justify-between text-[12px]">
                          <span className="text-slate-600">{row.label}</span>
                          <span className="font-semibold">{row.km} km</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.color}`}
                            style={{
                              width: `${Math.max(4, (row.km / Math.max(selectedStation.nearestPublicDcKm, selectedStation.distanceKm)) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Host & trust (FR-06, NFR-03) */}
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-bold text-[14px]">
                      {initials(selectedStation.hostName)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500">Hosted by</div>
                      <div className="text-[14px] font-semibold truncate">{selectedStation.hostName}</div>
                      <div className="text-[11.5px] text-slate-500 truncate">{selectedStation.hardwareModel}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedStation.hostVerified && (
                      <Pill tone="green" icon={ShieldCheck}>
                        ID verified
                      </Pill>
                    )}
                    {selectedStation.hardwareVerified ? (
                      <Pill tone="green" icon={Gauge}>
                        Meter verified
                      </Pill>
                    ) : (
                      <Pill tone="amber" icon={Gauge}>
                        Meter check pending
                      </Pill>
                    )}
                  </div>
                  <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-3 flex items-start gap-2.5 text-[11.5px] text-amber-900 leading-relaxed">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Host privacy protected.</strong> The exact address and gate PIN are hidden inside{' '}
                      <span className="font-medium">{selectedStation.publicAreaLabel}</span> until your booking is
                      confirmed.
                    </div>
                  </div>
                </Card>

                {/* Reviews */}
                <Card className="p-4">
                  <SectionTitle
                    right={
                      <span className="text-[12px] text-slate-500 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {selectedStation.rating} · {selectedStation.reviewCount}
                      </span>
                    }
                  >
                    Guest reviews
                  </SectionTitle>
                  {selectedStation.reviews.length === 0 ? (
                    <p className="text-[12.5px] text-slate-500">New listing — be the first to review!</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedStation.reviews.map((rev) => (
                        <div key={rev.id} className="pt-3 first:pt-0 border-t first:border-t-0 border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold">
                              {initials(rev.guest)}
                            </div>
                            <div className="flex-1">
                              <div className="text-[12.5px] font-semibold">{rev.guest}</div>
                              <div className="flex items-center gap-1 text-[10.5px] text-slate-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-2.5 h-2.5 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                                  />
                                ))}
                                <span className="ml-1">{rev.date}</span>
                              </div>
                            </div>
                            <Pill tone="green">{rev.tag}</Pill>
                          </div>
                          <p className="text-[12.5px] text-slate-600 mt-2 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Sticky CTA */}
              <div className="sticky bottom-0 z-[1001] bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex items-center gap-3">
                <div>
                  <div className="text-[16px] font-bold leading-none">
                    {selectedStation.pricePerKwh.toFixed(2)} <span className="text-[11px] font-medium text-slate-500">CZK/kWh</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">+ {selectedStation.hourlyFee} CZK/h parking</div>
                </div>
                <PrimaryButton className="flex-1" onClick={() => setActiveScreen(3)}>
                  Choose time slot
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* ============ SCREEN 3: SLOT BOOKING & RANGE ============ */}
          {activeScreen === 3 && (
            <div>
              <div className="px-4 pt-3 pb-4 space-y-3">
                <Card className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Plug className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold truncate">{selectedStation.title}</div>
                    <div className="text-[11.5px] text-slate-500">
                      {selectedStation.powerKw} kW · {selectedStation.pricePerKwh.toFixed(2)} CZK/kWh ·{' '}
                      {selectedStation.hourlyFee} CZK/h
                    </div>
                  </div>
                </Card>

                {/* Slot grid (FR-05) */}
                <Card className="p-4">
                  <SectionTitle
                    right={<span className="text-[12px] text-slate-500">Today · {todayLabel()}</span>}
                  >
                    Select hours
                  </SectionTitle>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedStation.availableSlots.map((slot) => {
                      const isOccupied = selectedStation.bookedSlots.includes(slot);
                      const isPicked = selectedSlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          disabled={isOccupied}
                          onClick={() => toggleTimeSlot(slot)}
                          className={`h-10 rounded-xl text-[12.5px] font-semibold border transition ${
                            isOccupied
                              ? 'bg-slate-50 text-slate-300 border-slate-100 line-through cursor-not-allowed'
                              : isPicked
                              ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-700" /> Selected
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded border border-slate-300" /> Free
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-slate-100" /> Booked
                      </span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      {formatSlotRange(selectedSlots)} · {selectedSlots.length} h
                    </span>
                  </div>
                </Card>

                {/* Range anxiety & SoC (SO6 / FR-07) */}
                <Card className="p-4 space-y-3">
                  <SectionTitle right={<span className="text-[11.5px] text-slate-500">{VEHICLE_BATTERY_KWH} kWh battery</span>}>
                    <span className="flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-emerald-700" /> Your battery
                    </span>
                  </SectionTitle>

                  {/* Battery visual */}
                  <div className="relative h-7 rounded-lg bg-slate-100 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-amber-400" style={{ width: `${currentSoc}%` }} />
                    <div
                      className="absolute inset-y-0 bg-emerald-500"
                      style={{ left: `${currentSoc}%`, width: `${session.socDeparture - currentSoc}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-2.5 text-[11px] font-bold text-slate-800">
                      <span>{currentSoc}%</span>
                      <span>{session.socDeparture}%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-slate-600">Battery on arrival</span>
                      <span className="font-semibold text-amber-700">{currentSoc}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={currentSoc}
                      onChange={(e) => setCurrentSoc(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Energy added" value={`+${session.energyKwh.toFixed(1)}`} sub="kWh" accent="text-emerald-700" />
                    <Stat label="Departure" value={`${session.socDeparture}%`} sub={`from ${currentSoc}%`} />
                    <Stat label="Range added" value={`+${session.rangeKm}`} sub="km" accent="text-emerald-700" />
                  </div>

                  {session.batteryCapped && (
                    <div className="flex items-start gap-2 text-[11.5px] text-sky-800 bg-sky-50 rounded-xl p-2.5">
                      <Info className="w-4 h-4 shrink-0 mt-px" />
                      Your battery will be full before the slot ends — you only pay for the energy actually delivered.
                    </div>
                  )}
                </Card>

                {/* Price breakdown (Section 3.5) */}
                <Card className="p-4 text-[12.5px]">
                  <SectionTitle>Price breakdown</SectionTitle>
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span>
                        Energy · {session.energyKwh.toFixed(1)} kWh × {selectedStation.pricePerKwh.toFixed(2)}
                      </span>
                      <span className="text-slate-900">{formatCzk(session.energyCost, 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Parking · {session.hours} h × {selectedStation.hourlyFee}
                      </span>
                      <span className="text-slate-900">{formatCzk(session.occupancyCost, 2)}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between text-[15px] font-bold">
                    <span>Total</span>
                    <span>{formatCzk(session.totalCost, 2)}</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    Includes {Math.round(PLATFORM_COMMISSION * 100)}% ChargePeer service fee. Charged after the session.
                  </p>
                </Card>
              </div>

              <div className="sticky bottom-0 z-[1001] bg-white border-t border-slate-200 px-4 pt-4 pb-1.5">
                <PrimaryButton
                  className="w-full"
                  disabled={selectedSlots.length === 0}
                  onClick={handleConfirmBooking}
                >
                  {selectedSlots.length === 0
                    ? 'Select at least one hour'
                    : `Confirm booking · ${formatCzk(session.totalCost)}`}
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* ============ SCREEN 4: ACCESS UNLOCK & RATING ============ */}
          {activeScreen === 4 && !activeBooking && (
            <div className="p-8 text-center text-slate-500 text-[13px]">
              <CalendarCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              No bookings yet. Find a charger on the Explore tab.
            </div>
          )}
          {activeScreen === 4 && activeBooking && (
            <div className="px-4 pt-3 pb-6 space-y-3">
              <Card className="overflow-hidden">
                <div
                  className={`px-4 py-2.5 flex items-center justify-between text-[11.5px] font-semibold ${
                    activeBooking.status === 'COMPLETED'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {activeBooking.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                    {activeBooking.status === 'COMPLETED' ? 'Completed' : 'Confirmed · access unlocked'}
                  </span>
                  <span className="font-mono opacity-80">{activeBooking.bookingId}</span>
                </div>

                <div className="p-4 pb-3">
                  <h2 className="text-[17px] font-bold leading-snug">{activeBooking.stationTitle}</h2>
                  <div className="flex items-center gap-3 text-[12px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="w-3.5 h-3.5" /> {activeBooking.date || 'Today'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatSlotRange(activeBooking.slots)}
                    </span>
                  </div>
                </div>

                <MiniMap
                  key={activeBooking.bookingId}
                  center={[activeBooking.exactLat, activeBooking.exactLng]}
                  zoom={16}
                  exactPin
                  className="h-40"
                />

                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <MapPin className="w-[18px] h-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-500">Exact driveway address</div>
                      <div className="text-[13px] font-semibold leading-snug">{activeBooking.exactAddress}</div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeBooking.exactLat},${activeBooking.exactLng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 px-3 rounded-full bg-slate-900 text-white text-[12px] font-semibold flex items-center gap-1 shrink-0"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Go
                    </a>
                  </div>

                  <div className="rounded-2xl bg-slate-900 text-white p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" /> Gate keypad PIN
                      </div>
                      <div className="font-mono text-[26px] font-bold tracking-[0.15em] mt-0.5">
                        {activeBooking.gatePin}
                      </div>
                    </div>
                    <div className="text-right text-[10.5px] text-slate-500 leading-snug">
                      Valid only during
                      <br />
                      <span className="text-white font-semibold">{formatSlotRange(activeBooking.slots)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Stat label="Energy" value={`${activeBooking.energyKwh} kWh`} />
                    <Stat label="Total" value={formatCzk(activeBooking.totalCostCzk)} accent="text-emerald-700" />
                  </div>
                </div>
              </Card>

              {/* Rating (FR-06) */}
              <Card className="p-4 space-y-3">
                <SectionTitle right={<Pill tone="green" icon={ShieldCheck}>Builds trust</Pill>}>
                  {activeBooking.rated ? 'Your review' : 'Rate your charging session'}
                </SectionTitle>

                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const value = activeBooking.rated ? activeBooking.givenRating || reviewRating : reviewRating;
                    return (
                      <button
                        key={star}
                        disabled={activeBooking.rated}
                        onClick={() => setReviewRating(star)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-8 h-8 transition ${
                            value >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {!activeBooking.rated && (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {['Saved Rural Trip', 'Accurate kW Speed', 'Easy Driveway Access', 'Fair kWh Tariff'].map(
                        (tag) => (
                          <button
                            key={tag}
                            onClick={() => setReviewTag(tag)}
                            className={`h-8 px-3 rounded-full text-[11.5px] font-medium border transition ${
                              reviewTag === tag
                                ? 'bg-emerald-700 text-white border-emerald-600'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {tag}
                          </button>
                        )
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="How was the charger and the host?"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[13px] placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </>
                )}

                <PrimaryButton
                  className="w-full"
                  disabled={activeBooking.rated}
                  onClick={() => handleSubmitReview(activeBooking.bookingId)}
                >
                  {activeBooking.rated ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Session completed · review saved
                    </>
                  ) : (
                    'Finish charging & submit review'
                  )}
                </PrimaryButton>
              </Card>

              {bookings.length > 1 && (
                <div>
                  <SectionTitle>Other bookings</SectionTitle>
                  <div className="space-y-2">
                    {bookings
                      .filter((b) => b.bookingId !== activeBooking.bookingId)
                      .map((b) => (
                        <Card
                          key={b.bookingId}
                          onClick={() => setActiveBookingId(b.bookingId)}
                          className="p-3 flex items-center justify-between cursor-pointer hover:border-slate-300"
                        >
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold truncate">{b.stationTitle}</div>
                            <div className="text-[11px] text-slate-500">
                              {formatSlotRange(b.slots)} · {b.status === 'COMPLETED' ? 'Completed' : 'Confirmed'}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ SCREEN 5: HOST ONBOARDING (FR-04) ============ */}
          {activeScreen === 5 && (
            <form onSubmit={handleCreateHostListing}>
              <div className="px-4 pt-3 pb-4 space-y-3">
                <Card className="p-4 space-y-3.5">
                  <div className="flex items-center gap-2 text-[13px] font-semibold">
                    <Sparkles className="w-4 h-4 text-emerald-700" /> Listing details
                  </div>
                  <Field label="Listing title">
                    <input
                      type="text"
                      required
                      value={newStationForm.title}
                      onChange={(e) => setNewStationForm({ ...newStationForm, title: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Municipality / region">
                    <input
                      type="text"
                      required
                      value={newStationForm.municipality}
                      onChange={(e) => setNewStationForm({ ...newStationForm, municipality: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </Card>

                <Card className="overflow-hidden">
                  <div className="px-4 pt-4 pb-2">
                    <div className="text-[13px] font-semibold">Charger location</div>
                    <p className="text-[11.5px] text-slate-500">
                      Tap the map or drag the pin. Guests only see a 250 m area until they book.
                    </p>
                  </div>
                  <MiniMap
                    center={[newStationForm.lat, newStationForm.lng]}
                    zoom={14}
                    exactPin
                    picker
                    onPick={(ll) => setNewStationForm((f) => ({ ...f, lat: ll.lat, lng: ll.lng }))}
                    className="h-44"
                  />
                  <div className="px-4 py-3 space-y-3">
                    <Field label="Exact driveway address" hint="Shared with guests only after a confirmed booking">
                      <input
                        type="text"
                        required
                        value={newStationForm.exactAddress}
                        onChange={(e) => setNewStationForm({ ...newStationForm, exactAddress: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Gate PIN for guests">
                      <input
                        type="text"
                        value={newStationForm.gatePin}
                        onChange={(e) => setNewStationForm({ ...newStationForm, gatePin: e.target.value })}
                        className={`${inputCls} font-mono`}
                      />
                    </Field>
                  </div>
                </Card>

                <Card className="p-4 space-y-3">
                  <div className="text-[13px] font-semibold">Hardware & pricing</div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Power output">
                      <select
                        value={newStationForm.powerKw}
                        onChange={(e) => setNewStationForm({ ...newStationForm, powerKw: Number(e.target.value) })}
                        className={inputCls}
                      >
                        <option value={7.4}>7.4 kW · 1-phase</option>
                        <option value={11}>11 kW · 3-phase</option>
                        <option value={22}>22 kW · 3-phase</option>
                      </select>
                    </Field>
                    <Field label="Connector">
                      <select
                        value={newStationForm.connector}
                        onChange={(e) => setNewStationForm({ ...newStationForm, connector: e.target.value })}
                        className={inputCls}
                      >
                        <option>Type 2</option>
                        <option>CCS2 / Type 2</option>
                      </select>
                    </Field>
                    <Field label="Price (CZK / kWh)">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={newStationForm.pricePerKwh}
                        onChange={(e) => setNewStationForm({ ...newStationForm, pricePerKwh: e.target.value })}
                        className={`${inputCls} font-semibold text-emerald-700`}
                      />
                    </Field>
                    <Field label="Parking (CZK / hour)">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={newStationForm.hourlyFee}
                        onChange={(e) => setNewStationForm({ ...newStationForm, hourlyFee: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </Card>

                {/* Earnings estimator (Section 3.5 R_host) */}
                <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-200/70">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-800">
                    <Wallet className="w-4 h-4" /> Estimated earnings
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Per 4-hour session at {newStationForm.powerKw} kW ({hostEstimate.energy.toFixed(1)} kWh)
                  </p>
                  <div className="mt-3 space-y-1.5 text-[12.5px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Guest pays</span>
                      <span>{formatCzk(hostEstimate.gross, 1)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>After {Math.round(PLATFORM_COMMISSION * 100)}% service fee</span>
                      <span>{formatCzk(hostEstimate.afterFee, 1)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Electricity cost ({DEFAULT_GRID_COST.toFixed(2)} CZK/kWh)</span>
                      <span>− {formatCzk(hostEstimate.energy * DEFAULT_GRID_COST, 1)}</span>
                    </div>
                  </div>
                  <div className="border-t border-emerald-200/70 mt-2.5 pt-2.5 flex justify-between items-baseline">
                    <span className="text-[13px] font-semibold">Your profit</span>
                    <span className={`text-[20px] font-bold ${hostEstimate.net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {hostEstimate.net >= 0 ? '+' : ''}
                      {formatCzk(hostEstimate.net, 1)}
                    </span>
                  </div>
                </Card>
              </div>

              <div className="sticky bottom-0 z-[1001] bg-white border-t border-slate-200 px-4 pt-4 pb-1.5">
                <PrimaryButton type="submit" className="w-full">
                  <PlusCircle className="w-4 h-4" /> Publish charger
                </PrimaryButton>
              </div>
            </form>
          )}

          {/* ============ SCREEN 6: PROFILE, ROLES & EARNINGS ============ */}
          {activeScreen === 6 && (
            <div className="px-4 pt-3 pb-6 space-y-3">
              <Card className="p-4 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-bold text-[18px]">
                  {DEMO_USER.initials}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-bold">{DEMO_USER.name}</h2>
                  <p className="text-[12px] text-slate-500">{DEMO_USER.homeArea}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <Pill tone="green" icon={BadgeCheck}>
                      Verified
                    </Pill>
                    <Pill tone="slate">Driver & Host</Pill>
                  </div>
                </div>
              </Card>

              {/* Dual-role switch (FR-01) */}
              <div className="bg-slate-200/70 p-1 rounded-xl grid grid-cols-2 text-[12.5px] font-semibold">
                {[
                  { role: 'GUEST', label: 'EV driver' },
                  { role: 'HOST', label: 'Charger host' }
                ].map((r) => (
                  <button
                    key={r.role}
                    onClick={() => setUserRole(r.role)}
                    className={`h-9 rounded-lg transition ${
                      userRole === r.role ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {userRole === 'HOST' ? (
                <Card className="p-4">
                  <SectionTitle right={<span className="text-[11.5px] text-slate-500">{myStations.length} listing(s)</span>}>
                    Host summary
                  </SectionTitle>
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Sessions" value={HOST_BASELINE_STATS.sessions} />
                    <Stat label="Energy shared" value={HOST_BASELINE_STATS.energyKwh} sub="kWh" accent="text-emerald-700" />
                    <Stat
                      label="Net earnings"
                      value={HOST_BASELINE_STATS.netEarningsCzk.toLocaleString('en-US')}
                      sub="CZK"
                      accent="text-emerald-700"
                    />
                  </div>
                  <div className="mt-3 space-y-2">
                    {myStations.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-[12.5px] bg-slate-50 rounded-xl px-3 py-2.5">
                        <span className="font-medium truncate">{s.title}</span>
                        <span className="text-slate-500 shrink-0 ml-2">{s.pricePerKwh.toFixed(2)} CZK/kWh</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card className="p-4">
                  <SectionTitle>Driver summary</SectionTitle>
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Bookings" value={bookings.length} />
                    <Stat label="Energy" value={driverKwh.toFixed(0)} sub="kWh" accent="text-emerald-700" />
                    <Stat label="Spent" value={driverSpend.toFixed(0)} sub="CZK" />
                  </div>
                </Card>
              )}

              <div>
                <SectionTitle>Recent bookings</SectionTitle>
                <div className="space-y-2">
                  {bookings.map((bk) => (
                    <Card
                      key={bk.bookingId}
                      onClick={() => {
                        setActiveBookingId(bk.bookingId);
                        setActiveScreen(4);
                      }}
                      className="p-3 flex items-center gap-3 cursor-pointer hover:border-slate-300"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <BatteryCharging className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate">{bk.stationTitle}</div>
                        <div className="text-[11px] text-slate-500">
                          {formatSlotRange(bk.slots)} · {bk.energyKwh} kWh
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[13px] font-bold">{formatCzk(bk.totalCostCzk)}</div>
                        <div
                          className={`text-[10.5px] font-medium ${
                            bk.status === 'COMPLETED' ? 'text-slate-500' : 'text-emerald-700'
                          }`}
                        >
                          {bk.status === 'COMPLETED' ? 'Completed' : 'Confirmed'}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <nav className="relative shrink-0 bg-white/95 backdrop-blur border-t border-slate-200 pt-1.5 pb-6 grid grid-cols-4">
          {[
            { screen: 1, label: 'Explore', icon: Compass, also: [2, 3] },
            { screen: 4, label: 'Bookings', icon: CalendarCheck },
            { screen: 5, label: 'Host', icon: PlusCircle },
            { screen: 6, label: 'Profile', icon: User }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeScreen === item.screen || item.also?.includes(activeScreen);
            return (
              <button
                key={item.screen}
                onClick={() => setActiveScreen(item.screen)}
                className={`flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-medium transition ${
                  active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-600'
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={active ? 2.3 : 1.8} />
                {item.label}
              </button>
            );
          })}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] rounded-full bg-slate-900" />
        </nav>
      </div>
    </div>
  );

  const scaledPhone = (
    <div className="shrink-0" style={{ width: PHONE_W * scale, height: PHONE_H * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: PHONE_W, height: PHONE_H }}>
        {phone}
      </div>
    </div>
  );

  /* ================================================================ */
  /* Screenshot mode: only the phone on a neutral background          */
  /* ================================================================ */
  if (screenshotMode) {
    return (
      <div className="min-h-screen bg-[#e9edf1] flex items-center justify-center p-6">
        {scaledPhone}
        <div className="fixed bottom-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur rounded-full shadow-lg px-2 py-1.5 opacity-40 hover:opacity-100 transition">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setActiveScreen(n)}
              className={`w-7 h-7 rounded-full text-[12px] font-semibold ${
                activeScreen === n ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setScreenshotMode(false)}
            className="ml-1 h-7 px-3 rounded-full bg-slate-900 text-white text-[11px] font-semibold"
          >
            Exit (Esc)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top thesis header bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              ChargePeer CZ — P2P EV Charging Network Prototype
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Diploma Thesis • Abhinav Kumar Parbat
              </span>
            </h1>
            <p className="text-xs text-slate-500">FEM CZU Prague • Supervisor: Ing. Petr Benda, Ph.D.</p>
          </div>
        </div>

        <button
          onClick={() => setScreenshotMode(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 transition"
        >
          <Camera className="w-4 h-4" />
          Screenshot mode (phone only)
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex items-start justify-center gap-8">
        {scaledPhone}
        <DefenseInspector
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          selectedStation={selectedStation}
          selectedSlots={selectedSlots}
          currentSoc={currentSoc}
          bookings={bookings}
          stations={stations}
        />
      </main>
    </div>
  );
}
