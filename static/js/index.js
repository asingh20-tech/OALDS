import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import getStarfield from "./getStarfield.js";
import { drawThreeGeo } from "./threeGeoJSON.js";
import {
  fetchLaunchSites,
  fetchMissions,
  fetchBoosters,
  createLaunchSitePins,
  RocketManager,
} from "./rockets.js";
//  SCENE / CAMERA / RENDERER

const w = window.innerWidth;
const h = window.innerHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, w / h, 1, 100);
camera.position.z = 5;

// I am Trying WebGPU first, fall back to WebGL if it fails
let renderer;
try {
  renderer = new THREE.WebGPURenderer({ antialias: true });
  await renderer.init();
  console.log('Using WebGPU renderer');
} catch (err) {
  console.warn('WebGPU not available, falling back to WebGL:', err);
  renderer = new THREE.WebGLRenderer({ antialias: true });
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 3;
controls.maxDistance = 12;


//  GLOBE

const PLANET_RADIUS = 2;

const sphereGeom = new THREE.SphereGeometry(PLANET_RADIUS);
const lineMat = new THREE.LineBasicMaterial({ color: 0x222222 });
const edges = new THREE.EdgesGeometry(sphereGeom, 1);
const wireframe = new THREE.LineSegments(edges, lineMat);
scene.add(wireframe);

const darkMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.99,
});
const darkGlobe = new THREE.Mesh(sphereGeom, darkMat);
darkGlobe.scale.setScalar(0.99);
scene.add(darkGlobe);

const stars = getStarfield({ numStars: 1000, fog: false });
scene.add(stars);

// Try multiple paths for the geojson so it works regardless of folder layout
const geojsonPaths = [
  "/static/geojson/countries.json",
];
async function loadCountries() {
  for (const path of geojsonPaths) {
    try {
      const response = await fetch(path);
      if (!response.ok) continue;
      const data = await response.json();
      const countries = drawThreeGeo({
        json: data,
        radius: PLANET_RADIUS,
        materialOptions: { color: 0xffffff },
      });
      scene.add(countries);
      console.log(`Loaded countries from ${path}`);
      return;
    } catch (err) {
      // try next path
    }
  }
  console.error('Could not load countries.json from any path');
}
loadCountries();




//  LAUNCH SITE PINS + ROCKET MANAGER

const rocketMgr = new RocketManager(scene, PLANET_RADIUS);
let sitePins = [];
let LAUNCH_SITES = [];


//  HUD HOOKS

const utcEl       = document.getElementById('utc-time');
const siteListEl  = document.getElementById('site-list');
const logListEl   = document.getElementById('log-list');
const tActiveEl   = document.getElementById('t-active');
const tOrbitEl    = document.getElementById('t-orbit');
const launchBtn   = document.getElementById('launch-btn');
const launchCntEl = document.getElementById('launch-count');
const popup       = document.getElementById('rocket-popup');
const rpName      = document.getElementById('rp-name');
const rpSite      = document.getElementById('rp-site');
const rpPhase     = document.getElementById('rp-phase');
const rpBooster   = document.getElementById('rp-booster');

let totalLaunches = 0;

async function initLaunchSites() {
  // Fetch all data from Django APIs in parallel
  await Promise.all([
    fetchLaunchSites().then((sites) => { LAUNCH_SITES = sites; }),
    fetchMissions(),
    fetchBoosters(),
  ]);
  
  // Create the pins on the globe
  sitePins = createLaunchSitePins(scene, PLANET_RADIUS, LAUNCH_SITES);
  
  // Build the site list in the HUD
  LAUNCH_SITES.forEach((s) => {
    const el = document.createElement('div');
    el.className = 'site-item';
    el.innerHTML = `
      <div class="site-marker"></div>
      <div class="site-info">
        <div class="name">${s.name}</div>
        <div class="coords">${s.lat.toFixed(2)}°, ${s.lon.toFixed(2)}°</div>
      </div>
      <div class="site-launch">▲ LAUNCH</div>
    `;
    el.addEventListener('click', () => fireRocket(s));
    siteListEl?.appendChild(el);
  });
  
  // Start the auto-launch sequence after sites are loaded
  setTimeout(() => {
    if (LAUNCH_SITES.length > 0) {
      fireRocket(LAUNCH_SITES[0]);
      scheduleAutoLaunch();
    }
  }, 1500);
}

initLaunchSites();

function pad(n) { return String(n).padStart(2, '0'); }

function addLog(type, msg) {
  if (!logListEl) return;
  const now = new Date();
  const time = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span class="time">${time}</span><span class="msg">${msg}</span>`;
  logListEl.prepend(entry);
  while (logListEl.children.length > 20) logListEl.removeChild(logListEl.lastChild);
}

function fireRocket(site) {
  const r = rocketMgr.launch(site);
  totalLaunches++;
  if (launchCntEl) launchCntEl.textContent = String(totalLaunches).padStart(3, '0');
  addLog('launch', `${r.missionName} · liftoff from ${site.code}`);
}

launchBtn?.addEventListener('click', () => {
  const site = LAUNCH_SITES[Math.floor(Math.random() * LAUNCH_SITES.length)];
  fireRocket(site);
});

function scheduleAutoLaunch() {
  const delay = 4000 + Math.random() * 3000;
  setTimeout(() => {
    const site = LAUNCH_SITES[Math.floor(Math.random() * LAUNCH_SITES.length)];
    fireRocket(site);
    scheduleAutoLaunch();
  }, delay);
}


function tickClock() {
  if (!utcEl) return;
  const n = new Date();
  utcEl.textContent = `${pad(n.getUTCHours())}:${pad(n.getUTCMinutes())}:${pad(n.getUTCSeconds())}`;
}
setInterval(tickClock, 1000);
tickClock();


//  ROCKET PICKING

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('pointermove', (e) => {
  if (!popup) return;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const pickables = rocketMgr.getPickables();
  let hit = null;
  for (const { mesh, rocket } of pickables) {
    const intersects = raycaster.intersectObjects(mesh.children, false);
    if (intersects.length > 0) { hit = rocket; break; }
  }

  if (hit) {
    popup.style.display = 'block';
    popup.style.left = (e.clientX + 14) + 'px';
    popup.style.top  = (e.clientY + 14) + 'px';
    rpName.textContent    = hit.missionName;
    rpSite.textContent    = hit.site.code;
    rpPhase.textContent   = hit.phase.toUpperCase();
    rpBooster.textContent = hit.booster;
    renderer.domElement.style.cursor = 'pointer';
  } else {
    popup.style.display = 'none';
    renderer.domElement.style.cursor = 'grab';
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


//  ANIMATION LOOP

let lastTime = performance.now();

function animate() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  controls.update();

  sitePins.forEach((p) => {
    p.ringPhase += 0.04;
    const scale = 1 + (Math.sin(p.ringPhase) * 0.5 + 0.5) * 1.4;
    p.ring.scale.set(scale, scale, scale);
    p.ring.material.opacity = Math.max(0, 0.6 - (scale - 1) * 0.25);
  });

  rocketMgr.update(dt, (rocket, oldPhase, newPhase) => {
    if (newPhase === 'orbit') {
      addLog('orbit', `${rocket.missionName} · orbit insertion confirmed`);
    } else if (newPhase === 'done') {
      addLog('land', `${rocket.missionName} · payload deployed`);
    }
  });

  if (tActiveEl) tActiveEl.textContent = String(rocketMgr.countAscending()).padStart(2, '0');
  if (tOrbitEl)  tOrbitEl.textContent  = String(rocketMgr.countOrbiting()).padStart(2, '0');

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);