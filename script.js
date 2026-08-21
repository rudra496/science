/**
 * SCIENCE LAB 3D — MASTER COMPREHENSIVE SIMULATION & ARCADE ENGINE (v2.5)
 * 100% Client-Side WebGL / Three.js r128 / Web Audio API / Vanilla JS
 * Author: Rudra Sarker (rudra496.github.io/science)
 */

// ==========================================================================
// 1. GLOBAL STATE, AUDIO SYNTHESIZER & WEBGL ENGINE
// ==========================================================================
let currentPage = 'home';
let scene, camera, renderer, controls;
let animationId = null;
let isPaused = false;
let simTime = 0;
let lastFrameTime = performance.now();
let frameCount = 0;
let currentFps = 60;
let activeParticleCount = 0;
let currentSubMode = '';
let currentExperiment = 'slit';
let currentGame = 'space';
let resizeHandler = null;

// Native Web Audio Synthesizer Engine (Zero external audio files)
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
        osc.frequency.setValueAtTime(920, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.14);
    }

    playExplosion() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const dur = 0.35;
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < buf.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, this.ctx.currentTime);
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
        osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(1174.66, this.ctx.currentTime + 0.18); // D6
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
    }

    playClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.035);
    }
}
const sound = new SoundEngine();

// ==========================================================================
// 2. COMPLETE 118 ELEMENTS DATASET
// ==========================================================================
const ELEMENTS = [
    {n:1,s:'H',name:'Hydrogen',cat:'nonmetal',color:'#90CAF9',mass:1.008,p:1,g:1,config:'1s¹',found:'1766',use:'Rocket fuel, ammonia, fuel cells',fact:'Most abundant cosmic element (75% universe mass)'},
    {n:2,s:'He',name:'Helium',cat:'noble',color:'#E8F5E9',mass:4.003,p:1,g:18,config:'1s²',found:'1868',use:'Cryogenics, MRI cooling, airships',fact:'Second most abundant element; never solidifies at 1 atm'},
    {n:3,s:'Li',name:'Lithium',cat:'alkali',color:'#FF8A65',mass:6.941,p:2,g:1,config:'[He]2s¹',found:'1817',use:'Li-ion batteries, ceramics, mood stabilizer',fact:'Least dense solid metal; floats on water and reacts'},
    {n:4,s:'Be',name:'Beryllium',cat:'alkaline',color:'#FFCC80',mass:9.012,p:2,g:2,config:'[He]2s²',found:'1798',use:'JWST mirrors, aerospace alloys, X-ray windows',fact:'Transparent to X-rays and highly rigid'},
    {n:5,s:'B',name:'Boron',cat:'metalloid',color:'#A1887F',mass:10.81,p:2,g:13,config:'[He]2s²2p¹',found:'1808',use:'Borosilicate glass, semiconductors, plant nutrition',fact:'High tensile strength; used in body armor'},
    {n:6,s:'C',name:'Carbon',cat:'nonmetal',color:'#616161',mass:12.01,p:2,g:14,config:'[He]2s²2p²',found:'Ancient',use:'Organic life, steel, graphene, carbon fiber',fact:'Forms millions of organic compounds; basis of all Earth life'},
    {n:7,s:'N',name:'Nitrogen',cat:'nonmetal',color:'#90CAF9',mass:14.01,p:2,g:15,config:'[He]2s²2p³',found:'1772',use:'Fertilizers, liquid nitrogen cryo, food packaging',fact:'Makes up 78% of Earth atmosphere'},
    {n:8,s:'O',name:'Oxygen',cat:'nonmetal',color:'#EF5350',mass:16.00,p:2,g:16,config:'[He]2s²2p⁴',found:'1774',use:'Cellular respiration, steelmaking, rocket oxidizer',fact:'Makes up 21% atmosphere and 46% of Earth crust'},
    {n:9,s:'F',name:'Fluorine',cat:'halogen',color:'#A5D6A7',mass:19.00,p:2,g:17,config:'[He]2s²2p⁵',found:'1886',use:'Toothpaste fluoride, Teflon (PTFE), pharmaceuticals',fact:'Most electronegative and chemically reactive element'},
    {n:10,s:'Ne',name:'Neon',cat:'noble',color:'#F48FB1',mass:20.18,p:2,g:18,config:'[He]2s²2p⁶',found:'1898',use:'Neon signs, high-voltage indicators, lasers',fact:'Emits unmistakable reddish-orange glow in discharge tubes'},
    {n:11,s:'Na',name:'Sodium',cat:'alkali',color:'#FF8A65',mass:22.99,p:3,g:1,config:'[Ne]3s¹',found:'1807',use:'Table salt (NaCl), nerve conduction, sodium lamps',fact:'Soft metal that ignites violently in contact with water'},
    {n:12,s:'Mg',name:'Magnesium',cat:'alkaline',color:'#FFCC80',mass:24.31,p:3,g:2,config:'[Ne]3s²',found:'1755',use:'Lightweight alloys, chlorophyll core, flares',fact:'Burns with intense dazzling white light at 3100°C'},
    {n:13,s:'Al',name:'Aluminum',cat:'post',color:'#B0BEC5',mass:26.98,p:3,g:13,config:'[Ne]3s²3p¹',found:'1825',use:'Aircraft fuselage, foil, power lines, electronics',fact:'Most abundant metal in Earth crust (8.1% mass)'},
    {n:14,s:'Si',name:'Silicon',cat:'metalloid',color:'#A1887F',mass:28.09,p:3,g:14,config:'[Ne]3s²3p²',found:'1824',use:'Semiconductor microchips, solar cells, silicone',fact:'Backbone of modern computation and second most abundant in crust'},
    {n:15,s:'P',name:'Phosphorus',cat:'nonmetal',color:'#FFD54F',mass:30.97,p:3,g:15,config:'[Ne]3s²3p³',found:'1669',use:'Fertilizers, DNA/RNA backbone, ATP energy currency',fact:'Discovered from urine by alchemist Hennig Brand; glows in dark'},
    {n:16,s:'S',name:'Sulfur',cat:'nonmetal',color:'#FFF176',mass:32.07,p:3,g:16,config:'[Ne]3s²3p⁴',found:'Ancient',use:'Sulfuric acid, vulcanized rubber, gunpowder',fact:'Known as brimstone; burns with vivid blue flame'},
    {n:17,s:'Cl',name:'Chlorine',cat:'halogen',color:'#A5D6A7',mass:35.45,p:3,g:17,config:'[Ne]3s²3p⁵',found:'1774',use:'Water purification, PVC plastic, bleach',fact:'Dense greenish-yellow halogen gas with suffocating odor'},
    {n:18,s:'Ar',name:'Argon',cat:'noble',color:'#E0E0E0',mass:39.95,p:3,g:18,config:'[Ne]3s²3p⁶',found:'1894',use:'Shielding gas for welding, incandescent light bulbs',fact:'Third most abundant gas in Earth atmosphere (0.93%)'},
    {n:19,s:'K',name:'Potassium',cat:'alkali',color:'#FF8A65',mass:39.10,p:4,g:1,config:'[Ar]4s¹',found:'1807',use:'Fertilizers, neuron action potentials, soaps',fact:'Burns with lilac-purple flame; reacts violently with water'},
    {n:20,s:'Ca',name:'Calcium',cat:'alkaline',color:'#FFCC80',mass:40.08,p:4,g:2,config:'[Ar]4s²',found:'1808',use:'Bones, teeth, cement/concrete, muscle contraction',fact:'Fifth most abundant element in Earth crust and body'},
    {n:21,s:'Sc',name:'Scandium',cat:'transition',color:'#CE93D8',mass:44.96,p:4,g:3,config:'[Ar]3d¹4s²',found:'1879',use:'Aerospace Al-Sc alloys, stadium lighting',fact:'Named after Scandinavia; very light and strong'},
    {n:22,s:'Ti',name:'Titanium',cat:'transition',color:'#B0BEC5',mass:47.87,p:4,g:4,config:'[Ar]3d²4s²',found:'1791',use:'Jet engines, biomedical implants, golf clubs',fact:'High strength-to-weight ratio; highly corrosion resistant'},
    {n:23,s:'V',name:'Vanadium',cat:'transition',color:'#FF8A65',mass:50.94,p:4,g:5,config:'[Ar]3d³4s²',found:'1801',use:'High-strength steel alloys, redox flow batteries',fact:'Named after Norse goddess of beauty Vanadis'},
    {n:24,s:'Cr',name:'Chromium',cat:'transition',color:'#90A4AE',mass:52.00,p:4,g:6,config:'[Ar]3d⁵4s¹',found:'1797',use:'Stainless steel, chrome plating, ruby coloration',fact:'Gives rubies their brilliant red color and emeralds green'},
    {n:25,s:'Mn',name:'Manganese',cat:'transition',color:'#7E57C2',mass:54.94,p:4,g:7,config:'[Ar]3d⁵4s²',found:'1774',use:'Steel deoxidizer, aluminum beverage cans, batteries',fact:'Essential cofactor in photosynthesis oxygen-evolving complex'},
    {n:26,s:'Fe',name:'Iron',cat:'transition',color:'#9E9E9E',mass:55.85,p:4,g:8,config:'[Ar]3d⁶4s²',found:'Ancient',use:'Structural steel, hemoglobin blood oxygen transport',fact:'Most abundant element by mass of total Earth planet'},
    {n:27,s:'Co',name:'Cobalt',cat:'transition',color:'#42A5F5',mass:58.93,p:4,g:9,config:'[Ar]3d⁷4s²',found:'1735',use:'EV Li-ion batteries, superalloys, cobalt blue glass',fact:'Core atom in Vitamin B12 (cobalamin)'},
    {n:28,s:'Ni',name:'Nickel',cat:'transition',color:'#B0BEC5',mass:58.69,p:4,g:10,config:'[Ar]3d⁸4s²',found:'1751',use:'Stainless steel, rechargeable batteries, coinage',fact:'Earth inner core is predominantly iron-nickel alloy'},
    {n:29,s:'Cu',name:'Copper',cat:'transition',color:'#FF8A65',mass:63.55,p:4,g:11,config:'[Ar]3d¹⁰4s¹',found:'Ancient',use:'Electrical wiring, plumbing, brass/bronze alloys',fact:'One of the few metals with natural distinct reddish color'},
    {n:30,s:'Zn',name:'Zinc',cat:'transition',color:'#B0BEC5',mass:65.38,p:4,g:12,config:'[Ar]3d¹⁰4s²',found:'Ancient',use:'Galvanized anti-rust steel, brass, immune enzymes',fact:'Critical trace element for over 300 biological enzymes'},
    {n:31,s:'Ga',name:'Gallium',cat:'post',color:'#B0BEC5',mass:69.72,p:4,g:13,config:'[Ar]3d¹⁰4s²4p¹',found:'1875',use:'Semiconductor GaAs, blue LEDs, thermometers',fact:'Melts in human hand at 29.76°C (85.57°F)'},
    {n:32,s:'Ge',name:'Germanium',cat:'metalloid',color:'#81C784',mass:72.63,p:4,g:14,config:'[Ar]3d¹⁰4s²4p²',found:'1886',use:'Fiber optics, night vision infrared lenses',fact:'Used in first operational transistor in 1947'},
    {n:33,s:'As',name:'Arsenic',cat:'metalloid',color:'#808080',mass:74.92,p:4,g:15,config:'[Ar]3d¹⁰4s²4p³',found:'Ancient',use:'Semiconductor doping, wood preservatives',fact:'Historically famous poison; sublimates at 614°C'},
    {n:34,s:'Se',name:'Selenium',cat:'nonmetal',color:'#FFD54F',mass:78.97,p:4,g:16,config:'[Ar]3d¹⁰4s²4p⁴',found:'1817',use:'Photocopiers, solar panels, glass decolorizer',fact:'Named after Greek moon goddess Selene; photoconductive'},
    {n:35,s:'Br',name:'Bromine',cat:'halogen',color:'#8D6E63',mass:79.90,p:4,g:17,config:'[Ar]3d¹⁰4s²4p⁵',found:'1826',use:'Flame retardants, pharmaceuticals, photography',fact:'Only nonmetallic element that is liquid at standard room temp'},
    {n:36,s:'Kr',name:'Krypton',cat:'noble',color:'#CE93D8',mass:83.80,p:4,g:18,config:'[Ar]3d¹⁰4s²4p⁶',found:'1898',use:'High-speed photography strobe flashes, lasers',fact:'Defined the meter standard length between 1960 and 1983'},
    {n:37,s:'Rb',name:'Rubidium',cat:'alkali',color:'#FF8A65',mass:85.47,p:5,g:1,config:'[Kr]5s¹',found:'1861',use:'Atomic clocks, quantum laser cooling, fireworks',fact:'Ignites spontaneously in air and melts at 39.3°C'},
    {n:38,s:'Sr',name:'Strontium',cat:'alkaline',color:'#FFCC80',mass:87.62,p:5,g:2,config:'[Kr]5s²',found:'1790',use:'Red emergency flares, fireworks, precision atomic clocks',fact:'Produces brilliant deep red flame spectrum'},
    {n:39,s:'Y',name:'Yttrium',cat:'transition',color:'#4DD0E1',mass:88.91,p:5,g:3,config:'[Kr]4d¹5s²',found:'1794',use:'YBCO high-temperature superconductors, LEDs, lasers',fact:'Discovered in Swedish village Ytterby along with 3 other elements'},
    {n:40,s:'Zr',name:'Zirconium',cat:'transition',color:'#B0BEC5',mass:91.22,p:5,g:4,config:'[Kr]4d²5s²',found:'1789',use:'Nuclear reactor fuel rod cladding, cubic zirconia',fact:'Low neutron absorption cross-section makes it vital for nuclear reactors'},
    {n:41,s:'Nb',name:'Niobium',cat:'transition',color:'#CE93D8',mass:92.91,p:5,g:5,config:'[Kr]4d⁴5s¹',found:'1801',use:'MRI superconducting magnets, rocket nozzles',fact:'Used in Large Hadron Collider superconducting cavities'},
    {n:42,s:'Mo',name:'Molybdenum',cat:'transition',color:'#78909C',mass:95.95,p:5,g:6,config:'[Kr]4d⁵5s¹',found:'1781',use:'High-strength armor plate, enzyme nitrogen fixation',fact:'Extremely high melting point (2623°C)'},
    {n:43,s:'Tc',name:'Technetium',cat:'transition',color:'#E0E0E0',mass:98,p:5,g:7,config:'[Kr]4d⁵5s²',found:'1937',use:'Medical gamma imaging (Tc-99m scans)',fact:'First artificially synthesized element in history'},
    {n:44,s:'Ru',name:'Ruthenium',cat:'transition',color:'#B0BEC5',mass:101.07,p:5,g:8,config:'[Kr]4d⁷5s¹',found:'1844',use:'Hard disk drive platters, solar dye cells',fact:'Named after Ruthenia (Latin name for Russia)'},
    {n:45,s:'Rh',name:'Rhodium',cat:'transition',color:'#E0E0E0',mass:102.91,p:5,g:9,config:'[Kr]4d⁸5s¹',found:'1803',use:'Automotive catalytic converters, optical mirrors',fact:'One of the rarest and most expensive precious metals on Earth'},
    {n:46,s:'Pd',name:'Palladium',cat:'transition',color:'#E0E0E0',mass:106.42,p:5,g:10,config:'[Kr]4d¹⁰',found:'1803',use:'Catalytic converters, hydrogen absorption filters',fact:'Can absorb up to 900 times its own volume of hydrogen gas'},
    {n:47,s:'Ag',name:'Silver',cat:'transition',color:'#E0E0E0',mass:107.87,p:5,g:11,config:'[Kr]4d¹⁰5s¹',found:'Ancient',use:'Jewelry, solar panels, best electrical conductor',fact:'Highest electrical and thermal conductivity of all elements'},
    {n:48,s:'Cd',name:'Cadmium',cat:'transition',color:'#FFD54F',mass:112.41,p:5,g:12,config:'[Kr]4d¹⁰5s²',found:'1817',use:'NiCd batteries, nuclear control rods, pigments',fact:'Strongly absorbs neutrons; toxic heavy metal'},
    {n:49,s:'In',name:'Indium',cat:'post',color:'#7986CB',mass:114.82,p:5,g:13,config:'[Kr]4d¹⁰5s²5p¹',found:'1863',use:'Indium Tin Oxide (ITO) touchscreens, solders',fact:'Emits an audible squeak or "tin cry" when bent'},
    {n:50,s:'Sn',name:'Tin',cat:'post',color:'#B0BEC5',mass:118.71,p:5,g:14,config:'[Kr]4d¹⁰5s²5p²',found:'Ancient',use:'Solder alloys, tin plating for food cans, bronze',fact:'Alloyed with copper to initiate the historic Bronze Age'},
    {n:51,s:'Sb',name:'Antimony',cat:'metalloid',color:'#B39DDB',mass:121.76,p:5,g:15,config:'[Kr]4d¹⁰5s²5p³',found:'Ancient',use:'Lead-acid battery plates, flame retardants',fact:'Expands upon freezing/solidifying'},
    {n:52,s:'Te',name:'Tellurium',cat:'metalloid',color:'#FFB74D',mass:127.60,p:5,g:16,config:'[Kr]4d¹⁰5s²5p⁴',found:'1783',use:'Cadmium telluride solar panels, thermoelectric coolers',fact:'Named after Latin word Tellus meaning Earth'},
    {n:53,s:'I',name:'Iodine',cat:'halogen',color:'#7E57C2',mass:126.90,p:5,g:17,config:'[Kr]4d¹⁰5s²5p⁵',found:'1811',use:'Antiseptic disinfectant, thyroid hormone synthesis',fact:'Sublimates directly into dense violet vapor when heated'},
    {n:54,s:'Xe',name:'Xenon',cat:'noble',color:'#42A5F5',mass:131.29,p:5,g:18,config:'[Kr]4d¹⁰5s²5p⁶',found:'1898',use:'Ion thruster engines on satellites, medical anesthesia',fact:'Powering NASA deep-space ion propulsion thrusters'},
    {n:55,s:'Cs',name:'Cesium',cat:'alkali',color:'#FF8A65',mass:132.91,p:6,g:1,config:'[Xe]6s¹',found:'1860',use:'Cesium atomic clocks defining the SI second unit',fact:'9,192,631,770 transitions per second define 1 SI second'},
    {n:56,s:'Ba',name:'Barium',cat:'alkaline',color:'#FFCC80',mass:137.33,p:6,g:2,config:'[Xe]6s²',found:'1808',use:'Medical gastrointestinal X-ray contrast, drilling mud',fact:'Gives fireworks vivid emerald-green colors'},
    {n:57,s:'La',name:'Lanthanum',cat:'lanthanide',color:'#81C784',mass:138.91,p:6,g:3,config:'[Xe]5d¹6s²',found:'1839',use:'Camera lenses, hybrid car NiMH battery electrodes',fact:'First of the rare-earth lanthanide series; oxidizes rapidly'},
    {n:58,s:'Ce',name:'Cerium',cat:'lanthanide',color:'#A5D6A7',mass:140.12,p:6,g:3,config:'[Xe]4f¹5d¹6s²',found:'1803',use:'Self-cleaning ovens catalyst, glass polishing',fact:'Most abundant rare earth element in Earth crust'},
    {n:59,s:'Pr',name:'Praseodymium',cat:'lanthanide',color:'#C5E1A5',mass:140.91,p:6,g:3,config:'[Xe]4f³6s²',found:'1885',use:'Aircraft engine alloys, welder protective goggles',fact:'Name means "green twin" due to green salts'},
    {n:60,s:'Nd',name:'Neodymium',cat:'lanthanide',color:'#DCEDC8',mass:144.24,p:6,g:3,config:'[Xe]4f⁴6s²',found:'1885',use:'NdFeB permanent supermagnets, EV drive motors',fact:'Creates the strongest known permanent magnets on Earth'},
    {n:61,s:'Pm',name:'Promethium',cat:'lanthanide',color:'#F48FB1',mass:145,p:6,g:3,config:'[Xe]4f⁵6s²',found:'1945',use:'Nuclear batteries, luminous instrument dials',fact:'Extremely radioactive and rare; named after titan Prometheus'},
    {n:62,s:'Sm',name:'Samarium',cat:'lanthanide',color:'#FFF59D',mass:150.36,p:6,g:3,config:'[Xe]4f⁶6s²',found:'1879',use:'Samarium-cobalt heat-resistant magnets, cancer therapy',fact:'Withstands extreme temperatures up to 300°C without demagnetizing'},
    {n:63,s:'Eu',name:'Europium',cat:'lanthanide',color:'#FF8A65',mass:151.96,p:6,g:3,config:'[Xe]4f⁷6s²',found:'1901',use:'Euro banknote anti-counterfeiting phosphors, red LEDs',fact:'Most reactive rare earth element; phosphoresces under UV'},
    {n:64,s:'Gd',name:'Gadolinium',cat:'lanthanide',color:'#FFCC80',mass:157.25,p:6,g:3,config:'[Xe]4f⁷5d¹6s²',found:'1880',use:'MRI scan intravenous contrast agents, neutron shielding',fact:'Highly paramagnetic at room temperature'},
    {n:65,s:'Tb',name:'Terbium',cat:'lanthanide',color:'#80DEEA',mass:158.93,p:6,g:3,config:'[Xe]4f⁹6s²',found:'1843',use:'Terfenol-D magnetostrictive sonar transducers, phosphors',fact:'Changes mechanical length when exposed to magnetic fields'},
    {n:66,s:'Dy',name:'Dysprosium',cat:'lanthanide',color:'#B2FF59',mass:162.50,p:6,g:3,config:'[Xe]4f¹⁰6s²',found:'1886',use:'Wind turbine magnets, nuclear reactor control rods',fact:'Name translates from Greek as "hard to get at"'},
    {n:67,s:'Ho',name:'Holmium',cat:'lanthanide',color:'#69F0AE',mass:164.93,p:6,g:3,config:'[Xe]4f¹¹6s²',found:'1878',use:'Medical surgery lasers, magnetic flux concentrators',fact:'Has highest magnetic moment of any natural element'},
    {n:68,s:'Er',name:'Erbium',cat:'lanthanide',color:'#EA80FC',mass:167.26,p:6,g:3,config:'[Xe]4f¹²6s²',found:'1843',use:'Erbium-doped fiber optic amplifiers (EDFA) powering internet',fact:'Amplifies global internet fiber signals around the world'},
    {n:69,s:'Tm',name:'Thulium',cat:'lanthanide',color:'#7C4DFF',mass:168.93,p:6,g:3,config:'[Xe]4f¹³6s²',found:'1879',use:'Portable dental X-ray machines, surgical lasers',fact:'Second rarest natural lanthanide on Earth'},
    {n:70,s:'Yb',name:'Ytterbium',cat:'lanthanide',color:'#448AFF',mass:173.05,p:6,g:3,config:'[Xe]4f¹⁴6s²',found:'1878',use:'Optical atomic clocks, high-power fiber lasers',fact:'Fourth element named after the single Swedish quarry Ytterby'},
    {n:71,s:'Lu',name:'Lutetium',cat:'lanthanide',color:'#18FFFF',mass:174.97,p:6,g:3,config:'[Xe]4f¹⁴5d¹6s²',found:'1907',use:'PET scan cancer detectors, targeted radiotherapy',fact:'Densest and hardest of all the lanthanides'},
    {n:72,s:'Hf',name:'Hafnium',cat:'transition',color:'#B0BEC5',mass:178.49,p:6,g:4,config:'[Xe]4f¹⁴5d²6s²',found:'1923',use:'Nuclear submarine control rods, microchip gate dielectric',fact:'Resists corrosion; named after Copenhagen (Hafnia)'},
    {n:73,s:'Ta',name:'Tantalum',cat:'transition',color:'#90A4AE',mass:180.95,p:6,g:5,config:'[Xe]4f¹⁴5d³6s²',found:'1802',use:'Smartphone micro-capacitors, surgical bone implants',fact:'Immune to biological rejection in the human body'},
    {n:74,s:'W',name:'Tungsten',cat:'transition',color:'#78909C',mass:183.84,p:6,g:6,config:'[Xe]4f¹⁴5d⁴6s²',found:'1783',use:'Incandescent filaments, kinetic penetrators, welding',fact:'Highest melting point of all elements on Earth (3422°C)'},
    {n:75,s:'Re',name:'Rhenium',cat:'transition',color:'#B0BEC5',mass:186.21,p:6,g:7,config:'[Xe]4f¹⁴5d⁵6s²',found:'1925',use:'Jet engine combustion turbine blades, platinum catalysts',fact:'Third highest melting point and among the rarest crust elements'},
    {n:76,s:'Os',name:'Osmium',cat:'transition',color:'#455A64',mass:190.23,p:6,g:8,config:'[Xe]4f¹⁴5d⁶6s²',found:'1803',use:'Fountain pen tips, electrical contacts, stain microscopy',fact:'Densest naturally occurring element (22.59 g/cm³)'},
    {n:77,s:'Ir',name:'Iridium',cat:'transition',color:'#CFD8DC',mass:192.22,p:6,g:9,config:'[Xe]4f¹⁴5d⁷6s²',found:'1803',use:'Aviation spark plugs, crucibles, dinosaur asteroid layer',fact:'Iridium-rich geological layer marks the asteroid impact 66M yrs ago'},
    {n:78,s:'Pt',name:'Platinum',cat:'transition',color:'#ECEFF1',mass:195.08,p:6,g:10,config:'[Xe]4f¹⁴5d⁹6s¹',found:'1735',use:'Fuel cell catalysts, catalytic converters, chemotherapy',fact:'Extremely noble metal; unaffected by air oxidation'},
    {n:79,s:'Au',name:'Gold',cat:'transition',color:'#FFD700',mass:196.97,p:6,g:11,config:'[Xe]4f¹⁴5d¹⁰6s¹',found:'Ancient',use:'Jewelry, aerospace infrared heat shields, electronics',fact:'Most malleable metal; 1 gram can be beaten into 1 m² sheet'},
    {n:80,s:'Hg',name:'Mercury',cat:'transition',color:'#B0BEC5',mass:200.59,p:6,g:12,config:'[Xe]4f¹⁴5d¹⁰6s²',found:'Ancient',use:'Fluorescent lights, barometer pressure sensors, dental',fact:'Only metallic element that is liquid at standard room temperature'},
    {n:81,s:'Tl',name:'Thallium',cat:'post',color:'#808080',mass:204.38,p:6,g:13,config:'[Xe]4f¹⁴5d¹⁰6s²6p¹',found:'1861',use:'High-density optical glass, cardiac stress imaging',fact:'Discovered by bright green spectral emission line'},
    {n:82,s:'Pb',name:'Lead',cat:'post',color:'#616161',mass:207.2,p:6,g:14,config:'[Xe]4f¹⁴5d¹⁰6s²6p²',found:'Ancient',use:'Car batteries, radiation shielding for X-rays/nuclear',fact:'Dense malleable post-transition metal and final stable decay product'},
    {n:83,s:'Bi',name:'Bismuth',cat:'post',color:'#E040FB',mass:208.98,p:6,g:15,config:'[Xe]4f¹⁴5d¹⁰6s²6p³',found:'Ancient',use:'Stomach medicines (Pepto-Bismol), non-toxic shot',fact:'Forms iridescent stepped rainbow hopper crystals on surface'},
    {n:84,s:'Po',name:'Polonium',cat:'metalloid',color:'#CE93D8',mass:209,p:6,g:16,config:'[Xe]4f¹⁴5d¹⁰6s²6p⁴',found:'1898',use:'Anti-static brushes, space satellite thermoelectric heaters',fact:'Discovered by Marie Curie and named in honor of Poland'},
    {n:85,s:'At',name:'Astatine',cat:'halogen',color:'#000000',mass:210,p:6,g:17,config:'[Xe]4f¹⁴5d¹⁰6s²6p⁵',found:'1940',use:'Targeted alpha-particle cancer oncology research',fact:'Rarest natural element in Earth crust (<28 grams in entire planet)'},
    {n:86,s:'Rn',name:'Radon',cat:'noble',color:'#FF5252',mass:222,p:6,g:18,config:'[Xe]4f¹⁴5d¹⁰6s²6p⁶',found:'1900',use:'Radiation therapy, geological earthquake tracking',fact:'Heavy radioactive gas produced by natural decay of radium in soil'},
    {n:87,s:'Fr',name:'Francium',cat:'alkali',color:'#FF8A65',mass:223,p:7,g:1,config:'[Rn]7s¹',found:'1939',use:'Atomic structure physics experiments',fact:'Second rarest natural element; half-life of only 22 minutes'},
    {n:88,s:'Ra',name:'Radium',cat:'alkaline',color:'#C5E1A5',mass:226,p:7,g:2,config:'[Rn]7s²',found:'1898',use:'Historic luminous watch dials, cancer radiation therapy',fact:'Discovered by Marie & Pierre Curie; glows faint blue in dark'},
    {n:89,s:'Ac',name:'Actinium',cat:'actinide',color:'#80CBC4',mass:227,p:7,g:3,config:'[Rn]6d¹7s²',found:'1899',use:'Neutron radiation source, targeted cancer alpha therapy',fact:'Glows with eerie blue light in darkness due to air ionization'},
    {n:90,s:'Th',name:'Thorium',cat:'actinide',color:'#FFCC80',mass:232.04,p:7,g:3,config:'[Rn]6d²7s²',found:'1829',use:'Thorium nuclear power fuel cycles, TIG welding',fact:'Named after Norse god of thunder Thor; cleaner nuclear fuel'},
    {n:91,s:'Pa',name:'Protactinium',cat:'actinide',color:'#BCAAA4',mass:231.04,p:7,g:3,config:'[Rn]5f²6d¹7s²',found:'1913',use:'Deep-sea sediment oceanographic radiometric dating',fact:'Highly radioactive and toxic actinide'},
    {n:92,s:'U',name:'Uranium',cat:'actinide',color:'#81C784',mass:238.03,p:7,g:3,config:'[Rn]5f³6d¹7s²',found:'1789',use:'Commercial nuclear power generation, military armor',fact:'U-235 undergoes nuclear fission; named after planet Uranus'},
    {n:93,s:'Np',name:'Neptunium',cat:'actinide',color:'#4DD0E1',mass:237,p:7,g:3,config:'[Rn]5f⁴6d¹7s²',found:'1940',use:'Nuclear physics detectors, precursor for Pu-238',fact:'First transuranic synthesized element beyond uranium'},
    {n:94,s:'Pu',name:'Plutonium',cat:'actinide',color:'#CE93D8',mass:244,p:7,g:3,config:'[Rn]5f⁶7s²',found:'1940',use:'NASA Voyager & Mars Rover RTG space batteries, weapons',fact:'Powers NASA Curiosity and Perseverance rovers on Mars'},
    {n:95,s:'Am',name:'Americium',cat:'actinide',color:'#90CAF9',mass:243,p:7,g:3,config:'[Rn]5f⁷7s²',found:'1944',use:'Household ionization smoke detectors, industrial gauges',fact:'Found in millions of residential smoke alarms worldwide'},
    {n:96,s:'Cm',name:'Curium',cat:'actinide',color:'#80DEEA',mass:247,p:7,g:3,config:'[Rn]5f⁷6d¹7s²',found:'1944',use:'Alpha-particle spectrometers on planetary Mars rovers',fact:'Named in honor of Marie and Pierre Curie'},
    {n:97,s:'Bk',name:'Berkelium',cat:'actinide',color:'#B2FF59',mass:247,p:7,g:3,config:'[Rn]5f⁹7s²',found:'1949',use:'Synthesis target to discover element 117 Tennessine',fact:'Named after University of California, Berkeley'},
    {n:98,s:'Cf',name:'Californium',cat:'actinide',color:'#FF5722',mass:251,p:7,g:3,config:'[Rn]5f¹⁰7s²',found:'1950',use:'Neutron startup sources for nuclear reactors, oil logging',fact:'Extremely strong neutron emitter; highly valuable'},
    {n:99,s:'Es',name:'Einsteinium',cat:'actinide',color:'#9C27B0',mass:252,p:7,g:3,config:'[Rn]5f¹¹7s²',found:'1952',use:'Fundamental nuclear science research',fact:'Discovered in debris fallout of first thermonuclear bomb test Ivy Mike'},
    {n:100,s:'Fm',name:'Fermium',cat:'actinide',color:'#4CAF50',mass:257,p:7,g:3,config:'[Rn]5f¹²7s²',found:'1952',use:'Scientific heavy element synthesis research',fact:'Named after Enrico Fermi, pioneer of controlled nuclear chain reactions'},
    {n:101,s:'Md',name:'Mendelevium',cat:'actinide',color:'#E91E63',mass:258,p:7,g:3,config:'[Rn]5f¹³7s²',found:'1955',use:'Heavy ion nuclear discovery experiments',fact:'Named in honor of Dmitri Mendeleev, father of the Periodic Table'},
    {n:102,s:'No',name:'Nobelium',cat:'actinide',color:'#2196F3',mass:259,p:7,g:3,config:'[Rn]5f¹⁴7s²',found:'1958',use:'Heavy-element chemistry research',fact:'Named in honor of Alfred Nobel, founder of the Nobel Prizes'},
    {n:103,s:'Lr',name:'Lawrencium',cat:'actinide',color:'#FF9800',mass:266,p:7,g:3,config:'[Rn]5f¹⁴7p¹7s²',found:'1961',use:'Superheavy actinide research',fact:'Named after Ernest Lawrence, inventor of the cyclotron accelerator'},
    {n:104,s:'Rf',name:'Rutherfordium',cat:'transition',color:'#FFC107',mass:267,p:7,g:4,config:'[Rn]5f¹⁴6d²7s²',found:'1964',use:'Transactinide nuclear research',fact:'Named after Ernest Rutherford, discoverer of atomic nucleus'},
    {n:105,s:'Db',name:'Dubnium',cat:'transition',color:'#00BCD4',mass:268,p:7,g:5,config:'[Rn]5f¹⁴6d³7s²',found:'1967',use:'Relativistic quantum chemistry research',fact:'Named after Dubna, Russia, site of the Joint Institute for Nuclear Research'},
    {n:106,s:'Sg',name:'Seaborgium',cat:'transition',color:'#673AB7',mass:269,p:7,g:6,config:'[Rn]5f¹⁴6d⁴7s²',found:'1974',use:'Superheavy element research',fact:'First element named after a living person (Glenn T. Seaborg)'},
    {n:107,s:'Bh',name:'Bohrium',cat:'transition',color:'#9C27B0',mass:270,p:7,g:7,config:'[Rn]5f¹⁴6d⁵7s²',found:'1981',use:'Quantum shell structure experiments',fact:'Named after Danish physicist Niels Bohr, pioneer of atomic models'},
    {n:108,s:'Hs',name:'Hassium',cat:'transition',color:'#795548',mass:269,p:7,g:8,config:'[Rn]5f¹⁴6d⁶7s²',found:'1984',use:'Gas-phase transactinide chemistry',fact:'Forms volatile tetroxide compound similar to osmium'},
    {n:109,s:'Mt',name:'Meitnerium',cat:'transition',color:'#607D8B',mass:278,p:7,g:9,config:'[Rn]5f¹⁴6d⁷7s²',found:'1982',use:'Superheavy nuclear research',fact:'Named in honor of Lise Meitner, co-discoverer of nuclear fission'},
    {n:110,s:'Ds',name:'Darmstadtium',cat:'transition',color:'#8BC34A',mass:281,p:7,g:10,config:'[Rn]5f¹⁴6d⁸7s²',found:'1994',use:'Superheavy physics research',fact:'Named after Darmstadt, Germany, home of GSI Helmholtz Centre'},
    {n:111,s:'Rg',name:'Roentgenium',cat:'transition',color:'#FF5722',mass:282,p:7,g:11,config:'[Rn]5f¹⁴6d⁹7s²',found:'1994',use:'Relativistic superheavy chemistry',fact:'Named after Wilhelm Röntgen, discoverer of X-rays'},
    {n:112,s:'Cn',name:'Copernicium',cat:'transition',color:'#03A9F4',mass:285,p:7,g:12,config:'[Rn]5f¹⁴6d¹⁰7s²',found:'1996',use:'Relativistic closed-shell metal experiments',fact:'Behaves as a volatile liquid metal due to relativistic electron speeds'},
    {n:113,s:'Nh',name:'Nihonium',cat:'post',color:'#E91E63',mass:286,p:7,g:13,config:'[Rn]5f¹⁴6d¹⁰7s²7p¹',found:'2004',use:'Superheavy physics experiments',fact:'First chemical element discovered in an Asian nation (RIKEN, Japan)'},
    {n:114,s:'Fl',name:'Flerovium',cat:'post',color:'#9E9E9E',mass:289,p:7,g:14,config:'[Rn]5f¹⁴6d¹⁰7s²7p²',found:'1998',use:'Island of Stability nuclear research',fact:'Predicted to sit close to the theoretical nuclear "Island of Stability"'},
    {n:115,s:'Mc',name:'Moscovium',cat:'post',color:'#673AB7',mass:290,p:7,g:15,config:'[Rn]5f¹⁴6d¹⁰7s²7p³',found:'2003',use:'Superheavy transactinide synthesis',fact:'Named in honor of the Moscow region of Russia'},
    {n:116,s:'Lv',name:'Livermorium',cat:'post',color:'#4CAF50',mass:293,p:7,g:16,config:'[Rn]5f¹⁴6d¹⁰7s²7p⁴',found:'2000',use:'Heavy ion nuclear experiments',fact:'Named after Lawrence Livermore National Laboratory in California'},
    {n:117,s:'Ts',name:'Tennessine',cat:'halogen',color:'#FF9800',mass:294,p:7,g:17,config:'[Rn]5f¹⁴6d¹⁰7s²7p⁵',found:'2010',use:'Superheavy halogen physics research',fact:'Named after Tennessee, home of Oak Ridge National Laboratory'},
    {n:118,s:'Og',name:'Oganesson',cat:'noble',color:'#F44336',mass:294,p:7,g:18,config:'[Rn]5f¹⁴6d¹⁰7s²7p⁶',found:'2002',use:'Transactinide quantum chemistry research',fact:'Heaviest known element in the universe; atomic number 118'}
];

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
        ...ELEMENTS.map(e => ({ title: `${e.name} (${e.s}) - #${e.n}`, cat: 'Element', page: 'elements', action: () => { showPage('elements'); selectElement(e); } })),
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
        { title: 'Chemical Molecule Forge 3D', cat: 'Chemistry', page: 'elements', action: () => { showPage('elements'); setElemMode('molecule'); } }
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
        ], bonds: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]] },
        caffeine: { atoms: [
            {t:'N',p:[-1.2,0.8,0]}, {t:'C',p:[-0.8,-0.5,0]}, {t:'N',p:[0.5,-0.7,0]}, {t:'C',p:[1.3,0.4,0]}, {t:'C',p:[0.4,1.4,0]}, {t:'C',p:[-1.8,2,0]},
            {t:'O',p:[-1.5,-1.5,0]}, {t:'O',p:[2.5,0.4,0]}, {t:'C',p:[1,2.8,0]}, {t:'N',p:[2,-0.9,0]}, {t:'C',p:[2.8,-1.9,0]}
        ], bonds: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[1,6],[3,7],[4,8],[2,9],[9,10]] }
    };

    const data = molecules[type] || molecules.water;
    const atomMeshes = [];

    data.atoms.forEach(a => {
        const radius = atomSizes[a.t] || 0.6;
        const col = atomColors[a.t] || 0xa855f7;
        const geo = new THREE.SphereGeometry(radius, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.2 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(a.p[0], a.p[1], a.p[2]);
        molGroup.add(mesh);
        atomMeshes.push(mesh);
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

    // Reactant Vessel (Left)
    const vessel1Geo = new THREE.CylinderGeometry(2, 2, 4, 32, 1, true);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.1 });
    const vessel1 = new THREE.Mesh(vessel1Geo, glassMat);
    vessel1.position.set(-5, 0, 0);
    rxnGroup.add(vessel1);

    // Product Vessel (Right)
    const vessel2 = new THREE.Mesh(vessel1Geo, glassMat);
    vessel2.position.set(5, 0, 0);
    rxnGroup.add(vessel2);

    // Connecting Reaction Channel Tube
    const tubeGeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.rotation.z = Math.PI / 2;
    tube.position.set(0, 1.5, 0);
    rxnGroup.add(tube);

    // Sparks & Reaction Glow
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
    { name: 'Sun', r: 3.2, dist: 0, speed: 0, rot: 0.002, col: 0xffaa00, glow: true, info: 'G-type main-sequence star. 99.86% of Solar System mass.' },
    { name: 'Mercury', r: 0.38, dist: 6, speed: 4.1, rot: 0.004, col: 0x94a3b8, info: 'Smallest planet. Surface temps range from -180°C to 430°C.' },
    { name: 'Venus', r: 0.85, dist: 9, speed: 1.6, rot: -0.002, col: 0xf59e0b, info: 'Hottest planet (465°C) with dense runaway CO2 greenhouse atmosphere.' },
    { name: 'Earth', r: 0.9, dist: 13, speed: 1.0, rot: 0.02, col: 0x38bdf8, info: 'Only known haven for organic life. 71% surface liquid water.', hasMoon: true },
    { name: 'Mars', r: 0.52, dist: 17, speed: 0.53, rot: 0.018, col: 0xef4444, info: 'Red planet. Home to Olympus Mons, largest volcano in solar system.' },
    { name: 'Jupiter', r: 2.2, dist: 25, speed: 0.24, rot: 0.04, col: 0xd97706, info: 'Gas giant with iconic Great Red Spot storm & 95 known moons.', hasMoons: 4 },
    { name: 'Saturn', r: 1.8, dist: 34, speed: 0.12, rot: 0.038, col: 0xfde047, rings: true, info: 'Spectacular planetary ring system composed of water ice & rock.' },
    { name: 'Uranus', r: 1.2, dist: 43, speed: 0.06, rot: -0.02, col: 0x67e8f9, info: 'Ice giant with extreme 98° axial tilt orbiting on its side.' },
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
    asteroidGeo.setAttribute('position', new THREE.Float32BufferAttribute(asteroidPositions, 3));
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
                    <div class="info-stat-card"><div class="info-stat-label">Radius</div><div class="info-stat-value">${(item.data.r * 6371).toFixed(0)} km (rel)</div></div>
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
    showToast('CRISPR-Cas9 sgRNA Guide Complex docked to PAM target sequence.');
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
// 9. MODULE 4: CYTOLOGY & NEUROBIOLOGY
// ==========================================================================
let cellType = 'animal';
let cellAnim = 'rotate';

function initCell() {
    const setup = createScene('cellScene');
    if (!setup) return;

    camera.position.set(0, 0, 20);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const pointLight = new THREE.PointLight(0xffffff, 1.2, 100);
    pointLight.position.set(15, 20, 20);
    scene.add(pointLight);

    buildCellModel();

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (!isPaused) {
            const speed = parseFloat(document.getElementById('cellSpeed')?.value || 0.5);
            simTime += 0.01 * speed;

            const model = scene.getObjectByName('cellModel');
            if (model && cellAnim === 'rotate') {
                model.rotation.y = simTime;
                model.rotation.x = Math.sin(simTime * 0.5) * 0.2;
            }
        }
        controls.update();
        renderer.render(scene, camera);
        updateTelemetry(350);
    }
    animate();
}

