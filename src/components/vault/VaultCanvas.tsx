"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { VaultState } from "@/hooks/useVaultState";

interface VaultSceneContentProps {
  state: VaultState;
  reducedMotion: boolean;
  isMobile: boolean;
  dragRot: number;
}

function VaultModel({ state, reducedMotion, isMobile, dragRot }: VaultSceneContentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const vaultMeshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const blockRef = useRef<THREE.Mesh>(null);

  const docsRef = useRef<THREE.Mesh[]>([]);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const linesRef = useRef<THREE.Line[]>([]);
  const pulsesRef = useRef<THREE.Mesh[]>([]);

  // Interpolated state variables matching prototype
  const st8 = useRef({
    rad: 4.2,
    lock: 0,
    scan: 0,
    blk: 0,
    shake: 0,
  });

  const cBad = useMemo(() => new THREE.Color("#B63A3A"), []);
  const cWarn = useMemo(() => new THREE.Color("#C98A1A"), []);
  const cOk = useMemo(() => new THREE.Color("#0F7A52"), []);
  const cAcc = useMemo(() => new THREE.Color("#0F5C47"), []);
  const cPaper = useMemo(() => new THREE.Color("#FFFCF4"), []);
  const cInk = useMemo(() => new THREE.Color("#16211C"), []);
  const cMuted = useMemo(() => new THREE.Color("#5E6B63"), []);
  const cBlue = useMemo(() => new THREE.Color("#3E63D9"), []);

  // Geometry allocations
  const vaultGeo = useMemo(() => new THREE.BoxGeometry(2.2, 2.2, 2.2), []);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6, 2.6, 2.6)), []);
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(0.55, 1), []);
  const ringGeo = useMemo(() => new THREE.TorusGeometry(3.7, 0.025, 8, 160), []);
  const scanGeo = useMemo(() => new THREE.TorusGeometry(2.1, 0.05, 8, 96), []);
  const docGeo = useMemo(() => new THREE.BoxGeometry(0.95, 1.25, 0.06), []);
  const nodeGeo = useMemo(() => new THREE.SphereGeometry(0.38, 24, 24), []);
  const pulseGeo = useMemo(() => new THREE.SphereGeometry(0.09, 12, 12), []);
  const blockGeo = useMemo(() => new THREE.BoxGeometry(1, 0.55, 1), []);

  // Connection line points
  const leftLineGeo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5.2, 0.4, 0), new THREE.Vector3(0, 0, 0)]),
    []
  );
  const rightLineGeo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(5.2, 0.4, 0), new THREE.Vector3(0, 0, 0)]),
    []
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = performance.now() * 0.001;
    const k = reducedMotion ? 1 : 1 - Math.pow(0.001, dt);

    let tgtRad = 4.2;
    let tgtLock = 0;
    let tgtScan = 0;
    let tgtBlk = 0;
    let shake = 0;
    let lineCol = cMuted;

    if (state === "encrypting") {
      tgtRad = 1.9;
      tgtLock = 1;
    } else if (state === "verifying") {
      tgtRad = 3.6;
      tgtScan = 1;
      lineCol = cBlue;
    } else if (state === "anchored") {
      tgtRad = 3.8;
      tgtBlk = 1;
      lineCol = cOk;
    } else if (state === "failed") {
      tgtRad = 5.2;
      shake = 1;
      lineCol = cBad;
    }

    // Prototype lerp function: L(a, b, k) = a + (b - a) * k
    st8.current.rad += (tgtRad - st8.current.rad) * k;
    st8.current.lock += (tgtLock - st8.current.lock) * k;
    st8.current.scan += (tgtScan - st8.current.scan) * k;
    st8.current.blk += (tgtBlk - st8.current.blk) * k;
    st8.current.shake += (shake - st8.current.shake) * k;

    // Group orientation
    if (groupRef.current) {
      groupRef.current.rotation.x = 0.18;
      groupRef.current.rotation.y = reducedMotion ? 0.5 : dragRot;
    }

    // Vault color & shake
    if (vaultMeshRef.current) {
      const mat = vaultMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(state === "failed" ? cBad : cAcc);
      vaultMeshRef.current.position.x = st8.current.shake * Math.sin(t * 50) * 0.06;
    }

    // Core pulsing & emissive color
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      coreRef.current.rotation.y = t;
      mat.emissive.set(
        state === "failed"
          ? cBad
          : state === "verifying"
          ? cBlue
          : state === "anchored"
          ? cWarn
          : 0xf7f1e3
      );
      if (!reducedMotion) {
        const s = 1 + 0.08 * Math.sin(t * 3);
        coreRef.current.scale.set(s, s, s);
      }
    }

    // Outer ring color
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.color.copy(state === "failed" ? cBad : cInk);
    }

    // Documents orbit & contraction
    docsRef.current.forEach((d, i) => {
      if (!d) return;
      const baseAngle = (i / 7) * Math.PI * 2;
      const a = baseAngle + t * (reducedMotion ? 0 : 0.35);
      const r = st8.current.rad;
      d.position.set(
        Math.cos(a) * r,
        Math.sin(t * 0.8 + i) * 0.35 + (i % 2 ? 0.9 : -0.9),
        Math.sin(a) * r
      );
      d.lookAt(0, d.position.y, 0);

      const mat = d.material as THREE.MeshStandardMaterial;
      mat.color.copy(cPaper.clone().lerp(cOk, st8.current.lock * 0.75));
      const s = 1 - st8.current.lock * 0.35;
      d.scale.set(s, s, s);
    });

    // Scan ring sweeping
    if (scanRef.current) {
      const mat = scanRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = st8.current.scan * 0.9;
      scanRef.current.position.y = Math.sin(t * 2.2) * 1.5 * st8.current.scan;
    }

    // Nodes (Participants)
    nodesRef.current.forEach((n) => {
      if (!n) return;
      const mat = n.material as THREE.MeshStandardMaterial;
      mat.color.set(state === "failed" ? cBad : cBlue);
    });

    // Lines
    linesRef.current.forEach((l) => {
      if (!l) return;
      const mat = l.material as THREE.LineBasicMaterial;
      mat.color.copy(lineCol);
    });

    // Pulses
    pulsesRef.current.forEach((p, i) => {
      if (!p) return;
      const on = state === "verifying" || state === "anchored" || state === "encrypting";
      p.visible = on && !reducedMotion;
      if (on && !reducedMotion) {
        const s = i % 2 ? 1 : -1;
        const u = (t * 0.5 + i * 0.25) % 1;
        p.position.set(s * 5.2 * (state === "encrypting" ? 1 - u : u), 0.4 * (1 - u), 0);
        const mat = p.material as THREE.MeshBasicMaterial;
        mat.color.set(state === "encrypting" ? cOk : state === "anchored" ? cWarn : cBlue);
      }
    });

    // Anchored receipt block
    if (blockRef.current) {
      const blkScale = Math.max(0.001, st8.current.blk);
      blockRef.current.scale.set(blkScale, blkScale, blkScale);
      blockRef.current.rotation.y = t * 0.8;
      blockRef.current.position.y = 3.2 + Math.sin(t * 2) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Vault */}
      <mesh ref={vaultMeshRef} geometry={vaultGeo}>
        <meshStandardMaterial
          color={0x0f5c47}
          roughness={0.35}
          metalness={0.25}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Outer Wireframe Edges */}
      <primitive
        object={
          new THREE.LineSegments(
            edgesGeo,
            new THREE.LineBasicMaterial({ color: 0x16211c })
          )
        }
      />

      {/* Core Glowing Icosahedron */}
      <mesh ref={coreRef} geometry={coreGeo}>
        <meshStandardMaterial
          color={0xf7f1e3}
          emissive={0xf7f1e3}
          emissiveIntensity={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Orbit Ring */}
      <mesh ref={ringRef} geometry={ringGeo} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={0x16211c} />
      </mesh>

      {/* Scan Ring */}
      <mesh ref={scanRef} geometry={scanGeo} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={0x3e63d9} transparent opacity={0} />
      </mesh>

      {/* 7 Orbiting Document Sheets */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) docsRef.current[i] = el;
          }}
          geometry={docGeo}
        >
          <meshStandardMaterial color={0xfffcf4} roughness={0.6} />
        </mesh>
      ))}

      {/* Participant Nodes (Left and Right) */}
      {[-1, 1].map((s, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            if (el) nodesRef.current[idx] = el;
          }}
          geometry={nodeGeo}
          position={[s * 5.2, 0.4, 0]}
        >
          <meshStandardMaterial color={0x3e63d9} roughness={0.4} />
        </mesh>
      ))}

      {/* Connection Lines */}
      <primitive
        object={
          new THREE.Line(
            leftLineGeo,
            new THREE.LineBasicMaterial({ color: 0x5e6b63 })
          )
        }
        ref={(el: THREE.Line) => {
          if (el) linesRef.current[0] = el;
        }}
      />
      <primitive
        object={
          new THREE.Line(
            rightLineGeo,
            new THREE.LineBasicMaterial({ color: 0x5e6b63 })
          )
        }
        ref={(el: THREE.Line) => {
          if (el) linesRef.current[1] = el;
        }}
      />

      {/* 4 Traveling Pulses */}
      {Array.from({ length: 4 }).map((_, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            if (el) pulsesRef.current[idx] = el;
          }}
          geometry={pulseGeo}
          visible={false}
        >
          <meshBasicMaterial color={0x3e63d9} />
        </mesh>
      ))}

      {/* Receipt Block (Scales in when anchored) */}
      <mesh ref={blockRef} geometry={blockGeo} position={[0, 3.2, 0]} scale={0.001}>
        <meshStandardMaterial color={0xc98a1a} roughness={0.35} metalness={0.3} />
      </mesh>
    </group>
  );
}

