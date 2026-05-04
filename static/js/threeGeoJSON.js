import * as THREE from "three";

const DEG2RAD = Math.PI / 180;

function project([lon, lat], radius) {
  const phi = (90 - lat) * DEG2RAD;
  const theta = (lon + 180) * DEG2RAD;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z =  radius * Math.sin(phi) * Math.sin(theta);
  const y =  radius * Math.cos(phi);
  return [x, y, z];
}

function pushLineString(coords, radius, out) {
  for (let i = 0; i < coords.length - 1; i++) {
    const a = project(coords[i], radius);
    const b = project(coords[i + 1], radius);
    out.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  }
}

function collect(geometry, radius, out) {
  if (!geometry) return;
  switch (geometry.type) {
    case "LineString":
      pushLineString(geometry.coordinates, radius, out);
      break;
    case "MultiLineString":
      geometry.coordinates.forEach((line) => pushLineString(line, radius, out));
      break;
    case "Polygon":
      geometry.coordinates.forEach((ring) => pushLineString(ring, radius, out));
      break;
    case "MultiPolygon":
      geometry.coordinates.forEach((poly) =>
        poly.forEach((ring) => pushLineString(ring, radius, out))
      );
      break;
    case "GeometryCollection":
      (geometry.geometries || []).forEach((g) => collect(g, radius, out));
      break;
  }
}

export function drawThreeGeo({ json, radius = 1, materialOptions = {} }) {
  const group = new THREE.Group();
  if (!json) return group;

  let features = [];
  if (json.type === "FeatureCollection") features = json.features || [];
  else if (json.type === "Feature") features = [json];
  else if (json.type) features = [{ type: "Feature", geometry: json }];

  const verts = [];
  features.forEach((f) => collect(f.geometry, radius, verts));

  if (verts.length === 0) return group;

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  const material = new THREE.LineBasicMaterial(materialOptions);
  group.add(new THREE.LineSegments(geom, material));
  return group;
}