function buildCellModel() {
    disposeHierarchy(scene.getObjectByName('cellModel'));
    const cellGroup = new THREE.Group();
    cellGroup.name = 'cellModel';

    if (cellType === 'animal') {
        const memGeo = new THREE.SphereGeometry(4.5, 32, 32);
        const memMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25, roughness: 0.3 });
        cellGroup.add(new THREE.Mesh(memGeo, memMat));

        const nucGeo = new THREE.SphereGeometry(1.6, 24, 24);
        const nucMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.4 });
        const nuc = new THREE.Mesh(nucGeo, nucMat);
        cellGroup.add(nuc);

        for (let i = 0; i < 5; i++) {
            const mitoGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
            const mitoMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
            const mito = new THREE.Mesh(mitoGeo, mitoMat);
            mito.position.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
            mito.rotation.set(Math.random(), Math.random(), Math.random());
            cellGroup.add(mito);
        }
    } else if (cellType === 'neuron') {
        const somaGeo = new THREE.SphereGeometry(1.8, 24, 24);
        const somaMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.3 });
        const soma = new THREE.Mesh(somaGeo, somaMat);
        soma.position.set(-6, 0, 0);
        cellGroup.add(soma);

        for (let i = 0; i < 8; i++) {
            const dGeo = new THREE.CylinderGeometry(0.08, 0.2, 3.5, 8);
            const dMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
            const d = new THREE.Mesh(dGeo, dMat);
            const angle = (i / 8) * Math.PI * 2;
            d.position.set(-6 + Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0);
            d.rotation.z = angle + Math.PI / 2;
            cellGroup.add(d);
        }

        const axonGeo = new THREE.CylinderGeometry(0.2, 0.2, 14, 16);
        const axonMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
        const axon = new THREE.Mesh(axonGeo, axonMat);
        axon.position.set(1.5, 0, 0);
        axon.rotation.z = Math.PI / 2;
        cellGroup.add(axon);

        for (let j = 0; j < 5; j++) {
            const mGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.2, 16);
            const mMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
            const m = new THREE.Mesh(mGeo, mMat);
            m.position.set(-3.5 + j * 2.6, 0, 0);
            m.rotation.z = Math.PI / 2;
            cellGroup.add(m);
        }
    } else if (cellType === 'mitochondria') {
        const outerGeo = new THREE.SphereGeometry(3.5, 32, 16);
        outerGeo.scale(1.8, 1, 1);
        const outerMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.4 });
        cellGroup.add(new THREE.Mesh(outerGeo, outerMat));

        for (let k = -4; k <= 4; k += 1.2) {
            const foldGeo = new THREE.TorusGeometry(1.4, 0.2, 8, 24);
            const foldMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
            const fold = new THREE.Mesh(foldGeo, foldMat);
            fold.position.x = k;
            cellGroup.add(fold);
        }
    } else {
        const wallGeo = new THREE.BoxGeometry(7, 5.5, 5.5);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, transparent: true, opacity: 0.35, roughness: 0.2 });
        cellGroup.add(new THREE.Mesh(wallGeo, wallMat));

        const vacGeo = new THREE.SphereGeometry(1.8, 24, 24);
        const vacMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
        cellGroup.add(new THREE.Mesh(vacGeo, vacMat));
    }

    scene.add(cellGroup);
}

