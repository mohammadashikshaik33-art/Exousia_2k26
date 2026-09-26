import QRCode from 'qrcode';
import { initSmoke } from './smoke.js';

const OFFICIAL_EVENTS_DATA = {
  // DAY 1 — MAJOR EVENTS
  'cluedup': {
    id: "cluedup",
    name: "Clue'd Up",
    category: "day1",
    type: "major",
    day: "DAY 1 — SEPTEMBER 30",
    date: "September 30",
    timings: "9:30 AM – 3:00 PM",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "Team (3 members)",
    teamSize: "3 members",
    spotRegistration: "Spot Registration: To Be Confirmed",
    trackValue: "CLUE'D UP",
    image: "/images/event-cluedup-4x3.jpg",
    description: "An interactive team-based treasure hunt and decoding challenge where participants work together to decode clues, locate hidden objects, and complete tasks within a given time limit. Each team consists of three members, with designated roles for decoding, searching, and coordination. The event is conducted across two rooms, where teams must communicate effectively and solve challenges while following specific movement and boundary rules. Points are awarded for successfully identifying the required objects and completing the tasks within the allotted time. This event tests teamwork, communication, observation, quick thinking, problem-solving, and time management skills.",
    rounds: [],
    levels: [],
    coordinators: "Srivani: 9866806433 | Sara: 8125265119",
    coordinatorsHtml: '<a href="tel:9866806433" class="text-primary hover:underline font-bold">Srivani: 9866806433</a> • <a href="tel:8125265119" class="text-primary hover:underline font-bold">Sara: 8125265119</a>',
    poster: "Official Event Photograph (4:3 Landscape) Available"
  },
  'hawkins': {
    id: "hawkins",
    name: "Hawkins Trap",
    category: "day1",
    type: "major",
    day: "DAY 1 — SEPTEMBER 30",
    date: "September 30",
    timings: "9:30 AM – 3:00 PM",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "Team (2 members)",
    teamSize: "2 members",
    spotRegistration: "Spot Registration: To Be Confirmed",
    trackValue: "HAWKINS TRAP",
    image: "/images/event-hawkins-4x3.jpg",
    description: "Hawkins Trap is an exciting team-based challenge that tests participants quick thinking, problem-solving skills, observation, and speed. Teams are given a series of questions and clues through a projected display. Participants must carefully identify the correct answers and respond within the given time limit to earn points. Each correct answer earns 1 point, and the team with the highest score wins. The event consists of multiple questions, with a limited time available for each challenge, making it a fast-paced and engaging competition.",
    rounds: [],
    levels: [],
    coordinators: "Vali: 6303434682 | Sukumar: 8374056450",
    coordinatorsHtml: '<a href="tel:6303434682" class="text-primary hover:underline font-bold">Vali: 6303434682</a> • <a href="tel:8374056450" class="text-primary hover:underline font-bold">Sukumar: 8374056450</a>',
    poster: "Official Event Photograph (4:3 Landscape) Available"
  },

  // DAY 2 — MAJOR EVENTS
  'darkprotocol': {
    id: "darkprotocol",
    name: "Dark Portal",
    category: "day2",
    type: "major",
    day: "DAY 2 — OCTOBER 1",
    date: "October 1",
    timings: "9:00 AM – 1:00 PM",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "Team (4 members)",
    teamSize: "4 members",
    spotRegistration: "Spot Registration: To Be Confirmed",
    trackValue: "DARK PORTAL",
    image: "/images/event-darkprotocol-4x3.jpg",
    description: "A 4-round team challenge: Alphabet Wall decoding, Clock-based challenges, Morse Code translation, and hands-on Circuit component assembly.",
    rounds: [
      { name: "ROUND 1 — ALPHABET WALL", desc: "Participants decode jumbled words and identify the correct answers within the given time. Teams with the lowest performance are eliminated." },
      { name: "ROUND 2 — CLOCK", desc: "Teams solve questions and decode answers while completing the clock-based challenge within the time limit. Answers are checked after the bell, and the lowest-performing teams are eliminated." },
      { name: "ROUND 3 — MORSE CODE", desc: "Participants decode questions presented in Morse code using the provided reference sheet. Teams must find the correct answers within the time limit to avoid elimination." },
      { name: "ROUND 4 — CIRCUIT", desc: "Teams identify and correctly connect the given circuit components to complete the circuit. This round tests basic electrical knowledge, accuracy, speed, and practical skills." }
    ],
    levels: [],
    coordinators: "S. Bhavya: 7842447459 | Javeed: 9505495812",
    coordinatorsHtml: '<a href="tel:7842447459" class="text-primary hover:underline font-bold">S. Bhavya: 7842447459</a> • <a href="tel:9505495812" class="text-primary hover:underline font-bold">Javeed: 9505495812</a>',
    poster: "Official Event Photograph (4:3 Landscape) Available"
  },
  'genova': {
    id: "genova",
    name: "Genova",
    tagline: "Where AI meets imagination",
    category: "day2",
    type: "major",
    day: "DAY 2 — OCTOBER 1",
    date: "October 1",
    timings: "9:00 AM – 1:00 PM",
    venue: "Computer Lab",
    format: "Single Player",
    teamSize: "Single Player",
    spotRegistration: "Spot Registration: NOT ALLOWED",
    trackValue: "GENOVA",
    image: "/images/event-nexora-4x3.jpg",
    description: "Genova is a single-player AI-based creative challenge conducted in the Computer Lab. The event consists of two levels, where participants must showcase their creativity and ability to work with AI tools. In Level 1, participants compete in an AI Image Generation challenge, while Level 2 focuses on AI Video Generation, with the video time considered as part of the challenge. The event provides participants with an opportunity to demonstrate their creativity, imagination, technical skills, and effective use of AI tools.",
    rounds: [],
    levels: [
      { name: "LEVEL 1 — AI IMAGE GENERATION", desc: "Participants compete in an AI Image Generation challenge, demonstrating creativity, imagination, and effective prompt engineering." },
      { name: "LEVEL 2 — AI VIDEO GENERATION", desc: "Focuses on AI Video Generation, with the video generation time considered as part of the challenge." }
    ],
    coordinators: "Ambika: 8019162298 | Lahari: 8688395490",
    coordinatorsHtml: '<a href="tel:8019162298" class="text-primary hover:underline font-bold">Ambika: 8019162298</a> • <a href="tel:8688395490" class="text-primary hover:underline font-bold">Lahari: 86883 95490</a>',
    poster: "Official Event Photograph (4:3 Landscape) Available"
  },
  'nexora': {
    id: "genova",
    name: "Genova",
    tagline: "Where AI meets imagination",
    category: "day2",
    type: "major",
    day: "DAY 2 — OCTOBER 1",
    date: "October 1",
    timings: "9:00 AM – 1:00 PM",
    venue: "Computer Lab",
    format: "Single Player",
    teamSize: "Single Player",
    spotRegistration: "Spot Registration: NOT ALLOWED",
    trackValue: "GENOVA",
    image: "/images/event-nexora-4x3.jpg",
    description: "Genova is a single-player AI-based creative challenge conducted in the Computer Lab. The event consists of two levels, where participants must showcase their creativity and ability to work with AI tools.",
    rounds: [],
    levels: [
      { name: "LEVEL 1 — AI IMAGE GENERATION", desc: "Participants compete in an AI Image Generation challenge." },
      { name: "LEVEL 2 — AI VIDEO GENERATION", desc: "AI Video Generation challenge." }
    ],
    coordinators: "Ambika: 8019162298 | Lahari: 8688395490",
    coordinatorsHtml: '<a href="tel:8019162298" class="text-primary hover:underline font-bold">Ambika: 8019162298</a> • <a href="tel:8688395490" class="text-primary hover:underline font-bold">Lahari: 86883 95490</a>',
    poster: "Official Event Photograph (4:3 Landscape) Available"
  },

  // SPOT EVENTS (Conducted on BOTH Day 1 & Day 2)
  'powerpick': {
    id: "powerpick",
    name: "Power Pick",
    category: "both",
    type: "spot",
    day: "DAY 1 & DAY 2 — SPOT EVENT",
    timings: "Ongoing (Day 1 & Day 2)",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "Individual Challenge",
    teamSize: "Individual / Spot",
    spotRegistration: "On-Spot Desk Registration",
    trackValue: "POWER PICK",
    description: "Quickly identify and pick the correct electrical component. A fun game to test electrical knowledge, concentration, and quick thinking.",
    coordinators: "Spot Event Desk",
    coordinatorsHtml: "<span class='text-primary font-bold'>On-Spot Registration Desk</span>"
  },
  'smartshift': {
    id: "smartshift",
    name: "Smart Shift",
    category: "both",
    type: "spot",
    day: "DAY 1 & DAY 2 — SPOT EVENT",
    timings: "Ongoing (Day 1 & Day 2)",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "2 Players",
    teamSize: "2 Players",
    spotRegistration: "On-Spot Desk Registration",
    trackValue: "SMART SHIFT",
    description: "Two players take turns moving coloured tokens between connected circles to complete the required pattern while blocking the opponent.",
    coordinators: "Spot Event Desk",
    coordinatorsHtml: "<span class='text-primary font-bold'>On-Spot Registration Desk</span>"
  },
  'halepick': {
    id: "halepick",
    name: "Hale Pick",
    category: "both",
    type: "spot",
    day: "DAY 1 & DAY 2 — SPOT EVENT",
    timings: "Ongoing (Day 1 & Day 2)",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "Group / Party Challenge",
    teamSize: "Individual / Group",
    spotRegistration: "On-Spot Desk Registration",
    trackValue: "HALE PICK",
    description: "Players are given a large tray covered with many small, colourful pieces of paper. Each player uses a straw held in their mouth to pick up or move the pieces and complete the challenge. The player must use only the straw, without using their hands. It is mainly a fun party group challenge that tests coordination, concentration, and speed.",
    coordinators: "Spot Event Desk",
    coordinatorsHtml: "<span class='text-primary font-bold'>On-Spot Registration Desk</span>"
  },
  'caprescue': {
    id: "caprescue",
    name: "Cap Rescue",
    category: "both",
    type: "spot",
    day: "DAY 1 & DAY 2 — SPOT EVENT",
    timings: "Ongoing (Day 1 & Day 2)",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "2 Players",
    teamSize: "2 Players",
    spotRegistration: "On-Spot Desk Registration",
    trackValue: "CAP RESCUE",
    description: "Fun two player coordination game. Players use sticks to control a spinning cup and bottle caps of their assigned colour from the box. The player who collects the most caps within the time limit wins.",
    coordinators: "Spot Event Desk",
    coordinatorsHtml: "<span class='text-primary font-bold'>On-Spot Registration Desk</span>"
  },
  'codeuno': {
    id: "codeuno",
    name: "Code UNO",
    category: "both",
    type: "spot",
    day: "DAY 1 & DAY 2 — SPOT EVENT",
    timings: "Ongoing (Day 1 & Day 2)",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "Individual Challenge",
    teamSize: "Individual / Spot",
    spotRegistration: "On-Spot Desk Registration",
    trackValue: "CODE UNO",
    description: "Each player is assigned a unique number code. Within the time limit, players must pick UNO Cards and complete their assigned code. The first player to finish the code correctly wins the game.",
    coordinators: "Spot Event Desk",
    coordinatorsHtml: "<span class='text-primary font-bold'>On-Spot Registration Desk</span>"
  },
  'fliporder': {
    id: "fliporder",
    name: "Flip & Order",
    category: "both",
    type: "spot",
    day: "DAY 1 & DAY 2 — SPOT EVENT",
    timings: "Ongoing (Day 1 & Day 2)",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "Individual Challenge",
    teamSize: "Individual / Spot",
    spotRegistration: "On-Spot Desk Registration",
    trackValue: "FLIP & ORDER",
    description: "Number cards are placed face down in a random order. Players take turns flipping cards and must find the numbers in ascending order within the time limit. The player who completes the sequence correctly in the shortest time wins.",
    coordinators: "Spot Event Desk",
    coordinatorsHtml: "<span class='text-primary font-bold'>On-Spot Registration Desk</span>"
  },
  'tapple': {
    id: "tapple",
    name: "TAPPLE",
    category: "both",
    type: "spot",
    day: "DAY 1 & DAY 2 — SPOT EVENT",
    timings: "Ongoing (Day 1 & Day 2)",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "Spot Challenge",
    teamSize: "Individual / Spot",
    spotRegistration: "On-Spot Desk Registration",
    trackValue: "TAPPLE",
    description: "Fast-paced word association spot event. Press the letter wheel, say a word fitting the category, and pass before the timer runs out!",
    coordinators: "Spot Event Desk",
    coordinatorsHtml: "<span class='text-primary font-bold'>On-Spot Registration Desk</span>"
  },
  'sizzle': {
    id: "sizzle",
    name: "SIZZLE",
    category: "both",
    type: "spot",
    day: "DAY 1 & DAY 2 — SPOT EVENT",
    timings: "Ongoing (Day 1 & Day 2)",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "Spot Challenge",
    teamSize: "Individual / Spot",
    spotRegistration: "On-Spot Desk Registration",
    trackValue: "SIZZLE",
    description: "High-energy reaction and timing spot challenge. Test your speed and precision under pressure!",
    coordinators: "Spot Event Desk",
    coordinatorsHtml: "<span class='text-primary font-bold'>On-Spot Registration Desk</span>"
  },
  'rollit': {
    id: "rollit",
    name: "ROLL IT",
    category: "both",
    type: "spot",
    day: "DAY 1 & DAY 2 — SPOT EVENT",
    timings: "Ongoing (Day 1 & Day 2)",
    venue: "Loyalty – 3 Block (C-Block)",
    format: "Spot Challenge",
    teamSize: "Individual / Spot",
    spotRegistration: "On-Spot Desk Registration",
    trackValue: "ROLL IT",
    description: "Precision rolling skill game. Roll the dice/target sphere with accuracy to score maximum points!",
    coordinators: "Spot Event Desk",
    coordinatorsHtml: "<span class='text-primary font-bold'>On-Spot Registration Desk</span>"
  }
};

