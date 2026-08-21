// ============================================================
// Physics Lab — 5 New Experiments
// Builders + unified update loop
// ============================================================

// ── EXP 1: DOUBLE PENDULUM (Chaos) ─────────────────────────────────────────
// Two arms pivoting from a ceiling mount.
// Physics: Lagrangian equations of motion (numerically integrated RK4-style).
// Camera: (0, 2, 20) — sees the full pendulum from front.
window.buildPendulumExp = function(group, dynControls) {
    if (dynControls) dynControls.innerHTML = `
        <h4>&#x1F3A2; Chaotic Double Pendulum</h4>
        <label class="slider-label">Arm 1 angle (deg): <input type="range" id="pend1Angle" min="-180" max="180" value="90"><span class="val-tag" id="pend1Val">90</span></label>
        <label class="slider-label">Arm 2 angle (deg): <input type="range" id="pend2Angle" min="-180" max="180" value="120"><span class="val-tag" id="pend2Val">120</span></label>
        <label class="slider-label">Damping: <input type="range" id="pendDamp" min="0" max="0.05" step="0.001" value="0.002"></label>
        <button class="btn btn-primary" onclick="window._pendReset=true">&#x21BA; Reset</button>
        <label class="slider-label">Trail length: <span class="val-tag" id="pendTrailLen">0</span></label>`;

    // Ceiling mount
    var ceilMat = new THREE.MeshStandardMaterial({color:0x64748b, metalness:0.9, roughness:0.2});
    var ceil = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 0.5), ceilMat);
    ceil.position.y = 8;
    group.add(ceil);
    // Pivot bolt
    var bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.7,16), new THREE.MeshStandardMaterial({color:0xfbbf24,metalness:1}));
    bolt.position.y = 7.65;
    group.add(bolt);

    var arm1Mat = new THREE.MeshStandardMaterial({color:0x3b82f6, metalness:0.7, roughness:0.3});
    var arm2Mat = new THREE.MeshStandardMaterial({color:0xef4444, metalness:0.7, roughness:0.3});
    var bobMat1 = new THREE.MeshStandardMaterial({color:0x60a5fa, emissive:0x3b82f6, emissiveIntensity:0.4, roughness:0.2});
    var bobMat2 = new THREE.MeshStandardMaterial({color:0xf87171, emissive:0xef4444, emissiveIntensity:0.4, roughness:0.2});

    var arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,5,16), arm1Mat);
    arm1.name = 'pendArm1';
    group.add(arm1);

    var bob1 = new THREE.Mesh(new THREE.SphereGeometry(0.45,24,24), bobMat1);
    bob1.name = 'pendBob1';
    group.add(bob1);
    bob1.add(new THREE.PointLight(0x60a5fa, 1.2, 5));

    var arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,4,16), arm2Mat);
    arm2.name = 'pendArm2';
    group.add(arm2);

    var bob2 = new THREE.Mesh(new THREE.SphereGeometry(0.38,24,24), bobMat2);
    bob2.name = 'pendBob2';
    group.add(bob2);
    bob2.add(new THREE.PointLight(0xef4444, 1.2, 5));

    // Trail (bob2 leaves glowing trace)
    var TRAIL = 600;
    var trGeo = new THREE.BufferGeometry();
    var trPos = new Float32Array(TRAIL * 3); trPos.fill(9999);
    trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3));
    var trail = new THREE.Points(trGeo, new THREE.PointsMaterial({
        color:0xf87171, size:0.08, blending:THREE.AdditiveBlending, transparent:true, opacity:0.7
    }));
    trail.name = 'pendTrail';
    group.add(trail);

    var L1=5, L2=4;
    physData.state = {
        th1: Math.PI/2, th2: 2.1,
        w1: 0, w2: 0,
        L1, L2, M1:1.2, M2:1,
        trIdx:0, g:15
    };
};