function setCellType(type) {
    cellType = type;
    sound.playClick();
    document.querySelectorAll('#cell .mode-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`cellType${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (btn) btn.classList.add('active');

    const neuronCtrl = document.getElementById('cellNeuronControls');
    if (neuronCtrl) neuronCtrl.style.display = type === 'neuron' ? 'block' : 'none';

    buildCellModel();
}

function setCellAnim(anim) {
    cellAnim = anim;
    sound.playClick();
    document.querySelectorAll('#cell .ctrl-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`cellAnim${anim.charAt(0).toUpperCase() + anim.slice(1)}`);
    if (btn) btn.classList.add('active');
}

function fireNeuronActionPotential() {
    sound.playLaser();
    showToast('⚡ Action Potential depolarization wave propagating through axon (+30 mV)!');
    const volt = document.getElementById('membraneVoltage');
    if (volt) {
        volt.textContent = '+30 mV (Depolarized)';
        setTimeout(() => { volt.textContent = '-70 mV (Resting)'; }, 1600);
    }
}

// ==========================================================================
// 10. MODULE 5: 18 FULLY WORKING PHYSICS & QUANTUM SIMULATIONS
// ==========================================================================
let physicsParticles = [];
let physicsCustomObjects = [];

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
        updateTelemetry(physicsParticles.length || 600);
    }
    animate();
}

