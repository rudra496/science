// ================== GLOBALS ==================
let currentPage = 'home';
let scene, camera, renderer, controls;
let animationId = null;
let isPaused = false;
let simTime = 0;

// ================== ELEMENTS DATA ==================
const ELEMENTS = [
    {n:1,s:'H',name:'Hydrogen',cat:'nonmetal',color:'#90CAF9',mass:1.008,p:1,g:1,config:'1s¹',found:'1766',use:'Fuel cells',fact:'Most abundant'},
    {n:2,s:'He',name:'Helium',cat:'noble',color:'#E8F5E9',mass:4.003,p:1,g:18,config:'1s²',found:'1868',use:'Balloons',fact:'Doesn\'t solidify'},
    {n:3,s:'Li',name:'Lithium',cat:'alkali',color:'#FF8A65',mass:6.941,p:2,g:1,config:'[He]2s¹',found:'1817',use:'Batteries',fact:'Lightest metal'},
    {n:4,s:'Be',name:'Beryllium',cat:'alkaline',color:'#FFCC80',mass:9.012,p:2,g:2,config:'[He]2s²',found:'1798',use:'Aerospace',fact:'Toxic dust'},
    {n:5,s:'B',name:'Boron',cat:'metalloid',color:'#A1887F',mass:10.81,p:2,g:13,config:'[He]2s²2p¹',found:'1808',use:'Glass',fact:'Essential for plants'},
    {n:6,s:'C',name:'Carbon',cat:'nonmetal',color:'#616161',mass:12.01,p:2,g:14,config:'[He]2s²2p²',found:'Ancient',use:'Organic chem',fact:'Basis of life'},
    {n:7,s:'N',name:'Nitrogen',cat:'nonmetal',color:'#90CAF9',mass:14.01,p:2,g:15,config:'[He]2s²2p³',found:'1772',use:'Fertilizers',fact:'78% atmosphere'},
    {n:8,s:'O',name:'Oxygen',cat:'nonmetal',color:'#EF5350',mass:16.00,p:2,g:16,config:'[He]2s²2p⁴',found:'1774',use:'Respiration',fact:'21% atmosphere'},
    {n:9,s:'F',name:'Fluorine',cat:'halogen',color:'#A5D6A7',mass:19.00,p:2,g:17,config:'[He]2s²2p⁵',found:'1886',use:'Toothpaste',fact:'Most reactive'},
    {n:10,s:'Ne',name:'Neon',cat:'noble',color:'#F48FB1',mass:20.18,p:2,g:18,config:'[He]2s²2p⁶',found:'1898',use:'Neon signs',fact:'Red-orange glow'},
    {n:11,s:'Na',name:'Sodium',cat:'alkali',color:'#FF8A65',mass:22.99,p:3,g:1,config:'[Ne]3s¹',found:'1807',use:'Table salt',fact:'Reactive with water'},
    {n:12,s:'Mg',name:'Magnesium',cat:'alkaline',color:'#FFCC80',mass:24.31,p:3,g:2,config:'[Ne]3s²',found:'1755',use:'Alloys',fact:'Bright white flame'},
    {n:13,s:'Al',name:'Aluminum',cat:'post',color:'#B0BEC5',mass:26.98,p:3,g:13,config:'[Ne]3s²3p¹',found:'1825',use:'Cans, foil',fact:'Most abundant metal'},
    {n:14,s:'Si',name:'Silicon',cat:'metalloid',color:'#A1887F',mass:28.09,p:3,g:14,config:'[Ne]3s²3p²',found:'1824',use:'Chips, glass',fact:'2nd most abundant'},
    {n:15,s:'P',name:'Phosphorus',cat:'nonmetal',color:'#FFD54F',mass:30.97,p:3,g:15,config:'[Ne]3s²3p³',found:'1669',use:'Fertilizers',fact:'Glows'},
    {n:16,s:'S',name:'Sulfur',cat:'nonmetal',color:'#FFF176',mass:32.07,p:3,g:16,config:'[Ne]3s²3p⁴',found:'Ancient',use:'Sulfuric acid',fact:'Brimstone'},
    {n:17,s:'Cl',name:'Chlorine',cat:'halogen',color:'#A5D6A7',mass:35.45,p:3,g:17,config:'[Ne]3s²3p⁵',found:'1774',use:'Disinfectant',fact:'Yellow-green gas'},
    {n:18,s:'Ar',name:'Argon',cat:'noble',color:'#E0E0E0',mass:39.95,p:3,g:18,config:'[Ne]3s²3p⁶',found:'1894',use:'Welding',fact:'1% atmosphere'},
    {n:19,s:'K',name:'Potassium',cat:'alkali',color:'#FF8A65',mass:39.10,p:4,g:1,config:'[Ar]4s¹',found:'1807',use:'Fertilizers',fact:'Violent with water'},
    {n:20,s:'Ca',name:'Calcium',cat:'alkaline',color:'#FFCC80',mass:40.08,p:4,g:2,config:'[Ar]4s²',found:'1808',use:'Bones, cement',fact:'In human body'},
    {n:21,s:'Sc',name:'Scandium',cat:'transition',color:'#CE93D8',mass:44.96,p:4,g:3,config:'[Ar]3d¹4s²',found:'1879',use:'Aerospace',fact:'Scandinavia'},
    {n:22,s:'Ti',name:'Titanium',cat:'transition',color:'#B0BEC5',mass:47.87,p:4,g:4,config:'[Ar]3d²4s²',found:'1791',use:'Aircraft',fact:'Strong & light'},
    {n:23,s:'V',name:'Vanadium',cat:'transition',color:'#FF8A65',mass:50.94,p:4,g:5,config:'[Ar]3d³4s²',found:'1801',use:'Steel tools',fact:'Named after Vanadis'},
    {n:24,s:'Cr',name:'Chromium',cat:'transition',color:'#90A4AE',mass:52.00,p:4,g:6,config:'[Ar]3d⁵4s¹',found:'1797',use:'Chrome plating',fact:'Means color'},
    {n:25,s:'Mn',name:'Manganese',cat:'transition',color:'#7E57C2',mass:54.94,p:4,g:7,config:'[Ar]3d⁵4s²',found:'1774',use:'Steel',fact:'Trace element'},
    {n:26,s:'Fe',name:'Iron',cat:'transition',color:'#9E9E9E',mass:55.85,p:4,g:8,config:'[Ar]3d⁶4s²',found:'Ancient',use:'Steel',fact:'Most common metal'},
    {n:27,s:'Co',name:'Cobalt',cat:'transition',color:'#42A5F5',mass:58.93,p:4,g:9,config:'[Ar]3d⁷4s²',found:'1735',use:'Batteries',fact:'Blue pigment'},
    {n:28,s:'Ni',name:'Nickel',cat:'transition',color:'#B0BEC5',mass:58.69,p:4,g:10,config:'[Ar]3d⁸4s²',found:'1751',use:'Coins',fact:'Coins worldwide'},
    {n:29,s:'Cu',name:'Copper',cat:'transition',color:'#FF8A65',mass:63.55,p:4,g:11,config:'[Ar]3d¹⁰4s¹',found:'Ancient',use:'Wires',fact:'Best conductor'},
    {n:30,s:'Zn',name:'Zinc',cat:'transition',color:'#B0BEC5',mass:65.38,p:4,g:12,config:'[Ar]3d¹⁰4s²',found:'Ancient',use:'Galvanization',fact:'Immune system'},
    {n:31,s:'Ga',name:'Gallium',cat:'post',color:'#B0BEC5',mass:69.72,p:4,g:13,config:'[Ar]3d¹⁰4s²4p¹',found:'1875',use:'LEDs',fact:'Melts in hand'},
    {n:32,s:'Ge',name:'Germanium',cat:'metalloid',color:'#81C784',mass:72.63,p:4,g:14,config:'[Ar]3d¹⁰4s²4p²',found:'1886',use:'Fiber optics',fact:'Germany'},
    {n:33,s:'As',name:'Arsenic',cat:'metalloid',color:'#808080',mass:74.92,p:4,g:15,config:'[Ar]3d¹⁰4s²4p³',found:'Ancient',use:'Semiconductors',fact:'Poison'},
    {n:34,s:'Se',name:'Selenium',cat:'nonmetal',color:'#FFD54F',mass:78.97,p:4,g:16,config:'[Ar]3d¹⁰4s²4p⁴',found:'1817',use:'Electronics',fact:'Moon (Selene)'},
    {n:35,s:'Br',name:'Bromine',cat:'halogen',color:'#8D6E63',mass:79.90,p:4,g:17,config:'[Ar]3d¹⁰4s²4p⁵',found:'1826',use:'Flame retardant',fact:'Liquid nonmetal'},
    {n:36,s:'Kr',name:'Krypton',cat:'noble',color:'#CE93D8',mass:83.80,p:4,g:18,config:'[Ar]3d¹⁰4s²4p⁶',found:'1898',use:'Lighting',fact:'Not Superman'},
    {n:37,s:'Rb',name:'Rubidium',cat:'alkali',color:'#FF8A65',mass:85.47,p:5,g:1,config:'[Kr]5s¹',found:'1861',use:'Atomic clocks',fact:'Ignites in air'},
    {n:38,s:'Sr',name:'Strontium',cat:'alkaline',color:'#FFCC80',mass:87.62,p:5,g:2,config:'[Kr]5s²',found:'1790',use:'Fireworks',fact:'Red color'},
    {n:39,s:'Y',name:'Yttrium',cat:'transition',color:'#4DD0E1',mass:88.91,p:5,g:3,config:'[Kr]4d¹5s²',found:'1794',use:'LEDs',fact:'Ytterby'},
    {n:40,s:'Zr',name:'Zirconium',cat:'transition',color:'#B0BEC5',mass:91.22,p:5,g:4,config:'[Kr]4d²5s²',found:'1789',use:'Nuclear reactors',fact:'Diamond simulant'},
    {n:41,s:'Nb',name:'Niobium',cat:'transition',color:'#CE93D8',mass:92.91,p:5,g:5,config:'[Kr]4d⁴5s¹',found:'1801',use:'Superconductors',fact:'Niobe'},
    {n:42,s:'Mo',name:'Molybdenum',cat:'transition',color:'#78909C',mass:95.95,p:5,g:6,config:'[Kr]4d⁵5s¹',found:'1781',use:'Steel',fact:'High melting point'},
    {n:43,s:'Tc',name:'Technetium',cat:'transition',color:'#E0E0E0',mass:98,p:5,g:7,config:'[Kr]4d⁵5s²',found:'1937',use:'Medical imaging',fact:'First artificial'},
    {n:44,s:'Ru',name:'Ruthenium',cat:'transition',color:'#B0BEC5',mass:101.07,p:5,g:8,config:'[Kr]4d⁷5s¹',found:'1844',use:'Electronics',fact:'Russia'},
    {n:45,s:'Rh',name:'Rhodium',cat:'transition',color:'#E0E0E0',mass:102.91,p:5,g:9,config:'[Kr]4d⁸5s¹',found:'1803',use:'Catalytic converters',fact:'Most expensive'},
    {n:46,s:'Pd',name:'Palladium',cat:'transition',color:'#E0E0E0',mass:106.42,p:5,g:10,config:'[Kr]4d¹⁰',found:'1803',use:'Jewelry',fact:'Asteroid Pallas'},
    {n:47,s:'Ag',name:'Silver',cat:'transition',color:'#E0E0E0',mass:107.87,p:5,g:11,config:'[Kr]4d¹⁰5s¹',found:'Ancient',use:'Jewelry',fact:'Best conductor'},
    {n:48,s:'Cd',name:'Cadmium',cat:'transition',color:'#FFD54F',mass:112.41,p:5,g:12,config:'[Kr]4d¹⁰5s²',found:'1817',use:'Batteries',fact:'Toxic'},
    {n:49,s:'In',name:'Indium',cat:'post',color:'#7986CB',mass:114.82,p:5,g:13,config:'[Kr]4d¹⁰5s²5p¹',found:'1863',use:'LCD',fact:'Indigo line'},
    {n:50,s:'Sn',name:'Tin',cat:'post',color:'#B0BEC5',mass:118.71,p:5,g:14,config:'[Kr]4d¹⁰5s²5p²',found:'Ancient',use:'Solder',fact:'Bronze Age'},
    {n:51,s:'Sb',name:'Antimony',cat:'metalloid',color:'#B39DDB',mass:121.76,p:5,g:15,config:'[Kr]4d¹⁰5s²5p³',found:'Ancient',use:'Batteries',fact:'Egyptian mascara'},
    {n:52,s:'Te',name:'Tellurium',cat:'metalloid',color:'#FFB74D',mass:127.60,p:5,g:16,config:'[Kr]4d¹⁰5s²5p⁴',found:'1783',use:'Solar cells',fact:'Earth (Tellus)'},
    {n:53,s:'I',name:'Iodine',cat:'halogen',color:'#7E57C2',mass:126.90,p:5,g:17,config:'[Kr]4d¹⁰5s²5p⁵',found:'1811',use:'Disinfectant',fact:'Thyroid'},
    {n:54,s:'Xe',name:'Xenon',cat:'noble',color:'#42A5F5',mass:131.29,p:5,g:18,config:'[Kr]4d¹⁰5s²5p⁶',found:'1898',use:'Anesthesia',fact:'Stranger'},
    {n:55,s:'Cs',name:'Cesium',cat:'alkali',color:'#FF8A65',mass:132.91,p:6,g:1,config:'[Xe]6s¹',found:'1860',use:'Atomic clocks',fact:'Most electropositive'},
    {n:56,s:'Ba',name:'Barium',cat:'alkaline',color:'#FFCC80',mass:137.33,p:6,g:2,config:'[Xe]6s²',found:'1808',use:'Medical imaging',fact:'Heavy'},
    {n:57,s:'La',name:'Lanthanum',cat:'lanthanide',color:'#81C784',mass:138.91,p:6,g:3,config:'[Xe]5d¹6s²',found:'1839',use:'Lenses',fact:'Hidden'},
    {n:58,s:'Ce',name:'Cerium',cat:'lanthanide',color:'#A5D6A7',mass:140.12,p:6,g:3,config:'[Xe]4f¹5d¹6s²',found:'1803',use:'Lighters',fact:'Most abundant rare earth'},
    {n:59,s:'Pr',name:'Praseodymium',cat:'lanthanide',color:'#C5E1A5',mass:140.91,p:6,g:3,config:'[Xe]4f³6s²',found:'1885',use:'Magnets',fact:'Green twin'},
    {n:60,s:'Nd',name:'Neodymium',cat:'lanthanide',color:'#DCEDC8',mass:144.24,p:6,g:3,config:'[Xe]4f⁴6s²',found:'1885',use:'Strong magnets',fact:'Strongest magnets'},
    {n:61,s:'Pm',name:'Promethium',cat:'lanthanide',color:'#F48FB1',mass:145,p:6,g:3,config:'[Xe]4f⁵6s²',found:'1945',use:'Nuclear batteries',fact:'Prometheus'},
    {n:62,s:'Sm',name:'Samarium',cat:'lanthanide',color:'#FFF59D',mass:150.36,p:6,g:3,config:'[Xe]4f⁶6s²',found:'1879',use:'Cancer treatment',fact:'Samarskite'},
    {n:63,s:'Eu',name:'Europium',cat:'lanthanide',color:'#FF8A65',mass:151.96,p:6,g:3,config:'[Xe]4f⁷6s²',found:'1901',use:'LEDs',fact:'Most reactive rare earth'},
    {n:64,s:'Gd',name:'Gadolinium',cat:'lanthanide',color:'#FFCC80',mass:157.25,p:6,g:3,config:'[Xe]4f⁷5d¹6s²',found:'1880',use:'MRI',fact:'Johan Gadolin'},
    {n:65,s:'Tb',name:'Terbium',cat:'lanthanide',color:'#80DEEA',mass:158.93,p:6,g:3,config:'[Xe]4f⁹6s²',found:'1843',use:'Phosphors',fact:'Ytterby'},
    {n:66,s:'Dy',name:'Dysprosium',cat:'lanthanide',color:'#B2FF59',mass:162.50,p:6,g:3,config:'[Xe]4f¹⁰6s²',found:'1886',use:'Magnets',fact:'Hard to get'},
    {n:67,s:'Ho',name:'Holmium',cat:'lanthanide',color:'#69F0AE',mass:164.93,p:6,g:3,config:'[Xe]4f¹¹6s²',found:'1878',use:'Lasers',fact:'Stockholm'},
    {n:68,s:'Er',name:'Erbium',cat:'lanthanide',color:'#EA80FC',mass:167.26,p:6,g:3,config:'[Xe]4f¹²6s²',found:'1843',use:'Fiber optics',fact:'Ytterby'},
    {n:69,s:'Tm',name:'Thulium',cat:'lanthanide',color:'#7C4DFF',mass:168.93,p:6,g:3,config:'[Xe]4f¹³6s²',found:'1879',use:'X-ray',fact:'Thule'},
    {n:70,s:'Yb',name:'Ytterbium',cat:'lanthanide',color:'#448AFF',mass:173.05,p:6,g:3,config:'[Xe]4f¹⁴6s²',found:'1878',use:'Lasers',fact:'4th Ytterby'},
    {n:71,s:'Lu',name:'Lutetium',cat:'lanthanide',color:'#18FFFF',mass:174.97,p:6,g:3,config:'[Xe]4f¹⁴5d¹6s²',found:'1907',use:'PET scans',fact:'Paris'},
    {n:72,s:'Hf',name:'Hafnium',cat:'transition',color:'#B0BEC5',mass:178.49,p:6,g:4,config:'[Xe]4f¹⁴5d²6s²',found:'1923',use:'Nuclear',fact:'Copenhagen'},
    {n:73,s:'Ta',name:'Tantalum',cat:'transition',color:'#90A4AE',mass:180.95,p:6,g:5,config:'[Xe]4f¹⁴5d³6s²',found:'1802',use:'Implants',fact:'Tantalus'},
    {n:74,s:'W',name:'Tungsten',cat:'transition',color:'#78909C',mass:183.84,p:6,g:6,config:'[Xe]4f¹⁴5d⁴6s²',found:'1783',use:'Light bulbs',fact:'Highest melting point'},
    {n:75,s:'Re',name:'Rhenium',cat:'transition',color:'#B0BEC5',mass:186.21,p:6,g:7,config:'[Xe]4f¹⁴5d⁵6s²',found:'1925',use:'Jet engines',fact:'Rarest'},
    {n:76,s:'Os',name:'Osmium',cat:'transition',color:'#455A64',mass:190.23,p:6,g:8,config:'[Xe]4f¹⁴5d⁶6s²',found:'1803',use:'Pen tips',fact:'Densest'},
    {n:77,s:'Ir',name:'Iridium',cat:'transition',color:'#CFD8DC',mass:192.22,p:6,g:9,config:'[Xe]4f¹⁴5d⁷6s²',found:'1803',use:'Spark plugs',fact:'Most corrosion resistant'},
    {n:78,s:'Pt',name:'Platinum',cat:'transition',color:'#ECEFF1',mass:195.08,p:6,g:10,config:'[Xe]4f¹⁴5d⁹6s¹',found:'1735',use:'Jewelry',fact:'Little silver'},
    {n:79,s:'Au',name:'Gold',cat:'transition',color:'#FFD700',mass:196.97,p:6,g:11,config:'[Xe]4f¹⁴5d¹⁰6s¹',found:'Ancient',use:'Jewelry',fact:'Most malleable'},
    {n:80,s:'Hg',name:'Mercury',cat:'transition',color:'#B0BEC5',mass:200.59,p:6,g:12,config:'[Xe]4f¹⁴5d¹⁰6s²',found:'Ancient',use:'Thermometers',fact:'Liquid metal'},
    {n:81,s:'Tl',name:'Thallium',cat:'post',color:'#808080',mass:204.38,p:6,g:13,config:'[Xe]4f¹⁴5d¹⁰6s²6p¹',found:'1861',use:'Electronics',fact:'Green shoot'},
    {n:82,s:'Pb',name:'Lead',cat:'post',color:'#616161',mass:207.2,p:6,g:14,config:'[Xe]4f¹⁴5d¹⁰6s²6p²',found:'Ancient',use:'Batteries',fact:'Dense, soft'},
    {n:83,s:'Bi',name:'Bismuth',cat:'post',color:'#E040FB',mass:208.98,p:6,g:15,config:'[Xe]4f¹⁴5d¹⁰6s²6p³',found:'Ancient',use:'Medicine',fact:'Rainbow crystals'},
    {n:84,s:'Po',name:'Polonium',cat:'metalloid',color:'#CE93D8',mass:209,p:6,g:16,config:'[Xe]4f¹⁴5d¹⁰6s²6p⁴',found:'1898',use:'Heat source',fact:'Poland'},
    {n:85,s:'At',name:'Astatine',cat:'halogen',color:'#000000',mass:210,p:6,g:17,config:'[Xe]4f¹⁴5d¹⁰6s²6p⁵',found:'1940',use:'Research',fact:'Rarest'},
    {n:86,s:'Rn',name:'Radon',cat:'noble',color:'#FF5252',mass:222,p:6,g:18,config:'[Xe]4f¹⁴5d¹⁰6s²6p⁶',found:'1900',use:'Cancer therapy',fact:'Radioactive gas'},
    {n:87,s:'Fr',name:'Francium',cat:'alkali',color:'#FF8A65',mass:223,p:7,g:1,config:'[Rn]7s¹',found:'1939',use:'Research',fact:'2nd rarest'},
    {n:88,s:'Ra',name:'Radium',cat:'alkaline',color:'#C5E1A5',mass:226,p:7,g:2,config:'[Rn]7s²',found:'1898',use:'Glow paint',fact:'Glows blue'},
    {n:89,s:'Ac',name:'Actinium',cat:'actinide',color:'#80CBC4',mass:227,p:7,g:3,config:'[Rn]6d¹7s²',found:'1899',use:'Neutron source',fact:'Glows blue'},
    {n:90,s:'Th',name:'Thorium',cat:'actinide',color:'#FFCC80',mass:232.04,p:7,g:3,config:'[Rn]6d²7s²',found:'1829',use:'Nuclear fuel',fact:'Thor god'},
    {n:91,s:'Pa',name:'Protactinium',cat:'actinide',color:'#BCAAA4',mass:231.04,p:7,g:3,config:'[Rn]5f²6d¹7s²',found:'1913',use:'Research',fact:'Parent of actinium'},
    {n:92,s:'U',name:'Uranium',cat:'actinide',color:'#81C784',mass:238.03,p:7,g:3,config:'[Rn]5f³6d¹7s²',found:'1789',use:'Nuclear',fact:'Uranus planet'},
    {n:93,s:'Np',name:'Neptunium',cat:'actinide',color:'#4DD0E1',mass:237,p:7,g:3,config:'[Rn]5f⁴6d¹7s²',found:'1940',use:'Research',fact:'1st transuranium'},
    {n:94,s:'Pu',name:'Plutonium',cat:'actinide',color:'#CE93D8',mass:244,p:7,g:3,config:'[Rn]5f⁶7s²',found:'1940',use:'Nuclear weapons',fact:'Pluto'},
    {n:95,s:'Am',name:'Americium',cat:'actinide',color:'#90CAF9',mass:243,p:7,g:3,config:'[Rn]5f⁷7s²',found:'1944',use:'Smoke detectors',fact:'Americas'},
    {n:96,s:'Cm',name:'Curium',cat:'actinide',color:'#80DEEA',mass:247,p:7,g:3,config:'[Rn]5f⁷6d¹7s²',found:'1944',use:'Spacecraft',fact:'Curies'},
    {n:97,s:'Bk',name:'Berkelium',cat:'actinide',color:'#B2FF59',mass:247,p:7,g:3,config:'[Rn]5f⁹7s²',found:'1949',use:'Research',fact:'Berkeley'},
    {n:98,s:'Cf',name:'Californium',cat:'actinide',color:'#FF5722',mass:251,p:7,g:3,config:'[Rn]5f¹⁰7s²',found:'1950',use:'Cancer treatment',fact:'California'},
    {n:99,s:'Es',name:'Einsteinium',cat:'actinide',color:'#9C27B0',mass:252,p:7,g:3,config:'[Rn]5f¹¹7s²',found:'1952',use:'Research',fact:'Einstein'},
    {n:100,s:'Fm',name:'Fermium',cat:'actinide',color:'#4CAF50',mass:257,p:7,g:3,config:'[Rn]5f¹²7s²',found:'1952',use:'Research',fact:'Fermi'},
    {n:101,s:'Md',name:'Mendelevium',cat:'actinide',color:'#E91E63',mass:258,p:7,g:3,config:'[Rn]5f¹³7s²',found:'1955',use:'Research',fact:'Mendeleev'},
    {n:102,s:'No',name:'Nobelium',cat:'actinide',color:'#2196F3',mass:259,p:7,g:3,config:'[Rn]5f¹⁴7s²',found:'1958',use:'Research',fact:'Nobel'},
    {n:103,s:'Lr',name:'Lawrencium',cat:'actinide',color:'#FF9800',mass:266,p:7,g:3,config:'[Rn]5f¹⁴7p¹7s²',found:'1961',use:'Research',fact:'Lawrence'},
    {n:104,s:'Rf',name:'Rutherfordium',cat:'transition',color:'#FFC107',mass:267,p:7,g:4,config:'[Rn]5f¹⁴6d²7s²',found:'1964',use:'Research',fact:'Rutherford'},
    {n:105,s:'Db',name:'Dubnium',cat:'transition',color:'#00BCD4',mass:268,p:7,g:5,config:'[Rn]5f¹⁴6d³7s²',found:'1967',use:'Research',fact:'Dubna'},
    {n:106,s:'Sg',name:'Seaborgium',cat:'transition',color:'#673AB7',mass:269,p:7,g:6,config:'[Rn]5f¹⁴6d⁴7s²',found:'1974',use:'Research',fact:'Seaborg'},
    {n:107,s:'Bh',name:'Bohrium',cat:'transition',color:'#9C27B0',mass:270,p:7,g:7,config:'[Rn]5f¹⁴6d⁵7s²',found:'1981',use:'Research',fact:'Bohr'},
    {n:108,s:'Hs',name:'Hassium',cat:'transition',color:'#795548',mass:269,p:7,g:8,config:'[Rn]5f¹⁴6d⁶7s²',found:'1984',use:'Research',fact:'Hesse'},
    {n:109,s:'Mt',name:'Meitnerium',cat:'transition',color:'#607D8B',mass:278,p:7,g:9,config:'[Rn]5f¹⁴6d⁷7s²',found:'1982',use:'Research',fact:'Meitner'},
    {n:110,s:'Ds',name:'Darmstadtium',cat:'transition',color:'#8BC34A',mass:281,p:7,g:10,config:'[Rn]5f¹⁴6d⁸7s²',found:'1994',use:'Research',fact:'Darmstadt'},
    {n:111,s:'Rg',name:'Roentgenium',cat:'transition',color:'#FF5722',mass:282,p:7,g:11,config:'[Rn]5f¹⁴6d⁹7s²',found:'1994',use:'Research',fact:'Röntgen'},
    {n:112,s:'Cn',name:'Copernicium',cat:'transition',color:'#03A9F4',mass:285,p:7,g:12,config:'[Rn]5f¹⁴6d¹⁰7s²',found:'1996',use:'Research',fact:'Copernicus'},
    {n:113,s:'Nh',name:'Nihonium',cat:'post',color:'#E91E63',mass:286,p:7,g:13,config:'[Rn]5f¹⁴6d¹⁰7s²7p¹',found:'2004',use:'Research',fact:'Japan'},
    {n:114,s:'Fl',name:'Flerovium',cat:'post',color:'#9E9E9E',mass:289,p:7,g:14,config:'[Rn]5f¹⁴6d¹⁰7s²7p²',found:'1998',use:'Research',fact:'Flerov'},
    {n:115,s:'Mc',name:'Moscovium',cat:'post',color:'#673AB7',mass:290,p:7,g:15,config:'[Rn]5f¹⁴6d¹⁰7s²7p³',found:'2003',use:'Research',fact:'Moscow'},
    {n:116,s:'Lv',name:'Livermorium',cat:'post',color:'#4CAF50',mass:293,p:7,g:16,config:'[Rn]5f¹⁴6d¹⁰7s²7p⁴',found:'2000',use:'Research',fact:'Livermore'},
    {n:117,s:'Ts',name:'Tennessine',cat:'halogen',color:'#FF9800',mass:294,p:7,g:17,config:'[Rn]5f¹⁴6d¹⁰7s²7p⁵',found:'2010',use:'Research',fact:'Tennessee'},
    {n:118,s:'Og',name:'Oganesson',cat:'noble',color:'#F44336',mass:294,p:7,g:18,config:'[Rn]5f¹⁴6d¹⁰7s²7p⁶',found:'2002',use:'Research',fact:'Oganessian'}
];

