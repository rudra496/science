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

    loadPhysicsExp('pendulum');

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
        case 'pendulum':
            camera.position.set(0, 2, 20);
            buildPendulumExp(expGroup, dynControls);
            break;
        case 'wave2d':
            camera.position.set(0, 22, 0.1);
            buildWave2DExp(expGroup, dynControls);
            break;
        case 'projectile':
            camera.position.set(0, 8, 30);
            buildProjectileExp(expGroup, dynControls);
            break;
        case 'magfield':
            camera.position.set(0, 4, 20);
            buildMagFieldExp(expGroup, dynControls);
            break;
        case 'springs':
            camera.position.set(0, 0, 18);
            buildSpringsExp(expGroup, dynControls);
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

    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const blackAlu = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 });

    // Laser Emitter Rig
    const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3, 32), blackAlu);
    emitter.rotation.z = Math.PI / 2;
    emitter.position.set(-14, 0, 0);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), new THREE.MeshPhysicalMaterial({ color: 0x22c55e, transmission: 0.9, opacity: 1, transparent: true }));
    lens.position.set(1.5, 0, 0);
    emitter.add(lens);
    group.add(emitter);

    // Double Slit Barrier
    const barrierGroup = new THREE.Group();
    barrierGroup.position.set(-4, 0, 0);
    const bTop = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.5, 12), steelMat);
    bTop.position.y = 3.5;
    const bBot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.5, 12), steelMat);
    bBot.position.y = -3.5;
    const bLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 5), steelMat);
    bLeft.position.set(0, 0, -3.5);
    const bRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 5), steelMat);
    bRight.position.set(0, 0, 3.5);
    const bMid = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 1.5), steelMat);
    bMid.position.set(0, 0, 0); // The gap creates the two slits
    barrierGroup.add(bTop, bBot, bLeft, bRight, bMid);
    group.add(barrierGroup);

    // Phosphor Detector Screen
    const screenGeo = new THREE.BoxGeometry(0.4, 10, 14);
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x052e16, roughness: 0.8 }); // Dark green phosphor
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(10, 0, 0);
    group.add(screen);

    // Photon Particles
    const count = 2000;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3] = -12 + Math.random() * 22;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x4ade80, size: 0.15, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
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

    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.95, opacity: 1, transparent: true, roughness: 0.05, clearcoat: 1.0, side: THREE.DoubleSide, ior: 1.5 });

    // Quartz Vacuum Tube
    const tubeGeo = new THREE.CylinderGeometry(3.0, 3.0, 12, 64, 1, true);
    const tube = new THREE.Mesh(tubeGeo, glassMat);
    tube.rotation.z = Math.PI / 2;
    group.add(tube);
    
    // Glass end caps
    const capGeo = new THREE.SphereGeometry(3.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap1 = new THREE.Mesh(capGeo, glassMat);
    cap1.position.set(6, 0, 0);
    cap1.rotation.z = -Math.PI / 2;
    const cap2 = new THREE.Mesh(capGeo, glassMat);
    cap2.position.set(-6, 0, 0);
    cap2.rotation.z = Math.PI / 2;
    group.add(cap1, cap2);

    // Cathode (Emitter Plate) - Sodium or Potassium
    const cathodeMat = new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.4, emissive: 0xf59e0b, emissiveIntensity: 0.1 });
    const cathode = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.4, 32), cathodeMat);
    cathode.rotation.z = Math.PI / 2;
    cathode.position.set(-4.5, 0, 0);
    group.add(cathode);
    const cathodeRod = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 16), steelMat);
    cathodeRod.rotation.z = Math.PI / 2;
    cathodeRod.position.set(-6, 0, 0);
    group.add(cathodeRod);

    // Anode (Collector)
    const anodeMat = new THREE.MeshPhysicalMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const anode = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32), anodeMat);
    anode.rotation.z = Math.PI / 2;
    anode.position.set(4.5, 0, 0);
    group.add(anode);
    const anodeRod = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 16), steelMat);
    anodeRod.rotation.z = Math.PI / 2;
    anodeRod.position.set(6, 0, 0);
    group.add(anodeRod);

    // Ejected Photoelectrons
    const eGeo = new THREE.BufferGeometry();
    const count = 500;
    const ePos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        ePos[i * 3] = -4.2 + Math.random() * 8.6;
        ePos[i * 3 + 1] = (Math.random() - 0.5) * 4;
        ePos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    const electrons = new THREE.Points(eGeo, new THREE.PointsMaterial({ color: 0x60a5fa, size: 0.2, blending: THREE.AdditiveBlending }));
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

    // Lead Collimator Gun
    const leadMat = new THREE.MeshPhysicalMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.8 });
    const gun = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 32), leadMat);
    gun.rotation.z = Math.PI / 2;
    gun.position.set(-14, 0, 0);
    group.add(gun);

    // Zinc Sulfide Scintillator Screen (Curved)
    const screenGeo = new THREE.CylinderGeometry(8, 8, 4, 64, 1, true, -Math.PI/2 - 1.2, 2.4);
    const screenMat = new THREE.MeshPhysicalMaterial({ color: 0x052e16, emissive: 0x052e16, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    group.add(screen);

    // Gold Nucleus (Highly detailed with nucleons)
    const nucGroup = new THREE.Group();
    const protonMat = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.4 });
    const neutronMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, roughness: 0.4 });
    
    // Pack 197 nucleons (79 protons, 118 neutrons) roughly into a sphere
    for (let i=0; i<197; i++) {
        const isProton = i < 79;
        const nucleon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), isProton ? protonMat : neutronMat);
        // Random point in sphere
        const r = 1.2 * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        nucleon.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
        nucGroup.add(nucleon);
    }
    
    // Add golden halo/electron cloud placeholder
    const halo = new THREE.Mesh(new THREE.SphereGeometry(2.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending }));
    nucGroup.add(halo);
    group.add(nucGroup);

    // Alpha Particles (He4 Nuclei)
    const aGeo = new THREE.BufferGeometry();
    const count = 1000;
    const aPos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        aPos[i * 3] = -14 + Math.random() * 20; // Spread along x axis
        aPos[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
        aPos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    aGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
    // We will update custom data array for velocities
    const vels = [];
    for(let i=0; i<count; i++) vels.push(new THREE.Vector3(0.5, 0, 0));
    
    const alphaPts = new THREE.Points(aGeo, new THREE.PointsMaterial({ color: 0xfca5a5, size: 0.3, blending: THREE.AdditiveBlending }));
    group.add(alphaPts);
    physData.particles = [alphaPts];
    physData.customData = vels;
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

    // Heavy Water Pool (Cherenkov Radiation glow)
    const poolGeo = new THREE.CylinderGeometry(12, 12, 20, 64);
    const poolMat = new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, transmission: 0.9, opacity: 1, transparent: true, emissive: 0x0284c7, emissiveIntensity: 0.3 });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.y = -2;
    group.add(pool);

    // Fuel Assembly Lattice
    const latticeGroup = new THREE.Group();
    const fuelGeo = new THREE.CylinderGeometry(0.3, 0.3, 10, 16);
    const fuelMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.8, emissive: 0x22c55e, emissiveIntensity: 0.5 });
    const rodGeo = new THREE.CylinderGeometry(0.35, 0.35, 12, 16);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });

    const rods = [];
    for (let x = -4; x <= 4; x += 2) {
        for (let z = -4; z <= 4; z += 2) {
            // Uranium Fuel Rod
            const fRod = new THREE.Mesh(fuelGeo, fuelMat);
            fRod.position.set(x, 0, z);
            latticeGroup.add(fRod);

            // Boron Control Rods interspersed
            if ((x+z) % 4 === 0) {
                const cRod = new THREE.Mesh(rodGeo, rodMat);
                cRod.position.set(x + 1, 4, z + 1); // Start partially inserted
                latticeGroup.add(cRod);
                rods.push(cRod);
            }
        }
    }
    group.add(latticeGroup);
    physData.customObjects = rods; // Save control rods for animation

    // Neutron Cloud
    const nGeo = new THREE.BufferGeometry();
    const count = 1500;
    const nPos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        nPos[i * 3] = (Math.random() - 0.5) * 10;
        nPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
        nPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
    
    const vels = [];
    for(let i=0; i<count; i++) vels.push(new THREE.Vector3((Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2));

    const neutrons = new THREE.Points(nGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, blending: THREE.AdditiveBlending }));
    group.add(neutrons);
    physData.particles = [neutrons];
    physData.customData = vels;
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

    // Magnetic Track (NdFeB array)
    const trackRad = 6;
    const trackGroup = new THREE.Group();
    
    // Base ring
    const baseMat = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(trackRad, 0.8, 32, 64), baseMat);
    baseRing.rotation.x = Math.PI / 2;
    trackGroup.add(baseRing);

    // Neodymium Magnets
    const magMatN = new THREE.MeshPhysicalMaterial({ color: 0xef4444, metalness: 0.9, roughness: 0.3 }); // North
    const magMatS = new THREE.MeshPhysicalMaterial({ color: 0x3b82f6, metalness: 0.9, roughness: 0.3 }); // South
    
    for (let i = 0; i < 36; i++) {
        const theta = (i / 36) * Math.PI * 2;
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 1.2), (i % 2 === 0) ? magMatN : magMatS);
        mag.position.set(Math.cos(theta) * trackRad, 0.9, Math.sin(theta) * trackRad);
        mag.rotation.y = -theta;
        trackGroup.add(mag);
    }
    group.add(trackGroup);

    // YBCO Superconductor Pellet in Liquid Nitrogen Bath
    const pelletGroup = new THREE.Group();
    pelletGroup.position.set(trackRad, 1.8, 0);
    
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.0, 0.6, 32, 1, true), new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.3, roughness: 0.1, side: THREE.DoubleSide }));
    pelletGroup.add(cup);
    
    const ln2 = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.95, 0.5, 32), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.8, opacity: 1, transparent: true }));
    pelletGroup.add(ln2);

    const pellet = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.3, 32), new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.9 })); // YBCO is black ceramic
    pellet.position.y = 0.1;
    pelletGroup.add(pellet);

    // LN2 Vapor smoke particles
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(200 * 3);
    for(let i=0; i<200; i++) {
        sPos[i*3] = (Math.random()-0.5)*2;
        sPos[i*3+1] = Math.random()*2;
        sPos[i*3+2] = (Math.random()-0.5)*2;
    }
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    const smoke = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true, opacity: 0.4 }));
    pelletGroup.add(smoke);

    pelletGroup.name = 'levitatingPellet';
    group.add(pelletGroup);
    physData.customObjects.push({ group: pelletGroup, smoke: smoke });
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

    const brassMat = new THREE.MeshPhysicalMaterial({ color: 0xb45309, metalness: 1.0, roughness: 0.2 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.95, opacity: 1, transparent: true, side: THREE.DoubleSide });

    // Enclosed viewing chamber
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 8, 32, 1, true), glassMat);
    group.add(chamber);

    // Condenser Plates
    const plateGeo = new THREE.CylinderGeometry(5.8, 5.8, 0.4, 32);
    const topPlate = new THREE.Mesh(plateGeo, brassMat);
    topPlate.position.y = 4;
    // Pinhole in top plate
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16), new THREE.MeshBasicMaterial({color: 0x000000}));
    topPlate.add(hole);
    group.add(topPlate);

    const botPlate = new THREE.Mesh(plateGeo, brassMat);
    botPlate.position.y = -4;
    group.add(botPlate);

    // Microscope Lens sticking out
    const lensRig = new THREE.Group();
    lensRig.position.set(0, 0, 6);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 4, 32), new THREE.MeshPhysicalMaterial({color: 0x1e293b, metalness: 0.9}));
    barrel.rotation.x = Math.PI / 2;
    lensRig.add(barrel);
    group.add(lensRig);

    // Atomizer Sprayer at top
    const sprayer = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.4, 3, 16), brassMat);
    sprayer.position.set(0, 6, 0);
    group.add(sprayer);

    // Drops
    const dropGeo = new THREE.BufferGeometry();
    const count = 100;
    const pos = new Float32Array(count * 3);
    const charges = [];
    for(let i=0; i<count; i++) {
        pos[i*3] = (Math.random()-0.5)*4;
        pos[i*3+1] = -4 + Math.random()*8;
        pos[i*3+2] = (Math.random()-0.5)*4;
        charges.push(Math.floor(Math.random() * 5) + 1); // 1e to 5e charge multiplier
    }
    dropGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const drops = new THREE.Points(dropGeo, new THREE.PointsMaterial({ color: 0xfde68a, size: 0.15 }));
    group.add(drops);
    physData.particles = [drops];
    physData.customData = charges;
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

    // Event Horizon (true black sphere)
    const bh = new THREE.Mesh(new THREE.SphereGeometry(2.4, 64, 64), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    group.add(bh);

    // Photon Sphere
    const photonSphere = new THREE.Mesh(
        new THREE.TorusGeometry(3.6, 0.04, 16, 128),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    photonSphere.rotation.x = Math.PI / 2;
    group.add(photonSphere);

    // Innermost Stable Circular Orbit (ISCO)
    const isco = new THREE.Mesh(
        new THREE.TorusGeometry(7.2, 0.03, 8, 128),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.5 })
    );
    isco.rotation.x = Math.PI / 2;
    group.add(isco);

    // Multi-layer glowing accretion disk
    const diskLayers = [
        { inner: 3.7, outer: 5.0, color: 0xffffff, emissive: 0xffffff, intensity: 1.5, opacity: 0.95 },
        { inner: 5.0, outer: 7.0, color: 0xf97316, emissive: 0xf97316, intensity: 1.0, opacity: 0.80 },
        { inner: 7.0, outer: 9.5, color: 0xf59e0b, emissive: 0xef4444, intensity: 0.5, opacity: 0.55 },
        { inner: 9.5, outer: 12.0, color: 0x7c3aed, emissive: 0x7c3aed, intensity: 0.2, opacity: 0.25 },
    ];
    diskLayers.forEach((dl, i) => {
        const disk = new THREE.Mesh(
            new THREE.RingGeometry(dl.inner, dl.outer, 128),
            new THREE.MeshStandardMaterial({ color: dl.color, emissive: dl.emissive, emissiveIntensity: dl.intensity, side: THREE.DoubleSide, transparent: true, opacity: dl.opacity, depthWrite: false })
        );
        disk.rotation.x = Math.PI / 2.5 + i * 0.04;
        disk.name = i === 0 ? 'accretionDisk' : `diskLayer${i}`;
        group.add(disk);
    });

    // Relativistic jets
    [1, -1].forEach(dir => {
        const jet = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.8, 14, 16, 1, true),
            new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
        );
        jet.position.y = dir * 9;
        if (dir < 0) jet.rotation.z = Math.PI;
        group.add(jet);
    });

    // Photon geodesic traces
    for (let j = 0; j < 12; j++) {
        const angle = (j / 12) * Math.PI * 2;
        const pts = [];
        let px = Math.cos(angle) * 12, py = 0, pz = Math.sin(angle) * 12;
        let vx = -Math.sin(angle) * 0.3, vy = 0.05, vz = Math.cos(angle) * 0.3;
        for (let s = 0; s < 80; s++) {
            const r = Math.sqrt(px*px+py*py+pz*pz);
            const grav = 6.0 / (r * r * r);
            vx -= px * grav; vy -= py * grav; vz -= pz * grav;
            px += vx; py += vy; pz += vz;
            pts.push(new THREE.Vector3(px, py, pz));
            if (r < 2.5) break;
        }
        if (pts.length > 2) {
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.3 })));
        }
    }

    // Point light inside for glow effect
    const glow = new THREE.PointLight(0xf97316, 3, 20);
    group.add(glow);
}



