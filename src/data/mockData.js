export const PLATFORM_COMMISSION = 0.12; // alpha = 12% platform fee
export const DEFAULT_GRID_COST = 4.20;   // C_grid = 4.20 CZK/kWh residential baseline

// Geographic frame of the Czech Republic (SW corner, NE corner)
export const CZ_BOUNDS = [
  [48.55, 12.09],
  [51.06, 18.86]
];

/*
 * Location model (NFR-03 privacy):
 *   lat / lng           -> public, obfuscated point shown on the map (centre of the 250 m circle)
 *   exactLat / exactLng -> real driveway position, revealed only after a confirmed booking
 */
export const INITIAL_STATIONS = [
  {
    id: 'P2P-CZ-01',
    title: 'Šumava Mountain Chalet Wallbox',
    municipality: 'Kvilda (Šumava Rural Zone)',
    zoneType: 'Rural Charging Desert',
    hostName: 'Ing. Tomáš Dvořák',
    hostVerified: true,
    hardwareVerified: true,
    rating: 4.9,
    reviewCount: 18,
    connector: 'Type 2',
    powerKw: 11,
    pricePerKwh: 6.50,
    hourlyFee: 10,
    availableNow: true,
    instantBook: true,
    nearestPublicDcKm: 34.5,
    distanceKm: 2.1,
    lat: 49.0209,
    lng: 13.5812,
    exactLat: 49.0195,
    exactLng: 13.5790,
    publicAreaLabel: 'Kvilda Center (250m Privacy Circle)',
    exactAddress: 'Kvilda 48, 384 93 Kvilda (Driveway Carport)',
    gatePin: '#4829*',
    hardwareModel: 'Webasto Pure II 11kW (3-Phase)',
    availableSlots: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
    bookedSlots: ['10:00', '11:00'],
    reviews: [
      { id: 'R1', guest: 'Lukáš K.', rating: 5, date: 'Oct 2026', tag: 'Saved Rural Trip', comment: 'Zero public chargers in central Šumava. Charged 42 kWh while hiking!' },
      { id: 'R2', guest: 'Petra M.', rating: 5, date: 'Sep 2026', tag: 'Easy Driveway Access', comment: 'PIN code unlocked the gate immediately. Stable 11.0 kW output.' }
    ]
  },
  {
    id: 'P2P-CZ-02',
    title: 'Vysočina Eco-Farm Solar Charger',
    municipality: 'Telč (Vysočina Region)',
    zoneType: 'Rural / Secondary Corridor',
    hostName: 'Bc. Jana Novotná',
    hostVerified: true,
    hardwareVerified: true,
    rating: 4.8,
    reviewCount: 24,
    connector: 'Type 2',
    powerKw: 22,
    pricePerKwh: 5.90,
    hourlyFee: 0,
    availableNow: true,
    instantBook: true,
    nearestPublicDcKm: 26.0,
    distanceKm: 4.3,
    lat: 49.1852,
    lng: 15.4512,
    exactLat: 49.1838,
    exactLng: 15.4530,
    publicAreaLabel: 'Telč - Staré Město (250m Privacy Circle)',
    exactAddress: 'Slavatovská 114, 588 56 Telč (Solar Barn Bay 2)',
    gatePin: '#7710*',
    hardwareModel: 'Myenergi Zappi 22kW (PV Surplus Enabled)',
    availableSlots: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    bookedSlots: ['13:00'],
    reviews: [
      { id: 'R3', guest: 'Martin V.', rating: 5, date: 'Oct 2026', tag: 'Fast 22kW AC', comment: 'Cheaper than commercial AC posts and right next to the historic square.' }
    ]
  },
  {
    id: 'P2P-CZ-03',
    title: 'Jeseníky Trailhead Residence',
    municipality: 'Karlova Studánka (Jeseníky)',
    zoneType: 'Mountain Peripheral Zone',
    hostName: 'Marek Svoboda',
    hostVerified: true,
    hardwareVerified: false,
    rating: 4.7,
    reviewCount: 9,
    connector: 'Type 2',
    powerKw: 11,
    pricePerKwh: 7.20,
    hourlyFee: 15,
    availableNow: true,
    instantBook: false,
    nearestPublicDcKm: 29.8,
    distanceKm: 6.8,
    lat: 50.0721,
    lng: 17.3068,
    exactLat: 50.0735,
    exactLng: 17.3045,
    publicAreaLabel: 'Karlova Studánka North (250m Privacy Circle)',
    exactAddress: 'U Vodopádu 19, 793 24 Karlova Studánka',
    gatePin: '#1920*',
    hardwareModel: 'ABB Terra AC Wallbox 11kW',
    availableSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
    bookedSlots: ['09:00', '10:00', '11:00'],
    reviews: [
      { id: 'R4', guest: 'David R.', rating: 5, date: 'Aug 2026', tag: 'Reliable Host', comment: 'Eliminated our range anxiety in the Jeseníky mountains.' }
    ]
  },
  {
    id: 'P2P-CZ-04',
    title: 'Křivoklátsko Forest Villa Wallbox',
    municipality: 'Roztoky u Křivoklátu',
    zoneType: 'Rural Protected Area',
    hostName: 'Ing. Petr Černý',
    hostVerified: true,
    hardwareVerified: true,
    rating: 4.95,
    reviewCount: 31,
    connector: 'Type 2',
    powerKw: 11,
    pricePerKwh: 6.20,
    hourlyFee: 5,
    availableNow: true,
    instantBook: true,
    nearestPublicDcKm: 22.4,
    distanceKm: 3.5,
    lat: 50.0305,
    lng: 13.8700,
    exactLat: 50.0292,
    exactLng: 13.8721,
    publicAreaLabel: 'Roztoky Valley (250m Privacy Circle)',
    exactAddress: 'Lesní 82, 270 23 Roztoky u Křivoklátu',
    gatePin: '#3304*',
    hardwareModel: 'Easee Home 11kW Smart Wallbox',
    availableSlots: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
    bookedSlots: [],
    reviews: [
      { id: 'R5', guest: 'Klára H.', rating: 5, date: 'Oct 2026', tag: 'Great Value', comment: 'Super easy booking in 3 taps. Host left a covered cable hook.' }
    ]
  },
  {
    id: 'P2P-CZ-05',
    title: 'Kokořínsko Weekend Cottage Driveway',
    municipality: 'Kokořín (Mácha’s Region PLA)',
    zoneType: 'Protected Landscape Area',
    hostName: 'Abhinav Kumar Parbat (Host Demo)',
    hostVerified: true,
    hardwareVerified: true,
    rating: 5.0,
    reviewCount: 14,
    connector: 'Type 2',
    powerKw: 22,
    pricePerKwh: 5.80,
    hourlyFee: 10,
    availableNow: true,
    instantBook: true,
    nearestPublicDcKm: 16.0,
    distanceKm: 1.9,
    lat: 50.4348,
    lng: 14.5731,
    exactLat: 50.4334,
    exactLng: 14.5752,
    publicAreaLabel: 'Kokořín Valley (250m Privacy Circle)',
    exactAddress: 'Kokořín 27, 277 23 Kokořín (Cottage Carport)',
    gatePin: '#2026*',
    hardwareModel: 'Mennekes Amtron 22kW',
    availableSlots: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
    bookedSlots: ['12:00', '13:00'],
    reviews: [
      { id: 'R6', guest: 'Ondřej B.', rating: 5, date: 'Oct 2026', tag: 'Charged While Hiking', comment: 'Plugged in, walked the sandstone valley to Kokořín Castle, came back to a full battery for the D8.' }
    ]
  },
  {
    id: 'P2P-CZ-06',
    title: 'South Moravia Vineyard Combo Box',
    municipality: 'Mikulov (Pálava Rural Wine Trail)',
    zoneType: 'Peripheral Tourist Region',
    hostName: 'Vinařství Sedlák',
    hostVerified: true,
    hardwareVerified: true,
    rating: 4.85,
    reviewCount: 19,
    connector: 'CCS2 / Type 2',
    powerKw: 22,
    pricePerKwh: 6.90,
    hourlyFee: 0,
    availableNow: false,
    instantBook: true,
    nearestPublicDcKm: 19.5,
    distanceKm: 5.1,
    lat: 48.8051,
    lng: 16.6394,
    exactLat: 48.8065,
    exactLng: 16.6372,
    publicAreaLabel: 'Mikulov Wine Cellars (250m Privacy Circle)',
    exactAddress: 'Vinařská 44, 692 01 Mikulov',
    gatePin: '#8812*',
    hardwareModel: 'Delta 22kW Dual-Socket Station',
    availableSlots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    bookedSlots: ['10:00', '11:00', '12:00', '13:00', '14:00'],
    reviews: []
  },
  {
    id: 'P2P-CZ-07',
    title: 'Bohemian Switzerland Trailhead Wallbox',
    municipality: 'Mezná (České Švýcarsko NP)',
    zoneType: 'National Park Interior',
    hostName: 'Jitka Horáková',
    hostVerified: true,
    hardwareVerified: true,
    rating: 4.9,
    reviewCount: 22,
    connector: 'Type 2',
    powerKw: 11,
    pricePerKwh: 6.80,
    hourlyFee: 5,
    availableNow: true,
    instantBook: true,
    // Nearest DC fast chargers are outside the park, in Děčín (approx. road distance)
    nearestPublicDcKm: 17.0,
    distanceKm: 2.4,
    lat: 50.8778,
    lng: 14.3176,
    exactLat: 50.8764,
    exactLng: 14.3197,
    publicAreaLabel: 'Mezná village (250m Privacy Circle)',
    exactAddress: 'Mezná 12, 407 17 Hřensko (Garden Driveway)',
    gatePin: '#6115*',
    hardwareModel: 'Easee Charge 11kW (3-Phase)',
    availableSlots: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
    bookedSlots: ['07:00', '08:00', '15:00'],
    reviews: [
      { id: 'R7', guest: 'Felix S.', rating: 5, date: 'Oct 2026', tag: 'Saved Rural Trip', comment: 'Prague–Berlin trip in November. Charged 2 h while hiking to Pravčická brána, then reached Dresden with plenty to spare.' },
      { id: 'R8', guest: 'Tereza N.', rating: 5, date: 'Sep 2026', tag: 'Easy Driveway Access', comment: 'Only slow public AC in Hřensko and it was taken. This wallbox was a lifesaver.' }
    ]
  }
];

