/* az-3d.js — the 3D layer on the gadget store (/az and /az/es).
   1. Hero: the 10 gadgets from the video on a spinning 3D ring. Drag or swipe to spin, tap one to shop it.
   2. "One battery": a 3D power station that drains at the speed of the loads you pick.
   3. "The beach test": the photo strip bends into a curved 3D wall as it scrolls by.
   Plain CSS 3D, no library. Reduced-motion visitors get it standing still. */
(function(){
  var es=document.documentElement.lang==='es';
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var css=[
  /* ---- hero ring ---- */
  'header .wrap{position:relative}',
  '.ring3d{position:relative;width:100%;max-width:420px;height:250px;margin:1.4rem auto 0;perspective:900px;touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:grab}',
  '.ring3d.drag{cursor:grabbing}',
  '.ring3d .stage{position:absolute;left:50%;top:46%;width:0;height:0;transform-style:preserve-3d;transform:rotateX(-10deg)}',
  '.ring3d .spin{position:absolute;transform-style:preserve-3d}',
  '.ring3d .card{position:absolute;left:-52px;top:-70px;width:104px;height:140px;border-radius:16px;overflow:hidden;background:#fff;border:1px solid rgba(255,255,255,.5);box-shadow:0 18px 40px rgba(0,0,0,.55),0 0 24px rgba(34,211,238,.18);display:block;transition:box-shadow .3s,filter .3s}',
  '.ring3d .card img{width:100%;height:98px;object-fit:contain;padding:8px;background:#fff;pointer-events:none}',
  '.ring3d .card b{display:block;height:42px;padding:.3rem .4rem;font:700 .6rem/1.2 Inter,sans-serif;color:#0b1220;background:linear-gradient(180deg,#fff,#eef3fb);overflow:hidden}',
  '.ring3d .card.front{box-shadow:0 22px 50px rgba(0,0,0,.6),0 0 0 2px #ff9900,0 0 34px rgba(255,153,0,.45)}',
  '.ring3d .floor{position:absolute;left:50%;bottom:16px;width:86%;height:70px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(34,211,238,.35),rgba(167,139,250,.12) 60%,transparent);filter:blur(4px);pointer-events:none}',
  '.ring3d .cap{position:absolute;left:0;right:0;bottom:0;text-align:center;font:600 .78rem Inter,sans-serif;color:var(--ink-2,#9aa8bf)}',
  '.ring3d .cap b{color:#ff9900}',
  '@media (min-width:1100px){.ring3d{position:absolute;right:0;top:250px;margin:0;width:440px;max-width:none;height:330px}.ring3d .card{left:-62px;top:-84px;width:124px;height:168px}.ring3d .card img{height:120px}.ring3d .card b{height:48px;font-size:.68rem}}',
  /* ---- 3D power station ---- */
  '.gauge.has3d{grid-template-columns:200px 180px 1fr}',
  '.st3d{width:180px;height:200px;perspective:700px;display:flex;align-items:center;justify-content:center;touch-action:pan-y;cursor:grab}',
  '.st3d .box{position:relative;width:130px;height:96px;transform-style:preserve-3d;transform:rotateX(-18deg) rotateY(-32deg)}',
  '.st3d .f{position:absolute;border:1px solid rgba(255,255,255,.18);overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
  '.st3d{position:relative}.st3d .shadow{position:absolute;left:50%;top:72%;width:170px;height:46px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(34,211,238,.45),transparent);filter:blur(6px);pointer-events:none}',
  '.st3d .fr,.st3d .bk{width:130px;height:96px}',
  '.st3d .lf,.st3d .rt{width:80px;height:96px;left:25px}',
  '.st3d .tp,.st3d .bt{width:130px;height:80px;top:8px}',
  '.st3d .fr{transform:translateZ(40px);background:linear-gradient(160deg,#2a3245,#141a26)}',
  '.st3d .bk{transform:rotateY(180deg) translateZ(40px);background:#121722}',
  '.st3d .lf{transform:rotateY(-90deg) translateZ(65px);background:linear-gradient(160deg,#232b3c,#10151f)}',
  '.st3d .rt{transform:rotateY(90deg) translateZ(65px);background:linear-gradient(160deg,#232b3c,#10151f)}',
  '.st3d .tp{transform:rotateX(90deg) translateZ(48px);background:linear-gradient(135deg,#3a4458,#1c2331);border-radius:6px}',
    '.st3d .tp::before{content:"";position:absolute;left:12px;right:12px;top:30px;height:18px;border-radius:9px;background:#0d1119;border:1px solid rgba(255,255,255,.12)}',
  /* the charge level shows through glass windows on the front and both sides */
  '.st3d .win{position:absolute;left:10px;right:10px;bottom:10px;top:30px;border-radius:6px;background:rgba(7,10,18,.85);border:1px solid rgba(34,211,238,.35);overflow:hidden}',
  '.st3d .lf .win,.st3d .rt .win{left:8px;right:8px;top:10px}',
  '.st3d .lvl{position:absolute;left:0;right:0;bottom:0;height:calc(var(--lvl,100)*1%);background:linear-gradient(0deg,#22d3ee,#a78bfa 70%,#ff9900);box-shadow:0 0 18px rgba(34,211,238,.8)}',
  '.st3d .lvl::after{content:"";position:absolute;left:0;right:0;top:-3px;height:6px;background:rgba(255,255,255,.7);filter:blur(2px)}',
  '.st3d .lvl.low{background:linear-gradient(0deg,#ef4444,#fbbf24)}',
  '.st3d .fr .lbl{position:absolute;left:10px;right:10px;top:7px;display:flex;justify-content:space-between;font:800 .68rem/1 Inter,sans-serif;color:#eef2f8;letter-spacing:.02em}',
  '.st3d .fr .lbl i{font-style:normal;color:#22d3ee}',
  '.st3d .pct{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:900 1.25rem/1 Archivo,Inter,sans-serif;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.8);z-index:1}',
  '.st3d .bolt{position:absolute;right:6px;bottom:4px;font-size:.8rem;opacity:0;transition:opacity .3s;z-index:1}',
  '.st3d.charging .bolt{opacity:1}',
  '@media (max-width:640px){.gauge.has3d{grid-template-columns:1fr}.st3d{height:170px}}',
  /* ---- curved beach wall ---- */
  '.marquee.wall3d{perspective:700px;padding:14px 0}',
  '.marquee.wall3d .track{transform-style:preserve-3d}',
  '.marquee.wall3d .shot{transition:none;will-change:transform}'
  ].join('\n');
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  /* ---------- 1. hero ring ---------- */
  (function(){
    var head=document.querySelector('header .wrap'), tiles=document.querySelectorAll('#vidgrid .tile');
    if(!head||!tiles.length) return;
    var items=[].slice.call(tiles).map(function(t){
      var img=t.querySelector('img'), h=t.querySelector('h3'), go=t.querySelector('a.go')||t.querySelector('a.ph');
      return {src:img&&img.getAttribute('src'), name:h?h.textContent:'', href:go?go.href:'#finds'};
    }).filter(function(x){return x.src});
    var n=items.length; if(n<3) return;
    var box=document.createElement('div'); box.className='ring3d'; box.setAttribute('aria-label',es?'Los 10 gadgets del video en un carrusel 3D':'The 10 gadgets from the video on a 3D carousel');
    box.innerHTML='<div class="floor"></div><div class="stage"><div class="spin"></div></div><div class="cap">'+(es?'Gíralo con el dedo · <b>toca uno para comprarlo</b>':'Spin it · <b>tap one to shop it on Amazon</b>')+'</div>';
    head.appendChild(box);
    var spin=box.querySelector('.spin'), big=matchMedia('(min-width:1100px)').matches, w=big?124:104;
    var R=Math.round((w+8)/(2*Math.tan(Math.PI/n)));
    var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
    spin.innerHTML=items.map(function(it,i){
      return '<a class="card" href="'+esc(it.href)+'" target="_blank" rel="sponsored noopener" draggable="false" style="transform:rotateY('+(i*360/n)+'deg) translateZ('+R+'px)"><img src="'+esc(it.src)+'" alt="" loading="lazy" draggable="false" /><b>'+esc(it.name)+'</b></a>';
    }).join('');
    var cards=spin.children, ang=0, vel=still?0:-0.18, dragging=false, lastX=0, moved=0, visible=true, frontIdx=-1;
    function draw(){
      spin.style.transform='translateZ('+(-R)+'px) rotateY('+ang+'deg)';
      var f=((Math.round(-ang/(360/n))%n)+n)%n;
      if(f!==frontIdx){ if(cards[frontIdx]) cards[frontIdx].classList.remove('front'); cards[f].classList.add('front'); frontIdx=f; }
    }
    // keep the front card readable: the ring sits back by R so the front card lands at z=0
    function loop(){
      if(visible&&!dragging){ ang+=vel; if(!still){ vel+=(-0.18-vel)*0.02; } }
      draw(); requestAnimationFrame(loop);
    }
    box.addEventListener('pointerdown',function(e){dragging=true;moved=0;lastX=e.clientX;box.classList.add('drag');});
    window.addEventListener('pointermove',function(e){ if(!dragging) return; var dx=e.clientX-lastX; lastX=e.clientX; moved+=Math.abs(dx); ang+=dx*0.35; vel=dx*0.35; });
    window.addEventListener('pointerup',function(){ if(!dragging) return; dragging=false; box.classList.remove('drag'); vel=Math.max(-8,Math.min(8,vel)); });
    window.addEventListener('pointercancel',function(){dragging=false;box.classList.remove('drag');});
    // a drag is not a tap: don't open Amazon after a spin
    box.addEventListener('click',function(e){ if(moved>8){ e.preventDefault(); } },true);
    if('IntersectionObserver' in window) new IntersectionObserver(function(es_){visible=es_[0].isIntersecting;}).observe(box);
    draw(); requestAnimationFrame(loop);
  })();

  /* ---------- 2. 3D power station ---------- */
  (function(){
    var g=document.querySelector('#battery .gauge'), ring=g&&g.querySelector('.ring'), hrs=document.getElementById('ghours'), wt=document.getElementById('gwatts');
    if(!g||!ring||!hrs) return;
    var win='<div class="win"><div class="lvl"></div></div>';
    var s=document.createElement('div'); s.className='st3d'; s.setAttribute('aria-hidden','true');
    s.innerHTML='<div class="shadow"></div><div class="box">'+
      '<div class="f fr"><div class="lbl"><span>1,024 Wh</span><i class="w">0 W</i></div><div class="win"><div class="lvl"></div><div class="pct">100%</div><div class="bolt">⚡</div></div></div>'+
      '<div class="f bk"></div><div class="f lf">'+win+'</div><div class="f rt">'+win+'</div><div class="f tp"></div></div>';
    ring.insertAdjacentElement('afterend',s); g.classList.add('has3d');
    var box=s.querySelector('.box'), lvls=s.querySelectorAll('.lvl'), pct=s.querySelector('.pct'), wl=s.querySelector('.w');
    var lvl=100, charging=false, rotY=-32, drag=false, lx=0, t0=performance.now();
    function hours(){ var v=parseFloat(hrs.textContent); return isFinite(v)&&v>0?v:0; }
    function step(now){
      var dt=Math.min(0.05,(now-t0)/1000); t0=now;
      var h=hours(), w=wt?wt.textContent:'';
      wl.textContent=w.replace(/\s/g,'')||'0W';
      if(still){ lvl=h?85:100; }
      else if(charging){ lvl+=dt*45; if(lvl>=100){lvl=100;charging=false;} }
      else if(h){ /* one real hour of runtime = 1.2 s on screen, so a 4 h load drains 4x faster than a 16 h one */
        lvl-=dt*(85/(h*1.2)); if(lvl<=15){lvl=15;charging=true;}
      }
      s.classList.toggle('charging',charging);
      for(var i=0;i<lvls.length;i++){ lvls[i].style.setProperty('--lvl',lvl.toFixed(1)); lvls[i].classList.toggle('low',lvl<30); }
      pct.textContent=Math.round(lvl)+'%';
      if(!drag&&!still) rotY+=dt*14;
      box.style.transform='rotateX(-18deg) rotateY('+rotY+'deg)';
      requestAnimationFrame(step);
    }
    s.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;});
    window.addEventListener('pointermove',function(e){ if(drag){ rotY+=(e.clientX-lx)*0.6; lx=e.clientX; } });
    window.addEventListener('pointerup',function(){drag=false;});
    // a new load choice refills it so the visitor sees the new drain speed from full
    var loads=document.getElementById('loads'); if(loads) loads.addEventListener('click',function(){ lvl=100; charging=false; });
    requestAnimationFrame(step);
  })();

  /* ---------- 3. curved beach wall ---------- */
  (function(){
    var m=document.querySelector('#beach .marquee'); if(!m||still) return;
    m.classList.add('wall3d');
    var on=false;
    if('IntersectionObserver' in window) new IntersectionObserver(function(e){on=e[0].isIntersecting;}).observe(m); else on=true;
    function frame(){
      if(on){
        var r=m.getBoundingClientRect(), c=r.left+r.width/2, half=r.width/2, shots=m.querySelectorAll('.shot');
        for(var i=0;i<shots.length;i++){
          var b=shots[i].getBoundingClientRect(); if(b.right<r.left-200||b.left>r.right+200) continue;
          var d=Math.max(-1.3,Math.min(1.3,(b.left+b.width/2-c)/half));
          shots[i].style.transform='rotateY('+(-d*38).toFixed(2)+'deg) translateZ('+(Math.abs(d)*70).toFixed(1)+'px)';
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();
})();
