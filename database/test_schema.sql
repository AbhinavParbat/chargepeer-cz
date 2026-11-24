\set ON_ERROR_STOP off
INSERT INTO users (user_id, full_name, email, active_role, id_verified)
VALUES ('U-HOST-07', 'Jitka Horáková', 'jitka@example.cz', 'HOST', TRUE),
       ('U-GUEST-01', 'Lukáš Novák', 'lukas@example.cz', 'GUEST', TRUE);

INSERT INTO charging_stations VALUES
('P2P-CZ-07', 'U-HOST-07', 'Bohemian Switzerland Trailhead Wallbox', 'Mezná (České Švýcarsko NP)',
 'National Park Interior', 'Type 2', 11, 6.80, 5, TRUE, 'Easee Charge 11kW (3-Phase)', TRUE, 17.0,
 50.8778, 14.3176, 'Mezná village (250m Privacy Circle)', 50.8764, 14.3197,
 'Mezná 12, 407 17 Hřensko (Garden Driveway)', '#6115*');

INSERT INTO availability_slots (slot_id, station_id, slot_date, start_hour)
SELECT 'S07-' || to_char(h, 'FM00'), 'P2P-CZ-07', DATE '2026-11-23', make_time(h, 0, 0)
FROM generate_series(7, 18) AS h;

-- T1: confirm a 2-hour booking atomically (10:00-12:00)
BEGIN;
INSERT INTO bookings VALUES ('BK-2026-101', 'P2P-CZ-07', 'U-GUEST-01', 29, 22.0, 159.60, 48.05, 'CONFIRMED', NOW());
UPDATE availability_slots SET booking_id = 'BK-2026-101'
 WHERE station_id = 'P2P-CZ-07' AND slot_date = '2026-11-23'
   AND start_hour IN ('10:00', '11:00') AND booking_id IS NULL;
COMMIT;
SELECT 'T1 locked slots' AS test, count(*) FROM availability_slots WHERE booking_id = 'BK-2026-101';

-- T2: a second guest tries 11:00-13:00 -> only 1 of 2 slots free, application rolls back
BEGIN;
INSERT INTO bookings VALUES ('BK-2026-102', 'P2P-CZ-07', 'U-GUEST-01', 40, 22.0, 159.60, 48.05, 'CONFIRMED', NOW());
WITH upd AS (
  UPDATE availability_slots SET booking_id = 'BK-2026-102'
   WHERE station_id = 'P2P-CZ-07' AND slot_date = '2026-11-23'
     AND start_hour IN ('11:00', '12:00') AND booking_id IS NULL
  RETURNING 1)
SELECT 'T2 slots obtained (needs 2)' AS test, count(*) FROM upd;
ROLLBACK;
SELECT 'T2 after rollback, slot 11:00 still owned by' AS test, booking_id FROM availability_slots WHERE start_hour = '11:00';

-- T3: duplicate slot row for the same hour is impossible
INSERT INTO availability_slots VALUES ('S07-DUP', 'P2P-CZ-07', '2026-11-23', '10:00', NULL);

-- T4: a slot cannot point to a booking of another station
INSERT INTO charging_stations SELECT 'P2P-CZ-99', host_id, title, municipality, zone_type, connector_type, power_kw,
  price_per_kwh, hourly_fee, instant_book, hardware_model, meter_verified, nearest_dc_km, public_lat, public_lng,
  public_area_label, exact_lat, exact_lng, exact_address, gate_pin FROM charging_stations WHERE station_id = 'P2P-CZ-07';
INSERT INTO availability_slots VALUES ('S99-10', 'P2P-CZ-99', '2026-11-23', '10:00', 'BK-2026-101');

-- T5: bilateral reviews: one per side allowed, a second guest review rejected
INSERT INTO reviews VALUES ('RV-1', 'BK-2026-101', 'U-GUEST-01', 'GUEST', 5, 'Saved Rural Trip', 'Charged while hiking.', DEFAULT);
INSERT INTO reviews VALUES ('RV-2', 'BK-2026-101', 'U-HOST-07', 'HOST', 5, 'Punctual Guest', NULL, DEFAULT);
INSERT INTO reviews VALUES ('RV-3', 'BK-2026-101', 'U-GUEST-01', 'GUEST', 1, 'Fake', NULL, DEFAULT);

-- T6: invalid values rejected
INSERT INTO reviews VALUES ('RV-4', 'BK-2026-101', 'U-HOST-07', 'GUEST', 6, 'x', NULL, DEFAULT);
UPDATE bookings SET booking_status = 'PAID' WHERE booking_id = 'BK-2026-101';

SELECT 'T7 rating view' AS test, * FROM station_ratings;
