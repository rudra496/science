/* ================================================
   INTERACTIVE 3D SCIENCE LAB - COMPLETE WORKING VERSION
   For GitHub Pages - All Features Working
   Three.js r128 Compatible
   ================================================ */

// ==================== GLOBAL STATE ====================
var currentSection = 'home';
var currentScene = null;
var currentRenderer = null;
var currentCamera = null;
var currentControls = null;
var animationId = null;
var clock = null;
var isPlaying = true;

// ==================== COMPLETE ELEMENTS DATA (118 Elements) ====================
var elementsData = [
    { number: 1, symbol: 'H', name: 'Hydrogen', category: 'nonmetal', color: '#90CAF9', mass: 1.008, period: 1, group: 1 },
    { number: 2, symbol: 'He', name: 'Helium', category: 'noble-gas', color: '#E8F5E9', mass: 4.003, period: 1, group: 18 },
    { number: 3, symbol: 'Li', name: 'Lithium', category: 'alkali-metal', color: '#FF8A65', mass: 6.941, period: 2, group: 1 },
    { number: 4, symbol: 'Be', name: 'Beryllium', category: 'alkaline-earth', color: '#FFCC80', mass: 9.012, period: 2, group: 2 },
    { number: 5, symbol: 'B', name: 'Boron', category: 'metalloid', color: '#A1887F', mass: 10.81, period: 2, group: 13 },
    { number: 6, symbol: 'C', name: 'Carbon', category: 'nonmetal', color: '#616161', mass: 12.01, period: 2, group: 14 },
    { number: 7, symbol: 'N', name: 'Nitrogen', category: 'nonmetal', color: '#90CAF9', mass: 14.01, period: 2, group: 15 },
    { number: 8, symbol: 'O', name: 'Oxygen', category: 'nonmetal', color: '#EF5350', mass: 16.00, period: 2, group: 16 },
    { number: 9, symbol: 'F', name: 'Fluorine', category: 'halogen', color: '#A5D6A7', mass: 19.00, period: 2, group: 17 },
    { number: 10, symbol: 'Ne', name: 'Neon', category: 'noble-gas', color: '#F48FB1', mass: 20.18, period: 2, group: 18 },
    { number: 11, symbol: 'Na', name: 'Sodium', category: 'alkali-metal', color: '#FF8A65', mass: 22.99, period: 3, group: 1 },
    { number: 12, symbol: 'Mg', name: 'Magnesium', category: 'alkaline-earth', color: '#FFCC80', mass: 24.31, period: 3, group: 2 },
    { number: 13, symbol: 'Al', name: 'Aluminum', category: 'post-transition', color: '#B0BEC5', mass: 26.98, period: 3, group: 13 },
    { number: 14, symbol: 'Si', name: 'Silicon', category: 'metalloid', color: '#A1887F', mass: 28.09, period: 3, group: 14 },
    { number: 15, symbol: 'P', name: 'Phosphorus', category: 'nonmetal', color: '#FFD54F', mass: 30.97, period: 3, group: 15 },
    { number: 16, symbol: 'S', name: 'Sulfur', category: 'nonmetal', color: '#FFF176', mass: 32.07, period: 3, group: 16 },
    { number: 17, symbol: 'Cl', name: 'Chlorine', category: 'halogen', color: '#A5D6A7', mass: 35.45, period: 3, group: 17 },
    { number: 18, symbol: 'Ar', name: 'Argon', category: 'noble-gas', color: '#E0E0E0', mass: 39.95, period: 3, group: 18 },
    { number: 19, symbol: 'K', name: 'Potassium', category: 'alkali-metal', color: '#FF8A65', mass: 39.10, period: 4, group: 1 },
    { number: 20, symbol: 'Ca', name: 'Calcium', category: 'alkaline-earth', color: '#FFCC80', mass: 40.08, period: 4, group: 2 },
    { number: 21, symbol: 'Sc', name: 'Scandium', category: 'transition-metal', color: '#CE93D8', mass: 44.96, period: 4, group: 3 },
    { number: 22, symbol: 'Ti', name: 'Titanium', category: 'transition-metal', color: '#B0BEC5', mass: 47.87, period: 4, group: 4 },
    { number: 23, symbol: 'V', name: 'Vanadium', category: 'transition-metal', color: '#FF8A65', mass: 50.94, period: 4, group: 5 },
    { number: 24, symbol: 'Cr', name: 'Chromium', category: 'transition-metal', color: '#90A4AE', mass: 52.00, period: 4, group: 6 },
    { number: 25, symbol: 'Mn', name: 'Manganese', category: 'transition-metal', color: '#7E57C2', mass: 54.94, period: 4, group: 7 },
    { number: 26, symbol: 'Fe', name: 'Iron', category: 'transition-metal', color: '#9E9E9E', mass: 55.85, period: 4, group: 8 },
    { number: 27, symbol: 'Co', name: 'Cobalt', category: 'transition-metal', color: '#42A5F5', mass: 58.93, period: 4, group: 9 },
    { number: 28, symbol: 'Ni', name: 'Nickel', category: 'transition-metal', color: '#B0BEC5', mass: 58.69, period: 4, group: 10 },
    { number: 29, symbol: 'Cu', name: 'Copper', category: 'transition-metal', color: '#FF8A65', mass: 63.55, period: 4, group: 11 },
    { number: 30, symbol: 'Zn', name: 'Zinc', category: 'transition-metal', color: '#B0BEC5', mass: 65.38, period: 4, group: 12 },
    { number: 31, symbol: 'Ga', name: 'Gallium', category: 'post-transition', color: '#B0BEC5', mass: 69.72, period: 4, group: 13 },
    { number: 32, symbol: 'Ge', name: 'Germanium', category: 'metalloid', color: '#81C784', mass: 72.63, period: 4, group: 14 },
    { number: 33, symbol: 'As', name: 'Arsenic', category: 'metalloid', color: '#808080', mass: 74.92, period: 4, group: 15 },
    { number: 34, symbol: 'Se', name: 'Selenium', category: 'nonmetal', color: '#FFD54F', mass: 78.97, period: 4, group: 16 },
    { number: 35, symbol: 'Br', name: 'Bromine', category: 'halogen', color: '#8D6E63', mass: 79.90, period: 4, group: 17 },
    { number: 36, symbol: 'Kr', name: 'Krypton', category: 'noble-gas', color: '#CE93D8', mass: 83.80, period: 4, group: 18 },
    { number: 37, symbol: 'Rb', name: 'Rubidium', category: 'alkali-metal', color: '#FF8A65', mass: 85.47, period: 5, group: 1 },
    { number: 38, symbol: 'Sr', name: 'Strontium', category: 'alkaline-earth', color: '#FFCC80', mass: 87.62, period: 5, group: 2 },
    { number: 39, symbol: 'Y', name: 'Yttrium', category: 'transition-metal', color: '#4DD0E1', mass: 88.91, period: 5, group: 3 },
    { number: 40, symbol: 'Zr', name: 'Zirconium', category: 'transition-metal', color: '#B0BEC5', mass: 91.22, period: 5, group: 4 },
    { number: 41, symbol: 'Nb', name: 'Niobium', category: 'transition-metal', color: '#CE93D8', mass: 92.91, period: 5, group: 5 },
    { number: 42, symbol: 'Mo', name: 'Molybdenum', category: 'transition-metal', color: '#78909C', mass: 95.95, period: 5, group: 6 },
    { number: 43, symbol: 'Tc', name: 'Technetium', category: 'transition-metal', color: '#E0E0E0', mass: 98, period: 5, group: 7 },
    { number: 44, symbol: 'Ru', name: 'Ruthenium', category: 'transition-metal', color: '#B0BEC5', mass: 101.07, period: 5, group: 8 },
    { number: 45, symbol: 'Rh', name: 'Rhodium', category: 'transition-metal', color: '#E0E0E0', mass: 102.91, period: 5, group: 9 },
    { number: 46, symbol: 'Pd', name: 'Palladium', category: 'transition-metal', color: '#E0E0E0', mass: 106.42, period: 5, group: 10 },
    { number: 47, symbol: 'Ag', name: 'Silver', category: 'transition-metal', color: '#E0E0E0', mass: 107.87, period: 5, group: 11 },
    { number: 48, symbol: 'Cd', name: 'Cadmium', category: 'transition-metal', color: '#FFD54F', mass: 112.41, period: 5, group: 12 },
    { number: 49, symbol: 'In', name: 'Indium', category: 'post-transition', color: '#7986CB', mass: 114.82, period: 5, group: 13 },
    { number: 50, symbol: 'Sn', name: 'Tin', category: 'post-transition', color: '#B0BEC5', mass: 118.71, period: 5, group: 14 },
    { number: 51, symbol: 'Sb', name: 'Antimony', category: 'metalloid', color: '#B39DDB', mass: 121.76, period: 5, group: 15 },
    { number: 52, symbol: 'Te', name: 'Tellurium', category: 'metalloid', color: '#FFB74D', mass: 127.60, period: 5, group: 16 },
    { number: 53, symbol: 'I', name: 'Iodine', category: 'halogen', color: '#7E57C2', mass: 126.90, period: 5, group: 17 },
    { number: 54, symbol: 'Xe', name: 'Xenon', category: 'noble-gas', color: '#42A5F5', mass: 131.29, period: 5, group: 18 },
    { number: 55, symbol: 'Cs', name: 'Cesium', category: 'alkali-metal', color: '#FF8A65', mass: 132.91, period: 6, group: 1 },
    { number: 56, symbol: 'Ba', name: 'Barium', category: 'alkaline-earth', color: '#FFCC80', mass: 137.33, period: 6, group: 2 },
    { number: 57, symbol: 'La', name: 'Lanthanum', category: 'lanthanide', color: '#81C784', mass: 138.91, period: 6, group: 3 },
    { number: 58, symbol: 'Ce', name: 'Cerium', category: 'lanthanide', color: '#A5D6A7', mass: 140.12, period: 6, group: 3 },
    { number: 59, symbol: 'Pr', name: 'Praseodymium', category: 'lanthanide', color: '#C5E1A5', mass: 140.91, period: 6, group: 3 },
    { number: 60, symbol: 'Nd', name: 'Neodymium', category: 'lanthanide', color: '#DCEDC8', mass: 144.24, period: 6, group: 3 },
    { number: 61, symbol: 'Pm', name: 'Promethium', category: 'lanthanide', color: '#F48FB1', mass: 145, period: 6, group: 3 },
    { number: 62, symbol: 'Sm', name: 'Samarium', category: 'lanthanide', color: '#FFF59D', mass: 150.36, period: 6, group: 3 },
    { number: 63, symbol: 'Eu', name: 'Europium', category: 'lanthanide', color: '#FF8A65', mass: 151.96, period: 6, group: 3 },
    { number: 64, symbol: 'Gd', name: 'Gadolinium', category: 'lanthanide', color: '#FFCC80', mass: 157.25, period: 6, group: 3 },
    { number: 65, symbol: 'Tb', name: 'Terbium', category: 'lanthanide', color: '#80DEEA', mass: 158.93, period: 6, group: 3 },
    { number: 66, symbol: 'Dy', name: 'Dysprosium', category: 'lanthanide', color: '#B2FF59', mass: 162.50, period: 6, group: 3 },
    { number: 67, symbol: 'Ho', name: 'Holmium', category: 'lanthanide', color: '#69F0AE', mass: 164.93, period: 6, group: 3 },
    { number: 68, symbol: 'Er', name: 'Erbium', category: 'lanthanide', color: '#EA80FC', mass: 167.26, period: 6, group: 3 },
    { number: 69, symbol: 'Tm', name: 'Thulium', category: 'lanthanide', color: '#7C4DFF', mass: 168.93, period: 6, group: 3 },
    { number: 70, symbol: 'Yb', name: 'Ytterbium', category: 'lanthanide', color: '#448AFF', mass: 173.05, period: 6, group: 3 },
    { number: 71, symbol: 'Lu', name: 'Lutetium', category: 'lanthanide', color: '#18FFFF', mass: 174.97, period: 6, group: 3 },
    { number: 72, symbol: 'Hf', name: 'Hafnium', category: 'transition-metal', color: '#B0BEC5', mass: 178.49, period: 6, group: 4 },
    { number: 73, symbol: 'Ta', name: 'Tantalum', category: 'transition-metal', color: '#90A4AE', mass: 180.95, period: 6, group: 5 },
    { number: 74, symbol: 'W', name: 'Tungsten', category: 'transition-metal', color: '#78909C', mass: 183.84, period: 6, group: 6 },
    { number: 75, symbol: 'Re', name: 'Rhenium', category: 'transition-metal', color: '#B0BEC5', mass: 186.21, period: 6, group: 7 },
    { number: 76, symbol: 'Os', name: 'Osmium', category: 'transition-metal', color: '#455A64', mass: 190.23, period: 6, group: 8 },
    { number: 77, symbol: 'Ir', name: 'Iridium', category: 'transition-metal', color: '#CFD8DC', mass: 192.22, period: 6, group: 9 },
    { number: 78, symbol: 'Pt', name: 'Platinum', category: 'transition-metal', color: '#ECEFF1', mass: 195.08, period: 6, group: 10 },
    { number: 79, symbol: 'Au', name: 'Gold', category: 'transition-metal', color: '#FFD700', mass: 196.97, period: 6, group: 11 },
    { number: 80, symbol: 'Hg', name: 'Mercury', category: 'transition-metal', color: '#B0BEC5', mass: 200.59, period: 6, group: 12 },
    { number: 81, symbol: 'Tl', name: 'Thallium', category: 'post-transition', color: '#808080', mass: 204.38, period: 6, group: 13 },
    { number: 82, symbol: 'Pb', name: 'Lead', category: 'post-transition', color: '#616161', mass: 207.2, period: 6, group: 14 },
    { number: 83, symbol: 'Bi', name: 'Bismuth', category: 'post-transition', color: '#E040FB', mass: 208.98, period: 6, group: 15 },
    { number: 84, symbol: 'Po', name: 'Polonium', category: 'metalloid', color: '#CE93D8', mass: 209, period: 6, group: 16 },
    { number: 85, symbol: 'At', name: 'Astatine', category: 'halogen', color: '#000000', mass: 210, period: 6, group: 17 },
    { number: 86, symbol: 'Rn', name: 'Radon', category: 'noble-gas', color: '#FF5252', mass: 222, period: 6, group: 18 },
    { number: 87, symbol: 'Fr', name: 'Francium', category: 'alkali-metal', color: '#FF8A65', mass: 223, period: 7, group: 1 },
    { number: 88, symbol: 'Ra', name: 'Radium', category: 'alkaline-earth', color: '#C5E1A5', mass: 226, period: 7, group: 2 },
    { number: 89, symbol: 'Ac', name: 'Actinium', category: 'actinide', color: '#80CBC4', mass: 227, period: 7, group: 3 },
    { number: 90, symbol: 'Th', name: 'Thorium', category: 'actinide', color: '#FFCC80', mass: 232.04, period: 7, group: 3 },
    { number: 91, symbol: 'Pa', name: 'Protactinium', category: 'actinide', color: '#BCAAA4', mass: 231.04, period: 7, group: 3 },
    { number: 92, symbol: 'U', name: 'Uranium', category: 'actinide', color: '#81C784', mass: 238.03, period: 7, group: 3 },
    { number: 93, symbol: 'Np', name: 'Neptunium', category: 'actinide', color: '#4DD0E1', mass: 237, period: 7, group: 3 },
    { number: 94, symbol: 'Pu', name: 'Plutonium', category: 'actinide', color: '#CE93D8', mass: 244, period: 7, group: 3 },
    { number: 95, symbol: 'Am', name: 'Americium', category: 'actinide', color: '#90CAF9', mass: 243, period: 7, group: 3 },
    { number: 96, symbol: 'Cm', name: 'Curium', category: 'actinide', color: '#80DEEA', mass: 247, period: 7, group: 3 },
    { number: 97, symbol: 'Bk', name: 'Berkelium', category: 'actinide', color: '#B2FF59', mass: 247, period: 7, group: 3 },
    { number: 98, symbol: 'Cf', name: 'Californium', category: 'actinide', color: '#FF5722', mass: 251, period: 7, group: 3 },
    { number: 99, symbol: 'Es', name: 'Einsteinium', category: 'actinide', color: '#9C27B0', mass: 252, period: 7, group: 3 },
    { number: 100, symbol: 'Fm', name: 'Fermium', category: 'actinide', color: '#4CAF50', mass: 257, period: 7, group: 3 },
    { number: 101, symbol: 'Md', name: 'Mendelevium', category: 'actinide', color: '#E91E63', mass: 258, period: 7, group: 3 },
    { number: 102, symbol: 'No', name: 'Nobelium', category: 'actinide', color: '#2196F3', mass: 259, period: 7, group: 3 },
    { number: 103, symbol: 'Lr', name: 'Lawrencium', category: 'actinide', color: '#FF9800', mass: 266, period: 7, group: 3 },
    { number: 104, symbol: 'Rf', name: 'Rutherfordium', category: 'transition-metal', color: '#FFC107', mass: 267, period: 7, group: 4 },
    { number: 105, symbol: 'Db', name: 'Dubnium', category: 'transition-metal', color: '#00BCD4', mass: 268, period: 7, group: 5 },
    { number: 106, symbol: 'Sg', name: 'Seaborgium', category: 'transition-metal', color: '#673AB7', mass: 269, period: 7, group: 6 },
    { number: 107, symbol: 'Bh', name: 'Bohrium', category: 'transition-metal', color: '#9C27B0', mass: 270, period: 7, group: 7 },
    { number: 108, symbol: 'Hs', name: 'Hassium', category: 'transition-metal', color: '#795548', mass: 269, period: 7, group: 8 },
    { number: 109, symbol: 'Mt', name: 'Meitnerium', category: 'transition-metal', color: '#607D8B', mass: 278, period: 7, group: 9 },
    { number: 110, symbol: 'Ds', name: 'Darmstadtium', category: 'transition-metal', color: '#8BC34A', mass: 281, period: 7, group: 10 },
    { number: 111, symbol: 'Rg', name: 'Roentgenium', category: 'transition-metal', color: '#FF5722', mass: 282, period: 7, group: 11 },
    { number: 112, symbol: 'Cn', name: 'Copernicium', category: 'transition-metal', color: '#03A9F4', mass: 285, period: 7, group: 12 },
    { number: 113, symbol: 'Nh', name: 'Nihonium', category: 'post-transition', color: '#E91E63', mass: 286, period: 7, group: 13 },
    { number: 114, symbol: 'Fl', name: 'Flerovium', category: 'post-transition', color: '#9E9E9E', mass: 289, period: 7, group: 14 },
    { number: 115, symbol: 'Mc', name: 'Moscovium', category: 'post-transition', color: '#673AB7', mass: 290, period: 7, group: 15 },
    { number: 116, symbol: 'Lv', name: 'Livermorium', category: 'post-transition', color: '#4CAF50', mass: 293, period: 7, group: 16 },
    { number: 117, symbol: 'Ts', name: 'Tennessine', category: 'halogen', color: '#FF9800', mass: 294, period: 7, group: 17 },
    { number: 118, symbol: 'Og', name: 'Oganesson', category: 'noble-gas', color: '#F44336', mass: 294, period: 7, group: 18 }
];