// ── EXP 2: 2D WAVE INTERFERENCE ────────────────────────────────────────────
// Top-down view of a water surface with two oscillating point sources.
// Surface deforms as sum of two circular wave equations.
// Camera: (0, 22, 0.1) — directly above looking down.
window.buildWave2DExp = function(group, dynControls) {
    if (dynControls) dynControls.innerHTML = `
        <h4>&#x1F30A; 2D Wave Interference</h4>
        <label class="slider-label">Source frequency: <input type="range" id="waveFreq" min="0.5" max="4" step="0.1" value="1.8"><span class="val-tag" id="waveFreqVal">1.8 Hz</span></label>
        <label class="slider-label">Source separation: <input type="range" id="waveSep" min="1" max="8" step="0.5" value="4"><span class="val-tag" id="waveSepVal">4</span></label>
        <label class="slider-label">Wave speed: <input type="range" id="waveSpeed" min="1" max="6" step="0.5" value="3"></label>
        <label class="slider-label">Phase difference: <input type="range" id="wavePhase" min="0" max="360" value="0"><span class="val-tag" id="wavePhaseVal">0°</span></label>`;

    // Water surface mesh (subdivided plane)
    var RES = 72;
    var geo = new THREE.PlaneGeometry(20, 20, RES-1, RES-1);
    geo.rotateX(-Math.PI / 2);
    var mat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7, metalness: 0, roughness: 0,
        transmission: 0.3, transparent: true,
        side: THREE.DoubleSide,
        wireframe: false,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'waveMesh';
    group.add(mesh);

    // Grid lines overlay
    var wGrid = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20, RES-1, RES-1),
        new THREE.MeshBasicMaterial({color:0x075985, wireframe:true, transparent:true, opacity:0.15})
    );
    wGrid.rotation.x = -Math.PI/2;
    wGrid.position.y = 0.01;
    group.add(wGrid);

    // Source markers
    [0, 1].forEach(function(i) {
        var src = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16),
            new THREE.MeshBasicMaterial({color: i===0?0xfbbf24:0x4ade80}));
        src.name = 'waveSrc' + i;
        src.position.set(i===0?-2:2, 0.3, 0);
        group.add(src);
        var gl = new THREE.PointLight(i===0?0xfbbf24:0x4ade80, 1.5, 6);
        gl.position.copy(src.position);
        group.add(gl);
    });

    physData.state = {waveT: 0, RES};
};

// ── EXP 3: PROJECTILE MOTION ────────────────────────────────────────────────
// Cannon fires a ball at angle θ. Ball follows parabolic trajectory under gravity.
// Camera: (0, 8, 30) — side view showing full arc.
window.buildProjectileExp = function(group, dynControls) {
    if (dynControls) dynControls.innerHTML = `
        <h4>&#x1F52B; Projectile Motion</h4>
        <label class="slider-label">Launch angle &#x03B8;: <input type="range" id="projAngle" min="5" max="85" value="45"><span class="val-tag" id="projAngleVal">45°</span></label>
        <label class="slider-label">Muzzle velocity v&#x2080; (m/s): <input type="range" id="projVel" min="5" max="30" value="20"><span class="val-tag" id="projVelVal">20 m/s</span></label>
        <label class="slider-label">Range: <span class="val-tag" id="projRange">—</span></label>
        <label class="slider-label">Max height: <span class="val-tag" id="projHeight">—</span></label>
        <button class="btn btn-primary" onclick="window._projFire=true">&#x1F4A5; Fire!</button>`;

    // Ground plane
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 14),
        new THREE.MeshStandardMaterial({color:0x166534, roughness:0.9}));
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -4;
    group.add(ground);

    // Cannon body
    var canGroup = new THREE.Group();
    canGroup.position.set(-12, -3.5, 0);
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 4, 32),
        new THREE.MeshStandardMaterial({color:0x1e293b, metalness:0.9, roughness:0.2}));
    barrel.name = 'canBarrel';
    canGroup.add(barrel);
    var wheel = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.22, 8, 24),
        new THREE.MeshStandardMaterial({color:0x78350f, roughness:0.8}));
    wheel.position.set(0, -0.8, 0.8); canGroup.add(wheel);
    var wheel2 = wheel.clone(); wheel2.position.z = -0.8; canGroup.add(wheel2);
    var carriage = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 1.8),
        new THREE.MeshStandardMaterial({color:0x92400e, roughness:0.8}));
    carriage.position.y = -0.9; canGroup.add(carriage);
    canGroup.name = 'cannon';
    group.add(canGroup);

    // Angle ruler arc
    var arcGeo = new THREE.BufferGeometry();
    var arcPts = [];
    for (var a=0; a<=90; a+=5) {
        var rad = a * Math.PI / 180;
        arcPts.push(new THREE.Vector3(Math.cos(rad)*2, Math.sin(rad)*2, 0));
    }
    arcGeo.setFromPoints(arcPts);
    var arc = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({color:0xfbbf24, transparent:true, opacity:0.5}));
    arc.position.set(-12, -3.5, 0);
    group.add(arc);

    // Trajectory trace
    var TPTS = 200;
    var tGeo = new THREE.BufferGeometry();
    var tPos = new Float32Array(TPTS * 3); tPos.fill(9999);
    tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
    var traceLine = new THREE.Line(tGeo, new THREE.LineBasicMaterial({color:0xfbbf24, transparent:true, opacity:0.6}));
    traceLine.name = 'projTrace';
    group.add(traceLine);

    // Projectile ball
    var ball = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16),
        new THREE.MeshStandardMaterial({color:0x64748b, metalness:0.8, roughness:0.3}));
    ball.name = 'projBall';
    ball.position.set(-12, -3, 0);
    group.add(ball);
    ball.add(new THREE.PointLight(0xfbbf24, 0.8, 3));

    // Impact marker pool
    var impGeo = new THREE.BufferGeometry();
    var impPos = new Float32Array(20 * 3); impPos.fill(9999);
    impGeo.setAttribute('position', new THREE.BufferAttribute(impPos, 3));
    var impacts = new THREE.Points(impGeo, new THREE.PointsMaterial({color:0xef4444, size:0.4}));
    impacts.name = 'projImpacts';
    group.add(impacts);

    physData.state = {
        flying: false, bx:-12, by:-3, vx:0, vy:0,
        theta:45, v0:20, g:9.8, scale:0.4,
        tIdx:0, impIdx:0, trailFill:0
    };
};