const PLANETS = [
    {name:'Sun',r:2.5,dist:0,speed:0,rot:0.001,col:'#FDB813',glow:'#FFA500',info:'Star at center, 99.86% of system mass'},
    {name:'Mercury',r:0.3,dist:5,speed:4.1,rot:0.005,col:'#8C8C8C',info:'Smallest, no atmosphere, -180°C to 430°C'},
    {name:'Venus',r:0.6,dist:7,speed:1.6,rot:-0.002,col:'#E6C87A',info:'Hottest planet 465°C, retrograde rotation'},
    {name:'Earth',r:0.65,dist:10,speed:1,rot:0.02,col:'#6B93D6',info:'Only planet with life, 71% water',moons:[{d:1.5,s:0.18,sp:0.8}]},
    {name:'Mars',r:0.4,dist:13,speed:0.53,rot:0.018,col:'#C1440E',info:'Red planet, largest volcano',moons:[{d:1,s:0.06,sp:2.5},{d:1.5,s:0.04,sp:1.5}]},
    {name:'Jupiter',r:1.8,dist:19,speed:0.084,rot:0.04,col:'#C88B3A',info:'Largest, Great Red Spot, 95 moons',moons:[{d:2.5,s:0.12,sp:3},{d:3,s:0.1,sp:2.2},{d:3.5,s:0.15,sp:1.6},{d:4.2,s:0.12,sp:1.2}]},
    {name:'Saturn',r:1.5,dist:27,speed:0.034,rot:0.038,col:'#EAD6B8',info:'Famous rings, would float on water',rings:true,ringCol:'#C9B896',moons:[{d:3,s:0.15,sp:1.5}]},
    {name:'Uranus',r:1.1,dist:35,speed:0.012,rot:-0.03,col:'#B5E3E3',info:'Tilted 98°, coldest -224°C',rings:true,ringCol:'#87CEEB',moons:[{d:1.8,s:0.05,sp:2}]},
    {name:'Neptune',r:1.05,dist:42,speed:0.006,rot:0.032,col:'#4B70DD',info:'Windiest 2100 km/h, farthest',moons:[{d:1.8,s:0.1,sp:-1}]}
];