function loadPhysicsExp(expName) {
    currentExperiment = expName;
    sound.playClick();

    disposeHierarchy(scene.getObjectByName('physicsExperimentGroup'));
    physicsParticles = [];
    physicsCustomObjects = [];

    const expGroup = new THREE.Group();
    expGroup.name = 'physicsExperimentGroup';

    const dynControls = document.getElementById('physicsDynamicControls');
    const sel = document.getElementById('physicsExpSelect');
    if (sel && sel.value !== expName) sel.value = expName;

    switch (expName) {
        case 'slit':
            camera.position.set(0, 4, 22);
            controls.target.set(0, 0, 0);
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
    physicsParticles = [points];
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
    const cathodeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
    const cathode = new THREE.Mesh(plateGeo, cathodeMat);
    cathode.position.set(-4, 0, 0);
    group.add(cathode);

    const anodeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const anode = new THREE.Mesh(plateGeo, anodeMat);
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
    const eMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.2 });
    const electrons = new THREE.Points(eGeo, eMat);
    group.add(electrons);
    physicsParticles = [electrons];
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
    const nuc = new THREE.Mesh(nucGeo, nucMat);
    group.add(nuc);

    const aGeo = new THREE.BufferGeometry();
    const aPos = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
        aPos[i * 3] = -12 + Math.random() * 24;
        aPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
        aPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    aGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
    const aMat = new THREE.PointsMaterial({ color: 0xef4444, size: 0.25 });
    const alphaPts = new THREE.Points(aGeo, aMat);
    group.add(alphaPts);
    physicsParticles = [alphaPts];
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

    const trackGeo = new THREE.TorusGeometry(6, 0.4, 16, 64);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = Math.PI / 2;
    group.add(track);

    const pelletGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.4, 24);
    const pelletMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8 });
    const pellet = new THREE.Mesh(pelletGeo, pelletMat);
    pellet.position.set(6, 1.2, 0);
    pellet.name = 'levitatingPellet';
    group.add(pellet);
    physicsCustomObjects.push(pellet);
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

    const dropGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const dropMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const drop = new THREE.Mesh(dropGeo, dropMat);
    drop.name = 'oilDrop';
    group.add(drop);
    physicsCustomObjects.push(drop);
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

    const bhGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const bh = new THREE.Mesh(bhGeo, bhMat);
    group.add(bh);

    const psGeo = new THREE.RingGeometry(3.28, 3.32, 64);
    const psMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const ps = new THREE.Mesh(psGeo, psMat);
    ps.rotation.x = Math.PI / 2;
    group.add(ps);

    const diskGeo = new THREE.RingGeometry(3.5, 9.5, 64);
    const diskMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = Math.PI / 2.3;
    group.add(disk);

    const haloGeo = new THREE.SphereGeometry(10.0, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.12, side: THREE.BackSide });
    group.add(new THREE.Mesh(haloGeo, haloMat));
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
    const bodyGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    rocket.add(body);

    const noseGeo = new THREE.ConeGeometry(0.8, 2, 16);
    const nose = new THREE.Mesh(noseGeo, new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 4;
    rocket.add(nose);

    group.add(rocket);
    physicsCustomObjects.push(rocket);
}