// ── EXP 4: BAR MAGNET 3D FIELD LINES ────────────────────────────────────────
// Bar magnet with accurate dipole field lines traced from north pole.
// Camera: (0, 4, 20) — 3/4 view.
window.buildMagFieldExp = function(group, dynControls) {
    if (dynControls) dynControls.innerHTML = `
        <h4>&#x1F9F2; Bar Magnet — 3D Field Lines</h4>
        <label class="slider-label">Field strength: <input type="range" id="magStrength" min="1" max="5" value="3"></label>
        <label class="slider-label">Field lines: <input type="range" id="magLines" min="6" max="24" step="2" value="16"></label>
        <label class="slider-label">Compass needle angle: <span class="val-tag" id="compassAngle">0°</span></label>`;

    // Magnet body — two halves (N=red, S=blue)
    var nMat = new THREE.MeshStandardMaterial({color:0xef4444, metalness:0.7, roughness:0.2, emissive:0xef4444, emissiveIntensity:0.15});
    var sMat = new THREE.MeshStandardMaterial({color:0x3b82f6, metalness:0.7, roughness:0.2, emissive:0x3b82f6, emissiveIntensity:0.15});

    var nHalf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 4), nMat);
    nHalf.position.set(0, 0, 2); group.add(nHalf);
    var sHalf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 4), sMat);
    sHalf.position.set(0, 0, -2); group.add(sHalf);

    // N / S labels as glowing spheres
    var nGlow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({color:0xff6666}));
    nGlow.position.set(0, 1.05, 2); group.add(nGlow);
    nGlow.add(new THREE.PointLight(0xef4444, 1.5, 6));
    var sGlow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({color:0x66aaff}));
    sGlow.position.set(0, 1.05, -2); group.add(sGlow);
    sGlow.add(new THREE.PointLight(0x3b82f6, 1.5, 6));

    // Draw dipole field lines (static geometry, regenerated when slider changes)
    function drawFieldLines(nLines) {
        // Remove old
        for (var i = group.children.length-1; i >= 0; i--) {
            if (group.children[i].name === 'fieldLine') group.remove(group.children[i]);
        }
        for (var k = 0; k < nLines; k++) {
            var phi = (k / nLines) * Math.PI * 2;
            var points = [];
            // Start near N pole, trace field
            var px = 0.3 * Math.cos(phi), py = 0.3 * Math.sin(phi), pz = 2.2;
            for (var step = 0; step < 220; step++) {
                points.push(new THREE.Vector3(px, py, pz));
                // Dipole field: B = (3(m·r̂)r̂ - m) / r³, m along +Z
                var r = Math.sqrt(px*px + py*py + pz*pz);
                if (r < 0.1 || r > 14) break;
                var r5 = r*r*r*r*r;
                var mDotR = pz; // m = (0,0,1), r̂ = (px,py,pz)/r
                var Bx = (3 * mDotR * px/r - 0) / (r5 / (r*r));
                var By = (3 * mDotR * py/r - 0) / (r5 / (r*r));
                var Bz = (3 * mDotR * pz/r - 1) / (r5 / (r*r));
                var Br = Math.sqrt(Bx*Bx+By*By+Bz*Bz);
                if (Br < 1e-9) break;
                var ds = 0.18;
                px += Bx/Br*ds; py += By/Br*ds; pz += Bz/Br*ds;
            }
            if (points.length < 2) continue;
            var fGeo = new THREE.BufferGeometry().setFromPoints(points);
            // Colour gradient: red near N, purple mid, blue near S
            var hue = k / nLines;
            var col = new THREE.Color().setHSL(0.65, 1, 0.55);
            var fl = new THREE.Line(fGeo, new THREE.LineBasicMaterial({color:col, transparent:true, opacity:0.7}));
            fl.name = 'fieldLine';
            group.add(fl);
        }
    }
    drawFieldLines(16);

    // Compass needle (small disc that rotates according to field at its position)
    var compass = new THREE.Group();
    compass.name = 'compass';
    compass.position.set(4, 0, 0);
    var needle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 12),
        new THREE.MeshStandardMaterial({color:0xfbbf24, metalness:0.8}));
    needle.rotation.z = Math.PI/2;
    compass.add(needle);
    var nTip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({color:0xef4444}));
    nTip.position.x = 0.65; compass.add(nTip);
    group.add(compass);

    physData.state = {drawFieldLines, compassAngle: 0};
};