// ==================== SOLAR SYSTEM DATA ====================
var solarSystemData = {
    sun: { name: 'Sun', color: '#FDB813', size: 3 },
    planets: [
        { name: 'Mercury', color: '#B5B5B5', size: 0.38, distance: 5, speed: 0.048, moons: 0, info: 'Smallest planet, closest to Sun' },
        { name: 'Venus', color: '#E6C87A', size: 0.95, distance: 7, speed: 0.035, moons: 0, info: 'Hottest planet, toxic atmosphere' },
        { name: 'Earth', color: '#6B93D6', size: 1.0, distance: 9, speed: 0.030, moons: 1, info: 'Our home, only known planet with life' },
        { name: 'Mars', color: '#C1440E', size: 0.53, distance: 11, speed: 0.024, moons: 2, info: 'Red planet, potential for human colonization' },
        { name: 'Jupiter', color: '#D8CA9D', size: 2.5, distance: 15, speed: 0.013, moons: 95, info: 'Largest planet, Great Red Spot storm' },
        { name: 'Saturn', color: '#F4D59E', size: 2.1, distance: 19, speed: 0.009, moons: 146, rings: true, info: 'Famous rings, could float on water' },
        { name: 'Uranus', color: '#D1E7E7', size: 1.6, distance: 23, speed: 0.006, moons: 27, info: 'Rotates on its side, coldest atmosphere' },
        { name: 'Neptune', color: '#5B5DDF', size: 1.5, distance: 27, speed: 0.005, moons: 16, info: 'Strongest winds, discovered mathematically' }
    ]
};

