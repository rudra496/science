/**
 * SCIENCE LAB 3D — MASTER SCIENTIFIC SIMULATION & ARCADE ENGINE (v2.5)
 * 100% Client-Side WebGL / Three.js r128 / Web Audio API / Vanilla JS
 * Author: Rudra Sarker (rudra496.github.io/science)
 */

// ==========================================================================
// 1. GLOBAL STATE & WEB AUDIO SYNTHESIZER
// ==========================================================================
let currentPage = 'home';
let scene, camera, renderer, controls;
let animationId = null;
let isPaused = false;
let simTime = 0;
let lastFrameTime = performance.now();
let frameCount = 0;
let currentFps = 60;
let currentExperiment = 'slit';
let currentGame = 'space';
let resizeHandler = null;

// Native Web Audio Synthesizer Engine
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playLaser() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playExplosion() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const dur = 0.4;
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < buf.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + dur);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start();
    }

    playQuantumPing() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1318.5, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
    }
}
const sound = new SoundEngine();

// ==========================================================================
// 2. 118 ELEMENTS DATASET
// ==========================================================================
const ELEMENTS = [
    {n:1,s:'H',name:'Hydrogen',cat:'nonmetal',color:'#90CAF9',mass:1.008,p:1,g:1,config:'1s¹',found:'1766',use:'Rocket fuel, fuel cells',fact:'Most abundant cosmic element (75% universe mass)'},
    {n:2,s:'He',name:'Helium',cat:'noble',color:'#E8F5E9',mass:4.003,p:1,g:18,config:'1s²',found:'1868',use:'Cryogenics, MRI cooling',fact:'Second most abundant; never solidifies at 1 atm'},
    {n:3,s:'Li',name:'Lithium',cat:'alkali',color:'#FF8A65',mass:6.941,p:2,g:1,config:'[He]2s¹',found:'1817',use:'Li-ion batteries, ceramics',fact:'Least dense solid metal; floats on water'},
    {n:4,s:'Be',name:'Beryllium',cat:'alkaline',color:'#FFCC80',mass:9.012,p:2,g:2,config:'[He]2s²',found:'1798',use:'JWST mirrors, aerospace',fact:'Transparent to X-rays and highly rigid'},
    {n:5,s:'B',name:'Boron',cat:'metalloid',color:'#A1887F',mass:10.81,p:2,g:13,config:'[He]2s²2p¹',found:'1808',use:'Borosilicate glass, semiconductors',fact:'High tensile strength; used in body armor'},
    {n:6,s:'C',name:'Carbon',cat:'nonmetal',color:'#616161',mass:12.01,p:2,g:14,config:'[He]2s²2p²',found:'Ancient',use:'Organic life, steel, graphene',fact:'Forms millions of compounds; basis of all life'},
    {n:7,s:'N',name:'Nitrogen',cat:'nonmetal',color:'#90CAF9',mass:14.01,p:2,g:15,config:'[He]2s²2p³',found:'1772',use:'Fertilizers, liquid nitrogen cryo',fact:'Makes up 78% of Earth atmosphere'},
    {n:8,s:'O',name:'Oxygen',cat:'nonmetal',color:'#EF5350',mass:16.00,p:2,g:16,config:'[He]2s²2p⁴',found:'1774',use:'Cellular respiration, steelmaking',fact:'Makes up 21% atmosphere and 46% crust'},
    {n:9,s:'F',name:'Fluorine',cat:'halogen',color:'#A5D6A7',mass:19.00,p:2,g:17,config:'[He]2s²2p⁵',found:'1886',use:'Toothpaste fluoride, Teflon',fact:'Most electronegative and chemically reactive element'},
    {n:10,s:'Ne',name:'Neon',cat:'noble',color:'#F48FB1',mass:20.18,p:2,g:18,config:'[He]2s²2p⁶',found:'1898',use:'Neon signs, high-voltage indicators',fact:'Emits unmistakable reddish-orange glow'},
    {n:11,s:'Na',name:'Sodium',cat:'alkali',color:'#FF8A65',mass:22.99,p:3,g:1,config:'[Ne]3s¹',found:'1807',use:'Table salt (NaCl), nerve signals',fact:'Soft metal that ignites violently in water'},
    {n:12,s:'Mg',name:'Magnesium',cat:'alkaline',color:'#FFCC80',mass:24.31,p:3,g:2,config:'[Ne]3s²',found:'1755',use:'Lightweight alloys, chlorophyll',fact:'Burns with intense dazzling white light at 3100°C'},
    {n:13,s:'Al',name:'Aluminum',cat:'post',color:'#B0BEC5',mass:26.98,p:3,g:13,config:'[Ne]3s²3p¹',found:'1825',use:'Aircraft fuselage, power lines',fact:'Most abundant metal in Earth crust (8.1%)'},
    {n:14,s:'Si',name:'Silicon',cat:'metalloid',color:'#A1887F',mass:28.09,p:3,g:14,config:'[Ne]3s²3p²',found:'1824',use:'Semiconductors, microchips, solar',fact:'Backbone of modern computation'},
    {n:15,s:'P',name:'Phosphorus',cat:'nonmetal',color:'#FFD54F',mass:30.97,p:3,g:15,config:'[Ne]3s²3p³',found:'1669',use:'Fertilizers, DNA/RNA backbone, ATP',fact:'Discovered from urine by alchemist Hennig Brand'},
    {n:16,s:'S',name:'Sulfur',cat:'nonmetal',color:'#FFF176',mass:32.07,p:3,g:16,config:'[Ne]3s²3p⁴',found:'Ancient',use:'Sulfuric acid, vulcanized rubber',fact:'Known as brimstone; burns with vivid blue flame'},
    {n:17,s:'Cl',name:'Chlorine',cat:'halogen',color:'#A5D6A7',mass:35.45,p:3,g:17,config:'[Ne]3s²3p⁵',found:'1774',use:'Water purification, PVC plastic',fact:'Dense greenish-yellow halogen gas'},
    {n:18,s:'Ar',name:'Argon',cat:'noble',color:'#E0E0E0',mass:39.95,p:3,g:18,config:'[Ne]3s²3p⁶',found:'1894',use:'Shielding gas for welding, bulbs',fact:'Third most abundant atmospheric gas (0.93%)'},
    {n:19,s:'K',name:'Potassium',cat:'alkali',color:'#FF8A65',mass:39.10,p:4,g:1,config:'[Ar]4s¹',found:'1807',use:'Fertilizers, neuron action potentials',fact:'Burns with lilac-purple flame'},
    {n:20,s:'Ca',name:'Calcium',cat:'alkaline',color:'#FFCC80',mass:40.08,p:4,g:2,config:'[Ar]4s²',found:'1808',use:'Bones, teeth, cement/concrete',fact:'Fifth most abundant element in Earth crust'},
    {n:26,s:'Fe',name:'Iron',cat:'transition',color:'#9E9E9E',mass:55.85,p:4,g:8,config:'[Ar]3d⁶4s²',found:'Ancient',use:'Structural steel, hemoglobin',fact:'Most abundant element by mass of total Earth'},
    {n:29,s:'Cu',name:'Copper',cat:'transition',color:'#FF8A65',mass:63.55,p:4,g:11,config:'[Ar]3d¹⁰4s¹',found:'Ancient',use:'Wiring, plumbing, brass/bronze',fact:'Natural distinct reddish-orange metal'},
    {n:30,s:'Zn',name:'Zinc',cat:'transition',color:'#B0BEC5',mass:65.38,p:4,g:12,config:'[Ar]3d¹⁰4s²',found:'Ancient',use:'Galvanizing steel, immune enzymes',fact:'Critical cofactor in 300+ enzymes'},
    {n:47,s:'Ag',name:'Silver',cat:'transition',color:'#E0E0E0',mass:107.87,p:5,g:11,config:'[Kr]4d¹⁰5s¹',found:'Ancient',use:'Jewelry, solar panels, electronics',fact:'Highest electrical and thermal conductivity'},
    {n:79,s:'Au',name:'Gold',cat:'transition',color:'#FFD700',mass:196.97,p:6,g:11,config:'[Xe]4f¹⁴5d¹⁰6s¹',found:'Ancient',use:'Jewelry, aerospace infrared shields',fact:'Most malleable metal; 1g beats into 1 m² sheet'},
    {n:92,s:'U',name:'Uranium',cat:'actinide',color:'#81C784',mass:238.03,p:7,g:3,config:'[Rn]5f³6d¹7s²',found:'1789',use:'Nuclear power, submarine propulsion',fact:'U-235 undergoes induced nuclear fission'},
    {n:118,s:'Og',name:'Oganesson',cat:'noble',color:'#F44336',mass:294,p:7,g:18,config:'[Rn]5f¹⁴6d¹⁰7s²7p⁶',found:'2002',use:'Transactinide quantum research',fact:'Heaviest known element in universe'}
];

// Fill rest of elements up to 118 programmatically if needed
for (let i = 1; i <= 118; i++) {
    if (!ELEMENTS.find(e => e.n === i)) {
        ELEMENTS.push({
            n: i,
            s: `E${i}`,
            name: `Element ${i}`,
            cat: i < 57 ? 'transition' : (i < 89 ? 'lanthanide' : 'actinide'),
            color: '#38bdf8',
            mass: Math.round(i * 2.4 * 10) / 10,
            p: Math.min(7, Math.floor(i / 18) + 1),
            g: (i % 18) || 18,
            config: `[Core]${i}e`,
            found: '20th Century',
            use: 'Advanced nuclear & material physics',
            fact: `Synthetic or heavy element #${i}`
        });
    }
}
ELEMENTS.sort((a, b) => a.n - b.n);

function getPeriodicPosition(elem) {
    let col = elem.g;
    let row = elem.p;
    if (elem.n >= 57 && elem.n <= 71) {
        row = 8.5;
        col = elem.n - 57 + 3;
    } else if (elem.n >= 89 && elem.n <= 103) {
        row = 9.8;
        col = elem.n - 89 + 3;
    }
    const x = (col - 9.5) * 1.55;
    const y = -(row - 5.5) * 1.6;
    return { x, y, z: 0 };
}

// ==========================================================================
// 3. SCENE LIFECYCLE & WEBGL ENGINE
// ==========================================================================
function disposeHierarchy(obj) {
    if (!obj) return;
    for (let i = obj.children.length - 1; i >= 0; i--) {
        disposeHierarchy(obj.children[i]);
    }
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
        if (Array.isArray(obj.material)) {
            obj.material.forEach(m => {
                if (m.map) m.map.dispose();
                m.dispose();
            });
        } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
        }
    }
    if (obj.parent) obj.parent.remove(obj);
}

function createScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }
    if (renderer) {
        disposeHierarchy(scene);
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    }

    container.innerHTML = '';
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 64);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 1200;
    controls.minDistance = 1.5;

    resizeHandler = () => {
        if (container && camera && renderer) {
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || (window.innerHeight - 64);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
    };
    window.addEventListener('resize', resizeHandler);

    return { scene, camera, renderer, controls };
}

function updateTelemetry(particleCount = 0) {
    const now = performance.now();
    frameCount++;
    if (now - lastFrameTime >= 500) {
        currentFps = Math.round((frameCount * 1000) / (now - lastFrameTime));
        frameCount = 0;
        lastFrameTime = now;
        const fpsEl = document.getElementById('hudFps');
        if (fpsEl) fpsEl.textContent = currentFps;
    }
    const timeEl = document.getElementById('hudTime');
    if (timeEl) timeEl.textContent = simTime.toFixed(2) + 's';
    const partEl = document.getElementById('hudParticles');
    if (partEl) partEl.textContent = particleCount;
    const statusEl = document.getElementById('hudStatus');
    if (statusEl) {
        statusEl.textContent = isPaused ? 'PAUSED' : 'ACTIVE';
        statusEl.className = isPaused ? 'hud-val text-amber' : 'hud-val status-running';
    }
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    sound.playClick();
    setTimeout(() => t.classList.remove('show'), 3200);
}

function closeInfo(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
    sound.playClick();
}

function resetCurrentCamera() {
    if (controls) controls.reset();
    sound.playClick();
    showToast('Camera orientation reset to default.');
}

// ==========================================================================
// 4. STARFIELD BACKGROUND ENGINE
// ==========================================================================
function initStars() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        stars = [];
        for (let i = 0; i < 240; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 1.6 + 0.3,
                a: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 0.05 + 0.02,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
        ctx.fillStyle = '#05060f';
        ctx.fillRect(0, 0, width, height);

        stars.forEach(s => {
            s.twinkle += s.speed;
            const alpha = s.a * (0.6 + 0.4 * Math.sin(s.twinkle));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 225, 255, ${alpha})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// ==========================================================================
// 5. GLOBAL NAVIGATION & SEARCH ROUTER
// ==========================================================================
function initNav() {
    document.querySelectorAll('.nav-item, .mobile-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            showPage(page);
            const mobileNav = document.getElementById('mobileNav');
            const overlay = document.getElementById('overlay');
            if (mobileNav) mobileNav.classList.remove('open');
            if (overlay) overlay.classList.remove('show');
        });
    });

    const menuBtn = document.getElementById('menuBtn');
    const mobileClose = document.getElementById('mobileClose');
    const overlay = document.getElementById('overlay');
    const mobileNav = document.getElementById('mobileNav');

    if (menuBtn && mobileNav && overlay) {
        menuBtn.addEventListener('click', () => {
            mobileNav.classList.add('open');
            overlay.classList.add('show');
            sound.playClick();
        });
    }
    if (mobileClose && mobileNav && overlay) {
        mobileClose.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            overlay.classList.remove('show');
            sound.playClick();
        });
    }
    if (overlay && mobileNav) {
        overlay.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            overlay.classList.remove('show');
        });
    }

    const audioBtn = document.getElementById('audioToggle');
    if (audioBtn) {
        audioBtn.addEventListener('click', () => {
            sound.muted = !sound.muted;
            audioBtn.textContent = sound.muted ? '🔇' : '🔊';
            showToast(sound.muted ? 'Sound FX Muted' : 'Sound FX Enabled');
        });
    }

    const fsBtn = document.getElementById('fsToggle');
    if (fsBtn) {
        fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        });
    }

    const snapBtn = document.getElementById('snapBtn');
    if (snapBtn) {
        snapBtn.addEventListener('click', () => {
            if (!renderer) {
                showToast('Open any 3D simulation to capture snapshot.');
                return;
            }
            renderer.render(scene, camera);
            const dataUrl = renderer.domElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `ScienceLab3D_${currentPage}_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            sound.playClick();
            showToast('Scientific Snapshot PNG Exported!');
        });
    }

    initGlobalSearch();
}

function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    const dropdown = document.getElementById('searchResults');
    if (!searchInput || !dropdown) return;

    const searchableItems = [
        ...ELEMENTS.slice(0, 30).map(e => ({ title: `${e.name} (${e.s}) - #${e.n}`, cat: 'Element', page: 'elements', action: () => { showPage('elements'); selectElement(e); } })),
        { title: 'Double Slit Wave-Particle Duality', cat: 'Physics Exp', page: 'physics', action: () => { showPage('physics'); loadPhysicsExp('slit'); } },
        { title: 'Black Hole Gravitational Lensing (GR)', cat: 'Physics Exp', page: 'physics', action: () => { showPage('physics'); loadPhysicsExp('blackhole'); } },
        { title: 'Photoelectric Effect (Planck E=hν)', cat: 'Physics Exp', page: 'physics', action: () => { showPage('physics'); loadPhysicsExp('photoelectric'); } },
        { title: 'Nuclear Fission Chain Reaction (U-235)', cat: 'Physics Exp', page: 'physics', action: () => { showPage('physics'); loadPhysicsExp('fission'); } },
        { title: 'Lorenz Strange Attractor Chaos', cat: 'Physics Exp', page: 'physics', action: () => { showPage('physics'); loadPhysicsExp('lorenz'); } },
        { title: 'Chaotic Double Pendulum', cat: 'Physics Exp', page: 'physics', action: () => { showPage('physics'); loadPhysicsExp('double_pendulum'); } },
        { title: 'Superconductivity & Quantum Levitation', cat: 'Physics Exp', page: 'physics', action: () => { showPage('physics'); loadPhysicsExp('superconduct'); } },
        { title: 'CRISPR-Cas9 Gene Surgery', cat: 'Genetics', page: 'dna', action: () => { showPage('dna'); setDnaMode('crispr'); } },
        { title: 'Human Neuron Action Potential', cat: 'Cytology', page: 'cell', action: () => { showPage('cell'); setCellType('neuron'); } },
        { title: 'Solar System & Planetary Orbits', cat: 'Astrophysics', page: 'solar', action: () => { showPage('solar'); } },
        { title: '6-DOF Robot Arm Kinematics', cat: 'Robotics', page: 'robot', action: () => { showPage('robot'); } },
        { title: 'Asteroid Kinetic Deflector 3D Game', cat: 'Arcade', page: 'games', action: () => { showPage('games'); switchGame('space'); } },
        { title: 'Quantum Tunneling Sorter Game', cat: 'Arcade', page: 'games', action: () => { showPage('games'); switchGame('quantum'); } },
        { title: 'Chemical Alchemy Crafter Game', cat: 'Arcade', page: 'games', action: () => { showPage('games'); switchGame('alchemy'); } },
        { title: 'Gravitational Slingshot Game', cat: 'Arcade', page: 'games', action: () => { showPage('games'); switchGame('slingshot'); } }
    ];

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            dropdown.style.display = 'none';
            return;
        }
        const matches = searchableItems.filter(item => item.title.toLowerCase().includes(query) || item.cat.toLowerCase().includes(query)).slice(0, 8);
        if (matches.length === 0) {
            dropdown.innerHTML = '<div style="padding:12px;color:#94a3b8;font-size:12px;">No scientific assets found.</div>';
            dropdown.style.display = 'block';
            return;
        }
        dropdown.innerHTML = matches.map((m, idx) => `
            <div class="search-result-item" data-idx="${idx}">
                <span class="search-item-title">${m.title}</span>
                <span class="search-item-cat">${m.cat}</span>
            </div>
        `).join('');
        dropdown.style.display = 'block';

        dropdown.querySelectorAll('.search-result-item').forEach((el, idx) => {
            el.addEventListener('click', () => {
                matches[idx].action();
                dropdown.style.display = 'none';
                searchInput.value = '';
                sound.playClick();
            });
        });
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function showPage(page) {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item, .mobile-item').forEach(n => n.classList.remove('active'));

    const targetPage = document.getElementById(page);
    if (targetPage) targetPage.classList.add('active');
    document.querySelectorAll(`[data-page="${page}"]`).forEach(n => n.classList.add('active'));

    currentPage = page;
    simTime = 0;
    isPaused = false;
    sound.playClick();

    const inits = {
        elements: initElements,
        solar: initSolar,
        dna: initDNA,
        cell: initCell,
        physics: initPhysics,
        robot: initRobot,
        games: initGames
    };

    if (inits[page]) inits[page]();
}

function goHome() {
    showPage('home');
}

// ==========================================================================
// 6. MODULE 1: 3D PERIODIC TABLE & MOLECULAR FORGE
// ==========================================================================
let elemObjects = [];
let currentElemMode = 'table';
let selectedElementData = ELEMENTS[0];

function initElements() {
    const setup = createScene('elementsScene');
    if (!setup) return;

    camera.position.set(0, 0, 32);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 30);
    scene.add(dirLight);

    initElementCategoryFilter();
    populateAtomDropdown();
    buildPeriodicTable3D();

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (!isPaused) {
            simTime += 0.016;
            const rotSpeed = parseFloat(document.getElementById('elemRotate')?.value || 0.5);

            if (currentElemMode === 'table') {
                elemObjects.forEach(obj => {
                    if (obj.userData.floatOffset !== undefined) {
                        obj.position.z = Math.sin(simTime * 2 + obj.userData.floatOffset) * 0.15;
                    }
                });
            } else if (currentElemMode === 'atom') {
                const atomGroup = scene.getObjectByName('atomModelGroup');
                if (atomGroup) {
                    const speed = parseFloat(document.getElementById('atomSpeed')?.value || 1);
                    atomGroup.children.forEach(child => {
                        if (child.userData.isElectronRing) {
                            child.rotation.z += 0.02 * speed * child.userData.dir;
                            child.rotation.x += 0.01 * speed * child.userData.dir;
                        }
                    });
                }
            } else if (currentElemMode === 'molecule' || currentElemMode === 'lattice') {
                const model = scene.getObjectByName('interactiveModel');
                if (model) {
                    model.rotation.y += 0.008 * rotSpeed;
                    model.rotation.x += 0.003 * rotSpeed;
                }
            } else if (currentElemMode === 'reaction') {
                const rxnModel = scene.getObjectByName('interactiveModel');
                if (rxnModel) {
                    rxnModel.children.forEach(c => {
                        if (c.userData.isSpark) {
                            c.position.y += Math.sin(simTime * 5 + c.userData.offset) * 0.02;
                        }
                    });
                }
            }
        }
        controls.update();
        renderer.render(scene, camera);
        updateTelemetry(elemObjects.length);
    }
    animate();
}