// 8. Special Relativity
function buildSpecialRelativityExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🚀 Lorentz Relativistic Transformation</h4>
            <label class="slider-label">Relativistic Velocity (v/c): <input type="range" id="relVel" min="0" max="0.99" step="0.01" value="0.8"><span class="val-tag" id="relVelVal">0.80 c</span></label>
            <label class="slider-label">Lorentz Factor (γ): <span class="val-tag text-cyan" id="gammaVal">1.667</span></label>
            <label class="slider-label">Time Dilation: <span class="val-tag" id="timeDilVal">-</span></label>
        `;
    }

    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, metalness: 0.4, roughness: 0.1, transmission: 0.3, transparent: true });

    // Observer station (stays fixed)
    const station = new THREE.Group();
    station.position.set(0, -2.5, 0);
    const stBody = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 2), new THREE.MeshPhysicalMaterial({ color: 0x334155, metalness: 0.8 }));
    const stDish = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.1, 1, 32), new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9 }));
    stDish.position.set(0, 1, 0);
    station.add(stBody, stDish);
    group.add(station);

    // Relativistic spaceship
    const rocket = new THREE.Group();
    rocket.name = 'relRocket';

    // Main fuselage (cone-cylinder-cone)
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 7, 32), steelMat);
    fuselage.rotation.z = Math.PI / 2;
    rocket.add(fuselage);

    const noseCone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.5, 32), glassMat);
    noseCone.rotation.z = -Math.PI / 2;
    noseCone.position.x = 4.75;
    rocket.add(noseCone);

    const rearCone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.5, 32), steelMat);
    rearCone.rotation.z = Math.PI / 2;
    rearCone.position.x = -4.25;
    rocket.add(rearCone);

    // Swept delta wings
    [1, -1].forEach(side => {
        const wing = new THREE.Mesh(
            new THREE.BoxGeometry(3.0, 0.1, 1.5),
            new THREE.MeshPhysicalMaterial({ color: 0x0284c7, metalness: 0.7 })
        );
        wing.position.set(-1, 0, side * 1.3);
        wing.rotation.y = side * 0.3;
        rocket.add(wing);
    });

    // Plasma engine glow
    const engineGlow = new THREE.PointLight(0x60a5fa, 2, 5);
    engineGlow.position.x = -5;
    rocket.add(engineGlow);

    // Reference length markers (ruler lines on fuselage)
    for (let i = -3; i <= 3; i++) {
        const tick = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.04), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
        tick.position.set(i, 0.7, 0);
        rocket.add(tick);
    }

    group.add(rocket);
    physData.customObjects.push(rocket);
}

// 9. Orbital Gravity
function buildOrbitalGravityExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🪐 N-Body Orbital Mechanics</h4>
            <label class="slider-label">Launch Velocity (km/s): <input type="range" id="orbVel" min="5" max="15" step="0.1" value="7.8"><span class="val-tag" id="orbVelVal">7.8 km/s</span></label>
            <label class="slider-label">Orbit Type: <span class="val-tag" id="orbTypeVal">Circular</span></label>
        `;
    }

    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });

    // Planet (Earth-like)
    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 64, 64),
        new THREE.MeshPhysicalMaterial({ color: 0x3b82f6, roughness: 0.7, metalness: 0.1 })
    );
    group.add(planet);

    // Land masses (procedural)
    const landMat = new THREE.MeshPhysicalMaterial({ color: 0x22c55e, roughness: 0.9 });
    for (let i = 0; i < 5; i++) {
        const phi = Math.random() * Math.PI;
        const theta = Math.random() * Math.PI * 2;
        const land = new THREE.Mesh(new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 16, 16), landMat);
        land.position.set(
            3.55 * Math.sin(phi) * Math.cos(theta),
            3.55 * Math.cos(phi),
            3.55 * Math.sin(phi) * Math.sin(theta)
        );
        planet.add(land);
    }

    // Atmosphere glow
    const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(3.8, 32, 32),
        new THREE.MeshPhysicalMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.15, side: THREE.BackSide })
    );
    group.add(atmo);

    // Orbital path rings at different altitudes
    const orbitalPaths = [7, 10, 14];
    orbitalPaths.forEach((r, i) => {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(r, 0.03, 8, 128),
            new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.4 - i*0.1 })
        );
        ring.rotation.x = Math.PI / 2 + i * 0.3;
        group.add(ring);
    });

    // Detailed satellite (ISS-like)
    const satGroup = new THREE.Group();
    satGroup.name = 'gravitySatellite';
    satGroup.position.set(7, 0, 0);

    const satBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.5), steelMat);
    satGroup.add(satBody);

    // Solar panels
    [1, -1].forEach(side => {
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 0.05, 0.8),
            new THREE.MeshPhysicalMaterial({ color: 0x1d4ed8, roughness: 0.6, metalness: 0.3 })
        );
        panel.position.z = side * 1.0;
        satGroup.add(panel);
    });

    group.add(satGroup);
    physData.customObjects.push(satGroup);

    // Moon
    const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 32, 32),
        new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, roughness: 0.9 })
    );
    moon.name = 'orbMoon';
    moon.position.set(14, 0, 0);
    group.add(moon);
    physData.customObjects.push(moon);
}

// 10. Lorentz Force
function buildLorentzForceExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🧲 Electrodynamics Parameters</h4>
            <label class="slider-label">Magnetic Field B (T): <input type="range" id="magB" min="0.5" max="5" value="2"></label>
            <label class="slider-label">Particle Charge (q): <input type="range" id="partQ" min="-2" max="2" step="0.5" value="1"></label>
            <label class="slider-label">Particle Velocity (v): <input type="range" id="partV" min="0.5" max="5" step="0.1" value="2"></label>
        `;
    }

    const copperMat = new THREE.MeshPhysicalMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.2, clearcoat: 0.5 });
    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

    // Helmholtz Coil pair (two large coils separated by their radius)
    [-6, 6].forEach(x => {
        const coilGroup = new THREE.Group();
        coilGroup.position.x = x;
        coilGroup.rotation.y = Math.PI / 2;

        // 8 winding layers per coil
        for (let w = 0; w < 8; w++) {
            const winding = new THREE.Mesh(
                new THREE.TorusGeometry(3.5 + w * 0.18, 0.08, 16, 64),
                copperMat
            );
            winding.position.x = (w - 3.5) * 0.1;
            coilGroup.add(winding);
        }

        // Coil support frame
        const frame = new THREE.Mesh(new THREE.TorusGeometry(4.1, 0.12, 8, 32), steelMat);
        coilGroup.add(frame);

        group.add(coilGroup);
    });

    // Magnetic field lines (field runs left-right along x axis)
    const fieldLineMat = new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.4 });
    for (let y = -3; y <= 3; y += 1.5) {
        for (let z = -3; z <= 3; z += 1.5) {
            const linePts = [];
            for (let x = -7; x <= 7; x += 0.5) linePts.push(new THREE.Vector3(x, y, z));
            const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
            group.add(new THREE.Line(lineGeo, fieldLineMat));
        }
    }

    // Charged particle trajectory (helix: F = qv x B)
    const helixPts = [];
    const B = 2, q = 1, v0 = 2;
    const omega = q * B; // cyclotron frequency
    const R = v0 / omega; // larmor radius
    for (let t = 0; t < 12; t += 0.05) {
        helixPts.push(new THREE.Vector3(
            t - 6,
            R * Math.sin(omega * t),
            R * Math.cos(omega * t)
        ));
    }
    const helixGeo = new THREE.BufferGeometry().setFromPoints(helixPts);
    const helixLine = new THREE.Line(helixGeo, new THREE.LineBasicMaterial({ color: 0xef4444 }));
    helixLine.name = 'lorentzHelix';
    group.add(helixLine);

    // Particle dot
    const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 32, 32),
        new THREE.MeshPhysicalMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.0 })
    );
    particle.name = 'lorentzParticle';
    group.add(particle);
    physData.customObjects = [particle];
    physData.state.lorentzT = 0;
}

// 11. Interferometer
function buildInterferometerExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🔬 Michelson Laser Interferometer</h4>
            <label class="slider-label">Arm Length Difference (ΔL): <input type="range" id="armDelta" min="-50" max="50" value="0"></label>
            <label class="slider-label">Fringe Pattern: <span class="val-tag" id="fringeVal">Constructive</span></label>
        `;
    }

    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.3 });
    const mirrorMat = new THREE.MeshPhysicalMaterial({ color: 0xe2e8f0, metalness: 1.0, roughness: 0.0, clearcoat: 1.0 });
    const glassMat  = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transmission: 0.7, opacity: 1.0, transparent: true, roughness: 0.05 });

    // Optical bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 16), steelMat);
    bench.position.y = -0.5;
    group.add(bench);

    // Laser source
    const laserBody = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 0.8), steelMat);
    laserBody.position.set(-7, 0.3, 0);
    group.add(laserBody);
    const laserLens = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 32), glassMat);
    laserLens.rotation.z = Math.PI/2;
    laserLens.position.set(-5.3, 0.3, 0);
    group.add(laserLens);

    // Beam Splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 1.5), glassMat);
    splitter.position.set(0, 0.3, 0);
    splitter.rotation.y = Math.PI / 4;
    group.add(splitter);

    // Mirror 1 (end of arm along X)
    const mirror1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2, 2), mirrorMat);
    mirror1.position.set(7, 0.3, 0);
    mirror1.name = 'mirror1';
    group.add(mirror1);

    // Mirror 2 (end of arm along Z)
    const mirror2 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.15), mirrorMat);
    mirror2.position.set(0, 0.3, 7);
    group.add(mirror2);

    // Detector screen
    const detector = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.2), new THREE.MeshPhysicalMaterial({ color: 0x052e16 }));
    detector.position.set(0, 0.3, -4);
    group.add(detector);

    // Laser beams (lines)
    const beamMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
    const beamH = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5, 0.3, 0), new THREE.Vector3(7, 0.3, 0)]), beamMat);
    const beamV = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.3, 7)]), beamMat);
    const beamR = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.3, -4)]), beamMat);
    group.add(beamH, beamV, beamR);

    physData.customObjects = [mirror1];
}