// 9. Orbital Gravity
function buildOrbitalGravityExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🪐 N-Body Orbital Mechanics</h4>
            <label class="slider-label">Launch Velocity (km/s): <input type="range" id="orbVel" min="5" max="15" step="0.1" value="7.8"></label>
        `;
    }

    const planetGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 });
    group.add(new THREE.Mesh(planetGeo, planetMat));

    const satGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const sat = new THREE.Mesh(satGeo, new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    sat.name = 'gravitySatellite';
    sat.position.set(7, 0, 0);
    group.add(sat);
    physicsCustomObjects.push(sat);
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
        const coilGeo = new THREE.TorusGeometry(3.5, 0.3, 16, 32);
        const coilMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
        const coil = new THREE.Mesh(coilGeo, coilMat);
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

    const baseGeo = new THREE.BoxGeometry(12, 0.4, 12);
    const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b }));
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

    const prismGeo = new THREE.CylinderGeometry(2, 2, 4, 3);
    const prismMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5, roughness: 0.1 });
    const prism = new THREE.Mesh(prismGeo, prismMat);
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
        const ringGeo = new THREE.RingGeometry(r - 0.05, r + 0.05, 32);
        const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
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

    const armMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const bobMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.4 });

    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 16), armMat);
    arm1.position.y = -2;
    const bob1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), bobMat);
    bob1.position.y = -4;

    group.add(arm1);
    group.add(bob1);
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
    const tubeGeo = new THREE.TubeGeometry(curve, 1000, 0.25, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x7209b7,
        emissiveIntensity: 0.6,
        roughness: 0.2
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    group.add(tube);
}

// 16. Fluid Vortex Shedding
function buildFluidVortexExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🌊 Kármán Vortex Street</h4>
            <label class="slider-label">Reynolds Number (Re): <input type="range" id="fluidRe" min="50" max="500" value="180"></label>
        `;
    }

    const obsGeo = new THREE.CylinderGeometry(1.2, 1.2, 6, 32);
    const obs = new THREE.Mesh(obsGeo, new THREE.MeshStandardMaterial({ color: 0x334155 }));
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
    physicsParticles = [fPts];
}