// ==================== UTILITY FUNCTIONS ====================
function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() { 
        if (toast.parentNode) toast.parentNode.removeChild(toast); 
    }, 4000);
}

function showLoading(show) {
    var el = document.getElementById('loadingOverlay');
    if (el) el.style.display = show ? 'flex' : 'none';
}

function openModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('open');
}

function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('open');
}

function closeInfoPanel(type) {
    var el = document.getElementById(type + '-info-panel');
    if (el) el.style.display = 'none';
}

// ==================== NAVIGATION ====================
function navigateTo(section) {
    cleanupScene();
    
    var sections = document.querySelectorAll('.section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove('active');
    }
    
    var target = document.getElementById(section);
    if (target) target.classList.add('active');
    
    var navBtns = document.querySelectorAll('.nav-btn, .mobile-nav-btn');
    for (var j = 0; j < navBtns.length; j++) {
        var btn = navBtns[j];
        if (btn.dataset.section === section) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
    
    closeMobileMenu();
    currentSection = section;
    
    if (section !== 'home') {
        showLoading(true);
        setTimeout(function() {
            initScene(section);
            showLoading(false);
        }, 200);
    }
}

function toggleMobileMenu() {
    var menu = document.getElementById('mobileMenu');
    var overlay = document.getElementById('mobileOverlay');
    var toggle = document.getElementById('menuToggle');
    if (menu) menu.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
    if (toggle) toggle.classList.toggle('active');
}

function closeMobileMenu() {
    var menu = document.getElementById('mobileMenu');
    var overlay = document.getElementById('mobileOverlay');
    var toggle = document.getElementById('menuToggle');
    if (menu) menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (toggle) toggle.classList.remove('active');
}

// ==================== SCENE MANAGEMENT ====================
function cleanupScene() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (currentRenderer) {
        currentRenderer.dispose();
        currentRenderer = null;
    }
    if (currentControls) {
        currentControls.dispose();
        currentControls = null;
    }
    currentScene = null;
    currentCamera = null;
    
    var containers = ['periodic-table-canvas', 'solar-system-canvas', 'dna-rna-canvas', 
                      'biology-canvas', 'physics-canvas', 'robotics-canvas', 'games-canvas'];
    for (var i = 0; i < containers.length; i++) {
        var el = document.getElementById(containers[i]);
        if (el) el.innerHTML = '';
    }
}

function createScene(containerId, bgColor) {
    bgColor = bgColor || 0x020617;
    var container = document.getElementById(containerId);
    if (!container) return null;
    
    var width = container.clientWidth;
    var height = container.clientHeight;
    
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    
    var camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 10, 30);
    
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 3;
    controls.maxDistance = 300;
    
    currentScene = scene;
    currentRenderer = renderer;
    currentCamera = camera;
    currentControls = controls;
    clock = new THREE.Clock();
    
    // Handle resize
    function onResize() {
        if (currentCamera && currentRenderer && container) {
            var w = container.clientWidth;
            var h = container.clientHeight;
            currentCamera.aspect = w / h;
            currentCamera.updateProjectionMatrix();
            currentRenderer.setSize(w, h);
        }
    }
    window.removeEventListener('resize', onResize);
    window.addEventListener('resize', onResize);
    
    return { scene: scene, camera: camera, renderer: renderer, controls: controls };
}

function addStars(scene, count) {
    count = count || 2000;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    
    for (var i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 500;
        positions[i + 1] = (Math.random() - 0.5) * 500;
        positions[i + 2] = (Math.random() - 0.5) * 500;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    var material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.8,
        transparent: true,
        opacity: 0.8
    });
    
    scene.add(new THREE.Points(geometry, material));
}

function initScene(section) {
    isPlaying = true;
    switch(section) {
        case 'periodic-table': initPeriodicTable(); break;
        case 'solar-system': initSolarSystem(); break;
        case 'dna-rna': initDNARNA(); break;
        case 'biology': initBiology(); break;
        case 'physics': initPhysics(); break;
        case 'robotics': initRobotics(); break;
        case 'games': initGame(); break;
    }
}

