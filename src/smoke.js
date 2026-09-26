export function initSmoke() {
  const canvas = document.getElementById('smoke-canvas');
  if (!canvas) return;

  // Initialize WebGL context
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    console.warn('WebGL not supported, falling back to 2D context simulation.');
    return fallbackSmoke2D(canvas);
  }

  let animationFrameId = null;

  // Grid coordinates for mouse displacement field
  const gridWidth = 64;
  const gridHeight = 64;
  const numCells = gridWidth * gridHeight;
  
  // Physical vector current grid
  const vxGrid = new Float32Array(numCells);
  const vyGrid = new Float32Array(numCells);
  const dxGrid = new Float32Array(numCells);
  const dyGrid = new Float32Array(numCells);

  // Buffer to upload grid to WebGL texture (RGBA)
  const textureData = new Uint8Array(numCells * 4);

  // Mouse tracking state
  const mouse = {
    x: -1000,
    y: -1000,
    prevX: -1000,
    prevY: -1000,
    speed: 0,
    lastActive: 0
  };

  // Checking prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Vertex Shader source code
  const vsSource = `
    attribute vec2 position;
    varying vec2 v_uv;
    void main() {
      v_uv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  // Fragment Shader source code (GPU domain warped procedural gradient noise smoke)
  const fsSource = `
    precision mediump float;
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform sampler2D u_displacement;
    uniform vec2 u_mouse;
    uniform float u_mouse_speed;

    // Stable float gradient hash by Inigo Quilez
    vec2 hash(vec2 x) {
      const vec2 k = vec2(0.3183099, 0.3678794);
      x = x * k + k.yx;
      return vec2(-1.0) + 2.0 * fract(16.0 * k * fract(x.x * x.y * (x.x + x.y)));
    }

    // Inigo Quilez 2D Gradient Noise
    float noise(in vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)), 
                       dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                  mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), 
                       dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
    }

    // Fractal Brownian Motion (FBM) noise - 5 octaves
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 5; i++) {
        value += amplitude * (noise(p * frequency) * 0.5 + 0.5);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = v_uv;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = uv * vec2(aspect, 1.0) * 1.5;

      // Sample displacement vectors from JS physical grid texture (vortex currents)
      vec4 dispSample = texture2D(u_displacement, uv);
      vec2 disp = (dispSample.xy - 0.5) * 2.0;

      // --- Cursor Local Push Disturbance ---
      vec2 dir = uv - u_mouse;
      float dist = length(dir * vec2(aspect, 1.0));
      
      // Subtle push radius: about 0.16 in UV coordinates (~300px on desktop)
      float pushRadius = 0.16;
      vec2 pushVector = vec2(0.0);
      
      if (dist < pushRadius) {
        float force = 1.0 - dist / pushRadius;
        // Cubic smooth falloff
        force = force * force * (3.0 - 2.0 * force);
        
        // Push coordinates outwards to physically distort smoke away from cursor
        // Scale with cursor speed: faster movement = stronger push
        float pushStrength = force * (0.03 + u_mouse_speed * 0.13);
        if (dist > 0.01) {
          pushVector = normalize(dir * vec2(aspect, 1.0)) * pushStrength;
        }
      }

      // Warp coordinates: combine direct radial push, advected displacement, and slow time drift
      p += pushVector + disp * 0.12;

      // GPU Domain Warping
      vec2 q = vec2(
        fbm(p + vec2(0.0, u_time * 0.012)),
        fbm(p + vec2(u_time * 0.010, u_time * 0.018))
      );

      vec2 r = vec2(
        fbm(p + q * 1.2 + vec2(u_time * 0.008, 0.0)),
        fbm(p + q * 1.0 + vec2(0.0, u_time * 0.012))
      );

      // Evaluate density
      float density = fbm(p + r * 1.4);

      // Smoothstep mapping to make clouds visible in deep black void
      density = smoothstep(0.36, 0.78, density);

      // Controlled cinematic crimson/maroon color palette
      vec3 colorVoid = vec3(0.0078, 0.0078, 0.0078);      // Black Void (#020202)
      vec3 colorMaroon = vec3(0.137, 0.020, 0.031);       // Dark Maroon (#230508)
      vec3 colorCrimson = vec3(0.314, 0.039, 0.071);      // Deep Crimson (#500A12)
      vec3 colorSubtle = vec3(0.549, 0.071, 0.118);       // Subtle Crimson (#8C121E)

      // Blend channels smoothly based on density
      vec3 smokeColor = colorVoid;
      if (density < 0.25) {
        smokeColor = mix(colorVoid, colorMaroon, density / 0.25);
      } else if (density < 0.6) {
        smokeColor = mix(colorMaroon, colorCrimson, (density - 0.25) / 0.35);
      } else {
        smokeColor = mix(colorCrimson, colorSubtle, clamp((density - 0.6) / 0.4, 0.0, 1.0));
      }

      if (density > 0.7) {
        smokeColor += vec3(0.05, 0.008, 0.015) * (density - 0.7);
      }

      float alpha = clamp(density * 0.35, 0.0, 0.5);
      gl_FragColor = vec4(smokeColor, alpha);
    }
  `;

  // Helper to compile shader modules
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    
    if (!compileStatus) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // Compile shaders
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

  if (!vs || !fs) {
    return fallbackSmoke2D(canvas);
  }

  // Link WebGL program
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linkStatus) {
    console.error('Shader linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return fallbackSmoke2D(canvas);
  }

  // Retrieve uniforms and attribute locations
  const positionLocation = gl.getAttribLocation(program, 'position');
  const timeUniform = gl.getUniformLocation(program, 'u_time');
  const resolutionUniform = gl.getUniformLocation(program, 'u_resolution');
  const displacementUniform = gl.getUniformLocation(program, 'u_displacement');
  const mouseUniform = gl.getUniformLocation(program, 'u_mouse');
  const mouseSpeedUniform = gl.getUniformLocation(program, 'u_mouse_speed');

  // Create quad geometry buffer (two triangles)
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0
  ]), gl.STATIC_DRAW);

  // Create WebGL texture for displacement vectors
  const displacementTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, displacementTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Resize handler using devicePixelRatio to keep rendering smooth on Retina/4K
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // Displace grid cells radially away from cursor movement path
  function addForce(px, py, forceX, forceY, radius) {
    const cellW = window.innerWidth / gridWidth;
    const cellH = window.innerHeight / gridHeight;

    const targetCol = px / cellW;
    const targetRow = py / cellH;

    const speed = Math.sqrt(forceX * forceX + forceY * forceY);
    if (speed < 0.001) return;

    for (let r = 0; r < gridHeight; r++) {
      for (let c = 0; c < gridWidth; c++) {
        const idx = r * gridWidth + c;
        const dc = c - targetCol;
        const dr = r - targetRow;
        const dist = Math.sqrt(dc * dc + dr * dr);

        if (dist < radius) {
          const influence = 1.0 - dist / radius;
          let pushX = 0;
          let pushY = 0;
          if (dist > 0.05) {
            pushX = (dc / dist) * speed * 0.45;
            pushY = (dr / dist) * speed * 0.45;
          }
          vxGrid[idx] += (pushX * 0.8 + forceX * 0.2) * influence * 0.8;
        }
      }
    }
  }

  // Phase 4: System Signal Response localized impulse hook
  window.__triggerSignalImpulse = function(px, py) {
    if (prefersReducedMotion) return;
    addForce(px, py, 1.5, 1.5, 9.0);
  };

  // Update physical forces grid and package as RGBA texture
  function updateDisplacement() {
    for (let i = 0; i < numCells; i++) {
      vxGrid[i] *= 0.93;
      vyGrid[i] *= 0.93;
      dxGrid[i] += vxGrid[i];
      dyGrid[i] += vyGrid[i];
      dxGrid[i] *= 0.92;
      dyGrid[i] *= 0.92;

      const sensitivity = 2.0;
      const clampedX = Math.max(-1.0, Math.min(1.0, dxGrid[i] * sensitivity));
      const clampedY = Math.max(-1.0, Math.min(1.0, dyGrid[i] * sensitivity));
      const r = Math.floor((clampedX + 1.0) * 127.5);
      const g = Math.floor((clampedY + 1.0) * 127.5);

      const textureIdx = i * 4;
      textureData[textureIdx] = r;
      textureData[textureIdx + 1] = g;
      textureData[textureIdx + 2] = 0;
      textureData[textureIdx + 3] = 255;
    }
  }

  // WebGL Render loop
  let startTime = Date.now();
  function render() {
    const elapsedSeconds = (Date.now() - startTime) * 0.001;

    // Clear buffer
    gl.clearColor(0.0078, 0.0078, 0.0078, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Update displacement texture grid in JS
    if (!prefersReducedMotion) {
      updateDisplacement();
    }

    // Bind texture unit
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, displacementTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gridWidth, gridHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureData);

    // Bind program and buffers
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    gl.uniform1f(timeUniform, elapsedSeconds);
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
    gl.uniform1i(displacementUniform, 0);

    // Pass normalized mouse coordinates
    const normMouseX = mouse.x / window.innerWidth;
    const normMouseY = 1.0 - (mouse.y / window.innerHeight);
    gl.uniform2f(mouseUniform, normMouseX, normMouseY);

    // Pass normalized mouse speed
    const normSpeed = Math.min(1.0, mouse.speed / 60.0);
    gl.uniform1f(mouseSpeedUniform, normSpeed);

    // Enable WebGL alpha blending so canvas void is 100% transparent
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Decay mouse speed slowly when idle
    if (Date.now() - mouse.lastActive > 100) {
      mouse.speed *= 0.8;
      if (mouse.speed < 0.1) mouse.speed = 0;
    }

    animationFrameId = requestAnimationFrame(render);
  }

  // Mouse coordinate handlers
  function handleMouseMove(e) {
    if (prefersReducedMotion) return;

    const now = Date.now();
    mouse.lastActive = now;
    
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (mouse.prevX > -500) {
      const dx = mouse.x - mouse.prevX;
      const dy = mouse.y - mouse.prevY;
      mouse.speed = Math.sqrt(dx * dx + dy * dy);

      const forceX = (dx / window.innerWidth) * gridWidth * 0.18;
      const forceY = (dy / window.innerHeight) * gridHeight * 0.18;

      addForce(mouse.x, mouse.y, forceX, forceY, 6.5);
    } else {
      mouse.speed = 0;
    }
  }

  function handleMouseLeave() {
    mouse.x = -1000;
    mouse.y = -1000;
    mouse.speed = 0;
  }

  function handleTouchMove(e) {
    if (prefersReducedMotion || !e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }

  // Listeners
  window.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('touchstart', handleTouchMove, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  window.addEventListener('touchend', handleMouseLeave, { passive: true });
  window.addEventListener('resize', resize);

  // Start WebGL
  resize();
  render();

  // Destructor
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseleave', handleMouseLeave);
    window.removeEventListener('touchstart', handleTouchMove);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleMouseLeave);
    window.removeEventListener('resize', resize);
    
    gl.deleteTexture(displacementTexture);
    gl.deleteBuffer(positionBuffer);
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  };
}

// Fallback visual simulation
function fallbackSmoke2D(canvas) {
  const ctx = canvas.getContext('2d');
  let animationFrameId = null;
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  function renderFallback() {
    ctx.fillStyle = '#020202';
    ctx.fillRect(0, 0, w, h);
    
    const grad = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, Math.max(w, h) * 0.5);
    grad.addColorStop(0, 'rgba(80, 10, 18, 0.45)');
    grad.addColorStop(1, 'rgba(2, 2, 2, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w/2, h/2, Math.max(w, h) * 0.5, 0, Math.PI * 2);
    ctx.fill();

    animationFrameId = requestAnimationFrame(renderFallback);
  }
  renderFallback();

  return () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  };
}