// ── EXP 5: SPRING & SIMPLE HARMONIC MOTION ─────────────────────────────────
// Mass hanging on a spring. Damped oscillation shown with energy bar.
// Camera: (0, 0, 18) — front view.
window.buildSpringsExp = function(group, dynControls) {
    if (dynControls) dynControls.innerHTML = `
        <h4>&#x1F4CF; Spring &amp; Simple Harmonic Motion</h4>
        <label class="slider-label">Spring constant k: <input type="range" id="springK" min="1" max="20" value="8"><span class="val-tag" id="springKVal">8 N/m</span></label>
        <label class="slider-label">Mass m: <input type="range" id="springM" min="0.2" max="5" step="0.1" value="1"><span class="val-tag" id="springMVal">1 kg</span></label>
        <label class="slider-label">Damping b: <input type="range" id="springB" min="0" max="2" step="0.05" value="0.2"><span class="val-tag" id="springBVal">0.2</span></label>
        <label class="slider-label">Displacement: <span class="val-tag" id="springDisp">0 m</span></label>
        <label class="slider-label">Period T: <span class="val-tag" id="springPeriod">—</span></label>
        <button class="btn btn-primary" onclick="window._springPull=true">&#x1F4AA; Pull &amp; Release</button>`;

    // Ceiling mount
    var cMat = new THREE.MeshStandardMaterial({color:0x64748b, metalness:0.9, roughness:0.2});
    var ceiling = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 0.5), cMat);
    ceiling.position.y = 7;
    group.add(ceiling);

    // Spring (helix geometry — 24 coils)
    var COILS = 24, COIL_R = 0.5;
    var sGeo = new THREE.BufferGeometry();
    var sPts = new Float32Array((COILS * 20 + 1) * 3);
    function rebuildSpring(len) {
        var n = COILS * 20 + 1;
        for (var i = 0; i < n; i++) {
            var t = i / (n-1);
            var angle = t * COILS * Math.PI * 2;
            sPts[i*3]   = COIL_R * Math.cos(angle);
            sPts[i*3+1] = 7 - t * len;
            sPts[i*3+2] = COIL_R * Math.sin(angle);
        }
        sGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sPts), 3));
    }
    rebuildSpring(6);
    var spring = new THREE.Line(sGeo, new THREE.LineBasicMaterial({color:0x94a3b8, linewidth:2}));
    spring.name = 'springHelix';
    group.add(spring);

    // Mass block
    var mass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshStandardMaterial({color:0x3b82f6, metalness:0.6, roughness:0.3, emissive:0x1d4ed8, emissiveIntensity:0.3}));
    mass.name = 'springMass';
    mass.position.y = 7 - 6 - 0.6;
    group.add(mass);
    mass.add(new THREE.PointLight(0x3b82f6, 1, 4));

    // Energy bar (KE=green, PE=orange)
    var barBg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 8, 0.2),
        new THREE.MeshStandardMaterial({color:0x0f172a, roughness:1}));
    barBg.position.set(3.5, 3, 0); group.add(barBg);

    var keBar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.22),
        new THREE.MeshStandardMaterial({color:0x22c55e, emissive:0x22c55e, emissiveIntensity:0.5}));
    keBar.name = 'springKE'; keBar.position.set(3.5, -1, 0); group.add(keBar);
    var peBar = keBar.clone();
    peBar.name = 'springPE';
    peBar.material = new THREE.MeshStandardMaterial({color:0xf97316, emissive:0xf97316, emissiveIntensity:0.5});
    peBar.position.set(3.5, 0, 0); group.add(peBar);

    // Equilibrium marker
    var eqLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2, 0.4, 0), new THREE.Vector3(3, 0.4, 0)]),
        new THREE.LineBasicMaterial({color:0xfbbf24, transparent:true, opacity:0.4}));
    group.add(eqLine);

    // Displacement history trace
    var HIST = 300;
    var hGeo = new THREE.BufferGeometry();
    var hPos = new Float32Array(HIST * 3); hPos.fill(9999);
    hGeo.setAttribute('position', new THREE.BufferAttribute(hPos, 3));
    var histLine = new THREE.Line(hGeo, new THREE.LineBasicMaterial({color:0x60a5fa, transparent:true, opacity:0.6}));
    histLine.name = 'springHist';
    group.add(histLine);

    physData.state = {
        y: 0, v: 0,          // displacement from equilibrium, velocity
        equilib: 0.4,        // y-equilibrium position in world coords
        rebuildSpring, COILS,
        hIdx: 0
    };
    // Initial pull: 2m below equilibrium
    physData.state.y = -2;
};