// ==================== PERIODIC TABLE ====================
function initPeriodicTable() {
    var setup = createScene('periodic-table-canvas');
    if (!setup) return;
    
    var scene = setup.scene;
    var camera = setup.camera;
    var renderer = setup.renderer;
    var controls = setup.controls;
    
    camera.position.set(0, 10, 35);
    controls.target.set(0, 0, 0);
    
    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    var light = new THREE.PointLight(0xffffff, 1);
    light.position.set(30, 30, 30);
    scene.add(light);
    
    addStars(scene, 3000);
    
    var elementGroup = new THREE.Group();
    var rotationSpeed = 0.5;
    
    // Create ALL 118 elements
    for (var i = 0; i < elementsData.length; i++) {
        var el = elementsData[i];
        var pos = getElementPosition(el);
        var tile = createElementTile(el);
        tile.position.set(pos.x, pos.y, pos.z);
        tile.userData = { element: el, baseY: pos.y, index: i };
        elementGroup.add(tile);
    }
    
    scene.add(elementGroup);
    
    // Control handlers
    var speedInput = document.getElementById('ptRotationSpeed');
    if (speedInput) {
        speedInput.oninput = function(e) {
            rotationSpeed = parseFloat(e.target.value);
        };
    }
    
    // Category filter
    var catBtns = document.querySelectorAll('.category-btn');
    for (var c = 0; c < catBtns.length; c++) {
        catBtns[c].onclick = function(e) {
            for (var k = 0; k < catBtns.length; k++) {
                catBtns[k].classList.remove('active');
            }
            e.target.classList.add('active');
            var cat = e.target.dataset.category;
            filterElements(cat, elementGroup);
        };
    }
    
    // Search
    var searchInput = document.getElementById('elementSearch');
    if (searchInput) {
        searchInput.oninput = function(e) {
            searchElements(e.target.value, elementGroup);
        };
    }
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        var time = clock.getElapsedTime();
        
        for (var i = 0; i < elementGroup.children.length; i++) {
            var tile = elementGroup.children[i];
            if (tile.userData && tile.userData.baseY !== undefined) {
                tile.position.y = tile.userData.baseY + Math.sin(time * 2 + tile.userData.index * 0.05) * 0.08;
            }
            tile.rotation.y = Math.sin(time * rotationSpeed + i * 0.02) * 0.08;
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('118 Elements displayed! Drag to rotate, scroll to zoom', 'info');
}

function getElementPosition(el) {
    var group = el.group;
    var period = el.period;
    
    if (el.category === 'lanthanide') {
        group = el.number - 54;
        period = 9;
    } else if (el.category === 'actinide') {
        group = el.number - 86;
        period = 10;
    }
    
    if (!group || group < 1) group = 3;
    
    return {
        x: (group - 9) * 1.3,
        y: -(period - 5) * 1.3,
        z: (el.category === 'lanthanide' || el.category === 'actinide') ? -3.5 : 0
    };
}

function createElementTile(element) {
    var group = new THREE.Group();
    
    var geometry = new THREE.BoxGeometry(1.1, 1.1, 0.12);
    var material = new THREE.MeshStandardMaterial({
        color: element.color,
        metalness: 0.3,
        roughness: 0.4,
        emissive: element.color,
        emissiveIntensity: 0.15
    });
    var tile = new THREE.Mesh(geometry, material);
    group.add(tile);
    
    // Add border
    var borderGeo = new THREE.BoxGeometry(1.15, 1.15, 0.08);
    var borderMat = new THREE.MeshBasicMaterial({
        color: element.color,
        transparent: true,
        opacity: 0.3
    });
    var border = new THREE.Mesh(borderGeo, borderMat);
    border.position.z = -0.03;
    group.add(border);
    
    return group;
}

function filterElements(category, group) {
    for (var i = 0; i < group.children.length; i++) {
        var tile = group.children[i];
        var el = tile.userData.element;
        if (category === 'all' || el.category === category) {
            tile.visible = true;
            if (tile.children[0]) {
                tile.children[0].material.opacity = 1;
            }
        } else {
            tile.visible = true;
            if (tile.children[0]) {
                tile.children[0].material.opacity = 0.15;
            }
        }
    }
}

function searchElements(query, group) {
    var q = query.toLowerCase();
    for (var i = 0; i < group.children.length; i++) {
        var tile = group.children[i];
        var el = tile.userData.element;
        var match = el.name.toLowerCase().indexOf(q) !== -1 || 
                    el.symbol.toLowerCase().indexOf(q) !== -1 ||
                    el.number.toString().indexOf(q) !== -1;
        tile.visible = match || q === '';
    }
}

// ==================== SOLAR SYSTEM ====================
function initSolarSystem() {
    var setup = createScene('solar-system-canvas', 0x000008);
    if (!setup) return;
    
    var scene = setup.scene;
    var camera = setup.camera;
    var renderer = setup.renderer;
    var controls = setup.controls;
    
    camera.position.set(0, 35, 55);
    controls.target.set(0, 0, 0);
    
    addStars(scene, 5000);
    scene.add(new THREE.AmbientLight(0x404040, 0.4));
    
    // Sun
    var sunGroup = new THREE.Group();
    var sunGeo = new THREE.SphereGeometry(2.5, 64, 64);
    var sunMat = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
    var sun = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sun);
    
    // Sun glow layers
    for (var g = 0; g < 3; g++) {
        var glowGeo = new THREE.SphereGeometry(3 + g * 0.5, 32, 32);
        var glowMat = new THREE.MeshBasicMaterial({ 
            color: 0xFFA500, 
            transparent: true, 
            opacity: 0.2 - g * 0.05 
        });
        sunGroup.add(new THREE.Mesh(glowGeo, glowMat));
    }
    
    // Sun light
    var sunLight = new THREE.PointLight(0xFFF5E0, 2, 200);
    sunGroup.add(sunLight);
    scene.add(sunGroup);
    
    var planetMeshes = [];
    var orbitSpeed = 1;
    var planetScale = 1;
    
    // Create planets
    for (var p = 0; p < solarSystemData.planets.length; p++) {
        var planet = solarSystemData.planets[p];
        
        var geo = new THREE.SphereGeometry(planet.size * planetScale, 32, 32);
        var mat = new THREE.MeshStandardMaterial({ 
            color: planet.color, 
            roughness: 0.7,
            metalness: 0.1
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { 
            name: planet.name,
            info: planet.info,
            size: planet.size, 
            distance: planet.distance, 
            speed: planet.speed, 
            angle: Math.random() * Math.PI * 2,
            hasRings: planet.rings
        };
        scene.add(mesh);
        planetMeshes.push(mesh);
        
        // Orbit path
        var orbitGeo = new THREE.RingGeometry(planet.distance - 0.08, planet.distance + 0.08, 128);
        var orbitMat = new THREE.MeshBasicMaterial({ 
            color: 0x666666, 
            side: THREE.DoubleSide, 
            transparent: true, 
            opacity: 0.25 
        });
        var orbit = new THREE.Mesh(orbitGeo, orbitMat);
        orbit.rotation.x = Math.PI / 2;
        scene.add(orbit);
        
        // Saturn's rings
        if (planet.rings) {
            var ringGeo = new THREE.RingGeometry(planet.size * 1.5, planet.size * 2.5, 64);
            var ringMat = new THREE.MeshBasicMaterial({ 
                color: 0xC4A35A, 
                side: THREE.DoubleSide, 
                transparent: true, 
                opacity: 0.7 
            });
            var ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2.3;
            mesh.add(ring);
        }
    }
    
    // Controls
    var orbitSpeedInput = document.getElementById('orbitSpeed');
    if (orbitSpeedInput) {
        orbitSpeedInput.oninput = function(e) {
            orbitSpeed = parseFloat(e.target.value);
        };
    }
    
    var scaleInput = document.getElementById('planetScale');
    if (scaleInput) {
        scaleInput.oninput = function(e) {
            planetScale = parseFloat(e.target.value);
            for (var i = 0; i < planetMeshes.length; i++) {
                planetMeshes[i].scale.setScalar(planetScale);
            }
        };
    }
    
    var playBtn = document.getElementById('ssPlayPause');
    if (playBtn) {
        playBtn.onclick = function(e) {
            isPlaying = !isPlaying;
            e.target.innerHTML = isPlaying ? '<span class="ctrl-icon">⏸️</span> Pause' : '<span class="ctrl-icon">▶️</span> Play';
        };
    }
    
    var resetBtn = document.getElementById('ssReset');
    if (resetBtn) {
        resetBtn.onclick = function() {
            camera.position.set(0, 35, 55);
            controls.target.set(0, 0, 0);
            orbitSpeed = 1;
            if (orbitSpeedInput) orbitSpeedInput.value = 1;
        };
    }
    
    // Planet selector buttons
    var selectorContainer = document.getElementById('planetSelector');
    if (selectorContainer) {
        selectorContainer.innerHTML = '';
        for (var s = 0; s < solarSystemData.planets.length; s++) {
            var btn = document.createElement('button');
            btn.className = 'planet-btn';
            btn.style.backgroundColor = solarSystemData.planets[s].color;
            btn.title = solarSystemData.planets[s].name;
            btn.dataset.index = s;
            btn.onclick = function(e) {
                var idx = parseInt(e.target.dataset.index);
                var planet = planetMeshes[idx];
                camera.position.set(
                    planet.position.x + 5,
                    planet.position.y + 5,
                    planet.position.z + 10
                );
                controls.target.copy(planet.position);
            };
            selectorContainer.appendChild(btn);
        }
    }
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        if (isPlaying) {
            sun.rotation.y += 0.003;
            
            for (var i = 0; i < planetMeshes.length; i++) {
                var mesh = planetMeshes[i];
                mesh.userData.angle += mesh.userData.speed * orbitSpeed * 0.01;
                mesh.position.x = Math.cos(mesh.userData.angle) * mesh.userData.distance;
                mesh.position.z = Math.sin(mesh.userData.angle) * mesh.userData.distance;
                mesh.rotation.y += 0.01;
            }
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('8 Planets orbiting! Drag to rotate, use planet buttons to focus', 'info');
}

// ==================== DNA/RNA ====================
function initDNARNA() {
    var setup = createScene('dna-rna-canvas');
    if (!setup) return;
    
    var scene = setup.scene;
    var camera = setup.camera;
    var renderer = setup.renderer;
    var controls = setup.controls;
    
    camera.position.set(0, 0, 22);
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    var light = new THREE.PointLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
    
    addStars(scene, 1000);
    
    var rotationSpeed = 1;
    var helixTurns = 2;
    var currentMode = 'dna';
    
    var dnaGroup = new THREE.Group();
    scene.add(dnaGroup);
    
    function createHelix() {
        // Clear previous
        while (dnaGroup.children.length > 0) {
            dnaGroup.remove(dnaGroup.children[0]);
        }
        
        var basePairs = 30 * helixTurns;
        var height = 16 * helixTurns;
        var radius = 2;
        
        var colors = { A: 0xff6b6b, T: 0x4ecdc4, G: 0x45b7d1, C: 0xffa726 };
        var bases = ['A', 'T', 'G', 'C'];
        
        for (var i = 0; i < basePairs; i++) {
            var t = i / basePairs;
            var angle = t * Math.PI * 4 * helixTurns;
            var y = (t - 0.5) * height;
            
            var x1 = Math.cos(angle) * radius;
            var z1 = Math.sin(angle) * radius;
            var x2 = Math.cos(angle + Math.PI) * radius;
            var z2 = Math.sin(angle + Math.PI) * radius;
            
            var sphereGeo = new THREE.SphereGeometry(0.22, 12, 12);
            var base1Idx = Math.floor(Math.random() * 4);
            var base1 = bases[base1Idx];
            var base2 = base1 === 'A' ? 'T' : base1 === 'T' ? 'A' : base1 === 'G' ? 'C' : 'G';
            
            var mat1 = new THREE.MeshStandardMaterial({ 
                color: colors[base1], 
                emissive: colors[base1], 
                emissiveIntensity: 0.3 
            });
            var mat2 = new THREE.MeshStandardMaterial({ 
                color: colors[base2], 
                emissive: colors[base2], 
                emissiveIntensity: 0.3 
            });
            
            // Strand 1 nucleotide
            var s1 = new THREE.Mesh(sphereGeo, mat1);
            s1.position.set(x1, y, z1);
            dnaGroup.add(s1);
            
            // Strand 2 nucleotide (or single strand for RNA)
            if (currentMode !== 'rna') {
                var s2 = new THREE.Mesh(sphereGeo, mat2);
                s2.position.set(x2, y, z2);
                dnaGroup.add(s2);
                
                // Base pair connector
                var connGeo = new THREE.CylinderGeometry(0.025, 0.025, radius * 2, 6);
                var connMat = new THREE.MeshBasicMaterial({ 
                    color: 0xffffff, 
                    transparent: true, 
                    opacity: 0.35 
                });
                var conn = new THREE.Mesh(connGeo, connMat);
                conn.position.set(0, y, 0);
                conn.rotation.z = Math.PI / 2;
                conn.rotation.y = angle;
                dnaGroup.add(conn);
            }
        }
        
        // Backbone curves
        var curve1 = new THREE.CatmullRomCurve3(
            Array.from({ length: 100 }, function(_, i) {
                var tt = i / 99;
                var ang = tt * Math.PI * 4 * helixTurns;
                var yy = (tt - 0.5) * height;
                return new THREE.Vector3(Math.cos(ang) * radius, yy, Math.sin(ang) * radius);
            })
        );
        var tubeGeo1 = new THREE.TubeGeometry(curve1, 200, 0.06, 8, false);
        var tubeMat = new THREE.MeshStandardMaterial({ 
            color: 0x9b59b6, 
            transparent: true, 
            opacity: 0.5 
        });
        dnaGroup.add(new THREE.Mesh(tubeGeo1, tubeMat));
        
        // Second backbone for DNA
        if (currentMode !== 'rna') {
            var curve2 = new THREE.CatmullRomCurve3(
                Array.from({ length: 100 }, function(_, i) {
                    var tt = i / 99;
                    var ang = tt * Math.PI * 4 * helixTurns + Math.PI;
                    var yy = (tt - 0.5) * height;
                    return new THREE.Vector3(Math.cos(ang) * radius, yy, Math.sin(ang) * radius);
                })
            );
            var tubeGeo2 = new THREE.TubeGeometry(curve2, 200, 0.06, 8, false);
            dnaGroup.add(new THREE.Mesh(tubeGeo2, tubeMat));
        }
    }
    
    createHelix();
    
    // Controls
    var speedInput = document.getElementById('dnaSpeed');
    if (speedInput) {
        speedInput.oninput = function(e) {
            rotationSpeed = parseFloat(e.target.value);
        };
    }
    
    var turnsInput = document.getElementById('dnaTurns');
    if (turnsInput) {
        turnsInput.oninput = function(e) {
            helixTurns = parseInt(e.target.value);
            createHelix();
        };
    }
    
    // Mode buttons
    var modeBtns = document.querySelectorAll('#dna-rna-controls .tab-btn[data-mode]');
    for (var m = 0; m < modeBtns.length; m++) {
        modeBtns[m].onclick = function(e) {
            for (var k = 0; k < modeBtns.length; k++) {
                modeBtns[k].classList.remove('active');
            }
            e.target.classList.add('active');
            currentMode = e.target.dataset.mode;
            createHelix();
        };
    }
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        dnaGroup.rotation.y += 0.006 * rotationSpeed;
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('DNA Double Helix! Switch between DNA/RNA modes', 'info');
}

// ==================== BIOLOGY ====================
function initBiology() {
    var setup = createScene('biology-canvas');
    if (!setup) return;
    
    var scene = setup.scene;
    var camera = setup.camera;
    var renderer = setup.renderer;
    var controls = setup.controls;
    
    camera.position.set(0, 0, 14);
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    var light = new THREE.PointLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
    
    addStars(scene, 500);
    
    var rotationSpeed = 0.5;
    var currentCell = 'animal';
    
    var cellGroup = new THREE.Group();
    scene.add(cellGroup);
    
    function createAnimalCell() {
        while (cellGroup.children.length > 0) {
            cellGroup.remove(cellGroup.children[0]);
        }
        
        // Cell membrane (transparent outer shell)
        var membraneGeo = new THREE.SphereGeometry(4, 48, 48);
        var membraneMat = new THREE.MeshStandardMaterial({ 
            color: 0x7CB342, 
            transparent: true, 
            opacity: 0.25, 
            side: THREE.DoubleSide 
        });
        cellGroup.add(new THREE.Mesh(membraneGeo, membraneMat));
        
        // Nucleus (center)
        var nucleusGeo = new THREE.SphereGeometry(1.3, 32, 32);
        var nucleusMat = new THREE.MeshStandardMaterial({ 
            color: 0x5C6BC0, 
            emissive: 0x3949AB, 
            emissiveIntensity: 0.2 
        });
        cellGroup.add(new THREE.Mesh(nucleusGeo, nucleusMat));
        
        // Nucleolus
        var nucleolusGeo = new THREE.SphereGeometry(0.4, 16, 16);
        var nucleolusMat = new THREE.MeshStandardMaterial({ color: 0x7E57C2 });
        var nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
        nucleolus.position.set(0.5, 0.3, 0.3);
        cellGroup.add(nucleolus);
        
        // Mitochondria (rod-shaped using cylinder)
        for (var i = 0; i < 8; i++) {
            var mitoGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.7, 12);
            var mitoMat = new THREE.MeshStandardMaterial({ 
                color: 0xFF7043, 
                emissive: 0xFF5722, 
                emissiveIntensity: 0.15 
            });
            var mito = new THREE.Mesh(mitoGeo, mitoMat);
            mito.position.set(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            );
            mito.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            cellGroup.add(mito);
        }
        
        // Endoplasmic Reticulum (curved tube)
        var erPoints = [];
        for (var e = 0; e < 50; e++) {
            var angle = e * 0.25;
            var r = 2.5 + Math.sin(e * 0.4) * 0.4;
            erPoints.push(new THREE.Vector3(
                Math.cos(angle) * r,
                (e - 25) * 0.12,
                Math.sin(angle) * r
            ));
        }
        var erCurve = new THREE.CatmullRomCurve3(erPoints);
        var erGeo = new THREE.TubeGeometry(erCurve, 80, 0.1, 8, false);
        var erMat = new THREE.MeshStandardMaterial({ 
            color: 0x42A5F5, 
            transparent: true, 
            opacity: 0.6 
        });
        cellGroup.add(new THREE.Mesh(erGeo, erMat));
        
        // Golgi Apparatus (stacked disks)
        for (var g = 0; g < 5; g++) {
            var golgiGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16);
            var golgiMat = new THREE.MeshStandardMaterial({ 
                color: 0xAB47BC, 
                transparent: true, 
                opacity: 0.7 
            });
            var golgi = new THREE.Mesh(golgiGeo, golgiMat);
            golgi.position.set(2.5, 0.2 * g - 0.4, 0.5);
            golgi.rotation.x = Math.PI / 2;
            cellGroup.add(golgi);
        }
        
        // Ribosomes (small spheres)
        for (var r = 0; r < 40; r++) {
            var riboGeo = new THREE.SphereGeometry(0.06, 6, 6);
            var riboMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
            var ribo = new THREE.Mesh(riboGeo, riboMat);
            ribo.position.set(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6
            );
            cellGroup.add(ribo);
        }
        
        // Lysosomes
        for (var l = 0; l < 5; l++) {
            var lysoGeo = new THREE.SphereGeometry(0.2, 12, 12);
            var lysoMat = new THREE.MeshStandardMaterial({ color: 0x66BB6A });
            var lyso = new THREE.Mesh(lysoGeo, lysoMat);
            lyso.position.set(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            );
            cellGroup.add(lyso);
        }
    }
    
    function createPlantCell() {
        while (cellGroup.children.length > 0) {
            cellGroup.remove(cellGroup.children[0]);
        }
        
        // Cell wall (box)
        var wallGeo = new THREE.BoxGeometry(9, 9, 9);
        var wallMat = new THREE.MeshStandardMaterial({ 
            color: 0x8D6E63, 
            transparent: true, 
            opacity: 0.2, 
            side: THREE.DoubleSide 
        });
        cellGroup.add(new THREE.Mesh(wallGeo, wallMat));
        
        // Cell membrane
        var membraneGeo = new THREE.SphereGeometry(4, 48, 48);
        var membraneMat = new THREE.MeshStandardMaterial({ 
            color: 0x7CB342, 
            transparent: true, 
            opacity: 0.2 
        });
        cellGroup.add(new THREE.Mesh(membraneGeo, membraneMat));
        
        // Central Vacuole (large)
        var vacuoleGeo = new THREE.SphereGeometry(2.5, 32, 32);
        var vacuoleMat = new THREE.MeshStandardMaterial({ 
            color: 0x81D4FA, 
            transparent: true, 
            opacity: 0.4 
        });
        cellGroup.add(new THREE.Mesh(vacuoleGeo, vacuoleMat));
        
        // Nucleus (pushed to side)
        var nucleusGeo = new THREE.SphereGeometry(1, 32, 32);
        var nucleusMat = new THREE.MeshStandardMaterial({ 
            color: 0x5C6BC0,
            emissive: 0x3949AB,
            emissiveIntensity: 0.15
        });
        var nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
        nucleus.position.set(-2.5, 0, 0);
        cellGroup.add(nucleus);
        
        // Chloroplasts
        for (var c = 0; c < 10; c++) {
            var chloroGeo = new THREE.SphereGeometry(0.35, 12, 12);
            chloroGeo.scale(1.6, 1, 1);
            var chloroMat = new THREE.MeshStandardMaterial({ 
                color: 0x4CAF50, 
                emissive: 0x2E7D32, 
                emissiveIntensity: 0.2 
            });
            var chloro = new THREE.Mesh(chloroGeo, chloroMat);
            chloro.position.set(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6
            );
            chloro.rotation.y = Math.random() * Math.PI;
            cellGroup.add(chloro);
        }
    }
    
    function createBacteria() {
        while (cellGroup.children.length > 0) {
            cellGroup.remove(cellGroup.children[0]);
        }
        
        var types = [
            { name: 'Coccus', shape: 'sphere', color: 0xE53935 },
            { name: 'Bacillus', shape: 'rod', color: 0x43A047 },
            { name: 'Spirillum', shape: 'spiral', color: 0x1E88E5 }
        ];
        
        for (var t = 0; t < types.length; t++) {
            var type = types[t];
            
            for (var i = 0; i < 4; i++) {
                var mesh;
                
                if (type.shape === 'sphere') {
                    var geo = new THREE.SphereGeometry(0.5, 24, 24);
                    var mat = new THREE.MeshStandardMaterial({ 
                        color: type.color, 
                        emissive: type.color, 
                        emissiveIntensity: 0.15 
                    });
                    mesh = new THREE.Mesh(geo, mat);
                } else if (type.shape === 'rod') {
                    var geo = new THREE.CylinderGeometry(0.3, 0.3, 1, 12);
                    var mat = new THREE.MeshStandardMaterial({ 
                        color: type.color, 
                        emissive: type.color, 
                        emissiveIntensity: 0.15 
                    });
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.rotation.z = Math.PI / 2;
                } else {
                    // Spiral using tube
                    var spiralPoints = [];
                    for (var s = 0; s < 30; s++) {
                        var ang = s * 0.4;
                        spiralPoints.push(new THREE.Vector3(
                            Math.cos(ang) * 0.3,
                            s * 0.06 - 0.9,
                            Math.sin(ang) * 0.3
                        ));
                    }
                    var curve = new THREE.CatmullRomCurve3(spiralPoints);
                    var geo = new THREE.TubeGeometry(curve, 50, 0.15, 8, false);
                    var mat = new THREE.MeshStandardMaterial({ 
                        color: type.color, 
                        emissive: type.color, 
                        emissiveIntensity: 0.15 
                    });
                    mesh = new THREE.Mesh(geo, mat);
                }
                
                mesh.position.set((t - 1) * 3.5, (i - 1.5) * 1.8, 0);
                cellGroup.add(mesh);
                
                // Add label
                if (i === 0) {
                    // Types are labeled visually by position
                }
            }
        }
    }
    
    function createVirus() {
        while (cellGroup.children.length > 0) {
            cellGroup.remove(cellGroup.children[0]);
        }
        
        // Main body
        var bodyGeo = new THREE.SphereGeometry(2, 32, 32);
        var bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xE53935, 
            emissive: 0xE53935, 
            emissiveIntensity: 0.15,
            transparent: true,
            opacity: 0.85
        });
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        cellGroup.add(body);
        
        // Spike proteins
        for (var i = 0; i < 60; i++) {
            var spikeGeo = new THREE.ConeGeometry(0.08, 0.5, 6);
            var spikeMat = new THREE.MeshStandardMaterial({ color: 0xE53935 });
            var spike = new THREE.Mesh(spikeGeo, spikeMat);
            
            var phi = Math.acos(2 * Math.random() - 1);
            var theta = Math.random() * Math.PI * 2;
            
            spike.position.set(
                Math.sin(phi) * Math.cos(theta) * 2.3,
                Math.sin(phi) * Math.sin(theta) * 2.3,
                Math.cos(phi) * 2.3
            );
            spike.lookAt(0, 0, 0);
            spike.rotateX(Math.PI);
            cellGroup.add(spike);
        }
        
        // Inner RNA
        var rnaGeo = new THREE.SphereGeometry(0.8, 16, 16);
        var rnaMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        cellGroup.add(new THREE.Mesh(rnaGeo, rnaMat));
    }
    
    // Initial cell
    createAnimalCell();
    
    // Speed control
    var speedInput = document.getElementById('bioSpeed');
    if (speedInput) {
        speedInput.oninput = function(e) {
            rotationSpeed = parseFloat(e.target.value);
        };
    }
    
    // Cell type buttons
    var cellBtns = document.querySelectorAll('#biology-controls .tab-btn[data-cell]');
    for (var b = 0; b < cellBtns.length; b++) {
        cellBtns[b].onclick = function(e) {
            for (var k = 0; k < cellBtns.length; k++) {
                cellBtns[k].classList.remove('active');
            }
            e.target.classList.add('active');
            currentCell = e.target.dataset.cell;
            
            switch(currentCell) {
                case 'animal': createAnimalCell(); break;
                case 'plant': createPlantCell(); break;
                case 'bacteria': createBacteria(); break;
                case 'virus': createVirus(); break;
            }
        };
    }
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        cellGroup.rotation.y += 0.004 * rotationSpeed;
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('Cell Biology! Switch between Animal, Plant, Bacteria, Virus', 'info');
}

