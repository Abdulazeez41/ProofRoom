"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { VaultState } from "@/hooks/useVaultState";

export interface VaultCanvasProps {
  state: VaultState;
  size?: "hero" | "mini" | "inline";
  className?: string;
  hudHeight?: number;
}

export default function VaultCanvas({
  state = "idle",
  className = "",
}: VaultCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<string>("idle");

  // Synchronize incoming real/preview state to prototype state key
  useEffect(() => {
    if (state === "encrypting") stateRef.current = "encrypt";
    else if (state === "verifying") stateRef.current = "verify";
    else if (state === "anchored") stateRef.current = "anchor";
    else if (state === "failed") stateRef.current = "fail";
    else stateRef.current = "idle";
  }, [state]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const st = cv.parentElement;
    if (!st) return;

    let animId: number;
    const reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;

    // Renderer matching prototype exactly
    const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Scene & Camera
    const sc = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    cam.position.set(0, 1.2, 11);

    // Lights
    sc.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(4, 6, 5);
    sc.add(dl);

    // CSS variables sync matching prototype
    function css(v: string) {
      if (typeof window === "undefined") return new THREE.Color("#0F5C47");
      return new THREE.Color(
        getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#0F5C47"
      );
    }

    let cMuted = new THREE.Color(0x5e6b63);
    let cAcc = new THREE.Color(0x0f5c47);
    let cInk = new THREE.Color(0x16211c);
    const cBad = new THREE.Color("#B63A3A");
    const cWarn = new THREE.Color("#C98A1A");
    const cOk = new THREE.Color("#0F7A52");
    let cPaper = new THREE.Color("#FFFCF4");

    function sync() {
      setTimeout(() => {
        cAcc = css("--accent");
        cInk = css("--ink");
        cPaper = css("--solid");
        cMuted = css("--muted");
      }, 30);
    }
    sync();

    const darkModeQuery = window.matchMedia("(prefers-color-scheme:dark)");
    const onThemeChange = () => sync();
    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener("change", onThemeChange);
    }

    // Geometries & meshes matching prototype 1:1
    const G = new THREE.Group();
    sc.add(G);

    const vault = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.2, 2.2),
      new THREE.MeshStandardMaterial({
        color: 0x0f5c47,
        roughness: 0.35,
        metalness: 0.25,
        transparent: true,
        opacity: 0.92,
      })
    );
    G.add(vault);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6, 2.6, 2.6)),
      new THREE.LineBasicMaterial({ color: 0x16211c })
    );
    G.add(edges);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55, 1),
      new THREE.MeshStandardMaterial({
        color: 0xf7f1e3,
        emissive: 0xf7f1e3,
        emissiveIntensity: 0.5,
        roughness: 0.4,
      })
    );
    G.add(core);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.7, 0.025, 8, 160),
      new THREE.MeshBasicMaterial({ color: 0x16211c })
    );
    ring.rotation.x = Math.PI / 2;
    G.add(ring);

    const scan = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.05, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0x3e63d9, transparent: true, opacity: 0 })
    );
    scan.rotation.x = Math.PI / 2;
    G.add(scan);

    const docs: THREE.Mesh[] = [];
    const docGeo = new THREE.BoxGeometry(0.95, 1.25, 0.06);
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(
        docGeo,
        new THREE.MeshStandardMaterial({ color: 0xfffcf4, roughness: 0.6 })
      );
      m.userData.a = (i / 7) * Math.PI * 2;
      G.add(m);
      docs.push(m);
    }

    const nodes = [-1, 1].map((s) => {
      const n = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0x3e63d9, roughness: 0.4 })
      );
      n.position.set(s * 5.2, 0.4, 0);
      G.add(n);
      return n;
    });

    const lines = nodes.map((n) => {
      const g = new THREE.BufferGeometry().setFromPoints([
        n.position.clone(),
        new THREE.Vector3(0, 0, 0),
      ]);
      const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x5e6b63 }));
      G.add(l);
      return l;
    });

    const pulses = [0, 1, 2, 3].map(() => {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x3e63d9 })
      );
      p.visible = false;
      G.add(p);
      return p;
    });

    const block = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.55, 1),
      new THREE.MeshStandardMaterial({ color: 0xc98a1a, roughness: 0.35, metalness: 0.3 })
    );
    block.position.set(0, 3.2, 0);
    block.scale.setScalar(0.001);
    G.add(block);

    const st8 = { rad: 4.2, lock: 0, scan: 0, blk: 0, shake: 0 };

    // Interaction exactly matching prototype
    let drag = false;
    let px = 0;
    let rot = 0;
    let vel = 0;

    const onPointerDown = (e: PointerEvent) => {
      drag = true;
      px = e.clientX;
    };
    const onPointerUp = () => {
      drag = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (drag) {
        const d = e.clientX - px;
        px = e.clientX;
        rot += d * 0.01;
        vel = d * 0.01;
      }
    };

    cv.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);

    // Responsive sizing exactly matching prototype
    function size() {
      if (!st) return;
      const w = st.clientWidth;
      const h = st.clientHeight;
      R.setSize(w, h, false);
      cam.aspect = w / h;
      cam.position.z = w < 600 ? 15 : 11;
      cam.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(() => size());
    resizeObserver.observe(st);
    window.addEventListener("resize", size);
    size();

    function L(a: number, b: number, k: number) {
      return a + (b - a) * k;
    }

    const clock = new THREE.Clock();

    // Exact animation frame loop from prototype
    function frame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const k = 1 - Math.pow(0.001, dt);

      const cur = stateRef.current;
      let tgtRad = 4.2;
      let tgtLock = 0;
      let tgtScan = 0;
      let tgtBlk = 0;
      let shake = 0;
      let line = cMuted || new THREE.Color(0x5e6b63);

      if (cur === "encrypt") {
        tgtRad = 1.9;
        tgtLock = 1;
      }
      if (cur === "verify") {
        tgtRad = 3.6;
        tgtScan = 1;
        line = new THREE.Color(0x3e63d9);
      }
      if (cur === "anchor") {
        tgtRad = 3.8;
        tgtBlk = 1;
        line = cOk;
      }
      if (cur === "fail") {
        tgtRad = 5.2;
        shake = 1;
        line = cBad;
      }

      st8.rad = L(st8.rad, tgtRad, k);
      st8.lock = L(st8.lock, tgtLock, k);
      st8.scan = L(st8.scan, tgtScan, k);
      st8.blk = L(st8.blk, tgtBlk, k);
      st8.shake = L(st8.shake, shake, k);

      if (!reduce && !drag) {
        rot += vel;
        vel *= 0.94;
        rot += dt * 0.18;
      }

      G.rotation.y = reduce ? 0.5 : rot;
      G.rotation.x = 0.18;

      vault.material.color.set(
        cur === "fail"
          ? cBad
          : cAcc && cAcc.getHSL({ h: 0, s: 0, l: 0 }).l > 0.5
          ? new THREE.Color(0x0f5c47)
          : new THREE.Color(0x0f5c47)
      );
      vault.position.x = st8.shake * Math.sin(t * 50) * 0.06;

      core.rotation.y = t;
      core.material.emissive.set(
        cur === "fail"
          ? cBad
          : cur === "verify"
          ? new THREE.Color(0x3e63d9)
          : cur === "anchor"
          ? cWarn
          : 0xf7f1e3
      );
      core.scale.setScalar(1 + 0.08 * Math.sin(t * 3));

      edges.material.color.copy(cInk || new THREE.Color(0x16211c));
      ring.material.color.copy(cur === "fail" ? cBad : cInk || new THREE.Color(0x16211c));

      docs.forEach((d, i) => {
        const a = (d.userData.a as number) + t * (reduce ? 0 : 0.35);
        const r = st8.rad;
        d.position.set(
          Math.cos(a) * r,
          Math.sin(t * 0.8 + i) * 0.35 + (i % 2 ? 0.9 : -0.9),
          Math.sin(a) * r
        );
        d.lookAt(0, d.position.y, 0);
        (d.material as THREE.MeshStandardMaterial).color.copy(
          (cPaper || new THREE.Color(0xfffcf4)).clone().lerp(new THREE.Color(0x0f7a52), st8.lock * 0.75)
        );
        d.scale.setScalar(1 - st8.lock * 0.35);
      });

      scan.material.opacity = st8.scan * 0.9;
      scan.position.y = Math.sin(t * 2.2) * 1.5 * st8.scan;

      nodes.forEach((n) => {
        (n.material as THREE.MeshStandardMaterial).color.set(cur === "fail" ? cBad : 0x3e63d9);
      });
      lines.forEach((l) => {
        (l.material as THREE.LineBasicMaterial).color.copy(line);
      });

      pulses.forEach((p, i) => {
        const on = cur === "verify" || cur === "anchor" || cur === "encrypt";
        p.visible = on;
        if (on) {
          const s = i % 2 ? 1 : -1;
          const u = (t * 0.5 + i * 0.25) % 1;
          p.position.set(s * 5.2 * (cur === "encrypt" ? 1 - u : u), 0.4 * (1 - u), 0);
          (p.material as THREE.MeshBasicMaterial).color.set(
            cur === "encrypt" ? 0x0f7a52 : cur === "anchor" ? 0xc98a1a : 0x3e63d9
          );
        }
      });

      block.scale.setScalar(Math.max(0.001, st8.blk));
      block.rotation.y = t * 0.8;
      block.position.y = 3.2 + Math.sin(t * 2) * 0.08;

      R.render(sc, cam);
      animId = requestAnimationFrame(frame);
    }

    frame();

    return () => {
      cancelAnimationFrame(animId);
      cv.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", size);
      resizeObserver.disconnect();
      if (darkModeQuery.removeEventListener) {
        darkModeQuery.removeEventListener("change", onThemeChange);
      }
      R.dispose();
      R.forceContextLoss();
    };
  }, []);

  return (
    <canvas
      id="c"
      ref={canvasRef}
      aria-label="Interactive 3D model of a private room that reacts to encryption, verification and receipt steps"
      role="img"
      className={className}
    />
  );
}
