"use client";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { applyEnvironment } from "./heart";

export default function Env() {
  const { gl, scene } = useThree();
  useEffect(() => applyEnvironment(gl, scene), [gl, scene]);
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} color="#fff0f5" />
      <pointLight position={[-3, -2, 3]} intensity={12} color="#ff8fbf" />
    </>
  );
}
