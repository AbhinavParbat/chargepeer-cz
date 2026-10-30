import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Zap,
  ShieldCheck,
  Star,
  Calendar,
  Clock,
  Lock,
  Unlock,
  PlusCircle,
  UserCheck,
  Search,
  BatteryCharging,
  CheckCircle2,
  Camera,
  SlidersHorizontal,
  ArrowLeft,
  Navigation,
  Sparkles
} from 'lucide-react';
import {
  INITIAL_STATIONS,
  PLATFORM_COMMISSION,
  DEFAULT_GRID_COST
} from './data/mockData';
import InteractiveMap from './components/InteractiveMap';
import DefenseInspector from './components/DefenseInspector';

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

  // Booking & EV Battery Range Calculator states (Screen 3)
  const [selectedSlots, setSelectedSlots] = useState(['14:00', '15:00', '16:00']);
  const [currentSoc, setCurrentSoc] = useState(24); // 24% battery (range anxiety threshold)
  const [vehicleBatteryKwh] = useState(60); // 60 kWh standard BEV

  // Active Reservations & Review Modal (Screen 4)
  const [bookings, setBookings] = useState([
    {
      bookingId: 'BK-2026-801',
      stationId: 'P2P-CZ-01',
      stationTitle: 'Šumava Mountain Chalet Wallbox',
      municipality: 'Kvilda (Šumava Rural Zone)',
      exactAddress: 'Kvilda 48, 384 93 Kvilda (Driveway Carport)',
      gatePin: '#4829*',
      slots: ['14:00', '15:00', '16:00'],
      energyKwh: 33.0,
      totalCostCzk: 244.5,
      status: 'CONFIRMED',
      rated: false
    }
  ]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTag, setReviewTag] = useState('Saved Rural Trip');
  const [reviewComment, setReviewComment] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Host New Station Form (Screen 5)
  const [newStationForm, setNewStationForm] = useState({
    title: 'Český Krumlov Riverside Wallbox',
    municipality: 'Český Krumlov (South Bohemia)',
    powerKw: 11,
    connector: 'Type 2',
    pricePerKwh: 6.4,
    hourlyFee: 10,
    exactAddress: 'Parkán 105, 381 01 Český Krumlov',
    gatePin: '#5590*'
  });

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) || stations[0],
    [stations, selectedStationId]
  );

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.municipality.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPower = s.powerKw >= minPowerFilter;
      const matchesAvail = !onlyAvailable || s.availableNow;
      return matchesSearch && matchesPower && matchesAvail;
    });
  }, [stations, searchQuery, minPowerFilter, onlyAvailable]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Booking Calculations (Chapter 3 Formulas)
  const durationHours = Math.max(selectedSlots.length, 1);
  const energyDeliveredKwh = selectedStation.powerKw * durationHours;
  const socAddedPercent = Math.min(
    100 - currentSoc,
    Math.round((energyDeliveredKwh / vehicleBatteryKwh) * 100)
  );
  const rangeKmAdded = Math.round(energyDeliveredKwh * 5.6); // ~17.8 kWh/100km
  const totalSessionCost =
    energyDeliveredKwh * selectedStation.pricePerKwh +
    durationHours * selectedStation.hourlyFee;

  const toggleTimeSlot = (slot) => {
    if (selectedStation.bookedSlots.includes(slot)) return;
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((t) => t !== slot) : [...prev, slot].sort()
    );
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
      gatePin: selectedStation.gatePin,
      slots: [...selectedSlots],
      energyKwh: energyDeliveredKwh,
      totalCostCzk: totalSessionCost,
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
    setActiveScreen(4);
    triggerToast('Reservation confirmed! Exact driveway address & Gate PIN unlocked.');
  };

  const handleSubmitReview = (bookingId) => {
    const targetBooking = bookings.find((b) => b.bookingId === bookingId);
    if (!targetBooking) return;

    setStations((prev) =>
      prev.map((st) => {
        if (st.id !== targetBooking.stationId) return st;
        const newRev = {
          id: `REV-${Date.now()}`,
          guest: 'Abhinav P. (Verified EV Guest)',
          rating: reviewRating,
          date: 'Oct 2026',
          tag: reviewTag,
          comment: reviewComment || 'Smooth charging session, accurate power output.'
        };
        return {
          ...st,
          reviewCount: st.reviewCount + 1,
          reviews: [newRev, ...st.reviews]
        };
      })
    );

    setBookings((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId ? { ...b, status: 'COMPLETED', rated: true } : b
      )
    );
    setReviewComment('');
    triggerToast('Bilateral 5-star review recorded & Host Trust Score updated!');
  };

  const handleCreateHostListing = (e) => {
    e.preventDefault();
    const createdStation = {
      id: `P2P-CZ-0${stations.length + 1}`,
      title: newStationForm.title,
      municipality: newStationForm.municipality,
      zoneType: 'New Host P2P Node',
      hostName: 'Abhinav Kumar Parbat',
      hostVerified: true,
      hardwareVerified: true,
      rating: 5.0,
      reviewCount: 1,
      connector: newStationForm.connector,
      powerKw: Number(newStationForm.powerKw),
      pricePerKwh: Number(newStationForm.pricePerKwh),
      hourlyFee: Number(newStationForm.hourlyFee),
      availableNow: true,
      instantBook: true,
      nearestPublicDcKm: 28.0,
      distanceKm: 1.5,
      mapX: 35,
      mapY: 78,
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
    setActiveScreen(1);
    triggerToast('New residential charger published to the Czech P2P map!');
  };

  const activeBooking = bookings[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Thesis Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              ChargePeer CZ — P2P EV Charging Network Prototype
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Diploma Thesis • Abhinav Kumar Parbat
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              FEM CZU Prague • Supervisor: Ing. Petr Benda, Ph.D.
            </p>
          </div>
        </div>

        <button
          onClick={() => setScreenshotMode(!screenshotMode)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
            screenshotMode
              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Camera className="w-4 h-4" />
          {screenshotMode ? 'Exit Screenshot Mode' : 'Chapter 4 Screenshot Mode (Phone Only)'}
        </button>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex items-center justify-center gap-8">
        {/* iPhone 15 Pro Mobile Frame */}
        <div className="w-[390px] h-[812px] bg-slate-950 rounded-[48px] border-[10px] border-slate-800 shadow-2xl relative flex flex-col overflow-hidden shrink-0">
          {/* Dynamic Island Notch */}
          <div className="bg-slate-900 pt-2 pb-2 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-300 border-b border-slate-800/80">
            <span>09:41</span>
            <div className="w-20 h-4 bg-black rounded-full" />
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span>5G</span>
              <BatteryCharging className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* App Sub-Header with Role Pill */}
          <div className="bg-slate-900/95 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              {activeScreen !== 1 && (
                <button
                  onClick={() => setActiveScreen(1)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <div className="text-xs font-extrabold tracking-tight text-white flex items-center gap-1">
                  ChargePeer <span className="text-emerald-400">P2P</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Screen {activeScreen} of 6 • {userRole === 'GUEST' ? 'EV Driver Mode' : 'Charger Host Mode'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const nextRole = userRole === 'GUEST' ? 'HOST' : 'GUEST';
                setUserRole(nextRole);
                setActiveScreen(nextRole === 'HOST' ? 5 : 1);
              }}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition"
            >
              Switch to {userRole === 'GUEST' ? 'Host' : 'Driver'}
            </button>
          </div>

          {/* Toast Alert Banner */}
          {toastMessage && (
            <div className="mx-3 mt-2 bg-emerald-500 text-slate-950 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Screen Body Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-950">
            {/* SCREEN 1: GEOLOCATION MAP & STATION DISCOVERY */}
            {activeScreen === 1 && (
              <>
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rural town (Kvilda, Telč, Jeseníky, Suchdol)..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick Filter Chips (FR-03) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => setMinPowerFilter(minPowerFilter === 22 ? 0 : 22)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border shrink-0 flex items-center gap-1 ${
                      minPowerFilter === 22
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" /> 22 kW Fast AC
                  </button>
                  <button
                    onClick={() => setOnlyAvailable(!onlyAvailable)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border shrink-0 ${
                      onlyAvailable
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    Available Now
                  </button>
                  <span className="px-2 py-1 rounded-lg text-[10px] bg-slate-900/60 text-slate-400 border border-slate-800/80 shrink-0">
                    Type 2 / CCS2
                  </span>
                </div>

                {/* Interactive Czech Map */}
                <InteractiveMap
                  stations={filteredStations}
                  selectedStation={selectedStation}
                  onSelectStation={(st) => setSelectedStationId(st.id)}
                  showPublicDcOverlay={showPublicDcOverlay}
                  setShowPublicDcOverlay={setShowPublicDcOverlay}
                />

                {/* Station Cards List */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                    <span>NEARBY SHARED PRIVATE WALLBOXES ({filteredStations.length})</span>
                    <span className="text-emerald-400">Tap to Inspect</span>
                  </div>

                  {filteredStations.map((station) => {
                    const isSelected = station.id === selectedStation.id;
                    return (
                      <div
                        key={station.id}
                        onClick={() => setSelectedStationId(station.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-500/80 shadow-md'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-semibold text-emerald-400 uppercase">
                              {station.zoneType}
                            </span>
                            <h3 className="text-xs font-bold text-white">{station.title}</h3>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {station.municipality}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-extrabold text-emerald-400">
                              {station.pricePerKwh.toFixed(2)} CZK/kWh
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {station.powerKw} kW • {station.connector}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                              <Star className="w-3 h-3 fill-current" /> {station.rating} ({station.reviewCount})
                            </span>
                            {station.hostVerified && (
                              <span className="flex items-center gap-0.5 text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                <ShieldCheck className="w-3 h-3" /> Verified Host
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStationId(station.id);
                              setActiveScreen(2);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] hover:bg-emerald-400"
                          >
                            View & Book
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* SCREEN 2: STATION DETAIL & DIGITAL TRUST PROFILE */}
            {activeScreen === 2 && (
              <div className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {selectedStation.zoneType}
                    </span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current" /> {selectedStation.rating} ({selectedStation.reviewCount} reviews)
                    </span>
                  </div>
                  <h2 className="text-sm font-extrabold text-white">{selectedStation.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedStation.municipality}</p>

                  {/* Rural Gap Comparison Pill */}
                  <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Nearest Commercial DC Charger:</span>
                    <span className="font-bold text-amber-400">
                      {selectedStation.nearestPublicDcKm} km away
                    </span>
                  </div>

                  {/* Hardware & Tariff Specs */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Output</div>
                      <div className="text-xs font-extrabold text-white">{selectedStation.powerKw} kW AC</div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Energy Tariff</div>
                      <div className="text-xs font-extrabold text-emerald-400">
                        {selectedStation.pricePerKwh.toFixed(2)} CZK
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Occupancy</div>
                      <div className="text-xs font-extrabold text-white">
                        {selectedStation.hourlyFee} CZK/h
                      </div>
                    </div>
                  </div>
                </div>

                {/* Host Digital Trust & Privacy Protection Box (FR-06, NFR-03) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Residential Host</div>
                      <div className="text-xs font-bold text-white">{selectedStation.hostName}</div>
                      <div className="text-[10px] text-slate-400">{selectedStation.hardwareModel}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> ID & Meter Verified
                      </span>
                    </div>
                  </div>

                  {/* 250m Address Obfuscation Notice */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-amber-200">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Host Privacy Protection (NFR-03):</strong> Exact house number and gate PIN are masked inside a{' '}
                      <span className="underline">{selectedStation.publicAreaLabel}</span> until your booking is confirmed.
                    </div>
                  </div>
                </div>

                {/* Bilateral Community Reviews */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="text-xs font-bold text-white">Verified EV Guest Reviews</div>
                  {selectedStation.reviews.length === 0 ? (
                    <p className="text-xs text-slate-500">Newly listed station — be the first to review!</p>
                  ) : (
                    selectedStation.reviews.map((rev) => (
                      <div key={rev.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-200">{rev.guest}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold">
                            {rev.tag}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setActiveScreen(3)}
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
                >
                  Select Time Slot & Calculate Range →
                </button>
              </div>
            )}

            {/* SCREEN 3: CONFLICT-FREE SLOT BOOKING & RANGE CALCULATOR */}
            {activeScreen === 3 && (
              <div className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
                  <div className="text-[10px] font-bold uppercase text-emerald-400">
                    Step 2 of 3 • Conflict-Free Reservation (FR-05)
                  </div>
                  <h2 className="text-sm font-bold text-white">{selectedStation.title}</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tap hourly slots below. Grey slots are already reserved in the database.
                  </p>

                  {/* Time-Slot Grid */}
                  <div className="grid grid-cols-4 gap-1.5 mt-3">
                    {selectedStation.availableSlots.map((slot) => {
                      const isOccupied = selectedStation.bookedSlots.includes(slot);
                      const isPicked = selectedSlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          disabled={isOccupied}
                          onClick={() => toggleTimeSlot(slot)}
                          className={`py-2 rounded-xl text-[11px] font-bold border transition ${
                            isOccupied
                              ? 'bg-slate-950 text-slate-600 border-slate-800 line-through cursor-not-allowed'
                              : isPicked
                              ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Range Anxiety & SoC Estimator (SO6 / FR-07) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <BatteryCharging className="w-4 h-4 text-emerald-400" />
                      Range Anxiety & Battery SoC Calculator
                    </span>
                    <span className="text-[10px] text-slate-400">60 kWh EV Pack</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Arrival Battery State of Charge (SoC):</span>
                      <span className="font-bold text-amber-400">{currentSoc}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={currentSoc}
                      onChange={(e) => setCurrentSoc(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400">Energy Added</div>
                      <div className="text-xs font-extrabold text-emerald-400">
                        +{energyDeliveredKwh.toFixed(1)} kWh
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Departure SoC</div>
                      <div className="text-xs font-extrabold text-white">
                        {currentSoc}% → {currentSoc + socAddedPercent}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Range Added</div>
                      <div className="text-xs font-extrabold text-emerald-400">+{rangeKmAdded} km</div>
                    </div>
                  </div>
                </div>

                {/* Transparent Session Cost Breakdown (Section 3.5 Equation) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs">
                  <div className="font-bold text-white mb-1">Transparent Tariff Breakdown (C_session)</div>
                  <div className="flex justify-between text-slate-400">
                    <span>
                      Energy ({energyDeliveredKwh.toFixed(1)} kWh × {selectedStation.pricePerKwh.toFixed(2)} CZK)
                    </span>
                    <span>{(energyDeliveredKwh * selectedStation.pricePerKwh).toFixed(2)} CZK</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>
                      Driveway Occupancy ({durationHours} h × {selectedStation.hourlyFee} CZK/h)
                    </span>
                    <span>{(durationHours * selectedStation.hourlyFee).toFixed(2)} CZK</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 mt-1 flex justify-between font-extrabold text-sm text-emerald-400">
                    <span>Total Estimated Cost</span>
                    <span>{totalSessionCost.toFixed(2)} CZK</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmBooking}
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
                >
                  Confirm Instant Booking ({totalSessionCost.toFixed(0)} CZK)
                </button>
              </div>
            )}

            {/* SCREEN 4: ACTIVE SESSION, ADDRESS REVEAL & BILATERAL RATING */}
            {activeScreen === 4 && activeBooking && (
              <div className="space-y-3">
                <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-300 flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5" /> Booking {activeBooking.bookingId} • {activeBooking.status}
                    </span>
                    <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-300 font-mono">
                      {activeBooking.slots.join(', ')}
                    </span>
                  </div>
                  <h2 className="text-sm font-extrabold text-white mt-1">
                    {activeBooking.stationTitle}
                  </h2>

                  {/* Exact Private Address & Gate PIN Unlocked (NFR-03 Fulfilled) */}
                  <div className="mt-3 bg-slate-950 rounded-xl p-3 border border-emerald-500/30 space-y-1.5">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">
                      Exact Driveway Coordinates Unlocked:
                    </div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                      {activeBooking.exactAddress}
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-xs">
                      <span className="text-slate-400">Smart Gate Keypad PIN:</span>
                      <span className="font-mono font-extrabold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                        {activeBooking.gatePin}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bilateral Digital Trust Rating Box (FR-06) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white">
                      Complete Session & Rate Host (FR-06)
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-semibold">Bilateral Trust</span>
                  </div>

                  {/* 1-5 Star Selector */}
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`p-1.5 rounded-lg border ${
                          reviewRating >= star
                            ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                            : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-1">{reviewRating}.0 / 5.0</span>
                  </div>

                  {/* Structured Trust Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {['Saved Rural Trip', 'Accurate kW Speed', 'Easy Driveway Access', 'Fair kWh Tariff'].map(
                      (tag) => (
                        <button
                          key={tag}
                          onClick={() => setReviewTag(tag)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${
                            reviewTag === tag
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    )}
                  </div>

                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your charging experience with the P2P community..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />

                  <button
                    disabled={activeBooking.rated}
                    onClick={() => handleSubmitReview(activeBooking.bookingId)}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition ${
                      activeBooking.rated
                        ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    }`}
                  >
                    {activeBooking.rated
                      ? '✓ Session Completed & Bilateral Review Saved'
                      : 'Complete Charging & Submit Verified Review'}
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 5: HOST MODE — LIST A PRIVATE WALLBOX (FR-04) */}
            {activeScreen === 5 && (
              <form onSubmit={handleCreateHostListing} className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-emerald-400">
                      Host Onboarding (FR-04)
                    </span>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-sm font-bold text-white">List Your Private Home Charger</h2>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold">Station Listing Title</label>
                    <input
                      type="text"
                      required
                      value={newStationForm.title}
                      onChange={(e) => setNewStationForm({ ...newStationForm, title: e.target.value })}
                      className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold">Municipality / Rural Region</label>
                    <input
                      type="text"
                      required
                      value={newStationForm.municipality}
                      onChange={(e) =>
                        setNewStationForm({ ...newStationForm, municipality: e.target.value })
                      }
                      className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold">Power Output (kW)</label>
                      <select
                        value={newStationForm.powerKw}
                        onChange={(e) =>
                          setNewStationForm({ ...newStationForm, powerKw: Number(e.target.value) })
                        }
                        className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value={7.4}>7.4 kW (1-Phase)</option>
                        <option value={11}>11 kW (3-Phase)</option>
                        <option value={22}>22 kW (3-Phase Fast)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold">Price (CZK / kWh)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newStationForm.pricePerKwh}
                        onChange={(e) =>
                          setNewStationForm({ ...newStationForm, pricePerKwh: e.target.value })
                        }
                        className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold">
                      Private Driveway Address (Masked until booked)
                    </label>
                    <input
                      type="text"
                      required
                      value={newStationForm.exactAddress}
                      onChange={(e) =>
                        setNewStationForm({ ...newStationForm, exactAddress: e.target.value })
                      }
                      className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Live Host Net Profit Simulator (Section 3.5 R_host Equation) */}
                <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-3 text-xs space-y-1">
                  <div className="font-bold text-emerald-400">
                    Host Net Profit Estimator (4-Hour Session @ {newStationForm.powerKw} kW)
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Gross Session Tariff (minus 12% platform fee):</span>
                    <span>
                      {(
                        0.88 *
                        (newStationForm.powerKw * 4 * newStationForm.pricePerKwh +
                          4 * newStationForm.hourlyFee)
                      ).toFixed(1)}{' '}
                      CZK
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                    <span>Net Profit Above Residential Grid Tariff (4.20 CZK):</span>
                    <span className="text-emerald-400">
                      +
                      {(
                        0.88 *
                          (newStationForm.powerKw * 4 * newStationForm.pricePerKwh +
                            4 * newStationForm.hourlyFee) -
                        newStationForm.powerKw * 4 * DEFAULT_GRID_COST
                      ).toFixed(1)}{' '}
                      CZK / session
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg hover:bg-emerald-400 transition"
                >
                  Publish Wallbox to P2P Network
                </button>
              </form>
            )}

            {/* SCREEN 6: USER PROFILE, ROLE SWITCHER & HOST EARNINGS LOG (FR-01, FR-08) */}
            {activeScreen === 6 && (
              <div className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-400">
                      Dual-Role Account (FR-01)
                    </span>
                    <h2 className="text-sm font-extrabold text-white">Abhinav Kumar Parbat</h2>
                    <p className="text-[11px] text-slate-400">
                      Verified EV Guest & Residential Host • Praha-Suchdol
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-extrabold text-sm">
                    AP
                  </div>
                </div>

                {/* Host Revenue Summary Card (FR-08) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="text-xs font-bold text-white">
                    Host Revenue & Energy Shared Summary (FR-08)
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Sessions</div>
                      <div className="text-xs font-extrabold text-white">{14 + bookings.length}</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Energy Shared</div>
                      <div className="text-xs font-extrabold text-emerald-400">418 kWh</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Net Earnings</div>
                      <div className="text-xs font-extrabold text-amber-300">2,490 CZK</div>
                    </div>
                  </div>
                </div>

                {/* Recent Bookings History */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="text-xs font-bold text-white">Recent P2P Reservations</div>
                  {bookings.map((bk) => (
                    <div
                      key={bk.bookingId}
                      onClick={() => setActiveScreen(4)}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs cursor-pointer hover:border-emerald-500/50"
                    >
                      <div>
                        <div className="font-bold text-white">{bk.stationTitle}</div>
                        <div className="text-[10px] text-slate-400">
                          {bk.bookingId} • {bk.slots.join(', ')} ({bk.energyKwh} kWh)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-emerald-400">
                          {bk.totalCostCzk.toFixed(0)} CZK
                        </div>
                        <div className="text-[10px] text-slate-400">{bk.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom 5-Tab Mobile Navigation Bar */}
          <nav className="bg-slate-900 border-t border-slate-800 px-2 py-2 grid grid-cols-5 gap-1 text-[10px] font-semibold">
            {[
              { screen: 1, label: 'Explore', icon: MapPin },
              { screen: 2, label: 'Station', icon: ShieldCheck },
              { screen: 3, label: 'Book Slot', icon: Calendar },
              { screen: 4, label: 'Access', icon: Clock },
              { screen: 5, label: 'Host +', icon: PlusCircle },
              { screen: 6, label: 'Profile', icon: UserCheck }
            ]
              .slice(0, 5)
              .map((item) => {
                const Icon = item.icon;
                const active = activeScreen === item.screen;
                return (
                  <button
                    key={item.screen}
                    onClick={() => setActiveScreen(item.screen)}
                    className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                      active ? 'text-emerald-400 bg-emerald-500/10 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-0.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Right Side: Thesis Defense & Database State Inspector (Hidden in Screenshot Mode) */}
        {!screenshotMode && (
          <DefenseInspector
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
            selectedStation={selectedStation}
            selectedSlots={selectedSlots}
            bookings={bookings}
            stations={stations}
          />
        )}
      </main>
    </div>
  );
}
