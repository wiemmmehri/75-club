"use client";
import Link from "next/link";
import { useApp } from "./AppContext";
import Avatar from "./Avatar";
import SoundToggle from "./SoundToggle";

export default function TopBar() {
  const { me } = useApp();
  return (
    <div className="row between" style={{ marginBottom: 18 }}>
      <Link href="/club" className="serif row" style={{ fontSize: 24, textDecoration: "none", color: "var(--ink)", gap: 8 }}>
        <img src="/logo.png" alt="" width={34} height={34} style={{ borderRadius: 11, boxShadow: "var(--shadow)" }} />
        <span>the <em style={{ color: "var(--cherry)" }}>75</em> club</span>
      </Link>
      <div className="row" style={{ gap: 8 }}>
        <SoundToggle />
        <Link href="/me" aria-label="Mon profil"><Avatar u={me} size={42} /></Link>
      </div>
    </div>
  );
}