// 12. Optics Prism
function buildOpticsPrismExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🌈 Prism Chromatic Dispersion</h4>
            <label class="slider-label">Refractive Index (n): <input type="range" id="prismN" min="1.3" max="2.0" step="0.05" value="1.52"></label>
            <label class="slider-label">Incident Angle (θ): <input type="range" id="prismAngle" min="10" max="70" value="45"><span class="val-tag">45°</span></label>
        `;
    }

    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, roughness: 0.0, metalness: 0.0,
        transmission: 0.98, transparent: true, opacity: 1,
        ior: 1.52, clearcoat: 1.0, thickness: 3.0, side: THREE.DoubleSide
    });

    // Borosilicate glass equilateral prism (custom BufferGeometry)
    const prismVerts = new Float32Array([
        // Front face
        0, 3.5, 0.5,  -3, -1.5, 0.5,  3, -1.5, 0.5,
        // Back face
        0, 3.5,-0.5,  3, -1.5,-0.5,  -3, -1.5,-0.5,
        // Left
        0, 3.5, 0.5,  0, 3.5,-0.5,  -3,-1.5,-0.5,
        0, 3.5, 0.5, -3,-1.5,-0.5,  -3,-1.5, 0.5,
        // Right
        0, 3.5, 0.5,  3,-1.5, 0.5,   3,-1.5,-0.5,
        0, 3.5, 0.5,  3,-1.5,-0.5,   0, 3.5,-0.5,
        // Bottom
        -3,-1.5, 0.5,  3,-1.5,-0.5,  3,-1.5, 0.5,
        -3,-1.5, 0.5, -3,-1.5,-0.5,  3,-1.5,-0.5,
    ]);
    const prismGeo = new THREE.BufferGeometry();
    prismGeo.setAttribute('position', new THREE.BufferAttribute(prismVerts, 3));
    prismGeo.computeVertexNormals();
    const prism = new THREE.Mesh(prismGeo, glassMat);
    prism.position.x = -1;
    group.add(prism);

    // Incident white beam
    const incidentMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10, 1.5, 0), new THREE.Vector3(-2, 1.5, 0)]),
        incidentMat
    ));

    // Dispersed spectral rays
    const colors = [0xff0000, 0xff6600, 0xffff00, 0x00ff00, 0x0088ff, 0x4400ff, 0x8800ff];
    colors.forEach((col, i) => {
        const offset = (i - 3) * 0.45;
        const ray = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(1.5, 1.5, 0),
                new THREE.Vector3(10, 1.5 - 1.5 + offset, 0)
            ]),
            new THREE.LineBasicMaterial({ color: col })
        );
        group.add(ray);
    });

    // Optical bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(22, 0.3, 4), new THREE.MeshPhysicalMaterial({ color: 0x1e293b, metalness: 0.8 }));
    bench.position.y = -2.5;
    group.add(bench);
}

// 13. Doppler Effect
function buildDopplerExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>📢 Doppler &amp; Supersonic Mach Cone</h4>
            <label class="slider-label">Mach Number (M): <input type="range" id="machM" min="0.2" max="3.0" step="0.1" value="1.4"><span class="val-tag" id="machMval">1.4</span></label>
            <label class="slider-label">Mach Angle: <span class="val-tag" id="machAngle">45.6°</span></label>
        `;
    }

    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

    // Supersonic jet (procedural aircraft)
    const jet = new THREE.Group();
    jet.name = 'dopplerJet';
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 32), steelMat);
    fuselage.rotation.z = Math.PI / 2;
    jet.add(fuselage);
    const noseC = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 32), steelMat);
    noseC.rotation.z = -Math.PI / 2;
    noseC.position.x = 5.5;
    jet.add(noseC);
    [1,-1].forEach(s => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 2), new THREE.MeshPhysicalMaterial({ color: 0x64748b, metalness: 0.8 }));
        wing.position.set(-1, 0, s * 1.5);
        wing.rotation.y = s * -0.2;
        jet.add(wing);
        const fin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.2), new THREE.MeshPhysicalMaterial({ color: 0x64748b, metalness: 0.8 }));
        fin.position.set(-3, s * 0.5, 0);
        fin.rotation.z = s * 0.6;
        jet.add(fin);
    });
    jet.position.set(0, 3, 0);
    group.add(jet);

    // Expanding spherical wavefronts
    const waveMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.3 });
    const waves = [];
    for (let r = 1; r <= 8; r++) {
        const wave = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), waveMat.clone());
        wave.position.set(-r * 0.5, 3, 0); // Offset back based on source motion
        wave.name = `dopplerWave${r}`;
        group.add(wave);
        waves.push(wave);
    }
    physData.customObjects = waves;
    physData.customData = jet;
}

// 14. Chaotic Double Pendulum
function buildDoublePendulumExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>⚖️ Chaotic Double Pendulum</h4>
            <label class="slider-label">Mass 1 (kg): <input type="range" id="pendM1" min="1" max="5" value="2"></label>
            <label class="slider-label">Mass 2 (kg): <input type="range" id="pendM2" min="1" max="5" value="1"></label>
            <label class="slider-label">Initial θ₁ (°): <input type="range" id="pendTheta" min="10" max="170" value="90"></label>
        `;
    }

    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const redMat   = new THREE.MeshPhysicalMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.4, clearcoat: 0.8 });
    const blueMat  = new THREE.MeshPhysicalMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.4, clearcoat: 0.8 });

    // Pivot mount
    const mount = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 0.5), steelMat);
    mount.position.y = 0.5;
    group.add(mount);

    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 32), steelMat);
    pivot.rotation.z = Math.PI / 2;
    pivot.position.y = 0.5;
    group.add(pivot);

    // Arm 1 (upper)
    const arm1Group = new THREE.Group();
    arm1Group.position.y = 0.5;
    arm1Group.name = 'pendArm1';

    const arm1Rod = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 5, 16), steelMat);
    arm1Rod.position.y = -2.5;
    arm1Group.add(arm1Rod);

    const bob1 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), redMat);
    bob1.position.y = -5;
    bob1.name = 'pendBob1';
    arm1Group.add(bob1);

    const bearing1 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.1, 8, 32), steelMat);
    bearing1.rotation.x = Math.PI / 2;
    arm1Group.add(bearing1);

    group.add(arm1Group);

    // Arm 2 (lower) - attaches to bob1
    const arm2Group = new THREE.Group();
    arm2Group.position.y = -5;
    arm2Group.name = 'pendArm2';

    const arm2Rod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 4, 16), steelMat);
    arm2Rod.position.y = -2;
    arm2Group.add(arm2Rod);

    const bob2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), blueMat);
    bob2.position.y = -4;
    bob2.name = 'pendBob2';
    arm2Group.add(bob2);

    const bearing2 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 8, 32), steelMat);
    bearing2.rotation.x = Math.PI / 2;
    arm2Group.add(bearing2);

    arm1Group.add(arm2Group);

    physData.state.th1 = Math.PI / 2;
    physData.state.th2 = Math.PI / 3;
    physData.state.w1 = 0;
    physData.state.w2 = 0;
    physData.customObjects = [arm1Group, arm2Group, bob1, bob2];

    // Chaos trace line
    const traceGeo = new THREE.BufferGeometry();
    const tracePts = new Float32Array(600);
    traceGeo.setAttribute('position', new THREE.BufferAttribute(tracePts, 3));
    const traceLine = new THREE.Line(traceGeo, new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.6 }));
    traceLine.name = 'pendTrace';
    traceLine.frustumCulled = false;
    group.add(traceLine);
    physData.particles = [traceLine];
    physData.customData = { traceIdx: 0, tracePts };
}

// 15. Lorenz Attractor
function buildLorenzAttractorExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🦋 Lorenz Non-Linear Parameters</h4>
            <label class="slider-label">Prandtl Number (σ): <input type="range" id="lorSigma" min="5" max="20" value="10"></label>
            <label class="slider-label">Rayleigh Number (ρ): <input type="range" id="lorRho" min="10" max="40" value="28"></label>
            <label class="slider-label">Beta (β): <input type="range" id="lorBeta" min="1" max="5" step="0.1" value="2.667"></label>
        `;
    }

    const sigma = 10, rho = 28, beta = 8/3;
    let x = 0.1, y = 0, z = 0;
    const dt = 0.006;
    const pts = [];
    for (let i = 0; i < 6000; i++) {
        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;
        x += dx; y += dy; z += dz;
        pts.push(new THREE.Vector3(x * 0.55, y * 0.55, (z - 25) * 0.55));
    }

    // Multi-color gradient tube
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 2000, 0.18, 8, false);

    // Assign colors per vertex based on position along tube
    const colors = new Float32Array(tubeGeo.attributes.position.count * 3);
    const nPts = tubeGeo.attributes.position.count;
    for (let i = 0; i < nPts; i++) {
        const t = i / nPts;
        const color = new THREE.Color();
        color.setHSL(t, 1.0, 0.6);
        colors[i * 3]     = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    tubeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const tube = new THREE.Mesh(tubeGeo, new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.3, emissiveIntensity: 0.5
    }));
    tube.name = 'lorenzTube';
    group.add(tube);

    // Point light following the path
    const pathLight = new THREE.PointLight(0x7c3aed, 4, 15);
    pathLight.name = 'lorenzLight';
    group.add(pathLight);
    physData.customObjects = [tube, pathLight];
    physData.state.lorenzPathIdx = 0;
    physData.state.lorenzPts = pts;
}

// 16. Fluid Vortex Shedding
function buildFluidVortexExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🌊 Kármán Vortex Street</h4>
            <label class="slider-label">Reynolds Number (Re): <input type="range" id="fluidRe" min="50" max="1000" value="200"><span class="val-tag" id="fluidReVal">200</span></label>
            <label class="slider-label">Vortex Shedding: <span class="val-tag" id="vortexState">Active</span></label>
        `;
    }

    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });

    // Flow channel walls
    const wallMat = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, metalness: 0.5 });
    const wallTop = new THREE.Mesh(new THREE.BoxGeometry(28, 0.5, 8), wallMat);
    wallTop.position.y = 5.5;
    group.add(wallTop);
    const wallBot = new THREE.Mesh(new THREE.BoxGeometry(28, 0.5, 8), wallMat);
    wallBot.position.y = -5.5;
    group.add(wallBot);

    // Cylindrical obstacle
    const obs = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 64), steelMat);
    group.add(obs);

    // Velocity vector arrows (simplified as cones)
    for (let x = -12; x <= -4; x += 2) {
        for (let y = -4; y <= 4; y += 2) {
            const arrow = new THREE.Mesh(
                new THREE.ConeGeometry(0.15, 0.6, 8),
                new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
            );
            arrow.position.set(x, y, 0);
            arrow.rotation.z = -Math.PI / 2;
            group.add(arrow);
        }
    }

    // Flow particles
    const count = 2000;
    const fGeo = new THREE.BufferGeometry();
    const fPos = new Float32Array(count * 3);
    const fCol = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        fPos[i*3]   = -14 + Math.random() * 28;
        fPos[i*3+1] = (Math.random() - 0.5) * 10;
        fPos[i*3+2] = (Math.random() - 0.5) * 6;
        // Color by velocity (blue=slow, white=fast)
        fCol[i*3] = 0.2; fCol[i*3+1] = 0.5; fCol[i*3+2] = 1.0;
    }
    fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
    fGeo.setAttribute('color', new THREE.BufferAttribute(fCol, 3));
    const fPts = new THREE.Points(fGeo, new THREE.PointsMaterial({ vertexColors: true, size: 0.2, blending: THREE.AdditiveBlending }));
    group.add(fPts);
    physData.particles = [fPts];
}

// 17. Thermodynamics
function buildThermodynamicsExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🌡️ Maxwell-Boltzmann Kinetic Theory</h4>
            <label class="slider-label">Temperature (K): <input type="range" id="thermoTemp" min="50" max="2000" value="300"><span class="val-tag" id="thermoTempVal">300 K</span></label>
            <label class="slider-label">Gas Species: <select id="gasSpecies" class="panel-select">
                <option value="He">He (Helium, m=4)</option>
                <option value="N2" selected>N₂ (Nitrogen, m=28)</option>
                <option value="Ar">Ar (Argon, m=40)</option>
            </select></label>
            <label class="slider-label">vₚ: <span class="val-tag" id="vmpVal">-</span></label>
        `;
    }

    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8, transmission: 0.6, opacity: 1, transparent: true,
        roughness: 0.1, side: THREE.BackSide
    });
    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });

    // Piston-cylinder apparatus
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 10, 64, 1, true), glassMat);
    group.add(cylinder);

    // Metal end caps
    const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.4, 32), steelMat);
    capMesh.position.y = -5;
    group.add(capMesh);

    // Piston
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 0.8, 32), steelMat);
    piston.name = 'thermoPiston';
    piston.position.y = 4.5;
    group.add(piston);

    // Piston rod
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 16), steelMat);
    rod.name = 'thermoPistonRod';
    rod.position.y = 7;
    group.add(rod);

    // Gas molecules
    const count = 300;
    const gGeo = new THREE.BufferGeometry();
    const gPos = new Float32Array(count * 3);
    const gCol = new Float32Array(count * 3);
    const gVel = [];
    for (let i = 0; i < count; i++) {
        gPos[i*3]   = (Math.random()-0.5)*6;
        gPos[i*3+1] = -4 + Math.random()*7;
        gPos[i*3+2] = (Math.random()-0.5)*6;
        const v = Math.random() * 0.3 + 0.1;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2*Math.random()-1);
        gVel.push(new THREE.Vector3(
            v*Math.sin(phi)*Math.cos(theta),
            v*Math.sin(phi)*Math.sin(theta),
            v*Math.cos(phi)
        ));
        // Color by speed (blue=slow, red=fast)
        const speed = v / 0.4;
        gCol[i*3] = speed; gCol[i*3+1] = 0.2; gCol[i*3+2] = 1.0 - speed;
    }
    gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    gGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
    const gPts = new THREE.Points(gGeo, new THREE.PointsMaterial({ vertexColors: true, size: 0.35, blending: THREE.AdditiveBlending }));
    group.add(gPts);
    physData.particles = [gPts];
    physData.customData = gVel;
}