export const PUBLIC_DC_HUBS = [
  { id: 'DC-01', name: 'Prague D1 Exit 2 (ČEZ / Ionity)', lat: 50.0240, lng: 14.5080, power: '150-350 kW', price: '13.50 CZK/kWh' },
  { id: 'DC-02', name: 'Humpolec D1 Highway Hub (E.ON)', lat: 49.5420, lng: 15.3500, power: '180 kW', price: '12.90 CZK/kWh' },
  { id: 'DC-03', name: 'Brno D1 Central Hub (PRE / ČEZ)', lat: 49.1760, lng: 16.6060, power: '150 kW', price: '13.00 CZK/kWh' },
  { id: 'DC-04', name: 'Plzeň D5 Highway Corridor', lat: 49.7180, lng: 13.3150, power: '150 kW', price: '12.50 CZK/kWh' },
  { id: 'DC-05', name: 'Olomouc D35 Transit Node', lat: 49.6270, lng: 17.2900, power: '120 kW', price: '12.90 CZK/kWh' },
  { id: 'DC-06', name: 'Děčín Town DC (outside the park)', lat: 50.7790, lng: 14.2050, power: '150 kW', price: '13.20 CZK/kWh' },
  { id: 'DC-07', name: 'Dresden A17 / A13 Corridor Hub', lat: 51.0050, lng: 13.7000, power: '300 kW', price: '0.59 EUR/kWh' }
];

