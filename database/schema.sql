-- ChargePeer CZ relational schema (PostgreSQL 16, normalized to 3NF)
CREATE TABLE users (
    user_id         VARCHAR(20)  PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(120) NOT NULL UNIQUE,
    active_role     VARCHAR(5)   NOT NULL DEFAULT 'GUEST'
                    CHECK (active_role IN ('GUEST', 'HOST')),
    id_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    ev_battery_kwh  DECIMAL(4,1) DEFAULT 60.0 CHECK (ev_battery_kwh > 0),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE charging_stations (
    station_id        VARCHAR(20)  PRIMARY KEY,
    host_id           VARCHAR(20)  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title             VARCHAR(120) NOT NULL,
    municipality      VARCHAR(80)  NOT NULL,
    zone_type         VARCHAR(50)  NOT NULL,
    connector_type    VARCHAR(25)  NOT NULL DEFAULT 'Type 2',
    power_kw          DECIMAL(4,1) NOT NULL CHECK (power_kw > 0),
    price_per_kwh     DECIMAL(5,2) NOT NULL CHECK (price_per_kwh > 0),
    hourly_fee        DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (hourly_fee >= 0),
    instant_book      BOOLEAN      NOT NULL DEFAULT TRUE,
    hardware_model    VARCHAR(100) NOT NULL,
    meter_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    nearest_dc_km     DECIMAL(5,1),
    public_lat        DECIMAL(9,6) NOT NULL CHECK (public_lat BETWEEN -90 AND 90),
    public_lng        DECIMAL(9,6) NOT NULL CHECK (public_lng BETWEEN -180 AND 180),
    public_area_label VARCHAR(120) NOT NULL,
    exact_lat         DECIMAL(9,6) NOT NULL,              -- restricted (NFR-03)
    exact_lng         DECIMAL(9,6) NOT NULL,              -- restricted (NFR-03)
    exact_address     VARCHAR(160) NOT NULL,              -- restricted (NFR-03)
    gate_pin          VARCHAR(15)  NOT NULL               -- restricted; encrypted in production
);

CREATE TABLE bookings (
    booking_id      VARCHAR(20)  PRIMARY KEY,
    station_id      VARCHAR(20)  NOT NULL REFERENCES charging_stations(station_id),
    guest_id        VARCHAR(20)  NOT NULL REFERENCES users(user_id),
    arrival_soc_pct INTEGER      NOT NULL CHECK (arrival_soc_pct BETWEEN 0 AND 100),
    energy_kwh      DECIMAL(5,1) NOT NULL CHECK (energy_kwh >= 0),
    total_cost_czk  DECIMAL(7,2) NOT NULL CHECK (total_cost_czk >= 0),
    host_net_czk    DECIMAL(7,2) NOT NULL,
    booking_status  VARCHAR(10)  NOT NULL DEFAULT 'CONFIRMED'
                    CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_booking_station UNIQUE (booking_id, station_id)
);

CREATE TABLE availability_slots (
    slot_id     VARCHAR(25) PRIMARY KEY,
    station_id  VARCHAR(20) NOT NULL REFERENCES charging_stations(station_id) ON DELETE CASCADE,
    slot_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
    start_hour  TIME        NOT NULL,
    booking_id  VARCHAR(20),                               -- NULL = free; set = locked
    CONSTRAINT uq_station_slot UNIQUE (station_id, slot_date, start_hour),
    CONSTRAINT fk_slot_booking FOREIGN KEY (booking_id, station_id)
        REFERENCES bookings(booking_id, station_id)
);

CREATE TABLE reviews (
    review_id     VARCHAR(20) PRIMARY KEY,
    booking_id    VARCHAR(20) NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    reviewer_id   VARCHAR(20) NOT NULL REFERENCES users(user_id),
    reviewer_role VARCHAR(5)  NOT NULL CHECK (reviewer_role IN ('GUEST', 'HOST')),
    star_rating   INTEGER     NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
    trust_tag     VARCHAR(40) NOT NULL,
    comment_text  TEXT,
    review_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT uq_one_review_per_side UNIQUE (booking_id, reviewer_role)
);

-- Derived values are computed, not stored (3NF)
CREATE VIEW station_ratings AS
SELECT b.station_id,
       ROUND(AVG(r.star_rating), 2) AS avg_rating,
       COUNT(*)                     AS review_count
FROM reviews r
JOIN bookings b ON b.booking_id = r.booking_id
WHERE r.reviewer_role = 'GUEST'
GROUP BY b.station_id;