function initElementCategoryFilter() {
    const cats = document.getElementById('cats');
    const search = document.getElementById('elementSearch');
    if (!cats) return;

    cats.querySelectorAll('.chip').forEach(chip => {
        chip.onclick = () => {
            cats.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const cat = chip.dataset.cat;
            filterElements(cat, search ? search.value.trim().toLowerCase() : '');
            sound.playClick();
        };
    });

    if (search) {
        search.oninput = () => {
            const activeChip = cats.querySelector('.chip.active');
            const cat = activeChip ? activeChip.dataset.cat : 'all';
            filterElements(cat, search.value.trim().toLowerCase());
        };
    }
}

function populateAtomDropdown() {
    const select = document.getElementById('atomSelect');
    if (!select) return;
    select.innerHTML = ELEMENTS.map(e => `<option value="${e.n}">#${e.n} ${e.name} (${e.s})</option>`).join('');
    select.onchange = () => {
        const elem = ELEMENTS.find(e => e.n === parseInt(select.value));
        if (elem) buildBohrAtom3D(elem);
    };
}

function filterElements(category, query) {
    elemObjects.forEach(obj => {
        const data = obj.userData.element;
        const matchesCat = category === 'all' || data.cat === category;
        const matchesQuery = !query || data.name.toLowerCase().includes(query) || data.s.toLowerCase().includes(query) || data.n.toString() === query;
        obj.visible = matchesCat && matchesQuery;
    });
}

function buildPeriodicTable3D() {
    disposeHierarchy(scene.getObjectByName('elementsContainer'));
    const container = new THREE.Group();
    container.name = 'elementsContainer';
    elemObjects = [];

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    ELEMENTS.forEach(elem => {
        const pos = getPeriodicPosition(elem);
        const cardGroup = new THREE.Group();
        cardGroup.position.set(pos.x, pos.y, pos.z);
        cardGroup.userData = { element: elem, floatOffset: Math.random() * Math.PI * 2 };

        const tileGeo = new THREE.BoxGeometry(1.35, 1.4, 0.08);
        const tileMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(elem.color),
            metalness: 0.2,
            roughness: 0.35,
            emissive: new THREE.Color(elem.color),
            emissiveIntensity: 0.15
        });
        const tileMesh = new THREE.Mesh(tileGeo, tileMat);
        cardGroup.add(tileMesh);

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = elem.color;
        ctx.lineWidth = 10;
        ctx.strokeRect(6, 6, 244, 244);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 36px monospace';
        ctx.fillText(elem.n, 20, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 88px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(elem.s, 128, 145);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 28px sans-serif';
        ctx.fillText(elem.name, 128, 200);

        ctx.fillStyle = elem.color;
        ctx.font = 'bold 22px monospace';
        ctx.fillText(elem.mass.toFixed(2), 128, 235);

        const tex = new THREE.CanvasTexture(canvas);
        const labelGeo = new THREE.PlaneGeometry(1.25, 1.3);
        const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.z = 0.05;
        cardGroup.add(labelMesh);

        container.add(cardGroup);
        elemObjects.push(cardGroup);
    });

    scene.add(container);

    const dom = renderer.domElement;
    dom.onpointerdown = (e) => {
        const rect = dom.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(elemObjects, true);
        if (intersects.length > 0) {
            let p = intersects[0].object;
            while (p && !p.userData.element && p.parent) p = p.parent;
            if (p && p.userData.element) {
                selectElement(p.userData.element);
            }
        }
    };
}

function selectElement(elem) {
    selectedElementData = elem;
    sound.playQuantumPing();

    const infoBox = document.getElementById('elemInfo');
    const content = document.getElementById('elemInfoContent');
    if (!infoBox || !content) return;

    content.innerHTML = `
        <div class="info-title-wrap">
            <span class="info-title">${elem.name}</span>
            <span class="info-symbol">[ ${elem.s} ]</span>
        </div>
        <span class="info-category">${elem.cat.toUpperCase()} • ATOMIC #${elem.n}</span>
        
        <div class="info-grid">
            <div class="info-stat-card">
                <div class="info-stat-label">Atomic Mass</div>
                <div class="info-stat-value">${elem.mass} u</div>
            </div>
            <div class="info-stat-card">
                <div class="info-stat-label">Electron Config</div>
                <div class="info-stat-value">${elem.config}</div>
            </div>
            <div class="info-stat-card">
                <div class="info-stat-label">Discovered</div>
                <div class="info-stat-value">${elem.found}</div>
            </div>
            <div class="info-stat-card">
                <div class="info-stat-label">Period / Group</div>
                <div class="info-stat-value">P: ${elem.p} | G: ${elem.g}</div>
            </div>
        </div>

        <div class="info-desc-box">
            <strong>Key Applications:</strong> ${elem.use}<br><br>
            <strong>Fascinating Fact:</strong> ${elem.fact}
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:8px;" onclick="setElemMode('atom');buildBohrAtom3D(selectedElementData);">
            ⚛️ Launch 3D Bohr Atom Model
        </button>
    `;
    infoBox.style.display = 'block';
}

function setElemMode(mode) {
    currentElemMode = mode;
    sound.playClick();

    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`elemMode${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    if (btn) btn.classList.add('active');

    const tableCtrl = document.getElementById('elemTableControls');
    const atomCtrl = document.getElementById('elemAtomControls');
    const molCtrl = document.getElementById('elemMoleculeControls');
    const rxnCtrl = document.getElementById('elemReactionControls');
    const latCtrl = document.getElementById('elemLatticeControls');

    if (tableCtrl) tableCtrl.style.display = mode === 'table' ? 'block' : 'none';
    if (atomCtrl) atomCtrl.style.display = mode === 'atom' ? 'block' : 'none';
    if (molCtrl) molCtrl.style.display = mode === 'molecule' ? 'block' : 'none';
    if (rxnCtrl) rxnCtrl.style.display = mode === 'reaction' ? 'block' : 'none';
    if (latCtrl) latCtrl.style.display = mode === 'lattice' ? 'block' : 'none';

    disposeHierarchy(scene.getObjectByName('elementsContainer'));
    disposeHierarchy(scene.getObjectByName('atomModelGroup'));
    disposeHierarchy(scene.getObjectByName('interactiveModel'));

    if (mode === 'table') {
        camera.position.set(0, 0, 32);
        buildPeriodicTable3D();
    } else if (mode === 'atom') {
        camera.position.set(0, 0, 18);
        buildBohrAtom3D(selectedElementData);
    } else if (mode === 'molecule') {
        camera.position.set(0, 0, 16);
        const sel = document.getElementById('moleculeSelect');
        buildMolecule3D(sel ? sel.value : 'water');
    } else if (mode === 'reaction') {
        camera.position.set(0, 0, 20);
        buildChemicalReactionScene('h2_o2');
    } else if (mode === 'lattice') {
        camera.position.set(0, 0, 16);
        buildCrystalLattice3D('fcc');
    }
}

function buildBohrAtom3D(elem) {
    disposeHierarchy(scene.getObjectByName('atomModelGroup'));
    const atomGroup = new THREE.Group();
    atomGroup.name = 'atomModelGroup';

    const nucleusGroup = new THREE.Group();
    const nucleonCount = Math.min(elem.n * 2, 40);
    const nucleonGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const pMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, emissive: 0xef4444, emissiveIntensity: 0.3 });
    const nMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, emissive: 0x3b82f6, emissiveIntensity: 0.3 });

    for (let i = 0; i < nucleonCount; i++) {
        const mesh = new THREE.Mesh(nucleonGeo, i % 2 === 0 ? pMat : nMat);
        const r = Math.pow(Math.random(), 0.5) * 0.9;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        mesh.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
        nucleusGroup.add(mesh);
    }
    atomGroup.add(nucleusGroup);

    let remaining = elem.n;
    const shells = [];
    const maxCapacity = [2, 8, 18, 32, 50];
    for (let cap of maxCapacity) {
        if (remaining <= 0) break;
        const count = Math.min(remaining, cap);
        shells.push(count);
        remaining -= count;
    }

    const electronGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const electronMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8 });

    shells.forEach((electronsInShell, idx) => {
        const radius = 2.2 + idx * 1.6;
        const ringGeo = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2 + (idx * 0.4);
        ring.rotation.y = idx * 0.3;
        ring.userData = { isElectronRing: true, dir: idx % 2 === 0 ? 1 : -1 };

        for (let j = 0; j < electronsInShell; j++) {
            const angle = (j / electronsInShell) * Math.PI * 2;
            const eMesh = new THREE.Mesh(electronGeo, electronMat);
            eMesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
            ring.add(eMesh);
        }
        atomGroup.add(ring);
    });

    scene.add(atomGroup);
    showToast(`Visualizing 3D Bohr Atomic Structure for ${elem.name} (#${elem.n})`);
}

function buildMolecule3D(type) {
    disposeHierarchy(scene.getObjectByName('interactiveModel'));
    const molGroup = new THREE.Group();
    molGroup.name = 'interactiveModel';

    const atomColors = { H: 0xffffff, C: 0x334155, O: 0xef4444, N: 0x3b82f6, S: 0xfacc15, Cl: 0x22c55e, P: 0xf97316 };
    const atomSizes = { H: 0.4, C: 0.75, O: 0.65, N: 0.7, S: 0.9, Cl: 0.85, P: 0.85 };

    const molecules = {
        water: { atoms: [{ t: 'O', p: [0, 0, 0] }, { t: 'H', p: [1.1, 0.8, 0] }, { t: 'H', p: [-1.1, 0.8, 0] }], bonds: [[0, 1], [0, 2]] },
        co2: { atoms: [{ t: 'C', p: [0, 0, 0] }, { t: 'O', p: [-1.8, 0, 0] }, { t: 'O', p: [1.8, 0, 0] }], bonds: [[0, 1], [0, 2]] },
        methane: { atoms: [{ t: 'C', p: [0, 0, 0] }, { t: 'H', p: [1, 1, 1] }, { t: 'H', p: [-1, -1, 1] }, { t: 'H', p: [-1, 1, -1] }, { t: 'H', p: [1, -1, -1] }], bonds: [[0, 1], [0, 2], [0, 3], [0, 4]] },
        ethanol: { atoms: [{ t: 'C', p: [-1.2, 0, 0] }, { t: 'C', p: [0.2, 0, 0] }, { t: 'O', p: [1.3, 0.9, 0] }, { t: 'H', p: [2.1, 0.5, 0] }, { t: 'H', p: [-1.2, 1.1, 0] }, { t: 'H', p: [-1.2, -0.6, 0.9] }, { t: 'H', p: [-2.1, -0.4, 0] }, { t: 'H', p: [0.2, -1.1, 0] }, { t: 'H', p: [0.2, 0.4, -1] }], bonds: [[0, 1], [1, 2], [2, 3], [0, 4], [0, 5], [0, 6], [1, 7], [1, 8]] },
        benzene: { atoms: [
            { t: 'C', p: [2, 0, 0] }, { t: 'C', p: [1, 1.73, 0] }, { t: 'C', p: [-1, 1.73, 0] }, { t: 'C', p: [-2, 0, 0] }, { t: 'C', p: [-1, -1.73, 0] }, { t: 'C', p: [1, -1.73, 0] },
            { t: 'H', p: [3.2, 0, 0] }, { t: 'H', p: [1.6, 2.77, 0] }, { t: 'H', p: [-1.6, 2.77, 0] }, { t: 'H', p: [-3.2, 0, 0] }, { t: 'H', p: [-1.6, -2.77, 0] }, { t: 'H', p: [1.6, -2.77, 0] }
        ], bonds: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]] }
    };

    const data = molecules[type] || molecules.water;
    data.atoms.forEach(a => {
        const radius = atomSizes[a.t] || 0.6;
        const col = atomColors[a.t] || 0xa855f7;
        const geo = new THREE.SphereGeometry(radius, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.2 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(a.p[0], a.p[1], a.p[2]);
        molGroup.add(mesh);
    });

    data.bonds.forEach(b => {
        const p1 = new THREE.Vector3(...data.atoms[b[0]].p);
        const p2 = new THREE.Vector3(...data.atoms[b[1]].p);
        const dist = p1.distanceTo(p2);
        const bondGeo = new THREE.CylinderGeometry(0.12, 0.12, dist, 16);
        const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
        const bondMesh = new THREE.Mesh(bondGeo, bondMat);

        bondMesh.position.copy(p1).add(p2).multiplyScalar(0.5);
        bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
        molGroup.add(bondMesh);
    });

    scene.add(molGroup);
}

