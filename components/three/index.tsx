"use client";
import dynamic from "next/dynamic";

const fallback = () => <div style={{ width: "100%", height: "100%" }} />;
export const HeartsScene = dynamic(() => import("./HeartsScene"), { ssr: false, loading: fallback });
export const SplashScene = dynamic(() => import("./SplashScene"), { ssr: false, loading: fallback });
export const HeroHeart = dynamic(() => import("./HeroHeart"), { ssr: false, loading: fallback });
