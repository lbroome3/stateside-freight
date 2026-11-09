/* truck3d.js — the 3D layer on Request a Truck (/truckload).
   1. Hero: a 3D highway running into the distance behind the title, lane lines moving.
   2. Equipment: a 3D rig that rebuilds itself for the trailer picked (dry van, reefer,
      flatbed, step deck, heavy haul, hotshot), turning slowly; drag to spin it.
   3. The estimate card flips up in 3D when it appears; the dispatch radar lies flat in 3D.
   Plain CSS 3D, no library. It only READS which equipment tile is on; it never touches
   the form fields, the bot trap, engage.js or anything that is sent. */
(function(){
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var css=[
  /* hero road */
  '.qhero{position:relative;overflow:hidden}',
  '.qhero > .wrap{position:relative;z-index:2}',
  '.road3d{position:absolute;inset:0;perspective:260px;perspective-origin:50% 40%;pointer-events:none;z-index:0;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,transparent 52%,#000 85%);mask-image:linear-gradient(180deg,transparent 52%,#000 85%);opacity:.8}',
  '.road3d .plane{position:absolute;left:50%;bottom:0;width:700px;height:2600px;margin-left:-350px;transform-origin:50% 100%;transform:rotateX(84deg);background:linear-gradient(90deg,transparent 0,rgba(14,128,212,.08) 6%,#0b2238 8%,#0b2238 92%,rgba(14,128,212,.08) 94%,transparent 100%)}',
  '.road3d .edge{position:absolute;top:0;bottom:0;width:6px;background:linear-gradient(180deg,rgba(124,199,255,0),rgba(124,199,255,.9));box-shadow:0 0 18px rgba(14,128,212,.9)}',
  '.road3d .edge.l{left:8%}.road3d .edge.r{right:8%}',
  '.road3d .lane{position:absolute;top:0;bottom:0;width:8px;margin-left:-4px;background:repeating-linear-gradient(180deg,rgba(255,210,122,.95) 0 70px,transparent 70px 150px);background-size:100% 150px;animation:lane3d .7s linear infinite}',
  '.road3d .lane.a{left:36%}.road3d .lane.b{left:64%}',
  '@keyframes lane3d{from{background-position:0 0}to{background-position:0 150px}}',
  '.road3d .lights{position:absolute;top:0;bottom:0;width:4px;background:repeating-linear-gradient(180deg,rgba(255,80,80,.0) 0 300px,rgba(255,90,90,.9) 300px 330px,rgba(255,80,80,0) 330px 700px);background-size:100% 700px;animation:tail3d 2.6s linear infinite;filter:blur(1px)}',
  '.road3d .lights.l1{left:22%}.road3d .lights.l2{left:50%;animation-duration:3.4s}.road3d .lights.l3{left:78%;animation-direction:reverse;background:repeating-linear-gradient(180deg,rgba(255,255,255,0) 0 300px,rgba(255,250,220,.95) 300px 330px,rgba(255,255,255,0) 330px 700px);background-size:100% 700px}',
  '@keyframes tail3d{from{background-position:0 0}to{background-position:0 700px}}',
  '.road3d .glow{position:absolute;left:50%;top:14%;width:900px;height:200px;margin-left:-450px;background:radial-gradient(closest-side,rgba(14,128,212,.35),transparent);filter:blur(10px)}',
  /* rig */
  '.rig3d{position:relative;height:190px;margin:4px 0 12px;border-radius:14px;background:radial-gradient(120% 90% at 50% 100%,#123456 0,#081a2c 70%);overflow:hidden;perspective:900px;touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none}',
  '.rig3d .floor{position:absolute;left:50%;top:62%;width:620px;height:620px;margin:-310px 0 0 -310px;transform:rotateX(90deg);background:radial-gradient(closest-side,rgba(14,128,212,.35),rgba(14,128,212,.05) 70%,transparent),repeating-linear-gradient(90deg,rgba(124,199,255,.12) 0 1px,transparent 1px 40px),repeating-linear-gradient(0deg,rgba(124,199,255,.12) 0 1px,transparent 1px 40px);border-radius:50%}',
  '.rig3d .scene{position:absolute;left:50%;top:62%;width:0;height:0;transform-style:preserve-3d}',
  '.rig3d .rig{position:absolute;transform-style:preserve-3d;transition:transform .9s cubic-bezier(.2,.8,.2,1)}',
  '.rig3d .rig.out{transform:translateX(-520px)!important}',
  '.rig3d i{position:absolute;left:0;top:0;display:block;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
  '.rig3d i.w{border-radius:50%;background:radial-gradient(circle,#cfd8e3 0 22%,#3b4656 24% 34%,#11161e 36%)}',
  '.rig3d .tag{position:absolute;left:12px;top:10px;font:800 .72rem/1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7cc7ff}',
  '.rig3d .tag b{display:block;margin-top:4px;font:800 1.05rem/1 Archivo,Inter,sans-serif;letter-spacing:-.01em;text-transform:none;color:#fff}',
  '.rig3d .hint{position:absolute;right:12px;bottom:8px;font:600 .7rem Inter,sans-serif;color:rgba(188,208,228,.7)}',
  '.rig3d .sideTxt{display:flex;height:100%;align-items:center;justify-content:center;gap:8px;font:900 15px/1 Archivo,Inter,sans-serif;color:#0a1f33;letter-spacing:.04em}',
  '.rig3d .sideTxt small{font:700 8px Inter,sans-serif;letter-spacing:.14em;color:#0e80d4}',
  '@media(max-width:520px){.rig3d{height:160px}}',
  /* estimate flip + flat radar */
  '.fare.show{animation:fare3d .8s cubic-bezier(.2,.8,.2,1) both;transform-origin:50% 0}',
  '@keyframes fare3d{from{opacity:0;transform:perspective(900px) rotateX(-70deg)}to{opacity:1;transform:perspective(900px) rotateX(0)}}',
  '.radar{perspective:420px}',
  '.radar .ring{transform:rotateX(62deg)}',
  '.radar .core{box-shadow:0 18px 30px rgba(14,128,212,.45)}'
  ].join('\n');
  if(still) css+='\n.road3d .lane,.road3d .lights{animation:none}.fare.show{animation:none}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  /* ---------- 1. hero road ---------- */
  var hero=document.querySelector('.qhero');
  if(hero){ var rd=document.createElement('div'); rd.className='road3d'; rd.setAttribute('aria-hidden','true');
    rd.innerHTML='<div class="glow"></div><div class="plane"><span class="edge l"></span><span class="edge r"></span><span class="lane a"></span><span class="lane b"></span><span class="lights l1"></span><span class="lights l2"></span><span class="lights l3"></span></div>';
    hero.insertBefore(rd,hero.firstChild); }

  /* ---------- 2. the rig ---------- */
  var equip=document.getElementById('equip'); if(!equip) return;
  var box3=document.createElement('div'); box3.className='rig3d'; box3.setAttribute('aria-hidden','true');
  box3.innerHTML='<div class="floor"></div><div class="scene"><div class="rig"></div></div><div class="tag">Your truck<b></b></div><div class="hint">drag to spin</div>';
  equip.parentNode.insertBefore(box3,equip);
  var rig=box3.querySelector('.rig'), tagB=box3.querySelector('.tag b');
  var NAMES={dryVan:"53' Dry Van",reefer:"53' Reefer",flatbed:"48' Flatbed",stepDeck:'Step Deck',heavy:'Heavy Haul · Lowboy',hotshot:'Hotshot'};

  function shade(hex,k){ var n=parseInt(hex.slice(1),16), r=n>>16, g=n>>8&255, b=n&255; function f(c){return Math.max(0,Math.min(255,Math.round(c*k)));} return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
  // a box: x0..x1 along the rig (front = +x), y0..y1 up from the road, depth d centred on z=0 (or at zc)
  function box(x0,x1,y0,y1,d,col,o){
    o=o||{}; var w=x1-x0, h=y1-y0, cx=(x0+x1)/2, cy=(y0+y1)/2, cz=o.z||0, out='';
    var F=[['',w,h,d/2,1],['rotateY(180deg)',w,h,d/2,.9],['rotateY(90deg)',d,h,w/2,.78],['rotateY(-90deg)',d,h,w/2,.72],['rotateX(90deg)',w,d,h/2,1.12],['rotateX(-90deg)',w,d,h/2,.5]];
    F.forEach(function(f,i){
      var inner=(i<2&&o.side)?o.side:'', bg=o.grad&&i<2?o.grad:shade(col,f[4]);
      out+='<i style="width:'+f[1]+'px;height:'+f[2]+'px;background:'+bg+';transform:translate3d('+(cx-f[1]/2)+'px,'+(-cy-f[2]/2)+'px,'+cz+'px) '+f[0]+' translateZ('+f[3]+'px)'+(o.r?';border-radius:'+o.r+'px':'')+'">'+inner+'</i>';
    });
    return out;
  }
  function wheel(x,r,z){ return '<i class="w" style="width:'+(2*r)+'px;height:'+(2*r)+'px;transform:translate3d('+(x-r)+'px,'+(-r*2)+'px,'+z+'px)"></i><i class="w" style="width:'+(2*r)+'px;height:'+(2*r)+'px;transform:translate3d('+(x-r)+'px,'+(-r*2)+'px,'+z+'px) rotateY(180deg)"></i>'; }
  function wheels(xs,r,half){ return xs.map(function(x){return wheel(x,r,half)+wheel(x,r,-half);}).join('')+xs.map(function(x){return box(x-r*.7,x+r*.7,r*.3,r*1.7,half*2-2,'#11161e');}).join(''); }
  var LOGO='<div class="sideTxt"><img src="/assets/landstar-agent-logo.png" alt="" style="height:26px;width:auto"><span>STATESIDE</span></div>';
  function tractor(){
    return box(-150,190,12,22,40,'#2b3442')+                                  // chassis
      box(118,160,22,104,54,'#0e80d4',{r:3})+                                  // sleeper cab
      box(160,198,22,70,52,'#0a5fa8',{r:4})+                                   // hood
      box(160.5,163,74,98,46,'#9fd7ff')+                                      // windshield
      box(196,200,26,50,50,'#c9d3df')+                                         // grille
      box(120,128,104,126,6,'#7d8896',{z:-20})+                                // exhaust stack
      wheels([180,138,120],15,25);
  }
  var BUILD={
    dryVan:function(){ return tractor()+box(-150,112,24,118,56,'#f3f6fa',{side:LOGO})+box(-150,112,112,118,56.5,'#0e80d4')+wheels([-128,-104],15,25); },
    reefer:function(){ return tractor()+box(-150,112,24,118,56,'#eaf4ff',{side:'<div class="sideTxt"><span>❄ REEFER</span><small>TEMP-CONTROLLED</small></div>'})+box(108,118,70,112,44,'#8b97a6')+box(-150,112,112,118,56.5,'#38bdf8')+wheels([-128,-104],15,25); },
    flatbed:function(){ return tractor()+box(-150,112,26,34,56,'#5b6676')+box(-136,-70,34,74,46,'#b7834e')+box(-60,10,34,64,46,'#c99560')+box(20,96,34,80,46,'#a8763f')+
      [-104,-24,58].map(function(x){return box(x-2,x+2,34,82,47,'#facc15');}).join('')+wheels([-128,-104],15,25); },
    stepDeck:function(){ return tractor()+box(70,112,34,42,56,'#5b6676')+box(-150,70,22,30,56,'#5b6676')+box(-120,10,30,88,48,'#f59e0b')+box(-40,40,88,104,20,'#d97706')+box(20,60,30,60,40,'#334155')+wheels([-128,-104],13,25); },
    heavy:function(){ return tractor()+box(194,206,26,42,58,'#facc15',{side:'<div class="sideTxt" style="font-size:6px">OVERSIZE</div>'})+box(70,112,30,40,58,'#475569')+box(-100,70,10,18,62,'#475569')+box(-150,-100,22,32,58,'#475569')+
      box(-90,40,18,64,58,'#facc15')+box(-60,10,64,96,46,'#eab308')+box(10,90,80,88,10,'#ca8a04')+box(84,96,48,88,14,'#ca8a04')+box(-110,-80,18,40,60,'#1f2937')+wheels([-136,-120,-104],13,30); },
    hotshot:function(){ return box(-130,160,12,20,36,'#2b3442')+box(70,130,20,72,50,'#e2e8f0',{r:6})+box(130,165,20,52,50,'#cbd5e1',{r:6})+box(72,76,52,70,44,'#9fd7ff')+box(-130,70,22,30,50,'#5b6676')+box(-110,-30,30,66,40,'#0e80d4')+box(-20,55,30,52,40,'#64748b')+
      wheels([145,95],14,22)+wheels([-110,-80],12,22); }
  };
  var ang=-28, vel=still?0:12, drag=false, lx=0, moved=0, cur=null, t0=performance.now();
  function current(){ var on=equip.querySelector('.eq.on'); return on?on.getAttribute('data-eq'):'dryVan'; }
  function render(kind){
    if(kind===cur||!BUILD[kind]) return; var first=cur===null; cur=kind;
    tagB.textContent=NAMES[kind]||'';
    if(first||still){ rig.innerHTML=BUILD[kind](); return; }
    rig.classList.add('out');                                  // drive the old rig off…
    setTimeout(function(){ rig.style.transition='none'; rig.innerHTML=BUILD[kind](); rig.style.transform='translateX(520px) scale(.62)';
      void rig.offsetWidth; rig.classList.remove('out'); rig.style.transition=''; rig.style.transform=''; },420);   // …and the new one in
  }
  function frame(now){
    var dt=Math.min(.05,(now-t0)/1000); t0=now;
    if(!drag) ang+=vel*dt;
    var sc=box3.clientWidth<420?.55:.72;
    box3.querySelector('.scene').style.transform='scale('+sc+') rotateX(-16deg) rotateY('+ang+'deg)';
    requestAnimationFrame(frame);
  }
  box3.addEventListener('pointerdown',function(e){drag=true;moved=0;lx=e.clientX;});
  addEventListener('pointermove',function(e){ if(!drag) return; var dx=e.clientX-lx; lx=e.clientX; moved+=Math.abs(dx); ang+=dx*.5; });
  addEventListener('pointerup',function(){drag=false;});
  render(current());
  // follow the page's own tile selection (taps, the voice assistant, a restored draft)
  new MutationObserver(function(){ render(current()); }).observe(equip,{subtree:true,attributes:true,attributeFilter:['class']});
  requestAnimationFrame(frame);
})();
