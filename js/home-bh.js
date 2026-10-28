/* ============================================================
   COSMOS MAGAZINE — home-bh.js (Gargantua Black Hole & Light Strands)
   Pure Three.js r128 + GSAP. No build step, no Node.js dependencies.
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     SECTION A: Config & Article Data
     ============================================================ */

  var MOB = window.innerWidth < 760 || /Mobi|Android/i.test(navigator.userAgent);
  var RM  = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  var Q = MOB ? 'low' : 'high';
  var QS = {
    low:  { steps: 75,  scale: 0.65, noise: 2 },
    med:  { steps: 125, scale: 0.85, noise: 3 },
    high: { steps: 175, scale: 1.00, noise: 4 }
  };

  var STATE = 0; // 0 = Home (Gargantua), 1 = Light Strands, 2 = Horizon (Diving)
  var currentBH = 'sgr-a-star';

  var ARTICLES = [
    { slug:'galaxies-filaments', title:'How galaxies grow filaments of hot gas',
      cat:'News', catColor:'#c8a96e',
      summary:'Cosmic-web filaments of hot ionised gas connect galaxy clusters across millions of light-years.',
      atlasId: null },
    { slug:'atmosphere-glows', title:'Earth from orbit: why our atmosphere glows',
      cat:'News', catColor:'#c8a96e',
      summary:'A thin luminous veil surrounds our planet — airglow painted by photochemistry high above.',
      atlasId:'earth' },
    { slug:'solar-cycles', title:'Solar cycles explained, from spots to storms',
      cat:'News', catColor:'#c8a96e',
      summary:'Every eleven years the Sun swings from quiet to stormy, driving space weather across the solar system.',
      atlasId:'sun' },
    { slug:'dark-adapt', title:'Give your eyes 20 minutes to dark-adapt',
      cat:'Observing', catColor:'#a0c8d8',
      summary:'Cone-to-rod transition takes 20 minutes — one bright light resets the clock completely.',
      atlasId: null },
    { slug:'moon-phase', title:'Check the Moon phase before planning dark-sky sessions',
      cat:'Observing', catColor:'#a0c8d8',
      summary:'A bright Moon washes out faint nebulae. Plan your best sessions around the new Moon.',
      atlasId:'moon' },
    { slug:'life-on-mars', title:'The long search for life on Mars',
      cat:'Exploration', catColor:'#c87050',
      summary:'Three billion years of tantalising clues — and still no confirmed biology in the Martian dust.',
      atlasId:'mars' },
    { slug:'gas-giants-ice-giants', title:'Gas giants versus ice giants',
      cat:'Exploration', catColor:'#c87050',
      summary:'Jupiter and Saturn are mostly hydrogen and helium; Uranus and Neptune hide icy interiors.',
      atlasId:'jupiter' },
    { slug:'saturns-rings', title:"Saturn's rings: young, thin and temporary?",
      cat:'Exploration', catColor:'#c87050',
      summary:"Saturn's iconic rings may be only 100 million years old and are slowly falling inward.",
      atlasId:'saturn' },
    { slug:'nebulae', title:'Nebulae: nurseries and graveyards of stars',
      cat:'Learn', catColor:'#9080c8',
      summary:'The same glowing clouds of gas and dust where stars are born also glow as their remnants fade.',
      atlasId:'orion-nebula' },
    { slug:'milky-way', title:'Walking through the spiral arms',
      cat:'Learn', catColor:'#9080c8',
      summary:'The Sun sits in the Orion Spur, between the Perseus and Sagittarius arms of our galaxy.',
      atlasId: null }
  ];

  /* ============================================================
     SECTION B: Renderer & Scene Setup
     ============================================================ */

  var canvas = document.getElementById('bh');
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    window.location.replace('index-classic.html');
    return;
  }

  var W   = window.innerWidth;
  var H   = window.innerHeight;
  var asp = W / H;
  var DPR = Math.min(window.devicePixelRatio || 1, 2) * QS[Q].scale;
  if (MOB) DPR = Math.min(DPR, 1.2);

  renderer.setPixelRatio(DPR);
  renderer.setSize(W, H);
  renderer.autoClear = true;

  var scene = new THREE.Scene();

  // Dummy camera for fullscreen quad passes
  var bhCamera = new THREE.PerspectiveCamera(60, asp, 0.1, 1000);
  bhCamera.position.set(0, 0, 5);

  /* ============================================================
     SECTION C: Gargantua Black Hole Ray-March Shader
     ============================================================ */

  var VERT_BH = [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = vec4(position.xy, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG_BH = [
    'precision highp float;',
    'uniform vec3  uCamPos;',
    'uniform vec3  uTarget;',
    'uniform vec3  uN;',
    'uniform float uT;',
    'uniform float uSteps;',
    'uniform float uInterstellar;',
    'uniform float uDimness;',
    'uniform float uAsp;',
    'uniform float uFov;',
    'uniform int   uNoiseOct;',
    'varying vec2  vUv;',

    'float hash(vec2 p) {',
    '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);',
    '}',

    'float vnoise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  float a = hash(i);',
    '  float b = hash(i + vec2(1.0, 0.0));',
    '  float c = hash(i + vec2(0.0, 1.0));',
    '  float d = hash(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
    '}',

    'float fbm(vec2 p, int oct) {',
    '  float v = 0.0;',
    '  float a = 0.5;',
    '  for(int i = 0; i < 6; i++) {',
    '    if(i >= oct) break;',
    '    v += a * vnoise(p);',
    '    p = p * 2.15 + vec2(1.7, 9.2);',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',

    'void main() {',
    '  vec2 pCoord = (vUv * 2.0 - 1.0) * vec2(uAsp * uFov, uFov);',
    '  vec3 fwd = normalize(uTarget - uCamPos);',
    '  vec3 rgt = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));',
    '  vec3 up  = cross(rgt, fwd);',
    '  vec3 dir = normalize(fwd + rgt * pCoord.x + up * pCoord.y);',
    '  vec3 pos = uCamPos;',

    '  vec3 n = normalize(uN);',
    '  vec3 rf = abs(n.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);',
    '  vec3 e1 = normalize(cross(n, rf));',
    '  vec3 e2 = cross(n, e1);',

    '  vec3 col = vec3(0.0);',
    '  float al = 0.0;',
    '  bool hit = false;',
    '  float minR = 1e9;',
    '  const float RB = 26.0;',

    '  for(int i = 0; i < 200; i++) {',
    '    if(float(i) >= uSteps) break;',
    '    float r = length(pos);',
    '    if(r < minR) minR = r;',
    '    if(r < 1.02) { hit = true; break; }',
    '    if(r > RB * 1.05 && dot(pos, dir) > 0.0) break;',

    '    vec3 L = cross(pos, dir);',
    '    float h2 = dot(L, L);',
    '    float dt = r > 7.0 ? 0.12 * r : clamp(0.055 * (r - 0.55), 0.018, 0.45);',
    '    vec3 acc = -1.5 * h2 * pos / (r * r * r * r * r);',
    '    vec3 nextPos = pos + dir * dt;',
    '    dir = normalize(dir + acc * dt);',

    '    // Disk intersection: plane defined by normal n',
    '    float s0 = dot(pos, n);',
    '    float s1 = dot(nextPos, n);',
    '    if(s0 * s1 < 0.0 && al < 0.98) {',
    '      vec3 q = mix(pos, nextPos, s0 / (s0 - s1));',
    '      float rr = length(q);',
    '      if(rr > 2.65 && rr < 16.5) {',
    '        float ph = atan(dot(q, e2), dot(q, e1));',
    '        float tR = clamp((rr - 2.65) / (16.5 - 2.65), 0.0, 1.0);',

    '        // Differential Keplerian orbital velocity',
    '        float vOmega = 1.0 / sqrt(2.0 * max(rr - 1.0, 1.2));',
    '        vec3 vel = normalize(cross(n, q));',
    '        float dop = dot(vel, dir);',
    '        float gt = sqrt(max(0.01, 1.0 - vOmega * vOmega)) / (1.0 + vOmega * dop) * sqrt(max(0.01, 1.0 - 1.0 / rr));',
    '        gt = mix(gt, 1.0 + dop * 0.25, uInterstellar);',
    '        float boost = pow(max(0.2, gt), 2.8);',

    '        // Multi-frequency gas turbulence stretched along orbital rings',
    '        float dRot = ph - uT * 0.42 * pow(3.5 / rr, 1.3);',
    '        vec2 uvGas = vec2(rr * 1.8, dRot * 5.0);',
    '        vec2 uvStr = vec2(rr * 0.6, dRot * 18.0);',
    '        float turb = fbm(uvGas + vec2(0.0, uT * 0.05), uNoiseOct);',
    '        float strk = fbm(uvStr + vec2(uT * 0.02, 0.0), uNoiseOct);',
    '        float gasDensity = mix(turb, strk, 0.45);',

    '        // Characteristic dark dust lane running through outer-mid disk',
    '        float dustLane = smoothstep(5.8, 7.5, rr) * smoothstep(11.2, 8.5, rr) * (0.35 + 0.65 * vnoise(vec2(rr * 2.2, dRot * 3.5)));',
    '        gasDensity = clamp(gasDensity - dustLane * 0.52, 0.04, 1.4);',

    '        // Photoreal Gargantua color grading: white-cream -> copper -> deep rust',
    '        vec3 innerCol = vec3(1.00, 0.98, 0.94);',
    '        vec3 midCol   = vec3(0.92, 0.65, 0.35);',
    '        vec3 outerCol = vec3(0.38, 0.16, 0.06);',

    '        vec3 diskCol;',
    '        if(tR < 0.22) {',
    '          diskCol = mix(innerCol, innerCol, tR / 0.22);',
    '        } else if(tR < 0.55) {',
    '          diskCol = mix(innerCol, midCol, (tR - 0.22) / 0.33);',
    '        } else {',
    '          diskCol = mix(midCol, outerCol, (tR - 0.55) / 0.45);',
    '        }',

    '        float intensity = boost * gasDensity * (1.0 - tR * 0.65) * 3.2;',
    '        intensity *= smoothstep(2.65, 3.1, rr) * smoothstep(16.5, 13.5, rr);',
    '        diskCol *= intensity;',

    '        float dAlpha = clamp(intensity * 0.28, 0.0, 0.90) * (1.0 - al);',
    '        col += diskCol * dAlpha;',
    '        al  += dAlpha;',
    '      }',
    '    }',
    '    pos = nextPos;',
    '  }',

    '  // Razor-sharp, brilliant white photon ring hugging the shadow edge',
    '  if(!hit) {',
    '    float pRing = smoothstep(1.58, 1.08, minR) * smoothstep(1.0, 1.04, minR);',
    '    col += vec3(1.0, 0.98, 0.95) * pRing * (1.0 - al) * 4.2;',
    '    al   = max(al, pRing * 0.88);',
    '  }',

    '  // Black hole shadow: pure event horizon void',
    '  if(hit) {',
    '    col = vec3(0.0);',
    '    al  = 1.0;',
    '  }',

    '  // Background: lensed celestial stars distorted by the geodesic march',
    '  if(!hit && al < 0.99) {',
    '    vec3 sd = dir;',
    '    vec2 suv = vec2(atan(sd.z, sd.x) * 0.15915 + 0.5, sd.y * 0.5 + 0.5);',
    '    float sn = hash(floor(suv * 900.0));',
    '    vec3 starCol = vec3(0.0);',
    '    if(sn > 0.991) {',
    '      float sb = hash(floor(suv * 900.0) + vec2(3.7, 2.1));',
    '      vec3 sc  = mix(vec3(0.75, 0.82, 1.00), vec3(1.00, 0.92, 0.72), hash(floor(suv * 900.0) + vec2(1.1, 5.3)));',
    '      starCol += sc * (0.45 + sb * 0.85);',
    '    }',
    '    vec3 deepSpace = mix(vec3(0.008, 0.012, 0.026), vec3(0.018, 0.010, 0.024), vnoise(suv * 2.5));',
    '    col += (deepSpace + starCol) * (1.0 - al);',
    '  }',

    '  // Subtle cinematic film grain',
    '  float seed = dot(vUv, vec2(127.1, 311.7)) * (uT * 0.10 + 1.0);',
    '  float grain = (fract(sin(seed) * 43758.5) * 2.0 - 1.0) * 0.010;',
    '  col += grain;',

    '  // Horizon dive fade to black',
    '  col *= (1.0 - uDimness);',

    '  gl_FragColor = vec4(clamp(col, 0.0, 4.0), max(al, 0.01));',
    '}'
  ].join('\n');

  // Disk normal: tilted slightly in the viewport to match Gargantua in Image B
  var diskTiltAngle = 83.5 * Math.PI / 180; // 83.5 degrees (nearly edge-on)
  var diskNormal = new THREE.Vector3(-0.06, Math.cos(diskTiltAngle), Math.sin(diskTiltAngle)).normalize();

  var bhUniforms = {
    uCamPos:       { value: new THREE.Vector3(0.0, 1.45, 11.8) },
    uTarget:       { value: new THREE.Vector3(0.0, 0.0, 0.0) },
    uN:            { value: diskNormal },
    uT:            { value: 0.0 },
    uSteps:        { value: QS[Q].steps },
    uInterstellar: { value: 0.75 }, // Balanced Interstellar look
    uDimness:      { value: 0.0 },
    uNoiseOct:     { value: QS[Q].noise },
    uAsp:          { value: asp },
    uFov:          { value: Math.tan(30 * Math.PI / 180) } // 60 deg vertical FOV
  };

  var bhMat = new THREE.ShaderMaterial({
    vertexShader:   VERT_BH,
    fragmentShader: FRAG_BH,
    uniforms:       bhUniforms,
    depthTest:      false,
    depthWrite:     false
  });

  var bhMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bhMat);
  scene.add(bhMesh);

  /* ============================================================
     SECTION D: Navigation States & Camera Positions
     ============================================================ */

  var camPos = { x: 0.0, y: 1.45, z: 11.8 };
  var CAM_HOME   = { x: 0.0, y: 1.45, z: 11.8 };
  var CAM_STRAND = { x: 0.0, y: 0.20, z: 3.2 };

  var camDriftX = 0, camDriftY = 0;
  var camDriftTX = 0, camDriftTY = 0;
  var lastScrollTime = 0;

  function updateStateLabel() {
    var btns = document.querySelectorAll('#state-label button');
    btns.forEach(function (b) {
      b.classList.toggle('active', parseInt(b.dataset.state, 10) === STATE);
    });
  }

  function showHomeCTA(show) {
    var el = document.getElementById('home-cta');
    if (el) el.style.opacity = show ? '1' : '0';
  }

  function syncCamera() {
    bhUniforms.uCamPos.value.set(camPos.x, camPos.y, camPos.z);
  }

  function goToState(n) {
    if (n === STATE && n !== 0) return;
    STATE = n;
    updateStateLabel();

    if (n === 0) {
      // Return to Image B (Home)
      showHomeCTA(true);
      if (strandsGroup) strandsGroup.visible = false;
      bhMesh.visible = true;
      bhUniforms.uDimness.value = 0.0;

      if (window.gsap) {
        gsap.killTweensOf(camPos);
        gsap.to(camPos, {
          x: CAM_HOME.x, y: CAM_HOME.y, z: CAM_HOME.z,
          duration: 1.0, ease: 'power2.inOut',
          onUpdate: syncCamera
        });
      } else {
        camPos.x = CAM_HOME.x; camPos.y = CAM_HOME.y; camPos.z = CAM_HOME.z;
        syncCamera();
      }
      try { history.pushState({ s: 0 }, '', '#home'); } catch (e) {}
    } else if (n === 1) {
      // Zoom into Light Strands (Image C)
      showHomeCTA(false);
      buildStrands();

      if (window.gsap) {
        gsap.killTweensOf(camPos);
        gsap.to(camPos, {
          x: CAM_STRAND.x, y: CAM_STRAND.y, z: CAM_STRAND.z,
          duration: 1.1, ease: 'power3.inOut',
          onUpdate: syncCamera,
          onComplete: function () {
            bhMesh.visible = false;
            if (strandsGroup) strandsGroup.visible = true;
          }
        });
      } else {
        camPos.x = CAM_STRAND.x; camPos.y = CAM_STRAND.y; camPos.z = CAM_STRAND.z;
        syncCamera();
        bhMesh.visible = false;
        if (strandsGroup) strandsGroup.visible = true;
      }
      try { history.pushState({ s: 1 }, '', '#strands'); } catch (e) {}
    } else if (n === 2) {
      // Fast dive into Event Horizon (State 3)
      showHomeCTA(false);
      triggerDive();
      try { history.pushState({ s: 2 }, '', '#horizon'); } catch (e) {}
    }
  }

  function triggerDive() {
    bhMesh.visible = true;
    if (strandsGroup) strandsGroup.visible = false;
    var targetId = currentBH === 'm87-star' ? 'm87-star' : 'sgr-a-star';

    if (window.gsap) {
      gsap.killTweensOf(camPos);
      gsap.to(camPos, {
        x: 0, y: 0.1, z: 1.6,
        duration: 1.3, ease: 'power3.in',
        onUpdate: syncCamera
      });
      gsap.to(bhUniforms.uDimness, {
        value: 1.0,
        duration: 1.0, delay: 0.25, ease: 'power2.in',
        onComplete: function () {
          window.location.href = 'atlas.html?v=7&ref=index.html#' + targetId;
        }
      });
    } else {
      window.location.href = 'atlas.html?v=7&ref=index.html#' + targetId;
    }
  }

  /* ============================================================
     SECTION E: Light Strands (Image C Architecture)
     ============================================================ */

  var strandsBuilt = false;
  var strandsGroup = new THREE.Group();
  scene.add(strandsGroup);
  strandsGroup.visible = false;

  var strandObjs = [];
  var strandPhases = ARTICLES.map(function () { return Math.random() * Math.PI * 2; });
  var hoveredStrand = null;

  var strandAsp = asp;
  var strandCam = new THREE.OrthographicCamera(
    -strandAsp * 5.5, strandAsp * 5.5,
    5.5, -5.5,
    0.1, 20
  );
  strandCam.position.set(0, 0, 8);
  strandCam.lookAt(0, 0, 0);

  function buildStrands() {
    if (strandsBuilt) return;
    strandsBuilt = true;

    // Hundreds of fine vertical luminous strands (dense center, pale gold-yellow)
    var N_BG = 380;
    var bgPos = [], bgCol = [];
    for (var i = 0; i < N_BG; i++) {
      var sx = (Math.random() - 0.5) * 15;
      // Denser and brighter towards center
      var br = Math.pow(1.0 - Math.abs(sx) / 7.5, 2.4);
      br *= 0.25 + Math.random() * 0.75;

      var r = (0.75 + br * 0.25) * br;
      var g = (0.65 + br * 0.25) * br;
      var b = (0.12 + br * 0.08) * br;

      bgPos.push(sx, -7, -3.5);
      bgCol.push(r * 0.45, g * 0.45, b * 0.45);

      bgPos.push(sx, 7, -3.5);
      bgCol.push(r, g, b);
    }

    var bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute('position', new THREE.Float32BufferAttribute(bgPos, 3));
    bgGeo.setAttribute('color',    new THREE.Float32BufferAttribute(bgCol, 3));
    var bgIdx = [];
    for (var j = 0; j < N_BG; j++) { bgIdx.push(j * 2, j * 2 + 1); }
    bgGeo.setIndex(bgIdx);

    var bgMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.65,
      depthTest: false
    });
    strandsGroup.add(new THREE.LineSegments(bgGeo, bgMat));

    // Faint horizontal crossing lines
    var N_H = 26;
    var hPos = [], hCol = [];
    for (var k = 0; k < N_H; k++) {
      var hy = (Math.random() - 0.5) * 10;
      var hb = 0.025 + Math.random() * 0.05;
      hPos.push(-9, hy, -3.5, 9, hy, -3.5);
      hCol.push(hb * 0.85, hb * 0.75, hb * 0.15, hb * 0.85, hb * 0.75, hb * 0.15);
    }
    var hGeo = new THREE.BufferGeometry();
    hGeo.setAttribute('position', new THREE.Float32BufferAttribute(hPos, 3));
    hGeo.setAttribute('color',    new THREE.Float32BufferAttribute(hCol, 3));
    var hIdx = [];
    for (var m = 0; m < N_H; m++) { hIdx.push(m * 2, m * 2 + 1); }
    hGeo.setIndex(hIdx);

    var hMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.40,
      depthTest: false
    });
    strandsGroup.add(new THREE.LineSegments(hGeo, hMat));

    // 10 Interactive Article Strands
    var strandH = 6.2;
    ARTICLES.forEach(function (art, idx) {
      var sx2 = (idx - (ARTICLES.length - 1) / 2.0) * 0.90;

      // Visual line quad
      var sGeo = new THREE.PlaneGeometry(0.06, strandH);
      var sMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(art.catColor),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.90,
        depthTest: false,
        side: THREE.DoubleSide
      });
      var sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(sx2, 0, -3.0);
      sMesh.renderOrder = 2;
      strandsGroup.add(sMesh);

      // Glowing tip
      var tGeo = new THREE.CircleGeometry(0.09, 14);
      var tMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(art.catColor),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.95,
        depthTest: false
      });
      var tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.set(sx2, strandH / 2 + 0.06, -3.0);
      strandsGroup.add(tMesh);

      // Generous hit box for Raycaster (>14px width)
      var hbGeo = new THREE.PlaneGeometry(0.42, strandH + 0.6);
      var hbMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
      var hbMesh = new THREE.Mesh(hbGeo, hbMat);
      hbMesh.position.set(sx2, 0, -3.0);
      hbMesh.userData = { art: art, strandMesh: sMesh, tipMesh: tMesh };
      strandsGroup.add(hbMesh);

      strandObjs.push(hbMesh);
    });
  }

  /* ============================================================
     SECTION F: Raycaster & Glass Info Panel
     ============================================================ */

  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();

  function showStrandLabel(art, cx, cy) {
    var el = document.getElementById('strand-label');
    if (!el) return;
    el.hidden = false;
    el.innerHTML = '<div class="sl-cat" style="color:' + art.catColor + '">' + art.cat + '</div>' +
                   '<div class="sl-title">' + art.title + '</div>';
    moveStrandLabel(cx, cy);
  }

  function moveStrandLabel(cx, cy) {
    var el = document.getElementById('strand-label');
    if (!el || el.hidden) return;
    var ew = el.offsetWidth || 220;
    var left = cx + 16;
    if (left + ew > W - 12) left = cx - ew - 16;
    el.style.left = left + 'px';
    el.style.top  = (cy - 35) + 'px';
  }

  function hideStrandLabel() {
    var el = document.getElementById('strand-label');
    if (el) el.hidden = true;
  }

  function buildInfoPanelDOM() {
    if (document.getElementById('info-panel')) return;
    var panel = document.createElement('aside');
    panel.id = 'info-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-label', 'Article details');
    panel.hidden = true;
    panel.innerHTML =
      '<button id="panel-back" aria-label="Back to strands">← Back</button>' +
      '<button id="panel-home" aria-label="Return to home view">⌂ Home</button>' +
      '<div id="panel-content">' +
        '<span id="panel-cat"></span>' +
        '<h2 id="panel-title"></h2>' +
        '<p id="panel-summary"></p>' +
        '<img id="panel-img" src="" alt="" loading="lazy" decoding="async">' +
        '<div id="panel-links"></div>' +
      '</div>';
    document.body.appendChild(panel);

    document.getElementById('panel-back').onclick = closeInfoPanel;
    document.getElementById('panel-home').onclick = function () {
      closeInfoPanel();
      goToState(0);
    };
  }

  function openInfoPanel(art) {
    buildInfoPanelDOM();
    var panel = document.getElementById('info-panel');
    document.getElementById('panel-cat').textContent = art.cat;
    document.getElementById('panel-cat').style.color = art.catColor;
    document.getElementById('panel-title').textContent = art.title;
    document.getElementById('panel-summary').textContent = art.summary;

    var img = document.getElementById('panel-img');
    img.src = 'images/articles/' + art.slug + '-1600.webp';
    img.onerror = function () { this.src = 'images/articles/' + art.slug + '-1600.jpg'; };
    img.alt = art.title;

    var lnks = document.getElementById('panel-links');
    lnks.innerHTML = '<a href="articles/' + art.slug + '.html" class="panel-btn">Read full article →</a>';
    if (art.atlasId) {
      lnks.innerHTML += '<a href="#" class="panel-btn panel-btn-atlas" data-atlas-obj="' + art.atlasId + '">Open in Atlas ↗</a>';
    }

    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add('open'); });
    var titleEl = document.getElementById('panel-title');
    if (titleEl) titleEl.focus();
  }

  function closeInfoPanel() {
    var p = document.getElementById('info-panel');
    if (!p) return;
    p.classList.remove('open');
  }

  /* ============================================================
     SECTION G: Input Event Handlers
     ============================================================ */

  window.addEventListener('mousemove', function (e) {
    if (STATE === 0) {
      camDriftTX = ((e.clientX / W) * 2 - 1) * 0.45;
      camDriftTY = -((e.clientY / H) * 2 - 1) * 0.22;
    }

    if (STATE === 1) {
      mouse.x =  (e.clientX / W) * 2 - 1;
      mouse.y = -((e.clientY / H) * 2 - 1);
      raycaster.setFromCamera(mouse, strandCam);
      var hits = raycaster.intersectObjects(strandObjs);
      var newHover = hits.length > 0 ? hits[0].object : null;

      if (newHover !== hoveredStrand) {
        if (hoveredStrand) {
          hoveredStrand.userData.strandMesh.material.opacity = 0.90;
          hoveredStrand.userData.strandMesh.scale.x = 1.0;
        }
        hoveredStrand = newHover;
        if (hoveredStrand) {
          hoveredStrand.userData.strandMesh.material.opacity = 1.0;
          hoveredStrand.userData.strandMesh.scale.x = 2.8;
          showStrandLabel(hoveredStrand.userData.art, e.clientX, e.clientY);
          canvas.style.cursor = 'pointer';
        } else {
          hideStrandLabel();
          canvas.style.cursor = '';
        }
      } else if (hoveredStrand) {
        moveStrandLabel(e.clientX, e.clientY);
      }
    }
  }, { passive: true });

  canvas.addEventListener('click', function (e) {
    onCanvasClick(e);
  });

  function onCanvasClick(e) {
    if (STATE === 2) return;

    if (STATE === 0) {
      var cx = (e.clientX - W / 2) / W;
      var cy = (e.clientY - H / 2) / H;
      var dist = Math.sqrt(cx * cx + (cy * 1.35) * (cy * 1.35));
      if (dist < 0.17) {
        goToState(2); // Shadow click -> Horizon dive
      } else {
        goToState(1); // Disk click -> Light Strands
      }
      return;
    }

    if (STATE === 1) {
      if (hoveredStrand) {
        openInfoPanel(hoveredStrand.userData.art);
      } else {
        goToState(0);
      }
    }
  }

  // CTA label buttons
  var ctaDisk   = document.querySelector('.cta-disk');
  var ctaShadow = document.querySelector('.cta-shadow');
  if (ctaDisk)   ctaDisk.addEventListener('click',   function () { goToState(1); });
  if (ctaShadow) ctaShadow.addEventListener('click', function () { goToState(2); });

  // State label buttons (Home, Light, Horizon)
  document.querySelectorAll('#state-label button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      goToState(parseInt(btn.dataset.state, 10));
    });
  });

  // Scroll wheel: 1 tick = 1 full level jump
  window.addEventListener('wheel', function (e) {
    e.preventDefault();
    var now = Date.now();
    if (now - lastScrollTime < 650) return;
    lastScrollTime = now;
    if (e.deltaY > 0 && STATE < 1) goToState(STATE + 1);
    else if (e.deltaY < 0 && STATE > 0) goToState(STATE - 1);
  }, { passive: false });

  // Touch swipe & tap
  var touchY0 = 0;
  canvas.addEventListener('touchstart', function (e) {
    touchY0 = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', function (e) {
    var dy = e.changedTouches[0].clientY - touchY0;
    if (Math.abs(dy) > 40) {
      if (dy < 0 && STATE < 1) goToState(STATE + 1);
      else if (dy > 0 && STATE > 0) goToState(STATE - 1);
    } else {
      onCanvasClick({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
    }
  }, { passive: true });

  // Keyboard navigation
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var p = document.getElementById('info-panel');
      if (p && p.classList.contains('open')) {
        closeInfoPanel();
        return;
      }
      if (STATE > 0) goToState(STATE - 1);
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      if (STATE < 1) goToState(STATE + 1);
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      if (STATE > 0) goToState(STATE - 1);
    }
  });

  // Browser back/forward button support
  window.addEventListener('popstate', function (e) {
    var s = (e.state && e.state.s !== undefined) ? e.state.s : 0;
    goToState(s);
  });

  // Quality button
  var btnQ = document.getElementById('btn-quality');
  if (btnQ) {
    btnQ.addEventListener('click', function () {
      var order = ['low', 'med', 'high'];
      var idx = order.indexOf(Q);
      Q = order[(idx + 1) % order.length];
      DPR = Math.min(window.devicePixelRatio || 1, 2) * QS[Q].scale;
      if (MOB) DPR = Math.min(DPR, 1.2);
      renderer.setPixelRatio(DPR);
      bhUniforms.uSteps.value    = QS[Q].steps;
      bhUniforms.uNoiseOct.value = QS[Q].noise;
      btnQ.textContent = 'Quality: ' + Q.toUpperCase();
    });
  }

  // Black hole switch button (Sgr A* / M87*)
  var btnBH = document.getElementById('btn-bh-switch');
  if (btnBH) {
    btnBH.addEventListener('click', function () {
      currentBH = currentBH === 'sgr-a-star' ? 'm87-star' : 'sgr-a-star';
      btnBH.textContent = currentBH === 'sgr-a-star' ? 'Sgr A*' : 'M87*';

      var newTilt = (currentBH === 'sgr-a-star' ? 83.5 : 72.0) * Math.PI / 180;
      var newNorm = new THREE.Vector3(-0.06, Math.cos(newTilt), Math.sin(newTilt)).normalize();

      if (window.gsap) {
        gsap.to(bhUniforms.uN.value, {
          x: newNorm.x, y: newNorm.y, z: newNorm.z,
          duration: 1.4, ease: 'power2.inOut'
        });
        gsap.to(bhUniforms.uInterstellar, {
          value: currentBH === 'sgr-a-star' ? 0.75 : 0.45,
          duration: 1.4, ease: 'power2.inOut'
        });
      } else {
        bhUniforms.uN.value.copy(newNorm);
        bhUniforms.uInterstellar.value = currentBH === 'sgr-a-star' ? 0.75 : 0.45;
      }
    });
  }

  /* ============================================================
     SECTION H: Resize & Render Loop
     ============================================================ */

  function onResize() {
    W   = window.innerWidth;
    H   = window.innerHeight;
    asp = W / H;
    DPR = Math.min(window.devicePixelRatio || 1, 2) * QS[Q].scale;
    if (MOB) DPR = Math.min(DPR, 1.2);

    renderer.setPixelRatio(DPR);
    renderer.setSize(W, H);

    bhUniforms.uAsp.value = asp;
    bhUniforms.uFov.value = Math.tan(30 * Math.PI / 180);

    strandAsp = asp;
    strandCam.left   = -strandAsp * 5.5;
    strandCam.right  =  strandAsp * 5.5;
    strandCam.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  syncCamera();
  history.replaceState({ s: 0 }, '', '#home');
  updateStateLabel();

  var clock = new THREE.Clock();
  var firstFrame = true;

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t  = clock.getElapsedTime();

    if (!RM) {
      bhUniforms.uT.value = t;
    }

    if (!RM && STATE === 0) {
      camDriftX += (camDriftTX - camDriftX) * 0.026;
      camDriftY += (camDriftTY - camDriftY) * 0.026;
      bhUniforms.uCamPos.value.set(
        camPos.x + camDriftX,
        camPos.y + camDriftY,
        camPos.z
      );
    } else {
      bhUniforms.uCamPos.value.set(camPos.x, camPos.y, camPos.z);
    }

    // Shimmer effect on interactive strands
    if (STATE === 1 && strandsBuilt) {
      strandObjs.forEach(function (so, idx) {
        var sm = so.userData.strandMesh;
        if (so !== hoveredStrand) {
          sm.material.opacity = 0.75 + 0.18 * Math.sin(t * 0.85 + strandPhases[idx]);
        }
      });
    }

    // Render pass
    if (STATE !== 1 || !strandsBuilt) {
      bhMesh.visible = true;
      renderer.render(scene, bhCamera);
    } else {
      bhMesh.visible = false;
      if (strandsGroup) strandsGroup.visible = true;
      renderer.render(scene, strandCam);
    }

    // Dismiss loading overlay on first rendered frame
    if (firstFrame) {
      firstFrame = false;
      var ls = document.getElementById('loading');
      if (ls) {
        ls.style.opacity = '0';
        setTimeout(function () {
          if (ls.parentNode) ls.parentNode.removeChild(ls);
        }, 700);
      }
    }
  }

  animate();
})();