// ==================== PHYSICS ====================
function initPhysics() {
    var setup = createScene('physics-canvas');
    if (!setup) return;
    
    var scene = setup.scene;
    var camera = setup.camera;
    var renderer = setup.renderer;
    var controls = setup.controls;
    
    camera.position.set(0, 8, 25);
    controls.target.set(0, 0, 0);
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    scene.add(new THREE.PointLight(0xffffff, 0.8, 100));
    
    // Grid
    var grid = new THREE.GridHelper(40, 40, 0x444444, 0x222222);
    grid.position.y = -5;
    scene.add(grid);
    
    var simSpeed = 1;
    var currentExp = 'pendulum';
    var time = 0;
    
    var expGroup = new THREE.Group();
    scene.add(expGroup);
    
    // Pendulum variables
    var pendulumAngle = Math.PI / 4;
    var pendulumLength = 6;
    var pendulumBob = null;
    var pendulumString = null;
    var gravity = 9.8;
    
    // Wave variables
    var wavePoints = [];
    var waveAmplitude = 2;
    var waveFrequency = 3;
    var waveWavelength = 2;
    
    // Double slit particles
    var dsParticles = [];
    
    function createPendulum() {
        while (expGroup.children.length > 0) {
            expGroup.remove(expGroup.children[0]);
        }
        dsParticles = [];
        wavePoints = [];
        
        // Pivot point
        var pivotGeo = new THREE.SphereGeometry(0.3, 16, 16);
        var pivotMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        var pivot = new THREE.Mesh(pivotGeo, pivotMat);
        pivot.position.y = 5;
        expGroup.add(pivot);
        
        // String
        var stringGeo = new THREE.CylinderGeometry(0.02, 0.02, pendulumLength, 8);
        var stringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        pendulumString = new THREE.Mesh(stringGeo, stringMat);
        pendulumString.position.y = 5 - pendulumLength / 2;
        expGroup.add(pendulumString);
        
        // Bob (weight)
        var bobGeo = new THREE.SphereGeometry(0.6, 32, 32);
        var bobMat = new THREE.MeshStandardMaterial({ 
            color: 0xff6b6b, 
            emissive: 0xff6b6b, 
            emissiveIntensity: 0.2 
        });
        pendulumBob = new THREE.Mesh(bobGeo, bobMat);
        pendulumBob.position.y = 5 - pendulumLength;
        expGroup.add(pendulumBob);
        
        // Reference line
        var refGeo = new THREE.PlaneGeometry(0.02, 10);
        var refMat = new THREE.MeshBasicMaterial({ 
            color: 0x444444, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide 
        });
        var ref = new THREE.Mesh(refGeo, refMat);
        ref.position.y = 0;
        ref.rotation.y = Math.PI / 2;
        expGroup.add(ref);
        
        pendulumAngle = Math.PI / 4;
    }
    
    function createWave() {
        while (expGroup.children.length > 0) {
            expGroup.remove(expGroup.children[0]);
        }
        dsParticles = [];
        
        wavePoints = [];
        for (var i = 0; i < 150; i++) {
            var sphereGeo = new THREE.SphereGeometry(0.12, 8, 8);
            var sphereMat = new THREE.MeshBasicMaterial({ 
                color: 0x4a9eff 
            });
            var sphere = new THREE.Mesh(sphereGeo, sphereMat);
            sphere.position.x = (i - 75) * 0.2;
            sphere.userData = { index: i, baseX: sphere.position.x };
            wavePoints.push(sphere);
            expGroup.add(sphere);
        }
        
        // Wave source indicator
        var sourceGeo = new THREE.SphereGeometry(0.4, 16, 16);
        var sourceMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        var source = new THREE.Mesh(sourceGeo, sourceMat);
        source.position.x = -15;
        source.position.y = 3;
        expGroup.add(source);
    }
    
    function createDoubleSlit() {
        while (expGroup.children.length > 0) {
            expGroup.remove(expGroup.children[0]);
        }
        wavePoints = [];
        
        // Light source
        var sourceGeo = new THREE.SphereGeometry(0.6, 32, 32);
        var sourceMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        var source = new THREE.Mesh(sourceGeo, sourceMat);
        source.position.x = -15;
        expGroup.add(source);
        
        // Label: "Light Source"
        // Barrier with two slits
        var barrierMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        
        // Top barrier
        var b1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3, 0.4), barrierMat);
        b1.position.set(0, 2.5, 0);
        expGroup.add(b1);
        
        // Middle barrier (between slits)
        var b2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), barrierMat);
        b2.position.set(0, 0, 0);
        expGroup.add(b2);
        
        // Bottom barrier
        var b3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3, 0.4), barrierMat);
        b3.position.set(0, -2.5, 0);
        expGroup.add(b3);
        
        // Detection screen
        var screenGeo = new THREE.PlaneGeometry(0.3, 10);
        var screenMat = new THREE.MeshBasicMaterial({ 
            color: 0x000066, 
            side: THREE.DoubleSide 
        });
        var screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.x = 15;
        screen.rotation.y = Math.PI / 2;
        expGroup.add(screen);
        
        // Particles
        dsParticles = [];
        for (var i = 0; i < 80; i++) {
            var pGeo = new THREE.SphereGeometry(0.08, 6, 6);
            var pMat = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff, 
                transparent: true, 
                opacity: 0.9 
            });
            var p = new THREE.Mesh(pGeo, pMat);
            p.userData = {
                x: -15,
                y: (Math.random() - 0.5) * 2,
                z: (Math.random() - 0.5) * 1,
                speed: 0.08 + Math.random() * 0.05,
                slit: Math.random() > 0.5 ? 1 : -1,
                phase: Math.random() * Math.PI * 2
            };
            dsParticles.push(p);
            expGroup.add(p);
        }
    }
    
    createPendulum();
    
    // Speed control
    var speedInput = document.getElementById('physicsSpeed');
    if (speedInput) {
        speedInput.oninput = function(e) {
            simSpeed = parseFloat(e.target.value);
        };
    }
    
    // Play/Pause
    var playBtn = document.getElementById('physPlayPause');
    if (playBtn) {
        playBtn.onclick = function(e) {
            isPlaying = !isPlaying;
            e.target.innerHTML = isPlaying ? '<span class="ctrl-icon">⏸️</span> Pause' : '<span class="ctrl-icon">▶️</span> Play';
        };
    }
    
    // Reset
    var resetBtn = document.getElementById('physReset');
    if (resetBtn) {
        resetBtn.onclick = function() {
            time = 0;
            if (currentExp === 'pendulum') {
                pendulumAngle = Math.PI / 4;
            } else if (currentExp === 'wave') {
                createWave();
            } else if (currentExp === 'double-slit') {
                createDoubleSlit();
            }
        };
    }
    
    // Experiment buttons
    var expBtns = document.querySelectorAll('#physics-controls .tab-btn[data-exp]');
    for (var e = 0; e < expBtns.length; e++) {
        expBtns[e].onclick = function(ev) {
            for (var k = 0; k < expBtns.length; k++) {
                expBtns[k].classList.remove('active');
            }
            ev.target.classList.add('active');
            currentExp = ev.target.dataset.exp;
            time = 0;
            
            switch(currentExp) {
                case 'pendulum': createPendulum(); break;
                case 'wave': createWave(); break;
                case 'double-slit': createDoubleSlit(); break;
                default: createPendulum();
            }
        };
    }
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        if (isPlaying) {
            time += 0.016 * simSpeed;
            
            // Pendulum physics
            if (currentExp === 'pendulum' && pendulumBob && pendulumString) {
                // Simple pendulum equation: θ = θ₀ * cos(√(g/L) * t)
                var naturalFreq = Math.sqrt(gravity / pendulumLength);
                pendulumAngle = (Math.PI / 4) * Math.cos(naturalFreq * time);
                
                var x = Math.sin(pendulumAngle) * pendulumLength;
                var y = 5 - Math.cos(pendulumAngle) * pendulumLength;
                
                pendulumBob.position.set(x, y, 0);
                
                // Update string position and rotation
                pendulumString.position.set(x / 2, 5 - pendulumLength / 2 * Math.cos(pendulumAngle), 0);
                pendulumString.rotation.z = pendulumAngle;
                pendulumString.scale.y = Math.cos(pendulumAngle);
            }
            
            // Wave motion
            if (currentExp === 'wave' && wavePoints.length > 0) {
                for (var i = 0; i < wavePoints.length; i++) {
                    var p = wavePoints[i];
                    var phase = p.userData.index * 0.15;
                    p.position.y = waveAmplitude * Math.sin(waveFrequency * time - phase);
                }
            }
            
            // Double slit particles
            if (currentExp === 'double-slit' && dsParticles.length > 0) {
                for (var j = 0; j < dsParticles.length; j++) {
                    var part = dsParticles[j];
                    part.userData.x += part.userData.speed * simSpeed;
                    
                    // After passing through slits
                    if (part.userData.x > 0) {
                        // Wave interference pattern
                        var diffraction = Math.sin(part.userData.x * 0.15 + part.userData.phase) * 0.015;
                        part.userData.y += (part.userData.slit * 0.008 + diffraction);
                    }
                    
                    // Reset when hitting screen
                    if (part.userData.x > 14) {
                        part.userData.x = -15;
                        part.userData.y = (Math.random() - 0.5) * 2;
                        part.userData.phase = Math.random() * Math.PI * 2;
                    }
                    
                    part.position.set(part.userData.x, part.userData.y, part.userData.z);
                }
            }
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('Physics Lab! Pendulum shows real physics - watch it swing!', 'info');
}