const VIRUSES = [
    {name:'Coronavirus',col:'#E53935',info:'COVID-19, RNA virus, spike proteins'},
    {name:'Influenza',col:'#43A047',info:'Flu virus, RNA, H/N proteins'},
    {name:'HIV',col:'#7B1FA2',info:'Retrovirus, attacks immune system'},
    {name:'Bacteriophage',col:'#1E88E5',info:'Infects bacteria, has tail'},
    {name:'Ebola',col:'#5D4037',info:'Hemorrhagic fever, thread-like'},
    {name:'Adenovirus',col:'#FF5722',info:'Respiratory, used in vaccines'},
    {name:'Herpes',col:'#E91E63',info:'DNA virus, lifelong infection'},
    {name:'Zika',col:'#00BCD4',info:'Mosquito-borne, birth defects'}
];

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', () => {
    initStars();
    initNav();
});

function initStars() {
    const canvas = document.getElementById('stars');
    const ctx = canvas.getContext('2d');
    let stars = [];
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        stars = [];
        for(let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5,
                a: Math.random()
            });
        }
    }
    
    resize();
    window.addEventListener('resize', resize);
    
    function draw() {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${s.a * 0.8})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

function initNav() {
    document.querySelectorAll('.nav-item, .mobile-item').forEach(btn => {
        btn.addEventListener('click', () => {
            showPage(btn.dataset.page);
            document.getElementById('mobileNav').classList.remove('open');
            document.getElementById('overlay').classList.remove('show');
        });
    });
    
    document.getElementById('menuBtn').addEventListener('click', () => {
        document.getElementById('mobileNav').classList.add('open');
        document.getElementById('overlay').classList.add('show');
    });
    
    document.getElementById('mobileClose').addEventListener('click', () => {
        document.getElementById('mobileNav').classList.remove('open');
        document.getElementById('overlay').classList.remove('show');
    });
    
    document.getElementById('overlay').addEventListener('click', () => {
        document.getElementById('mobileNav').classList.remove('open');
        document.getElementById('overlay').classList.remove('show');
    });
}