// 17. Thermodynamics
function buildThermodynamicsExp(group, dynControls) {
    if (dynControls) {
        dynControls.innerHTML = `
            <h4>🌡️ Maxwell-Boltzmann Kinetic Theory</h4>
            <label class="slider-label">Temperature: <input type="range" id="thermoT" min="50" max="1000" value="300"><span class="val-tag">300 K</span></label>
        `;
    }

    const boxGeo = new THREE.BoxGeometry(8, 8, 8);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25, roughness: 0.1 });
    group.add(new THREE.Mesh(boxGeo, boxMat));

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
    physicsParticles = [gPts];
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
    group.add(waveTube);
}

function updatePhysicsSimulation(timeWarp) {
    if (currentExperiment === 'slit' && physicsParticles[0]) {
        const pos = physicsParticles[0].geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i] += 0.2 * timeWarp;
            if (pos[i] > 8) pos[i] = -12;
        }
        physicsParticles[0].geometry.attributes.position.needsUpdate = true;
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
    showToast('⚖️ Disturbance torque impulse applied to inverted pendulum! PID compensating.');
}

// ==========================================================================
// 12. MODULE 7: 3D SCIENCE ARCADE (4 INTERACTIVE GAMES)
// ==========================================================================
let gameState = {
    running: false,
    score: 0,
    lives: 3,
    wave: 1,
    highScore: 0,
    player: null,
    lasers: [],
    enemies: [],
    keys: {}
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
    buildSpaceFighter();

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
            firePlayerLaser();
        }
    });
    window.addEventListener('keyup', (e) => {
        gameState.keys[e.code] = false;
    });
}

