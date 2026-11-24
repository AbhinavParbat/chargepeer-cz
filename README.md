# ChargePeer CZ – Peer-to-Peer EV Charging Prototype

ChargePeer CZ is a clickable mobile-app prototype for a **peer-to-peer (P2P) electric-vehicle charging network** in Czechia. Homeowners can share their private wallbox with visiting EV drivers. The focus is on rural and remote destinations where public fast chargers are far away, such as Šumava, Jeseníky, Kokořínsko and Bohemian Switzerland.

The prototype was built for the diploma thesis *"A Peer-to-Peer EV Charging Network: Enhancing Smart Mobility Through Shared Private Charging Infrastructure"* (Abhinav Kumar Parbat, Faculty of Economics and Management, Czech University of Life Sciences Prague; supervisor Ing. Petr Benda, Ph.D.).

> **Note:** This is a front-end prototype. All data are seeded mock data, and there is no backend. Payments, user accounts and charger hardware are simulated.

## Features

The app runs inside a phone frame and has six screens:

| Screen | What it shows |
|---|---|
| 1 Explore | OpenStreetMap map of Czechia with the seven P2P hosts, public DC hubs and charging-gap zones; search and power/availability filters; Prague → Berlin road-trip check |
| 2 Station detail | Host trust badges, reviews, a 250 m privacy area instead of the exact address, and the distance to the nearest public fast charger |
| 3 Booking | Hourly slots with conflict-free booking, arrival battery level, energy and range gained, and a price breakdown |
| 4 Access & review | Exact address and gate PIN released only after booking, plus a two-sided review |
| 5 Host onboarding | Listing form with a map picker and a live estimate of the host's earnings |
| 6 Profile | Switch between driver and host roles, earnings and booking history |

The desktop view also shows a **defense inspector** panel. It links each screen to the thesis requirements (FR/NFR) and shows the formulas used by the prototype. **Screenshot mode** shows the phone frame alone, for thesis figures; the small 1–6 switcher in the corner changes screens, and `Esc` exits.

## Tech stack

- React 18 and Vite 5
- Leaflet 1.9 with OpenStreetMap tiles (no API key needed)
- Tailwind CSS via the Play CDN, Inter font, and Lucide icons
- PostgreSQL 16 schema in `database/` (design artefact; the app itself does not use a database)

## Getting started

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # starts the dev server at http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serves the production build locally
```

## Project structure

```
chargepeer-cz/
├── index.html                 # entry page (Tailwind CDN, fonts)
├── package.json
├── vite.config.js
├── database/
│   ├── schema.sql             # normalized PostgreSQL schema (5 tables)
│   └── test_schema.sql        # constraint tests (e.g. double booking is rejected)
└── src/
    ├── main.jsx               # React entry point
    ├── App.jsx                # phone frame, six screens and app state
    ├── components/
    │   ├── InteractiveMap.jsx # Leaflet map, hosts, DC hubs, gap zones, route
    │   ├── MiniMap.jsx        # privacy-area / exact-location / picker map
    │   ├── TripPlanner.jsx    # Prague → Berlin range check
    │   └── DefenseInspector.jsx
    ├── data/
    │   └── mockData.js        # seeded hosts, DC hubs, trip scenario, demo user
    ├── lib/
    │   ├── calc.js            # session cost, host earnings, slots, trip energy model
    │   └── mapConfig.js       # tile layer and map markers
    └── styles/
        └── map.css
```

## Calculation model

The formulas in `src/lib/calc.js` are the same as those in the thesis:

- **Energy delivered:** `E = min(P × t, (1 − SoC) × B)` with a 60 kWh battery
- **Session cost:** `C = E × price per kWh + t × parking fee per hour`
- **Host net revenue:** `R = (1 − 0.12) × C − E × 4.20 CZK/kWh` (12% platform fee, household electricity price)
- **Trip energy:** `E_leg = d × 0.1786 kWh/km × terrain factor × season factor` (winter × 1.25), keeping a 10% battery reserve

## Database schema

`database/schema.sql` creates the five tables: `users`, `charging_stations`, `availability_slots`, `bookings` and `reviews`. A unique constraint on station, date and hour makes double bookings impossible. To try it, run the following on PostgreSQL 16:

```bash
createdb chargepeer
psql -d chargepeer -f database/schema.sql
psql -d chargepeer -f database/test_schema.sql
```

## Limitations

The seven hosts are hypothetical, and some distances to public chargers in the seed data are illustrative (see thesis Section 4.7.1). The prototype stores all state in the browser and resets on reload.