// 18. Wave Motion
function buildWaveMotionExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>〰️ Standing Waves &amp; Harmonics</h4>
            <label class="slider-label">Harmonic Mode (n): <input type="range" id="waveMode" min="1" max="8" value="2"><span class="val-tag" id="waveModeVal">2</span></label>
            <label class="slider-label">Amplitude: <input type="range" id="waveAmp" min="0.2" max="3" step="0.1" value="1.5"><span class="val-tag" id="waveAmpVal">1.5</span></label>
            <label class="slider-label">Show: <label><input type="radio" name="waveShow" value="transverse" checked> Transverse</label> <label><input type="radio" name="waveShow" value="longitudinal"> Longitudinal</label></label>
        `;
    }

    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });

    // String support frame
    [-8, 8].forEach(x => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4, 16), steelMat);
        post.position.set(x, -2, 0);
        group.add(post);
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 1.5), steelMat);
        base.position.set(x, -4, 0);
        group.add(base);
    });

    // Tensioning clamps
    [-8, 8].forEach(x => {
        const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.4), new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, metalness: 0.9 }));
        clamp.position.set(x, 0, 0);
        group.add(clamp);
    });

    // The vibrating string (built dynamically each frame, first pass)
    const pts = [];
    const n = 2;
    for (let i = 0; i <= 100; i++) {
        const x = -8 + (i / 100) * 16;
        pts.push(new THREE.Vector3(x, Math.sin(n * Math.PI * (i / 100)) * 1.5, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const waveTube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 100, 0.12, 8, false),
        new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, emissive: 0x0284c7, emissiveIntensity: 0.4, roughness: 0.2 })
    );
    waveTube.name = 'standingWaveTube';
    group.add(waveTube);

    // Node markers (spheres at nodes)
    const nodeGroup = new THREE.Group();
    nodeGroup.name = 'waveNodes';
    group.add(nodeGroup);

    physData.customObjects = [waveTube, nodeGroup];
}

function updatePhysicsSimulation(timeWarp) {
    // --- EXP 1: Double Slit Quantum Interference ---
    if (currentExperiment === 'slit' && physData.particles[0]) {
        const pos = physData.particles[0].geometry.attributes.position.array;
        const d = parseFloat(document.getElementById('slitSep')?.value || 1.5);
        const collapse = document.getElementById('quantumDetector')?.checked || false;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i] += 0.35 * timeWarp;
            if (pos[i] > 10.5) {
                pos[i] = -13;
                pos[i+1] = (Math.random() - 0.5) * 0.3;
                pos[i+2] = (Math.random() - 0.5) * 0.3;
            }
            // After the slit barrier, apply interference/particle deflection
            if (pos[i] > -3.9 && pos[i] < -3.8) {
                if (!collapse) {
                    // Wave: randomly pick one of two diffraction lobes
                    const slit = Math.random() > 0.5 ? d/2 : -d/2;
                    const angle = (Math.random() - 0.5) * 0.8;
                    pos[i+2] = slit;
                    // Interference fringes: reject if at destructive node
                    const n = Math.round(pos[i+2] * 2);
                    if (n % 2 !== 0) { pos[i+2] += (Math.random()-0.5)*0.5; }
                } else {
                    // Particle: goes through ONE slit
                    pos[i+2] = Math.random() > 0.5 ? d : -d;
                }
            }
        }
        physData.particles[0].geometry.attributes.position.needsUpdate = true;

    // --- EXP 2: Photoelectric Effect ---
    } else if (currentExperiment === 'photoelectric' && physData.particles[0]) {
        const pos = physData.particles[0].geometry.attributes.position.array;
        const lambda = parseFloat(document.getElementById('photoLambda')?.value || 320);
        const intensity = parseFloat(document.getElementById('photoIntensity')?.value || 5);
        // Work function of sodium: ~2.3 eV. Photon energy E = hc/λ
        // Using scaled values: threshold ~360nm UV
        const active = lambda < 370;
        const ejectFrac = active ? (intensity / 10) : 0;
        const speed = active ? (370 - lambda) / 370 * 0.4 : 0;
        for (let i = 0; i < pos.length; i += 3) {
            if (i < ejectFrac * pos.length) {
                pos[i] += speed * timeWarp;
            }
            if (pos[i] > 4.5) {
                pos[i] = -4.2;
                pos[i+1] = (Math.random() - 0.5) * 4;
                pos[i+2] = (Math.random() - 0.5) * 4;
            }
        }
        physData.particles[0].geometry.attributes.position.needsUpdate = true;

    // --- EXP 3: Rutherford Alpha Scattering (Coulomb force) ---
    } else if (currentExperiment === 'rutherford' && physData.particles[0]) {
        const pos = physData.particles[0].geometry.attributes.position.array;
        const vels = physData.customData;
        const energy = parseFloat(document.getElementById('alphaEnergy')?.value || 5.5);
        if (vels) {
            for (let i = 0; i < pos.length; i += 3) {
                const v = vels[i/3];
                const spd = (energy / 5.5) * 0.3;
                pos[i]   += v.x * spd * timeWarp;
                pos[i+1] += v.y * spd * timeWarp;
                pos[i+2] += v.z * spd * timeWarp;
                // Coulomb repulsion from nucleus at origin
                const rx = pos[i], ry = pos[i+1], rz = pos[i+2];
                const r2 = rx*rx + ry*ry + rz*rz;
                if (r2 < 36 && r2 > 0.01) {
                    const r = Math.sqrt(r2);
                    const force = 1.5 / r2;
                    v.x += (rx/r) * force * timeWarp;
                    v.y += (ry/r) * force * timeWarp;
                    v.z += (rz/r) * force * timeWarp;
                }
                if (r2 > 225 || pos[i] > 12) {
                    pos[i] = -14 + Math.random() * 2;
                    pos[i+1] = (Math.random() - 0.5) * 0.6;
                    pos[i+2] = (Math.random() - 0.5) * 0.6;
                    v.set(0.5, 0, 0);
                }
            }
        }
        physData.particles[0].geometry.attributes.position.needsUpdate = true;

    // --- EXP 4: Nuclear Fission (control rods + neutron walk) ---
    } else if (currentExperiment === 'fission' && physData.particles[0]) {
        const pos = physData.particles[0].geometry.attributes.position.array;
        const vels = physData.customData;
        const rods = physData.customObjects;
        const insertion = parseFloat(document.getElementById('controlRods')?.value || 40);
        const rodY = 6 - (insertion / 100) * 12;
        if (rods) rods.forEach(rod => {
            rod.position.y = THREE.MathUtils.lerp(rod.position.y, rodY, 0.05);
        });
        const keff = Math.max(0, 1.5 - insertion / 100); // More insertion = lower keff
        const kEl = document.getElementById('keffVal');
        if (kEl) kEl.textContent = keff.toFixed(2);
        if (vels) {
            for (let i = 0; i < pos.length; i += 3) {
                pos[i]   += vels[i/3].x * timeWarp * keff;
                pos[i+1] += vels[i/3].y * timeWarp * keff;
                pos[i+2] += vels[i/3].z * timeWarp * keff;
                if (Math.abs(pos[i])>6||Math.abs(pos[i+1])>6||Math.abs(pos[i+2])>6) {
                    pos[i]   = (Math.random()-0.5)*2;
                    pos[i+1] = (Math.random()-0.5)*2;
                    pos[i+2] = (Math.random()-0.5)*2;
                    vels[i/3].set((Math.random()-0.5)*0.4,(Math.random()-0.5)*0.4,(Math.random()-0.5)*0.4);
                }
            }
        }
        physData.particles[0].geometry.attributes.position.needsUpdate = true;

    // --- EXP 5: Superconductivity Meissner Levitation ---
    } else if (currentExperiment === 'superconduct') {
        if (physData.customObjects[0]) {
            const obj = physData.customObjects[0];
            const angle = simTime * 1.5;
            const hoverY = 1.8 + Math.sin(simTime * 5) * 0.12;
            obj.group.position.set(Math.cos(angle) * 6, hoverY, Math.sin(angle) * 6);
            obj.group.rotation.x = Math.sin(simTime*3) * 0.08;
            obj.group.rotation.z = Math.cos(simTime*4) * 0.08;
            const sPos = obj.smoke.geometry.attributes.position.array;
            for(let i=0; i<sPos.length; i+=3) {
                sPos[i+1] += 0.04 * timeWarp;
                sPos[i]   += (Math.random()-0.5)*0.03;
                sPos[i+2] += (Math.random()-0.5)*0.03;
                if(sPos[i+1] > 2.5) { sPos[i+1] = -0.1; }
            }
            obj.smoke.geometry.attributes.position.needsUpdate = true;
        }

    // --- EXP 6: Millikan Oil Drop (gravity + E field) ---
    } else if (currentExperiment === 'millikan' && physData.particles[0]) {
        const pos = physData.particles[0].geometry.attributes.position.array;
        const charges = physData.customData;
        const voltage = parseFloat(document.getElementById('millikanVolt')?.value || 250);
        const E = voltage / 8; // Electric field E = V/d
        if (charges) {
            for (let i = 0; i < pos.length; i += 3) {
                const q = charges[i/3];
                const Fg = -0.015;  // Gravity downward
                const Fv = 0.003;   // Viscous drag (Stokes law)
                const Fe = (E / 500) * 0.04 * q; // Electric force F = qE
                pos[i+1] += (Fg + Fe - Fv * Math.sign(Fg + Fe)) * timeWarp;
                pos[i]   += (Math.random()-0.5)*0.01; // Brownian
                pos[i+2] += (Math.random()-0.5)*0.01;
                if (pos[i+1] < -4) { pos[i+1] = 4; }
                if (pos[i+1] > 4)  { pos[i+1] = -4; }
            }
        }
        physData.particles[0].geometry.attributes.position.needsUpdate = true;

    // --- EXP 7: Black Hole - rotate ALL disk layers + scale by mass ---
    } else if (currentExperiment === 'blackhole') {
        const mass = parseFloat(document.getElementById('bhMass')?.value || 4);
        const spin = parseFloat(document.getElementById('bhSpin')?.value || 0.75);
        for (let i = 0; i < 4; i++) {
            const d = scene.getObjectByName(i === 0 ? 'accretionDisk' : `diskLayer${i}`);
            if (d) {
                d.rotation.z += (0.02 + i * 0.01) * timeWarp * (1 + spin * 0.5);
                d.scale.setScalar(mass / 4); // Larger mass = larger disk
            }
        }

    // --- EXP 8: Special Relativity - Lorentz contraction + time dilation display ---
    } else if (currentExperiment === 'relativity') {
        const rocket = scene.getObjectByName('relRocket');
        const velInput = document.getElementById('relVel');
        if (rocket && velInput) {
            const v = parseFloat(velInput.value);
            const gamma = 1 / Math.sqrt(Math.max(0.001, 1 - v*v));
            rocket.scale.x = 1 / gamma;  // Lorentz contraction along axis of motion
            rocket.position.x = Math.sin(simTime * v * 2) * 3; // Motion visualization
            const gVal = document.getElementById('gammaVal');
            if (gVal) gVal.textContent = gamma.toFixed(3);
            const vVal = document.getElementById('relVelVal');
            if (vVal) vVal.textContent = `${v.toFixed(2)} c`;
            const tVal = document.getElementById('timeDilVal');
            if (tVal) tVal.textContent = `t' = t / ${gamma.toFixed(2)}γ`;
        }

    // --- EXP 9: Orbital Gravity - Keplerian orbits + moon ---
    } else if (currentExperiment === 'gravity') {
        const v = parseFloat(document.getElementById('orbVel')?.value || 7.8);
        // r = GM/v^2 scaled: higher v = smaller orbit
        const r = Math.max(4, 11.5 - (v - 5) * 0.7);
        const sat = scene.getObjectByName('gravitySatellite');
        if (sat) {
            const a = simTime * (7.8 / r);
            sat.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
            sat.rotation.y = a;
            // Classify orbit type
            const typeEl = document.getElementById('orbTypeVal');
            if (typeEl) typeEl.textContent = v < 7 ? 'Sub-orbital' : v < 11.2 ? 'Circular' : v < 13 ? 'Elliptical' : 'Escape';
        }
        const moon = scene.getObjectByName('orbMoon');
        if (moon) {
            moon.position.set(Math.cos(simTime * 0.3) * 14, 0, Math.sin(simTime * 0.3) * 14);
            moon.rotation.y += 0.01;
        }

    // --- EXP 10: Lorentz Force - helical particle path ---
    } else if (currentExperiment === 'lorentz') {
        const B = parseFloat(document.getElementById('magB')?.value || 2);
        const q = parseFloat(document.getElementById('partQ')?.value || 1);
        const v0 = parseFloat(document.getElementById('partV')?.value || 2);
        if (physData.state.lorentzT !== undefined) {
            physData.state.lorentzT += 0.05 * timeWarp;
        } else {
            physData.state.lorentzT = 0;
        }
        const t = physData.state.lorentzT;
        const omega = Math.abs(q) * B;
        const R = v0 / Math.max(0.1, omega);
        const particle = scene.getObjectByName('lorentzParticle');
        if (particle) {
            particle.position.set(
                t * 0.8 - 6,            // Drift along x (parallel to B)
                R * Math.sin(omega * t * q), // Circular motion
                R * Math.cos(omega * t * q)
            );
            // Wrap around
            if (particle.position.x > 6) physData.state.lorentzT = 0;
        }

    // --- EXP 11: Interferometer - mirror wobble shows fringe shift ---
    } else if (currentExperiment === 'interferometer') {
        const delta = parseFloat(document.getElementById('armDelta')?.value || 0);
        const mirror1 = scene.getObjectByName('mirror1');
        if (mirror1) {
            mirror1.position.x = 7 + delta * 0.02;
        }
        const fringeEl = document.getElementById('fringeVal');
        if (fringeEl) {
            const phase = (delta % 10) / 10;
            fringeEl.textContent = phase < 0.25 || phase > 0.75 ? 'Constructive 🔆' : 'Destructive 🌑';
        }

    // --- EXP 12: Optics Prism - no animation needed (static) ---
    // --- EXP 13: Doppler Effect - jet + expanding wavefronts ---
    } else if (currentExperiment === 'doppler') {
        const M = parseFloat(document.getElementById('machM')?.value || 1.4);
        const jet = physData.customData;
        if (jet) {
            jet.position.x = ((simTime * M * 3) % 24) - 12;
        }
        const waves = physData.customObjects;
        if (waves && waves.length) {
            waves.forEach((wave, i) => {
                // Each wave sphere emitted at a previous position
                const emitX = jet ? jet.position.x - (waves.length - i) * M * 0.5 : -i * M * 0.5;
                wave.position.x = emitX;
                wave.scale.setScalar(1 + (simTime % 3) * 0.5 + i * 0.3); // Expand
            });
        }
        const angleEl = document.getElementById('machAngle');
        if (angleEl && M > 1) angleEl.textContent = `${(Math.asin(1/M) * 180/Math.PI).toFixed(1)}°`;

    // --- EXP 14: Double Pendulum (fully physics-based Runge-Kutta) ---
    } else if (currentExperiment === 'double_pendulum') {
        const m1 = parseFloat(document.getElementById('pendM1')?.value || 2);
        const m2 = parseFloat(document.getElementById('pendM2')?.value || 1);
        const g = 9.8, L1 = 5, L2 = 4;
        let { th1, th2, w1, w2 } = physData.state;
        
        // Lagrangian equations of motion
        const dt = 0.016 * timeWarp;
        const denom1 = (2*m1 + m2 - m2*Math.cos(2*th1-2*th2));
        const a1 = (-g*(2*m1+m2)*Math.sin(th1) - m2*g*Math.sin(th1-2*th2) - 2*Math.sin(th1-th2)*m2*(w2*w2*L2+w1*w1*L1*Math.cos(th1-th2))) / (L1*denom1);
        const a2 = (2*Math.sin(th1-th2)*(w1*w1*L1*(m1+m2)+g*(m1+m2)*Math.cos(th1)+w2*w2*L2*m2*Math.cos(th1-th2))) / (L2*denom1);
        w1 += a1 * dt; w2 += a2 * dt;
        th1 += w1 * dt; th2 += w2 * dt;
        physData.state.th1 = th1; physData.state.th2 = th2;
        physData.state.w1 = w1; physData.state.w2 = w2;
        
        const arm1 = scene.getObjectByName('pendArm1');
        const arm2 = scene.getObjectByName('pendArm2');
        if (arm1) arm1.rotation.z = th1;
        if (arm2) arm2.rotation.z = th2;
        
        // Draw chaos trace for bob2
        if (physData.customData) {
            const { tracePts, traceIdx } = physData.customData;
            const bx2 = Math.sin(th1)*L1 + Math.sin(th2)*L2;
            const by2 = -Math.cos(th1)*L1 - Math.cos(th2)*L2;
            const idx = traceIdx % 200;
            tracePts[idx*3]   = bx2;
            tracePts[idx*3+1] = by2 + 0.5;
            tracePts[idx*3+2] = 0;
            physData.customData.traceIdx = idx + 1;
            const traceLine = scene.getObjectByName('pendTrace');
            if (traceLine) traceLine.geometry.attributes.position.needsUpdate = true;
        }

    // --- EXP 15: Lorenz Attractor - light following the path ---
    } else if (currentExperiment === 'lorenz') {
        const tube = scene.getObjectByName('lorenzTube');
        if (tube) { tube.rotation.z += 0.004 * timeWarp; tube.rotation.x += 0.001 * timeWarp; }
        const light = scene.getObjectByName('lorenzLight');
        if (light && physData.state.lorenzPts) {
            const idx = Math.floor(physData.state.lorenzPathIdx) % physData.state.lorenzPts.length;
            const pt = physData.state.lorenzPts[idx];
            if (pt) light.position.copy(pt);
            physData.state.lorenzPathIdx += 3 * timeWarp;
        }

    // --- EXP 16: Fluid Dynamics / Karman Vortex ---
    } else if (currentExperiment === 'fluid' && physData.particles[0]) {
        const pos = physData.particles[0].geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i] += 0.2 * timeWarp;
            if (pos[i] > 12) pos[i] = -12;
            // Karman vortex shedding pattern
            const dx = pos[i] - 0; const dz = pos[i+2] - 0;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < 3 && dist > 0.1) {
                // Deflect around obstacle
                pos[i+1] += (Math.sin(simTime*3 + i)*0.06) * timeWarp;
                pos[i+2] += (dz/dist) * 0.08 * timeWarp;
            } else if (pos[i] > 2) {
                // Alternating vortex trail
                pos[i+1] += Math.sin(simTime*2.5 + pos[i]*0.5) * 0.04 * timeWarp;
            }
        }
        physData.particles[0].geometry.attributes.position.needsUpdate = true;

    // --- EXP 17: Thermodynamics - velocity-based kinetic gas + piston ---
    } else if (currentExperiment === 'thermo' && physData.particles[0]) {
        const pos = physData.particles[0].geometry.attributes.position.array;
        const col = physData.particles[0].geometry.attributes.color?.array;
        const vels = physData.customData;
        const temp = parseFloat(document.getElementById('thermoTemp')?.value || 300);
        const scale = Math.sqrt(temp / 300);
        const tempEl = document.getElementById('thermoTempVal');
        if (tempEl) tempEl.textContent = `${temp} K`;
        const vmpEl = document.getElementById('vmpVal');
        if (vmpEl) vmpEl.textContent = `${(scale * 410).toFixed(0)} m/s`;

        // Piston moves with pressure (PV = nRT, fixed n => P scales with T)
        const piston = scene.getObjectByName('thermoPiston');
        const rod = scene.getObjectByName('thermoPistonRod');
        if (piston) { piston.position.y = THREE.MathUtils.lerp(piston.position.y, -1 + scale * 5, 0.03); }
        if (rod)    { rod.position.y = piston ? piston.position.y + 2.5 : 7; }

        if (vels) {
            for (let i = 0; i < pos.length; i += 3) {
                pos[i]   += vels[i/3].x * scale * timeWarp;
                pos[i+1] += vels[i/3].y * scale * timeWarp;
                pos[i+2] += vels[i/3].z * scale * timeWarp;
                // Elastic wall collisions within cylinder (r<4, y>-5, y<pistonY)
                const r2 = pos[i]*pos[i] + pos[i+2]*pos[i+2];
                if (r2 > 14) { vels[i/3].x *= -1; vels[i/3].z *= -1; }
                const pistonY = piston ? piston.position.y : 4.5;
                if (pos[i+1] < -4.8) { vels[i/3].y = Math.abs(vels[i/3].y); }
                if (pos[i+1] > pistonY - 0.5) { vels[i/3].y = -Math.abs(vels[i/3].y); }
                // Update color by speed
                if (col) {
                    const spd = vels[i/3].length() * scale;
                    col[i]   = Math.min(1, spd * 2.5);
                    col[i+1] = 0.2;
                    col[i+2] = Math.max(0, 1 - spd * 2.5);
                }
            }
        }
        physData.particles[0].geometry.attributes.position.needsUpdate = true;
        if (col) physData.particles[0].geometry.attributes.color.needsUpdate = true;

    // --- EXP 18: Standing Waves & Harmonics ---
    } else if (currentExperiment === 'wave') {
        const modeEl = document.getElementById('waveMode');
        const ampEl  = document.getElementById('waveAmp');
        const n   = parseFloat(modeEl?.value || 2);
        const amp = parseFloat(ampEl?.value || 1.5);
        if (document.getElementById('waveModeVal')) document.getElementById('waveModeVal').textContent = n;

        const waveTube = scene.getObjectByName('standingWaveTube');
        const nodeGroup = scene.getObjectByName('waveNodes');

        if (waveTube) {
            // Rebuild tube geometry each frame (standing wave y = A*sin(nπx/L)*cos(ωt))
            const L = 16, nSeg = 100;
            const pts = [];
            for (let i = 0; i <= nSeg; i++) {
                const x = -8 + (i / nSeg) * L;
                const y = amp * Math.sin(n * Math.PI * (i / nSeg)) * Math.cos(simTime * 3);
                pts.push(new THREE.Vector3(x, y, 0));
            }
            const curve = new THREE.CatmullRomCurve3(pts);
            const newGeo = new THREE.TubeGeometry(curve, nSeg, 0.12, 8, false);
            waveTube.geometry.dispose();
            waveTube.geometry = newGeo;
        }

        if (nodeGroup) {
            // Rebuild node markers
            while (nodeGroup.children.length) nodeGroup.remove(nodeGroup.children[0]);
            for (let k = 0; k <= n; k++) {
                const x = -8 + (k / n) * 16;
                const node = new THREE.Mesh(
                    new THREE.SphereGeometry(0.2, 16, 16),
                    new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
                );
                node.position.set(x, 0, 0);
                nodeGroup.add(node);
            }
        }

    // --- EXP 8: Special Relativity ---
    } else if (currentExperiment === 'relativity') {
        const rocket = scene.getObjectByName('relRocket');
        const velInput = document.getElementById('relVel');
        if (rocket && velInput) {
            const v = parseFloat(velInput.value);
            const gamma = 1 / Math.sqrt(Math.max(0.001, 1 - v*v));
            rocket.scale.x = 1 / gamma;
            const gVal = document.getElementById('gammaVal');
            if (gVal) gVal.textContent = gamma.toFixed(3);
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
// 11. MODULE 6: ROBOTICS & MECHATRONICS LAB (v3.0)
// ==========================================================================
let robotMode = 'arm'; // 'arm', 'pid', 'drone', 'motor', 'board'
let robotJoints = { base: 0, shoulder: 20, elbow: -40, wristPitch: 20, wrist: 0, grip: 50 };
let armMeshGroup = null;
let autoDemoActive = false;
let armKinMode = 'fk'; // 'fk' or 'ik'
let ikTarget = { x: 3.5, y: 4.0, z: 0.0 };
let pickPlaceState = { step: 0, timer: 0, heldObj: null };

// PID Inverted Pendulum State Vector [x, x_dot, theta, theta_dot]
let pidState = {
    x: 0,
    v: 0,
    theta: 0.08, // Initial small tilt radians
    omega: 0,
    integral: 0,
    lastError: 0,
    force: 0
};

// Quadcopter Flight State
let droneState = {
    mode: 'hover', // 'hover', 'orbit', 'fig8'
    pos: new THREE.Vector3(0, 4.5, 0),
    vel: new THREE.Vector3(0, 0, 0),
    rot: new THREE.Euler(0, 0, 0),
    props: []
};

// Actuator & Motor State
let activeMotorType = 'bldc';
let motorRotorMesh = null;

// Embedded Boards State
let activeBoardType = 'esp32';
let robotRaycasterObjects = [];

function initRobot() {
    const setup = createScene('robotScene');
    if (!setup) return;

    camera.position.set(0, 7, 18);
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(12, 22, 16);
    dirLight.castShadow = true;
    scene.add(dirLight);

    initRobotRaycaster();
    initRobotSliders();
    loadActiveRobotMode();

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (!isPaused) {
            simTime += 0.016;

            if (robotMode === 'arm') {
                updateRobotArmLoop();
            } else if (robotMode === 'pid') {
                updatePidBalancerPhysics();
            } else if (robotMode === 'drone') {
                updateDroneFlightDynamics();
            } else if (robotMode === 'motor') {
                updateActuatorShowroom();
            } else if (robotMode === 'board') {
                updateBoardShowroom();
            }
        }
        controls.update();
        renderer.render(scene, camera);
        updateTelemetry(320);
    }
    animate();
}

function loadActiveRobotMode() {
    disposeHierarchy(scene.getObjectByName('robotModel'));
    robotRaycasterObjects = [];

    if (robotMode === 'arm') {
        camera.position.set(0, 6, 18);
        buildRobotArm3D();
    } else if (robotMode === 'pid') {
        camera.position.set(0, 3, 16);
        buildPidCartScene3D();
    } else if (robotMode === 'drone') {
        camera.position.set(0, 6, 16);
        buildDroneScene3D();
    } else if (robotMode === 'motor') {
        camera.position.set(0, 3, 12);
        buildMotorShowroom3D();
    } else if (robotMode === 'board') {
        camera.position.set(0, 4, 12);
        buildBoardShowroom3D();
    }
}

// --------------------------------------------------------------------------
// 1. 6-DOF INDUSTRIAL ROBOTIC ARM & KINEMATICS
// --------------------------------------------------------------------------
function buildRobotArm3D() {
    armMeshGroup = new THREE.Group();
    armMeshGroup.name = 'robotModel';

    // Premium Industrial Materials
    const baseMat = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4, clearcoat: 0.5 });
    const redCastMat = new THREE.MeshPhysicalMaterial({ color: 0xe11d48, metalness: 0.4, roughness: 0.3, clearcoat: 0.2 });
    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

    // Industrial Pedestal Base Plate
    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 0.6, 64), baseMat);
    basePlate.position.y = 0.3;
    basePlate.userData = { title: "Pedestal Base Plate", desc: "Rigid cast-iron pedestal with M24 anchor bolts securing manipulator to industrial concrete foundation." };
    armMeshGroup.add(basePlate);
    robotRaycasterObjects.push(basePlate);

    // Floor Safety Boundary Grid
    const grid = new THREE.GridHelper(20, 20, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.01;
    armMeshGroup.add(grid);

    // Workstation Pallet & Machined Brass Workpiece
    const pallet = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 2.4), baseMat);
    pallet.position.set(4.0, 0.2, 0);
    armMeshGroup.add(pallet);

    const workpiece = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.8, 32),
        new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.1, clearcoat: 1.0 })
    );
    workpiece.name = 'workpieceMesh';
    workpiece.position.set(4.0, 0.8, 0);
    armMeshGroup.add(workpiece);
    pickPlaceState.heldObj = null;

    // Joint 1: Base Turntable (Yaw: -180° to +180°)
    const j1Pivot = new THREE.Group();
    j1Pivot.position.y = 0.6;
    j1Pivot.name = 'j1Pivot';

    const j1Housing = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.4, 1.4, 64), redCastMat);
    j1Housing.position.y = 0.7;
    // Add decorative cooling fins / ridges to J1
    for (let i = 0; i < 8; i++) {
        const ridge = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.0, 0.2), baseMat);
        ridge.position.y = 0.7;
        ridge.rotation.y = (i * Math.PI) / 8;
        j1Housing.add(ridge);
    }
    j1Housing.userData = { title: "Joint 1 (Base Yaw Turntable)", desc: "Harmonic Drive reduction gear (160:1 ratio) with 24-bit absolute optical encoder for ±180° base rotation." };
    j1Pivot.add(j1Housing);
    robotRaycasterObjects.push(j1Housing);

    // Joint 2: Shoulder Pitch
    const j2Pivot = new THREE.Group();
    j2Pivot.position.y = 1.4;
    j2Pivot.name = 'j2Pivot';

    const j2Casting = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 32), baseMat);
    j2Casting.rotation.x = Math.PI / 2;
    j2Casting.position.y = 0.8;
    j2Pivot.add(j2Casting);

    const boomArm = new THREE.Group();
    boomArm.position.y = 2.8;
    const boomMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.2, 1.0), redCastMat);
    const boomDecal1 = new THREE.Mesh(new THREE.BoxGeometry(1.25, 3.8, 0.8), steelMat);
    boomMesh.add(boomDecal1);
    boomArm.add(boomMesh);
    boomMesh.userData = { title: "Joint 2 & Lower Boom Arm", desc: "High-torque brushless AC servomotor driving lower arm boom casting (Link Length L1 = 3.8m)." };
    j2Pivot.add(boomArm);
    robotRaycasterObjects.push(boomMesh);

    // Joint 3: Elbow Pitch
    const j3Pivot = new THREE.Group();
    j3Pivot.position.y = 4.8;
    j3Pivot.name = 'j3Pivot';

    const j3Housing = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.8, 32), baseMat);
    j3Housing.rotation.x = Math.PI / 2;
    j3Pivot.add(j3Housing);

    const forearm = new THREE.Group();
    forearm.position.y = 1.8;
    const forearmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.6, 0.9), redCastMat);
    const forearmDecal = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.6, 16), steelMat);
    forearmDecal.position.z = 0.2;
    forearmMesh.add(forearmDecal);
    forearm.add(forearmMesh);
    forearmMesh.userData = { title: "Joint 3 & Forearm Casting", desc: "Articulated elbow linkage (Link Length L2 = 3.2m) delivering 450 N·m peak holding torque." };
    j3Pivot.add(forearm);
    robotRaycasterObjects.push(forearmMesh);

    // Joint 4: Wrist Pitch
    const j4Pivot = new THREE.Group();
    j4Pivot.position.y = 3.6;
    j4Pivot.name = 'j4Pivot';

    const j4Cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 32), baseMat);
    j4Cylinder.rotation.x = Math.PI / 2;
    j4Pivot.add(j4Cylinder);

    // Joint 5: Wrist Roll
    const j5Pivot = new THREE.Group();
    j5Pivot.position.y = 0.7;
    j5Pivot.name = 'j5Pivot';

    const j5Flange = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 32), steelMat);
    j5Pivot.add(j5Flange);

    // Joint 6: Parallel Servo Gripper
    const gripperBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.8), baseMat);
    gripperBase.position.y = 0.4;
    j5Pivot.add(gripperBase);

    // Detailed Gripper Fingers
    const fingerMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2, clearcoat: 0.8 });
    
    const fingerL = new THREE.Group();
    fingerL.name = 'gripperFingerL';
    fingerL.position.set(-0.4, 1.0, 0);
    const fLBase = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.4), fingerMat);
    const fLPad = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.3), new THREE.MeshBasicMaterial({color: 0x22c55e}));
    fLPad.position.set(0.1, 0.4, 0);
    fingerL.add(fLBase, fLPad);
    j5Pivot.add(fingerL);

    const fingerR = new THREE.Group();
    fingerR.name = 'gripperFingerR';
    fingerR.position.set(0.4, 1.0, 0);
    const fRBase = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.4), fingerMat);
    const fRPad = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.3), new THREE.MeshBasicMaterial({color: 0x22c55e}));
    fRPad.position.set(-0.1, 0.4, 0);
    fingerR.add(fRBase, fRPad);
    j5Pivot.add(fingerR);

    // Assembly Tree Hierarchy
    j4Pivot.add(j5Pivot);
    j3Pivot.add(j4Pivot);
    j2Pivot.add(j3Pivot);
    j1Pivot.add(j2Pivot);
    armMeshGroup.add(j1Pivot);

    scene.add(armMeshGroup);
    updateArmJointPivots();
}

