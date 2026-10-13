"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Heart, Coffee, Crown, Film } from "lucide-react";
import { sfx } from "@/lib/sound";
import { buzz } from "@/lib/client";

const TABS = [
  { href: "/club", Icon: Home, label: "Club" },
  { href: "/era", Icon: Heart, label: "My era" },
  { href: "/tea", Icon: Coffee, label: "Tea" },
  { href: "/awards", Icon: Crown, label: "Awards" },
  { href: "/archive", Icon: Film, label: "Archive" },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Navigation">
      {TABS.map(({ href, Icon, label }) => {
        const active = path.startsWith(href);
        return (
          <Link key={href} href={href} className={`tab ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}
            onClick={() => { if (!active) { sfx.tap(); buzz(6); } }}>
            {active && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
            <motion.span animate={{ scale: active ? 1.08 : 1 }} style={{ display: "grid" }}>
              <Icon size={21} strokeWidth={active ? 2.4 : 1.9} fill={active && label === "My era" ? "currentColor" : "none"} />
            </motion.span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
