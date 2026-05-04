DROP TABLE IF EXISTS booster_flights CASCADE;
DROP TABLE IF EXISTS payloads CASCADE;
DROP TABLE IF EXISTS missions CASCADE;
DROP TABLE IF EXISTS boosters CASCADE;
DROP TABLE IF EXISTS launch_sites CASCADE;
DROP TABLE IF EXISTS rockets CASCADE;

CREATE TABLE rockets (
    rocket_id   SERIAL PRIMARY KEY,
    rocket_name VARCHAR(100) NOT NULL,
    rocket_type VARCHAR(100) NOT NULL,
    max_payload_kg FLOAT,
    status      VARCHAR(50),
    first_flight DATE
);

CREATE TABLE boosters (
    booster_id   SERIAL PRIMARY KEY,
    rocket_id    INT NOT NULL REFERENCES rockets(rocket_id),
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    status       VARCHAR(50),
    flight_count INT DEFAULT 0
);

CREATE TABLE launch_sites (
    site_id   SERIAL PRIMARY KEY,
    site_name VARCHAR(150) NOT NULL,
    location  VARCHAR(200),
    latitude  FLOAT,
    longitude FLOAT,
    operator  VARCHAR(100),
    active    BOOLEAN DEFAULT TRUE
);

CREATE TABLE missions (
    mission_id   SERIAL PRIMARY KEY,
    rocket_id    INT NOT NULL REFERENCES rockets(rocket_id),
    site_id      INT NOT NULL REFERENCES launch_sites(site_id),
    mission_name VARCHAR(150) NOT NULL,
    launch_date  DATE,
    orbit_target VARCHAR(100),
    outcome      VARCHAR(50)
);

CREATE TABLE payloads (
    payload_id   SERIAL PRIMARY KEY,
    mission_id   INT NOT NULL REFERENCES missions(mission_id),
    payload_name VARCHAR(150) NOT NULL,
    mass_kg      FLOAT,
    orbit_achieved BOOLEAN,
    payload_type VARCHAR(100)
);

CREATE TABLE booster_flights (
    flight_id      SERIAL PRIMARY KEY,
    booster_id     INT NOT NULL REFERENCES boosters(booster_id),
    mission_id     INT NOT NULL REFERENCES missions(mission_id),
    role           VARCHAR(100),
    landing_outcome VARCHAR(50),
    flight_number  INT
);