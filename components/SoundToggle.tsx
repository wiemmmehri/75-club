"use client";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, sfx } from "@/lib/sound";

export default function SoundToggle() {
  const [muted, setM] = useState(false);
  useEffect(() => setM(isMuted()), []);
  return (
    <button className="icon-btn" aria-label={muted ? "Activer le son" : "Couper le son"}
      onClick={() => { setMuted(!muted); setM(!muted); if (muted) setTimeout(() => sfx.pop(), 10); }}>
      {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
    </button>
  );
}