// Rural "charging desert" zones highlighted on the map (SO1)
export const CHARGING_GAP_ZONES = [
  { id: 'Z-SUMAVA', label: 'Šumava · charging gap', lat: 49.03, lng: 13.60, radiusKm: 20 },
  { id: 'Z-VYSOCINA', label: 'Vysočina · charging gap', lat: 49.20, lng: 15.45, radiusKm: 18 },
  { id: 'Z-JESENIKY', label: 'Jeseníky · charging gap', lat: 50.09, lng: 17.25, radiusKm: 18 },
  { id: 'Z-CS', label: 'Bohemian Switzerland · charging gap', lat: 50.875, lng: 14.33, radiusKm: 11 },
  { id: 'Z-KOKORIN', label: 'Kokořínsko · charging gap', lat: 50.44, lng: 14.58, radiusKm: 9 }
];

// Demo user + host baseline statistics (Screen 6)
export const DEMO_USER = {
  name: 'Abhinav Kumar Parbat',
  initials: 'AP',
  homeArea: 'Praha-Suchdol'
};

export const HOST_BASELINE_STATS = {
  sessions: 14,
  energyKwh: 418,
  netEarningsCzk: 2490
};

// Default pin for a new host listing (Český Krumlov)
export const NEW_LISTING_DEFAULT_LOCATION = { lat: 48.8113, lng: 14.3176 };