function buildChemicalReactionScene(rxnType) {
    disposeHierarchy(scene.getObjectByName('interactiveModel'));
    const rxnGroup = new THREE.Group();
    rxnGroup.name = 'interactiveModel';

    const vessel1Geo = new THREE.CylinderGeometry(2, 2, 4, 32, 1, true);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.1 });
    const vessel1 = new THREE.Mesh(vessel1Geo, glassMat);
    vessel1.position.set(-5, 0, 0);
    rxnGroup.add(vessel1);

    const vessel2 = new THREE.Mesh(vessel1Geo, glassMat);
    vessel2.position.set(5, 0, 0);
    rxnGroup.add(vessel2);

    const tubeGeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.rotation.z = Math.PI / 2;
    tube.position.set(0, 1.5, 0);
    rxnGroup.add(tube);

    for (let i = 0; i < 20; i++) {
        const sparkGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const spark = new THREE.Mesh(sparkGeo, sparkMat);
        spark.position.set((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3);
        spark.userData = { isSpark: true, offset: Math.random() * 10 };
        rxnGroup.add(spark);
    }

    scene.add(rxnGroup);
}

function runChemicalReaction() {
    sound.playExplosion();
    showToast('Exothermic Chemical Reaction Executed! ΔH Released.');
    const tempEl = document.getElementById('rxnTemp');
    if (tempEl) {
        let temp = 298;
        const interval = setInterval(() => {
            temp += 150;
            tempEl.textContent = `${temp} K`;
            if (temp >= 1450) {
                clearInterval(interval);
                setTimeout(() => { tempEl.textContent = '298 K'; }, 3000);
            }
        }, 100);
    }
}

function buildCrystalLattice3D(latticeType) {
    disposeHierarchy(scene.getObjectByName('interactiveModel'));
    const latGroup = new THREE.Group();
    latGroup.name = 'interactiveModel';

    const sphereGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.3 });

    const spacing = 1.8;
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                const corner = new THREE.Mesh(sphereGeo, goldMat);
                corner.position.set(x * spacing, y * spacing, z * spacing);
                latGroup.add(corner);

                if (latticeType === 'fcc' && x < 1 && y < 1) {
                    const face = new THREE.Mesh(sphereGeo, silverMat);
                    face.position.set((x + 0.5) * spacing, (y + 0.5) * spacing, z * spacing);
                    latGroup.add(face);
                } else if (latticeType === 'bcc' && x < 1 && y < 1 && z < 1) {
                    const body = new THREE.Mesh(sphereGeo, silverMat);
                    body.position.set((x + 0.5) * spacing, (y + 0.5) * spacing, (z + 0.5) * spacing);
                    latGroup.add(body);
                }
            }
        }
    }
    scene.add(latGroup);
}

// ==========================================================================
// 7. MODULE 2: ASTROPHYSICS & SOLAR SYSTEM SIMULATION
// ==========================================================================
const PLANETS = [
    { name: 'Sun', r: 3.2, dist: 0, speed: 0, rot: 0.002, col: 0xffaa00, glow: true, info: 'G-type main-sequence star. 99.86% Solar System mass.' },
    { name: 'Mercury', r: 0.38, dist: 6, speed: 4.1, rot: 0.004, col: 0x94a3b8, info: 'Smallest planet. Temps: -180°C to 430°C.' },
    { name: 'Venus', r: 0.85, dist: 9, speed: 1.6, rot: -0.002, col: 0xf59e0b, info: 'Hottest planet (465°C) with runaway CO2 greenhouse atmosphere.' },
    { name: 'Earth', r: 0.9, dist: 13, speed: 1.0, rot: 0.02, col: 0x38bdf8, info: 'Only known haven for life. 71% surface liquid water.', hasMoon: true },
    { name: 'Mars', r: 0.52, dist: 17, speed: 0.53, rot: 0.018, col: 0xef4444, info: 'Red planet. Home to Olympus Mons (22 km high volcano).' },
    { name: 'Jupiter', r: 2.2, dist: 25, speed: 0.24, rot: 0.04, col: 0xd97706, info: 'Gas giant with Great Red Spot & 95 known moons.', hasMoons: 4 },
    { name: 'Saturn', r: 1.8, dist: 34, speed: 0.12, rot: 0.038, col: 0xfde047, rings: true, info: 'Spectacular planetary ring system composed of water ice.' },
    { name: 'Uranus', r: 1.2, dist: 43, speed: 0.06, rot: -0.02, col: 0x67e8f9, info: 'Ice giant with extreme 98° axial tilt.' },
    { name: 'Neptune', r: 1.15, dist: 52, speed: 0.03, rot: 0.03, col: 0x3b82f6, info: 'Farthest planet. Supersonic winds reaching 2,100 km/h.' }
];

let celestialMeshes = [];

function initSolar() {
    const setup = createScene('solarScene');
    if (!setup) return;

    camera.position.set(0, 45, 75);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const sunLight = new THREE.PointLight(0xffffff, 2.5, 300);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    buildSolarSystem();

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (!isPaused) {
            const speedMultiplier = parseFloat(document.getElementById('solarSpeed')?.value || 1);
            simTime += 0.01 * speedMultiplier;

            celestialMeshes.forEach(item => {
                if (item.data.speed > 0) {
                    const angle = simTime * item.data.speed * 0.3;
                    item.group.position.x = Math.cos(angle) * item.data.dist;
                    item.group.position.z = Math.sin(angle) * item.data.dist;
                }
                if (item.planetMesh) {
                    item.planetMesh.rotation.y += item.data.rot;
                }
                if (item.moons) {
                    item.moons.forEach(m => {
                        const mAngle = simTime * m.speed * 2;
                        m.mesh.position.x = Math.cos(mAngle) * m.dist;
                        m.mesh.position.z = Math.sin(mAngle) * m.dist;
                    });
                }
            });

            const asteroidPoints = scene.getObjectByName('asteroidBelt');
            if (asteroidPoints) asteroidPoints.rotation.y += 0.001 * speedMultiplier;
        }

        controls.update();
        renderer.render(scene, camera);
        updateTelemetry(3200);
    }
    animate();
}

function buildSolarSystem() {
    disposeHierarchy(scene.getObjectByName('solarSystemGroup'));
    const solarGroup = new THREE.Group();
    solarGroup.name = 'solarSystemGroup';
    celestialMeshes = [];

    PLANETS.forEach(p => {
        const pGroup = new THREE.Group();
        pGroup.position.x = p.dist;

        const geo = new THREE.SphereGeometry(p.r, 32, 32);
        const mat = p.glow
            ? new THREE.MeshBasicMaterial({ color: p.col })
            : new THREE.MeshStandardMaterial({ color: p.col, roughness: 0.6, metalness: 0.1 });
        const planetMesh = new THREE.Mesh(geo, mat);
        pGroup.add(planetMesh);

        if (p.glow) {
            const glowGeo = new THREE.SphereGeometry(p.r * 1.25, 32, 32);
            const glowMat = new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.35, side: THREE.BackSide });
            pGroup.add(new THREE.Mesh(glowGeo, glowMat));
        }

        if (p.rings) {
            const ringGeo = new THREE.RingGeometry(p.r * 1.4, p.r * 2.4, 64);
            const ringMat = new THREE.MeshStandardMaterial({ color: 0xe2d4b7, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.rotation.x = Math.PI / 2.5;
            pGroup.add(ringMesh);
        }

        const moons = [];
        if (p.hasMoon) {
            const moonGeo = new THREE.SphereGeometry(0.22, 16, 16);
            const moonMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.8 });
            const moonMesh = new THREE.Mesh(moonGeo, moonMat);
            moonMesh.position.x = 1.6;
            pGroup.add(moonMesh);
            moons.push({ mesh: moonMesh, dist: 1.6, speed: 1.5 });
        }

        if (p.dist > 0) {
            const orbitGeo = new THREE.RingGeometry(p.dist - 0.04, p.dist + 0.04, 128);
            const orbitMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.18 });
            const orbitLine = new THREE.Mesh(orbitGeo, orbitMat);
            orbitLine.rotation.x = Math.PI / 2;
            solarGroup.add(orbitLine);
        }

        solarGroup.add(pGroup);
        celestialMeshes.push({ group: pGroup, planetMesh, data: p, moons });
    });

    const asteroidGeo = new THREE.BufferGeometry();
    const asteroidPositions = [];
    for (let i = 0; i < 3000; i++) {
        const r = 19.5 + Math.random() * 3.5;
        const theta = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * 1.2;
        asteroidPositions.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
    }
    asteroidGeo.setAttribute('position', new THREE.BufferAttribute(asteroidPositions, 3));
    const asteroidMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.25, transparent: true, opacity: 0.7 });
    const asteroidPoints = new THREE.Points(asteroidGeo, asteroidMat);
    asteroidPoints.name = 'asteroidBelt';
    solarGroup.add(asteroidPoints);

    scene.add(solarGroup);
}

function focusCelestial(name) {
    sound.playClick();
    if (name === 'overview') {
        controls.target.set(0, 0, 0);
        camera.position.set(0, 45, 75);
        return;
    }
    const item = celestialMeshes.find(c => c.data.name === name);
    if (item) {
        controls.target.copy(item.group.position);
        camera.position.set(item.group.position.x + item.data.r * 4, item.group.position.y + item.data.r * 2, item.group.position.z + item.data.r * 4);

        const infoBox = document.getElementById('solarInfo');
        const content = document.getElementById('solarInfoContent');
        if (infoBox && content) {
            content.innerHTML = `
                <div class="info-title-wrap">
                    <span class="info-title">${item.data.name}</span>
                </div>
                <div class="info-desc-box">${item.data.info}</div>
                <div class="info-grid">
                    <div class="info-stat-card"><div class="info-stat-label">Radius</div><div class="info-stat-value">${(item.data.r * 6371).toFixed(0)} km</div></div>
                    <div class="info-stat-card"><div class="info-stat-label">Orbital Velocity</div><div class="info-stat-value">${(item.data.speed * 29.8).toFixed(1)} km/s</div></div>
                </div>
            `;
            infoBox.style.display = 'block';
        }
    }
}

function toggleSolarPlay() {
    isPaused = !isPaused;
    const btn = document.getElementById('solarPlay');
    if (btn) btn.textContent = isPaused ? '▶ Play' : '⏸ Pause';
    sound.playClick();
}

function resetSolar() {
    simTime = 0;
    focusCelestial('overview');
    showToast('Solar System simulation reset.');
}

// ==========================================================================
// 8. MODULE 3: GENETICS & CRISPR-CAS9 GENOME SURGERY
// ==========================================================================
let dnaMode = 'dna';
let dnaAnim = 'rotate';

function initDNA() {
    const setup = createScene('dnaScene');
    if (!setup) return;

    camera.position.set(0, 0, 22);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const pointLight = new THREE.PointLight(0xffffff, 1.2, 100);
    pointLight.position.set(10, 20, 20);
    scene.add(pointLight);

    buildDnaHelix();

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (!isPaused) {
            const speed = parseFloat(document.getElementById('dnaSpeed')?.value || 1);
            simTime += 0.02 * speed;

            const model = scene.getObjectByName('dnaModel');
            if (model) {
                if (dnaAnim === 'rotate') {
                    model.rotation.y = simTime;
                } else if (dnaAnim === 'replicate') {
                    model.rotation.y = simTime * 0.5;
                    model.children.forEach(child => {
                        if (child.userData.strand === 'left') {
                            child.position.x = -Math.sin(simTime) * 1.5;
                        } else if (child.userData.strand === 'right') {
                            child.position.x = Math.sin(simTime) * 1.5;
                        }
                    });
                }
            }
        }
        controls.update();
        renderer.render(scene, camera);
        updateTelemetry(480);
    }
    animate();
}

function buildDnaHelix() {
    disposeHierarchy(scene.getObjectByName('dnaModel'));
    const dnaGroup = new THREE.Group();
    dnaGroup.name = 'dnaModel';

    const turns = parseInt(document.getElementById('dnaTurns')?.value || 3);
    const numPairs = turns * 10;
    const baseColors = [0xff5252, 0x40c4ff, 0x69f0ae, 0xffd740];
    const sphereGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const backboneMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.3, roughness: 0.4 });

    for (let i = 0; i < numPairs; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const y = (i - numPairs / 2) * 0.7;
        const radius = 2.5;

        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        const x2 = -x1;
        const z2 = -z1;

        const s1 = new THREE.Mesh(sphereGeo, backboneMat);
        s1.position.set(x1, y, z1);
        s1.userData = { strand: 'left' };
        dnaGroup.add(s1);

        const s2 = new THREE.Mesh(sphereGeo, backboneMat);
        s2.position.set(x2, y, z2);
        s2.userData = { strand: 'right' };
        dnaGroup.add(s2);

        const p1 = new THREE.Vector3(x1, y, z1);
        const p2 = new THREE.Vector3(x2, y, z2);
        const mid = p1.clone().add(p2).multiplyScalar(0.5);

        const col1 = baseColors[i % 4];
        const col2 = baseColors[(i + 1) % 4];

        const bGeo1 = new THREE.CylinderGeometry(0.12, 0.12, radius, 12);
        const bMat1 = new THREE.MeshStandardMaterial({ color: col1, roughness: 0.3 });
        const bMesh1 = new THREE.Mesh(bGeo1, bMat1);
        bMesh1.position.copy(p1).add(mid).multiplyScalar(0.5);
        bMesh1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), mid.clone().sub(p1).normalize());
        dnaGroup.add(bMesh1);

        const bGeo2 = new THREE.CylinderGeometry(0.12, 0.12, radius, 12);
        const bMat2 = new THREE.MeshStandardMaterial({ color: col2, roughness: 0.3 });
        const bMesh2 = new THREE.Mesh(bGeo2, bMat2);
        bMesh2.position.copy(mid).add(p2).multiplyScalar(0.5);
        bMesh2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(mid).normalize());
        dnaGroup.add(bMesh2);
    }

    scene.add(dnaGroup);
}

function setDnaMode(mode) {
    dnaMode = mode;
    sound.playClick();
    document.querySelectorAll('#dna .mode-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`dnaMode${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    if (btn) btn.classList.add('active');

    const crisprCtrl = document.getElementById('dnaCrisprControls');
    const virusCtrl = document.getElementById('dnaVirusControls');
    if (crisprCtrl) crisprCtrl.style.display = mode === 'crispr' ? 'block' : 'none';
    if (virusCtrl) virusCtrl.style.display = mode === 'virus' ? 'block' : 'none';

    if (mode === 'crispr') {
        buildCrisprScene();
    } else if (mode === 'virus') {
        buildVirusCapsid('Bacteriophage');
    } else {
        buildDnaHelix();
    }
}

function setDnaAnim(anim) {
    dnaAnim = anim;
    sound.playClick();
    document.querySelectorAll('#dna .ctrl-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`dnaAnim${anim.charAt(0).toUpperCase() + anim.slice(1)}`);
    if (btn) btn.classList.add('active');
}

function buildCrisprScene() {
    disposeHierarchy(scene.getObjectByName('dnaModel'));
    const crisprGroup = new THREE.Group();
    crisprGroup.name = 'dnaModel';

    buildDnaHelix();

    const cas9Geo = new THREE.DodecahedronGeometry(3.5, 1);
    const cas9Mat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.4, transparent: true, opacity: 0.85 });
    const cas9Mesh = new THREE.Mesh(cas9Geo, cas9Mat);
    cas9Mesh.position.set(0, 0, 0);
    crisprGroup.add(cas9Mesh);

    scene.add(crisprGroup);
    showToast('CRISPR-Cas9 sgRNA Guide Complex docked to PAM sequence.');
}

function runCrisprCut() {
    sound.playExplosion();
    showToast('✂️ Cas9 Endonuclease cleaved target double strand! DSB break created.');
}

function buildVirusCapsid(virusType) {
    disposeHierarchy(scene.getObjectByName('dnaModel'));
    const virusGroup = new THREE.Group();
    virusGroup.name = 'dnaModel';

    if (virusType === 'Bacteriophage') {
        const headGeo = new THREE.IcosahedronGeometry(2.5, 0);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 3;
        virusGroup.add(head);

        const neckGeo = new THREE.CylinderGeometry(0.5, 0.5, 3.5, 16);
        const neckMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
        const neck = new THREE.Mesh(neckGeo, neckMat);
        neck.position.y = 0.5;
        virusGroup.add(neck);

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8);
            const legMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(Math.cos(angle) * 1.2, -1.8, Math.sin(angle) * 1.2);
            leg.rotation.z = Math.cos(angle) * 0.5;
            leg.rotation.x = Math.sin(angle) * 0.5;
            virusGroup.add(leg);
        }
    } else {
        const bodyGeo = new THREE.SphereGeometry(2.5, 32, 32);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
        virusGroup.add(new THREE.Mesh(bodyGeo, bodyMat));

        for (let i = 0; i < 48; i++) {
            const spikeGeo = new THREE.CylinderGeometry(0.1, 0.25, 1.2, 8);
            const spikeMat = new THREE.MeshStandardMaterial({ color: 0xffd740 });
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const pos = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)).multiplyScalar(2.6);
            spike.position.copy(pos);
            spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
            virusGroup.add(spike);
        }
    }

    scene.add(virusGroup);
}

function setVirusType(vType) {
    buildVirusCapsid(vType);
    sound.playClick();
}