function showPage(page) {
    if(animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item, .mobile-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(page).classList.add('active');
    document.querySelectorAll(`[data-page="${page}"]`).forEach(n => n.classList.add('active'));
    
    currentPage = page;
    simTime = 0;
    isPaused = false;
    
    const inits = {
        elements: initElements,
        solar: initSolar,
        dna: initDNA,
        cell: initCell,
        physics: initPhysics,
        robot: initRobot,
        game: initGame
    };
    
    if(inits[page]) inits[page]();
}

function goHome() {
    showPage('home');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function closeInfo(id) {
    document.getElementById(id).style.display = 'none';
}

// ================== SCENE HELPER ==================
function createScene(containerId) {
    const container = document.getElementById(containerId);
    if(!container) return null;
    
    container.innerHTML = '';
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    window.addEventListener('resize', () => {
        if(container && camera && renderer) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
    
    return { scene, camera, renderer, controls };
}

function addStarfield(s) {
    const geo = new THREE.BufferGeometry();
    const pos = [];
    for(let i = 0; i < 1000; i++) {
        pos.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    s.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 })));
}

// ================== ELEMENTS ==================
function initElements() {
    const setup = createScene('elementsScene');
    if(!setup) return;
    
    camera.position.set(0, 8, 25);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    scene.add(new THREE.PointLight(0xffffff, 1, new THREE.Vector3(20, 20, 20)));
    
    addStarfield(scene);
    
    const group = new THREE.Group();
    scene.add(group);
    
    let rotateSpeed = 0.5;
    let activeCat = 'all';
    
    function createTable() {
        while(group.children.length) group.remove(group.children[0]);
        
        ELEMENTS.forEach(el => {
            if(activeCat !== 'all') {
                const catMap = {
                    'alkali': 'alkali', 'alkaline': 'alkaline', 'transition': 'transition',
                    'post': 'post', 'metalloid': 'metalloid', 'nonmetal': 'nonmetal',
                    'halogen': 'halogen', 'noble': 'noble', 'lanthanide': 'lanthanide', 'actinide': 'actinide'
                };
                if(el.cat !== catMap[activeCat]) return;
            }
            
            let x, y;
            const p = el.p, g = el.g;
            
            // Lanthanides row
            if(el.n >= 57 && el.n <= 71) {
                x = (el.n - 54) * 1.2 - 6;
                y = -7;
            }
            // Actinides row
            else if(el.n >= 89 && el.n <= 103) {
                x = (el.n - 86) * 1.2 - 6;
                y = -8.5;
            }
            // Normal position
            else {
                x = (g - 1) * 1.2 - 10;
                y = -(p - 1) * 1.2 + 3;
            }
            
            // Tile
            const tile = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 0.1),
                new THREE.MeshStandardMaterial({ color: el.color, emissive: el.color, emissiveIntensity: 0.2 })
            );
            tile.position.set(x, y, 0);
            tile.userData = el;
            group.add(tile);
            
            // Label sprite
            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px Inter'; ctx.textAlign = 'center';
            ctx.fillText(el.s, 64, 50);
            ctx.font = '18px Inter';
            ctx.fillText(el.n.toString(), 64, 75);
            ctx.font = '14px Inter';
            ctx.fillText(el.name.substring(0,8), 64, 95);
            
            const tex = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
            sprite.position.set(x, y, 0.1);
            sprite.scale.set(1, 1, 1);
            group.add(sprite);
        });
    }
    
    createTable();
    
    // Search
    document.getElementById('elementSearch').oninput = (e) => {
        const q = e.target.value.toLowerCase();
        group.children.forEach(c => {
            if(c.userData && c.userData.name) {
                c.visible = c.userData.name.toLowerCase().includes(q) || 
                           c.userData.s.toLowerCase().includes(q) ||
                           c.userData.n.toString().includes(q);
            }
        });
    };
    
    // Categories
    document.querySelectorAll('.cat').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.cat').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCat = btn.dataset.cat;
            createTable();
        };
    });
    
    // Rotation
    document.getElementById('elemRotate').oninput = (e) => {
        rotateSpeed = parseFloat(e.target.value);
    };
    
    // Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    renderer.domElement.addEventListener('click', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(group.children.filter(c => c.type === 'Mesh'));
        
        if(hits.length > 0) {
            const el = hits[0].object.userData;
            document.getElementById('elemInfoContent').innerHTML = `
                <h4 style="color:${el.color}">${el.s} - ${el.name}</h4>
                <div class="info-row"><span>Number</span><span>${el.n}</span></div>
                <div class="info-row"><span>Mass</span><span>${el.mass} u</span></div>
                <div class="info-row"><span>Category</span><span>${el.cat}</span></div>
                <div class="info-row"><span>Period</span><span>${el.p}</span></div>
                <div class="info-row"><span>Group</span><span>${el.g}</span></div>
                <div class="info-row"><span>Config</span><span>${el.config}</span></div>
                <p><strong>Found:</strong> ${el.found}</p>
                <p><strong>Uses:</strong> ${el.use}</p>
                <p><strong>Fact:</strong> ${el.fact}</p>
            `;
            document.getElementById('elemInfo').style.display = 'block';
        }
    });
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        group.rotation.y += 0.003 * rotateSpeed;
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('Click elements for details');
}

// ================== SOLAR ==================
function initSolar() {
    const setup = createScene('solarScene');
    if(!setup) return;
    
    camera.position.set(0, 40, 60);
    scene.add(new THREE.AmbientLight(0x333333));
    addStarfield(scene);
    
    const solarGroup = new THREE.Group();
    scene.add(solarGroup);
    
    let orbitSpeed = 1;
    let planetScale = 1;
    let showOrbits = true;
    let showLabels = true;
    let paused = false;
    let time = 0;
    
    const planets = [];
    const orbitLines = [];
    const labels = [];
    
    PLANETS.forEach((p, i) => {
        // Sun/Planet
        const geo = new THREE.SphereGeometry(p.r, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
            color: p.col,
            emissive: p.glow || p.col,
            emissiveIntensity: p.glow ? 0.5 : 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { ...p, angle: Math.random() * Math.PI * 2, i };
        
        if(p.dist === 0) {
            // Sun light
            const light = new THREE.PointLight(0xFFA500, 2, 200);
            mesh.add(light);
        }
        
        planets.push(mesh);
        solarGroup.add(mesh);
        
        // Orbit
        if(p.dist > 0) {
            const orbitGeo = new THREE.BufferGeometry();
            const pts = [];
            for(let j = 0; j <= 64; j++) {
                const a = (j / 64) * Math.PI * 2;
                pts.push(Math.cos(a) * p.dist, 0, Math.sin(a) * p.dist);
            }
            orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            const orbit = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.4 }));
            orbitLines.push(orbit);
            solarGroup.add(orbit);
        }
        
        // Rings
        if(p.rings) {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(p.r * 1.4, p.r * 2.2, 64),
                new THREE.MeshBasicMaterial({ color: p.ringCol, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
            );
            ring.rotation.x = Math.PI / 2;
            mesh.add(ring);
        }
        
        // Moons
        if(p.moons) {
            p.moons.forEach(m => {
                const moon = new THREE.Mesh(
                    new THREE.SphereGeometry(m.s, 16, 16),
                    new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
                );
                moon.userData = { moonDist: m.d, moonSpeed: m.sp, moonAngle: Math.random() * Math.PI * 2 };
                mesh.add(moon);
            });
        }
        
        // Label
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Inter'; ctx.textAlign = 'center';
        ctx.fillText(p.name, 128, 40);
        
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
        sprite.scale.set(3, 0.75, 1);
        sprite.position.y = p.r + 1;
        mesh.add(sprite);
        labels.push(sprite);
    });
    
    // Controls
    document.getElementById('solarPlay').onclick = () => {
        paused = !paused;
        document.getElementById('solarPlay').textContent = paused ? '▶ Play' : '⏸ Pause';
    };
    
    document.getElementById('solarReset').onclick = () => {
        time = 0;
        camera.position.set(0, 40, 60);
        controls.reset();
    };
    
    document.getElementById('solarSpeed').oninput = (e) => orbitSpeed = parseFloat(e.target.value);
    document.getElementById('solarScale').oninput = (e) => {
        planetScale = parseFloat(e.target.value);
        planets.forEach(p => p.scale.setScalar(planetScale));
    };
    
    document.getElementById('showOrbits').onchange = (e) => {
        showOrbits = e.target.checked;
        orbitLines.forEach(o => o.visible = showOrbits);
    };
    
    document.getElementById('showLabels').onchange = (e) => {
        showLabels = e.target.checked;
        labels.forEach(l => l.visible = showLabels);
    };
    
    // Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    renderer.domElement.addEventListener('click', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(planets);
        
        if(hits.length > 0) {
            const p = hits[0].object.userData;
            document.getElementById('solarInfoContent').innerHTML = `
                <h4>${p.name}</h4>
                <p>${p.info}</p>
            `;
            document.getElementById('solarInfo').style.display = 'block';
        }
    });
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        if(!paused) {
            time += 0.01 * orbitSpeed;
            
            planets.forEach(p => {
                if(p.userData.dist > 0) {
                    p.userData.angle += p.userData.speed * 0.002 * orbitSpeed;
                    p.position.x = Math.cos(p.userData.angle) * p.userData.dist;
                    p.position.z = Math.sin(p.userData.angle) * p.userData.dist;
                }
                p.rotation.y += p.userData.rot;
                
                // Update moons
                p.children.forEach(c => {
                    if(c.userData && c.userData.moonDist) {
                        c.userData.moonAngle += c.userData.moonSpeed * 0.02 * orbitSpeed;
                        c.position.x = Math.cos(c.userData.moonAngle) * c.userData.moonDist;
                        c.position.z = Math.sin(c.userData.moonAngle) * c.userData.moonDist;
                    }
                });
            });
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('Click planets for info');
}

// ================== DNA ==================
function initDNA() {
    const setup = createScene('dnaScene');
    if(!setup) return;
    
    camera.position.set(0, 0, 18);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    scene.add(new THREE.PointLight(0xffffff, 1, new THREE.Vector3(10, 10, 10)));
    addStarfield(scene);
    
    const dnaGroup = new THREE.Group();
    scene.add(dnaGroup);
    
    let speed = 1;
    let turns = 2;
    let mode = 'dna';
    let anim = 'rotate';
    let animTime = 0;
    let replicateProgress = 0;
    let transcribePhase = 0;
    
    const baseColors = { A: '#ff6b6b', T: '#4ecdc4', G: '#45b7d1', C: '#ffa726', U: '#ab47bc' };
    const bases = ['A', 'T', 'G', 'C'];
    
    function createHelix() {
        while(dnaGroup.children.length) dnaGroup.remove(dnaGroup.children[0]);
        
        const height = 14;
        const radius = 2;
        const count = turns * 12;
        
        // Store positions for animation
        dnaGroup.userData.spheres = [];
        dnaGroup.userData.connectors = [];
        
        for(let i = 0; i < count; i++) {
            const t = i / count;
            const angle = t * Math.PI * 4 * turns;
            const y = (t - 0.5) * height;
            
            const x1 = Math.cos(angle) * radius;
            const z1 = Math.sin(angle) * radius;
            const x2 = Math.cos(angle + Math.PI) * radius;
            const z2 = Math.sin(angle + Math.PI) * radius;
            
            const b1 = bases[Math.floor(Math.random() * 4)];
            const b2 = b1 === 'A' ? 'T' : b1 === 'T' ? 'A' : b1 === 'G' ? 'C' : 'G';
            
            // Strand 1
            const s1 = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 12, 12),
                new THREE.MeshStandardMaterial({ color: baseColors[b1], emissive: baseColors[b1], emissiveIntensity: 0.3 })
            );
            s1.position.set(x1, y, z1);
            s1.userData = { baseY: y, baseX: x1, baseZ: z1, strand: 1, index: i };
            dnaGroup.add(s1);
            dnaGroup.userData.spheres.push(s1);
            
            // Strand 2
            if(mode !== 'rna') {
                const s2 = new THREE.Mesh(
                    new THREE.SphereGeometry(0.25, 12, 12),
                    new THREE.MeshStandardMaterial({ color: baseColors[b2], emissive: baseColors[b2], emissiveIntensity: 0.3 })
                );
                s2.position.set(x2, y, z2);
                s2.userData = { baseY: y, baseX: x2, baseZ: z2, strand: 2, index: i };
                dnaGroup.add(s2);
                dnaGroup.userData.spheres.push(s2);
                
                // Connector
                const conn = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.03, 0.03, radius * 2, 6),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
                );
                conn.position.set(0, y, 0);
                conn.rotation.z = Math.PI / 2;
                conn.rotation.y = angle;
                conn.userData = { baseY: y, index: i };
                dnaGroup.add(conn);
                dnaGroup.userData.connectors.push(conn);
            }
        }
        
        // Backbone
        const curve1 = new THREE.CatmullRomCurve3(
            Array.from({ length: 100 }, (_, i) => {
                const tt = i / 99;
                const ang = tt * Math.PI * 4 * turns;
                return new THREE.Vector3(Math.cos(ang) * radius, (tt - 0.5) * height, Math.sin(ang) * radius);
            })
        );
        dnaGroup.add(new THREE.Mesh(
            new THREE.TubeGeometry(curve1, 200, 0.08, 8, false),
            new THREE.MeshStandardMaterial({ color: 0x9b59b6, transparent: true, opacity: 0.5 })
        ));
        
        if(mode !== 'rna') {
            const curve2 = new THREE.CatmullRomCurve3(
                Array.from({ length: 100 }, (_, i) => {
                    const tt = i / 99;
                    const ang = tt * Math.PI * 4 * turns + Math.PI;
                    return new THREE.Vector3(Math.cos(ang) * radius, (tt - 0.5) * height, Math.sin(ang) * radius);
                })
            );
            dnaGroup.add(new THREE.Mesh(
                new THREE.TubeGeometry(curve2, 200, 0.08, 8, false),
                new THREE.MeshStandardMaterial({ color: 0x9b59b6, transparent: true, opacity: 0.5 })
            ));
        }
    }
    
    createHelix();
    
    // Mode buttons
    document.querySelectorAll('.mode').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.mode').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mode = btn.dataset.mode;
            createHelix();
        };
    });
    
    // Animation buttons
    document.querySelectorAll('.anim').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.anim').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            anim = btn.dataset.anim;
            replicateProgress = 0;
            transcribePhase = 0;
            
            const status = document.getElementById('dnaStatus');
            if(anim === 'replicate') {
                status.style.display = 'block';
                status.textContent = '🧬 DNA Replicating... Unzipping double helix';
            } else if(anim === 'transcribe') {
                status.style.display = 'block';
                status.textContent = '🧬 Transcribing DNA to mRNA...';
            } else {
                status.style.display = 'none';
            }
        };
    });
    
    document.getElementById('dnaSpeed').oninput = (e) => speed = parseFloat(e.target.value);
    document.getElementById('dnaTurns').oninput = (e) => { turns = parseInt(e.target.value); createHelix(); };
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        animTime += 0.016;
        
        if(anim === 'rotate') {
            dnaGroup.rotation.y += 0.008 * speed;
        } else if(anim === 'replicate') {
            dnaGroup.rotation.y += 0.005 * speed;
            replicateProgress += 0.003 * speed;
            
            // Animate strand separation
            if(dnaGroup.userData.spheres) {
                dnaGroup.userData.spheres.forEach(s => {
                    if(s.userData.strand === 2) {
                        const offset = Math.min(replicateProgress, 1) * 2;
                        s.position.x = s.userData.baseX + (s.userData.baseX > 0 ? offset : -offset);
                    }
                });
            }
            
            // Fade connectors
            if(dnaGroup.userData.connectors) {
                dnaGroup.userData.connectors.forEach(c => {
                    c.material.opacity = Math.max(0.35 - replicateProgress * 0.4, 0);
                });
            }
            
            // Update status
            if(replicateProgress < 1) {
                document.getElementById('dnaStatus').textContent = `🧬 Replicating... ${Math.floor(replicateProgress * 100)}% complete`;
            } else {
                document.getElementById('dnaStatus').textContent = '🧬 Replication Complete! Two identical DNA molecules formed';
            }
            
            if(replicateProgress > 1.5) replicateProgress = 0;
            
        } else if(anim === 'transcribe') {
            dnaGroup.rotation.y += 0.005 * speed;
            transcribePhase += 0.02 * speed;
            
            // Animate base pair "bubbling" as mRNA is synthesized
            if(dnaGroup.userData.spheres) {
                dnaGroup.userData.spheres.forEach(s => {
                    const wave = Math.sin(transcribePhase + s.userData.index * 0.3);
                    s.position.y = s.userData.baseY + wave * 0.2;
                    s.scale.setScalar(1 + wave * 0.1);
                });
            }
            
            document.getElementById('dnaStatus').textContent = `🧬 Transcribing... mRNA strand being synthesized`;
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('Select animation mode');
}

