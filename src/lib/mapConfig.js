import L from 'leaflet';

// OpenStreetMap standard tiles — no API key required (light academic use, attribution mandatory).
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function addBaseLayer(map) {
  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    maxZoom: 19
  }).addTo(map);
  map.attributionControl.setPrefix(false);
}

const BOLT_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>';
const HOUSE_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M13 12l-2.5 3.5h3L11 19"/></svg>';

export function priceIcon(station, selected) {
  const classes = ['cp-pin', selected ? 'is-selected' : '', !station.availableNow ? 'is-offline' : '']
    .filter(Boolean)
    .join(' ');
  return L.divIcon({
    className: 'cp-icon-wrap',
    html: `<div class="${classes}">${BOLT_SVG}<span>${station.pricePerKwh.toFixed(1)}</span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}

export const dcIcon = L.divIcon({
  className: 'cp-icon-wrap',
  html: '<div class="cp-dc">DC</div>',
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});

export const homePinIcon = L.divIcon({
  className: 'cp-icon-wrap',
  html: `<div class="cp-home">${HOUSE_SVG}</div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});

export function zoneLabelIcon(label) {
  return L.divIcon({
    className: 'cp-icon-wrap',
    html: `<div class="cp-zone-label">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}

export function routeLabelIcon(label) {
  return L.divIcon({
    className: 'cp-icon-wrap',
    html: `<div class="cp-route-label">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}