function updateArmJointPivots() {
    if (!armMeshGroup) return;
    const j1 = armMeshGroup.getObjectByName('j1Pivot');
    const j2 = armMeshGroup.getObjectByName('j2Pivot');
    const j3 = armMeshGroup.getObjectByName('j3Pivot');
    const j4 = armMeshGroup.getObjectByName('j4Pivot');
    const j5 = armMeshGroup.getObjectByName('j5Pivot');
    const fL = armMeshGroup.getObjectByName('gripperFingerL');
    const fR = armMeshGroup.getObjectByName('gripperFingerR');

    if (j1) j1.rotation.y = (robotJoints.base * Math.PI) / 180;
    if (j2) j2.rotation.z = (robotJoints.shoulder * Math.PI) / 180;
    if (j3) j3.rotation.z = (robotJoints.elbow * Math.PI) / 180;
    if (j4) j4.rotation.z = (robotJoints.wristPitch * Math.PI) / 180;
    if (j5) j5.rotation.y = (robotJoints.wrist * Math.PI) / 180;

    // Gripper finger clamping translation
    const gripGap = 0.15 + (robotJoints.grip / 100) * 0.35;
    if (fL) fL.position.x = -gripGap;
    if (fR) fR.position.x = gripGap;

    // Calculate live End-Effector forward kinematics position
    if (j5) {
        const eePos = new THREE.Vector3();
        j5.getWorldPosition(eePos);
        const poseEl = document.getElementById('eePose');
        if (poseEl) {
            poseEl.textContent = `X: ${eePos.x.toFixed(2)}m | Y: ${eePos.y.toFixed(2)}m | Z: ${eePos.z.toFixed(2)}m`;
        }
    }
}