function buildSpaceFighter() {
    disposeHierarchy(scene.getObjectByName('playerShip'));
    const ship = new THREE.Group();
    ship.name = 'playerShip';

    const bodyGeo = new THREE.ConeGeometry(0.8, 2.5, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    ship.add(body);

    const wingGeo = new THREE.BoxGeometry(3.5, 0.1, 1.2);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x4361ee, roughness: 0.3 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.z = 0.5;
    ship.add(wings);

    ship.position.set(0, 0, 8);
    scene.add(ship);
    gameState.player = ship;
}

function firePlayerLaser() {
    if (!gameState.player) return;
    sound.playLaser();

    for (let x of [-1.2, 1.2]) {
        const lGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
        const lMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const laser = new THREE.Mesh(lGeo, lMat);
        laser.rotation.x = Math.PI / 2;
        laser.position.set(gameState.player.position.x + x, gameState.player.position.y, gameState.player.position.z - 1.2);
        scene.add(laser);
        gameState.lasers.push(laser);
    }
}

function spawnAsteroidEnemy() {
    const geo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.8, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.8 });
    const enemy = new THREE.Mesh(geo, mat);
    enemy.position.set((Math.random() - 0.5) * 20, 0, -25);
    enemy.userData = { speed: 0.15 + Math.random() * 0.15 * gameState.wave, rotX: Math.random() * 0.05, rotY: Math.random() * 0.05 };
    scene.add(enemy);
    gameState.enemies.push(enemy);
}

