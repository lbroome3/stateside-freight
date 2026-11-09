/* sf-3d.js — the 3D layer on the Surrogate Funding pages (bail fund first).
   1. Bail fund: "the revolving fund" — a brass coin travels a 3D ring through the three
      stops of the fund (bond posted → home with family → refund brings the next person home).
   2. The gauges (70% not convicted, and the home meter) lean back in 3D and follow the pointer.
   3. The "Inside, right now" stories stand up in 3D as they scroll in.
   CSS 3D, no library. Purely visual: it never touches the donate links, Square, the forms
   or the bonding-company finder. Reduced-motion visitors get it standing still. */
(function(){
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  var css=[
  '.rf3d{position:relative;height:300px;margin:34px 0 0;perspective:900px;perspective-origin:50% 35%}',
  '.rf3d .sc{position:absolute;left:50%;top:52%;width:0;height:0;transform-style:preserve-3d;transform:rotateX(-24deg)}',
  '.rf3d .rfring{position:absolute;width:300px;height:300px;left:-150px;top:-150px;border-radius:50%;transform:rotateX(90deg);border:2px solid rgba(207,171,102,.55);box-shadow:0 0 30px rgba(207,171,102,.18),inset 0 0 40px rgba(207,171,102,.12);background:radial-gradient(closest-side,rgba(207,171,102,.10),transparent 70%)}',
  '.rf3d .rfstop{position:absolute;left:0;top:0;width:118px;margin-left:-59px;margin-top:-30px;text-align:center;transform-style:preserve-3d;transition:opacity .4s,filter .4s}',
  '.rf3d .rfstop b{display:block;font:500 26px/1 Georgia,serif;color:#cfab66}',
  '.rf3d .rfstop span{display:block;margin-top:6px;font:600 11px/1.3 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:rgba(233,235,241,.75)}',
  '.rf3d .rfstop.on span{color:#fff}.rf3d .rfstop.on b{text-shadow:0 0 18px rgba(207,171,102,.9)}',
  '.rf3d .coin{position:absolute;left:0;top:0;transform-style:preserve-3d}',
  '.rf3d .coin i{position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f3d999,#cfab66 45%,#8a6a2e);box-shadow:inset 0 0 0 3px rgba(90,64,20,.5)}',
  '.rf3d .coin i.face{display:flex;align-items:center;justify-content:center;font:600 26px/1 Georgia,serif;color:#5a4014}',
  '.rf3d .coin i.edge{background:#8a6a2e;box-shadow:none}',
  '.rf3d .rftrail{position:absolute;left:-3px;top:-3px;width:6px;height:6px;border-radius:50%;background:#cfab66;box-shadow:0 0 10px #cfab66}',
  '.rf3d .rfcap{position:absolute;left:0;right:0;bottom:-6px;text-align:center;font:italic 15px/1.4 Georgia,serif;color:rgba(233,235,241,.7)}',
  '@media(max-width:700px){.rf3d{height:260px;margin-top:24px}.rf3d .sc{transform:rotateX(-24deg) scale(.82)}}',
  '.gauge.g3d{perspective:900px}',
  '.gauge.g3d svg{transform:rotateX(var(--grx,16deg)) rotateY(var(--gry,0deg));transform-origin:50% 70%;transition:transform .25s ease-out;filter:drop-shadow(0 26px 30px rgba(0,0,0,.45))}',
  '.seen-grid article.s3d{transform:perspective(900px) rotateX(var(--rx,0deg)) translateZ(var(--tz,0px));transform-origin:50% 100%}'
  ].join('\n');
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  /* ---------- 1. the revolving fund ---------- */
  (function(){
    var host=document.querySelector('#bail-fund .bail > div:first-child'); if(!host) return;
    var STOPS=[['⚖','Bond posted'],['⌂','Home with family'],['↻','Refund brings the next one home']];
    var box=document.createElement('div'); box.className='rf3d'; box.setAttribute('aria-hidden','true');
    var coin='<div class="coin">'; for(var k=0;k<10;k++) coin+='<i class="edge" style="transform:translateZ('+(k-5)+'px)"></i>';
    coin+='<i class="face" style="transform:translateZ(5px)">$</i><i class="face" style="transform:rotateY(180deg) translateZ(5px)">$</i></div>';
    var trail=''; for(var t=0;t<14;t++) trail+='<span class="rftrail"></span>';
    box.innerHTML='<div class="sc"><div class="rfring"></div>'+STOPS.map(function(s){return '<div class="rfstop"><b>'+s[0]+'</b><span>'+s[1]+'</span></div>';}).join('')+trail+coin+'</div><p class="rfcap">The same dollars, bringing person after person home.</p>';
    host.appendChild(box);
    var R=150, stops=box.querySelectorAll('.rfstop'), coinEl=box.querySelector('.coin'), trails=box.querySelectorAll('.rftrail');
    var ANG=[Math.PI/2, Math.PI/2+2*Math.PI/3, Math.PI/2+4*Math.PI/3]; // front, back-left, back-right
    function pos(a,lift){ return 'translate3d('+(Math.cos(a)*R).toFixed(1)+'px,'+(lift||0)+'px,'+(Math.sin(a)*R).toFixed(1)+'px)'; }
    stops.forEach(function(s,i){ s.style.transform=pos(ANG[i],-44); });
    var a=ANG[0], spin=0, vis=true, t0=performance.now();
    if('IntersectionObserver' in window) new IntersectionObserver(function(e){vis=e[0].isIntersecting;}).observe(box);
    function frame(now){
      var dt=Math.min(.05,(now-t0)/1000); t0=now;
      if(vis&&!still){
        // linger a moment at each stop, then move on
        var seg=2*Math.PI/3, into=((a-ANG[0])%seg+seg)%seg, near=into<0.18||into>seg-0.05;
        a+=dt*(near?0.35:1.1); spin+=dt*140;
      }
      coinEl.style.transform=pos(a,-30)+' rotateY('+(spin%360).toFixed(1)+'deg)';
      trails.forEach(function(tr,i){ var b=a-(i+1)*0.09; tr.style.transform=pos(b,-30); tr.style.opacity=(0.7-i*0.05).toFixed(2); });
      var idx=Math.round(((a-ANG[0])/(2*Math.PI/3)))%3; idx=(idx+3)%3;
      stops.forEach(function(s,i){ s.classList.toggle('on',i===idx); });
      // keep the labels facing the reader
      stops.forEach(function(s,i){ s.style.transform=pos(ANG[i],-44)+' rotateX(24deg)'; });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- 2. gauges lean in 3D ---------- */
  document.querySelectorAll('.gauge').forEach(function(g){
    g.classList.add('g3d'); if(!fine||still) return;
    g.addEventListener('pointermove',function(e){ var r=g.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      g.style.setProperty('--gry',(x*22).toFixed(1)+'deg'); g.style.setProperty('--grx',(16-y*16).toFixed(1)+'deg'); });
    g.addEventListener('pointerleave',function(){ g.style.removeProperty('--gry'); g.style.removeProperty('--grx'); });
  });

  /* ---------- 3. stories stand up ---------- */
  if(!still){
    var cards=[].slice.call(document.querySelectorAll('.seen-grid article'));
    cards.forEach(function(c){ c.classList.add('s3d'); });
    var tick=false;
    function upd(){ tick=false; var vh=innerHeight; cards.forEach(function(el){ var r=el.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return;
      var k=Math.max(0,Math.min(1,(vh-r.top)/(vh*0.5))); el.style.setProperty('--rx',((1-k)*42).toFixed(1)+'deg'); el.style.setProperty('--tz',((1-k)*-50).toFixed(0)+'px'); }); }
    if(cards.length){ addEventListener('scroll',function(){ if(!tick){tick=true;requestAnimationFrame(upd);} },{passive:true}); upd(); }
  }
})();