const init = () => {
    try {
        initSmoke();
    } catch (err) {
        console.error('Failed to initialize smoke canvas:', err);
    }

    // Stranger Things Cinematic Ident Engine (Full 8.0 Second Timeline)
    const titleContainer = document.getElementById('intro-title');
    const subTitleContainer = document.getElementById('intro-sub-2k26');
    const introContainer = document.getElementById('intro-container');
    const introTapPrompt = document.getElementById('intro-tap-prompt');
    const introTitleContainer = document.getElementById('intro-title-container');
    const introSkipBtn = document.getElementById('intro-skip-btn');
    const mainContent = document.getElementById('main-content');
    const heroTitle = document.getElementById('hero-title-group') || document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const nav = document.getElementById('main-nav');
    const introCanvas = document.getElementById('intro-canvas');

    const textMain = "EXOUSIA";
    const textSub = "2K26";
    const mainLetterSpans = [];
    const subLetterSpans = [];

    // Build letter elements with Stranger Things styling
    if (titleContainer) {
        titleContainer.innerHTML = '';
        for (let i = 0; i < textMain.length; i++) {
            const span = document.createElement('span');
            span.textContent = textMain[i];
            span.className = 'stranger-letter';
            titleContainer.appendChild(span);
            mainLetterSpans.push(span);
        }
    }

    if (subTitleContainer) {
        subTitleContainer.innerHTML = '';
        for (let i = 0; i < textSub.length; i++) {
            const span = document.createElement('span');
            span.textContent = textSub[i];
            span.className = 'stranger-letter sub-letter';
            subTitleContainer.appendChild(span);
            subLetterSpans.push(span);
        }
    }

    // Single Authoritative Audio Engine (HTML5 Audio Asset)
    const introAudio = new Audio();
    introAudio.muted = false;
    introAudio.volume = 1.0;
    introAudio.preload = 'auto';
    introAudio.playsInline = true;

    let selectedSource = '/audio/exousia-intro-final.mp3';
    introAudio.src = selectedSource;

    let audioStarted = false;
    let isIntroExiting = false;
    let visualIntroStarted = false;
    let playPromiseStatus = 'uninitiated';
    let mediaError = null;
    let introTimeouts = [];

    introAudio.addEventListener('error', () => {
        mediaError = introAudio.error ? (introAudio.error.message || `Code ${introAudio.error.code}`) : 'Unknown audio error';
        console.warn('HTML5 Audio Media Error:', mediaError);
    });

    function clearIntroTimeouts() {
        introTimeouts.forEach(t => clearTimeout(t));
        introTimeouts = [];
    }

    function stopIntroAudio() {
        isIntroExiting = true;
        audioStarted = false;
        try {
            introAudio.pause();
            introAudio.currentTime = 0;
        } catch (e) {}
    }

    // --- UPSIDE-DOWN SPORE / ORGANIC ASH ATMOSPHERE ENGINE (Intro VFX) ---
    let animFrameId = null;
    let introLightningIntensity = 0;

    if (introCanvas) {
        const ctx = introCanvas.getContext('2d');
        let width = (introCanvas.width = window.innerWidth);
        let height = (introCanvas.height = window.innerHeight);

        window.addEventListener('resize', () => {
            if (!introCanvas) return;
            width = introCanvas.width = window.innerWidth;
            height = introCanvas.height = window.innerHeight;
        });

        // 3-Tier Depth Particle System: FAR (40%), MID (45%), NEAR (15%)
        const PARTICLE_COUNT = 65;
        const motes = [];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const depthTier = i < 26 ? 'far' : (i < 55 ? 'mid' : 'near');
            const z = depthTier === 'far' ? 0.2 + Math.random() * 0.3 :
                      depthTier === 'mid' ? 0.5 + Math.random() * 0.5 :
                                            1.1 + Math.random() * 0.9;
            
            const shapeType = Math.random() < 0.45 ? 'spore' : (Math.random() < 0.75 ? 'ash' : 'membrane');
            
            // Random polygon vertices for organic ash flakes
            const ashPoints = [];
            const numPoints = 4 + Math.floor(Math.random() * 3);
            for (let p = 0; p < numPoints; p++) {
                const angle = (p / numPoints) * Math.PI * 2;
                const dist = 0.6 + Math.random() * 0.8;
                ashPoints.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
            }

            motes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                z,
                depthTier,
                shapeType,
                ashPoints,
                rx: (1.2 + Math.random() * 2.8) * z,
                ry: (0.6 + Math.random() * 1.6) * z,
                angle: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.012,
                tilt: Math.random() * Math.PI * 2,
                tiltSpeed: 0.005 + Math.random() * 0.015,
                speedY: - (0.12 + Math.random() * 0.38) * z,
                speedX: (Math.random() - 0.5) * 0.25 * z,
                phaseX: Math.random() * Math.PI * 2,
                phaseY: Math.random() * Math.PI * 2,
                baseOpacity: depthTier === 'far' ? 0.15 + Math.random() * 0.2 :
                             depthTier === 'mid' ? 0.30 + Math.random() * 0.35 :
                                                   0.45 + Math.random() * 0.35
            });
        }

        let time = 0;

        function drawCanvas() {
            if (!ctx) return;
            time += 0.016;
            ctx.clearRect(0, 0, width, height);

            // 1. Render subtle volumetric atmospheric background haze
            const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.4, 50, width * 0.5, height * 0.5, Math.max(width, height) * 0.7);
            const flashBoost = introLightningIntensity * 0.18;
            bgGrad.addColorStop(0, `rgba(90, 8, 18, ${0.18 + flashBoost})`);
            bgGrad.addColorStop(0.5, `rgba(45, 4, 10, ${0.12 + flashBoost * 0.5})`);
            bgGrad.addColorStop(1, 'rgba(5, 2, 4, 0.4)');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // 2. Render subtle dark organic tendril silhouettes on frame edges (non-creature dimension boundary)
            ctx.save();
            ctx.fillStyle = `rgba(18, 3, 6, ${0.45 + flashBoost * 0.2})`;
            
            // Top-left tendril silhouette
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(width * 0.15, height * 0.05, width * 0.22, 0);
            ctx.quadraticCurveTo(width * 0.08, height * 0.12, 0, height * 0.18);
            ctx.closePath();
            ctx.fill();

            // Bottom-right tendril silhouette
            ctx.beginPath();
            ctx.moveTo(width, height);
            ctx.quadraticCurveTo(width * 0.82, height * 0.92, width * 0.75, height);
            ctx.quadraticCurveTo(width * 0.90, height * 0.85, width, height * 0.78);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // 3. Sort motes by depth (far first, near last)
            motes.sort((a, b) => a.z - b.z);

            // 4. Render organic airborne motes with 15% richer airflow drift & 3D tumbling
            motes.forEach((m) => {
                // Microscopic turbulence airflow drift (15% richer fluid motion)
                m.phaseX += 0.014;
                m.phaseY += 0.010;
                m.x += m.speedX + Math.sin(m.phaseX * 1.2) * 0.28;
                m.y += m.speedY + Math.cos(m.phaseY * 0.9) * 0.16;

                m.angle += m.rotationSpeed;
                m.tilt += m.tiltSpeed;

                // Wrap boundary seamlessly
                if (m.y < -25) { m.y = height + 25; m.x = Math.random() * width; }
                if (m.x < -25) m.x = width + 25;
                if (m.x > width + 25) m.x = -25;

                // 3D tumble factor: edge-on perspective causes flattening and opacity drop
                const tumbleFactor = Math.max(0.12, Math.abs(Math.cos(m.tilt)));
                const currentOpacity = Math.min(0.92, m.baseOpacity * (0.6 + 0.4 * tumbleFactor) + (introLightningIntensity * (m.depthTier === 'near' ? 0.35 : (m.depthTier === 'mid' ? 0.22 : 0.10))));

                ctx.save();
                ctx.translate(m.x, m.y);
                ctx.rotate(m.angle);
                ctx.scale(1, tumbleFactor);

                const colorGlow = introLightningIntensity > 0.05
                    ? `rgba(255, ${100 + Math.floor(introLightningIntensity * 80)}, ${110 + Math.floor(introLightningIntensity * 60)}, ${currentOpacity})`
                    : (m.depthTier === 'near' 
                        ? `rgba(225, 110, 110, ${currentOpacity})` 
                        : `rgba(185, 75, 80, ${currentOpacity})`);

                ctx.fillStyle = colorGlow;

                if (m.depthTier === 'near') {
                    ctx.shadowColor = `rgba(220, 30, 40, ${0.4 * currentOpacity})`;
                    ctx.shadowBlur = 6 * m.z;
                }

                ctx.beginPath();
                if (m.shapeType === 'spore') {
                    // Seed / oval mote
                    ctx.ellipse(0, 0, m.rx, m.ry, 0, 0, Math.PI * 2);
                } else if (m.shapeType === 'ash') {
                    // Irregular organic ash flake polygon
                    const r = m.rx;
                    m.ashPoints.forEach((pt, idx) => {
                        if (idx === 0) ctx.moveTo(pt.x * r, pt.y * r);
                        else ctx.lineTo(pt.x * r, pt.y * r);
                    });
                    ctx.closePath();
                } else {
                    // Translucent membrane fragment
                    ctx.ellipse(0, 0, m.rx * 1.2, m.ry * 0.7, Math.PI / 4, 0, Math.PI * 2);
                }
                ctx.fill();
                ctx.restore();
            });

            // Decay lightning intensity back to baseline
            if (introLightningIntensity > 0) {
                introLightningIntensity = Math.max(0, introLightningIntensity - 0.035);
            }

            animFrameId = requestAnimationFrame(drawCanvas);
        }

        drawCanvas();
    }

    // Sequence Timeline Orchestration (Total 8.0 Seconds)
    const triggerIntroExit = () => {
        if (!introContainer || introContainer.dataset.exiting) return;
        introContainer.dataset.exiting = 'true';

        clearIntroTimeouts();
        stopIntroAudio();

        if (animFrameId) cancelAnimationFrame(animFrameId);

        introContainer.style.opacity = '0';
        introContainer.style.transform = 'scale(1.05)';
        introContainer.style.pointerEvents = 'none';

        if (mainContent) {
            mainContent.classList.add('main-visible');
        }

        setTimeout(() => {
            if (introContainer) {
                introContainer.style.display = 'none';
            }
            if (typeof onHomepageVisible === 'function') {
                onHomepageVisible();
            }
            if (heroTitle) {
                heroTitle.classList.add('hero-title-settled');
            }
            setTimeout(() => {
                if (heroSubtitle) {
                    heroSubtitle.style.opacity = '1';
                    heroSubtitle.style.transform = 'translateY(0)';
                }
                setTimeout(() => {
                    if (introContainer && introContainer.parentNode) {
                        introContainer.parentNode.removeChild(introContainer);
                    }
                }, 400);
            }, 400);
        }, 400);
    };

    // --- CINEMATIC TITLE REVEAL TIMELINE ---
    function startVisualIntroTimeline() {
        if (visualIntroStarted) return;
        visualIntroStarted = true;

        if (introTapPrompt) {
            introTapPrompt.classList.add('fade-out');
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            triggerIntroExit();
            return;
        }

        // 2.40s: EXOUSIA Reveal begins
        introTimeouts.push(setTimeout(() => {
            mainLetterSpans.forEach((letter, index) => {
                introTimeouts.push(setTimeout(() => {
                    letter.classList.add('revealed');
                }, index * 180));
            });
        }, 2400));

        // 4.20s: 2K26 Subtitle Reveal begins
        introTimeouts.push(setTimeout(() => {
            subLetterSpans.forEach((letter, index) => {
                introTimeouts.push(setTimeout(() => {
                    letter.classList.add('revealed');
                }, index * 160));
            });
        }, 4200));

        // 5.80s: Glow pulse lockup hold
        introTimeouts.push(setTimeout(() => {
            mainLetterSpans.forEach((letter) => letter.classList.add('glow-pulse'));
            subLetterSpans.forEach((letter) => letter.classList.add('glow-pulse'));
        }, 5800));

        // 8.00s: Transition into Homepage
        introTimeouts.push(setTimeout(() => {
            triggerIntroExit();
        }, 8000));
    }

    // --- USER TAP GESTURE HANDLER ---
    async function handleUserTapGesture(e) {
        if (e && e.target && e.target.closest && e.target.closest('#intro-skip-btn')) return;

        if (introTapPrompt) {
            introTapPrompt.classList.add('fade-out');
        }

        if (!audioStarted && !isIntroExiting) {
            try {
                introAudio.muted = false;
                introAudio.volume = 1.0;
                introAudio.currentTime = 0;
                playPromiseStatus = 'pending_user_gesture';

                const playPromise = introAudio.play();
                if (playPromise !== undefined) {
                    await playPromise;
                    playPromiseStatus = 'resolved_success';
                    audioStarted = true;
                    console.log('HTML5 Audio play() started successfully via user gesture.');
                }
            } catch (err) {
                playPromiseStatus = `rejected: ${err.name || 'Error'} - ${err.message || err.toString()}`;
                console.warn('HTML5 Audio play() promise rejected:', err);
            }
        }

        startVisualIntroTimeline();
    }

    // Bind gesture listeners on intro container & tap prompt
    if (introContainer) {
        ['click', 'touchstart'].forEach((evt) => {
            introContainer.addEventListener(evt, handleUserTapGesture, { passive: true });
        });
    }

    if (introTapPrompt) {
        introTapPrompt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleUserTapGesture(e);
            }
        });
    }

    // Immediate page-load autoplay attempt (desktop policy fallback)
    try {
        introAudio.muted = false;
        introAudio.volume = 1.0;
        introAudio.currentTime = 0;
        playPromiseStatus = 'pending_autoplay';
        const initialPlay = introAudio.play();
        if (initialPlay !== undefined) {
            initialPlay.then(() => {
                playPromiseStatus = 'resolved_autoplay_success';
                audioStarted = true;
                console.log('Autoplay succeeded on load.');
                startVisualIntroTimeline();
            }).catch(err => {
                playPromiseStatus = `blocked_autoplay: ${err.name || err.toString()}`;
                console.log('Autoplay blocked on load. Subtle TAP TO ENTER prompt active:', err);
            });
        }
    } catch (e) {
        playPromiseStatus = `exception_autoplay: ${e.message || e.toString()}`;
    }

    // Expose comprehensive diagnostic instrumentation
    window.__exousiaAudioEngine = {
        getState: () => audioStarted ? (introAudio.paused ? 'paused' : 'playing') : 'pending_gesture',
        getAudioElementState: () => ({
            audioStarted,
            visualIntroStarted,
            playPromiseStatus,
            paused: introAudio.paused,
            muted: introAudio.muted,
            volume: introAudio.volume,
            currentTime: introAudio.currentTime.toFixed(2),
            duration: introAudio.duration || 8.0,
            ended: introAudio.ended,
            readyState: introAudio.readyState,
            networkState: introAudio.networkState,
            mediaError: mediaError || (introAudio.error ? introAudio.error.code : null),
            selectedSource,
            visibilityState: document.visibilityState,
            hasFocus: document.hasFocus(),
            src: introAudio.src
        })
    };

    // ==================================================
    // HOMEPAGE BACKGROUND MUSIC ENGINE (ISOLATED FROM INTRO)
    // ==================================================
    const homepageAudio = new Audio();
    homepageAudio.src = '/audio/exousia-homepage-music.mp3';
    homepageAudio.loop = true;
    homepageAudio.preload = 'auto';
    homepageAudio.volume = 0.65;

    let isHomepageMusicPlaying = false;

    function updateHomepageMusicUI(isON) {
        const musicBtnIcon = document.getElementById('music-btn-icon');
        const musicBtn = document.getElementById('homepage-music-btn');
        if (musicBtnIcon) {
            musicBtnIcon.textContent = isON ? 'volume_up' : 'volume_off';
            if (isON) {
                musicBtnIcon.classList.add('text-primary', 'animate-pulse');
            } else {
                musicBtnIcon.classList.remove('text-primary', 'animate-pulse');
            }
        }
        if (musicBtn) {
            musicBtn.setAttribute('aria-label', isON ? 'Pause Homepage Background Music' : 'Play Homepage Background Music');
            musicBtn.setAttribute('title', isON ? 'Pause Homepage Background Music' : 'Play Homepage Background Music');
            if (isON) {
                musicBtn.classList.add('border-primary', 'bg-primary/20');
            } else {
                musicBtn.classList.remove('border-primary', 'bg-primary/20');
            }
        }
    }

    async function playHomepageMusic() {
        if (!homepageAudio.src) return;
        try {
            const playPromise = homepageAudio.play();
            if (playPromise !== undefined) {
                await playPromise;
            }
            isHomepageMusicPlaying = true;
            localStorage.setItem('exousiaHomepageMusicEnabled', 'true');
            updateHomepageMusicUI(true);
        } catch (err) {
            console.warn('Homepage audio play interrupted or blocked by browser policy:', err);
            isHomepageMusicPlaying = false;
            updateHomepageMusicUI(false);
        }
    }

    function pauseHomepageMusic() {
        homepageAudio.pause();
        isHomepageMusicPlaying = false;
        localStorage.setItem('exousiaHomepageMusicEnabled', 'false');
        updateHomepageMusicUI(false);
    }

    function toggleHomepageMusic() {
        if (homepageAudio.paused || !isHomepageMusicPlaying) {
            playHomepageMusic();
        } else {
            pauseHomepageMusic();
        }
    }

    function onHomepageVisible() {
        const userPref = localStorage.getItem('exousiaHomepageMusicEnabled');
        if (userPref === 'true') {
            playHomepageMusic();
        } else {
            updateHomepageMusicUI(false);
        }
    }

    const homepageMusicBtn = document.getElementById('homepage-music-btn');
    if (homepageMusicBtn) {
        homepageMusicBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleHomepageMusic();
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            if (!homepageAudio.paused) {
                homepageAudio.pause();
            }
        } else if (document.visibilityState === 'visible') {
            if (localStorage.getItem('exousiaHomepageMusicEnabled') === 'true' && isHomepageMusicPlaying) {
                homepageAudio.play().catch(() => {});
            }
        }
    });

    // Interactive Listeners: Only SKIP IDENT button and Escape key trigger intro exit
    if (introSkipBtn) {
        introSkipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerIntroExit();
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            triggerIntroExit();
        }
    });
    
    // Navbar scroll & Multi-Depth Environmental Parallax Logic
    const envWallpaper = document.getElementById('env-wallpaper');
    const envCloudsFar = document.querySelector('.env-clouds-far');
    const envCloudsMid = document.querySelector('.env-clouds-mid');
    const envFogFore = document.querySelector('.env-fog-fore');
    const envContainer = document.getElementById('env-container');

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isReducedMotion) {
        window.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) {
                mouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
                mouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
            }
        }, { passive: true });
    }

    const updateParallax = () => {
        if (!isReducedMotion) {
            targetX += (mouseX - targetX) * 0.04;
            targetY += (mouseY - targetY) * 0.04;

            const scrollOffset = Math.min(window.scrollY * 0.04, 30);
            
            // Base Hawkins Wallpaper & Cyclists remain 100% ANCHORED (NO translation)
            if (envCloudsFar) {
                envCloudsFar.style.transform = `translate(${targetX * 8}px, ${targetY * 5 - scrollOffset * 0.25}px)`;
            }
            if (envCloudsMid) {
                envCloudsMid.style.transform = `translate(${targetX * 14}px, ${targetY * 8 - scrollOffset * 0.35}px)`;
            }
            if (envFogFore) {
                envFogFore.style.transform = `translate(${targetX * 20}px, ${targetY * 10 - scrollOffset * 0.5}px)`;
            }
        }

        if (envContainer) {
            const scrollRatio = Math.min(window.scrollY / (window.innerHeight * 1.5), 0.65);
            envContainer.style.filter = `brightness(${1 - scrollRatio * 0.25}) contrast(${1 - scrollRatio * 0.1})`;
        }
    };

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav?.classList.add('nav-scrolled');
        } else {
            nav?.classList.remove('nav-scrolled');
        }
        updateParallax();
    }, { passive: true });

    // Scroll Spy
    const sections = document.querySelectorAll('.section-observe');
    const navLinks = document.querySelectorAll('.nav-links a');

    const updateActiveNavLink = (id) => {
        navLinks.forEach(link => {
            link.classList.remove('nav-active', 'text-primary');
            link.classList.add('text-on-surface');
            const hrefId = link.getAttribute('href').substring(1);
            if (hrefId === id) {
                link.classList.add('nav-active', 'text-primary');
                link.classList.remove('text-on-surface');
            }
        });
    };

    let isProgrammaticScrolling = false;
    let scrollTimeout = null;

    const observer = new IntersectionObserver((entries) => {
        if (isProgrammaticScrolling) return;

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                updateActiveNavLink(id);
            }
        });
    }, {
        root: null,
        rootMargin: '-30% 0px -40% 0px',
        threshold: 0
    });

    sections.forEach(section => {
        if(section.id) observer.observe(section);
    });

    // Scroll Reveal IntersectionObserver (Robust Mobile Fallback: Ensures element becomes visible even if observer is delayed)
    const revealElements = document.querySelectorAll('.reveal-element');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px'
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
        // Mobile Resiliency Fallback: force revealed class after 2 seconds if not already intersected
        setTimeout(() => {
            if (el && !el.classList.contains('revealed')) {
                el.classList.add('revealed');
            }
        }, 2000);
    });

    // System Signal Response Trigger
    const triggerSystemSignal = (targetElement) => {
        if (!targetElement) return;

        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const rect = targetElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        const signalRing = document.createElement('div');
        signalRing.className = 'system-signal-ring';
        signalRing.style.left = `${rect.left + scrollX}px`;
        signalRing.style.top = `${rect.top + scrollY}px`;
        signalRing.style.width = `${rect.width}px`;
        signalRing.style.height = `${rect.height}px`;

        document.body.appendChild(signalRing);

        if (typeof window.__triggerSignalImpulse === 'function' && !isReducedMotion) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            window.__triggerSignalImpulse(centerX, centerY);
        }

        setTimeout(() => {
            if (signalRing && signalRing.parentNode) {
                signalRing.parentNode.removeChild(signalRing);
            }
        }, isReducedMotion ? 160 : 320);
    };

    // Category Selector Logic (Day 1 / Day 2 / All)
    const categoryButtons = document.querySelectorAll('#event-category-selector .event-category-btn');
    const eventCards = document.querySelectorAll('[data-event-card="true"]');

    if (categoryButtons.length > 0 && eventCards.length > 0) {
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                triggerSystemSignal(btn);

                const selectedCategory = btn.getAttribute('data-category');

                categoryButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

                eventCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    if (selectedCategory === 'all' || cardCategory === selectedCategory) {
                        card.classList.remove('event-card-hidden');
                        requestAnimationFrame(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        });
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(8px)';
                        setTimeout(() => {
                            if (card.style.opacity === '0') {
                                card.classList.add('event-card-hidden');
                            }
                        }, 200);
                    }
                });
            });
        });
    }

    // Event Detail Modal Handler
    const eventDetailModal = document.getElementById('event-detail-modal');
    const eventModalCloseBtn = document.getElementById('event-modal-close-btn');
    const modalEventTitle = document.getElementById('modal-event-title');
    const modalEventDay = document.getElementById('modal-event-day');
    const modalEventTimings = document.getElementById('modal-event-timings');
    const modalEventVenue = document.getElementById('modal-event-venue');
    const modalEventFormat = document.getElementById('modal-event-format');
    const modalEventSpot = document.getElementById('modal-event-spot');
    const modalEventDesc = document.getElementById('modal-event-desc');
    const modalEventPoster = document.getElementById('modal-event-poster');
    const modalEventCoordinator = document.getElementById('modal-event-coordinator');
    const modalEventStructureContainer = document.getElementById('modal-event-structure-container');
    const modalStructureTitle = document.getElementById('modal-structure-title');
    const modalEventStructureList = document.getElementById('modal-event-structure-list');
    const modalEventRegisterBtn = document.getElementById('modal-event-register-btn');

    let currentSelectedEventTrack = "CLUE'D UP";

    function openEventDetailModal(eventId) {
        const data = OFFICIAL_EVENTS_DATA[eventId];
        if (!data || !eventDetailModal) return;

        currentSelectedEventTrack = data.trackValue || data.name.toUpperCase();

        if (modalEventTitle) modalEventTitle.textContent = data.name;
        if (modalEventDay) modalEventDay.textContent = data.day;
        if (modalEventTimings) modalEventTimings.textContent = data.timings;
        if (modalEventVenue) modalEventVenue.textContent = data.venue;
        if (modalEventFormat) modalEventFormat.textContent = data.format;
        if (modalEventSpot) modalEventSpot.textContent = data.spotRegistration;
        if (modalEventDesc) modalEventDesc.textContent = data.description;
        if (modalEventPoster) modalEventPoster.textContent = data.poster;
        if (modalEventCoordinator) modalEventCoordinator.innerHTML = data.coordinatorsHtml || data.coordinators;

        // Populate rounds / levels if present
        if (modalEventStructureContainer && modalEventStructureList) {
            modalEventStructureList.innerHTML = '';
            if (data.rounds && data.rounds.length > 0) {
                if (modalStructureTitle) modalStructureTitle.textContent = 'OFFICIAL ROUND STRUCTURE';
                modalEventStructureContainer.classList.remove('hidden');
                data.rounds.forEach(r => {
                    const div = document.createElement('div');
                    div.className = 'p-3 bg-surface-container/60 rounded border border-outline-variant/30';
                    div.innerHTML = `<span class="font-bold text-primary block mb-1">${r.name}</span><p class="text-on-surface-variant text-xs">${r.desc}</p>`;
                    modalEventStructureList.appendChild(div);
                });
            } else if (data.levels && data.levels.length > 0) {
                if (modalStructureTitle) modalStructureTitle.textContent = 'OFFICIAL LEVEL STRUCTURE';
                modalEventStructureContainer.classList.remove('hidden');
                data.levels.forEach(l => {
                    const div = document.createElement('div');
                    div.className = 'p-3 bg-surface-container/60 rounded border border-outline-variant/30';
                    div.innerHTML = `<span class="font-bold text-primary block mb-1">${l.name}</span><p class="text-on-surface-variant text-xs">${l.desc}</p>`;
                    modalEventStructureList.appendChild(div);
                });
            } else {
                modalEventStructureContainer.classList.add('hidden');
            }
        }

        eventDetailModal.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }

    function closeEventDetailModal() {
        if (eventDetailModal) {
            eventDetailModal.classList.remove('modal-open');
            document.body.style.overflow = '';
        }
    }

    if (eventModalCloseBtn) eventModalCloseBtn.addEventListener('click', closeEventDetailModal);
    if (eventDetailModal) {
        eventDetailModal.addEventListener('click', (e) => {
            if (e.target === eventDetailModal) closeEventDetailModal();
        });
    }

    // Bind Event Card Buttons
    const detailButtons = [
        { id: 'event-detail-btn-cluedup', key: 'cluedup' },
        { id: 'event-detail-btn-hawkins', key: 'hawkins' },
        { id: 'event-detail-btn-darkprotocol', key: 'darkprotocol' },
        { id: 'event-detail-btn-genova', key: 'genova' },
        { id: 'event-detail-btn-nexora', key: 'genova' },
        { id: 'event-detail-btn-powerpick', key: 'powerpick' },
        { id: 'event-detail-btn-smartshift', key: 'smartshift' },
        { id: 'event-detail-btn-halepick', key: 'halepick' },
        { id: 'event-detail-btn-caprescue', key: 'caprescue' },
        { id: 'event-detail-btn-codeuno', key: 'codeuno' },
        { id: 'event-detail-btn-fliporder', key: 'fliporder' }
    ];

    detailButtons.forEach(b => {
        const btn = document.getElementById(b.id);
        if (btn) {
            btn.addEventListener('click', () => {
                triggerSystemSignal(btn);
                openEventDetailModal(b.key);
            });
        }
    });

    // Modal Event Register Button
    if (modalEventRegisterBtn) {
        modalEventRegisterBtn.addEventListener('click', () => {
            closeEventDetailModal();
            openRegModal();
            if (typeof selectEventByTrack === 'function' && currentSelectedEventTrack) {
                selectEventByTrack(currentSelectedEventTrack);
            }
        });
    }

    // --- SECTOR 03: THE CONTROL ROOM LOGIC ---
    const controlDay1Btn = document.getElementById('control-day-1-btn');
    const controlDay2Btn = document.getElementById('control-day-2-btn');
    const controlBannerDate = document.getElementById('control-banner-date');
    const controlBannerTimings = document.getElementById('control-banner-timings');
    const controlBannerVenue = document.getElementById('control-banner-venue');
    const controlEventsContainer = document.getElementById('control-events-container');

    const controlBtnPass = document.getElementById('control-btn-pass');
    const controlBtnEvents = document.getElementById('control-btn-events');

    let activeControlDay = 'day1';

    function renderControlRoomDay(dayKey) {
      activeControlDay = dayKey;

      if (dayKey === 'day1') {
        if (controlDay1Btn) {
          controlDay1Btn.className = 'control-day-btn active flex-1 sm:flex-none px-6 py-2.5 font-label-mono text-xs rounded-xl border border-primary/40 bg-primary/10 text-primary font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer';
          controlDay1Btn.setAttribute('aria-selected', 'true');
          const dot = controlDay1Btn.querySelector('.rounded-full');
          if (dot) dot.className = 'w-2 h-2 rounded-full bg-primary inline-block';
        }
        if (controlDay2Btn) {
          controlDay2Btn.className = 'control-day-btn flex-1 sm:flex-none px-6 py-2.5 font-label-mono text-xs rounded-xl border border-outline-variant/40 bg-surface-container/60 text-on-surface-variant font-bold tracking-wider hover:border-primary/40 transition-all flex items-center justify-center gap-2 cursor-pointer';
          controlDay2Btn.setAttribute('aria-selected', 'false');
          const dot = controlDay2Btn.querySelector('.rounded-full');
          if (dot) dot.className = 'w-2 h-2 rounded-full bg-on-surface-variant/40 inline-block';
        }

        if (controlBannerDate) controlBannerDate.textContent = 'SEPTEMBER 30';
        if (controlBannerTimings) controlBannerTimings.textContent = '09:30 AM — 03:00 PM';
        if (controlBannerVenue) controlBannerVenue.textContent = 'LOYALTY — 3 BLOCK (C-BLOCK)';

        renderControlEvents(['cluedup', 'hawkins', 'powerpick', 'smartshift', 'halepick', 'caprescue', 'codeuno', 'fliporder']);
      } else {
        if (controlDay2Btn) {
          controlDay2Btn.className = 'control-day-btn active flex-1 sm:flex-none px-6 py-2.5 font-label-mono text-xs rounded-xl border border-primary/40 bg-primary/10 text-primary font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer';
          controlDay2Btn.setAttribute('aria-selected', 'true');
          const dot = controlDay2Btn.querySelector('.rounded-full');
          if (dot) dot.className = 'w-2 h-2 rounded-full bg-primary inline-block';
        }
        if (controlDay1Btn) {
          controlDay1Btn.className = 'control-day-btn flex-1 sm:flex-none px-6 py-2.5 font-label-mono text-xs rounded-xl border border-outline-variant/40 bg-surface-container/60 text-on-surface-variant font-bold tracking-wider hover:border-primary/40 transition-all flex items-center justify-center gap-2 cursor-pointer';
          controlDay1Btn.setAttribute('aria-selected', 'false');
          const dot = controlDay1Btn.querySelector('.rounded-full');
          if (dot) dot.className = 'w-2 h-2 rounded-full bg-on-surface-variant/40 inline-block';
        }

        if (controlBannerDate) controlBannerDate.textContent = 'OCTOBER 01';
        if (controlBannerTimings) controlBannerTimings.textContent = '09:00 AM — 01:00 PM';
        if (controlBannerVenue) controlBannerVenue.textContent = 'LOYALTY — 3 BLOCK & LAB';

        renderControlEvents(['darkprotocol', 'genova', 'powerpick', 'smartshift', 'halepick', 'caprescue', 'codeuno', 'fliporder']);
      }
    }

    function renderControlEvents(eventKeys) {
      if (!controlEventsContainer) return;
      controlEventsContainer.innerHTML = '';

      eventKeys.forEach(key => {
        const ev = OFFICIAL_EVENTS_DATA[key];
        if (!ev) return;

        const card = document.createElement('div');
        card.className = 'panel-terminal-glass p-6 md:p-8 flex flex-col justify-between group overflow-hidden relative rounded-2xl border border-outline-variant/40 hover:border-primary/50 transition-all duration-300';
        
        let subContent = '';
        if (key === 'darkprotocol' && ev.rounds && ev.rounds.length > 0) {
          subContent = `
            <div class="grid grid-cols-2 gap-2 font-label-mono text-[11px] text-on-surface-variant my-4">
              ${ev.rounds.map(r => `<div class="p-2 bg-surface-container/60 rounded border border-outline-variant/30">${r.name}</div>`).join('')}
            </div>
          `;
        } else if (key === 'genova' && ev.levels && ev.levels.length > 0) {
          subContent = `
            <div class="space-y-2 font-label-mono text-[11px] text-on-surface-variant my-4">
              ${ev.levels.map(l => `<div class="p-2 bg-surface-container/60 rounded border border-outline-variant/30">${l.name}</div>`).join('')}
            </div>
          `;
        }

        let spotBadgeHtml = '';
        if (key === 'genova') {
          spotBadgeHtml = `<span class="badge-tier-s bg-red-950/60 text-red-300 border-red-500/40">🚫 Spot Reg: NOT ALLOWED</span>`;
        } else if (ev.type === 'spot') {
          spotBadgeHtml = `<span class="badge-tier-s bg-primary/10 text-primary border-primary/30"><span class="telemetry-dot"></span> Spot Event</span>`;
        } else {
          spotBadgeHtml = `<span class="badge-tier-s"><span class="telemetry-dot"></span> Spot Registration: To Be Confirmed</span>`;
        }

        const tagsHtml = `
          <div class="flex flex-wrap gap-2 font-label-mono text-[10px] mt-4">
            <span class="px-2.5 py-1 rounded-md bg-surface-container border border-outline-variant/40 text-primary font-bold">${ev.teamSize.toUpperCase()}</span>
            <span class="px-2.5 py-1 rounded-md bg-surface-container border border-outline-variant/40 text-on-surface-variant">${ev.day.split('—')[0].trim()}</span>
            <span class="px-2.5 py-1 rounded-md bg-surface-container border border-outline-variant/40 text-on-surface-variant">${key === 'genova' ? 'COMPUTER LAB' : 'C-BLOCK'}</span>
            ${key === 'genova' ? '<span class="px-2.5 py-1 rounded-md bg-red-950/50 border border-red-500/30 text-red-300 font-bold">SPOT REG NOT ALLOWED</span>' : ''}
          </div>
        `;

        card.innerHTML = `
          <span class="hud-corner hud-corner-tl">+</span>
          <span class="hud-corner hud-corner-tr">+</span>
          <span class="hud-corner hud-corner-bl">+</span>
          <span class="hud-corner hud-corner-br">+</span>
          <div>
            <div class="flex justify-between items-start flex-wrap gap-2 mb-3">
              <span class="font-label-mono text-xs text-primary tracking-widest uppercase font-bold">${ev.day} (${ev.timings})</span>
              ${spotBadgeHtml}
            </div>
            <h3 class="font-headline-lg text-2xl md:text-3xl text-on-surface mb-1">${ev.name}</h3>
            <div class="flex flex-wrap gap-3 font-label-mono text-xs text-on-surface-variant mb-3">
              <span>📍 Venue: ${ev.venue}</span>
              <span>👥 Format: ${ev.format}</span>
            </div>
            <p class="font-body-md text-on-surface-variant text-sm leading-relaxed">${ev.description.split('.')[0]}.</p>
            ${subContent}
            ${tagsHtml}
          </div>
          <div class="pt-6 mt-6 border-t border-outline-variant/30 flex justify-between items-center flex-wrap gap-4">
            <span class="font-label-mono text-[11px] text-on-surface-variant">Coordinators: ${ev.coordinatorsHtml || ev.coordinators}</span>
            <button class="btn-terminal-primary px-5 py-2.5 font-label-mono text-xs cursor-pointer control-inspect-btn" data-event-key="${key}">
              INSPECT DETAILS <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        `;

        const btn = card.querySelector('.control-inspect-btn');
        if (btn) {
          btn.addEventListener('click', () => {
            triggerSystemSignal(btn);
            openEventDetailModal(key);
          });
        }

        controlEventsContainer.appendChild(card);
      });
    }

    if (controlDay1Btn) {
      controlDay1Btn.addEventListener('click', () => {
        triggerSystemSignal(controlDay1Btn);
        renderControlRoomDay('day1');
      });
    }

    if (controlDay2Btn) {
      controlDay2Btn.addEventListener('click', () => {
        triggerSystemSignal(controlDay2Btn);
        renderControlRoomDay('day2');
      });
    }

    if (controlBtnPass) {
      controlBtnPass.addEventListener('click', () => {
        triggerSystemSignal(controlBtnPass);
        openRegModal();
      });
    }

    if (controlBtnEvents) {
      controlBtnEvents.addEventListener('click', () => {
        triggerSystemSignal(controlBtnEvents);
        smoothScroll('events');
      });
    }

    // Initialize Control Room default state
    renderControlRoomDay('day1');

    // Mobile Navigation Drawer Toggle & Accessibility
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');

    const openMobileDrawer = () => {
        if (!mobileNavDrawer) return;
        mobileNavDrawer.classList.add('drawer-open');
        mobileNavDrawer.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden';
        const icon = mobileMenuToggle?.querySelector('span');
        if (icon) icon.textContent = 'close';
    };

    const closeMobileDrawer = () => {
        if (!mobileNavDrawer) return;
        mobileNavDrawer.classList.remove('drawer-open');
        mobileNavDrawer.classList.add('translate-x-full');
        document.body.style.overflow = '';
        const icon = mobileMenuToggle?.querySelector('span');
        if (icon) icon.textContent = 'menu';
    };

    if (mobileMenuToggle && mobileNavDrawer) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mobileNavDrawer.classList.contains('drawer-open')) {
                closeMobileDrawer();
            } else {
                openMobileDrawer();
            }
        });
    }

    const drawerLinks = document.querySelectorAll('.nav-link-mobile, #drawer-register-btn');
    drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileDrawer();
        });
    });

    if (mobileNavDrawer) {
        mobileNavDrawer.addEventListener('click', (e) => {
            if (e.target === mobileNavDrawer) {
                closeMobileDrawer();
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileDrawer();
            if (typeof closeEventDetailModal === 'function') {
                closeEventDetailModal();
            }
        }
    });

    // Smooth Scroll
    const smoothScroll = (targetId) => {
        const target = document.getElementById(targetId);
        if (target) {
            isProgrammaticScrolling = true;
            updateActiveNavLink(targetId);

            let offsetPosition = 0;
            if (targetId !== 'home') {
                const navHeight = document.getElementById('main-nav')?.offsetHeight || 72;
                const elementPosition = target.getBoundingClientRect().top;
                const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
                offsetPosition = elementPosition + currentScrollY - navHeight + 2;
            }

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isProgrammaticScrolling = false;
            }, 800);
        }
    };

    const links = document.querySelectorAll('.nav-links a, .nav-link-mobile');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            smoothScroll(targetId);
        });
    });

    const exploreBtn = document.getElementById('hero-explore-btn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            smoothScroll('events');
        });
    }

    const dockEventsBtn = document.getElementById('dock-btn-events');
    const dockRegisterBtn = document.getElementById('dock-btn-register');
    if (dockEventsBtn) {
        dockEventsBtn.addEventListener('click', () => smoothScroll('events'));
    }
    if (dockRegisterBtn) {
        dockRegisterBtn.addEventListener('click', () => smoothScroll('register'));
    }

    // Contact Form Handler
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = contactForm.querySelectorAll('input, textarea');
            const submitBtn = contactForm.querySelector('button');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'TRANSMITTING...';
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.textContent = 'TRANSMISSION COMPLETE';
                inputs.forEach(input => input.value = '');
                
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 2000);
            }, 1200);
        });
    }

    // Official Event Countdown Clock (Target: Sept 30, 2026 09:30:00)
    const tickerCountdown = document.getElementById('ticker-countdown');
    const eventDate = new Date('2026-09-30T09:30:00+05:30').getTime();

    function updateTelemetryTicker() {
        const now = Date.now();
        const diff = Math.max(0, eventDate - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        if (tickerCountdown) {
            if (diff <= 0) {
                tickerCountdown.textContent = `EXOUSIA 2026: EVENT IN PROGRESS`;
            } else {
                tickerCountdown.textContent = `EXOUSIA CLOCK: ${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
            }
        }
    }
    setInterval(updateTelemetryTicker, 1000);
    updateTelemetryTicker();

    // Registration Terminal Modal & Digital Pass
    const regModal = document.getElementById('registration-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalFormStep = document.getElementById('modal-step-form');
    const modalPassStep = document.getElementById('modal-step-pass');
    const modalRegForm = document.getElementById('modal-reg-form');
    const modalFormFeedback = document.getElementById('modal-form-feedback');
    const modalSubmitBtn = document.getElementById('modal-submit-btn');

    async function drawQrCodeOnCanvas(canvasId, registrationId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const baseUrl = window.location.origin && window.location.origin !== 'null'
            ? window.location.origin
            : 'https://exousia-vert.vercel.app';
        const payload = `${baseUrl}/verify?id=${encodeURIComponent(registrationId)}`;
        try {
            await QRCode.toCanvas(canvas, payload, {
                width: 140,
                margin: 1,
                color: {
                    dark: '#050505',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'M'
            });
            canvas.setAttribute('role', 'img');
            canvas.setAttribute('aria-label', `QR verification code for registration ${registrationId}`);
        } catch (err) {
            console.error('Failed to generate QR verification token:', err);
        }
    }

    async function renderDigitalPass(passData, isNewRegistration = false) {
        if (!passData || !passData.registration_id) return;

        const nameEl = document.getElementById('pass-display-name');
        const collegeEl = document.getElementById('pass-display-college');
        const idEl = document.getElementById('pass-display-id');
        const trackEl = document.getElementById('pass-display-track');
        const statusEl = document.getElementById('pass-display-status');
        const dateEl = document.getElementById('pass-display-date');

        if (nameEl) nameEl.textContent = (passData.fullName || 'PARTICIPANT NAME').toUpperCase();
        if (collegeEl) collegeEl.textContent = passData.college || 'Institution';
        if (idEl) idEl.textContent = passData.registration_id;
        if (trackEl) trackEl.textContent = (passData.selectedEvent || 'DARK PORTAL').toUpperCase();
        if (statusEl) statusEl.textContent = passData.status ? passData.status.toUpperCase() : 'ENTRY AUTHORIZED';

        if (dateEl) {
            let formattedDate = 'OCT 01, 2026';
            if (passData.created_at) {
                try {
                    const d = new Date(passData.created_at);
                    if (!isNaN(d.getTime())) {
                        formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
                    }
                } catch (e) {
                    formattedDate = 'OCT 01, 2026';
                }
            } else if (passData.date) {
                formattedDate = passData.date.toUpperCase();
            }
            dateEl.textContent = formattedDate;
        }

        await drawQrCodeOnCanvas('pass-qr-canvas', passData.registration_id);

        const modalGlass = document.querySelector('.panel-modal-glass');
        if (modalGlass) modalGlass.classList.add('pass-mode-wide');

        if (modalFormStep) modalFormStep.classList.add('hidden');
        if (modalPassStep) modalPassStep.classList.remove('hidden');

        if (isNewRegistration && typeof triggerSystemSignal === 'function') {
            triggerSystemSignal(modalPassStep);
        }
    }

    function restoreSessionPassIfAvailable() {
        const savedRaw = sessionStorage.getItem('exousia_active_pass');
        if (!savedRaw) return false;
        try {
            const passData = JSON.parse(savedRaw);
            if (passData && passData.registration_id) {
                renderDigitalPass(passData, false);
                return true;
            }
        } catch (err) {
            console.error('Failed to parse active session pass:', err);
        }
        return false;
    }

    // --- REGISTRATION CARD SELECTOR LOGIC (DAY FIRST -> EVENT SECOND) ---
    const daySelectorContainer = document.getElementById('day-selector-container');
    const daySelectorTrigger = document.getElementById('day-selector-trigger');
    const dayDropdownMenu = document.getElementById('day-dropdown-menu');
    const dayTriggerTitle = document.getElementById('day-trigger-title');
    const dayTriggerSubtitle = document.getElementById('day-trigger-subtitle');
    const dayTriggerArrow = document.getElementById('day-trigger-arrow');
    const dayBadgeStatus = document.getElementById('day-badge-status');

    const eventSelectorContainer = document.getElementById('event-selector-container');
    const eventSelectorTrigger = document.getElementById('event-selector-trigger');
    const eventDropdownMenu = document.getElementById('event-dropdown-menu');
    const eventTriggerTitle = document.getElementById('event-trigger-title');
    const eventTriggerSubtitle = document.getElementById('event-trigger-subtitle');
    const eventTriggerArrow = document.getElementById('event-trigger-arrow');
    const eventBadgeStatus = document.getElementById('event-badge-status');

    const selectedEventSummary = document.getElementById('selected-event-summary');
    const summaryTitle = document.getElementById('summary-title');
    const summaryDay = document.getElementById('summary-day');
    const summaryFormat = document.getElementById('summary-format');
    const summaryVenue = document.getElementById('summary-venue');
    const summarySpot = document.getElementById('summary-spot');

    const regTrack = document.getElementById('reg-track');
    const regName = document.getElementById('reg-name');
    const regEmail = document.getElementById('reg-email');
    const regPhone = document.getElementById('reg-phone');
    const regCollege = document.getElementById('reg-college');

    let selectedDayState = null; // 'day1' | 'day2'
    let selectedEventState = null; // 'cluedup' | 'hawkins' | 'darkprotocol' | 'nexora'

    const DAY_CONFIG = {
      'day1': {
        title: 'DAY 1 — SEPTEMBER 30',
        timings: '9:30 AM – 3:00 PM',
        venue: 'Loyalty – 3 Block (C-Block)',
        events: ['cluedup', 'hawkins']
      },
      'day2': {
        title: 'DAY 2 — OCTOBER 1',
        timings: '9:00 AM – 1:00 PM',
        venue: 'Loyalty – 3 Block & Computer Lab',
        events: ['darkprotocol', 'genova']
      }
    };

    function validateRegistrationForm() {
      const isNameValid = regName && regName.value.trim().length > 0;
      const isEmailValid = regEmail && regEmail.value.trim().length > 0 && regEmail.value.includes('@');
      const isPhoneValid = regPhone && regPhone.value.trim().length > 0;
      const isCollegeValid = regCollege && regCollege.value.trim().length > 0;
      const isTrackValid = regTrack && regTrack.value.trim().length > 0;

      const isValid = isNameValid && isEmailValid && isPhoneValid && isCollegeValid && isTrackValid;

      if (modalSubmitBtn) {
        modalSubmitBtn.disabled = !isValid;
        if (isValid) {
          modalSubmitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
          modalSubmitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
      }
      return isValid;
    }

    [regName, regEmail, regPhone, regCollege].forEach(input => {
      if (input) {
        input.addEventListener('input', validateRegistrationForm);
      }
    });

    function toggleDayDropdown(forceState) {
      if (!dayDropdownMenu) return;
      const isOpen = forceState !== undefined ? forceState : dayDropdownMenu.classList.contains('hidden');
      if (isOpen) {
        dayDropdownMenu.classList.remove('hidden');
        if (dayTriggerArrow) dayTriggerArrow.style.transform = 'rotate(180deg)';
        if (daySelectorTrigger) daySelectorTrigger.setAttribute('aria-expanded', 'true');
        toggleEventDropdown(false);
      } else {
        dayDropdownMenu.classList.add('hidden');
        if (dayTriggerArrow) dayTriggerArrow.style.transform = 'rotate(0deg)';
        if (daySelectorTrigger) daySelectorTrigger.setAttribute('aria-expanded', 'false');
      }
    }

    function toggleEventDropdown(forceState) {
      if (!eventSelectorTrigger || eventSelectorTrigger.disabled || !eventDropdownMenu) return;
      const isOpen = forceState !== undefined ? forceState : eventDropdownMenu.classList.contains('hidden');
      if (isOpen) {
        eventDropdownMenu.classList.remove('hidden');
        if (eventTriggerArrow) eventTriggerArrow.style.transform = 'rotate(180deg)';
        if (eventSelectorTrigger) eventSelectorTrigger.setAttribute('aria-expanded', 'true');
        toggleDayDropdown(false);
      } else {
        eventDropdownMenu.classList.add('hidden');
        if (eventTriggerArrow) eventTriggerArrow.style.transform = 'rotate(0deg)';
        if (eventSelectorTrigger) eventSelectorTrigger.setAttribute('aria-expanded', 'false');
      }
    }

    if (daySelectorTrigger) {
      daySelectorTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDayDropdown();
      });
    }

    if (eventSelectorTrigger) {
      eventSelectorTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        toggleEventDropdown();
      });
    }

    function selectDay(dayKey, autoSelectEventKey = null) {
      selectedDayState = dayKey;
      const dayData = DAY_CONFIG[dayKey];
      if (!dayData) return;

      if (dayTriggerTitle) dayTriggerTitle.textContent = dayData.title;
      if (dayTriggerSubtitle) dayTriggerSubtitle.textContent = `${dayData.timings} • ${dayData.venue}`;
      if (dayBadgeStatus) {
        dayBadgeStatus.textContent = 'SELECTED';
        dayBadgeStatus.classList.remove('text-primary/70');
        dayBadgeStatus.classList.add('text-emerald-400');
      }

      const dayCards = dayDropdownMenu ? dayDropdownMenu.querySelectorAll('.custom-option-card') : [];
      dayCards.forEach(card => {
        if (card.getAttribute('data-day') === dayKey) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      });

      toggleDayDropdown(false);

      // Reset event selection when day changes
      selectedEventState = null;
      if (regTrack) regTrack.value = '';
      if (eventTriggerTitle) eventTriggerTitle.textContent = 'SELECT EVENT';
      if (eventTriggerSubtitle) eventTriggerSubtitle.textContent = 'Choose from available events';
      if (selectedEventSummary) selectedEventSummary.classList.add('hidden');

      // Enable Event Selector
      if (eventSelectorContainer) {
        eventSelectorContainer.classList.remove('opacity-50', 'pointer-events-none');
        eventSelectorContainer.classList.add('opacity-100', 'pointer-events-auto');
      }
      if (eventSelectorTrigger) {
        eventSelectorTrigger.disabled = false;
      }
      if (eventBadgeStatus) {
        eventBadgeStatus.textContent = 'REQUIRED';
        eventBadgeStatus.classList.remove('text-emerald-400');
        eventBadgeStatus.classList.add('text-primary/70');
      }

      renderEventOptionsForDay(dayKey, autoSelectEventKey);
      validateRegistrationForm();
    }

    function renderEventOptionsForDay(dayKey, autoSelectEventKey = null) {
      if (!eventDropdownMenu) return;
      eventDropdownMenu.innerHTML = '';

      const eventKeys = DAY_CONFIG[dayKey].events;
      eventKeys.forEach(eKey => {
        const ev = OFFICIAL_EVENTS_DATA[eKey];
        if (!ev) return;

        const card = document.createElement('div');
        card.className = 'custom-option-card p-3.5 bg-surface-container/80 border border-outline-variant/40 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all';
        card.setAttribute('role', 'option');
        card.setAttribute('tabindex', '0');
        card.setAttribute('data-event-key', eKey);

        const shortDesc = eKey === 'cluedup' ? 'Interactive treasure hunt' :
                          eKey === 'hawkins' ? 'Fast-paced puzzle challenge' :
                          eKey === 'darkprotocol' ? '4-round team challenge' :
                          'Single-player AI creative challenge — Where AI meets imagination';

        const formatLabel = ev.teamSize.toUpperCase();

        card.innerHTML = `
          <div class="flex items-start gap-3 overflow-hidden">
            <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 mt-0.5 font-label-mono">
              ◈
            </div>
            <div class="truncate">
              <div class="font-bold text-xs text-on-surface uppercase tracking-wider font-label-mono">${ev.name}</div>
              <div class="text-[11px] text-on-surface-variant truncate mt-0.5 font-body-md">${shortDesc}</div>
              <div class="text-[10px] text-primary/80 font-bold mt-1 font-label-mono uppercase tracking-wider">${formatLabel}</div>
            </div>
          </div>
          <span class="material-symbols-outlined text-primary text-xl option-check-icon flex-shrink-0">check_circle</span>
        `;

        const selectThisEvent = () => selectEvent(eKey);
        card.addEventListener('click', selectThisEvent);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectThisEvent();
          }
        });

        eventDropdownMenu.appendChild(card);
      });

      if (autoSelectEventKey) {
        selectEvent(autoSelectEventKey);
      }
    }

    function selectEvent(eventKey) {
      selectedEventState = eventKey;
      const ev = OFFICIAL_EVENTS_DATA[eventKey];
      if (!ev) return;

      if (eventTriggerTitle) eventTriggerTitle.textContent = ev.name.toUpperCase();
      if (eventTriggerSubtitle) eventTriggerSubtitle.textContent = ev.format.toUpperCase();
      if (eventBadgeStatus) {
        eventBadgeStatus.textContent = 'SELECTED';
        eventBadgeStatus.classList.remove('text-primary/70');
        eventBadgeStatus.classList.add('text-emerald-400');
      }

      const eventCards = eventDropdownMenu ? eventDropdownMenu.querySelectorAll('.custom-option-card') : [];
      eventCards.forEach(card => {
        if (card.getAttribute('data-event-key') === eventKey) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      });

      toggleEventDropdown(false);

      if (regTrack) {
        regTrack.value = ev.trackValue;
      }

      if (summaryTitle) summaryTitle.textContent = ev.name.toUpperCase();
      if (summaryDay) summaryDay.textContent = ev.day.toUpperCase();
      if (summaryFormat) summaryFormat.textContent = ev.teamSize.toUpperCase();
      if (summaryVenue) summaryVenue.textContent = ev.venue.toUpperCase();
      if (summarySpot) {
        const spotText = ev.id === 'nexora' ? 'NOT ALLOWED' : 'TO BE CONFIRMED';
        summarySpot.textContent = spotText;
        if (ev.id === 'nexora') {
          summarySpot.className = 'font-bold text-red-400 tracking-wider uppercase';
        } else {
          summarySpot.className = 'font-bold text-primary tracking-wider uppercase';
        }
      }

      if (selectedEventSummary) {
        selectedEventSummary.classList.remove('hidden');
      }

      validateRegistrationForm();
    }

    const dayCards = document.querySelectorAll('#day-dropdown-menu .custom-option-card');
    dayCards.forEach(card => {
      const dayKey = card.getAttribute('data-day');
      const selectThisDay = () => selectDay(dayKey);
      card.addEventListener('click', selectThisDay);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectThisDay();
        }
      });
    });

    window.selectEventByTrack = function(trackValue) {
      if (!trackValue) return;
      let targetKey = null;
      Object.keys(OFFICIAL_EVENTS_DATA).forEach(k => {
        if (OFFICIAL_EVENTS_DATA[k].trackValue === trackValue || OFFICIAL_EVENTS_DATA[k].name.toUpperCase() === trackValue.toUpperCase() || OFFICIAL_EVENTS_DATA[k].id === trackValue.toLowerCase()) {
          targetKey = k;
        }
      });
      if (targetKey) {
        const ev = OFFICIAL_EVENTS_DATA[targetKey];
        const dayKey = ev.day.includes('DAY 1') ? 'day1' : 'day2';
        selectDay(dayKey, targetKey);
      }
    };

    document.addEventListener('click', (e) => {
      if (daySelectorContainer && !daySelectorContainer.contains(e.target)) {
        toggleDayDropdown(false);
      }
      if (eventSelectorContainer && !eventSelectorContainer.contains(e.target)) {
        toggleEventDropdown(false);
      }
    });

    function openRegModal() {
        if (!regModal) return;
        restoreSessionPassIfAvailable();
        regModal.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        validateRegistrationForm();
    }

    function closeRegModal() {
        if (!regModal) return;
        regModal.classList.remove('modal-open');
        document.body.style.overflow = '';
        toggleDayDropdown(false);
        toggleEventDropdown(false);
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeRegModal);
    if (regModal) {
        regModal.addEventListener('click', (e) => {
            if (e.target === regModal) closeRegModal();
        });
    }
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (regModal?.classList.contains('modal-open')) closeRegModal();
            if (eventDetailModal?.classList.contains('modal-open')) closeEventDetailModal();
        }
    });

    const allRegisterButtons = [
        document.getElementById('nav-register-btn'),
        document.getElementById('drawer-register-btn'),
        document.getElementById('hero-register-btn'),
        document.getElementById('register-cta-btn'),
        document.getElementById('dock-btn-register')
    ];
    allRegisterButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                triggerSystemSignal(btn);
                openRegModal();
            });
        }
    });

    // Registration Form Handler
    if (modalRegForm) {
        modalRegForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateRegistrationForm()) {
                if (modalFormFeedback) {
                    modalFormFeedback.textContent = 'Please select a day, an event, and fill all required fields.';
                    modalFormFeedback.style.color = '#ffb4ab';
                }
                return;
            }

            if (modalSubmitBtn) triggerSystemSignal(modalSubmitBtn);

            const nameInput = document.getElementById('reg-name');
            const emailInput = document.getElementById('reg-email');
            const phoneInput = document.getElementById('reg-phone');
            const collegeInput = document.getElementById('reg-college');
            const trackInput = document.getElementById('reg-track');

            if (modalFormFeedback) {
                modalFormFeedback.textContent = '';
            }

            if (modalSubmitBtn) {
                modalSubmitBtn.disabled = true;
                modalSubmitBtn.innerHTML = 'SECURING CREDENTIALS... <span class="material-symbols-outlined text-sm animate-spin">sync</span>';
            }

            const payload = {
                fullName: nameInput.value.trim(),
                email: emailInput.value.trim(),
                phone: phoneInput.value.trim(),
                college: collegeInput.value.trim(),
                selectedEvent: trackInput.value
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const resData = await response.json().catch(() => ({}));

                if (response.ok && resData.success && resData.registration_id) {
                    const passData = {
                        registration_id: resData.registration_id,
                        fullName: resData.participant?.fullName || payload.fullName,
                        email: resData.participant?.email || payload.email,
                        college: resData.participant?.college || payload.college,
                        selectedEvent: resData.participant?.selectedEvent || payload.selectedEvent,
                        status: resData.status || 'REGISTERED',
                        created_at: resData.created_at || new Date().toISOString()
                    };

                    sessionStorage.setItem('exousia_active_pass', JSON.stringify(passData));
                    await renderDigitalPass(passData, true);

                    if (modalSubmitBtn) {
                        modalSubmitBtn.disabled = false;
                        modalSubmitBtn.innerHTML = 'SECURE CREDENTIALS <span class="material-symbols-outlined text-sm">arrow_forward</span>';
                    }
                } else {
                    const errorMsg = resData.message || 'REGISTRATION SERVICE UNAVAILABLE. PLEASE TRY AGAIN LATER.';
                    if (modalFormFeedback) {
                        modalFormFeedback.textContent = `[ FAILURE ]: ${errorMsg}`;
                        modalFormFeedback.style.color = '#ffb4ab';
                    }
                    if (modalSubmitBtn) {
                        modalSubmitBtn.disabled = false;
                        modalSubmitBtn.innerHTML = 'SECURE CREDENTIALS <span class="material-symbols-outlined text-sm">arrow_forward</span>';
                    }
                }
            } catch (err) {
                console.error('Registration API Transmission Error:', err);
                if (modalFormFeedback) {
                    modalFormFeedback.textContent = '[ ERROR ]: CONNECTION FAILED. REGISTRATION SERVICE OFFLINE.';
                    modalFormFeedback.style.color = '#ffb4ab';
                }
                if (modalSubmitBtn) {
                    modalSubmitBtn.disabled = false;
                    modalSubmitBtn.innerHTML = 'SECURE CREDENTIALS <span class="material-symbols-outlined text-sm">arrow_forward</span>';
                }
            }
        });
    }

    // Pass Action Buttons
    const passDownloadBtn = document.getElementById('pass-download-btn');
    if (passDownloadBtn) {
        passDownloadBtn.addEventListener('click', () => {
            const passId = document.getElementById('pass-display-id')?.textContent || 'EX-2026';
            const name = document.getElementById('pass-display-name')?.textContent || 'PARTICIPANT NAME';
            const college = document.getElementById('pass-display-college')?.textContent || 'INSTITUTION NAME';
            const track = document.getElementById('pass-display-track')?.textContent || 'DARK PORTAL';
            const dateStr = document.getElementById('pass-display-date')?.textContent || 'OCT 01, 2026';
            const statusStr = document.getElementById('pass-display-status')?.textContent || 'ENTRY AUTHORIZED';
            
            const canvas = document.createElement('canvas');
            canvas.width = 1280;
            canvas.height = 440;
            const ctx = canvas.getContext('2d');

            // 1. Dark Reddish Atmospheric Background
            const grad = ctx.createLinearGradient(0, 0, 1280, 440);
            grad.addColorStop(0, '#090204');
            grad.addColorStop(0.45, '#160408');
            grad.addColorStop(1, '#050102');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1280, 440);

            // Subtle Volumetric Radial Glows
            const radGlow1 = ctx.createRadialGradient(450, 220, 20, 450, 220, 400);
            radGlow1.addColorStop(0, 'rgba(220, 20, 30, 0.28)');
            radGlow1.addColorStop(0.6, 'rgba(100, 8, 15, 0.15)');
            radGlow1.addColorStop(1, 'transparent');
            ctx.fillStyle = radGlow1;
            ctx.fillRect(0, 0, 1280, 440);

            // 2. Solid Red Border
            ctx.strokeStyle = '#e50914';
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(229, 9, 20, 0.6)';
            ctx.shadowBlur = 20;
            
            // Draw Rounded Rectangle Border
            const r = 24;
            const bx = 16, by = 16, bw = 1248, bh = 408;
            ctx.beginPath();
            ctx.moveTo(bx + r, by);
            ctx.lineTo(bx + bw - r, by);
            ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
            ctx.lineTo(bx + bw, by + bh - r);
            ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
            ctx.lineTo(bx + r, by + bh);
            ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
            ctx.lineTo(bx, by + r);
            ctx.quadraticCurveTo(bx, by, bx + r, by);
            ctx.closePath();
            ctx.stroke();

            ctx.shadowBlur = 0; // Reset glow

            // 3. LEFT COLUMN — INSTITUTION & HERO LOCKUP
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.font = '600 13px sans-serif';
            ctx.fillText('DEPARTMENT OF EEE   |   IEI - VVITU STUDENT CHAPTER', 60, 68);

            // EXOUSIA Title
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 82px "DM Serif Display", Georgia, serif';
            ctx.shadowColor = 'rgba(229, 9, 20, 0.9)';
            ctx.shadowBlur = 25;
            ctx.fillText('EXOUSIA', 56, 170);
            
            // Red Outline
            ctx.strokeStyle = '#e50914';
            ctx.lineWidth = 2;
            ctx.strokeText('EXOUSIA', 56, 170);
            ctx.shadowBlur = 0;

            // 2K26 Subtitle
            ctx.fillStyle = '#e50914';
            ctx.font = '700 52px "DM Serif Display", Georgia, serif';
            ctx.shadowColor = 'rgba(229, 9, 20, 0.7)';
            ctx.shadowBlur = 20;
            ctx.fillText('2K26', 180, 235);
            ctx.shadowBlur = 0;

            // DIGITAL PASS Sub-caption
            ctx.fillStyle = '#ffffff';
            ctx.font = '600 17px sans-serif';
            ctx.letterSpacing = '0.35em';
            ctx.fillText('D I G I T A L   P A S S', 130, 310);

            // Vertical Separator Line between Left and Middle
            ctx.strokeStyle = 'rgba(229, 9, 20, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(630, 50);
            ctx.lineTo(630, 390);
            ctx.stroke();

            // 4. MIDDLE COLUMN — PARTICIPANT METADATA
            const midX = 660;

            // PARTICIPANT
            ctx.fillStyle = '#e50914';
            ctx.font = '700 13px sans-serif';
            ctx.fillText('PARTICIPANT', midX, 72);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px sans-serif';
            ctx.fillText(name.toUpperCase(), midX, 110);

            ctx.fillStyle = '#d1d5db';
            ctx.font = '16px sans-serif';
            ctx.fillText(college, midX, 138);

            // Divider Line 1
            ctx.strokeStyle = 'rgba(185, 28, 28, 0.3)';
            ctx.beginPath(); ctx.moveTo(midX, 158); ctx.lineTo(960, 158); ctx.stroke();

            // EVENT
            ctx.fillStyle = '#e50914';
            ctx.font = '700 13px sans-serif';
            ctx.fillText('EVENT', midX, 185);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText(track.toUpperCase(), midX, 218);

            // Divider Line 2
            ctx.beginPath(); ctx.moveTo(midX, 238); ctx.lineTo(960, 238); ctx.stroke();

            // REG ID & DATE
            ctx.fillStyle = '#e50914';
            ctx.font = '700 13px sans-serif';
            ctx.fillText('REG ID', midX, 265);
            ctx.fillText('DATE', midX + 170, 265);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px monospace';
            ctx.fillText(passId, midX, 298);

            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(dateStr, midX + 170, 298);

            // Divider Line 3
            ctx.beginPath(); ctx.moveTo(midX, 318); ctx.lineTo(960, 318); ctx.stroke();

            // STATUS
            ctx.fillStyle = '#e50914';
            ctx.font = '700 13px sans-serif';
            ctx.fillText('STATUS', midX, 345);

            ctx.fillStyle = '#00ff9d';
            ctx.font = 'bold 22px sans-serif';
            ctx.shadowColor = 'rgba(0, 255, 157, 0.6)';
            ctx.shadowBlur = 12;
            ctx.fillText(statusStr.toUpperCase(), midX, 380);
            ctx.shadowBlur = 0;

            // Vertical Separator Line between Middle and Right QR
            ctx.strokeStyle = 'rgba(229, 9, 20, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(990, 50);
            ctx.lineTo(990, 390);
            ctx.stroke();

            // 5. RIGHT COLUMN — QR CODE FRAME
            const qrFrameX = 1030, qrFrameY = 100, qrFrameSize = 190;
            
            // Red Glowing QR Container Box
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(229, 9, 20, 0.7)';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = '#e50914';
            ctx.lineWidth = 3;
            
            // Draw Rounded Rect for QR Box
            const qrR = 14;
            ctx.beginPath();
            ctx.moveTo(qrFrameX + qrR, qrFrameY);
            ctx.lineTo(qrFrameX + qrFrameSize - qrR, qrFrameY);
            ctx.quadraticCurveTo(qrFrameX + qrFrameSize, qrFrameY, qrFrameX + qrFrameSize, qrFrameY + qrR);
            ctx.lineTo(qrFrameX + qrFrameSize, qrFrameY + qrFrameSize - qrR);
            ctx.quadraticCurveTo(qrFrameX + qrFrameSize, qrFrameY + qrFrameSize, qrFrameX + qrFrameSize - qrR, qrFrameY + qrFrameSize);
            ctx.lineTo(qrFrameX + qrR, qrFrameY + qrFrameSize);
            ctx.quadraticCurveTo(qrFrameX, qrFrameY + qrFrameSize, qrFrameX, qrFrameY + qrFrameSize - qrR);
            ctx.lineTo(qrFrameX, qrFrameY + qrR);
            ctx.quadraticCurveTo(qrFrameX, qrFrameY, qrFrameX + qrR, qrFrameY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            const qrCanvas = document.getElementById('pass-qr-canvas');
            if (qrCanvas) {
                ctx.drawImage(qrCanvas, qrFrameX + 15, qrFrameY + 15, qrFrameSize - 30, qrFrameSize - 30);
            }

            // SCAN FOR ENTRY Text
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SCAN FOR ENTRY', qrFrameX + (qrFrameSize / 2), qrFrameY + qrFrameSize + 32);
            ctx.textAlign = 'left';

            // Download Trigger
            const a = document.createElement('a');
            a.download = `EXOUSIA_PASS_${passId}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        });
    }

    const passPrintBtn = document.getElementById('pass-print-btn');
    if (passPrintBtn) {
        passPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }

    const passShareBtn = document.getElementById('pass-share-btn');
    if (passShareBtn) {
        passShareBtn.addEventListener('click', async () => {
            const passId = document.getElementById('pass-display-id')?.textContent || 'EX-2026';
            const shareData = {
                title: 'EXOUSIA 2026 Participant Credential',
                text: `I just secured my official Participant Credential (${passId}) for EXOUSIA 2026 (Sept 30 & Oct 1)!`,
                url: window.location.href
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log('Share canceled.', err);
                }
            } else {
                try {
                    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                    const originalText = passShareBtn.innerHTML;
                    passShareBtn.innerHTML = '<span class="material-symbols-outlined text-base">check</span> COPIED TO CLIPBOARD!';
                    setTimeout(() => {
                        passShareBtn.innerHTML = originalText;
                    }, 2500);
                } catch (err) {
                    alert(`Share Link: ${window.location.href}`);
                }
            }
        });
    }

    const passNewRegBtn = document.getElementById('pass-new-reg-btn');
    if (passNewRegBtn) {
        passNewRegBtn.addEventListener('click', () => {
            sessionStorage.removeItem('exousia_active_pass');
            if (modalRegForm) modalRegForm.reset();
            if (modalFormFeedback) modalFormFeedback.textContent = '';
            const modalGlass = document.querySelector('.panel-modal-glass');
            if (modalGlass) modalGlass.classList.remove('pass-mode-wide');
            if (modalPassStep) modalPassStep.classList.add('hidden');
            if (modalFormStep) modalFormStep.classList.remove('hidden');
        });
    }

    // Image Lightbox Modal Handlers
    const lightboxModal = document.getElementById('image-lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
    const lightboxCloseBottom = document.getElementById('lightbox-close-bottom');

    function openLightbox(src, caption) {
        if (!lightboxModal || !lightboxImg) return;
        lightboxImg.src = src;
        if (lightboxCaption) lightboxCaption.textContent = caption || 'EXOUSIA 2K26 Official Document';
        lightboxModal.classList.remove('hidden');
        lightboxModal.classList.add('modal-open');
    }

    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('modal-open');
        lightboxModal.classList.add('hidden');
    }

    document.querySelectorAll('.image-lightbox-trigger').forEach(el => {
        el.addEventListener('click', () => {
            const src = el.getAttribute('data-img-src');
            const caption = el.getAttribute('data-img-caption');
            if (src) openLightbox(src, caption);
        });
    });

    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxCloseBottom) lightboxCloseBottom.addEventListener('click', closeLightbox);
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });
    }

    // Chamber Ambient Dust Particle System
    function initChamberDustCanvas() {
        const canvas = document.getElementById('chamber-dust-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        let height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

        const resize = () => {
            width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };
        window.addEventListener('resize', resize);

        const particles = Array.from({ length: 18 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 0.6 + Math.random() * 1.2,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -0.2 - Math.random() * 0.4,
            opacity: 0.15 + Math.random() * 0.35,
            pulseSpeed: 0.01 + Math.random() * 0.02,
            pulse: Math.random() * Math.PI * 2
        }));

        let animId = null;

        function render() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += p.pulseSpeed;

                if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
                if (p.x < -10) p.x = width + 10;
                if (p.x > width + 10) p.x = -10;

                const alpha = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 120, 110, ${alpha})`;
                ctx.fill();
            });
            animId = requestAnimationFrame(render);
        }

        const checkState = () => {
            const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const isModalOpen = document.getElementById('registration-modal')?.classList.contains('modal-open');
            if (isModalOpen && !isReduced) {
                if (!animId) render();
            } else {
                if (animId) {
                    cancelAnimationFrame(animId);
                    animId = null;
                    ctx.clearRect(0, 0, width, height);
                }
            }
        };

        const observer = new MutationObserver(checkState);
        const regModal = document.getElementById('registration-modal');
        if (regModal) {
            observer.observe(regModal, { attributes: true, attributeFilter: ['class'] });
        }
        checkState();
    }

    // Dynamic Homepage Supernatural Storm & Atmospheric Illumination System (Living Procedural Volume Sky Canvas)
    function initHomepageStorm() {
        const glowEl = document.getElementById('env-lightning-glow');
        const backCloud = document.querySelector('.env-clouds-back');
        const midCloud = document.querySelector('.env-clouds-mid');
        const stormCanvas = document.getElementById('env-storm-canvas');
        
        let stormCtx = null;
        let stormAnimId = null;
        let stormWidth = 0;
        let stormHeight = 0;

        if (stormCanvas) {
            stormCtx = stormCanvas.getContext('2d');
            const resizeStorm = () => {
                stormWidth = stormCanvas.width = window.innerWidth;
                stormHeight = stormCanvas.height = Math.floor(window.innerHeight * 0.55);
            };
            resizeStorm();
            window.addEventListener('resize', resizeStorm);
        }

        // Procedural Sky Volume Cloud Billow Clusters (Clearly Visible Organic Shape Deformation & Density Swell)
        const cloudClusters = Array.from({ length: 12 }, (_, i) => ({
            xRatio: 0.05 + (i * 0.085) + (Math.random() - 0.5) * 0.05,
            yRatio: 0.16 + (Math.random() - 0.5) * 0.24,
            radiusRatio: 0.25 + Math.random() * 0.18,
            phase: Math.random() * Math.PI * 2,
            phaseSpeed: 0.0035 + Math.random() * 0.0055,
            morphFactor: 0.8 + Math.random() * 0.7,
            opacity: 0.32 + Math.random() * 0.38
        }));

        let stormTime = 0;
        let stormLightningVal = 0;

        function renderStormSkyCanvas() {
            if (!stormCtx || stormWidth === 0 || stormHeight === 0) return;
            stormTime += 0.016;
            stormCtx.clearRect(0, 0, stormWidth, stormHeight);

            const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (isReduced) return;

            // 1. Render continuous background cloud density mass with visibly evolving shape deformation
            cloudClusters.forEach((c) => {
                c.phase += c.phaseSpeed;
                
                // Visibly obvious organic shape morphing & density swell (NO lower scene/cyclist movement)
                const deformX = 1.0 + Math.sin(c.phase * c.morphFactor) * 0.26;
                const deformY = 1.0 + Math.cos(c.phase * 1.1) * 0.22;
                
                const currentRadius = stormWidth * (c.radiusRatio + Math.sin(c.phase * 0.9) * 0.08);
                const cx = stormWidth * c.xRatio + Math.sin(c.phase * 0.6) * 35;
                const cy = stormHeight * c.yRatio + Math.cos(c.phase * 0.4) * 18;

                stormCtx.save();
                stormCtx.translate(cx, cy);
                stormCtx.scale(deformX, deformY);

                const grad = stormCtx.createRadialGradient(0, 0, currentRadius * 0.06, 0, 0, currentRadius);
                
                const flashAlpha = stormLightningVal * 0.38;
                const baseOpacity = Math.min(0.92, c.opacity * (0.75 + Math.sin(c.phase * 1.4) * 0.25));

                grad.addColorStop(0, `rgba(${180 + Math.floor(flashAlpha * 75)}, ${24 + Math.floor(flashAlpha * 46)}, ${34 + Math.floor(flashAlpha * 36)}, ${baseOpacity + flashAlpha * 0.4})`);
                grad.addColorStop(0.35, `rgba(130, 12, 22, ${(baseOpacity * 0.72) + flashAlpha * 0.22})`);
                grad.addColorStop(0.75, `rgba(55, 4, 11, ${(baseOpacity * 0.32)})`);
                grad.addColorStop(1, 'transparent');

                stormCtx.fillStyle = grad;
                stormCtx.beginPath();
                stormCtx.arc(0, 0, currentRadius, 0, Math.PI * 2);
                stormCtx.fill();
                stormCtx.restore();
            });

            // Decay storm canvas lightning flash value
            if (stormLightningVal > 0) {
                stormLightningVal = Math.max(0, stormLightningVal - 0.04);
            }

            stormAnimId = requestAnimationFrame(renderStormSkyCanvas);
        }

        if (stormCtx) {
            renderStormSkyCanvas();
        }

        let currentAnimFrame = null;

        function animateLightningEvent() {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            // Sync with intro if active
            introLightningIntensity = 0.95;
            stormLightningVal = 1.0;

            if (!glowEl) return;

            // Randomize organic strike intensity (restrained, non-blinding crimson cloud bloom)
            const isDoublePulse = Math.random() > 0.40;
            const maxIntensity = 0.22 + Math.random() * 0.38; // Opacity 0.22 to 0.60 max
            const cloudBrightness = 1.05 + maxIntensity * 0.35; // Cloud brightness 1.05 to 1.25
            const cloudContrast = 1.05 + maxIntensity * 0.30;

            // Wide linear backlighting gradient across upper sky (NO radial bulbs/circles)
            const verticalSpread = 32 + Math.random() * 28;
            const skewAngle = Math.random() > 0.5 ? '175deg' : '185deg';

            glowEl.style.background = `linear-gradient(${skewAngle}, 
                rgba(195, 30, 42, ${maxIntensity * 0.82}) 0%, 
                rgba(125, 12, 24, ${maxIntensity * 0.45}) ${verticalSpread}%, 
                rgba(65, 5, 12, ${maxIntensity * 0.12}) ${verticalSpread + 22}%, 
                transparent 100%)`;

            const startTime = performance.now();
            const primaryPeakTime = 25 + Math.random() * 25; // 25-50ms rapid rise
            const primaryDecayTime = primaryPeakTime + 70 + Math.random() * 40; // ~95-130ms primary decay
            const secondaryPeakTime = primaryDecayTime + 45 + Math.random() * 30; // ~140-190ms secondary pulse
            const totalDuration = isDoublePulse ? secondaryPeakTime + 110 : primaryDecayTime + 70;

            function updateFrame(now) {
                const elapsed = now - startTime;
                let currentVal = 0;

                if (elapsed < primaryPeakTime) {
                    // Smooth rise
                    const progress = elapsed / primaryPeakTime;
                    currentVal = progress * maxIntensity;
                } else if (elapsed < primaryDecayTime) {
                    // Quadratic smooth decay
                    const progress = (elapsed - primaryPeakTime) / (primaryDecayTime - primaryPeakTime);
                    currentVal = maxIntensity * Math.pow(1 - progress, 2);
                } else if (isDoublePulse && elapsed >= primaryDecayTime && elapsed < secondaryPeakTime) {
                    // Secondary pulse rise (subtle reflection inside clouds)
                    const progress = (elapsed - primaryDecayTime) / (secondaryPeakTime - primaryDecayTime);
                    const secondaryMax = maxIntensity * 0.45;
                    currentVal = progress * secondaryMax;
                } else if (isDoublePulse && elapsed >= secondaryPeakTime && elapsed < totalDuration) {
                    // Secondary pulse decay
                    const progress = (elapsed - secondaryPeakTime) / (totalDuration - secondaryPeakTime);
                    const secondaryMax = maxIntensity * 0.45;
                    currentVal = secondaryMax * Math.pow(1 - progress, 2);
                } else {
                    currentVal = 0;
                }

                // Apply frame values smoothly to glow element and cloud layer filters
                glowEl.style.opacity = currentVal.toFixed(3);

                const bVal = (1.0 + (currentVal / maxIntensity) * (cloudBrightness - 1.0)).toFixed(3);
                const cVal = (1.0 + (currentVal / maxIntensity) * (cloudContrast - 1.0)).toFixed(3);

                if (backCloud) backCloud.style.filter = `contrast(${cVal}) brightness(${bVal})`;
                if (midCloud) midCloud.style.filter = `contrast(${cVal}) brightness(${bVal})`;

                if (elapsed < totalDuration) {
                    currentAnimFrame = requestAnimationFrame(updateFrame);
                } else {
                    glowEl.style.opacity = '0';
                    if (backCloud) backCloud.style.filter = '';
                    if (midCloud) midCloud.style.filter = '';
                }
            }

            if (currentAnimFrame) cancelAnimationFrame(currentAnimFrame);
            currentAnimFrame = requestAnimationFrame(updateFrame);
        }

        let thunderTimeoutId = null;

        function scheduleNextThunder() {
            if (document.visibilityState === 'hidden') return;
            // Irregular, natural storm interval between 8.5s and 18s (subtle accent)
            const delay = 8500 + Math.random() * 9500;
            thunderTimeoutId = setTimeout(() => {
                animateLightningEvent();
                scheduleNextThunder();
            }, delay);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                if (currentAnimFrame) cancelAnimationFrame(currentAnimFrame);
                if (stormAnimId) cancelAnimationFrame(stormAnimId);
                if (thunderTimeoutId) clearTimeout(thunderTimeoutId);
                if (glowEl) glowEl.style.opacity = '0';
                if (backCloud) backCloud.style.filter = '';
                if (midCloud) midCloud.style.filter = '';
            } else {
                if (stormCtx && !stormAnimId) renderStormSkyCanvas();
                scheduleNextThunder();
            }
        });

        setTimeout(animateLightningEvent, 2800);
        scheduleNextThunder();
    }

    initChamberDustCanvas();
    initHomepageStorm();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
