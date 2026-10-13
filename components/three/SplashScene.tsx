"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Env from "./Env";
import { heartGeometry, candy, chrome } from "./heart";

const GIRL_COLORS = ["#FF4F9A", "#D9134F", "#8B6CFF", "#E0A030"];
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

function Scene() {
  const small = useRef<(THREE.Mesh | null)[]>([]);
  const big = useRef<THREE.Mesh>(null);
  const geo = heartGeometry();
  const mats = useMemo(() => GIRL_COLORS.map((c) => candy(c)), []);
  const bigMat = useMemo(() => chrome("#ff9cc4"), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // four girls' hearts spiral into the centre…
    small.current.forEach((m, i) => {
      if (!m) return;
      const p = ease(t / 1.25);
      const a = (i / 4) * Math.PI * 2 + p * Math.PI * 2.5;
      const r = (1 - p) * 3.2 + 0.05;
      m.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.7, (1 - p) * -2);
      m.rotation.y = t * 4 + i;
      m.scale.setScalar(t < 1.25 ? 0.65 : Math.max(0, 0.65 - (t - 1.25) * 3));
    });
    // …and become one chrome heart
    if (big.current) {
      const k = t - 1.2;
      const s = k <= 0 ? 0 : 1.3 * (1 + Math.sin(Math.min(k * 9, Math.PI)) * 0.18 * Math.exp(-k * 2)) * ease(k * 3);
      big.current.scale.setScalar(s);
      big.current.rotation.y = Math.sin(t * 0.8) * 0.6 + (k > 0 ? Math.max(0, 1 - k * 1.2) * Math.PI * 2 : 0);
      big.current.position.y = 0.55 + Math.sin(t * 1.5) * 0.06;
    }
  });

  return (
    <>
      {GIRL_COLORS.map((_, i) => (
        <mesh key={i} ref={(m) => { small.current[i] = m; }} geometry={geo} material={mats[i]} />
      ))}
      <mesh ref={big} geometry={geo} material={bigMat} scale={0} />
    </>
  );
}

export default function SplashScene() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6], fov: 40 }} gl={{ alpha: true, antialias: true }}>
      <Env />
      <Scene />
    </Canvas>
  );
}
