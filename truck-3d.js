/* truck-3d.js — the real-3D globe on the TrueShipping.us home page (/).
   Lewis, 11/19: "Do the same 3D on trueshipping.us" (after the WebGL hero on his own page: "It needs to
   be more impressive because folks are going to be looking at that because we do websites").

   WebGL (three.js r128, cdnjs, loaded after the page): North America in glowing dots on a 3D Earth with
   an atmosphere, freight lanes arcing from Myrtle Beach to the cities and ports the agency serves, a
   truck light running each lane, labelled city markers, two orbit rings and a particle field. The globe
   sways to keep North America facing the visitor and turns toward the mouse or the phone's tilt.
   It sits exactly where home-3d.js drew the flat globe (same .g3d box) and, once it is running, tells
   that one to stop (window.__g2dStop). No WebGL, or reduced motion: the flat globe stays. */
(function () {
  var hero = document.getElementById("s01");
  if (!hero) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var probe = document.createElement("canvas");
  if (!(probe.getContext("webgl") || probe.getContext("experimental-webgl"))) return;

  function boot() {
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.async = true; s.onload = start;
    document.head.appendChild(s);
  }
  if (document.readyState === "complete") setTimeout(boot, 300); else addEventListener("load", function () { setTimeout(boot, 300); });

  var HOME = { n: "Myrtle Beach", lat: 33.69, lon: -78.89 };
  var C = [
    { n: "Atlanta", lat: 33.75, lon: -84.39 }, { n: "Chicago", lat: 41.88, lon: -87.63 }, { n: "Dallas", lat: 32.78, lon: -96.8 },
    { n: "Los Angeles", lat: 34.05, lon: -118.24 }, { n: "New York", lat: 40.71, lon: -74.0 }, { n: "Miami", lat: 25.76, lon: -80.19 },
    { n: "Denver", lat: 39.74, lon: -104.99 }, { n: "Seattle", lat: 47.61, lon: -122.33 }, { n: "Toronto", lat: 43.65, lon: -79.38 },
    { n: "Monterrey", lat: 25.69, lon: -100.32 }, { n: "Savannah", lat: 32.08, lon: -81.09 }, { n: "Laredo", lat: 27.53, lon: -99.48 },
    { n: "Memphis", lat: 35.15, lon: -90.05 }, { n: "Phoenix", lat: 33.45, lon: -112.07 }, { n: "Montréal", lat: 45.5, lon: -73.57 },
  ];
  var LABEL = { "Myrtle Beach": 1, "Los Angeles": 1, "Toronto": 1, "Monterrey": 1, "Dallas": 1, "New York": 1 };
  /* the same rough outline of North America home-3d.js uses */
  var NA = [[-168,66],[-160,71],[-140,70],[-125,70],[-110,73],[-95,72],[-85,70],[-80,63],[-90,57],[-82,52],[-78,58],[-68,60],[-62,58],[-56,52],[-60,47],[-66,45],[-70,42],[-74,40],[-76,35],[-81,31],[-80,26],[-82,26],[-83,29],[-89,30],[-94,29],[-97,26],[-97,22],[-95,18.5],[-91,19],[-90.5,21.3],[-87,21.5],[-88,16],[-84,15],[-83,10],[-79,9],[-80,7.5],[-86,11],[-92,14.5],[-97,16],[-105,20],[-106,23],[-109,24],[-112.5,29],[-114.5,31.5],[-112,26],[-110,23],[-112.5,24.5],[-115,28],[-117,32],[-120,34],[-124,40],[-124,46],[-125,49],[-131,54],[-140,60],[-150,61],[-158,58],[-165,60],[-168,66]];
  function inNA(lon, lat) { var c = false; for (var i = 0, j = NA.length - 1; i < NA.length; j = i++) { var a = NA[i], b = NA[j]; if (((a[1] > lat) !== (b[1] > lat)) && (lon < (b[0] - a[0]) * (lat - a[1]) / (b[1] - a[1]) + a[0])) c = !c; } return c; }
  var D = Math.PI / 180;

  function glow(rgb) {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d"), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(" + rgb + ",1)"); grd.addColorStop(0.3, "rgba(" + rgb + ",.5)"); grd.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function start() {
    var T = window.THREE; if (!T) return;
    var R = 5;
    function v3(lat, lon, r) { lat *= D; lon *= D; return new T.Vector3(r * Math.cos(lat) * Math.sin(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.cos(lon)); }

    var box = document.createElement("div"); box.className = "g3d g3d-gl"; box.setAttribute("aria-hidden", "true");
    var canvas = document.createElement("canvas"); box.appendChild(canvas);
    var layer = document.createElement("div"); layer.className = "g3d-labels"; box.appendChild(layer);
    hero.insertBefore(box, hero.firstChild);
    var renderer;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch (e) { box.remove(); return; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    var scene = new T.Scene(), camera = new T.PerspectiveCamera(38, 1, 0.1, 200);
    camera.position.set(0, 0, 21.5);

    /* outer group sways and follows the pointer; inner group turns North America to face the camera */
    var sway = new T.Group(), globe = new T.Group(); scene.add(sway); sway.add(globe);
    var BASE_X = 44 * D, BASE_Y = 84 * D;
    globe.rotation.order = "XYZ";

    /* the Earth: a dark body, land dots bright, ocean dots faint */
    globe.add(new T.Mesh(new T.SphereGeometry(R * 0.985, 64, 64), new T.MeshBasicMaterial({ color: 0x06182b, transparent: true, opacity: 0.92 })));
    var land = [], sea = [], N = 40000;
    for (var i = 0; i < N; i++) {
      var y = 1 - 2 * (i + 0.5) / N, rr = Math.sqrt(1 - y * y), a = i * 2.399963;
      var lat = Math.asin(y) / D, lon = Math.atan2(rr * Math.sin(a), rr * Math.cos(a)) / D;
      var isLand = lon < -50 && lon > -170 && lat > 5 && inNA(lon, lat);
      if (isLand) land.push(v3(lat, lon, R)); else if (i % 11 === 0) sea.push(v3(lat, lon, R));
    }
    var landGeo = new T.BufferGeometry().setFromPoints(land), seaGeo = new T.BufferGeometry().setFromPoints(sea);
    globe.add(new T.Points(landGeo, new T.PointsMaterial({ color: 0x7cc4ff, size: 0.075, transparent: true, opacity: 0.95 })));
    globe.add(new T.Points(seaGeo, new T.PointsMaterial({ color: 0x4f86b8, size: 0.05, transparent: true, opacity: 0.45 })));
    var atm = new T.Sprite(new T.SpriteMaterial({ map: glow("14,128,212"), blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.75 }));
    atm.scale.set(R * 3.1, R * 3.1, 1); sway.add(atm);
    var rimMat = new T.MeshBasicMaterial({ color: 0x7cc4ff, transparent: true, opacity: 0.09, side: T.BackSide, blending: T.AdditiveBlending });
    sway.add(new T.Mesh(new T.SphereGeometry(R * 1.06, 48, 48), rimMat));

    /* two tilted orbit rings around the globe */
    [[R * 1.38, 1.2, 0.35, 0x7cc4ff], [R * 1.55, 1.45, -0.5, 0xc9a24a]].forEach(function (o) {
      var ring = new T.Mesh(new T.TorusGeometry(o[0], 0.012, 6, 200), new T.MeshBasicMaterial({ color: o[3], transparent: true, opacity: 0.4 }));
      ring.rotation.set(o[1], o[2], 0); sway.add(ring);
    });

    /* the lanes, a truck light on each, and the city markers */
    var home = v3(HOME.lat, HOME.lon, R);
    var homeGlow = new T.Sprite(new T.SpriteMaterial({ map: glow("46,224,106"), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    homeGlow.scale.set(1.2, 1.2, 1); homeGlow.position.copy(home.clone().multiplyScalar(1.01)); globe.add(homeGlow);
    var lanes = [], markers = [{ n: HOME.n, p: home, home: true }];
    C.forEach(function (c, k) {
      var end = v3(c.lat, c.lon, R), a0 = home.clone().normalize(), b0 = end.clone().normalize();
      var om = Math.acos(Math.min(1, a0.dot(b0))), pts = [];
      for (var s = 0; s <= 64; s++) {
        var t = s / 64, f1 = Math.sin((1 - t) * om) / Math.sin(om), f2 = Math.sin(t * om) / Math.sin(om);
        var p = a0.clone().multiplyScalar(f1).add(b0.clone().multiplyScalar(f2)).normalize().multiplyScalar(R * (1 + 0.16 * om * Math.sin(Math.PI * t)));
        pts.push(p);
      }
      var line = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: k % 4 === 0 ? 0xc9a24a : 0x38aaff, transparent: true, opacity: 0.7, blending: T.AdditiveBlending }));
      globe.add(line);
      var truck = new T.Sprite(new T.SpriteMaterial({ map: glow("255,255,255"), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
      truck.scale.set(0.55, 0.55, 1); globe.add(truck);
      var dot = new T.Mesh(new T.SphereGeometry(0.07, 10, 10), new T.MeshBasicMaterial({ color: 0xffffff }));
      dot.position.copy(end); globe.add(dot);
      lanes.push({ pts: pts, truck: truck, seed: (k * 0.137) % 1 });
      markers.push({ n: c.n, p: end });
    });
    markers.forEach(function (m) {
      if (!LABEL[m.n]) return;
      var el = document.createElement("div"); el.className = "g3d-label" + (m.home ? " home" : ""); el.textContent = m.n;
      layer.appendChild(el); m.el = el;
    });

    /* the particle field */
    var F = innerWidth < 760 ? 500 : 1100, fp = new Float32Array(F * 3);
    for (var j = 0; j < F; j++) { var r2 = 9 + Math.random() * 26, th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1); fp[j * 3] = r2 * Math.sin(ph) * Math.cos(th); fp[j * 3 + 1] = r2 * Math.sin(ph) * Math.sin(th); fp[j * 3 + 2] = r2 * Math.cos(ph) - 8; }
    var fg = new T.BufferGeometry(); fg.setAttribute("position", new T.BufferAttribute(fp, 3));
    var field = new T.Points(fg, new T.PointsMaterial({ color: 0x9fd3ff, size: 0.1, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false, map: glow("255,255,255") }));
    scene.add(field);

    var W = 0;
    function size() { var r = box.getBoundingClientRect(); W = Math.max(50, Math.round(r.width)); renderer.setSize(W, W, false); camera.aspect = 1; camera.updateProjectionMatrix(); }
    size(); var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 150); });

    var tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("pointermove", function (e) { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
    addEventListener("deviceorientation", function (e) { if (e.gamma == null) return; tx = Math.max(-1, Math.min(1, e.gamma / 30)); ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); });

    var visible = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(frame); }).observe(hero);
    var clock = new T.Clock(), wp = new T.Vector3();
    window.__g2dStop = true;
    hero.classList.add("g3d-on");
    function frame() {
      if (!visible || document.hidden) return;
      var t = clock.getElapsedTime();
      cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
      globe.rotation.x = BASE_X + Math.sin(t * 0.11) * 0.06 + cy * 0.12;
      globe.rotation.y = BASE_Y + Math.sin(t * 0.15) * 0.22 + cx * 0.35;
      sway.rotation.z = Math.sin(t * 0.07) * 0.03;
      field.rotation.y = t * 0.01;
      homeGlow.material.opacity = 0.65 + Math.sin(t * 3) * 0.3;
      lanes.forEach(function (L) {
        var k = (t * 0.11 + L.seed) % 1, idx = k * (L.pts.length - 1), i0 = Math.floor(idx), f = idx - i0;
        var a = L.pts[i0], b = L.pts[Math.min(i0 + 1, L.pts.length - 1)];
        L.truck.position.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f);
      });
      scene.updateMatrixWorld();
      markers.forEach(function (m) {
        if (!m.el) return;
        globe.localToWorld(wp.copy(m.p)); var front = wp.z > 0.5;
        var s = wp.clone().project(camera);
        m.el.style.transform = "translate(" + ((s.x * 0.5 + 0.5) * W).toFixed(1) + "px," + ((-s.y * 0.5 + 0.5) * W).toFixed(1) + "px)";
        m.el.style.opacity = front ? "1" : "0";
      });
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) requestAnimationFrame(frame); });
    requestAnimationFrame(frame);
  }
})();