function updateRobotArmLoop() {
    if (autoDemoActive) {
        pickPlaceState.timer += 0.008;
        const t = pickPlaceState.timer % 4; // 4-second realistic cycle
        
        // Easing function for servo-like motion
        const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;

        let phaseT = t % 1;
        let ease = easeInOutSine(phaseT);

        if (t < 1) {
            // Phase 0: Move to object
            robotJoints.base = THREE.MathUtils.lerp(0, -90, ease);
            robotJoints.shoulder = THREE.MathUtils.lerp(20, 50, ease);
            robotJoints.elbow = THREE.MathUtils.lerp(-40, 10, ease);
            robotJoints.wristPitch = THREE.MathUtils.lerp(20, -60, ease);
            robotJoints.grip = 100;
        } else if (t < 2) {
            // Phase 1: Grip and Lift
            robotJoints.grip = THREE.MathUtils.lerp(100, 0, Math.min(ease * 3, 1));
            robotJoints.shoulder = THREE.MathUtils.lerp(50, 0, ease);
            robotJoints.elbow = THREE.MathUtils.lerp(10, -50, ease);
            robotJoints.wristPitch = THREE.MathUtils.lerp(-60, 50, ease);
        } else if (t < 3) {
            // Phase 2: Swing to Drop
            robotJoints.base = THREE.MathUtils.lerp(-90, 0, ease);
            robotJoints.shoulder = THREE.MathUtils.lerp(0, 50, ease);
            robotJoints.elbow = THREE.MathUtils.lerp(-50, 10, ease);
            robotJoints.wristPitch = THREE.MathUtils.lerp(50, -60, ease);
        } else {
            // Phase 3: Release and Return
            robotJoints.grip = THREE.MathUtils.lerp(0, 100, Math.min(ease * 3, 1));
            robotJoints.shoulder = THREE.MathUtils.lerp(50, 20, ease);
            robotJoints.elbow = THREE.MathUtils.lerp(10, -40, ease);
            robotJoints.wristPitch = THREE.MathUtils.lerp(-60, 20, ease);
        }
        updateArmJointPivots();
    }
}

function setArmKinematicsMode(mode) {
    armKinMode = mode;
    document.getElementById('armModeFK')?.classList.toggle('active', mode === 'fk');
    document.getElementById('armModeIK')?.classList.toggle('active', mode === 'ik');
    document.getElementById('armFkSliders').style.display = mode === 'fk' ? 'block' : 'none';
    document.getElementById('armIkSliders').style.display = mode === 'ik' ? 'block' : 'none';
    sound.playClick();
}

function solveInverseKinematics(targetX, targetY, targetZ) {
    // 3D Geometric Inverse Kinematics for 6-DOF Manipulator
    const baseAngle = Math.atan2(targetZ, targetX) * (180 / Math.PI);
    const r = Math.sqrt(targetX * targetX + targetZ * targetZ);
    const s = targetY - 1.8; // Pedestal height offset
    const L1 = 3.8;
    const L2 = 3.2;

    const D = (r * r + s * s - L1 * L1 - L2 * L2) / (2 * L1 * L2);
    const clampedD = Math.max(-1, Math.min(1, D));
    const elbowAngle = Math.atan2(-Math.sqrt(1 - clampedD * clampedD), clampedD) * (180 / Math.PI);

    const shoulderAngle = (Math.atan2(s, r) - Math.atan2(L2 * Math.sin((elbowAngle * Math.PI) / 180), L1 + L2 * Math.cos((elbowAngle * Math.PI) / 180))) * (180 / Math.PI);

    robotJoints.base = baseAngle;
    robotJoints.shoulder = shoulderAngle;
    robotJoints.elbow = elbowAngle;
    robotJoints.wristPitch = -(shoulderAngle + elbowAngle);

    updateArmJointPivots();
}

// --------------------------------------------------------------------------
// 2. PID INVERTED PENDULUM BALANCER (Cart-Pole Numerical Simulation)
// --------------------------------------------------------------------------
function buildPidCartScene3D() {
    const group = new THREE.Group();
    group.name = 'robotModel';

    // Materials
    const railMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2, clearcoat: 0.5 });
    const cartMat = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3, clearcoat: 0.8 });
    const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.5 });
    const carbonMat = new THREE.MeshPhysicalMaterial({ color: 0x111827, metalness: 0.3, roughness: 0.7 });

    // Detailed THK Linear Guideway Rail
    const railBase = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.2, 1.6), darkMat);
    railBase.position.y = 0.1;
    group.add(railBase);

    const railTrack = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 0.8), railMat);
    railTrack.position.y = 0.4;
    group.add(railTrack);

    // Ball screw mechanism
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 16.2, 16), railMat);
    screw.rotation.z = Math.PI / 2;
    screw.position.set(0, 0.4, 0.6);
    group.add(screw);

    // Linear Encoder Scale (glass / tape)
    const encoderTape = new THREE.Mesh(new THREE.BoxGeometry(16, 0.05, 0.1), new THREE.MeshBasicMaterial({color: 0xf59e0b}));
    encoderTape.position.set(0, 0.4, -0.45);
    group.add(encoderTape);

    for (let x = -7.5; x <= 7.5; x += 1.5) {
        const mount = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 1.8), darkMat);
        mount.position.set(x, 0.2, 0);
        group.add(mount);
    }

    // Motorized Carriage Cart with High-Fidelity Chassis
    const cartGroup = new THREE.Group();
    cartGroup.name = 'pidCartGroup';
    cartGroup.position.set(0, 0.8, 0);

    const cartBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.8, 2.2), cartMat);
    const cartBevel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.2, 2.4), darkMat);
    cartBody.add(cartBevel);
    cartBody.userData = { title: "Linear Cart Carriage", desc: "Precision brushless servo-driven carriage (Mass M = 3.0kg) running on recirculating ball bearings." };
    cartGroup.add(cartBody);
    robotRaycasterObjects.push(cartBody);

    // Bearing Blocks
    [[-1.2, -0.3, 0], [1.2, -0.3, 0]].forEach(pos => {
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1.0), railMat);
        block.position.set(...pos);
        cartGroup.add(block);
    });

    // Optical Encoder Pivot Bearing
    const pivotBearing = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 32), railMat);
    pivotBearing.rotation.x = Math.PI / 2;
    pivotBearing.position.set(0, 0.5, 0);
    cartGroup.add(pivotBearing);

    const pivotCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.65, 16), new THREE.MeshBasicMaterial({color: 0xe11d48}));
    pivotCap.rotation.x = Math.PI / 2;
    pivotCap.position.set(0, 0.5, 0);
    cartGroup.add(pivotCap);

    // Inverted Pendulum Rod & Tip Mass (Carbon Fiber + Brass Bob)
    const polePivot = new THREE.Group();
    polePivot.name = 'pidPolePivot';
    polePivot.position.set(0, 0.5, 0);

    const poleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.0, 16), carbonMat);
    poleMesh.position.y = 2.5;
    polePivot.add(poleMesh);

    const bobMesh = new THREE.Group();
    bobMesh.position.y = 5.0;
    
    const brassBob = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 32), new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2, clearcoat: 0.6 }));
    brassBob.rotation.x = Math.PI / 2;
    bobMesh.add(brassBob);

    brassBob.userData = { title: "Inverted Pendulum Bob", desc: "Brass inertial bob (Mass m = 0.5kg, Length l = 5.0m) balanced via continuous PID feedback torque." };
    polePivot.add(bobMesh);
    robotRaycasterObjects.push(brassBob);

    cartGroup.add(polePivot);
    group.add(cartGroup);
    scene.add(group);
}