// ==================== ROBOTICS ====================
function initRobotics() {
    var setup = createScene('robotics-canvas');
    if (!setup) return;
    
    var scene = setup.scene;
    var camera = setup.camera;
    var renderer = setup.renderer;
    var controls = setup.controls;
    
    camera.position.set(10, 8, 10);
    controls.target.set(0, 2, 0);
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    var light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 15, 5);
    scene.add(light);
    
    // Grid floor
    var grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(grid);
    
    var robotGroup = new THREE.Group();
    scene.add(robotGroup);
    
    // Base
    var baseGeo = new THREE.CylinderGeometry(1.3, 1.5, 0.6, 32);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.3;
    robotGroup.add(base);
    
    // Rotating platform
    var platformGeo = new THREE.CylinderGeometry(1, 1, 0.35, 32);
    var platformMat = new THREE.MeshStandardMaterial({ color: 0x2196F3, metalness: 0.5, roughness: 0.3 });
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 0.775;
    robotGroup.add(platform);
    
    // Arm segment 1
    var armMat = new THREE.MeshStandardMaterial({ color: 0xFF9800, metalness: 0.6, roughness: 0.3 });
    var arm1Geo = new THREE.BoxGeometry(0.45, 3.2, 0.45);
    var arm1 = new THREE.Mesh(arm1Geo, armMat);
    arm1.position.y = 2.1;
    platform.add(arm1);
    
    // Joint 1
    var jointMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.1 });
    var joint1Geo = new THREE.SphereGeometry(0.35, 16, 16);
    var joint1 = new THREE.Mesh(joint1Geo, jointMat);
    joint1.position.y = 1.6;
    arm1.add(joint1);
    
    // Arm segment 2
    var arm2Geo = new THREE.BoxGeometry(0.38, 2.6, 0.38);
    var arm2 = new THREE.Mesh(arm2Geo, armMat);
    arm2.position.y = 1.4;
    joint1.add(arm2);
    
    // Joint 2
    var joint2Geo = new THREE.SphereGeometry(0.3, 16, 16);
    var joint2 = new THREE.Mesh(joint2Geo, jointMat);
    joint2.position.y = 1.3;
    arm2.add(joint2);
    
    // Arm segment 3
    var arm3Geo = new THREE.BoxGeometry(0.32, 2, 0.32);
    var arm3 = new THREE.Mesh(arm3Geo, armMat);
    arm3.position.y = 1;
    joint2.add(arm3);
    
    // Gripper base
    var gripBaseGeo = new THREE.BoxGeometry(0.55, 0.25, 0.45);
    var gripBaseMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
    var gripBase = new THREE.Mesh(gripBaseGeo, gripBaseMat);
    gripBase.position.y = 1.1;
    arm3.add(gripBase);
    
    // Gripper fingers
    var fingerMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var fingerGeo = new THREE.BoxGeometry(0.1, 0.55, 0.18);
    var finger1 = new THREE.Mesh(fingerGeo, fingerMat);
    finger1.position.set(-0.18, 0.38, 0);
    gripBase.add(finger1);
    
    var finger2 = new THREE.Mesh(fingerGeo, fingerMat);
    finger2.position.set(0.18, 0.38, 0);
    gripBase.add(finger2);
    
    var autoMode = false;
    var autoTime = 0;
    
    // Joint control handlers
    var baseRotInput = document.getElementById('baseRotation');
    if (baseRotInput) {
        baseRotInput.oninput = function(e) {
            platform.rotation.y = THREE.Math.degToRad(parseFloat(e.target.value));
            var valEl = document.getElementById('baseValue');
            if (valEl) valEl.textContent = e.target.value + '°';
        };
    }
    
    var shoulderInput = document.getElementById('shoulderRotation');
    if (shoulderInput) {
        shoulderInput.oninput = function(e) {
            arm1.rotation.z = THREE.Math.degToRad(parseFloat(e.target.value));
            var valEl = document.getElementById('shoulderValue');
            if (valEl) valEl.textContent = e.target.value + '°';
        };
    }
    
    var elbowInput = document.getElementById('elbowRotation');
    if (elbowInput) {
        elbowInput.oninput = function(e) {
            joint1.rotation.z = THREE.Math.degToRad(parseFloat(e.target.value));
            var valEl = document.getElementById('elbowValue');
            if (valEl) valEl.textContent = e.target.value + '°';
        };
    }
    
    var wristInput = document.getElementById('wristRotation');
    if (wristInput) {
        wristInput.oninput = function(e) {
            joint2.rotation.z = THREE.Math.degToRad(parseFloat(e.target.value));
            var valEl = document.getElementById('wristValue');
            if (valEl) valEl.textContent = e.target.value + '°';
        };
    }
    
    var gripperInput = document.getElementById('gripperOpen');
    if (gripperInput) {
        gripperInput.oninput = function(e) {
            var val = parseFloat(e.target.value);
            finger1.position.x = -0.18 - val * 0.0025;
            finger2.position.x = 0.18 + val * 0.0025;
            var valEl = document.getElementById('gripperValue');
            if (valEl) valEl.textContent = val + '%';
        };
    }
    
    // Auto demo
    var autoBtn = document.getElementById('autoDemo');
    if (autoBtn) {
        autoBtn.onclick = function(e) {
            autoMode = !autoMode;
            e.target.classList.toggle('active');
            e.target.textContent = autoMode ? '⏹️ Stop Demo' : '▶️ Auto Demo';
        };
    }
    
    // Reset
    var resetBtn = document.getElementById('resetArm');
    if (resetBtn) {
        resetBtn.onclick = function() {
            autoMode = false;
            autoTime = 0;
            platform.rotation.y = 0;
            arm1.rotation.z = 0;
            joint1.rotation.z = 0;
            joint2.rotation.z = 0;
            finger1.position.x = -0.18;
            finger2.position.x = 0.18;
            
            var inputs = ['baseRotation', 'shoulderRotation', 'elbowRotation', 'wristRotation'];
            var values = ['baseValue', 'shoulderValue', 'elbowValue', 'wristValue'];
            for (var i = 0; i < inputs.length; i++) {
                var inp = document.getElementById(inputs[i]);
                var val = document.getElementById(values[i]);
                if (inp) inp.value = 0;
                if (val) val.textContent = '0°';
            }
            
            var gIn = document.getElementById('gripperOpen');
            var gVal = document.getElementById('gripperValue');
            if (gIn) gIn.value = 50;
            if (gVal) gVal.textContent = '50%';
            
            if (autoBtn) {
                autoBtn.textContent = '▶️ Auto Demo';
                autoBtn.classList.remove('active');
            }
        };
    }
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        if (autoMode) {
            autoTime += 0.015;
            platform.rotation.y = Math.sin(autoTime) * 1.8;
            arm1.rotation.z = Math.sin(autoTime * 0.6) * 0.6;
            joint1.rotation.z = Math.sin(autoTime * 1.1) * 0.9;
            joint2.rotation.z = Math.sin(autoTime * 0.85) * 0.7;
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('6-DOF Robot Arm! Use sliders to control joints', 'info');
}