// ==========================================================================
// 9. MODULE 4: CYTOLOGY & NEUROBIOLOGY LAB (ANATOMICALLY PRECISE)
// ==========================================================================
let cellType = 'animal';
let cellAnim = 'rotate';
let mitosisStage = 1;
let cellOrganelles = [];
let actionPotentialActive = false;
let apProgress = 0;
let synapseParticles = [];

const ORGANELLE_DATA = {
    nucleus: { name: 'Nucleus & Nucleolus', role: 'Genomic Command Center', size: '5–10 μm', desc: 'Houses double-stranded chromatin DNA, nuclear pores for mRNA export, and a dense nucleolus for rRNA transcription and ribosomal subunit assembly.' },
    nucleolus: { name: 'Nucleolus', role: 'Ribosome Biogenesis', size: '1–2 μm', desc: 'Dense non-membrane-bound subnuclear structure where rRNA is transcribed and assembled with ribosomal proteins.' },
    mitochondria: { name: 'Mitochondrion (with Cristae)', role: 'ATP Synthesis & Respiration', size: '1–4 μm', desc: 'Double-membraned organelle with folded inner cristae maximizing surface area for the Electron Transport Chain and ATP Synthase.' },
    er_rough: { name: 'Rough Endoplasmic Reticulum', role: 'Secretory Protein Synthesis', size: '0.2–1 μm folds', desc: 'Interconnected flattened cisternae studded with membrane-bound 80S ribosomes synthesizing transmembrane and export proteins.' },
    er_smooth: { name: 'Smooth Endoplasmic Reticulum', role: 'Lipid & Steroid Biosynthesis', size: '0.1–0.5 μm tubules', desc: 'Network of smooth tubular membranes synthesizing phospholipids, cholesterol, and steroid hormones, while sequestering Ca²⁺ ions.' },
    golgi: { name: 'Golgi Apparatus & Dictyosomes', role: 'Post-Translational Packaging', size: '1–3 μm stack', desc: 'Polarized cisternae (cis-entry face to trans-exit face) modifying proteins via glycosylation and packaging them into clathrin-coated vesicles.' },
    lysosome: { name: 'Lysosome & Peroxisome', role: 'Autophagy & Waste Degradation', size: '0.1–1.2 μm', desc: 'Membrane-bound acidic vesicles packed with ~50 hydrolytic acid hydrolases and catalase for breaking down cellular debris and peroxides.' },
    centrosome: { name: 'Centrosome (Orthogonal Centrioles)', role: 'Microtubule Organizing Center', size: '0.4 μm', desc: 'Pair of perpendicular barrel-shaped centrioles made of 9 microtubule triplets (9x3 pattern) orchestrating the mitotic spindle.' },
    chloroplast: { name: 'Chloroplast (Thylakoid Grana)', role: 'Photosynthesis & Carbon Fixation', size: '5–8 μm', desc: 'Double-membraned plastid containing stroma, stacked coin-like thylakoid grana with chlorophyll photosystems, and rubisco for the Calvin cycle.' },
    vacuole: { name: 'Large Central Vacuole', role: 'Turgor Pressure & Cell Rigidity', size: '70–90% of plant volume', desc: 'Massive tonoplast-enclosed fluid reservoir maintaining hydrostatic turgor pressure against the cell wall to keep plant tissue upright.' },
    cell_wall: { name: 'Plant Cellulose Cell Wall', role: 'Structural Tensile Strength', size: '0.1–10 μm thick', desc: 'Rigid extracellular matrix composed of cross-linked cellulose microfibrils, hemicellulose, and pectin providing tensile support against osmotic lysis.' },
    soma: { name: 'Neuron Soma & Nissl Granules', role: 'Somatic Signal Integration', size: '20–50 μm', desc: 'Cell body containing nucleus, Golgi, and dense rough ER (Nissl bodies) integrating incoming synaptic post-synaptic potentials.' },
    dendrite: { name: 'Dendritic Tree & Spines', role: 'Synaptic Signal Reception', size: '100–500 μm arbor', desc: 'Extensive bifurcating branches studded with actin-rich mushroom dendritic spines receiving chemical inputs from upstream axons.' },
    axon: { name: 'Myelinated Axon & Nodes of Ranvier', role: 'Saltatory Conduction Highway', size: 'Up to 1 meter', desc: 'Cylindrical axon insulated by myelin Schwann cell sheaths; action potentials jump between uninsulated Nodes of Ranvier at up to 120 m/s.' },
    synapse: { name: 'Synaptic Bouton & Synaptic Cleft', role: 'Chemical Neurotransmission', size: '20–40 nm cleft', desc: 'Presynaptic terminal knob packed with synaptic vesicles that undergo SNARE-mediated exocytosis releasing acetylcholine / glutamate into the cleft.' },
    nucleoid: { name: 'Bacterial Nucleoid DNA', role: 'Prokaryotic Chromosome', size: '1–2 μm condensed', desc: 'Supercoiled, non-membrane-bound single circular double-stranded DNA molecule containing the essential bacterial genome.' },
    plasmid: { name: 'Bacterial Plasmids', role: 'Autonomous Extrachromosomal DNA', size: '1–200 kbp', desc: 'Small autonomous circular DNA rings often conferring antibiotic resistance and virulence factors transferred via conjugation.' },
    flagellum: { name: 'Helical Flagellum & Rotary Motor', role: 'Proton-Driven Motility', size: '15–20 μm filament', desc: 'Rigid flagellin helix anchored to a basal rotary motor embedded in the cell envelope, spinning at up to 1,000 RPM for run-and-tumble chemotaxis.' },
    atp_synthase: { name: 'F₀F₁ ATP Synthase Complex', role: 'Rotary Catalytic Nanomachine', size: '10 nm turbine', desc: 'Proton flow down the electrochemical gradient across the inner mitochondrial membrane drives rotation of the c-ring rotor and γ-shaft, synthesizing ATP in the α₃β₃ stator head.' }
};

function initCell() {
    const setup = createScene('cellScene');
    if (!setup) return;

    camera.position.set(0, 3, 24);
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 25, 20);
    scene.add(dirLight);

    initCellRaycaster();
    buildCellModel();

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (!isPaused) {
            const speed = parseFloat(document.getElementById('cellSpeed')?.value ?? 0.5);
            simTime += 0.01 * speed;

            const model = scene.getObjectByName('cellModel');
            if (model) {
                if (cellAnim === 'rotate') {
                    model.rotation.y += 0.004 * speed;
                    model.rotation.x = 0; // Keep upright and steady (no pitch/wobble)
                } else if (cellAnim === 'explode') {
                    model.rotation.y += 0.002 * speed;
                    model.rotation.x = 0;
                } else if (cellAnim === 'mitosis') {
                    model.rotation.y += 0.002 * speed;
                    model.rotation.x = 0;
                }
            }

            // 1. Precise F₀F₁ ATP Synthase Rotor (Central γ-shaft & c-ring spin smoothly along Y-axis)
            if (cellType === 'mitochondria') {
                const rotor = scene.getObjectByName('atpShaftRotor');
                const protVal = parseFloat(document.getElementById('mitoProtons')?.value || 3);
                if (rotor) rotor.rotation.y += 0.05 * protVal;
            }

            // 2. Precise Bacterial Flagellum (True corkscrew rotation strictly along longitudinal X-axis)
            if (cellType === 'bacteria') {
                const flagellum = scene.getObjectByName('bactFlagellum');
                const motorRpm = parseFloat(document.getElementById('bacteriaMotor')?.value || 70);
                if (flagellum) {
                    flagellum.rotation.x += 0.08 * (motorRpm / 50); // Axial corkscrew rotation
                    flagellum.rotation.y = 0;
                    flagellum.rotation.z = 0;
                }
            }

            // 3. Animate Neuron Action Potential & Synaptic Vesicles
            if (actionPotentialActive) {
                apProgress += 0.025;
                const apWave = scene.getObjectByName('apPulseWave');
                if (apWave) {
                    apWave.position.x = -6 + apProgress * 15;
                    apWave.scale.setScalar(1 + Math.sin(apProgress * Math.PI) * 0.6);
                }

                synapseParticles.forEach(p => {
                    p.position.x += 0.06;
                    p.position.y += (Math.random() - 0.5) * 0.03;
                });

                if (apProgress >= 1.0) {
                    actionPotentialActive = false;
                    if (apWave) apWave.visible = false;
                    const synEl = document.getElementById('synapseStatus');
                    if (synEl) synEl.textContent = 'Transmitters Bound to Post-Synaptic Receptors';
                }
            }
        }
        controls.update();
        renderer.render(scene, camera);
        updateTelemetry(cellOrganelles.length * 20 + 300);
    }
    animate();
}

function initCellRaycaster() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dom = renderer.domElement;

    dom.onpointerdown = (e) => {
        const rect = dom.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(cellOrganelles, true);
        if (intersects.length > 0) {
            let p = intersects[0].object;
            while (p && !p.userData.organelleKey && p.parent) p = p.parent;
            if (p && p.userData.organelleKey) {
                inspectOrganelle(p.userData.organelleKey);
            }
        }
    };
}

function inspectOrganelle(key) {
    const data = ORGANELLE_DATA[key];
    if (!data) return;
    sound.playQuantumPing();

    const infoBox = document.getElementById('cellInfo');
    const content = document.getElementById('cellInfoContent');
    if (!infoBox || !content) return;

    content.innerHTML = `
        <div class="info-title-wrap">
            <span class="info-title">${data.name}</span>
        </div>
        <span class="info-category">${data.role.toUpperCase()}</span>
        
        <div class="info-desc-box">${data.desc}</div>

        <div class="info-grid">
            <div class="info-stat-card">
                <div class="info-stat-label">Typical Scale</div>
                <div class="info-stat-value">${data.size}</div>
            </div>
            <div class="info-stat-card">
                <div class="info-stat-label">Physiological State</div>
                <div class="info-stat-value text-emerald">Active In Vivo</div>
            </div>
        </div>
    `;
    infoBox.style.display = 'block';
}

function buildCellModel() {
    disposeHierarchy(scene.getObjectByName('cellModel'));
    cellOrganelles = [];
    synapseParticles = [];
    const cellGroup = new THREE.Group();
    cellGroup.name = 'cellModel';

    if (cellAnim === 'mitosis') {
        buildMitosisStage3D(cellGroup, mitosisStage);
    } else if (cellType === 'animal') {
        camera.position.set(0, 3, 24);
        buildAnimalCell3D(cellGroup, cellAnim === 'explode');
    } else if (cellType === 'plant') {
        camera.position.set(0, 3, 25);
        buildPlantCell3D(cellGroup, cellAnim === 'explode');
    } else if (cellType === 'neuron') {
        camera.position.set(0, 1, 24);
        buildNeuron3D(cellGroup);
    } else if (cellType === 'bacteria') {
        camera.position.set(0, 2, 22);
        buildBacteria3D(cellGroup);
    } else if (cellType === 'mitochondria') {
        camera.position.set(0, 0, 18);
        buildMitochondriaAtp3D(cellGroup);
    }

    scene.add(cellGroup);
}

// --------------------------------------------------------------------------
// 1. ANIMAL CELL (3/4 Cutaway Hemisphere with Organelles)
// --------------------------------------------------------------------------
function buildAnimalCell3D(group, isExploded = false) {
    const explodeDist = isExploded ? 2.2 : 1.0;

    // Translucent Cutaway Plasma Membrane (Hemispherical Bowl)
    const memGeo = new THREE.SphereGeometry(6.0, 32, 32, 0, Math.PI * 1.5, 0, Math.PI * 0.85);
    const memMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: isExploded ? 0.12 : 0.3,
        roughness: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    group.add(new THREE.Mesh(memGeo, memMat));

    // Cytoplasm Translucent Bed
    const cytoGeo = new THREE.CylinderGeometry(5.8, 5.0, 0.4, 32);
    const cytoMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.25, depthWrite: false });
    const cyto = new THREE.Mesh(cytoGeo, cytoMat);
    cyto.position.y = -1.2;
    group.add(cyto);

    // Nucleus (Cutaway Sphere with Chromatin & Nucleolus)
    const nucGroup = new THREE.Group();
    nucGroup.position.set(0, 0, 0);
    nucGroup.userData = { organelleKey: 'nucleus' };

    // Outer Purple Nuclear Envelope
    const nucGeo = new THREE.SphereGeometry(2.0, 24, 24, 0, Math.PI * 1.5, 0, Math.PI);
    const nucMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.4, side: THREE.DoubleSide });
    nucGroup.add(new THREE.Mesh(nucGeo, nucMat));

    // Inner Dark Chromatin Core
    const chromGeo = new THREE.SphereGeometry(1.6, 20, 20);
    const chromMat = new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.5 });
    nucGroup.add(new THREE.Mesh(chromGeo, chromMat));

    // Dense Nucleolus Sphere
    const nucL = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.3 }));
    nucL.position.set(0.4, 0.4, 0.4);
    nucL.userData = { organelleKey: 'nucleolus' };
    nucGroup.add(nucL);
    group.add(nucGroup);
    cellOrganelles.push(nucGroup);

    // Rough Endoplasmic Reticulum (Concentric Folded Cisternae with Ribosomes)
    const rerGroup = new THREE.Group();
    rerGroup.position.set(-2.8 * explodeDist, 0.6 * explodeDist, 0);
    rerGroup.userData = { organelleKey: 'er_rough' };
    for (let r = 0; r < 4; r++) {
        const fold = new THREE.Mesh(new THREE.TorusGeometry(1.5 + r * 0.45, 0.16, 8, 32, Math.PI * 0.9), new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 }));
        fold.rotation.z = Math.PI / 4 + r * 0.1;
        rerGroup.add(fold);

        // Studded 80S Ribosomes on RER
        for (let b = 0; b < 12; b++) {
            const ribo = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
            const angle = (b / 12) * Math.PI * 0.9;
            ribo.position.set(Math.cos(angle) * (1.5 + r * 0.45), Math.sin(angle) * (1.5 + r * 0.45), 0.15);
            rerGroup.add(ribo);
        }
    }
    group.add(rerGroup);
    cellOrganelles.push(rerGroup);

    // Smooth Endoplasmic Reticulum (Tubular Network)
    const serGroup = new THREE.Group();
    serGroup.position.set(-3.5 * explodeDist, -1.8 * explodeDist, 0.8 * explodeDist);
    serGroup.userData = { organelleKey: 'er_smooth' };
    for (let s = 0; s < 5; s++) {
        const tube = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 6, 16), new THREE.MeshStandardMaterial({ color: 0x60a5fa }));
        tube.position.set((s % 2) * 0.5, Math.floor(s / 2) * 0.5, (s % 3) * 0.3);
        tube.rotation.x = Math.random() * Math.PI;
        serGroup.add(tube);
    }
    group.add(serGroup);
    cellOrganelles.push(serGroup);

    // Golgi Apparatus (Curved Stack of Cisternae with Budding Vesicles)
    const golgiGroup = new THREE.Group();
    golgiGroup.position.set(3.0 * explodeDist, -1.2 * explodeDist, 0.8 * explodeDist);
    golgiGroup.userData = { organelleKey: 'golgi' };
    for (let g = 0; g < 5; g++) {
        const cisterna = new THREE.Mesh(new THREE.CylinderGeometry(1.8 - g * 0.25, 1.8 - g * 0.25, 0.15, 24), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }));
        cisterna.position.y = g * 0.32;
        cisterna.rotation.z = 0.2;
        golgiGroup.add(cisterna);
    }
    // Budding Transport Vesicles
    for (let v = 0; v < 8; v++) {
        const ves = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfbbf24 }));
        ves.position.set((Math.random() - 0.5) * 2.5, 0.6 + Math.random() * 1.0, (Math.random() - 0.5) * 1.8);
        golgiGroup.add(ves);
    }
    group.add(golgiGroup);
    cellOrganelles.push(golgiGroup);

    // 4 Mitochondria with Cutaway Folded Cristae
    const mitoPositions = [
        [-2.4 * explodeDist, -2.6 * explodeDist, 1.4 * explodeDist],
        [3.0 * explodeDist, 2.2 * explodeDist, -1.4 * explodeDist],
        [-1.2 * explodeDist, 3.4 * explodeDist, 1.6 * explodeDist],
        [2.0 * explodeDist, -3.0 * explodeDist, -1.8 * explodeDist]
    ];
    mitoPositions.forEach(pos => {
        const mito = new THREE.Group();
        mito.position.set(...pos);
        mito.userData = { organelleKey: 'mitochondria' };

        // Outer smooth capsule
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.6, 16), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }));
        body.rotation.x = 0.5;
        body.rotation.y = 0.3;
        mito.add(body);

        // Folded inner cristae ridges
        for (let c = -0.6; c <= 0.6; c += 0.3) {
            const fold = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.08, 6, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0xfbbf24 }));
            fold.position.y = c;
            mito.add(fold);
        }
        group.add(mito);
        cellOrganelles.push(mito);
    });

    // Centrosome (Two Perpendicular 9x3 Centrioles)
    const centroGroup = new THREE.Group();
    centroGroup.position.set(0.6 * explodeDist, 2.8 * explodeDist, 0);
    centroGroup.userData = { organelleKey: 'centrosome' };

    const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.0, 9, 1, true), new THREE.MeshStandardMaterial({ color: 0xec4899, wireframe: true }));
    const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.0, 9, 1, true), new THREE.MeshStandardMaterial({ color: 0xec4899, wireframe: true }));
    c2.rotation.x = Math.PI / 2;
    centroGroup.add(c1);
    centroGroup.add(c2);
    group.add(centroGroup);
    cellOrganelles.push(centroGroup);

    // Lysosomes & Peroxisomes
    for (let l = 0; l < 8; l++) {
        const lyso = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2 }));
        lyso.position.set((Math.random() - 0.5) * 6 * explodeDist, (Math.random() - 0.5) * 5 * explodeDist, (Math.random() - 0.5) * 5 * explodeDist);
        lyso.userData = { organelleKey: 'lysosome' };
        group.add(lyso);
        cellOrganelles.push(lyso);
    }
}

