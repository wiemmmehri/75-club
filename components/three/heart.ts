import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

let geo: THREE.ExtrudeGeometry | null = null;

/** A puffy, rounded 3D heart. */
export function heartGeometry() {
  if (geo) return geo;
  const s = new THREE.Shape();
  s.moveTo(0.5, 0.5);
  s.bezierCurveTo(0.5, 0.5, 0.4, 0, 0, 0);
  s.bezierCurveTo(-0.6, 0, -0.6, 0.7, -0.6, 0.7);
  s.bezierCurveTo(-0.6, 1.1, -0.3, 1.54, 0.5, 1.9);
  s.bezierCurveTo(1.2, 1.54, 1.6, 1.1, 1.6, 0.7);
  s.bezierCurveTo(1.6, 0.7, 1.6, 0, 1, 0);
  s.bezierCurveTo(0.7, 0, 0.5, 0.5, 0.5, 0.5);
  geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.18, bevelEnabled: true, bevelThickness: 0.42, bevelSize: 0.32, bevelSegments: 12, curveSegments: 36,
  });
  geo.center();
  geo.rotateZ(Math.PI);
  geo.scale(0.52, 0.52, 0.52);
  geo.computeVertexNormals();
  return geo;
}

export function candy(color: string) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: 0.14, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04,
    iridescence: 0.45, iridescenceIOR: 1.45, sheen: 0.15, sheenColor: new THREE.Color("#ffffff"),
    emissive: new THREE.Color(color), emissiveIntensity: 0.05,
  });
}

export function glass() {
  // frosted "ghost" heart: light, cheap on phones, iridescent edges
  return new THREE.MeshPhysicalMaterial({
    color: "#fff2f7", roughness: 0.28, metalness: 0, transparent: true, opacity: 0.5, depthWrite: false,
    iridescence: 1, iridescenceIOR: 1.3, clearcoat: 1, clearcoatRoughness: 0.15,
  });
}

export function chrome(color = "#ffb3cf") {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 0.55, roughness: 0.16, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 800],
    clearcoat: 1, clearcoatRoughness: 0.05,
  });
}

export function pearl() {
  return new THREE.MeshPhysicalMaterial({
    color: "#fff6f8", roughness: 0.25, metalness: 0.1, iridescence: 1, iridescenceIOR: 1.8, sheen: 1,
    sheenColor: new THREE.Color("#ffc6dc"), clearcoat: 1,
  });
}

/** Procedural studio environment: glossy reflections without downloading any HDR. */
export function applyEnvironment(gl: THREE.WebGLRenderer, scene: THREE.Scene) {
  const pmrem = new THREE.PMREMGenerator(gl);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = env;
  (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = 0.7;
  pmrem.dispose();
  return () => env.dispose();
}
