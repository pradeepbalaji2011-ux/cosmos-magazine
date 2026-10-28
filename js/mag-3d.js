/* ============================================================
   COSMOS MAGAZINE — mag-3d.js
   3D Astronomical Visuals for the Magazine View:
   Galaxy beside News, Moon beside Observing, Planets beside Missions,
   Nebula beside Learn, Cosmic Web beside Atlas.
   ============================================================ */
(function () {
  'use strict';

  var magView = document.getElementById('magazine-view');
  var canvas = document.getElementById('mag-gl');
  if (!magView || !canvas) return;

  var mob = window.innerWidth < 760 || /Mobi|Android/i.test(navigator.userAgent);
  var rm  = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !mob, alpha: true });
  } catch (e) {
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mob ? 1 : 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03040a, 0.0035);

  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);

  scene.add(new THREE.AmbientLight(0x6070a0, 0.8));
  var sun = new THREE.DirectionalLight(0xfff0d8, 1.8);
  sun.position.set(30, 20, 40);
  scene.add(sun);

  function glow(c) {
    var k = document.createElement('canvas');
    k.width = k.height = 64;
    var x = k.getContext('2d');
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, c || 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(k);
  }

  var dot = glow();

  function pts(n, fn, size, op) {
    var p = new Float32Array(n * 3);
    var c = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) fn(i, p, c);
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({
      size: size,
      map: dot,
      vertexColors: true,
      transparent: true,
      opacity: op || 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    }));
  }

  function tex(base, bands, spots) {
    var k = document.createElement('canvas');
    k.width = 256; k.height = 128;
    var x = k.getContext('2d');
    x.fillStyle = base;
    x.fillRect(0, 0, 256, 128);
    for (var i = 0; i < bands; i++) {
      x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '0,0,0' : '255,255,255') + ',' + (Math.random() * 0.18) + ')';
      x.fillRect(0, Math.random() * 128, 256, Math.random() * 14);
    }
    for (i = 0; i < spots; i++) {
      x.fillStyle = 'rgba(0,0,0,' + Math.random() * 0.25 + ')';
      x.beginPath();
      x.arc(Math.random() * 256, Math.random() * 128, Math.random() * 9 + 1, 0, 6.3);
      x.fill();
    }
    return new THREE.CanvasTexture(k);
  }

  // Background star field
  var stars = pts(mob ? 1600 : 4000, function (i, p, c) {
    p[i * 3]     = (Math.random() - 0.5) * 160;
    p[i * 3 + 1] = (Math.random() - 0.5) * 100;
    p[i * 3 + 2] = 40 - Math.random() * 320;
    var t = 0.6 + Math.random() * 0.4;
    c[i * 3] = t; c[i * 3 + 1] = t; c[i * 3 + 2] = 1;
  }, 0.9, 0.85);
  scene.add(stars);

  // Key camera stops + object placement
  var K = [
    [0, 0, 14],      // 0: Home
    [3, 1, -24],     // 1: News (card right, galaxy left)
    [-3, 1, -72],    // 2: Observing (card left, moon right)
    [3, 0, -120],    // 3: Missions (card right, planets left)
    [-3, 1, -168],   // 4: Learn (card left, nebula right)
    [0, 0, -214]     // 5: Atlas (card right, web left)
  ];

  var O = {};

  function put(o, k, s, dz) {
    o.position.set(K[k][0] + s * 6.5, K[k][1] + (s > 0 ? 0 : 0.5), K[k][2] - (dz || 17));
    scene.add(o);
    return o;
  }

  // 1. 3D Spiral Galaxy beside News
  var gal = new THREE.Group();
  var c1 = new THREE.Color('#ffb870');
  var c2 = new THREE.Color('#5ee1ff');
  var tc = new THREE.Color();
  gal.add(pts(mob ? 2500 : 7000, function (i, p, c) {
    var r = Math.pow(Math.random(), 1.4) * 11;
    var a = (i % 3) / 3 * 6.283 + r * 0.55;
    var j = (Math.random() - 0.5) * (0.4 + r * 0.12);
    p[i * 3]     = Math.cos(a) * r + j * 2;
    p[i * 3 + 1] = (Math.random() - 0.5) * 0.8 * (1 - r / 14);
    p[i * 3 + 2] = Math.sin(a) * r + j * 2;
    tc.copy(c1).lerp(c2, r / 11);
    c[i * 3] = tc.r; c[i * 3 + 1] = tc.g; c[i * 3 + 2] = tc.b;
  }, 0.35));
  var core = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glow(), color: 0xffd9a0, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  core.scale.set(8, 8, 1);
  gal.add(core);
  gal.rotation.set(0.9, 0, 0.25);
  O.galaxy = put(gal, 1, -1, 18);

  // 2. 3D Moon with Glowing Atmosphere beside Observing
  var moon = new THREE.Mesh(
    new THREE.SphereGeometry(3.0, 40, 28),
    new THREE.MeshLambertMaterial({ map: tex('#a9a9ad', 10, 90) })
  );
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glow(), color: 0x7ca0ff, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.4
  }));
  halo.scale.set(13, 13, 1);
  moon.add(halo);
  O.moon = put(moon, 2, 1, 14);

  // 3. 3D Planets (Mars & Saturn with Rings) beside Space Exploration
  var pl = new THREE.Group();
  var mars = new THREE.Mesh(
    new THREE.SphereGeometry(2.0, 36, 24),
    new THREE.MeshLambertMaterial({ map: tex('#b5532f', 14, 40) })
  );
  var sat = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 36, 24),
    new THREE.MeshLambertMaterial({ map: tex('#cdb58a', 26, 4) })
  );
  var ring = new THREE.Mesh(
    new THREE.RingGeometry(3.6, 6.2, 80),
    new THREE.MeshBasicMaterial({ color: 0xd8c394, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
  );
  ring.rotation.x = 1.9;
  sat.add(ring);
  mars.position.set(-4, -1.5, 6);
  sat.position.set(4, 1.5, -4);
  sat.rotation.z = 0.4;
  pl.add(mars, sat);
  O.planets = put(pl, 3, -1, 16);

  // 4. 3D Emission Nebula beside Learn
  var neb = new THREE.Group();
  var cols = [0xe4572e, 0x9b8cff, 0x5ee1ff, 0xff6b9a];
  for (var i = 0; i < (mob ? 9 : 16); i++) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glow(), color: cols[i % 4], transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    var z = 14 + Math.random() * 16;
    s.scale.set(z, z, 1);
    s.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 12);
    neb.add(s);
  }
  neb.add(pts(500, function (idx, p, c) {
    p[idx * 3]     = (Math.random() - 0.5) * 18;
    p[idx * 3 + 1] = (Math.random() - 0.5) * 10;
    p[idx * 3 + 2] = (Math.random() - 0.5) * 12;
    c[idx * 3] = 1; c[idx * 3 + 1] = 0.9; c[idx * 3 + 2] = 1;
  }, 0.5));
  O.nebula = put(neb, 4, 1, 18);

  // 5. 3D Cosmic Web beside Atlas
  var web = new THREE.Group();
  var N = mob ? 50 : 100;
  var nd = [], lp = [];
  for (i = 0; i < N; i++) {
    var v = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize().multiplyScalar(Math.random() * 11);
    nd.push(v);
  }
  for (i = 0; i < N; i++) {
    for (var j = i + 1; j < N; j++) {
      if (nd[i].distanceTo(nd[j]) < 4.6) {
        lp.push(nd[i].x, nd[i].y, nd[i].z, nd[j].x, nd[j].y, nd[j].z);
      }
    }
  }
  var lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  web.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
    color: 0x5ee1ff, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending
  })));
  web.add(pts(N, function (idx, p, c) {
    p[idx * 3]     = nd[idx].x;
    p[idx * 3 + 1] = nd[idx].y;
    p[idx * 3 + 2] = nd[idx].z;
    c[idx * 3] = 1; c[idx * 3 + 1] = 0.85; c[idx * 3 + 2] = 0.6;
  }, 1.6));
  O.web = put(web, 5, -1, 15);
  O.stars = stars;

  // Camera spline flight & mouse parallax
  var curve = new THREE.CatmullRomCurve3(K.map(function (a) {
    return new THREE.Vector3(a[0], a[1], a[2]);
  }));

  var cur = 0, tgt = 0, mx = 0, my = 0, smx = 0, smy = 0;
  var hov = {};
  var look = new THREE.Vector3(), pos = new THREE.Vector3();

  window.addEventListener('pointermove', function (e) {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // Card hover reaction
  document.querySelectorAll('#magazine-view .card').forEach(function (c) {
    var k = c.dataset.o;
    if (!k) return;
    c.addEventListener('pointerenter', function () { hov[k] = 1; });
    c.addEventListener('pointerleave', function () { hov[k] = 0; });
  });

  function prog() {
    var h = magView.scrollHeight - magView.clientHeight;
    return h > 0 ? Math.min(1, Math.max(0, magView.scrollTop / h)) : 0;
  }

  magView.addEventListener('scroll', function () {
    tgt = prog();
  }, { passive: true });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  var clock = new THREE.Clock();
  var raf = 0;

  function frame() {
    if (!magView.classList.contains('open')) {
      raf = 0;
      return;
    }
    var dt = clock.getDelta();
    var t  = clock.getElapsedTime();

    cur += (tgt - cur) * (rm ? 1 : 0.06);
    smx += (mx - smx) * 0.05;
    smy += (my - smy) * 0.05;

    curve.getPointAt(Math.min(cur, 1), pos);
    camera.position.set(pos.x - smx * 1.6, pos.y + smy * 1, pos.z);
    look.set(pos.x + smx * 3, pos.y - smy * 2, pos.z - 10);
    camera.lookAt(look);

    if (!rm) {
      gal.rotation.y  += dt * 0.08;
      moon.rotation.y += dt * 0.12;
      mars.rotation.y += dt * 0.22;
      sat.rotation.y  += dt * 0.16;
      neb.rotation.y  += dt * 0.025;
      web.rotation.y  += dt * 0.05;
      stars.rotation.z = Math.sin(t * 0.05) * 0.01;
    }

    if (!mob) {
      for (var k in O) {
        var h = hov[k] ? 1.25 : 1.0;
        var o = O[k];
        if (o) {
          o.scale.x += (h - o.scale.x) * 0.08;
          o.scale.y = o.scale.z = o.scale.x;
        }
      }
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  // Observer to trigger loop when #magazine-view is opened
    function startLoop() {
    if (!raf) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      clock.getDelta();
      tgt = prog();
      cur = tgt;
      raf = requestAnimationFrame(frame);
    }
  }

  var observer = new MutationObserver(function () {
    if (magView.classList.contains('open')) {
      startLoop();
    } else {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }
  });

  observer.observe(magView, { attributes: true, attributeFilter: ['class'] });

  // Initial check
  if (magView.classList.contains('open')) {
    raf = requestAnimationFrame(frame);
  }
})();