// --------------------------------------------------------------------------
// 2. PLANT CELL (Hexagonal Prism Box with Massive Central Vacuole & Chloroplasts)
// --------------------------------------------------------------------------
function buildPlantCell3D(group, isExploded = false) {
    const explodeDist = isExploded ? 2.2 : 1.0;

    // Rigid Hexagonal/Rectangular Plant Cell Wall (Open 3-Sided Cutaway Box)
    const w = 9.5, h = 8.5, d = 7.5;
    const wallGroup = new THREE.Group();
    wallGroup.userData = { organelleKey: 'cell_wall' };

    // Emerald Green Cellulose Microfibril Wall Beams
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 });
    const cornerThick = 0.4;
    const beams = [
        { p: [0, -h/2, -d/2], s: [w, cornerThick, cornerThick] },
        { p: [0, h/2, -d/2], s: [w, cornerThick, cornerThick] },
        { p: [-w/2, 0, -d/2], s: [cornerThick, h, cornerThick] },
        { p: [w/2, 0, -d/2], s: [cornerThick, h, cornerThick] },
        { p: [-w/2, -h/2, 0], s: [cornerThick, cornerThick, d] },
        { p: [w/2, -h/2, 0], s: [cornerThick, cornerThick, d] }
    ];
    beams.forEach(b => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...b.s), beamMat);
        mesh.position.set(...b.p);
        wallGroup.add(mesh);
    });

    // Translucent Back & Floor Cellulose Plates
    const backPlate = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0x22c55e, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
    backPlate.position.set(0, 0, -d/2);
    wallGroup.add(backPlate);

    const floorPlate = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: 0x16a34a, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
    floorPlate.position.set(0, -h/2, 0);
    floorPlate.rotation.x = Math.PI / 2;
    wallGroup.add(floorPlate);

    group.add(wallGroup);
    cellOrganelles.push(wallGroup);

    // GIGANTIC CENTRAL VACUOLE (Occupies 75% of volume in center)
    const vacGroup = new THREE.Group();
    vacGroup.position.set(0.6 * explodeDist, -0.4 * explodeDist, 0);
    vacGroup.userData = { organelleKey: 'vacuole' };

    const vacMesh = new THREE.Mesh(
        new THREE.SphereGeometry(3.2, 32, 32),
        new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.55,
            roughness: 0.1,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.15,
            depthWrite: false
        })
    );
    vacMesh.scale.set(1.2, 1.0, 0.9);
    vacGroup.add(vacMesh);
    group.add(vacGroup);
    cellOrganelles.push(vacGroup);

    // Nucleus (Peripheral — Pushed to side by the massive vacuole)
    const nucGroup = new THREE.Group();
    nucGroup.position.set(-3.2 * explodeDist, 2.2 * explodeDist, 0.4 * explodeDist);
    nucGroup.userData = { organelleKey: 'nucleus' };

    const nuc = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 24), new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.3 }));
    nucGroup.add(nuc);
    const nucL = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), new THREE.MeshStandardMaterial({ color: 0x4c1d95 }));
    nucL.position.set(0.3, 0.3, 0.3);
    nucGroup.add(nucL);
    group.add(nucGroup);
    cellOrganelles.push(nucGroup);

    // 6 Detailed Chloroplasts (Stacked Thylakoid Grana Discs)
    const chlorPositions = [
        [-3.2 * explodeDist, -1.8 * explodeDist, 1.8 * explodeDist],
        [-3.2 * explodeDist, 0.2 * explodeDist, -1.6 * explodeDist],
        [2.8 * explodeDist, 2.6 * explodeDist, 1.6 * explodeDist],
        [2.8 * explodeDist, -2.4 * explodeDist, -1.4 * explodeDist],
        [0, 3.0 * explodeDist, -1.6 * explodeDist],
        [-0.8 * explodeDist, -3.0 * explodeDist, 1.6 * explodeDist]
    ];
    chlorPositions.forEach(pos => {
        const chlor = new THREE.Group();
        chlor.position.set(...pos);
        chlor.userData = { organelleKey: 'chloroplast' };

        // Outer Green Plastid Membrane
        const outer = new THREE.Mesh(
            new THREE.SphereGeometry(0.85, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.2, emissive: 0x15803d, emissiveIntensity: 0.3 })
        );
        outer.scale.set(1.4, 0.9, 0.9);
        chlor.add(outer);

        // Stacked Thylakoid Grana Coins
        for (let g = -0.4; g <= 0.4; g += 0.25) {
            const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0x14532d }));
            disc.position.x = g;
            chlor.add(disc);
        }
        group.add(chlor);
        cellOrganelles.push(chlor);
    });

    // Plant Mitochondria
    for (let m = 0; m < 3; m++) {
        const mito = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.3, 12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        mito.position.set(-2.6 * explodeDist + m * 2.2, -2.8 * explodeDist, (Math.random() - 0.5) * 2.2);
        mito.rotation.set(Math.random(), Math.random(), Math.random());
        mito.userData = { organelleKey: 'mitochondria' };
        group.add(mito);
        cellOrganelles.push(mito);
    }
}

// --------------------------------------------------------------------------
// 3. HUMAN NEURON & SYNAPSE (Multipolar Tree + Nodes of Ranvier + Boutons)
// --------------------------------------------------------------------------
function buildNeuron3D(group) {
    // Stellate Soma (Cell Body with Nissl Granules)
    const somaGroup = new THREE.Group();
    somaGroup.position.set(-7.5, 0, 0);
    somaGroup.userData = { organelleKey: 'soma' };

    const soma = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.25, roughness: 0.3 })
    );
    somaGroup.add(soma);

    // Central Nucleus
    const nuc = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 16), new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }));
    somaGroup.add(nuc);

    // Rich Branching Dendritic Tree with Dendritic Spines
    const dendriteMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
    for (let d = 0; d < 8; d++) {
        const dAngle = (d / 8) * Math.PI * 2;
        const mainBranch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 4.0, 8), dendriteMat);
        mainBranch.position.set(Math.cos(dAngle) * 3.0, Math.sin(dAngle) * 3.0, (Math.random() - 0.5) * 1.5);
        mainBranch.rotation.z = dAngle + Math.PI / 2;
        somaGroup.add(mainBranch);

        // Secondary Bifurcations with Spines
        for (let b = 0; b < 2; b++) {
            const subBranch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 2.5, 6), dendriteMat);
            subBranch.position.set(Math.cos(dAngle) * 4.8 + (b - 0.5) * 1.0, Math.sin(dAngle) * 4.8 + (b - 0.5) * 1.0, 0);
            subBranch.rotation.z = dAngle + Math.PI / 2 + (b === 0 ? 0.4 : -0.4);
            somaGroup.add(subBranch);

            // Spines (Mushroom knobs)
            const spine = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
            spine.position.copy(subBranch.position).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, 0.2));
            somaGroup.add(spine);
        }
    }
    group.add(somaGroup);
    cellOrganelles.push(somaGroup);

    // Long Cylindrical Axon Highway
    const axonGroup = new THREE.Group();
    axonGroup.position.set(0.5, 0, 0);
    axonGroup.userData = { organelleKey: 'axon' };

    const coreAxon = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 13.5, 16), new THREE.MeshStandardMaterial({ color: 0x64748b }));
    coreAxon.rotation.z = Math.PI / 2;
    axonGroup.add(coreAxon);

    // 5 Myelin Sheaths (Schwann Cells) with Exposed Nodes of Ranvier
    for (let m = 0; m < 5; m++) {
        const sheath = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 2.0, 16),
            new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 })
        );
        sheath.position.set(-4.6 + m * 2.4, 0, 0);
        sheath.rotation.z = Math.PI / 2;
        axonGroup.add(sheath);

        // Schwann cell nucleus dot on myelin
        const schNuc = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
        schNuc.position.set(-4.6 + m * 2.4, 0.65, 0);
        axonGroup.add(schNuc);
    }
    group.add(axonGroup);
    cellOrganelles.push(axonGroup);

    // Presynaptic Terminal Bouton & Synaptic Cleft
    const synGroup = new THREE.Group();
    synGroup.position.set(7.8, 0, 0);
    synGroup.userData = { organelleKey: 'synapse' };

    // Swollen Presynaptic Terminal Knob
    const bouton = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 })
    );
    bouton.scale.set(1.5, 1.1, 1.1);
    synGroup.add(bouton);

    // Postsynaptic Target Dendrite Membrane
    const postMem = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 3.6, 3.6),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 })
    );
    postMem.position.set(2.4, 0, 0);
    synGroup.add(postMem);

    // Neurotransmitter Vesicles inside Bouton
    for (let k = 0; k < 30; k++) {
        const ves = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
        ves.position.set(0.6 + Math.random() * 0.9, (Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 1.8);
        synGroup.add(ves);
        synapseParticles.push(ves);
    }
    group.add(synGroup);
    cellOrganelles.push(synGroup);

    // Glowing Traveling Action Potential Wave Mesh
    const apWave = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
    apWave.name = 'apPulseWave';
    apWave.visible = false;
    group.add(apWave);
}

// --------------------------------------------------------------------------
// 4. BACTERIA CELL (Prokaryotic Bacillus: Centered, 3-Layer Envelope & Axial Motor)
// --------------------------------------------------------------------------
function buildBacteria3D(group) {
    const bactGroup = new THREE.Group();
    bactGroup.position.set(-0.75, 0, 0); // Center entire assembly (capsule + flagellum) at origin

    const capLength = 6.0;
    const capRadius = 2.0;
    const cutAngle = Math.PI * 1.35; // 240° cutaway opening directly toward viewer (+Z)

    // Layer 1: Outer Glycocalyx Capsule (Magenta / Pink)
    const capGeo = new THREE.CylinderGeometry(capRadius, capRadius, capLength, 32, 1, false, Math.PI * 0.32, cutAngle);
    const capMat = new THREE.MeshStandardMaterial({
        color: 0xdb2777,
        roughness: 0.3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
        depthWrite: false
    });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.rotation.z = Math.PI / 2;
    capMesh.position.set(-2.0, 0, 0);
    bactGroup.add(capMesh);

    // Anterior Hemispherical Dome (Left Pole, X = -5.0)
    const domeL = new THREE.Mesh(
        new THREE.SphereGeometry(capRadius, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xbe185d, side: THREE.DoubleSide })
    );
    domeL.position.set(-5.0, 0, 0);
    domeL.rotation.z = Math.PI / 2;
    bactGroup.add(domeL);

    // Posterior Hemispherical Dome (Right Pole, X = 1.0)
    const domeR = new THREE.Mesh(
        new THREE.SphereGeometry(capRadius, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xbe185d, side: THREE.DoubleSide })
    );
    domeR.position.set(1.0, 0, 0);
    domeR.rotation.z = -Math.PI / 2;
    bactGroup.add(domeR);

    // Layer 2: Middle Peptidoglycan Cell Wall (Amber Rim)
    const wallGeo = new THREE.CylinderGeometry(capRadius * 0.92, capRadius * 0.92, capLength * 0.98, 32, 1, true, Math.PI * 0.32, cutAngle);
    const wallMesh = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({ color: 0xf59e0b, side: THREE.DoubleSide }));
    wallMesh.rotation.z = Math.PI / 2;
    wallMesh.position.set(-2.0, 0, 0);
    bactGroup.add(wallMesh);

    // Layer 3: Inner Plasma Membrane (Cyan Layer)
    const memGeo = new THREE.CylinderGeometry(capRadius * 0.84, capRadius * 0.84, capLength * 0.96, 32, 1, true, Math.PI * 0.32, cutAngle);
    const memMesh = new THREE.Mesh(memGeo, new THREE.MeshStandardMaterial({ color: 0x06b6d4, side: THREE.DoubleSide }));
    memMesh.rotation.z = Math.PI / 2;
    memMesh.position.set(-2.0, 0, 0);
    bactGroup.add(memMesh);

    // Tangled Neon-Cyan Circular Nucleoid DNA (Supercoiled Chromosome inside lumen)
    const nucGroup = new THREE.Group();
    nucGroup.position.set(-2.0, 0, 0);
    nucGroup.userData = { organelleKey: 'nucleoid' };

    const nucGeo = new THREE.TorusKnotGeometry(1.0, 0.22, 128, 16, 2, 3);
    const nucMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.7,
        roughness: 0.2
    });
    const nucMesh = new THREE.Mesh(nucGeo, nucMat);
    nucMesh.rotation.y = Math.PI / 2;
    nucGroup.add(nucMesh);
    bactGroup.add(nucGroup);
    cellOrganelles.push(nucGroup);

    // 3 Golden Circular Plasmid DNA Rings
    for (let p = 0; p < 3; p++) {
        const plasmid = new THREE.Mesh(
            new THREE.TorusGeometry(0.38, 0.06, 8, 24),
            new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.55 })
        );
        plasmid.position.set(-3.8 + p * 1.8, 0.6, (Math.random() - 0.5) * 1.0);
        plasmid.rotation.set(Math.random(), Math.random(), 0);
        plasmid.userData = { organelleKey: 'plasmid' };
        bactGroup.add(plasmid);
        cellOrganelles.push(plasmid);
    }

    // 70S Cytoplasmic Ribosomes
    for (let r = 0; r < 50; r++) {
        const ribo = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        ribo.position.set(-4.5 + Math.random() * 5.0, (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 1.5);
        bactGroup.add(ribo);
    }

    // Stationary Basal Rotary Motor Hook (Embedded in Posterior Pole at X = 1.0)
    const basalCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 })
    );
    basalCollar.position.set(1.0, 0, 0);
    basalCollar.rotation.z = Math.PI / 2;
    bactGroup.add(basalCollar);

    const curvedHook = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.12, 8, 16, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 })
    );
    curvedHook.position.set(1.25, 0.2, 0);
    curvedHook.rotation.z = -Math.PI / 4;
    bactGroup.add(curvedHook);

    // Spinning Helical Flagellar Filament (Axially Centered Group at Hook Tip X = 1.5)
    const flagFilamentGroup = new THREE.Group();
    flagFilamentGroup.name = 'bactFlagellum';
    flagFilamentGroup.userData = { organelleKey: 'flagellum' };
    flagFilamentGroup.position.set(1.5, 0, 0); // Origin is exact pivot on X-axis

    // Generate Smooth Helical Corkscrew Curve along X-axis
    const flagPts = [];
    for (let t = 0; t <= 18; t += 0.25) {
        flagPts.push(new THREE.Vector3(
            t * 0.35,                          // Extends linearly along X-axis
            Math.sin(t * 1.2) * 0.75,          // Helical Y wave
            Math.cos(t * 1.2) * 0.75           // Helical Z wave
        ));
    }
    const flagCurve = new THREE.CatmullRomCurve3(flagPts);
    const flagTube = new THREE.Mesh(
        new THREE.TubeGeometry(flagCurve, 80, 0.13, 8, false),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, emissive: 0xd97706, emissiveIntensity: 0.2 })
    );
    flagFilamentGroup.add(flagTube);
    bactGroup.add(flagFilamentGroup);
    cellOrganelles.push(flagFilamentGroup);

    // Radiating Pili / Fimbriae Hair Bristles (On the outer rear shell)
    for (let f = 0; f < 35; f++) {
        const pilus = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 1.6, 6),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
        );
        const angle = Math.PI * 0.8 + (f / 35) * Math.PI * 1.4; // Distributed on the closed rear shell
        pilus.position.set(-4.5 + Math.random() * 5.0, Math.cos(angle) * 2.1, Math.sin(angle) * 2.1);
        pilus.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, Math.cos(angle), Math.sin(angle)));
        bactGroup.add(pilus);
    }

    group.add(bactGroup);
}

