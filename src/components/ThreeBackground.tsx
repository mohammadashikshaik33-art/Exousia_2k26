"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform vec2 u_mouse_dir;
  uniform float u_mouse_speed;
  uniform float u_scroll;
  uniform float u_reduced_motion;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), 
                   hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), 
                   hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  float fbm_3(in vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    int octaves = u_reduced_motion > 0.5 ? 2 : 3;
    for (int i = 0; i < 3; i++) {
      if (i >= octaves) break;
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  float warpedNoise(in vec2 p, out vec2 q, out vec2 r, mat2 rot) {
    // Layer 1: Simple noise drift
    q.x = noise(p + vec2(u_time * 0.012, u_time * 0.006));
    q.y = noise(rot * p - vec2(u_time * 0.008, -u_time * 0.012));
    
    // Layer 2: 3-octave FBM displacement
    r.x = fbm_3(p + 2.0 * q + vec2(1.7, 9.2) + vec2(u_time * 0.008, -u_time * 0.008));
    r.y = fbm_3(p + 2.0 * q + vec2(8.3, 2.8) - vec2(u_time * 0.004, u_time * 0.006));
    
    // Final sample
    return fbm_3(p + 2.0 * r);
  }

  void main() {
    vec2 uv = vUv;
    
    // Mouse displacement calculations
    vec2 toMouse = uv - u_mouse;
    float dist = length(toMouse);
    
    // Mouse influence field radius (larger when moving fast)
    float radius = 0.16 + u_mouse_speed * 0.18;
    float influence = smoothstep(radius, 0.0, dist);
    
    // Radial push away from the cursor center
    vec2 radialPush = normalize(toMouse + vec2(0.0001)) * influence;
    
    // Directional drag in the direction of mouse movement (wind tunnel displacement)
    vec2 dirDrag = u_mouse_dir * u_mouse_speed * influence;
    
    // Combined displacement force: radial deflection + velocity drag trail
    vec2 uvOffset = (radialPush * 0.65 + dirDrag * 0.35) * influence * 0.08;
    vec2 displacedUv = uv - uvOffset;

    // Domain Warped Volumetric Noise
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    vec2 p = displacedUv * vec2(2.8, 1.8);
    // Add primary drift & scroll parallax
    p.x += u_time * 0.012;
    p.y -= u_time * 0.008;
    p.y += u_scroll * 0.35;

    vec2 q = vec2(0.0);
    vec2 r = vec2(0.0);
    float d = warpedNoise(p, q, r, rot);

    // EXAGGERATED DEBUG COLOR DEFINITIONS - Highly visible for validation
    vec3 baseColor = vec3(0.05, 0.05, 0.05); // Noticeably visible grey-black void base
    vec3 ashColor = vec3(0.55, 0.55, 0.60);  // Very bright ash grey/white smoke clouds!
    vec3 maroonColor = vec3(0.65, 0.10, 0.10); // Very visible red/maroon volumes!
    vec3 crimsonColor = vec3(0.95, 0.15, 0.15); // Vivid crimson red clouds!
    vec3 highlightColor = vec3(1.0, 0.40, 0.30); // Bright glowing orange-red peaks!

    // Build the volumetric color layers
    vec3 color = baseColor;
    
    // Mix ash grey based on base density
    color = mix(color, ashColor, d * 0.75);
    
    // Mix deep maroon in regions of high primary warping
    color = mix(color, maroonColor, length(q) * 0.55);
    
    // Mix illuminated crimson in regions of secondary feedback warping
    float crimsonStrength = clamp(d * length(r) * 0.8, 0.0, 1.0);
    color = mix(color, crimsonColor, crimsonStrength * 0.6);
    
    // Restrained highlight peaks (burning embers feel)
    if (u_reduced_motion < 0.5) {
      float hiStrength = pow(d, 3.0) * 0.35;
      color = mix(color, highlightColor, hiStrength);
    }

    // High-contrast deep shadows / border vignette
    float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
    vignette = clamp(pow(16.0 * vignette, 0.45), 0.0, 1.0);
    color *= vignette;

    gl_FragColor = vec4(color, 0.95);
  }
`;

function SmokePlane({ reducedMotion }: { reducedMotion: boolean }) {
  const shaderMatRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(800, 600) },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_mouse_dir: { value: new THREE.Vector2(0, 0) },
    u_mouse_speed: { value: 0 },
    u_scroll: { value: 0 },
    u_reduced_motion: { value: 0 },
  }), []);

  useFrame((threeState, delta) => {
    const clockTime = threeState.clock.getElapsedTime();
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;

    const mat = shaderMatRef.current;
    if (mat) {
      mat.uniforms.u_time.value = clockTime;
      mat.uniforms.u_resolution.value.set(threeState.size.width, threeState.size.height);
      mat.uniforms.u_reduced_motion.value = reducedMotion ? 1.0 : 0.0;
      mat.uniforms.u_scroll.value = scrollY * 0.0005;

      const targetMouseX = (threeState.pointer.x + 1.0) * 0.5;
      const targetMouseY = (threeState.pointer.y + 1.0) * 0.5;
      
      const currentMouse = mat.uniforms.u_mouse.value;
      currentMouse.x = THREE.MathUtils.lerp(currentMouse.x, targetMouseX, delta * 3.0);
      currentMouse.y = THREE.MathUtils.lerp(currentMouse.y, targetMouseY, delta * 3.0);

      const rawDx = targetMouseX - currentMouse.x;
      const rawDy = targetMouseY - currentMouse.y;
      const rawSpeed = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

      let targetSpeed = rawSpeed * 4.0;
      if (targetSpeed > 1.0) targetSpeed = 1.0;

      const prevSpeed = mat.uniforms.u_mouse_speed.value;
      mat.uniforms.u_mouse_speed.value = THREE.MathUtils.lerp(prevSpeed, targetSpeed, delta * 4.0);

      const currentDir = mat.uniforms.u_mouse_dir.value;
      if (rawSpeed > 0.001) {
        const targetDirX = rawDx / rawSpeed;
        const targetDirY = rawDy / rawSpeed;
        currentDir.x = THREE.MathUtils.lerp(currentDir.x, targetDirX, delta * 3.0);
        currentDir.y = THREE.MathUtils.lerp(currentDir.y, targetDirY, delta * 3.0);
      } else {
        currentDir.x = THREE.MathUtils.lerp(currentDir.x, 0.0, delta * 2.0);
        currentDir.y = THREE.MathUtils.lerp(currentDir.y, 0.0, delta * 2.0);
      }
    }
  });

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[30, 20]} />
      <shaderMaterial
        ref={shaderMatRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        transparent
      />
    </mesh>
  );
}

export default function ThreeBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    const timer = setTimeout(() => {
      setShouldRender(true);
      setReducedMotion(motionQuery.matches);
    }, 0);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener("change", handler);
    return () => {
      clearTimeout(timer);
      motionQuery.removeEventListener("change", handler);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 select-none overflow-hidden bg-[#0e0e0e]">
      <Canvas
        camera={{ position: [0, 0, 5.0], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <SmokePlane reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
