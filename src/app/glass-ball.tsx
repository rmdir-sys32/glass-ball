"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import * as THREE from "three";

function makeRibbon(widthScale: number, depth: number, phase: number, height: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  const segments = 64;
  const across = 16;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = Math.PI * t;
    const x = -0.78 + 1.56 * t;
    const y = height + 0.08 * Math.sin(2 * angle + phase) + 0.08 * (t - 0.5);
    const dx = 1.56;
    const dy = 0.16 * Math.PI * Math.cos(2 * angle + phase) + 0.08;
    const length = Math.hypot(dx, dy);
    const width = 0.21 * widthScale * Math.pow(Math.sin(angle), 0.75);
    for (let j = 0; j <= across; j++) {
      const u = 2 * j / across - 1;
      positions.push(
        x - dy / length * width * u,
        y + dx / length * width * u,
        depth + 0.11 * Math.sin(angle) * u * u + 0.08 * Math.sin(2 * angle + phase) * u
      );
      if (i < segments && j < across) {
        const a = i * (across + 1) + j;
        indices.push(a, a + 1, a + across + 1, a + 1, a + across + 2, a + across + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export type GlassBallProps = {
  /** Colour of the suspended swirl; the glass stays clear. */
  color?: string;
  /** Optional override for the first swirl ribbon. */
  coreColor?: string;
  /** World units per second. Use a negative value to roll left. */
  initialVelocityX?: number;
  /** World units per second squared. */
  gravity?: number;
  /** Continuously orbit and rotate the marble to inspect it from every side. */
  shaking?: boolean;
  backgroundScene?: "studio" | "charcoal" | "warm";
  className?: string;
  style?: CSSProperties;
};

export default function GlassBall({
  color = "#ad642a",
  coreColor = color,
  initialVelocityX = 1.8,
  gravity = 8.5,
  shaking = false,
  backgroundScene = "studio",
  className,
  style,
}: GlassBallProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;

    const scene = new THREE.Scene();
    const scenes = {
      studio: { top: "#dfe0dc", bottom: "#aeb5b6", panel: "#eef0eb", dark: "#8f9c9f", mid: "#c2c9c9", env: "#b9c0c0" },
      charcoal: { top: "#54595b", bottom: "#232729", panel: "#f1f0e9", dark: "#161a1b", mid: "#858c8d", env: "#454b4d" },
      warm: { top: "#f0e4d0", bottom: "#c4ad8d", panel: "#fff8e9", dark: "#76644e", mid: "#dec9a9", env: "#cbb99f" },
    } as const;
    const palette = scenes[backgroundScene];
    scene.background = new THREE.Color(palette.bottom);
    const camera = new THREE.OrthographicCamera(-3, 3, 2.9, -2.9, 0.1, 30);
    camera.position.set(0, 0.15, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
    element.appendChild(renderer.domElement);

    // Studio panels behind the marble provide visible lines for the glass to refract.
    const backdropCanvas = document.createElement("canvas");
    backdropCanvas.width = backdropCanvas.height = 1024;
    const backdropContext = backdropCanvas.getContext("2d");
    if (backdropContext) {
      const wall = backdropContext.createLinearGradient(0, 0, 0, 1024);
      wall.addColorStop(0, palette.top);
      wall.addColorStop(1, palette.bottom);
      backdropContext.fillStyle = wall;
      backdropContext.fillRect(0, 0, 1024, 1024);
      backdropContext.fillStyle = palette.panel;
      backdropContext.fillRect(100, 0, 150, 1024);
      backdropContext.fillStyle = palette.dark;
      backdropContext.fillRect(720, 0, 70, 1024);
      backdropContext.fillStyle = palette.mid;
      backdropContext.fillRect(790, 0, 72, 1024);
    }
    const backdropTexture = new THREE.CanvasTexture(backdropCanvas);
    backdropTexture.colorSpace = THREE.SRGBColorSpace;
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 8),
      new THREE.MeshBasicMaterial({ map: backdropTexture, toneMapped: false })
    );
    backdrop.position.z = -3;
    scene.add(backdrop);

    const reflectionCanvas = document.createElement("canvas");
    reflectionCanvas.width = 1024;
    reflectionCanvas.height = 512;
    const reflectionContext = reflectionCanvas.getContext("2d");
    if (reflectionContext) {
      reflectionContext.fillStyle = palette.env;
      reflectionContext.fillRect(0, 0, 1024, 512);
      reflectionContext.fillStyle = palette.panel;
      reflectionContext.fillRect(100, 60, 105, 290);
      reflectionContext.fillRect(630, 45, 145, 300);
      reflectionContext.fillStyle = palette.mid;
      reflectionContext.fillRect(785, 80, 55, 260);
    }
    const reflectionTexture = new THREE.CanvasTexture(reflectionCanvas);
    reflectionTexture.mapping = THREE.EquirectangularReflectionMapping;
    reflectionTexture.colorSpace = THREE.SRGBColorSpace;
    scene.environment = reflectionTexture;

    scene.add(new THREE.AmbientLight("#eadac4", 1.25));
    const key = new THREE.DirectionalLight("#fff1d5", 4.5);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const edgeLight = new THREE.DirectionalLight("#ff8f3d", 3);
    edgeLight.position.set(3, 2, -4);
    scene.add(edgeLight);

    const marble = new THREE.Group();
    scene.add(marble);
    const sphere = new THREE.SphereGeometry(1, 96, 64);
    const accent = new THREE.Color(coreColor);
    const secondAccent = accent.clone().offsetHSL(0.12, 0.06, 0.04);

    // Neutral glass keeps the coloured swirl visible through the sphere.
    marble.add(new THREE.Mesh(sphere, new THREE.MeshPhysicalMaterial({
      color: "#d9e0e1", side: THREE.BackSide, transparent: true, opacity: 0.1,
      roughness: 0.12, depthWrite: false,
    })));

    const backRibbon = new THREE.Mesh(makeRibbon(1, -0.16, 0.3, -0.11), new THREE.MeshPhysicalMaterial({
      color: accent, emissive: accent, emissiveIntensity: 0.06,
      roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.14,
      side: THREE.DoubleSide,
    }));
    const frontRibbon = new THREE.Mesh(makeRibbon(0.82, 0.14, 1.8, 0.12), new THREE.MeshPhysicalMaterial({
      color: secondAccent,
      roughness: 0.3, clearcoat: 0.7, side: THREE.DoubleSide,
    }));
    frontRibbon.rotation.y = -0.14;
    marble.add(backRibbon, frontRibbon);

    const clearGlass = new THREE.Mesh(sphere, new THREE.MeshPhysicalMaterial({
      color: "#ffffff", transmission: 1, thickness: 0.85, ior: 1.48,
      attenuationColor: new THREE.Color("#ffffff"), attenuationDistance: 10,
      roughness: 0.025, metalness: 0, clearcoat: 1,
      clearcoatRoughness: 0.02, side: THREE.FrontSide,
      envMapIntensity: 0.65,
    }));
    clearGlass.renderOrder = 1;
    marble.add(clearGlass);

    // A silver rim and soft reflected panel make the shell read as thick clear glass.
    const glass = new THREE.Mesh(sphere, new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `varying vec3 vNormal;
        void main() {
          vec3 n = normalize(vNormal);
          float edge = pow(1.0 - abs(n.z), 2.3);
          float softbox = pow(max(dot(n, normalize(vec3(-0.46, 0.68, 0.85))), 0.0), 38.0);
          vec3 glassColor = mix(vec3(0.3, 0.34, 0.36), vec3(1.0), softbox * 0.9);
          gl_FragColor = vec4(glassColor, 0.01 + edge * 0.42 + softbox * 0.16);
        }`,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    }));
    glass.renderOrder = 2;
    marble.add(glass);

    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 128;
    const context = shadowCanvas.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(64, 64, 3, 64, 64, 64);
      gradient.addColorStop(0, "rgba(0,0,0,.58)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.65), shadowMaterial);
    shadow.position.set(0, -2.47, -0.5);
    scene.add(shadow);

    const floorY = -1.38;
    const state = { x: -1.15, y: 1.1, vx: initialVelocityX, vy: 0 };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) Object.assign(state, { x: 0, y: floorY, vx: 0 });
    let halfWidth = 3;
    const resize = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (!width || !height) return;
      halfWidth = Math.max(1.1, 2.9 * width / height);
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      state.x = THREE.MathUtils.clamp(state.x, -halfWidth + 1, halfWidth - 1);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    let frame = 0;
    let previous = performance.now();
    let elapsed = 0;
    const animate = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.033);
      previous = now;
      if (shaking && !reducedMotion) {
        elapsed += dt;
        state.x = Math.sin(elapsed * 1.25) * Math.min(1.25, halfWidth - 1);
        state.y = 0.05 + Math.sin(elapsed * 2.15) * 0.48;
        marble.rotation.x += dt * 0.8;
        marble.rotation.y += dt * 1.15;
        marble.rotation.z += dt * 0.65;
      } else if (!reducedMotion) {
        state.vy -= gravity * dt;
        state.y += state.vy * dt;
        if (state.y < floorY) {
          state.y = floorY;
          state.vy = Math.abs(state.vy) > 0.3 ? -state.vy * 0.42 : 0;
          state.vx *= Math.max(0, 1 - 0.65 * dt);
        }
        state.x += state.vx * dt;
        const edge = halfWidth - 1;
        if (Math.abs(state.x) > edge) {
          state.x = Math.sign(state.x) * edge;
          state.vx *= -0.72;
        }
        marble.rotation.z -= state.vx * dt;
      }
      marble.position.set(state.x, state.y, 0);
      shadow.position.x = state.x;
      shadowMaterial.opacity = THREE.MathUtils.clamp(1 - (state.y - floorY) * 0.26, 0.3, 1);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      shadowTexture.dispose();
      backdropTexture.dispose();
      reflectionTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [color, coreColor, initialVelocityX, gravity, shaking, backgroundScene]);

  return <div ref={host} className={className} style={{ width: "100%", height: 520, overflow: "hidden", ...style }} role="img" aria-label="Rolling glass marble with a suspended golden core" />;
}