// ================== CELL ==================
function initCell() {
    const setup = createScene('cellScene');
    if(!setup) return;
    
    camera.position.set(0, 0, 15);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    scene.add(new THREE.PointLight(0xffffff, 1, new THREE.Vector3(10, 10, 10)));
    addStarfield(scene);
    
    const cellGroup = new THREE.Group();
    scene.add(cellGroup);
    
    let speed = 0.5;
    let cellType = 'animal';
    let animType = 'rotate';
    let mitosisPhase = 0;
    let explodeAmount = 0;
    
    function createAnimalCell() {
        while(cellGroup.children.length) cellGroup.remove(cellGroup.children[0]);
        
        // Membrane
        const mem = new THREE.Mesh(
            new THREE.SphereGeometry(4, 48, 48),
            new THREE.MeshStandardMaterial({ color: 0x7CB342, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
        );
        mem.userData = { name: 'Cell Membrane', info: 'Controls what enters/exits cell' };
        cellGroup.add(mem);
        
        // Nucleus
        const nuc = new THREE.Mesh(
            new THREE.SphereGeometry(1.3, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x5C6BC0, emissive: 0x3949AB, emissiveIntensity: 0.2 })
        );
        nuc.userData = { name: 'Nucleus', info: 'Contains DNA, controls cell', basePos: new THREE.Vector3(0, 0, 0) };
        cellGroup.add(nuc);
        
        // Mitochondria
        for(let i = 0; i < 8; i++) {
            const mito = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.25, 0.7, 12),
                new THREE.MeshStandardMaterial({ color: 0xFF7043, emissive: 0xFF5722, emissiveIntensity: 0.15 })
            );
            mito.position.set((Math.random()-0.5)*5, (Math.random()-0.5)*5, (Math.random()-0.5)*5);
            mito.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
            mito.userData = { name: 'Mitochondria', info: 'Powerhouse, makes ATP', basePos: mito.position.clone() };
            cellGroup.add(mito);
        }
        
        // ER
        const erPts = [];
        for(let i = 0; i < 50; i++) {
            const a = i * 0.25;
            const r = 2.5 + Math.sin(i * 0.4) * 0.4;
            erPts.push(new THREE.Vector3(Math.cos(a) * r, (i - 25) * 0.12, Math.sin(a) * r));
        }
        const er = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.CatmullRomCurve3(erPts), 80, 0.1, 8, false),
            new THREE.MeshStandardMaterial({ color: 0x42A5F5, transparent: true, opacity: 0.6 })
        );
        er.userData = { name: 'ER', info: 'Makes proteins/lipids' };
        cellGroup.add(er);
        
        // Golgi
        for(let i = 0; i < 5; i++) {
            const golgi = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16),
                new THREE.MeshStandardMaterial({ color: 0xAB47BC, transparent: true, opacity: 0.7 })
            );
            golgi.position.set(2.5, 0.2 * i - 0.4, 0.5);
            golgi.rotation.x = Math.PI / 2;
            golgi.userData = { name: 'Golgi', info: 'Packages proteins', basePos: golgi.position.clone() };
            cellGroup.add(golgi);
        }
        
        // Ribosomes
        for(let i = 0; i < 40; i++) {
            const ribo = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xFFFF00 })
            );
            ribo.position.set((Math.random()-0.5)*6, (Math.random()-0.5)*6, (Math.random()-0.5)*6);
            ribo.userData = { name: 'Ribosome', info: 'Makes proteins', basePos: ribo.position.clone() };
            cellGroup.add(ribo);
        }
    }
    
    function createPlantCell() {
        while(cellGroup.children.length) cellGroup.remove(cellGroup.children[0]);
        
        // Cell wall
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(9, 9, 9),
            new THREE.MeshStandardMaterial({ color: 0x8D6E63, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
        );
        wall.userData = { name: 'Cell Wall', info: 'Rigid structure' };
        cellGroup.add(wall);
        
        // Membrane
        cellGroup.add(new THREE.Mesh(
            new THREE.SphereGeometry(4, 48, 48),
            new THREE.MeshStandardMaterial({ color: 0x7CB342, transparent: true, opacity: 0.2 })
        ));
        
        // Vacuole
        const vac = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x81D4FA, transparent: true, opacity: 0.4 })
        );
        vac.userData = { name: 'Vacuole', info: 'Stores water', basePos: new THREE.Vector3(0, 0, 0) };
        cellGroup.add(vac);
        
        // Nucleus
        const nuc = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x5C6BC0, emissive: 0x3949AB, emissiveIntensity: 0.15 })
        );
        nuc.position.set(-2.5, 0, 0);
        nuc.userData = { name: 'Nucleus', info: 'Contains DNA', basePos: new THREE.Vector3(-2.5, 0, 0) };
        cellGroup.add(nuc);
        
        // Chloroplasts
        for(let i = 0; i < 12; i++) {
            const chl = new THREE.Mesh(
                new THREE.SphereGeometry(0.35, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x4CAF50, emissive: 0x2E7D32, emissiveIntensity: 0.2 })
            );
            chl.geometry.scale(1.6, 1, 1);
            chl.position.set((Math.random()-0.5)*6, (Math.random()-0.5)*6, (Math.random()-0.5)*6);
            chl.rotation.y = Math.random() * Math.PI;
            chl.userData = { name: 'Chloroplast', info: 'Photosynthesis', basePos: chl.position.clone() };
            cellGroup.add(chl);
        }
    }
    
    function createBacteria() {
        while(cellGroup.children.length) cellGroup.remove(cellGroup.children[0]);
        
        const types = [
            { name: 'Coccus', shape: 'sphere', color: 0xE53935, info: 'Spherical bacteria' },
            { name: 'Bacillus', shape: 'rod', color: 0x43A047, info: 'Rod bacteria' },
            { name: 'Spirillum', shape: 'spiral', color: 0x1E88E5, info: 'Spiral bacteria' }
        ];
        
        types.forEach((type, t) => {
            for(let i = 0; i < 4; i++) {
                let mesh;
                if(type.shape === 'sphere') {
                    mesh = new THREE.Mesh(
                        new THREE.SphereGeometry(0.5, 24, 24),
                        new THREE.MeshStandardMaterial({ color: type.color, emissive: type.color, emissiveIntensity: 0.15 })
                    );
                } else if(type.shape === 'rod') {
                    mesh = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.3, 0.3, 1, 12),
                        new THREE.MeshStandardMaterial({ color: type.color, emissive: type.color, emissiveIntensity: 0.15 })
                    );
                    mesh.rotation.z = Math.PI / 2;
                } else {
                    const pts = [];
                    for(let s = 0; s < 30; s++) {
                        const a = s * 0.4;
                        pts.push(new THREE.Vector3(Math.cos(a) * 0.3, s * 0.06 - 0.9, Math.sin(a) * 0.3));
                    }
                    mesh = new THREE.Mesh(
                        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 50, 0.15, 8, false),
                        new THREE.MeshStandardMaterial({ color: type.color, emissive: type.color, emissiveIntensity: 0.15 })
                    );
                }
                mesh.position.set((t - 1) * 3.5, (i - 1.5) * 1.8, 0);
                mesh.userData = { name: type.name, info: type.info };
                cellGroup.add(mesh);
            }
        });
    }
    
    function createVirus() {
        while(cellGroup.children.length) cellGroup.remove(cellGroup.children[0]);
        
        VIRUSES.forEach((v, idx) => {
            const group = new THREE.Group();
            
            // Body
            const body = new THREE.Mesh(
                new THREE.SphereGeometry(1, 32, 32),
                new THREE.MeshStandardMaterial({ color: v.col, emissive: v.col, emissiveIntensity: 0.15, transparent: true, opacity: 0.85 })
            );
            group.add(body);
            
            // Spikes
            for(let i = 0; i < 30; i++) {
                const spike = new THREE.Mesh(
                    new THREE.ConeGeometry(0.06, 0.4, 6),
                    new THREE.MeshStandardMaterial({ color: v.col })
                );
                const phi = Math.acos(2 * Math.random() - 1);
                const theta = Math.random() * Math.PI * 2;
                spike.position.set(
                    Math.sin(phi) * Math.cos(theta) * 1.2,
                    Math.sin(phi) * Math.sin(theta) * 1.2,
                    Math.cos(phi) * 1.2
                );
                spike.lookAt(0, 0, 0);
                spike.rotateX(Math.PI);
                group.add(spike);
            }
            
            // RNA inside
            const rna = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.5 })
            );
            group.add(rna);
            
            const col = idx % 4;
            const row = Math.floor(idx / 4);
            group.position.set((col - 1.5) * 3, (row - 0.5) * 3.5, 0);
            group.userData = { name: v.name, info: v.info };
            cellGroup.add(group);
        });
    }
    
    createAnimalCell();
    
    // Type buttons
    document.querySelectorAll('.ctype').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.ctype').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cellType = btn.dataset.type;
            mitosisPhase = 0;
            explodeAmount = 0;
            
            const fns = { animal: createAnimalCell, plant: createPlantCell, bacteria: createBacteria, virus: createVirus };
            fns[cellType]();
        };
    });
    
    // Animation buttons
    document.querySelectorAll('.canim').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.canim').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            animType = btn.dataset.anim;
            mitosisPhase = 0;
            explodeAmount = 0;
        };
    });
    
    document.getElementById('cellSpeed').oninput = (e) => speed = parseFloat(e.target.value);
    
    // Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    renderer.domElement.addEventListener('click', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(cellGroup.children, true);
        
        if(hits.length > 0) {
            let obj = hits[0].object;
            while(obj && !obj.userData.name) obj = obj.parent;
            if(obj && obj.userData.name) {
                document.getElementById('cellInfoContent').innerHTML = `
                    <h4>${obj.userData.name}</h4>
                    <p>${obj.userData.info}</p>
                `;
                document.getElementById('cellInfo').style.display = 'block';
            }
        }
    });
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        if(animType === 'rotate') {
            cellGroup.rotation.y += 0.005 * speed;
        } else if(animType === 'mitosis') {
            cellGroup.rotation.y += 0.003 * speed;
            mitosisPhase += 0.01 * speed;
            
            // Animate mitosis: cell stretches, pinches, divides
            const phase = mitosisPhase % 4;
            
            if(phase < 1) {
                // Prophase - cell elongates
                cellGroup.scale.set(1 + phase * 0.3, 1, 1);
            } else if(phase < 2) {
                // Metaphase - prepare division
                cellGroup.scale.set(1.3, 1, 1);
            } else if(phase < 3) {
                // Anaphase - pinch in middle
                const pinch = (phase - 2) * 0.3;
                cellGroup.children.forEach(c => {
                    if(c.userData && c.userData.basePos) {
                        const dir = c.userData.basePos.x > 0 ? 1 : -1;
                        c.position.x = c.userData.basePos.x + dir * pinch * 2;
                    }
                });
            } else {
                // Telophase - reset
                cellGroup.scale.set(1, 1, 1);
                cellGroup.children.forEach(c => {
                    if(c.userData && c.userData.basePos) {
                        c.position.copy(c.userData.basePos);
                    }
                });
            }
        } else if(animType === 'explode') {
            cellGroup.rotation.y += 0.003 * speed;
            explodeAmount = Math.min(explodeAmount + 0.005 * speed, 1);
            
            cellGroup.children.forEach(c => {
                if(c.userData && c.userData.basePos) {
                    const dir = c.userData.basePos.clone().normalize();
                    c.position.copy(c.userData.basePos).add(dir.multiplyScalar(explodeAmount * 2));
                }
            });
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('Click organelles for info');
}