// ==================== GAME ====================
var gameScore = 0;
var gameLives = 3;
var gameWave = 1;
var gameRunning = false;
var gameDifficulty = 'medium';

function initGame() {
    var setup = createScene('games-canvas', 0x000005);
    if (!setup) return;
    
    var scene = setup.scene;
    var camera = setup.camera;
    var renderer = setup.renderer;
    var controls = setup.controls;
    
    camera.position.set(0, 0, 30);
    if (controls) controls.enabled = false;
    
    addStars(scene, 4000);
    scene.add(new THREE.AmbientLight(0x404040, 0.6));
    
    // Player ship
    var shipGroup = new THREE.Group();
    
    // Ship body
    var bodyGeo = new THREE.ConeGeometry(0.6, 2.2, 6);
    var bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00, 
        emissive: 0x00aa00, 
        emissiveIntensity: 0.3 
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    shipGroup.add(body);
    
    // Ship wings
    var wingGeo = new THREE.BoxGeometry(2.2, 0.1, 0.6);
    var wingMat = new THREE.MeshStandardMaterial({ color: 0x0088ff });
    var wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.z = 0.5;
    shipGroup.add(wing);
    
    // Engine glow
    var engineGeo = new THREE.SphereGeometry(0.25, 12, 12);
    var engineMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    var engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.z = 1;
    shipGroup.add(engine);
    
    shipGroup.position.z = 20;
    scene.add(shipGroup);
    
    // Game state
    var enemies = [];
    var bullets = [];
    var lastShot = 0;
    var spawnTimer = 0;
    var moveX = 0;
    var moveY = 0;
    var shooting = false;
    
    gameScore = 0;
    gameLives = 3;
    gameWave = 1;
    updateGameUI();
    
    function spawnEnemy() {
        var enemyGeo = new THREE.OctahedronGeometry(0.9);
        var enemyMat = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, 
            emissive: 0xff0000, 
            emissiveIntensity: 0.4 
        });
        var enemy = new THREE.Mesh(enemyGeo, enemyMat);
        enemy.position.set(
            (Math.random() - 0.5) * 28,
            (Math.random() - 0.5) * 18,
            -55
        );
        
        var diffMult = { easy: 0.12, medium: 0.2, hard: 0.35 }[gameDifficulty];
        enemy.userData = { 
            speed: diffMult + Math.random() * 0.15, 
            health: gameWave,
            rotSpeed: Math.random() * 0.1
        };
        enemies.push(enemy);
        scene.add(enemy);
    }
    
    function shoot() {
        if (!gameRunning) return;
        var now = Date.now();
        if (now - lastShot < 120) return;
        lastShot = now;
        
        var bulletGeo = new THREE.SphereGeometry(0.18);
        var bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        var bullet = new THREE.Mesh(bulletGeo, bulletMat);
        bullet.position.copy(shipGroup.position);
        bullet.position.z -= 0.5;
        bullet.userData = { speed: 1.8 };
        bullets.push(bullet);
        scene.add(bullet);
    }
    
    // Touch controls for D-pad
    function setupTouchButton(id, onStart, onEnd) {
        var btn = document.getElementById(id);
        if (!btn) return;
        
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            onStart();
        }, { passive: false });
        
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            onEnd();
        }, { passive: false });
        
        btn.addEventListener('mousedown', function(e) {
            e.preventDefault();
            onStart();
        });
        
        btn.addEventListener('mouseup', function(e) {
            e.preventDefault();
            onEnd();
        });
        
        btn.addEventListener('mouseleave', function(e) {
            onEnd();
        });
    }
    
    setupTouchButton('btnUp', function() { moveY = 10; }, function() { moveY = 0; });
    setupTouchButton('btnDown', function() { moveY = -10; }, function() { moveY = 0; });
    setupTouchButton('btnLeft', function() { moveX = -14; }, function() { moveX = 0; });
    setupTouchButton('btnRight', function() { moveX = 14; }, function() { moveX = 0; });
    setupTouchButton('btnFire', function() { shooting = true; }, function() { shooting = false; });
    
    // Keyboard controls
    var keysDown = {};
    
    document.addEventListener('keydown', function(e) {
        keysDown[e.key.toLowerCase()] = true;
        
        if (!gameRunning) return;
        
        if (e.key === ' ' || e.key.toLowerCase() === 'f') {
            shooting = true;
        }
    });
    
    document.addEventListener('keyup', function(e) {
        keysDown[e.key.toLowerCase()] = false;
        
        if (e.key === ' ' || e.key.toLowerCase() === 'f') {
            shooting = false;
        }
    });
    
    function updateFromKeys() {
        if (keysDown['w'] || keysDown['arrowup']) moveY = 10;
        else if (keysDown['s'] || keysDown['arrowdown']) moveY = -10;
        else if (!keysDown['w'] && !keysDown['arrowup'] && !keysDown['s'] && !keysDown['arrowdown']) {
            // Only reset if no touch control active
        }
        
        if (keysDown['a'] || keysDown['arrowleft']) moveX = -14;
        else if (keysDown['d'] || keysDown['arrowright']) moveX = 14;
        else if (!keysDown['a'] && !keysDown['arrowleft'] && !keysDown['d'] && !keysDown['arrowright']) {
            // Only reset if no touch control active
        }
    }
    
    // Difficulty selector
    var diffSelect = document.getElementById('gameDifficulty');
    if (diffSelect) {
        diffSelect.onchange = function(e) {
            gameDifficulty = e.target.value;
        };
    }
    
    // Start button
    var startBtn = document.getElementById('gameStart');
    if (startBtn) {
        startBtn.onclick = function() {
            gameRunning = true;
            gameScore = 0;
            gameLives = 3;
            gameWave = 1;
            updateGameUI();
            var overScreen = document.getElementById('gameOverScreen');
            if (overScreen) overScreen.style.display = 'none';
            showToast('Game Started! WASD/Arrows or D-pad to move, Space/F or Fire button to shoot!', 'success');
        };
    }
    
    // Restart button
    var restartBtn = document.getElementById('gameRestart');
    if (restartBtn) {
        restartBtn.onclick = restartGame;
    }
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        if (gameRunning) {
            // Update movement from keyboard
            updateFromKeys();
            
            // Move ship
            shipGroup.position.x += (moveX - shipGroup.position.x) * 0.12;
            shipGroup.position.y += (moveY - shipGroup.position.y) * 0.12;
            shipGroup.rotation.z = -moveX * 0.025;
            
            // Clamp position
            shipGroup.position.x = Math.max(-14, Math.min(14, shipGroup.position.x));
            shipGroup.position.y = Math.max(-9, Math.min(9, shipGroup.position.y));
            
            // Shooting
            if (shooting) {
                shoot();
            }
            
            // Move bullets
            for (var i = bullets.length - 1; i >= 0; i--) {
                bullets[i].position.z -= bullets[i].userData.speed;
                if (bullets[i].position.z < -60) {
                    scene.remove(bullets[i]);
                    bullets.splice(i, 1);
                }
            }
            
            // Move enemies and check collisions
            for (var j = enemies.length - 1; j >= 0; j--) {
                var enemy = enemies[j];
                enemy.position.z += enemy.userData.speed;
                enemy.rotation.x += enemy.userData.rotSpeed;
                enemy.rotation.y += enemy.userData.rotSpeed * 0.7;
                
                // Check collision with player
                if (enemy.position.distanceTo(shipGroup.position) < 1.6) {
                    gameLives--;
                    updateGameUI();
                    scene.remove(enemy);
                    enemies.splice(j, 1);
                    
                    if (gameLives <= 0) {
                        endGame();
                    }
                    continue;
                }
                
                // Check collision with bullets
                for (var k = bullets.length - 1; k >= 0; k--) {
                    if (enemy.position.distanceTo(bullets[k].position) < 1.1) {
                        enemy.userData.health--;
                        scene.remove(bullets[k]);
                        bullets.splice(k, 1);
                        
                        if (enemy.userData.health <= 0) {
                            scene.remove(enemy);
                            enemies.splice(j, 1);
                            gameScore += 10 * gameWave;
                            updateGameUI();
                            
                            // Level up
                            if (gameScore >= gameWave * 150) {
                                gameWave++;
                                updateGameUI();
                                showToast('Wave ' + gameWave + '! Enemies getting faster!', 'success');
                            }
                        }
                        break;
                    }
                }
                
                // Remove if past player
                if (enemies[j] && enemies[j].position.z > 30) {
                    scene.remove(enemies[j]);
                    enemies.splice(j, 1);
                }
            }
            
            // Spawn enemies
            spawnTimer++;
            var spawnRate = { easy: 100, medium: 70, hard: 45 }[gameDifficulty];
            if (spawnTimer > Math.max(20, spawnRate - gameWave * 5)) {
                spawnEnemy();
                spawnTimer = 0;
            }
            
            // Engine pulse
            engine.scale.setScalar(0.8 + Math.sin(Date.now() * 0.01) * 0.2);
        }
        
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('Press START to begin! Works on mobile and desktop', 'info');
}