function updateGamePhysics() {
    if (!gameState.player) return;

    const moveSpeed = 0.25;
    if (gameState.keys['KeyA'] || gameState.keys['ArrowLeft']) gameState.player.position.x = Math.max(-10, gameState.player.position.x - moveSpeed);
    if (gameState.keys['KeyD'] || gameState.keys['ArrowRight']) gameState.player.position.x = Math.min(10, gameState.player.position.x + moveSpeed);
    if (gameState.keys['KeyW'] || gameState.keys['ArrowUp']) gameState.player.position.z = Math.max(-5, gameState.player.position.z - moveSpeed);
    if (gameState.keys['KeyS'] || gameState.keys['ArrowDown']) gameState.player.position.z = Math.min(10, gameState.player.position.z + moveSpeed);

    if (Math.random() < 0.035 * gameState.wave) {
        spawnAsteroidEnemy();
    }

    for (let i = gameState.lasers.length - 1; i >= 0; i--) {
        const l = gameState.lasers[i];
        l.position.z -= 0.8;
        if (l.position.z < -40) {
            scene.remove(l);
            gameState.lasers.splice(i, 1);
        }
    }

    for (let j = gameState.enemies.length - 1; j >= 0; j--) {
        const e = gameState.enemies[j];
        e.position.z += e.userData.speed;
        e.rotation.x += e.userData.rotX;
        e.rotation.y += e.userData.rotY;

        if (e.position.distanceTo(gameState.player.position) < 1.6) {
            sound.playExplosion();
            scene.remove(e);
            gameState.enemies.splice(j, 1);
            gameState.lives--;
            updateGameHud();
            if (gameState.lives <= 0) {
                endActiveGame();
                return;
            }
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
}

function updateGameHud() {
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const waveEl = document.getElementById('wave');
    const hsEl = document.getElementById('highScore');

    if (scoreEl) scoreEl.textContent = gameState.score;
    if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, gameState.lives));
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
    showToast('🚀 Mission Started! Engage Arcade Simulation!');
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

function switchGame(gType) {
    currentGame = gType;
    sound.playClick();
    const help = document.getElementById('gameHelpText');
    if (help) {
        const helps = {
            space: 'WASD / Arrow Keys to maneuver starfighter.<br>SPACEBAR to fire plasma lasers.<br>Destroy kinetic asteroids before Earth impact!',
            quantum: 'Adjust quantum wavepacket energy E and barrier potential V₀.<br>Achieve resonance transmission without quantum reflection.',
            alchemy: 'Collect chemical elements from periodic hopper.<br>Synthesize target compounds before beaker overflows!',
            slingshot: 'Calculate gravitational slingshot vector thrust.<br>Perform orbital insertion into Mars orbit.'
        };
        help.innerHTML = helps[gType] || helps.space;
    }
}

// ==========================================================================
// 13. DOM READY BOOTSTRAP
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initStars();
    initNav();
});