/*
 * Road-trip scenario (SO6): Prague -> Berlin with a scenic detour into
 * Bohemian Switzerland National Park. Motorway D8/A17/A13 is well covered by
 * DC chargers, but the park interior has only slow AC / e-bike points, and the
 * hilly gorge roads plus cold weather raise consumption.
 *
 * Distances are approximate road kilometres; `terrainFactor` scales the base
 * consumption (1.0 = flat motorway). Paths are schematic waypoints for the map.
 */
export const TRIP_SCENARIO = {
  id: 'TRIP-PRG-BER',
  title: 'Prague → Berlin',
  subtitle: 'Scenic detour: Bohemian Switzerland National Park',
  hostStationId: 'P2P-CZ-07',
  hostAfterLeg: 0, // the charging stop is reached at the end of leg index 0
  reserveSoc: 10,  // never plan to arrive below 10 %
  legs: [
    {
      id: 'L1',
      from: 'Prague',
      to: 'Mezná (park trailhead)',
      short: 'Mezná',
      km: 130,
      terrainFactor: 1.05,
      terrain: 'D8 motorway, then regional roads via Děčín',
      path: [[50.0755, 14.4378], [50.33, 14.33], [50.5, 14.1], [50.66, 14.03], [50.78, 14.2], [50.86, 14.24], [50.8764, 14.3197]]
    },
    {
      id: 'L2',
      from: 'Mezná',
      to: 'Park loop (Jetřichovice, Hřensko gorge)',
      short: 'Park loop',
      km: 38,
      terrainFactor: 1.3,
      terrain: 'Narrow, steep gorge roads',
      path: [[50.8764, 14.3197], [50.853, 14.394], [50.874, 14.33], [50.874, 14.243]]
    },
    {
      id: 'L3',
      from: 'Hřensko',
      to: 'Dresden DC hub (A17)',
      short: 'Dresden',
      km: 55,
      terrainFactor: 1.1,
      terrain: 'Elbe valley via Bad Schandau, Pirna',
      path: [[50.874, 14.243], [50.917, 14.155], [50.96, 13.94], [51.005, 13.7]]
    }
  ],
  continuation: 'Dresden → Berlin on the A13: ~190 km of well-equipped motorway with DC hubs.',
  continuationPath: [[51.005, 13.7], [51.08, 13.72], [51.25, 13.6]]
};