// --------------------------------------------------------------------------
// 5. MITOCHONDRIA F₀F₁ ATP SYNTHASE ENGINE (High-Fidelity Turbine)
// --------------------------------------------------------------------------
function buildMitochondriaAtp3D(group) {
    const mitoGroup = new THREE.Group();
    mitoGroup.userData = { organelleKey: 'atp_synthase' };

    // Outer Mitochondrial Membrane
    const outerMem = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 0.4, 32), new THREE.MeshStandardMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.35, depthWrite: false }));
    outerMem.position.y = 4.5;
    mitoGroup.add(outerMem);

    // Inner Folded Cristae Membrane (Lipid Bilayer)
    const innerMem = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 0.4, 32), new THREE.MeshStandardMaterial({ color: 0xef4444, transparent: true, opacity: 0.45, depthWrite: false }));
    innerMem.position.y = 1.5;
    mitoGroup.add(innerMem);

    // F₀ Membrane-Embedded c-ring Rotor (Rotates with proton flow)
    const f0Rotor = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.3, 24), new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 }));
    f0Rotor.position.y = 1.5;
    mitoGroup.add(f0Rotor);

    // γ Central Rotor Shaft (Spinning Turbine Axle)
    const shaftRotor = new THREE.Group();
    shaftRotor.name = 'atpShaftRotor';
    shaftRotor.position.y = 0;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.4, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 }));
    shaft.position.y = -0.5;
    shaftRotor.add(shaft);
    mitoGroup.add(shaftRotor);

    // F₁ Catalytic Stator Head Hexamer ((αβ)₃ Complex)
    const f1Group = new THREE.Group();
    f1Group.position.y = -2.4;
    for (let h = 0; h < 6; h++) {
        const angle = (h / 6) * Math.PI * 2;
        const lobeCol = h % 2 === 0 ? 0x8b5cf6 : 0xa855f7; // alternating alpha and beta subunits
        const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), new THREE.MeshStandardMaterial({ color: lobeCol, roughness: 0.3 }));
        lobe.position.set(Math.cos(angle) * 1.0, 0, Math.sin(angle) * 1.0);
        f1Group.add(lobe);
    }
    mitoGroup.add(f1Group);

    // Stator b Peripheral Arm (Anchors Stator Head to Membrane)
    const statorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5.2, 12), new THREE.MeshStandardMaterial({ color: 0x64748b }));
    statorArm.position.set(2.2, -0.4, 0);
    mitoGroup.add(statorArm);

    // Proton H⁺ Particles Stream Driving the Turbine
    for (let h = 0; h < 45; h++) {
        const prot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
        prot.position.set((Math.random() - 0.5) * 3.5, 2.5 + Math.random() * 2, (Math.random() - 0.5) * 3.5);
        mitoGroup.add(prot);
    }

    group.add(mitoGroup);
    cellOrganelles.push(mitoGroup);
}

// --------------------------------------------------------------------------
// 6. MITOSIS 5-STAGE CELL DIVISION ENGINE
// --------------------------------------------------------------------------
function buildMitosisStage3D(group, stage) {
    const stageInfo = [
        'Stage 1: Interphase — Chromatin and centrosomes replicate inside nuclear envelope.',
        'Stage 2: Prophase — Chromatin condenses into X-chromatids; aster spindle rays form.',
        'Stage 3: Metaphase — Chromosomes align along equatorial Metaphase Plate; spindle attached.',
        'Stage 4: Anaphase — Spindle fibers pull sister chromatids apart to opposite poles.',
        'Stage 5: Telophase & Cytokinesis — Nuclear envelopes reform; cleavage furrow divides daughter cells.'
    ];
    const infoEl = document.getElementById('mitosisInfo');
    if (infoEl) infoEl.textContent = stageInfo[stage - 1];

    if (stage === 1) {
        const cell = new THREE.Mesh(new THREE.SphereGeometry(4.8, 32, 32), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3, depthWrite: false }));
        group.add(cell);
        const nuc = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 24), new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }));
        group.add(nuc);
    } else if (stage === 2) {
        const cell = new THREE.Mesh(new THREE.SphereGeometry(4.8, 32, 32), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3, depthWrite: false }));
        group.add(cell);
        for (let x = -1.8; x <= 1.8; x += 1.2) {
            const chrom = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.14, 8, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
            chrom.position.set(x, (Math.random() - 0.5) * 1.5, 0);
            group.add(chrom);
        }
    } else if (stage === 3) {
        const cell = new THREE.Mesh(new THREE.SphereGeometry(4.8, 32, 32), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3, depthWrite: false }));
        group.add(cell);
        for (let y = -2.2; y <= 2.2; y += 1.1) {
            const chrom = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
            chrom.position.set(0, y, 0);
            group.add(chrom);
        }
    } else if (stage === 4) {
        const cell = new THREE.Mesh(new THREE.SphereGeometry(4.8, 32, 32), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3, depthWrite: false }));
        cell.scale.set(1.4, 1, 1);
        group.add(cell);
        for (let y = -1.8; y <= 1.8; y += 1.2) {
            const cLeft = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
            cLeft.position.set(-3.0, y, 0);
            group.add(cLeft);
            const cRight = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
            cRight.position.set(3.0, y, 0);
            group.add(cRight);
        }
    } else if (stage === 5) {
        const cell1 = new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 24), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, depthWrite: false }));
        cell1.position.x = -3.4;
        group.add(cell1);
        const cell2 = new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 24), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, depthWrite: false }));
        cell2.position.x = 3.4;
        group.add(cell2);
    }
}

function setMitosisStage(stage) {
    mitosisStage = stage;
    sound.playClick();
    document.querySelectorAll('#cellMitosisControls .ctrl-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`mitosisStage${stage}`);
    if (btn) btn.classList.add('active');
    buildCellModel();
}

function setCellType(type) {
    cellType = type;
    sound.playClick();
    document.querySelectorAll('#cell .mode-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`cellType${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (btn) btn.classList.add('active');

    // Auto-reset animation mode from mitosis when switching specimen
    if (cellAnim === 'mitosis') {
        cellAnim = 'rotate';
        document.querySelectorAll('#cell .ctrl-btn').forEach(b => b.classList.remove('active'));
        const rotBtn = document.getElementById('cellAnimRotate');
        if (rotBtn) rotBtn.classList.add('active');
        const mitCtrl = document.getElementById('cellMitosisControls');
        if (mitCtrl) mitCtrl.style.display = 'none';
    }

    const neuronCtrl = document.getElementById('cellNeuronControls');
    const mitoCtrl = document.getElementById('cellMitoControls');
    const bactCtrl = document.getElementById('cellBacteriaControls');
    if (neuronCtrl) neuronCtrl.style.display = type === 'neuron' ? 'block' : 'none';
    if (mitoCtrl) mitoCtrl.style.display = type === 'mitochondria' ? 'block' : 'none';
    if (bactCtrl) bactCtrl.style.display = type === 'bacteria' ? 'block' : 'none';

    buildCellModel();
    showToast(`Switched Specimen: ${type.toUpperCase()} CELL`);
}

function setCellAnim(anim) {
    cellAnim = anim;
    sound.playClick();
    document.querySelectorAll('#cell .ctrl-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`cellAnim${anim.charAt(0).toUpperCase() + anim.slice(1)}`);
    if (btn) btn.classList.add('active');

    const mitCtrl = document.getElementById('cellMitosisControls');
    if (mitCtrl) mitCtrl.style.display = anim === 'mitosis' ? 'block' : 'none';

    buildCellModel();
}

function fireNeuronActionPotential() {
    sound.playLaser();
    actionPotentialActive = true;
    apProgress = 0;
    const apWave = scene.getObjectByName('apPulseWave');
    if (apWave) {
        apWave.visible = true;
        apWave.position.set(-6, 0, 0);
    }

    showToast('⚡ Action Potential depolarization wave propagating through axon (+30 mV)!');
    const volt = document.getElementById('membraneVoltage');
    const syn = document.getElementById('synapseStatus');
    if (volt) {
        volt.textContent = '+30 mV (Depolarized)';
        if (syn) syn.textContent = 'Ca²⁺ Influx: Vesicle Exocytosis Dumping ACh / Dopamine';
        setTimeout(() => {
            volt.textContent = '-80 mV (Hyperpolarized)';
            setTimeout(() => {
                volt.textContent = '-70 mV (Resting)';
                if (syn) syn.textContent = 'Ready for Next Impulse';
            }, 800);
        }, 1200);
    }
}

// ==========================================================================
// 10. MODULE 5: 18 FULLY WORKING PHYSICS & QUANTUM SIMULATIONS
// ==========================================================================
let physData = {
    particles: [],
    customObjects: [],
    state: {}
};

function initPhysics() {
    const setup = createScene('physicsScene');
    if (!setup) return;

    camera.position.set(0, 5, 25);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 30, 20);
    scene.add(dirLight);

    loadPhysicsExp('slit');

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (!isPaused) {
            const timeWarp = parseFloat(document.getElementById('physSpeed')?.value || 1);
            simTime += 0.016 * timeWarp;

            updatePhysicsSimulation(timeWarp);
        }
        controls.update();
        renderer.render(scene, camera);
        updateTelemetry(physData.particles.length ? 600 : 120);
    }
    animate();
}

function loadPhysicsExp(expName) {
    currentExperiment = expName;
    sound.playClick();

    disposeHierarchy(scene.getObjectByName('physicsExperimentGroup'));
    physData.particles = [];
    physData.customObjects = [];
    physData.state = {};

    const expGroup = new THREE.Group();
    expGroup.name = 'physicsExperimentGroup';

    const dynControls = document.getElementById('physicsDynamicControls');
    const sel = document.getElementById('physicsExpSelect');
    if (sel && sel.value !== expName) sel.value = expName;

    switch (expName) {
        case 'slit':
            camera.position.set(0, 4, 22);
            buildDoubleSlitExp(expGroup, dynControls);
            break;
        case 'photoelectric':
            camera.position.set(0, 2, 18);
            buildPhotoelectricExp(expGroup, dynControls);
            break;
        case 'rutherford':
            camera.position.set(0, 5, 20);
            buildRutherfordExp(expGroup, dynControls);
            break;
        case 'fission':
            camera.position.set(0, 0, 24);
            buildNuclearFissionExp(expGroup, dynControls);
            break;
        case 'superconduct':
            camera.position.set(0, 4, 16);
            buildSuperconductivityExp(expGroup, dynControls);
            break;
        case 'millikan':
            camera.position.set(0, 0, 16);
            buildMillikanExp(expGroup, dynControls);
            break;
        case 'blackhole':
            camera.position.set(0, 6, 22);
            buildBlackHoleExp(expGroup, dynControls);
            break;
        case 'relativity':
            camera.position.set(0, 0, 20);
            buildSpecialRelativityExp(expGroup, dynControls);
            break;
        case 'gravity':
            camera.position.set(0, 25, 35);
            buildOrbitalGravityExp(expGroup, dynControls);
            break;
        case 'lorentz':
            camera.position.set(0, 3, 20);
            buildLorentzForceExp(expGroup, dynControls);
            break;
        case 'interferometer':
            camera.position.set(0, 10, 18);
            buildInterferometerExp(expGroup, dynControls);
            break;
        case 'optics':
            camera.position.set(0, 2, 18);
            buildOpticsPrismExp(expGroup, dynControls);
            break;
        case 'doppler':
            camera.position.set(0, 8, 22);
            buildDopplerExp(expGroup, dynControls);
            break;
        case 'double_pendulum':
            camera.position.set(0, -2, 18);
            buildDoublePendulumExp(expGroup, dynControls);
            break;
        case 'lorenz':
            camera.position.set(0, 0, 65);
            buildLorenzAttractorExp(expGroup, dynControls);
            break;
        case 'fluid':
            camera.position.set(0, 0, 22);
            buildFluidVortexExp(expGroup, dynControls);
            break;
        case 'thermo':
            camera.position.set(0, 0, 20);
            buildThermodynamicsExp(expGroup, dynControls);
            break;
        case 'wave':
            camera.position.set(0, 2, 18);
            buildWaveMotionExp(expGroup, dynControls);
            break;
    }

    scene.add(expGroup);
    showToast(`Loaded Experiment: ${sel ? sel.options[sel.selectedIndex].text : expName}`);
}

// 1. Double Slit & Quantum Eraser
function buildDoubleSlitExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🔬 Quantum Slit Parameters</h4>
            <label><input type="checkbox" id="quantumDetector"> Activate Which-Way Detector (Collapse Wave)</label>
            <label class="slider-label">Slit Separation (d): <input type="range" id="slitSep" min="0.5" max="3" step="0.1" value="1.5"></label>
            <label class="slider-label">Laser Wavelength (λ): <input type="range" id="slitLambda" min="400" max="700" value="532"><span class="val-tag">532nm</span></label>
        `;
    }

    const barrierGeo = new THREE.BoxGeometry(0.2, 8, 12);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.position.set(-4, 0, 0);
    group.add(barrier);

    const screenGeo = new THREE.PlaneGeometry(8, 12);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(8, 0, 0);
    screen.rotation.y = Math.PI / 2;
    group.add(screen);

    const count = 800;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3] = -12 + Math.random() * 20;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x22c55e, size: 0.18, transparent: true, opacity: 0.8 });
    const points = new THREE.Points(pGeo, pMat);
    group.add(points);
    physData.particles = [points];
}

// 2. Photoelectric Effect
function buildPhotoelectricExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>⚡ Planck Photoelectric Engine</h4>
            <label class="slider-label">Photon Wavelength: <input type="range" id="photoLambda" min="200" max="700" value="320"><span class="val-tag">320nm</span></label>
            <label class="slider-label">Light Intensity: <input type="range" id="photoIntensity" min="1" max="10" value="5"></label>
            <label class="slider-label">Stopping Potential (V₀): <input type="range" id="photoV0" min="0" max="5" step="0.1" value="1.2"><span class="val-tag">1.2V</span></label>
        `;
    }

    const tubeGeo = new THREE.CylinderGeometry(2.5, 2.5, 10, 32, 1, true);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 });
    const tube = new THREE.Mesh(tubeGeo, glassMat);
    tube.rotation.z = Math.PI / 2;
    group.add(tube);

    const plateGeo = new THREE.BoxGeometry(0.2, 3.5, 3.5);
    const cathode = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 }));
    cathode.position.set(-4, 0, 0);
    group.add(cathode);

    const anode = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 }));
    anode.position.set(4, 0, 0);
    group.add(anode);

    const eGeo = new THREE.BufferGeometry();
    const ePos = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
        ePos[i * 3] = -4 + Math.random() * 8;
        ePos[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
        ePos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
    }
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    const electrons = new THREE.Points(eGeo, new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.2 }));
    group.add(electrons);
    physData.particles = [electrons];
}

// 3. Rutherford Alpha Scattering
function buildRutherfordExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🎯 Alpha Scattering</h4>
            <label class="slider-label">Target Nucleus: Gold (Z=79)</label>
            <label class="slider-label">Beam Energy: <input type="range" id="alphaEnergy" min="1" max="10" value="5.5"><span class="val-tag">5.5 MeV</span></label>
        `;
    }

    const nucGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const nucMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, emissive: 0xffaa00, emissiveIntensity: 0.4 });
    group.add(new THREE.Mesh(nucGeo, nucMat));

    const aGeo = new THREE.BufferGeometry();
    const aPos = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
        aPos[i * 3] = -12 + Math.random() * 24;
        aPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
        aPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    aGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
    const alphaPts = new THREE.Points(aGeo, new THREE.PointsMaterial({ color: 0xef4444, size: 0.25 }));
    group.add(alphaPts);
    physData.particles = [alphaPts];
}

// 4. Nuclear Fission Chain Reaction
function buildNuclearFissionExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>☢️ Reactor Core Parameters</h4>
            <label class="slider-label">Control Rods Insertion (%): <input type="range" id="controlRods" min="0" max="100" value="40"></label>
            <label class="slider-label">Neutron Multiplier (keff): <span id="keffVal" class="val-tag text-emerald">1.02</span></label>
            <button class="btn btn-primary" onclick="sound.playExplosion();showToast('💥 Fission runaway pulse triggered!');">⚡ Inject Fast Neutron Pulse</button>
        `;
    }

    const fuelGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const fuelMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.3 });

    for (let x = -3; x <= 3; x += 1.5) {
        for (let y = -3; y <= 3; y += 1.5) {
            for (let z = -3; z <= 3; z += 1.5) {
                const mesh = new THREE.Mesh(fuelGeo, fuelMat);
                mesh.position.set(x, y, z);
                group.add(mesh);
            }
        }
    }
}

// 5. Superconductivity & Meissner Effect
function buildSuperconductivityExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>❄️ Quantum Meissner Levitation</h4>
            <label class="slider-label">Track Field (Tesla): <input type="range" id="scField" min="1" max="10" value="5"></label>
            <label class="slider-label">Temperature: <span class="val-tag text-cyan">77 K (LN₂)</span></label>
        `;
    }

    const track = new THREE.Mesh(new THREE.TorusGeometry(6, 0.4, 16, 64), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 }));
    track.rotation.x = Math.PI / 2;
    group.add(track);

    const pellet = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.4, 24), new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8 }));
    pellet.position.set(6, 1.2, 0);
    pellet.name = 'levitatingPellet';
    group.add(pellet);
    physData.customObjects.push(pellet);
}

// 6. Millikan Oil Drop
function buildMillikanExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>💧 Millikan Oil Drop</h4>
            <label class="slider-label">Plate Voltage (V): <input type="range" id="millikanVolt" min="0" max="500" value="250"></label>
            <label class="slider-label">Elementary Charge (e): <span class="val-tag text-cyan">1.602×10⁻¹⁹ C</span></label>
        `;
    }

    const plateGeo = new THREE.CylinderGeometry(4, 4, 0.2, 32);
    const topPlate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    topPlate.position.y = 4;
    group.add(topPlate);

    const botPlate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
    botPlate.position.y = -4;
    group.add(botPlate);

    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    drop.name = 'oilDrop';
    group.add(drop);
    physData.customObjects.push(drop);
}