// ================== PHYSICS ==================
function initPhysics() {
    const setup = createScene('physicsScene');
    if(!setup) return;
    
    camera.position.set(0, 5, 15);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    scene.add(new THREE.PointLight(0xffffff, 1, new THREE.Vector3(10, 10, 10)));
    addStarfield(scene);
    
    const physGroup = new THREE.Group();
    scene.add(physGroup);
    
    let currentExp = 'slit';
    let simSpeed = 1;
    let paused = false;
    let particles = [];
    let hitPoints = [];
    
    function createDoubleSlit() {
        while(physGroup.children.length) physGroup.remove(physGroup.children[0]);
        particles = [];
        hitPoints = [];
        
        // Source
        const source = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        source.position.set(-8, 0, 0);
        physGroup.add(source);
        
        // Barrier with slits
        const barrierMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 1), barrierMat);
        b1.position.set(0, 2.5, 0);
        physGroup.add(b1);
        
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 1), barrierMat);
        b2.position.set(0, -2.5, 0);
        physGroup.add(b2);
        
        const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 1), barrierMat);
        b3.position.set(0, 0, 0);
        physGroup.add(b3);
        
        // Detection screen
        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(0.3, 8),
            new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide })
        );
        screen.position.set(8, 0, 0);
        screen.rotation.y = Math.PI / 2;
        physGroup.add(screen);
        
        // Particle pool
        for(let i = 0; i < 100; i++) {
            const p = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 })
            );
            p.userData = {
                x: -8,
                y: (Math.random() - 0.5) * 0.5,
                vx: 0.12,
                vy: 0,
                slit: Math.random() > 0.5 ? 1 : -1,
                active: true
            };
            p.position.set(p.userData.x, p.userData.y, 0);
            p.visible = false;
            physGroup.add(p);
            particles.push(p);
        }
        
        showPhysInfo('Double Slit', 'Wave-particle duality. Particles create interference pattern like waves.');
    }
    
    function createRutherford() {
        while(physGroup.children.length) physGroup.remove(physGroup.children[0]);
        particles = [];
        
        // Gold nucleus
        const nucleus = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffa500, emissiveIntensity: 0.5 })
        );
        physGroup.add(nucleus);
        
        // Glow
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.2 })
        );
        physGroup.add(glow);
        
        // Alpha particles
        for(let i = 0; i < 40; i++) {
            const p = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 12, 12),
                new THREE.MeshBasicMaterial({ color: 0xffff00 })
            );
            p.userData = {
                x: -12,
                y: (Math.random() - 0.5) * 8,
                vx: 0.1,
                vy: 0,
                active: true
            };
            p.position.set(p.userData.x, p.userData.y, 0);
            physGroup.add(p);
            particles.push(p);
        }
        
        showPhysInfo('Rutherford', 'Discovered nucleus. Most alpha particles pass through, some deflect.');
    }
    
    function createPendulum() {
        while(physGroup.children.length) physGroup.remove(physGroup.children[0]);
        particles = [];
        
        // Pivot
        const pivot = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        pivot.position.set(0, 5, 0);
        physGroup.add(pivot);
        
        // Rod
        const rod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 5, 8),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
        );
        rod.position.set(0, 2.5, 0);
        rod.userData = { isRod: true };
        physGroup.add(rod);
        
        // Bob
        const bob = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.3 })
        );
        bob.position.set(3, 0, 0);
        bob.userData = { isBob: true };
        physGroup.add(bob);
        
        showPhysInfo('Pendulum', 'Simple harmonic motion. Period depends on length, not mass.');
    }
    
    function createWave() {
        while(physGroup.children.length) physGroup.remove(physGroup.children[0]);
        particles = [];
        
        for(let i = 0; i < 80; i++) {
            const p = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.3 })
            );
            p.position.x = (i - 40) * 0.25;
            p.userData = { index: i, baseY: 0 };
            physGroup.add(p);
            particles.push(p);
        }
        
        showPhysInfo('Wave', 'Transverse wave. Energy travels, particles oscillate.');
    }
    
    function createGravity() {
        while(physGroup.children.length) physGroup.remove(physGroup.children[0]);
        particles = [];
        
        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        physGroup.add(ground);
        
        const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xffa726];
        
        for(let i = 0; i < 4; i++) {
            const p = new THREE.Mesh(
                new THREE.SphereGeometry(0.4 + i * 0.1, 16, 16),
                new THREE.MeshStandardMaterial({ color: colors[i] })
            );
            p.position.set((i - 1.5) * 3, 5, 0);
            p.userData = { vy: 0, mass: i + 1, isBall: true };
            physGroup.add(p);
            particles.push(p);
        }
        
        showPhysInfo('Gravity', 'All objects fall at same rate in vacuum (ignoring air resistance).');
    }
    
    function createOptics() {
        while(physGroup.children.length) physGroup.remove(physGroup.children[0]);
        particles = [];
        
        // Prism
        const prism = new THREE.Mesh(
            new THREE.ConeGeometry(2, 3, 3),
            new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        prism.rotation.z = Math.PI;
        physGroup.add(prism);
        
        // Light source
        const source = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        source.position.set(-6, 0, 0);
        physGroup.add(source);
        
        // White beam
        const beam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 4.5, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
        );
        beam.position.set(-3.75, 0, 0);
        beam.rotation.z = Math.PI / 2;
        physGroup.add(beam);
        
        // Spectrum rays
        const colors = [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff];
        colors.forEach((col, i) => {
            const ray = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 6, 8),
                new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 })
            );
            ray.position.set(4.5, (i - 2.5) * 0.6, 0);
            ray.rotation.z = Math.PI / 2 + (i - 2.5) * 0.12;
            physGroup.add(ray);
        });
        
        showPhysInfo('Optics', 'Dispersion: white light separates into spectrum due to wavelength-dependent refraction.');
    }
    
    function showPhysInfo(title, desc) {
        document.getElementById('physInfoContent').innerHTML = `<h4>${title}</h4><p>${desc}</p>`;
        document.getElementById('physInfo').style.display = 'block';
    }
    
    createDoubleSlit();
    
    // Experiment buttons
    document.querySelectorAll('.exp').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.exp').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentExp = btn.dataset.exp;
            simTime = 0;
            
            const fns = { slit: createDoubleSlit, rutherford: createRutherford, pendulum: createPendulum, wave: createWave, gravity: createGravity, optics: createOptics };
            fns[currentExp]();
        };
    });
    
    document.getElementById('physPlay').onclick = () => {
        paused = !paused;
        document.getElementById('physPlay').textContent = paused ? '▶ Play' : '⏸ Pause';
    };
    
    document.getElementById('physReset').onclick = () => {
        simTime = 0;
        const fns = { slit: createDoubleSlit, rutherford: createRutherford, pendulum: createPendulum, wave: createWave, gravity: createGravity, optics: createOptics };
        fns[currentExp]();
    };
    
    document.getElementById('physSpeed').oninput = (e) => simSpeed = parseFloat(e.target.value);
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        if(!paused) {
            simTime += 0.016 * simSpeed;
            
            if(currentExp === 'slit') {
                // Emit particles
                particles.forEach((p, i) => {
                    if(!p.visible && Math.random() < 0.02) {
                        p.visible = true;
                        p.userData.x = -8;
                        p.userData.y = (Math.random() - 0.5) * 0.5;
                        p.userData.slit = Math.random() > 0.5 ? 1 : -1;
                        p.userData.active = true;
                    }
                    
                    if(p.visible && p.userData.active) {
                        p.userData.x += p.userData.vx * simSpeed;
                        
                        // Go through slit
                        if(p.userData.x > -0.5 && p.userData.x < 0.5) {
                            p.userData.y += (p.userData.slit * 0.8 - p.userData.y) * 0.1;
                        }
                        
                        // Interference pattern at screen
                        if(p.userData.x > 5) {
                            const angle = p.userData.slit === 1 ? 0.3 : -0.3;
                            p.userData.y += Math.sin(simTime * 5 + p.userData.y * 3) * 0.02;
                        }
                        
                        p.position.set(p.userData.x, p.userData.y, 0);
                        
                        // Hit screen - create interference pattern
                        if(p.userData.x > 8) {
                            p.userData.active = false;
                            p.visible = false;
                            
                            // Create hit point showing interference
                            const hit = new THREE.Mesh(
                                new THREE.SphereGeometry(0.05, 6, 6),
                                new THREE.MeshBasicMaterial({ color: 0x00ffff })
                            );
                            hit.position.set(7.9, p.userData.y, 0);
                            physGroup.add(hit);
                            hitPoints.push(hit);
                            
                            if(hitPoints.length > 200) {
                                physGroup.remove(hitPoints.shift());
                            }
                        }
                    }
                });
            } else if(currentExp === 'rutherford') {
                particles.forEach(p => {
                    if(p.userData.active) {
                        const dx = p.position.x;
                        const dy = p.position.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if(dist < 3) {
                            // Coulomb repulsion
                            const force = 1 / (dist * dist) * 0.8;
                            p.userData.vy += (dy / dist) * force;
                        }
                        
                        p.userData.x += p.userData.vx * simSpeed;
                        p.userData.y += p.userData.vy * simSpeed;
                        p.position.set(p.userData.x, p.userData.y, 0);
                        
                        if(p.userData.x > 12 || Math.abs(p.userData.y) > 10) {
                            p.userData.x = -12;
                            p.userData.y = (Math.random() - 0.5) * 8;
                            p.userData.vy = 0;
                        }
                    }
                });
            } else if(currentExp === 'pendulum') {
                const angle = Math.sin(simTime * 2) * 0.7;
                
                physGroup.children.forEach(c => {
                    if(c.userData) {
                        if(c.userData.isRod) {
                            c.rotation.z = angle;
                            c.position.set(Math.sin(angle) * 2.5, 5 - Math.cos(angle) * 2.5, 0);
                        }
                        if(c.userData.isBob) {
                            c.position.set(Math.sin(angle) * 5, 5 - Math.cos(angle) * 5, 0);
                        }
                    }
                });
            } else if(currentExp === 'wave') {
                particles.forEach(p => {
                    p.position.y = Math.sin(p.userData.index * 0.3 + simTime * 4) * 1.5;
                });
            } else if(currentExp === 'gravity') {
                particles.forEach(p => {
                    if(p.userData.isBall) {
                        p.userData.vy += 0.015 * simSpeed;
                        p.position.y -= p.userData.vy * simSpeed;
                        
                        if(p.position.y < -4.5) {
                            p.position.y = 5;
                            p.userData.vy = 0;
                        }
                    }
                });
            } else if(currentExp === 'optics') {
                // Animate rays
                physGroup.children.forEach((c, i) => {
                    if(c.material && c.material.opacity !== undefined && c.geometry.type === 'CylinderGeometry') {
                        c.material.opacity = 0.5 + Math.sin(simTime * 4 + i) * 0.3;
                    }
                });
            }
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('Select different experiments');
}

