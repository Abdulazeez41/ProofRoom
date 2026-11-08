"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { VaultState } from "@/hooks/useVaultState";

interface VaultSceneContentProps {
  state: VaultState;
  reducedMotion: boolean;
  isMobile: boolean;
}

function VaultModel({ state, reducedMotion, isMobile }: VaultSceneContentProps) {
  const vaultGroupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const scanRingRef = useRef<THREE.Mesh>(null);
  const receiptBoxRef = useRef<THREE.Mesh>(null);
  const documentsGroupRef = useRef<THREE.Group>(null);
  const pulseLeftRef = useRef<THREE.Mesh>(null);
  const pulseRightRef = useRef<THREE.Mesh>(null);

  // Targets for smooth lerp transitions (approx 0.4s)
  const targetDocRadius = useRef(4.2);
  const currentDocRadius = useRef(4.2);

  const targetDocScale = useRef(1);
  const currentDocScale = useRef(1);

  const targetReceiptScale = useRef(0);
  const currentReceiptScale = useRef(0);

  const scanY = useRef(0);
  const scanDir = useRef(1);

  // Colors based on state
  const colors = useMemo(() => {
    return {
      vaultDefault: new THREE.Color("#0F5C47"),
      vaultFailed: new THREE.Color("#B63A3A"),
      coreIdle: new THREE.Color("#5FCFA6"),
      coreVerifying: new THREE.Color("#3E63D9"),
      coreAnchored: new THREE.Color("#E3B04F"),
      coreFailed: new THREE.Color("#F08080"),
      docIdle: new THREE.Color("#FFFCF4"),
      docEncrypting: new THREE.Color("#0F7A52"),
      docFailed: new THREE.Color("#B63A3A"),
      wireIdle: new THREE.Color("#16211C"),
      wireFailed: new THREE.Color("#B63A3A"),
      lineMuted: new THREE.Color("#5E6B63"),
      lineActive: new THREE.Color("#0F7A52"),
      lineVerifying: new THREE.Color("#3E63D9"),
      lineFailed: new THREE.Color("#B63A3A"),
    };
  }, []);

  // Update target values whenever state changes
  useEffect(() => {
    switch (state) {
      case "idle":
        targetDocRadius.current = 4.2;
        targetDocScale.current = 1.0;
        targetReceiptScale.current = 0;
        break;
      case "encrypting":
        targetDocRadius.current = 1.9;
        targetDocScale.current = 0.55;
        targetReceiptScale.current = 0;
        break;
      case "verifying":
        targetDocRadius.current = 4.0;
        targetDocScale.current = 0.95;
        targetReceiptScale.current = 0;
        break;
      case "anchored":
        targetDocRadius.current = 4.2;
        targetDocScale.current = 1.0;
        targetReceiptScale.current = 1.0;
        break;
      case "failed":
        targetDocRadius.current = 5.2;
        targetDocScale.current = 0.85;
        targetReceiptScale.current = 0;
        break;
    }
  }, [state]);

  // Document geometries (7 sheets)
  const docAngles = useMemo(() => {
    return [0, 0.89, 1.79, 2.69, 3.59, 4.48, 5.38];
  }, []);

  // Reusable materials
  const vaultMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: state === "failed" ? colors.vaultFailed : colors.vaultDefault,
        transparent: true,
        opacity: 0.85,
        roughness: 0.25,
        metalness: 0.2,
      }),
    [state, colors]
  );

  const wireframeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: state === "failed" ? colors.wireFailed : colors.wireIdle,
        wireframe: true,
      }),
    [state, colors]
  );

  const coreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color:
          state === "failed"
            ? colors.coreFailed
            : state === "verifying"
            ? colors.coreVerifying
            : state === "anchored"
            ? colors.coreAnchored
            : colors.coreIdle,
        emissive:
          state === "failed"
            ? colors.coreFailed
            : state === "verifying"
            ? colors.coreVerifying
            : state === "anchored"
            ? colors.coreAnchored
            : colors.coreIdle,
        emissiveIntensity: 0.7,
        roughness: 0.3,
      }),
    [state, colors]
  );

  const docMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color:
          state === "failed"
            ? colors.docFailed
            : state === "encrypting"
            ? colors.docEncrypting
            : colors.docIdle,
        roughness: 0.4,
      }),
    [state, colors]
  );

  const receiptMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#A86A10"),
        emissive: new THREE.Color("#E3B04F"),
        emissiveIntensity: 0.4,
        roughness: 0.3,
      }),
    []
  );

  useFrame((_, delta) => {
    const lerpFactor = reducedMotion ? 1 : Math.min(delta * 7.5, 1);

    // Lerp radius and scales
    currentDocRadius.current = THREE.MathUtils.lerp(
      currentDocRadius.current,
      targetDocRadius.current,
      lerpFactor
    );
    currentDocScale.current = THREE.MathUtils.lerp(
      currentDocScale.current,
      targetDocScale.current,
      lerpFactor
    );
    currentReceiptScale.current = THREE.MathUtils.lerp(
      currentReceiptScale.current,
      targetReceiptScale.current,
      lerpFactor
    );

    // Rotate vault slightly unless reducedMotion
    if (vaultGroupRef.current && !reducedMotion) {
      if (state === "failed") {
        // Vault shakes on failure to signal "nothing was sent"
        vaultGroupRef.current.position.x = (Math.random() - 0.5) * 0.08;
        vaultGroupRef.current.position.y = (Math.random() - 0.5) * 0.08;
      } else {
        vaultGroupRef.current.position.set(0, 0, 0);
        vaultGroupRef.current.rotation.y += delta * 0.25;
      }
    }

    // Core pulsing
    if (coreRef.current && !reducedMotion) {
      const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.12;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }

    // Orbiting documents
    if (documentsGroupRef.current && !reducedMotion) {
      documentsGroupRef.current.rotation.y +=
        state === "encrypting" ? delta * 0.8 : delta * 0.25;
    }

    // Update document mesh positions
    if (documentsGroupRef.current) {
      documentsGroupRef.current.children.forEach((child, index) => {
        const angle = docAngles[index];
        const r = currentDocRadius.current;
        child.position.x = Math.cos(angle) * r;
        child.position.z = Math.sin(angle) * r;
        const s = currentDocScale.current;
        child.scale.set(s, s, s);
      });
    }

    // Scan ring during verification
    if (scanRingRef.current) {
      if (state === "verifying") {
        scanRingRef.current.visible = true;
        if (!reducedMotion) {
          scanY.current += delta * 2.2 * scanDir.current;
          if (scanY.current > 1.4) scanDir.current = -1;
          if (scanY.current < -1.4) scanDir.current = 1;
          scanRingRef.current.position.y = scanY.current;
        }
      } else {
        scanRingRef.current.visible = false;
      }
    }

    // Receipt block scale & rise
    if (receiptBoxRef.current) {
      const s = currentReceiptScale.current;
      receiptBoxRef.current.scale.set(s, s, s);
      receiptBoxRef.current.position.y = 1.9 + s * 0.6;
      if (!reducedMotion && s > 0.01) {
        receiptBoxRef.current.rotation.y += delta * 1.2;
      }
    }

    // Pulse traveling along lines
    if (!reducedMotion) {
      const t = (Date.now() * 0.002) % 1;
      if (pulseLeftRef.current) {
        // Participant at -4.5, vault edge at -1.1
        pulseLeftRef.current.position.x = -4.5 + t * 3.4;
      }
      if (pulseRightRef.current) {
        pulseRightRef.current.position.x = 4.5 - t * 3.4;
      }
    }
  });

  const segments = isMobile ? 16 : 32;

  const leftLinePoints = useMemo(() => [new THREE.Vector3(-4.5, 0, 0), new THREE.Vector3(-1.1, 0, 0)], []);
  const rightLinePoints = useMemo(() => [new THREE.Vector3(4.5, 0, 0), new THREE.Vector3(1.1, 0, 0)], []);

  const leftLineObj = useMemo(
    () =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(leftLinePoints),
        new THREE.LineBasicMaterial({
          color:
            state === "failed"
              ? colors.lineFailed
              : state === "anchored"
              ? colors.lineActive
              : state === "verifying"
              ? colors.lineVerifying
              : colors.lineMuted,
        })
      ),
    [leftLinePoints, state, colors]
  );

  const rightLineObj = useMemo(
    () =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(rightLinePoints),
        new THREE.LineBasicMaterial({
          color:
            state === "failed"
              ? colors.lineFailed
              : state === "anchored"
              ? colors.lineActive
              : state === "verifying"
              ? colors.lineVerifying
              : colors.lineMuted,
        })
      ),
    [rightLinePoints, state, colors]
  );

  return (
    <group>
      {/* Central Vault Cube */}
      <group ref={vaultGroupRef}>
        {/* Solid inner cube */}
        <mesh material={vaultMaterial}>
          <boxGeometry args={[2.2, 2.2, 2.2]} />
        </mesh>
        {/* Wireframe outer boundary */}
        <mesh material={wireframeMaterial}>
          <boxGeometry args={[2.24, 2.24, 2.24]} />
        </mesh>
        {/* Glowing core icosahedron */}
        <mesh ref={coreRef} material={coreMaterial}>
          <icosahedronGeometry args={[0.55, 1]} />
        </mesh>
      </group>

      {/* Orbiting Documents (7 sheets) */}
      <group ref={documentsGroupRef}>
        {docAngles.map((_, i) => (
          <mesh key={i} material={docMaterial} rotation={[0, -docAngles[i] + Math.PI / 2, 0]}>
            <boxGeometry args={[0.95, 1.25, 0.06]} />
          </mesh>
        ))}
      </group>

      {/* Outer Ring Torus */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.8, 0.02, 8, segments]} />
        <meshBasicMaterial
          color={
            state === "failed"
              ? colors.lineFailed
              : state === "anchored"
              ? colors.coreAnchored
              : colors.lineMuted
          }
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Verification Scan Ring */}
      <mesh ref={scanRingRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[2.5, 0.045, 8, segments]} />
        <meshStandardMaterial
          color={colors.coreVerifying}
          emissive={colors.coreVerifying}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Anchored Receipt Box */}
      <mesh ref={receiptBoxRef} material={receiptMaterial} position={[0, 2.5, 0]} scale={0}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
      </mesh>

      {/* Left Participant (Founder / Wallet) */}
      <group position={[-4.5, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.42, segments, segments]} />
          <meshStandardMaterial color={new THREE.Color("#3E63D9")} roughness={0.3} />
        </mesh>
      </group>

      {/* Left Connection Line */}
      <primitive object={leftLineObj} />

      {/* Left Traveling Pulse */}
      {(state === "encrypting" || state === "verifying") && !reducedMotion && (
        <mesh ref={pulseLeftRef} position={[-4.5, 0, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial
            color={state === "verifying" ? colors.coreVerifying : colors.lineActive}
          />
        </mesh>
      )}

      {/* Right Participant (Investor / Verifier) */}
      <group position={[4.5, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.42, segments, segments]} />
          <meshStandardMaterial color={new THREE.Color("#3E63D9")} roughness={0.3} />
        </mesh>
      </group>

      {/* Right Connection Line */}
      <primitive object={rightLineObj} />

      {/* Right Traveling Pulse */}
      {(state === "encrypting" || state === "verifying") && !reducedMotion && (
        <mesh ref={pulseRightRef} position={[4.5, 0, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial
            color={state === "verifying" ? colors.coreVerifying : colors.lineActive}
          />
        </mesh>
      )}
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

    // Pause rendering when tab is hidden or canvas is scrolled offscreen
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

    return () => {
      motionQuery.removeEventListener("change", motionHandler);
      window.removeEventListener("resize", checkMobile);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  const sizeClasses = {
    hero: "w-full h-[420px] sm:h-[500px]",
    mini: "w-24 h-24",
    inline: "w-16 h-16",
  };

  const cameraDistance = isMobile ? 10.2 : size === "mini" ? 8.5 : size === "inline" ? 8.5 : 7.6;

  const stateDescriptions: Record<VaultState, string> = {
    idle: "Vault in steady state. Documents secured.",
    encrypting: "Documents pulling inward and encrypting in browser with AES-256-GCM.",
    verifying: "Scanning Intel TDX hardware attestation and nonce freshness.",
    anchored: "Audit receipt anchored to NEAR Testnet block.",
    failed: "Verification failed. Fail-closed engaged — no confidential context sent.",
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${sizeClasses[size]} ${className}`}
      role="region"
      aria-label={`Interactive 3D vault: ${stateDescriptions[state]}`}
    >
      {isVisible && (
        <Canvas
          camera={{ position: [0, 1.8, cameraDistance], fov: 45 }}
          dpr={[1, 2]}
          gl={{
            powerPreference: "high-performance",
            antialias: !isMobile,
            alpha: true,
          }}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <directionalLight position={[-5, -4, -5]} intensity={0.4} />

          <VaultModel
            state={state}
            reducedMotion={reducedMotion}
            isMobile={isMobile}
          />

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            autoRotate={!reducedMotion && state === "idle"}
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 1.7}
            minPolarAngle={Math.PI / 3.2}
          />
        </Canvas>
      )}

      {/* Screen-reader status announcement */}
      <span className="sr-only" aria-live="polite">
        Vault status: {stateDescriptions[state]}
      </span>
    </div>
  );
}