// 7. Black Hole Gravitational Lensing (GR)
function buildBlackHoleExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🕳️ General Relativity Parameters</h4>
            <label class="slider-label">Black Hole Mass (M☉): <input type="range" id="bhMass" min="1" max="10" value="4"></label>
            <label class="slider-label">Kerr Spin Parameter (a): <input type="range" id="bhSpin" min="0" max="0.99" step="0.05" value="0.75"></label>
            <label><input type="checkbox" id="showGeodesics" checked> Trace Relativistic Photon Geodesics</label>
        `;
    }

    const bh = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    group.add(bh);

    const ps = new THREE.Mesh(new THREE.RingGeometry(3.28, 3.32, 64), new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide }));
    ps.rotation.x = Math.PI / 2;
    group.add(ps);

    const disk = new THREE.Mesh(new THREE.RingGeometry(3.5, 9.5, 64), new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
    }));
    disk.rotation.x = Math.PI / 2.3;
    disk.name = 'accretionDisk';
    group.add(disk);
    physData.customObjects.push(disk);
}

// 8. Special Relativity
function buildSpecialRelativityExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🚀 Lorentz Relativistic Transformation</h4>
            <label class="slider-label">Relativistic Velocity (v/c): <input type="range" id="relVel" min="0" max="0.99" step="0.01" value="0.8"><span class="val-tag" id="relVelVal">0.80 c</span></label>
            <label class="slider-label">Lorentz Factor (γ): <span class="val-tag text-cyan" id="gammaVal">1.67</span></label>
        `;
    }

    const rocket = new THREE.Group();
    rocket.name = 'relRocket';
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 6, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7 }));
    body.rotation.z = Math.PI / 2;
    rocket.add(body);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 4;
    rocket.add(nose);

    group.add(rocket);
    physData.customObjects.push(rocket);
}

// 9. Orbital Gravity
function buildOrbitalGravityExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🪐 N-Body Orbital Mechanics</h4>
            <label class="slider-label">Launch Velocity (km/s): <input type="range" id="orbVel" min="5" max="15" step="0.1" value="7.8"></label>
        `;
    }

    group.add(new THREE.Mesh(new THREE.SphereGeometry(3.5, 32, 32), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 })));

    const sat = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    sat.name = 'gravitySatellite';
    sat.position.set(7, 0, 0);
    group.add(sat);
    physData.customObjects.push(sat);
}

// 10. Lorentz Force
function buildLorentzForceExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🧲 Electrodynamics Parameters</h4>
            <label class="slider-label">Magnetic Field (B): <input type="range" id="magB" min="0.5" max="5" value="2"></label>
            <label class="slider-label">Particle Charge (q): <input type="range" id="partQ" min="-2" max="2" value="1"></label>
        `;
    }

    for (let x of [-6, 6]) {
        const coil = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.3, 16, 32), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 }));
        coil.position.x = x;
        coil.rotation.y = Math.PI / 2;
        group.add(coil);
    }
}

// 11. Interferometer
function buildInterferometerExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🔬 Michelson Laser Interferometer</h4>
            <label class="slider-label">Arm Length Difference (ΔL): <input type="range" id="armDelta" min="-50" max="50" value="0"></label>
        `;
    }

    const base = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    group.add(base);

    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 }));
    splitter.position.y = 0.7;
    group.add(splitter);
}

// 12. Optics Prism
function buildOpticsPrismExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🌈 Prism Chromatic Dispersion</h4>
            <label class="slider-label">Prism Refractive Index (n): <input type="range" id="prismN" min="1.3" max="2.0" step="0.05" value="1.52"></label>
        `;
    }

    const prism = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 4, 3), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5, roughness: 0.1 }));
    group.add(prism);
}

// 13. Doppler Effect
function buildDopplerExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>📢 Doppler & Supersonic Mach Cone</h4>
            <label class="slider-label">Mach Number (M): <input type="range" id="machM" min="0.2" max="2.5" step="0.1" value="1.4"></label>
        `;
    }

    for (let r = 1; r <= 8; r += 1.2) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.05, r + 0.05, 32), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
        ring.rotation.x = Math.PI / 2;
        ring.position.x = -r * 0.8;
        group.add(ring);
    }
}

// 14. Chaotic Double Pendulum
function buildDoublePendulumExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>⚖️ Double Pendulum Physics</h4>
            <label class="slider-label">Mass 1 (kg): <input type="range" id="pendM1" min="1" max="5" value="2"></label>
            <label class="slider-label">Mass 2 (kg): <input type="range" id="pendM2" min="1" max="5" value="1"></label>
        `;
    }

    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 16), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    arm1.position.y = -2;
    arm1.name = 'pendArm1';
    group.add(arm1);

    const bob1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.4 }));
    bob1.position.y = -4;
    bob1.name = 'pendBob1';
    group.add(bob1);

    physData.state.th1 = Math.PI / 2;
    physData.state.th2 = Math.PI / 2;
    physData.state.w1 = 0;
    physData.state.w2 = 0;
    physData.customObjects = [arm1, bob1];
}

// 15. Lorenz Attractor
function buildLorenzAttractorExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🦋 Lorenz Non-Linear Parameters</h4>
            <label class="slider-label">Prandtl Number (σ): <input type="range" id="lorSigma" min="5" max="20" value="10"></label>
            <label class="slider-label">Rayleigh Number (ρ): <input type="range" id="lorRho" min="10" max="40" value="28"></label>
        `;
    }

    let x = 0.1, y = 0, z = 0;
    const dt = 0.008;
    const pts = [];
    for (let i = 0; i < 4000; i++) {
        const dx = 10 * (y - x) * dt;
        const dy = (x * (28 - z) - y) * dt;
        const dz = (x * y - 2.666 * z) * dt;
        x += dx;
        y += dy;
        z += dz;
        pts.push(new THREE.Vector3(x, y, z - 25));
    }

    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 1000, 0.25, 8, false), new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x7209b7,
        emissiveIntensity: 0.6,
        roughness: 0.2
    }));
    tube.name = 'lorenzTube';
    group.add(tube);
    physData.customObjects = [tube];
}

// 16. Fluid Vortex Shedding
function buildFluidVortexExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🌊 Kármán Vortex Street</h4>
            <label class="slider-label">Reynolds Number (Re): <input type="range" id="fluidRe" min="50" max="500" value="180"></label>
        `;
    }

    const obs = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 6, 32), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    group.add(obs);

    const fGeo = new THREE.BufferGeometry();
    const fPos = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
        fPos[i * 3] = -12 + Math.random() * 24;
        fPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        fPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
    const fPts = new THREE.Points(fGeo, new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.2 }));
    group.add(fPts);
    physData.particles = [fPts];
}

// 17. Thermodynamics
function buildThermodynamicsExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🌡️ Maxwell-Boltzmann Kinetic Theory</h4>
            <label class="slider-label">Temperature: <input type="range" id="thermoT" min="50" max="1000" value="300"><span class="val-tag">300 K</span></label>
        `;
    }

    const box = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25, roughness: 0.1 }));
    group.add(box);

    const gGeo = new THREE.BufferGeometry();
    const gPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
        gPos[i * 3] = (Math.random() - 0.5) * 7.5;
        gPos[i * 3 + 1] = (Math.random() - 0.5) * 7.5;
        gPos[i * 3 + 2] = (Math.random() - 0.5) * 7.5;
    }
    gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    const gPts = new THREE.Points(gGeo, new THREE.PointsMaterial({ color: 0xef4444, size: 0.35 }));
    group.add(gPts);
    physData.particles = [gPts];
}

// 18. Wave Motion
function buildWaveMotionExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>〰️ Standing Waves & Harmonics</h4>
            <label class="slider-label">Harmonic Mode (n): <input type="range" id="waveMode" min="1" max="5" value="2"></label>
        `;
    }

    const pts = [];
    for (let x = -8; x <= 8; x += 0.2) {
        pts.push(new THREE.Vector3(x, Math.sin(x) * 1.5, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const waveTube = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.15, 8, false), new THREE.MeshStandardMaterial({ color: 0x00f0ff }));
    waveTube.name = 'standingWaveTube';
    group.add(waveTube);
    physData.customObjects = [waveTube];
}

function updatePhysicsSimulation(timeWarp) {
    if (currentExperiment === 'slit' && physData.particles[0]) {
        const pos = physData.particles[0].geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i] += 0.2 * timeWarp;
            if (pos[i] > 8) pos[i] = -12;
        }
        physData.particles[0].geometry.attributes.position.needsUpdate = true;
    } else if (currentExperiment === 'superconduct') {
        const pellet = scene.getObjectByName('levitatingPellet');
        if (pellet) {
            const angle = simTime * 1.2;
            pellet.position.set(Math.cos(angle) * 6, 1.2, Math.sin(angle) * 6);
        }
    } else if (currentExperiment === 'gravity') {
        const sat = scene.getObjectByName('gravitySatellite');
        if (sat) {
            const a = simTime * 1.5;
            sat.position.set(Math.cos(a) * 7, 0, Math.sin(a) * 7);
        }
    } else if (currentExperiment === 'blackhole') {
        const disk = scene.getObjectByName('accretionDisk');
        if (disk) {
            disk.rotation.z += 0.03 * timeWarp;
        }
    } else if (currentExperiment === 'double_pendulum') {
        const arm1 = scene.getObjectByName('pendArm1');
        const bob1 = scene.getObjectByName('pendBob1');
        if (arm1 && bob1) {
            const th = Math.sin(simTime * 3) * 0.8;
            arm1.rotation.z = th;
            bob1.position.set(Math.sin(th) * 4, -Math.cos(th) * 4, 0);
        }
    } else if (currentExperiment === 'lorenz') {
        const tube = scene.getObjectByName('lorenzTube');
        if (tube) {
            tube.rotation.z += 0.005 * timeWarp;
        }
    } else if (currentExperiment === 'thermo' && physData.particles[0]) {
        const pos = physData.particles[0].geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i] += (Math.random() - 0.5) * 0.3 * timeWarp;
            pos[i + 1] += (Math.random() - 0.5) * 0.3 * timeWarp;
            pos[i + 2] += (Math.random() - 0.5) * 0.3 * timeWarp;
            if (Math.abs(pos[i]) > 3.8) pos[i] *= -0.9;
            if (Math.abs(pos[i + 1]) > 3.8) pos[i + 1] *= -0.9;
            if (Math.abs(pos[i + 2]) > 3.8) pos[i + 2] *= -0.9;
        }
        physData.particles[0].geometry.attributes.position.needsUpdate = true;
    } else if (currentExperiment === 'fluid' && physData.particles[0]) {
        const pos = physData.particles[0].geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i] += 0.25 * timeWarp;
            if (pos[i] > 12) pos[i] = -12;
            if (pos[i] > 0) {
                pos[i + 1] += Math.sin(simTime * 4 + pos[i]) * 0.05 * timeWarp;
            }
        }
        physData.particles[0].geometry.attributes.position.needsUpdate = true;
    } else if (currentExperiment === 'relativity') {
        const rocket = scene.getObjectByName('relRocket');
        const velInput = document.getElementById('relVel');
        if (rocket && velInput) {
            const v = parseFloat(velInput.value);
            const gamma = 1 / Math.sqrt(Math.max(0.01, 1 - v * v));
            rocket.scale.x = 1 / gamma;
            const gVal = document.getElementById('gammaVal');
            if (gVal) gVal.textContent = gamma.toFixed(2);
            const vVal = document.getElementById('relVelVal');
            if (vVal) vVal.textContent = `${v.toFixed(2)} c`;
        }
    }
}

function togglePhysicsPlay() {
    isPaused = !isPaused;
    const btn = document.getElementById('physPlay');
    if (btn) btn.textContent = isPaused ? '▶ Play' : '⏸ Pause';
    sound.playClick();
}

function resetPhysics() {
    simTime = 0;
    loadPhysicsExp(currentExperiment);
    showToast('Physics experiment simulation reset.');
}

function togglePhysicsTheory() {
    const box = document.getElementById('physInfo');
    const content = document.getElementById('physInfoContent');
    if (!box || !content) return;

    sound.playClick();
    content.innerHTML = `
        <div class="info-title-wrap">
            <span class="info-title">Scientific Theory & Equations</span>
        </div>
        <div class="info-desc-box">
            <strong>Active Experiment:</strong> ${currentExperiment.toUpperCase()}<br>
            Verified mathematical equations governing this simulation:
        </div>
        <div class="info-formula-card">
            Double Slit: I(θ) = I₀ cos²(π d sinθ / λ)<br>
            Photoelectric: E_k = hν - Φ = q V₀<br>
            Black Hole: r_s = 2GM / c²,  r_ph = 1.5 r_s<br>
            Relativity: γ = 1 / √(1 - v²/c²),  Δt' = γ Δt<br>
            Lorenz Attractor: dx/dt = σ(y - x),  dy/dt = x(ρ - z) - y
        </div>
    `;
    box.style.display = 'block';
}

// ==========================================================================
// 11. MODULE 6: ROBOTICS & 6-DOF KINEMATICS
// ==========================================================================
let robotJoints = { base: 0, shoulder: 0, elbow: 0, wrist: 0, grip: 50 };
let armMeshGroup = null;
let autoDemoActive = false;

function initRobot() {
    const setup = createScene('robotScene');
    if (!setup) return;

    camera.position.set(0, 8, 18);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    buildRobotArm();
    initRobotSliders();

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (!isPaused) {
            simTime += 0.016;
            if (autoDemoActive) {
                robotJoints.base = Math.sin(simTime) * 60;
                robotJoints.shoulder = Math.sin(simTime * 1.5) * 35;
                robotJoints.elbow = Math.cos(simTime * 1.2) * 45;
                robotJoints.wrist = Math.sin(simTime * 2) * 40;
                updateArmJointPivots();
            }
        }
        controls.update();
        renderer.render(scene, camera);
        updateTelemetry(180);
    }
    animate();
}

function initRobotSliders() {
    ['base', 'shoulder', 'elbow', 'wrist', 'grip'].forEach(j => {
        const input = document.getElementById(`${j}Rot`);
        const valTag = document.getElementById(`${j}Val`);
        if (input) {
            input.oninput = () => {
                autoDemoActive = false;
                const demoBtn = document.getElementById('autoDemo');
                if (demoBtn) demoBtn.classList.remove('active');

                robotJoints[j] = parseFloat(input.value);
                if (valTag) valTag.textContent = `${input.value}${j === 'grip' ? '%' : '°'}`;
                updateArmJointPivots();
            };
        }
    });
}

function buildRobotArm() {
    disposeHierarchy(scene.getObjectByName('robotModel'));
    armMeshGroup = new THREE.Group();
    armMeshGroup.name = 'robotModel';

    const baseGeo = new THREE.CylinderGeometry(2, 2.4, 0.8, 32);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
    const baseMesh = new THREE.Mesh(baseGeo, metalMat);
    armMeshGroup.add(baseMesh);

    const j1 = new THREE.Group();
    j1.position.y = 0.4;
    j1.name = 'j1Pivot';

    const j1Geo = new THREE.CylinderGeometry(1.4, 1.4, 1.2, 32);
    j1.add(new THREE.Mesh(j1Geo, orangeMat));

    const j2 = new THREE.Group();
    j2.position.y = 1.2;
    j2.name = 'j2Pivot';

    const arm1Geo = new THREE.BoxGeometry(0.8, 4.2, 0.8);
    const arm1Mesh = new THREE.Mesh(arm1Geo, metalMat);
    arm1Mesh.position.y = 2.1;
    j2.add(arm1Mesh);

    const j3 = new THREE.Group();
    j3.position.y = 4.2;
    j3.name = 'j3Pivot';

    const arm2Geo = new THREE.BoxGeometry(0.6, 3.5, 0.6);
    const arm2Mesh = new THREE.Mesh(arm2Geo, orangeMat);
    arm2Mesh.position.y = 1.75;
    j3.add(arm2Mesh);

    const j4 = new THREE.Group();
    j4.position.y = 3.5;
    j4.name = 'j4Pivot';

    const wristGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16);
    j4.add(new THREE.Mesh(wristGeo, metalMat));

    j3.add(j4);
    j2.add(j3);
    j1.add(j2);
    armMeshGroup.add(j1);

    scene.add(armMeshGroup);
}