// ================== ROBOT ==================
function initRobot() {
    const setup = createScene('robotScene');
    if(!setup) return;
    
    camera.position.set(8, 6, 10);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    scene.add(new THREE.PointLight(0xffffff, 1, new THREE.Vector3(10, 15, 10)));
    
    // Grid
    scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222));
    
    const robotGroup = new THREE.Group();
    scene.add(robotGroup);
    
    let component = 'arm';
    let autoDemo = true;
    let demoTime = 0;
    
    let base, shoulder, upperArm, elbow, lowerArm, wrist, gripperL, gripperR;
    
    function createArm() {
        while(robotGroup.children.length) robotGroup.remove(robotGroup.children[0]);
        
        // Base platform
        const basePlat = new THREE.Mesh(
            new THREE.CylinderGeometry(1.8, 2, 0.4, 32),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        basePlat.position.y = 0.2;
        robotGroup.add(basePlat);
        
        // Base rotation
        base = new THREE.Group();
        base.position.y = 0.4;
        robotGroup.add(base);
        
        // Base cylinder
        const baseCyl = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.5, 0.8, 32),
            new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        base.add(baseCyl);
        
        // Shoulder
        shoulder = new THREE.Group();
        shoulder.position.y = 0.8;
        base.add(shoulder);
        
        const shoulderBall = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.3 })
        );
        shoulder.add(shoulderBall);
        
        // Upper arm
        upperArm = new THREE.Group();
        upperArm.position.y = 0.5;
        shoulder.add(upperArm);
        
        const upperArmMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 2.5, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        upperArmMesh.position.y = 1.25;
        upperArm.add(upperArmMesh);
        
        // Elbow
        elbow = new THREE.Group();
        elbow.position.y = 2.5;
        upperArm.add(elbow);
        
        const elbowBall = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.3 })
        );
        elbow.add(elbowBall);
        
        // Lower arm
        lowerArm = new THREE.Group();
        lowerArm.position.y = 0.4;
        elbow.add(lowerArm);
        
        const lowerArmMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 2, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        lowerArmMesh.position.y = 1;
        lowerArm.add(lowerArmMesh);
        
        // Wrist
        wrist = new THREE.Group();
        wrist.position.y = 2;
        lowerArm.add(wrist);
        
        const wristBall = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.3 })
        );
        wrist.add(wristBall);
        
        // Gripper
        const gripperBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.3, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        gripperBase.position.y = 0.3;
        wrist.add(gripperBase);
        
        gripperL = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.6, 0.2),
            new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 0.3 })
        );
        gripperL.position.set(-0.2, 0.6, 0);
        wrist.add(gripperL);
        
        gripperR = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.6, 0.2),
            new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 0.3 })
        );
        gripperR.position.set(0.2, 0.6, 0);
        wrist.add(gripperR);
    }
    
    function createMotors() {
        while(robotGroup.children.length) robotGroup.remove(robotGroup.children[0]);
        
        const motors = [
            { name: 'DC Motor', col: 0x3b82f6, info: 'Simple, reliable, variable speed', rpm: 3 },
            { name: 'Servo Motor', col: 0x22c55e, info: 'Precise position control', rpm: 2 },
            { name: 'Stepper Motor', col: 0xf59e0b, info: 'Incremental movement', rpm: 1.5 },
            { name: 'Brushless', col: 0xec4899, info: 'High efficiency', rpm: 4 }
        ];
        
        motors.forEach((m, i) => {
            const group = new THREE.Group();
            
            // Motor body
            const body = new THREE.Mesh(
                new THREE.CylinderGeometry(0.7, 0.7, 1.2, 32),
                new THREE.MeshStandardMaterial({ color: m.col, emissive: m.col, emissiveIntensity: 0.2 })
            );
            body.rotation.x = Math.PI / 2;
            group.add(body);
            
            // Shaft with visible marker for rotation
const shaftGroup = new THREE.Group();
const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
);
shaftGroup.add(shaft);

// Add a visible marker on shaft so rotation is visible
const marker = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xff4444 })
);
marker.position.set(0.2, 0, 0);
shaftGroup.add(marker);

shaftGroup.rotation.x = Math.PI / 2;
shaftGroup.position.z = 0.9;
shaftGroup.userData = { isShaft: true, rpm: m.rpm };
group.add(shaftGroup);
            
            // Mounting flange
            const flange = new THREE.Mesh(
                new THREE.CylinderGeometry(0.9, 0.9, 0.1, 32),
                new THREE.MeshStandardMaterial({ color: 0x444444 })
            );
            flange.rotation.x = Math.PI / 2;
            flange.position.z = -0.65;
            group.add(flange);
            
            // Label
            group.userData = { name: m.name, info: m.info };
            group.position.set((i - 1.5) * 3.5, 1.5, 0);
            robotGroup.add(group);
        });
    }
    
    function createSensors() {
        while(robotGroup.children.length) robotGroup.remove(robotGroup.children[0]);
        
        const sensors = [
            { name: 'Ultrasonic', col: 0x06b6d4, info: 'Distance measurement using sound', type: 'ultrasonic' },
            { name: 'IR Sensor', col: 0xef4444, info: 'Detects infrared light', type: 'ir' },
            { name: 'Camera', col: 0x6366f1, info: 'Visual perception', type: 'camera' },
            { name: 'LIDAR', col: 0x22c55e, info: 'Laser distance measurement', type: 'lidar' }
        ];
        
        sensors.forEach((s, i) => {
            const group = new THREE.Group();
            
            if(s.type === 'ultrasonic') {
                // Two eyes
                const eye = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.25, 0.25, 0.3, 16),
                    new THREE.MeshStandardMaterial({ color: s.col, emissive: s.col, emissiveIntensity: 0.3 })
                );
                eye.rotation.x = Math.PI / 2;
                eye.position.x = -0.25;
                group.add(eye);
                
                const eye2 = eye.clone();
                eye2.position.x = 0.25;
                group.add(eye2);
                
                // Base
                const base = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 0.6, 0.3),
                    new THREE.MeshStandardMaterial({ color: 0x333333 })
                );
                group.add(base);
            } else if(s.type === 'ir') {
                // LED dome
                const dome = new THREE.Mesh(
                    new THREE.SphereGeometry(0.4, 16, 16),
                    new THREE.MeshStandardMaterial({ color: s.col, emissive: s.col, emissiveIntensity: 0.5 })
                );
                group.add(dome);
                
                const base = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.5, 0.6, 0.3, 16),
                    new THREE.MeshStandardMaterial({ color: 0x333333 })
                );
                base.position.y = -0.3;
                group.add(base);
            } else if(s.type === 'camera') {
                // Camera body
                const body = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.6, 0.5),
                    new THREE.MeshStandardMaterial({ color: s.col })
                );
                group.add(body);
                
                // Lens
                const lens = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16),
                    new THREE.MeshStandardMaterial({ color: 0x111111 })
                );
                lens.rotation.x = Math.PI / 2;
                lens.position.z = 0.4;
                group.add(lens);
                
                // LED ring
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(0.2, 0.03, 8, 16),
                    new THREE.MeshBasicMaterial({ color: 0xff0000 })
                );
                ring.position.z = 0.35;
                group.add(ring);
            } else {
                // LIDAR cylinder
                const cyl = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.4, 0.4, 0.8, 32),
                    new THREE.MeshStandardMaterial({ color: s.col, emissive: s.col, emissiveIntensity: 0.2 })
                );
                group.add(cyl);
                
                // Spinning top
                const top = new THREE.Mesh(
                    new THREE.ConeGeometry(0.3, 0.4, 16),
                    new THREE.MeshStandardMaterial({ color: 0x333333 })
                );
                top.position.y = 0.6;
                top.userData = { isSpinner: true };
                group.add(top);
            }
            
            group.userData = { name: s.name, info: s.info, sensorType: s.type };
            group.position.set((i - 1.5) * 3.5, 1.5, 0);
            robotGroup.add(group);
        });
    }
    
    function createBoards() {
        while(robotGroup.children.length) robotGroup.remove(robotGroup.children[0]);
        
        const boards = [
            { name: 'Arduino', col: 0x00979d, info: 'Popular microcontroller' },
            { name: 'Raspberry Pi', col: 0xc51a4a, info: 'Single-board computer' },
            { name: 'PLC', col: 0x00875a, info: 'Industrial controller' },
            { name: 'ESP32', col: 0xe7352c, info: 'WiFi/Bluetooth MCU' }
        ];
        
        boards.forEach((b, i) => {
            const group = new THREE.Group();
            
            // PCB
            const pcb = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.15, 1.2),
                new THREE.MeshStandardMaterial({ color: b.col })
            );
            group.add(pcb);
            
            // MCU chip
            const chip = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.1, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x222222 })
            );
            chip.position.y = 0.125;
            group.add(chip);
            
            // Pins
            for(let p = 0; p < 10; p++) {
                const pin = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.2, 0.08),
                    new THREE.MeshStandardMaterial({ color: 0xffd700 })
                );
                pin.position.set((p - 4.5) * 0.18, 0.175, 0.6);
                group.add(pin);
            }
            
            // USB port
            const usb = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.15, 0.15),
                new THREE.MeshStandardMaterial({ color: 0x888888 })
            );
            usb.position.set(-0.8, 0.15, 0);
            group.add(usb);
            
            // LEDs
            const led1 = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x00ff00 })
            );
            led1.position.set(0.6, 0.12, -0.4);
            led1.userData = { isLED: true };
            group.add(led1);
            
            const led2 = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            led2.position.set(0.4, 0.12, -0.4);
            led2.userData = { isLED: true, phase: Math.PI };
            group.add(led2);
            
            group.userData = { name: b.name, info: b.info };
            group.position.set((i - 1.5) * 3.5, 1.5, 0);
            robotGroup.add(group);
        });
    }
    
    createArm();
    
    // Component buttons
    document.querySelectorAll('.comp').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.comp').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            component = btn.dataset.comp;
            
            document.getElementById('armControls').style.display = component === 'arm' ? 'block' : 'none';
            
            const fns = { arm: createArm, motor: createMotors, sensor: createSensors, board: createBoards };
            fns[component]();
        };
    });
    
    // Arm controls
    function updateArm() {
        if(component !== 'arm' || !base) return;
        
        const baseV = parseFloat(document.getElementById('baseRot').value);
        const shoulderV = parseFloat(document.getElementById('shoulderRot').value);
        const elbowV = parseFloat(document.getElementById('elbowRot').value);
        const wristV = parseFloat(document.getElementById('wristRot').value);
        const gripV = parseFloat(document.getElementById('gripRot').value);
        
        document.getElementById('baseVal').textContent = baseV + '°';
        document.getElementById('shoulderVal').textContent = shoulderV + '°';
        document.getElementById('elbowVal').textContent = elbowV + '°';
        document.getElementById('wristVal').textContent = wristV + '°';
        document.getElementById('gripVal').textContent = gripV + '%';
        
        base.rotation.y = baseV * Math.PI / 180;
        shoulder.rotation.z = shoulderV * Math.PI / 180;
        elbow.rotation.z = elbowV * Math.PI / 180;
        wrist.rotation.z = wristV * Math.PI / 180;
        
        const gripOffset = gripV / 100 * 0.3;
        gripperL.position.x = -0.15 - gripOffset;
        gripperR.position.x = 0.15 + gripOffset;
    }
    
    ['baseRot', 'shoulderRot', 'elbowRot', 'wristRot', 'gripRot'].forEach(id => {
        document.getElementById(id).oninput = updateArm;
    });
    
    document.getElementById('autoDemo').onclick = () => {
        autoDemo = !autoDemo;
        document.getElementById('autoDemo').classList.toggle('active', autoDemo);
    };
    
    document.getElementById('resetArm').onclick = () => {
        document.getElementById('baseRot').value = 0;
        document.getElementById('shoulderRot').value = 0;
        document.getElementById('elbowRot').value = 0;
        document.getElementById('wristRot').value = 0;
        document.getElementById('gripRot').value = 50;
        updateArm();
    };
    
    // Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    renderer.domElement.addEventListener('click', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(robotGroup.children, true);
        
        if(hits.length > 0) {
            let obj = hits[0].object;
            while(obj && !obj.userData.name) obj = obj.parent;
            if(obj && obj.userData.name) {
                document.getElementById('robotInfoContent').innerHTML = `
                    <h4>${obj.userData.name}</h4>
                    <p>${obj.userData.info}</p>
                `;
                document.getElementById('robotInfo').style.display = 'block';
            }
        }
    });
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        demoTime += 0.016;
        
        if(autoDemo && component === 'arm' && base) {
            base.rotation.y = Math.sin(demoTime * 0.5) * 1;
            shoulder.rotation.z = Math.sin(demoTime * 0.7) * 0.5;
            elbow.rotation.z = Math.sin(demoTime * 0.9) * 0.7;
            wrist.rotation.z = Math.sin(demoTime * 1.1) * 0.4;
            
            const gripOffset = 0.15 + Math.sin(demoTime * 2) * 0.1;
            gripperL.position.x = -gripOffset;
            gripperR.position.x = gripOffset;
        }
        
        if(component === 'motor') {
    robotGroup.children.forEach(g => {
        g.children.forEach(c => {
            if(c.userData && c.userData.isShaft) {
                // Rotate around the shaft's long axis (Y after the X rotation)
                c.rotation.y += c.userData.rpm * 0.08;
            }
        });
    });
}
        
        if(component === 'sensor') {
            robotGroup.children.forEach((g, i) => {
                g.position.y = 1.5 + Math.sin(demoTime * 2 + i) * 0.1;
                
                g.children.forEach(c => {
                    if(c.userData && c.userData.isSpinner) {
                        c.rotation.y += 0.1;
                    }
                });
            });
        }
        
        if(component === 'board') {
            robotGroup.children.forEach((g, i) => {
                g.children.forEach(c => {
                    if(c.userData && c.userData.isLED) {
                        const phase = c.userData.phase || 0;
                        const brightness = 0.5 + Math.sin(demoTime * 3 + phase) * 0.5;
                        c.material.opacity = brightness;
                    }
                });
            });
        }
        
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('Click components for info');
}

