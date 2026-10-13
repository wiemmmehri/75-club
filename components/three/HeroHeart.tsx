"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Env from "./Env";
import { heartGeometry, chrome } from "./heart";

function Spinning({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const v = useRef(0.6);
  const drag = useRef<number | null>(null);
  const mat = useMemo(() => chrome(color), [color]);
  useFrame((s, dt) => {
    if (!ref.current) return;
    if (drag.current === null) v.current += (0.6 - v.current) * dt;
    ref.current.rotation.y += v.current * dt;
    ref.current.position.y = Math.sin(s.clock.elapsedTime * 1.3) * 0.08;
  });
  return (
    <mesh ref={ref} geometry={heartGeometry()} material={mat} scale={1.6}
      onPointerDown={(e) => { drag.current = e.clientX; }}
      onPointerMove={(e) => { if (drag.current === null) return; v.current = (e.clientX - drag.current) * 0.8; drag.current = e.clientX; }}
      onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }} />
  );
}

/** Big chrome heart you can spin with a finger. */
export default function HeroHeart({ color = "#ffa8cb" }: { color?: string }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 40 }} gl={{ alpha: true, antialias: true }} style={{ touchAction: "pan-y" }}>
      <Env />
      <Spinning color={color} />
    </Canvas>
  );
}