function updateGameUI() {
    var scoreEl = document.getElementById('gameScore');
    var livesEl = document.getElementById('gameLives');
    var waveEl = document.getElementById('gameWave');
    
    if (scoreEl) scoreEl.textContent = gameScore;
    if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, gameLives));
    if (waveEl) waveEl.textContent = gameWave;
}

function endGame() {
    gameRunning = false;
    var finalEl = document.getElementById('finalScore');
    if (finalEl) finalEl.textContent = gameScore;
    var overScreen = document.getElementById('gameOverScreen');
    if (overScreen) overScreen.style.display = 'flex';
}

function restartGame() {
    gameScore = 0;
    gameLives = 3;
    gameWave = 1;
    gameRunning = true;
    var overScreen = document.getElementById('gameOverScreen');
    if (overScreen) overScreen.style.display = 'none';
    updateGameUI();
    navigateTo('games');
}

// ==================== PARTICLE BACKGROUND ====================
function initParticleBackground() {
    var canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    var ctx = canvas.getContext('2d');
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    
    var particles = [];
    for (var i = 0; i < 80; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.4 + 0.15
        });
    }
    
    function animateBg() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(59, 130, 246, ' + p.opacity + ')';
            ctx.fill();
        }
        
        requestAnimationFrame(animateBg);
    }
    animateBg();
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    var navBtns = document.querySelectorAll('.nav-btn, .mobile-nav-btn');
    for (var i = 0; i < navBtns.length; i++) {
        navBtns[i].addEventListener('click', function(e) {
            navigateTo(e.target.dataset.section || e.target.closest('button').dataset.section);
        });
    }
    
    // Particle background
    initParticleBackground();
    
    // Header scroll effect
    window.addEventListener('scroll', function() {
        var header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
    
    console.log('🔬 Interactive 3D Science Lab initialized!');
    console.log('✅ All 118 elements loaded');
    console.log('✅ Solar System ready');
    console.log('✅ DNA/RNA visualizer ready');
    console.log('✅ Cell Biology ready');
    console.log('✅ Physics experiments ready');
    console.log('✅ Robotics arm ready');
    console.log('✅ Space Game ready');
});

// Global function exports
window.navigateTo = navigateTo;
window.toggleMobileMenu = toggleMobileMenu;
window.closeModal = closeModal;
window.closeInfoPanel = closeInfoPanel;
window.restartGame = restartGame;