// ================== GAME ==================
let game = {
    running: false,
    score: 0,
    lives: 3,
    wave: 1,
    player: null,
    enemies: [],
    bullets: [],
    particles: [],
    keys: {},
    lastShot: 0
};

function initGame() {
    const setup = createScene('gameScene');
    if(!setup) return;
    
    camera.position.set(0, 0, 25);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    scene.add(new THREE.PointLight(0xffffff, 1, new THREE.Vector3(0, 0, 20)));
    addStarfield(scene);
    
    // Player ship
    const shipGroup = new THREE.Group();
    
    const body = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.8, 4),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.3 })
    );
    body.rotation.x = Math.PI / 2;
    shipGroup.add(body);
    
    const wing = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.1, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x60a5fa })
    );
    wing.position.z = 0.3;
    shipGroup.add(wing);
    
    const engine = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    engine.position.z = 1;
    engine.userData = { isEngine: true };
    shipGroup.add(engine);
    
    shipGroup.position.set(0, -8, 0);
    scene.add(shipGroup);
    
    game.player = shipGroup;
    game.enemies = [];
    game.bullets = [];
    game.particles = [];
    game.score = 0;
    game.lives = 3;
    game.wave = 1;
    game.running = false;
    
    updateHUD();
    
    // Controls
    document.onkeydown = (e) => {
        game.keys[e.code] = true;
        if(e.code === 'Space') e.preventDefault();
    };
    document.onkeyup = (e) => game.keys[e.code] = false;
    
    document.getElementById('startGame').onclick = () => {
        if(!game.running) {
            game.running = true;
            document.getElementById('startGame').textContent = '⏸ Pause';
            spawnWave();
        } else {
            game.running = false;
            document.getElementById('startGame').textContent = '▶ Start';
        }
    };
    
    document.getElementById('restartGame').onclick = restartGame;
    document.getElementById('difficulty').onchange = (e) => game.difficulty = e.target.value;
    
    function spawnWave() {
        const count = 5 + game.wave * 2;
        const diffMult = game.difficulty === 'hard' ? 1.5 : game.difficulty === 'easy' ? 0.6 : 1;
        
        for(let i = 0; i < count; i++) {
            const enemy = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.5, 0),
                new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff0000, emissiveIntensity: 0.3 })
            );
            enemy.position.set((Math.random() - 0.5) * 18, 12 + Math.random() * 8, 0);
            enemy.userData = {
                speed: (0.03 + Math.random() * 0.03) * diffMult,
                wobble: Math.random() * Math.PI * 2
            };
            scene.add(enemy);
            game.enemies.push(enemy);
        }
    }
    
    function fire() {
        const now = Date.now();
        const rate = game.difficulty === 'hard' ? 200 : game.difficulty === 'easy' ? 80 : 120;
        
        if(now - game.lastShot > rate && game.player) {
            game.lastShot = now;
            
            const bullet = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x00ffff })
            );
            bullet.position.copy(game.player.position);
            bullet.userData = { speed: 0.4 };
            scene.add(bullet);
            game.bullets.push(bullet);
        }
    }
    
    function explode(x, y) {
        for(let i = 0; i < 8; i++) {
            const p = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 4, 4),
                new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff6600 : 0xffff00, transparent: true })
            );
            p.position.set(x, y, 0);
            p.userData = {
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                life: 25
            };
            scene.add(p);
            game.particles.push(p);
        }
    }
    
    function updateHUD() {
        document.getElementById('score').textContent = game.score;
        document.getElementById('lives').textContent = '❤️'.repeat(game.lives);
        document.getElementById('wave').textContent = game.wave;
    }
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        if(game.running && game.player) {
            // Movement
            const speed = 0.25;
            if(game.keys['KeyW'] || game.keys['ArrowUp']) game.player.position.y += speed;
            if(game.keys['KeyS'] || game.keys['ArrowDown']) game.player.position.y -= speed;
            if(game.keys['KeyA'] || game.keys['ArrowLeft']) game.player.position.x -= speed;
            if(game.keys['KeyD'] || game.keys['ArrowRight']) game.player.position.x += speed;
            if(game.keys['Space']) fire();
            
            // Clamp
            game.player.position.x = Math.max(-10, Math.min(10, game.player.position.x));
            game.player.position.y = Math.max(-10, Math.min(10, game.player.position.y));
            
            // Engine pulse
            if(game.player.children[2] && game.player.children[2].userData.isEngine) {
                game.player.children[2].scale.setScalar(0.8 + Math.sin(Date.now() * 0.01) * 0.2);
            }
            
            // Bullets
            for(let i = game.bullets.length - 1; i >= 0; i--) {
                const b = game.bullets[i];
                b.position.y += b.userData.speed;
                
                if(b.position.y > 14) {
                    scene.remove(b);
                    game.bullets.splice(i, 1);
                    continue;
                }
                
                // Hit detection
                for(let j = game.enemies.length - 1; j >= 0; j--) {
                    if(b.position.distanceTo(game.enemies[j].position) < 0.8) {
                        explode(game.enemies[j].position.x, game.enemies[j].position.y);
                        scene.remove(b);
                        scene.remove(game.enemies[j]);
                        game.bullets.splice(i, 1);
                        game.enemies.splice(j, 1);
                        game.score += 10;
                        updateHUD();
                        
                        if(game.enemies.length === 0) {
                            game.wave++;
                            updateHUD();
                            setTimeout(spawnWave, 1000);
                        }
                        break;
                    }
                }
            }
            
            // Enemies
            for(let i = game.enemies.length - 1; i >= 0; i--) {
                const e = game.enemies[i];
                e.position.y -= e.userData.speed;
                e.position.x += Math.sin(simTime * 2 + e.userData.wobble) * 0.02;
                e.rotation.x += 0.05;
                e.rotation.y += 0.03;
                
                if(e.position.y < -14) {
                    scene.remove(e);
                    game.enemies.splice(i, 1);
                    continue;
                }
                
                // Hit player
                if(game.player.position.distanceTo(e.position) < 1) {
                    explode(e.position.x, e.position.y);
                    scene.remove(e);
                    game.enemies.splice(i, 1);
                    game.lives--;
                    updateHUD();
                    
                    if(game.lives <= 0) {
                        gameOver();
                    }
                }
            }
            
            // Particles
            for(let i = game.particles.length - 1; i >= 0; i--) {
                const p = game.particles[i];
                p.position.x += p.userData.vx;
                p.position.y += p.userData.vy;
                p.userData.life--;
                p.material.opacity = p.userData.life / 25;
                
                if(p.userData.life <= 0) {
                    scene.remove(p);
                    game.particles.splice(i, 1);
                }
            }
        }
        
        simTime += 0.016;
        renderer.render(scene, camera);
    }
    animate();
    
    showToast('WASD to move, SPACE to shoot');
}

function gameOver() {
    game.running = false;
    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('startGame').textContent = '▶ Start';
}

function restartGame() {
    game.score = 0;
    game.lives = 3;
    game.wave = 1;
    game.running = false;
    
    // Clear
    game.enemies.forEach(e => scene.remove(e));
    game.bullets.forEach(b => scene.remove(b));
    game.particles.forEach(p => scene.remove(p));
    game.enemies = [];
    game.bullets = [];
    game.particles = [];
    
    document.getElementById('gameOver').style.display = 'none';
    
    showPage('game');
}