function updatePidBalancerPhysics() {
    const Kp = parseFloat(document.getElementById('pidKp')?.value || 65);
    const Ki = parseFloat(document.getElementById('pidKi')?.value || 1.8);
    const Kd = parseFloat(document.getElementById('pidKd')?.value || 28);
    const M = parseFloat(document.getElementById('cartMass')?.value || 3.0);
    const m = 0.5; // Pendulum bob mass (kg)
    const L = 5.0; // Pole length (m)
    const g = 9.81;
    const dt = 0.016;

    // Error e(t) = desired (0 rad) - actual (theta)
    const error = 0 - pidState.theta;
    pidState.integral += error * dt;
    pidState.integral = Math.max(-10, Math.min(10, pidState.integral)); // Anti-windup
    const derivative = (error - pidState.lastError) / dt;
    pidState.lastError = error;

    // PID Force output with cart station-keeping
    pidState.force = (Kp * error) + (Ki * pidState.integral) + (Kd * derivative) - (2.5 * pidState.x) - (3.0 * pidState.v);

    // Non-linear Cart-Pole Equation of Motion
    const sinTh = Math.sin(pidState.theta);
    const cosTh = Math.cos(pidState.theta);

    const num = g * sinTh + cosTh * ((-pidState.force - m * L * pidState.omega * pidState.omega * sinTh) / (M + m));
    const den = L * (4/3 - (m * cosTh * cosTh) / (M + m));
    const alpha = num / den; // Angular acceleration theta''

    const a = (pidState.force + m * L * (pidState.omega * pidState.omega * sinTh - alpha * cosTh)) / (M + m); // Cart linear acc x''

    // Numerical integration (Euler / Verlet)
    pidState.omega += alpha * dt;
    pidState.theta += pidState.omega * dt;
    pidState.v += a * dt;
    pidState.x += pidState.v * dt;

    // Constrain cart within rail bounds
    if (Math.abs(pidState.x) > 7.0) {
        pidState.x = Math.sign(pidState.x) * 7.0;
        pidState.v *= -0.5;
    }

    // Update 3D meshes
    const cart = scene.getObjectByName('pidCartGroup');
    const pole = scene.getObjectByName('pidPolePivot');
    if (cart) cart.position.x = pidState.x;
    if (pole) pole.rotation.z = -pidState.theta;

    // Update telemetry labels
    const thEl = document.getElementById('pidTheta');
    const fEl = document.getElementById('pidForce');
    if (thEl) thEl.textContent = `${(pidState.theta * 57.2958).toFixed(2)}° ${Math.abs(pidState.theta) < 0.05 ? '(Balanced)' : '(Correcting)'}`;
    if (fEl) fEl.textContent = `${pidState.force.toFixed(2)} N`;
}

function applyPidPerturbation(magnitude = 5) {
    pidState.omega += (magnitude / 10);
    sound.playExplosion();
    showToast(`⚖️ Applied ${magnitude > 0 ? '+' : ''}${magnitude} N disturbance impulse! PID reacting.`);
}

function resetPidPendulum() {
    pidState = { x: 0, v: 0, theta: 0.05, omega: 0, integral: 0, lastError: 0, force: 0 };
    showToast('Inverted pendulum reset to near-upright position.');
}

// --------------------------------------------------------------------------
// 3. 6-DOF QUADCOPTER DRONE FLIGHT PHYSICS
// --------------------------------------------------------------------------
function buildDroneScene3D() {
    const group = new THREE.Group();
    group.name = 'robotModel';
    droneState.props = [];

    // Materials
    const carbonMat = new THREE.MeshPhysicalMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.2, clearcoat: 0.2 });
    const aluMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.9 });
    const blueAluMat = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.9 });
    const blackMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.8 });
    const propMatCW = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.4, clearcoat: 0.3 });
    const propMatCCW = new THREE.MeshPhysicalMaterial({ color: 0x22c55e, roughness: 0.4, clearcoat: 0.3 });
    const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, metalness: 1.0, roughness: 0.1 });

    // Central Body Plates
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 3.2), carbonMat);
    topPlate.position.y = 0.4;
    group.add(topPlate);

    const bottomPlate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 3.2), carbonMat);
    bottomPlate.position.y = -0.2;
    group.add(bottomPlate);

    // Battery Pack
    const lipo = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2.6), new THREE.MeshPhysicalMaterial({ color: 0x0369a1 }));
    lipo.position.y = 0.85;
    group.add(lipo);
    const lipoStrap = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.85, 0.4), blackMat);
    lipoStrap.position.y = 0.85;
    group.add(lipoStrap);
    lipo.userData = { title: "4S 1500mAh LiPo Battery", desc: "High-discharge 120C lithium-polymer power source." };
    robotRaycasterObjects.push(lipo);

    // Flight Controller Stack
    const fcStack = new THREE.Group();
    for (let i = 0; i < 3; i++) {
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 1.2), new THREE.MeshBasicMaterial({color: 0x064e3b}));
        pcb.position.y = -0.05 + i * 0.15;
        fcStack.add(pcb);
    }
    fcStack.userData = { title: "STM32 F7 Flight Controller Stack", desc: "Triple IMU, 4-in-1 55A ESC, and VTX." };
    group.add(fcStack);
    robotRaycasterObjects.push(fcStack);

    // Front FPV Camera Gimbal
    const gimbal = new THREE.Group();
    gimbal.position.set(0, 0.1, 1.8);
    const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), aluMat);
    const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 32), new THREE.MeshPhysicalMaterial({color: 0x000000, roughness: 0.0, transmission: 1.0, thickness: 0.5}));
    camLens.rotation.x = Math.PI / 2;
    camLens.position.z = 0.5;
    camBody.add(camLens);
    gimbal.add(camBody);
    camBody.userData = { title: "4K FPV Camera Gimbal", desc: "Low-latency digital FPV camera on a vibration-damped mount." };
    group.add(gimbal);
    robotRaycasterObjects.push(camBody);

    // Arms & Motors
    const motorPositions = [
        [3.0, 0, 3.0, 'CW', propMatCW],
        [-3.0, 0, 3.0, 'CCW', propMatCCW],
        [3.0, 0, -3.0, 'CCW', propMatCCW],
        [-3.0, 0, -3.0, 'CW', propMatCW]
    ];

    motorPositions.forEach(([x, y, z, dir, propMat]) => {
        // Carbon Fiber Arm
        const armLen = Math.sqrt(x*x + z*z) - 1.0;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, armLen), carbonMat);
        arm.position.set(x/2, 0.1, z/2);
        arm.rotation.y = Math.atan2(x, z);
        group.add(arm);

        // Brushless Motor Mount & Stator
        const motorMount = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.2, 32), aluMat);
        motorMount.position.set(x, 0.2, z);
        group.add(motorMount);

        const motorBell = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 32), blueAluMat);
        motorBell.position.set(x, 0.55, z);
        
        // Cooling ridges on motor bell
        const ridges = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.02, 8, 32), goldMat);
        ridges.rotation.x = Math.PI / 2;
        motorBell.add(ridges);

        group.add(motorBell);

        // Propeller Assembly (3-Blade)
        const propGroup = new THREE.Group();
        propGroup.position.set(x, 0.9, z);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16), aluMat);
        propGroup.add(hub);

        for (let b = 0; b < 3; b++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.02, 0.3), propMat);
            blade.position.x = 1.2;
            blade.rotation.x = (dir === 'CW' ? 0.2 : -0.2); // Pitch angle
            
            const pivot = new THREE.Group();
            pivot.rotation.y = (b * Math.PI * 2) / 3;
            pivot.add(blade);
            propGroup.add(pivot);
        }

        group.add(propGroup);
        droneState.props.push({ mesh: propGroup, dir: dir === 'CW' ? 1 : -1, bell: motorBell });
    });

    group.position.set(0, 4.5, 0);
    scene.add(group);
}

function updateDroneFlightDynamics() {
    const throttle = parseFloat(document.getElementById('droneThrottle')?.value || 50);
    const pitchIn = parseFloat(document.getElementById('dronePitch')?.value || 0);
    const rollIn = parseFloat(document.getElementById('droneRoll')?.value || 0);
    const yawIn = parseFloat(document.getElementById('droneYaw')?.value || 0);

    const drone = scene.getObjectByName('robotModel');
    if (!drone) return;

    // Spin all 4 aerodynamic propellers and motor bells
    const baseRpm = throttle * 144;
    droneState.props.forEach((p, i) => {
        const rpmDelta = (baseRpm * 0.002) * p.dir;
        p.mesh.rotation.y += rpmDelta;
        if (p.bell) p.bell.rotation.y += rpmDelta;
    });

    // Autonomous Mode Trajectories with Physics-Based Banking
    let targetY = 4.0, targetRotX = 0, targetRotZ = 0, targetRotY = drone.rotation.y;

    if (droneState.mode === 'hover') {
        targetY = 4.0 + Math.sin(simTime * 2) * 0.15;
        targetRotX = (pitchIn * Math.PI) / 180 + Math.sin(simTime * 3) * 0.02;
        targetRotZ = (rollIn * Math.PI) / 180 + Math.cos(simTime * 2.5) * 0.02;
        targetRotY += (yawIn * 0.005);
    } else if (droneState.mode === 'orbit') {
        drone.position.x = Math.cos(simTime * 0.8) * 5.5;
        drone.position.z = Math.sin(simTime * 0.8) * 5.5;
        targetY = 4.5 + Math.sin(simTime * 1.5) * 0.4;
        targetRotY = -simTime * 0.8;
        targetRotZ = -0.35; // Sharp bank into the turn
        targetRotX = 0.1;   // Pitch forward slightly
    } else if (droneState.mode === 'fig8') {
        drone.position.x = Math.sin(simTime * 0.7) * 6.0;
        drone.position.z = Math.sin(simTime * 1.4) * 3.5;
        targetY = 4.5 + Math.sin(simTime * 2) * 0.5;
        
        // Calculate tangent vector for realistic banking
        const dx = Math.cos(simTime * 0.7) * 0.7 * 6.0;
        const dz = Math.cos(simTime * 1.4) * 1.4 * 3.5;
        targetRotY = Math.atan2(dx, dz);
        targetRotZ = Math.cos(simTime * 0.7) * 0.45; // Bank angle correlates with turn sharpness
        targetRotX = 0.15; // Aggressive forward pitch
    }

    // Smooth LERP for drone chassis physics
    drone.position.y = THREE.MathUtils.lerp(drone.position.y, targetY, 0.1);
    drone.rotation.x = THREE.MathUtils.lerp(drone.rotation.x, targetRotX, 0.1);
    drone.rotation.z = THREE.MathUtils.lerp(drone.rotation.z, targetRotZ, 0.1);
    
    // Normalize Y rotation lerp
    let dy = targetRotY - drone.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    drone.rotation.y += dy * 0.1;

    const altEl = document.getElementById('droneAlt');
    const rpmEl = document.getElementById('droneRpm');
    if (altEl) altEl.textContent = `${drone.position.y.toFixed(2)} m`;
    if (rpmEl) rpmEl.textContent = `${Math.round(baseRpm)} RPM`;
}