// ── ANIMATION UPDATE LOOP ────────────────────────────────────────────────────
function _installPhysicsOverride() {
    if (typeof window.updatePhysicsSimulation !== 'function') return setTimeout(_installPhysicsOverride, 200);
    window._origUpdatePhysics = window.updatePhysicsSimulation;

    window.updatePhysicsSimulation = function(timeWarp) {
        var exp = window.currentExperiment;
        var scene = window.scene;
        var t = window.simTime || 0;
        var pd = window.physData;

        // ── DOUBLE PENDULUM ──────────────────────────────────
        if (exp === 'pendulum') {
            var st = pd.state;
            if (!st) return;

            if (window._pendReset) {
                window._pendReset = false;
                st.th1 = parseFloat(document.getElementById('pend1Angle')?.value || 90) * Math.PI / 180;
                st.th2 = parseFloat(document.getElementById('pend2Angle')?.value || 120) * Math.PI / 180;
                st.w1 = 0; st.w2 = 0;
                var trailPts = scene.getObjectByName('pendTrail');
                if (trailPts) trailPts.geometry.attributes.position.array.fill(9999);
            }

            var damp = parseFloat(document.getElementById('pendDamp')?.value || 0.002);
            var g = st.g, L1 = st.L1, L2 = st.L2, M1 = st.M1, M2 = st.M2;
            var dt = 0.016 * timeWarp;

            // RK4 double pendulum equations
            function deriv(th1, th2, w1, w2) {
                var d = th1 - th2;
                var denom1 = (M1 + M2) * L1 - M2 * L1 * Math.cos(d) * Math.cos(d);
                var denom2 = (L2 / L1) * denom1;
                var a1 = (M2 * L1 * w1*w1 * Math.sin(d) * Math.cos(d)
                         + M2 * g * Math.sin(th2) * Math.cos(d)
                         + M2 * L2 * w2*w2 * Math.sin(d)
                         - (M1 + M2) * g * Math.sin(th1)) / denom1;
                var a2 = (-M2 * L2 * w2*w2 * Math.sin(d) * Math.cos(d)
                         + (M1 + M2) * (g * Math.sin(th1) * Math.cos(d)
                         - L1 * w1*w1 * Math.sin(d)
                         - g * Math.sin(th2))) / denom2;
                return [w1, w2, a1 - damp*w1, a2 - damp*w2];
            }

            // Integrate (4 sub-steps per frame)
            for (var s = 0; s < 4; s++) {
                var h = dt / 4;
                var k1 = deriv(st.th1, st.th2, st.w1, st.w2);
                var k2 = deriv(st.th1+h/2*k1[0], st.th2+h/2*k1[1], st.w1+h/2*k1[2], st.w2+h/2*k1[3]);
                var k3 = deriv(st.th1+h/2*k2[0], st.th2+h/2*k2[1], st.w1+h/2*k2[2], st.w2+h/2*k2[3]);
                var k4 = deriv(st.th1+h*k3[0], st.th2+h*k3[1], st.w1+h*k3[2], st.w2+h*k3[3]);
                st.th1 += h/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);
                st.th2 += h/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);
                st.w1  += h/6*(k1[2]+2*k2[2]+2*k3[2]+k4[2]);
                st.w2  += h/6*(k1[3]+2*k2[3]+2*k3[3]+k4[3]);
            }

            // Convert to Cartesian
            var x1 =  L1 * Math.sin(st.th1);
            var y1 = -L1 * Math.cos(st.th1);
            var x2 = x1 + L2 * Math.sin(st.th2);
            var y2 = y1 - L2 * Math.cos(st.th2);
            var pivotY = 7.5;

            // Position arm1 (cylinder between pivot and bob1)
            var arm1 = scene.getObjectByName('pendArm1');
            var bob1 = scene.getObjectByName('pendBob1');
            var arm2 = scene.getObjectByName('pendArm2');
            var bob2 = scene.getObjectByName('pendBob2');
            if (!arm1 || !bob1) return;

            // Mid-points
            arm1.position.set(x1/2, pivotY + y1/2, 0);
            arm1.rotation.z = -st.th1;
            bob1.position.set(x1, pivotY + y1, 0);

            arm2.position.set(x1 + (x2-x1)/2, pivotY + y1 + (y2-y1)/2, 0);
            arm2.rotation.z = -st.th2;
            bob2.position.set(x2, pivotY + y2, 0);

            // Trail
            var tr = scene.getObjectByName('pendTrail');
            if (tr) {
                var ta = tr.geometry.attributes.position.array;
                var idx = st.trIdx % (ta.length/3);
                ta[idx*3]=x2; ta[idx*3+1]=pivotY+y2; ta[idx*3+2]=0;
                tr.geometry.attributes.position.needsUpdate = true;
                st.trIdx++;
                var tlEl = document.getElementById('pendTrailLen');
                if (tlEl) tlEl.textContent = Math.min(st.trIdx, ta.length/3);
            }

        // ── 2D WAVE INTERFERENCE ─────────────────────────────
        } else if (exp === 'wave2d') {
            var st = pd.state;
            if (!st) return;
            var dt = 0.016 * timeWarp;
            st.waveT += dt;

            var freq  = parseFloat(document.getElementById('waveFreq')?.value || 1.8);
            var sep   = parseFloat(document.getElementById('waveSep')?.value || 4);
            var spd   = parseFloat(document.getElementById('waveSpeed')?.value || 3);
            var phase = parseFloat(document.getElementById('wavePhase')?.value || 0) * Math.PI / 180;

            var fEl = document.getElementById('waveFreqVal'); if(fEl) fEl.textContent = freq.toFixed(1)+' Hz';
            var sEl = document.getElementById('waveSepVal');  if(sEl) sEl.textContent = sep.toFixed(1);
            var pEl = document.getElementById('wavePhaseVal'); if(pEl) pEl.textContent = Math.round(parseFloat(document.getElementById('wavePhase')?.value||0))+'°';

            var lambda = spd / freq;
            var k = 2 * Math.PI / lambda;
            var omega = 2 * Math.PI * freq;
            var x1s = -sep/2, x2s = sep/2;

            // Update mesh vertices
            var mesh = scene.getObjectByName('waveMesh');
            if (!mesh) return;
            var pos = mesh.geometry.attributes.position.array;
            var RES = st.RES;
            for (var vi = 0; vi < RES * RES; vi++) {
                var xi = pos[vi*3];
                var zi = pos[vi*3+2];
                var r1 = Math.sqrt((xi-x1s)*(xi-x1s) + zi*zi);
                var r2 = Math.sqrt((xi-x2s)*(xi-x2s) + zi*zi);
                var amp = 0.6;
                var y = amp * Math.sin(k*r1 - omega*st.waveT) / Math.max(1, r1*0.3)
                      + amp * Math.sin(k*r2 - omega*st.waveT + phase) / Math.max(1, r2*0.3);
                pos[vi*3+1] = y;
            }
            mesh.geometry.attributes.position.needsUpdate = true;
            mesh.geometry.computeVertexNormals();

            // Update source positions
            var s0 = scene.getObjectByName('waveSrc0'), s1 = scene.getObjectByName('waveSrc1');
            if (s0) s0.position.set(-sep/2, 0.3 + 0.15*Math.sin(omega*st.waveT), 0);
            if (s1) s1.position.set( sep/2, 0.3 + 0.15*Math.sin(omega*st.waveT + phase), 0);

        // ── PROJECTILE MOTION ────────────────────────────────
        } else if (exp === 'projectile') {
            var st = pd.state;
            if (!st) return;
            var dt = 0.016 * timeWarp;

            var theta = parseFloat(document.getElementById('projAngle')?.value || 45);
            var v0    = parseFloat(document.getElementById('projVel')?.value || 20);
            var aEl   = document.getElementById('projAngleVal'); if(aEl) aEl.textContent = theta + '°';
            var vEl   = document.getElementById('projVelVal');   if(vEl) vEl.textContent = v0 + ' m/s';

            // Update cannon barrel rotation to match angle
            var cannon = scene.getObjectByName('cannon');
            if (cannon) {
                var barrel = cannon.getObjectByName('canBarrel');
                if (barrel) barrel.rotation.z = (theta - 90) * Math.PI / 180;
            }

            // Show range/height prediction
            var rad = theta * Math.PI / 180;
            var range = (v0*v0 * Math.sin(2*rad) / st.g) * st.scale;
            var maxH  = (v0*v0 * Math.sin(rad)*Math.sin(rad) / (2*st.g)) * st.scale;
            var rEl = document.getElementById('projRange'); if(rEl) rEl.textContent = (range/st.scale).toFixed(1)+' m';
            var hEl2 = document.getElementById('projHeight'); if(hEl2) hEl2.textContent = (maxH/st.scale).toFixed(1)+' m';

            if (window._projFire) {
                window._projFire = false;
                st.flying = true;
                st.bx = -12; st.by = -3;
                st.vx = v0 * Math.cos(rad) * st.scale;
                st.vy = v0 * Math.sin(rad) * st.scale;
                st.trailFill = 0;
                // Clear trace
                var tr = scene.getObjectByName('projTrace');
                if (tr) tr.geometry.attributes.position.array.fill(9999), tr.geometry.attributes.position.needsUpdate = true;
            }

            if (st.flying) {
                st.vx += 0;
                st.vy -= st.g * st.scale * dt;
                st.bx += st.vx * dt;
                st.by += st.vy * dt;

                var ball = scene.getObjectByName('projBall');
                if (ball) ball.position.set(st.bx, st.by, 0);

                // Trail
                var tr = scene.getObjectByName('projTrace');
                if (tr) {
                    var ta = tr.geometry.attributes.position.array;
                    var idx = st.trailFill % (ta.length/3);
                    ta[idx*3]=st.bx; ta[idx*3+1]=st.by; ta[idx*3+2]=0;
                    tr.geometry.attributes.position.needsUpdate = true;
                    st.trailFill++;
                }

                // Ground hit
                if (st.by <= -4) {
                    st.flying = false;
                    var imp = scene.getObjectByName('projImpacts');
                    if (imp) {
                        var ia = imp.geometry.attributes.position.array;
                        var ii = st.impIdx % (ia.length/3);
                        ia[ii*3]=st.bx; ia[ii*3+1]=-3.8; ia[ii*3+2]=0;
                        imp.geometry.attributes.position.needsUpdate = true;
                        st.impIdx++;
                    }
                }
            }

        // ── BAR MAGNET FIELD LINES ───────────────────────────
        } else if (exp === 'magfield') {
            var st = pd.state;
            if (!st) return;

            // Redraw if line count changes
            var nLines = parseInt(document.getElementById('magLines')?.value || 16);
            if (nLines !== st._lastLines) {
                st._lastLines = nLines;
                st.drawFieldLines(nLines);
            }

            // Compass: compute dipole field at compass position (4, 0, 0)
            var cx=4, cy=0, cz=0;
            var r = Math.sqrt(cx*cx + cy*cy + cz*cz);
            var mDotR = cz; // m along Z
            var Bx = (3*mDotR*cx/r) / (r*r*r*r*r / (r*r));
            var Bz = (3*mDotR*cz/r - 1) / (r*r*r*r*r / (r*r));
            var compassAngle = Math.atan2(Bx, Bz) * 180 / Math.PI;
            var comp = scene.getObjectByName('compass');
            if (comp) comp.rotation.y = Math.atan2(Bx, Bz);
            var cEl = document.getElementById('compassAngle');
            if (cEl) cEl.textContent = compassAngle.toFixed(1) + '°';

            // Pulse glow on magnet poles
            var str = parseFloat(document.getElementById('magStrength')?.value || 3);
            scene.traverse(function(obj) {
                if (obj.isPointLight && obj.parent && (obj.parent.name === 'nGlow' || obj.parent.name === 'sGlow')) {
                    obj.intensity = str * (0.8 + 0.2 * Math.sin(t * 3));
                }
            });

        // ── SPRING SHM ───────────────────────────────────────
        } else if (exp === 'springs') {
            var st = pd.state;
            if (!st) return;
            var dt = 0.016 * timeWarp;

            var k = parseFloat(document.getElementById('springK')?.value || 8);
            var m = parseFloat(document.getElementById('springM')?.value || 1);
            var b = parseFloat(document.getElementById('springB')?.value || 0.2);

            var kEl = document.getElementById('springKVal'); if(kEl) kEl.textContent = k+' N/m';
            var mEl = document.getElementById('springMVal'); if(mEl) mEl.textContent = m+' kg';
            var bEl = document.getElementById('springBVal'); if(bEl) bEl.textContent = b;

            var T = 2 * Math.PI * Math.sqrt(m / k);
            var pEl = document.getElementById('springPeriod'); if(pEl) pEl.textContent = T.toFixed(2)+' s';

            if (window._springPull) {
                window._springPull = false;
                st.y = -2.5; st.v = 0;
            }

            // SHM equation: m*a = -k*y - b*v
            for (var s2 = 0; s2 < 4; s2++) {
                var h2 = dt / 4;
                var a = (-k * st.y - b * st.v) / m;
                st.v += a * h2;
                st.y += st.v * h2;
            }

            var worldY = st.equilib + st.y;
            var mass = scene.getObjectByName('springMass');
            if (mass) mass.position.y = worldY - 0.6;

            // Rebuild spring helix to match current length
            var springLen = 7 - worldY;
            st.rebuildSpring(Math.max(1, springLen));
            var sObj = scene.getObjectByName('springHelix');
            if (sObj) sObj.geometry.attributes.position.needsUpdate = true;

            // Update energy bars
            var KE = 0.5 * m * st.v * st.v;
            var PE = 0.5 * k * st.y * st.y;
            var maxE = Math.max(KE + PE, 0.01);
            var keBar = scene.getObjectByName('springKE');
            var peBar = scene.getObjectByName('springPE');
            if (keBar) { keBar.scale.y = Math.max(0.01, KE/maxE * 6); keBar.position.y = -1 + KE/maxE * 3; }
            if (peBar) { peBar.scale.y = Math.max(0.01, PE/maxE * 6); peBar.position.y = 2 + PE/maxE * 3; }

            var dEl = document.getElementById('springDisp');
            if (dEl) dEl.textContent = st.y.toFixed(3)+' m';

            // History trace
            var hist = scene.getObjectByName('springHist');
            if (hist) {
                var ha = hist.geometry.attributes.position.array;
                var hi = st.hIdx % (ha.length/3);
                ha[hi*3]   = -5 + (st.hIdx % (ha.length/3)) * (8/(ha.length/3));
                ha[hi*3+1] = st.y * 0.8;
                ha[hi*3+2] = 0;
                hist.geometry.attributes.position.needsUpdate = true;
                st.hIdx++;
            }

        } else {
            if (window._origUpdatePhysics) window._origUpdatePhysics(timeWarp);
        }
    };
    console.log('[PhysicsLab] 5 new experiments installed.');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _installPhysicsOverride);
else setTimeout(_installPhysicsOverride, 300);
console.log('[PhysicsLab] Ready.');

