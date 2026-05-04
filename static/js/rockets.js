import * as THREE from "three";

const DEG2RAD = Math.PI / 180;

// Convert lat/lon (degrees) -> 3D point on a sphere of given radius.
// Matches the projection used in threeGeoJSON.js so pins land on the borders.
export function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * DEG2RAD;
  const theta = (lon + 180) * DEG2RAD;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z =  radius * Math.sin(phi) * Math.sin(theta);
  const y =  radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Real launch sites on Earth
// Fetch launch sites from Django API
export async function fetchLaunchSites() {
  try {
    const response = await fetch('/api/launch-sites/');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    
    // Convert API format to the format the globe expects
    return data.map((site) => ({
      name: site.name,
      code: site.name.toUpperCase().slice(0, 10),  // short code from name
      lat: site.lat,
      lon: site.lon,
      operator: site.operator,
      location: site.location,
    }));
  } catch (err) {
    console.error('Failed to load launch sites from API:', err);
    return [];
  }
}

// These will be populated from the API at startup
export let MISSION_NAMES = [];
export let BOOSTERS = [];

export async function fetchMissions() {
  try {
    const response = await fetch('/api/missions/');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    // Extract just the mission names, uppercase for display
    MISSION_NAMES = data.map((m) => m.name.toUpperCase());
    return data;
  } catch (err) {
    console.error('Failed to load missions from API:', err);
    return [];
  }
}

export async function fetchBoosters() {
  try {
    const response = await fetch('/api/boosters/');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    // Extract just the booster serials
    BOOSTERS = data.map((b) => b.serial);
    return data;
  } catch (err) {
    console.error('Failed to load boosters from API:', err);
    return [];
  }
}

// ============================================================
//  LAUNCH SITE PINS
//  - small glowing sphere on the surface
//  - additive halo sprite for the glow
//  - pulsing ring on the surface
// ============================================================
export function createLaunchSitePins(scene, radius , sites) {
  const pins = [];

  // Build the halo texture once and reuse it for all sites
  const haloTexture = makeHaloTexture();

  sites.forEach((site) => {
    const pos = latLonToVec3(site.lat, site.lon, radius);
    const group = new THREE.Group();
    group.position.copy(pos);

    // Small glowing sphere
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xff6b35 });
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), pinMat);
    group.add(pin);

    // Halo sprite — always faces the camera
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    halo.scale.set(0.18, 0.18, 0.18);
    group.add(halo);

    // Pulsing ring on the surface (oriented perpendicular to surface normal)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.035, 0.05, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff6b35,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      })
    );
    ring.lookAt(new THREE.Vector3(0, 0, 0).sub(pos));   // face away from planet center
    group.add(ring);

    scene.add(group);

    pins.push({
      site,
      pos: pos.clone(),
      group,
      pin,
      halo,
      ring,
      ringPhase: Math.random() * Math.PI * 2,
    });
  });

  return pins;
}

function makeHaloTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0,   'rgba(255, 200, 80, 0.95)');
  grad.addColorStop(0.4, 'rgba(255, 107, 53, 0.45)');
  grad.addColorStop(1,   'rgba(255, 107, 53, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function makeFlameTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0,   'rgba(255, 240, 200, 1)');
  grad.addColorStop(0.3, 'rgba(255, 170, 0, 0.9)');
  grad.addColorStop(0.7, 'rgba(255, 80, 30, 0.5)');
  grad.addColorStop(1,   'rgba(255, 80, 30, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Reuse one flame texture across all rockets
const FLAME_TEXTURE = makeFlameTexture();

// ============================================================
//  ROCKET FACTORY
//  Each rocket follows a quadratic Bezier curve from its
//  launch site (on the surface) up through an apex and out
//  to a target point at orbital altitude.
// ============================================================
export class RocketManager {
  constructor(scene, planetRadius) {
    this.scene = scene;
    this.planetRadius = planetRadius;
    this.rockets = [];
  }

  /**
   * Launch a new rocket from the given launch site.
   * Adds it to the scene immediately and returns the rocket object.
   */
  launch(site, missionName, boosterSerial) {
    const start = latLonToVec3(site.lat, site.lon, this.planetRadius);

    // Pick a random target on the sphere at orbital altitude
    const targetLat = (Math.random() - 0.5) * 140;     // -70 .. +70
    const targetLon = (Math.random() - 0.5) * 360;     // -180 .. +180
    const target = latLonToVec3(targetLat, targetLon, this.planetRadius * 1.55);

    // Bezier control point above the midpoint = projectile arc apex
    const mid = start.clone().add(target).multiplyScalar(0.5);
    const apexHeight = this.planetRadius * 1.95;
    const ctrl = mid.clone().normalize().multiplyScalar(apexHeight);

    // Rocket body (cylinder + cone tip)
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.025, 0.11, 8),
      new THREE.MeshBasicMaterial({ color: 0xeeeeee })
    );
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.04, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6b35 })
    );
    tip.position.y = 0.075;
    group.add(body, tip);
    group.position.copy(start);

    // Engine flame sprite (additive blending so it glows)
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({
      map: FLAME_TEXTURE,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    flame.scale.set(0.12, 0.12, 0.12);
    flame.position.y = -0.09;
    group.add(flame);

    this.scene.add(group);

    // Trail line (positions filled in as the rocket flies)
    const trailGeo = new THREE.BufferGeometry();
    const MAX_TRAIL_POINTS = 250;
    const trailPositions = new Float32Array(MAX_TRAIL_POINTS * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setDrawRange(0, 0);
    const trail = new THREE.Line(
      trailGeo,
      new THREE.LineBasicMaterial({
        color: 0xff6b35,
        transparent: true,
        opacity: 0.7,
      })
    );
    this.scene.add(trail);

    const rocket = {
      group,
      flame,
      trail,
      trailPositions,
      trailLen: 0,
      maxTrail: MAX_TRAIL_POINTS,
      start,
      ctrl,
      target,
      t: 0,
      speed: 0.0035 + Math.random() * 0.0025,
      site,
      missionName: missionName ?? MISSION_NAMES[Math.floor(Math.random() * MISSION_NAMES.length)],
      booster: boosterSerial ?? BOOSTERS[Math.floor(Math.random() * BOOSTERS.length)],
      phase: 'ascent',          // 'ascent' | 'orbit' | 'done'
      orbitAngle: 0,
      orbitAxis: new THREE.Vector3(
        Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5
      ).normalize(),
      orbitTimer: 0,
      dead: false,
    };

    this.rockets.push(rocket);
    return rocket;
  }

  // Tick every rocket (call from animate loop). dt is seconds since last frame.
  // onPhaseChange(rocket, oldPhase, newPhase) — optional callback for log entries.
  update(dt, onPhaseChange) {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      this._tickRocket(r, dt, onPhaseChange);
      if (r.dead) {
        this.scene.remove(r.group);
        this.scene.remove(r.trail);
        this.rockets.splice(i, 1);
      }
    }
  }

  _tickRocket(r, dt, onPhaseChange) {
    if (r.phase === 'ascent') {
      r.t += r.speed;
      if (r.t >= 1) {
        r.t = 1;
        const old = r.phase;
        r.phase = 'orbit';
        onPhaseChange && onPhaseChange(r, old, 'orbit');
      }
      const pos = qbezier(r.start, r.ctrl, r.target, r.t);
      r.group.position.copy(pos);

      // Orient rocket so its nose points along the trajectory
      const tangent = qbezierTangent(r.start, r.ctrl, r.target, r.t);
      r.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);

      // Flame flicker
      const s = 0.10 + Math.random() * 0.05;
      r.flame.scale.set(s, s, s);

      // Append point to trail
      if (r.trailLen < r.maxTrail) {
        r.trailPositions[r.trailLen * 3]     = pos.x;
        r.trailPositions[r.trailLen * 3 + 1] = pos.y;
        r.trailPositions[r.trailLen * 3 + 2] = pos.z;
        r.trailLen++;
        r.trail.geometry.setDrawRange(0, r.trailLen);
        r.trail.geometry.attributes.position.needsUpdate = true;
      }
    } else if (r.phase === 'orbit') {
      r.orbitTimer += dt;
      r.orbitAngle += 0.005;
      const orbitPos = r.target.clone().applyAxisAngle(r.orbitAxis, r.orbitAngle);
      r.group.position.copy(orbitPos);

      // Fade flame out
      r.flame.material.opacity = Math.max(0, r.flame.material.opacity - 0.02);

      if (r.orbitTimer > 12) {
        const old = r.phase;
        r.phase = 'done';
        onPhaseChange && onPhaseChange(r, old, 'done');
      }
    } else if (r.phase === 'done') {
      // Fade out everything
      r.group.children.forEach((child) => {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = (child.material.opacity ?? 1) - 0.02;
        }
      });
      r.trail.material.opacity = Math.max(0, r.trail.material.opacity - 0.015);
      if (r.trail.material.opacity <= 0) {
        r.dead = true;
      }
    }
  }

  // Counts for the telemetry HUD
  countAscending() { return this.rockets.filter((r) => r.phase === 'ascent').length; }
  countOrbiting()  { return this.rockets.filter((r) => r.phase === 'orbit').length; }

  // For raycast picking: returns array of {mesh, rocket} for currently flying rockets
  getPickables() {
    return this.rockets
      .filter((r) => r.phase !== 'done')
      .map((r) => ({ mesh: r.group, rocket: r }));
  }
}

// ---------- BEZIER MATH ----------
// Quadratic Bezier curve: P(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
function qbezier(p0, p1, p2, t) {
  const u = 1 - t;
  return new THREE.Vector3()
    .addScaledVector(p0, u * u)
    .addScaledVector(p1, 2 * u * t)
    .addScaledVector(p2, t * t);
}

// Tangent (derivative) of the Bezier — used to point the rocket nose forward.
function qbezierTangent(p0, p1, p2, t) {
  return new THREE.Vector3()
    .addScaledVector(p1.clone().sub(p0), 2 * (1 - t))
    .addScaledVector(p2.clone().sub(p1), 2 * t)
    .normalize();
}