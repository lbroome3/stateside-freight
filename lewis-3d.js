/* lewis-3d.js — the 3D hero on Lewis's page (lewisbroome.com, /lewis-broome).
   Lewis, 11/19: "Make it 3D. It needs to be more impressive because folks are going to be looking at
   that because we do websites."

   A WebGL scene behind the hero: a glowing wireframe core, three orbiting rings each carrying one of
   his businesses (Freight, GPT Marketing, Surrogate Funding) with a light beam back to the core, and a
   deep field of drifting blue and gold particles. The camera follows the mouse on a computer and the
   tilt of the phone. His portrait card tilts in 3D with the pointer.

   three.js r128 loads after the page is up (cdnjs). If WebGL isn't there, or the visitor asked for
   reduced motion, nothing here runs and the flat 2D network stays. */
(function () {
  var hero = document.querySelector(".hero");
  if (!hero) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* the portrait card tilts in 3D with the pointer (cheap, CSS only) */
  var card = hero.querySelector(".pwrap");
  if (card && fine && !reduce) {
    card.style.transition = "transform .25s ease-out";
    card.style.transformStyle = "preserve-3d";
    hero.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / innerWidth, dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      card.style.transform = "perspective(700px) rotateY(" + (dx * 22).toFixed(2) + "deg) rotateX(" + (-dy * 22).toFixed(2) + "deg) translateZ(10px)";
    });
    hero.addEventListener("pointerleave", function () { card.style.transform = ""; });
  }
  if (reduce) return;
  var probe = document.createElement("canvas");
  if (!(probe.getContext("webgl") || probe.getContext("experimental-webgl"))) return;

  function boot() {
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.async = true;
    s.onload = start;
    document.head.appendChild(s);
  }
  if (document.readyState === "complete") setTimeout(boot, 200); else addEventListener("load", function () { setTimeout(boot, 200); });

  function glowTexture(rgb) {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d"), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(" + rgb + ",1)"); grd.addColorStop(0.25, "rgba(" + rgb + ",.55)"); grd.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function start() {
    if (!window.THREE) return;
    var T = THREE;
    var canvas = document.createElement("canvas");
    canvas.className = "gl"; canvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(canvas, hero.firstChild);
    var renderer;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch (e) { canvas.remove(); return; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    var scene = new T.Scene();
    scene.fog = new T.FogExp2(0x081a2c, 0.028);
    var camera = new T.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(0, 0, 16);

    var BLUE = 0x7cc4ff, GOLD = 0xc9a24a;
    var world = new T.Group(); scene.add(world);

    /* the core: two counter-turning wireframe shells and a glow at the heart */
    var core = new T.Group(); world.add(core);
    var shellA = new T.Mesh(new T.IcosahedronGeometry(2.2, 1), new T.MeshBasicMaterial({ color: BLUE, wireframe: true, transparent: true, opacity: 0.55 }));
    var shellB = new T.Mesh(new T.IcosahedronGeometry(1.45, 0), new T.MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.7 }));
    var dotsGeo = new T.IcosahedronGeometry(2.2, 1);
    var shellDots = new T.Points(dotsGeo, new T.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.9 }));
    core.add(shellA, shellB, shellDots);
    var heart = new T.Sprite(new T.SpriteMaterial({ map: glowTexture("124,196,255"), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    heart.scale.set(6.5, 6.5, 1); core.add(heart);
    var heartGold = new T.Sprite(new T.SpriteMaterial({ map: glowTexture("201,162,74"), blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 }));
    heartGold.scale.set(3.2, 3.2, 1); core.add(heartGold);

    /* Lewis, 11/21: "a pulsating heartbeat inside of that square in the middle". A glowing heart
       beats lub-dub (about 66 a minute) inside the gold shell, and each beat sends a ripple out. */
    function heartTexture() {
      var c = document.createElement("canvas"); c.width = c.height = 256; var g = c.getContext("2d");
      g.translate(128, 136); g.shadowColor = "rgba(255,70,90,1)"; g.shadowBlur = 38;
      g.beginPath(); g.moveTo(0, 62);
      g.bezierCurveTo(-92, 2, -70, -78, 0, -40); g.bezierCurveTo(70, -78, 92, 2, 0, 62); g.closePath();
      var grd = g.createRadialGradient(-12, -18, 4, 0, 0, 80);
      grd.addColorStop(0, "#fff1f3"); grd.addColorStop(0.35, "#ff6b7d"); grd.addColorStop(1, "#c8142e");
      g.fillStyle = grd; g.fill(); g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = "rgba(255,215,140,.9)"; g.stroke();
      return new T.CanvasTexture(c);
    }
    var beat = new T.Sprite(new T.SpriteMaterial({ map: heartTexture(), transparent: true, depthWrite: false, depthTest: false }));
    beat.scale.set(1.25, 1.25, 1); beat.renderOrder = 5; core.add(beat);
    var beatGlow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture("255,80,100"), blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    beatGlow.scale.set(3, 3, 1); core.add(beatGlow);
    var ripple = new T.Mesh(new T.RingGeometry(0.95, 1.0, 64), new T.MeshBasicMaterial({ color: 0xff6b7d, transparent: true, opacity: 0, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false }));
    core.add(ripple);
    function lubDub(t) {                 /* 0..1 strength: a strong beat, then a softer one */
      var ph = (t % 0.91) / 0.91;        /* ~66 beats a minute */
      var a = Math.exp(-Math.pow((ph - 0.06) / 0.045, 2)), b = 0.6 * Math.exp(-Math.pow((ph - 0.25) / 0.05, 2));
      return Math.max(a, b);
    }

    /* five orbits, one business on each */
    var ORBITS = [
      { label: "Freight", sub: "Landstar Agency LBR", href: "https://www.trueshipping.us/", logo: "/assets/logos/landstar-star.png", r: 4.2, tilt: [1.15, 0.2], speed: 0.32, color: BLUE, rgb: "124,196,255", phase: 0 },
      { label: "GPT Marketing", sub: "Websites & AI", href: "https://gptmarketing.us/", logo: "/assets/logos/gpt-marketing.png", r: 5.4, tilt: [1.35, -0.6], speed: -0.22, color: 0x9fd3ff, rgb: "159,211,255", phase: 2.1 },
      { label: "Surrogate Funding", sub: "Foundation", href: "/surrogate-funding", logo: "/assets/logos/surrogate-funding.png", r: 6.5, tilt: [1.0, 0.9], speed: 0.16, color: GOLD, rgb: "201,162,74", phase: 4.2 },
      /* Lewis, 11/27: "Add the store to the globe too" */
      { label: "Amazon Store", sub: "Gidgets & Gadgets", href: "/az", logo: "/az-media/app/icon-192.png", r: 5.95, tilt: [0.8, -0.25], speed: 0.19, color: 0xff9f2e, rgb: "255,159,46", phase: 3.2 },
      /* Lewis, 11/21: "add the war room to the world in the cube" */
      { label: "Zeus War Room", sub: "SPY · live 9:30 ET", href: "/zeus", logo: "/assets/logos/zeus-war-room.png", zeus: true, r: 7.5, tilt: [1.25, -1.1], speed: -0.13, color: 0x8b7bff, rgb: "150,130,255", phase: 1.0 },
    ];
    var labels = [];
    var layer = document.createElement("div"); layer.className = "gl-labels"; layer.setAttribute("aria-hidden", "true"); hero.appendChild(layer);
    ORBITS.forEach(function (o) {
      var pivot = new T.Group(); pivot.rotation.set(o.tilt[0], o.tilt[1], 0); world.add(pivot);
      var ring = new T.Mesh(new T.TorusGeometry(o.r, 0.012, 6, 160), new T.MeshBasicMaterial({ color: o.color, transparent: true, opacity: 0.45 }));
      pivot.add(ring);
      var node = new T.Group(); pivot.add(node);
      var ball = new T.Mesh(new T.SphereGeometry(0.16, 16, 16), new T.MeshBasicMaterial({ color: 0xffffff }));
      var glow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture(o.rgb), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
      glow.scale.set(1.7, 1.7, 1); node.add(ball, glow);
      var beamGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]);
      var beam = new T.Line(beamGeo, new T.LineBasicMaterial({ color: o.color, transparent: true, opacity: 0.35, blending: T.AdditiveBlending }));
      beam.frustumCulled = false; scene.add(beam);
      var el = document.createElement("a"); el.className = "gl-label" + (o.zeus ? " zeus" : ""); el.href = o.href; el.innerHTML = '<img alt=""' + (o.light ? ' class="lt"' : "") + '><div><b></b><span></span></div>';
      el.querySelector("img").src = o.logo; el.querySelector("b").textContent = o.label; el.querySelector("span").textContent = o.sub; layer.appendChild(el);
      labels.push({ o: o, pivot: pivot, node: node, beam: beam, el: el });
    });

    /* a deep field of particles */
    var N = innerWidth < 760 ? 900 : 1800, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    var cB = new T.Color(BLUE), cG = new T.Color(GOLD), cW = new T.Color(0xffffff);
    for (var i = 0; i < N; i++) {
      var rr = 8 + Math.random() * 38, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = rr * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = rr * Math.sin(ph) * Math.sin(th) * 0.6; pos[i * 3 + 2] = rr * Math.cos(ph) - 10;
      var c = i % 11 === 0 ? cG : i % 5 === 0 ? cW : cB; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    var fieldGeo = new T.BufferGeometry();
    fieldGeo.setAttribute("position", new T.BufferAttribute(pos, 3)); fieldGeo.setAttribute("color", new T.BufferAttribute(col, 3));
    var field = new T.Points(fieldGeo, new T.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false, map: glowTexture("255,255,255") }));
    scene.add(field);

    /* a grid floor fading into the fog */
    var grid = new T.GridHelper(120, 60, BLUE, 0x2a5a86);
    grid.material.transparent = true; grid.material.opacity = 0.22; grid.position.y = -7.5; scene.add(grid);

    /* where the scene sits: to the right of the text on a computer, behind it on a phone */
    var W = 0, H = 0, wide = true, textCol = null;
    function size() {
      W = hero.clientWidth; H = hero.clientHeight; wide = W > 820;
      renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
      /* the scene's center, in world units, so the core sits right of the text column (computer) or
         up beside the portrait (phone) */
      var half = Math.tan(22.5 * Math.PI / 180) * 16;
      world.position.set(wide ? half * camera.aspect * 0.5 : half * camera.aspect * 0.35, wide ? 0 : half * 0.62, 0);
      world.scale.setScalar(wide ? 0.82 : 0.5);
      textCol = hero.querySelector(".wrap > div:last-child");
      canvas.style.opacity = wide ? "1" : ".55";
      layer.style.display = wide ? "" : "none";
    }
    size();
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 150); });

    /* the camera follows the mouse, or the phone's tilt */
    var tx = 0, ty = 0, cxp = 0, cyp = 0;
    hero.addEventListener("pointermove", function (e) { var r = hero.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; });
    addEventListener("deviceorientation", function (e) { if (e.gamma == null) return; tx = Math.max(-1, Math.min(1, e.gamma / 30)); ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); });

    var visible = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(frame); }).observe(hero);
    var clock = new T.Clock(), v = new T.Vector3(), w = new T.Vector3();
    hero.classList.add("gl-on");
    function frame() {
      if (!visible || document.hidden) return;
      var t = clock.getElapsedTime();
      cxp += (tx - cxp) * 0.05; cyp += (ty - cyp) * 0.05;
      camera.position.x = cxp * 2.2; camera.position.y = -cyp * 1.4 + 0.4; camera.lookAt(0, 0, 0);
      shellA.rotation.y = t * 0.18; shellA.rotation.x = t * 0.07;
      shellDots.rotation.copy(shellA.rotation);
      shellB.rotation.y = -t * 0.35; shellB.rotation.z = t * 0.12;
      var hb = lubDub(t), pulse = 1 + hb * 0.12; heart.scale.set(6.5 * pulse, 6.5 * pulse, 1); heartGold.material.opacity = 0.4 + hb * 0.35;
      var hs = 1.45 + hb * 0.45; beat.scale.set(hs, hs, 1);
      beatGlow.material.opacity = 0.15 + hb * 0.75; beatGlow.scale.setScalar(2.4 + hb * 1.6);
      var rp = (t % 0.91) / 0.91; ripple.scale.setScalar(0.6 + rp * 2.4); ripple.material.opacity = Math.max(0, 0.55 * (1 - rp / 0.7));
      ripple.quaternion.copy(camera.quaternion);
      shellB.scale.setScalar(1 + hb * 0.06);
      field.rotation.y = t * 0.012; field.rotation.x = Math.sin(t * 0.05) * 0.05;
      labels.forEach(function (L) {
        var a = L.o.phase + t * L.o.speed;
        L.node.position.set(Math.cos(a) * L.o.r, Math.sin(a) * L.o.r, 0);
        L.node.getWorldPosition(v); core.getWorldPosition(w);
        var p = L.beam.geometry.attributes.position; p.setXYZ(0, w.x, w.y, w.z); p.setXYZ(1, v.x, v.y, v.z); p.needsUpdate = true;
        L.beam.material.opacity = 0.25 + Math.sin(t * 3 + L.o.phase) * 0.12;
        /* the label rides the node on screen */
        var s = v.clone().project(camera);
        var x = (s.x * 0.5 + 0.5) * W, y = (-s.y * 0.5 + 0.5) * H;
        x = Math.min(x, W - 200); y = Math.max(y, 60);   /* keep the label on screen */
        L.el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
        var over = false;
        if (textCol) { var tr = textCol.getBoundingClientRect(), hr = hero.getBoundingClientRect(); over = x < tr.right - hr.left + 12 && y > tr.top - hr.top - 40 && y < tr.bottom - hr.top + 20; }
        L.el.style.opacity = over || s.z >= 1 ? "0" : v.z > -1 ? "1" : ".45";
        L.el.style.pointerEvents = over || s.z >= 1 ? "none" : "";
      });
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) requestAnimationFrame(frame); });
    requestAnimationFrame(frame);
  }
})();
