/* ============================================================
   COSMOS MAGAZINE — home-bh.js
   Cinematic Gargantua (Interstellar Image B) + Light Strands (Image C)
   Three.js r128 + GSAP. Pure static, no build step.
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
    low:  { steps: 110, scale: 0.65 },
    med:  { steps: 160, scale: 0.85 },
    high: { steps: 220, scale: 1.00 }
  };

  var STATE = 0; // 0 = Home (Gargantua Image B), 1 = Light Strands (Image C), 2 = Horizon Dive
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
     SECTION B: Renderer & Scene
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
  var bhCamera = new THREE.PerspectiveCamera(60, asp, 0.1, 1000);
  bhCamera.position.set(0, 0, 5);

  /* ============================================================
     SECTION C: Gargantua Volumetric Ray-Marching Shader (Image B)
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
    'uniform vec3  uDiskNormal;',
    'uniform float uT;',
    'uniform float uSteps;',
    'uniform float uDimness;',
    'uniform float uAsp;',
    'uniform float uFov;',
    'varying vec2  vUv;',

    'float hash(vec2 p) {',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',

    'void main() {',
    '  vec2 pCoord = (vUv * 2.0 - 1.0) * vec2(uAsp * uFov, uFov);',
    '  vec3 fwd = normalize(uTarget - uCamPos);',
    '  vec3 rgt = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));',
    '  vec3 up  = cross(rgt, fwd);',
    '  vec3 dir = normalize(fwd + rgt * pCoord.x + up * pCoord.y);',
    '',
    '  // Accretion disk reference frame and orientation',
    '  vec3 n = normalize(uDiskNormal);',
    '  vec3 rf = abs(n.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);',
    '  vec3 e1 = normalize(cross(n, rf));',
    '  vec3 e2 = cross(n, e1);',
    '',
    '  vec3 p = uCamPos;',
    '  vec3 v = dir;',
    '  vec3 L = cross(p, v);',
    '  float h2 = dot(L, L);',
    '',
    '  vec3 col = vec3(0.0);',
    '  float al = 0.0;',
    '  bool hit = false;',
    '  float minR = 1e9;',
    '  const float RB = 26.0;',
    '',
    '  // Analytical Schwarzschild geodesic raymarcher',
    '  for(int i = 0; i < 200; i++) {',
    '    if(float(i) >= uSteps) break;',
    '    float r = length(p);',
    '    if(r < minR) minR = r;',
    '    if(r < 1.0) { hit = true; break; }',
    '    if(r > RB * 1.04 && dot(p, v) > 0.0) break;',
    '',
    '    float dt = r > 8.0 ? 0.10 * r : clamp(0.05 * (r - 0.55), 0.018, 0.45);',
    '    vec3 a = -1.5 * h2 * p / (r * r * r * r * r);',
    '    vec3 pn = p + v * dt;',
    '    v = normalize(v + a * dt);',
    '',
    '    // Analytical disk plane crossing (zero stepping artifacts, razor-sharp)',
    '    float s0 = dot(p, n);',
    '    float s1 = dot(pn, n);',
    '    if(s0 * s1 < 0.0 && al < 0.98) {',
    '      vec3 q = mix(p, pn, s0 / (s0 - s1));',
    '      float rr = length(q);',
    '      if(rr > 2.8 && rr < 15.5) {',
    '        float ph = atan(dot(q, e2), dot(q, e1));',
    '        float t = pow(3.0 / rr, 0.75);',
    '        vec3 vel = normalize(cross(n, q));',
    '        float vk = sqrt(0.5 / (rr - 1.0));',
    '        float gt = sqrt(1.0 - vk * vk) / (1.0 + vk * dot(vel, v)) * sqrt(1.0 - 1.0 / rr);',
    '        // Fine concentric Keplerian orbital rings',
    '        float tb = 0.62 + 0.38 * sin(7.0 * (ph + uT * 3.6 * pow(rr, -1.5)) + rr * 5.0) * sin(rr * 14.0 - ph * 2.0);',
    '        float I = min(pow(t * gt, 3.0) * 3.0 * tb, 2.4) * smoothstep(15.5, 11.5, rr) * smoothstep(2.8, 3.3, rr);',
    '        vec3 c = mix(vec3(1.0, 0.38, 0.08), vec3(1.0, 0.94, 0.84), clamp(t * gt * 1.1, 0.0, 1.0));',
    '        c = mix(c, vec3(0.75, 0.88, 1.0), clamp(t * gt - 0.9, 0.0, 1.0));',
    '        col += (1.0 - al) * c * I;',
    '        al  += (1.0 - al) * clamp(I * 0.65, 0.0, 0.95);',
    '      }',
    '    }',
    '    p = pn;',
    '  }',
    '',
    '  // Razor-sharp, brilliant white photon ring encircling the shadow',
    '  if(!hit) {',
    '    float pRing = smoothstep(1.30, 1.08, minR) * smoothstep(1.00, 1.04, minR);',
    '    col += vec3(1.0, 0.97, 0.92) * pRing * (1.0 - al) * 2.8;',
    '    al   = max(al, pRing * 0.95);',
    '  }',
    '',
    '  // Pitch black event horizon',
    '  if(hit) {',
    '    col = vec3(0.0);',
    '    al  = 1.0;',
    '  }',
    '',
    '  // Distant stars bent around the black hole',
    '  if(!hit && al < 0.99) {',
    '    vec2 suv = vec2(atan(v.z, v.x) * 0.15915 + 0.5, v.y * 0.5 + 0.5);',
    '    float sn = hash(floor(suv * 800.0));',
    '    if(sn > 0.993) {',
    '      float sb = hash(floor(suv * 800.0) + vec2(4.7, 1.3));',
    '      vec3 sc  = mix(vec3(0.75, 0.85, 1.00), vec3(1.00, 0.92, 0.75), sb);',
    '      col += sc * (0.5 + sb * 0.8) * (1.0 - al);',
    '    }',
    '  }',
    '',
    '  // Horizon dive fade',
    '  col *= (1.0 - uDimness);',
    '',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), max(al, 0.01));',
    '}'
  ].join('\n');

  // Camera settings: looking slightly down onto the X-Z disk (y = 1.35)
  var CAM_HOME   = { x: 0.0, y: 0.0, z: 9.2 };
  var CAM_STRAND = { x: 0.0, y: 0.0, z: 3.0 };
  var camPos     = { x: CAM_HOME.x, y: CAM_HOME.y, z: CAM_HOME.z };
  var diskNormal = new THREE.Vector3(0.08, 0.92, 0.38).normalize();

  var bhUniforms = {
    uCamPos:       { value: new THREE.Vector3(CAM_HOME.x, CAM_HOME.y, CAM_HOME.z) },
    uTarget:       { value: new THREE.Vector3(0.0, 0.0, 0.0) },
    uDiskNormal:   { value: diskNormal },
    uT:            { value: 0.0 },
    uSteps:        { value: QS[Q].steps },
    uDimness:      { value: 0.0 },
    uAsp:          { value: asp },
    uFov:          { value: Math.tan(30 * Math.PI / 180) }
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
     SECTION D: Navigation States & Camera Animations
     ============================================================ */

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
    if (n === 1) {
      window.location.href = 'magazine.html';
      return;
    }
    if (n === STATE && n !== 0) return;
    STATE = n;
    updateStateLabel();

    if (n === 0) {
      showHomeCTA(true);
      bhMesh.visible = true;
      bhUniforms.uDimness.value = 0.0;
      try { history.pushState({ s: 0 }, '', '#home'); } catch (e) {}
    } else if (n === 2) {
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
        duration: 1.2, ease: 'power3.in',
        onUpdate: syncCamera
      });
      gsap.to(bhUniforms.uDimness, {
        value: 1.0,
        duration: 0.9, delay: 0.25, ease: 'power2.in',
        onComplete: function () {
          window.location.href = 'atlas.html?v=7&ref=index.html#' + targetId;
        }
      });
    } else {
      window.location.href = 'atlas.html?v=7&ref=index.html#' + targetId;
    }
  }

  /* ============================================================
     SECTION E: Light Strands (Image C)
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

    var N_BG = 400;
    var bgPos = [], bgCol = [];
    for (var i = 0; i < N_BG; i++) {
      var sx = (Math.random() - 0.5) * 15;
      var br = Math.pow(1.0 - Math.abs(sx) / 7.5, 2.5);
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

    // Horizontal crossing threads
    var N_H = 28;
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

    // Interactive article strands
    var strandH = 6.2;
    ARTICLES.forEach(function (art, idx) {
      var sx2 = (idx - (ARTICLES.length - 1) / 2.0) * 0.90;

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
     SECTION F: Raycaster & Info Panel
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
     SECTION G: User Input Handlers
     ============================================================ */

  window.addEventListener('mousemove', function (e) {
    if (STATE === 0) {
      camDriftTX = ((e.clientX / W) * 2 - 1) * 0.40;
      camDriftTY = -((e.clientY / H) * 2 - 1) * 0.20;
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
        goToState(2); // Shadow click -> Horizon dive into Atlas
      } else {
        window.location.href = 'magazine.html'; // Disk click -> Open separate Magazine
      }
      return;
    }

    if (STATE === 1) {
      window.location.href = 'magazine.html';
    }
  }

  var ctaDisk   = document.querySelector('.cta-disk');
  var ctaShadow = document.querySelector('.cta-shadow');
  if (ctaDisk)   ctaDisk.addEventListener('click',   function () { goToState(1); });
  if (ctaShadow) ctaShadow.addEventListener('click', function () { goToState(2); });

  var magBackBtn = document.getElementById('mag-back');
  if (magBackBtn) magBackBtn.addEventListener('click', function () { goToState(0); });
  var magReturnBtn = document.getElementById('mag-return-bh');
  if (magReturnBtn) magReturnBtn.addEventListener('click', function () { goToState(0); });

  document.querySelectorAll('#state-label button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      goToState(parseInt(btn.dataset.state, 10));
    });
  });

  window.addEventListener('wheel', function (e) {
    // Passive wheel listener - never prevents default scrolling
    if (e.deltaY > 80 && STATE === 0) {
      // Optional subtle hint or smooth transition
    }
  }, { passive: true });

  var touchY0 = 0;
  canvas.addEventListener('touchstart', function (e) {
    touchY0 = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', function (e) {
    var dy = e.changedTouches[0].clientY - touchY0;
    if (Math.abs(dy) > 50) {
      if (dy < 0 && STATE === 0) {
        window.location.href = 'magazine.html';
      }
    } else {
      onCanvasClick({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
    }
  }, { passive: true });

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

  window.addEventListener('popstate', function (e) {
    var s = (e.state && e.state.s !== undefined) ? e.state.s : 0;
    goToState(s);
  });

  var btnQ = document.getElementById('btn-quality');
  if (btnQ) {
    btnQ.addEventListener('click', function () {
      var order = ['low', 'med', 'high'];
      var idx = order.indexOf(Q);
      Q = order[(idx + 1) % order.length];
      DPR = Math.min(window.devicePixelRatio || 1, 2) * QS[Q].scale;
      if (MOB) DPR = Math.min(DPR, 1.2);
      renderer.setPixelRatio(DPR);
      bhUniforms.uSteps.value = QS[Q].steps;
      btnQ.textContent = 'Quality: ' + Q.toUpperCase();
    });
  }

  var btnBH = document.getElementById('btn-bh-switch');
  if (btnBH) {
    btnBH.addEventListener('click', function () {
      currentBH = currentBH === 'sgr-a-star' ? 'm87-star' : 'sgr-a-star';
      btnBH.textContent = currentBH === 'sgr-a-star' ? 'Sgr A*' : 'M87*';

      if (currentBH === 'm87-star') {
        diskNormal.set(0.05, 0.96, 0.28).normalize();
        CAM_HOME.z = 9.8;
      } else {
        diskNormal.set(0.08, 0.92, 0.38).normalize();
        CAM_HOME.z = 9.2;
      }

      if (window.gsap) {
        gsap.to(camPos, {
          z: CAM_HOME.z,
          duration: 1.0, ease: 'power2.inOut',
          onUpdate: syncCamera
        });
      } else {
        camPos.z = CAM_HOME.z;
        syncCamera();
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

    // Interactive strands shimmer in State 1
    if (STATE === 1 && strandsBuilt) {
      strandObjs.forEach(function (so, idx) {
        var sm = so.userData.strandMesh;
        if (so !== hoveredStrand) {
          sm.material.opacity = 0.75 + 0.18 * Math.sin(t * 0.85 + strandPhases[idx]);
        }
      });
    }

    // Render active scene
    if (STATE !== 1 || !strandsBuilt) {
      bhMesh.visible = true;
      renderer.render(scene, bhCamera);
    } else {
      bhMesh.visible = false;
      if (strandsGroup) strandsGroup.visible = true;
      renderer.render(scene, strandCam);
    }

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
