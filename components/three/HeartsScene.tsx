"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Env from "./Env";
import { heartGeometry, candy, glass, pearl } from "./heart";

type Props = { goals: { id: number; color: string }[]; done: number[]; onTapHeart?: (id: number) => void };

const R = 1.7;

function Heart({ index, count, color, on, celebrate, onTap }: { index: number; count: number; color: string; on: boolean; celebrate: number; onTap?: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const geo = heartGeometry();
  const matOn = useMemo(() => candy(color), [color]);
  const matOff = useMemo(() => glass(), []);
  const anim = useRef({ s: on ? 1 : 0.78, jump: 0, spin: 0, spinCur: 0, wasOn: on, lastCelebrate: celebrate });
  const angle = (index / Math.max(1, count)) * Math.PI * 2;
  const radius = count === 1 ? 0 : count > 4 ? R + 0.3 : R;

  useFrame((state, dt) => {
    const m = ref.current;
    if (!m) return;
    const a = anim.current;
    if (on && !a.wasOn) { a.jump = 1; a.spin += Math.PI * 2; }
    if (celebrate !== a.lastCelebrate) { a.lastCelebrate = celebrate; a.jump = 1.3; a.spin += Math.PI * 4; }
    a.wasOn = on;
    const target = on ? 1 : 0.78;
    a.s += (target - a.s) * Math.min(1, dt * 8);
    a.jump = Math.max(0, a.jump - dt * 1.6);
    const t = state.clock.elapsedTime;
    const hop = Math.sin(a.jump * Math.PI) * 0.45;
    m.position.set(Math.sin(angle) * radius, Math.sin(t * 1.4 + index) * 0.08 + hop, Math.cos(angle) * radius);
    m.scale.setScalar(a.s * (1 + Math.sin(a.jump * Math.PI) * 0.25));
    const parentRot = m.parent ? m.parent.rotation.y : 0;
    a.spinCur += (a.spin - a.spinCur) * Math.min(1, dt * 4);
    m.rotation.y = -parentRot + a.spinCur; // always face the camera, plus celebratory spins
    m.rotation.z = Math.sin(t * 0.9 + index) * 0.08;
    (m.material as THREE.MeshPhysicalMaterial).emissiveIntensity = on ? 0.05 + Math.sin(a.jump * Math.PI) * 0.6 : 0;
  });

  return (
    <mesh ref={ref} geometry={geo} material={on ? matOn : matOff}
      onPointerDown={(e) => { e.stopPropagation(); onTap?.(); }} />
  );
}

function Carousel({ goals, done, onTapHeart }: Props) {
  const group = useRef<THREE.Group>(null);
  const vel = useRef(0.25);
  const drag = useRef<{ x: number; active: boolean }>({ x: 0, active: false });
  const celebrate = goals.length > 0 && goals.every((g) => done.includes(g.id)) ? 1 : 0;
  const prevFull = useRef(celebrate);
  const pearlMat = useMemo(() => pearl(), []);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (celebrate && !prevFull.current) vel.current = 6;
    prevFull.current = celebrate;
    if (!drag.current.active) vel.current += (0.25 - vel.current) * Math.min(1, dt * 1.2);
    g.rotation.y += vel.current * dt;
  });

  return (
    <group
      ref={group}
      onPointerDown={(e) => { drag.current = { x: e.clientX, active: true }; }}
      onPointerMove={(e) => {
        if (!drag.current.active) return;
        const dx = e.clientX - drag.current.x;
        drag.current.x = e.clientX;
        if (group.current) group.current.rotation.y += dx * 0.01;
        vel.current = dx * 0.6;
      }}
      onPointerUp={() => { drag.current.active = false; }}
      onPointerLeave={() => { drag.current.active = false; }}
    >
      {goals.map((g, i) => (
        <Heart key={g.id} index={i} count={goals.length} color={g.color} on={done.includes(g.id)} celebrate={celebrate}
          onTap={() => onTapHeart?.(g.id)} />
      ))}
      {goals.length > 1 && <mesh material={pearlMat} scale={celebrate ? 0.62 : 0.5}>
        <sphereGeometry args={[1, 48, 48]} />
      </mesh>}
    </group>
  );
}

/** My Era hero: one candy heart per goal (1 to 6) on a carousel. Glass when pending, candy when done. Drag to spin. */
export default function HeartsScene(props: Props) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 1.5, 5.6], fov: 40 }} gl={{ alpha: true, antialias: true }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)} style={{ touchAction: "pan-y" }}>
      <Env />
      <Carousel {...props} />
    </Canvas>
  );
}
