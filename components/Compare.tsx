"use client";
import { useRef, useState } from "react";

/** Drag to compare the "before" photo with the latest one. */
export default function Compare({ before, after, beforeLabel = "Avant", afterLabel = "Maintenant" }: {
  before: string; after: string; beforeLabel?: string; afterLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(50);
  const move = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    setX(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={ref}
      className="compare"
      onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); move(e.clientX); }}
      onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") move(e.clientX); }}
    >
      <img src={after} alt={afterLabel} />
      <img src={before} alt={beforeLabel} style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }} />
      <span className="tag" style={{ left: 10 }}>{beforeLabel}</span>
      <span className="tag" style={{ right: 10 }}>{afterLabel}</span>
      <div className="handle" style={{ left: `calc(${x}% - 1.5px)` }}>
        <div className="knob">↔</div>
      </div>
    </div>
  );
}
