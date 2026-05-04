import * as THREE from "three";

export default function getStarfield({ numStars = 500, fog = true } = {}) {
  const verts = [];
  const colors = [];

  for (let i = 0; i < numStars; i++) {
    const radius = Math.random() * 25 + 25;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    verts.push(x, y, z);

    const c = new THREE.Color().setHSL(0.6, 0.2, Math.random() * 0.5 + 0.5);
    colors.push(c.r, c.g, c.b);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    fog,
  });

  return new THREE.Points(geo, mat);
}