function setDroneAutoMode(mode) {
    droneState.mode = mode;
    document.querySelectorAll('#droneControls .ctrl-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`droneMode${mode.charAt(0).toUpperCase() + mode.slice(1)}`)?.classList.add('active');
    sound.playClick();
}

// --------------------------------------------------------------------------
// 4. PRECISION ROBOTIC ACTUATORS SHOWROOM (BLDC, Stepper, Servo, Harmonic)
// --------------------------------------------------------------------------
function buildMotorShowroom3D() {
    const group = new THREE.Group();
    group.name = 'robotModel';

    const steelMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const darkMetal = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.6 });
    const copperMat = new THREE.MeshPhysicalMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.3, clearcoat: 0.5 });
    const blueAnodized = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.2, clearcoat: 0.8 });

    if (activeMotorType === 'bldc') {
        // 3-Phase BLDC Outrunner Cutaway (High Detail)
        const statorBase = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.4, 64), darkMetal);
        group.add(statorBase);

        // 12 Copper Stator Teeth with Coils
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const tooth = new THREE.Group();
            
            const core = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.3), steelMat);
            const winding = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.15, 16, 32), copperMat);
            winding.scale.set(1.5, 4.0, 1.0);
            winding.rotation.y = Math.PI / 2;
            
            tooth.add(core, winding);
            tooth.position.set(Math.cos(angle) * 1.2, 1.0, Math.sin(angle) * 1.2);
            tooth.rotation.y = -angle;
            tooth.userData = { title: "Copper Stator Poles (12-Slot)", desc: "High-temperature copper windings energized by 3-phase trapezoidal/FOC sine wave commutation." };
            group.add(tooth);
            robotRaycasterObjects.push(core);
        }

        // Spinning Permanent Magnet Rotor Bell with Cutaway and Cooling Fins
        const rotorGroup = new THREE.Group();
        rotorGroup.position.y = 1.1;

        const rotorBell = new THREE.Mesh(
            new THREE.CylinderGeometry(2.1, 2.1, 2.4, 64, 1, false, 0, Math.PI * 1.5),
            new THREE.MeshPhysicalMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.2, side: THREE.DoubleSide, clearcoat: 0.8 })
        );
        rotorGroup.add(rotorBell);

        // Magnets inside bell
        for (let i=0; i<14; i++) {
            if (i > 10) continue; // Cutaway gap
            const angle = (i / 14) * Math.PI * 2;
            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.8), steelMat);
            mag.position.set(Math.cos(angle) * 2.0, 0, Math.sin(angle) * 2.0);
            mag.rotation.y = -angle;
            rotorGroup.add(mag);
        }

        rotorGroup.name = 'motorRotorBell';
        group.add(rotorGroup);
        motorRotorMesh = rotorGroup;

    } else if (activeMotorType === 'harmonic') {
        // Harmonic Drive Zero-Backlash Strain Wave Gear
        const outerSpline = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 1.4, 64, 1, true), steelMat);
        group.add(outerSpline);

        const flexspline = new THREE.Mesh(
            new THREE.CylinderGeometry(2.6, 2.6, 2.2, 64, 1, true),
            new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.4, side: THREE.DoubleSide })
        );
        flexspline.position.y = 0.5;
        flexspline.userData = { title: "Flexible Toothed Flexspline", desc: "Thin-walled elastic cup deflected into an elliptical shape by the wave generator, yielding 100:1 zero-backlash reduction." };
        group.add(flexspline);
        robotRaycasterObjects.push(flexspline);

        const waveGen = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 1.0, 32), darkMetal);
        waveGen.name = 'motorRotorBell';
        waveGen.scale.set(1.15, 1.0, 0.85); // Elliptical bearing cam
        group.add(waveGen);
        motorRotorMesh = waveGen;
    } else {
        // NEMA 17 / Digital Servo (Highly Detailed)
        const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.5 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.4, 3.2), bodyMat);
        
        // Heat sink fins
        for(let i=-1.2; i<=1.2; i+=0.4) {
            const finX = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.0, 0.1), bodyMat);
            finX.position.z = i;
            body.add(finX);
        }
        group.add(body);

        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.4, 32), steelMat);
        shaft.name = 'motorRotorBell';
        shaft.position.y = 2.4;
        group.add(shaft);
        motorRotorMesh = shaft;
    }

    scene.add(group);
}

function updateActuatorShowroom() {
    const pwm = parseFloat(document.getElementById('motorPwm')?.value || 60);
    const torque = parseFloat(document.getElementById('motorTorque')?.value || 2.5);

    if (motorRotorMesh) {
        motorRotorMesh.rotation.y += (pwm * 0.003) / Math.max(0.5, torque * 0.3);
    }

    const speed = Math.round((pwm / 100) * 6000 / Math.max(0.5, torque * 0.4));
    const speedEl = document.getElementById('motorSpeedVal');
    const effEl = document.getElementById('motorEffVal');
    if (speedEl) speedEl.textContent = `${speed.toLocaleString()} RPM`;
    if (effEl) effEl.textContent = `${(92.5 - torque * 1.8).toFixed(1)}%`;
}

function switchMotorType(type) {
    activeMotorType = type;
    buildMotorShowroom3D();
    sound.playClick();
}

// --------------------------------------------------------------------------
// 5. EMBEDDED COMPUTING & ROBOTICS BOARDS SHOWROOM
// --------------------------------------------------------------------------
function buildBoardShowroom3D() {
    const group = new THREE.Group();
    group.name = 'robotModel';

    const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, metalness: 1.0, roughness: 0.1 });
    const silverMat = new THREE.MeshPhysicalMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
    const blackIC = new THREE.MeshPhysicalMaterial({ color: 0x18181b, roughness: 0.9 });

    if (activeBoardType === 'esp32') {
        // ESP32 NodeMCU Module (High Detail)
        const pcbMat = new THREE.MeshPhysicalMaterial({ color: 0x09090b, roughness: 0.6, clearcoat: 0.2 });
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.15, 2.8), pcbMat);
        
        // PCB Traces (decorative)
        const traceGrid = new THREE.GridHelper(5, 10, 0x3f3f46, 0x27272a);
        traceGrid.position.y = 0.08;
        pcb.add(traceGrid);

        pcb.userData = { title: "ESP32-WROOM-32 Development Board", desc: "Dual-Core Xtensa 32-bit LX6 @ 240MHz, 520 KB SRAM, Integrated 802.11 b/g/n Wi-Fi and Bluetooth v4.2 BR/EDR & BLE." };
        group.add(pcb);
        robotRaycasterObjects.push(pcb);

        // Metal Shielded ESP-WROOM-32 Can
        const shield = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, 1.8), silverMat);
        shield.position.set(-1.2, 0.2, 0);
        shield.userData = { title: "RF Shielded SoC Module", desc: "Houses the ESP32-D0WDQ6 dual-core silicon, 4MB SPI Flash memory, and 40MHz crystal oscillator." };
        group.add(shield);
        robotRaycasterObjects.push(shield);

        // Gold PCB Trace Antenna (Meandering)
        const antGroup = new THREE.Group();
        antGroup.position.set(-2.4, 0.15, 0);
        for(let i=0; i<4; i++) {
            const zig = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.4), goldMat);
            zig.position.x = i * 0.2;
            antGroup.add(zig);
        }
        antGroup.userData = { title: "2.4GHz Meandered Inverted-F Antenna", desc: "Planar PCB trace antenna delivering +20 dBm output power for long-range IoT robotics telemetry." };
        group.add(antGroup);
        robotRaycasterObjects.push(antGroup);

        // CP2102 USB Bridge IC
        const cp2102 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.6), blackIC);
        cp2102.position.set(0.6, 0.15, 0);
        group.add(cp2102);

        // Micro-USB Port
        const usb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.7), silverMat);
        usb.position.set(2.5, 0.25, 0);
        group.add(usb);

        // Detailed Header Pins
        for (let i = -8; i <= 8; i++) {
            const pinL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 16), goldMat);
            pinL.position.set(i * 0.26, -0.3, 1.25);
            const plasticL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), blackIC);
            plasticL.position.set(i * 0.26, 0.1, 1.25);
            group.add(pinL, plasticL);
            
            const pinR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 16), goldMat);
            pinR.position.set(i * 0.26, -0.3, -1.25);
            const plasticR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), blackIC);
            plasticR.position.set(i * 0.26, 0.1, -1.25);
            group.add(pinR, plasticR);
        }
    } else if (activeBoardType === 'arduino') {
        // Arduino Uno R3 (Teal PCB)
        const pcbMat = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.5, clearcoat: 0.1 });
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.15, 5.3), pcbMat);
        pcb.userData = { title: "Arduino Uno R3", desc: "Microchip ATmega328P 8-bit AVR RISC microcontroller @ 16 MHz, 32 KB Flash, 2 KB SRAM, 14 Digital I/O (6 PWM), 6 Analog Inputs." };
        group.add(pcb);
        robotRaycasterObjects.push(pcb);

        // ATmega328P DIP-28 IC
        const atmega = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 1.0), blackIC);
        atmega.position.set(0.6, 0.22, 0.8);
        atmega.userData = { title: "ATmega328P DIP-28 Microcontroller", desc: "8-bit AVR core executing single-clock cycle instructions with hardware SPI, I2C, and UART peripherals." };
        
        // Add tiny silver pins to IC
        for(let i=0; i<14; i++) {
            const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), silverMat);
            p1.position.set(-1.6 + i*0.24, -0.1, 0.5);
            atmega.add(p1);
            const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), silverMat);
            p2.position.set(-1.6 + i*0.24, -0.1, -0.5);
            atmega.add(p2);
        }
        
        group.add(atmega);
        robotRaycasterObjects.push(atmega);

        // 16.000 MHz Crystal Oscillator
        const crystal = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.35), silverMat);
        crystal.position.set(-0.8, 0.2, -0.2);
        group.add(crystal);

        // USB Type-B Port & DC Barrel Jack
        const usbB = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.1), silverMat);
        usbB.position.set(-2.8, 0.55, -1.6);
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.9), blackIC);
        barrel.position.set(-2.7, 0.5, 1.8);
        group.add(usbB, barrel);
    } else {
        // Generic High-Tech Controller
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 4), new THREE.MeshPhysicalMaterial({ color: 0x15803d, clearcoat: 0.5 }));
        group.add(pcb);
        const soc = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 1.8), blackIC);
        soc.position.y = 0.3;
        group.add(soc);
    }

    scene.add(group);
}

function updateBoardShowroom() {
    // Gentle floating inspection rotation for embedded electronics
    const model = scene.getObjectByName('robotModel');
    if (model) {
        model.rotation.y += 0.005;
    }
}

function switchBoardType(type) {
    activeBoardType = type;
    buildBoardShowroom3D();
    sound.playClick();
}

// --------------------------------------------------------------------------
// INTERACTIVE RAYCASTER & SLIDER LISTENERS
// --------------------------------------------------------------------------
function initRobotRaycaster() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('pointerdown', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(robotRaycasterObjects, true);

        if (hits.length > 0) {
            let hitObj = hits[0].object;
            while (hitObj && !hitObj.userData?.title && hitObj.parent) {
                hitObj = hitObj.parent;
            }
            if (hitObj?.userData?.title) {
                sound.playClick();
                showRobotInfoCard(hitObj.userData.title, hitObj.userData.desc);
            }
        }
    });
}

function showRobotInfoCard(title, desc) {
    const box = document.getElementById('robotInfo');
    const content = document.getElementById('robotInfoContent');
    if (!box || !content) return;

    content.innerHTML = `
        <div class="info-title-wrap">
            <span class="info-title">${title}</span>
        </div>
        <div class="info-desc-box">${desc}</div>
        <div class="info-formula-card" style="margin-top:10px;">
            <strong>Control & Engineering Specifications:</strong><br>
            • Teleoperation: Real-time 60 FPS Closed-Loop Control<br>
            • Kinematics: Denavit-Hartenberg (D-H) Transformation Matrix<br>
            • Communication Protocol: CAN Bus / ROS2 Micro-XRCE
        </div>
    `;
    box.style.display = 'block';
}

function initRobotSliders() {
    // 6-DOF Arm Forward Kinematics Sliders
    ['base', 'shoulder', 'elbow', 'wristPitch', 'wrist', 'grip'].forEach(j => {
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

    // Inverse Kinematics Sliders
    ['ikTargetX', 'ikTargetY', 'ikTargetZ'].forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.oninput = () => {
                const tx = parseFloat(document.getElementById('ikTargetX')?.value || 3.5);
                const ty = parseFloat(document.getElementById('ikTargetY')?.value || 4.0);
                const tz = parseFloat(document.getElementById('ikTargetZ')?.value || 0.0);
                document.getElementById('ikXVal').textContent = `${tx.toFixed(1)} m`;
                document.getElementById('ikYVal').textContent = `${ty.toFixed(1)} m`;
                document.getElementById('ikZVal').textContent = `${tz.toFixed(1)} m`;
                solveInverseKinematics(tx, ty, tz);
            };
        }
    });

    // PID Gains live listeners
    ['Kp', 'Ki', 'Kd'].forEach(g => {
        const sl = document.getElementById(`pid${g}`);
        const tag = document.getElementById(`${g.toLowerCase()}Val`);
        if (sl && tag) {
            sl.oninput = () => tag.textContent = sl.value;
        }
    });

    const cm = document.getElementById('cartMass');
    if (cm) cm.oninput = () => {
        document.getElementById('cartMassVal').textContent = `${cm.value} kg`;
    };
}

function toggleArmAutoDemo() {
    autoDemoActive = !autoDemoActive;
    const btn = document.getElementById('autoDemo');
    if (btn) {
        btn.classList.toggle('active', autoDemoActive);
        btn.textContent = autoDemoActive ? '⏸ Pause Demo' : '▶ Pick & Place Demo';
    }
    sound.playClick();
}

function setRobotMode(mode) {
    robotMode = mode;
    sound.playClick();

    document.querySelectorAll('#robot .mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`robotMode${mode.charAt(0).toUpperCase() + mode.slice(1)}`)?.classList.add('active');

    const armCtrl = document.getElementById('armControls');
    const pidCtrl = document.getElementById('pidControls');
    const droneCtrl = document.getElementById('droneControls');
    const motorCtrl = document.getElementById('motorControls');
    const boardCtrl = document.getElementById('boardControls');

    if (armCtrl) armCtrl.style.display = mode === 'arm' ? 'block' : 'none';
    if (pidCtrl) pidCtrl.style.display = mode === 'pid' ? 'block' : 'none';
    if (droneCtrl) droneCtrl.style.display = mode === 'drone' ? 'block' : 'none';
    if (motorCtrl) motorCtrl.style.display = mode === 'motor' ? 'block' : 'none';
    if (boardCtrl) boardCtrl.style.display = mode === 'board' ? 'block' : 'none';

    loadActiveRobotMode();
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
