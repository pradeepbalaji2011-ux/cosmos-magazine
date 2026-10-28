/* ============================================================
   Cosmos Magazine — Immersive Black Hole Home Page
   js/home-bh.js  — Three.js r128, no build step
   ============================================================ */
(function () {
  'use strict';

  /* ── 0. Config ─────────────────────────────────────────── */
  var MOB = innerWidth < 760 || /Mobi|Android/i.test(navigator.userAgent);
  var RM  = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var Q   = MOB ? 'low' : 'high';
  var QS  = {
    low:  { steps: 60,  scale: 0.5,  bloom: false },
    med:  { steps: 110, scale: 0.75, bloom: true  },
    high: { steps: 160, scale: 1.0,  bloom: true  }
  };
  var CAM_Z_INIT  = 12;
  var CAM_Z_CLOSE = 3.5;
  var FOV         = 60;
  var DISK_INC    = 20;   // degrees — home-page view
  var NODE_R      = 4.5;  // world units, just outside shadow
  var W = innerWidth, H = innerHeight, asp = W / H;

  /* ── 1. Article data ───────────────────────────────────── */
  var ARTICLES = [
    { slug:'galaxies-filaments', title:'How galaxies grow filaments of hot gas',
      cat:'News', catColor:'#ffb454',
      summary:'Cosmic-web filaments of hot ionised gas connect galaxy clusters across millions of light-years.',
      atlasId: null, angle: 0.15 },
    { slug:'atmosphere-glows', title:'Earth from orbit: why our atmosphere glows',
      cat:'News', catColor:'#ffb454',
      summary:'A thin luminous veil surrounds our planet — airglow painted by photochemistry high above.',
      atlasId:'earth', angle: 0.72 },
    { slug:'solar-cycles', title:'Solar cycles explained, from spots to storms',
      cat:'News', catColor:'#ffb454',
      summary:'Every eleven years the Sun swings from quiet to stormy, driving space weather across the solar system.',
      atlasId:'sun', angle: 1.25 },
    { slug:'dark-adapt', title:'Give your eyes 20 minutes to dark-adapt',
      cat:'Observing', catColor:'#5ee1ff',
      summary:'Cone-to-rod transition takes 20 minutes — one bright light resets the clock completely.',
      atlasId: null, angle: 1.85 },
    { slug:'moon-phase', title:'Check the Moon phase before planning dark-sky sessions',
      cat:'Observing', catColor:'#5ee1ff',
      summary:'A bright Moon washes out faint nebulae. Plan your best sessions around the new Moon.',
      atlasId:'moon', angle: 2.35 },
    { slug:'life-on-mars', title:'The long search for life on Mars',
      cat:'Exploration', catColor:'#e4572e',
      summary:'Three billion years of tantalising clues — and still no confirmed biology in the Martian dust.',
      atlasId:'mars', angle: 2.9 },
    { slug:'gas-giants-ice-giants', title:'Gas giants versus ice giants',
      cat:'Exploration', catColor:'#e4572e',
      summary:'Jupiter and Saturn are mostly hydrogen and helium; Uranus and Neptune hide icy interiors.',
      atlasId:'jupiter', angle: 3.6 },
    { slug:'saturns-rings', title:"Saturn's rings: young, thin and temporary?",
      cat:'Exploration', catColor:'#e4572e',
      summary:"Saturn's iconic rings may be only 100 million years old and are slowly falling inward.",
      atlasId:'saturn', angle: 4.2 },
    { slug:'nebulae', title:'Nebulae: nurseries and graveyards of stars',
      cat:'Learn', catColor:'#9b8cff',
      summary:'The same glowing clouds of gas and dust where stars are born also glow as their remnants fade.',
      atlasId:'orion-nebula', angle: 4.85 },
    { slug:'milky-way', title:'Walking through the spiral arms',
      cat:'Learn', catColor:'#9b8cff',
      summary:'The Sun sits in the Orion Spur, between the Perseus and Sagittarius arms of our galaxy.',
      atlasId: null, angle: 5.5 }
  ];

  /* ── 2. Three.js Renderer ──────────────────────────────── */
  var canvas = document.getElementById('bh');
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false });
  } catch (e) {
    // WebGL failure → show classic page
    window.location.replace('index-classic.html');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, MOB ? 1 : 1.5) * QS[Q].scale);
  renderer.setSize(W, H);

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(FOV, asp, 0.01, 1000);
  camera.position.set(0, 0, CAM_Z_INIT);

  /* ── 3. Black Hole Shaders ─────────────────────────────── */
  var BHV = [
    'uniform float uAsp, uFov;',
    'varying vec3 vP;',
    'void main(){',
    '  vP = vec3(position.x * uAsp * uFov, position.y * uFov, -1.0);',
    '  gl_Position = vec4(position.xy, 0., 1.);',
    '}'
  ].join('\n');

  // hash functions for procedural starfield
  var BHF = [
    'uniform vec3  uO;',      // camera position (virtual)
    'uniform vec3  uN;',      // disk normal
    'uniform float uSteps;',  // ray-march steps
    'uniform float uT;',      // time
    'uniform float uInterstellar;', // 0=physical, 1=balanced
    'uniform float uDimness;',      // 0=normal, 1=black (dive)
    'varying vec3 vP;',

    // ---- Hash / noise ----
    'float hash11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}',
    'float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}',
    'vec3  hash31(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453123);}',

    'void main(){',
    '  vec3 d = normalize(vP);',         // ray direction (view space)
    '  vec3 o = uO;',                    // ray origin

    // Schwarzschild ray march
    '  float rs = 1.0;',                 // Schwarzschild radius = 1 in our units
    '  float RB = 26.;',                 // boundary sphere radius
    '  float dt = RB / uSteps;',
    '  vec3  pos = o;',
    '  float al = 0.;',
    '  vec3  col = vec3(0.);',
    '  bool  hit = false;',
    '  float minR = 9999.;',
    '  vec3  lastD = d;',

    '  for(float i=0.; i<512.; i++){',
    '    if(i>=uSteps) break;',
    '    float r = length(pos);',
    '    if(r < 1.02){ hit=true; break; }',  // event horizon
    '    if(r > RB) break;',                   // escaped

    // Geodesic deflection (Schwarzschild, simplified Verlet)
    '    float r2 = r*r;',
    '    float r3 = r2*r;',
    '    vec3  gr = -1.5*rs*pos/(r3*r2);',    // second derivative of x
    '    vec3  acc = gr * (1. - dot(d,d)*0.);',
    '    d += acc * dt;',
    '    d = normalize(d);',
    '    pos += d * dt;',
    '    r = length(pos);',
    '    minR = min(minR, r);',

    // Disk: flat torus in the disk plane (uN = disk normal)
    '    float h = dot(pos, uN);',             // height above disk
    '    float rr = sqrt(r*r - h*h);',         // cylindrical radius
    '    if(abs(h) < 0.18 && rr > 2.8 && rr < 14.){',
    '      float ph = atan(pos.y, pos.x);',
    // Keplerian angular velocity for Doppler
    '      float vK = sqrt(0.5/max(rr,0.5));', // simplified Keplerian
    '      vec3 vel = vec3(-sin(ph), cos(ph), 0.) * vK * sign(dot(uN,vec3(0.,0.,1.)));',
    '      float dop = dot(vel, d);',
    '      float gt  = 1.0/(1.0 - rs/max(r,1.05));', // gravitational redshift (approx)
    '      float effDop = mix(dop, 0.0, uInterstellar);',
    '      float boost = pow(max(1.0 + effDop, 0.3), 3.0) * (1. - uInterstellar*0.15);',

    // Turbulence
    '      float spiral = .5+.5*sin(rr*2.2 - ph*2. + uT*0.9);',
    '      float turb = sin(7.*(ph+uT*3.6*pow(rr,-1.5))+rr*5.)*sin(rr*13.-ph*2.);',
    '      float tb = .6 + .4*mix(turb, spiral, .45);',

    // Color: inner hot orange-white → outer amber
    '      float t = clamp((rr-2.8)/(14.-2.8),0.,1.);',
    '      vec3 diskCol = mix(vec3(1.,.38,.08), vec3(1.,.93,.82), pow(1.-t,.6));',
    '      diskCol = mix(diskCol, vec3(.7,.85,1.0), clamp((boost-3.)*0.3,0.,1.));', // blue at extreme boost
    '      float brightness = boost * tb * (1./(1.+t*1.5));',
    '      diskCol *= brightness;',

    // Accumulate with alpha compositing
    '      float dAl = clamp(brightness * 0.18, 0., 0.85);',
    '      col += diskCol * (1.-al) * dAl;',
    '      al  += (1.-al) * dAl;',
    '      if(al>0.98) break;',
    '    }',
    '  }',

    // Photon ring glow
    '  float photon = smoothstep(3.0, 1.5, minR) * (1.-al);',
    '  col += vec3(.95,.72,.3) * photon * 0.8;',
    '  al  = max(al, photon*0.4);',

    // Event horizon
    '  if(hit){ col=vec3(0.); al=1.; }',

    // Procedural starfield (when ray escapes)
    '  if(!hit && al < 0.99){',
    '    vec3 v = lastD;',                      // escaped ray direction
    '    vec2 uv = vec2(atan(v.z,v.x)/(2.*3.14159)+.5, asin(clamp(v.y,-1.,1.))/3.14159+.5);',
    '    float starNoise = hash12(floor(uv*600.));',
    '    float isStar = step(.993, starNoise);',
    '    float starBright = hash12(floor(uv*600.)+vec2(7.3,4.1));',
    '    vec3  starCol = mix(vec3(.8,.85,1.), vec3(1.,.9,.7), hash12(floor(uv*600.)+vec2(2.1,9.3)));',
    '    starCol *= isStar * (0.6 + starBright*0.8);',
    '    col = col + starCol*(1.-al);',
    '  }',

    // Grain
    '  float grain = (fract(sin(dot(vP.xy,vec2(127.1,311.7))*(uT*.01+1.))*43758.5)*2.-1.)*0.016;',
    '  col += grain;',

    // Dive dimness
    '  col *= (1. - uDimness);',

    '  gl_FragColor = vec4(max(col,vec3(0.)), max(al, 0.01));',
    '}'
  ].join('\n');

  /* composite post-process shader (bloom + vignette + CA) */
  var COMPV = [
    'varying vec2 vUv;',
    'void main(){ vUv=uv; gl_Position=vec4(position,1.); }'
  ].join('\n');

  var COMPF = [
    'uniform sampler2D tScene;',
    'uniform float uTime, uAsp;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec2 uv = vUv;',
    // Chromatic aberration (very subtle near edges)
    '  float dist = length(uv - .5)*2.;',
    '  float ca = dist*dist*0.003;',
    '  vec4 cr = texture2D(tScene, uv + vec2(ca,0.));',
    '  vec4 cg = texture2D(tScene, uv);',
    '  vec4 cb = texture2D(tScene, uv - vec2(ca,0.));',
    '  vec3 col = vec3(cr.r, cg.g, cb.b);',
    // Bloom: brightpass blur (7 taps)
    '  float px = 1./800.; float py = 1./450.;',
    '  vec3 bloom = vec3(0.);',
    '  float bw=0.;',
    '  for(int ix=-3;ix<=3;ix++){ for(int iy=-3;iy<=3;iy++){',
    '    vec3 s=texture2D(tScene,uv+vec2(float(ix)*px*2.,float(iy)*py*2.)).rgb;',
    '    float br=dot(s,vec3(.2126,.7152,.0722));',
    '    float w=max(0.,br-0.6)*max(0.,br-0.6);',
    '    bloom+=s*w; bw+=w;',
    '  }}',
    '  if(bw>0.) col += bloom/bw*0.55;',
    // Vignette
    '  float vig = 1.0 - dist*dist*0.5;',
    '  col *= vig;',
    // Film grain
    '  float g=(fract(sin(dot(uv,vec2(127.1,311.7))*uTime*0.1)*43758.5)*2.-1.)*0.018;',
    '  col += g;',
    '  gl_FragColor = vec4(max(col,vec3(0.)),1.);',
    '}'
  ].join('\n');

  /* ── 4. BH Mesh (fullscreen quad) ─────────────────────── */
  var inc = DISK_INC * Math.PI / 180;
  var bhUniforms = {
    uO:            { value: new THREE.Vector3(0, 0, CAM_Z_INIT) },
    uN:            { value: new THREE.Vector3(-Math.sin(inc), 0, Math.cos(inc)) },
    uSteps:        { value: QS[Q].steps },
    uT:            { value: 0 },
    uAsp:          { value: asp },
    uFov:          { value: Math.tan(FOV * Math.PI / 360) },
    uInterstellar: { value: 0 },
    uDimness:      { value: 0 }
  };
  var bhMat  = new THREE.ShaderMaterial({
    uniforms: bhUniforms,
    vertexShader: BHV,
    fragmentShader: BHF,
    depthTest: false,
    depthWrite: false
  });
  var bhMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bhMat);
  bhMesh.renderOrder = -10;
  bhMesh.frustumCulled = false;
  scene.add(bhMesh);

  /* ── 5. Post-processing (med/high only) ───────────────── */
  var rtMain = null, scenePost = null, ortho = null, compMesh = null;
  function buildPost() {
    if (rtMain) { rtMain.dispose(); }
    rtMain = new THREE.WebGLRenderTarget(
      Math.round(W * QS[Q].scale), Math.round(H * QS[Q].scale),
      { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, stencilBuffer: false }
    );
    if (!scenePost) {
      scenePost = new THREE.Scene();
      ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      var compMat = new THREE.ShaderMaterial({
        uniforms: { tScene: { value: null }, uTime: { value: 0 }, uAsp: { value: asp } },
        vertexShader: COMPV,
        fragmentShader: COMPF,
        depthTest: false, depthWrite: false
      });
      compMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compMat);
      compMesh.frustumCulled = false;
      scenePost.add(compMesh);
    }
  }
  if (QS[Q].bloom) buildPost();

  /* ── 6. Node Sprites ───────────────────────────────────── */
  function makeNodeTex(color) {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32,32,0, 32,32,32);
    // Parse hex to rgba
    var r = parseInt(color.slice(1,3),16), gr2 = parseInt(color.slice(3,5),16), b = parseInt(color.slice(5,7),16);
    g.addColorStop(0,   'rgba('+r+','+gr2+','+b+',1)');
    g.addColorStop(0.35,'rgba('+r+','+gr2+','+b+',0.45)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(c);
  }

  ARTICLES.forEach(function(art) {
    var x = Math.cos(art.angle) * NODE_R;
    var y = Math.sin(art.angle) * NODE_R * Math.cos(inc);
    var z = 0.4;
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeNodeTex(art.catColor),
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      opacity: 0.85
    }));
    sprite.scale.set(0.85, 0.85, 1);
    sprite.position.set(x, y, z);
    sprite.renderOrder = 5;
    scene.add(sprite);
    art.sprite   = sprite;
    art.worldPos = new THREE.Vector3(x, y, z);
  });

  /* ── 7. Thread Lines (Level 2) ────────────────────────── */
  ARTICLES.forEach(function(art) {
    var pts = [];
    for (var t = 0; t <= 24; t++) {
      var frac = t / 24;
      var rr = 2.8 + frac * (5.8 - 2.8);
      var ang = art.angle + frac * 0.35;
      var x = Math.cos(ang) * rr;
      var y = Math.sin(ang) * rr * Math.cos(inc);
      pts.push(new THREE.Vector3(x, y, 0.1));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(art.catColor),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthTest: false
    });
    var line = new THREE.Line(geo, mat);
    line.renderOrder = 3;
    scene.add(line);
    art.thread    = line;
    art.threadMat = mat;
  });

  /* ── 8. Hover / Click state ───────────────────────────── */
  var hoveredNode = null;
  var mouseX = W / 2, mouseY = H / 2;
  var hoverCard    = document.getElementById('hover-card');
  var threadCard   = document.getElementById('thread-card');
  var zoomLevel    = 0;    // 0.0 – 2.0 continuous
  var camZTarget   = CAM_Z_INIT;
  var camZCurrent  = CAM_Z_INIT;
  var camDriftX = 0, camDriftY = 0, camDriftTX = 0, camDriftTY = 0;
  var currentBH    = 'sgr-a-star';
  var diveDone     = false;

  /* Project a world point to screen px */
  function toScreen(wp) {
    var sp = wp.clone().project(camera);
    return { x: (sp.x * .5 + .5) * W, y: (-sp.y * .5 + .5) * H };
  }

  function checkHover() {
    if (zoomLevel > 0.7) { hideHoverCard(); return; }
    var closest = null, bestD2 = 60 * 60;
    ARTICLES.forEach(function(art) {
      var sc = toScreen(art.worldPos);
      var dx = sc.x - mouseX, dy = sc.y - mouseY;
      var d2 = dx*dx + dy*dy;
      if (d2 < bestD2) { bestD2 = d2; closest = art; }
    });
    if (closest !== hoveredNode) {
      hoveredNode = closest;
      updateHoverCard();
    }
  }

  function hideHoverCard() { if (!hoverCard.hidden) { hoverCard.hidden = true; } }

  function updateHoverCard() {
    if (!hoveredNode) { hideHoverCard(); return; }
    var sc = toScreen(hoveredNode.worldPos);
    var cx = Math.min(sc.x + 24, W - 320);
    var cy = Math.max(sc.y - 60, 80);
    hoverCard.style.left = cx + 'px';
    hoverCard.style.top  = cy + 'px';
    hoverCard.querySelector('.hc-cat').textContent  = hoveredNode.cat;
    hoverCard.querySelector('.hc-cat').style.color  = hoveredNode.catColor;
    hoverCard.querySelector('h3').textContent        = hoveredNode.title;
    hoverCard.querySelector('p').textContent         = hoveredNode.summary;
    var links = hoverCard.querySelector('.hc-links');
    links.innerHTML = '<a href="articles/' + hoveredNode.slug + '.html">Read article →</a>';
    if (hoveredNode.atlasId) {
      links.innerHTML += ' <a href="#" data-atlas-obj="' + hoveredNode.atlasId + '">View in Atlas</a>';
    }
    hoverCard.hidden = false;
  }

  function showThreadCard(art) {
    var sc = toScreen(art.worldPos);
    var cx = Math.min(sc.x + 30, W - 380);
    var cy = Math.max(sc.y - 100, 80);
    threadCard.style.left = cx + 'px';
    threadCard.style.top  = cy + 'px';
    // Hero image: try webp then jpg
    var img = document.getElementById('thread-img');
    img.src = 'images/articles/' + art.slug + '-1600.webp';
    img.onerror = function() { this.src = 'images/articles/' + art.slug + '-1600.jpg'; };
    img.alt = art.title;
    document.getElementById('tc-cat').textContent  = art.cat;
    document.getElementById('tc-cat').style.color  = art.catColor;
    document.getElementById('thread-card').querySelector('h3').textContent = art.title;
    document.getElementById('thread-card').querySelector('p').textContent  = art.summary;
    var tcLinks = document.getElementById('tc-links');
    tcLinks.innerHTML = '<a href="articles/' + art.slug + '.html">Read article →</a>';
    if (art.atlasId) {
      tcLinks.innerHTML += ' <a href="#" data-atlas-obj="' + art.atlasId + '">View in Atlas</a>';
    }
    threadCard.hidden = false;
  }

  /* ── 9. Zoom system ────────────────────────────────────── */
  function updateZoomLevel() {
    var zl;
    var zRing = CAM_Z_INIT - 1;    // 11 — ring zone boundary
    var zThread = 5.5;              // threads appear here
    if (camZTarget >= zRing) {
      zl = 0;
    } else if (camZTarget <= zThread) {
      zl = 1 + (zThread - camZTarget) / (zThread - CAM_Z_CLOSE);
    } else {
      zl = (zRing - camZTarget) / (zRing - zThread);
    }
    zoomLevel = Math.max(0, Math.min(2, zl));

    // Thread opacity
    var tOp = Math.max(0, Math.min(1, (zoomLevel - 0.3) * 2));
    ARTICLES.forEach(function(a) { a.threadMat.opacity = tOp; });

    // Node opacity
    var nOp = Math.max(0, 1 - Math.max(0, (zoomLevel - 0.85) * 3));
    ARTICLES.forEach(function(a) { a.sprite.material.opacity = nOp * 0.85; });

    updateZoomIndicator();
    if (zoomLevel >= 1.95 && !diveDone) triggerDive();
  }

  var zoomBtns = document.querySelectorAll('#zoom-ind button');
  function updateZoomIndicator() {
    var lvl = Math.min(2, Math.round(zoomLevel));
    zoomBtns.forEach(function(b, i) { b.classList.toggle('active', i === lvl); });
  }
  zoomBtns[0].onclick = function() { camZTarget = CAM_Z_INIT; updateZoomLevel(); };
  zoomBtns[1].onclick = function() { camZTarget = 7; updateZoomLevel(); };
  zoomBtns[2].onclick = function() { triggerDive(); };

  /* Scroll wheel */
  window.addEventListener('wheel', function(e) {
    e.preventDefault();
    camZTarget -= e.deltaY * 0.006 * (camZTarget / CAM_Z_INIT);
    camZTarget = Math.max(CAM_Z_CLOSE, Math.min(CAM_Z_INIT + 2, camZTarget));
    updateZoomLevel();
  }, { passive: false });

  /* Pinch to zoom (touch) */
  var lastPinch = 0;
  canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
      lastPinch = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', function(e) {
    if (e.touches.length === 2) {
      var d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastPinch > 0) {
        camZTarget *= lastPinch / d;
        camZTarget = Math.max(CAM_Z_CLOSE, Math.min(CAM_Z_INIT + 2, camZTarget));
        updateZoomLevel();
      }
      lastPinch = d;
    }
  }, { passive: true });

  /* ── 10. Mouse / touch interaction ─────────────────────── */
  canvas.addEventListener('mousemove', function(e) {
    mouseX = e.clientX; mouseY = e.clientY;
    camDriftTX = (e.clientX / W * 2 - 1) * 0.28;
    camDriftTY = -(e.clientY / H * 2 - 1) * 0.14;
  });

  canvas.addEventListener('click', function(e) {
    if (zoomLevel > 0.6 && zoomLevel < 1.5) {
      // Level 2 — show thread card for hovered node
      if (hoveredNode) { showThreadCard(hoveredNode); return; }
    }
    if (zoomLevel <= 0.6 && hoveredNode) {
      // Level 1 — navigate to article
      window.location.href = 'articles/' + hoveredNode.slug + '.html';
    }
  });

  document.getElementById('thread-card-close').onclick = function() {
    threadCard.hidden = true;
  };

  /* Touch tap on mobile: show hover card then navigate */
  var lastTap = 0;
  canvas.addEventListener('touchend', function(e) {
    if (e.changedTouches.length !== 1) return;
    var t = e.changedTouches[0];
    mouseX = t.clientX; mouseY = t.clientY;
    checkHover();
    var now = Date.now();
    if (now - lastTap < 400 && hoveredNode) {
      window.location.href = 'articles/' + hoveredNode.slug + '.html';
    }
    lastTap = now;
  }, { passive: true });

  /* ── 11. Dive animation ────────────────────────────────── */
  var diveOverlay = document.getElementById('dive-overlay');
  function triggerDive() {
    if (diveDone) return;
    diveDone = true;
    diveOverlay.hidden = false;
    // Small delay so it renders one frame before class is added
    setTimeout(function() { diveOverlay.classList.add('on'); }, 16);
    var start = null;
    function animDive(ts) {
      if (!start) start = ts;
      var prog = Math.min((ts - start) / 2500, 1);
      bhUniforms.uDimness.value = prog * prog;
      if (prog < 1) {
        requestAnimationFrame(animDive);
      } else {
        var url = 'atlas.html?v=7&ref=index.html#' + currentBH;
        window.location.href = url;
      }
    }
    requestAnimationFrame(animDive);
  }

  /* ── 12. Black hole switcher ───────────────────────────── */
  function setBH(id) {
    currentBH = id;
    var newInc = (id === 'm87-star' ? 17 : 30) * Math.PI / 180;
    bhUniforms.uN.value.set(-Math.sin(newInc), 0, Math.cos(newInc));
    bhUniforms.uInterstellar.value = id === 'm87-star' ? 0.3 : 0;
    document.getElementById('btn-sgrastar').classList.toggle('active', id === 'sgr-a-star');
    document.getElementById('btn-m87').classList.toggle('active', id === 'm87-star');
    document.getElementById('dive-target').textContent = id === 'm87-star' ? 'M87*' : 'Sagittarius A*';
  }
  document.getElementById('btn-sgrastar').onclick = function() { setBH('sgr-a-star'); };
  document.getElementById('btn-m87').onclick       = function() { setBH('m87-star'); };

  /* ── 13. Interstellar toggle ───────────────────────────── */
  var btnIS = document.getElementById('btn-interstellar');
  btnIS.addEventListener('click', function() {
    var v = bhUniforms.uInterstellar.value > 0 ? 0 : (currentBH === 'm87-star' ? 0.3 : 1.0);
    bhUniforms.uInterstellar.value = v;
    this.setAttribute('aria-pressed', String(v > 0));
  });

  /* ── 14. Quality button ────────────────────────────────── */
  var qOrder = ['low', 'med', 'high'];
  var btnQ = document.getElementById('btn-quality');
  btnQ.textContent = 'Quality: ' + Q.toUpperCase();
  btnQ.onclick = function() {
    var idx = (qOrder.indexOf(Q) + 1) % 3;
    Q = qOrder[idx];
    this.textContent = 'Quality: ' + Q.toUpperCase();
    bhUniforms.uSteps.value = QS[Q].steps;
    var pr = Math.min(devicePixelRatio, MOB ? 1 : 1.5) * QS[Q].scale;
    renderer.setPixelRatio(pr);
    if (QS[Q].bloom) {
      buildPost();
    } else {
      if (rtMain) { rtMain.dispose(); rtMain = null; }
    }
  };

  /* ── 15. Side panel ────────────────────────────────────── */
  var sidePanel = document.getElementById('side-panel');
  document.getElementById('btn-panel').onclick      = function() { sidePanel.hidden = !sidePanel.hidden; };
  document.getElementById('btn-panel-close').onclick = function() { sidePanel.hidden = true; };

  /* ── 16. Keyboard ──────────────────────────────────────── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      hoverCard.hidden  = true;
      threadCard.hidden = true;
      sidePanel.hidden  = true;
    }
  });

  /* ── 17. Atlas modal links (data-atlas-obj) ────────────── */
  // Delegated from hover / thread cards — handled by inline script in index.html

  /* ── 18. Resize ────────────────────────────────────────── */
  window.addEventListener('resize', function() {
    W = innerWidth; H = innerHeight; asp = W / H;
    camera.aspect = asp;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    bhUniforms.uAsp.value = asp;
    bhUniforms.uFov.value = Math.tan(FOV * Math.PI / 360);
    if (rtMain) {
      rtMain.setSize(Math.round(W * QS[Q].scale), Math.round(H * QS[Q].scale));
    }
    if (compMesh) compMesh.material.uniforms.uAsp.value = asp;
  });

  /* ── 19. Render loop ───────────────────────────────────── */
  var clock      = new THREE.Clock();
  var firstFrame = true;

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var elapsed = clock.getElapsedTime();

    /* Time for disk animation */
    if (!RM) bhUniforms.uT.value = elapsed;

    /* Smooth camera Z */
    camZCurrent += (camZTarget - camZCurrent) * Math.min(dt * 4, 0.99);
    bhUniforms.uO.value.set(camDriftX, camDriftY, camZCurrent);

    /* Gentle orbit drift */
    if (!RM) {
      camDriftX += (camDriftTX - camDriftX) * 0.025;
      camDriftY += (camDriftTY - camDriftY) * 0.025;
    }
    camera.position.set(camDriftX, camDriftY, camZCurrent);
    camera.lookAt(camDriftX * 0.2, camDriftY * 0.2, 0);
    bhUniforms.uO.value.copy(camera.position);

    /* Hover check every frame (cheap) */
    checkHover();

    /* Render */
    if (QS[Q].bloom && rtMain && compMesh) {
      renderer.setRenderTarget(rtMain);
      renderer.render(scene, camera);
      compMesh.material.uniforms.tScene.value = rtMain.texture;
      compMesh.material.uniforms.uTime.value  = elapsed;
      renderer.setRenderTarget(null);
      renderer.render(scenePost, ortho);
    } else {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }

    /* Remove loading screen after first render */
    if (firstFrame) {
      firstFrame = false;
      var ls = document.getElementById('loading');
      if (ls) {
        ls.style.opacity = '0';
        setTimeout(function() { ls.remove(); }, 700);
      }
    }
  }
  animate();
})();