export interface VaultCanvasProps {
  state: VaultState;
  size?: "hero" | "mini" | "inline";
  className?: string;
}

export default function VaultCanvas({
  state = "idle",
  size = "hero",
  className = "",
}: VaultCanvasProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Drag and inertia state matching prototype
  const [rot, setRot] = useState(0);
  const isDragging = useRef(false);
  const prevX = useRef(0);
  const vel = useRef(0);
  const rotRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener("change", motionHandler);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && !document.hidden);
      },
      { threshold: 0.05 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Animation frame for inertia and idle auto-rotation
    let animId: number;
    let lastTime = performance.now();

    const inertiaLoop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;

      if (!reducedMotion && !isDragging.current) {
        rotRef.current += vel.current;
        vel.current *= 0.94;
        rotRef.current += dt * 0.18;
        setRot(rotRef.current);
      }

      animId = requestAnimationFrame(inertiaLoop);
    };
    animId = requestAnimationFrame(inertiaLoop);

    return () => {
      motionQuery.removeEventListener("change", motionHandler);
      window.removeEventListener("resize", checkMobile);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [reducedMotion]);

  // Pointer drag event handlers matching prototype
  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    prevX.current = e.clientX;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - prevX.current;
    prevX.current = e.clientX;
    rotRef.current += deltaX * 0.01;
    vel.current = deltaX * 0.01;
    setRot(rotRef.current);
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  const sizeClasses = {
    hero: "w-full h-[480px] sm:h-[520px]",
    mini: "w-24 h-24",
    inline: "w-16 h-16",
  };

  const cameraDistance = isMobile ? 15 : size === "mini" ? 12 : size === "inline" ? 12 : 11;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`relative select-none cursor-grab active:cursor-grabbing touch-none ${sizeClasses[size]} ${className}`}
      role="region"
      aria-label="Interactive 3D model of a private room that reacts to encryption, verification and receipt steps"
    >
      {isVisible && (
        <Canvas
          camera={{ position: [0, 1.2, cameraDistance], fov: 38 }}
          dpr={[1, 2]}
          gl={{
            powerPreference: "high-performance",
            antialias: true,
            alpha: true,
          }}
        >
          <ambientLight intensity={0.85} color="#ffffff" />
          <directionalLight position={[4, 6, 5]} intensity={0.9} color="#ffffff" />

          <VaultModel
            state={state}
            reducedMotion={reducedMotion}
            isMobile={isMobile}
            dragRot={rot}
          />
        </Canvas>
      )}

      {/* Screen-reader status announcement */}
      <span className="sr-only" aria-live="polite">
        Vault status: {state}
      </span>
    </div>
  );
}