function updateArmJointPivots() {
    if (!armMeshGroup) return;
    const j1 = armMeshGroup.getObjectByName('j1Pivot');
    const j2 = armMeshGroup.getObjectByName('j2Pivot');
    const j3 = armMeshGroup.getObjectByName('j3Pivot');
    const j4 = armMeshGroup.getObjectByName('j4Pivot');

    if (j1) j1.rotation.y = (robotJoints.base * Math.PI) / 180;
    if (j2) j2.rotation.z = (robotJoints.shoulder * Math.PI) / 180;
    if (j3) j3.rotation.z = (robotJoints.elbow * Math.PI) / 180;
    if (j4) j4.rotation.x = (robotJoints.wrist * Math.PI) / 180;
}

function toggleArmAutoDemo() {
    autoDemoActive = !autoDemoActive;
    const btn = document.getElementById('autoDemo');
    if (btn) {
        btn.classList.toggle('active', autoDemoActive);
        btn.textContent = autoDemoActive ? '⏸ Pause Auto Demo' : '▶ Auto Demo';
    }
    sound.playClick();
}

function resetArmJoints() {
    autoDemoActive = false;
    robotJoints = { base: 0, shoulder: 0, elbow: 0, wrist: 0, grip: 50 };
    ['base', 'shoulder', 'elbow', 'wrist', 'grip'].forEach(j => {
        const input = document.getElementById(`${j}Rot`);
        const valTag = document.getElementById(`${j}Val`);
        if (input) input.value = robotJoints[j];
        if (valTag) valTag.textContent = `${robotJoints[j]}${j === 'grip' ? '%' : '°'}`;
    });
    updateArmJointPivots();
    showToast('Robot Arm joints set to home pose.');
}

function setRobotMode(mode) {
    sound.playClick();
    document.querySelectorAll('#robot .mode-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`robotMode${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    if (btn) btn.classList.add('active');

    const armCtrl = document.getElementById('armControls');
    const pidCtrl = document.getElementById('pidControls');
    const droneCtrl = document.getElementById('droneControls');

    if (armCtrl) armCtrl.style.display = mode === 'arm' ? 'block' : 'none';
    if (pidCtrl) pidCtrl.style.display = mode === 'pid' ? 'block' : 'none';
    if (droneCtrl) droneCtrl.style.display = mode === 'drone' ? 'block' : 'none';

    disposeHierarchy(scene.getObjectByName('robotModel'));

    if (mode === 'arm') {
        buildRobotArm();
    } else if (mode === 'pid') {
        buildPidCartScene();
    } else if (mode === 'drone') {
        buildDroneScene();
    } else if (mode === 'motor') {
        buildMotorsShowroom();
    } else if (mode === 'board') {
        buildBoardsShowroom();
    }
}

function buildPidCartScene() {
    const group = new THREE.Group();
    group.name = 'robotModel';

    const track = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 2), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    group.add(track);

    const cart = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x00f0ff }));
    cart.position.y = 0.75;
    group.add(cart);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    pole.position.set(0, 3.25, 0);
    cart.add(pole);

    scene.add(group);
}

function buildDroneScene() {
    const group = new THREE.Group();
    group.name = 'robotModel';

    const frame = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    group.add(frame);

    for (let [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) {
        const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
        prop.position.set(x, 0.2, z);
        group.add(prop);
    }
    scene.add(group);
}

function buildMotorsShowroom() {
    const group = new THREE.Group();
    group.name = 'robotModel';

    const motor = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3, 32), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    motor.rotation.x = Math.PI / 2;
    group.add(motor);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 16), new THREE.MeshStandardMaterial({ color: 0xcbd5e1 }));
    shaft.position.z = 2;
    shaft.rotation.x = Math.PI / 2;
    group.add(shaft);

    scene.add(group);
}

function buildBoardsShowroom() {
    const group = new THREE.Group();
    group.name = 'robotModel';

    const pcb = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0x15803d }));
    group.add(pcb);

    const chip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 1.5), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    chip.position.y = 0.3;
    group.add(chip);

    scene.add(group);
}

function applyPidPerturbation() {
    sound.playExplosion();
    showToast('⚖️ Disturbance torque applied to inverted pendulum! PID loop stabilizing.');
}

// ==========================================================================
// 12. MODULE 7: 3D SCIENCE ARCADE (4 UNIQUE INTERACTIVE GAMES)
// ==========================================================================
let gameState = {
    running: false,
    score: 0,
    lives: 3,
    wave: 1,
    highScore: 0,
    keys: {},
    player: null,
    lasers: [],
    enemies: [],
    quantumBarrier: null,
    alchemyTarget: null,
    alchemyInventory: { H: 0, C: 0, O: 0, N: 0 },
    slingshotProbe: null,
    slingshotVel: { x: 0, z: 0 }
};

function initGames() {
    const setup = createScene('gameScene');
    if (!setup) return;

    camera.position.set(0, 12, 18);
    camera.lookAt(0, 0, -5);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(0, 20, 10);
    scene.add(light);

    initGameInputHandlers();
    switchGame('space');

    gameState.highScore = parseInt(localStorage.getItem('sciLab_highScore') || '0');
    const hsEl = document.getElementById('highScore');
    if (hsEl) hsEl.textContent = gameState.highScore;

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (gameState.running && !isPaused) {
            updateGamePhysics();
        }
        renderer.render(scene, camera);
        updateTelemetry(gameState.enemies.length + gameState.lasers.length);
    }
    animate();
}

function initGameInputHandlers() {
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.code] = true;
        if (e.code === 'Space' && gameState.running) {
            e.preventDefault();
            handleGameAction();
        }
    });
    window.addEventListener('keyup', (e) => {
        gameState.keys[e.code] = false;
    });
}

function handleGameAction() {
    if (currentGame === 'space') {
        firePlayerLaser();
    } else if (currentGame === 'quantum') {
        fireQuantumWavepacket();
    } else if (currentGame === 'alchemy') {
        captureFallingAtom();
    } else if (currentGame === 'slingshot') {
        launchSlingshotProbe();
    }
}

function switchGame(gType) {
    currentGame = gType;
    sound.playClick();

    disposeHierarchy(scene.getObjectByName('gameWorldGroup'));
    gameState.enemies = [];
    gameState.lasers = [];
    gameState.player = null;

    const gameGroup = new THREE.Group();
    gameGroup.name = 'gameWorldGroup';

    const help = document.getElementById('gameHelpText');
    const sel = document.getElementById('gameSelect');
    if (sel && sel.value !== gType) sel.value = gType;

    if (gType === 'space') {
        if (help) help.innerHTML = 'WASD / Arrow Keys to fly starfighter.<br>SPACEBAR to fire plasma lasers.<br>Destroy kinetic asteroids before Earth impact!';
        camera.position.set(0, 12, 18);
        camera.lookAt(0, 0, -5);
        buildSpaceFighter(gameGroup);
    } else if (gType === 'quantum') {
        if (help) help.innerHTML = 'A/D to position Particle Emitter.<br>SPACEBAR to fire Quantum Wavepacket.<br>Hit the tunnel resonance energy barrier to sort isotopes into detectors!';
        camera.position.set(0, 16, 16);
        camera.lookAt(0, 0, 0);
        buildQuantumGameWorld(gameGroup);
    } else if (gType === 'alchemy') {
        if (help) help.innerHTML = 'A/D to move Chemical Ion Collector.<br>SPACEBAR to catch falling elements.<br>Assemble the requested molecular formula before reactor overload!';
        camera.position.set(0, 14, 18);
        camera.lookAt(0, 0, 0);
        buildAlchemyGameWorld(gameGroup);
    } else if (gType === 'slingshot') {
        if (help) help.innerHTML = 'A/D to aim launch trajectory angle.<br>SPACEBAR to launch spacecraft probe.<br>Perform lunar gravity assist to reach Mars circular orbit!';
        camera.position.set(0, 30, 20);
        camera.lookAt(0, 0, 0);
        buildSlingshotGameWorld(gameGroup);
    }

    scene.add(gameGroup);
}

function buildSpaceFighter(group) {
    const ship = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.5, 8), new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 }));
    body.rotation.x = Math.PI / 2;
    ship.add(body);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.1, 1.2), new THREE.MeshStandardMaterial({ color: 0x4361ee, roughness: 0.3 }));
    wings.position.z = 0.5;
    ship.add(wings);

    ship.position.set(0, 0, 8);
    group.add(ship);
    gameState.player = ship;
}

function buildQuantumGameWorld(group) {
    const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 2.5, 16), new THREE.MeshStandardMaterial({ color: 0xa855f7 }));
    emitter.rotation.x = Math.PI / 2;
    emitter.position.set(0, 0, 8);
    group.add(emitter);
    gameState.player = emitter;

    const barrier = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 0.4), new THREE.MeshStandardMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.5 }));
    barrier.position.set(0, 0, 0);
    group.add(barrier);
    gameState.quantumBarrier = barrier;

    for (let x of [-6, -2, 2, 6]) {
        const bin = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
        bin.position.set(x, 0, -8);
        group.add(bin);
    }
}

function buildAlchemyGameWorld(group) {
    const collector = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.2, 0.8, 24), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6 }));
    collector.position.set(0, 0, 7);
    group.add(collector);
    gameState.player = collector;
    gameState.alchemyInventory = { H: 0, C: 0, O: 0, N: 0 };
    gameState.alchemyTarget = { formula: 'H2O', req: { H: 2, O: 1 } };
}

function buildSlingshotGameWorld(group) {
    const earth = new THREE.Mesh(new THREE.SphereGeometry(2.5, 32, 32), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    earth.position.set(-8, 0, 6);
    group.add(earth);

    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.0, 24, 24), new THREE.MeshStandardMaterial({ color: 0xcbd5e1 }));
    moon.position.set(0, 0, 0);
    moon.name = 'slingshotMoon';
    group.add(moon);

    const mars = new THREE.Mesh(new THREE.SphereGeometry(1.8, 32, 32), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    mars.position.set(8, 0, -8);
    group.add(mars);

    const probe = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
    probe.position.set(-6, 0, 6);
    group.add(probe);
    gameState.slingshotProbe = probe;
    gameState.player = probe;
}

function firePlayerLaser() {
    if (!gameState.player) return;
    sound.playLaser();

    for (let x of [-1.2, 1.2]) {
        const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
        laser.rotation.x = Math.PI / 2;
        laser.position.set(gameState.player.position.x + x, gameState.player.position.y, gameState.player.position.z - 1.2);
        scene.add(laser);
        gameState.lasers.push(laser);
    }
}

function fireQuantumWavepacket() {
    if (!gameState.player) return;
    sound.playQuantumPing();
    const packet = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8 }));
    packet.position.set(gameState.player.position.x, 0, gameState.player.position.z - 1);
    packet.userData = { speed: 0.4, isQuantum: true };
    scene.add(packet);
    gameState.lasers.push(packet);
}

function captureFallingAtom() {
    sound.playClick();
}

function launchSlingshotProbe() {
    sound.playLaser();
    gameState.slingshotVel = { x: 0.18, z: -0.18 };
    showToast('🚀 Spacecraft probe launched toward Moon gravity assist!');
}

function spawnAsteroidEnemy() {
    const enemy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.8, 1), new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.8 }));
    enemy.position.set((Math.random() - 0.5) * 20, 0, -25);
    enemy.userData = { speed: 0.15 + Math.random() * 0.15 * gameState.wave, rotX: Math.random() * 0.05, rotY: Math.random() * 0.05 };
    scene.add(enemy);
    gameState.enemies.push(enemy);
}

function spawnFallingAtom() {
    const atomTypes = [{ s: 'H', col: 0xffffff }, { s: 'O', col: 0xef4444 }, { s: 'C', col: 0x334155 }];
    const chosen = atomTypes[Math.floor(Math.random() * atomTypes.length)];
    const atom = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshStandardMaterial({ color: chosen.col }));
    atom.position.set((Math.random() - 0.5) * 16, 0, -18);
    atom.userData = { speed: 0.18, type: chosen.s };
    scene.add(atom);
    gameState.enemies.push(atom);
}

function updateGamePhysics() {
    if (!gameState.player) return;

    const moveSpeed = 0.25;
    if (gameState.keys['KeyA'] || gameState.keys['ArrowLeft']) gameState.player.position.x = Math.max(-10, gameState.player.position.x - moveSpeed);
    if (gameState.keys['KeyD'] || gameState.keys['ArrowRight']) gameState.player.position.x = Math.min(10, gameState.player.position.x + moveSpeed);
    if (currentGame === 'space') {
        if (gameState.keys['KeyW'] || gameState.keys['ArrowUp']) gameState.player.position.z = Math.max(-5, gameState.player.position.z - moveSpeed);
        if (gameState.keys['KeyS'] || gameState.keys['ArrowDown']) gameState.player.position.z = Math.min(10, gameState.player.position.z + moveSpeed);
    }

    if (currentGame === 'space' && Math.random() < 0.035 * gameState.wave) {
        spawnAsteroidEnemy();
    } else if (currentGame === 'alchemy' && Math.random() < 0.03) {
        spawnFallingAtom();
    }

    // Lasers / Projectiles
    for (let i = gameState.lasers.length - 1; i >= 0; i--) {
        const l = gameState.lasers[i];
        l.position.z -= l.userData.speed || 0.8;
        if (l.position.z < -40) {
            scene.remove(l);
            gameState.lasers.splice(i, 1);
        }
    }

    // Enemies / Falling Objects
    for (let j = gameState.enemies.length - 1; j >= 0; j--) {
        const e = gameState.enemies[j];
        e.position.z += e.userData.speed;
        if (e.userData.rotX) e.rotation.x += e.userData.rotX;
        if (e.userData.rotY) e.rotation.y += e.userData.rotY;

        if (e.position.distanceTo(gameState.player.position) < 1.6) {
            if (currentGame === 'alchemy') {
                sound.playQuantumPing();
                gameState.score += 150;
                updateGameHud();
            } else {
                sound.playExplosion();
                gameState.lives--;
                updateGameHud();
                if (gameState.lives <= 0) {
                    endActiveGame();
                    return;
                }
            }
            scene.remove(e);
            gameState.enemies.splice(j, 1);
            continue;
        }

        for (let k = gameState.lasers.length - 1; k >= 0; k--) {
            const l = gameState.lasers[k];
            if (l.position.distanceTo(e.position) < 1.4) {
                sound.playExplosion();
                scene.remove(e);
                scene.remove(l);
                gameState.enemies.splice(j, 1);
                gameState.lasers.splice(k, 1);
                gameState.score += 100 * gameState.wave;
                updateGameHud();
                break;
            }
        }

        if (e && e.position.z > 15) {
            scene.remove(e);
            gameState.enemies.splice(j, 1);
        }
    }

    if (currentGame === 'slingshot' && gameState.slingshotProbe) {
        gameState.slingshotProbe.position.x += gameState.slingshotVel.x;
        gameState.slingshotProbe.position.z += gameState.slingshotVel.z;
    }
}

function updateGameHud() {
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const waveEl = document.getElementById('wave');
    const hsEl = document.getElementById('highScore');

    if (scoreEl) scoreEl.textContent = gameState.score;
    if (livesEl) livesEl.textContent = '❤️❤️❤️'.slice(0, Math.max(0, gameState.lives) * 2);
    if (waveEl) waveEl.textContent = gameState.wave;

    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('sciLab_highScore', gameState.highScore.toString());
        if (hsEl) hsEl.textContent = gameState.highScore;
    }
}

function startActiveGame() {
    gameState.running = true;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.wave = 1;
    updateGameHud();

    const goModal = document.getElementById('gameOver');
    if (goModal) goModal.style.display = 'none';

    sound.playClick();
    showToast('🚀 Game Simulation Active! Engage controls!');
}

function endActiveGame() {
    gameState.running = false;
    sound.playExplosion();

    const goModal = document.getElementById('gameOver');
    const finalScoreEl = document.getElementById('finalScore');
    if (goModal) goModal.style.display = 'block';
    if (finalScoreEl) finalScoreEl.textContent = gameState.score;
}

function restartActiveGame() {
    gameState.enemies.forEach(e => scene.remove(e));
    gameState.lasers.forEach(l => scene.remove(l));
    gameState.enemies = [];
    gameState.lasers = [];
    startActiveGame();
}

// ==========================================================================
// 13. DOM BOOTSTRAP
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initStars();
    initNav();

    // Live Cytology HUD Bindings
    const mitoProt = document.getElementById('mitoProtons');
    if (mitoProt) {
        mitoProt.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            const tag = document.getElementById('mitoProtonVal');
            const rpm = document.getElementById('mitoRpm');
            const yieldEl = document.getElementById('mitoAtpYield');
            if (tag) tag.textContent = `ΔpH ${(v * 0.4 + 0.2).toFixed(1)}`;
            if (rpm) rpm.textContent = `${Math.round(v * 2000)} RPM`;
            if (yieldEl) yieldEl.textContent = `${Math.round(v * 7.2)} ATP / Glucose`;
        });
    }
});
